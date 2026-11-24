import { useEffect, useState } from 'react';
import type { TracingTask } from '../types';
import { checkAnswer, type CheckResult } from '../lib/answer';
import { GraphView } from './GraphView';
import { CodeBlock } from './ui/CodeBlock';
import { Markup } from './ui/Markup';
import { Button } from './ui/primitives';

interface Props {
  task: TracingTask;
  /** Вызывается при проверке ответа. */
  onResult?: (correct: boolean) => void;
  /** Режим экзамена: без проверки, только ввод. */
  examMode?: boolean;
  value?: string;
  onChange?: (v: string) => void;
}

export function TracingStatement({ task }: { task: TracingTask }) {
  return (
    <>
      <p className="text-[15px] leading-7 text-slate-200">
        <Markup text={task.prompt} />
      </p>
      <div className={`mt-4 grid gap-4 ${task.graph ? 'lg:grid-cols-2' : ''}`}>
        <div className="min-w-0">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Исходные данные</div>
          <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70 p-4 font-mono text-sm leading-6 text-amber-100">{task.data}</pre>
        </div>
        {task.graph && (
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-2">
            <GraphView graph={task.graph} height={260} />
          </div>
        )}
      </div>
      {task.code && <CodeBlock code={task.code} caption="Алгоритм" />}
    </>
  );
}

export function ResultBreakdown({ task, result }: { task: TracingTask; result: CheckResult }) {
  return (
    <div className="mt-4 space-y-4">
      <div className={`rounded-xl border-l-4 p-4 ${result.correct ? 'border-emerald-500 bg-emerald-500/10' : 'border-rose-500 bg-rose-500/10'}`}>
        <div className="font-semibold text-white">{result.correct ? '✅ Верно!' : '❌ Есть ошибка'}</div>
        <div className="mt-1 text-sm text-slate-300">{result.message}</div>
      </div>
      {task.compare !== 'set' && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[360px] text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr>
                <th className="py-1 pr-3">Позиция</th>
                <th className="py-1 pr-3">Ваш ответ</th>
                <th className="py-1 pr-3">Правильно</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {task.expected.map((e, i) => (
                <tr key={i} className={`border-t border-slate-800 ${i === result.firstError ? 'bg-rose-500/10' : ''}`}>
                  <td className="py-1.5 pr-3 font-sans text-slate-400">{task.labels?.[i] ?? i + 1}</td>
                  <td className={`py-1.5 pr-3 ${result.marks[i] ? 'text-emerald-300' : 'text-rose-300'}`}>{result.given[i] ?? '—'}</td>
                  <td className="py-1.5 pr-3 text-slate-200">{e}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {task.compare === 'set' && (
        <div className="text-sm text-slate-300">
          Правильный ответ (порядок не важен): <span className="font-mono text-slate-100">{task.expected.join(', ')}</span>
        </div>
      )}
      <SolutionSteps task={task} />
    </div>
  );
}

export function SolutionSteps({ task }: { task: TracingTask }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="mb-2 text-sm font-semibold text-indigo-300">Пошаговое решение</div>
      <ol className="space-y-1.5 text-sm">
        {task.steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="w-6 shrink-0 text-right font-mono text-xs text-slate-500">{i + 1}.</span>
            <span className="whitespace-pre-wrap font-mono text-[13px] leading-6 text-slate-300">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function TracingTaskView({ task, onResult, examMode, value, onChange }: Props) {
  const [local, setLocal] = useState('');
  const [result, setResult] = useState<CheckResult | null>(null);
  const [shown, setShown] = useState(false);
  const input = value ?? local;
  const setInput = onChange ?? setLocal;

  useEffect(() => {
    setLocal('');
    setResult(null);
    setShown(false);
  }, [task.id]);

  const check = () => {
    const r = checkAnswer(input, task.expected, task.compare);
    setResult(r);
    onResult?.(r.correct);
  };

  return (
    <div>
      <TracingStatement task={task} />
      <div className="mt-5">
        <label className="mb-1 block text-sm font-medium text-slate-200" htmlFor={`ans-${task.id}`}>
          Ваш ответ
        </label>
        <div className="mb-2 text-xs text-slate-500">Формат: {task.format}</div>
        <textarea
          id={`ans-${task.id}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={2}
          spellCheck={false}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-slate-100 outline-none focus:border-indigo-400"
          placeholder="Введите ответ…"
        />
      </div>
      {!examMode && (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={check} disabled={!input.trim()}>
              Проверить
            </Button>
            <Button variant="ghost" onClick={() => setShown((s) => !s)}>
              {shown ? 'Скрыть решение' : 'Показать решение'}
            </Button>
          </div>
          {result && <ResultBreakdown task={task} result={result} />}
          {!result && shown && (
            <div className="mt-4 space-y-3">
              <div className="text-sm text-slate-300">
                Ответ: <span className="font-mono text-slate-100">{task.compare === 'groups' ? task.expected.join(' | ') : task.expected.join(', ')}</span>
              </div>
              <SolutionSteps task={task} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
