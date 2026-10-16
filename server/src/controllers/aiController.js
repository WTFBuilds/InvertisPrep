import { callOpenRouter } from '../services/aiService.js';

const MAX_JD_LENGTH = 20_000;
const MAX_TEXT_LENGTH = 4_000;

const badRequest = (res, message) => res.status(400).json({ success: false, message });
const notConfigured = (res) =>
  res.status(503).json({ success: false, message: 'AI service is not configured.' });

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

// ── Shared schema primer ─────────────────────────────────────────────
// Every system prompt embeds the exact resume field shapes so the model
// always returns JSON that maps 1:1 onto the client ResumeDraft types.
const SCHEMA_PRIMER = `
You output STRICT JSON only (no markdown fences, no prose). Field shapes:
- summary: string (3-4 sentences, achievement-focused)
- experience[]: { company, role, description, achievements: string[], startDate, endDate }  (dates as YYYY-MM or "")
- projects[]:  { name, url, description, achievements: string[], startDate, endDate }
- skillGroups[]: { title, items: string[] }
Keep dates empty ("") when unknown. Never invent a person's name, email, phone, or links — only content sections.
`.trim();

// ── POST /api/ai/resume/fill-from-jd ─────────────────────────────────
// Parse a job description and generate matching resume content.
export const fillFromJD = async (req, res) => {
  try {
    const { jobDescription, currentResume } = req.body ?? {};
    if (!isNonEmptyString(jobDescription)) {
      return badRequest(res, 'jobDescription is required.');
    }
    if (jobDescription.length > MAX_JD_LENGTH) {
      return badRequest(res, `Job description must be under ${MAX_JD_LENGTH.toLocaleString()} characters.`);
    }

    const context =
      currentResume && typeof currentResume === 'object'
        ? `\nCurrent resume (only adapt tone/content, never copy blindly):\n${JSON.stringify(currentResume).slice(0, 4000)}`
        : '';

    const systemPrompt = `${SCHEMA_PRIMER}\n\nTask: analyse the job description and produce resume content that maximises ATS match. Output:
{
  "summary": string,
  "experience": [ { company, role, description, achievements: string[], startDate, endDate } ],
  "projects": [ { name, url, description, achievements: string[], startDate, endDate } ],
  "skillGroups": [ { title, items: string[] } ]
}`;

    const result = await callOpenRouter(systemPrompt, `Job description:\n${jobDescription}${context}`);
    const parsed = validateFillResult(result);
    res.json({ success: true, data: parsed });
  } catch (err) {
    handleAIError(res, err);
  }
};

// ── POST /api/ai/resume/rephrase ─────────────────────────────────────
// Rephrase a single field professionally.
export const rephrase = async (req, res) => {
  try {
    const { text, field } = req.body ?? {};
    if (!isNonEmptyString(text)) return badRequest(res, 'text is required.');
    if (text.length > MAX_TEXT_LENGTH) {
      return badRequest(res, `Text must be under ${MAX_TEXT_LENGTH.toLocaleString()} characters.`);
    }
    if (!isNonEmptyString(field)) return badRequest(res, 'field is required.');

    const fieldHint =
      field === 'achievement'
        ? 'a single resume achievement bullet — keep it one line, quantified, action-verb first'
        : field === 'summary'
          ? 'a professional summary paragraph — 3-4 sentences'
          : 'a resume description paragraph — concise, professional';

    const systemPrompt = `${SCHEMA_PRIMER}\n\nTask: rephrase the given text into professional resume language. It is ${fieldHint}. Output exactly: { "text": string }`;

    const result = await callOpenRouter(systemPrompt, `Rephrase this:\n${text}`, { temperature: 0.6 });
    const text2 = result && typeof result === 'object' ? result.text : null;
    if (!isNonEmptyString(text2)) {
      return res.status(502).json({ success: false, message: 'AI response was not valid.' });
    }
    res.json({ success: true, data: { text: String(text2).trim() } });
  } catch (err) {
    handleAIError(res, err);
  }
};

// ── POST /api/ai/resume/enhance-section ──────────────────────────────
// Turn rough notes into structured experience/project entries.
export const enhanceSection = async (req, res) => {
  try {
    const { section, content, context } = req.body ?? {};
    if (!isNonEmptyString(content)) return badRequest(res, 'content is required.');
    if (content.length > MAX_TEXT_LENGTH) {
      return badRequest(res, `Content must be under ${MAX_TEXT_LENGTH.toLocaleString()} characters.`);
    }
    if (!['experience', 'projects'].includes(section)) {
      return badRequest(res, "section must be 'experience' or 'projects'.");
    }

    const isExperience = section === 'experience';
    const entryShape = isExperience
      ? '{ company, role, description, achievements: string[], startDate, endDate }'
      : '{ name, url, description, achievements: string[], startDate, endDate }';

    const systemPrompt = `${SCHEMA_PRIMER}\n\nTask: turn rough notes into polished resume ${isExperience ? 'work experience' : 'project'} entries. Split into separate entries where the notes clearly describe different roles/projects. Output: { "entries": [ ${entryShape} ] }`;

    const contextLine = isNonEmptyString(context) ? `\nContext:\n${context.slice(0, 2000)}` : '';
    const result = await callOpenRouter(systemPrompt, `Rough notes:\n${content}${contextLine}`);

    const entries = result && typeof result === 'object' ? result.entries : null;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(502).json({ success: false, message: 'AI response was not valid.' });
    }
    const clean = entries
      .filter((e) => e && typeof e === 'object')
      .slice(0, 6)
      .map((e) => ({
        company: isExperience ? String(e.company ?? '') : '',
        name: !isExperience ? String(e.name ?? '') : '',
        url: !isExperience ? String(e.url ?? '') : '',
        role: isExperience ? String(e.role ?? '') : '',
        description: String(e.description ?? ''),
        achievements: Array.isArray(e.achievements) ? e.achievements.map(String) : [],
        startDate: String(e.startDate ?? ''),
        endDate: String(e.endDate ?? ''),
      }));

    res.json({ success: true, data: { entries: clean } });
  } catch (err) {
    handleAIError(res, err);
  }
};

// ── helpers ──────────────────────────────────────────────────────────
function validateFillResult(result) {
  const obj = result && typeof result === 'object' ? result : {};
  const summary = typeof obj.summary === 'string' ? obj.summary : '';
  const experience = Array.isArray(obj.experience)
    ? obj.experience
        .filter((e) => e && typeof e === 'object')
        .slice(0, 6)
        .map((e) => ({
          company: String(e.company ?? ''),
          role: String(e.role ?? ''),
          description: String(e.description ?? ''),
          achievements: Array.isArray(e.achievements) ? e.achievements.map(String) : [],
          startDate: String(e.startDate ?? ''),
          endDate: String(e.endDate ?? ''),
        }))
    : [];
  const projects = Array.isArray(obj.projects)
    ? obj.projects
        .filter((p) => p && typeof p === 'object')
        .slice(0, 6)
        .map((p) => ({
          name: String(p.name ?? ''),
          url: String(p.url ?? ''),
          description: String(p.description ?? ''),
          achievements: Array.isArray(p.achievements) ? p.achievements.map(String) : [],
          startDate: String(p.startDate ?? ''),
          endDate: String(p.endDate ?? ''),
        }))
    : [];
  const skillGroups = Array.isArray(obj.skillGroups)
    ? obj.skillGroups
        .filter((g) => g && typeof g === 'object')
        .slice(0, 8)
        .map((g) => ({
          title: String(g.title ?? 'Skills'),
          items: Array.isArray(g.items) ? g.items.map(String) : [],
        }))
    : [];
  return { summary, experience, projects, skillGroups };
}

function handleAIError(res, err) {
  const status = err?.status;
  const message = err?.message ?? 'AI request failed.';
  if (status === 429) {
    return res.status(429).json({ success: false, message });
  }
  if (status === 400) {
    return res.status(400).json({ success: false, message });
  }
  if (status === 503) {
    return notConfigured(res);
  }
  console.error('[ai] endpoint error:', err);
  return res.status(502).json({ success: false, message });
}
