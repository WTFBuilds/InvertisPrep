import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

// ── Config ───────────────────────────────────────────────────────────────────
// All values come from the environment (see .env.example). When SMTP is not
// configured the service silently no-ops, so signups never break on a missing
// mail setup — it just logs and moves on.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.join(__dirname, '..', 'emails');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const MAIL_FROM = process.env.MAIL_FROM || 'InvertisPrep <no-reply@invertisprep.in>';
const REPLY_TO = process.env.REPLY_TO || 'support@invertisprep.in';

export const isMailConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporter = null;
const getTransporter = () => {
  if (!isMailConfigured) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // 465 = implicit TLS, 587 = STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    // SES drops idle connections; keep the pool small and reuse it.
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
  });
  return transporter;
};

// Templates live as plain HTML files with {{placeholders}} so the copy can be
// edited without touching code.
const templateCache = new Map();
const loadTemplate = async (name) => {
  if (templateCache.has(name)) return templateCache.get(name);
  const file = path.join(TEMPLATE_DIR, `${name}.html`);
  const html = await fs.readFile(file, 'utf-8');
  templateCache.set(name, html);
  return html;
};

const renderTemplate = (html, vars) =>
  html.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key] ?? '') : match
  );

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Minimal HTML→text fallback for the plain-text part of the message.
const htmlToText = (html) =>
  html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

/**
 * Send an email. Never throws — returns { sent: boolean, error? } so callers
 * (signup flows) can fire-and-forget without risking the request.
 */
export const sendMail = async ({ to, subject, html, text, meta = {} }) => {
  let result;
  const tx = getTransporter();
  if (!tx) {
    console.warn('[mail] SMTP not configured — skipping email to', to);
    result = { sent: false, error: 'not_configured' };
  } else {
    try {
      const info = await tx.sendMail({
        from: MAIL_FROM,
        to,
        replyTo: REPLY_TO,
        subject,
        text: text || htmlToText(html),
        html,
      });
      result = { sent: true, messageId: info.messageId };
    } catch (error) {
      console.error('[mail] send failed:', error.message);
      result = { sent: false, error: error.message };
    }
  }

  recordOutbound(to, { subject, ...meta }, result).catch((err) =>
    console.warn('[mail] log record failed:', err?.message)
  );
  return result;
};

// ── Template rendering (editor JSON → HTML) ─────────────────────────────────
// Renders the MailTemplate shape produced by the admin template editor
// (client/components/admin/mail-template-editor.tsx) into email-ready HTML.
// Placeholders like {{name}} are substituted here; values are escaped so a
// template can never inject markup.
const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const sectionHtml = (s) => {
  const align = s.align || 'left';
  const style = `text-align:${align};`;
  switch (s.type) {
    case 'heading':
      return s.text
        ? `<h3 style="margin:12px 0 4px;font-size:${s.fontSize || 18}px;font-weight:700;color:${s.color || '#0f172a'};${style}">${esc(s.text)}</h3>`
        : '';
    case 'image':
      return s.imageUrl
        ? `<img src="${esc(s.imageUrl)}" alt="" style="max-width:100%;border-radius:8px;display:block;margin:12px 0;" />`
        : '';
    case 'button':
      return s.url && s.text
        ? `<div style="margin:12px 0;${style}"><a href="${esc(s.url)}" style="display:inline-block;padding:12px 22px;background:${s.bgColor || '#0f172a'};color:#ffffff;border-radius:8px;font-weight:700;text-decoration:none;font-size:${s.fontSize || 14}px;">${esc(s.text)}</a></div>`
        : '';
    case 'divider':
      return '<hr style="border:none;border-top:1px solid #eef2f7;margin:14px 0;" />';
    default:
      return s.text
        ? `<p style="color:${s.color || '#475569'};font-size:${s.fontSize || 15}px;line-height:1.6;margin:8px 0;${style}">${esc(s.text)}</p>`
        : '';
  }
};

export const renderMailTemplate = (tpl, vars = {}) => {
  if (!tpl) return '';
  const rendered = (str) =>
    String(str ?? '').replace(/\{\{(\w+)\}\}/g, (m, key) =>
      Object.prototype.hasOwnProperty.call(vars, key) ? esc(vars[key]) : ''
    );
  // Raw-HTML mode: the admin pasted a full HTML email. Send it verbatim (with
  // {{placeholders}} substituted) — full control, no wrapper.
  if (tpl.rawHtml) return rendered(tpl.rawHtml);
  const title = rendered(tpl.heading);
  const sections = (tpl.sections || []).map(sectionHtml).join('');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<div style="padding:24px 12px;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    ${tpl.bannerUrl ? `<img src="${esc(tpl.bannerUrl)}" alt="" style="width:100%;display:block;" />` : ''}
    <div style="padding:24px 28px;">
      <h1 style="font-size:22px;color:#0f172a;margin:0 0 8px;">${rendered(tpl.heading)}</h1>
      <p style="color:#475569;font-size:15px;margin:0 0 12px;">${rendered(tpl.intro)}</p>
      ${sections}
      <div style="margin-top:18px;font-size:12px;color:#94a3b8;border-top:1px solid #eef2f7;padding-top:12px;">${rendered(tpl.footer)}</div>
    </div>
  </div>
</div></body></html>`;
};

// Fire-and-forget record of every outbound send, so the admin Mail sections
// (automail log + full logs) can show who got what and whether it landed.
const recordOutbound = async (to, mail, result) => {
  try {
    const { EmailLog } = await import('../models/EmailLog.js');
    await EmailLog.create({
      to,
      from: MAIL_FROM,
      subject: mail.subject || '',
      kind: mail.kind || 'other',
      template: mail.template || '',
      messageId: result.messageId || '',
      status: result.sent ? 'sent' : 'failed',
      error: result.sent ? '' : (result.error || ''),
    });
  } catch (error) {
    // Never let logging break a send path.
  }
};

/**
 * Send a templated email by name (file in server/src/emails/<name>.html).
 * `vars` are injected into {{placeholders}}; user-supplied values are escaped
 * for the HTML body automatically.
 */
export const sendTemplate = async ({ to, subject, template, vars = {}, tpl = null, kind = 'other' }) => {
  let html;
  try {
    // When an editor-built template JSON is provided, render it directly —
    // used by welcome templates and campaigns (full customization wins).
    // Otherwise fall back to the static HTML file.
    html = tpl
      ? renderMailTemplate(tpl, { ...vars, name: vars.name || 'there' })
      : renderTemplate(await loadTemplate(template), { ...vars, name: escapeHtml(vars.name || 'there') });
  } catch (error) {
    console.error(`[mail] template "${template}" load failed:`, error.message);
    return { sent: false, error: 'template_error' };
  }
  return sendMail({ to, subject, html, meta: { template, kind } });
};

/**
 * Fire-and-forget welcome email for a new signup. Google and email/password
 * signups both land here. Never awaited by callers (see authController).
 */
export const sendWelcomeEmail = async (user) => {
  if (!user?.email) return { sent: false, error: 'no_email' };
  if (!(await isWelcomeEmailEnabled())) {
    console.log('[mail] welcome email disabled — skipping', user.email);
    return { sent: false, error: 'disabled' };
  }
  // Use the admin-edited welcome template when one is saved; otherwise fall
  // back to the bundled welcome.html file.
  let tpl = null;
  try {
    const { Setting } = await import('../models/Setting.js');
    const doc = await Setting.findOne({ key: 'welcomeTemplate' }).lean();
    if (doc && doc.value && (Array.isArray(doc.value.sections) || doc.value.rawHtml)) tpl = doc.value;
  } catch {
    // fall back to the static template
  }
  return sendTemplate({
    to: user.email,
    subject: tpl?.heading || 'Welcome to InvertisPrep 🎓',
    template: 'welcome',
    tpl,
    vars: { name: user.name?.trim() || 'there' },
    kind: 'welcome',
  });
};

// ── Welcome-email toggle ────────────────────────────────────────────────────
// Super-admins flip this from the admin Mail section. Default ON (new signups
// get the welcome mail); the check is cached briefly so the signup hot path
// doesn't hit Mongo on every account creation.
const WELCOME_FLAG_KEY = 'welcomeEmailEnabled';
const FLAG_CACHE_TTL_MS = 60 * 1000;
let flagCache = null; // { value, expires }
let flagCachePromise = null;

export const isWelcomeEmailEnabled = async () => {
  if (flagCache && flagCache.expires > Date.now()) return flagCache.value;

  // Single-flight the read so concurrent signups don't fan out to Mongo.
  if (!flagCachePromise) {
    flagCachePromise = (async () => {
      try {
        const { Setting } = await import('../models/Setting.js');
        const doc = await Setting.findOne({ key: WELCOME_FLAG_KEY }).lean();
        const value = doc ? doc.value !== false : true; // default ON
        flagCache = { value, expires: Date.now() + FLAG_CACHE_TTL_MS };
        return value;
      } catch (error) {
        return true; // fail-open on a DB hiccup — never block signups
      } finally {
        flagCachePromise = null;
      }
    })();
  }
  return flagCachePromise;
};

export const setWelcomeEmailEnabled = async (enabled) => {
  const { Setting } = await import('../models/Setting.js');
  await Setting.findOneAndUpdate(
    { key: WELCOME_FLAG_KEY },
    { $set: { value: Boolean(enabled) } },
    { upsert: true, new: true }
  );
  flagCache = { value: Boolean(enabled), expires: Date.now() + FLAG_CACHE_TTL_MS };
  return Boolean(enabled);
};

// ── Paper-request email notifications ───────────────────────────────────────
// Two toggles (request acknowledgement + fulfillment notice) stored in
// EmailNotify, cached briefly. Fires from paperRequestController at request
// creation and at triage-fulfill. Never throws / never blocks the request flow.

const NOTIFY_TTL_MS = 60 * 1000;
const notifyCache = new Map(); // key -> { enabled, expires }
const notifyDefault = { requestAck: true, requestFulfilled: true };

const isNotifyEnabled = async (key) => {
  const hit = notifyCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.enabled;
  try {
    const { EmailNotify } = await import('../models/EmailNotify.js');
    const doc = await EmailNotify.findOne({ key }).lean();
    const enabled = doc ? doc.enabled !== false : notifyDefault[key] !== false;
    notifyCache.set(key, { enabled, expires: Date.now() + NOTIFY_TTL_MS });
    return enabled;
  } catch {
    return true; // fail-open on a DB hiccup
  }
};

export const setNotifyEnabled = async (key, enabled) => {
  const { EmailNotify } = await import('../models/EmailNotify.js');
  await EmailNotify.findOneAndUpdate(
    { key },
    { $set: { enabled: Boolean(enabled) } },
    { upsert: true, new: true }
  );
  notifyCache.set(key, { enabled: Boolean(enabled), expires: Date.now() + NOTIFY_TTL_MS });
  return Boolean(enabled);
};

export const getNotifySettings = async () => {
  const [requestAck, requestFulfilled] = await Promise.all([
    isNotifyEnabled('requestAck'),
    isNotifyEnabled('requestFulfilled'),
  ]);
  return { requestAck, requestFulfilled };
};

// Acknowledgement email when a student requests a paper — confirms we got it
// and that the team is looking.
export const sendPaperRequestAck = (user, request) => {
  if (!user?.email || !request) return Promise.resolve({ sent: false, error: 'no_email' });
  return isNotifyEnabled('requestAck').then((enabled) => {
    if (!enabled) return { sent: false, error: 'disabled' };
    const subjectName = request.subjectName || 'your paper';
    return sendTemplate({
      to: user.email,
      subject: 'We got your paper request ✔️',
      template: 'paperRequestAck',
      vars: {
        name: user.name?.trim() || 'there',
        subject: subjectName,
        subjectCode: request.subjectCode || '',
        examType: request.examType === 'any' ? 'Any exam' : request.examType,
        year: request.year || '',
      },
      kind: 'administrative',
    });
  });
};

// Fulfillment email when staff marks the request fulfilled.
export const sendPaperRequestFulfilled = (user, request) => {
  if (!user?.email || !request) return Promise.resolve({ sent: false, error: 'no_email' });
  return isNotifyEnabled('requestFulfilled').then((enabled) => {
    if (!enabled) return { sent: false, error: 'disabled' };
    const subjectName = request.subjectName || 'your paper';
    return sendTemplate({
      to: user.email,
      subject: 'Your paper request was fulfilled 🎉',
      template: 'paperRequestFulfilled',
      vars: {
        name: user.name?.trim() || 'there',
        subject: subjectName,
        subjectCode: request.subjectCode || '',
        examType: request.examType === 'any' ? 'Any exam' : request.examType,
        year: request.year || '',
      },
      kind: 'administrative',
    });
  });
};