/**
 * Knuth-Morris-Pratt: prefix function (LPS array) и поиск с трассировкой.
 * LPS[i] = длина самого длинного proper prefix строки pattern[0..i],
 * который одновременно является её suffix.
 */

export interface LpsStep {
  i: number;
  len: number; // длина текущего совпавшего префикса ДО сравнения
  compare: [number, number]; // сравниваем pattern[i] и pattern[len]
  equal: boolean;
  action: string;
  lps: number[]; // снимок массива после шага (-1 = ещё не вычислено)
}

export function buildLps(pattern: string): number[] {
  return buildLpsTrace(pattern).lps;
}

export function buildLpsTrace(pattern: string): { lps: number[]; steps: LpsStep[] } {
  const m = pattern.length;
  const lps = Array.from({ length: m }, () => -1);
  const steps: LpsStep[] = [];
  if (m === 0) return { lps: [], steps };
  lps[0] = 0;
  let len = 0;
  let i = 1;
  while (i < m) {
    const equal = pattern[i] === pattern[len];
    const before = len;
    const curI = i;
    let action: string;
    if (equal) {
      len++;
      lps[i] = len;
      action = `'${pattern[i]}' == '${pattern[before]}' → len = ${len}, LPS[${i}] = ${len}, i++`;
      i++;
    } else if (len > 0) {
      len = lps[len - 1];
      action = `'${pattern[i]}' ≠ '${pattern[before]}', len > 0 → len = LPS[${before - 1}] = ${len} (i не двигаем)`;
    } else {
      lps[i] = 0;
      action = `'${pattern[i]}' ≠ '${pattern[before]}', len = 0 → LPS[${i}] = 0, i++`;
      i++;
    }
    steps.push({ i: curI, len: before, compare: [curI, before], equal, action, lps: [...lps] });
  }
  return { lps, steps };
}

export interface KmpStep {
  i: number; // индекс в text
  j: number; // индекс в pattern
  equal: boolean;
  action: string;
  match?: number; // если найдено вхождение — его начало
}

export interface KmpResult {
  lps: number[];
  matches: number[];
  steps: KmpStep[];
  comparisons: number;
}

export function kmpSearch(text: string, pattern: string): KmpResult {
  const lps = buildLps(pattern);
  const n = text.length;
  const m = pattern.length;
  const steps: KmpStep[] = [];
  const matches: number[] = [];
  if (m === 0 || m > n) return { lps, matches, steps, comparisons: 0 };
  let i = 0;
  let j = 0;
  while (i < n) {
    const equal = text[i] === pattern[j];
    if (equal) {
      if (j === m - 1) {
        const start = i - m + 1;
        matches.push(start);
        const nj = lps[j];
        steps.push({ i, j, equal, match: start, action: `совпадение '${text[i]}', найдено вхождение в позиции ${start}; j = LPS[${j}] = ${nj}, i++` });
        j = nj;
        i++;
      } else {
        steps.push({ i, j, equal, action: `text[${i}] == pattern[${j}] ('${text[i]}') → i++, j++` });
        i++;
        j++;
      }
    } else if (j > 0) {
      const nj = lps[j - 1];
      steps.push({ i, j, equal, action: `text[${i}]='${text[i]}' ≠ pattern[${j}]='${pattern[j]}' → j = LPS[${j - 1}] = ${nj}, i остаётся` });
      j = nj;
    } else {
      steps.push({ i, j, equal, action: `text[${i}]='${text[i]}' ≠ pattern[0]='${pattern[0]}', j = 0 → i++` });
      i++;
    }
  }
  return { lps, matches, steps, comparisons: steps.length };
}

/** Наивное определение LPS — эталон для тестов. */
export function lpsBrute(pattern: string): number[] {
  return [...pattern].map((_, i) => {
    const s = pattern.slice(0, i + 1);
    for (let k = s.length - 1; k > 0; k--) {
      if (s.slice(0, k) === s.slice(s.length - k)) return k;
    }
    return 0;
  });
}
