import type { CounterexampleTask, CxField, CxResult } from '../../types';
import { adjacencyList, cmpLabel, dfsRecursive, dfsTopo, hasDirectedCycle, hasUndirectedCycle, kahn, type Graph } from '../../lib/algorithms/graph';
import { LoopLimit, compareRuns, fmtList, graphFrom, guard } from './util';

const err = (e: string): CxResult => ({ error: e, buggy: '', correct: '', broken: false });

const DIRECTED: CxField[] = [
  { name: 'vertices', label: 'Вершины (необязательно, для изолированных)', placeholder: 'A B C' },
  { name: 'edges', label: 'Рёбра (ориентированные)', placeholder: 'A->B, B->C', type: 'area' },
];
const UNDIRECTED: CxField[] = [
  { name: 'vertices', label: 'Вершины (необязательно, для изолированных)', placeholder: 'A B C' },
  { name: 'edges', label: 'Рёбра (неориентированные)', placeholder: 'A-B, B-C', type: 'area' },
];
const START: CxField = { name: 'start', label: 'Стартовая вершина', placeholder: 'A' };

function withStart(input: Record<string, string>, directed: boolean): { g?: Graph; s?: string; error?: string } {
  const { graph, error } = graphFrom(input, directed);
  if (error) return { error };
  const s = (input.start ?? '').trim();
  if (!graph!.vertices.includes(s)) return { error: `Стартовая вершина «${s}» отсутствует в графе` };
  return { g: graph, s };
}

/* 1. DFS без visited */
function dfsNoVisited(g: Graph, s: string): string[] {
  const adj = adjacencyList(g);
  const order: string[] = [];
  let depth = 0;
  const tick = guard(3000);
  const go = (u: string) => {
    tick();
    depth++;
    if (depth > 900) throw new LoopLimit('recursion');
    order.push(u);
    for (const v of adj.get(u) ?? []) go(v);
    depth--;
  };
  go(s);
  return order;
}

const cxNoVisited: CounterexampleTask = {
  id: 'cx-m4-1',
  module: 'm4',
  topic: 'dfs',
  difficulty: 1,
  title: 'DFS без visited',
  goal: 'Вернуть порядок посещения вершин ориентированного графа при DFS из start: каждая достижимая вершина ровно один раз.',
  buggyCode: `def dfs(adj, u, order):
    order.append(u)
    for v in adj[u]:
        dfs(adj, v, order)`,
  bugLine: 3,
  hint: 'Что будет, если до вершины можно дойти двумя путями? А если есть цикл?',
  fields: [...DIRECTED, START],
  initial: { vertices: '', edges: 'A->B, A->C, B->D', start: 'A' },
  sample: { vertices: '', edges: 'A->B, B->A', start: 'A' },
  evaluate: (input) => {
    const r = withStart(input, true);
    if (r.error) return err(r.error);
    return compareRuns(() => fmtList(dfsNoVisited(r.g!, r.s!)), () => fmtList(dfsRecursive(r.g!, r.s!).order));
  },
  explanation:
    'A->B, B->A: dfs(A) → dfs(B) → dfs(A) → dfs(B) … бесконечная рекурсия (в Python — RecursionError). Даже без цикла, в «ромбе» A->B, A->C, B->D, C->D вершина D посетится дважды. На дереве ошибка не видна — у каждой вершины единственный путь. visited нужен, чтобы каждая вершина обрабатывалась один раз: это даёт и корректность, и O(V + E).',
  fixedCode: `def dfs(adj, u, visited, order):
    visited.add(u)
    order.append(u)
    for v in adj[u]:
        if v not in visited:
            dfs(adj, v, visited, order)`,
};

/* 2. Iterative DFS: visited при push */
function dfsMarkOnPush(g: Graph, s: string): string[] {
  const adj = adjacencyList(g);
  const visited = new Set([s]);
  const stack = [s];
  const order: string[] = [];
  while (stack.length) {
    const u = stack.pop()!;
    order.push(u);
    const nb = adj.get(u) ?? [];
    for (let k = nb.length - 1; k >= 0; k--) {
      if (!visited.has(nb[k])) {
        visited.add(nb[k]);
        stack.push(nb[k]);
      }
    }
  }
  return order;
}

const cxIterPush: CounterexampleTask = {
  id: 'cx-m4-2',
  module: 'm4',
  topic: 'dfs',
  difficulty: 3,
  title: 'Iterative DFS: visited при push',
  goal: 'Iterative DFS должен давать тот же порядок посещения, что и recursive DFS (соседи по возрастанию).',
  buggyCode: `def dfs_iter(adj, s):
    visited = {s}
    stack = [s]
    order = []
    while stack:
        u = stack.pop()
        order.append(u)
        for v in reversed(adj[u]):
            if v not in visited:
                visited.add(v)       # отмечаем при push (как в BFS)
                stack.append(v)
    return order`,
  bugLine: 10,
  hint: 'Если вершина отмечена при push, её уже нельзя «перехватить» более глубоким путём. Нужен граф, где сосед start достижим и напрямую, и через другого соседа.',
  fields: [...UNDIRECTED, START],
  initial: { vertices: '', edges: 'A-B, A-C, B-D', start: 'A' },
  sample: { vertices: '', edges: 'A-B, A-C, B-C, C-D, B-E', start: 'A' },
  evaluate: (input) => {
    const r = withStart(input, false);
    if (r.error) return err(r.error);
    return compareRuns(() => fmtList(dfsMarkOnPush(r.g!, r.s!)), () => fmtList(dfsRecursive(r.g!, r.s!).order));
  },
  explanation:
    'A-B, A-C, B-C, C-D, B-E из A. Recursive DFS: A → B → C (C — сосед B) → D, возврат к B → E: [A, B, C, D, E]. Багованный: pop A, отмечает и кладёт C, B. pop B: C уже «visited» (хотя ещё не посещён!) → кладёт только E. pop E → потом C, D: [A, B, E, C, D]. Это уже не DFS-порядок. Правильный iterative DFS отмечает visited при pop и пропускает уже посещённые.',
  fixedCode: `    while stack:
        u = stack.pop()
        if u in visited:
            continue
        visited.add(u)
        order.append(u)
        for v in reversed(adj[u]):
            if v not in visited:
                stack.append(v)`,
};

/* Kahn-варианты */
type KahnBug = 'outdeg' | 'noZeroCheck' | 'noCycleCheck';

function kahnBuggy(g: Graph, bug: KahnBug): string {
  const adj = adjacencyList(g);
  const indeg = new Map(g.vertices.map((v) => [v, 0]));
  for (const [u, v] of g.edges) {
    const key = bug === 'outdeg' ? u : v;
    indeg.set(key, indeg.get(key)! + 1);
  }
  let q = [...g.vertices].sort(cmpLabel).filter((v) => indeg.get(v) === 0);
  const order: string[] = [];
  const tick = guard(500);
  while (q.length) {
    tick();
    const u = q[0];
    q = q.slice(1);
    order.push(u);
    for (const v of adj.get(u) ?? []) {
      indeg.set(v, indeg.get(v)! - 1);
      if (bug === 'noZeroCheck' || indeg.get(v) === 0) q = [...q, v];
    }
  }
  if (bug !== 'noCycleCheck' && order.length < g.vertices.length) return 'None (цикл)';
  return fmtList(order);
}

function kahnCorrect(g: Graph): string {
  const r = kahn(g);
  return r.hasCycle ? 'None (цикл)' : fmtList(r.order);
}

const KAHN_HEAD = `from collections import deque

def kahn(adj, vertices):
    indeg = {v: 0 for v in vertices}`;

const cxKahnOutdeg: CounterexampleTask = {
  id: 'cx-m4-3',
  module: 'm4',
  topic: 'topo',
  difficulty: 1,
  title: "Kahn: считает не тот in-degree",
  goal: "Kahn's Algorithm: вернуть топологический порядок DAG или None, если есть направленный цикл.",
  buggyCode: `${KAHN_HEAD}
    for u, v in edges:
        indeg[u] += 1
    q = deque(v for v in sorted(vertices) if indeg[v] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return order if len(order) == len(vertices) else None`,
  bugLine: 6,
  hint: 'in-degree — это число ВХОДЯЩИХ рёбер. Ребро u→v увеличивает in-degree какой вершины?',
  fields: DIRECTED,
  initial: { vertices: 'A B C', edges: '' },
  sample: { vertices: '', edges: 'A->B' },
  evaluate: (input) => {
    const { graph, error } = graphFrom(input, true);
    if (error) return err(error);
    return compareRuns(() => kahnBuggy(graph!, 'outdeg'), () => kahnCorrect(graph!));
  },
  explanation:
    'A->B: багованный код считает indeg[A] = 1, indeg[B] = 0. Очередь начинается с B, у B нет исходящих рёбер, A так и не становится 0 → order = [B], длина < 2 → None (ложный «цикл»). Правильно: indeg[B] = 1, порядок [A, B]. На графе без рёбер обе версии совпадают — поэтому важно тестировать хотя бы одно ребро.',
  fixedCode: `    for u, v in edges:
        indeg[v] += 1`,
};

const cxKahnNoZero: CounterexampleTask = {
  id: 'cx-m4-4',
  module: 'm4',
  topic: 'topo',
  difficulty: 2,
  title: 'Kahn: добавляет в очередь без проверки',
  goal: "Kahn's Algorithm: вернуть корректный топологический порядок DAG.",
  buggyCode: `${KAHN_HEAD}
    for u, v in edges:
        indeg[v] += 1
    q = deque(v for v in sorted(vertices) if indeg[v] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            q.append(v)              # соседа сразу в очередь
    return order if len(order) == len(vertices) else None`,
  bugLine: 15,
  hint: 'Вершина может иметь несколько входящих рёбер. Можно ли выводить её, пока не обработаны ВСЕ её предшественники?',
  fields: DIRECTED,
  initial: { vertices: '', edges: 'A->B, B->C' },
  sample: { vertices: '', edges: 'A->B, A->C, C->B' },
  evaluate: (input) => {
    const { graph, error } = graphFrom(input, true);
    if (error) return err(error);
    return compareRuns(() => kahnBuggy(graph!, 'noZeroCheck'), () => kahnCorrect(graph!));
  },
  explanation:
    'A->B, A->C, C->B: извлекаем A → B и C сразу в очередь. B выводится раньше C, хотя ребро C->B требует C перед B; затем B появится в очереди ещё раз → [A, B, C, B]. На цепочке у каждой вершины один предшественник, поэтому баг не виден. Вершину можно ставить в очередь, только когда её in-degree стал 0 — то есть все её предшественники уже выведены.',
  fixedCode: `            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)`,
};

const cxKahnNoCycle: CounterexampleTask = {
  id: 'cx-m4-5',
  module: 'm4',
  topic: 'topo',
  difficulty: 1,
  title: 'Kahn без проверки цикла',
  goal: "Вернуть топологический порядок, а для графа с направленным циклом — None.",
  buggyCode: `${KAHN_HEAD}
    for u, v in edges:
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
    return order`,
  bugLine: 17,
  hint: 'Что происходит с вершинами на цикле? Их in-degree когда-нибудь станет 0?',
  fields: DIRECTED,
  initial: { vertices: '', edges: 'A->B, A->C, B->D, C->D' },
  sample: { vertices: '', edges: 'A->B, B->C, C->B' },
  evaluate: (input) => {
    const { graph, error } = graphFrom(input, true);
    if (error) return err(error);
    return compareRuns(() => kahnBuggy(graph!, 'noCycleCheck'), () => kahnCorrect(graph!));
  },
  explanation:
    'A->B, B->C, C->B: после вывода A in-degree B = 1 (ребро от C), C = 1 (ребро от B). Ни одна не станет 0 → очередь пустеет, order = [A]. Код возвращает [A] как будто это топологический порядок всего графа. Правильно: если len(order) < V — цикл, сортировки не существует → None.',
  fixedCode: `    if len(order) < len(vertices):
        return None                 # есть направленный цикл
    return order`,
};

/* DFS topo: preorder вместо reverse postorder */
function topoPreorder(g: Graph): string {
  const adj = adjacencyList(g);
  const visited = new Set<string>();
  const res: string[] = [];
  const go = (u: string) => {
    visited.add(u);
    res.push(u);
    for (const v of adj.get(u) ?? []) if (!visited.has(v)) go(v);
  };
  for (const v of [...g.vertices].sort(cmpLabel)) if (!visited.has(v)) go(v);
  return fmtList(res);
}

const cxTopoPre: CounterexampleTask = {
  id: 'cx-m4-6',
  module: 'm4',
  topic: 'topo',
  difficulty: 2,
  title: 'DFS Topological Sort: порядок входа',
  goal: 'Вернуть топологический порядок DAG через DFS (вершины-старты и соседи по возрастанию).',
  buggyCode: `def topo(adj, vertices):
    visited, res = set(), []
    def dfs(u):
        visited.add(u)
        res.append(u)                # записываем при входе
        for v in adj[u]:
            if v not in visited:
                dfs(v)
    for v in sorted(vertices):
        if v not in visited:
            dfs(v)
    return res`,
  bugLine: 5,
  hint: 'Preorder корректен, когда DFS из первой вершины проходит всё по цепочке. Что если у вершины два предшественника, и второй начинается позже?',
  fields: DIRECTED,
  initial: { vertices: '', edges: 'A->B, B->C' },
  sample: { vertices: '', edges: 'A->C, B->C' },
  evaluate: (input) => {
    const { graph, error } = graphFrom(input, true);
    if (error) return err(error);
    if (hasDirectedCycle(graph!)) return err('Для этой задачи введите DAG (граф без направленных циклов)');
    return compareRuns(() => topoPreorder(graph!), () => fmtList(dfsTopo(graph!).order));
  },
  explanation:
    'A->C, B->C: DFS из A записывает A, затем C. Потом DFS из B записывает B → [A, C, B]. Но ребро B->C требует B раньше C. Правильный алгоритм добавляет вершину ПОСЛЕ обработки всех её потомков (postorder) и разворачивает список: finish = [C, A, B] → [B, A, C]. Вершина завершается только после всех зависящих от неё — поэтому reverse postorder корректен.',
  fixedCode: `    def dfs(u):
        visited.add(u)
        for v in adj[u]:
            if v not in visited:
                dfs(v)
        res.append(u)                # при ВЫХОДЕ
    ...
    return res[::-1]`,
};

/* Обнаружение цикла в орграфе только по visited */
function cycleVisitedOnly(g: Graph): boolean {
  const adj = adjacencyList(g);
  const visited = new Set<string>();
  const go = (u: string): boolean => {
    visited.add(u);
    for (const v of adj.get(u) ?? []) {
      if (visited.has(v)) return true;
      if (go(v)) return true;
    }
    return false;
  };
  return [...g.vertices].sort(cmpLabel).some((v) => !visited.has(v) && go(v));
}

const yesNo = (b: boolean) => (b ? 'has_cycle → True' : 'has_cycle → False');

const cxCycleVisited: CounterexampleTask = {
  id: 'cx-m4-7',
  module: 'm4',
  topic: 'dfs',
  difficulty: 2,
  title: 'Цикл в орграфе: только visited',
  goal: 'has_cycle(G) — True, если ориентированный граф содержит направленный цикл.',
  buggyCode: `def has_cycle(adj, vertices):
    visited = set()
    def dfs(u):
        visited.add(u)
        for v in adj[u]:
            if v in visited:
                return True          # «снова пришли в вершину — цикл»
            if dfs(v):
                return True
        return False
    return any(dfs(v) for v in sorted(vertices) if v not in visited)`,
  bugLine: 6,
  hint: 'Попасть в уже посещённую вершину можно и без цикла — например, если она была полностью обработана в другой ветке.',
  fields: DIRECTED,
  initial: { vertices: '', edges: 'A->B, B->C, C->A' },
  sample: { vertices: '', edges: 'A->B, A->C, B->D, C->D' },
  evaluate: (input) => {
    const { graph, error } = graphFrom(input, true);
    if (error) return err(error);
    return compareRuns(() => yesNo(cycleVisitedOnly(graph!)), () => yesNo(hasDirectedCycle(graph!)));
  },
  explanation:
    'Ромб A->B, A->C, B->D, C->D — это DAG. DFS: A → B → D (D завершена), возврат, A → C → D: D уже visited → баг говорит «цикл». Цикл означает ребро в вершину, которая СЕЙЧАС в стеке рекурсии (GRAY), а не в любую посещённую. Нужны три цвета: WHITE (не посещена), GRAY (в стеке), BLACK (завершена). Ребро в BLACK — это cross/forward edge, не цикл.',
  fixedCode: `    color = {v: WHITE for v in vertices}
    def dfs(u):
        color[u] = GRAY
        for v in adj[u]:
            if color[v] == GRAY:
                return True          # back edge → цикл
            if color[v] == WHITE and dfs(v):
                return True
        color[u] = BLACK
        return False`,
};

/* Цикл в неориентированном графе: только первая компонента */
function undirectedCycleFirstOnly(g: Graph): boolean {
  const first = [...g.vertices].sort(cmpLabel)[0];
  const adj = adjacencyList(g);
  const visited = new Set<string>();
  const go = (u: string, p: string | null): boolean => {
    visited.add(u);
    for (const v of adj.get(u) ?? []) {
      if (v === p) continue;
      if (visited.has(v)) return true;
      if (go(v, u)) return true;
    }
    return false;
  };
  return go(first, null);
}

const cxCycleDisconnected: CounterexampleTask = {
  id: 'cx-m4-8',
  module: 'm4',
  topic: 'dfs',
  difficulty: 2,
  title: 'Цикл в несвязном графе',
  goal: 'has_cycle(G) — True, если неориентированный граф (без кратных рёбер) содержит цикл в ЛЮБОЙ компоненте.',
  buggyCode: `def has_cycle(adj, vertices):
    visited = set()
    def dfs(u, parent):
        visited.add(u)
        for v in adj[u]:
            if v == parent:
                continue
            if v in visited:
                return True
            if dfs(v, u):
                return True
        return False
    start = sorted(vertices)[0]
    return dfs(start, None)`,
  bugLine: 14,
  hint: 'DFS из одной вершины видит только её компоненту связности.',
  fields: UNDIRECTED,
  initial: { vertices: '', edges: 'A-B, B-C, C-A, D-E' },
  sample: { vertices: '', edges: 'A-B, C-D, D-E, E-C' },
  evaluate: (input) => {
    const { graph, error } = graphFrom(input, false);
    if (error) return err(error);
    const multi = new Set<string>();
    for (const [u, v] of graph!.edges) {
      const k = [u, v].sort().join('|');
      if (multi.has(k)) return err('Без кратных рёбер, пожалуйста');
      multi.add(k);
    }
    return compareRuns(() => yesNo(undirectedCycleFirstOnly(graph!)), () => yesNo(hasUndirectedCycle(graph!)));
  },
  explanation:
    'A-B и цикл C-D-E-C в другой компоненте. DFS из A видит только {A, B} → False. Правильно: запускать DFS из каждой непосещённой вершины (внешний цикл по всем вершинам). Это общий паттерн для несвязных графов: подсчёт компонент, поиск циклов, топологическая сортировка.',
  fixedCode: `    for s in sorted(vertices):
        if s not in visited and dfs(s, None):
            return True
    return False`,
};

export const CX_M4: CounterexampleTask[] = [cxNoVisited, cxKahnOutdeg, cxKahnNoCycle, cxCycleDisconnected, cxTopoPre, cxKahnNoZero, cxCycleVisited, cxIterPush];
