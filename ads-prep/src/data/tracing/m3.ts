import type { TracingTask } from '../../types';
import { adjacencyList, adjacencyMatrix, bfs, inDegrees, reconstructPath, type Graph } from '../../lib/algorithms/graph';
import { G, fmtAdj, fmtEdges, fmtMatrix, graphForTask } from '../graphs';

export const BFS_CODE = `from collections import deque

def bfs(adj, s):
    visited = {s}
    dist = {s: 0}
    q = deque([s])
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in adj[u]:          # соседи по возрастанию
            if v not in visited:
                visited.add(v)    # отмечаем при добавлении в очередь
                dist[v] = dist[u] + 1
                q.append(v)
    return order, dist`;

function base(id: string, g: Graph, difficulty: 1 | 2 | 3, topic: 'graphrep' | 'bfs') {
  return { id, module: 'm3' as const, topic, difficulty, graph: graphForTask(g) };
}

export function tAdjList(id: string, g: Graph): TracingTask {
  const adj = adjacencyList(g);
  return {
    ...base(id, g, 1, 'graphrep'),
    title: 'Edge List → Adjacency List',
    prompt: `Граф задан Edge List (${g.directed ? 'ориентированный' : 'неориентированный'}). Постройте Adjacency List: для каждой вершины в порядке ${g.vertices.join(', ')} запишите соседей по возрастанию.`,
    data: `vertices: ${g.vertices.join(', ')}\nedges: ${fmtEdges(g)}`,
    format: 'Списки через |, соседи через пробел, пустой — _. Пример: B C | A D | …',
    expected: [...adj.values()].map((l) => (l.length ? l.join(' ') : '_')),
    compare: 'groups',
    labels: g.vertices.map((v) => `adj[${v}]`),
    steps: [
      g.directed ? 'Ориентированный граф: ребро u→v добавляет v только в adj[u].' : 'Неориентированный граф: ребро u–v добавляет v в adj[u] И u в adj[v].',
      ...[...adj.entries()].map(([v, l]) => `${v}: [${l.join(', ')}]`),
    ],
  };
}

export function tMatrixRow(id: string, g: Graph, vertex: string): TracingTask {
  const mat = adjacencyMatrix(g);
  const i = g.vertices.indexOf(vertex);
  const ones = mat.flat().filter((x) => x === 1).length;
  return {
    ...base(id, g, 1, 'graphrep'),
    title: 'Adjacency Matrix: строка и число единиц',
    prompt: `Постройте Adjacency Matrix (порядок вершин ${g.vertices.join(', ')}). Запишите строку для вершины ${vertex} (0/1 через запятую), а последним токеном — общее количество единиц в матрице.`,
    data: `vertices: ${g.vertices.join(', ')}\nedges: ${fmtEdges(g)}`,
    format: `${g.vertices.length} чисел 0/1, затем количество единиц`,
    expected: [...mat[i].map(String), String(ones)],
    compare: 'list',
    labels: [...g.vertices.map((v) => `M[${vertex}][${v}]`), 'всего единиц'],
    steps: [
      `Строка ${vertex}: M[${vertex}][x] = 1, если есть ребро ${vertex}${g.directed ? '→' : '–'}x.`,
      `Матрица:\n${fmtMatrix(g)}`,
      g.directed ? `В орграфе каждое ребро даёт ровно одну единицу: ${g.edges.length}.` : `В неориентированном графе каждое ребро даёт ДВЕ единицы (матрица симметрична): 2·|E| = 2·${g.edges.length} = ${ones}.`,
    ],
  };
}

export function tDegrees(id: string, g: Graph): TracingTask {
  const adj = adjacencyList(g);
  if (g.directed) {
    const indeg = inDegrees(g);
    return {
      ...base(id, g, 2, 'graphrep'),
      title: 'In-degree и out-degree',
      prompt: `Для каждой вершины в порядке ${g.vertices.join(', ')} запишите пару out-degree/in-degree в виде out/in.`,
      data: `edges: ${fmtEdges(g)}`,
      format: 'Например: 2/0, 1/1, …',
      expected: g.vertices.map((v) => `${adj.get(v)!.length}/${indeg.get(v)}`),
      compare: 'list',
      labels: g.vertices.map((v) => v),
      steps: g.vertices.map((v) => `${v}: исходящих ${adj.get(v)!.length} (${adj.get(v)!.join(', ') || '—'}), входящих ${indeg.get(v)}`),
    };
  }
  return {
    ...base(id, g, 1, 'graphrep'),
    title: 'Степени вершин',
    prompt: `Запишите degree каждой вершины в порядке ${g.vertices.join(', ')}. Проверьте себя: сумма степеней = 2·|E|.`,
    data: `edges: ${fmtEdges(g)}`,
    format: 'Числа через запятую',
    expected: g.vertices.map((v) => String(adj.get(v)!.length)),
    compare: 'list',
    labels: g.vertices.map((v) => `deg(${v})`),
    steps: [...g.vertices.map((v) => `deg(${v}) = |{${adj.get(v)!.join(', ')}}| = ${adj.get(v)!.length}`), `Сумма = ${[...adj.values()].reduce((a, l) => a + l.length, 0)} = 2·${g.edges.length} ✓ (Handshaking lemma)`],
  };
}

export function tMatrixToEdges(id: string, g: Graph): TracingTask {
  return {
    ...base(id, g, 2, 'graphrep'),
    title: 'Adjacency Matrix → Edge List',
    prompt: `Дана Adjacency Matrix неориентированного графа. Запишите Edge List (каждое ребро один раз, в виде u-v; порядок не важен).`,
    data: fmtMatrix(g),
    format: 'Рёбра через запятую: A-B, A-C, …',
    expected: g.edges.map(([u, v]) => `${u}-${v}`),
    compare: 'set',
    steps: ['Матрица симметрична — смотрим только на верхний треугольник (j > i), чтобы не записать ребро дважды.', ...g.edges.map(([u, v]) => `M[${u}][${v}] = 1 → ребро ${u}-${v}`)],
  };
}

export function tBfsOrder(id: string, g: Graph, start: string, difficulty: 1 | 2 | 3): TracingTask {
  const r = bfs(g, start);
  return {
    ...base(id, g, difficulty, 'bfs'),
    title: `BFS из ${start}: порядок обхода`,
    prompt: `Выполните BFS из вершины ${start}. Соседи перебираются в порядке Adjacency List (по возрастанию). Запишите порядок, в котором вершины извлекаются из очереди.`,
    data: fmtAdj(g),
    code: BFS_CODE,
    format: 'Вершины через запятую',
    expected: r.order,
    compare: 'list',
    steps: r.steps.map(
      (s) => `popleft ${s.current}: ${s.discovered.length ? `добавляем ${s.discovered.join(', ')}` : 'новых соседей нет'}${s.skipped.length ? ` (уже visited: ${s.skipped.join(', ')})` : ''} → queue = [${s.queue.join(', ')}]`,
    ),
  };
}

export function tBfsQueue(id: string, g: Graph, start: string, k: number): TracingTask {
  const r = bfs(g, start);
  const s = r.steps[k - 1];
  return {
    ...base(id, g, 2, 'bfs'),
    title: `BFS: очередь после ${k}-го извлечения`,
    prompt: `Выполните BFS из ${start}. Запишите содержимое очереди (от начала к концу) сразу ПОСЛЕ того, как ${k}-я по счёту вершина извлечена и все её непосещённые соседи добавлены.`,
    data: fmtAdj(g),
    code: BFS_CODE,
    format: 'Вершины через запятую (front → back), пустая очередь — _',
    expected: s.queue.length ? s.queue : ['_'],
    compare: 'list',
    steps: r.steps.slice(0, k).map((st, i) => `#${i + 1} popleft ${st.current} → добавили [${st.discovered.join(', ')}] → queue = [${st.queue.join(', ')}]`),
  };
}

export function tBfsDist(id: string, g: Graph, start: string): TracingTask {
  const r = bfs(g, start);
  return {
    ...base(id, g, 2, 'bfs'),
    title: `BFS: расстояния от ${start}`,
    prompt: `С помощью BFS найдите кратчайшее расстояние (число рёбер) от ${start} до каждой вершины в порядке ${g.vertices.join(', ')}. Для недостижимых пишите ∞.`,
    data: fmtAdj(g),
    code: BFS_CODE,
    format: 'Числа через запятую (∞ или inf для недостижимых)',
    expected: g.vertices.map((v) => (r.dist.has(v) ? String(r.dist.get(v)) : '∞')),
    compare: 'list',
    labels: g.vertices.map((v) => `dist[${v}]`),
    steps: [...r.steps.map((s) => `${s.current} (dist ${r.dist.get(s.current)}): ${s.discovered.map((v) => `dist[${v}] = ${r.dist.get(v)}`).join(', ') || '—'}`), 'BFS обходит граф «слоями»: сначала всё на расстоянии 1, потом 2 и т.д. Поэтому первое обнаружение = кратчайшее расстояние.'],
  };
}

export function tBfsPath(id: string, g: Graph, start: string, target: string): TracingTask {
  const r = bfs(g, start);
  const path = reconstructPath(r.parent, target);
  return {
    ...base(id, g, 3, 'bfs'),
    title: `BFS: кратчайший путь ${start} → ${target}`,
    prompt: `Выполните BFS из ${start} (соседи по возрастанию), запоминая parent каждой вершины. Восстановите путь от ${start} до ${target} по parent (это кратчайший путь, который находит BFS).`,
    data: fmtAdj(g),
    code: `${BFS_CODE}\n\n# parent[v] = u в момент добавления v в очередь\ndef path(parent, t):\n    res = []\n    while t is not None:\n        res.append(t)\n        t = parent[t]\n    return res[::-1]`,
    format: 'Вершины пути через запятую',
    expected: path,
    compare: 'list',
    steps: [
      ...r.steps.map((s) => `${s.current}: ${s.discovered.map((v) => `parent[${v}] = ${s.current}`).join(', ') || '—'}`),
      `От ${target} идём по parent: ${[...path].reverse().join(' ← ')}. Разворачиваем: ${path.join(' → ')} (${path.length - 1} рёбер).`,
    ],
  };
}

export function tBfsParent(id: string, g: Graph, start: string): TracingTask {
  const r = bfs(g, start);
  return {
    ...base(id, g, 3, 'bfs'),
    title: 'BFS tree: массив parent',
    prompt: `Выполните BFS из ${start}. Для каждой вершины в порядке ${g.vertices.join(', ')} запишите её parent в BFS tree (для ${start} и недостижимых — _).`,
    data: fmtAdj(g),
    code: BFS_CODE,
    format: 'Через запятую, _ для отсутствующего parent',
    expected: g.vertices.map((v) => r.parent.get(v) ?? '_'),
    compare: 'list',
    labels: g.vertices.map((v) => `parent[${v}]`),
    steps: r.steps.map((s) => `${s.current}: ${s.discovered.map((v) => `parent[${v}] = ${s.current}`).join(', ') || 'новых нет'}`),
  };
}

export const TRACING_M3: TracingTask[] = [
  tAdjList('tr-m3-01', G.u1),
  tDegrees('tr-m3-02', G.u2),
  tMatrixRow('tr-m3-03', G.u1, 'C'),
  tAdjList('tr-m3-04', G.d1),
  tDegrees('tr-m3-05', G.d5),
  tMatrixToEdges('tr-m3-06', G.u6),
  tMatrixRow('tr-m3-07', G.d2, '4'),
  tBfsOrder('tr-m3-08', G.u1, 'A', 1),
  tBfsOrder('tr-m3-09', G.u2, '1', 1),
  tBfsOrder('tr-m3-10', G.u3, 'A', 2),
  tBfsQueue('tr-m3-11', G.u3, 'A', 3),
  tBfsDist('tr-m3-12', G.u5, 'S'),
  tBfsOrder('tr-m3-13', G.d4, '1', 2),
  tBfsDist('tr-m3-14', G.u4, '0'),
  tBfsPath('tr-m3-15', G.u7, '1', '8'),
  tBfsParent('tr-m3-16', G.u3, 'C'),
  tBfsOrder('tr-m3-17', G.u7, '4', 3),
];
