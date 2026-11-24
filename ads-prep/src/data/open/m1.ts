import type { OpenQuestion } from '../../types';

/** Открытые вопросы Module 1 (как на экзамене). */
export const openM1: OpenQuestion[] = [
  {
    id: 'm1-o1',
    module: 'm1',
    topic: 'hash',
    en: 'Explain how Hash Tables work.',
    ru: 'Объясните, как работают Hash Tables.',
    model:
      'Hash table хранит ключи (или пары key–value) в массиве из m ячеек (buckets/slots). Hash function h вычисляет по ключу индекс ячейки, например h(k) = k mod m, поэтому ключ не нужно искать перебором — его адрес вычисляется. Разные ключи могут получить один индекс — это collision; коллизии неизбежны (ключей больше, чем ячеек), поэтому их разрешают: separate chaining (каждая ячейка — список ключей) или open addressing (ищем другую свободную ячейку: linear probing (h+i) mod m, quadratic probing (h+i²) mod m). Insert, search и delete в среднем работают за O(1) при хорошей hash function и маленьком load factor α = n/m; в худшем случае (все ключи в одной цепочке/кластере) — O(n). Чтобы α оставался малым, таблицу расширяют (rehashing), это даёт amortized O(1) на вставку.',
    keyPoints: [
      { text: 'Массив ячеек + hash function, которая превращает ключ в индекс', keywords: ['hash function', 'хеш-функц', 'индекс', 'index', 'mod', 'массив', 'array'] },
      { text: 'Определение collision и почему она неизбежна', keywords: ['collision', 'коллизи', 'одинаков', 'same index'] },
      { text: 'Способы разрешения коллизий: chaining и open addressing', keywords: ['chaining', 'цепоч', 'open addressing', 'probing', 'открыт'] },
      { text: 'Average O(1), worst O(n)', keywords: ['o(1)', 'o(n)', 'average', 'средн', 'worst', 'худш'] },
      { text: 'Load factor α = n/m и rehashing', keywords: ['load factor', 'α', 'alpha', 'n/m', 'rehash', 'коэффициент заполн'] },
    ],
  },
  {
    id: 'm1-o2',
    module: 'm1',
    topic: 'hash',
    en: 'Compare separate chaining and open addressing. What are the advantages and disadvantages of each?',
    ru: 'Сравните separate chaining и open addressing. Каковы преимущества и недостатки каждого?',
    model:
      'Separate chaining: каждая ячейка хранит список ключей с одинаковым хешем. Плюсы: простое удаление (убрать из списка), α может быть > 1, производительность падает плавно. Минусы: дополнительная память на узлы и указатели, плохая cache locality. Open addressing: все ключи хранятся прямо в массиве, при коллизии проверяются другие ячейки по probe sequence (linear: (h+i) mod m, quadratic: (h+i²) mod m). Плюсы: нет указателей, хорошая cache locality (особенно linear probing). Минусы: α ≤ 1 и производительность резко падает при α → 1 (≈ 1/(1−α) проб), удаление требует tombstones (DEL), linear probing страдает от primary clustering, quadratic — от secondary clustering и может не найти свободную ячейку при α > 1/2.',
    keyPoints: [
      { text: 'Chaining: списки в ячейках, α может быть > 1', keywords: ['chaining', 'цепоч', 'список', 'list', 'α > 1', 'больше 1'] },
      { text: 'Open addressing: ключи в самом массиве, probe sequence', keywords: ['open addressing', 'probing', 'проб', 'в массиве', 'linear', 'quadratic'] },
      { text: 'Удаление: в chaining просто, в open addressing нужен tombstone', keywords: ['tombstone', 'del', 'удален', 'delete', 'надгроб'] },
      { text: 'Память и cache locality', keywords: ['памят', 'memory', 'указател', 'pointer', 'cache', 'кэш'] },
      { text: 'Кластеризация (primary/secondary) и деградация при большом α', keywords: ['cluster', 'кластер', '1/(1', 'деград'] },
    ],
  },
  {
    id: 'm1-o3',
    module: 'm1',
    topic: 'hash',
    en: 'Why do we use tombstones (DELETED markers) when deleting from a hash table with open addressing?',
    ru: 'Зачем при удалении из hash table с open addressing используют tombstones (метки DELETED)?',
    model:
      'Поиск в open addressing идёт по той же probe sequence, что и вставка, и останавливается на EMPTY ячейке — это означает «ключа нет, иначе он лежал бы здесь». Если при удалении сделать ячейку EMPTY, то ключи, которые при вставке прошли через эту ячейку и легли дальше, станут ненаходимыми: поиск остановится на новой «дырке». Пример: linear probing, m = 7, ключи 50 (slot 1), 85 (h=1 → slot 2), 92 (h=1 → slot 3). Если удалить 85 и поставить EMPTY, search(92) остановится на slot 2. Поэтому ставят tombstone DEL: поиск проходит мимо DEL, а вставка может переиспользовать DEL-ячейку. Tombstones накапливаются и замедляют поиск, поэтому их убирают при rehashing.',
    keyPoints: [
      { text: 'Поиск останавливается на EMPTY', keywords: ['empty', 'пуст', 'останав', 'stop'] },
      { text: 'EMPTY при удалении разорвёт probe sequence — ключи дальше станут ненаходимыми', keywords: ['probe', 'проб', 'не найд', 'разрыв', 'дальше', 'chain'] },
      { text: 'DEL пропускается при поиске', keywords: ['пропуск', 'skip', 'del', 'tombstone'] },
      { text: 'DEL можно переиспользовать при вставке', keywords: ['вставк', 'insert', 'переиспольз', 'reuse'] },
      { text: 'Конкретный пример или упоминание очистки при rehashing', keywords: ['пример', 'example', 'rehash', 'slot'] },
    ],
  },
  {
    id: 'm1-o4',
    module: 'm1',
    topic: 'hash',
    en: 'What is the load factor of a hash table and why does it matter? What is rehashing?',
    ru: 'Что такое load factor hash table и почему он важен? Что такое rehashing?',
    model:
      'Load factor α = n/m — отношение числа ключей к числу ячеек. В separate chaining α — средняя длина цепочки, поэтому средний поиск стоит O(1 + α). В open addressing α ≤ 1, а среднее число проб при неуспешном поиске ≈ 1/(1−α): при α = 0.5 около 2 проб, при α = 0.9 около 10. Поэтому α держат ниже порога (например 0.75). Когда порог превышен, делают rehashing: создают новую таблицу примерно вдвое больше (часто простого размера) и заново вставляют все ключи, так как h(k) = k mod m зависит от m; tombstones при этом выбрасываются. Rehash стоит O(n), но происходит редко, поэтому вставка остаётся amortized O(1).',
    keyPoints: [
      { text: 'Определение α = n/m', keywords: ['n/m', 'α', 'alpha', 'load factor', 'отношени'] },
      { text: 'Влияние на скорость: O(1 + α) / 1/(1−α)', keywords: ['1 + α', '1+α', '1/(1', 'длина цепоч', 'скорост', 'проб'] },
      { text: 'Rehashing: новая большая таблица, перевставка всех ключей', keywords: ['rehash', 'перевстав', 'вдвое', 'double', 'больш'] },
      { text: 'Индексы меняются, потому что h зависит от m', keywords: ['зависит от m', 'mod m', 'новый m', 'new m', 'пересчит'] },
      { text: 'Amortized O(1)', keywords: ['amortized', 'амортиз'] },
    ],
  },
  {
    id: 'm1-o5',
    module: 'm1',
    topic: 'rk',
    en: 'Explain the rolling hash used in the Rabin-Karp algorithm.',
    ru: 'Объясните rolling hash, используемый в алгоритме Rabin-Karp.',
    model:
      'Строку длины m рассматривают как число в системе счисления с основанием d (размер алфавита) и берут по модулю простого q: hash = (v(s₀)·d^(m−1) + … + v(s_{m−1})) mod q. Соседние окна текста отличаются одним символом слева и одним справа, поэтому хеш следующего окна вычисляется из предыдущего за O(1): t_{s+1} = (d·(t_s − v(text[s])·h) + v(text[s+m])) mod q, где h = d^(m−1) mod q — вес старшего символа. Сначала вычитаем вклад уходящего левого символа, затем умножаем на d (сдвиг разрядов), затем добавляем новый правый символ. Пример: d = 10, q = 11, окно "38" (t = 5) → "82": (10·(5 − 3·10) + 2) mod 11 = 5. Без rolling hash пересчёт каждого окна стоил бы O(m), а весь алгоритм — O(n·m).',
    keyPoints: [
      { text: 'Строка как число по основанию d, mod q', keywords: ['основани', 'base', 'radix', 'mod q', 'd^'] },
      { text: 'Формула пересчёта t_{s+1} = (d·(t_s − v·h) + v_new) mod q', keywords: ['t_s', 'формул', 'вычита', 'subtract', 'умнож', 'multiply'] },
      { text: 'h = d^(m−1) mod q — вес старшего символа', keywords: ['d^(m', 'd^(m−1)', 'd^(m-1)', 'вес', 'старш'] },
      { text: 'Пересчёт за O(1) вместо O(m)', keywords: ['o(1)', 'o(m)', 'констант'] },
      { text: 'Пример вычисления', keywords: ['пример', 'example', '='] },
    ],
  },
  {
    id: 'm1-o6',
    module: 'm1',
    topic: 'rk',
    en: 'What is a spurious hit in Rabin-Karp and how does the algorithm handle it?',
    ru: 'Что такое spurious hit в Rabin-Karp и как алгоритм с ним справляется?',
    model:
      'Spurious hit (ложное срабатывание) — окно текста, хеш которого равен хешу образца, хотя сами строки различаются. Это возможно, потому что хеш берётся по модулю q и разные числа дают одинаковый остаток (например при q = 11: 26 mod 11 = 15 mod 11 = 4). Поэтому при равенстве хешей Rabin-Karp обязательно сравнивает символы окна и образца; совпадение засчитывается только при посимвольном равенстве. Обратной ошибки нет: одинаковые строки всегда имеют одинаковые хеши, значит, при разных хешах окно можно пропустить. Чтобы spurious hits были редкими (≈ 1/q на окно), q берут большим простым числом. Много spurious hits ухудшают время до O(n·m).',
    keyPoints: [
      { text: 'Определение: хеши равны, строки разные', keywords: ['равн', 'equal', 'разн', 'differ', 'ложн', 'false positive'] },
      { text: 'Причина — mod q', keywords: ['mod', 'модул', 'остат'] },
      { text: 'Обязательная посимвольная проверка', keywords: ['символ', 'character', 'провер', 'verify', 'compare'] },
      { text: 'Разные хеши гарантируют несовпадение', keywords: ['разные хеш', 'different hash', 'точно не', 'гарант'] },
      { text: 'Большое простое q уменьшает число spurious hits; влияние на сложность', keywords: ['прост', 'prime', 'больш', '1/q', 'o(nm)', 'o(n·m)', 'o(n*m)'] },
    ],
  },
  {
    id: 'm1-o7',
    module: 'm1',
    topic: 'rk',
    en: 'What is the time complexity of Rabin-Karp? When does the worst case occur?',
    ru: 'Какова временная сложность Rabin-Karp? Когда возникает худший случай?',
    model:
      'Предобработка — O(m): вычислить hash(pattern), хеш первого окна и h = d^(m−1) mod q. Далее n − m + 1 окон, каждое обрабатывается за O(1) благодаря rolling hash. Посимвольная проверка O(m) выполняется только при совпадении хешей. Поэтому average/expected case — O(n + m) (при хорошем q spurious hits редки). Worst case — O(n·m): когда хеш совпадает почти в каждом окне — например text = "aaaa…a", pattern = "aaa" (каждое окно — настоящее совпадение), или при плохом маленьком q, дающем много spurious hits. Дополнительная память — O(1).',
    keyPoints: [
      { text: 'Предобработка O(m)', keywords: ['o(m)', 'предобработ', 'preprocess'] },
      { text: 'Average O(n + m)', keywords: ['o(n + m)', 'o(n+m)', 'average', 'средн', 'expected'] },
      { text: 'Worst O(n·m)', keywords: ['o(nm)', 'o(n·m)', 'o(n*m)', 'o(n m)', 'worst', 'худш'] },
      { text: 'Пример худшего случая (много совпадений / spurious hits)', keywords: ['aaa', 'spurious', 'много совпад', 'маленьк', 'плох'] },
      { text: 'Память O(1)', keywords: ['o(1)', 'памят', 'space'] },
    ],
  },
  {
    id: 'm1-o8',
    module: 'm1',
    topic: 'hash',
    en: 'What makes a good hash function? Why is k mod m with prime m a common choice?',
    ru: 'Какой должна быть хорошая hash function? Почему часто выбирают k mod m с простым m?',
    model:
      'Хорошая hash function детерминирована (один ключ — всегда один индекс), быстро вычисляется (O(1) для чисел, O(длина) для строк), распределяет ключи равномерно по всем m ячейкам (simple uniform hashing) и использует весь ключ (например, для строк — все символы с учётом порядка, как polynomial hash). Division method h(k) = k mod m простой и быстрый; m выбирают простым и не близким к степени 2, потому что при составном m закономерности в ключах (например, все ключи кратны 10 при m = 10) сгоняют ключи в небольшое число ячеек, а простое m разрушает такие закономерности и уменьшает число коллизий.',
    keyPoints: [
      { text: 'Детерминированность', keywords: ['детермин', 'determin', 'один и тот же', 'always same'] },
      { text: 'Быстрое вычисление', keywords: ['быстр', 'fast', 'o(1)'] },
      { text: 'Равномерное распределение', keywords: ['равномер', 'uniform', 'распредел'] },
      { text: 'Использует весь ключ (порядок символов для строк)', keywords: ['весь ключ', 'whole key', 'порядок', 'polynomial', 'полином'] },
      { text: 'Простое m разрушает закономерности (пример с кратностью)', keywords: ['прост', 'prime', 'кратн', 'закономер', 'pattern'] },
    ],
  },
];
