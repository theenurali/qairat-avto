import type { CounterexampleTask, CxResult } from '../../types';
import { buildLps, kmpSearch } from '../../lib/algorithms/kmp';
import { compareRuns, fmtList, guard } from './util';

function lpsVariant(p: string, mode: 'zero' | 'norecheck'): number[] {
  const m = p.length;
  const lps = Array.from({ length: m }, () => 0);
  let len = 0;
  let i = 1;
  const tick = guard();
  while (i < m) {
    tick();
    if (p[i] === p[len]) {
      len++;
      lps[i] = len;
      i++;
    } else if (len > 0) {
      if (mode === 'zero') len = 0;
      else {
        len = lps[len - 1];
        lps[i] = len;
        i++;
      }
    } else {
      lps[i] = 0;
      i++;
    }
  }
  return lps;
}

function kmpVariant(text: string, p: string, mode: 'resetzero' | 'advance' | 'bound'): number[] {
  const lps = buildLps(p);
  const res: number[] = [];
  let i = 0;
  let j = 0;
  const tick = guard();
  const limit = mode === 'bound' ? text.length - p.length : text.length;
  while (i < limit) {
    tick();
    if (text[i] === p[j]) {
      i++;
      j++;
      if (j === p.length) {
        res.push(i - j);
        j = mode === 'resetzero' ? 0 : lps[j - 1];
      }
    } else if (j > 0) {
      j = lps[j - 1];
      if (mode === 'advance') i++;
    } else i++;
  }
  return res;
}

function patternInput(input: Record<string, string>): { p?: string; error?: string } {
  const p = (input.pattern ?? '').trim();
  if (!p) return { error: 'Введите pattern' };
  if (p.length > 40) return { error: 'Слишком длинный pattern (максимум 40)' };
  return { p };
}

function textPatternInput(input: Record<string, string>): { t?: string; p?: string; error?: string } {
  const t = (input.text ?? '').trim();
  const p = (input.pattern ?? '').trim();
  if (!t || !p) return { error: 'Введите text и pattern' };
  if (t.length > 80 || p.length > 40) return { error: 'Слишком длинный ввод (text ≤ 80, pattern ≤ 40)' };
  return { t, p };
}

const err = (e: string): CxResult => ({ error: e, buggy: '', correct: '', broken: false });

const LPS_HEADER = `def build_lps(pat):
    m = len(pat)
    lps = [0] * m
    length = 0
    i = 1
    while i < m:
        if pat[i] == pat[length]:
            length += 1
            lps[i] = length
            i += 1`;

const cxLpsZero: CounterexampleTask = {
  id: 'cx-m2-1',
  module: 'm2',
  topic: 'kmp',
  difficulty: 2,
  title: 'LPS: откат сразу в 0',
  goal: 'build_lps(pat) должен вернуть LPS array: LPS[i] — длина самого длинного proper prefix строки pat[0..i], который также является её suffix.',
  buggyCode: `${LPS_HEADER}
        elif length > 0:
            length = 0              # «начинаем заново»
        else:
            lps[i] = 0
            i += 1
    return lps`,
  bugLine: 12,
  hint: 'После несовпадения более короткий prefix-suffix может всё ещё подходить. Попробуйте строки из повторяющихся символов с одним «чужим».',
  fields: [{ name: 'pattern', label: 'pattern', placeholder: 'ABCABD' }],
  initial: { pattern: 'ABCABD' },
  sample: { pattern: 'AABAAA' },
  evaluate: (input) => {
    const r = patternInput(input);
    if (r.error) return err(r.error);
    return compareRuns(() => fmtList(lpsVariant(r.p!, 'zero')), () => fmtList(buildLps(r.p!)));
  },
  explanation:
    'pattern = "AABAAA". До i = 5 всё верно: LPS = [0,1,0,1,2,?], length = 2. Сравниваем pat[5]=\'A\' и pat[2]=\'B\' — не равны. Правильно: length = LPS[1] = 1 и снова сравнить pat[5] с pat[1] = \'A\' → равны → LPS[5] = 2 ("AA" — и префикс, и суффикс "AABAAA"). Багованный код ставит length = 0 и получает LPS[5] = 1. Откат в 0 теряет более короткие совпадения, которые сохраняет переход length = lps[length − 1].',
  fixedCode: `        elif length > 0:
            length = lps[length - 1]   # пробуем более короткий prefix-suffix`,
};

const cxLpsNoRecheck: CounterexampleTask = {
  id: 'cx-m2-2',
  module: 'm2',
  topic: 'kmp',
  difficulty: 3,
  title: 'LPS: откат без повторного сравнения',
  goal: 'Построить корректный LPS array.',
  buggyCode: `${LPS_HEADER}
        elif length > 0:
            length = lps[length - 1]
            lps[i] = length         # сразу записываем
            i += 1                  # и идём дальше
        else:
            lps[i] = 0
            i += 1
    return lps`,
  bugLine: 13,
  hint: 'После отката length нужно СНОВА сравнить pat[i] и pat[length]. Когда это сравнение дало бы «равно»? А когда новый length вообще не подходит?',
  fields: [{ name: 'pattern', label: 'pattern', placeholder: 'ABAB' }],
  initial: { pattern: 'ABAB' },
  sample: { pattern: 'AABAAA' },
  evaluate: (input) => {
    const r = patternInput(input);
    if (r.error) return err(r.error);
    return compareRuns(() => fmtList(lpsVariant(r.p!, 'norecheck')), () => fmtList(buildLps(r.p!)));
  },
  explanation:
    'pattern = "AABAAA". При i = 5: length = 2, pat[5]=\'A\' ≠ pat[2]=\'B\' → length = LPS[1] = 1. Багованный код сразу записывает LPS[5] = 1. Правильный код сравнивает ещё раз: pat[5]=\'A\' == pat[1]=\'A\' → LPS[5] = 2. Правильно [0,1,0,1,2,2], баг [0,1,0,1,2,1]. Обратите внимание: на "ABAC" обе версии дают [0,0,1,0] — после отката length = 0 и повторное сравнение тоже даёт «не равно». Хороший контрпример требует, чтобы после отката повторное сравнение дало «равно» (или потребовался второй откат).',
  fixedCode: `        elif length > 0:
            length = lps[length - 1]   # i НЕ увеличиваем — сравним ещё раз`,
};

const KMP_HEADER = `def kmp_search(text, pat):
    lps = build_lps(pat)          # корректная
    res = []
    i = j = 0`;

const cxKmpResetZero: CounterexampleTask = {
  id: 'cx-m2-3',
  module: 'm2',
  topic: 'kmp',
  difficulty: 1,
  title: 'KMP: после совпадения j = 0',
  goal: 'Вернуть ВСЕ позиции вхождений pattern в text, включая перекрывающиеся.',
  buggyCode: `${KMP_HEADER}
    while i < len(text):
        if text[i] == pat[j]:
            i += 1
            j += 1
            if j == len(pat):
                res.append(i - j)
                j = 0               # начинаем поиск заново
        elif j > 0:
            j = lps[j - 1]
        else:
            i += 1
    return res`,
  bugLine: 11,
  hint: 'Что, если конец одного вхождения — это начало следующего?',
  fields: [
    { name: 'text', label: 'text', placeholder: 'ABCABC' },
    { name: 'pattern', label: 'pattern', placeholder: 'ABC' },
  ],
  initial: { text: 'ABCABC', pattern: 'ABC' },
  sample: { text: 'AAAA', pattern: 'AA' },
  evaluate: (input) => {
    const r = textPatternInput(input);
    if (r.error) return err(r.error);
    return compareRuns(() => fmtList(kmpVariant(r.t!, r.p!, 'resetzero')), () => fmtList(kmpSearch(r.t!, r.p!).matches));
  },
  explanation:
    'text = "AAAA", pattern = "AA". Правильный KMP после совпадения ставит j = LPS[1] = 1 — то есть помнит, что последний "A" уже является началом следующего вхождения → [0, 1, 2]. Багованный ставит j = 0 и находит только непересекающиеся [0, 2]. Для образцов без собственного prefix-suffix (например "ABC") LPS[m−1] = 0, поэтому ошибка незаметна.',
  fixedCode: `            if j == len(pat):
                res.append(i - j)
                j = lps[j - 1]`,
};

const cxKmpAdvance: CounterexampleTask = {
  id: 'cx-m2-4',
  module: 'm2',
  topic: 'kmp',
  difficulty: 2,
  title: 'KMP: двигает i при откате',
  goal: 'Найти все вхождения pattern в text.',
  buggyCode: `${KMP_HEADER}
    while i < len(text):
        if text[i] == pat[j]:
            i += 1
            j += 1
            if j == len(pat):
                res.append(i - j)
                j = lps[j - 1]
        elif j > 0:
            j = lps[j - 1]
            i += 1                  # «этот символ уже проверили»
        else:
            i += 1
    return res`,
  bugLine: 14,
  hint: 'После отката j символ text[i] ещё НЕ сравнивали с pat[новый j]. Когда он мог бы совпасть?',
  fields: [
    { name: 'text', label: 'text', placeholder: 'XABX' },
    { name: 'pattern', label: 'pattern', placeholder: 'AB' },
  ],
  initial: { text: 'XABX', pattern: 'AB' },
  sample: { text: 'AAB', pattern: 'AB' },
  evaluate: (input) => {
    const r = textPatternInput(input);
    if (r.error) return err(r.error);
    return compareRuns(() => fmtList(kmpVariant(r.t!, r.p!, 'advance')), () => fmtList(kmpSearch(r.t!, r.p!).matches));
  },
  explanation:
    'text = "AAB", pattern = "AB". i=0: \'A\'==\'A\' → i=1, j=1. i=1: \'A\' ≠ \'B\' → j = LPS[0] = 0. Правильный KMP НЕ двигает i и сравнивает text[1]=\'A\' с pat[0]=\'A\' — совпадение, затем \'B\' → вхождение в позиции 1. Багованный код делает i = 2 и пропускает начало вхождения. Ключевая идея KMP: при mismatch двигается только j (образец), а символ текста сравнивается заново.',
  fixedCode: `        elif j > 0:
            j = lps[j - 1]          # i не трогаем`,
};

const cxKmpBound: CounterexampleTask = {
  id: 'cx-m2-5',
  module: 'm2',
  topic: 'kmp',
  difficulty: 1,
  title: 'KMP: неверная граница цикла',
  goal: 'Найти все вхождения pattern в text.',
  buggyCode: `${KMP_HEADER}
    while i < len(text) - len(pat):
        if text[i] == pat[j]:
            i += 1
            j += 1
            if j == len(pat):
                res.append(i - j)
                j = lps[j - 1]
        elif j > 0:
            j = lps[j - 1]
        else:
            i += 1
    return res`,
  bugLine: 5,
  hint: 'В KMP i — индекс в ТЕКСТЕ, он должен дойти до конца текста. Граница n − m нужна только в наивном алгоритме, где i — сдвиг.',
  fields: [
    { name: 'text', label: 'text', placeholder: 'ABXXXX' },
    { name: 'pattern', label: 'pattern', placeholder: 'AB' },
  ],
  initial: { text: 'ABXXXX', pattern: 'AB' },
  sample: { text: 'XAB', pattern: 'AB' },
  evaluate: (input) => {
    const r = textPatternInput(input);
    if (r.error) return err(r.error);
    return compareRuns(() => fmtList(kmpVariant(r.t!, r.p!, 'bound')), () => fmtList(kmpSearch(r.t!, r.p!).matches));
  },
  explanation:
    'text = "XAB", pattern = "AB": цикл идёт, пока i < 3 − 2 = 1, то есть проверяется только text[0]. Вхождение в позиции 1 (в конце текста) теряется. Вообще любое вхождение, которое заканчивается в последних m символах текста, будет потеряно.',
  fixedCode: `    while i < len(text):`,
};

export const CX_M2: CounterexampleTask[] = [cxKmpResetZero, cxKmpBound, cxLpsZero, cxKmpAdvance, cxLpsNoRecheck];
