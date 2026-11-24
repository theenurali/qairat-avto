import { useState } from 'react';
import { chainInsertAll, openInsertAll, slotToString, type ProbeMode } from '../../../lib/algorithms/hashing';
import { Badge } from '../../../components/ui/primitives';

function parse(text: string): { keys: number[]; error?: string } {
  const parts = text.split(/[\s,;]+/).filter(Boolean);
  if (parts.length === 0) return { keys: [], error: 'Введите ключи через запятую.' };
  const keys: number[] = [];
  for (const p of parts) {
    if (!/^-?\d{1,9}$/.test(p)) return { keys: [], error: `«${p}» — не целое число.` };
    keys.push(Number(p));
  }
  if (keys.length > 16) return { keys: [], error: 'Не больше 16 ключей.' };
  return { keys };
}

function OpenPanel({ m, keys, mode }: { m: number; keys: number[]; mode: ProbeMode }) {
  const { table, log } = openInsertAll(m, keys, mode);
  const totalProbes = log.reduce((a, r) => a + r.probes.length, 0);
  const failed = log.filter((r) => r.index === -1 && !r.message.includes('уже')).length;
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-sky-300">{mode === 'linear' ? 'Linear Probing' : 'Quadratic Probing'}</span>
        <Badge tone={failed ? 'rose' : 'slate'}>проб: {totalProbes}</Badge>
      </div>
      <div className="flex flex-wrap gap-1">
        {table.map((s, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="flex h-8 w-10 items-center justify-center rounded border border-slate-700 bg-slate-950 font-mono text-xs text-slate-200">
              {slotToString(s) === '_' ? '' : slotToString(s)}
            </div>
            <span className="font-mono text-[10px] text-slate-500">{i}</span>
          </div>
        ))}
      </div>
      <ul className="mt-2 space-y-0.5 font-mono text-[11px] text-slate-400">
        {log.map((r, i) => (
          <li key={i} className={r.probes.length > 1 ? 'text-rose-300' : undefined}>
            {keys[i]}: {r.probes.map((p) => p.index).join(' → ')}
            {r.index === -1 ? ' ✗ не вставлен' : ''}
          </li>
        ))}
      </ul>
      {failed > 0 && <p className="mt-1 text-[11px] text-rose-300">Некоторые ключи не удалось вставить: пробы зациклились или таблица полна.</p>}
    </div>
  );
}

/** Одни и те же ключи тремя методами разрешения коллизий — рядом. */
export function CollisionCompare() {
  const [text, setText] = useState('50, 700, 76, 85, 92, 73, 101');
  const [m, setM] = useState(7);
  const { keys, error } = parse(text);
  const chain = error ? null : chainInsertAll(m, keys);
  const maxChain = chain ? Math.max(...chain.chains.map((c) => c.length)) : 0;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="mb-3 text-sm font-semibold text-slate-100">Сравнение методов Collision Resolution</div>
      <div className="flex flex-wrap gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-indigo-400"
        />
        <label className="flex items-center gap-2 text-xs text-slate-400">
          m =
          <input
            type="number"
            min={2}
            max={17}
            value={m}
            onChange={(e) => setM(Math.max(2, Math.min(17, Number(e.target.value) || 2)))}
            className="w-16 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-sm text-slate-100"
          />
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
      {chain && (
        <>
          <p className="mt-2 font-mono text-xs text-slate-400">
            h(k) = k mod {m}: {keys.map((k) => `${k}→${((k % m) + m) % m}`).join(', ')}
          </p>
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-violet-300">Separate Chaining</span>
                <Badge>макс. цепочка: {maxChain}</Badge>
              </div>
              <div className="space-y-0.5 font-mono text-xs">
                {chain.chains.map((c, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="w-5 text-right text-slate-500">{i}</span>
                    <span className={c.length > 1 ? 'text-rose-300' : 'text-slate-200'}>{c.length ? c.join(' → ') : '∅'}</span>
                  </div>
                ))}
              </div>
            </div>
            <OpenPanel m={m} keys={keys} mode="linear" />
            <OpenPanel m={m} keys={keys} mode="quadratic" />
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Строка «85: 1 → 2» означает: первая проба в slot 1 (занят), вторая — в slot 2. Красные строки — ключи, которые попали в коллизию.
            Попробуйте m = 8 или m = 10 (не простое число) и ключи, кратные m, — увидите, как растут цепочки и кластеры.
          </p>
        </>
      )}
    </div>
  );
}
