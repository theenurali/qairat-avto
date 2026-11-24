import { useState } from 'react';
import { mod } from '../../../lib/algorithms/hashing';
import { Badge, Button } from '../../../components/ui/primitives';

type StrMode = 'sum' | 'poly';
const POLY_BASE = 31;
const MAX_INT_DIGITS = 15;

interface Computation {
  index: number;
  lines: string[];
}

function computeInt(k: number, m: number): Computation {
  const q = Math.floor(k / m);
  const r = mod(k, m);
  return {
    index: r,
    lines: [
      `h(k) = k mod m`,
      `${k} = ${q} · ${m} + ${r}`,
      `h(${k}) = ${k} mod ${m} = ${r}`,
    ],
  };
}

function computeString(s: string, m: number, mode: StrMode): Computation {
  const chars = [...s];
  if (mode === 'sum') {
    const codes = chars.map((c) => c.charCodeAt(0));
    const sum = codes.reduce((a, b) => a + b, 0);
    return {
      index: mod(sum, m),
      lines: [
        `h(s) = (ord(s[0]) + ord(s[1]) + ...) mod m`,
        chars.map((c, i) => `ord('${c}')=${codes[i]}`).join(', '),
        `сумма = ${codes.join(' + ')} = ${sum}`,
        `${sum} mod ${m} = ${mod(sum, m)}`,
      ],
    };
  }
  let h = 0;
  const lines = [`h = 0; для каждого символа: h = (h · ${POLY_BASE} + ord(c)) mod ${m}`];
  for (const c of chars) {
    const nh = mod(h * POLY_BASE + c.charCodeAt(0), m);
    lines.push(`'${c}': (${h} · ${POLY_BASE} + ${c.charCodeAt(0)}) mod ${m} = ${nh}`);
    h = nh;
  }
  return { index: h, lines };
}

const EXAMPLES = ['47', '10', '-3', 'abc', 'cab', 'hello'];

export function HashFunctionExplorer() {
  const [raw, setRaw] = useState('47');
  const [m, setM] = useState(11);
  const [mode, setMode] = useState<StrMode>('poly');

  const key = raw.trim();
  const isInt = /^-?\d+$/.test(key);
  let error = '';
  if (key === '') error = 'Введите ключ: целое число или строку.';
  else if (isInt && key.replace('-', '').length > MAX_INT_DIGITS) error = `Слишком большое число (максимум ${MAX_INT_DIGITS} цифр).`;
  else if (!isInt && key.length > 20) error = 'Строка слишком длинная (максимум 20 символов).';

  const comp: Computation | null = error ? null : isInt ? computeInt(Number(key), m) : computeString(key, m, mode);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-100">Hash Function Explorer</span>
        <Badge tone="indigo">key → index</Badge>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Ключ (key)
          <input
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            className="w-44 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-indigo-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Размер таблицы m
          <input
            type="number"
            min={2}
            max={31}
            value={m}
            onChange={(e) => setM(Math.max(2, Math.min(31, Number(e.target.value) || 2)))}
            className="w-24 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-indigo-400"
          />
        </label>
        {!isInt && (
          <div className="flex gap-1">
            <Button size="sm" variant={mode === 'sum' ? 'primary' : 'secondary'} onClick={() => setMode('sum')}>
              Сумма кодов
            </Button>
            <Button size="sm" variant={mode === 'poly' ? 'primary' : 'secondary'} onClick={() => setMode('poly')}>
              Полиномиальный
            </Button>
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setRaw(ex)}
            className="rounded-md border border-slate-700 px-2 py-0.5 font-mono text-xs text-slate-400 hover:border-indigo-400 hover:text-indigo-200"
          >
            {ex}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

      {comp && (
        <>
          <div className="mt-4 rounded-lg bg-slate-900 p-3 font-mono text-xs leading-6 text-slate-300">
            {comp.lines.map((l, i) => (
              <div key={i} className={i === comp.lines.length - 1 ? 'text-amber-300' : undefined}>
                {l}
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-1">
            {Array.from({ length: m }, (_, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-10 min-w-10 items-center justify-center rounded-md border px-1 font-mono text-xs transition-all duration-300 ${
                    i === comp.index ? 'scale-110 border-amber-400 bg-amber-500/20 text-amber-100' : 'border-slate-700 bg-slate-900 text-slate-600'
                  }`}
                >
                  {i === comp.index ? key : ''}
                </div>
                <span className="font-mono text-[10px] text-slate-500">{i}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            {isInt
              ? 'Для целых чисел используем h(k) = k mod m (как % в Python — результат всегда в диапазоне 0..m−1, даже для отрицательных k).'
              : mode === 'sum'
                ? 'Сумма кодов — слабая hash function: анаграммы ("abc" и "cab") всегда дают одинаковый индекс → коллизия.'
                : 'Полиномиальный хеш учитывает ПОРЯДОК символов, поэтому "abc" и "cab" обычно попадают в разные ячейки.'}
          </p>
        </>
      )}
    </div>
  );
}
