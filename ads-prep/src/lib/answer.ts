/**
 * Нормализация и проверка ответов студента для Tracing-заданий.
 */

const SYNONYMS: Record<string, string> = {
  none: '_',
  empty: '_',
  null: '_',
  '-': '_',
  'пусто': '_',
  del: 'DEL',
  deleted: 'DEL',
  tombstone: 'DEL',
  'да': 'yes',
  'нет': 'no',
  true: 'yes',
  false: 'no',
  cycle: 'CYCLE',
  'цикл': 'CYCLE',
  inf: '∞',
  infinity: '∞',
};

export function normToken(t: string): string {
  const clean = t.trim().replace(/^['"`]+|['"`]+$/g, '');
  const low = clean.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(SYNONYMS, low)) return SYNONYMS[low];
  if (low === 'yes' || low === 'no') return low;
  // неориентированное ребро u-v: регистр и порядок концов не важны
  const edge = clean.match(/^([A-Za-z0-9]+)[-–]([A-Za-z0-9]+)$/);
  if (edge) {
    const [a, b] = [edge[1].toUpperCase(), edge[2].toUpperCase()];
    return a <= b ? `${a}-${b}` : `${b}-${a}`;
  }
  return /^[a-z]$/i.test(clean) ? clean.toUpperCase() : clean;
}

/** Разбивает ответ на токены: запятые, пробелы, точки с запятой, стрелки, скобки. */
export function tokenize(s: string): string[] {
  return s
    .replace(/->|→|=>/g, ' ')
    .split(/[\s,;[\](){}]+/)
    .map(normToken)
    .filter((t) => t.length > 0);
}

/** Группы разделяются '|' или переводом строки. Пустая группа — '_'. Метка «A:» в начале группы игнорируется. */
export function tokenizeGroups(s: string): string[] {
  return s
    .split(/[|\n]/)
    .map((g) => g.replace(/^\s*[A-Za-z0-9_]+\s*:/, ''))
    .map((g) => tokenize(g).filter((t) => t !== '_').join(' ') || '_');
}

function normExpected(e: string): string {
  return tokenize(e).join(' ') || '_';
}

export interface CheckResult {
  correct: boolean;
  /** Токены студента (после нормализации). */
  given: string[];
  /** Для каждой позиции expected: совпало ли. */
  marks: boolean[];
  /** Индекс первой ошибки или -1. */
  firstError: number;
  message: string;
}

export type CompareMode = 'list' | 'set' | 'groups';

export function checkAnswer(input: string, expected: readonly string[], mode: CompareMode): CheckResult {
  const exp = mode === 'groups' ? expected.map(normExpected) : expected.map(normToken);
  const given = mode === 'groups' ? tokenizeGroups(input) : tokenize(input);

  if (given.length === 0) {
    return { correct: false, given, marks: exp.map(() => false), firstError: 0, message: 'Ответ пустой.' };
  }

  if (mode === 'set') {
    const gs = new Set(given);
    const es = new Set(exp);
    const marks = exp.map((e) => gs.has(e));
    const extra = given.filter((g) => !es.has(g));
    const missing = exp.filter((e) => !gs.has(e));
    const correct = extra.length === 0 && missing.length === 0;
    const parts: string[] = [];
    if (missing.length) parts.push(`не хватает: ${missing.join(', ')}`);
    if (extra.length) parts.push(`лишнее: ${extra.join(', ')}`);
    return { correct, given, marks, firstError: marks.indexOf(false), message: correct ? 'Верно!' : `Неверно — ${parts.join('; ')}.` };
  }

  const marks = exp.map((e, i) => given[i] === e);
  const firstError = marks.indexOf(false);
  const lengthOk = given.length === exp.length;
  const correct = firstError === -1 && lengthOk;
  let message = 'Верно!';
  if (!correct) {
    if (firstError !== -1) {
      message = `Первая ошибка в позиции ${firstError + 1}: ожидалось «${exp[firstError]}», у вас «${given[firstError] ?? '—'}».`;
    } else if (given.length > exp.length) {
      message = `Все ${exp.length} элементов верны, но у вас лишние элементы: ${given.slice(exp.length).join(', ')}.`;
    } else {
      message = `Ответ короче ожидаемого.`;
    }
  }
  return { correct, given, marks, firstError, message };
}
