import { mod } from './hashing';

/**
 * Rabin-Karp с rolling hash (схема как в CLRS):
 *   hash(s[0..m-1]) = (v(s0)*d^(m-1) + v(s1)*d^(m-2) + ... + v(s_{m-1})) mod q
 *   t_{i+1} = (d * (t_i - v(text[i]) * h) + v(text[i+m])) mod q,  где h = d^(m-1) mod q
 */

export type CharValue = 'ord' | 'digit' | 'alpha';

/** Значение символа: ord — код символа, digit — цифра 0-9, alpha — a=1, b=2, ... */
export function charVal(c: string, mode: CharValue): number {
  if (mode === 'digit') {
    const v = c.charCodeAt(0) - 48;
    return v >= 0 && v <= 9 ? v : c.charCodeAt(0);
  }
  if (mode === 'alpha') {
    const lc = c.toLowerCase();
    const v = lc.charCodeAt(0) - 96;
    return v >= 1 && v <= 26 ? v : c.charCodeAt(0);
  }
  return c.charCodeAt(0);
}

export interface RKParams {
  base: number; // d
  q: number; // простой модуль
  values: CharValue;
}

export const DEFAULT_RK: RKParams = { base: 256, q: 101, values: 'ord' };

/** Хеш строки по схеме Хорнера. */
export function polyHash(s: string, p: RKParams): number {
  let h = 0;
  for (const c of s) h = mod(h * p.base + charVal(c, p.values), p.q);
  return h;
}

/** h = d^(m-1) mod q */
export function highPower(m: number, p: RKParams): number {
  let h = 1;
  for (let i = 0; i < m - 1; i++) h = mod(h * p.base, p.q);
  return h;
}

export type WindowKind = 'match' | 'spurious' | 'miss';

export interface RKWindow {
  i: number;
  window: string;
  hash: number;
  /** Как получен хеш: формула пересчёта (для i > 0). */
  roll?: string;
  kind: WindowKind;
  /** Сколько символов сравнили при проверке (0 если хеши не совпали). */
  charChecks: number;
}

export interface RKResult {
  patternHash: number;
  h: number;
  windows: RKWindow[];
  matches: number[];
  spurious: number[];
  hashComparisons: number;
  charComparisons: number;
}

export function rabinKarp(text: string, pattern: string, p: RKParams = DEFAULT_RK): RKResult {
  const n = text.length;
  const m = pattern.length;
  const empty: RKResult = {
    patternHash: 0,
    h: 1,
    windows: [],
    matches: [],
    spurious: [],
    hashComparisons: 0,
    charComparisons: 0,
  };
  if (m === 0 || m > n) return { ...empty, patternHash: polyHash(pattern, p) };

  const h = highPower(m, p);
  const ph = polyHash(pattern, p);
  let t = polyHash(text.slice(0, m), p);
  const windows: RKWindow[] = [];
  const matches: number[] = [];
  const spurious: number[] = [];
  let charComparisons = 0;

  for (let i = 0; i <= n - m; i++) {
    let roll: string | undefined;
    if (i > 0) {
      const out = charVal(text[i - 1], p.values);
      const inn = charVal(text[i + m - 1], p.values);
      const prev = t;
      t = mod(p.base * (prev - out * h) + inn, p.q);
      roll = `(${p.base}·(${prev} − ${out}·${h}) + ${inn}) mod ${p.q} = ${t}`;
    }
    let kind: WindowKind = 'miss';
    let checks = 0;
    if (t === ph) {
      let j = 0;
      while (j < m) {
        checks++;
        if (text[i + j] !== pattern[j]) break;
        j++;
      }
      kind = j === m ? 'match' : 'spurious';
      if (kind === 'match') matches.push(i);
      else spurious.push(i);
    }
    charComparisons += checks;
    windows.push({ i, window: text.slice(i, i + m), hash: t, roll, kind, charChecks: checks });
  }
  return { patternHash: ph, h, windows, matches, spurious, hashComparisons: windows.length, charComparisons };
}

/** Наивный поиск — эталон для проверки. */
export function naiveSearch(text: string, pattern: string): number[] {
  const res: number[] = [];
  if (pattern.length === 0) return res;
  for (let i = 0; i + pattern.length <= text.length; i++) {
    if (text.slice(i, i + pattern.length) === pattern) res.push(i);
  }
  return res;
}
