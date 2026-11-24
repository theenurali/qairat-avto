import type { Lesson } from '../../../types';

export const bfsLesson: Lesson = {
  id: 'm3-bfs',
  title: 'Breadth-First Search (BFS)',
  subtitle: 'Обход в ширину: Queue, visited, уровни, кратчайший путь в невзвешенном графе',
  topic: 'bfs',
  minutes: 35,
  blocks: [
    { kind: 'h2', text: 'Идея BFS' },
    {
      kind: 'p',
      text: '**Breadth-First Search (поиск в ширину)** обходит граф «слоями»: сначала стартовая вершина, потом **все** её соседи (на расстоянии 1), потом все вершины на расстоянии 2, и так далее. BFS не уходит вглубь, пока не исследовал текущий уровень целиком.',
    },
    {
      kind: 'analogy',
      title: 'Круги на воде',
      text: 'Бросьте камень в пруд: волна расходится кругами — сначала ближний круг, потом следующий. Вершины, до которых волна доходит на шаге d, находятся на расстоянии d рёбер от старта. Именно поэтому BFS находит **кратчайший путь по числу рёбер**.\nДругой пример: вы ищете знакомого-программиста. Сначала спрашиваете всех своих друзей (уровень 1), потом друзей друзей (уровень 2)… Первый найденный — самый «близкий» по цепочке знакомств.',
    },

    { kind: 'h3', text: 'Почему именно Queue (очередь)' },
    {
      kind: 'p',
      text: 'BFS хранит «фронт волны» в **очереди (Queue)** — структуре **FIFO (First In, First Out)**: кто первым встал, тот первым обслуживается, как очередь в магазине. Вершины уровня d попадают в очередь раньше вершин уровня d + 1, а значит и обрабатываются раньше. Если заменить очередь на стек (LIFO), получится уже не BFS, а обход в глубину (DFS).',
    },
    {
      kind: 'note',
      title: 'deque.popleft() вместо list.pop(0)',
      text: 'В Python используйте `collections.deque`: `append` в конец и `popleft()` из начала работают за **O(1)**. `list.pop(0)` стоит **O(n)** — после удаления первого элемента все остальные сдвигаются на одну позицию влево. На большом графе BFS со списком может стать квадратичным.',
    },

    { kind: 'h3', text: 'Зачем visited' },
    {
      kind: 'p',
      text: 'В графе бывают циклы и несколько путей к одной вершине. Без множества **visited** BFS будет снова и снова добавлять уже встреченные вершины: на графе с циклом — бесконечно. `visited` гарантирует, что каждая вершина попадёт в очередь **ровно один раз**.',
    },
    {
      kind: 'warning',
      title: 'Соглашение: помечаем visited В МОМЕНТ ДОБАВЛЕНИЯ в очередь',
      text: 'Если помечать вершину только когда её достали из очереди (on dequeue), одна и та же вершина может оказаться в очереди несколько раз. Пример (граф модуля): из B мы добавим D, а затем из C — снова D, потому что D ещё не достали и она «не visited». Результат будет работать, но с дубликатами, лишней памятью и лишней работой (а dist может перезаписаться неверно, если не проверять). Правильно: `visited.add(v)` сразу перед `queue.append(v)`.',
    },
    {
      kind: 'p',
      text: 'Соглашение в этом курсе: **соседи перебираются в порядке возрастания меток** (A, B, C… или 0, 1, 2…), если в задаче не сказано иное. От порядка соседей зависит порядок обхода, но не расстояния dist.',
    },

    { kind: 'viz', id: 'm3-bfs', caption: 'Пошаговый BFS: очередь, visited, dist, дерево BFS и кратчайший путь' },

    { kind: 'h2', text: 'Код BFS' },
    {
      kind: 'code',
      caption: 'BFS с массивами dist и parent',
      cpp: `// возвращаем order, dist, parent через ссылки; вершины 0..n-1
void bfs(const vector<vector<int>>& graph, int start,
         vector<int>& order, vector<int>& dist, vector<int>& parent) {
    int n = graph.size();
    vector<bool> visited(n, false);
    dist.assign(n, -1);                  // -1 = ещё не достигнута (∞)
    parent.assign(n, -1);                // -1 = нет родителя (None)
    queue<int> q;
    visited[start] = true;
    dist[start] = 0;
    q.push(start);
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        order.push_back(u);
        for (int v : graph[u]) {
            if (!visited[v]) {
                visited[v] = true;
                dist[v] = dist[u] + 1;
                parent[v] = u;
                q.push(v);
            }
        }
    }
}`,
      cppExplain: [
        { line: 5, text: "visited — vector<bool> на n вершин: проверка и пометка за O(1)." },
        { line: 6, text: "dist[v] — число рёбер в кратчайшем пути от start до v; -1 означает «пока не достигнута»." },
        { line: 7, text: "parent[v] — из какой вершины мы впервые пришли в v; -1 играет роль None." },
        { line: 8, text: "queue<int> — FIFO-очередь: push в конец, front/pop из начала, всё за O(1) (аналог deque + popleft в Python)." },
        { line: 9, text: "Старт сразу считается visited: он уже в очереди. У старта dist = 0." },
        { line: 12, text: "Работаем, пока очередь не пуста." },
        { line: 13, text: "Берём вершину из НАЧАЛА очереди. В C++ pop() ничего не возвращает: сначала читаем front(), потом удаляем pop()." },
        { line: 16, text: "Перебираем соседей u (по соглашению — по возрастанию)." },
        { line: 17, text: "Только непосещённые: каждая вершина обрабатывается один раз." },
        { line: 18, text: "Помечаем visited ДО добавления в очередь — так вершина не попадёт в очередь дважды." },
        { line: 19, text: "v на один уровень дальше, чем u." },
        { line: 21, text: "Добавляем в КОНЕЦ очереди." },
      ],
      code: `from collections import deque

def bfs(graph, start):
    visited = {start}
    dist = {start: 0}
    parent = {start: None}
    queue = deque([start])
    order = []
    while queue:
        u = queue.popleft()
        order.append(u)
        for v in graph[u]:
            if v not in visited:
                visited.add(v)
                dist[v] = dist[u] + 1
                parent[v] = u
                queue.append(v)
    return order, dist, parent`,
      explain: [
        { line: 1, text: 'deque — двусторонняя очередь с O(1) операциями на обоих концах.' },
        { line: 4, text: 'Старт сразу считается visited: он уже в очереди.' },
        { line: 5, text: 'dist[v] — число рёбер в кратчайшем пути от start до v. У старта 0.' },
        { line: 6, text: 'parent[v] — из какой вершины мы впервые пришли в v. Нужен, чтобы восстановить сам путь.' },
        { line: 9, text: 'Работаем, пока очередь не пуста.' },
        { line: 10, text: 'Берём вершину из НАЧАЛА очереди (FIFO) — самую «старую», то есть с наименьшим dist.' },
        { line: 12, text: 'Перебираем соседей u (по соглашению — по возрастанию).' },
        { line: 13, text: 'Только непосещённые: каждая вершина обрабатывается один раз.' },
        { line: 14, text: 'Помечаем visited ДО добавления в очередь — так вершина не попадёт в очередь дважды.' },
        { line: 15, text: 'v на один уровень дальше, чем u.' },
        { line: 17, text: 'Добавляем в КОНЕЦ очереди.' },
      ],
    },

    {
      kind: 'note',
      title: 'В C++',
      text: 'Очередь — `queue<int>`: `q.push(v)` в конец, `q.front()` читает начало, `q.pop()` удаляет его (pop ничего не возвращает). Все операции O(1). В Python `list.pop(0)` стоит O(n), поэтому там нужен `deque`; в C++ такой ловушки нет — `queue` по умолчанию построен на `deque`. Вместо `set` для visited удобнее `vector<bool> visited(n)`, а вместо `None` в dist/parent — значение `-1`.',
    },

    {
      kind: 'steps',
      title: 'Трассировка BFS из A на графе модуля',
      steps: [
        {
          title: 'Граф и списки смежности',
          text: 'Undirected граф A–F. Соседи по алфавиту.',
          state: 'A: [B, C]\nB: [A, D]\nC: [A, D, E]\nD: [B, C, F]\nE: [C, F]\nF: [D, E]',
        },
        {
          title: 'Инициализация',
          text: 'Кладём A в очередь и сразу помечаем visited.',
          state: 'queue   = [A]\nvisited = {A}\ndist    = {A:0}',
        },
        {
          title: 'popleft → A',
          text: 'Соседи A: B, C — оба новые. Помечаем, dist = 1, parent = A, добавляем в конец.',
          state: 'queue   = [B, C]\nvisited = {A, B, C}\ndist    = {A:0, B:1, C:1}\norder   = [A]',
        },
        {
          title: 'popleft → B',
          text: 'Соседи B: A (visited, пропуск), D — новая: dist[D] = 2, parent[D] = B.',
          state: 'queue   = [C, D]\nvisited = {A, B, C, D}\norder   = [A, B]',
        },
        {
          title: 'popleft → C',
          text: 'Соседи C: A (пропуск), D (уже visited — именно здесь помогает пометка при добавлении, D не попадёт в очередь второй раз), E — новая: dist[E] = 2, parent[E] = C.',
          state: 'queue   = [D, E]\nvisited = {A, B, C, D, E}\norder   = [A, B, C]',
        },
        {
          title: 'popleft → D',
          text: 'Соседи D: B, C (пропуск), F — новая: dist[F] = 3, parent[F] = D.',
          state: 'queue   = [E, F]\nvisited = {A, B, C, D, E, F}\norder   = [A, B, C, D]',
        },
        {
          title: 'popleft → E, затем F',
          text: 'У E соседи C, F — уже visited. У F соседи D, E — уже visited. Очередь пустеет.',
          state: 'queue   = []\norder   = [A, B, C, D, E, F]\ndist    = {A:0, B:1, C:1, D:2, E:2, F:3}',
        },
        {
          title: 'Кратчайший путь A → F',
          text: 'Идём по parent назад: F ← D ← B ← A. Разворачиваем: A → B → D → F, длина 3 = dist[F].',
          state: 'parent = {A:None, B:A, C:A, D:B, E:C, F:D}\npath   = [A, B, D, F]',
        },
      ],
    },

    { kind: 'viz', id: 'm3-bfs-levels', caption: 'BFS по уровням: каждая колонка — одна «волна»' },

    { kind: 'h2', text: 'Почему BFS находит кратчайший путь' },
    {
      kind: 'p',
      text: 'В **невзвешенном** графе длина пути = число рёбер. BFS обрабатывает вершины в порядке неубывания dist: очередь всегда содержит вершины не более чем двух соседних уровней d и d + 1, причём все d стоят раньше. Поэтому когда вершину v впервые обнаруживают из u, путь start → … → u → v имеет длину dist[u] + 1 — и более короткого пути не существует, иначе v была бы обнаружена раньше, из вершины меньшего уровня.',
    },
    {
      kind: 'code',
      caption: 'Восстановление пути по parent',
      cpp: `void bfs(const vector<vector<int>>& graph, int start,
         vector<int>& order, vector<int>& dist, vector<int>& parent);  // см. выше

vector<int> shortest_path(const vector<int>& parent, const vector<int>& dist, int target) {
    if (dist[target] == -1)
        return {};                       // target недостижима из start
    vector<int> path;
    while (target != -1) {
        path.push_back(target);
        target = parent[target];
    }
    reverse(path.begin(), path.end());   // разворачиваем: start -> ... -> target
    return path;
}

int main() {
    vector<vector<int>> graph = {{1, 2}, {0, 3}, {0, 3, 4}, {1, 2, 5}, {2, 5}, {3, 4}};  // A..F = 0..5
    vector<int> order, dist, parent;
    bfs(graph, 0, order, dist, parent);
    for (int v : shortest_path(parent, dist, 5))
        cout << v << ' ';                // 0 1 3 5  = A B D F
}`,
      cppExplain: [
        { line: 5, text: "Если BFS не дошёл до target, dist[target] = -1 — пути не существует (dist = ∞)." },
        { line: 8, text: "Поднимаемся от target к start по ссылкам parent. У start parent = -1 — цикл остановится." },
        { line: 12, text: "Путь собран задом наперёд, поэтому разворачиваем его std::reverse." },
      ],
      code: `def shortest_path(parent, target):
    if target not in parent:
        return None              # target недостижима из start
    path = []
    while target is not None:
        path.append(target)
        target = parent[target]
    return path[::-1]            # разворачиваем: start -> ... -> target

order, dist, parent = bfs(graph, 'A')
print(shortest_path(parent, 'F'))   # ['A', 'B', 'D', 'F']`,
      explain: [
        { line: 2, text: 'Если BFS не дошёл до target, у неё нет parent — пути не существует (dist = ∞).' },
        { line: 5, text: 'Поднимаемся от target к start по ссылкам parent. У start parent = None — цикл остановится.' },
        { line: 8, text: 'Путь собран задом наперёд, поэтому разворачиваем.' },
      ],
    },
    {
      kind: 'warning',
      title: 'BFS ≠ кратчайший путь во взвешенном графе',
      text: 'Если у рёбер разные веса, путь из меньшего числа рёбер может быть длиннее по сумме весов. Пример: A–B вес 10, A–C вес 1, C–B вес 1. BFS скажет A → B (1 ребро), но короче A → C → B (вес 2). Для весов нужен Dijkstra.',
    },

    { kind: 'h2', text: 'Несвязный граф (disconnected graph)' },
    {
      kind: 'p',
      text: 'BFS из одной вершины посетит **только её connected component**. Чтобы обойти весь граф, запускаем BFS из каждой ещё не посещённой вершины. Число запусков = число компонент связности. Общий `visited` на все запуски сохраняет сложность O(V + E).',
    },
    {
      kind: 'code',
      caption: 'BFS по всем вершинам: подсчёт компонент связности',
      cpp: `int count_components(const vector<vector<int>>& graph) {
    int n = graph.size();
    vector<bool> visited(n, false);
    int components = 0;
    for (int s = 0; s < n; s++) {        // перебираем ВСЕ вершины
        if (visited[s])
            continue;
        components++;                    // нашли новую компоненту
        visited[s] = true;
        queue<int> q;
        q.push(s);
        while (!q.empty()) {
            int u = q.front();
            q.pop();
            for (int v : graph[u]) {
                if (!visited[v]) {
                    visited[v] = true;
                    q.push(v);
                }
            }
        }
    }
    return components;
}`,
      cppExplain: [
        { line: 3, text: "Один visited на весь граф — вершины из уже обойдённых компонент повторно не трогаем." },
        { line: 5, text: "Внешний цикл по 0..n−1 гарантирует, что мы не пропустим ни одну компоненту, включая изолированные вершины (у них просто пустой список)." },
        { line: 8, text: "Каждый новый запуск BFS — новая компонента." },
      ],
      code: `from collections import deque

def count_components(graph):
    visited = set()
    components = 0
    for s in graph:                  # перебираем ВСЕ вершины
        if s in visited:
            continue
        components += 1              # нашли новую компоненту
        visited.add(s)
        queue = deque([s])
        while queue:
            u = queue.popleft()
            for v in graph[u]:
                if v not in visited:
                    visited.add(v)
                    queue.append(v)
    return components`,
      explain: [
        { line: 4, text: 'Один visited на весь граф — вершины из уже обойдённых компонент повторно не трогаем.' },
        { line: 6, text: 'Внешний цикл гарантирует, что мы не пропустим ни одну компоненту, в том числе изолированные вершины (если они есть в graph).' },
        { line: 9, text: 'Каждый новый запуск BFS — новая компонента.' },
      ],
    },

    {
      kind: 'complexity',
      rows: [
        { op: 'BFS (Adjacency List)', avg: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)', why: 'каждая вершина один раз входит в очередь и выходит из неё (V), список соседей каждой просматривается один раз: Σ deg = 2E (или E)' },
        { op: 'BFS (Adjacency Matrix)', avg: 'O(V²)', worst: 'O(V²)', space: 'O(V)', why: 'для каждой из V вершин просматриваем строку матрицы длиной V' },
        { op: 'Восстановление пути', avg: 'O(V)', worst: 'O(V)', space: 'O(V)', why: 'путь содержит не больше V вершин' },
        { op: 'BFS по всем компонентам', avg: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)', why: 'общий visited: каждая вершина и ребро обработаны один раз за все запуски' },
      ],
    },
    {
      kind: 'note',
      title: 'Откуда берётся O(V + E)',
      text: 'Это не «V умножить на что-то». Сложите работу: `popleft` выполняется V раз (каждая вершина входит в очередь один раз благодаря visited) → O(V). Внутренний цикл `for v in graph[u]` суммарно по всем u выполняется Σ deg(u) = 2E раз → O(E). Итого O(V + E). Память: visited, dist, parent и очередь — каждая не больше V элементов → O(V).',
    },

    {
      kind: 'mistakes',
      items: [
        { mistake: 'Помечать visited при извлечении из очереди (on dequeue), а проверять при добавлении не тем же множеством.', fix: 'Помечайте visited сразу при добавлении в очередь — тогда каждая вершина окажется в очереди ровно один раз.' },
        { mistake: 'Забыть visited совсем.', fix: 'На графе с циклом (даже A–B в undirected графе) вершины будут добавляться бесконечно.' },
        { mistake: 'Использовать `queue.pop()` вместо `queue.popleft()`.', fix: 'pop() берёт с конца — это стек (LIFO), и обход перестаёт быть BFS: порядок и dist становятся неверными.' },
        { mistake: 'Использовать `list.pop(0)` на больших графах.', fix: 'Это O(n) на каждое извлечение. Используйте collections.deque.' },
        { mistake: 'Запускать BFS из одной вершины и считать, что обошли весь граф.', fix: 'В несвязном графе нужен внешний цикл по всем вершинам.' },
        { mistake: 'Применять BFS для кратчайших путей во взвешенном графе.', fix: 'BFS минимизирует число рёбер, а не сумму весов. Для весов — Dijkstra.' },
      ],
    },

    {
      kind: 'selfcheck',
      items: [
        { q: 'Какая структура данных лежит в основе BFS и почему?', a: 'Queue (FIFO). Она гарантирует, что вершины обрабатываются в порядке их удалённости от старта: все вершины уровня d раньше вершин уровня d + 1.' },
        { q: 'Сколько раз каждая вершина попадает в очередь при правильном BFS?', a: 'Не больше одного раза (ровно один раз, если она достижима из start) — благодаря пометке visited при добавлении.' },
        { q: 'Чем отличаются содержимое очереди и множество visited?', a: 'visited — все обнаруженные вершины (и уже обработанные, и ждущие). Очередь — только обнаруженные, но ещё не обработанные.' },
        { q: 'Что будет, если запустить BFS из вершины изолированной компоненты?', a: 'BFS посетит только вершины этой компоненты. До остальных dist останется ∞ (их нет в dist).' },
        { q: 'Почему BFS на матрице смежности — O(V²)?', a: 'Для каждой из V вершин просматривается целая строка матрицы (V ячеек), даже если соседей мало.' },
      ],
    },

    {
      kind: 'practice',
      items: [
        {
          task: 'Undirected граф: 1–2, 1–3, 2–4, 3–4, 4–5, 5–6. BFS из 1 (соседи по возрастанию). Запишите порядок обхода и dist каждой вершины.',
          solution: 'Списки: 1:[2,3], 2:[1,4], 3:[1,4], 4:[2,3,5], 5:[4,6], 6:[5].\nqueue [1] → pop 1: +2,+3 → [2,3] → pop 2: +4 → [3,4] → pop 3: 4 уже visited → [4] → pop 4: +5 → [5] → pop 5: +6 → [6] → pop 6.\nПорядок: 1, 2, 3, 4, 5, 6. dist: 1→0, 2→1, 3→1, 4→2, 5→3, 6→4.',
        },
        {
          task: 'Directed граф: 0→1, 0→2, 1→3, 2→3, 3→4, 4→1, 5→4. BFS из 0. Какой порядок? Какие вершины не будут посещены?',
          solution: 'Списки: 0:[1,2], 1:[3], 2:[3], 3:[4], 4:[1], 5:[4].\npop 0 → +1,+2; pop 1 → +3; pop 2 → 3 visited; pop 3 → +4; pop 4 → 1 visited.\nПорядок: 0, 1, 2, 3, 4. Вершина 5 недостижима из 0 (в 5 нет входящих дуг).',
        },
        {
          task: 'Тот же граф, что в трассировке (A–F). Какой будет очередь сразу после обработки вершины C, если по ошибке помечать visited только при извлечении из очереди (и добавлять в очередь всех непомеченных соседей)?',
          solution: 'pop A (mark A): добавляем B, C → [B, C]. pop B (mark B): A помечена, D — нет → [C, D]. pop C (mark C): A помечена, D ещё НЕ помечена → добавляем D снова, E → [D, D, E]. Дубликат D — следствие ошибки.',
        },
      ],
    },

    {
      kind: 'summary',
      items: [
        'BFS обходит граф уровнями, используя Queue (FIFO); в Python — deque с popleft() за O(1).',
        'visited помечаем при добавлении в очередь — каждая вершина попадает в очередь один раз.',
        'dist[v] = dist[u] + 1, parent[v] = u; путь восстанавливается по parent и разворачивается.',
        'BFS даёт кратчайшие пути только в невзвешенном графе (минимум рёбер).',
        'Время O(V + E) на Adjacency List, O(V²) на Adjacency Matrix; память O(V).',
        'Несвязный граф: внешний цикл по всем вершинам с общим visited; число запусков = число компонент.',
      ],
    },
  ],
  miniExam: [
    {
      id: 'mini-m3-f1',
      module: 'm3',
      topic: 'bfs',
      category: 'principle',
      question: 'Какую структуру данных использует BFS для хранения вершин, ожидающих обработки?',
      options: ['Stack (LIFO)', 'Queue (FIFO)', 'Priority Queue по весу', 'Hash Table'],
      correct: 1,
      explanation: 'FIFO-очередь обеспечивает обработку по уровням. Стек дал бы DFS, приоритетная очередь — Dijkstra.',
    },
    {
      id: 'mini-m3-f2',
      module: 'm3',
      topic: 'bfs',
      category: 'code',
      question: 'Undirected граф: A–B, A–D, B–C, C–F, D–E, E–F. BFS из A, соседи по алфавиту. Порядок обхода?',
      options: ['A, B, C, F, E, D', 'A, B, D, C, E, F', 'A, D, B, E, C, F', 'A, B, D, E, C, F'],
      correct: 1,
      explanation: 'A → [B, D]; B добавляет C → [D, C]; D добавляет E → [C, E]; C добавляет F → [E, F]; E: F уже visited; F. Порядок: A, B, D, C, E, F. Первый вариант (A, B, C, F, E, D) — это порядок DFS.',
    },
    {
      id: 'mini-m3-f3',
      module: 'm3',
      topic: 'bfs',
      category: 'time',
      question: 'Время работы BFS на графе, представленном Adjacency List:',
      options: ['O(V)', 'O(E log V)', 'O(V + E)', 'O(V²)'],
      correct: 2,
      explanation: 'Каждая вершина обрабатывается один раз (V), каждый список соседей просматривается один раз (Σ deg = O(E)).',
    },
    {
      id: 'mini-m3-f4',
      module: 'm3',
      topic: 'bfs',
      category: 'why-how',
      question: 'Почему вершину помечают visited в момент добавления в очередь, а не при извлечении?',
      options: [
        'Так быстрее работает popleft',
        'Иначе одна вершина может попасть в очередь несколько раз (дубликаты, лишняя работа)',
        'Иначе BFS не найдёт стартовую вершину',
        'Это нужно только для directed графов',
      ],
      correct: 1,
      explanation: 'Пока вершина ждёт в очереди, её могут «увидеть» другие соседи. Если она ещё не помечена, её добавят повторно.',
    },
    {
      id: 'mini-m3-f5',
      module: 'm3',
      topic: 'bfs',
      category: 'proscons',
      question: 'В каком графе BFS гарантированно находит кратчайший путь?',
      options: ['В любом взвешенном', 'В невзвешенном (или все веса равны)', 'Только в дереве', 'Только в DAG'],
      correct: 1,
      explanation: 'BFS минимизирует количество рёбер. Это совпадает с кратчайшим путём, только если все рёбра «стоят» одинаково.',
    },
    {
      id: 'mini-m3-f6',
      module: 'm3',
      topic: 'bfs',
      category: 'time',
      question: 'Почему в Python для очереди BFS используют deque, а не list с pop(0)?',
      options: ['list не умеет добавлять в конец', 'list.pop(0) — O(n): все элементы сдвигаются; deque.popleft() — O(1)', 'deque занимает меньше памяти в 10 раз', 'Без разницы, это стиль'],
      correct: 1,
      explanation: 'Удаление из начала list сдвигает все элементы. deque поддерживает O(1) операции на обоих концах.',
    },
    {
      id: 'mini-m3-f7',
      module: 'm3',
      topic: 'bfs',
      category: 'principle',
      question: 'Граф несвязный: 3 компоненты. Сколько раз запустится внутренний BFS в функции, которая перебирает все вершины и запускает BFS из непосещённых?',
      options: ['1', '3', 'V', 'E'],
      correct: 1,
      explanation: 'Каждый запуск обходит одну компоненту целиком и помечает все её вершины. Новый запуск начинается только из вершины новой компоненты.',
    },
    {
      id: 'mini-m3-f8',
      module: 'm3',
      topic: 'bfs',
      category: 'space',
      question: 'Дополнительная память BFS (visited, dist, parent, queue):',
      options: ['O(1)', 'O(V)', 'O(E)', 'O(V²)'],
      correct: 1,
      explanation: 'Каждая из структур хранит не больше V элементов.',
    },
  ],
};
