import { useMemo, useState } from 'react';
import { adjacencyList, dfsRecursive, type Graph } from '../../../lib/algorithms/graph';
import { GraphLegend, GraphView, type NodeState } from '../../../components/GraphView';
import { Button, StepControls } from '../../../components/ui/primitives';
import { useStepper } from '../../../lib/useStepper';
import { DFS_PRESETS, type GraphPreset } from './presets';
import { GraphPicker, SeqView, StackView } from './GraphPicker';

type Mode = 'recursive' | 'iterative';

interface Frame {
  message: string;
  stack: string[];
  current: string | null;
  visited: string[];
  finished: string[];
  treeEdges: string[];
  order: string[];
  finishOrder: string[];
}

function recursiveFrames(g: Graph, start: string): Frame[] {
  const res = dfsRecursive(g, start);
  const frames: Frame[] = [
    {
      message: `Старт: вызываем dfs(${start}). Пока ничего не посещено, call stack пуст.`,
      stack: [],
      current: null,
      visited: [],
      finished: [],
      treeEdges: [],
      order: [],
      finishOrder: [],
    },
  ];
  const finished: string[] = [];
  const order: string[] = [];
  const tree: string[] = [];
  for (const s of res.steps) {
    let message: string;
    if (s.type === 'enter') {
      order.push(s.vertex);
      if (s.from) tree.push(`${s.from}|${s.vertex}`);
      message = s.from
        ? `dfs(${s.from}) нашла непосещённого соседа ${s.vertex} → рекурсивный вызов dfs(${s.vertex}). Помечаем ${s.vertex} visited (preorder: ${s.vertex}).`
        : `Вызов dfs(${s.vertex}): помечаем ${s.vertex} visited и кладём кадр в call stack.`;
    } else if (s.type === 'skip') {
      message = `В dfs(${s.from}) сосед ${s.vertex} уже visited → пропускаем (иначе зациклились бы).`;
    } else {
      finished.push(s.vertex);
      message = `У ${s.vertex} больше нет непосещённых соседей → return. Кадр dfs(${s.vertex}) снимается со стека (postorder: ${s.vertex}).`;
    }
    frames.push({
      message,
      stack: s.stack,
      current: s.stack[s.stack.length - 1] ?? null,
      visited: s.visited,
      finished: [...finished],
      treeEdges: [...tree],
      order: [...order],
      finishOrder: [...finished],
    });
  }
  frames.push({ ...frames[frames.length - 1], current: null, message: `Готово. Порядок посещения: ${order.join(' → ')}.` });
  return frames;
}

function iterativeFrames(g: Graph, start: string, reversePush: boolean): Frame[] {
  const adj = adjacencyList(g);
  const visited = new Set<string>();
  const order: string[] = [];
  const tree: string[] = [];
  const stack: { v: string; parent: string | null }[] = [{ v: start, parent: null }];
  const label = (it: { v: string; parent: string | null }) => (it.parent ? `${it.v}  (из ${it.parent})` : it.v);
  const snapshot = (message: string, current: string | null): Frame => ({
    message,
    stack: stack.map(label),
    current,
    visited: [...visited],
    finished: [],
    treeEdges: [...tree],
    order: [...order],
    finishOrder: [],
  });
  const frames: Frame[] = [snapshot(`Кладём стартовую вершину ${start} в stack.`, null)];
  let guard = 0;
  while (stack.length > 0 && guard++ < 500) {
    const { v, parent } = stack.pop()!;
    if (visited.has(v)) {
      frames.push(snapshot(`pop → ${v}. Она уже visited (попала в стек дважды) → пропускаем.`, v));
      continue;
    }
    visited.add(v);
    order.push(v);
    if (parent) tree.push(`${parent}|${v}`);
    const nbrs = (adj.get(v) ?? []).filter((x) => !visited.has(x));
    const pushOrder = reversePush ? [...nbrs].reverse() : nbrs;
    for (const x of pushOrder) stack.push({ v: x, parent: v });
    const pushed = pushOrder.length
      ? `Кладём непосещённых соседей ${reversePush ? 'в ОБРАТНОМ порядке' : 'в прямом порядке'}: ${pushOrder.join(', ')} → сверху окажется ${pushOrder[pushOrder.length - 1]}.`
      : 'Непосещённых соседей нет — ничего не кладём.';
    frames.push(snapshot(`pop → ${v}. Не visited → помечаем visited (порядок: ${order.join(', ')}). ${pushed}`, v));
  }
  frames.push({ ...snapshot(`Стек пуст — обход завершён. Порядок посещения: ${order.join(' → ')}.`, null) });
  return frames;
}

export function DfsViz() {
  const [preset, setPreset] = useState<GraphPreset>(DFS_PRESETS[0]);
  const [start, setStart] = useState(DFS_PRESETS[0].start ?? DFS_PRESETS[0].graph.vertices[0]);
  const [mode, setMode] = useState<Mode>('recursive');
  const [reversePush, setReversePush] = useState(true);

  const frames = useMemo(
    () => (mode === 'recursive' ? recursiveFrames(preset.graph, start) : iterativeFrames(preset.graph, start, reversePush)),
    [preset, start, mode, reversePush],
  );
  const st = useStepper(frames.length, 1100);
  const f = frames[Math.min(st.step, frames.length - 1)];

  const nodeState: Record<string, NodeState> = {};
  for (const v of preset.graph.vertices) {
    if (mode === 'recursive') {
      if (f.finished.includes(v)) nodeState[v] = 'done';
      else if (f.stack.includes(v)) nodeState[v] = 'queued';
    } else {
      if (f.visited.includes(v)) nodeState[v] = 'visited';
      else if (f.stack.some((s) => s.split(' ')[0] === v)) nodeState[v] = 'queued';
    }
  }
  if (f.current) nodeState[f.current] = 'current';

  const pick = (p: GraphPreset) => {
    setPreset(p);
    setStart(p.start ?? p.graph.vertices[0]);
    st.reset();
  };

  return (
    <div className="space-y-4">
      <GraphPicker presets={DFS_PRESETS} activeId={preset.id} onPick={pick} forceDirected={null} />
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-slate-700 p-0.5">
          {(['recursive', 'iterative'] as Mode[]).map((m) => (
            <Button
              key={m}
              size="sm"
              variant={mode === m ? 'primary' : 'ghost'}
              onClick={() => {
                setMode(m);
                st.reset();
              }}
            >
              {m === 'recursive' ? 'Recursive DFS' : 'Iterative DFS'}
            </Button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          start:
          <select
            value={start}
            onChange={(e) => {
              setStart(e.target.value);
              st.reset();
            }}
            className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-sm"
          >
            {preset.graph.vertices.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        {mode === 'iterative' && (
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={reversePush}
              onChange={(e) => {
                setReversePush(e.target.checked);
                st.reset();
              }}
            />
            push соседей в обратном порядке
          </label>
        )}
      </div>
      {preset.note && <p className="text-sm text-amber-200/90">💬 {preset.note}</p>}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-2">
          <GraphView graph={preset.graph} positions={preset.positions} nodeState={nodeState} highlightEdges={f.treeEdges} />
          <div className="px-2 pb-1">
            <GraphLegend
              items={
                mode === 'recursive'
                  ? [
                      { state: 'default', label: 'не посещена' },
                      { state: 'current', label: 'текущий вызов' },
                      { state: 'queued', label: 'в call stack' },
                      { state: 'done', label: 'завершена (return)' },
                    ]
                  : [
                      { state: 'default', label: 'не посещена' },
                      { state: 'current', label: 'только что снята (pop)' },
                      { state: 'queued', label: 'лежит в stack' },
                      { state: 'visited', label: 'visited' },
                    ]
              }
            />
            <p className="mt-1 text-xs text-slate-500">Розовые рёбра — DFS tree (по ним мы впервые пришли в вершину).</p>
          </div>
        </div>
        <div className="space-y-4">
          {mode === 'recursive' ? (
            <StackView
              title="Call stack (рекурсия)"
              items={f.stack.map((v) => `dfs(${v})`)}
              topLabel="← выполняется"
              emptyText={st.step === 0 ? 'ещё не вызвали' : 'пусто — все вызовы вернулись'}
            />
          ) : (
            <StackView title="Явный Stack (LIFO)" items={f.stack} topLabel="← top (pop отсюда)" />
          )}
          <SeqView title="Порядок посещения (preorder)" items={f.order} />
          {mode === 'recursive' && <SeqView title="Порядок завершения (postorder)" items={f.finishOrder} tone="emerald" />}
        </div>
      </div>

      <div className="min-h-16 rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-3 text-sm leading-relaxed text-slate-200">{f.message}</div>
      <StepControls step={st.step} total={frames.length} onStep={st.setStep} playing={st.playing} onTogglePlay={st.togglePlay} />
    </div>
  );
}
