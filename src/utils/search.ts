export type Scored<T> = { item: T; score: number };

function normalize(s: string): string {
  return (s || "").toLowerCase();
}

export function fuzzyFilter<T>(items: T[], getText: (item: T) => string, q: string, max: number = 50): T[] {
  const query = normalize(q).trim();
  if (!query) return items.slice(0, max);

  const scored: Scored<T>[] = [];
  for (const it of items) {
    const text = getText(it) || "";
    const low = normalize(text);
    let score = Infinity;
    const idx = low.indexOf(query);
    if (idx >= 0) {
      score = idx; // earlier is better
      // prefer basename matches for paths
      const base = low.split(/[\\/]/).pop() || low;
      const bidx = base.indexOf(query);
      if (bidx >= 0) score = Math.min(score, bidx * 0.5);
    }
    // all characters in order (very light subsequence match)
    if (!isFinite(score)) {
      let j = 0;
      for (let i = 0; i < low.length && j < query.length; i++) {
        if (low[i] === query[j]) j++;
      }
      if (j === query.length) {
        score = low.length; // worse than direct includes, but acceptable
      }
    }
    if (isFinite(score)) scored.push({ item: it, score });
  }

  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, max).map((s) => s.item);
}

export function makeSuggest<T>(items: T[], getTitle: (item: T) => string) {
  return async (input: string) => {
    const filtered = fuzzyFilter(items, getTitle, input || "");
    return filtered.map((it) => ({ title: getTitle(it), value: getTitle(it) }));
  };
}

