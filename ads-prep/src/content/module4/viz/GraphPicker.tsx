import { useState } from 'react';
import { parseGraph } from '../../../lib/algorithms/graph';
import { Button } from '../../../components/ui/primitives';
import type { GraphPreset } from './presets';

interface GraphPickerProps {
  presets: GraphPreset[];
  activeId: string;
  onPick: (p: GraphPreset) => void;
  /** null — пользователь выбирает тип графа сам; true/false — фиксированный тип. */
  forceDirected: boolean | null;
}

/** Выбор готового графа или ввод собственного (вершины + рёбра). */
export function GraphPicker({ presets, activeId, onPick, forceDirected }: GraphPickerProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [vText, setVText] = useState('');
  const [eText, setEText] = useState('');
  const [directed, setDirected] = useState(forceDirected ?? false);
  const [error, setError] = useState<string | null>(null);

  const apply = () => {
    const isDirected = forceDirected ?? directed;
    const res = parseGraph(vText, eText, isDirected);
    if (res.error || !res.graph) {
      setError(res.error ?? 'Не удалось построить граф');
      return;
    }
    setError(null);
    onPick({ id: 'custom', name: 'Свой граф', graph: res.graph, start: res.graph.vertices[0] });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <Button key={p.id} size="sm" variant={p.id === activeId ? 'primary' : 'secondary'} onClick={() => onPick(p)}>
            {p.name}
          </Button>
        ))}
        <Button size="sm" variant={activeId === 'custom' || showCustom ? 'primary' : 'ghost'} onClick={() => setShowCustom((s) => !s)}>
          ✎ Свой граф
        </Button>
      </div>
      {showCustom && (
        <div className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3 sm:grid-cols-2">
          <label className="text-xs text-slate-400">
            Вершины (необязательно, через пробел)
            <input
              value={vText}
              onChange={(e) => setVText(e.target.value)}
              placeholder="A B C D"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-indigo-400"
            />
          </label>
          <label className="text-xs text-slate-400">
            Рёбра ({forceDirected ?? directed ? 'A>B — ребро из A в B' : 'A-B'}, через запятую)
            <input
              value={eText}
              onChange={(e) => setEText(e.target.value)}
              placeholder={forceDirected ?? directed ? 'A>B, B>C, A>C' : 'A-B, B-C, A-C'}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-indigo-400"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            {forceDirected === null && (
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={directed} onChange={(e) => setDirected(e.target.checked)} />
                ориентированный (directed)
              </label>
            )}
            <Button size="sm" onClick={apply}>
              Построить
            </Button>
            {error && <span className="text-sm text-rose-300">{error}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

interface StackViewProps {
  title: string;
  items: string[];
  /** Подпись к вершине стека. */
  topLabel?: string;
  emptyText?: string;
  vertical?: boolean;
}

/** Стек: вершина стека сверху (vertical) или справа (horizontal). */
export function StackView({ title, items, topLabel = '← top', emptyText = 'пусто', vertical = true }: StackViewProps) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</div>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-700 px-3 py-2 text-xs text-slate-500">{emptyText}</div>
      ) : vertical ? (
        <div className="flex flex-col gap-1">
          {[...items].reverse().map((it, i) => (
            <div
              key={`${it}-${i}`}
              className={`flex items-center justify-between rounded-lg border px-3 py-1.5 font-mono text-sm ${
                i === 0 ? 'border-amber-400/60 bg-amber-500/10 text-amber-200' : 'border-slate-700 bg-slate-800/60 text-slate-300'
              }`}
            >
              <span>{it}</span>
              {i === 0 && <span className="text-[10px] text-amber-300">{topLabel}</span>}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-1">
          {items.map((it, i) => (
            <span
              key={`${it}-${i}`}
              className={`rounded-md border px-2 py-1 font-mono text-sm ${
                i === items.length - 1 ? 'border-amber-400/60 bg-amber-500/10 text-amber-200' : 'border-slate-700 bg-slate-800/60 text-slate-300'
              }`}
            >
              {it}
            </span>
          ))}
          <span className="text-[10px] text-amber-300">{topLabel}</span>
        </div>
      )}
    </div>
  );
}

interface SeqViewProps {
  title: string;
  items: string[];
  tone?: 'indigo' | 'emerald' | 'cyan';
  emptyText?: string;
}

export function SeqView({ title, items, tone = 'indigo', emptyText = '—' }: SeqViewProps) {
  const cls = {
    indigo: 'border-indigo-400/50 bg-indigo-500/10 text-indigo-200',
    emerald: 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200',
    cyan: 'border-cyan-400/50 bg-cyan-500/10 text-cyan-200',
  }[tone];
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</div>
      <div className="flex min-h-8 flex-wrap items-center gap-1">
        {items.length === 0 && <span className="text-sm text-slate-500">{emptyText}</span>}
        {items.map((it, i) => (
          <span key={`${it}-${i}`} className={`rounded-md border px-2 py-0.5 font-mono text-sm ${cls}`}>
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}
