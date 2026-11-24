/**
 * Графы: представления, BFS, DFS (recursive / iterative), Topological Sort (Kahn, DFS).
 * Соглашение по умолчанию: соседи перебираются в порядке возрастания меток
 * (числа — численно, строки — по алфавиту), если не указано иное.
 */

export type Edge = readonly [string, string];

export interface Graph {
  vertices: string[];
  edges: Edge[];
  directed: boolean;
}

export type AdjOrder = 'sorted' | 'insertion';

export function cmpLabel(a: string, b: string): number {
  const na = Number(a);
  const nb = Number(b);
  if (a.trim() !== '' && b.trim() !== '' && !Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  return a.localeCompare(b);
}

export function makeGraph(vertices: string[], edges: Edge[], directed: boolean): Graph {
  return { vertices: [...vertices], edges: edges.map(([u, v]) => [u, v] as const), directed };
}

/** Adjacency List: vertex → список соседей. */
export function adjacencyList(g: Graph, order: AdjOrder = 'sorted'): Map<string, string[]> {
  const adj = new Map<string, string[]>(g.vertices.map((v) => [v, []]));
  const add = (u: string, v: string) => {
    if (!adj.has(u)) adj.set(u, []);
    adj.get(u)!.push(v);
  };
  for (const [u, v] of g.edges) {
    add(u, v);
    if (!g.directed && u !== v) add(v, u);
  }
  if (order === 'sorted') for (const [k, list] of adj) adj.set(k, [...list].sort(cmpLabel));
  return adj;
}

/** Adjacency Matrix: matrix[i][j] = 1, если есть ребро vertices[i] → vertices[j]. */
export function adjacencyMatrix(g: Graph): number[][] {
  const idx = new Map(g.vertices.map((v, i) => [v, i]));
  const n = g.vertices.length;
  const mat = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));
  for (const [u, v] of g.edges) {
    const a = idx.get(u);
    const b = idx.get(v);
    if (a === undefined || b === undefined) continue;
    mat[a][b] = 1;
    if (!g.directed) mat[b][a] = 1;
  }
  return mat;
}

export function inDegrees(g: Graph): Map<string, number> {
  const deg = new Map<string, number>(g.vertices.map((v) => [v, 0]));
  for (const [, v] of g.edges) deg.set(v, (deg.get(v) ?? 0) + 1);
  return deg;
}

/* --------------------------------- BFS --------------------------------- */

export interface BfsStep {
  current: string;
  /** Соседи, которые впервые обнаружены на этом шаге. */
  discovered: string[];
  /** Соседи, которые уже были visited (пропущены). */
  skipped: string[];
  queue: string[]; // содержимое очереди ПОСЛЕ шага
  visited: string[];
}

export interface BfsResult {
  order: string[];
  dist: Map<string, number>;
  parent: Map<string, string | null>;
  steps: BfsStep[];
}

/** BFS: вершина помечается visited в момент добавления в очередь. */
export function bfs(g: Graph, start: string, order: AdjOrder = 'sorted'): BfsResult {
  const adj = adjacencyList(g, order);
  const dist = new Map<string, number>([[start, 0]]);
  const parent = new Map<string, string | null>([[start, null]]);
  const visited = new Set([start]);
  const queue = [start];
  const res: string[] = [];
  const steps: BfsStep[] = [];
  while (queue.length > 0) {
    const u = queue.shift()!;
    res.push(u);
    const discovered: string[] = [];
    const skipped: string[] = [];
    for (const v of adj.get(u) ?? []) {
      if (visited.has(v)) {
        skipped.push(v);
        continue;
      }
      visited.add(v);
      dist.set(v, dist.get(u)! + 1);
      parent.set(v, u);
      queue.push(v);
      discovered.push(v);
    }
    steps.push({ current: u, discovered, skipped, queue: [...queue], visited: [...visited] });
  }
  return { order: res, dist, parent, steps };
}

/** Восстановление кратчайшего пути по parent (невзвешенный граф). */
export function reconstructPath(parent: Map<string, string | null>, target: string): string[] {
  if (!parent.has(target)) return [];
  const path: string[] = [];
  let cur: string | null = target;
  while (cur !== null) {
    path.push(cur);
    cur = parent.get(cur) ?? null;
  }
  return path.reverse();
}

/* --------------------------------- DFS --------------------------------- */

export interface DfsStep {
  type: 'enter' | 'skip' | 'finish';
  vertex: string;
  from?: string;
  stack: string[]; // call stack (recursive) или явный стек (iterative) после шага
  visited: string[];
}

export interface DfsResult {
  order: string[]; // порядок посещения (preorder)
  finish: string[]; // порядок завершения (postorder)
  steps: DfsStep[];
}

export function dfsRecursive(g: Graph, start: string, order: AdjOrder = 'sorted'): DfsResult {
  const adj = adjacencyList(g, order);
  const visited = new Set<string>();
  const res: string[] = [];
  const finish: string[] = [];
  const steps: DfsStep[] = [];
  const stack: string[] = [];
  const visit = (u: string, from?: string) => {
    visited.add(u);
    res.push(u);
    stack.push(u);
    steps.push({ type: 'enter', vertex: u, from, stack: [...stack], visited: [...visited] });
    for (const v of adj.get(u) ?? []) {
      if (visited.has(v)) {
        steps.push({ type: 'skip', vertex: v, from: u, stack: [...stack], visited: [...visited] });
        continue;
      }
      visit(v, u);
    }
    stack.pop();
    finish.push(u);
    steps.push({ type: 'finish', vertex: u, stack: [...stack], visited: [...visited] });
  };
  visit(start);
  return { order: res, finish, steps };
}

/**
 * Iterative DFS с явным стеком: pop → если visited, пропустить → visit →
 * push соседей в ОБРАТНОМ порядке (чтобы меньший сосед оказался сверху).
 * Порядок посещения совпадает с recursive DFS.
 */
export function dfsIterative(g: Graph, start: string, order: AdjOrder = 'sorted'): DfsResult {
  const adj = adjacencyList(g, order);
  const visited = new Set<string>();
  const res: string[] = [];
  const steps: DfsStep[] = [];
  const stack = [start];
  while (stack.length > 0) {
    const u = stack.pop()!;
    if (visited.has(u)) {
      steps.push({ type: 'skip', vertex: u, stack: [...stack], visited: [...visited] });
      continue;
    }
    visited.add(u);
    res.push(u);
    const nbrs = adj.get(u) ?? [];
    for (let k = nbrs.length - 1; k >= 0; k--) if (!visited.has(nbrs[k])) stack.push(nbrs[k]);
    steps.push({ type: 'enter', vertex: u, stack: [...stack], visited: [...visited] });
  }
  return { order: res, finish: [], steps };
}

/** DFS по всем вершинам (для несвязных графов): возвращает компоненты. */
export function dfsAll(g: Graph, order: AdjOrder = 'sorted'): { order: string[]; components: string[][] } {
  const adj = adjacencyList(g, order);
  const visited = new Set<string>();
  const res: string[] = [];
  const components: string[][] = [];
  const verts = order === 'sorted' ? [...g.vertices].sort(cmpLabel) : g.vertices;
  for (const s of verts) {
    if (visited.has(s)) continue;
    const comp: string[] = [];
    const visit = (u: string) => {
      visited.add(u);
      res.push(u);
      comp.push(u);
      for (const v of adj.get(u) ?? []) if (!visited.has(v)) visit(v);
    };
    visit(s);
    components.push(comp);
  }
  return { order: res, components };
}

/** Есть ли направленный цикл (WHITE/GRAY/BLACK). */
export function hasDirectedCycle(g: Graph): boolean {
  const adj = adjacencyList(g);
  const color = new Map<string, 0 | 1 | 2>(g.vertices.map((v) => [v, 0]));
  const visit = (u: string): boolean => {
    color.set(u, 1);
    for (const v of adj.get(u) ?? []) {
      const c = color.get(v) ?? 0;
      if (c === 1) return true;
      if (c === 0 && visit(v)) return true;
    }
    color.set(u, 2);
    return false;
  };
  return g.vertices.some((v) => color.get(v) === 0 && visit(v));
}

/** Есть ли цикл в неориентированном графе (с учётом parent). */
export function hasUndirectedCycle(g: Graph): boolean {
  const adj = adjacencyList(g);
  const visited = new Set<string>();
  const visit = (u: string, p: string | null): boolean => {
    visited.add(u);
    let skippedParent = false;
    for (const v of adj.get(u) ?? []) {
      if (v === p && !skippedParent) {
        skippedParent = true; // одно ребро к родителю — не цикл (кратные рёбра — цикл)
        continue;
      }
      if (visited.has(v)) return true;
      if (visit(v, u)) return true;
    }
    return false;
  };
  return [...g.vertices].some((v) => !visited.has(v) && visit(v, null));
}

/* --------------------------- Topological Sort --------------------------- */

export interface KahnStep {
  removed: string;
  decremented: { v: string; to: number }[];
  enqueued: string[];
  queue: string[];
  inDegree: Record<string, number>;
  order: string[];
}

export interface KahnResult {
  order: string[];
  hasCycle: boolean;
  initialInDegree: Record<string, number>;
  initialQueue: string[];
  steps: KahnStep[];
}

/**
 * Kahn's Algorithm.
 * mode 'queue' — обычная FIFO-очередь; новые вершины с in-degree 0 добавляются
 *   в порядке перебора соседей. 'smallest' — всегда берём наименьшую доступную вершину.
 */
export function kahn(g: Graph, mode: 'queue' | 'smallest' = 'queue'): KahnResult {
  const adj = adjacencyList(g);
  const deg = inDegrees(g);
  const initialInDegree = Object.fromEntries(deg);
  const verts = [...g.vertices].sort(cmpLabel);
  let queue = verts.filter((v) => deg.get(v) === 0);
  const initialQueue = [...queue];
  const order: string[] = [];
  const steps: KahnStep[] = [];
  while (queue.length > 0) {
    if (mode === 'smallest') queue = [...queue].sort(cmpLabel);
    const u = queue[0];
    queue = queue.slice(1);
    order.push(u);
    const decremented: { v: string; to: number }[] = [];
    const enqueued: string[] = [];
    for (const v of adj.get(u) ?? []) {
      const d = deg.get(v)! - 1;
      deg.set(v, d);
      decremented.push({ v, to: d });
      if (d === 0) {
        queue = [...queue, v];
        enqueued.push(v);
      }
    }
    steps.push({ removed: u, decremented, enqueued, queue: [...queue], inDegree: Object.fromEntries(deg), order: [...order] });
  }
  return { order, hasCycle: order.length < g.vertices.length, initialInDegree, initialQueue, steps };
}

export interface DfsTopoStep {
  type: 'enter' | 'finish' | 'back-edge';
  vertex: string;
  stack: string[];
  finishOrder: string[];
}

/** Topological Sort через DFS: результат = обратный порядок завершения. */
export function dfsTopo(g: Graph): { order: string[]; finish: string[]; hasCycle: boolean; steps: DfsTopoStep[] } {
  const adj = adjacencyList(g);
  const color = new Map<string, 0 | 1 | 2>(g.vertices.map((v) => [v, 0]));
  const finish: string[] = [];
  const steps: DfsTopoStep[] = [];
  const stack: string[] = [];
  let hasCycle = false;
  const visit = (u: string) => {
    color.set(u, 1);
    stack.push(u);
    steps.push({ type: 'enter', vertex: u, stack: [...stack], finishOrder: [...finish] });
    for (const v of adj.get(u) ?? []) {
      const c = color.get(v) ?? 0;
      if (c === 1) {
        hasCycle = true;
        steps.push({ type: 'back-edge', vertex: v, stack: [...stack], finishOrder: [...finish] });
      } else if (c === 0) visit(v);
    }
    color.set(u, 2);
    stack.pop();
    finish.push(u);
    steps.push({ type: 'finish', vertex: u, stack: [...stack], finishOrder: [...finish] });
  };
  for (const v of [...g.vertices].sort(cmpLabel)) if (color.get(v) === 0) visit(v);
  return { order: [...finish].reverse(), finish, hasCycle, steps };
}

/** Проверка: является ли order корректной топологической сортировкой g. */
export function isValidTopoOrder(g: Graph, order: readonly string[]): boolean {
  if (order.length !== g.vertices.length) return false;
  const pos = new Map(order.map((v, i) => [v, i]));
  if (pos.size !== order.length) return false;
  if (!g.vertices.every((v) => pos.has(v))) return false;
  return g.edges.every(([u, v]) => pos.get(u)! < pos.get(v)!);
}

/* ------------------------------- Parsing -------------------------------- */

/**
 * Разбор рёбер: "A-B, B-C" или "0 1; 1 2" или по строке на ребро.
 * Для ориентированных допускается "A>B" или "A->B".
 */
export function parseEdges(text: string): { edges: Edge[]; error?: string } {
  const parts = text
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const edges: Edge[] = [];
  for (const p of parts) {
    const m = p.match(/^([A-Za-z0-9_]+)\s*(?:->|-|>|\s)\s*([A-Za-z0-9_]+)$/);
    if (!m) return { edges, error: `Не удалось разобрать ребро «${p}». Формат: A-B или A->B` };
    edges.push([m[1], m[2]]);
  }
  return { edges };
}

export function parseVertices(text: string): string[] {
  return text
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Собирает граф из текста; вершины = явно перечисленные ∪ встреченные в рёбрах. */
export function parseGraph(verticesText: string, edgesText: string, directed: boolean): { graph?: Graph; error?: string } {
  const { edges, error } = parseEdges(edgesText);
  if (error) return { error };
  const set = new Set(parseVertices(verticesText));
  for (const [u, v] of edges) {
    set.add(u);
    set.add(v);
  }
  if (set.size === 0) return { error: 'Граф пустой: укажите вершины или рёбра' };
  if (set.size > 30) return { error: 'Слишком большой граф (максимум 30 вершин)' };
  return { graph: makeGraph([...set].sort(cmpLabel), edges, directed) };
}
