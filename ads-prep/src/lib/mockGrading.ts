import type { MockExam, MockItem } from '../data/mockExams';
import { checkAnswer } from './answer';
import type { MockAnswer, MockItemResult, MockResult } from './progress';

/** Баллы за одно задание (0..points). Открытые вопросы — по самооценке ключевых пунктов. */
export function gradeItem(item: MockItem, ans: MockAnswer | undefined, openChecks: boolean[] | undefined): number {
  switch (item.kind) {
    case 'mcq':
      return ans?.choice === item.q.correct ? item.points : 0;
    case 'tracing': {
      const text = ans?.text ?? '';
      if (!text.trim()) return 0;
      const r = checkAnswer(text, item.task.expected, item.task.compare);
      if (r.correct) return item.points;
      // частичный балл: доля верных позиций (но не больше points − 1)
      const frac = r.marks.filter(Boolean).length / item.task.expected.length;
      return Math.min(item.points - 1, Math.round(frac * item.points * 2) / 2);
    }
    case 'cx': {
      if (!ans?.fields) return 0;
      const r = item.task.evaluate(ans.fields);
      return !r.error && r.broken ? item.points : 0;
    }
    case 'open': {
      const checks = openChecks ?? [];
      const total = item.q.keyPoints.length;
      if (!total || !(ans?.text ?? '').trim()) return 0;
      return Math.round(((checks.filter(Boolean).length / total) * item.points) * 2) / 2;
    }
  }
}

export function gradeExam(exam: MockExam, startedAt: number, answers: Record<string, MockAnswer>, openChecks: Record<string, boolean[]>): MockResult {
  const items: MockItemResult[] = exam.items.map((it) => ({
    itemId: it.id,
    topic: it.topic,
    got: gradeItem(it, answers[it.id], openChecks[it.id]),
    max: it.points,
  }));
  return {
    examId: exam.id,
    startedAt,
    finishedAt: Date.now(),
    score: items.reduce((s, x) => s + x.got, 0),
    max: items.reduce((s, x) => s + x.max, 0),
    items,
    answers,
    openChecks,
  };
}

export function isAnswered(item: MockItem, ans: MockAnswer | undefined): boolean {
  if (!ans) return false;
  if (item.kind === 'mcq') return ans.choice !== undefined;
  if (item.kind === 'cx') return Boolean(ans.fields && Object.values(ans.fields).some((v) => v.trim()));
  return Boolean(ans.text && ans.text.trim());
}

export function fmtTime(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
