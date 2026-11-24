import type { ModuleContent } from '../../types';
import { lessonNaive } from './lessons/naive';
import { lessonLps } from './lessons/lps';
import { lessonSearch } from './lessons/search';
import { LpsBuilderViz } from './viz/LpsBuilderViz';
import { KmpSearchViz } from './viz/KmpSearchViz';
import { NaiveSearchViz, NaiveVsKmpViz } from './viz/NaiveViz';
import { PrefixSuffixViz, ShiftDiagram } from './viz/Diagrams';

export const module2: ModuleContent = {
  id: 'm2',
  number: 2,
  title: 'Knuth-Morris-Pratt (KMP)',
  short: 'KMP',
  description:
    'Поиск подстроки за O(n + m): почему naive медленный, что такое Prefix Function / LPS array, как двигаются указатели i и j и почему KMP никогда не возвращается назад по тексту.',
  color: '#06b6d4',
  lessons: [lessonNaive, lessonLps, lessonSearch],
  visualizers: {
    'naive-stepper': NaiveSearchViz,
    'naive-vs-kmp': NaiveVsKmpViz,
    'prefix-suffix': PrefixSuffixViz,
    'lps-builder': LpsBuilderViz,
    'kmp-search': KmpSearchViz,
    'shift-diagram': ShiftDiagram,
  },
};
