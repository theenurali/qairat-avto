import { useMemo, useState } from 'react';
import { adjacencyList, bfs, parseGraph, reconstructPath, type Graph } from '../../../lib/algorithms/graph';
import { GraphLegend, GraphView, type NodeState } from '../../../components/GraphView';
import { Badge, Button, Card, StepControls } from '../../../components/ui/primitives';
import { useStepper } from '../../../lib/useStepper';
import { PRESETS } from './presets';

interface Frame {
  title: string;
  text: string;
  current: string | null;
  queue: string[];
  visited: string[];
  processed: string[];
}

const LEGEND: { state: NodeState; label: string }[] = [
  { state: 'default', label: 'не обнаружена' },
  { state: 'queued', label: 'в очереди (уже visited)' },
  { state: 'current', label: 'текущая (popleft)' },
  { state: 'done', label: 'обработана' },
  { state: 'path', label: 'кратчайший путь' },
];

function buildFrames(g: Graph, start: string): Frame[] {
  const res = bfs(g, start);
  const frames: Frame[] = [
    {
      title: 'Инициализация',
      text: `visited = {${start}}, dist[${start}] = 0, parent[${start}] = None, queue = deque([${start}]). Стартовая вершина помечается visited сразу, когда попадает в очередь.`,
      current: null,
      queue: [start],
      visited: [start],
      processed: [],
    },
  ];
  res.steps.forEach((s, k) => {
    const disc = s.discovered.length
      ? `Новые соседи: ${s.discovered.join(', ')} → помечаем visited, dist = ${res.dist.get(s.current)! + 1}, parent = ${s.current}, добавляем в конец очереди.`
      : 'Новых соседей нет.';
    const skip = s.skipped.length ? ` Пропускаем (уже visited): ${s.skipped.join(', ')}.` : '';
    frames.push({
      title: `Шаг ${k + 1}: popleft() → ${s.current}`,
      text: `Достаём ${s.current} из начала очереди (dist = ${res.dist.get(s.current)}). ${disc}${skip}`,
      current: s.current,
      queue: s.queue,
      visited: s.visited,
      processed: res.order.slice(0, k + 1),
    });
  });
  frames.push({
    title: 'Очередь пуста — BFS завершён',
    text: `Порядок обхода: ${res.order.join(' → ')}. ${
      res.order.length < g.vertices.length
        ? `Недостижимы из ${start}: ${g.vertices.filter((v) => !res.dist.has(v)).join(', ')} (dist = ∞).`
        : 'Все вершины достижимы.'
    }`,
    current: null,
    queue: [],
    visited: res.order,
    processed: res.order,
  });
  return frames;
}

export function BfsViz() {
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [graph, setGraph] = useState<Graph>(PRESETS[0].graph);
  const [positions, setPositions] = useState(PRESETS[0].positions);
  const [start, setStart] = useState(PRESETS[0].start);
  const [target, setTarget] = useState('');
  const [custom, setCustom] = useState({ vertices: 'A B C D E', edges: 'A-B, A-C, B-D, C-D, D-E', directed: false });
  const [error, setError] = useState<string | null>(null);

  const frames = useMemo(() => buildFrames(graph, start), [graph, start]);
  const result = useMemo(() => bfs(graph, start), [graph, start]);
  const adj = useMemo(() => adjacencyList(graph), [graph]);
  const { step, setStep, playing, togglePlay, reset } = useStepper(frames.length, 1100);
  const f = frames[Math.min(step, frames.length - 1)];
  const finished = step === frames.length - 1;

  const choosePreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    setPresetId(id);
    setGraph(p.graph);
    setPositions(p.positions);
    setStart(p.start);
    setTarget('');
    setError(null);
    reset();
  };

  const buildCustom = () => {
    const r = parseGraph(custom.vertices, custom.edges, custom.directed);
    if (r.error || !r.graph) {
      setError(r.error ?? 'Ошибка разбора графа');
      return;
    }
    setError(null);
    setPresetId('custom');
    setGraph(r.graph);
    setPositions(undefined);
    setStart(r.graph.vertices[0]);
    setTarget('');
    reset();
  };

  const path = finished && target ? reconstructPath(result.parent, target) : [];
  const pathSet = new Set(path);

  const nodeState: Record<string, NodeState> = {};
  for (const v of graph.vertices) {
    if (pathSet.has(v)) nodeState[v] = 'path';
    else if (v === f.current) nodeState[v] = 'current';
    else if (f.processed.includes(v)) nodeState[v] = 'done';
    else if (f.visited.includes(v)) nodeState[v] = 'queued';
  }

  const badges: Record<string, string> = {};
  for (const v of f.visited) badges[v] = `d=${result.dist.get(v)}`;

  const treeEdges = path.length
    ? path.slice(1).map((v, i) => `${path[i]}|${v}`)
    : f.visited.filter((v) => result.parent.get(v)).map((v) => `${result.parent.get(v)}|${v}`);

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={presetId}
          onChange={(e) => choosePreset(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
          aria-label="Граф"
        >
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
          {presetId === 'custom' && <option value="custom">Свой граф</option>}
        </select>
        <label className="flex items-center gap-1 text-sm text-slate-300">
          start:
          <select
            value={start}
            onChange={(e) => {
              setStart(e.target.value);
              setTarget('');
              reset();
            }}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 font-mono text-sm text-slate-100"
          >
            {graph.vertices.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <Badge tone="emerald">{graph.directed ? 'Directed' : 'Undirected'}</Badge>
      </div>

      <details className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-sm">
        <summary className="cursor-pointer text-slate-300">✏️ Ввести свой граф</summary>
        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_2fr_auto_auto] md:items-end">
          <label className="text-xs text-slate-400">
            Вершины (через пробел)
            <input
              value={custom.vertices}
              onChange={(e) => setCustom({ ...custom, vertices: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400">
            Рёбра (A-B, B-C … или A-&gt;B для ориентированного)
            <input
              value={custom.edges}
              onChange={(e) => setCustom({ ...custom, edges: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-sm text-slate-100"
            />
          </label>
          <label className="flex items-center gap-1 text-xs text-slate-300">
            <input type="checkbox" checked={custom.directed} onChange={(e) => setCustom({ ...custom, directed: e.target.checked })} />
            directed
          </label>
          <Button size="sm" onClick={buildCustom}>
            Построить
          </Button>
        </div>
        {error && <div className="mt-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-rose-200">{error}</div>}
      </details>

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-2">
          <GraphView graph={graph} positions={positions} nodeState={nodeState} badges={badges} highlightEdges={treeEdges} height={300} />
          <div className="px-2 pb-1">
            <GraphLegend items={LEGEND} />
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
            <div className="text-sm font-semibold text-amber-300">{f.title}</div>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">{f.text}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Queue (FIFO)</div>
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              <span className="shrink-0 text-[10px] uppercase text-slate-500">front →</span>
              {f.queue.length === 0 ? (
                <span className="px-2 font-mono text-sm text-slate-600">пусто</span>
              ) : (
                f.queue.map((v, i) => (
                  <span key={`${v}-${i}`} className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-md border border-cyan-400/60 bg-cyan-500/15 px-2 font-mono text-sm text-cyan-100">
                    {v}
                  </span>
                ))
              )}
              <span className="shrink-0 text-[10px] uppercase text-slate-500">← back</span>
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 font-mono text-xs text-slate-300">
            <div>
              <span className="text-slate-500">visited = </span>
              {'{'}
              {f.visited.join(', ')}
              {'}'}
            </div>
            <div className="mt-1">
              <span className="text-slate-500">order = </span>[{f.processed.join(', ')}]
            </div>
            {f.current && (
              <div className="mt-1">
                <span className="text-slate-500">adj[{f.current}] = </span>[{(adj.get(f.current) ?? []).join(', ')}]
              </div>
            )}
          </div>
        </div>
      </div>

      <StepControls step={step} total={frames.length} onStep={setStep} playing={playing} onTogglePlay={togglePlay} />

      {finished && (
        <div className="rounded-xl border border-pink-500/30 bg-pink-500/5 p-3 text-sm">
          <label className="flex flex-wrap items-center gap-2 text-slate-200">
            Кратчайший путь из <span className="font-mono text-pink-300">{start}</span> до:
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 font-mono text-sm text-slate-100"
            >
              <option value="">—</option>
              {graph.vertices.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          {target && (
            <p className="mt-2 text-slate-300">
              {path.length === 0 ? (
                <>
                  Вершина <b>{target}</b> недостижима из {start}: BFS её не обнаружил, parent[{target}] не существует, dist = ∞.
                </>
              ) : (
                <>
                  Идём по parent от {target} назад к {start} и разворачиваем:{' '}
                  <span className="font-mono text-pink-200">{path.join(' → ')}</span> — {path.length - 1} рёбер (dist[{target}] = {result.dist.get(target)}).
                </>
              )}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
