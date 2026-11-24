import type { TracingTask } from '../../types';
import { buildLps, buildLpsTrace, kmpSearch } from '../../lib/algorithms/kmp';

const LPS_CODE = `def build_lps(pat):
    m = len(pat)
    lps = [0] * m
    length = 0          # длина текущего prefix-suffix
    i = 1
    while i < m:
        if pat[i] == pat[length]:
            length += 1
            lps[i] = length
            i += 1
        elif length > 0:
            length = lps[length - 1]   # откат, i не двигаем
        else:
            lps[i] = 0
            i += 1
    return lps`;

const KMP_CODE = `def kmp_search(text, pat):
    lps = build_lps(pat)
    res = []
    i = j = 0
    while i < len(text):
        if text[i] == pat[j]:
            i += 1
            j += 1
            if j == len(pat):
                res.append(i - j)
                j = lps[j - 1]
        elif j > 0:
            j = lps[j - 1]           # i НЕ двигаем назад
        else:
            i += 1
    return res`;

const LPS_CODE_CPP = `vector<int> build_lps(const string& pat) {
    int m = pat.size();
    vector<int> lps(m, 0);
    int length = 0;          // длина текущего prefix-suffix
    int i = 1;
    while (i < m) {
        if (pat[i] == pat[length]) {
            length++;
            lps[i] = length;
            i++;
        } else if (length > 0) {
            length = lps[length - 1];   // откат, i не двигаем
        } else {
            lps[i] = 0;
            i++;
        }
    }
    return lps;
}`;

const KMP_CODE_CPP = `vector<int> build_lps(const string& pat);

vector<int> kmp_search(const string& text, const string& pat) {
    vector<int> lps = build_lps(pat);
    vector<int> res;
    int i = 0, j = 0;
    while (i < (int)text.size()) {
        if (text[i] == pat[j]) {
            i++;
            j++;
            if (j == (int)pat.size()) {
                res.push_back(i - j);
                j = lps[j - 1];
            }
        } else if (j > 0) {
            j = lps[j - 1];          // i НЕ двигаем назад
        } else {
            i++;
        }
    }
    return res;
}`;

export function tLps(id: string, pattern: string, difficulty: 1 | 2 | 3): TracingTask {
  const { lps, steps } = buildLpsTrace(pattern);
  return {
    id,
    module: 'm2',
    topic: 'kmp',
    difficulty,
    title: `LPS array для "${pattern}"`,
    prompt: `Постройте LPS array (prefix function) для образца. LPS[i] — длина самого длинного proper prefix строки pattern[0..i], который одновременно является её suffix.`,
    data: `pattern = "${pattern}"\nindex:   ${[...pattern].map((_, i) => i).join(' ')}`,
    code: LPS_CODE,
    codeCpp: LPS_CODE_CPP,
    format: 'Числа через запятую, по одному на символ',
    expected: lps.map(String),
    compare: 'list',
    labels: [...pattern].map((c, i) => `LPS[${i}] ('${c}')`),
    steps: [`LPS[0] = 0 всегда (у строки из одного символа нет proper prefix).`, ...steps.map((s) => `i=${s.i}, len=${s.len}: ${s.action}`), `Итог: [${lps.join(', ')}]`],
  };
}

export function tKmpMatches(id: string, text: string, pattern: string, difficulty: 1 | 2 | 3): TracingTask {
  const r = kmpSearch(text, pattern);
  return {
    id,
    module: 'm2',
    topic: 'kmp',
    difficulty,
    title: 'KMP: найдите все вхождения',
    prompt: `Выполните KMP search. Запишите начальные индексы ВСЕХ вхождений образца в текст (включая перекрывающиеся). Если вхождений нет — _.`,
    data: `text    = "${text}"\npattern = "${pattern}"\nLPS     = [${r.lps.join(', ')}]`,
    code: KMP_CODE,
    codeCpp: KMP_CODE_CPP,
    format: 'Индексы через запятую или _',
    expected: r.matches.length ? r.matches.map(String) : ['_'],
    compare: 'list',
    steps: [`LPS(pattern) = [${r.lps.join(', ')}]`, ...r.steps.map((s) => `i=${s.i}, j=${s.j}: ${s.action}`)],
  };
}

export function tKmpComparisons(id: string, text: string, pattern: string): TracingTask {
  const r = kmpSearch(text, pattern);
  const n = text.length;
  const m = pattern.length;
  let naive = 0;
  for (let s = 0; s + m <= n; s++) {
    for (let k = 0; k < m; k++) {
      naive++;
      if (text[s + k] !== pattern[k]) break;
    }
  }
  return {
    id,
    module: 'm2',
    topic: 'kmp',
    difficulty: 3,
    title: 'KMP vs Naive: число сравнений символов',
    prompt: `Посчитайте число сравнений символов text[i] vs pattern[j] (1) в KMP search (не считая построения LPS) и (2) в наивном алгоритме (для каждого сдвига сравниваем слева направо до первого несовпадения).`,
    data: `text    = "${text}"\npattern = "${pattern}"\nLPS     = [${r.lps.join(', ')}]`,
    code: KMP_CODE,
    codeCpp: KMP_CODE_CPP,
    format: 'Два числа: KMP, naive',
    expected: [String(r.comparisons), String(naive)],
    compare: 'list',
    labels: ['KMP', 'naive'],
    steps: [...r.steps.map((s, k) => `#${k + 1}: i=${s.i}, j=${s.j}: ${s.action}`), `Наивный алгоритм: ${naive} сравнений. KMP никогда не возвращает i назад, поэтому сравнений ≤ 2n.`],
  };
}

export function tKmpJumps(id: string, text: string, pattern: string): TracingTask {
  const r = kmpSearch(text, pattern);
  const mism = r.steps.filter((s) => !s.equal && s.j > 0);
  return {
    id,
    module: 'm2',
    topic: 'kmp',
    difficulty: 2,
    title: 'KMP: куда прыгает j',
    prompt: `Выполните KMP search. Каждый раз, когда происходит несовпадение при j > 0, j заменяется на LPS[j−1]. Запишите по порядку НОВЫЕ значения j после каждого такого отката.`,
    data: `text    = "${text}"\npattern = "${pattern}"\nLPS     = [${r.lps.join(', ')}]`,
    code: KMP_CODE,
    codeCpp: KMP_CODE_CPP,
    format: 'Числа через запятую (по одному на каждый откат); если откатов нет — _',
    expected: mism.length ? mism.map((s) => String(r.lps[s.j - 1])) : ['_'],
    compare: 'list',
    steps: r.steps.map((s) => `i=${s.i}, j=${s.j}: ${s.action}`),
  };
}

export function tLpsFallbacks(id: string, pattern: string): TracingTask {
  const { steps, lps } = buildLpsTrace(pattern);
  const fall = steps.filter((s) => !s.equal && s.len > 0);
  return {
    id,
    module: 'm2',
    topic: 'kmp',
    difficulty: 3,
    title: 'LPS: откаты length',
    prompt: `При построении LPS для образца выпишите по порядку значения length ПОСЛЕ каждого отката length = lps[length − 1] (ветка elif). Последним токеном запишите LPS[${pattern.length - 1}].`,
    data: `pattern = "${pattern}"`,
    code: LPS_CODE,
    codeCpp: LPS_CODE_CPP,
    format: 'Числа через запятую',
    expected: [...fall.map((s) => String(lps[s.len - 1])), String(lps[lps.length - 1])],
    compare: 'list',
    steps: steps.map((s) => `i=${s.i}, length=${s.len}: ${s.action}`),
  };
}

export function tKmpFinalJ(id: string, text: string, pattern: string): TracingTask {
  const r = kmpSearch(text, pattern);
  // значение j после обработки всего текста
  let j = 0;
  for (const s of r.steps) {
    if (s.equal) j = s.j === pattern.length - 1 ? r.lps[s.j] : s.j + 1;
    else if (s.j > 0) j = r.lps[s.j - 1];
  }
  return {
    id,
    module: 'm2',
    topic: 'kmp',
    difficulty: 2,
    title: 'KMP: значение j в конце',
    prompt: `Выполните KMP search до конца текста. Запишите: позиции вхождений (через пробел, _ если нет), затем | и значение j после окончания цикла. (Это значение показывает, какой префикс образца совпал с концом текста.)`,
    data: `text    = "${text}"\npattern = "${pattern}"\nLPS     = [${buildLps(pattern).join(', ')}]`,
    code: KMP_CODE,
    codeCpp: KMP_CODE_CPP,
    format: 'Например: 0 4 | 2',
    expected: [r.matches.join(' ') || '_', String(j)],
    compare: 'groups',
    labels: ['вхождения', 'j в конце'],
    steps: r.steps.map((s) => `i=${s.i}, j=${s.j}: ${s.action}`),
  };
}

export const TRACING_M2: TracingTask[] = [
  tLps('tr-m2-01', 'ABAB', 1),
  tLps('tr-m2-02', 'AAAA', 1),
  tLps('tr-m2-03', 'ABCDABD', 1),
  tLps('tr-m2-04', 'ABABCABAB', 2),
  tLps('tr-m2-05', 'AABAACAABAA', 2),
  tLps('tr-m2-06', 'AAACAAAA', 3),
  tLps('tr-m2-07', 'ABACABAB', 3),
  tKmpMatches('tr-m2-08', 'ABABDABACDABABCABAB', 'ABABCABAB', 1),
  tKmpMatches('tr-m2-09', 'AAAAA', 'AA', 2),
  tKmpMatches('tr-m2-10', 'ABABABAB', 'ABAB', 2),
  tKmpJumps('tr-m2-11', 'ABABDABACDABABCABAB', 'ABABCABAB'),
  tKmpJumps('tr-m2-12', 'AABAACAADAABAABA', 'AABA'),
  tLpsFallbacks('tr-m2-13', 'AAACAAAA'),
  tLpsFallbacks('tr-m2-14', 'ABABCABABA'),
  tKmpComparisons('tr-m2-15', 'AAAAAAAAAB', 'AAAAB'),
  tKmpComparisons('tr-m2-16', 'ABCABCABD', 'ABCABD'),
  tKmpFinalJ('tr-m2-17', 'ABCABCAB', 'ABCAB'),
];
