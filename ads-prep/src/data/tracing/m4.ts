import type { TracingTask } from '../../types';
import { dfsAll, dfsIterative, dfsRecursive, dfsTopo, inDegrees, kahn, type Graph } from '../../lib/algorithms/graph';
import { G, fmtAdj, fmtEdges, graphForTask } from '../graphs';

export const DFS_REC_CODE = `def dfs(adj, u, visited, order):
    visited.add(u)
    order.append(u)
    for v in adj[u]:            # соседи по возрастанию
        if v not in visited:
            dfs(adj, v, visited, order)`;

export const DFS_ITER_CODE = `def dfs_iter(adj, s):
    visited, order = set(), []
    stack = [s]
    while stack:
        u = stack.pop()
        if u in visited:
            continue
        visited.add(u)
        order.append(u)
        for v in reversed(adj[u]):   # чтобы меньший сосед был сверху
            if v not in visited:
                stack.append(v)
    return order`;

export const KAHN_CODE = `from collections import deque

def kahn(adj, vertices):
    indeg = {v: 0 for v in vertices}
    for u in vertices:
        for v in adj[u]:
            indeg[v] += 1
    q = deque(v for v in sorted(vertices) if indeg[v] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    if len(order) < len(vertices):
        return None                # есть цикл
    return order`;

export const DFS_TOPO_CODE = `def topo_dfs(adj, vertices):
    visited, finish = set(), []
    def dfs(u):
        visited.add(u)
        for v in adj[u]:
            if v not in visited:
                dfs(v)
        finish.append(u)           # u завершена
    for v in sorted(vertices):
        if v not in visited:
            dfs(v)
    return finish[::-1]            # обратный порядок завершения`;

export const DFS_REC_CPP = `// вершины A,B,C,… = 0,1,2,…
void dfs(const vector<vector<int>>& adj, int u, vector<bool>& visited, vector<int>& order) {
    visited[u] = true;
    order.push_back(u);
    for (int v : adj[u])            // соседи по возрастанию
        if (!visited[v])
            dfs(adj, v, visited, order);
}`;

export const DFS_ITER_CPP = `vector<int> dfs_iter(const vector<vector<int>>& adj, int s) {
    vector<bool> visited(adj.size(), false);
    vector<int> order;
    vector<int> st = {s};                  // vector как стек: вершина = back()
    while (!st.empty()) {
        int u = st.back(); st.pop_back();
        if (visited[u])
            continue;
        visited[u] = true;
        order.push_back(u);
        for (int k = (int)adj[u].size() - 1; k >= 0; k--)   // reversed: меньший сосед сверху
            if (!visited[adj[u][k]])
                st.push_back(adj[u][k]);
    }
    return order;
}`;

export const KAHN_CPP = `optional<vector<int>> kahn(const vector<vector<int>>& adj, int n) {
    vector<int> indeg(n, 0);
    for (int u = 0; u < n; u++)
        for (int v : adj[u])
            indeg[v]++;
    queue<int> q;
    for (int v = 0; v < n; v++)        // по возрастанию
        if (indeg[v] == 0)
            q.push(v);
    vector<int> order;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        order.push_back(u);
        for (int v : adj[u]) {
            indeg[v]--;
            if (indeg[v] == 0)
                q.push(v);
        }
    }
    if ((int)order.size() < n)
        return nullopt;                // есть цикл
    return order;
}`;

export const DFS_TOPO_CPP = `vector<int> topo_dfs(const vector<vector<int>>& adj, int n) {
    vector<bool> visited(n, false);
    vector<int> finish;
    function<void(int)> dfs = [&](int u) {
        visited[u] = true;
        for (int v : adj[u])
            if (!visited[v])
                dfs(v);
        finish.push_back(u);           // u завершена
    };
    for (int v = 0; v < n; v++)        // по возрастанию
        if (!visited[v])
            dfs(v);
    reverse(finish.begin(), finish.end());   // обратный порядок завершения
    return finish;
}`;

function base(id: string, g: Graph, difficulty: 1 | 2 | 3, topic: 'dfs' | 'topo') {
  return { id, module: 'm4' as const, topic, difficulty, graph: graphForTask(g) };
}

export function tDfsOrder(id: string, g: Graph, start: string, difficulty: 1 | 2 | 3): TracingTask {
  const r = dfsRecursive(g, start);
  return {
    ...base(id, g, difficulty, 'dfs'),
    title: `Recursive DFS из ${start}`,
    prompt: `Выполните recursive DFS из ${start}, перебирая соседей в порядке Adjacency List. Запишите порядок посещения вершин (preorder).`,
    data: fmtAdj(g),
    code: DFS_REC_CODE,
    codeCpp: DFS_REC_CPP,
    format: 'Вершины через запятую',
    expected: r.order,
    compare: 'list',
    steps: r.steps.map((s) =>
      s.type === 'enter'
        ? `dfs(${s.vertex})${s.from ? ` вызвана из ${s.from}` : ''} → visited; call stack: [${s.stack.join(', ')}]`
        : s.type === 'skip'
          ? `  ${s.from}: сосед ${s.vertex} уже visited — пропускаем`
          : `dfs(${s.vertex}) завершена (все соседи обработаны) → возврат; stack: [${s.stack.join(', ')}]`,
    ),
  };
}

export function tDfsFinish(id: string, g: Graph, start: string): TracingTask {
  const r = dfsRecursive(g, start);
  return {
    ...base(id, g, 2, 'dfs'),
    title: `DFS: порядок завершения (postorder)`,
    prompt: `Выполните recursive DFS из ${start}. Запишите порядок, в котором вызовы dfs(u) ЗАВЕРШАЮТСЯ (postorder / finish order).`,
    data: fmtAdj(g),
    code: DFS_REC_CODE,
    codeCpp: DFS_REC_CPP,
    format: 'Вершины через запятую',
    expected: r.finish,
    compare: 'list',
    steps: r.steps.filter((s) => s.type !== 'skip').map((s) => (s.type === 'enter' ? `enter ${s.vertex}  stack [${s.stack.join(', ')}]` : `finish ${s.vertex}  stack [${s.stack.join(', ')}]`)),
  };
}

export function tDfsCallStack(id: string, g: Graph, start: string, when: string): TracingTask {
  const r = dfsRecursive(g, start);
  const st = r.steps.find((s) => s.type === 'enter' && s.vertex === when)!;
  return {
    ...base(id, g, 2, 'dfs'),
    title: `DFS: call stack в момент входа в ${when}`,
    prompt: `Выполните recursive DFS из ${start}. Запишите содержимое call stack (от дна к вершине) в момент, когда только что вызвана dfs(${when}).`,
    data: fmtAdj(g),
    code: DFS_REC_CODE,
    codeCpp: DFS_REC_CPP,
    format: `Вершины через запятую, первая — ${start}`,
    expected: st.stack,
    compare: 'list',
    steps: r.steps
      .slice(0, r.steps.indexOf(st) + 1)
      .filter((s) => s.type !== 'skip')
      .map((s) => `${s.type === 'enter' ? 'call' : 'return'} ${s.vertex} → stack [${s.stack.join(', ')}]`),
  };
}

export function tDfsIter(id: string, g: Graph, start: string, k: number): TracingTask {
  const r = dfsIterative(g, start);
  const enters = r.steps.filter((s) => s.type === 'enter');
  const st = enters[k - 1];
  return {
    ...base(id, g, 3, 'dfs'),
    title: 'Iterative DFS: явный stack',
    prompt: `Выполните iterative DFS из ${start} (код ниже: pop, пропуск visited, push соседей в ОБРАТНОМ порядке). Запишите порядок посещения, затем | и содержимое стека (от дна к вершине) сразу после посещения ${k}-й вершины.`,
    data: fmtAdj(g),
    code: DFS_ITER_CODE,
    codeCpp: DFS_ITER_CPP,
    format: 'Например: A B D | C E',
    expected: [r.order.join(' '), st.stack.join(' ') || '_'],
    compare: 'groups',
    labels: ['порядок посещения', `stack после ${k}-й`],
    steps: r.steps.map((s) => (s.type === 'enter' ? `pop ${s.vertex} → visit; stack = [${s.stack.join(', ')}]` : `pop ${s.vertex} — уже visited, пропускаем; stack = [${s.stack.join(', ')}]`)),
  };
}

export function tComponents(id: string, g: Graph): TracingTask {
  const r = dfsAll(g);
  return {
    ...base(id, g, 2, 'dfs'),
    title: 'DFS: несвязный граф',
    prompt: `Граф может быть несвязным. Запустите DFS из каждой ещё не посещённой вершины (перебирая вершины по возрастанию). Запишите компоненты связности в порядке обнаружения: вершины компоненты — в порядке DFS, компоненты через |.`,
    data: fmtAdj(g),
    code: `for v in sorted(vertices):\n    if v not in visited:\n        comp = []\n        dfs(adj, v, visited, comp)\n        components.append(comp)`,
    codeCpp: `void dfs(const vector<vector<int>>& adj, int u, vector<bool>& visited, vector<int>& order);

vector<vector<int>> components_of(const vector<vector<int>>& adj) {
    int n = adj.size();
    vector<bool> visited(n, false);
    vector<vector<int>> components;
    for (int v = 0; v < n; v++) {        // вершины по возрастанию
        if (!visited[v]) {
            vector<int> comp;
            dfs(adj, v, visited, comp);
            components.push_back(comp);
        }
    }
    return components;
}`,
    format: 'Например: 0 1 3 | 4 5 | 6',
    expected: r.components.map((c) => c.join(' ')),
    compare: 'groups',
    steps: r.components.map((c, i) => `Компонента ${i + 1}: старт в ${c[0]} → ${c.join(', ')}`),
  };
}

export function tInDegrees(id: string, g: Graph): TracingTask {
  const deg = inDegrees(g);
  const zero = g.vertices.filter((v) => deg.get(v) === 0);
  return {
    ...base(id, g, 1, 'topo'),
    title: "Kahn's Algorithm: начальные in-degree",
    prompt: `Вычислите in-degree каждой вершины в порядке ${g.vertices.join(', ')}. Затем через | запишите начальное содержимое очереди Kahn's Algorithm (вершины с in-degree 0 по возрастанию).`,
    data: `edges: ${fmtEdges(g)}`,
    format: 'Например: 0 1 2 1 | A',
    expected: [g.vertices.map((v) => String(deg.get(v))).join(' '), zero.join(' ') || '_'],
    compare: 'groups',
    labels: ['in-degree', 'начальная очередь'],
    steps: [...g.vertices.map((v) => `in-degree(${v}) = ${deg.get(v)} (входящие: ${g.edges.filter(([, b]) => b === v).map(([a]) => a).join(', ') || 'нет'})`), `Очередь: [${zero.join(', ')}]`],
  };
}

export function tKahnOrder(id: string, g: Graph, difficulty: 1 | 2 | 3): TracingTask {
  const r = kahn(g);
  return {
    ...base(id, g, difficulty, 'topo'),
    title: "Kahn's Algorithm: топологический порядок",
    prompt: `Выполните Kahn's Algorithm (FIFO-очередь; начальная очередь — вершины с in-degree 0 по возрастанию; соседи обрабатываются по возрастанию). Запишите полученный порядок. Если граф содержит цикл — запишите выведенные вершины, а последним токеном CYCLE.`,
    data: fmtAdj(g),
    code: KAHN_CODE,
    codeCpp: KAHN_CPP,
    format: 'Вершины через запятую (+ CYCLE, если есть цикл)',
    expected: r.hasCycle ? [...r.order, 'CYCLE'] : r.order,
    compare: 'list',
    steps: [
      `in-degree: ${Object.entries(r.initialInDegree).map(([v, d]) => `${v}=${d}`).join(', ')}; queue = [${r.initialQueue.join(', ')}]`,
      ...r.steps.map((s) => `popleft ${s.removed}: ${s.decremented.map((d) => `in(${d.v})→${d.to}`).join(', ') || 'исходящих рёбер нет'}${s.enqueued.length ? `; в очередь: ${s.enqueued.join(', ')}` : ''} → queue [${s.queue.join(', ')}]`),
      r.hasCycle ? `Выведено ${r.order.length} из ${g.vertices.length} вершин → у оставшихся in-degree никогда не станет 0 → есть направленный цикл.` : `Выведены все ${g.vertices.length} вершин → граф — DAG.`,
    ],
  };
}

export function tKahnQueue(id: string, g: Graph, k: number): TracingTask {
  const r = kahn(g);
  const s = r.steps[k - 1];
  return {
    ...base(id, g, 2, 'topo'),
    title: "Kahn's Algorithm: очередь и in-degree после шага",
    prompt: `Выполните Kahn's Algorithm. После того как ${k}-я вершина извлечена и in-degree её соседей уменьшены, запишите: содержимое очереди | текущие in-degree всех вершин в порядке ${g.vertices.join(', ')}.`,
    data: fmtAdj(g),
    code: KAHN_CODE,
    codeCpp: KAHN_CPP,
    format: 'Например: C D | 0 0 0 1 2',
    expected: [s.queue.join(' ') || '_', g.vertices.map((v) => String(s.inDegree[v])).join(' ')],
    compare: 'groups',
    labels: ['queue', 'in-degree'],
    steps: [`Начало: queue [${r.initialQueue.join(', ')}]`, ...r.steps.slice(0, k).map((st, i) => `#${i + 1} извлекли ${st.removed}: ${st.decremented.map((d) => `in(${d.v})→${d.to}`).join(', ') || '—'} → queue [${st.queue.join(', ')}]`)],
  };
}

export function tDfsTopo(id: string, g: Graph, difficulty: 1 | 2 | 3): TracingTask {
  const r = dfsTopo(g);
  return {
    ...base(id, g, difficulty, 'topo'),
    title: 'Topological Sort через DFS',
    prompt: `Выполните DFS-версию топологической сортировки: запускаем dfs из непосещённых вершин по возрастанию, соседи по возрастанию. Запишите порядок завершения (finish order), затем | и итоговый топологический порядок.`,
    data: fmtAdj(g),
    code: DFS_TOPO_CODE,
    codeCpp: DFS_TOPO_CPP,
    format: 'Например: F D B E C A | A C E B D F',
    expected: [r.finish.join(' '), r.order.join(' ')],
    compare: 'groups',
    labels: ['finish order', 'topological order'],
    steps: [
      ...r.steps.filter((s) => s.type !== 'back-edge').map((s) => (s.type === 'enter' ? `enter ${s.vertex}, stack [${s.stack.join(', ')}]` : `finish ${s.vertex} → finish = [${s.finishOrder.join(', ')}]`)),
      `Разворачиваем finish order: ${r.order.join(', ')}. Вершина завершается только после всех, кто от неё зависит, поэтому в обратном порядке каждая вершина стоит раньше своих потомков.`,
    ],
  };
}

export function tCycleRemaining(id: string, g: Graph): TracingTask {
  const r = kahn(g);
  const left = g.vertices.filter((v) => !r.order.includes(v));
  return {
    ...base(id, g, 3, 'topo'),
    title: 'Цикл: что останется после Kahn',
    prompt: `Выполните Kahn's Algorithm. Какие вершины НЕ попадут в результат (порядок не важен)? Если все попадут — _.`,
    data: fmtAdj(g),
    code: KAHN_CODE,
    codeCpp: KAHN_CPP,
    format: 'Вершины через запятую',
    expected: left.length ? left : ['_'],
    compare: 'set',
    steps: [
      `Порядок вывода: ${r.order.join(', ') || '—'}`,
      ...r.steps.map((s) => `извлекли ${s.removed}: ${s.decremented.map((d) => `in(${d.v})→${d.to}`).join(', ') || '—'}`),
      left.length ? `Остались ${left.join(', ')}: у них in-degree > 0, потому что они лежат на цикле или достижимы из цикла.` : 'Все вершины выведены — цикла нет.',
    ],
  };
}

export const TRACING_M4: TracingTask[] = [
  tDfsOrder('tr-m4-01', G.u1, 'A', 1),
  tDfsOrder('tr-m4-02', G.u2, '1', 1),
  tDfsOrder('tr-m4-03', G.u3, 'A', 2),
  tDfsFinish('tr-m4-04', G.u3, 'A'),
  tDfsCallStack('tr-m4-05', G.u7, '1', '4'),
  tDfsIter('tr-m4-06', G.u1, 'A', 3),
  tDfsOrder('tr-m4-07', G.d4, '1', 2),
  tComponents('tr-m4-08', G.u4),
  tInDegrees('tr-m4-09', G.d2),
  tKahnOrder('tr-m4-10', G.d1, 1),
  tKahnOrder('tr-m4-11', G.d2, 2),
  tKahnQueue('tr-m4-12', G.d5, 3),
  tDfsTopo('tr-m4-13', G.d1, 2),
  tDfsTopo('tr-m4-14', G.d2, 3),
  tKahnOrder('tr-m4-15', G.d6, 3),
  tCycleRemaining('tr-m4-16', G.d7),
  tDfsIter('tr-m4-17', G.u3, 'A', 4),
];
