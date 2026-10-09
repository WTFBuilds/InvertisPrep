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
export const sendMail = async ({ to, subject, html, text }) => {
  const tx = getTransporter();
  if (!tx) {
    console.warn('[mail] SMTP not configured — skipping email to', to);
    return { sent: false, error: 'not_configured' };
  }
  try {
    const info = await tx.sendMail({
      from: MAIL_FROM,
      to,
      replyTo: REPLY_TO,
      subject,
      text: text || htmlToText(html),
      html,
    });
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('[mail] send failed:', error.message);
    return { sent: false, error: error.message };
  }
};

/**
 * Send a templated email by name (file in server/src/emails/<name>.html).
 * `vars` are injected into {{placeholders}}; user-supplied values are escaped
 * for the HTML body automatically.
 */
export const sendTemplate = async ({ to, subject, template, vars = {} }) => {
  let html;
  try {
    const raw = await loadTemplate(template);
    // Escape the user-supplied display name; other vars are trusted (links etc).
    html = renderTemplate(raw, { ...vars, name: escapeHtml(vars.name || 'there') });
  } catch (error) {
    console.error(`[mail] template "${template}" load failed:`, error.message);
    return { sent: false, error: 'template_error' };
  }
  return sendMail({ to, subject, html });
};

/**
 * Fire-and-forget welcome email for a new signup. Google and email/password
 * signups both land here. Never awaited by callers (see authController).
 */
export const sendWelcomeEmail = (user) => {
  if (!user?.email) return Promise.resolve({ sent: false, error: 'no_email' });
  return sendTemplate({
    to: user.email,
    subject: 'Welcome to InvertisPrep 🎓',
    template: 'welcome',
    vars: { name: user.name?.trim() || 'there' },
  });
};