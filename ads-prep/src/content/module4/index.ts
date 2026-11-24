import type { ModuleContent } from '../../types';
import { lessonDfs } from './lessons/dfs';
import { lessonDfsIterative } from './lessons/dfsIterative';
import { lessonTopo } from './lessons/topo';
import { DfsViz } from './viz/DfsViz';
import { KahnViz } from './viz/KahnViz';
import { DfsTopoViz } from './viz/DfsTopoViz';
import { BfsVsDfsScheme, ComponentsScheme, DagVsCycleScheme } from './viz/Schemes';

export const module4: ModuleContent = {
  id: 'm4',
  number: 4,
  title: 'DFS & Topological Sort',
  short: 'DFS & Topo',
  description:
    "Поиск в глубину (recursive и iterative), call stack, компоненты связности и поиск циклов, DAG, in-degree, Kahn's Algorithm и топологическая сортировка через DFS.",
  color: '#f59e0b',
  lessons: [lessonDfs, lessonDfsIterative, lessonTopo],
  visualizers: {
    'm4-dfs': DfsViz,
    'm4-kahn': KahnViz,
    'm4-dfs-topo': DfsTopoViz,
    'm4-bfs-vs-dfs': BfsVsDfsScheme,
    'm4-dag-vs-cycle': DagVsCycleScheme,
    'm4-components': ComponentsScheme,
  },
};
