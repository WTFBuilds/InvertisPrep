import axios from 'axios';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Model fallback chain — free OpenRouter models, tried in order.
// Whenever a model returns 429 / 5xx we transparently move to the
// next one, so a single rate-limited model can't take the feature
// down. Override the whole chain with OPENROUTER_MODELS
// (comma-separated) or the head with OPENROUTER_MODEL.
const DEFAULT_CHAIN = [
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'qwen/qwen3-30b-a3b:free',
  'mistralai/mistral-small-3.2-24b-instruct-2506:free',
  'google/gemma-3-27b-it:free',
];

const chainFromEnv = () => {
  const raw = process.env.OPENROUTER_MODELS || process.env.OPENROUTER_MODEL;
  if (!raw) return DEFAULT_CHAIN;
  const parsed = raw.split(',').map((m) => m.trim()).filter(Boolean);
  return parsed.length ? parsed : DEFAULT_CHAIN;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const statusOf = (err) => err?.response?.status;
const providerMessageOf = (err) => err?.response?.data?.error?.message;

/**
 * Call OpenRouter's chat-completions endpoint, walking the model
 * fallback chain on 429 / 5xx. Each model gets up to
 * `retriesPerModel` attempts (short backoff between them); once
 * every model in the chain is exhausted the last error surfaces.
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {object} [options]
 * @returns {Promise<any>} parsed JSON result
 */
export async function callOpenRouter(systemPrompt, userPrompt, options = {}) {
  const models = chainFromEnv();
  const temperature = options.temperature ?? 0.4;
  const maxTokens = options.maxTokens ?? 2048;
  const retriesPerModel = options.retriesPerModel ?? 1;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    const err = new Error('AI service is not configured.');
    err.status = 503;
    throw err;
  }

  let lastError = null;

  for (const model of models) {
    for (let attempt = 0; attempt <= retriesPerModel; attempt++) {
      try {
        const { data } = await axios.post(
          OPENROUTER_URL,
          {
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature,
            max_tokens: maxTokens,
          },
          {
            timeout: 60_000,
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://invertisprep.in',
              'X-Title': 'InvertisPrep Resume Builder',
            },
          }
        );

        const content = data?.choices?.[0]?.message?.content;
        if (typeof content !== 'string' || content.trim() === '') {
          throw new Error('AI returned an empty response.');
        }
        return parseJsonLoose(content);
      } catch (err) {
        lastError = err;
        const status = statusOf(err);
        const retryable = status === 429 || (status !== undefined && status >= 500);
        if (!retryable || attempt === retriesPerModel) break;
        await sleep(status === 429 ? 1500 : 800);
      }
    }
  }

  // Normalize the most common failures into friendly messages
  const status = statusOf(lastError);
  if (status === 429) {
    const err = new Error('AI is busy right now. Please wait a moment and try again.');
    err.status = 429;
    throw err;
  }
  if (status !== undefined && status >= 500) {
    const err = new Error('AI provider error. Please try again.');
    err.status = 502;
    throw err;
  }
  const providerMessage = providerMessageOf(lastError);
  if (providerMessage) {
    throw new Error(providerMessage);
  }
  const err = new Error('AI request failed.');
  err.status = 502;
  throw err;
}

// OpenRouter sometimes wraps JSON in ```json fences or adds prose; strip those.
function parseJsonLoose(raw) {
  const trimmed = raw.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  const candidate = fenced ? fenced[1] : trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI response was not valid JSON.');
  }
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    throw new Error('AI response was not valid JSON.');
  }
}

export default { callOpenRouter };
