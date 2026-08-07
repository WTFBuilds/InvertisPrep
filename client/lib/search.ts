/**
 * Normalizes a string for fuzzy matching:
 * - Lowercases
 * - Strips ALL non-alphanumeric characters (dots, dashes, slashes, parens, etc.)
 * - Collapses multiple spaces into one
 * - Trims whitespace
 *
 * Example: "B.TECH (CSE)"  → "btech cse"
 *          "CS  -  2024/25" → "cs 2024 25"
 *          "Eng.  Lang"    → "eng lang"
 *          "C.S.E."        → "cse"
 *          "3rd Sem"       → "3rd sem"
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Splits a query into individual words and checks that
 * EVERY word appears somewhere in the target string.
 *
 * This enables multi-word search where order doesn't matter.
 *
 * Examples:
 *   matchesQuery("Computer Science 2024", "science comp") → true
 *   matchesQuery("Mathematics", "math eng")               → false
 *   matchesQuery("CSE 3rd Sem", "cse sem")                → true
 *   matchesQuery("CS/IT Dept", "cs it")                   → true
 */
export function matchesQuery(target: string, query: string): boolean {
  if (!query) return true;
  const normalizedTarget = normalizeText(target);
  const words = normalizeText(query).split(' ').filter(Boolean);
  return words.every((word) => normalizedTarget.includes(word));
}

/**
 * Scores how well a query matches a target string.
 * Higher score = better match. Used for sorting results.
 *
 * - Exact normalized match → 100
 * - Starts with query → 80
 * - Contains all words → 50 + wordCoverage bonus
 * - No match → 0
 */
export function matchScore(target: string, query: string): number {
  if (!query) return 50;
  const normalizedTarget = normalizeText(target);
  const normalizedQuery = normalizeText(query);

  if (normalizedTarget === normalizedQuery) return 100;
  if (normalizedTarget.startsWith(normalizedQuery)) return 80;

  const words = normalizedQuery.split(' ').filter(Boolean);
  const matchedWords = words.filter((w) => normalizedTarget.includes(w));

  if (matchedWords.length === 0) return 0;
  if (matchedWords.length === words.length) {
    // All words matched — bonus for coverage
    return 50 + (matchedWords.length / words.length) * 30;
  }

  // Partial match — proportional score
  return (matchedWords.length / words.length) * 40;
}

/**
 * Filters and optionally scores+sorts an array of items.
 *
 * @param items    - The array to filter
 * @param query    - The user's search string
 * @param getFields - Function that returns searchable strings for an item
 * @param sorted   - If true, sorts by match score (best first). Default true.
 *
 * Usage:
 *   const results = fuzzySearch(
 *     syllabus,
 *     searchQuery,
 *     (item) => [item.name, item.department, item.year],
 *   );
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
      const bestScore = Math.max(...fields.map((f) => matchScore(f, query)));
      return { item, score: bestScore };
    })
    .filter(({ score }) => score > 0);

  if (sorted) {
    scored.sort((a, b) => b.score - a.score);
  }

  return scored.map(({ item }) => item);
}
