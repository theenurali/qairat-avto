/** Трассировка наивного поиска подстроки (для сравнения с KMP). */

export interface NaiveStep {
  s: number; // сдвиг окна (начало в тексте)
  j: number; // индекс в pattern
  equal: boolean;
  /** Если после этого сравнения найдено полное вхождение — его начало. */
  match?: number;
}

export interface NaiveTrace {
  steps: NaiveStep[];
  matches: number[];
  comparisons: number;
}

export function naiveTrace(text: string, pattern: string): NaiveTrace {
  const n = text.length;
  const m = pattern.length;
  const steps: NaiveStep[] = [];
  const matches: number[] = [];
  if (m === 0 || m > n) return { steps, matches, comparisons: 0 };
  for (let s = 0; s <= n - m; s++) {
    let j = 0;
    while (j < m) {
      const equal = text[s + j] === pattern[j];
      const full = equal && j === m - 1;
      steps.push({ s, j, equal, match: full ? s : undefined });
      if (!equal) break;
      j++;
    }
    if (j === m) matches.push(s);
  }
  return { steps, matches, comparisons: steps.length };
}
