import type { Lesson } from '../../../types';

export const lessonLps: Lesson = {
  id: 'm2-lps',
  title: 'Prefix Function / LPS Array',
  subtitle: 'Longest Proper Prefix Which Is Also Suffix — сердце алгоритма KMP',
  topic: 'kmp',
  minutes: 30,
  blocks: [
    { kind: 'h2', text: 'Prefix, suffix и «proper»' },
    {
      kind: 'list',
      items: [
        '**Prefix (префикс)** строки — её начало. У «ABAB» префиксы: «A», «AB», «ABA», «ABAB».',
        '**Suffix (суффикс)** — её конец. У «ABAB» суффиксы: «B», «AB», «BAB», «ABAB».',
        '**Proper prefix / proper suffix (собственный)** — prefix/suffix, **не равный всей строке**. У «ABAB» proper prefixes: «A», «AB», «ABA».',
        '**Border** — строка, которая одновременно proper prefix и proper suffix. У «ABAB» border = «AB» (длина 2).',
      ],
    },
    {
      kind: 'warning',
      title: 'Почему именно proper',
      text: 'Вся строка тривиально является и префиксом, и суффиксом самой себя. Если её разрешить, ответ всегда был бы «длина строки», и информация была бы бесполезной. Поэтому **LPS[0] = 0 всегда**: у строки из одного символа нет непустого proper prefix.',
    },
    { kind: 'viz', id: 'prefix-suffix', caption: 'Введите строку и посмотрите на её proper prefixes / suffixes и borders' },

    { kind: 'h2', text: 'Определение LPS array' },
    {
      kind: 'p',
      text: '`LPS[i]` = длина самого длинного **proper prefix** строки `pattern[0..i]`, который одновременно является её **suffix**. Другими словами — длина самого длинного border префикса длины i + 1. Этот массив также называют **prefix function** (π-функция) или **failure function**.',
    },
    {
      kind: 'table',
      caption: 'LPS для pattern = "AABAACAABAA" — разберём каждую позицию',
      headers: ['i', 'pattern[0..i]', 'Самый длинный border', 'LPS[i]'],
      rows: [
        ['0', 'A', '— (proper prefix только пустой)', '0'],
        ['1', 'AA', 'A', '1'],
        ['2', 'AAB', '— (заканчивается на B, а начинается на A)', '0'],
        ['3', 'AABA', 'A', '1'],
        ['4', 'AABAA', 'AA', '2'],
        ['5', 'AABAAC', '—', '0'],
        ['6', 'AABAACA', 'A', '1'],
        ['7', 'AABAACAA', 'AA', '2'],
        ['8', 'AABAACAAB', 'AAB', '3'],
        ['9', 'AABAACAABA', 'AABA', '4'],
        ['10', 'AABAACAABAA', 'AABAA', '5'],
      ],
    },
    {
      kind: 'analogy',
      title: 'Эхо в конце фразы',
      text: 'Представьте, что вы произносите pattern по буквам. LPS[i] отвечает на вопрос: «Сколько последних произнесённых букв звучат так же, как начало слова?» Если вы сказали «A-A-B-A-A», то последние «A-A» — это начало слова «AA…». Значит, если сейчас вас перебьют, можно продолжить не с нуля, а с третьей буквы.',
    },

    { kind: 'h2', text: 'Как LPS вычисляется за O(m)' },
    {
      kind: 'p',
      text: 'Наивно можно для каждого i перебрать все длины и сравнить prefix/suffix — это O(m³) или O(m²). Умный способ использует уже посчитанные значения. Держим `length` — длину текущего border для `pattern[0..i-1]`, и пытаемся **продлить** его символом `pattern[i]`.',
    },
    {
      kind: 'code',
      caption: 'Построение LPS array',
      code: `def build_lps(pattern):
    m = len(pattern)
    lps = [0] * m          # lps[0] = 0 всегда
    length = 0             # длина текущего border
    i = 1
    while i < m:
        if pattern[i] == pattern[length]:
            length += 1
            lps[i] = length
            i += 1
        elif length > 0:
            length = lps[length - 1]   # откат: пробуем более короткий border
        else:
            lps[i] = 0
            i += 1
    return lps`,
      explain: [
        { line: 3, text: 'Массив из нулей: lps[0] = 0 по определению (proper prefix одного символа — пустой).' },
        { line: 4, text: 'length — длина border, который мы сейчас пытаемся продлить. Изначально 0.' },
        { line: 5, text: 'Начинаем с i = 1 (не с 0!), иначе сравним pattern[0] сам с собой и получим lps[0] = 1 — ошибка.' },
        { line: 7, text: 'Символ после border-префикса совпал с новым символом → border удлиняется на 1.' },
        { line: 9, text: 'Записываем ответ и переходим к следующему i.' },
        { line: 11, text: 'Не совпало, но border непустой → переходим к следующему по длине border: это border самого border, т.е. lps[length − 1].' },
        { line: 12, text: 'ВАЖНО: i не увеличиваем — тот же pattern[i] сравним с новым кандидатом.' },
        { line: 14, text: 'length = 0 и символы не совпали → border нет, lps[i] = 0.' },
      ],
    },
    {
      kind: 'note',
      title: 'Почему откат именно к lps[length − 1]?',
      text: 'Мы знаем, что `pattern[0..length-1]` == `pattern[i-length..i-1]` (это border). Следующий, более короткий кандидат должен быть одновременно **suffix** этого border и **prefix** pattern — то есть border самого border. Самый длинный такой — ровно `lps[length-1]`. Если сразу сбросить length в 0, можно потерять короткий border (см. «AAACAAAA» ниже).',
    },
    { kind: 'viz', id: 'lps-builder', caption: 'LPS builder: следите за указателями i и len' },

    {
      kind: 'steps',
      title: 'Пошагово: build_lps("AABAACAABAA")',
      steps: [
        { title: 'Старт', text: 'lps[0] = 0, length = 0, i = 1.', state: 'pattern: A A B A A C A A B A A\nlps:     0 · · · · · · · · · ·' },
        { title: 'i=1', text: "p[1]='A' == p[0]='A' → length=1, lps[1]=1.", state: 'lps:     0 1 · · · · · · · · ·' },
        { title: 'i=2 (откат)', text: "p[2]='B' ≠ p[1]='A', length>0 → length = lps[0] = 0 (i остаётся 2).", state: 'length = 0' },
        { title: 'i=2 (снова)', text: "p[2]='B' ≠ p[0]='A', length = 0 → lps[2]=0.", state: 'lps:     0 1 0 · · · · · · · ·' },
        { title: 'i=3, 4', text: "p[3]='A'==p[0] → lps[3]=1; p[4]='A'==p[1] → lps[4]=2.", state: 'lps:     0 1 0 1 2 · · · · · ·' },
        {
          title: 'i=5 (каскад откатов)',
          text: "p[5]='C' ≠ p[2]='B' → length = lps[1] = 1; 'C' ≠ p[1]='A' → length = lps[0] = 0; 'C' ≠ p[0] → lps[5] = 0.",
          state: 'lps:     0 1 0 1 2 0 · · · · ·',
        },
        {
          title: 'i=6..10',
          text: 'Каждый новый символ продлевает border: A, AA, AAB, AABA, AABAA.',
          state: 'lps:     0 1 0 1 2 0 1 2 3 4 5',
        },
      ],
    },
    {
      kind: 'steps',
      title: 'Ключевой пример отката: build_lps("AAACAAAA") = [0,1,2,0,1,2,3,3]',
      steps: [
        { title: 'i=1..2', text: 'AA, AAA → lps[1]=1, lps[2]=2.', state: 'lps: 0 1 2 · · · · ·' },
        { title: 'i=3', text: "'C' не совпадает ни с одним кандидатом: length 2 → 1 → 0 → lps[3]=0.", state: 'lps: 0 1 2 0 · · · ·' },
        { title: 'i=4..6', text: "'A','A','A' продлевают border до 1, 2, 3.", state: 'lps: 0 1 2 0 1 2 3 ·  (length = 3)' },
        {
          title: 'i=7: сравнение',
          text: "p[7]='A' ≠ p[3]='C' → length = lps[2] = **2** (не 0!).",
          state: 'border "AAA" → пробуем border "AA"',
        },
        {
          title: 'i=7: продление',
          text: "p[7]='A' == p[2]='A' → length = 3, lps[7] = 3. Если бы мы сбросили length в 0, получили бы lps[7] = 1 — неверно.",
          state: 'lps: 0 1 2 0 1 2 3 3',
        },
      ],
    },
    {
      kind: 'complexity',
      rows: [
        {
          op: 'build_lps',
          best: 'O(m)',
          avg: 'O(m)',
          worst: 'O(m)',
          space: 'O(m)',
          why: 'Каждая итерация либо увеличивает i (≤ m − 1 раз), либо уменьшает length. length растёт только вместе с i, поэтому уменьшиться может не больше m − 1 раз. Итого ≤ 2m итераций — amortized analysis.',
        },
      ],
    },
    {
      kind: 'mistakes',
      items: [
        { mistake: 'Считать всю строку border: LPS["AAAA"] = [1,2,3,4].', fix: 'Только proper prefix: правильно [0,1,2,3]; LPS[0] = 0 всегда.' },
        { mistake: 'При несовпадении ставить `length = 0`.', fix: '`length = lps[length - 1]` — иначе теряем короткие borders (пример «AAACAAAA»).' },
        { mistake: 'При несовпадении с length > 0 делать `i += 1`.', fix: 'i стоит на месте: тот же символ сравниваем с новым кандидатом.' },
        { mistake: 'Откат `length = lps[length]` (off-by-one).', fix: 'Border длины length заканчивается на индексе length − 1, поэтому `lps[length - 1]`.' },
        { mistake: 'Начинать с i = 0.', fix: 'Начинать с i = 1, иначе lps[0] станет 1.' },
      ],
    },
    {
      kind: 'selfcheck',
      items: [
        { q: 'Чему равен LPS для "ABCDE"?', a: '[0,0,0,0,0] — ни один proper prefix не равен suffix.' },
        { q: 'Чему равен LPS для "AAAA"?', a: '[0,1,2,3].' },
        { q: 'Что означает LPS[m−1] для всего pattern?', a: 'Длину самого длинного border всего pattern. После полного совпадения можно сдвинуть pattern на m − LPS[m−1].' },
        { q: 'Может ли LPS[i+1] быть больше LPS[i] + 1?', a: 'Нет. Border может вырасти максимум на 1 символ за шаг.' },
        { q: 'Почему build_lps работает за O(m), хотя внутри есть «откаты»?', a: 'Суммарно откатов не больше, чем увеличений length, а их ≤ m − 1. Amortized O(m).' },
      ],
    },
    {
      kind: 'practice',
      items: [
        { task: 'Постройте LPS для "ABABCABAB".', solution: '[0,0,1,2,0,1,2,3,4]. На i=4 (\'C\') откат 2 → lps[1]=0 → lps[4]=0.' },
        { task: 'Постройте LPS для "ABACABAB".', solution: '[0,0,1,0,1,2,3,2]. На i=7: border «ABA» (3), p[7]=\'B\' ≠ p[3]=\'C\' → length = lps[2] = 1, p[7]=\'B\' == p[1] → lps[7] = 2.' },
        { task: 'Постройте LPS для "AABAABAAA".', solution: '[0,1,0,1,2,3,4,5,2]. На i=8: length 5 → lps[4]=2 → p[8]=\'A\' ≠ p[2]=\'B\' → lps[1]=1 → p[8] == p[1]=\'A\' → lps[8]=2.' },
        { task: 'Постройте LPS для "ABCABCAB".', solution: '[0,0,0,1,2,3,4,5].' },
      ],
    },
    {
      kind: 'summary',
      items: [
        'LPS[i] — длина самого длинного proper prefix строки pattern[0..i], который также её suffix.',
        'LPS[0] = 0 всегда; вся строка не считается.',
        'При совпадении: length++, lps[i] = length, i++. При несовпадении и length > 0: length = lps[length−1], i не двигается. Иначе lps[i] = 0, i++.',
        'Построение — O(m) времени и O(m) памяти.',
      ],
    },
  ],
  miniExam: [
    {
      id: 'mini-m2-lps-1',
      module: 'm2',
      topic: 'kmp',
      category: 'code',
      question: 'Чему равен LPS array для pattern = "ABAB"?',
      options: ['[0,0,1,2]', '[0,1,2,3]', '[1,0,1,2]', '[0,0,1,1]'],
      correct: 0,
      explanation: 'A→0; AB→0; ABA: border «A»→1; ABAB: border «AB»→2.',
    },
    {
      id: 'mini-m2-lps-2',
      module: 'm2',
      topic: 'kmp',
      category: 'code',
      question: 'Чему равен LPS array для pattern = "AAACAAAA"?',
      options: ['[0,1,2,0,1,2,3,1]', '[0,1,2,0,1,2,3,4]', '[0,1,2,0,1,2,3,3]', '[0,1,2,3,1,2,3,3]'],
      correct: 2,
      explanation: 'На i=7: border «AAA», p[7]=\'A\' ≠ p[3]=\'C\' → length = lps[2] = 2, затем p[7] == p[2] → lps[7] = 3.',
    },
    {
      id: 'mini-m2-lps-3',
      module: 'm2',
      topic: 'kmp',
      category: 'definition',
      question: 'Почему LPS[0] всегда равен 0?',
      options: [
        'Так удобнее программировать',
        'У строки из одного символа единственный proper prefix — пустая строка',
        'Потому что индексы начинаются с 0',
        'Это не так: LPS[0] = 1',
      ],
      correct: 1,
      explanation: 'Proper prefix не может совпадать со всей строкой; у строки длины 1 остаётся только пустой prefix.',
    },
    {
      id: 'mini-m2-lps-4',
      module: 'm2',
      topic: 'kmp',
      category: 'principle',
      question: 'Что делает build_lps, если pattern[i] ≠ pattern[length] и length > 0?',
      options: ['length = 0; i += 1', 'length = lps[length − 1]; i не меняется', 'lps[i] = length − 1; i += 1', 'length = lps[i − 1]; i += 1'],
      correct: 1,
      explanation: 'Переходим к следующему кандидату — border текущего border — и снова сравниваем тот же pattern[i].',
    },
    {
      id: 'mini-m2-lps-5',
      module: 'm2',
      topic: 'kmp',
      category: 'time',
      question: 'Какова time complexity построения LPS array для pattern длины m?',
      options: ['O(m²)', 'O(m log m)', 'O(m)', 'O(1)'],
      correct: 2,
      explanation: 'Amortized: ≤ m−1 увеличений i и ≤ m−1 уменьшений length → ≤ 2m итераций.',
    },
    {
      id: 'mini-m2-lps-6',
      module: 'm2',
      topic: 'kmp',
      category: 'code',
      question: 'Чему равен LPS[8] для pattern = "AABAABAAA" (индексы с 0)?',
      options: ['5', '6', '1', '2'],
      correct: 3,
      explanation: 'LPS = [0,1,0,1,2,3,4,5,2]. На i=8 откаты 5 → 2 → 1, затем совпадение p[8] == p[1] → 2.',
    },
    {
      id: 'mini-m2-lps-7',
      module: 'm2',
      topic: 'kmp',
      category: 'definition',
      question: 'Какие из строк — borders строки "ABACABA"?',
      options: ['A, ABA', 'A, ABA, ABACABA', 'ABA, CABA', 'A, AB, ABA'],
      correct: 0,
      explanation: 'Proper prefixes, равные suffixes: «A» и «ABA». Вся строка не proper; «AB» ≠ «BA».',
    },
  ],
};
