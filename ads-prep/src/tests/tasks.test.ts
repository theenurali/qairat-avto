import { describe, expect, it } from 'vitest';
import { CX_TASKS } from '../data/counterexamples';
import { TRACING_TASKS } from '../data/tracing';
import { checkAnswer } from '../lib/answer';

describe('Counterexample tasks', () => {
  it('have unique ids', () => {
    expect(new Set(CX_TASKS.map((t) => t.id)).size).toBe(CX_TASKS.length);
  });
  for (const t of CX_TASKS) {
    it(`${t.id}: initial input does NOT break the buggy code`, () => {
      const r = t.evaluate(t.initial);
      expect(r.error).toBeUndefined();
      expect(r.broken, `buggy=${r.buggy} correct=${r.correct}`).toBe(false);
    });
    it(`${t.id}: sample counterexample DOES break the buggy code`, () => {
      const r = t.evaluate(t.sample);
      expect(r.error).toBeUndefined();
      expect(r.broken, `buggy=${r.buggy} correct=${r.correct}`).toBe(true);
    });
    it(`${t.id}: odd or empty input never crashes`, () => {
      for (const v of ['@@@ ###', '', '-1', 'A->A, A-A']) {
        const input = Object.fromEntries(t.fields.map((f) => [f.name, v]));
        expect(() => t.evaluate(input)).not.toThrow();
      }
    });
  }
});

describe('Tracing tasks', () => {
  it('have unique ids and ≥15 per module', () => {
    expect(new Set(TRACING_TASKS.map((t) => t.id)).size).toBe(TRACING_TASKS.length);
    for (const m of ['m1', 'm2', 'm3', 'm4']) expect(TRACING_TASKS.filter((t) => t.module === m).length).toBeGreaterThanOrEqual(15);
  });
  for (const t of TRACING_TASKS) {
    it(`${t.id}: expected answer is accepted by the checker`, () => {
      expect(t.expected.length).toBeGreaterThan(0);
      expect(t.steps.length).toBeGreaterThan(0);
      const input = t.compare === 'groups' ? t.expected.join(' | ') : t.expected.join(', ');
      expect(checkAnswer(input, t.expected, t.compare).correct).toBe(true);
    });
  }
});
