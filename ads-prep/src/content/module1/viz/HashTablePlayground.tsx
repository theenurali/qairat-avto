import { useEffect, useState } from 'react';
import {
  DELETED,
  EMPTY,
  chainDelete,
  chainInsert,
  chainSearch,
  hashInt,
  makeChains,
  openDelete,
  openInsert,
  openSearch,
  type Chains,
  type ProbeMode,
  type ProbeStep,
  type Slot,
} from '../../../lib/algorithms/hashing';
import { Badge, Button } from '../../../components/ui/primitives';

type Method = 'chaining' | ProbeMode;
type Op = 'insert' | 'search' | 'delete';

interface LogEntry {
  id: number;
  text: string;
  tone: 'ok' | 'warn' | 'info';
}

type Anim =
  | { kind: 'open'; op: Op; key: number; probes: ProbeStep[]; after: Slot[]; ok: boolean; message: string }
  | { kind: 'chain'; op: Op; key: number; bucket: number; compared: number; after: Chains; ok: boolean; message: string };

interface Job {
  op: Op;
  key: number;
}

const METHOD_NAMES: Record<Method, string> = {
  chaining: 'Separate Chaining',
  linear: 'Linear Probing',
  quadratic: 'Quadratic Probing',
};

const EXAMPLE_KEYS = [50, 700, 76, 85, 92, 73];
const OP_NAMES: Record<Op, string> = { insert: 'INSERT', search: 'SEARCH', delete: 'DELETE' };
const ACTION_TEXT: Record<ProbeStep['action'], string> = {
  occupied: 'занято другим ключом → дальше',
  placed: 'свободно → кладём сюда',
  found: 'нашли ключ!',
  'skip-deleted': 'DEL (tombstone) → пропускаем, ищем дальше',
  'empty-stop': 'EMPTY → останавливаемся, ключа нет',
  duplicate: 'такой ключ уже есть',
};
const ACTION_CLS: Record<ProbeStep['action'], string> = {
  occupied: 'border-rose-400 bg-rose-500/25 text-rose-50',
  placed: 'border-emerald-400 bg-emerald-500/25 text-emerald-50',
  found: 'border-emerald-400 bg-emerald-500/25 text-emerald-50',
  'skip-deleted': 'border-amber-400 bg-amber-500/25 text-amber-50',
  'empty-stop': 'border-sky-400 bg-sky-500/25 text-sky-50',
  duplicate: 'border-amber-400 bg-amber-500/25 text-amber-50',
};

function parseKeys(text: string): { keys: number[]; error?: string } {
  const parts = text.split(/[\s,;]+/).filter(Boolean);
  if (parts.length === 0) return { keys: [], error: 'Введите хотя бы один целый ключ (например: 15 или 15, 22, 8).' };
  const keys: number[] = [];
  for (const p of parts) {
    if (!/^-?\d{1,9}$/.test(p)) return { keys: [], error: `«${p}» — не целое число (до 9 цифр).` };
    keys.push(Number(p));
  }
  if (keys.length > 20) return { keys: [], error: 'За один раз — не больше 20 ключей.' };
  return { keys };
}

function emptyTable(m: number): Slot[] {
  return Array.from({ length: m }, () => EMPTY);
}

export function HashTablePlayground() {
  const [method, setMethod] = useState<Method>('linear');
  const [m, setM] = useState(7);
  const [slots, setSlots] = useState<Slot[]>(() => emptyTable(7));
  const [chains, setChains] = useState<Chains>(() => makeChains(7));
  const [input, setInput] = useState('50, 700, 76, 85');
  const [error, setError] = useState('');
  const [queue, setQueue] = useState<Job[]>([]);
  const [anim, setAnim] = useState<Anim | null>(null);
  const [animStep, setAnimStep] = useState(0);
  const [instant, setInstant] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [collisions, setCollisions] = useState(0);
  const [logId, setLogId] = useState(1);

  const n = method === 'chaining' ? chains.reduce((a, c) => a + c.length, 0) : slots.filter((s) => s !== EMPTY && s !== DELETED).length;
  const busy = anim !== null || queue.length > 0;

  const resetAll = (newM: number) => {
    setSlots(emptyTable(newM));
    setChains(makeChains(newM));
    setQueue([]);
    setAnim(null);
    setAnimStep(0);
    setCollisions(0);
    setLog([]);
    setError('');
  };

  const addLog = (text: string, tone: LogEntry['tone']) => {
    setLog((l) => [{ id: logId, text, tone }, ...l].slice(0, 14));
    setLogId((x) => x + 1);
  };

  const start = (job: Job) => {
    const { op, key } = job;
    if (method === 'chaining') {
      const fn = op === 'insert' ? chainInsert : op === 'search' ? chainSearch : chainDelete;
      const r = fn(chains, key);
      if (op === 'insert' && r.ok && chains[r.bucket].length > 0) setCollisions((c) => c + 1);
      setAnim({ kind: 'chain', op, key, bucket: r.bucket, compared: r.compared, after: r.chains, ok: r.ok, message: r.message });
    } else {
      const fn = op === 'insert' ? openInsert : op === 'search' ? openSearch : openDelete;
      const r = fn(slots, key, method);
      if (op === 'insert' && r.probes[0]?.action === 'occupied') setCollisions((c) => c + 1);
      setAnim({ kind: 'open', op, key, probes: r.probes, after: r.table, ok: r.ok, message: r.message });
    }
    setAnimStep(0);
  };

  // берём следующую операцию из очереди, когда анимация закончилась
  useEffect(() => {
    if (anim || queue.length === 0) return;
    const [next, ...rest] = queue;
    setQueue(rest);
    start(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anim, queue]);

  // шаги анимации
  useEffect(() => {
    if (!anim) return;
    const total = anim.kind === 'open' ? anim.probes.length : anim.compared + 1;
    if (animStep >= total) {
      if (anim.kind === 'open') {
        setSlots(anim.after);
        const path = anim.probes.map((p) => p.index).join(' → ');
        addLog(`${OP_NAMES[anim.op]} ${anim.key}: пробы ${path}. ${anim.message}`, anim.ok ? 'ok' : 'warn');
      } else {
        setChains(anim.after);
        addLog(`${OP_NAMES[anim.op]} ${anim.key}: bucket ${anim.bucket}, сравнений ${anim.compared}. ${anim.message}`, anim.ok ? 'ok' : 'warn');
      }
      setAnim(null);
      setAnimStep(0);
      return;
    }
    const t = setTimeout(() => setAnimStep((s) => s + 1), instant ? 0 : 750);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anim, animStep, instant]);

  const run = (op: Op) => {
    const { keys, error: err } = parseKeys(input);
    if (err) {
      setError(err);
      return;
    }
    if (op !== 'insert' && keys.length > 1) {
      setError('Search и Delete — по одному ключу за раз.');
      return;
    }
    setError('');
    setQueue((q) => [...q, ...keys.map((key) => ({ op, key }))]);
  };

  const loadExample = () => {
    resetAll(7);
    setM(7);
    setQueue(EXAMPLE_KEYS.map((key) => ({ op: 'insert' as const, key })));
    setInput('85');
  };

  const changeMethod = (mt: Method) => {
    setMethod(mt);
    resetAll(m);
  };

  const changeM = (v: number) => {
    const nm = Math.max(3, Math.min(17, v || 3));
    setM(nm);
    resetAll(nm);
  };

  /* ------------------------- current probe info ------------------------- */
  let probeInfo: string | null = null;
  let probeIdx = -1;
  let probeCls = '';
  if (anim && anim.kind === 'open' && animStep < anim.probes.length) {
    const p = anim.probes[animStep];
    const h = hashInt(anim.key, m);
    const formula = method === 'linear' ? `(${h} + ${p.attempt}) mod ${m}` : `(${h} + ${p.attempt}²) mod ${m}`;
    probeInfo = `${OP_NAMES[anim.op]} ${anim.key}: h(${anim.key}) = ${anim.key} mod ${m} = ${h}; i = ${p.attempt}: ${formula} = ${p.index} — ${ACTION_TEXT[p.action]}`;
    probeIdx = p.index;
    probeCls = ACTION_CLS[p.action];
  }
  let chainBucket = -1;
  let chainPos = -1;
  if (anim && anim.kind === 'chain') {
    chainBucket = anim.bucket;
    chainPos = animStep - 1;
    probeInfo =
      animStep === 0
        ? `${OP_NAMES[anim.op]} ${anim.key}: h(${anim.key}) = ${anim.key} mod ${m} = ${anim.bucket} → идём в bucket ${anim.bucket}`
        : `${OP_NAMES[anim.op]} ${anim.key}: сравниваем с элементом №${animStep} цепочки`;
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-100">Hash Table Playground</span>
        <Badge tone="indigo">{METHOD_NAMES[method]}</Badge>
      </div>

      {/* method + m */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(METHOD_NAMES) as Method[]).map((mt) => (
          <Button key={mt} size="sm" variant={method === mt ? 'primary' : 'secondary'} onClick={() => changeMethod(mt)} disabled={busy}>
            {METHOD_NAMES[mt]}
          </Button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-xs text-slate-400">
          m =
          <input
            type="number"
            min={3}
            max={17}
            value={m}
            disabled={busy}
            onChange={(e) => changeM(Number(e.target.value))}
            className="w-16 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-sm text-slate-100"
          />
        </label>
      </div>

      {/* input + ops */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !busy) run('insert');
          }}
          placeholder="ключи через запятую"
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-indigo-400"
        />
        <Button size="sm" variant="success" onClick={() => run('insert')} disabled={busy}>
          Insert
        </Button>
        <Button size="sm" variant="secondary" onClick={() => run('search')} disabled={busy}>
          Search
        </Button>
        <Button size="sm" variant="danger" onClick={() => run('delete')} disabled={busy}>
          Delete
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="ghost" onClick={loadExample} disabled={busy}>
          📥 Пример: 50, 700, 76, 85, 92, 73 (m=7)
        </Button>
        <Button size="sm" variant="ghost" onClick={() => resetAll(m)}>
          ↺ Очистить
        </Button>
        <label className="flex items-center gap-1.5 text-xs text-slate-400">
          <input type="checkbox" checked={instant} onChange={(e) => setInstant(e.target.checked)} /> без анимации
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}

      {/* probe info */}
      <div className="mt-3 min-h-12 rounded-lg bg-slate-900 p-3 font-mono text-xs leading-5 text-slate-200">
        {probeInfo ?? <span className="text-slate-500">Введите ключ и нажмите Insert / Search / Delete — шаги появятся здесь.</span>}
      </div>

      {/* table */}
      <div className="mt-4 overflow-x-auto">
        {method === 'chaining' ? (
          <div className="space-y-1">
            {chains.map((chain, b) => (
              <div key={b} className="flex items-center gap-1">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded border font-mono text-xs ${
                    b === chainBucket ? 'border-amber-400 bg-amber-500/20 text-amber-100' : 'border-slate-700 bg-slate-900 text-slate-400'
                  }`}
                >
                  {b}
                </div>
                {chain.length === 0 && <span className="pl-1 font-mono text-xs text-slate-600">∅</span>}
                {chain.map((k, i) => (
                  <span key={`${k}-${i}`} className="flex items-center gap-1">
                    <span className="text-slate-600">→</span>
                    <span
                      className={`rounded border px-2 py-1 font-mono text-xs transition-all ${
                        b === chainBucket && i === chainPos ? 'border-amber-400 bg-amber-500/25 text-amber-50' : 'border-violet-400/50 bg-violet-500/10 text-violet-100'
                      }`}
                    >
                      {k}
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-1">
            {slots.map((s, i) => {
              const base =
                s === DELETED
                  ? 'border-amber-600/60 bg-[repeating-linear-gradient(45deg,#451a03,#451a03_4px,#78350f_4px,#78350f_8px)] text-amber-200'
                  : s === EMPTY
                    ? 'border-slate-700 bg-slate-900 text-slate-600'
                    : 'border-sky-400/50 bg-sky-500/10 text-sky-100';
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className={`flex h-11 w-12 items-center justify-center rounded-md border font-mono text-xs transition-all duration-300 ${
                      i === probeIdx ? `scale-110 ${probeCls}` : base
                    }`}
                  >
                    {s === EMPTY ? '' : s === DELETED ? 'DEL' : s}
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">{i}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* stats */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
        {[
          ['n (ключей)', String(n)],
          ['m (размер)', String(m)],
          ['α = n/m', (n / m).toFixed(2)],
          ['коллизий при вставке', String(collisions)],
        ].map(([label, v]) => (
          <div key={label} className="rounded-lg border border-slate-800 bg-slate-900/60 p-2">
            <div className="font-mono text-lg text-slate-100">{v}</div>
            <div className="text-[11px] text-slate-500">{label}</div>
          </div>
        ))}
      </div>
      {method !== 'chaining' && n / m > 0.7 && (
        <p className="mt-2 text-xs text-amber-300">α &gt; 0.7 — в реальной реализации здесь пора делать rehashing (увеличить m примерно вдвое и перевставить все ключи).</p>
      )}

      {/* log */}
      <div className="mt-4">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Журнал операций</div>
        <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
          {log.length === 0 && <li className="text-slate-600">пока пусто</li>}
          {log.map((e) => (
            <li key={e.id} className={e.tone === 'ok' ? 'text-emerald-300' : e.tone === 'warn' ? 'text-amber-300' : 'text-slate-300'}>
              {e.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
