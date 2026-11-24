import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/** Результат по одному заданию. */
export interface Attempt {
  solved: boolean;
  right: number;
  wrong: number;
  at: number;
}

export interface MockAnswer {
  /** MCQ: индекс варианта; tracing / open: текст; counterexample: поля. */
  choice?: number;
  text?: string;
  fields?: Record<string, string>;
}

export interface MockSession {
  examId: string;
  startedAt: number;
  answers: Record<string, MockAnswer>;
}

export interface MockItemResult {
  itemId: string;
  topic: string;
  got: number;
  max: number;
}

export interface MockResult {
  examId: string;
  startedAt: number;
  finishedAt: number;
  score: number;
  max: number;
  items: MockItemResult[];
  /** Ответы студента — чтобы показать разбор после обновления страницы. */
  answers: Record<string, MockAnswer>;
  /** Самооценка открытых вопросов: itemId → отмеченные ключевые пункты. */
  openChecks: Record<string, boolean[]>;
}

export interface ProgressState {
  version: 1;
  lessonsOpened: Record<string, number>;
  lessonsCompleted: Record<string, { score: number; total: number; at: number }>;
  lastRoute: string;
  tracing: Record<string, Attempt>;
  counter: Record<string, Attempt>;
  mcq: Record<string, Attempt & { choice: number }>;
  open: Record<string, { answer: string; checked: boolean[]; at: number }>;
  mockResults: MockResult[];
  mockSession: MockSession | null;
  examDateTime: string;
}

const STORAGE_KEY = 'ads-prep-progress-v1';
export const DEFAULT_EXAM = '2026-11-29T09:00';

export function initialProgress(): ProgressState {
  return {
    version: 1,
    lessonsOpened: {},
    lessonsCompleted: {},
    lastRoute: '',
    tracing: {},
    counter: {},
    mcq: {},
    open: {},
    mockResults: [],
    mockSession: null,
    examDateTime: DEFAULT_EXAM,
  };
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

/** Безопасная загрузка: битые или чужие данные не ломают приложение. */
export function loadProgress(raw: string | null): ProgressState {
  const base = initialProgress();
  if (!raw) return base;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== 1) return base;
    const pick = <K extends keyof ProgressState>(k: K, check: (v: unknown) => boolean): ProgressState[K] =>
      (check(parsed[k]) ? parsed[k] : base[k]) as ProgressState[K];
    return {
      version: 1,
      lessonsOpened: pick('lessonsOpened', isRecord),
      lessonsCompleted: pick('lessonsCompleted', isRecord),
      lastRoute: pick('lastRoute', (v) => typeof v === 'string'),
      tracing: pick('tracing', isRecord),
      counter: pick('counter', isRecord),
      mcq: pick('mcq', isRecord),
      open: pick('open', isRecord),
      mockResults: pick('mockResults', Array.isArray),
      mockSession: pick('mockSession', (v) => v === null || isRecord(v)),
      examDateTime: pick('examDateTime', (v) => typeof v === 'string' && !Number.isNaN(Date.parse(v as string))),
    };
  } catch {
    return base;
  }
}

function bump(prev: Attempt | undefined, correct: boolean): Attempt {
  const p = prev ?? { solved: false, right: 0, wrong: 0, at: 0 };
  return {
    solved: p.solved || correct,
    right: p.right + (correct ? 1 : 0),
    wrong: p.wrong + (correct ? 0 : 1),
    at: Date.now(),
  };
}

export interface ProgressApi {
  state: ProgressState;
  openLesson: (id: string) => void;
  completeLesson: (id: string, score: number, total: number) => void;
  setLastRoute: (r: string) => void;
  recordTracing: (id: string, correct: boolean) => void;
  recordCounter: (id: string, correct: boolean) => void;
  recordMcq: (id: string, correct: boolean, choice: number) => void;
  saveOpen: (id: string, answer: string, checked: boolean[]) => void;
  startMock: (examId: string) => void;
  answerMock: (itemId: string, ans: MockAnswer) => void;
  finishMock: (result: MockResult) => void;
  abandonMock: () => void;
  setExamDate: (iso: string) => void;
  resetAll: () => void;
}

const Ctx = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(() => {
    try {
      return loadProgress(localStorage.getItem(STORAGE_KEY));
    } catch {
      return initialProgress();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage может быть недоступен (приватный режим) — прогресс живёт только в памяти
    }
  }, [state]);

  const openLesson = useCallback(
    (id: string) => setState((s) => (s.lessonsOpened[id] ? s : { ...s, lessonsOpened: { ...s.lessonsOpened, [id]: Date.now() } })),
    [],
  );
  const completeLesson = useCallback(
    (id: string, score: number, total: number) =>
      setState((s) => {
        const prev = s.lessonsCompleted[id];
        const best = prev && prev.score / prev.total > score / total ? prev : { score, total, at: Date.now() };
        return { ...s, lessonsCompleted: { ...s.lessonsCompleted, [id]: best } };
      }),
    [],
  );
  const setLastRoute = useCallback((r: string) => setState((s) => (s.lastRoute === r ? s : { ...s, lastRoute: r })), []);
  const recordTracing = useCallback(
    (id: string, ok: boolean) => setState((s) => ({ ...s, tracing: { ...s.tracing, [id]: bump(s.tracing[id], ok) } })),
    [],
  );
  const recordCounter = useCallback(
    (id: string, ok: boolean) => setState((s) => ({ ...s, counter: { ...s.counter, [id]: bump(s.counter[id], ok) } })),
    [],
  );
  const recordMcq = useCallback(
    (id: string, ok: boolean, choice: number) =>
      setState((s) => ({ ...s, mcq: { ...s.mcq, [id]: { ...bump(s.mcq[id], ok), choice } } })),
    [],
  );
  const saveOpen = useCallback(
    (id: string, answer: string, checked: boolean[]) =>
      setState((s) => ({ ...s, open: { ...s.open, [id]: { answer, checked, at: Date.now() } } })),
    [],
  );
  const startMock = useCallback(
    (examId: string) => setState((s) => ({ ...s, mockSession: { examId, startedAt: Date.now(), answers: {} } })),
    [],
  );
  const answerMock = useCallback(
    (itemId: string, ans: MockAnswer) =>
      setState((s) =>
        s.mockSession ? { ...s, mockSession: { ...s.mockSession, answers: { ...s.mockSession.answers, [itemId]: ans } } } : s,
      ),
    [],
  );
  const finishMock = useCallback(
    (result: MockResult) => setState((s) => ({ ...s, mockSession: null, mockResults: [...s.mockResults, result] })),
    [],
  );
  const abandonMock = useCallback(() => setState((s) => ({ ...s, mockSession: null })), []);
  const setExamDate = useCallback((iso: string) => setState((s) => ({ ...s, examDateTime: iso })), []);
  const resetAll = useCallback(() => setState(initialProgress()), []);

  const api = useMemo<ProgressApi>(
    () => ({
      state,
      openLesson,
      completeLesson,
      setLastRoute,
      recordTracing,
      recordCounter,
      recordMcq,
      saveOpen,
      startMock,
      answerMock,
      finishMock,
      abandonMock,
      setExamDate,
      resetAll,
    }),
    [state, openLesson, completeLesson, setLastRoute, recordTracing, recordCounter, recordMcq, saveOpen, startMock, answerMock, finishMock, abandonMock, setExamDate, resetAll],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}
