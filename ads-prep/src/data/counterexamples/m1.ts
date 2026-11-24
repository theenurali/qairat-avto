import type { CounterexampleTask } from '../../types';
import { mod } from '../../lib/algorithms/hashing';
import { rabinKarp, naiveSearch, type RKParams } from '../../lib/algorithms/rabinKarp';
import { LoopLimit, compareRuns, fmtList, parseInts, parseOps, parseSize, type HashOp } from './util';

/* ---------- маленькие эмуляторы Python-кода (правильный и багованный) ---------- */

type Cell = number | null | 'DEL';

function runOpen(m: number, ops: HashOp[], emptyOnDelete: boolean): string {
  const t: Cell[] = Array.from({ length: m }, () => null);
  const out: string[] = [];
  const find = (k: number): number => {
    const h = mod(k, m);
    for (let i = 0; i < m; i++) {
      const idx = (h + i) % m;
      if (t[idx] === null) return -1;
      if (t[idx] === k) return idx;
    }
    return -1;
  };
  for (const { op, key } of ops) {
    if (op === 'insert') {
      if (find(key) !== -1) continue;
      const h = mod(key, m);
      for (let i = 0; i < m; i++) {
        const idx = (h + i) % m;
        if (t[idx] === null || t[idx] === 'DEL') {
          t[idx] = key;
          break;
        }
      }
    } else if (op === 'delete') {
      const idx = find(key);
      if (idx !== -1) t[idx] = emptyOnDelete ? null : 'DEL';
    } else out.push(`search(${key}) → ${find(key) !== -1}`);
  }
  return out.length ? out.join('; ') : '(нет операций search)';
}

const cxDeleteEmpty: CounterexampleTask = {
  id: 'cx-m1-1',
  module: 'm1',
  topic: 'hash',
  difficulty: 2,
  title: 'Linear Probing: delete ставит None',
  goal: 'Hash table с Linear Probing должна поддерживать insert, delete и search. После удаления ключа поиск ДРУГИХ ключей должен работать корректно.',
  buggyCode: `def delete(table, key):
    m = len(table)
    h = key % m
    for i in range(m):
        idx = (h + i) % m
        if table[idx] is None:
            return
        if table[idx] == key:
            table[idx] = None        # удаляем
            return

def search(table, key):
    m = len(table)
    h = key % m
    for i in range(m):
        idx = (h + i) % m
        if table[idx] is None:
            return False
        if table[idx] == key:
            return True
    return False`,
  bugLine: 9,
  hint: 'Поиск останавливается на первой пустой ячейке (None). Что если ключ был размещён ДАЛЬШЕ удалённой ячейки из-за collision?',
  fields: [
    { name: 'm', label: 'Размер таблицы m', placeholder: '7' },
    { name: 'ops', label: 'Операции: +k insert, -k delete, ?k search', placeholder: '+3 +10 ?10 -3 ?3', type: 'area' },
  ],
  initial: { m: '7', ops: '+3 +10 ?10 -3 ?3' },
  sample: { m: '7', ops: '+3 +10 -3 ?10' },
  evaluate: (input) => {
    const ms = parseSize(input.m ?? '');
    if (ms.error) return { error: ms.error, buggy: '', correct: '', broken: false };
    const po = parseOps(input.ops ?? '');
    if (po.error) return { error: po.error, buggy: '', correct: '', broken: false };
    return compareRuns(() => runOpen(ms.value!, po.ops!, true), () => runOpen(ms.value!, po.ops!, false));
  },
  explanation:
    'm = 7: ключ 3 → slot 3, ключ 10 → h = 3 занят → slot 4. delete(3) ставит None в slot 3. search(10) начинает с slot 3, видит None и решает, что ключа нет — хотя 10 лежит в slot 4. Ошибка: при Open Addressing нельзя ставить EMPTY при удалении — это разрывает цепочку проб. Нужен tombstone (DEL): search его пропускает, insert может переиспользовать.',
  fixedCode: `        if table[idx] == key:
            table[idx] = DEL         # tombstone, а не None`,
};

function runWrap(m: number, keys: number[], buggy: boolean): string {
  const t: (number | null)[] = Array.from({ length: m }, () => null);
  for (const k of keys) {
    const h = mod(k, m);
    let placed = false;
    for (let i = 0; i < m; i++) {
      const idx = buggy ? h + i : (h + i) % m;
      if (idx >= m) throw new LoopLimit('index');
      if (t[idx] === null) {
        t[idx] = k;
        placed = true;
        break;
      }
    }
    if (!placed) return `Exception: table is full (ключ ${k})`;
  }
  return fmtList(t.map((x) => (x === null ? '_' : x)));
}

const cxNoWrap: CounterexampleTask = {
  id: 'cx-m1-2',
  module: 'm1',
  topic: 'hash',
  difficulty: 1,
  title: 'Linear Probing без wrap-around',
  goal: 'Вставить все ключи в таблицу размера m методом Linear Probing. Проба должна «заворачивать» с конца таблицы на начало.',
  buggyCode: `def insert_all(m, keys):
    table = [None] * m
    for key in keys:
        h = key % m
        for i in range(m):
            idx = h + i
            if table[idx] is None:
                table[idx] = key
                break
    return table`,
  bugLine: 6,
  hint: 'Что будет, если h + i ≥ m?',
  fields: [
    { name: 'm', label: 'Размер таблицы m', placeholder: '5' },
    { name: 'keys', label: 'Ключи', placeholder: '1, 2, 3' },
  ],
  initial: { m: '5', keys: '1, 2, 3' },
  sample: { m: '5', keys: '4, 9' },
  evaluate: (input) => {
    const ms = parseSize(input.m ?? '');
    if (ms.error) return { error: ms.error, buggy: '', correct: '', broken: false };
    const pk = parseInts(input.keys ?? '');
    if (pk.error) return { error: pk.error, buggy: '', correct: '', broken: false };
    if (pk.values!.length > ms.value!) return { error: 'Ключей больше, чем ячеек', buggy: '', correct: '', broken: false };
    return compareRuns(() => runWrap(ms.value!, pk.values!, true), () => runWrap(ms.value!, pk.values!, false));
  },
  explanation:
    'm = 5: ключ 4 → slot 4. Ключ 9: h = 4 занят, следующая проба idx = 4 + 1 = 5 — такой ячейки нет → IndexError. Правильно: idx = (h + i) % m = 0. Ошибка проявляется, только когда collision случается в ПОСЛЕДНИХ ячейках таблицы — поэтому тест «1, 2, 3» её не находит.',
  fixedCode: `            idx = (h + i) % m          # wrap-around`,
};

function runChainSize(ops: number[], buggy: boolean, m = 5): string {
  const buckets: number[][] = Array.from({ length: m }, () => []);
  let size = 0;
  for (const k of ops) {
    const b = mod(k, m);
    if (buggy || !buckets[b].includes(k)) {
      buckets[b] = [...buckets[b], k];
      size++;
    }
  }
  return `size = ${size}`;
}

const cxChainDup: CounterexampleTask = {
  id: 'cx-m1-3',
  module: 'm1',
  topic: 'hash',
  difficulty: 1,
  title: 'Separate Chaining: дубликаты',
  goal: 'Hash set на Separate Chaining (m = 5). insert(key) добавляет ключ, если его ещё нет; size — количество РАЗНЫХ ключей в множестве.',
  buggyCode: `class HashSet:
    def __init__(self, m=5):
        self.buckets = [[] for _ in range(m)]
        self.size = 0

    def insert(self, key):
        b = key % len(self.buckets)
        self.buckets[b].append(key)
        self.size += 1`,
  bugLine: 8,
  hint: 'Что произойдёт при повторной вставке того же ключа?',
  fields: [{ name: 'keys', label: 'Последовательность insert', placeholder: '1, 6, 11' }],
  initial: { keys: '1, 6, 11' },
  sample: { keys: '5, 5' },
  evaluate: (input) => {
    const pk = parseInts(input.keys ?? '');
    if (pk.error) return { error: pk.error, buggy: '', correct: '', broken: false };
    return compareRuns(() => runChainSize(pk.values!, true), () => runChainSize(pk.values!, false));
  },
  explanation:
    'insert(5), insert(5): багованный код кладёт 5 в bucket 0 дважды, size = 2, хотя множество содержит один ключ. Collisions (1, 6, 11 в одном bucket) обрабатываются нормально — ломает именно отсутствие проверки «ключ уже есть в цепочке». Чтобы найти такой баг, всегда пробуйте повторяющиеся входные данные.',
  fixedCode: `        if key not in self.buckets[b]:
            self.buckets[b].append(key)
            self.size += 1`,
};

function sumHash(s: string): number {
  let x = 0;
  for (const c of s) x += c.charCodeAt(0);
  return x;
}

function runHashCompare(words: string[], query: string, buggy: boolean, m = 7): string {
  const buckets: { key: string; h: number }[][] = Array.from({ length: m }, () => []);
  for (const w of words) {
    const h = sumHash(w);
    buckets[h % m] = [...buckets[h % m], { key: w, h }];
  }
  const h = sumHash(query);
  const found = buckets[h % m].some((e) => (buggy ? e.h === h : e.key === query));
  return `contains("${query}") → ${found}`;
}

const cxHashNotKey: CounterexampleTask = {
  id: 'cx-m1-4',
  module: 'm1',
  topic: 'hash',
  difficulty: 2,
  title: 'Сравнение хешей вместо ключей',
  goal: 'contains(s) должен вернуть True, только если строка s была вставлена. Таблица: Separate Chaining, m = 7, h(s) = sum(ord(c)).',
  buggyCode: `def h(s):
    return sum(ord(c) for c in s)

def insert(buckets, s):
    buckets[h(s) % 7].append((s, h(s)))

def contains(buckets, s):
    for key, hv in buckets[h(s) % 7]:
        if hv == h(s):
            return True
    return False`,
  bugLine: 9,
  hint: 'Одинаковый хеш не означает одинаковый ключ. Какие разные строки дают одинаковую сумму кодов?',
  fields: [
    { name: 'words', label: 'Вставленные строки (через запятую)', placeholder: 'cat, dog' },
    { name: 'query', label: 'Строка для contains', placeholder: 'cow' },
  ],
  initial: { words: 'cat, dog', query: 'cow' },
  sample: { words: 'listen', query: 'silent' },
  evaluate: (input) => {
    const words = (input.words ?? '').split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
    const query = (input.query ?? '').trim();
    if (words.length === 0) return { error: 'Введите хотя бы одну строку', buggy: '', correct: '', broken: false };
    if (!query) return { error: 'Введите строку для поиска', buggy: '', correct: '', broken: false };
    if (words.length > 30 || words.some((w) => w.length > 30)) return { error: 'Слишком длинный ввод', buggy: '', correct: '', broken: false };
    return compareRuns(() => runHashCompare(words, query, true), () => runHashCompare(words, query, false));
  },
  explanation:
    '"listen" и "silent" — анаграммы: одинаковые буквы → одинаковая сумма кодов → одинаковый hash. Код сравнивает только хеши и возвращает True для строки, которой нет в таблице (false positive). Collision — это нормально, но внутри bucket обязательно нужно сравнивать сами ключи (key == s).',
  fixedCode: `        if key == s:                # сравниваем КЛЮЧИ, а не хеши
            return True`,
};

function rkCustom(text: string, pat: string, p: RKParams, mode: 'noverify' | 'noh' | 'bound'): number[] {
  const n = text.length;
  const m = pat.length;
  if (m === 0 || m > n) return [];
  const v = (c: string) => c.charCodeAt(0) - (p.values === 'digit' ? 48 : 0);
  let h = 1;
  for (let i = 0; i < m - 1; i++) h = (h * p.base) % p.q;
  let ph = 0;
  let t = 0;
  for (let i = 0; i < m; i++) {
    ph = mod(p.base * ph + v(pat[i]), p.q);
    t = mod(p.base * t + v(text[i]), p.q);
  }
  const res: number[] = [];
  const last = mode === 'bound' ? n - m - 1 : n - m;
  for (let s = 0; s <= last; s++) {
    if (ph === t && (mode === 'noverify' || text.slice(s, s + m) === pat)) res.push(s);
    if (s < n - m) {
      const out = mode === 'noh' ? v(text[s]) : v(text[s]) * h;
      t = mod(p.base * (t - out) + v(text[s + m]), p.q);
    }
  }
  return res;
}

const DIG: RKParams = { base: 10, q: 13, values: 'digit' };
const ORD: RKParams = { base: 256, q: 101, values: 'ord' };

function digitsInput(input: Record<string, string>): { text?: string; pat?: string; error?: string } {
  const text = (input.text ?? '').trim();
  const pat = (input.pattern ?? '').trim();
  if (!/^\d+$/.test(text) || !/^\d+$/.test(pat)) return { error: 'В этой задаче text и pattern — строки из цифр 0-9' };
  if (text.length > 60) return { error: 'Текст слишком длинный (максимум 60)' };
  return { text, pat };
}

const cxRkNoVerify: CounterexampleTask = {
  id: 'cx-m1-5',
  module: 'm1',
  topic: 'rk',
  difficulty: 2,
  title: 'Rabin-Karp без проверки символов',
  goal: 'Вернуть все позиции, где pattern встречается в text. Параметры: d = 10, q = 13, символы — цифры.',
  buggyCode: `def rabin_karp(text, pat, d=10, q=13):
    n, m = len(text), len(pat)
    h = pow(d, m - 1, q)
    p = t = 0
    for i in range(m):
        p = (d * p + int(pat[i])) % q
        t = (d * t + int(text[i])) % q
    res = []
    for s in range(n - m + 1):
        if p == t:
            res.append(s)               # совпал хеш → считаем вхождением
        if s < n - m:
            t = (d * (t - int(text[s]) * h) + int(text[s + m])) % q
    return res`,
  bugLine: 10,
  hint: 'Хеш — это остаток по модулю 13. Сколько разных чисел может дать одинаковый остаток?',
  fields: [
    { name: 'text', label: 'text (цифры)', placeholder: '123123' },
    { name: 'pattern', label: 'pattern (цифры)', placeholder: '123' },
  ],
  initial: { text: '123123', pattern: '123' },
  sample: { text: '26', pattern: '13' },
  evaluate: (input) => {
    const d = digitsInput(input);
    if (d.error) return { error: d.error, buggy: '', correct: '', broken: false };
    return compareRuns(() => fmtList(rkCustom(d.text!, d.pat!, DIG, 'noverify')), () => fmtList(naiveSearch(d.text!, d.pat!)));
  },
  explanation:
    'Хеш окна из цифр — это само число mod 13. Числа 13 и 26 дают одинаковый остаток 0. text = "26", pattern = "13": хеш окна "26" = 0 = хеш образца → багованный код возвращает [0], хотя "26" ≠ "13" (spurious hit). Классический пример из CLRS: text = "2359023141526739921", pattern = "31415" — окно "67399" в позиции 12 тоже даёт хеш 7, как и образец. Вывод: после совпадения хешей ОБЯЗАТЕЛЬНО сравнивать строки посимвольно. Чтобы найти такой контрпример, ищите два разных числа длины m с одинаковым остатком по q (отличаются на кратное q).',
  fixedCode: `        if p == t and text[s:s + m] == pat:   # проверяем символы
            res.append(s)`,
};

const cxRkNoH: CounterexampleTask = {
  id: 'cx-m1-6',
  module: 'm1',
  topic: 'rk',
  difficulty: 3,
  title: 'Rolling hash без множителя h',
  goal: 'Rabin-Karp (d = 10, q = 13, цифры) должен найти все вхождения. Rolling hash: убрать старшую цифру, сдвинуть, добавить новую.',
  buggyCode: `def rabin_karp(text, pat, d=10, q=13):
    n, m = len(text), len(pat)
    p = t = 0
    for i in range(m):
        p = (d * p + int(pat[i])) % q
        t = (d * t + int(text[i])) % q
    res = []
    for s in range(n - m + 1):
        if p == t and text[s:s + m] == pat:
            res.append(s)
        if s < n - m:
            t = (d * (t - int(text[s])) + int(text[s + m])) % q
    return res`,
  bugLine: 12,
  hint: 'Старшая цифра окна весит d^(m−1), а не 1. При каком m это не имеет значения?',
  fields: [
    { name: 'text', label: 'text (цифры)', placeholder: '1212' },
    { name: 'pattern', label: 'pattern (цифры)', placeholder: '2' },
  ],
  initial: { text: '1212', pattern: '2' },
  sample: { text: '123', pattern: '23' },
  evaluate: (input) => {
    const d = digitsInput(input);
    if (d.error) return { error: d.error, buggy: '', correct: '', broken: false };
    return compareRuns(() => fmtList(rkCustom(d.text!, d.pat!, DIG, 'noh')), () => fmtList(naiveSearch(d.text!, d.pat!)));
  },
  explanation:
    'text = "123", pattern = "23" (m = 2). Хеш образца 23 mod 13 = 10. t₀ = 12. Правильный rolling: (10·(12 − 1·10) + 3) mod 13 = 23 mod 13 = 10 → найдено в позиции 1. Багованный: (10·(12 − 1) + 3) mod 13 = 113 mod 13 = 9 ≠ 10 → вхождение потеряно. При m = 1 множитель h = d⁰ = 1, поэтому тесты с образцом из одного символа баг не находят.',
  fixedCode: `    h = pow(d, m - 1, q)
    ...
            t = (d * (t - int(text[s]) * h) + int(text[s + m])) % q`,
};

const cxRkBound: CounterexampleTask = {
  id: 'cx-m1-7',
  module: 'm1',
  topic: 'rk',
  difficulty: 1,
  title: 'Rabin-Karp: граница цикла',
  goal: 'Найти все вхождения pattern в text (d = 256, q = 101, val = ord).',
  buggyCode: `def rabin_karp(text, pat, d=256, q=101):
    n, m = len(text), len(pat)
    h = pow(d, m - 1, q)
    p = t = 0
    for i in range(m):
        p = (d * p + ord(pat[i])) % q
        t = (d * t + ord(text[i])) % q
    res = []
    for s in range(n - m):
        if p == t and text[s:s + m] == pat:
            res.append(s)
        t = (d * (t - ord(text[s]) * h) + ord(text[s + m])) % q
    return res`,
  bugLine: 9,
  hint: 'Сколько всего окон длины m в тексте длины n? Какое окно последнее?',
  fields: [
    { name: 'text', label: 'text', placeholder: 'abcabc' },
    { name: 'pattern', label: 'pattern', placeholder: 'ab' },
  ],
  initial: { text: 'abcabc', pattern: 'ab' },
  sample: { text: 'xab', pattern: 'ab' },
  evaluate: (input) => {
    const text = input.text ?? '';
    const pat = input.pattern ?? '';
    if (!text || !pat) return { error: 'Введите text и pattern', buggy: '', correct: '', broken: false };
    if (text.length > 60) return { error: 'Текст слишком длинный (максимум 60)', buggy: '', correct: '', broken: false };
    return compareRuns(() => fmtList(rkCustom(text, pat, ORD, 'bound')), () => fmtList(rabinKarp(text, pat, ORD).matches));
  },
  explanation:
    'Окон n − m + 1, а range(n − m) перебирает только n − m из них — последнее окно не проверяется. text = "xab", pattern = "ab": вхождение в позиции 1 = n − m — его багованный код пропускает. Пограничные случаи (вхождение в самом конце, pattern == text) — первое, что надо проверять в задачах на поиск подстроки.',
  fixedCode: `    for s in range(n - m + 1):
        ...
        if s < n - m:
            t = (d * (t - ord(text[s]) * h) + ord(text[s + m])) % q`,
};

function runResize(keys: number[], query: number, buggy: boolean): string {
  let m = 4;
  let t: (number | null)[] = [null, null, null, null];
  let n = 0;
  const put = (tab: (number | null)[], k: number) => {
    const mm = tab.length;
    for (let i = 0; i < mm; i++) {
      const idx = (mod(k, mm) + i) % mm;
      if (tab[idx] === null) {
        tab[idx] = k;
        return;
      }
    }
  };
  for (const k of keys) {
    if (t.includes(k)) continue;
    put(t, k);
    n++;
    if (n / m > 0.5) {
      const nt: (number | null)[] = Array.from({ length: 2 * m }, () => null);
      if (buggy) t.forEach((x, i) => (nt[i] = x));
      else t.forEach((x) => x !== null && put(nt, x));
      t = nt;
      m *= 2;
    }
  }
  const h = mod(query, m);
  for (let i = 0; i < m; i++) {
    const idx = (h + i) % m;
    if (t[idx] === null) return `search(${query}) → False`;
    if (t[idx] === query) return `search(${query}) → True`;
  }
  return `search(${query}) → False`;
}

const cxResize: CounterexampleTask = {
  id: 'cx-m1-8',
  module: 'm1',
  topic: 'hash',
  difficulty: 3,
  title: 'Rehashing: копирование по старым индексам',
  goal: 'Linear Probing, начальный m = 4. Когда α = n/m > 0.5, таблица удваивается. После resize search должен находить все вставленные ключи.',
  buggyCode: `def resize(self):
    old = self.table
    self.m *= 2
    self.table = [None] * self.m
    for i, key in enumerate(old):
        self.table[i] = key          # копируем на тот же индекс

def insert(self, key):
    self._put(key)                   # linear probing по key % self.m
    self.n += 1
    if self.n / self.m > 0.5:
        self.resize()`,
  bugLine: 6,
  hint: 'После resize меняется m — значит меняется и key % m. Где search будет искать ключ?',
  fields: [
    { name: 'keys', label: 'Вставляемые ключи', placeholder: '1, 2, 3' },
    { name: 'query', label: 'search(key)', placeholder: '2' },
  ],
  initial: { keys: '1, 2, 3', query: '2' },
  sample: { keys: '1, 5, 6', query: '6' },
  evaluate: (input) => {
    const pk = parseInts(input.keys ?? '');
    if (pk.error) return { error: pk.error, buggy: '', correct: '', broken: false };
    const pq = parseInts(input.query ?? '', 'ключ для поиска');
    if (pq.error) return { error: pq.error, buggy: '', correct: '', broken: false };
    if (pk.values!.length > 20) return { error: 'Максимум 20 ключей', buggy: '', correct: '', broken: false };
    return compareRuns(() => runResize(pk.values!, pq.values![0], true), () => runResize(pk.values!, pq.values![0], false));
  },
  explanation:
    'm = 4: 1 → slot 1, 5 → slot 1 занят → slot 2, 6 → slot 2 занят → slot 3. Теперь α = 3/4 > 0.5 → resize до m = 8. Багованный resize оставляет 6 в slot 3, но search(6) начинает с 6 mod 8 = 6 → там None → False. При rehashing каждый ключ нужно ВСТАВИТЬ заново с новым m. Ключи, которые лежали на «своих» местах без collision и с k < 4, баг не выдают — поэтому нужен пример с collision или с большими ключами.',
  fixedCode: `    for key in old:
        if key is not None and key != DEL:
            self._put(key)           # заново вычисляем key % new_m`,
};

export const CX_M1: CounterexampleTask[] = [cxChainDup, cxNoWrap, cxRkBound, cxDeleteEmpty, cxHashNotKey, cxRkNoVerify, cxRkNoH, cxResize];
