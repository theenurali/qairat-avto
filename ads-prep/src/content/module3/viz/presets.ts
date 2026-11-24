import { makeGraph, type Graph } from '../../../lib/algorithms/graph';

export interface GraphPreset {
  id: string;
  name: string;
  graph: Graph;
  positions?: Record<string, { x: number; y: number }>;
  start: string;
}

/** Основной пример модуля: неориентированный граф A–F (используется в уроках и шагах). */
export const MAIN_GRAPH = makeGraph(
  ['A', 'B', 'C', 'D', 'E', 'F'],
  [
    ['A', 'B'],
    ['A', 'C'],
    ['B', 'D'],
    ['C', 'D'],
    ['C', 'E'],
    ['D', 'F'],
    ['E', 'F'],
  ],
  false,
);

export const MAIN_POS: Record<string, { x: number; y: number }> = {
  A: { x: 0, y: 0.5 },
  B: { x: 0.33, y: 0.08 },
  C: { x: 0.33, y: 0.92 },
  D: { x: 0.66, y: 0.3 },
  E: { x: 0.66, y: 0.95 },
  F: { x: 1, y: 0.6 },
};

export const PRESETS: GraphPreset[] = [
  { id: 'main', name: 'Пример модуля (A–F, неориентированный)', graph: MAIN_GRAPH, positions: MAIN_POS, start: 'A' },
  {
    id: 'directed',
    name: 'Ориентированный граф 0–5',
    graph: makeGraph(
      ['0', '1', '2', '3', '4', '5'],
      [
        ['0', '1'],
        ['0', '2'],
        ['1', '3'],
        ['2', '3'],
        ['3', '4'],
        ['4', '1'],
        ['5', '4'],
      ],
      true,
    ),
    positions: {
      '0': { x: 0, y: 0.5 },
      '1': { x: 0.35, y: 0.1 },
      '2': { x: 0.35, y: 0.9 },
      '3': { x: 0.65, y: 0.5 },
      '4': { x: 0.75, y: 0.05 },
      '5': { x: 1, y: 0.5 },
    },
    start: '0',
  },
  {
    id: 'disconnected',
    name: 'Несвязный граф (3 компоненты)',
    graph: makeGraph(
      ['A', 'B', 'C', 'D', 'E', 'F'],
      [
        ['A', 'B'],
        ['B', 'C'],
        ['A', 'C'],
        ['D', 'E'],
      ],
      false,
    ),
    positions: {
      A: { x: 0, y: 0.2 },
      B: { x: 0.3, y: 0.05 },
      C: { x: 0.2, y: 0.7 },
      D: { x: 0.6, y: 0.2 },
      E: { x: 0.75, y: 0.8 },
      F: { x: 1, y: 0.4 },
    },
    start: 'A',
  },
  {
    id: 'grid',
    name: 'Сетка 3×3 (лабиринт)',
    graph: makeGraph(
      ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
      [
        ['1', '2'],
        ['2', '3'],
        ['1', '4'],
        ['3', '6'],
        ['4', '5'],
        ['4', '7'],
        ['5', '6'],
        ['6', '9'],
        ['7', '8'],
        ['8', '9'],
      ],
      false,
    ),
    positions: {
      '1': { x: 0, y: 0 },
      '2': { x: 0.5, y: 0 },
      '3': { x: 1, y: 0 },
      '4': { x: 0, y: 0.5 },
      '5': { x: 0.5, y: 0.5 },
      '6': { x: 1, y: 0.5 },
      '7': { x: 0, y: 1 },
      '8': { x: 0.5, y: 1 },
      '9': { x: 1, y: 1 },
    },
    start: '1',
  },
];
