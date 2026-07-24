/**
 * Arabic name normalization + Jaro-Winkler similarity for unique-field fuzzy matching.
 * No external dependencies — pure TypeScript.
 */

/** Strip tashkeel (Arabic diacritics) and normalize common letter variants */
export function normalizeArabic(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[\u064B-\u065F\u0670]/g, "") // tashkeel
    .replace(/[أإآ]/g, "ا") // alef variants → ا
    .replace(/ى/g, "ي") // ى → ي
    .replace(/ة/g, "ه") // ة → ه
    .replace(/\s+/g, " "); // collapse spaces
}

/** Jaro similarity between two strings (0–1) */
function jaro(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  const len1 = s1.length;
  const len2 = s2.length;
  if (!len1 || !len2) return 0;

  const matchDist = Math.max(Math.floor(Math.max(len1, len2) / 2) - 1, 0);
  const s1Matches = new Array<boolean>(len1).fill(false);
  const s2Matches = new Array<boolean>(len2).fill(false);

  let matches = 0;
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDist);
    const end = Math.min(i + matchDist + 1, len2);
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }
  if (!matches) return 0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  return (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
}

/** Jaro-Winkler similarity — gives a bonus for common prefixes (0–1) */
export function jaroWinkler(s1: string, s2: string): number {
  const j = jaro(s1, s2);
  let prefix = 0;
  for (let i = 0; i < Math.min(4, s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }
  return j + prefix * 0.1 * (1 - j);
}

/**
 * Token-based name similarity (order-independent, Arabic-normalized).
 * Uses bidirectional F1 scoring so that names with different numbers of tokens
 * are handled correctly — e.g. "محمد علي عبد" vs "محمد علي عبد الله" = ~86%
 * rather than 75% (which would miss the match).
 *
 * Returns 0–1 where 1 = identical after normalization.
 */
export function nameSimilarity(name1: string, name2: string): number {
  const n1 = normalizeArabic(name1);
  const n2 = normalizeArabic(name2);
  if (n1 === n2) return 1;

  const tokens1 = n1.split(" ").filter(Boolean);
  const tokens2 = n2.split(" ").filter(Boolean);
  if (!tokens1.length || !tokens2.length) return 0;

  /**
   * One-directional match score: for each token in `from`, find its best
   * unused match in `to`. Returns the average score (0–1).
   */
  const directional = (from: string[], to: string[]): number => {
    const used = new Set<number>();
    let total = 0;
    for (const t of from) {
      let best = 0;
      let bestIdx = -1;
      to.forEach((s, idx) => {
        if (used.has(idx)) return;
        const score = jaroWinkler(t, s);
        if (score > best) {
          best = score;
          bestIdx = idx;
        }
      });
      if (bestIdx !== -1) used.add(bestIdx);
      total += best;
    }
    return total / from.length;
  };

  // Precision: how much of name1 is covered by name2 tokens
  const precision = directional(tokens1, tokens2);
  // Recall: how much of name2 is covered by name1 tokens
  const recall = directional(tokens2, tokens1);

  if (precision + recall === 0) return 0;
  // F1: harmonic mean — penalises neither longer nor shorter names unfairly
  return (2 * precision * recall) / (precision + recall);
}
