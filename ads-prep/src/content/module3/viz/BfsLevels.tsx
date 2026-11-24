import { useMemo, useState } from 'react';
import { bfs } from '../../../lib/algorithms/graph';
import { Card } from '../../../components/ui/primitives';
import { PRESETS } from './presets';

const LEVEL_COLORS = ['#f59e0b', '#22d3ee', '#818cf8', '#34d399', '#f472b6', '#a3e635', '#fb7185'];

/** Схема «волн»: вершины BFS, сгруппированные по уровню (dist). */
export function BfsLevels() {
  const [presetId, setPresetId] = useState('grid');
  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
  const [start, setStart] = useState(preset.start);
  const safeStart = preset.graph.vertices.includes(start) ? start : preset.start;

  const levels = useMemo(() => {
    const r = bfs(preset.graph, safeStart);
    const byLevel: string[][] = [];
    for (const v of r.order) {
      const d = r.dist.get(v)!;
      byLevel[d] = [...(byLevel[d] ?? []), v];
    }
    const unreachable = preset.graph.vertices.filter((v) => !r.dist.has(v));
    return { byLevel, unreachable, parent: r.parent };
  }, [preset, safeStart]);

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
        <select
          value={presetId}
          onChange={(e) => {
            const p = PRESETS.find((x) => x.id === e.target.value);
            setPresetId(e.target.value);
            if (p) setStart(p.start);
          }}
          className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
          aria-label="Граф"
        >
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        start:
        <select
          value={safeStart}
          onChange={(e) => setStart(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 font-mono text-sm text-slate-100"
        >
          {preset.graph.vertices.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {levels.byLevel.map((vs, d) => (
          <div key={d} className="min-w-28 shrink-0 rounded-xl border p-3" style={{ borderColor: `${LEVEL_COLORS[d % LEVEL_COLORS.length]}66` }}>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: LEVEL_COLORS[d % LEVEL_COLORS.length] }}>
              Уровень {d}
            </div>
            <div className="text-[11px] text-slate-500">{d === 0 ? 'старт' : `${d} ${d === 1 ? 'ребро' : d < 5 ? 'ребра' : 'рёбер'} от старта`}</div>
            <div className="mt-2 flex flex-col gap-1.5">
              {vs.map((v) => (
                <div key={v} className="rounded-md bg-slate-800 px-2 py-1 font-mono text-sm text-slate-100">
                  {v}
                  {levels.parent.get(v) && <span className="ml-1 text-[11px] text-slate-500">← {levels.parent.get(v)}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
        {levels.unreachable.length > 0 && (
          <div className="min-w-28 shrink-0 rounded-xl border border-dashed border-slate-700 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Недостижимы (∞)</div>
            <div className="flex flex-col gap-1.5">
              {levels.unreachable.map((v) => (
                <div key={v} className="rounded-md bg-slate-900 px-2 py-1 font-mono text-sm text-slate-500">
                  {v}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <p className="text-sm text-slate-400">
        BFS обрабатывает вершины строго по уровням: сначала все вершины уровня d, потом все вершины уровня d + 1. Подпись «← X» — это parent: из какой вершины
        BFS впервые пришёл в эту. Номер уровня = длина кратчайшего пути в рёбрах.
      </p>
    </Card>
  );
}
