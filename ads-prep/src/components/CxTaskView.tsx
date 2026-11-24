import { useEffect, useState } from 'react';
import type { CounterexampleTask, CxResult } from '../types';
import { CodeBlock } from './ui/CodeBlock';
import { Markup } from './ui/Markup';
import { Button, Callout } from './ui/primitives';

interface Props {
  task: CounterexampleTask;
  onRun?: (broken: boolean) => void;
  /** Режим экзамена: без подсказок и проверки, только ввод. */
  examMode?: boolean;
  values?: Record<string, string>;
  onChange?: (v: Record<string, string>) => void;
}

export function CxFields({ task, values, onChange }: { task: CounterexampleTask; values: Record<string, string>; onChange: (v: Record<string, string>) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {task.fields.map((f) => (
        <label key={f.name} className={`block ${f.type === 'area' ? 'sm:col-span-2' : ''}`}>
          <span className="mb-1 block text-xs font-medium text-slate-400">{f.label}</span>
          {f.type === 'area' ? (
            <textarea
              rows={2}
              spellCheck={false}
              value={values[f.name] ?? ''}
              placeholder={f.placeholder}
              onChange={(e) => onChange({ ...values, [f.name]: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-indigo-400"
            />
          ) : (
            <input
              spellCheck={false}
              value={values[f.name] ?? ''}
              placeholder={f.placeholder}
              onChange={(e) => onChange({ ...values, [f.name]: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-indigo-400"
            />
          )}
        </label>
      ))}
    </div>
  );
}

export function CxOutcome({ r }: { r: CxResult }) {
  if (r.error) return <Callout kind="warning" title="Проверьте ввод">{r.error}</Callout>;
  return (
    <div className="mt-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-rose-300">Вывод кода с ошибкой</div>
          <div className="mt-1 break-words font-mono text-sm text-slate-100">{r.buggy}</div>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Правильный ответ</div>
          <div className="mt-1 break-words font-mono text-sm text-slate-100">{r.correct}</div>
        </div>
      </div>
      {r.note && <div className="text-xs text-slate-400">{r.note}</div>}
      <div className={`rounded-xl border-l-4 p-4 ${r.broken ? 'border-emerald-500 bg-emerald-500/10' : 'border-amber-500 bg-amber-500/10'}`}>
        <div className="font-semibold text-white">{r.broken ? '🎯 Контрпример найден! Выводы различаются.' : 'На этих данных код с ошибкой работает правильно.'}</div>
        {!r.broken && <div className="mt-1 text-sm text-slate-300">Это НЕ контрпример. Подумайте, какой граничный случай не учтён, и измените данные.</div>}
      </div>
    </div>
  );
}

export function CxTaskView({ task, onRun, examMode, values, onChange }: Props) {
  const [local, setLocal] = useState<Record<string, string>>(task.initial);
  const [result, setResult] = useState<CxResult | null>(null);
  const [hint, setHint] = useState(false);
  const [solved, setSolved] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const v = values ?? local;
  const setV = onChange ?? setLocal;

  useEffect(() => {
    setLocal(task.initial);
    setResult(null);
    setHint(false);
    setSolved(false);
    setGaveUp(false);
  }, [task]);

  const run = () => {
    const r = task.evaluate(v);
    setResult(r);
    // засчитываем только найденный контрпример; «пробные» запуски не считаются ошибкой
    if (!r.error && r.broken && !solved) {
      onRun?.(true);
      setSolved(true);
    }
  };

  const reveal = solved || gaveUp;

  return (
    <div>
      <Callout kind="note" title="Что функция должна делать">
        <Markup text={task.goal} />
      </Callout>
      <CodeBlock code={task.buggyCode} caption="Код с ошибкой" danger={reveal && !examMode ? [task.bugLine] : []} />
      <div className="mt-4">
        <div className="mb-2 text-sm font-medium text-slate-200">Ваши входные данные (контрпример)</div>
        <CxFields task={task} values={v} onChange={setV} />
      </div>
      {!examMode && (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={run}>▶ Запустить оба кода</Button>
            <Button variant="ghost" onClick={() => setHint((h) => !h)}>
              💡 {hint ? 'Скрыть подсказку' : 'Подсказка'}
            </Button>
            {!solved && (
              <Button
                variant="ghost"
                onClick={() => {
                  if (!gaveUp) onRun?.(false);
                  setGaveUp(true);
                  setV(task.sample);
                }}
              >
                Показать эталонный контрпример
              </Button>
            )}
          </div>
          {hint && (
            <Callout kind="tip" title="Подсказка">
              <Markup text={task.hint} />
            </Callout>
          )}
          {result && <CxOutcome r={result} />}
          {reveal && (
            <div className="mt-5 space-y-3 animate-fadeup">
              <Callout kind={solved ? 'success' : 'note'} title="Почему этот пример ломает код">
                <div className="mb-2 font-mono text-xs text-slate-400">
                  Эталон: {Object.entries(task.sample).filter(([, x]) => x).map(([k, x]) => `${k} = ${x}`).join('; ')}
                </div>
                <Markup text={task.explanation} />
              </Callout>
              <CodeBlock code={task.fixedCode} caption={`Исправление (ошибка в строке ${task.bugLine})`} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
