import type { ComponentType } from 'react';

/** Четыре больших модуля курса. */
export type ModuleId = 'm1' | 'm2' | 'm3' | 'm4';

/** Темы экзамена (для статистики и слабых мест). */
export type TopicId = 'hash' | 'rk' | 'kmp' | 'graphrep' | 'bfs' | 'dfs' | 'topo';

export const TOPIC_NAMES: Record<TopicId, string> = {
  hash: 'Hash Tables',
  rk: 'Rabin-Karp',
  kmp: 'KMP',
  graphrep: 'Graph Representation',
  bfs: 'BFS',
  dfs: 'DFS',
  topo: 'Topological Sort',
};

export const TOPIC_MODULE: Record<TopicId, ModuleId> = {
  hash: 'm1',
  rk: 'm1',
  kmp: 'm2',
  graphrep: 'm3',
  bfs: 'm3',
  dfs: 'm4',
  topo: 'm4',
};

/* ------------------------------------------------------------------ */
/* Lesson content blocks                                               */
/* Text fields support a tiny inline markup: **bold**, `code`, *italic* */
/* ------------------------------------------------------------------ */

export type Block =
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'analogy'; title?: string; text: string }
  | { kind: 'note' | 'tip' | 'warning'; title?: string; text: string }
  | { kind: 'list'; items: string[]; ordered?: boolean }
  /**
   * Код на Python (`code`) и C++ (`cpp`). `explain` / `cppExplain` — пояснения к строкам
   * соответствующей версии (номер строки с 1).
   */
  | {
      kind: 'code';
      code: string;
      cpp?: string;
      caption?: string;
      explain?: { line: number; text: string }[];
      cppExplain?: { line: number; text: string }[];
    }
  | { kind: 'table'; headers: string[]; rows: string[][]; caption?: string }
  /** Пошаговый пример. `state` — моноширинный снимок состояния после шага. */
  | { kind: 'steps'; title: string; steps: { title: string; text: string; state?: string }[] }
  /** Интерактивный визуализатор или схема из ModuleContent.visualizers[id]. */
  | { kind: 'viz'; id: string; caption?: string }
  | {
      kind: 'complexity';
      rows: { op: string; best?: string; avg: string; worst: string; space: string; why: string }[];
    }
  | { kind: 'mistakes'; items: { mistake: string; fix: string }[] }
  /** Вопросы для самопроверки: ответ скрыт до нажатия. */
  | { kind: 'selfcheck'; items: { q: string; a: string }[] }
  /** Практические задания с раскрываемым решением. */
  | { kind: 'practice'; items: { task: string; solution: string }[] }
  /** Ключевые выводы урока. */
  | { kind: 'summary'; items: string[] };

/** Вопрос с 4 вариантами ответа. */
export interface MCQ {
  id: string;
  module: ModuleId;
  topic: TopicId;
  category: 'definition' | 'principle' | 'comparison' | 'proscons' | 'time' | 'space' | 'why-how' | 'code';
  question: string;
  /** Необязательный фрагмент кода Python к вопросу. */
  code?: string;
  /** Тот же фрагмент на C++ (обязателен, если есть code). */
  codeCpp?: string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  /** Почему правильный ответ правильный. */
  explanation: string;
  /** Необязательно: пояснение для каждого варианта (почему он неверный/верный). */
  optionNotes?: [string, string, string, string];
}

export interface Lesson {
  id: string; // глобально уникальный, например 'm1-hash'
  title: string;
  subtitle: string;
  topic: TopicId;
  minutes: number;
  blocks: Block[];
  /** Мини-экзамен после темы (5–8 вопросов). */
  miniExam: MCQ[];
}

export interface ModuleContent {
  id: ModuleId;
  number: number;
  title: string;
  short: string;
  description: string;
  /** Tailwind-friendly hex цвет акцента модуля. */
  color: string;
  lessons: Lesson[];
  visualizers: Record<string, ComponentType>;
}

export interface OpenQuestion {
  id: string;
  module: ModuleId;
  topic: TopicId;
  en: string;
  ru: string;
  /** Образцовый ответ (на русском, термины на английском). */
  model: string;
  /** Ключевые моменты, которые обязательно должны быть в ответе. keywords — для автоподсказки (lowercase, ru/en). */
  keyPoints: { text: string; keywords: string[] }[];
}

/* ------------------------------------------------------------------ */
/* Tracing                                                             */
/* ------------------------------------------------------------------ */

export interface TracingTask {
  id: string;
  module: ModuleId;
  topic: TopicId;
  difficulty: 1 | 2 | 3;
  title: string;
  /** Формулировка задания (ru). */
  prompt: string;
  /** Исходные данные (моноширинный блок). */
  data: string;
  /** Код алгоритма (Python). */
  code?: string;
  /** Тот же алгоритм на C++. */
  codeCpp?: string;
  /** Подсказка о формате ответа. */
  format: string;
  /** Правильный ответ как список токенов. */
  expected: string[];
  /** 'list' — порядок важен, 'set' — порядок не важен, 'groups' — группы через | (например цепочки bucket'ов). */
  compare: 'list' | 'set' | 'groups';
  /** Граф для рисунка (необязательно). */
  graph?: { vertices: string[]; edges: (readonly [string, string])[]; directed: boolean };
  /** Подписи к позициям ответа (например «slot 0»), чтобы показывать, где ошибка. */
  labels?: string[];
  /** Пошаговое объяснение решения. */
  steps: string[];
}

/* ------------------------------------------------------------------ */
/* Counterexamples                                                     */
/* ------------------------------------------------------------------ */

export interface CxField {
  name: string;
  label: string;
  placeholder: string;
  /** 'line' — однострочное поле, 'area' — многострочное. */
  type?: 'line' | 'area';
}

export interface CxResult {
  /** Ошибка разбора входных данных (если есть) — показать пользователю. */
  error?: string;
  buggy: string;
  correct: string;
  /** true — вывод багованного кода отличается от правильного (контрпример найден). */
  broken: boolean;
  /** Дополнительная заметка (например, «бесконечный цикл остановлен»). */
  note?: string;
}

export interface CounterexampleTask {
  id: string;
  module: ModuleId;
  topic: TopicId;
  difficulty: 1 | 2 | 3;
  title: string;
  /** Что функция ДОЛЖНА делать. */
  goal: string;
  /** Код с ошибкой (Python). */
  buggyCode: string;
  /** Номер строки с ошибкой (1-based) — подсвечивается после решения. */
  bugLine: number;
  /** Тот же код с той же ошибкой на C++. */
  buggyCodeCpp: string;
  bugLineCpp: number;
  hint: string;
  fields: CxField[];
  /** Пример входа, на котором код работает правильно (для старта). */
  initial: Record<string, string>;
  /** Эталонный контрпример (показывается после решения/сдачи). */
  sample: Record<string, string>;
  evaluate: (input: Record<string, string>) => CxResult;
  /** Почему эталонный контрпример ломает код и как исправить. */
  explanation: string;
  fixedCode: string;
  fixedCodeCpp: string;
}
