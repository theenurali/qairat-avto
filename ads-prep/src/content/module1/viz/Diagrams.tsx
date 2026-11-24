/** Статические схемы для Module 1 (без пропсов, регистрируются в module1.visualizers). */

const CELL = 'flex h-10 w-12 items-center justify-center rounded-md border font-mono text-sm';

/** key → hash function → index → массив. */
export function HashSchemeDiagram() {
  const slots = ['', '22', '', '10', '', '', ''];
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex flex-col items-center gap-3 md:flex-row md:justify-center">
        <div className="rounded-lg border border-sky-500/50 bg-sky-500/10 px-4 py-2 text-center">
          <div className="text-[11px] uppercase tracking-wider text-sky-300">key (ключ)</div>
          <div className="font-mono text-lg text-slate-100">10</div>
        </div>
        <span className="rotate-90 text-2xl text-slate-500 md:rotate-0">→</span>
        <div className="rounded-lg border border-violet-500/50 bg-violet-500/10 px-4 py-2 text-center">
          <div className="text-[11px] uppercase tracking-wider text-violet-300">hash function</div>
          <div className="font-mono text-sm text-slate-100">h(k) = k mod 7</div>
          <div className="font-mono text-xs text-slate-400">10 mod 7 = 3</div>
        </div>
        <span className="rotate-90 text-2xl text-slate-500 md:rotate-0">→</span>
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-center">
          <div className="text-[11px] uppercase tracking-wider text-amber-300">index (индекс)</div>
          <div className="font-mono text-lg text-slate-100">3</div>
        </div>
        <span className="rotate-90 text-2xl text-slate-500 md:rotate-0">→</span>
        <div>
          <div className="flex gap-1">
            {slots.map((v, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`${CELL} ${i === 3 ? 'border-amber-400 bg-amber-500/20 text-amber-100' : 'border-slate-700 bg-slate-900 text-slate-300'}`}>{v}</div>
                <span className="font-mono text-[10px] text-slate-500">{i}</span>
              </div>
            ))}
          </div>
          <div className="mt-1 text-center text-[11px] text-slate-500">массив (table) размера m = 7</div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-slate-400">
        Вместо поиска по всему массиву мы <b className="text-slate-200">вычисляем</b> адрес ключа — поэтому поиск занимает в среднем O(1).
      </p>
    </div>
  );
}

function Chain({ idx, items }: { idx: number; items: string[] }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex h-8 w-8 items-center justify-center rounded border border-slate-700 bg-slate-900 font-mono text-xs text-slate-400">{idx}</div>
      {items.length === 0 ? (
        <span className="pl-1 font-mono text-xs text-slate-600">∅</span>
      ) : (
        items.map((x, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="text-slate-600">→</span>
            <span className={`rounded border px-2 py-1 font-mono text-xs ${items.length > 1 ? 'border-rose-400/60 bg-rose-500/10 text-rose-100' : 'border-violet-400/60 bg-violet-500/10 text-violet-100'}`}>
              {x}
            </span>
          </span>
        ))
      )}
    </div>
  );
}

/** Сравнение Separate Chaining и Open Addressing (linear probing) на одних и тех же ключах. */
export function ChainVsOpenDiagram() {
  // keys 10, 22, 31, 4, 15 ; m = 7
  const chains: string[][] = [[], ['22', '15'], [], ['10', '31'], ['4'], [], []];
  const open = ['', '22', '15', '10', '31', '4', ''];
  return (
    <div className="grid gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 md:grid-cols-2">
      <div>
        <div className="mb-2 text-sm font-semibold text-violet-300">Separate Chaining (цепочки)</div>
        <div className="space-y-1">
          {chains.map((c, i) => (
            <Chain key={i} idx={i} items={c} />
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">Коллизии живут в одной цепочке (списке). Ключ всегда лежит в своём bucket h(k).</p>
      </div>
      <div>
        <div className="mb-2 text-sm font-semibold text-sky-300">Open Addressing — Linear Probing</div>
        <div className="flex flex-wrap gap-1">
          {open.map((v, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`${CELL} ${v === '15' || v === '31' || v === '4' ? 'border-rose-400/60 bg-rose-500/10 text-rose-100' : v ? 'border-sky-400/60 bg-sky-500/10 text-sky-100' : 'border-slate-700 bg-slate-900'}`}>{v}</div>
              <span className="font-mono text-[10px] text-slate-500">{i}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Все ключи лежат прямо в массиве. 31 хотел в 3 (занято) → 4. 4 хотел в 4 (занято) → 5. 15 хотел в 1 (занято) → 2. Красным — ключи не на «своём» месте.
        </p>
      </div>
      <p className="text-xs text-slate-500 md:col-span-2">Ключи: 10, 22, 31, 4, 15 · m = 7 · h(k) = k mod 7 → 3, 1, 3, 4, 1</p>
    </div>
  );
}

/** Скользящее окно Rabin-Karp: что уходит и что приходит при сдвиге. */
export function RkWindowDiagram() {
  const text = '3826154'.split('');
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="space-y-3">
        {[0, 1].map((s) => (
          <div key={s} className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="w-16 shrink-0 font-mono text-xs text-slate-500">s = {s}</span>
            <div className="flex gap-1">
              {text.map((c, i) => {
                const inWin = i >= s && i < s + 2;
                const leaving = s === 1 && i === 0;
                const entering = s === 1 && i === 2;
                const cls = leaving
                  ? 'border-rose-400 bg-rose-500/20 text-rose-100 line-through'
                  : entering
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100'
                    : inWin
                      ? 'border-violet-400 bg-violet-500/20 text-violet-100'
                      : 'border-slate-700 bg-slate-900 text-slate-400';
                return (
                  <div key={i} className={`flex h-9 w-9 items-center justify-center rounded border font-mono ${cls}`}>
                    {c}
                  </div>
                );
              })}
            </div>
            <span className="font-mono text-xs text-slate-300">{s === 0 ? 'окно "38" → 38 mod 11 = 5' : 'окно "82" → 82 mod 11 = 5'}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg bg-slate-900 p-3 font-mono text-xs leading-6 text-slate-300">
        t₁ = (d · (t₀ − v(<span className="text-rose-300">'3'</span>) · h) + v(<span className="text-emerald-300">'2'</span>)) mod q
        <br />= (10 · (5 − 3·10) + 2) mod 11 = (−248) mod 11 = <b className="text-amber-300">5</b>
        <br />
        <span className="text-slate-500">d = 10, q = 11, m = 2, h = d^(m−1) mod q = 10</span>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        <span className="text-rose-300">Красный</span> символ уходит из окна, <span className="text-emerald-300">зелёный</span> приходит. Хеш пересчитывается за O(1), а не за O(m).
      </p>
    </div>
  );
}
