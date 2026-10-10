import { EmailLog } from '../models/EmailLog.js';
import { InboundMail } from '../models/InboundMail.js';
import { Setting } from '../models/Setting.js';
import { User } from '../models/User.js';
import { syncInboundMail, isImapConfigured } from '../services/mailSyncService.js';
import { sendTemplate, sendMail, isWelcomeEmailEnabled, setWelcomeEmailEnabled, getNotifySettings, setNotifyEnabled } from '../services/mailService.js';
import { getSetting, setSetting } from '../services/settingsService.js';
import { uploadImage } from '../services/cloudinaryService.js';

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ── Shared pagination ────────────────────────────────────────────────────────
const pageMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
});

// ── 1. Automail: welcome toggle + template + automail sent log ──────────────
export const getMailSettings = async (_req, res) => {
  try {
    const [enabled, template, hasSetup] = await Promise.all([
      isWelcomeEmailEnabled(),
      getSetting('welcomeTemplate', null, { fresh: true }),
      getSetting('mailSetupDone', false),
    ]);
    res.json({
      success: true,
      data: {
        welcomeEmailEnabled: enabled,
        welcomeTemplate: template,
        mailSetupDone: hasSetup,
        imapConfigured: isImapConfigured,
      },
    });
  } catch (error) {
    console.error('Get mail settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to load mail settings' });
  }
};

export const updateWelcomeSettings = async (req, res) => {
  try {
    const { welcomeEmailEnabled, welcomeTemplate } = req.body || {};
    if (typeof welcomeEmailEnabled === 'boolean') {
      await setWelcomeEmailEnabled(welcomeEmailEnabled);
    }
    if (welcomeTemplate && typeof welcomeTemplate === 'object') {
      await setSetting('welcomeTemplate', welcomeTemplate);
      await setSetting('mailSetupDone', true);
    }
    await setSetting('mailSetupDone', true);
    res.json({ success: true, data: { welcomeEmailEnabled: await isWelcomeEmailEnabled() } });
  } catch (error) {
    console.error('Update welcome settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to update welcome settings' });
  }
};

// ── 1. Automail log (kind: welcome) ─────────────────────────────────────────
export const listAutomailLog = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const { search } = req.query;

    const filter = { kind: 'welcome' };
    if (search && String(search).trim()) {
      const q = escapeRegExp(String(search).trim());
      filter.$or = [
        { to: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
        { error: { $regex: q, $options: 'i' } },
      ];
    }

    const [total, logs] = await Promise.all([
      EmailLog.countDocuments(filter),
      EmailLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    res.json({
      success: true,
      data: logs.map((l) => ({
        id: l._id,
        to: l.to,
        from: l.from,
        subject: l.subject,
        kind: l.kind,
        status: l.status,
        error: l.error,
        createdAt: l.createdAt,
      })),
      meta: pageMeta(page, limit, total),
    });
  } catch (error) {
    console.error('List automail log error:', error);
    res.status(500).json({ success: false, message: 'Failed to load automail log' });
  }
};

// ── 2. Mailbox: synced inbound ──────────────────────────────────────────────
export const listInbox = async (req, res) => {
  try {
    // Auto-sync on visit (throttled inside the service) so the list is fresh.
    await syncInboundMail({ force: false });

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const filter = {};

    const [total, items] = await Promise.all([
      InboundMail.countDocuments(filter),
      InboundMail.find(filter)
        .sort({ receivedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('uid from to subject text mailType receivedAt')
        .lean(),
    ]);

    res.json({
      success: true,
      data: items.map((m) => ({
        id: m._id,
        uid: m.uid,
        from: m.from,
        to: m.to,
        subject: m.subject,
        preview: m.text,
        mailType: m.mailType,
        receivedAt: m.receivedAt,
      })),
      meta: pageMeta(page, limit, total),
      imapConfigured: isImapConfigured,
    });
  } catch (error) {
    console.error('List inbox error:', error);
    res.status(500).json({ success: false, message: 'Failed to load mailbox' });
  }
};

export const triggerSync = async (_req, res) => {
  const result = await syncInboundMail({ force: true });
  res.json({ success: result.ok, message: result.throttled ? 'Already synced recently' : undefined, ...result });
};

export const getInboundMail = async (req, res) => {
  try {
    const mail = await InboundMail.findById(req.params.id).lean();
    if (!mail) return res.status(404).json({ success: false, message: 'Mail not found' });
    res.json({
      success: true,
      data: {
        id: mail._id,
        from: mail.from,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
        mailType: mail.mailType,
        receivedAt: mail.receivedAt,
      },
    });
  } catch (error) {
    console.error('Get inbound mail error:', error);
    res.status(500).json({ success: false, message: 'Failed to load mail' });
  }
};

// ── 5. Notifications: toggles overrides + current state ────────────────────
export const getNotifySettingsState = async (_req, res) => {
  try {
    res.json({ success: true, data: await getNotifySettings() });
  } catch (error) {
    console.error('Get notify settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to load notification settings' });
  }
};

export const updateNotifySettings = async (req, res) => {
  try {
    const { requestAck, requestFulfilled } = req.body || {};
    if (typeof requestAck === 'boolean') await setNotifyEnabled('requestAck', requestAck);
    if (typeof requestFulfilled === 'boolean') await setNotifyEnabled('requestFulfilled', requestFulfilled);
    res.json({ success: true, data: await getNotifySettings() });
  } catch (error) {
    console.error('Update notify settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to update notification settings' });
  }
};

// ── 3. Compose: recipients preview + send broadcast ─────────────────────────
export const uploadBanner = async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No image uploaded.' });
      return;
    }
    const result = await uploadImage(req.file.path);
    res.json({ success: true, data: { url: result.cloudinaryUrl } });
  } catch (error) {
    console.error('Upload banner error:', error);
    res.status(500).json({ success: false, message: 'Server error uploading image.' });
  }
};

export const composeRecipients = async (_req, res) => {
  try {
    const count = await User.countDocuments({ email: { $exists: true, $ne: '' }, isActive: true });
    res.json({ success: true, data: { recipientCount: count } });
  } catch (error) {
    console.error('Compose recipients error:', error);
    res.status(500).json({ success: false, message: 'Failed to count recipients' });
  }
};

export const sendCampaign = async (req, res) => {
  try {
    const { subject, sections, bannerUrl, heading, intro, footer, rawHtml } = req.body || {};
    if (!subject || !String(subject).trim()) {
      return res.status(400).json({ success: false, message: 'Subject is required' });
    }
    // Build the template object the renderer understands. Raw-HTML mode sends
    // the pasted HTML verbatim; otherwise the builder sections are rendered.
    const tpl = rawHtml
      ? { rawHtml }
      : { bannerUrl, heading, intro, sections: Array.isArray(sections) ? sections : [], footer };

    const users = await User.find({ email: { $exists: true, $ne: '' }, isActive: true })
      .select('email name')
      .lean();
    if (users.length === 0) {
      return res.status(400).json({ success: false, message: 'No active users to send to' });
    }

    setImmediate(async () => {
      for (const user of users) {
        try {
          await sendTemplate({
            to: user.email,
            subject,
            template: 'campaign',
            tpl,
            vars: { name: user.name?.trim() || 'there', email: user.email },
            kind: 'campaign',
          });
        } catch (err) {
          console.error('[mail] campaign send failed for', user.email, err?.message);
        }
      }
    });

    res.json({
      success: true,
      message: `Campaign queued to ${users.length} active users`,
      data: { recipientCount: users.length },
    });
  } catch (error) {
    console.error('Send campaign error:', error);
    res.status(500).json({ success: false, message: 'Failed to send campaign' });
  }
};

// ── 4. Logs: unified outbound (all kinds) + inbound (incl. bounces) ────────
export const listUnifiedLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const { search, direction } = req.query; // direction: sent | received | all

    const outFilter = {};
    const inFilter = {};
    if (search && String(search).trim()) {
      const q = escapeRegExp(String(search).trim());
      outFilter.$or = [
        { to: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
        { from: { $regex: q, $options: 'i' } },
      ];
      inFilter.$or = [
        { from: { $regex: q, $options: 'i' } },
        { to: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
      ];
    }
    if (direction === 'sent') inFilter._id = { $exists: false };
    if (direction === 'received') outFilter._id = { $exists: false };

    // Fetch slightly more than needed per side so the merged feed stays full.
    const take = limit * 2;
    const [outbound, inbound] = await Promise.all([
      direction === 'received'
        ? []
        : EmailLog.find(outFilter)
            .sort({ createdAt: -1 })
            .limit(take)
            .select('to from subject kind status error createdAt')
            .lean(),
      direction === 'sent'
        ? []
        : InboundMail.find(inFilter)
            .sort({ receivedAt: -1 })
            .limit(take)
            .select('from to subject mailType text receivedAt')
            .lean(),
    ]);

    const merged = [
      ...outbound.map((e) => ({
        id: e._id,
        ts: e.createdAt,
        direction: 'sent',
        to: e.to,
        from: e.from,
        subject: e.subject,
        kind: e.kind,
        status: e.status === 'sent' ? 'sent' : 'failed',
        error: e.error,
        preview: '',
      })),
      ...inbound.map((m) => ({
        id: m._id,
        ts: m.receivedAt,
        direction: 'received',
        from: m.from,
        to: m.to,
        subject: m.subject,
        kind: m.mailType === 'bounce' ? 'bounce' : 'inbound',
        status: m.mailType === 'bounce' ? 'bounced' : 'synced',
        error: '',
        preview: m.text,
      })),
    ]
      .sort((a, b) => new Date(b.ts) - new Date(a.ts))
      .slice(0, limit);

    res.json({ success: true, data: merged, meta: pageMeta(page, limit, merged.length) });
  } catch (error) {
    console.error('List unified logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to load logs' });
  }
};