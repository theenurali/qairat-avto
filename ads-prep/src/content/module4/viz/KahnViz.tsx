import { useMemo, useState } from 'react';
import { cmpLabel, kahn, type Graph } from '../../../lib/algorithms/graph';
import { GraphLegend, GraphView, type NodeState } from '../../../components/GraphView';
import { StepControls } from '../../../components/ui/primitives';
import { useStepper } from '../../../lib/useStepper';
import { TOPO_PRESETS, type GraphPreset } from './presets';
import { GraphPicker, SeqView } from './GraphPicker';

interface Frame {
  message: string;
  inDegree: Record<string, number>;
  queue: string[];
  order: string[];
  current: string | null;
  edges: string[];
  final?: 'ok' | 'cycle';
}

function buildFrames(g: Graph): Frame[] {
  const res = kahn(g, 'queue');
  const frames: Frame[] = [
    {
      message: `Считаем in-degree (сколько рёбер ВХОДИТ в вершину). Вершины с in-degree = 0 ни от чего не зависят — кладём их в очередь по возрастанию: [${res.initialQueue.join(', ') || 'пусто'}].`,
      inDegree: res.initialInDegree,
      queue: res.initialQueue,
      order: [],
      current: null,
      edges: [],
    },
  ];
  for (const s of res.steps) {
    const dec = s.decremented.map((d) => `${d.v}: ${d.to + 1}→${d.to}`).join(', ');
    const parts = [`dequeue → ${s.removed}, добавляем в ответ.`];
    parts.push(dec ? `«Удаляем» его исходящие рёбра: in-degree ${dec}.` : `Исходящих рёбер нет.`);
    parts.push(s.enqueued.length ? `In-degree стал 0 у ${s.enqueued.join(', ')} → enqueue.` : 'Новых вершин с in-degree 0 нет.');
    frames.push({
      message: parts.join(' '),
      inDegree: s.inDegree,
      queue: s.queue,
      order: s.order,
      current: s.removed,
      edges: s.decremented.map((d) => `${s.removed}|${d.v}`),
    });
  }
  const last = frames[frames.length - 1];
  const rest = g.vertices.filter((v) => !res.order.includes(v)).sort(cmpLabel);
  frames.push({
    ...last,
    current: null,
    edges: [],
    final: res.hasCycle ? 'cycle' : 'ok',
    message: res.hasCycle
      ? `Очередь пуста, но в ответе ${res.order.length} из ${g.vertices.length} вершин. У вершин ${rest.join(', ')} in-degree так и не стал 0 — они лежат на направленном цикле (или зависят от него). Cycle detected → топологической сортировки НЕТ.`
      : `Очередь пуста, в ответе все ${g.vertices.length} вершин → это топологический порядок: ${res.order.join(' → ')}.`,
  });
  return frames;
}

export function KahnViz() {
  const [preset, setPreset] = useState<GraphPreset>(TOPO_PRESETS[0]);
  const frames = useMemo(() => buildFrames(preset.graph), [preset]);
  const st = useStepper(frames.length, 1300);
  const f = frames[Math.min(st.step, frames.length - 1)];

  const nodeState: Record<string, NodeState> = {};
  const badges: Record<string, string> = {};
  for (const v of preset.graph.vertices) {
    if (f.order.includes(v)) nodeState[v] = 'done';
    else if (f.queue.includes(v)) nodeState[v] = 'queued';
    else if (f.final === 'cycle') nodeState[v] = 'error';
    if (!f.order.includes(v)) badges[v] = String(f.inDegree[v] ?? 0);
  }
  if (f.current) nodeState[f.current] = 'current';

  return (
    <div className="space-y-4">
      <GraphPicker
        presets={TOPO_PRESETS}
        activeId={preset.id}
        onPick={(p) => {
          setPreset(p);
          st.reset();
        }}
        forceDirected
      />
      {preset.note && <p className="text-sm text-amber-200/90">💬 {preset.note}</p>}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-2">
          <GraphView graph={preset.graph} positions={preset.positions} nodeState={nodeState} badges={badges} highlightEdges={f.edges} />
          <div className="px-2 pb-1">
            <GraphLegend
              items={[
                { state: 'default', label: 'ждёт (in-degree > 0)' },
                { state: 'queued', label: 'в очереди' },
                { state: 'current', label: 'извлечена' },
                { state: 'done', label: 'в ответе' },
                { state: 'error', label: 'застряла (цикл)' },
              ]}
            />
            <p className="mt-1 text-xs text-slate-500">Жёлтый значок у вершины — её текущий in-degree.</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">In-degree</div>
            <div className="flex flex-wrap gap-1.5">
              {[...preset.graph.vertices].sort(cmpLabel).map((v) => {
                const done = f.order.includes(v);
                return (
                  <span
                    key={v}
                    className={`rounded-md border px-2 py-1 font-mono text-xs ${
                      done ? 'border-emerald-500/40 text-emerald-300/70 line-through' : (f.inDegree[v] ?? 0) === 0 ? 'border-cyan-400/50 text-cyan-200' : 'border-slate-700 text-slate-300'
                    }`}
                  >
                    {v}: {f.inDegree[v] ?? 0}
                  </span>
                );
              })}
            </div>
          </div>
          <SeqView title="Queue (FIFO: слева выходят, справа входят)" items={f.queue} tone="cyan" emptyText="пусто" />
          <SeqView title="Результат (topological order)" items={f.order} tone="emerald" />
        </div>
      </div>
      <div
        className={`min-h-16 rounded-xl border p-3 text-sm leading-relaxed text-slate-200 ${
          f.final === 'cycle' ? 'border-rose-500/50 bg-rose-500/10' : f.final === 'ok' ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-indigo-500/30 bg-indigo-500/5'
        }`}
      >
        {f.message}
      </div>
      <StepControls step={st.step} total={frames.length} onStep={st.setStep} playing={st.playing} onTogglePlay={st.togglePlay} />
    </div>
  );
}
