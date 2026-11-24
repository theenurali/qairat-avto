import type { TracingTask } from '../../types';
import {
  chainInsertAll,
  hashInt,
  hashStringSum,
  openDelete,
  openInsertAll,
  openSearch,
  slotToString,
  type ProbeMode,
  type Slot,
} from '../../lib/algorithms/hashing';
import { DEFAULT_RK, rabinKarp, type RKParams } from '../../lib/algorithms/rabinKarp';

/* ---------------------------- Hash Tables ---------------------------- */

const OPEN_CODE = `def insert(table, key):
    m = len(table)
    h = key % m
    for i in range(m):
        idx = (h + i) % m          # linear probing
        # idx = (h + i * i) % m    # quadratic probing
        if table[idx] is None or table[idx] == DEL:
            table[idx] = key
            return idx
    raise Exception("table is full")`;

const OPEN_CODE_CPP = `const int EMPTY = -1, DEL = -2;

int insert(vector<int>& table, int key) {
    int m = table.size();
    int h = key % m;
    for (int i = 0; i < m; i++) {
        int idx = (h + i) % m;          // linear probing
        // int idx = (h + i * i) % m;   // quadratic probing
        if (table[idx] == EMPTY || table[idx] == DEL) {
            table[idx] = key;
            return idx;
        }
    }
    throw runtime_error("table is full");
}`;

const CHAIN_CODE = `def insert(buckets, key):
    m = len(buckets)
    b = key % m
    if key not in buckets[b]:
        buckets[b].append(key)     # в КОНЕЦ цепочки`;

const CHAIN_CODE_CPP = `void insert(vector<vector<int>>& buckets, int key) {
    int m = buckets.size();
    int b = key % m;
    if (find(buckets[b].begin(), buckets[b].end(), key) == buckets[b].end())
        buckets[b].push_back(key);     // в КОНЕЦ цепочки
}`;

export function tHashIndices(id: string, keys: number[], m: number): TracingTask {
  return {
    id,
    module: 'm1',
    topic: 'hash',
    difficulty: 1,
    title: `Hash function: k mod ${m}`,
    prompt: `Вычислите индекс (bucket) для каждого ключа с помощью hash function h(k) = k mod ${m}. Запишите индексы в том же порядке, что и ключи.`,
    data: `m = ${m}\nkeys = [${keys.join(', ')}]`,
    format: 'Числа через запятую, например: 3, 0, 5',
    expected: keys.map((k) => String(hashInt(k, m))),
    compare: 'list',
    labels: keys.map((k) => `h(${k})`),
    steps: keys.map((k) => `h(${k}) = ${k} mod ${m} = ${hashInt(k, m)} (${k} = ${m}·${Math.floor(k / m)} + ${hashInt(k, m)})`),
  };
}

export function tChaining(id: string, keys: number[], m: number, difficulty: 1 | 2 | 3 = 1): TracingTask {
  const { chains, log } = chainInsertAll(m, keys);
  return {
    id,
    module: 'm1',
    topic: 'hash',
    difficulty,
    title: `Separate Chaining, m = ${m}`,
    prompt: `Вставьте ключи по порядку в hash table размера ${m} с Separate Chaining (h(k) = k mod ${m}, новый ключ добавляется в КОНЕЦ цепочки). Запишите содержимое каждого bucket'а от 0 до ${m - 1}.`,
    data: `m = ${m}\nkeys = [${keys.join(', ')}]`,
    code: CHAIN_CODE,
    codeCpp: CHAIN_CODE_CPP,
    format: "Bucket'ы через |, ключи внутри — через пробел, пустой — _. Пример: 7 14 | _ | 9 | ...",
    expected: chains.map((c) => (c.length ? c.join(' ') : '_')),
    compare: 'groups',
    labels: chains.map((_, i) => `bucket ${i}`),
    steps: [
      ...log.map((r, i) => `insert ${keys[i]}: h = ${keys[i]} mod ${m} = ${r.bucket} → ${r.ok ? `добавляем в конец bucket ${r.bucket}${r.compared > 0 ? ' (collision: там уже есть ключи)' : ''}` : 'дубликат, ничего не делаем'}`),
      `Итог: ${chains.map((c, i) => `${i}: [${c.join(', ')}]`).join('  ')}`,
    ],
  };
}

function describeOpen(log: ReturnType<typeof openInsertAll>['log'], keys: number[], m: number, mode: ProbeMode): string[] {
  return log.map((r, i) => {
    const h = hashInt(keys[i], m);
    const probes = r.probes
      .map((p) => `${mode === 'linear' ? `(${h}+${p.attempt})` : `(${h}+${p.attempt}²)`} mod ${m} = ${p.index}${p.action === 'occupied' ? ' занят' : p.action === 'placed' ? ' ✓' : ''}`)
      .join(' → ');
    return `insert ${keys[i]}: h = ${h}. ${probes}. ${r.message}`;
  });
}

export function tOpenTable(id: string, keys: number[], m: number, mode: ProbeMode, difficulty: 1 | 2 | 3 = 2): TracingTask {
  const { table, log } = openInsertAll(m, keys, mode);
  const name = mode === 'linear' ? 'Linear Probing' : 'Quadratic Probing';
  const formula = mode === 'linear' ? `(h(k) + i) mod ${m}` : `(h(k) + i²) mod ${m}`;
  return {
    id,
    module: 'm1',
    topic: 'hash',
    difficulty,
    title: `${name}, m = ${m}`,
    prompt: `Вставьте ключи по порядку в пустую таблицу размера ${m} методом ${name}: h(k) = k mod ${m}, i-я проба = ${formula}, i = 0, 1, 2, … Запишите итоговое содержимое ячеек 0…${m - 1}.`,
    data: `m = ${m}\nkeys = [${keys.join(', ')}]`,
    code: OPEN_CODE,
    codeCpp: OPEN_CODE_CPP,
    format: 'Значения ячеек через запятую, пустая ячейка — _. Пример: _, 11, 2, _, …',
    expected: table.map(slotToString),
    compare: 'list',
    labels: table.map((_, i) => `slot ${i}`),
    steps: [...describeOpen(log, keys, m, mode), `Итог: [${table.map(slotToString).join(', ')}]`],
  };
}

export function tProbeCount(id: string, keys: number[], m: number, mode: ProbeMode): TracingTask {
  const { log } = openInsertAll(m, keys, mode);
  const name = mode === 'linear' ? 'Linear Probing' : 'Quadratic Probing';
  return {
    id,
    module: 'm1',
    topic: 'hash',
    difficulty: 2,
    title: `${name}: сколько проб?`,
    prompt: `Ключи вставляются по порядку в пустую таблицу размера ${m} (${name}, h(k) = k mod ${m}). Для КАЖДОГО ключа запишите число проб (просмотренных ячеек), включая последнюю — ту, куда ключ лёг.`,
    data: `m = ${m}\nkeys = [${keys.join(', ')}]`,
    format: 'Числа через запятую (по одному на ключ)',
    expected: log.map((r) => String(r.probes.length)),
    compare: 'list',
    labels: keys.map((k) => `ключ ${k}`),
    steps: describeOpen(log, keys, m, mode).map((s, i) => `${s} → проб: ${log[i].probes.length}`),
  };
}

export function tSearchAfterDelete(id: string, keys: number[], m: number, del: number, find: number): TracingTask {
  const { table } = openInsertAll(m, keys, 'linear');
  const afterDel = openDelete(table, del, 'linear');
  const search = openSearch(afterDel.table, find, 'linear');
  return {
    id,
    module: 'm1',
    topic: 'hash',
    difficulty: 3,
    title: 'Linear Probing: delete + search',
    prompt: `Ключи вставлены по порядку (Linear Probing, m = ${m}, h(k) = k mod ${m}). Затем выполнено delete(${del}) с tombstone (DEL). Выполните search(${find}). Запишите индексы ВСЕХ просмотренных ячеек по порядку, затем последним токеном — найден ли ключ (yes/no).`,
    data: `m = ${m}\nkeys = [${keys.join(', ')}]\noperations: delete(${del}), search(${find})`,
    format: 'Индексы через запятую, в конце yes или no. Пример: 3, 4, 5, yes',
    expected: [...search.probes.map((p) => String(p.index)), search.ok ? 'yes' : 'no'],
    compare: 'list',
    steps: [
      `Таблица после вставок: [${table.map(slotToString).join(', ')}]`,
      `${afterDel.message}. Таблица: [${afterDel.table.map((s: Slot) => slotToString(s)).join(', ')}]`,
      ...search.probes.map(
        (p) =>
          `проба i=${p.attempt}: slot ${p.index} = ${slotToString(p.slot)} → ${
            p.action === 'found' ? 'нашли!' : p.action === 'skip-deleted' ? 'DEL — НЕ останавливаемся, идём дальше' : p.action === 'empty-stop' ? 'EMPTY — стоп, ключа нет' : 'другой ключ, идём дальше'
          }`,
      ),
      `Важно: если бы delete ставил EMPTY вместо DEL, поиск мог бы остановиться раньше и «потерять» ключ.`,
    ],
  };
}

export function tLoadFactor(id: string, n: number, m: number): TracingTask {
  const alpha = n / m;
  const r = Math.round(alpha * 100) / 100;
  return {
    id,
    module: 'm1',
    topic: 'hash',
    difficulty: 1,
    title: 'Load factor',
    prompt: `В hash table размера m = ${m} хранится n = ${n} ключей. Вычислите load factor α (2 знака после точки). Затем ответьте: нужно ли делать rehash, если порог для open addressing — 0.7 (yes/no)?`,
    data: `n = ${n}, m = ${m}, порог = 0.7`,
    format: 'Два токена: α и yes/no. Пример: 0.45, no',
    expected: [r.toFixed(2), alpha > 0.7 ? 'yes' : 'no'],
    compare: 'list',
    steps: [`α = n / m = ${n} / ${m} = ${r.toFixed(2)}`, `${r.toFixed(2)} ${alpha > 0.7 ? '> 0.7 → нужно увеличить таблицу (обычно ×2) и перевставить все ключи (rehash)' : '≤ 0.7 → rehash не нужен'}`],
  };
}

export function tStringHash(id: string, words: string[], m: number): TracingTask {
  return {
    id,
    module: 'm1',
    topic: 'hash',
    difficulty: 2,
    title: 'String hash: сумма кодов',
    prompt: `Hash function для строк: h(s) = (сумма ord(c) по всем символам) mod ${m}. ord('a') = 97, ord('b') = 98, … Вычислите индекс каждого слова. Какие слова вызовут collision?`,
    data: `m = ${m}\nwords = [${words.map((w) => `"${w}"`).join(', ')}]`,
    code: `def h(s, m):\n    return sum(ord(c) for c in s) % m`,
    codeCpp: `int h(const string& s, int m) {\n    int sum = 0;\n    for (char c : s)\n        sum += c;               // ord(c)\n    return sum % m;\n}`,
    format: 'Индексы через запятую в порядке слов',
    expected: words.map((w) => String(hashStringSum(w, m))),
    compare: 'list',
    labels: words.map((w) => `h("${w}")`),
    steps: [
      ...words.map((w) => {
        const codes = [...w].map((c) => c.charCodeAt(0));
        const sum = codes.reduce((a, b) => a + b, 0);
        return `"${w}": ${codes.join(' + ')} = ${sum}; ${sum} mod ${m} = ${sum % m}`;
      }),
      'Анаграммы (одинаковые буквы в другом порядке) всегда дают одинаковую сумму → collision. Поэтому на практике используют полиномиальный хеш.',
    ],
  };
}

/* ---------------------------- Rabin-Karp ---------------------------- */

const RK_CODE = `def rabin_karp(text, pat, d, q):
    n, m = len(text), len(pat)
    h = pow(d, m - 1, q)
    p = t = 0
    for i in range(m):
        p = (d * p + val(pat[i])) % q
        t = (d * t + val(text[i])) % q
    res = []
    for s in range(n - m + 1):
        if p == t and text[s:s+m] == pat:
            res.append(s)
        if s < n - m:
            t = (d * (t - val(text[s]) * h) + val(text[s+m])) % q
    return res`;

const RK_CODE_CPP = `int val(char c);   // значение символа: цифра, a=1, b=2, … или код символа

vector<int> rabin_karp(const string& text, const string& pat, long long d, long long q) {
    int n = text.size(), m = pat.size();
    long long h = 1;
    for (int i = 0; i < m - 1; i++)
        h = h * d % q;                  // h = d^(m-1) mod q
    long long p = 0, t = 0;
    for (int i = 0; i < m; i++) {
        p = (d * p + val(pat[i])) % q;
        t = (d * t + val(text[i])) % q;
    }
    vector<int> res;
    for (int s = 0; s <= n - m; s++) {
        if (p == t && text.compare(s, m, pat) == 0)
            res.push_back(s);
        if (s < n - m)                  // + q: в C++ % может быть отрицательным
            t = ((d * (t - val(text[s]) * h) + val(text[s + m])) % q + q) % q;
    }
    return res;
}`;

function rkParamText(p: RKParams): string {
  const v = p.values === 'digit' ? 'val(c) = цифра' : p.values === 'alpha' ? "val(c): a=1, b=2, …, z=26" : 'val(c) = ord(c)';
  return `d = ${p.base}, q = ${p.q}, ${v}`;
}

export function tRkPatternHash(id: string, pattern: string, p: RKParams): TracingTask {
  const r = rabinKarp(pattern, pattern, p);
  let acc = 0;
  const steps: string[] = [];
  for (const c of pattern) {
    const v = p.values === 'digit' ? Number(c) : p.values === 'alpha' ? c.charCodeAt(0) - 96 : c.charCodeAt(0);
    const next = (acc * p.base + v) % p.q;
    steps.push(`p = (${p.base}·${acc} + ${v}) mod ${p.q} = ${next}`);
    acc = next;
  }
  return {
    id,
    module: 'm1',
    topic: 'rk',
    difficulty: 1,
    title: 'Rabin-Karp: хеш образца',
    prompt: `Вычислите хеш образца по схеме Горнера (Horner's rule): p = (d·p + val(c)) mod q для каждого символа слева направо. Также вычислите h = d^(m−1) mod q. Ответ: p, h.`,
    data: `pattern = "${pattern}"\n${rkParamText(p)}`,
    code: RK_CODE,
    codeCpp: RK_CODE_CPP,
    format: 'Два числа: p, h',
    expected: [String(r.patternHash), String(r.h)],
    compare: 'list',
    labels: ['p', 'h'],
    steps: [...steps, `h = ${p.base}^${pattern.length - 1} mod ${p.q} = ${r.h}`],
  };
}

export function tRkWindowHashes(id: string, text: string, pattern: string, p: RKParams, difficulty: 1 | 2 | 3 = 2): TracingTask {
  const r = rabinKarp(text, pattern, p);
  return {
    id,
    module: 'm1',
    topic: 'rk',
    difficulty,
    title: 'Rabin-Karp: хеши всех окон',
    prompt: `Запишите хеш t_s каждого окна длины ${pattern.length} в тексте (s = 0, 1, …, ${text.length - pattern.length}). Первый хеш считается по Горнеру, остальные — через rolling hash.`,
    data: `text = "${text}"\npattern = "${pattern}"\n${rkParamText(p)}`,
    code: RK_CODE,
    codeCpp: RK_CODE_CPP,
    format: 'Хеши окон через запятую',
    expected: r.windows.map((w) => String(w.hash)),
    compare: 'list',
    labels: r.windows.map((w) => `t_${w.i} ("${w.window}")`),
    steps: [`h = ${r.h}, хеш образца p = ${r.patternHash}`, ...r.windows.map((w) => `s=${w.i}, окно "${w.window}": ${w.roll ? `t = ${w.roll}` : `t = ${w.hash} (Горнер)`}${w.hash === r.patternHash ? ' ← совпадает с p!' : ''}`)],
  };
}

export function tRkSpurious(id: string, text: string, pattern: string, p: RKParams): TracingTask {
  const r = rabinKarp(text, pattern, p);
  return {
    id,
    module: 'm1',
    topic: 'rk',
    difficulty: 3,
    title: 'Rabin-Karp: spurious hits',
    prompt: `Выполните Rabin-Karp. Запишите позиции s настоящих вхождений, затем символ |, затем позиции spurious hits (хеш совпал, а строки — нет). Если чего-то нет — пишите _.`,
    data: `text = "${text}"\npattern = "${pattern}"\n${rkParamText(p)}`,
    code: RK_CODE,
    codeCpp: RK_CODE_CPP,
    format: 'Например: 2 9 | 5   (или _ | 5)',
    expected: [r.matches.join(' ') || '_', r.spurious.join(' ') || '_'],
    compare: 'groups',
    labels: ['совпадения', 'spurious hits'],
    steps: [
      `p = ${r.patternHash}, h = ${r.h}`,
      ...r.windows.map((w) => `s=${w.i} "${w.window}" t=${w.hash}${w.kind === 'match' ? ' = p, символы совпали → MATCH' : w.kind === 'spurious' ? ' = p, но символы различаются → SPURIOUS HIT' : ''}`),
    ],
  };
}

export function tRkRoll(id: string, text: string, m: number, s: number, p: RKParams): TracingTask {
  const r = rabinKarp(text, text.slice(0, m), p);
  const prev = r.windows[s];
  const next = r.windows[s + 1];
  return {
    id,
    module: 'm1',
    topic: 'rk',
    difficulty: 2,
    title: 'Один шаг rolling hash',
    prompt: `Известно, что хеш окна "${prev.window}" (s = ${s}) равен t_${s} = ${prev.hash}. Используя формулу t_{s+1} = (d·(t_s − val(text[s])·h) + val(text[s+m])) mod q, вычислите t_${s + 1} для окна "${next.window}". Сначала запишите h, затем t_${s + 1}.`,
    data: `text = "${text}", m = ${m}\n${rkParamText(p)}`,
    format: 'Два числа: h, t',
    expected: [String(r.h), String(next.hash)],
    compare: 'list',
    labels: ['h', `t_${s + 1}`],
    steps: [`h = ${p.base}^${m - 1} mod ${p.q} = ${r.h}`, `t_${s + 1} = ${next.roll}`, 'Если промежуточное значение отрицательное, к нему добавляют q (в Python % уже возвращает неотрицательный остаток).'],
  };
}

export function tRkCharComparisons(id: string, text: string, pattern: string, p: RKParams): TracingTask {
  const r = rabinKarp(text, pattern, p);
  return {
    id,
    module: 'm1',
    topic: 'rk',
    difficulty: 3,
    title: 'Rabin-Karp: число сравнений',
    prompt: `Посчитайте: (1) сколько раз сравнивались хеши (по одному на окно), (2) сколько окон потребовали посимвольной проверки (хеш совпал), (3) позиции найденных вхождений (через пробел, _ если нет).`,
    data: `text = "${text}"\npattern = "${pattern}"\n${rkParamText(p)}`,
    format: 'Три группы через |. Пример: 8 | 2 | 3',
    expected: [String(r.hashComparisons), String(r.matches.length + r.spurious.length), r.matches.join(' ') || '_'],
    compare: 'groups',
    labels: ['hash сравнений', 'проверок символов', 'вхождения'],
    steps: [`Окон: n − m + 1 = ${text.length} − ${pattern.length} + 1 = ${r.hashComparisons}`, ...r.windows.map((w) => `s=${w.i} t=${w.hash}${w.hash === r.patternHash ? ` = p → посимвольная проверка (${w.kind === 'match' ? 'совпало' : 'spurious'})` : ''}`)],
  };
}

const DIG: RKParams = { base: 10, q: 13, values: 'digit' };
const ALPHA: RKParams = { base: 26, q: 11, values: 'alpha' };

export const TRACING_M1: TracingTask[] = [
  tHashIndices('tr-m1-01', [18, 41, 22, 44, 59, 32, 31, 73], 13),
  tHashIndices('tr-m1-02', [15, 8, 29, 64, 100, 7], 7),
  tLoadFactor('tr-m1-03', 9, 12),
  tChaining('tr-m1-04', [15, 11, 27, 8, 12, 22], 7),
  tChaining('tr-m1-05', [10, 22, 31, 4, 15, 28, 17, 88, 59], 11, 2),
  tOpenTable('tr-m1-06', [12, 44, 13, 88, 23, 94, 11], 10, 'linear', 1),
  tOpenTable('tr-m1-07', [10, 22, 31, 4, 15, 28, 17, 88, 59], 11, 'linear', 2),
  tOpenTable('tr-m1-08', [10, 22, 31, 4, 15, 28, 17, 88, 59], 11, 'quadratic', 3),
  tProbeCount('tr-m1-09', [7, 14, 21, 3, 10], 7, 'linear'),
  tProbeCount('tr-m1-10', [5, 15, 25, 35], 10, 'quadratic'),
  tSearchAfterDelete('tr-m1-11', [12, 22, 32, 13, 42], 10, 22, 42),
  tStringHash('tr-m1-12', ['cat', 'act', 'dog', 'god', 'ant'], 7),
  tRkPatternHash('tr-m1-13', '31415', DIG),
  tRkRoll('tr-m1-14', '2359023141526739921', 5, 0, DIG),
  tRkWindowHashes('tr-m1-15', '2359023141526739921', '31415', DIG, 3),
  tRkSpurious('tr-m1-16', '2359023141526739921', '31415', DIG),
  tRkWindowHashes('tr-m1-17', 'abcab', 'ab', ALPHA, 2),
  tRkCharComparisons('tr-m1-18', '1234567812', '12', { base: 10, q: 7, values: 'digit' }),
  tRkSpurious('tr-m1-19', 'abacadab', 'ab', { base: 26, q: 5, values: 'alpha' }),
];

export { DEFAULT_RK };
