import { describe, expect, it } from 'vitest';
import { MOCK_EXAMS, maxScore } from '../data/mockExams';
import { MCQ_BANK, OPEN_BANK } from '../data/questionBank';
import { MODULES } from '../content';
import { gradeExam } from '../lib/mockGrading';
import type { MockAnswer } from '../lib/progress';

describe('Mock exams', () => {
  it('there are 3 variants covering all 4 modules and all 4 formats', () => {
    expect(MOCK_EXAMS.length).toBeGreaterThanOrEqual(3);
    for (const e of MOCK_EXAMS) {
      const kinds = new Set(e.items.map((i) => i.kind));
      expect([...kinds].sort()).toEqual(['cx', 'mcq', 'open', 'tracing']);
      const modules = new Set(e.items.map((i) => (i.kind === 'mcq' || i.kind === 'open' ? i.q.module : i.task.module)));
      expect(modules.size).toBe(4);
      expect(new Set(e.items.map((i) => i.id)).size).toBe(e.items.length);
    }
  });
  it('MCQ items do not repeat across variants', () => {
    const ids = MOCK_EXAMS.flatMap((e) => e.items.filter((i) => i.kind === 'mcq').map((i) => (i.kind === 'mcq' ? i.q.id : '')));
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('perfect answers give full score, empty answers give zero', () => {
    for (const e of MOCK_EXAMS) {
      const answers: Record<string, MockAnswer> = {};
      const checks: Record<string, boolean[]> = {};
      for (const it of e.items) {
        if (it.kind === 'mcq') answers[it.id] = { choice: it.q.correct };
        if (it.kind === 'tracing') answers[it.id] = { text: it.task.compare === 'groups' ? it.task.expected.join(' | ') : it.task.expected.join(', ') };
        if (it.kind === 'cx') answers[it.id] = { fields: it.task.sample };
        if (it.kind === 'open') {
          answers[it.id] = { text: it.q.model };
          checks[it.id] = it.q.keyPoints.map(() => true);
        }
      }
      expect(gradeExam(e, 0, answers, checks).score).toBe(maxScore(e));
      expect(gradeExam(e, 0, {}, {}).score).toBe(0);
    }
  });
});

describe('Content integrity', () => {
  it('MCQ ids unique, 4 options, valid correct index', () => {
    const mini = MODULES.flatMap((m) => m.lessons.flatMap((l) => l.miniExam));
    const all = [...MCQ_BANK, ...mini];
    expect(new Set(all.map((q) => q.id)).size).toBe(all.length);
    for (const q of all) {
      expect(q.options.length).toBe(4);
      expect([0, 1, 2, 3]).toContain(q.correct);
      expect(q.explanation.length).toBeGreaterThan(10);
    }
  });
  it('every viz block refers to a registered visualizer; every module has lessons', () => {
    for (const m of MODULES) {
      expect(m.lessons.length).toBeGreaterThan(0);
      for (const l of m.lessons) {
        expect(l.miniExam.length).toBeGreaterThanOrEqual(5);
        for (const b of l.blocks) if (b.kind === 'viz') expect(m.visualizers[b.id], `${l.id}:${b.id}`).toBeDefined();
        const kinds = new Set(l.blocks.map((b) => b.kind));
        for (const k of ['analogy', 'code', 'complexity', 'mistakes', 'selfcheck', 'practice', 'steps', 'viz']) expect(kinds.has(k as never), `${l.id} lacks ${k}`).toBe(true);
      }
    }
  });
  it('open questions have en/ru, model answer and key points', () => {
    expect(OPEN_BANK.length).toBeGreaterThanOrEqual(20);
    for (const q of OPEN_BANK) {
      expect(q.en && q.ru && q.model).toBeTruthy();
      expect(q.keyPoints.length).toBeGreaterThanOrEqual(3);
    }
  });
});
