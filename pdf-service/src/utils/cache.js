/**
 * Tiny in-memory cache with TTL for a single long-lived Node process.
 * The server runs as one persistent instance (Render paid tier, kept warm),
 * so a process-local Map is both correct and avoids Redis infra.
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

/**
 * LRU cache for watermarked PDFs.
 * Caps both count and size to keep memory bounded.
 * Each entry is a full PDF buffer, so a 40-entry LRU could hold ~40-200MB worst case.
 */
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

    // Evict oldest until under both caps
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

import { env } from '../config/env.js';

export const pdfCache = new LRU(env.PDF_LRU_MAX_ENTRIES, env.PDF_CACHE_MAX_MB * 1024 * 1024);