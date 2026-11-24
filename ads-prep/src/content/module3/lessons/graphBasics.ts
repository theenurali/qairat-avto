import type { Lesson } from '../../../types';

export const graphBasicsLesson: Lesson = {
  id: 'm3-graph-basics',
  title: 'Графы с нуля',
  subtitle: 'Vertices, edges, directed / undirected, degree, path, cycle, connected components',
  topic: 'graphrep',
  minutes: 20,
  blocks: [
    { kind: 'h2', text: 'Что такое граф (Graph)' },
    {
      kind: 'p',
      text: '**Граф** — это способ описать *объекты* и *связи между ними*. Формально граф записывают как `G = (V, E)`, где **V** — множество вершин (**vertices**, ещё говорят *nodes*), а **E** — множество рёбер (**edges**). Каждое ребро соединяет две вершины.',
    },
    {
      kind: 'p',
      text: 'Граф ничего не знает о координатах: неважно, где нарисована вершина и какой длины линия. Важно только **кто с кем соединён**. Один и тот же граф можно нарисовать тысячей способов.',
    },
    {
      kind: 'analogy',
      title: 'Аналогия: соцсеть и метро',
      text: 'В соцсети люди — это вершины, а «дружба» — рёбра. Дружба взаимна, поэтому это **undirected** граф. В Instagram «подписка» односторонняя: я подписан на звезду, но она на меня — нет. Это **directed** граф.\nСхема метро — тоже граф: станции — вершины, перегоны — рёбра. Если на рёбрах написать время в пути, получится **weighted** граф.',
    },
    { kind: 'viz', id: 'm3-graph-types', caption: 'Четыре базовых вида графов' },

    { kind: 'h2', text: 'Словарь терминов' },
    {
      kind: 'table',
      headers: ['Термин (EN)', 'По-русски', 'Что значит'],
      rows: [
        ['vertex / node', 'вершина', 'объект графа (человек, станция, задача)'],
        ['edge', 'ребро', 'связь между двумя вершинами'],
        ['adjacent / neighbours', 'смежные / соседи', 'u и v смежные, если есть ребро (u, v)'],
        ['directed edge (arc)', 'дуга', 'ребро с направлением u → v'],
        ['degree deg(v)', 'степень', 'сколько рёбер касается v (undirected)'],
        ['in-degree / out-degree', 'полустепень захода / исхода', 'сколько дуг входит в v / выходит из v'],
        ['path', 'путь', 'последовательность вершин, где соседние соединены ребром'],
        ['simple path', 'простой путь', 'путь без повторяющихся вершин'],
        ['cycle', 'цикл', 'путь, который возвращается в начальную вершину'],
        ['self-loop', 'петля', 'ребро из вершины в саму себя (v, v)'],
        ['connected graph', 'связный граф', 'из любой вершины можно дойти до любой'],
        ['connected component', 'компонента связности', 'максимальная группа вершин, достижимых друг из друга'],
        ['weighted graph', 'взвешенный граф', 'у каждого ребра есть число — вес'],
      ],
    },

    { kind: 'h3', text: 'Directed vs Undirected' },
    {
      kind: 'p',
      text: 'В **undirected** графе ребро `{u, v}` — это двусторонняя дорога: из u можно в v и из v в u. В **directed** графе дуга `(u, v)` — улица с односторонним движением: только u → v. Поэтому в directed графе различают **in-degree** (сколько стрелок входит) и **out-degree** (сколько выходит).',
    },
    {
      kind: 'note',
      title: 'Лемма о рукопожатиях (Handshaking Lemma)',
      text: 'В undirected графе **сумма степеней всех вершин = 2·|E|**, потому что каждое ребро добавляет +1 к степени *обоих* концов. Следствие: число вершин с нечётной степенью всегда чётно.\nВ directed графе: **Σ in-degree = Σ out-degree = |E|** — каждая дуга имеет ровно один хвост и одну голову.',
    },

    { kind: 'h3', text: 'Сколько вообще может быть рёбер?' },
    {
      kind: 'p',
      text: 'Если нет петель и кратных рёбер (*simple graph*), то в undirected графе каждая пара вершин соединена максимум одним ребром: `|E| ≤ V·(V−1)/2`. В directed графе пара (u, v) и (v, u) — разные дуги: `|E| ≤ V·(V−1)`. Значит, всегда `E = O(V²)`.',
    },
    {
      kind: 'list',
      items: [
        '**Sparse graph** (разреженный): рёбер мало, `E ≈ V` (дороги между городами, дерево, соцсеть — у человека сотни друзей, а не миллиарды).',
        '**Dense graph** (плотный): рёбер много, `E ≈ V²` (полный граф, где каждый связан с каждым).',
        'От этого зависит выбор представления графа (следующий урок) и итоговая сложность алгоритмов: `O(V + E)` для sparse графа ≈ `O(V)`, а для dense ≈ `O(V²)`.',
      ],
    },

    {
      kind: 'steps',
      title: 'Пример: считаем степени в графе модуля',
      steps: [
        {
          title: 'Граф',
          text: 'Undirected граф: V = {A, B, C, D, E, F}, рёбра: A–B, A–C, B–D, C–D, C–E, D–F, E–F. Всего |E| = 7.',
          state: 'A–B  A–C  B–D  C–D  C–E  D–F  E–F',
        },
        {
          title: 'Степень каждой вершины',
          text: 'Для каждой вершины считаем, в скольких рёбрах она встречается.',
          state: 'deg(A)=2  (B, C)\ndeg(B)=2  (A, D)\ndeg(C)=3  (A, D, E)\ndeg(D)=3  (B, C, F)\ndeg(E)=2  (C, F)\ndeg(F)=2  (D, E)',
        },
        {
          title: 'Проверка леммы',
          text: 'Сумма степеней 2+2+3+3+2+2 = 14 = 2·7. Сходится: каждое ребро посчитано дважды.',
          state: 'Σ deg = 14 = 2·|E|',
        },
        {
          title: 'Пути и циклы',
          text: 'A → B → D → F — простой путь длины 3 (3 ребра). A → B → D → C → A — цикл длины 4. Граф связный: из A можно добраться до любой вершины, значит одна connected component.',
          state: 'path:  A-B-D-F  (length 3)\ncycle: A-B-D-C-A (length 4)',
        },
      ],
    },

    { kind: 'h2', text: 'Граф в Python' },
    {
      kind: 'code',
      caption: 'Самый частый способ: словарь «вершина → список соседей»',
      cpp: `// вершины A,B,C,D,E,F = 0,1,2,3,4,5
vector<vector<int>> graph = {
    {1, 2},        // A: B, C
    {0, 3},        // B: A, D
    {0, 3, 4},     // C: A, D, E
    {1, 2, 5},     // D: B, C, F
    {2, 5},        // E: C, F
    {3, 4},        // F: D, E
};

vector<int> degrees(const vector<vector<int>>& graph) {
    vector<int> deg;
    for (const auto& neighbours : graph)
        deg.push_back(neighbours.size());
    return deg;
}

int main() {
    vector<int> deg = degrees(graph);
    int num_edges = accumulate(deg.begin(), deg.end(), 0) / 2;  // handshaking lemma
    cout << num_edges << endl;                                   // 7
}`,
      cppExplain: [
        { line: 2, text: "Граф храним как vector<vector<int>>: индекс — номер вершины, внутри — список соседей (Adjacency List). Буквы заменены числами 0..5." },
        { line: 3, text: "У A (0) два соседа. В undirected графе ребро A–B записано дважды: 1 есть у 0, и 0 есть у 1." },
        { line: 14, text: "Степень вершины = размер её списка соседей; size() у vector — O(1)." },
        { line: 20, text: "Каждое ребро посчитано дважды (у обоих концов), поэтому сумму степеней делим на 2. accumulate суммирует элементы vector." },
      ],
      code: `graph = {
    'A': ['B', 'C'],
    'B': ['A', 'D'],
    'C': ['A', 'D', 'E'],
    'D': ['B', 'C', 'F'],
    'E': ['C', 'F'],
    'F': ['D', 'E'],
}

def degrees(graph):
    return {v: len(neighbours) for v, neighbours in graph.items()}

deg = degrees(graph)
num_edges = sum(deg.values()) // 2   # handshaking lemma
print(deg, num_edges)                # ... 7`,
      explain: [
        { line: 1, text: 'Граф храним как dict: ключ — вершина, значение — список соседей (это и есть Adjacency List).' },
        { line: 2, text: 'У A два соседа. В undirected графе ребро A–B записано дважды: B есть у A, и A есть у B.' },
        { line: 11, text: 'Степень вершины в undirected графе = длина её списка соседей.' },
        { line: 14, text: 'Каждое ребро посчитано дважды (у обоих концов), поэтому делим сумму степеней на 2.' },
      ],
    },
    {
      kind: 'code',
      caption: 'Directed граф: in-degree и out-degree',
      cpp: `vector<vector<int>> digraph = {{1, 2}, {3}, {3}, {}};

int main() {
    int n = digraph.size();
    vector<int> out_deg(n), in_deg(n, 0);
    for (int v = 0; v < n; v++) out_deg[v] = digraph[v].size();
    for (int u = 0; u < n; u++)
        for (int v : digraph[u])
            in_deg[v]++;          // дуга u -> v входит в v

    // out_deg = {2, 1, 1, 0}
    // in_deg  = {0, 1, 1, 2}
}`,
      cppExplain: [
        { line: 1, text: "В directed графе дуга 0 → 1 хранится только в списке вершины 0." },
        { line: 6, text: "out-degree — размер списка исходящих дуг." },
        { line: 7, text: "Для in-degree проходим по всем дугам: O(V + E). Это пригодится в Kahn's Algorithm (Module 4)." },
      ],
      code: `digraph = {0: [1, 2], 1: [3], 2: [3], 3: []}

out_deg = {v: len(digraph[v]) for v in digraph}
in_deg = {v: 0 for v in digraph}
for u in digraph:
    for v in digraph[u]:
        in_deg[v] += 1          # дуга u -> v входит в v

# out_deg = {0: 2, 1: 1, 2: 1, 3: 0}
# in_deg  = {0: 0, 1: 1, 2: 1, 3: 2}`,
      explain: [
        { line: 1, text: 'В directed графе дуга 0 → 1 хранится только в списке вершины 0.' },
        { line: 3, text: 'out-degree — длина списка исходящих дуг.' },
        { line: 5, text: 'Для in-degree нужно пройти по всем дугам: O(V + E). Это пригодится в Kahn\'s Algorithm (Module 4).' },
      ],
    },

    {
      kind: 'complexity',
      rows: [
        { op: 'deg(v) в undirected (Adjacency List)', avg: 'O(1)', worst: 'O(1)', space: 'O(1)', why: 'len() списка в Python — O(1)' },
        { op: 'Все in-degree в directed', avg: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)', why: 'обходим каждую вершину и каждую дугу один раз' },
        { op: 'Максимум рёбер (simple, undirected)', avg: 'V(V−1)/2', worst: 'V(V−1)/2', space: '—', why: 'каждая пара вершин — максимум одно ребро' },
      ],
    },

    {
      kind: 'mistakes',
      items: [
        { mistake: 'Считать |E| как сумму длин всех списков соседей в undirected графе.', fix: 'Каждое ребро лежит в двух списках, поэтому |E| = Σ deg / 2.' },
        { mistake: 'Путать степень с in-degree в directed графе.', fix: 'В directed графе у вершины две разные величины: in-degree (входящие) и out-degree (исходящие).' },
        { mistake: 'Думать, что граф обязательно связный.', fix: 'Граф может состоять из нескольких connected components и изолированных вершин — алгоритмы должны это учитывать.' },
        { mistake: 'Считать, что расположение вершин на рисунке важно.', fix: 'Граф определяется только множествами V и E. Длина линий на рисунке ничего не значит, пока граф невзвешенный.' },
      ],
    },

    {
      kind: 'selfcheck',
      items: [
        { q: 'Сколько максимум рёбер в простом undirected графе с 6 вершинами?', a: '6·5/2 = 15.' },
        { q: 'В undirected графе сумма степеней равна 18. Сколько рёбер?', a: '18 / 2 = 9 рёбер (handshaking lemma).' },
        { q: 'Чем путь отличается от цикла?', a: 'Цикл — это путь, который начинается и заканчивается в одной вершине (и содержит хотя бы одно ребро; в простом цикле вершины, кроме первой/последней, не повторяются).' },
        { q: 'Может ли в undirected графе быть ровно 3 вершины с нечётной степенью?', a: 'Нет. Сумма степеней чётна (= 2|E|), значит количество нечётных слагаемых должно быть чётным.' },
        { q: 'Что такое connected component?', a: 'Максимальное множество вершин, в котором любые две вершины соединены путём. Добавить к нему ещё одну вершину, сохранив это свойство, нельзя.' },
      ],
    },

    {
      kind: 'practice',
      items: [
        {
          task: 'Directed граф: 1→2, 1→3, 2→3, 3→1, 3→4. Найдите in-degree и out-degree каждой вершины.',
          solution: 'out: 1→2, 2→1, 3→2, 4→0. in: 1←1 (от 3), 2←1, 3←2 (от 1 и 2), 4←1. Проверка: Σ out = Σ in = 5 = |E|.',
        },
        {
          task: 'Undirected граф: вершины A..G, рёбра A–B, B–C, D–E, F–G. Сколько компонент связности?',
          solution: 'Компоненты: {A, B, C}, {D, E}, {F, G}. Итого 3. Если бы была ещё изолированная вершина H — она была бы отдельной (4-й) компонентой.',
        },
        {
          task: 'Есть ли в графе A–B, B–C, C–D, D–B цикл? Назовите его.',
          solution: 'Да: B → C → D → B (длина 3). A в цикл не входит — у неё одно ребро.',
        },
      ],
    },

    {
      kind: 'summary',
      items: [
        'Граф G = (V, E): вершины + рёбра. Важна только структура связей.',
        'Undirected: deg(v), Σ deg = 2|E|. Directed: in-degree и out-degree, Σ in = Σ out = |E|.',
        'Simple undirected граф: |E| ≤ V(V−1)/2, directed: |E| ≤ V(V−1).',
        'Sparse (E ≈ V) vs dense (E ≈ V²) — влияет на выбор представления.',
        'Граф может быть несвязным: несколько connected components.',
      ],
    },
  ],
  miniExam: [
    {
      id: 'mini-m3-b1',
      module: 'm3',
      topic: 'graphrep',
      category: 'definition',
      question: 'Что такое in-degree вершины v в ориентированном графе?',
      options: ['Число дуг, выходящих из v', 'Число дуг, входящих в v', 'Число всех вершин, достижимых из v', 'Длина кратчайшего пути до v'],
      correct: 1,
      explanation: 'in-degree — количество дуг вида (u, v), то есть стрелок, которые указывают В вершину v. Исходящие дуги — это out-degree.',
    },
    {
      id: 'mini-m3-b2',
      module: 'm3',
      topic: 'graphrep',
      category: 'principle',
      question: 'В неориентированном графе 10 рёбер. Чему равна сумма степеней всех вершин?',
      options: ['10', '5', '20', 'Зависит от числа вершин'],
      correct: 2,
      explanation: 'Handshaking lemma: каждое ребро увеличивает степень двух вершин, поэтому Σ deg = 2|E| = 20 при любом числе вершин.',
    },
    {
      id: 'mini-m3-b3',
      module: 'm3',
      topic: 'graphrep',
      category: 'definition',
      question: 'Максимальное число рёбер в простом (без петель и кратных рёбер) неориентированном графе с V = 8 вершинами:',
      options: ['64', '56', '28', '16'],
      correct: 2,
      explanation: 'V(V−1)/2 = 8·7/2 = 28. Число 56 — это максимум для ориентированного графа, 64 — размер матрицы V².',
    },
    {
      id: 'mini-m3-b4',
      module: 'm3',
      topic: 'graphrep',
      category: 'definition',
      question: 'Граф называют sparse (разреженным), если…',
      options: ['число рёбер близко к V²', 'число рёбер порядка V (намного меньше V²)', 'в нём нет циклов', 'он несвязный'],
      correct: 1,
      explanation: 'Sparse — рёбер мало относительно максимума: E = O(V). Dense — E близко к V². Наличие циклов и связность — другие свойства.',
    },
    {
      id: 'mini-m3-b5',
      module: 'm3',
      topic: 'graphrep',
      category: 'principle',
      question: 'Undirected граф: вершины A–F, рёбра A–B, B–C, D–E. Сколько у него connected components?',
      options: ['2', '3', '4', '6'],
      correct: 1,
      explanation: 'Компоненты: {A, B, C}, {D, E} и изолированная {F}. Изолированная вершина — это тоже отдельная компонента, итого 3.',
    },
    {
      id: 'mini-m3-b6',
      module: 'm3',
      topic: 'graphrep',
      category: 'why-how',
      question: 'Почему в неориентированном графе количество вершин с нечётной степенью всегда чётно?',
      options: [
        'Потому что граф всегда связный',
        'Потому что сумма степеней равна 2|E| — чётное число',
        'Потому что у каждой вершины чётная степень',
        'Это верно только для деревьев',
      ],
      correct: 1,
      explanation: 'Σ deg = 2|E| чётна. Сумма чётна только если нечётных слагаемых чётное количество.',
    },
  ],
};
