import type { ModuleContent } from '../../types';
import { hashBasicsLesson } from './lessons/hashBasics';
import { hashOpenLesson } from './lessons/hashOpen';
import { rabinKarpLesson } from './lessons/rabinKarp';
import { ChainVsOpenDiagram, HashSchemeDiagram, RkWindowDiagram } from './viz/Diagrams';
import { HashFunctionExplorer } from './viz/HashFunctionExplorer';
import { HashTablePlayground } from './viz/HashTablePlayground';
import { CollisionCompare } from './viz/CollisionCompare';
import { RabinKarpViz } from './viz/RabinKarpViz';

export const module1: ModuleContent = {
  id: 'm1',
  number: 1,
  title: 'Hash Tables & Rabin-Karp',
  short: 'Hashing',
  description:
    'Как hash function превращает ключ в индекс, как разрешать коллизии (Separate Chaining, Linear и Quadratic Probing), зачем нужны tombstones, и как Rabin-Karp ищет подстроку с помощью rolling hash.',
  color: '#8b5cf6',
  lessons: [hashBasicsLesson, hashOpenLesson, rabinKarpLesson],
  visualizers: {
    'hash-scheme': HashSchemeDiagram,
    'chain-vs-open': ChainVsOpenDiagram,
    'hash-explorer': HashFunctionExplorer,
    'hash-playground': HashTablePlayground,
    'collision-compare': CollisionCompare,
    'rk-window': RkWindowDiagram,
    'rk-visualizer': RabinKarpViz,
  },
};
