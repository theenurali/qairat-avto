import type { OpenQuestion } from '../../types';

export const openM4: OpenQuestion[] = [
  {
    id: 'm4-o1',
    module: 'm4',
    topic: 'dfs',
    en: 'What is the difference between BFS and DFS?',
    ru: 'В чём разница между BFS и DFS?',
    model:
      'BFS (Breadth-First Search) обходит граф по слоям: сначала все вершины на расстоянии 1 от старта, потом на расстоянии 2 и т. д. Он использует Queue (FIFO) и помечает вершину visited при добавлении в очередь. DFS (Depth-First Search) идёт по одной ветке как можно глубже, а в тупике возвращается назад (backtracking); он использует Stack (LIFO) — явный или call stack рекурсии. Оба работают за O(V + E) на adjacency list и требуют O(V) памяти, но BFS хранит целый уровень (ширину), а DFS — текущий путь (глубину). BFS находит кратчайший путь по числу рёбер в невзвешенном графе, DFS этого не гарантирует. DFS удобен для поиска циклов, Topological Sort, компонент связности, лабиринтов и backtracking.',
    keyPoints: [
      { text: 'BFS использует Queue (FIFO), DFS — Stack (LIFO) / рекурсию', keywords: ['queue', 'очеред', 'stack', 'стек', 'fifo', 'lifo', 'рекурс'] },
      { text: 'BFS обходит по слоям (уровням), DFS — вглубь с backtracking', keywords: ['сло', 'уров', 'level', 'layer', 'глуб', 'depth', 'backtrack', 'возвра'] },
      { text: 'BFS находит кратчайший путь в невзвешенном графе, DFS — нет', keywords: ['кратчайш', 'shortest'] },
      { text: 'Оба O(V + E) по времени', keywords: ['o(v + e)', 'o(v+e)', 'v + e', 'v+e'] },
      { text: 'Память: BFS ~ ширина уровня, DFS ~ глубина пути', keywords: ['памят', 'memory', 'space', 'ширин', 'width'] },
      { text: 'Типичные применения DFS: циклы, topological sort, компоненты', keywords: ['цикл', 'cycle', 'topolog', 'топол', 'компонент', 'component'] },
    ],
  },
  {
    id: 'm4-o2',
    module: 'm4',
    topic: 'topo',
    en: 'Why does Topological Sort require a DAG?',
    ru: 'Почему топологической сортировке нужен DAG?',
    model:
      'Topological Sort — это порядок вершин, в котором для каждого ребра u → v вершина u стоит раньше v. Если в графе есть направленный цикл v1 → v2 → … → vk → v1, то нужно pos(v1) < pos(v2) < … < pos(vk) < pos(v1), то есть v1 раньше самой себя — противоречие, поэтому порядка не существует. Наоборот, в любом DAG есть вершина с in-degree 0 (иначе, идя назад по входящим рёбрам, мы повторили бы вершину и нашли цикл). Её можно поставить первой, удалить и повторить — так строится сортировка (Kahn). Для неориентированных графов сортировка не определена: ребро u–v работает в обе стороны (цикл длины 2).',
    keyPoints: [
      { text: 'Определение: для каждого ребра u → v вершина u раньше v', keywords: ['u → v', 'u->v', 'раньше', 'before', 'каждого ребра', 'every edge'] },
      { text: 'Цикл даёт противоречие: вершина должна стоять раньше самой себя', keywords: ['противореч', 'contradiction', 'самой себя', 'itself', 'раньше себя'] },
      { text: 'DAG = directed acyclic graph, нет направленных циклов', keywords: ['acyclic', 'ацикл', 'без цикл', 'no cycle', 'dag'] },
      { text: 'В DAG всегда есть вершина с in-degree 0, поэтому сортировка существует', keywords: ['in-degree 0', 'in-degree', 'входящ', 'source', 'источник'] },
      { text: 'Неориентированное ребро — это цикл в обе стороны', keywords: ['неориентир', 'undirected', 'обе стороны', 'both directions'] },
    ],
  },
  {
    id: 'm4-o3',
    module: 'm4',
    topic: 'topo',
    en: "Explain Kahn's Algorithm for Topological Sort.",
    ru: "Объясните Kahn's Algorithm для топологической сортировки.",
    model:
      'Сначала считаем in-degree каждой вершины — число входящих рёбер. Все вершины с in-degree 0 (у них нет зависимостей) кладём в очередь. Пока очередь не пуста: извлекаем вершину u, добавляем её в ответ и «удаляем» её исходящие рёбра — для каждого ребра u → v уменьшаем in-degree[v] на 1; если он стал 0, кладём v в очередь. Если в итоге в ответе меньше V вершин, оставшиеся вершины лежат на направленном цикле (или зависят от него) и сортировки не существует. Время O(V + E): каждое ребро обрабатывается дважды (подсчёт и уменьшение), каждая вершина один раз проходит через очередь. Память O(V).',
    keyPoints: [
      { text: 'Считаем in-degree всех вершин', keywords: ['in-degree', 'входящ', 'indeg'] },
      { text: 'В очередь кладём все вершины с in-degree 0', keywords: ['in-degree 0', 'нулев', 'queue', 'очеред'] },
      { text: 'Извлекаем вершину, добавляем в ответ, уменьшаем in-degree соседей', keywords: ['уменьш', 'decrement', 'декремент', '-= 1', 'сосед'] },
      { text: 'Сосед с in-degree 0 добавляется в очередь', keywords: ['станов', 'became 0', 'стал 0', 'становится 0', 'enqueue', 'добавля'] },
      { text: 'Если в ответе меньше V вершин — есть цикл', keywords: ['цикл', 'cycle', 'меньше', 'len(order)', 'fewer'] },
      { text: 'Сложность O(V + E)', keywords: ['o(v + e)', 'o(v+e)', 'v + e', 'v+e'] },
    ],
  },
  {
    id: 'm4-o4',
    module: 'm4',
    topic: 'dfs',
    en: 'Compare iterative and recursive DFS. When would you prefer each?',
    ru: 'Сравните iterative и recursive DFS. Когда какой предпочтительнее?',
    model:
      'Recursive DFS использует call stack Python: функция visit(u) помечает u, затем рекурсивно вызывается для каждого непосещённого соседа. Код короткий, и postorder (finish time) получается естественно — это код после цикла по соседям, поэтому рекурсия удобна для Topological Sort и классификации рёбер. Минус: глубина рекурсии может достигать V, а лимит Python около 1000 → RecursionError на длинных цепочках. Iterative DFS хранит явный стек (list с append/pop): снимаем вершину, если она уже visited — пропускаем, иначе помечаем и кладём непосещённых соседей в обратном порядке, чтобы порядок совпал с рекурсивным. Он не ограничен recursion limit, но postorder получить сложнее, а стек может содержать дубликаты (до O(E) элементов). Оба работают за O(V + E).',
    keyPoints: [
      { text: 'Recursive использует call stack, iterative — явный stack', keywords: ['call stack', 'стек вызов', 'явн', 'explicit', 'stack'] },
      { text: 'Recursion limit (~1000) → RecursionError на глубоких графах', keywords: ['recursion limit', 'recursionerror', 'лимит', 'переполн', 'stack overflow', 'глубин'] },
      { text: 'Iterative: pop, проверка visited, push соседей в обратном порядке', keywords: ['обратн', 'reverse', 'pop', 'push'] },
      { text: 'Recursive естественно даёт postorder / finish time', keywords: ['postorder', 'finish', 'заверш'] },
      { text: 'Оба O(V + E)', keywords: ['o(v + e)', 'o(v+e)', 'v + e', 'v+e'] },
    ],
  },
  {
    id: 'm4-o5',
    module: 'm4',
    topic: 'dfs',
    en: 'How can DFS be used to detect a cycle in a directed graph? How is it different for an undirected graph?',
    ru: 'Как с помощью DFS найти цикл в ориентированном графе? Чем отличается неориентированный случай?',
    model:
      'В ориентированном графе используют три цвета: WHITE — не посещена, GRAY — вершина в текущем стеке вызовов (мы внутри неё), BLACK — полностью обработана. Если из вершины u найдено ребро в GRAY вершину v, это back edge: v — предок u, и путь v → … → u → v образует направленный цикл. Ребро в BLACK вершину цикла не означает (например A→B, A→C, B→C), поэтому одного visited недостаточно. В неориентированном графе достаточно visited и parent: если сосед уже visited и не является родителем текущей вершины, найден цикл. DFS нужно запускать из каждой непосещённой вершины (внешний цикл), так как граф может быть несвязным. Время O(V + E).',
    keyPoints: [
      { text: 'Три цвета WHITE / GRAY / BLACK', keywords: ['white', 'gray', 'grey', 'black', 'бел', 'сер', 'черн', 'цвет'] },
      { text: 'Ребро в GRAY вершину = back edge = цикл', keywords: ['back edge', 'обратн', 'gray', 'grey', 'сер'] },
      { text: 'Ребро в BLACK — не цикл, одного visited мало', keywords: ['black', 'черн', 'недостаточ', 'not enough', 'ложн'] },
      { text: 'Неориентированный: visited-сосед, который не parent', keywords: ['parent', 'родител'] },
      { text: 'Внешний цикл по всем вершинам (несвязный граф)', keywords: ['внешн', 'все вершин', 'every vertex', 'all vertices', 'несвяз', 'disconnected'] },
    ],
  },
  {
    id: 'm4-o6',
    module: 'm4',
    topic: 'dfs',
    en: 'What is the time and space complexity of DFS? Explain why.',
    ru: 'Какова временная и пространственная сложность DFS? Объясните почему.',
    model:
      'На adjacency list DFS работает за O(V + E): каждая вершина посещается ровно один раз благодаря visited (O(V)), и при посещении её список соседей просматривается один раз; сумма длин всех списков — E для ориентированного и 2E для неориентированного графа (O(E)). На adjacency matrix поиск соседей вершины требует просмотра целой строки длины V, поэтому время O(V²). Дополнительная память O(V): множество visited и стек — call stack рекурсии в худшем случае (граф-цепочка) содержит V кадров. В iterative версии со стеком, допускающим дубликаты, стек может вырасти до O(E).',
    keyPoints: [
      { text: 'Время O(V + E) на adjacency list', keywords: ['o(v + e)', 'o(v+e)', 'v + e', 'v+e'] },
      { text: 'Каждая вершина посещается один раз, каждое ребро просматривается O(1) раз', keywords: ['один раз', 'once', 'каждая вершина', 'each vertex', 'каждое ребро'] },
      { text: 'O(V²) на adjacency matrix', keywords: ['o(v²)', 'o(v^2)', 'v^2', 'v²', 'matrix', 'матриц'] },
      { text: 'Память O(V): visited + стек/рекурсия', keywords: ['o(v)', 'visited', 'стек', 'stack', 'рекурс'] },
      { text: 'Худший случай глубины — цепочка из V вершин', keywords: ['цепоч', 'chain', 'path', 'глубин', 'depth'] },
    ],
  },
  {
    id: 'm4-o7',
    module: 'm4',
    topic: 'topo',
    en: 'How does DFS-based Topological Sort work, and why does reversing the finish order give a valid ordering?',
    ru: 'Как работает Topological Sort через DFS и почему развёрнутый порядок завершения корректен?',
    model:
      'Запускаем DFS из каждой ещё не посещённой вершины (внешний цикл). Когда вызов visit(u) заканчивается — все исходящие рёбра u обработаны — добавляем u в finish list (postorder). В конце разворачиваем список. Корректность: рассмотрим ребро u → v в момент его обработки внутри visit(u). Если v WHITE, мы зайдём в v и выйдем из неё раньше, чем из u. Если v BLACK, она уже завершена. Если v GRAY — это back edge, значит, есть цикл и граф не DAG. Значит, в DAG всегда f[v] < f[u], v стоит в finish list раньше u, а после разворота u оказывается перед v. Время O(V + E).',
    keyPoints: [
      { text: 'Внешний цикл: DFS из каждой непосещённой вершины', keywords: ['внешн', 'кажд', 'every', 'all vertices', 'все вершин'] },
      { text: 'Вершина добавляется в список при завершении (postorder)', keywords: ['заверш', 'finish', 'postorder', 'post-order'] },
      { text: 'Список разворачивается (reverse)', keywords: ['разворач', 'развер', 'reverse', 'обратн'] },
      { text: 'Для ребра u → v: v завершается раньше u (f[v] < f[u])', keywords: ['f[v] < f[u]', 'раньше', 'before', 'earlier'] },
      { text: 'Ребро в GRAY вершину означает цикл', keywords: ['gray', 'grey', 'сер', 'back edge', 'цикл', 'cycle'] },
    ],
  },
  {
    id: 'm4-o8',
    module: 'm4',
    topic: 'dfs',
    en: 'How do you traverse a disconnected graph with DFS and count its connected components?',
    ru: 'Как обойти несвязный граф с помощью DFS и посчитать компоненты связности?',
    model:
      'Один вызов DFS из start посещает только компоненту связности, в которой лежит start, — в другие компоненты нет рёбер. Поэтому используют внешний цикл по всем вершинам: for s in graph: if s not in visited: count += 1; visit(s). Каждый запуск обходит целиком одну новую компоненту, а visited общий, так что уже обойдённые вершины повторно не запускаются. Число запусков равно числу компонент; изолированная вершина — отдельная компонента. Общее время остаётся O(V + E), потому что каждая вершина и каждое ребро обрабатываются один раз.',
    keyPoints: [
      { text: 'Один DFS обходит только свою компоненту', keywords: ['компонент', 'component', 'только', 'only'] },
      { text: 'Внешний цикл по всем вершинам с проверкой visited', keywords: ['внешн', 'for s in', 'все вершин', 'all vertices', 'every vertex', 'цикл по'] },
      { text: 'Число запусков = число компонент', keywords: ['число запуск', 'count', 'счётчик', 'счетчик', 'количеств'] },
      { text: 'Изолированная вершина — отдельная компонента', keywords: ['изолир', 'isolated'] },
      { text: 'Время по-прежнему O(V + E)', keywords: ['o(v + e)', 'o(v+e)', 'v + e', 'v+e'] },
    ],
  },
  {
    id: 'm4-o9',
    module: 'm4',
    topic: 'dfs',
    en: 'Explain how DFS works step by step. What is the role of the visited set?',
    ru: 'Объясните пошагово, как работает DFS. Какова роль множества visited?',
    model:
      'DFS начинает со стартовой вершины: помечает её visited и перебирает соседей по порядку. Для первого непосещённого соседа он сразу рекурсивно запускает себя (уходит вглубь), а текущая вершина ждёт в call stack. Когда у вершины не остаётся непосещённых соседей, функция возвращается (backtracking) к предыдущей вершине и продолжает её цикл по соседям. Обход заканчивается, когда стек пуст. Множество visited гарантирует, что каждая вершина обрабатывается один раз: без него на любом цикле (даже на одном неориентированном ребре A–B) DFS ушёл бы в бесконечную рекурсию, а время перестало бы быть O(V + E). Помечать вершину нужно сразу при входе.',
    keyPoints: [
      { text: 'Помечаем вершину visited при входе', keywords: ['помеча', 'mark', 'visited', 'при вход'] },
      { text: 'Рекурсивно идём в первого непосещённого соседа (вглубь)', keywords: ['рекурс', 'recurs', 'вглубь', 'deep', 'сосед'] },
      { text: 'Backtracking, когда непосещённых соседей нет', keywords: ['backtrack', 'возвра', 'return', 'назад', 'тупик'] },
      { text: 'Стек (call stack) хранит путь', keywords: ['stack', 'стек'] },
      { text: 'visited предотвращает бесконечный цикл и повторную обработку', keywords: ['бесконеч', 'infinite', 'повтор', 'дважды', 'twice'] },
    ],
  },
];
