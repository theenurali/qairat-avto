import type { Lesson, ModuleContent, ModuleId } from '../types';
import { module1 } from './module1';
import { module2 } from './module2';
import { module3 } from './module3';
import { module4 } from './module4';

export const MODULES: ModuleContent[] = [module1, module2, module3, module4];

export function getModule(id: string): ModuleContent | undefined {
  return MODULES.find((m) => m.id === id);
}

export const ALL_LESSONS: { module: ModuleContent; lesson: Lesson }[] = MODULES.flatMap((m) =>
  m.lessons.map((lesson) => ({ module: m, lesson })),
);

export function findLesson(id: string): { module: ModuleContent; lesson: Lesson } | undefined {
  return ALL_LESSONS.find((x) => x.lesson.id === id);
}

export function moduleColor(id: ModuleId): string {
  return MODULES.find((m) => m.id === id)?.color ?? '#6366f1';
}
