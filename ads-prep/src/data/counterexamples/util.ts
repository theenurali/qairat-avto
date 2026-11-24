import type { CxResult } from '../../types';
import { parseGraph, type Graph } from '../../lib/algorithms/graph';

/** Выбрасывается, когда «багованный» код зацикливается или уходит в бесконечную рекурсию. */
export class LoopLimit extends Error {
  constructor(public readonly kind: 'loop' | 'recursion' | 'index') {
    super(kind);
  }
}

/** Счётчик шагов: защищает от бесконечных циклов в buggy-реализациях. */
export function guard(limit = 5000): () => void {
  let n = 0;
  return () => {
    n++;
    if (n > limit) throw new LoopLimit('loop');
  };
}

export function parseInts(text: string, label = 'ключи'): { values?: number[]; error?: string } {
  const parts = text.split(/[\s,;]+/).filter(Boolean);
  if (parts.length === 0) return { error: `Введите ${label}` };
  if (parts.length > 40) return { error: 'Слишком много чисел (максимум 40)' };
  const values: number[] = [];
  for (const p of parts) {
    if (!/^-?\d+$/.test(p)) return { error: `«${p}» — не целое число` };
    const v = Number(p);
    if (Math.abs(v) > 1e9) return { error: `«${p}» слишком большое` };
    values.push(v);
  }
  return { values };
}

export function parseSize(text: string, min = 2, max = 31): { value?: number; error?: string } {
  const t = text.trim();
  if (!/^\d+$/.test(t)) return { error: 'Размер таблицы m должен быть целым числом' };
  const v = Number(t);
  if (v < min || v > max) return { error: `m должно быть от ${min} до ${max}` };
  return { value: v };
}

export type HashOp = { op: 'insert' | 'delete' | 'search'; key: number };

/** Операции: "+5 +15 -5 ?15" или "insert 5, delete 5, search 15". */
export function parseOps(text: string): { ops?: HashOp[]; error?: string } {
  const norm = text
    .replace(/insert\s*/gi, '+')
    .replace(/delete\s*/gi, '-')
    .replace(/search\s*/gi, '?')
    .split(/[\s,;]+/)
    .filter(Boolean);
  if (norm.length === 0) return { error: 'Введите операции' };
  if (norm.length > 40) return { error: 'Слишком много операций (максимум 40)' };
  const ops: HashOp[] = [];
  for (const t of norm) {
    const m = t.match(/^([+\-?])(-?\d+)$/);
    if (!m) return { error: `Не понимаю операцию «${t}». Формат: +5 (insert), -5 (delete), ?5 (search)` };
    ops.push({ op: m[1] === '+' ? 'insert' : m[1] === '-' ? 'delete' : 'search', key: Number(m[2]) });
  }
  return { ops };
}

export function graphFrom(input: Record<string, string>, directed: boolean): { graph?: Graph; error?: string } {
  return parseGraph(input.vertices ?? '', input.edges ?? '', directed);
}

/** Запускает buggy/correct и сравнивает вывод; бесконечные циклы превращаются в понятный текст. */
export function compareRuns(buggy: () => string, correct: () => string, note?: string): CxResult {
  let c: string;
  try {
    c = correct();
  } catch (e) {
    return { error: `Внутренняя ошибка эталона: ${e instanceof Error ? e.message : 'unknown'}`, buggy: '', correct: '', broken: false };
  }
  let b: string;
  let extra: string | undefined;
  try {
    b = buggy();
  } catch (e) {
    if (e instanceof LoopLimit) {
      b =
        e.kind === 'recursion'
          ? 'RecursionError: maximum recursion depth exceeded'
          : e.kind === 'index'
            ? 'IndexError: list index out of range'
            : '∞ бесконечный цикл (остановлен после 5000 шагов)';
      extra = 'Багованный код не завершился нормально — это тоже неправильное поведение.';
    } else {
      return { error: `Ошибка выполнения: ${e instanceof Error ? e.message : 'unknown'}`, buggy: '', correct: c, broken: false };
    }
  }
  return { buggy: b, correct: c, broken: b !== c, note: extra ?? note };
}

export function withInput<T>(parsed: { error?: string } & T, run: (v: T) => CxResult): CxResult {
  if (parsed.error) return { error: parsed.error, buggy: '', correct: '', broken: false };
  return run(parsed);
}

export const fmtList = (xs: readonly (string | number)[]): string => `[${xs.join(', ')}]`;
