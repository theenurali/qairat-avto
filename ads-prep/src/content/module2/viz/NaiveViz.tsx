import { useEffect, useMemo, useState } from 'react';
import { kmpSearch } from '../../../lib/algorithms/kmp';
import { useStepper } from '../../../lib/useStepper';
import { Button, StepControls } from '../../../components/ui/primitives';
import { Blank, Cell, IndexRow, PointerRow, Row, StrInput, type CellTone } from './Cells';
import { naiveTrace } from './naive';

/** Пошаговый наивный поиск: видно, как указатель в тексте «откатывается» назад. */
export function NaiveSearchViz() {
  const [text, setText] = useState('AAAAAAB');
  const [pattern, setPattern] = useState('AAAB');
  const tr = useMemo(() => naiveTrace(text, pattern), [text, pattern]);
  const total = tr.steps.length;
  const { step, setStep, playing, togglePlay, reset } = useStepper(total, 800);
  useEffect(() => reset(), [text, pattern, reset]);

  const n = text.length;
  const m = pattern.length;
  const inputs = (
    <div className="flex flex-wrap items-end gap-3">
      <StrInput label="Text" value={text} onChange={setText} max={24} />
      <StrInput label="Pattern" value={pattern} onChange={setPattern} max={10} />
    </div>
  );
  if (m === 0 || m > n || total === 0) {
    return (
      <div className="space-y-3">
        {inputs}
        <p className="text-sm text-amber-300">Нужен непустой pattern не длиннее текста.</p>
      </div>
    );
  }

  const cur = tr.steps[step];
  const ti = cur.s + cur.j;
  const prev = step > 0 ? tr.steps[step - 1] : null;
  const backFrom = prev !== null && prev.s !== cur.s && prev.s + prev.j > ti ? prev.s + prev.j : null;
  const textTone = (k: number): CellTone => {
    if (k === ti) return cur.equal ? 'match' : 'mismatch';
    if (k >= cur.s && k < ti) return 'known';
    return 'plain';
  };
  const patTone = (k: number): CellTone => (k === cur.j ? (cur.equal ? 'match' : 'mismatch') : k < cur.j ? 'known' : 'plain');

  return (
    <div className="space-y-4">
      {inputs}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 p-3">
        <div className="inline-flex flex-col gap-1">
          <IndexRow n={n} />
          <PointerRow n={n} marks={{ [ti]: 's+j' }} />
          <Row label="text">
            {[...text].map((c, k) => (
              <Cell key={k} tone={textTone(k)}>
                {c}
              </Cell>
            ))}
          </Row>
          <Row label="pattern">
            {Array.from({ length: n }, (_, k) => {
              const pk = k - cur.s;
              return pk >= 0 && pk < m ? (
                <Cell key={k} tone={patTone(pk)}>
                  {pattern[pk]}
                </Cell>
              ) : (
                <Blank key={k} />
              );
            })}
          </Row>
        </div>
      </div>
      <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-sm text-slate-200">
        <div className="mb-1 font-mono text-xs text-slate-500">
          сдвиг s = {cur.s}, j = {cur.j}: text[{ti}] = '{text[ti]}' vs pattern[{cur.j}] = '{pattern[cur.j]}'
        </div>
        {cur.match !== undefined
          ? `Все ${m} символов совпали → вхождение в позиции ${cur.match}.`
          : cur.equal
            ? 'Совпадение — сравниваем следующий символ.'
            : `Несовпадение → сдвигаем окно на 1 (s = ${cur.s + 1}) и начинаем сравнение заново с j = 0.`}
        {backFrom !== null && (
          <div className="mt-2 text-rose-300">
            ⚠ Указатель в тексте откатился назад: был на позиции {backFrom}, теперь снова на {ti}. Именно эти повторные сравнения
            убирает KMP.
          </div>
        )}
      </div>
      <StepControls step={step} total={total} onStep={setStep} playing={playing} onTogglePlay={togglePlay} />
      <div className="text-xs text-slate-400">
        Всего сравнений у naive: <span className="font-mono text-rose-300">{tr.comparisons}</span>, вхождения: [{tr.matches.join(', ')}]
      </div>
    </div>
  );
}

const CMP_PRESETS: { text: string; pattern: string; note: string }[] = [
  { text: 'AAAAAAAAAAAAAAAAAAAB', pattern: 'AAAAB', note: 'худший случай naive' },
  { text: 'ABABDABACDABABCABAB', pattern: 'ABABCABAB', note: 'классический пример' },
  { text: 'THEQUICKBROWNFOX', pattern: 'FOX', note: 'разные символы — выигрыша почти нет' },
  { text: 'AAAAAAAAAAAA', pattern: 'AAA', note: 'много перекрытий' },
];

/** Сравнение количества сравнений символов: Naive vs KMP. */
export function NaiveVsKmpViz() {
  const [text, setText] = useState(CMP_PRESETS[0].text);
  const [pattern, setPattern] = useState(CMP_PRESETS[0].pattern);
  const naive = useMemo(() => naiveTrace(text, pattern), [text, pattern]);
  const kmp = useMemo(() => kmpSearch(text, pattern), [text, pattern]);
  const n = text.length;
  const m = pattern.length;
  const maxV = Math.max(naive.comparisons, kmp.comparisons, 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <StrInput label="Text" value={text} onChange={setText} max={40} />
        <StrInput label="Pattern" value={pattern} onChange={setPattern} max={12} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {CMP_PRESETS.map((p) => (
          <Button
            key={p.note}
            size="sm"
            variant={p.text === text && p.pattern === pattern ? 'primary' : 'secondary'}
            onClick={() => {
              setText(p.text);
              setPattern(p.pattern);
            }}
          >
            {p.note}
          </Button>
        ))}
      </div>
      {m === 0 || m > n ? (
        <p className="text-sm text-amber-300">Нужен непустой pattern не длиннее текста.</p>
      ) : (
        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <Bar label="Naive" value={naive.comparisons} max={maxV} color="#f43f5e" />
          <Bar label="KMP (поиск)" value={kmp.comparisons} max={maxV} color="#06b6d4" />
          <div className="grid gap-2 pt-2 text-xs text-slate-400 sm:grid-cols-2">
            <div>
              n = {n}, m = {m}. Граница naive: (n − m + 1)·m = <span className="font-mono text-slate-200">{(n - m + 1) * m}</span>
            </div>
            <div>
              Граница KMP-поиска: ≤ 2n = <span className="font-mono text-slate-200">{2 * n}</span> (+ O(m) на LPS)
            </div>
            <div>
              Вхождения naive: <span className="font-mono text-slate-200">[{naive.matches.join(', ')}]</span>
            </div>
            <div>
              Вхождения KMP: <span className="font-mono text-slate-200">[{kmp.matches.join(', ')}]</span>{' '}
              {naive.matches.join() === kmp.matches.join() ? <span className="text-emerald-300">✓ совпадают</span> : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-mono text-slate-100">{value} сравнений</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(value / max) * 100}%`, background: color }} />
      </div>
    </div>
  );
}
