import { Setting } from '../models/Setting.js';

// Tiny cached reader for Setting key/values. Most settings are read on hot
// paths (e.g. the welcome flag on every signup), so we cache briefly and let
// writers invalidate. Writers that need the fresh value can still pass
// `fresh: true` sparingly.
const TTL_MS = 60 * 1000;
const cache = new Map(); // key -> { value, expires }

export const getSetting = async (key, fallback = null, { fresh = false } = {}) => {
  const hit = cache.get(key);
  if (!fresh && hit && hit.expires > Date.now()) return hit.value;

  const doc = await Setting.findOne({ key }).lean().catch(() => null);
  const value = doc ? doc.value : fallback;
  cache.set(key, { value, expires: Date.now() + TTL_MS });
  return value;
};

export const setSetting = async (key, value) => {
  const doc = await Setting.findOneAndUpdate(
    { key },
    { $set: { value } },
    { upsert: true, new: true }
  );
  cache.set(key, { value: doc.value, expires: Date.now() + TTL_MS });
  return doc.value;
};

export const invalidateSetting = (key) => {
  cache.delete(key);
};

// Default welcome template — JSON shape the mail-template-editor produces and
// mailService renders. `sections` are the editable content blocks; rendered to
// HTML when the welcome mail is sent.
export const DEFAULT_WELCOME_TEMPLATE = {
  bannerUrl: '',
  heading: 'Welcome to InvertisPrep 🎓',
  intro: 'Hi {{name}},',
  sections: [
    {
      type: 'paragraph',
      text: 'Thanks for joining! You now have access to previous-year question papers, notes and more.',
    },
    {
      type: 'button',
      text: 'Explore papers',
      url: 'https://invertisprep.in',
    },
  ],
  footer: 'You received this because you signed up for InvertisPrep.',
  email: 'support@invertisprep.in',
};

// Editable defaults for the automatic paper-request emails. Available
// placeholders: {{name}}, {{subject}}, {{subjectCode}}, {{year}}, {{examType}}.
export const DEFAULT_PAPER_REQUEST_ACK_TEMPLATE = {
  bannerUrl: '',
  heading: 'We got your request, {{name}}.',
  intro: 'Thanks for letting us know — our team is on it.',
  sections: [
    { type: 'heading', text: 'What you asked for', fontSize: 18, align: 'left' },
    { type: 'paragraph', text: 'Subject: {{subject}}' },
    { type: 'paragraph', text: 'Code / year: {{subjectCode}} · {{year}} · {{examType}}' },
    { type: 'paragraph', text: "We'll look for this previous-year paper and email you the moment it's available." },
  ],
  footer: '— Team InvertisPrep',
  email: 'support@invertisprep.in',
};

export const DEFAULT_PAPER_REQUEST_FULFILLED_TEMPLATE = {
  bannerUrl: '',
  heading: 'Good news, {{name}} 🎉',
  intro: 'The paper you requested has been found and added to the library.',
  sections: [
    { type: 'paragraph', text: 'Subject: {{subject}}' },
    { type: 'paragraph', text: 'Code / year: {{subjectCode}} · {{year}} · {{examType}}' },
    { type: 'button', text: 'Open papers', url: 'https://invertisprep.in/pyq', align: 'left' },
  ],
  footer: '— Team InvertisPrep',
  email: 'support@invertisprep.in',
};

export const DEFAULT_CAREER_ACK_TEMPLATE = {
  bannerUrl: '',
  heading: 'We got your application, {{name}} ✔️',
  intro: 'Thanks for applying to join the InvertisPrep team.',
  sections: [
    { type: 'heading', text: 'What you applied for', fontSize: 18, align: 'left' },
    { type: 'paragraph', text: 'Role: {{role}}' },
    { type: 'paragraph', text: 'Submitted: {{submittedAt}}' },
    {
      type: 'paragraph',
      text: 'Our team reviews every application personally. We\u2019ll let you know the outcome via email soon — no need to follow up in the meantime.',
    },
    { type: 'paragraph', text: 'You can track your application status anytime from your profile menu on the site.' },
  ],
  footer: '— Team InvertisPrep',
  email: 'support@invertisprep.in',
};