import { useState } from 'react';
import { buildLps, lpsBrute } from '../../../lib/algorithms/kmp';
import { Blank, Cell, IndexRow, Row, StrInput, type CellTone } from './Cells';

/** Исследователь proper prefix / suffix для произвольной строки. */
export function PrefixSuffixViz() {
  const [s, setS] = useState('ABACABA');
  const n = s.length;
  const best = n ? lpsBrute(s)[n - 1] : 0;
  return (
    <div className="space-y-4">
      <StrInput label="Строка" value={s} onChange={setS} max={14} />
      {n === 0 ? (
        <p className="text-sm text-slate-400">Введите строку.</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Proper prefixes</div>
              <ul className="space-y-1 font-mono text-sm">
                {Array.from({ length: n - 1 }, (_, k) => s.slice(0, k + 1)).map((p) => (
                  <li key={p} className="text-slate-200">
                    {p}
                  </li>
                ))}
                {n === 1 && <li className="text-slate-500">(только пустая строка)</li>}
              </ul>
            </div>
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Proper suffixes</div>
              <ul className="space-y-1 font-mono text-sm">
                {Array.from({ length: n - 1 }, (_, k) => s.slice(n - 1 - k)).map((p) => (
                  <li key={p} className="text-slate-200">
                    {p}
                  </li>
                ))}
                {n === 1 && <li className="text-slate-500">(только пустая строка)</li>}
              </ul>
            </div>
          </div>
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3 text-sm text-slate-200">
            Строки, которые одновременно prefix и suffix (borders):{' '}
            <span className="font-mono text-cyan-300">
              {Array.from({ length: n - 1 }, (_, k) => k + 1)
                .filter((L) => s.slice(0, L) === s.slice(n - L))
                .map((L) => s.slice(0, L))
                .join(', ') || 'нет'}
            </span>
            . Самый длинный имеет длину <span className="font-mono font-bold text-emerald-300">{best}</span> — это и есть LPS для всей
            строки (последний элемент LPS array). Вся строка «{s}» не считается: она не proper.
          </div>
          <div className="text-xs text-slate-400">
            Полный LPS array: <span className="font-mono text-slate-200">[{buildLps(s).join(', ')}]</span>
          </div>
        </>
      )}
    </div>
  );
}

interface AlignRowProps {
  label: string;
  width: number;
  offset: number;
  str: string;
  tone: (k: number) => CellTone;
}

function AlignRow({ label, width, offset, str, tone }: AlignRowProps) {
  return (
    <Row label={label}>
      {Array.from({ length: width }, (_, k) => {
        const pk = k - offset;
        return pk >= 0 && pk < str.length ? (
          <Cell key={k} tone={tone(pk)}>
            {str[pk]}
          </Cell>
        ) : (
          <Blank key={k} />
        );
      })}
    </Row>
  );
}

/** Статичная схема: почему после несовпадения можно сдвинуть pattern и не возвращать i. */
export function ShiftDiagram() {
  const text = 'ABABABC';
  const pattern = 'ABABC';
  const width = 7;
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 p-3">
        <div className="inline-flex flex-col gap-1">
          <IndexRow n={width} />
          <AlignRow label="text" width={width} offset={0} str={text} tone={(k) => (k === 4 ? 'focus' : k < 4 ? 'known' : 'plain')} />
          <div className="py-1 pl-16 text-xs text-slate-400">① До: совпали 4 символа «ABAB» (j = 4), затем text[4]='A' ≠ pattern[4]='C'</div>
          <AlignRow label="было" width={width} offset={0} str={pattern} tone={(k) => (k < 4 ? 'known' : 'mismatch')} />
          <div className="py-1 pl-16 text-xs text-slate-400">
            ② LPS[3] = 2: у «ABAB» suffix «AB» = prefix «AB». Сдвигаем pattern на 4 − 2 = 2, i остаётся на 4, j = 2
          </div>
          <AlignRow label="стало" width={width} offset={2} str={pattern} tone={(k) => (k < 2 ? 'found' : k === 2 ? 'match' : 'plain')} />
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-slate-400">
        <span>
          <span className="font-semibold text-cyan-300">голубые</span> — уже совпавшие символы
        </span>
        <span>
          <span className="font-semibold text-amber-300">жёлтые</span> — «AB», которые гарантированно совпадают без проверки
        </span>
        <span>
          <span className="font-semibold text-emerald-300">зелёная</span> — следующее сравнение: text[4] vs pattern[2]
        </span>
      </div>
    </div>
  );
}
