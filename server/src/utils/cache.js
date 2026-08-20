/**
 * Tiny in-memory cache for a single long-lived Node process.
 *
 * The server runs as one persistent instance (Render free tier, kept warm by
 * pings), so a process-local Map is both correct and avoids Redis infra.
 *
 * `get` returns `undefined` on miss/expiry; `set` overwrites. TTLs are chosen
 * so stale reads stay acceptable even if a write slips through invalidation.
 */
const ttlCache = new Map();

export const getCache = (key) => {
  const entry = ttlCache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    ttlCache.delete(key);
    return undefined;
  }
  return entry.value;
};

export const setCache = (key, value, ttlMs) => {
  ttlCache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
};

export const delCache = (key) => {
  ttlCache.delete(key);
};

export const clearCache = () => {
  ttlCache.clear();
};

// ── Small LRU for finished watermarked PDFs ──────────────────────────────────
// Capping both count and size keeps memory bounded: each entry is a full PDF
// buffer, so a 40-entry LRU could hold ~40-200MB worst case. We cap by total
// bytes as well as entry count to stay safe on a low-memory instance.
class LRU {
  constructor(maxEntries = 40, maxBytes = 80 * 1024 * 1024) {
    this.maxEntries = maxEntries;
    this.maxBytes = maxBytes;
    this.map = new Map();
    this.bytes = 0;
  }

  get(key) {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key);
    // Refresh recency
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key, value) {
    const prev = this.map.get(key);
    const size = value?.byteLength || 0;
    if (prev) this.bytes -= prev.byteLength || 0;

    this.map.delete(key);
    this.map.set(key, value);
    this.bytes += size;

    // Evict oldest (Map preserves insertion order) until under both caps
    while ((this.map.size > this.maxEntries || this.bytes > this.maxBytes) && this.map.size > 0) {
      const oldestKey = this.map.keys().next().value;
      const oldest = this.map.get(oldestKey);
      this.bytes -= oldest.byteLength || 0;
      this.map.delete(oldestKey);
    }
  }

  delete(key) {
    const value = this.map.get(key);
    if (value) {
      this.bytes -= value.byteLength || 0;
      this.map.delete(key);
    }
  }
}

export const pdfCache = new LRU(40, 80 * 1024 * 1024);
