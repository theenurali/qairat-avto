import type { Lesson } from '../../../types';
import { chainingSteps } from './helpers';

const CHAINING_CODE = `class HashTableChaining:
    def __init__(self, m=7):
        self.m = m
        self.buckets = [[] for _ in range(m)]   # m пустых цепочек
        self.n = 0                               # сколько ключей храним

    def _hash(self, key):
        return key % self.m                      # h(k) = k mod m

    def insert(self, key):
        b = self._hash(key)
        if key not in self.buckets[b]:           # дубликаты не храним
            self.buckets[b].append(key)          # добавляем в КОНЕЦ цепочки
            self.n += 1

    def search(self, key):
        b = self._hash(key)
        return key in self.buckets[b]            # смотрим ТОЛЬКО одну цепочку

    def delete(self, key):
        b = self._hash(key)
        if key in self.buckets[b]:
            self.buckets[b].remove(key)          # обычное удаление из списка
            self.n -= 1`;

const REHASH_CODE = `def rehash(self):
    old = self.buckets
    self.m = 2 * self.m + 1                     # новый размер (≈ вдвое больше)
    self.buckets = [[] for _ in range(self.m)]
    self.n = 0
    for chain in old:
        for key in chain:
            self.insert(key)                    # индекс пересчитывается с НОВЫМ m`;

const REHASH_CPP = `struct HashTableChaining {                       // только нужные поля и методы
    int m, n;
    vector<vector<int>> buckets;
    void insert(int key);                        // как в классе выше

    void rehash() {
        vector<vector<int>> old = buckets;       // копия старых цепочек
        m = 2 * m + 1;                           // новый размер (≈ вдвое больше)
        buckets.assign(m, vector<int>());        // m новых пустых цепочек
        n = 0;
        for (const vector<int>& chain : old)
            for (int key : chain)
                insert(key);                     // индекс пересчитывается с НОВЫМ m
    }
};`;

const CHAINING_CPP = `class HashTableChaining {
public:
    int m;
    int n = 0;                                   // сколько ключей храним
    vector<vector<int>> buckets;                 // m цепочек

    HashTableChaining(int m = 7) : m(m), buckets(m) {}   // m пустых цепочек

    int hashKey(int key) const {
        return ((key % m) + m) % m;              // h(k) = k mod m, всегда 0..m-1
    }

    void insert(int key) {
        vector<int>& chain = buckets[hashKey(key)];
        if (find(chain.begin(), chain.end(), key) == chain.end()) {   // дубликаты не храним
            chain.push_back(key);                // добавляем в КОНЕЦ цепочки
            n++;
        }
    }

    bool search(int key) const {
        const vector<int>& chain = buckets[hashKey(key)];
        return find(chain.begin(), chain.end(), key) != chain.end();   // ТОЛЬКО одна цепочка
    }

    void remove(int key) {                       // delete — ключевое слово C++
        vector<int>& chain = buckets[hashKey(key)];
        auto it = find(chain.begin(), chain.end(), key);
        if (it != chain.end()) {
            chain.erase(it);                     // обычное удаление из вектора
            n--;
        }
    }
};`;

export const hashBasicsLesson: Lesson = {
  id: 'm1-hash-basics',
  title: 'Hash Tables: идея, Hash Function, Separate Chaining',
  subtitle: 'Как получить поиск за O(1): ключ → индекс → ячейка массива',
  topic: 'hash',
  minutes: 35,
  blocks: [
    { kind: 'h2', text: 'Какую проблему решает Hash Table' },
    {
      kind: 'p',
      text: 'Представьте, что нужно хранить множество ключей (номера студентов, слова, ID заказов) и очень быстро отвечать на вопросы: «есть ли такой ключ?», «добавь ключ», «удали ключ». Посмотрим, что дают простые структуры:',
    },
    {
      kind: 'table',
      headers: ['Структура', 'Поиск', 'Вставка', 'Удаление'],
      rows: [
        ['Неотсортированный массив / list', 'O(n) — перебор', 'O(1) — в конец', 'O(n)'],
        ['Отсортированный массив', 'O(log n) — binary search', 'O(n) — сдвиг элементов', 'O(n)'],
        ['Balanced BST', 'O(log n)', 'O(log n)', 'O(log n)'],
        ['**Hash Table**', '**O(1) в среднем**', '**O(1) в среднем**', '**O(1) в среднем**'],
      ],
      caption: 'Hash Table выигрывает в среднем случае — именно поэтому dict и set в Python устроены как hash tables.',
    },
    {
      kind: 'analogy',
      title: 'Гардероб с номерками',
      text: 'В гардеробе вы не ищете своё пальто, перебирая все вешалки. У вас есть номерок 37 — гардеробщик сразу идёт к крючку 37. Номерок — это **index**, который мы получили заранее. Hash Table делает то же самое: по ключу **вычисляет** номер ячейки, а не ищет её перебором.',
    },
    {
      kind: 'p',
      text: 'Самая простая идея — **direct addressing** (прямая адресация): ключ k храним в ячейке `T[k]`. Но если ключи — это номера телефонов (до 10^10), массив такого размера не поместится в память. Нужна функция, которая «сжимает» огромный диапазон ключей в маленький диапазон индексов 0..m−1. Это и есть **hash function**.',
    },

    { kind: 'h2', text: 'Hash Function (хеш-функция)' },
    {
      kind: 'p',
      text: '**Hash function** h — это функция, которая превращает ключ k в индекс массива: `h(k) ∈ {0, 1, …, m−1}`, где m — размер таблицы (number of slots / buckets). Значение h(k) называют **hash value** или просто хешем.',
    },
    {
      kind: 'p',
      text: 'В этом курсе (и в задачах на tracing) используем **division method** — метод деления: **h(k) = k mod m**. В Python это `key % m`. Например, при m = 7: h(10) = 10 mod 7 = 3, h(22) = 22 mod 7 = 1.',
    },
    { kind: 'viz', id: 'hash-scheme', caption: 'Ключ проходит через hash function и превращается в индекс ячейки.' },
    {
      kind: 'p',
      text: 'Хорошая hash function должна обладать свойствами:',
    },
    {
      kind: 'list',
      items: [
        '**Deterministic** (детерминированность): один и тот же ключ всегда даёт один и тот же индекс. Иначе мы не найдём то, что положили.',
        '**Fast** (быстрая): считается за O(1) (или O(длина ключа) для строк).',
        '**Uniform distribution** (равномерность): ключи распределяются по ячейкам примерно поровну — тогда цепочки короткие.',
        'Использует **весь ключ**: если для строк брать только первую букву, все слова на «a» попадут в одну ячейку.',
      ],
    },
    {
      kind: 'tip',
      title: 'Почему m часто берут простым числом',
      text: 'Если m = 10, а все ключи кратны 10 (10, 20, 30…), то все они попадут в ячейку 0! Если m — **простое число** (prime), не близкое к степени двойки, то закономерности в ключах (кратность, одинаковые последние цифры) гораздо реже превращаются в коллизии.',
    },
    {
      kind: 'p',
      text: 'Для строк ключ сначала превращают в число. Простой способ — сумма кодов символов `ord(c)`, но он плохой: у анаграмм ("abc" и "cab") одинаковая сумма. Лучше **polynomial hash**: `h = (h · base + ord(c)) mod m` для каждого символа — он учитывает порядок букв. Поиграйте с обоими вариантами:',
    },
    { kind: 'viz', id: 'hash-explorer', caption: 'Введите число или строку и посмотрите, как вычисляется индекс.' },

    { kind: 'h2', text: 'Collision (коллизия)' },
    {
      kind: 'p',
      text: '**Collision** — ситуация, когда два **разных** ключа получают **одинаковый** индекс: k₁ ≠ k₂, но h(k₁) = h(k₂). Например, при m = 7: h(10) = 3 и h(31) = 3.',
    },
    {
      kind: 'p',
      text: 'Коллизии **неизбежны**: возможных ключей намного больше, чем ячеек (pigeonhole principle — принцип Дирихле: если 8 голубей сидят в 7 клетках, в какой-то клетке минимум два голубя). Поэтому вопрос не «как избежать коллизий», а «как их **разрешать**» — **collision resolution**. Есть два семейства методов:',
    },
    {
      kind: 'list',
      items: [
        '**Separate Chaining** (метод цепочек) — в каждой ячейке хранится список (цепочка) всех ключей с этим индексом. Разбираем в этом уроке.',
        '**Open Addressing** (открытая адресация) — все ключи хранятся прямо в массиве; при коллизии ищем другую свободную ячейку (linear probing, quadratic probing). Следующий урок.',
      ],
    },
    {
      kind: 'analogy',
      title: 'Дни рождения',
      text: 'В группе всего из 23 человек вероятность, что у двоих совпадёт день рождения (365 «ячеек»), уже больше 50% (birthday paradox). Так и в hash table: коллизии появляются гораздо раньше, чем таблица заполнится.',
    },
    { kind: 'viz', id: 'chain-vs-open', caption: 'Одни и те же ключи — двумя способами разрешения коллизий.' },

    { kind: 'h2', text: 'Separate Chaining (метод цепочек)' },
    {
      kind: 'p',
      text: 'Таблица — это массив из m **buckets** (корзин). Каждый bucket — это список (linked list или Python list). Ключ k всегда лежит в bucket с номером h(k).',
    },
    {
      kind: 'list',
      ordered: true,
      items: [
        '**Insert(k)**: вычисляем b = h(k). Если k ещё нет в цепочке bucket b — добавляем его **в конец цепочки** (так принято в этом курсе и в задачах на tracing).',
        '**Search(k)**: вычисляем b = h(k) и просматриваем **только** цепочку bucket b.',
        '**Delete(k)**: вычисляем b = h(k), находим k в цепочке и удаляем его из списка. Никаких специальных пометок не нужно.',
      ],
    },
    {
      kind: 'steps',
      title: 'Пример: m = 7, вставляем 10, 22, 31, 4, 15, 28, 17',
      steps: chainingSteps(7, [10, 22, 31, 4, 15, 28, 17]),
    },
    {
      kind: 'note',
      title: 'Что получилось',
      text: 'n = 7 ключей, m = 7 ячеек → load factor α = 7/7 = 1. Bucket 3 содержит цепочку из трёх ключей (10 → 31 → 17): чтобы найти 17, придётся сделать 3 сравнения. Buckets 2, 5, 6 пусты — распределение неидеальное.',
    },
    { kind: 'h3', text: 'Код на Python' },
    {
      kind: 'code',
      caption: 'Hash Table с Separate Chaining',
      code: CHAINING_CODE,
      explain: [
        { line: 4, text: 'Создаём m отдельных пустых списков. Важно: `[[]] * m` было бы ошибкой — получились бы m ссылок на ОДИН список.' },
        { line: 8, text: 'Hash function — division method. Python-оператор % всегда даёт результат 0..m−1 (даже для отрицательных ключей).' },
        { line: 12, text: 'Проверка дубликата — это проход по цепочке, поэтому insert стоит O(1 + α), а не строго O(1).' },
        { line: 13, text: 'append добавляет в конец цепочки — порядок ключей в цепочке = порядок вставки.' },
        { line: 18, text: 'Главная идея: просматриваем одну цепочку длины ≈ α, а не все n ключей.' },
        { line: 23, text: 'В chaining удаление простое: ключ просто убирается из списка, остальные ключи не «теряются».' },
      ],
      cpp: CHAINING_CPP,
      cppExplain: [
        { line: 7, text: 'buckets(m) создаёт m отдельных пустых векторов — каждый bucket независим.' },
        { line: 10, text: 'В C++ оператор % для отрицательного ключа даёт отрицательный остаток (−3 % 7 = −3), поэтому прибавляем m и ещё раз берём % m. В Python так делать не нужно.' },
        { line: 15, text: 'Проверка дубликата — проход по цепочке (std::find), поэтому insert стоит O(1 + α), а не строго O(1).' },
        { line: 16, text: 'push_back добавляет в конец цепочки — порядок ключей в цепочке = порядок вставки.' },
        { line: 23, text: 'Главная идея: просматриваем одну цепочку длины ≈ α, а не все n ключей.' },
        { line: 26, text: 'Метод называется remove, потому что delete — зарезервированное слово C++.' },
        { line: 30, text: 'erase удаляет ключ из вектора-цепочки, остальные ключи не «теряются».' },
      ],
    },
    { kind: 'h3', text: 'Попробуйте сами' },
    {
      kind: 'p',
      text: 'Выберите **Separate Chaining**, вставьте несколько ключей (можно сразу через запятую), затем выполните Search и Delete. Анимация покажет, какой bucket выбирается и сколько элементов цепочки сравнивается.',
    },
    { kind: 'viz', id: 'hash-playground', caption: 'Интерактивная Hash Table: Insert / Search / Delete с пошаговой анимацией.' },

    { kind: 'h2', text: 'Load Factor и Rehashing' },
    {
      kind: 'p',
      text: '**Load factor** (коэффициент заполнения) **α = n / m**, где n — число ключей, m — число buckets. При равномерной hash function средняя длина цепочки равна α. Поэтому средний поиск стоит **O(1 + α)**: 1 — посчитать хеш, α — пройти цепочку.',
    },
    {
      kind: 'p',
      text: 'Если α держать ограниченным константой (например α ≤ 1 для chaining или α ≤ 0.5–0.75 для open addressing), то O(1 + α) = **O(1)**. Для этого делают **rehashing** (перехеширование): когда α превышает порог, создают новую таблицу примерно вдвое большего размера и **заново вставляют все ключи** — индексы меняются, потому что меняется m.',
    },
    {
      kind: 'code',
      caption: 'Rehashing (метод класса HashTableChaining)',
      code: REHASH_CODE,
      explain: [
        { line: 3, text: 'Размер увеличиваем примерно вдвое (2m+1 часто даёт нечётное число; на практике берут ближайшее простое).' },
        { line: 8, text: 'Нельзя просто скопировать цепочки: h(k) = k mod m зависит от m, поэтому каждый ключ вставляется заново.' },
      ],
      cpp: REHASH_CPP,
      cppExplain: [
        { line: 8, text: 'Размер увеличиваем примерно вдвое (2m+1 часто даёт нечётное число; на практике берут ближайшее простое).' },
        { line: 9, text: 'assign заменяет содержимое: m новых пустых цепочек.' },
        { line: 13, text: 'Нельзя просто скопировать цепочки: h(k) = k mod m зависит от m, поэтому каждый ключ вставляется заново.' },
      ],
    },
    {
      kind: 'note',
      title: 'Amortized O(1)',
      text: 'Один rehash стоит O(n), но происходит редко: после удвоения нужно ещё ~n вставок до следующего. Если «размазать» стоимость, каждая вставка стоит **amortized O(1)** — как у динамического массива (list.append).',
    },

    { kind: 'h2', text: 'Сложность (Complexity)' },
    {
      kind: 'complexity',
      rows: [
        {
          op: 'Search (chaining)',
          best: 'O(1)',
          avg: 'O(1 + α)',
          worst: 'O(n)',
          space: 'O(1)',
          why: 'В среднем цепочка длины α. В худшем случае все n ключей попали в один bucket (плохая hash function или специально подобранные ключи) — получаем обычный список.',
        },
        {
          op: 'Insert (chaining)',
          best: 'O(1)',
          avg: 'O(1 + α)',
          worst: 'O(n)',
          space: 'O(1)',
          why: 'Нужно проверить дубликат (пройти цепочку). Если дубликаты не проверять и вставлять в начало — строго O(1).',
        },
        {
          op: 'Delete (chaining)',
          best: 'O(1)',
          avg: 'O(1 + α)',
          worst: 'O(n)',
          space: 'O(1)',
          why: 'Сначала найти ключ в цепочке, затем удалить из списка.',
        },
        {
          op: 'Rehash',
          avg: 'O(n + m)',
          worst: 'O(n + m)',
          space: 'O(n + m)',
          why: 'Каждый из n ключей вставляется заново в новую таблицу из m buckets; amortized на одну вставку — O(1).',
        },
        {
          op: 'Вся таблица',
          avg: '—',
          worst: '—',
          space: 'O(n + m)',
          why: 'm buckets (массив) + n узлов в цепочках.',
        },
      ],
    },

    { kind: 'h2', text: 'Типичные ошибки' },
    {
      kind: 'mistakes',
      items: [
        { mistake: 'Считать, что hash table ВСЕГДА работает за O(1).', fix: 'O(1) — это average case при хорошей hash function и ограниченном α. Worst case — O(n).' },
        { mistake: 'Путать hash value и ключ: «в ячейке 3 лежит 3».', fix: 'В ячейке h(k) лежит сам ключ k. h(10) = 3, значит в bucket 3 лежит 10.' },
        { mistake: 'При вставке в цепочку ставить ключ в начало, когда в задаче сказано «в конец».', fix: 'Внимательно читайте условие. В нашем курсе — append в конец, порядок цепочки = порядок вставки.' },
        { mistake: 'При rehashing копировать цепочки «как есть» в новый массив.', fix: 'Индекс зависит от m → каждый ключ нужно перевставить с новой h(k) = k mod m_new.' },
        { mistake: 'Считать α не больше 1 для chaining.', fix: 'В chaining α может быть > 1 (цепочки длиннее 1). В open addressing α ≤ 1 всегда.' },
        { mistake: 'Ошибаться с отрицательными ключами: −3 mod 7.', fix: 'В Python −3 % 7 = 4 (результат всегда неотрицательный). В C++/Java −3 % 7 = −3, там нужно ((k % m) + m) % m.' },
      ],
    },

    { kind: 'h2', text: 'Вопросы для самопроверки' },
    {
      kind: 'selfcheck',
      items: [
        { q: 'Что такое hash function и что она возвращает?', a: 'Функция h, которая отображает ключ в индекс массива 0..m−1. Например h(k) = k mod m.' },
        { q: 'Почему коллизии неизбежны?', a: 'Множество возможных ключей больше, чем число ячеек m (pigeonhole principle). Значит, два разных ключа обязательно могут получить один индекс.' },
        { q: 'Как найти ключ в таблице с separate chaining?', a: 'Вычислить b = h(k) и просмотреть только цепочку bucket b. Остальные buckets не трогаем.' },
        { q: 'Что такое load factor и как он влияет на скорость?', a: 'α = n/m. Средняя длина цепочки = α, поэтому средний поиск O(1 + α). Чем больше α, тем медленнее.' },
        { q: 'Когда поиск в hash table работает за O(n)?', a: 'Когда все (или почти все) ключи попали в один bucket — например, плохая hash function или m = 10 и все ключи кратны 10.' },
        { q: 'Зачем нужен rehashing и почему нельзя просто скопировать цепочки?', a: 'Чтобы держать α маленьким. Копировать нельзя, потому что h(k) = k mod m зависит от m — после изменения m ключи должны оказаться в других buckets.' },
      ],
    },

    { kind: 'h2', text: 'Практические задания' },
    {
      kind: 'practice',
      items: [
        {
          task: 'm = 5, separate chaining, вставка в конец цепочки. Вставьте ключи 12, 7, 22, 3, 17, 5. Запишите содержимое каждого bucket.',
          solution:
            'h: 12→2, 7→2, 22→2, 3→3, 17→2, 5→0.\nBucket 0: 5\nBucket 1: ∅\nBucket 2: 12 → 7 → 22 → 17\nBucket 3: 3\nBucket 4: ∅\nα = 6/5 = 1.2 (в chaining α может быть > 1).',
        },
        {
          task: 'В таблице из задания 1 найдите ключ 17. Сколько сравнений ключей понадобится? А для поиска 27 (которого нет)?',
          solution: 'h(17) = 2 → цепочка 12, 7, 22, 17 → 4 сравнения. h(27) = 2 → проверяем все 4 элемента цепочки и не находим → 4 сравнения, ответ «нет».',
        },
        {
          task: 'Почему для ключей 10, 20, 30, 40, 50 плохо выбирать m = 10? Какое m лучше?',
          solution: 'Все ключи дают k mod 10 = 0 → все в одном bucket, поиск O(n). При m = 7 (простое): 3, 6, 2, 5, 1 — все в разных buckets.',
        },
        {
          task: 'Таблица с m = 4 содержит ключи 1, 5, 9 (все в bucket 1). Выполните rehashing до m = 9. Где окажутся ключи?',
          solution: '1 mod 9 = 1, 5 mod 9 = 5, 9 mod 9 = 0. Ключи разошлись по разным buckets: 0: [9], 1: [1], 5: [5].',
        },
      ],
    },

    {
      kind: 'summary',
      items: [
        'Hash Table хранит ключи в массиве и вычисляет индекс через hash function: h(k) = k mod m.',
        'Collision — два разных ключа с одинаковым индексом; коллизии неизбежны, их нужно разрешать.',
        'Separate Chaining: каждая ячейка — список; insert добавляет в конец цепочки, search смотрит одну цепочку.',
        'Load factor α = n/m; средняя сложность O(1 + α), худшая O(n). Rehashing держит α малым → amortized O(1).',
        'Простое m и равномерная hash function уменьшают число коллизий.',
      ],
    },
  ],
  miniExam: [
    {
      id: 'mini-m1-basics-1',
      module: 'm1',
      topic: 'hash',
      category: 'principle',
      question: 'h(k) = k mod 9. В какой bucket попадёт ключ 40?',
      options: ['0', '4', '9', '5'],
      correct: 1,
      explanation: '40 = 4·9 + 4, значит 40 mod 9 = 4.',
    },
    {
      id: 'mini-m1-basics-2',
      module: 'm1',
      topic: 'hash',
      category: 'definition',
      question: 'Что такое collision (коллизия) в hash table?',
      options: [
        'Ключ вставили в таблицу дважды',
        'Таблица полностью заполнена',
        'Два разных ключа получили одинаковый индекс h(k)',
        'Hash function вернула отрицательное число',
      ],
      correct: 2,
      explanation: 'Collision: k₁ ≠ k₂, но h(k₁) = h(k₂). Это нормальная ситуация, её разрешают chaining или open addressing.',
    },
    {
      id: 'mini-m1-basics-3',
      module: 'm1',
      topic: 'hash',
      category: 'principle',
      question: 'Separate chaining, m = 5, вставка в конец цепочки. Вставляем 7, 12, 3, 17. Как выглядит bucket 2?',
      options: ['17 → 12 → 7', '7 → 12 → 17', '7 → 12 → 3 → 17', '12 → 17'],
      correct: 1,
      explanation: '7 mod 5 = 2, 12 mod 5 = 2, 3 mod 5 = 3, 17 mod 5 = 2. В bucket 2 ключи идут в порядке вставки: 7 → 12 → 17.',
    },
    {
      id: 'mini-m1-basics-4',
      module: 'm1',
      topic: 'hash',
      category: 'definition',
      question: 'В таблице с separate chaining m = 4 bucket и 12 ключей. Чему равен load factor α?',
      options: ['0.33', '4', '12', '3'],
      correct: 3,
      explanation: 'α = n / m = 12 / 4 = 3. В chaining α может быть больше 1: в среднем по 3 ключа в цепочке.',
    },
    {
      id: 'mini-m1-basics-5',
      module: 'm1',
      topic: 'hash',
      category: 'time',
      question: 'Какова средняя сложность успешного/неуспешного поиска в separate chaining при равномерной hash function?',
      options: ['O(1 + α)', 'O(log n)', 'O(n)', 'O(m)'],
      correct: 0,
      explanation: 'O(1) — вычислить хеш, плюс просмотр цепочки средней длины α = n/m.',
    },
    {
      id: 'mini-m1-basics-6',
      module: 'm1',
      topic: 'hash',
      category: 'time',
      question: 'В каком случае поиск в hash table с chaining занимает O(n)?',
      options: [
        'Когда α < 1',
        'Когда все ключи попали в один и тот же bucket',
        'Когда m — простое число',
        'Никогда: hash table всегда O(1)',
      ],
      correct: 1,
      explanation: 'Если все n ключей в одной цепочке, поиск превращается в линейный проход по списку — O(n). Это worst case.',
    },
    {
      id: 'mini-m1-basics-7',
      module: 'm1',
      topic: 'hash',
      category: 'why-how',
      question: 'Почему при rehashing нельзя просто скопировать старые цепочки в новый массив?',
      options: [
        'Потому что цепочки нельзя копировать в Python',
        'Потому что после rehashing ключи нужно отсортировать',
        'Потому что индекс h(k) = k mod m зависит от m, и при новом m ключи попадают в другие buckets',
        'Потому что старые ключи удаляются',
      ],
      correct: 2,
      explanation: 'Например 9 mod 4 = 1, но 9 mod 9 = 0. При смене m индексы меняются, поэтому все ключи перевставляются.',
    },
  ],
};
