/**
 * Проверка C++-версий кода:
 *  1) полнота — у каждого Python-фрагмента есть C++-аналог;
 *  2) компиляция — каждый C++-фрагмент проходит `g++ -std=c++17 -fsyntax-only`
 *     (как top-level код или, если это последовательность операторов, внутри функции).
 *     Фрагменты с комментарием `// fragment` и fixedCodeCpp не компилируются.
 * Компиляция пропускается, если g++ не установлен.
 *
 * Только один модуль: CPP_MODULE=m2 npx vitest run src/tests/cpp.test.ts
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MODULES } from '../content';
import { CX_TASKS } from '../data/counterexamples';
import { MCQ_BANK } from '../data/questionBank';
import { TRACING_TASKS } from '../data/tracing';
import { CHEAT_EXERCISES } from '../pages/CheatSheetPage';

const ONLY = process.env.CPP_MODULE;
const PRELUDE = '#include <bits/stdc++.h>\nusing namespace std;\n';

function hasGpp(): boolean {
  try {
    execFileSync('g++', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const dir = mkdtempSync(join(tmpdir(), 'ads-cpp-'));
let counter = 0;

function compile(src: string): string | null {
  const file = join(dir, `s${counter++}.cpp`);
  writeFileSync(file, src);
  try {
    execFileSync('g++', ['-std=c++17', '-fsyntax-only', '-w', file], { stdio: 'pipe' });
    return null;
  } catch (e) {
    const err = e as { stderr?: Buffer };
    return err.stderr?.toString().split('\n').slice(0, 6).join('\n') ?? 'compile error';
  }
}

/** Компилируется как top-level или как тело функции. Возвращает ошибку или null. */
export function compileSnippet(code: string): string | null {
  if (code.includes('// fragment')) return null;
  const top = compile(PRELUDE + code + '\n');
  if (top === null) return null;
  const body = compile(PRELUDE + 'void __snippet() {\n' + code + '\n}\n');
  return body === null ? null : top;
}

interface Snip {
  where: string;
  module: string;
  py?: string;
  cpp?: string;
}

const snippets: Snip[] = [];
for (const m of MODULES) {
  for (const l of m.lessons) {
    l.blocks.forEach((b, i) => {
      if (b.kind === 'code') snippets.push({ where: `${l.id} block#${i}`, module: m.id, py: b.code, cpp: b.cpp });
    });
    for (const q of l.miniExam) if (q.code) snippets.push({ where: q.id, module: m.id, py: q.code, cpp: q.codeCpp });
  }
}
for (const q of MCQ_BANK) if (q.code) snippets.push({ where: q.id, module: q.module, py: q.code, cpp: q.codeCpp });
const seenTr = new Set<string>();
for (const t of TRACING_TASKS) {
  if (!t.code || seenTr.has(t.code)) continue;
  seenTr.add(t.code);
  snippets.push({ where: t.id, module: t.module, py: t.code, cpp: t.codeCpp });
}
for (const t of CX_TASKS) snippets.push({ where: t.id, module: t.module, py: t.buggyCode, cpp: t.buggyCodeCpp });
CHEAT_EXERCISES.forEach((e, i) => snippets.push({ where: `cheatsheet#${i}`, module: 'cheat', py: e.code, cpp: e.cpp }));

const selected = snippets.filter((s) => !ONLY || s.module === ONLY);

describe('C++ versions: completeness', () => {
  for (const s of selected) {
    it(`${s.where} has a C++ version`, () => {
      expect(s.cpp?.trim(), s.where).toBeTruthy();
    });
  }
  for (const m of MODULES.filter((x) => !ONLY || x.id === ONLY)) {
    for (const l of m.lessons) {
      l.blocks.forEach((b, i) => {
        if (b.kind === 'code' && b.explain?.length) {
          it(`${l.id} block#${i}: C++ line notes exist and point to real lines`, () => {
            expect(b.cppExplain?.length, `${l.id} block#${i}`).toBeGreaterThan(0);
            const n = (b.cpp ?? '').split('\n').length;
            for (const e of b.cppExplain ?? []) expect(e.line).toBeLessThanOrEqual(n);
          });
        }
      });
    }
  }
  for (const t of CX_TASKS.filter((x) => !ONLY || x.module === ONLY)) {
    it(`${t.id}: bugLineCpp is inside the C++ code`, () => {
      const n = t.buggyCodeCpp.split('\n').length;
      expect(t.bugLineCpp).toBeGreaterThanOrEqual(1);
      expect(t.bugLineCpp).toBeLessThanOrEqual(n);
      expect(t.fixedCodeCpp.trim()).toBeTruthy();
    });
  }
});

describe.skipIf(!hasGpp())('C++ versions: compile with g++', () => {
  for (const s of selected.filter((x) => x.cpp)) {
    it(`${s.where} compiles`, () => {
      const err = compileSnippet(s.cpp!);
      expect(err, `${s.where}\n${s.cpp}\n---\n${err}`).toBeNull();
    }, 30000);
  }
});
