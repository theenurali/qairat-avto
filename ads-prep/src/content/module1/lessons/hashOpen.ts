import type { Lesson } from '../../../types';
import { openSteps } from './helpers';

const OPEN_CODE = `EMPTY, DELETED = None, 'DEL'

def probe(key, i, m, mode='linear'):
    h = key % m
    if mode == 'linear':
        return (h + i) % m          # h, h+1, h+2, h+3, ...
    return (h + i * i) % m          # h, h+1, h+4, h+9, ...

def insert(table, key, mode='linear'):
    m = len(table)
    for i in range(m):
        idx = probe(key, i, m, mode)
        if table[idx] is EMPTY or table[idx] == DELETED:
            table[idx] = key
            return idx
    raise Exception('no free slot found')

def search(table, key, mode='linear'):
    m = len(table)
    for i in range(m):
        idx = probe(key, i, m, mode)
        if table[idx] is EMPTY:
            return -1               # дошли до пустой ячейки — ключа точно нет
        if table[idx] == key:
            return idx              # нашли; DEL просто пропускаем
    return -1

def delete(table, key, mode='linear'):
    idx = search(table, key, mode)
    if idx != -1:
        table[idx] = DELETED        # tombstone, а НЕ EMPTY!`;

const OPEN_CPP = `const int EMPTY = -1;                    // пустая ячейка (ключи ≥ 0)
const int DEL = -2;                      // tombstone

int probe(int key, int i, int m, bool linear = true) {
    int h = key % m;
    if (linear)
        return (h + i) % m;              // h, h+1, h+2, h+3, ...
    return (h + i * i) % m;              // h, h+1, h+4, h+9, ...
}

int insert(vector<int>& table, int key, bool linear = true) {
    int m = table.size();
    for (int i = 0; i < m; i++) {
        int idx = probe(key, i, m, linear);
        if (table[idx] == EMPTY || table[idx] == DEL) {
            table[idx] = key;
            return idx;
        }
    }
    throw runtime_error("no free slot found");
}

int search(const vector<int>& table, int key, bool linear = true) {
    int m = table.size();
    for (int i = 0; i < m; i++) {
        int idx = probe(key, i, m, linear);
        if (table[idx] == EMPTY)
            return -1;                   // дошли до пустой ячейки — ключа точно нет
        if (table[idx] == key)
            return idx;                  // нашли; DEL просто пропускаем
    }
    return -1;
}

void remove(vector<int>& table, int key, bool linear = true) {
    int idx = search(table, key, linear);
    if (idx != -1)
        table[idx] = DEL;                // tombstone, а НЕ EMPTY!
}`;

export const hashOpenLesson: Lesson = {
  id: 'm1-hash-open',
  title: 'Open Addressing: Linear & Quadratic Probing',
  subtitle: 'Все ключи — прямо в массиве. Пробы, кластеры и tombstones',
  topic: 'hash',
  minutes: 35,
  blocks: [
    { kind: 'h2', text: 'Идея Open Addressing' },
    {
      kind: 'p',
      text: 'В **Open Addressing** (открытой адресации) нет цепочек: каждый slot массива хранит **не больше одного ключа**. Если «родная» ячейка h(k) занята, мы по определённому правилу проверяем другие ячейки — это называется **probing** (пробирование), а последовательность проверяемых индексов — **probe sequence**.',
    },
    {
      kind: 'analogy',
      title: 'Парковка',
      text: 'Ваше любимое место на парковке — №3 (это h(k)). Если оно занято, вы едете к №4, потом к №5… пока не найдёте свободное (linear probing). А чтобы потом найти машину, вы идёте тем же маршрутом: 3, 4, 5… Если по дороге встретили **пустое** место, которое никогда не было занято, значит дальше вашей машины быть не может — вы бы припарковались здесь.',
    },
    {
      kind: 'p',
      text: 'Общая формула: i-я проба (i = 0, 1, 2, …) смотрит в ячейку `probe(k, i)`. При i = 0 это всегда h(k) = k mod m.',
    },
    {
      kind: 'table',
      headers: ['Метод', 'Формула i-й пробы', 'Последовательность при h = 3, m = 11'],
      rows: [
        ['**Linear Probing**', '(h(k) + i) mod m', '3, 4, 5, 6, 7, …'],
        ['**Quadratic Probing**', '(h(k) + i²) mod m', '3, 4, 7, 12 mod 11 = 1, 19 mod 11 = 8, …'],
      ],
      caption: 'Соглашение этого курса: quadratic probing — именно (h + i²) mod m, без дополнительных коэффициентов c₁, c₂.',
    },
    { kind: 'h2', text: 'Linear Probing (линейное пробирование)' },
    {
      kind: 'p',
      text: 'Проверяем ячейки подряд: h, h+1, h+2, … (по модулю m, то есть после последней ячейки переходим к ячейке 0 — **wrap-around**).',
    },
    {
      kind: 'steps',
      title: 'Linear probing: m = 7, вставляем 50, 700, 76, 85, 92, 73',
      steps: openSteps(7, [50, 700, 76, 85, 92, 73], 'linear'),
    },
    {
      kind: 'warning',
      title: 'Primary clustering (первичная кластеризация)',
      text: 'Посмотрите на ячейки 0–4: образовался сплошной занятый блок — **cluster**. Любой новый ключ, попавший в любую ячейку кластера, «проползёт» до его конца и сделает кластер ещё длиннее. Чем длиннее кластер, тем быстрее он растёт. Это главный недостаток linear probing.',
    },
    { kind: 'h2', text: 'Quadratic Probing (квадратичное пробирование)' },
    {
      kind: 'p',
      text: 'Шаг растёт квадратично: h, h+1, h+4, h+9, h+16, … Ключи, столкнувшиеся в одной ячейке, «разлетаются» дальше друг от друга, и сплошные кластеры не образуются.',
    },
    {
      kind: 'steps',
      title: 'Quadratic probing: те же ключи 50, 700, 76, 85, 92, 73, m = 7',
      steps: openSteps(7, [50, 700, 76, 85, 92, 73], 'quadratic'),
    },
    {
      kind: 'list',
      items: [
        '**Плюс:** нет primary clustering.',
        '**Минус — secondary clustering**: ключи с одинаковым h(k) проходят **одну и ту же** probe sequence.',
        '**Минус:** quadratic probing может **не найти** свободную ячейку, даже если она есть! Гарантия есть, если m — простое число и таблица заполнена не больше чем наполовину (α ≤ 1/2).',
      ],
    },
    {
      kind: 'note',
      title: 'Пример, когда quadratic probing «застревает»',
      text: 'm = 4, h = 0. Пробы: 0, 1, 4 mod 4 = 0, 9 mod 4 = 1, 16 mod 4 = 0… Ячейки 2 и 3 никогда не проверяются! Поэтому для quadratic probing берут простое m и держат α ≤ 0.5.',
    },
    { kind: 'h2', text: 'Search (поиск) в Open Addressing' },
    {
      kind: 'p',
      text: 'Поиск идёт по **той же** probe sequence, что и вставка: h(k), затем следующие пробы. Останавливаемся, когда:',
    },
    {
      kind: 'list',
      items: [
        'нашли ключ → **found**;',
        'встретили **EMPTY** (ячейку, где никогда ничего не было) → ключа **точно нет**: если бы он был, его бы положили сюда или раньше;',
        'проверили все m проб → ключа нет.',
      ],
    },
    { kind: 'h2', text: 'Delete и Tombstones (надгробия)' },
    {
      kind: 'p',
      text: 'Удаление — самое коварное место open addressing. Если удалённую ячейку просто сделать EMPTY, **поиск других ключей сломается**: он остановится на «дырке» и решит, что ключа нет.',
    },
    {
      kind: 'steps',
      title: 'Почему нельзя ставить EMPTY при удалении (linear probing, m = 7)',
      steps: [
        {
          title: 'Исходная таблица',
          text: 'Таблица после вставки 50, 700, 76, 85, 92, 73. Ключ 92 имеет h = 1, но лежит в slot 3 (пробы 1 → 2 → 3).',
          state: 'index:   0   1   2   3   4   5   6\nvalue: 700  50  85  92  73   _  76',
        },
        {
          title: '❌ Неправильно: delete(85) ставит EMPTY',
          text: 'Slot 2 становится пустым. Теперь search(92): slot 1 = 50 ≠ 92, slot 2 = EMPTY → STOP → «92 нет». Но 92 лежит в slot 3! Ошибка.',
          state: 'index:   0   1   2   3   4   5   6\nvalue: 700  50   _  92  73   _  76',
        },
        {
          title: '✅ Правильно: delete(85) ставит DEL (tombstone)',
          text: 'Slot 2 помечен DEL. search(92): slot 1 = 50, slot 2 = DEL → пропускаем и идём дальше, slot 3 = 92 → found.',
          state: 'index:   0   1   2   3   4   5   6\nvalue: 700  50 DEL  92  73   _  76',
        },
        {
          title: 'Вставка может переиспользовать DEL',
          text: 'insert(22): h(22) = 1 → slot 1 занят (50), slot 2 = DEL → можно положить сюда. Tombstone снова становится обычной занятой ячейкой.',
          state: 'index:   0   1   2   3   4   5   6\nvalue: 700  50  22  92  73   _  76',
        },
      ],
    },
    {
      kind: 'tip',
      title: 'Правило трёх состояний ячейки',
      text: '**EMPTY** — никогда не было ключа: поиск останавливается, вставка может занять. **DEL** — ключ был и удалён: поиск **проходит мимо**, вставка может занять. **Ключ** — занято: поиск сравнивает, вставка идёт дальше.',
    },
    {
      kind: 'note',
      text: 'Tombstones копятся и замедляют поиск (их приходится проходить). Поэтому при rehashing их выбрасывают: в новую таблицу переносят только настоящие ключи. Кроме того, при подсчёте α для решения «пора ли делать rehash» часто учитывают и DEL-ячейки.',
    },
    { kind: 'h2', text: 'Код на Python' },
    {
      kind: 'code',
      caption: 'Open addressing: linear / quadratic probing с tombstones',
      code: OPEN_CODE,
      explain: [
        { line: 1, text: 'Три состояния ячейки: None = EMPTY, строка "DEL" = tombstone, иначе — ключ.' },
        { line: 6, text: 'Linear probing: каждая следующая проба на 1 дальше, % m даёт wrap-around.' },
        { line: 7, text: 'Quadratic probing: смещение i² (0, 1, 4, 9, …) от исходной ячейки h.' },
        { line: 13, text: 'Вставка занимает первую ячейку, которая EMPTY или DEL.' },
        { line: 16, text: 'Все m проб заняты (или quadratic probing не достал свободные ячейки).' },
        { line: 22, text: 'Ключевая строка поиска: EMPTY означает «дальше искать бессмысленно».' },
        { line: 24, text: 'DEL не равен ключу и не EMPTY → цикл просто идёт к следующей пробе.' },
        { line: 31, text: 'Удаление ставит tombstone, чтобы не разорвать probe sequence других ключей.' },
      ],
      cpp: OPEN_CPP,
      cppExplain: [
        { line: 1, text: 'В Python ячейка может хранить None или строку "DEL". В C++ vector<int> хранит только числа, поэтому EMPTY и DEL — специальные значения (−1 и −2); ключи считаем неотрицательными.' },
        { line: 7, text: 'Linear probing: каждая следующая проба на 1 дальше, % m даёт wrap-around.' },
        { line: 8, text: 'Quadratic probing: смещение i² (0, 1, 4, 9, …) от исходной ячейки h.' },
        { line: 15, text: 'Вставка занимает первую ячейку, которая EMPTY или DEL.' },
        { line: 20, text: 'Все m проб заняты (или quadratic probing не достал свободные ячейки) — бросаем исключение.' },
        { line: 27, text: 'Ключевая строка поиска: EMPTY означает «дальше искать бессмысленно».' },
        { line: 29, text: 'DEL не равен ключу и не EMPTY → цикл просто идёт к следующей пробе.' },
        { line: 38, text: 'Удаление ставит tombstone, чтобы не разорвать probe sequence других ключей. Функция названа remove, т.к. delete — ключевое слово C++.' },
      ],
    },
    {
      kind: 'warning',
      title: 'Тонкость вставки',
      text: 'Код выше кладёт ключ в первую DEL-ячейку. Если ключ мог уже существовать дальше в probe sequence, получится дубликат. Аккуратная версия: сначала выполнить search(key), и только если ключа нет — вставлять в первую встреченную DEL/EMPTY ячейку.',
    },
    { kind: 'h3', text: 'Поэкспериментируйте' },
    {
      kind: 'p',
      text: 'Выберите Linear или Quadratic Probing, загрузите пример, удалите 85 и затем найдите 92 — увидите, как поиск проходит мимо DEL. Попробуйте заполнить таблицу почти полностью и посмотрите на длину проб.',
    },
    { kind: 'viz', id: 'hash-playground', caption: 'Пробы подсвечиваются по очереди: красный — занято, зелёный — нашли/положили, жёлтый — DEL, голубой — EMPTY (стоп).' },
    { kind: 'viz', id: 'collision-compare', caption: 'Один набор ключей тремя методами — сравните число проб и форму кластеров.' },

    { kind: 'h2', text: 'Chaining vs Open Addressing' },
    {
      kind: 'table',
      headers: ['Критерий', 'Separate Chaining', 'Open Addressing'],
      rows: [
        ['Где хранятся ключи', 'В списках вне массива', 'Прямо в массиве'],
        ['Load factor α', 'Может быть > 1', 'Всегда ≤ 1 (обычно держат ≤ 0.5–0.75)'],
        ['Удаление', 'Просто удалить из списка', 'Нужен tombstone DEL'],
        ['Доп. память', 'Указатели/узлы списков', 'Нет указателей, но нужен запас пустых ячеек'],
        ['Cache locality', 'Хуже (узлы разбросаны в памяти)', 'Лучше (linear probing идёт по соседним ячейкам)'],
        ['Деградация при большом α', 'Плавная (цепочки растут линейно)', 'Резкая (число проб ≈ 1/(1−α) растёт взрывообразно)'],
      ],
    },
    { kind: 'h2', text: 'Сложность (Complexity)' },
    {
      kind: 'complexity',
      rows: [
        {
          op: 'Search / Insert / Delete',
          best: 'O(1)',
          avg: 'O(1) при α ≤ const < 1',
          worst: 'O(n)',
          space: 'O(1)',
          why: 'Среднее число проб для неуспешного поиска ≈ 1/(1−α): при α = 0.5 это ≈ 2 пробы, при α = 0.9 — уже ≈ 10. В худшем случае проверяем всю таблицу (длинный кластер).',
        },
        {
          op: 'Таблица',
          avg: '—',
          worst: '—',
          space: 'O(m)',
          why: 'Один массив из m ячеек, m ≥ n. Никаких цепочек и указателей.',
        },
      ],
    },
    { kind: 'h2', text: 'Типичные ошибки' },
    {
      kind: 'mistakes',
      items: [
        { mistake: 'При удалении ставить EMPTY вместо DEL.', fix: 'Только tombstone DEL. EMPTY разрывает probe sequence, и поиск ключей «за дыркой» ломается.' },
        { mistake: 'Останавливать поиск на DEL.', fix: 'DEL нужно пропускать. Останавливаемся только на EMPTY, на найденном ключе или после m проб.' },
        { mistake: 'Забывать wrap-around: после ячейки m−1 «выходить за массив».', fix: 'Всегда берите (h + i) mod m — после m−1 идёт 0.' },
        { mistake: 'В quadratic probing прибавлять i² к ПРЕДЫДУЩЕЙ пробе (h, h+1, h+1+4, …).', fix: 'i² прибавляется к исходному h: h+0, h+1, h+4, h+9.' },
        { mistake: 'Считать, что quadratic probing всегда найдёт пустую ячейку.', fix: 'Гарантия только при простом m и α ≤ 1/2. Иначе может зациклиться на подмножестве ячеек.' },
        { mistake: 'Путать primary и secondary clustering.', fix: 'Primary — сплошные блоки при linear probing. Secondary — одинаковая probe sequence у ключей с одним h(k) при quadratic probing.' },
      ],
    },
    { kind: 'h2', text: 'Вопросы для самопроверки' },
    {
      kind: 'selfcheck',
      items: [
        { q: 'Чем open addressing отличается от chaining?', a: 'В open addressing все ключи лежат прямо в массиве, по одному на ячейку; при коллизии ищется другая ячейка по probe sequence. В chaining коллизии хранятся в списках.' },
        { q: 'Напишите формулы linear и quadratic probing.', a: 'Linear: (h(k) + i) mod m. Quadratic: (h(k) + i²) mod m, i = 0, 1, 2, …' },
        { q: 'Когда поиск в open addressing останавливается с ответом «не найдено»?', a: 'Когда встретил EMPTY или когда проверил все m проб.' },
        { q: 'Зачем нужен tombstone?', a: 'Чтобы удаление не разрывало probe sequence: поиск проходит мимо DEL и находит ключи, которые лежат дальше.' },
        { q: 'Что такое primary clustering и какой метод от него страдает?', a: 'Образование длинных сплошных блоков занятых ячеек; страдает linear probing.' },
        { q: 'Почему α в open addressing не может быть больше 1?', a: 'В каждой ячейке максимум один ключ, значит n ≤ m.' },
      ],
    },
    { kind: 'h2', text: 'Практические задания' },
    {
      kind: 'practice',
      items: [
        {
          task: 'Linear probing, m = 10, h(k) = k mod 10. Вставьте 23, 43, 13, 27, 37, 9, 19. Запишите таблицу (_ — пусто).',
          solution:
            '23→3. 43→3 занято→4. 13→3,4 заняты→5. 27→7. 37→7 занято→8. 9→9. 19→9 занято→0 (wrap-around).\nindex: 0  1  2  3  4  5  6  7  8  9\nvalue: 19 _  _  23 43 13 _  27 37 9',
        },
        {
          task: 'Те же ключи 23, 43, 13, 27, 37, 9, 19 с quadratic probing, m = 10.',
          solution:
            '23→3. 43: 3 занято, 3+1=4 → 4. 13: 3, 4 заняты, 3+4=7 → 7. 27: 7 занято, 8 → 8. 37: 7, 8 заняты, 7+4=11 mod 10 = 1 → 1. 9→9. 19: 9 занято, (9+1) mod 10 = 0 → 0.\nindex: 0  1  2  3  4  5  6  7  8  9\nvalue: 19 37 _  23 43 _  _  13 27 9',
        },
        {
          task: 'В таблице из задания 1 (linear) удалите 43, затем выполните search(13). Перечислите проверенные ячейки.',
          solution: 'После удаления slot 4 = DEL. search(13): h = 3 → slot 3 = 23 (не то), slot 4 = DEL (пропускаем), slot 5 = 13 → found. Проверены 3, 4, 5.',
        },
        {
          task: 'Что вернёт search(13) в той же ситуации, если удаление 43 ошибочно поставило EMPTY?',
          solution: 'slot 3 = 23, slot 4 = EMPTY → стоп → «не найдено», хотя 13 лежит в slot 5. Именно поэтому нужен tombstone.',
        },
      ],
    },
    {
      kind: 'summary',
      items: [
        'Open addressing: ключи в самом массиве; при коллизии — probe sequence.',
        'Linear: (h + i) mod m — просто, хорошая cache locality, но primary clustering.',
        'Quadratic: (h + i²) mod m — нет primary clustering, но secondary clustering и нужна α ≤ 1/2 при простом m.',
        'Search останавливается на EMPTY; DEL пропускается. Delete ставит tombstone DEL, а не EMPTY.',
        'α ≤ 1; среднее число проб ≈ 1/(1−α) → держим α маленьким и делаем rehashing.',
      ],
    },
  ],
  miniExam: [
    {
      id: 'mini-m1-open-1',
      module: 'm1',
      topic: 'hash',
      category: 'principle',
      question: 'Linear probing, m = 7, h(k) = k mod 7. Вставляем 14, 21, 7 (в таком порядке). В каком slot окажется 7?',
      options: ['0', '1', '2', '3'],
      correct: 2,
      explanation: 'Все три ключа имеют h = 0. 14 → slot 0, 21 → 0 занят → slot 1, 7 → 0, 1 заняты → slot 2.',
    },
    {
      id: 'mini-m1-open-2',
      module: 'm1',
      topic: 'hash',
      category: 'principle',
      question: 'Quadratic probing (h + i²) mod 11, h(k) = 5. Какой индекс у пробы с i = 3?',
      options: ['8', '14', '3', '11'],
      correct: 2,
      explanation: '(5 + 3²) mod 11 = 14 mod 11 = 3.',
    },
    {
      id: 'mini-m1-open-3',
      module: 'm1',
      topic: 'hash',
      category: 'why-how',
      question: 'Как правильно удалить ключ в open addressing?',
      options: [
        'Пометить ячейку как EMPTY',
        'Пометить ячейку как DEL (tombstone)',
        'Сдвинуть все следующие ключи на одну позицию влево',
        'Удаление в open addressing невозможно',
      ],
      correct: 1,
      explanation: 'Tombstone DEL сохраняет цепочку проб: поиск проходит мимо DEL и находит ключи, лежащие дальше.',
    },
    {
      id: 'mini-m1-open-4',
      module: 'm1',
      topic: 'hash',
      category: 'principle',
      question: 'При поиске в open addressing на какой ячейке можно остановиться с ответом «ключа нет»?',
      options: ['На DEL', 'На любой занятой другим ключом', 'На EMPTY', 'На ячейке с индексом m−1'],
      correct: 2,
      explanation: 'EMPTY означает, что тут никогда ничего не было: если бы искомый ключ существовал, он бы лежал здесь или раньше.',
    },
    {
      id: 'mini-m1-open-5',
      module: 'm1',
      topic: 'hash',
      category: 'proscons',
      question: 'Какой недостаток характерен именно для linear probing?',
      options: ['Primary clustering', 'Невозможность удаления', 'α может быть больше 1', 'Нужны указатели на списки'],
      correct: 0,
      explanation: 'Linear probing образует длинные сплошные блоки занятых ячеек (primary clustering), которые растут всё быстрее.',
    },
    {
      id: 'mini-m1-open-6',
      module: 'm1',
      topic: 'hash',
      category: 'principle',
      question:
        'Linear probing, m = 7. Таблица: [700, 50, DEL, 92, 73, _, 76]. Какие ячейки проверит search(92), если h(92) = 1?',
      options: ['1', '1, 2', '1, 2, 3', '1, 3'],
      correct: 2,
      explanation: 'slot 1 = 50 ≠ 92 → slot 2 = DEL, пропускаем → slot 3 = 92, найдено. Проверены 1, 2, 3.',
    },
    {
      id: 'mini-m1-open-7',
      module: 'm1',
      topic: 'hash',
      category: 'comparison',
      question: 'Какое утверждение верно для open addressing (в отличие от chaining)?',
      options: [
        'Load factor может быть больше 1',
        'Load factor всегда ≤ 1',
        'Удаление не требует специальных пометок',
        'Каждая ячейка хранит список ключей',
      ],
      correct: 1,
      explanation: 'В open addressing в каждой ячейке не больше одного ключа, поэтому n ≤ m и α = n/m ≤ 1.',
    },
  ],
};
