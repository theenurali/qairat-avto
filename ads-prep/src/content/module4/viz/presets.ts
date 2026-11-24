import { makeGraph, type Graph } from '../../../lib/algorithms/graph';

export interface GraphPreset {
  id: string;
  name: string;
  graph: Graph;
  positions?: Record<string, { x: number; y: number }>;
  start?: string;
  note?: string;
}

/** Основной пример модуля: неориентированный граф с циклом A-B-E-F-C-A. */
export const G_MAIN: GraphPreset = {
  id: 'main',
  name: 'Пример урока (6 вершин)',
  graph: makeGraph(
    ['A', 'B', 'C', 'D', 'E', 'F'],
    [['A', 'B'], ['A', 'C'], ['B', 'D'], ['B', 'E'], ['C', 'F'], ['E', 'F']],
    false,
  ),
  positions: {
    A: { x: 0.5, y: 0.02 },
    B: { x: 0.22, y: 0.4 },
    C: { x: 0.78, y: 0.4 },
    D: { x: 0.05, y: 0.95 },
    E: { x: 0.4, y: 0.95 },
    F: { x: 0.8, y: 0.95 },
  },
  start: 'A',
};

export const G_TREE: GraphPreset = {
  id: 'tree',
  name: 'Дерево',
  graph: makeGraph(
    ['1', '2', '3', '4', '5', '6', '7'],
    [['1', '2'], ['1', '3'], ['2', '4'], ['2', '5'], ['3', '6'], ['3', '7']],
    false,
  ),
  positions: {
    '1': { x: 0.5, y: 0.02 },
    '2': { x: 0.25, y: 0.5 },
    '3': { x: 0.75, y: 0.5 },
    '4': { x: 0.08, y: 0.98 },
    '5': { x: 0.38, y: 0.98 },
    '6': { x: 0.62, y: 0.98 },
    '7': { x: 0.92, y: 0.98 },
  },
  start: '1',
};

export const G_DISCONNECTED: GraphPreset = {
  id: 'disc',
  name: 'Несвязный граф',
  graph: makeGraph(['A', 'B', 'C', 'D', 'E', 'F'], [['A', 'B'], ['A', 'C'], ['D', 'E']], false),
  positions: {
    A: { x: 0.15, y: 0.1 },
    B: { x: 0.02, y: 0.85 },
    C: { x: 0.32, y: 0.85 },
    D: { x: 0.6, y: 0.1 },
    E: { x: 0.6, y: 0.85 },
    F: { x: 0.95, y: 0.5 },
  },
  start: 'A',
  note: 'DFS из A не дойдёт до D, E, F — нужен внешний цикл по всем вершинам.',
};

export const G_DIRECTED: GraphPreset = {
  id: 'dir',
  name: 'Ориентированный граф',
  graph: makeGraph(
    ['A', 'B', 'C', 'D', 'E'],
    [['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'D'], ['D', 'E'], ['E', 'B']],
    true,
  ),
  positions: {
    A: { x: 0.05, y: 0.5 },
    B: { x: 0.4, y: 0.05 },
    C: { x: 0.4, y: 0.95 },
    D: { x: 0.7, y: 0.5 },
    E: { x: 0.98, y: 0.05 },
  },
  start: 'A',
};

/** Классический DAG (вершины 0..5). */
export const DAG_CLASSIC: GraphPreset = {
  id: 'dag6',
  name: 'DAG 0–5',
  graph: makeGraph(
    ['0', '1', '2', '3', '4', '5'],
    [['5', '2'], ['5', '0'], ['4', '0'], ['4', '1'], ['2', '3'], ['3', '1']],
    true,
  ),
  positions: {
    '5': { x: 0.05, y: 0.05 },
    '4': { x: 0.95, y: 0.05 },
    '0': { x: 0.5, y: 0.35 },
    '2': { x: 0.05, y: 0.6 },
    '3': { x: 0.4, y: 0.98 },
    '1': { x: 0.95, y: 0.75 },
  },
};

/** Одевание утром (по мотивам CLRS). Сокращения подписаны в note. */
export const DAG_DRESS: GraphPreset = {
  id: 'dress',
  name: 'Одевание утром',
  graph: makeGraph(
    ['Тру', 'Брю', 'Туф', 'Рем', 'Руб', 'Гал', 'Пид', 'Нос', 'Час'],
    [
      ['Тру', 'Брю'],
      ['Тру', 'Туф'],
      ['Брю', 'Туф'],
      ['Брю', 'Рем'],
      ['Руб', 'Рем'],
      ['Руб', 'Гал'],
      ['Гал', 'Пид'],
      ['Рем', 'Пид'],
      ['Нос', 'Туф'],
    ],
    true,
  ),
  positions: {
    'Тру': { x: 0.05, y: 0.05 },
    'Нос': { x: 0.05, y: 0.95 },
    'Брю': { x: 0.3, y: 0.3 },
    'Туф': { x: 0.38, y: 0.95 },
    'Руб': { x: 0.6, y: 0.05 },
    'Рем': { x: 0.62, y: 0.55 },
    'Гал': { x: 0.95, y: 0.15 },
    'Пид': { x: 0.92, y: 0.75 },
    'Час': { x: 0.98, y: 0.98 },
  },
  note: 'Тру — трусы, Брю — брюки, Туф — туфли, Рем — ремень, Руб — рубашка, Гал — галстук, Пид — пиджак, Нос — носки, Час — часы. Ребро X → Y: «X надо надеть раньше Y».',
};

export const DAG_COURSES: GraphPreset = {
  id: 'courses',
  name: 'Пререквизиты курсов',
  graph: makeGraph(
    ['Math', 'Prog', 'DM', 'ADS', 'OS', 'AI'],
    [['Math', 'DM'], ['Prog', 'ADS'], ['DM', 'ADS'], ['ADS', 'OS'], ['ADS', 'AI'], ['Math', 'AI']],
    true,
  ),
  positions: {
    Math: { x: 0.05, y: 0.1 },
    Prog: { x: 0.05, y: 0.9 },
    DM: { x: 0.35, y: 0.1 },
    ADS: { x: 0.55, y: 0.65 },
    OS: { x: 0.95, y: 0.95 },
    AI: { x: 0.95, y: 0.2 },
  },
  note: 'Ребро X → Y: «курс X — пререквизит курса Y».',
};

export const DIGRAPH_CYCLE: GraphPreset = {
  id: 'cycle',
  name: 'С циклом A→B→C→A',
  graph: makeGraph(
    ['S', 'A', 'B', 'C', 'D'],
    [['S', 'A'], ['A', 'B'], ['B', 'C'], ['C', 'A'], ['C', 'D']],
    true,
  ),
  positions: {
    S: { x: 0.02, y: 0.5 },
    A: { x: 0.35, y: 0.1 },
    B: { x: 0.7, y: 0.1 },
    C: { x: 0.52, y: 0.9 },
    D: { x: 0.95, y: 0.9 },
  },
  note: 'Цикл A → B → C → A: ни одна из этих вершин не может стоять «первой».',
};

export const DFS_PRESETS: GraphPreset[] = [G_MAIN, G_TREE, G_DISCONNECTED, G_DIRECTED, DIGRAPH_CYCLE];
export const TOPO_PRESETS: GraphPreset[] = [DAG_CLASSIC, DAG_DRESS, DAG_COURSES, DIGRAPH_CYCLE];
