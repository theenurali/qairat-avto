import { useMemo } from 'react';
import { ALL_LESSONS, MODULES } from '../content';
import { CX_TASKS } from '../data/counterexamples';
import { MCQ_BANK } from '../data/questionBank';
import { TRACING_TASKS } from '../data/tracing';
import { TOPIC_NAMES, type ModuleId, type TopicId } from '../types';
import { useProgress, type ProgressState } from './progress';

export const ALL_TOPICS = Object.keys(TOPIC_NAMES) as TopicId[];

const MINI_TOPIC = new Map<string, TopicId>(ALL_LESSONS.flatMap(({ lesson }) => lesson.miniExam.map((q) => [q.id, q.topic] as const)));
const MCQ_TOPIC = new Map<string, TopicId>([...MCQ_BANK.map((q) => [q.id, q.topic] as const), ...MINI_TOPIC]);
const TR_TOPIC = new Map<string, TopicId>(TRACING_TASKS.map((t) => [t.id, t.topic]));
const CX_TOPIC = new Map<string, TopicId>(CX_TASKS.map((t) => [t.id, t.topic]));

export interface TopicStat {
  topic: TopicId;
  right: number;
  wrong: number;
  /** 0..1 или null, если попыток нет */
  accuracy: number | null;
  attempts: number;
  weak: boolean;
  reason?: string;
}

export interface OverallStats {
  overall: number;
  lessonsDone: number;
  lessonsTotal: number;
  tracingSolved: number;
  tracingTotal: number;
  cxSolved: number;
  cxTotal: number;
  mcqCorrect: number;
  mcqTotal: number;
  mocksDone: number;
  problemsSolved: number;
  topics: TopicStat[];
  weakTopics: TopicStat[];
  modules: { id: ModuleId; title: string; color: string; percent: number; lessonsDone: number; lessonsTotal: number }[];
}

function addTo(acc: Map<TopicId, { r: number; w: number }>, topic: TopicId | undefined, r: number, w: number) {
  if (!topic) return;
  const cur = acc.get(topic) ?? { r: 0, w: 0 };
  acc.set(topic, { r: cur.r + r, w: cur.w + w });
}

export function computeStats(s: ProgressState): OverallStats {
  const lessonsTotal = ALL_LESSONS.length;
  const lessonsDone = ALL_LESSONS.filter(({ lesson }) => s.lessonsCompleted[lesson.id]).length;
  const tracingSolved = TRACING_TASKS.filter((t) => s.tracing[t.id]?.solved).length;
  const cxSolved = CX_TASKS.filter((t) => s.counter[t.id]?.solved).length;
  const mcqCorrect = MCQ_BANK.filter((q) => s.mcq[q.id]?.solved).length;
  const mocksDone = new Set(s.mockResults.map((r) => r.examId)).size;

  const frac = (a: number, b: number) => (b === 0 ? 0 : a / b);
  const overall = Math.round(
    100 *
      (0.35 * frac(lessonsDone, lessonsTotal) +
        0.2 * frac(tracingSolved, TRACING_TASKS.length) +
        0.15 * frac(cxSolved, CX_TASKS.length) +
        0.2 * frac(mcqCorrect, MCQ_BANK.length) +
        0.1 * Math.min(1, mocksDone / 3)),
  );

  const acc = new Map<TopicId, { r: number; w: number }>();
  for (const [id, a] of Object.entries(s.tracing)) addTo(acc, TR_TOPIC.get(id), a.right, a.wrong);
  for (const [id, a] of Object.entries(s.counter)) addTo(acc, CX_TOPIC.get(id), a.right, a.wrong);
  for (const [id, a] of Object.entries(s.mcq)) addTo(acc, MCQ_TOPIC.get(id), a.right, a.wrong);
  // последний mock exam по каждому варианту: баллы по темам
  const lastMock = s.mockResults[s.mockResults.length - 1];
  const mockByTopic = new Map<TopicId, { got: number; max: number }>();
  if (lastMock) {
    for (const it of lastMock.items) {
      const t = it.topic as TopicId;
      const cur = mockByTopic.get(t) ?? { got: 0, max: 0 };
      mockByTopic.set(t, { got: cur.got + it.got, max: cur.max + it.max });
    }
  }

  const topics: TopicStat[] = ALL_TOPICS.map((topic) => {
    const a = acc.get(topic) ?? { r: 0, w: 0 };
    const attempts = a.r + a.w;
    const accuracy = attempts ? a.r / attempts : null;
    const mock = mockByTopic.get(topic);
    let weak = false;
    let reason: string | undefined;
    if (mock && mock.max > 0 && mock.got / mock.max < 0.6) {
      weak = true;
      reason = `Mock Exam: ${Math.round((100 * mock.got) / mock.max)}% по теме`;
    } else if (accuracy !== null && attempts >= 3 && accuracy < 0.7) {
      weak = true;
      reason = `точность ${Math.round(accuracy * 100)}% (${a.r} из ${attempts})`;
    }
    return { topic, right: a.r, wrong: a.w, accuracy, attempts, weak, reason };
  });

  const modules = MODULES.map((m) => {
    const lt = m.lessons.length;
    const ld = m.lessons.filter((l) => s.lessonsCompleted[l.id]).length;
    const tr = TRACING_TASKS.filter((t) => t.module === m.id);
    const cx = CX_TASKS.filter((t) => t.module === m.id);
    const mq = MCQ_BANK.filter((q) => q.module === m.id);
    const percent = Math.round(
      100 *
        (0.45 * frac(ld, lt) +
          0.25 * frac(tr.filter((t) => s.tracing[t.id]?.solved).length, tr.length) +
          0.15 * frac(cx.filter((t) => s.counter[t.id]?.solved).length, cx.length) +
          0.15 * frac(mq.filter((q) => s.mcq[q.id]?.solved).length, mq.length)),
    );
    return { id: m.id, title: m.title, color: m.color, percent, lessonsDone: ld, lessonsTotal: lt };
  });

  return {
    overall,
    lessonsDone,
    lessonsTotal,
    tracingSolved,
    tracingTotal: TRACING_TASKS.length,
    cxSolved,
    cxTotal: CX_TASKS.length,
    mcqCorrect,
    mcqTotal: MCQ_BANK.length,
    mocksDone,
    problemsSolved: tracingSolved + cxSolved + mcqCorrect,
    topics,
    weakTopics: topics.filter((t) => t.weak),
    modules,
  };
}

export function useOverallStats(): OverallStats {
  const { state } = useProgress();
  return useMemo(() => computeStats(state), [state]);
}
