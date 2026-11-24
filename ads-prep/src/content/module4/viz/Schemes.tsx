import { useState } from 'react';
import { bfs, dfsAll, dfsRecursive, hasDirectedCycle } from '../../../lib/algorithms/graph';
import { GraphView, type NodeState } from '../../../components/GraphView';
import { Button } from '../../../components/ui/primitives';
import { DAG_CLASSIC, DIGRAPH_CYCLE, G_DISCONNECTED, G_MAIN } from './presets';

function orderBadges(order: string[]): Record<string, string> {
  return Object.fromEntries(order.map((v, i) => [v, `#${i + 1}`]));
}

/** Один граф — два обхода: BFS «волнами» и DFS «вглубь». */
export function BfsVsDfsScheme() {
  const g = G_MAIN.graph;
  const b = bfs(g, 'A');
  const d = dfsRecursive(g, 'A');
  const bfsTree = [...b.parent].filter(([, p]) => p !== null).map(([v, p]) => `${p}|${v}`);
  const dfsTree = d.steps.filter((s) => s.type === 'enter' && s.from).map((s) => `${s.from}|${s.vertex}`);
  const cards = [
    {
      title: 'BFS (Queue): по слоям',
      order: b.order,
      tree: bfsTree,
      text: 'Сначала все соседи A (B, C), потом соседи соседей. Номер — порядок посещения.',
    },
    {
      title: 'DFS (Stack / рекурсия): вглубь',
      order: d.order,
      tree: dfsTree,
      text: 'Идём A → B → D, тупик → назад к B → E → F → C. Номер — порядок посещения.',
    },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cards.map((c) => (
        <div key={c.title} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
          <div className="mb-1 text-sm font-semibold text-slate-100">{c.title}</div>
          <GraphView
            graph={g}
            positions={G_MAIN.positions}
            badges={orderBadges(c.order)}
            highlightEdges={c.tree}
            nodeState={Object.fromEntries(g.vertices.map((v) => [v, 'visited' as NodeState]))}
            height={260}
          />
          <div className="font-mono text-sm text-indigo-200">{c.order.join(' → ')}</div>
          <p className="mt-1 text-xs text-slate-400">{c.text} Розовые рёбра — дерево обхода.</p>
        </div>
      ))}
    </div>
  );
}

/** DAG против графа с направленным циклом. */
export function DagVsCycleScheme() {
  const items = [
    { p: DAG_CLASSIC, title: 'DAG — сортировка существует' },
    { p: DIGRAPH_CYCLE, title: 'Есть цикл A → B → C → A — сортировки нет' },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map(({ p, title }) => {
        const cyc = hasDirectedCycle(p.graph);
        const states: Record<string, NodeState> = {};
        if (cyc) for (const v of ['A', 'B', 'C']) states[v] = 'error';
        return (
          <div key={p.id} className={`rounded-xl border p-3 ${cyc ? 'border-rose-500/40 bg-rose-500/5' : 'border-emerald-500/40 bg-emerald-500/5'}`}>
            <div className="mb-1 text-sm font-semibold text-slate-100">{title}</div>
            <GraphView
              graph={p.graph}
              positions={p.positions}
              nodeState={states}
              highlightEdges={cyc ? ['A|B', 'B|C', 'C|A'] : []}
              height={240}
            />
            <p className="text-xs text-slate-400">
              {cyc
                ? 'A должна стоять раньше B, B раньше C, а C раньше A — противоречие: A раньше самой себя.'
                : 'Направленных циклов нет: всегда найдётся вершина, в которую ничего не входит (in-degree 0).'}
            </p>
          </div>
        );
      })}
    </div>
  );
}

const COMP_STATES: NodeState[] = ['visited', 'done', 'path', 'queued'];

/** Внешний цикл по всем вершинам: несвязный граф и компоненты связности. */
export function ComponentsScheme() {
  const [withLoop, setWithLoop] = useState(true);
  const g = G_DISCONNECTED.graph;
  const all = dfsAll(g);
  const single = dfsRecursive(g, 'A').order;
  const states: Record<string, NodeState> = {};
  const badges: Record<string, string> = {};
  if (withLoop) {
    all.components.forEach((comp, i) => comp.forEach((v) => {
      states[v] = COMP_STATES[i % COMP_STATES.length];
      badges[v] = `C${i + 1}`;
    }));
  } else {
    single.forEach((v) => {
      states[v] = 'visited';
    });
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={!withLoop ? 'primary' : 'secondary'} onClick={() => setWithLoop(false)}>
          Только dfs(A)
        </Button>
        <Button size="sm" variant={withLoop ? 'primary' : 'secondary'} onClick={() => setWithLoop(true)}>
          С внешним циклом for v in vertices
        </Button>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-2">
        <GraphView graph={g} positions={G_DISCONNECTED.positions} nodeState={states} badges={badges} height={220} />
      </div>
      <p className="text-sm text-slate-300">
        {withLoop
          ? `Внешний цикл запускает DFS из каждой ещё не посещённой вершины. Найдено компонент: ${all.components.length} — ${all.components
              .map((c) => `{${c.join(', ')}}`)
              .join(', ')}. Посещены все вершины.`
          : `Один вызов dfs(A) посетил только ${single.join(', ')}. Вершины D, E, F остались непосещёнными — ошибка, если нужно обойти весь граф.`}
      </p>
    </div>
  );
}
