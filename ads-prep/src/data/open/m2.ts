import type { OpenQuestion } from '../../types';

export const openM2: OpenQuestion[] = [
  {
    id: 'm2-o1',
    module: 'm2',
    topic: 'kmp',
    en: 'Explain how KMP avoids unnecessary comparisons.',
    ru: 'Объясните, как KMP избегает лишних сравнений.',
    model:
      'Наивный алгоритм при несовпадении сдвигает pattern на 1 и заново сравнивает символы текста, которые уже видел. KMP использует то, что совпавшие j символов текста равны pattern[0..j−1]. Заранее (preprocessing, O(m)) он строит LPS array: LPS[k] — длина самого длинного proper prefix строки pattern[0..k], который также её suffix. При несовпадении на позиции j > 0 KMP ставит j = LPS[j−1], т.е. сдвигает pattern на j − LPS[j−1] позиций: промежуточные сдвиги заведомо невозможны, а первые LPS[j−1] символов уже гарантированно совпадают — их не сравнивают заново. Указатель i по тексту никогда не уменьшается, поэтому каждый символ текста участвует в O(1) сравнений амортизированно, и поиск занимает O(n), а весь алгоритм — O(n + m).',
    keyPoints: [
      { text: 'Naive перечитывает уже совпавшие символы и сдвигает pattern на 1', keywords: ['naive', 'наивн', 'сдвиг на 1', 'перечит', 'заново'] },
      { text: 'Совпавшие символы текста известны: они равны prefix pattern', keywords: ['совпавш', 'уже известн', 'prefix', 'префикс'] },
      { text: 'Preprocessing: LPS array (longest proper prefix which is also suffix)', keywords: ['lps', 'prefix function', 'префикс-функц', 'proper', 'suffix', 'суффикс'] },
      { text: 'При несовпадении j = LPS[j−1], i не двигается назад', keywords: ['lps[j-1]', 'lps[j − 1]', 'j = lps', 'не возвращ', 'не уменьша', 'назад'] },
      { text: 'Итоговая сложность O(n + m)', keywords: ['o(n + m)', 'o(n+m)', 'линейн'] },
    ],
  },
  {
    id: 'm2-o2',
    module: 'm2',
    topic: 'kmp',
    en: 'What is the purpose of the LPS array?',
    ru: 'Для чего нужен LPS array?',
    model:
      'LPS (Longest Proper Prefix which is also Suffix) array, или prefix function, для каждого индекса k хранит длину самого длинного proper prefix строки pattern[0..k], который одновременно является её suffix (border). Он строится только по pattern за O(m) времени и O(m) памяти. Во время поиска он говорит, куда «откатить» j при несовпадении: если совпало j символов, то следующий возможный кандидат — border длины LPS[j−1], поэтому j = LPS[j−1], а pattern сдвигается на j − LPS[j−1]. После полного совпадения j = LPS[m−1], что позволяет находить перекрывающиеся вхождения. Без LPS пришлось бы возвращаться назад по тексту, как в naive.',
    keyPoints: [
      { text: 'Определение: длина longest proper prefix of pattern[0..k] that is also suffix', keywords: ['proper prefix', 'suffix', 'суффикс', 'border', 'longest', 'самый длинн'] },
      { text: 'Строится по pattern за O(m)', keywords: ['o(m)', 'preprocessing', 'предобработ', 'заранее'] },
      { text: 'При несовпадении j = LPS[j−1] — на сколько сдвинуть pattern', keywords: ['lps[j-1]', 'lps[j − 1]', 'сдвиг', 'shift', 'откат'] },
      { text: 'Позволяет не возвращать i назад / не перепроверять совпавшие символы', keywords: ['не возвращ', 'назад', 'повторн', 'лишн'] },
      { text: 'После полного совпадения j = LPS[m−1] для перекрывающихся вхождений', keywords: ['lps[m-1]', 'lps[m − 1]', 'перекрыв', 'overlap'] },
    ],
  },
  {
    id: 'm2-o3',
    module: 'm2',
    topic: 'kmp',
    en: 'Why does the text pointer i never move backwards in KMP?',
    ru: 'Почему в KMP указатель i по тексту никогда не движется назад?',
    model:
      'Инвариант KMP: text[i−j..i−1] == pattern[0..j−1]. При несовпадении text[i] ≠ pattern[j] любое вхождение, начинающееся внутри уже просмотренного участка, должно начинаться с suffix совпавшей части, равного prefix pattern, то есть с border строки pattern[0..j−1]. Самый длинный border имеет длину LPS[j−1], поэтому все сдвиги меньше j − LPS[j−1] невозможны, а для ближайшего возможного сдвига первые LPS[j−1] символов уже совпадают. Значит, вся нужная информация о прочитанных символах содержится в j и LPS, и сравнение можно продолжить с того же text[i] против pattern[LPS[j−1]]. Поэтому i только растёт, а KMP подходит даже для потоков данных.',
    keyPoints: [
      { text: 'Инвариант: совпавшая часть текста равна pattern[0..j−1]', keywords: ['инвариант', 'invariant', 'pattern[0..j', 'совпавш'] },
      { text: 'Следующий кандидат начинается с border совпавшей части', keywords: ['border', 'suffix', 'суффикс', 'prefix', 'префикс'] },
      { text: 'Промежуточные сдвиги невозможны — их не нужно проверять', keywords: ['невозможн', 'пропуск', 'skip', 'не нужно провер'] },
      { text: 'Продолжаем с того же text[i] и j = LPS[j−1]', keywords: ['lps[j-1]', 'lps[j − 1]', 'тот же', 'text[i]'] },
      { text: 'Следствие: O(n) поиск / подходит для потоков', keywords: ['o(n)', 'поток', 'stream', 'один проход'] },
    ],
  },
  {
    id: 'm2-o4',
    module: 'm2',
    topic: 'kmp',
    en: 'Explain why KMP runs in O(n + m) time.',
    ru: 'Объясните, почему KMP работает за O(n + m).',
    model:
      'Алгоритм состоит из двух частей. Построение LPS: каждая итерация цикла либо увеличивает i (не более m − 1 раз), либо уменьшает len (len = lps[len−1] < len). Так как len увеличивается только вместе с i, суммарно он может уменьшиться не более m − 1 раз — всего ≤ 2m итераций, O(m). Поиск: каждая итерация делает одно сравнение и либо увеличивает i (≤ n раз), либо уменьшает j. j растёт только вместе с i, поэтому общее уменьшение j ≤ n. Итого ≤ 2n итераций, O(n). Вместе O(n + m) в худшем случае; это amortized analysis. Память — O(m) на LPS.',
    keyPoints: [
      { text: 'Две фазы: LPS O(m) и поиск O(n)', keywords: ['o(m)', 'o(n)', 'две', 'lps', 'поиск'] },
      { text: 'Каждая итерация увеличивает i или уменьшает j (len)', keywords: ['увеличива', 'уменьша', 'либо', 'increase', 'decrease'] },
      { text: 'j уменьшается не чаще, чем увеличивается — не больше n раз', keywords: ['не больше', 'не чаще', 'суммарн', 'не более'] },
      { text: 'Итого ≤ 2n (и ≤ 2m) итераций — amortized analysis', keywords: ['2n', '2m', 'amortized', 'амортиз'] },
      { text: 'Это худший случай, в отличие от naive O(n·m)', keywords: ['худш', 'worst', 'o(nm)', 'o(n·m)', 'o(n*m)'] },
    ],
  },
  {
    id: 'm2-o5',
    module: 'm2',
    topic: 'kmp',
    en: 'Compare the KMP and Rabin-Karp algorithms.',
    ru: 'Сравните алгоритмы KMP и Rabin-Karp.',
    model:
      'Оба решают задачу string matching и делают O(m) preprocessing. Rabin-Karp вычисляет hash образца и rolling hash каждого окна текста за O(1); при совпадении хешей проверяет символы, так как возможны spurious hits (collisions). Среднее время O(n + m), худшее — O(n·m), доп. память O(1). Он удобен для поиска многих образцов одной длины и 2D-поиска. KMP строит LPS array и при несовпадении сдвигает pattern по нему, не возвращаясь назад по тексту; время O(n + m) гарантированно даже в худшем случае, память O(m), нет хешей и коллизий, подходит для потоков. Выбор: KMP — когда нужна гарантия по времени для одного образца; Rabin-Karp — когда образцов много или нужна простота.',
    keyPoints: [
      { text: 'Rabin-Karp: hash / rolling hash окон, проверка при совпадении hash', keywords: ['hash', 'хеш', 'rolling'] },
      { text: 'Rabin-Karp: spurious hits, худший O(n·m), средний O(n + m)', keywords: ['spurious', 'коллиз', 'collision', 'o(nm)', 'o(n·m)', 'o(n*m)'] },
      { text: 'KMP: LPS array, гарантированно O(n + m)', keywords: ['lps', 'o(n + m)', 'o(n+m)', 'гарант'] },
      { text: 'Память: KMP O(m), Rabin-Karp O(1)', keywords: ['o(m)', 'o(1)', 'памят', 'space'] },
      { text: 'Rabin-Karp удобен для многих образцов; KMP — для потоков/гарантий', keywords: ['много образц', 'multiple', 'несколько образц', 'поток', 'stream'] },
    ],
  },
  {
    id: 'm2-o6',
    module: 'm2',
    topic: 'kmp',
    en: 'Describe how the LPS array is built and why len = lps[len − 1] is used on a mismatch.',
    ru: 'Опишите построение LPS array и объясните, почему при несовпадении используется len = lps[len − 1].',
    model:
      'lps[0] = 0, len = 0, i = 1. Пока i < m: если pattern[i] == pattern[len], то len += 1, lps[i] = len, i += 1 (border удлинился). Если не равно и len > 0, то len = lps[len − 1], а i не меняется. Если не равно и len == 0, то lps[i] = 0, i += 1. Откат объясняется так: pattern[0..len−1] — текущий border строки pattern[0..i−1]. Если его нельзя продлить, следующий по длине кандидат должен быть одновременно prefix pattern и suffix этого border, т.е. border самого border; самый длинный такой — lps[len − 1]. Сброс в 0 потерял бы короткие borders: для «AAACAAAA» получилось бы lps[7] = 1 вместо 3. Сложность O(m) амортизированно.',
    keyPoints: [
      { text: 'Инициализация: lps[0] = 0, len = 0, i = 1', keywords: ['lps[0] = 0', 'lps[0]=0', 'i = 1', 'i=1', 'len = 0'] },
      { text: 'Совпадение: len += 1, lps[i] = len, i += 1', keywords: ['len += 1', 'len++', 'lps[i] = len', 'удлин', 'продл'] },
      { text: 'Несовпадение и len > 0: len = lps[len−1], i не меняется', keywords: ['lps[len-1]', 'lps[len − 1]', 'не меняется', 'i стоит', 'не двига'] },
      { text: 'Причина: следующий кандидат — border текущего border', keywords: ['border', 'бордер', 'suffix', 'суффикс'] },
      { text: 'Сброс в 0 даёт неверный ответ (пример)', keywords: ['aaacaaaa', 'неверн', 'потеря', 'пример'] },
      { text: 'Сложность O(m)', keywords: ['o(m)', 'линейн'] },
    ],
  },
  {
    id: 'm2-o7',
    module: 'm2',
    topic: 'kmp',
    en: 'What is the worst case of the naive string matching algorithm, and how does KMP improve it?',
    ru: 'Каков худший случай наивного поиска подстроки и как KMP его улучшает?',
    model:
      'Naive проверяет все n − m + 1 сдвигов и на каждом сравнивает до m символов, итого O((n − m + 1)·m) = O(n·m). Худший вход — text = "AAAA…A", pattern = "AA…AB": на каждом сдвиге совпадает m − 1 символов, ошибка на последнем, и при сдвиге на 1 те же символы перечитываются. KMP заранее строит LPS за O(m) и при ошибке сдвигает pattern на j − LPS[j−1], не возвращая указатель по тексту. На том же входе после ошибки j = LPS[m−2] = m − 2, и сравнение продолжается с того же символа, поэтому общее число сравнений ≤ 2n, а время — O(n + m).',
    keyPoints: [
      { text: 'Naive: O(n·m) — до m сравнений на каждом из n − m + 1 сдвигов', keywords: ['o(nm)', 'o(n·m)', 'o(n*m)', 'n − m + 1', 'n - m + 1'] },
      { text: 'Пример худшего входа: AAAA…A и AA…AB', keywords: ['aaaa', 'aaab', 'повтор'] },
      { text: 'Naive перечитывает символы (возвращается назад)', keywords: ['назад', 'перечит', 'повторн'] },
      { text: 'KMP: LPS и сдвиг на j − LPS[j−1]', keywords: ['lps', 'сдвиг', 'shift'] },
      { text: 'KMP: O(n + m), ≤ 2n сравнений', keywords: ['o(n + m)', 'o(n+m)', '2n'] },
    ],
  },
  {
    id: 'm2-o8',
    module: 'm2',
    topic: 'kmp',
    en: 'How does KMP find overlapping occurrences of a pattern?',
    ru: 'Как KMP находит перекрывающиеся вхождения образца?',
    model:
      'Когда j становится равным m (все символы совпали), KMP записывает позицию i − m (если i уже увеличен) и вместо j = 0 ставит j = LPS[m − 1]. LPS[m − 1] — длина самого длинного border всего pattern: эти символы в конце найденного вхождения уже совпадают с началом pattern, поэтому следующее вхождение может начаться внутри текущего. Например, text = "AAAAA", pattern = "AA", LPS = [0,1]: после каждого совпадения j = 1, найдены позиции 0, 1, 2, 3. Если по ошибке поставить j = 0, найдётся только [0, 2].',
    keyPoints: [
      { text: 'После полного совпадения j = LPS[m − 1], а не 0', keywords: ['lps[m-1]', 'lps[m − 1]', 'не 0', 'не ноль'] },
      { text: 'LPS[m − 1] — самый длинный border всего pattern', keywords: ['border', 'suffix', 'суффикс', 'prefix'] },
      { text: 'Следующее вхождение может начаться внутри текущего', keywords: ['внутри', 'перекрыв', 'overlap'] },
      { text: 'Пример с AAAAA / AA', keywords: ['aaaaa', 'aa', '0, 1, 2, 3', '0,1,2,3'] },
    ],
  },
];
