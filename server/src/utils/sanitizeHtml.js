// Minimal HTML sanitizer for admin-authored rich content (event pages).
// Only staff with events.manage can write this content, so this is
// defense-in-depth rather than an XSS boundary — but we still strip the
// classic vectors (script/style/iframe blocks, inline event handlers,
// javascript:/non-image data: URLs) before anything is stored.

const BLOCK_TAGS = 'script|style|iframe|object|embed|form|input|button|select|textarea|link|meta|base';

export function sanitizeEventHtml(input) {
  if (!input) return '';
  let html = String(input);

  html = html
    // Whole dangerous blocks including their content
    .replace(new RegExp(`<\\s*(${BLOCK_TAGS})[\\s\\S]*?<\\s*\\/\\s*\\1\\s*>`, 'gi'), '')
    // Stray/self-closing dangerous tags
    .replace(new RegExp(`<\\s*\\/?\\s*(${BLOCK_TAGS})[^>]*>`, 'gi'), '')
    // Inline event handlers: onclick="...", onerror='...', onmouseover=...
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // javascript: URLs in href/src (quoted forms)
    .replace(/(href|src)\s*=\s*("\s*javascript:[^"]*"|'\s*javascript:[^']*')/gi, '$1="#"')
    // Non-image data: URLs (keep data:image/* used by inline pastes)
    .replace(/(href|src)\s*=\s*("\s*data:(?!image\/)[^"]*"|'\s*data:(?!image\/)[^']*')/gi, '$1="#"');

  return html.trim();
}
