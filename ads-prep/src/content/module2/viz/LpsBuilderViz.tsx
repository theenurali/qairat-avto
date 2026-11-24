import { useEffect, useMemo, useState } from 'react';
import { buildLpsTrace, lpsBrute } from '../../../lib/algorithms/kmp';
import { useStepper } from '../../../lib/useStepper';
import { Button, StepControls } from '../../../components/ui/primitives';
import { Cell, IndexRow, PointerRow, Row, StrInput, type CellTone } from './Cells';

const PRESETS = ['AABAACAABAA', 'ABABCABAB', 'AAACAAAA', 'AAAA', 'ABCDE', 'ABACABAB'];
const MAX = 16;

/** Пошаговое построение LPS array с указателями i и len. */
export function LpsBuilderViz() {
  const [pattern, setPattern] = useState('AABAACAABAA');
  const [selected, setSelected] = useState<number | null>(null);
  const { lps, steps } = useMemo(() => buildLpsTrace(pattern), [pattern]);
  const total = steps.length + 1; // кадр 0 — начальное состояние
  const { step, setStep, playing, togglePlay, reset } = useStepper(total, 1200);

  useEffect(() => {
    reset();
    setSelected(null);
  }, [pattern, reset]);

  const m = pattern.length;
  if (m === 0) {
    return (
      <div className="space-y-3">
        <StrInput label="Pattern" value={pattern} onChange={setPattern} max={MAX} />
        <p className="text-sm text-slate-400">Введите pattern, чтобы построить LPS array.</p>
      </div>
    );
  }

  const frame = step === 0 ? null : steps[step - 1];
  const prevSnap = step <= 1 ? null : steps[step - 2].lps;
  const snapshot = frame ? frame.lps : [0, ...Array.from({ length: m - 1 }, () => -1)];
  const iPos = frame ? frame.compare[0] : 1;
  const lenPos = frame ? frame.compare[1] : 0;
  const lenBefore = frame ? frame.len : 0;

  const charTone = (k: number): CellTone => {
    if (frame) {
      if (k === iPos) return frame.equal ? 'match' : 'mismatch';
      if (k === lenPos) return frame.equal ? 'match' : 'mismatch';
      // уже совпавший border: prefix [0..len-1] и suffix [i-len..i-1]
      if (k < lenBefore || (k >= iPos - lenBefore && k < iPos)) return 'known';
    }
    return 'plain';
  };

  const lpsTone = (k: number): CellTone => {
    if (snapshot[k] < 0) return 'muted';
    const justSet = frame && (prevSnap ? prevSnap[k] < 0 : k !== 0) && snapshot[k] >= 0;
    if (justSet) return 'new';
    if (selected === k) return 'focus';
    return 'plain';
  };

  const marks: Record<number, string> = {};
  if (m > 1) {
    marks[lenPos] = 'len';
    marks[iPos] = iPos === lenPos ? 'i,len' : 'i';
  }

  const done = step === total - 1;
  const focus = selected ?? (frame ? Math.min(iPos, m - 1) : 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <StrInput label="Pattern" value={pattern} onChange={(v) => setPattern(v)} max={MAX} />
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <Button key={p} size="sm" variant={p === pattern ? 'primary' : 'secondary'} onClick={() => setPattern(p)}>
              {p}
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 p-3">
        <div className="inline-flex flex-col gap-1">
          <IndexRow n={m} />
          <Row label="pattern">
            {[...pattern].map((c, k) => (
              <Cell key={k} tone={charTone(k)}>
                {c}
              </Cell>
            ))}
          </Row>
          <PointerRow n={m} marks={marks} label="↑" />
          <Row label="LPS">
            {snapshot.map((v, k) => (
              <Cell key={k} tone={lpsTone(k)} onClick={() => setSelected(k)} title="Нажмите, чтобы увидеть prefix/suffix">
                {v < 0 ? '·' : v}
              </Cell>
            ))}
          </Row>
        </div>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-sm">
        <div className="mb-1 font-mono text-xs text-slate-500">
          i = {iPos}, len = {frame ? frame.len : 0}
          {frame && ` → сравниваем pattern[${iPos}] и pattern[${lenPos}]`}
        </div>
        <div className="text-slate-200">
          {frame
            ? frame.action
            : 'Старт: LPS[0] = 0 всегда (у строки из одного символа нет непустого proper prefix). Начинаем с i = 1, len = 0.'}
        </div>
        {done && (
          <div className="mt-2 font-mono text-emerald-300">
            Готово: LPS = [{lps.join(', ')}]
          </div>
        )}
      </div>

      <StepControls step={step} total={total} onStep={setStep} playing={playing} onTogglePlay={togglePlay} />

      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
        <Legend tone="match" text="символы равны" />
        <Legend tone="mismatch" text="не равны" />
        <Legend tone="known" text="уже совпавший border (prefix = suffix)" />
        <Legend tone="new" text="только что записано в LPS" />
      </div>

      <BorderPanel pattern={pattern} index={focus} />
    </div>
  );
}

function Legend({ tone, text }: { tone: CellTone; text: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="scale-75">
        <Cell tone={tone} />
      </span>
      {text}
    </span>
  );
}

/** Панель «почему LPS[k] именно такой»: все пары proper prefix / suffix. */
function BorderPanel({ pattern, index }: { pattern: string; index: number }) {
  const s = pattern.slice(0, index + 1);
  const best = lpsBrute(pattern)[index] ?? 0;
  const lengths = Array.from({ length: s.length - 1 }, (_, k) => s.length - 1 - k);
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="mb-2 text-sm font-semibold text-slate-100">
        Почему LPS[{index}] = {best}? Строка pattern[0..{index}] = «<span className="font-mono text-cyan-300">{s}</span>»
      </div>
      <p className="mb-3 text-xs text-slate-400">
        Нажмите на любую ячейку LPS, чтобы выбрать индекс. Сравниваем каждый proper prefix (не вся строка!) с suffix той же длины.
      </p>
      {lengths.length === 0 ? (
        <p className="text-sm text-slate-300">Строка из одного символа: proper prefix только пустой → LPS = 0.</p>
      ) : (
        <div className="max-h-64 overflow-auto">
          <table className="w-full text-left font-mono text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="py-1 pr-3">длина</th>
                <th className="py-1 pr-3">prefix</th>
                <th className="py-1 pr-3">suffix</th>
                <th className="py-1">равны?</th>
              </tr>
            </thead>
            <tbody>
              {lengths.map((L) => {
                const pre = s.slice(0, L);
                const suf = s.slice(s.length - L);
                const eq = pre === suf;
                const isBest = L === best;
                return (
                  <tr key={L} className={isBest ? 'bg-emerald-500/10' : undefined}>
                    <td className="py-0.5 pr-3 text-slate-400">{L}</td>
                    <td className="py-0.5 pr-3 text-slate-200">{pre}</td>
                    <td className="py-0.5 pr-3 text-slate-200">{suf}</td>
                    <td className={`py-0.5 ${eq ? 'text-emerald-300' : 'text-slate-600'}`}>
                      {eq ? (isBest ? '✓ самый длинный' : '✓') : '✗'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
