import { useEffect, useMemo, useState } from 'react';
import { kmpSearch } from '../../../lib/algorithms/kmp';
import { useStepper } from '../../../lib/useStepper';
import { Badge, Button, StepControls } from '../../../components/ui/primitives';
import { Blank, Cell, IndexRow, PointerRow, Row, StrInput, type CellTone } from './Cells';
import { naiveTrace } from './naive';

const PRESETS: { text: string; pattern: string }[] = [
  { text: 'ABABABC', pattern: 'ABABC' },
  { text: 'ABABDABACDABABCABAB', pattern: 'ABABCABAB' },
  { text: 'AAAAA', pattern: 'AA' },
  { text: 'AAAAAAAAAB', pattern: 'AAAAB' },
];

/** Пошаговый KMP-поиск: указатели i (text) и j (pattern), сдвиги pattern по LPS. */
export function KmpSearchViz() {
  const [text, setText] = useState('ABABABC');
  const [pattern, setPattern] = useState('ABABC');
  const res = useMemo(() => kmpSearch(text, pattern), [text, pattern]);
  const naive = useMemo(() => naiveTrace(text, pattern), [text, pattern]);
  const total = res.steps.length;
  const { step, setStep, playing, togglePlay, reset } = useStepper(total, 1000);

  useEffect(() => reset(), [text, pattern, reset]);

  const n = text.length;
  const m = pattern.length;
  const invalid = m === 0 ? 'Введите непустой pattern.' : m > n ? 'Pattern длиннее текста — вхождений быть не может.' : null;

  const inputs = (
    <div className="flex flex-wrap items-end gap-3">
      <StrInput label="Text" value={text} onChange={setText} max={30} />
      <StrInput label="Pattern" value={pattern} onChange={setPattern} max={12} />
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <Button
            key={p.text + p.pattern}
            size="sm"
            variant={p.text === text && p.pattern === pattern ? 'primary' : 'secondary'}
            onClick={() => {
              setText(p.text);
              setPattern(p.pattern);
            }}
          >
            {p.pattern} в {p.text.length > 10 ? p.text.slice(0, 9) + '…' : p.text}
          </Button>
        ))}
      </div>
    </div>
  );

  if (invalid || total === 0) {
    return (
      <div className="space-y-3">
        {inputs}
        <p className="text-sm text-amber-300">{invalid ?? 'Нет шагов для показа.'}</p>
      </div>
    );
  }

  const cur = res.steps[step];
  const offset = cur.i - cur.j;
  const width = Math.max(n, offset + m);
  const found = res.steps.slice(0, step + 1).flatMap((s) => (s.match !== undefined ? [s.match] : []));
  const inFound = (k: number) => found.some((f) => k >= f && k < f + m);

  const textTone = (k: number): CellTone => {
    if (k === cur.i) return cur.equal ? 'match' : 'mismatch';
    if (k >= offset && k < cur.i) return 'known';
    if (k < cur.i) return inFound(k) ? 'found' : 'muted';
    return 'plain';
  };
  const patTone = (k: number): CellTone => {
    if (k === cur.j) return cur.equal ? 'match' : 'mismatch';
    if (k < cur.j) return 'known';
    return 'plain';
  };

  const shiftNote =
    !cur.equal && cur.j > 0
      ? `Сдвиг pattern вправо на j − LPS[j−1] = ${cur.j} − ${res.lps[cur.j - 1]} = ${cur.j - res.lps[cur.j - 1]} позиций. Первые ${res.lps[cur.j - 1]} символа(ов) уже совпадают — их не сравниваем заново.`
      : cur.match !== undefined
        ? `Полное совпадение! Чтобы найти перекрывающиеся вхождения, j = LPS[m−1] = ${res.lps[m - 1]}, а не 0.`
        : null;

  return (
    <div className="space-y-4">
      {inputs}

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 p-3">
        <div className="inline-flex flex-col gap-1">
          <IndexRow n={width} />
          <PointerRow n={width} marks={{ [cur.i]: 'i' }} label="" />
          <Row label="text">
            {Array.from({ length: width }, (_, k) =>
              k < n ? (
                <Cell key={k} tone={textTone(k)}>
                  {text[k]}
                </Cell>
              ) : (
                <Blank key={k} />
              ),
            )}
          </Row>
          <Row label="pattern">
            {Array.from({ length: width }, (_, k) => {
              const pk = k - offset;
              return pk >= 0 && pk < m ? (
                <Cell key={k} tone={patTone(pk)}>
                  {pattern[pk]}
                </Cell>
              ) : (
                <Blank key={k} />
              );
            })}
          </Row>
          <PointerRow n={width} marks={{ [cur.i]: 'j=' + cur.j }} label="" />
        </div>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-sm">
        <div className="mb-1 font-mono text-xs text-slate-500">
          сравнение №{step + 1}: text[{cur.i}] = '{text[cur.i]}' vs pattern[{cur.j}] = '{pattern[cur.j]}'
        </div>
        <div className="text-slate-200">{cur.action}</div>
        {shiftNote && <div className="mt-2 text-cyan-300">{shiftNote}</div>}
      </div>

      <StepControls step={step} total={total} onStep={setStep} playing={playing} onTogglePlay={togglePlay} />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <div className="text-xs text-slate-500">LPS для «{pattern}»</div>
          <div className="mt-1 font-mono text-sm text-slate-100">[{res.lps.join(', ')}]</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <div className="text-xs text-slate-500">Найденные вхождения (до текущего шага)</div>
          <div className="mt-1 font-mono text-sm text-amber-200">{found.length ? found.join(', ') : '—'}</div>
          {step === total - 1 && (
            <div className="mt-1 text-xs text-slate-400">Итог: [{res.matches.join(', ')}]</div>
          )}
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <div className="text-xs text-slate-500">Сравнений символов</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <Badge tone="sky">KMP: {step + 1} / {total}</Badge>
            <Badge tone="rose">Naive: {naive.comparisons}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
