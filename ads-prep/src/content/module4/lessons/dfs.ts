import type { Lesson } from '../../../types';

export const lessonDfs: Lesson = {
  id: 'm4-dfs',
  title: 'Depth-First Search (DFS)',
  subtitle: 'Поиск в глубину: идём до упора, потом возвращаемся (backtracking)',
  topic: 'dfs',
  minutes: 35,
  blocks: [
    { kind: 'h2', text: 'Идея за одну минуту' },
    {
      kind: 'p',
      text: "**Depth-First Search (DFS, поиск в глубину)** — способ обойти все вершины графа, до которых можно дойти из стартовой. Правило простое: *из текущей вершины иди в любого ещё не посещённого соседа и продолжай оттуда*. Когда непосещённых соседей больше нет — **вернись назад (backtrack)** к предыдущей вершине и попробуй её следующего соседа.",
    },
    {
      kind: 'analogy',
      title: 'Лабиринт и клубок ниток',
      text: "Вы в лабиринте с клубком ниток и мелом. В каждой развилке вы ставите мелом отметку «был здесь» (это **visited**) и идёте в первый ещё не отмеченный коридор. Упёрлись в тупик — сматываете нитку назад до последней развилки, где остался непройденный коридор. Нитка — это **stack** (стек): вы возвращаетесь ровно в обратном порядке. Мел нужен, чтобы не ходить по кругу.",
    },
    {
      kind: 'p',
      text: "Сравните с **BFS**, который обходит граф «волнами» (сначала все соседи, потом соседи соседей) с помощью **Queue**. DFS вместо очереди использует **Stack (LIFO — last in, first out)**: последний начатый путь продолжается первым. В рекурсивной версии этим стеком служит **call stack** (стек вызовов) самого Python.",
    },
    { kind: 'viz', id: 'm4-bfs-vs-dfs', caption: 'Один и тот же граф: BFS идёт по слоям, DFS — вглубь по одной ветке.' },

    { kind: 'h2', text: 'Соглашения, которые мы используем' },
    {
      kind: 'list',
      items: [
        "Граф хранится как **adjacency list**: `graph = {'A': ['B', 'C'], 'B': ['A', 'D', 'E'], ...}`.",
        "Соседи перебираются **в порядке возрастания** меток (A, B, C… или 1, 2, 3…). На экзамене порядок обычно задан — всегда используйте именно его.",
        "Recursive DFS помечает вершину **visited в момент входа** в `dfs(u)`.",
        "**Preorder** (порядок посещения) — когда вершину впервые увидели. **Postorder** (порядок завершения, finish) — когда все её соседи обработаны и функция делает return.",
      ],
    },

    { kind: 'h2', text: 'Recursive DFS: код' },
    {
      kind: 'code',
      caption: 'Рекурсивный DFS',
      code: `def dfs(graph, start):
    visited = set()
    order = []

    def visit(u):
        visited.add(u)          # помечаем при входе
        order.append(u)         # preorder
        for v in graph[u]:      # соседи в порядке adjacency list
            if v not in visited:
                visit(v)        # уходим вглубь
        # здесь все соседи обработаны: u «завершена» (postorder)

    visit(start)
    return order`,
      explain: [
        { line: 2, text: 'visited — множество (set): проверка `v in visited` работает за O(1) в среднем.' },
        { line: 5, text: 'Вложенная функция visit(u) — один «шаг вглубь». Каждый вызов кладёт кадр в call stack.' },
        { line: 6, text: 'Помечаем u ДО обхода соседей. Если пометить позже, на цикле A–B–A мы вернёмся в A и уйдём в бесконечную рекурсию.' },
        { line: 8, text: 'Перебираем соседей u. Порядок перебора определяет порядок обхода.' },
        { line: 9, text: 'Главная проверка: в уже посещённую вершину не идём.' },
        { line: 10, text: 'Рекурсивный вызов = «шагнуть в соседнюю комнату». Пока он не вернётся, цикл for в u стоит на паузе.' },
        { line: 11, text: 'Сюда попадаем, когда все соседи u обработаны — это и есть backtracking (возврат).' },
      ],
    },

    { kind: 'h2', text: 'Пошаговый пример' },
    {
      kind: 'p',
      text: "Граф (неориентированный): рёбра A–B, A–C, B–D, B–E, C–F, E–F. Adjacency list: `A: [B, C]`, `B: [A, D, E]`, `C: [A, F]`, `D: [B]`, `E: [B, F]`, `F: [C, E]`. Старт — A.",
    },
    {
      kind: 'steps',
      title: 'Recursive DFS из A',
      steps: [
        { title: 'dfs(A)', text: 'Помечаем A. Первый сосед A — B, он не посещён → вызываем dfs(B).', state: 'call stack: [dfs(A)]\nvisited:    {A}\norder:      A' },
        { title: 'dfs(B)', text: 'Сосед A уже visited — пропуск. Следующий сосед D не посещён → dfs(D).', state: 'call stack: [dfs(A), dfs(B)]\nvisited:    {A, B}\norder:      A B' },
        { title: 'dfs(D) — тупик', text: 'У D единственный сосед B — visited. Делать нечего → return. D завершена первой.', state: 'call stack: [dfs(A), dfs(B), dfs(D)] → [dfs(A), dfs(B)]\norder:      A B D\nfinish:     D' },
        { title: 'Назад в B → dfs(E)', text: 'Цикл for в B продолжается с места паузы: следующий сосед E → dfs(E).', state: 'call stack: [dfs(A), dfs(B), dfs(E)]\norder:      A B D E' },
        { title: 'dfs(E) → dfs(F)', text: 'B visited — пропуск. F не посещён → dfs(F).', state: 'call stack: [dfs(A), dfs(B), dfs(E), dfs(F)]\norder:      A B D E F' },
        { title: 'dfs(F) → dfs(C)', text: 'Первый сосед F — C, он ещё не посещён (из A мы ушли в B, а не в C!) → dfs(C).', state: 'call stack: [dfs(A), dfs(B), dfs(E), dfs(F), dfs(C)]\norder:      A B D E F C' },
        { title: 'dfs(C) — тупик', text: 'Соседи A и F уже visited → return. Затем по цепочке завершаются F, E, B (у них не осталось непосещённых соседей).', state: 'finish:     D C F E B\ncall stack: [dfs(A)]' },
        { title: 'Конец', text: 'В A следующий сосед C уже visited → A завершается. Стек пуст.', state: 'order  (preorder):  A B D E F C\nfinish (postorder): D C F E B A' },
      ],
    },
    { kind: 'viz', id: 'm4-dfs', caption: 'Пошаговый DFS: переключайте Recursive / Iterative, выбирайте граф и стартовую вершину или вводите свой граф.' },

    { kind: 'h2', text: 'Discovery и finish times' },
    {
      kind: 'p',
      text: "Часто DFS ведёт «часы» `time`: при входе в вершину записывает **discovery time** `d[u]`, при выходе — **finish time** `f[u]`. Для примера выше: A 1/12, B 2/11, D 3/4, E 5/10, F 6/9, C 7/8.",
    },
    {
      kind: 'code',
      caption: 'DFS с временами входа и выхода',
      code: `time = 0
disc, fin = {}, {}

def visit(u):
    global time
    time += 1
    disc[u] = time              # discovery time
    for v in graph[u]:
        if v not in disc:       # disc служит и как visited
            visit(v)
    time += 1
    fin[u] = time               # finish time`,
      explain: [
        { line: 6, text: 'Часы тикают при каждом входе и выходе — всего 2V отметок.' },
        { line: 9, text: 'Вершина посещена ⇔ у неё уже есть discovery time.' },
        { line: 12, text: 'finish time ставится после всех потомков — поэтому у предка f больше, чем у потомков.' },
      ],
    },
    {
      kind: 'note',
      title: 'Parenthesis property',
      text: "Интервалы `[d[u], f[u]]` вложены как скобки: если v — потомок u в DFS tree, то `d[u] < d[v] < f[v] < f[u]`. Именно на этом свойстве держится Topological Sort через DFS (следующие уроки).",
    },

    { kind: 'h2', text: 'DFS tree и типы рёбер' },
    {
      kind: 'p',
      text: "Рёбра, по которым DFS впервые пришёл в вершину, образуют **DFS tree** (в визуализаторе — розовые). Остальные рёбра классифицируют так:",
    },
    {
      kind: 'table',
      headers: ['Тип ребра (u → v)', 'Когда возникает', 'Что значит'],
      rows: [
        ['Tree edge', 'v была WHITE (не посещена)', 'ребро дерева обхода'],
        ['Back edge', 'v — предок u, ещё в стеке (GRAY)', 'есть цикл'],
        ['Forward edge', 'v — уже завершённый потомок u (только в орграфах)', 'обходной путь вниз'],
        ['Cross edge', 'v в другой, уже завершённой ветке (только в орграфах)', 'ребро между ветками'],
      ],
      caption: 'В неориентированном графе бывают только tree и back edges. В примере выше C–A — back edge (цикл A–B–E–F–C–A).',
    },

    { kind: 'h2', text: 'Несвязные графы (disconnected graphs)' },
    {
      kind: 'p',
      text: "Один вызов `visit(start)` посещает только **компоненту связности (connected component)**, в которой лежит start. Чтобы обойти весь граф, нужен **внешний цикл** по всем вершинам: из каждой ещё не посещённой запускаем DFS. Число запусков = число компонент.",
    },
    {
      kind: 'code',
      caption: 'Подсчёт компонент связности',
      code: `def count_components(graph):
    visited = set()
    count = 0

    def visit(u):
        visited.add(u)
        for v in graph[u]:
            if v not in visited:
                visit(v)

    for s in graph:            # внешний цикл по ВСЕМ вершинам
        if s not in visited:
            count += 1         # нашли новую компоненту
            visit(s)
    return count`,
      explain: [
        { line: 11, text: 'Без этого цикла вершины других компонент (и изолированные вершины!) никогда не будут посещены.' },
        { line: 13, text: 'Каждый новый запуск DFS начинает новую компоненту.' },
      ],
    },
    { kind: 'viz', id: 'm4-components', caption: 'Сравните: один dfs(A) и DFS с внешним циклом.' },

    { kind: 'h2', text: 'Поиск цикла с помощью DFS' },
    { kind: 'h3', text: 'Неориентированный граф: visited-сосед, который не родитель' },
    {
      kind: 'code',
      caption: 'Cycle detection (undirected)',
      code: `def has_cycle_undirected(graph):
    visited = set()

    def visit(u, parent):
        visited.add(u)
        for v in graph[u]:
            if v == parent:
                continue            # ребро назад к родителю — это не цикл
            if v in visited:
                return True         # visited и не родитель → цикл
            if visit(v, u):
                return True
        return False

    for s in graph:                 # внешний цикл: граф может быть несвязным
        if s not in visited and visit(s, None):
            return True
    return False`,
      explain: [
        { line: 7, text: 'В неориентированном графе ребро u–parent видно с обеих сторон. Без этой проверки любое ребро выглядело бы как цикл.' },
        { line: 9, text: 'Мы пришли в уже посещённую вершину не по ребру к родителю → есть другой путь к ней → цикл.' },
        { line: 15, text: 'Цикл может лежать в любой компоненте, поэтому проверяем все.' },
      ],
    },
    { kind: 'h3', text: 'Ориентированный граф: три цвета WHITE / GRAY / BLACK' },
    {
      kind: 'p',
      text: "**WHITE** — ещё не посещена, **GRAY** — мы внутри её вызова (она в call stack, на текущем пути), **BLACK** — полностью обработана. Ребро в **GRAY** вершину — это **back edge**: мы вернулись в вершину текущего пути → направленный цикл. Ребро в BLACK вершину цикла НЕ означает.",
    },
    {
      kind: 'code',
      caption: 'Cycle detection (directed)',
      code: `WHITE, GRAY, BLACK = 0, 1, 2

def has_cycle_directed(graph):
    color = {u: WHITE for u in graph}

    def visit(u):
        color[u] = GRAY                 # u на текущем пути
        for v in graph[u]:
            if color[v] == GRAY:
                return True             # back edge → цикл
            if color[v] == WHITE and visit(v):
                return True
        color[u] = BLACK                # u и все потомки обработаны
        return False

    return any(color[u] == WHITE and visit(u) for u in graph)`,
      explain: [
        { line: 7, text: 'GRAY = «сейчас в стеке вызовов».' },
        { line: 9, text: 'Попали в вершину, из которой ещё не вышли, — значит, по рёбрам можно вернуться в неё: цикл.' },
        { line: 13, text: 'Становится BLACK только после всех потомков. Ребро в BLACK — просто уже исследованная ветка.' },
        { line: 16, text: 'Запуск из каждой WHITE вершины — граф может быть несвязным.' },
      ],
    },
    {
      kind: 'warning',
      title: 'Почему одного visited мало в орграфе',
      text: "Граф A→B, A→C, B→C. DFS: A → B → C (C завершена), назад в A, ребро A→C ведёт в уже visited C. С одним visited мы бы сказали «цикл!», но цикла нет: C — BLACK, а не GRAY.",
    },

    { kind: 'h2', text: 'Recursion limit в Python' },
    {
      kind: 'p',
      text: "Глубина рекурсии DFS может достигать V (граф-«цепочка» 1–2–3–…–V). В Python по умолчанию лимит около **1000** вызовов → `RecursionError`. Решения: `sys.setrecursionlimit(...)` (рискованно — может упасть сам интерпретатор) или **Iterative DFS** с явным стеком (следующий урок).",
    },

    {
      kind: 'complexity',
      rows: [
        { op: 'DFS, adjacency list', best: 'O(V + E)', avg: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)', why: 'Каждая вершина входит в visit один раз, каждый список соседей просматривается один раз: сумма длин списков = 2E (неориент.) или E (ориент.).' },
        { op: 'DFS, adjacency matrix', best: 'O(V²)', avg: 'O(V²)', worst: 'O(V²)', space: 'O(V)', why: 'Чтобы найти соседей вершины, просматриваем целую строку матрицы из V клеток — V раз.' },
        { op: 'Подсчёт компонент / поиск цикла', avg: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)', why: 'Это тот же DFS с внешним циклом: всё равно каждая вершина и ребро обрабатываются O(1) раз.' },
      ],
    },
    {
      kind: 'note',
      title: 'Откуда O(V) памяти',
      text: "visited хранит до V вершин, а call stack в худшем случае (длинная цепочка) содержит V кадров. Сам граф (adjacency list) занимает O(V + E), но это входные данные.",
    },

    {
      kind: 'mistakes',
      items: [
        { mistake: 'Нет visited (или проверка забыта) → на графе с циклом рекурсия бесконечна (RecursionError).', fix: 'Помечайте вершину сразу при входе и проверяйте `if v not in visited` перед вызовом.' },
        { mistake: 'Вершина помечается после обхода соседей (в конце visit).', fix: 'Помечать нужно в начале visit, иначе A→B→A снова зайдёт в A.' },
        { mistake: 'Нет внешнего цикла: DFS запускается только из start, и при несвязном графе часть вершин теряется.', fix: '`for s in graph: if s not in visited: visit(s)`.' },
        { mistake: 'Поиск цикла в неориентированном графе без учёта parent → любое ребро считается циклом.', fix: 'Пропускайте ребро в родителя (`if v == parent: continue`).' },
        { mistake: 'Поиск цикла в орграфе по одному visited → ложные циклы (A→B→C, A→C).', fix: 'Используйте три цвета: цикл только при ребре в GRAY.' },
        { mistake: 'Путают preorder и postorder.', fix: 'Preorder — запись при входе, postorder — после цикла по соседям.' },
      ],
    },
    {
      kind: 'selfcheck',
      items: [
        { q: 'Какую структуру данных использует DFS и почему именно её?', a: 'Stack (LIFO). Мы всегда продолжаем самый последний начатый путь, а при тупике возвращаемся к предыдущей вершине — ровно поведение стека. В рекурсивной версии стек — это call stack.' },
        { q: 'Зачем нужен visited?', a: 'Чтобы не заходить в вершину повторно: иначе на любом цикле обход станет бесконечным, а на графе без циклов будет делать лишнюю работу.' },
        { q: 'Почему у вершины-предка finish time больше, чем у потомков?', a: 'Вызов предка закончится только после того, как вернутся все вызовы потомков (стек LIFO).' },
        { q: 'Сколько раз запустится DFS из внешнего цикла на графе с 4 компонентами связности?', a: 'Ровно 4 раза — по одному на каждую компоненту.' },
        { q: 'Чем отличается проверка цикла в неориентированном и ориентированном графе?', a: 'Неориентированный: visited-сосед, который не parent → цикл. Ориентированный: ребро в GRAY вершину (back edge) → цикл; ребро в BLACK — не цикл.' },
      ],
    },
    {
      kind: 'practice',
      items: [
        {
          task: 'Дерево: 1–2, 1–3, 2–4, 2–5, 3–6, 3–7. Выполните recursive DFS из 1 (соседи по возрастанию). Запишите preorder и postorder.',
          solution: 'Preorder: 1 2 4 5 3 6 7. Postorder: 4 5 2 6 7 3 1. (Сначала уходим 1→2→4, тупик, назад в 2 → 5, назад в 1 → 3 → 6, назад → 7.)',
        },
        {
          task: 'Вершины 1..7, рёбра 1–2, 3–4, 4–5. Сколько компонент связности найдёт count_components и какие?',
          solution: '4 компоненты: {1, 2}, {3, 4, 5}, {6}, {7}. Изолированные вершины 6 и 7 — отдельные компоненты; их находит только внешний цикл.',
        },
        {
          task: 'Для графа из пошагового примера (A–B, A–C, B–D, B–E, C–F, E–F) запишите discovery/finish times при DFS из A.',
          solution: 'A 1/12, B 2/11, D 3/4, E 5/10, F 6/9, C 7/8. Проверка вложенности: [7,8] ⊂ [6,9] ⊂ [5,10] ⊂ [2,11] ⊂ [1,12].',
        },
        {
          task: 'Орграф A→B, B→C, C→A, C→D. Что вернёт has_cycle_directed и на каком ребре?',
          solution: 'True. Путь A(GRAY) → B(GRAY) → C(GRAY), ребро C→A ведёт в GRAY вершину A — back edge → цикл.',
        },
      ],
    },
    {
      kind: 'summary',
      items: [
        'DFS идёт вглубь по одной ветке и возвращается (backtracking) при тупике; работает на Stack (явном или call stack).',
        'visited обязателен: без него циклы дают бесконечный обход.',
        'Время O(V + E) для adjacency list, O(V²) для adjacency matrix; память O(V).',
        'Несвязный граф → внешний цикл по всем вершинам; число запусков = число компонент.',
        'Цикл: undirected — visited-сосед ≠ parent; directed — ребро в GRAY (back edge).',
        'Postorder (finish) понадобится для Topological Sort.',
      ],
    },
  ],
  miniExam: [
    {
      id: 'mini-m4-dfs-1',
      module: 'm4',
      topic: 'dfs',
      category: 'definition',
      question: 'Какая структура данных лежит в основе DFS?',
      options: ['Queue (FIFO)', 'Stack (LIFO) — явный или call stack', 'Priority Queue (min-heap)', 'Hash Table'],
      correct: 1,
      explanation: 'DFS всегда продолжает последний начатый путь и возвращается в обратном порядке — это LIFO, то есть Stack. В рекурсивной версии роль стека играет call stack.',
    },
    {
      id: 'mini-m4-dfs-2',
      module: 'm4',
      topic: 'dfs',
      category: 'code',
      question: 'Граф: 1–2, 1–3, 2–4, 3–4, 4–5 (неориентированный). Recursive DFS из 1, соседи по возрастанию. Порядок посещения?',
      options: ['1 2 3 4 5', '1 2 4 5 3', '1 3 4 2 5', '1 2 4 3 5'],
      correct: 3,
      explanation: '1 → 2 → 4 (сосед 2 уже visited) → у 4 соседи [2, 3, 5]: первым непосещённым идёт 3 → у 3 всё посещено → назад в 4 → 5. Итого 1 2 4 3 5. Вариант 1 2 3 4 5 — это BFS.',
    },
    {
      id: 'mini-m4-dfs-3',
      module: 'm4',
      topic: 'dfs',
      category: 'time',
      question: 'Time complexity DFS на adjacency list?',
      options: ['O(V)', 'O(E log V)', 'O(V + E)', 'O(V²)'],
      correct: 2,
      explanation: 'Каждая вершина обрабатывается один раз, каждый список соседей просматривается один раз → O(V + E). O(V²) — для adjacency matrix.',
    },
    {
      id: 'mini-m4-dfs-4',
      module: 'm4',
      topic: 'dfs',
      category: 'why-how',
      question: 'Что произойдёт с recursive DFS без visited на графе A–B?',
      options: ['Обойдёт граф корректно', 'Бесконечная рекурсия: A → B → A → B … (RecursionError)', 'Посетит только A', 'Вернёт пустой список'],
      correct: 1,
      explanation: 'Неориентированное ребро A–B видно с обеих сторон: из B мы снова пойдём в A, из A — в B и так до переполнения стека.',
    },
    {
      id: 'mini-m4-dfs-5',
      module: 'm4',
      topic: 'dfs',
      category: 'principle',
      question: 'Как найти число компонент связности неориентированного графа с помощью DFS?',
      options: [
        'Запустить DFS из вершины 0 и посчитать посещённые вершины',
        'Посчитать число back edges',
        'Запускать DFS из каждой ещё не посещённой вершины во внешнем цикле и считать запуски',
        'Посчитать вершины с in-degree 0',
      ],
      correct: 2,
      explanation: 'Каждый запуск DFS из непосещённой вершины обходит ровно одну новую компоненту. Число запусков = число компонент.',
    },
    {
      id: 'mini-m4-dfs-6',
      module: 'm4',
      topic: 'dfs',
      category: 'principle',
      question: 'В DFS по ориентированному графу встретилось ребро u → v, где v имеет цвет GRAY. Что это значит?',
      options: ['v — изолированная вершина', 'Найдено back edge — в графе есть направленный цикл', 'Ребро ведёт в уже завершённую ветку, цикла нет', 'Граф несвязный'],
      correct: 1,
      explanation: 'GRAY = вершина в текущем стеке вызовов (предок u). Ребро от потомка к предку замыкает цикл.',
    },
    {
      id: 'mini-m4-dfs-7',
      module: 'm4',
      topic: 'dfs',
      category: 'space',
      question: 'Почему recursive DFS в Python может упасть на графе-цепочке из 100 000 вершин?',
      options: [
        'Потому что DFS работает за O(V²)',
        'visited не помещается в память',
        'Глубина рекурсии ≈ V превышает recursion limit (~1000) → RecursionError',
        'Python не поддерживает рекурсию во вложенных функциях',
      ],
      correct: 2,
      explanation: 'На цепочке каждый вызов порождает следующий, и в call stack одновременно до V кадров. Решение — Iterative DFS с явным стеком.',
    },
  ],
};
