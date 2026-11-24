import type { CounterexampleTask, CxField, CxResult } from '../../types';
import { adjacencyList, bfs, cmpLabel, dfsAll, reconstructPath, type Graph } from '../../lib/algorithms/graph';
import { compareRuns, fmtList, graphFrom, guard } from './util';

const err = (e: string): CxResult => ({ error: e, buggy: '', correct: '', broken: false });

const GRAPH_FIELDS: CxField[] = [
  { name: 'vertices', label: 'Вершины (необязательно, для изолированных)', placeholder: 'A B C' },
  { name: 'edges', label: 'Рёбра (неориентированные)', placeholder: 'A-B, B-C', type: 'area' },
  { name: 'start', label: 'Стартовая вершина', placeholder: 'A' },
];

function withStart(input: Record<string, string>, directed = false): { g?: Graph; s?: string; error?: string } {
  const { graph, error } = graphFrom(input, directed);
  if (error) return { error };
  const s = (input.start ?? '').trim();
  if (!graph!.vertices.includes(s)) return { error: `Стартовая вершина «${s}» отсутствует в графе` };
  return { g: graph, s };
}

/* BFS, где visited отмечается при извлечении, без проверки при извлечении */
function bfsMarkOnPop(g: Graph, s: string): string[] {
  const adj = adjacencyList(g);
  const visited = new Set<string>();
  const q = [s];
  const order: string[] = [];
  const tick = guard(400);
  while (q.length) {
    tick();
    const u = q.shift()!;
    visited.add(u);
    order.push(u);
    for (const v of adj.get(u) ?? []) if (!visited.has(v)) q.push(v);
  }
  return order;
}

const cxBfsMarkLate: CounterexampleTask = {
  id: 'cx-m3-1',
  module: 'm3',
  topic: 'bfs',
  difficulty: 2,
  title: 'BFS: visited при извлечении',
  goal: 'Вернуть порядок BFS-обхода из start: каждая достижимая вершина ровно один раз.',
  buggyCode: `from collections import deque

def bfs(adj, s):
    visited = set()
    q = deque([s])
    order = []
    while q:
        u = q.popleft()
        visited.add(u)               # отмечаем только сейчас
        order.append(u)
        for v in adj[u]:
            if v not in visited:
                q.append(v)
    return order`,
  bugLine: 9,
  hint: 'Вершина может лежать в очереди, но ещё не быть visited. Что если до неё есть два пути одинаковой длины?',
  fields: GRAPH_FIELDS,
  initial: { vertices: '', edges: 'A-B, B-C, C-D', start: 'A' },
  sample: { vertices: '', edges: 'A-B, A-C, B-C', start: 'A' },
  evaluate: (input) => {
    const r = withStart(input);
    if (r.error) return err(r.error);
    return compareRuns(() => fmtList(bfsMarkOnPop(r.g!, r.s!)), () => fmtList(bfs(r.g!, r.s!).order));
  },
  explanation:
    'Треугольник A-B, A-C, B-C из A: извлекаем A → в очередь B, C. Извлекаем B: C ещё НЕ visited (он только в очереди) → C добавляется второй раз. Порядок становится [A, B, C, C]. На графе-пути (дереве) каждая вершина обнаруживается одним путём, поэтому баг не виден — нужен цикл. Правило: отмечать visited в момент добавления в очередь.',
  fixedCode: `            if v not in visited:
                visited.add(v)           # сразу при добавлении
                q.append(v)`,
};

function bfsWithStack(g: Graph, s: string): Map<string, number> {
  const adj = adjacencyList(g);
  const dist = new Map([[s, 0]]);
  const st = [s];
  while (st.length) {
    const u = st.pop()!;
    for (const v of adj.get(u) ?? []) {
      if (!dist.has(v)) {
        dist.set(v, dist.get(u)! + 1);
        st.push(v);
      }
    }
  }
  return dist;
}

const fmtDist = (g: Graph, d: Map<string, number>) =>
  [...g.vertices].sort(cmpLabel).map((v) => `${v}:${d.has(v) ? d.get(v) : '∞'}`).join(' ');

const cxBfsStack: CounterexampleTask = {
  id: 'cx-m3-2',
  module: 'm3',
  topic: 'bfs',
  difficulty: 2,
  title: 'Кратчайшие пути со стеком вместо очереди',
  goal: 'Вычислить кратчайшее расстояние (в рёбрах) от start до каждой вершины невзвешенного графа.',
  buggyCode: `def shortest(adj, s):
    dist = {s: 0}
    st = [s]
    while st:
        u = st.pop()                 # берём ПОСЛЕДНИЙ
        for v in adj[u]:
            if v not in dist:
                dist[v] = dist[u] + 1
                st.append(v)
    return dist`,
  bugLine: 5,
  hint: 'Со стеком обход уходит «вглубь». Может ли вершина впервые обнаружиться по длинному пути, хотя есть короткий?',
  fields: GRAPH_FIELDS,
  initial: { vertices: '', edges: 'S-A, S-B, A-C', start: 'S' },
  sample: { vertices: '', edges: 'S-A, S-B, A-C, C-D, B-D', start: 'S' },
  evaluate: (input) => {
    const r = withStart(input);
    if (r.error) return err(r.error);
    return compareRuns(() => fmtDist(r.g!, bfsWithStack(r.g!, r.s!)), () => fmtDist(r.g!, bfs(r.g!, r.s!).dist));
  },
  explanation:
    'S-A, S-B, A-C, C-D, B-D из S: снимаем S → dist A = 1, B = 1, стек [A, B]. pop → B (последний!) → D = 2. pop → D → C = 3. А на самом деле S-A-C даёт C = 2. Стек (LIFO) не гарантирует обработку «по слоям», поэтому первое обнаружение ≠ кратчайший путь. Только FIFO-очередь даёт BFS-слои. На дереве путь до каждой вершины единственный, поэтому баг не виден.',
  fixedCode: `    q = deque([s])
    while q:
        u = q.popleft()              # FIFO`,
};

function componentsBuggy(g: Graph): number {
  const adj = new Map<string, string[]>();
  for (const [u, v] of g.edges) {
    adj.set(u, [...(adj.get(u) ?? []), v]);
    adj.set(v, [...(adj.get(v) ?? []), u]);
  }
  const seen = new Set<string>();
  let count = 0;
  for (const s of adj.keys()) {
    if (seen.has(s)) continue;
    count++;
    const q = [s];
    seen.add(s);
    while (q.length) {
      const u = q.shift()!;
      for (const v of adj.get(u) ?? []) if (!seen.has(v)) (seen.add(v), q.push(v));
    }
  }
  return count;
}

const cxIsolated: CounterexampleTask = {
  id: 'cx-m3-3',
  module: 'm3',
  topic: 'graphrep',
  difficulty: 2,
  title: 'Подсчёт компонент: потерянные вершины',
  goal: 'Посчитать число connected components неориентированного графа с вершинами vertices и рёбрами edges.',
  buggyCode: `from collections import defaultdict, deque

def count_components(vertices, edges):
    adj = defaultdict(list)
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)
    seen, count = set(), 0
    for s in adj:                    # перебираем вершины из adj
        if s in seen:
            continue
        count += 1
        seen.add(s)
        q = deque([s])
        while q:
            u = q.popleft()
            for v in adj[u]:
                if v not in seen:
                    seen.add(v)
                    q.append(v)
    return count`,
  bugLine: 9,
  hint: 'Какие вершины никогда не попадут в adj, если он строится только по Edge List?',
  fields: [
    { name: 'vertices', label: 'Все вершины', placeholder: '1 2 3 4' },
    { name: 'edges', label: 'Рёбра', placeholder: '1-2, 3-4', type: 'area' },
  ],
  initial: { vertices: '1 2 3 4', edges: '1-2, 3-4' },
  sample: { vertices: '1 2 3', edges: '1-2' },
  evaluate: (input) => {
    const { graph, error } = graphFrom(input, false);
    if (error) return err(error);
    return compareRuns(() => `components = ${componentsBuggy(graph!)}`, () => `components = ${dfsAll(graph!).components.length}`);
  },
  explanation:
    'vertices = 1 2 3, edges = 1-2. Вершина 3 изолирована (нет рёбер), поэтому её нет в adj, и цикл for s in adj её не видит: багованный код вернёт 1, правильный — 2. Edge List не хранит изолированные вершины — это его известный недостаток. Внешний цикл обхода всегда должен идти по списку ВСЕХ вершин.',
  fixedCode: `    for s in vertices:               # все вершины, включая изолированные`,
};

function bfsOneWay(g: Graph, s: string): string[] {
  const adj = new Map<string, string[]>(g.vertices.map((v) => [v, []]));
  for (const [u, v] of g.edges) adj.set(u, [...adj.get(u)!, v]);
  for (const [k, l] of adj) adj.set(k, [...l].sort(cmpLabel));
  const visited = new Set([s]);
  const q = [s];
  const order: string[] = [];
  while (q.length) {
    const u = q.shift()!;
    order.push(u);
    for (const v of adj.get(u)!) if (!visited.has(v)) (visited.add(v), q.push(v));
  }
  return order;
}

const cxOneWay: CounterexampleTask = {
  id: 'cx-m3-4',
  module: 'm3',
  topic: 'graphrep',
  difficulty: 1,
  title: 'Adjacency List неориентированного графа',
  goal: 'Построить Adjacency List НЕориентированного графа из Edge List и выполнить BFS из start.',
  buggyCode: `def build_adj(vertices, edges):
    adj = {v: [] for v in vertices}
    for u, v in edges:
        adj[u].append(v)
    return adj

order = bfs(build_adj(vertices, edges), start)`,
  bugLine: 4,
  hint: 'Ребро u–v неориентированного графа можно пройти в обе стороны. Откуда начать BFS, чтобы это стало важно?',
  fields: GRAPH_FIELDS,
  initial: { vertices: '', edges: 'A-B, A-C, B-D', start: 'A' },
  sample: { vertices: '', edges: 'A-B', start: 'B' },
  evaluate: (input) => {
    const r = withStart(input);
    if (r.error) return err(r.error);
    return compareRuns(() => fmtList(bfsOneWay(r.g!, r.s!)), () => fmtList(bfs(r.g!, r.s!).order));
  },
  explanation:
    'Ребро A-B записано как (A, B). Багованный код добавляет только adj[A] = [B]. BFS из B не видит A → [B] вместо [B, A]. Если стартовать из вершины, с которой все рёбра «начинаются», ошибка не видна. В Adjacency List неориентированного графа каждое ребро хранится ДВАЖДЫ (поэтому память O(V + 2E)), а в Adjacency Matrix матрица симметрична.',
  fixedCode: `    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)`,
};

function pathBuggy(g: Graph, s: string, t: string): string {
  const adj = adjacencyList(g);
  const parent = new Map<string, string | null>([[s, null]]);
  const visited = new Set([s]);
  const q = [s];
  while (q.length) {
    const u = q.shift()!;
    for (const v of adj.get(u) ?? []) {
      parent.set(v, u); // до проверки visited
      if (!visited.has(v)) (visited.add(v), q.push(v));
    }
  }
  if (!parent.has(t)) return 'нет пути';
  const path: string[] = [];
  let cur: string | null | undefined = t;
  const tick = guard(200);
  while (cur !== null && cur !== undefined) {
    tick();
    path.push(cur);
    cur = parent.get(cur);
  }
  return fmtList(path.reverse());
}

const cxParent: CounterexampleTask = {
  id: 'cx-m3-5',
  module: 'm3',
  topic: 'bfs',
  difficulty: 3,
  title: 'Восстановление пути: parent перезаписывается',
  goal: 'Найти кратчайший путь от start до target в ОРИЕНТИРОВАННОМ невзвешенном графе с помощью BFS и словаря parent.',
  buggyCode: `def shortest_path(adj, s, t):
    parent = {s: None}
    visited = {s}
    q = deque([s])
    while q:
        u = q.popleft()
        for v in adj[u]:
            parent[v] = u            # запоминаем, откуда пришли
            if v not in visited:
                visited.add(v)
                q.append(v)
    path = []
    while t is not None:
        path.append(t)
        t = parent[t]
    return path[::-1]`,
  bugLine: 8,
  hint: 'parent[v] меняется каждый раз, когда v встречается как сосед — даже если v уже обнаружена раньше по более короткому пути.',
  fields: [
    { name: 'vertices', label: 'Вершины (необязательно)', placeholder: 'S A B T' },
    { name: 'edges', label: 'Рёбра (ориентированные)', placeholder: 'S->A, A->T', type: 'area' },
    { name: 'start', label: 'start', placeholder: 'S' },
    { name: 'target', label: 'target', placeholder: 'T' },
  ],
  initial: { vertices: '', edges: 'S->A, A->B, A->T', start: 'S', target: 'T' },
  sample: { vertices: '', edges: 'S->A, A->T, S->B, B->C, C->T', start: 'S', target: 'T' },
  evaluate: (input) => {
    const r = withStart(input, true);
    if (r.error) return err(r.error);
    const t = (input.target ?? '').trim();
    if (!r.g!.vertices.includes(t)) return err(`Вершина «${t}» отсутствует в графе`);
    return compareRuns(
      () => pathBuggy(r.g!, r.s!, t),
      () => {
        const p = reconstructPath(bfs(r.g!, r.s!).parent, t);
        return p.length ? fmtList(p) : 'нет пути';
      },
    );
  },
  explanation:
    'S->A, A->T, S->B, B->C, C->T. BFS из S: извлекаем S → parent[A] = S, parent[B] = S. Извлекаем A → parent[T] = A (кратчайший путь S-A-T длины 2). Извлекаем B → parent[C] = B. Извлекаем C → T уже visited, но багованный код всё равно пишет parent[T] = C. Восстановление даёт [S, B, C, T] — путь длины 3, не кратчайший. В дереве (A->B, A->T) каждая вершина встречается как сосед один раз, поэтому баг не виден. (В неориентированном графе всё ещё хуже: parent[start] перезапишется соседом, и восстановление пути зациклится.) Правило: parent[v] задаётся ОДИН раз — при первом обнаружении, внутри if v not in visited.',
  fixedCode: `        for v in adj[u]:
            if v not in visited:
                visited.add(v)
                parent[v] = u
                q.append(v)`,
};

export const CX_M3: CounterexampleTask[] = [cxOneWay, cxBfsMarkLate, cxIsolated, cxBfsStack, cxParent];
