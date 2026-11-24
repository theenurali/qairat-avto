import type { ModuleContent } from '../../types';
import { graphBasicsLesson } from './lessons/graphBasics';
import { representationsLesson } from './lessons/representations';
import { bfsLesson } from './lessons/bfs';
import { GraphTypesDiagram } from './viz/GraphTypesDiagram';
import { GraphRepEditor } from './viz/GraphRepEditor';
import { BfsViz } from './viz/BfsViz';
import { BfsLevels } from './viz/BfsLevels';

export const module3: ModuleContent = {
  id: 'm3',
  number: 3,
  title: 'Graph Representation & BFS',
  short: 'Graphs & BFS',
  description:
    'Что такое граф, как хранить его в памяти (Adjacency Matrix, Adjacency List, Edge List) и как обходить в ширину: Queue, visited, уровни и кратчайший путь в невзвешенном графе.',
  color: '#10b981',
  lessons: [graphBasicsLesson, representationsLesson, bfsLesson],
  visualizers: {
    'm3-graph-types': GraphTypesDiagram,
    'm3-rep-editor': GraphRepEditor,
    'm3-bfs': BfsViz,
    'm3-bfs-levels': BfsLevels,
  },
};
