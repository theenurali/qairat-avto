import type { CounterexampleTask, MCQ, OpenQuestion, TopicId, TracingTask } from '../types';
import { CX_TASKS } from './counterexamples';
import { G } from './graphs';
import { MCQ_BANK, OPEN_BANK } from './questionBank';
import { tChaining, tOpenTable, tRkSpurious, tRkWindowHashes } from './tracing/m1';
import { tKmpJumps, tKmpMatches, tLps } from './tracing/m2';
import { tBfsDist, tBfsOrder, tBfsPath } from './tracing/m3';
import { tDfsOrder, tDfsTopo, tKahnOrder } from './tracing/m4';

export type MockItem =
  | { kind: 'mcq'; id: string; topic: TopicId; points: number; q: MCQ }
  | { kind: 'tracing'; id: string; topic: TopicId; points: number; task: TracingTask }
  | { kind: 'cx'; id: string; topic: TopicId; points: number; task: CounterexampleTask }
  | { kind: 'open'; id: string; topic: TopicId; points: number; q: OpenQuestion };

export interface MockExam {
  id: string;
  title: string;
  description: string;
  minutes: number;
  items: MockItem[];
}

export const SECTION_NAMES: Record<MockItem['kind'], string> = {
  mcq: 'Part A · Multiple Choice',
  tracing: 'Part B · Tracing',
  cx: 'Part C · Counterexample',
  open: 'Part D · Open Questions',
};

const POINTS = { mcq: 1, tracing: 3, cx: 4, open: 5 } as const;

/** Детерминированно выбирает k вопросов модуля для варианта v (непересекающиеся между вариантами). */
function pickMcq(module: string, v: number, k: number): MCQ[] {
  const pool = MCQ_BANK.filter((q) => q.module === module);
  // индексы v + 3·step·j: у разных вариантов разные остатки по модулю 3 → вопросы не пересекаются
  const step = Math.max(1, Math.floor(pool.length / (3 * k)));
  return Array.from({ length: k }, (_, j) => pool[(v + 3 * step * j) % pool.length]);
}

function cx(id: string): CounterexampleTask {
  const t = CX_TASKS.find((x) => x.id === id);
  if (!t) throw new Error(`counterexample ${id} not found`);
  return t;
}

function open(module: string, n: number): OpenQuestion {
  const pool = OPEN_BANK.filter((q) => q.module === module);
  return pool[n % pool.length];
}

function build(id: string, title: string, description: string, v: number, tracing: TracingTask[], cxIds: string[], opens: OpenQuestion[]): MockExam {
  const mcq = [...pickMcq('m1', v, 3), ...pickMcq('m2', v, 2), ...pickMcq('m3', v, 3), ...pickMcq('m4', v, 2)];
  const items: MockItem[] = [
    ...mcq.map((q, i) => ({ kind: 'mcq' as const, id: `${id}-a${i + 1}`, topic: q.topic, points: POINTS.mcq, q })),
    ...tracing.map((task, i) => ({ kind: 'tracing' as const, id: `${id}-b${i + 1}`, topic: task.topic, points: POINTS.tracing, task })),
    ...cxIds.map((cid, i) => {
      const task = cx(cid);
      return { kind: 'cx' as const, id: `${id}-c${i + 1}`, topic: task.topic, points: POINTS.cx, task };
    }),
    ...opens.map((q, i) => ({ kind: 'open' as const, id: `${id}-d${i + 1}`, topic: q.topic, points: POINTS.open, q })),
  ];
  return { id, title, description, minutes: 60, items };
}

export const MOCK_EXAMS: MockExam[] = [
  build(
    'mock-1',
    'Mock Exam · Variant 1',
    'Linear Probing, LPS, BFS-порядок, Kahn. Контрпримеры: delete без tombstone, BFS с visited при извлечении.',
    0,
    [
      tOpenTable('mx1-t1', [27, 18, 29, 28, 39, 13, 16], 11, 'linear', 2),
      tLps('mx1-t2', 'ABAABAB', 2),
      tBfsOrder('mx1-t3', G.u5, 'S', 2),
      tKahnOrder('mx1-t4', G.d4, 2),
    ],
    ['cx-m1-1', 'cx-m3-1'],
    [open('m1', 0), open('m4', 0)],
  ),
  build(
    'mock-2',
    'Mock Exam · Variant 2',
    'Rabin-Karp и spurious hits, KMP search, BFS-расстояния, DFS. Контрпримеры: KMP после совпадения, Kahn без проверки цикла.',
    1,
    [
      tRkSpurious('mx2-t1', '31415926535', '26', { base: 10, q: 11, values: 'digit' }),
      tKmpMatches('mx2-t2', 'ABAABABAABA', 'ABA', 2),
      tBfsDist('mx2-t3', G.u3, 'H'),
      tDfsOrder('mx2-t4', G.u5, 'S', 2),
    ],
    ['cx-m2-3', 'cx-m4-5'],
    [open('m2', 1), open('m3', 1)],
  ),
  build(
    'mock-3',
    'Mock Exam · Variant 3',
    'Separate Chaining, rolling hash, откаты j в KMP, кратчайший путь BFS, DFS Topological Sort. Контрпримеры: rolling hash без h, цикл в несвязном графе.',
    2,
    [
      tChaining('mx3-t1', [33, 12, 45, 22, 56, 1, 23, 34], 11, 2),
      tRkWindowHashes('mx3-t2', '4132415', '241', { base: 10, q: 7, values: 'digit' }, 2),
      tKmpJumps('mx3-t3', 'AABAABAAAB', 'AABAAA'),
      tBfsPath('mx3-t4', G.u3, 'A', 'G'),
      tDfsTopo('mx3-t5', G.d5, 2),
    ],
    ['cx-m1-6', 'cx-m4-8'],
    [open('m3', 2), open('m4', 3)],
  ),
];

export function getMock(id: string): MockExam | undefined {
  return MOCK_EXAMS.find((m) => m.id === id);
}

export function maxScore(exam: MockExam): number {
  return exam.items.reduce((s, it) => s + it.points, 0);
}
