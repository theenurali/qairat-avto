import { adjacencyList, adjacencyMatrix, makeGraph, type Edge, type Graph } from '../lib/algorithms/graph';

const E = (s: string): Edge[] =>
  s
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => {
      const [u, v] = p.split(/->|-/);
      return [u, v] as const;
    });

/** Набор графов для заданий (метки — буквы или числа). */
export const G = {
  // неориентированные
  u1: makeGraph(['A', 'B', 'C', 'D', 'E', 'F'], E('A-B A-C B-D C-D C-E D-F E-F'), false),
  u2: makeGraph(['1', '2', '3', '4', '5', '6', '7'], E('1-2 1-3 2-4 2-5 3-6 5-6 6-7'), false),
  u3: makeGraph(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], E('A-B A-D B-C B-E D-E E-F C-F F-G G-H'), false),
  u4: makeGraph(['0', '1', '2', '3', '4', '5', '6'], E('0-1 0-2 1-3 2-3 4-5 5-6'), false), // несвязный
  u5: makeGraph(['S', 'A', 'B', 'C', 'D', 'E', 'T'], E('S-A S-B A-C B-C B-D C-E D-T E-T'), false),
  u6: makeGraph(['A', 'B', 'C', 'D', 'E'], E('A-B B-C C-A C-D D-E'), false),
  u7: makeGraph(['1', '2', '3', '4', '5', '6', '7', '8'], E('1-2 1-5 2-3 2-6 3-4 3-7 5-6 6-7 7-8 4-8'), false),
  // ориентированные
  d1: makeGraph(['A', 'B', 'C', 'D', 'E', 'F'], E('A->B A->C B->D C->D C->E D->F E->F'), true),
  d2: makeGraph(['0', '1', '2', '3', '4', '5'], E('5->2 5->0 4->0 4->1 2->3 3->1'), true), // классический DAG
  d3: makeGraph(['A', 'B', 'C', 'D', 'E'], E('A->B B->C C->A C->D D->E'), true), // с циклом
  d4: makeGraph(['1', '2', '3', '4', '5', '6', '7'], E('1->2 1->3 2->4 3->4 4->5 3->6 6->7 5->7'), true),
  d5: makeGraph(['A', 'B', 'C', 'D', 'E', 'F', 'G'], E('A->D B->D B->E C->E D->F E->F E->G'), true),
  d6: makeGraph(['A', 'B', 'C', 'D', 'E', 'F'], E('A->B B->C C->D D->B D->E A->F'), true), // цикл B-C-D
  d7: makeGraph(['A', 'B', 'C', 'D', 'E', 'F', 'G'], E('A->B A->C B->D D->C C->E E->F F->D G->A'), true), // цикл C-E-F-D-C
} satisfies Record<string, Graph>;

export type GraphKey = keyof typeof G;

/** Текстовое представление adjacency list для условий задач. */
export function fmtAdj(g: Graph): string {
  const adj = adjacencyList(g);
  return [...adj.entries()].map(([v, list]) => `${v}: [${list.join(', ')}]`).join('\n');
}

export function fmtEdges(g: Graph): string {
  return g.edges.map(([u, v]) => (g.directed ? `${u}→${v}` : `${u}–${v}`)).join(', ');
}

export function fmtMatrix(g: Graph): string {
  const m = adjacencyMatrix(g);
  const w = Math.max(...g.vertices.map((v) => v.length));
  const head = ' '.repeat(w + 2) + g.vertices.map((v) => v.padStart(2)).join('');
  const rows = m.map((row, i) => `${g.vertices[i].padStart(w)} |${row.map((x) => String(x).padStart(2)).join('')}`);
  return [head, ...rows].join('\n');
}

export function graphForTask(g: Graph): { vertices: string[]; edges: (readonly [string, string])[]; directed: boolean } {
  return { vertices: [...g.vertices], edges: [...g.edges], directed: g.directed };
}
