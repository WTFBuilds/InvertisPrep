import { ImapFlow } from 'imapflow';
import { InboundMail } from '../models/InboundMail.js';

// ── Config ───────────────────────────────────────────────────────────────────
// Reads the Hostinger mailbox (IMAP_* env vars). Hostinger exposes the standard
// IMAP endpoint; `IMAP_USER` is the mailbox address (e.g. support@invertisprep.in)
// and `IMAP_PASS` its password (or an app password if 2FA is on).
const IMAP_HOST = process.env.IMAP_HOST || 'imap.hostinger.com';
const IMAP_PORT = parseInt(process.env.IMAP_PORT || '993', 10);
const IMAP_USER = process.env.IMAP_USER;
const IMAP_PASS = process.env.IMAP_PASS;
const IMAP_MAILBOX = process.env.IMAP_MAILBOX || 'INBOX';

export const isImapConfigured = Boolean(IMAP_USER && IMAP_PASS);

// ── Sync throttle ────────────────────────────────────────────────────────────
// On-demand syncing (auto on inbox visit + manual Sync button). A short
// in-process throttle keeps rapid visits from hammering IMAP; `force` overrides.
const SYNC_THROTTLE_MS = 45 * 1000;
let lastSyncAt = 0;
let syncInFlight = null;

/**
 * Sync the mailbox into InboundMail. Never throws — returns a summary the admin
 * UI can show. First run seeds the most recent 200 messages; subsequent runs
 * fetch only messages with UID newer than the highest we've stored.
 */
export const syncInboundMail = async ({ force = false } = {}) => {
  if (!isImapConfigured) return { ok: false, error: 'not_configured', synced: 0 };

  const now = Date.now();
  if (!force && now - lastSyncAt < SYNC_THROTTLE_MS) {
    return { ok: true, throttled: true, synced: 0 };
  }
  // Single-flight: concurrent visits share one sync instead of each opening IMAP.
  if (syncInFlight) return syncInFlight;
  lastSyncAt = now;

  syncInFlight = (async () => {
    let client;
    try {
      const latest = await InboundMail.findOne().sort({ uid: -1 }).select('uid').lean();
      const minUid = latest ? latest.uid : null;

      client = new ImapFlow({
        host: IMAP_HOST,
        port: IMAP_PORT,
        secure: true,
        auth: { user: IMAP_USER, pass: IMAP_PASS },
        // Fail fast — the admin UI wants a quick "sync failed" rather than a
        // long hang on a misconfigured mailbox.
        connectionTimeout: 15000,
        greetTimeout: 15000,
        socketTimeout: 30000,
        logger: false,
      });
      await client.connect();

      // Refresh UIDVALIDITY awareness: if the mailbox was recreated the stored
      // UIDs are meaningless, so restart from the recent window.
      const mailbox = await client.mailboxOpen(IMAP_MAILBOX);
      if (!mailbox || mailbox.exists === 0) {
        return { ok: true, synced: 0, total: 0 };
      }

      const search = minUid ? { uid: `${minUid + 1}:*` } : { seq: '1:*' };
      let synced = 0, total = 0;

      // imapflow hands us one message at a time; fetch each fully for body + html.
      for await (const msg of client.fetch(search, { uid: true, envelope: true, source: true }, { maxBytes: 8 * 1024 * 1024 })) {
        total++;
        // Respect an upper bound on first-run (the mailbox could be huge).
        if (total > 400) break;

        const envelope = msg.envelope || {};
        const { subject = '', from = [], to = [], messageId = '' } = envelope;
        const fromText = from[0] ? `${from[0].name || ''} <${from[0].address || ''}>`.trim() : '';
        const toText = to[0] ? `${to[0].name || ''} <${to[0].address || ''}>`.trim() : '';

        // Parse the raw source into body + html, and detect bounces from the
        // Return-Path / X-Failed-Recipients headers (Hostinger/SES bounces).
        const parsed = parseSource(msg.source);
        const isBounce = /(^|[ \t])(From|Return-Path):[ \t]*<>([ \t]|$)/m.test(msg.source) ||
          /^X-Failed-Recipients:/m.test(msg.source) ||
          /^Content-Type:[ \t]*multipart\/report;/m.test(msg.source);

        try {
          await InboundMail.updateOne(
            { uid: msg.uid },
            {
              $set: {
                from: fromText,
                to: toText,
                subject: typeof subject === 'string' ? subject.slice(0, 500) : '',
                text: parsed.text,
                html: parsed.html,
                messageId: typeof messageId === 'string' ? messageId.slice(0, 500) : '',
                mailType: isBounce ? 'bounce' : 'plain',
                receivedAt: envelope.date || new Date(),
                syncedAt: new Date(),
              },
            },
            { upsert: true }
          );
          synced++;
        } catch (writeErr) {
          console.warn('[mail-sync] upsert failed for uid', msg.uid, writeErr.message);
        }
      }

      return { ok: true, synced, total };
    } catch (error) {
      console.error('[mail-sync] failed:', error.message);
      return { ok: false, error: error.message, synced: 0 };
    } finally {
      if (client) {
        try { await client.logout(); } catch { /* best-effort */ }
      }
      syncInFlight = null;
    }
  })();

  return syncInFlight;
};

// Minimal RFC-2822-ish splitter: pull the text/plain and text/html parts out of
// a raw message. Multipart handling is best-effort — enough for the admin
// viewer, which renders html in a sandboxed iframe and falls back to text.
const parseSource = (source) => {
  if (!source) return { text: '', html: '' };
  try {
    const str = typeof source === 'string' ? source : source.toString('utf8');
    // Split headers/body on the first blank line.
    const sep = str.search(/\r?\n\r?\n/);
    const body = sep === -1 ? '' : str.slice(sep + 4);
    const parts = splitMultipart(body);
    let text = '', html = '';
    for (const part of parts) {
      const ct = /^Content-Type:[ \t]*(\S+)/m.exec(part);
      const type = ct ? ct[1].toLowerCase() : 'text/plain';
      const decoded = stripPartHeaders(part);
      if (type.startsWith('multipart/')) {
        const nested = splitMultipart(decoded);
        for (const n of nested) {
          const nc = /^Content-Type:[ \t]*(\S+)/m.exec(n);
          const nt = nc ? nc[1].toLowerCase() : 'text/plain';
          const nd = stripPartHeaders(n);
          if (nt === 'text/plain' && !text) text = nd;
          else if (nt === 'text/html' && !html) html = nd;
        }
      } else if (type === 'text/plain' && !text) {
        text = decoded;
      } else if (type === 'text/html' && !html) {
        html = decoded;
      }
    }
    return { text: text.slice(0, 16384), html: html.slice(0, 524288) };
  } catch {
    return { text: '', html: '' };
  }
};

const splitMultipart = (body) => {
  const boundaryMatch = /^Content-Type:[ \t]*multipart\/[^;\r\n]*;[ \t]*boundary="?([^";\r\n]+)"?/m.exec(body);
  if (!boundaryMatch) return [body];
  const boundary = boundaryMatch[1];
  const parts = body.split(new RegExp(`--${escapeRegExp(boundary)}`));
  return parts
    .map((p) => p.replace(/^\r?\n/, '').replace(/\r?\n$/, ''))
    .filter((p) => p && p !== '--' && !/preamble|epilogue/i.test(p.slice(0, 40)));
};

const stripPartHeaders = (part) => {
  const sep = part.search(/\r?\n\r?\n/);
  return sep === -1 ? part : part.slice(sep + 4);
};

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');