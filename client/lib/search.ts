/**
 * Normalization + fuzzy matching helpers shared by every text search in the app.
 *
 * Two normalized forms are produced and both are used when matching, so results
 * don't depend on how a name or code was typed:
 *
 *   normalizeText("B.Tech (CSE)") === "b tech cse"      (separators → one space)
 *   normalizeCompact("B.Tech (CSE)") === "btechcse"     (all separators dropped)
 *
 * This makes "b. tech", "b tech" and "btech" all match each other, and the same
 * for subject codes like "BAS301", "BAS 301" and "BAS-301".
 */

/** Lowercased, with every run of non-alphanumerics collapsed to a single space. */
export function normalizeText(text: string): string {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Lowercased with every non-alphanumeric character removed entirely. */
export function normalizeCompact(text: string): string {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Whether a target string matches a query. Word-based first (order-independent,
 * so "systems operating" matches "Operating Systems"), then a compact fallback
 * that ignores spaces/punctuation (so "b. tech" matches "btech", and
 * "BAS-301" matches "BAS 301").
 */
export function matchesQuery(target: string, query: string): boolean {
  if (!query || !query.trim()) return true;
  if (!target) return false;

  const words = normalizeText(query).split(' ').filter(Boolean);
  const normalizedTarget = normalizeText(target);
  if (words.length > 0 && words.every((w) => normalizedTarget.includes(w))) {
    return true;
  }

  const compactQuery = normalizeCompact(query);
  if (!compactQuery) return false;
  return normalizeCompact(target).includes(compactQuery);
}

/**
 * Relevance score for a target against a query (higher = better). Mirrors the
 * matching rules in matchesQuery so sorting stays consistent with filtering.
 */
export function matchScore(target: string, query: string): number {
  if (!query || !query.trim()) return 50;
  if (!target) return 0;

  const normalizedTarget = normalizeText(target);
  const normalizedQuery = normalizeText(query);

  if (normalizedTarget === normalizedQuery) return 100;
  if (normalizedQuery && normalizedTarget.startsWith(normalizedQuery)) return 80;

  const words = normalizedQuery.split(' ').filter(Boolean);
  const matchedWords = words.filter((w) => normalizedTarget.includes(w));
  if (words.length > 0 && matchedWords.length === words.length) {
    return 50 + (matchedWords.length / words.length) * 30;
  }

  // Compact fallback: "b. tech" ↔ "btech", "BAS-301" ↔ "BAS 301".
  const compactQuery = normalizeCompact(query);
  const compactTarget = normalizeCompact(target);
  if (compactQuery && compactTarget.includes(compactQuery)) {
    if (compactTarget === compactQuery) return 100;
    if (compactTarget.startsWith(compactQuery)) return 80;
    return 60;
  }

  if (matchedWords.length > 0) {
    return (matchedWords.length / words.length) * 40;
  }

  return 0;
}

/**
 * Filters (and by default scores + sorts) an array of items against a query.
 *
 * @param items     - The array to filter
 * @param query     - The user's search string
 * @param getFields - Returns the searchable strings for an item
 * @param sorted    - Sort best-match first (default true)
 */
export function fuzzySearch<T>(
  items: T[],
  query: string,
  getFields: (item: T) => string[],
  sorted = true
): T[] {
  if (!query.trim()) return items;

  const scored = items
    .map((item) => {
      const fields = getFields(item);
      const bestScore = Math.max(0, ...fields.map((f) => matchScore(f, query)));
      return { item, score: bestScore };
    })
    .filter(({ score }) => score > 0);

  if (sorted) {
    scored.sort((a, b) => b.score - a.score);
  }

  return scored.map(({ item }) => item);
}