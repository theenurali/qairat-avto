import { useMemo, useState } from 'react';
import { dfsTopo, type Graph } from '../../../lib/algorithms/graph';
import { GraphLegend, GraphView, type NodeState } from '../../../components/GraphView';
import { StepControls } from '../../../components/ui/primitives';
import { useStepper } from '../../../lib/useStepper';
import { TOPO_PRESETS, type GraphPreset } from './presets';
import { GraphPicker, SeqView, StackView } from './GraphPicker';

interface Frame {
  message: string;
  stack: string[];
  gray: string[];
  black: string[];
  finish: string[];
  backEdge?: string;
  backTarget?: string;
  result?: string[];
  cycle?: boolean;
}

function buildFrames(g: Graph): Frame[] {
  const res = dfsTopo(g);
  const frames: Frame[] = [
    {
      message:
        'Все вершины WHITE (не посещены). Перебираем стартовые вершины по возрастанию и из каждой WHITE запускаем DFS. Когда вершина ЗАВЕРШАЕТСЯ (все потомки обработаны), дописываем её в finish list.',
      stack: [],
      gray: [],
      black: [],
      finish: [],
    },
  ];
  const gray = new Set<string>();
  const black: string[] = [];
  for (const s of res.steps) {
    let message = '';
    let backEdge: string | undefined;
    let backTarget: string | undefined;
    if (s.type === 'enter') {
      gray.add(s.vertex);
      message =
        s.stack.length === 1
          ? `Внешний цикл: ${s.vertex} ещё WHITE → запускаем dfs(${s.vertex}). ${s.vertex} становится GRAY (в процессе).`
          : `Ребро ${s.stack[s.stack.length - 2]} → ${s.vertex}: ${s.vertex} WHITE → заходим, ${s.vertex} становится GRAY.`;
    } else if (s.type === 'finish') {
      gray.delete(s.vertex);
      black.push(s.vertex);
      message = `Все исходящие рёбра ${s.vertex} обработаны → ${s.vertex} BLACK, дописываем в finish list: [${s.finishOrder.join(', ')}].`;
    } else {
      const from = s.stack[s.stack.length - 1];
      backEdge = `${from}|${s.vertex}`;
      backTarget = s.vertex;
      message = `Ребро ${from} → ${s.vertex}, а ${s.vertex} ещё GRAY (лежит в стеке вызовов)! Это back edge → найден направленный цикл. Топологической сортировки не существует.`;
    }
    frames.push({ message, stack: s.stack, gray: [...gray], black: [...black], finish: s.finishOrder, backEdge, backTarget });
  }
  const last = frames[frames.length - 1];
  frames.push({
    ...last,
    backEdge: undefined,
    backTarget: undefined,
    result: res.hasCycle ? undefined : res.order,
    cycle: res.hasCycle,
    message: res.hasCycle
      ? 'DFS нашёл back edge, значит граф НЕ DAG. Перевёрнутый finish list здесь не является топологическим порядком — ответа не существует.'
      : `Finish list: [${res.finish.join(', ')}]. Разворачиваем его → topological order: ${res.order.join(' → ')}. Почему работает: для каждого ребра u → v вершина v завершается РАНЬШЕ u, значит после разворота u стоит раньше v.`,
  });
  return frames;
}

export function DfsTopoViz() {
  const [preset, setPreset] = useState<GraphPreset>(TOPO_PRESETS[0]);
  const frames = useMemo(() => buildFrames(preset.graph), [preset]);
  const st = useStepper(frames.length, 1200);
  const f = frames[Math.min(st.step, frames.length - 1)];

  const nodeState: Record<string, NodeState> = {};
  for (const v of f.gray) nodeState[v] = 'queued';
  for (const v of f.black) nodeState[v] = 'done';
  const top = f.stack[f.stack.length - 1];
  if (top) nodeState[top] = 'current';
  if (f.backTarget) nodeState[f.backTarget] = 'error';

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
          <GraphView graph={preset.graph} positions={preset.positions} nodeState={nodeState} highlightEdges={f.backEdge ? [f.backEdge] : []} />
          <div className="px-2 pb-1">
            <GraphLegend
              items={[
                { state: 'default', label: 'WHITE' },
                { state: 'current', label: 'текущий вызов' },
                { state: 'queued', label: 'GRAY (в стеке)' },
                { state: 'done', label: 'BLACK (завершена)' },
                { state: 'error', label: 'цель back edge' },
              ]}
            />
          </div>
        </div>
        <div className="space-y-4">
          <StackView title="Call stack" items={f.stack.map((v) => `dfs(${v})`)} topLabel="← выполняется" />
          <SeqView title="Finish list (порядок завершения)" items={f.finish} tone="emerald" />
          {f.result && <SeqView title="Reverse → topological order" items={f.result} tone="cyan" />}
        </div>
      </div>
      <div
        className={`min-h-16 rounded-xl border p-3 text-sm leading-relaxed text-slate-200 ${
          f.backEdge || f.cycle ? 'border-rose-500/50 bg-rose-500/10' : f.result ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-indigo-500/30 bg-indigo-500/5'
        }`}
      >
        {f.message}
      </div>
      <StepControls step={st.step} total={frames.length} onStep={st.setStep} playing={st.playing} onTogglePlay={st.togglePlay} />
    </div>
  );
}
