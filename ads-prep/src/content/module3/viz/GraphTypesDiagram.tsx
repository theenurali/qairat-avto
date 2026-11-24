import { makeGraph } from '../../../lib/algorithms/graph';
import { GraphView } from '../../../components/GraphView';
import { Card } from '../../../components/ui/primitives';

const UNDIRECTED = makeGraph(['A', 'B', 'C', 'D'], [['A', 'B'], ['A', 'C'], ['B', 'C'], ['C', 'D']], false);
const DIRECTED = makeGraph(['A', 'B', 'C', 'D'], [['A', 'B'], ['A', 'C'], ['C', 'B'], ['C', 'D']], true);
const COMPONENTS = makeGraph(['A', 'B', 'C', 'D', 'E', 'F'], [['A', 'B'], ['B', 'C'], ['D', 'E']], false);

const POS4 = { A: { x: 0.1, y: 0.15 }, B: { x: 0.9, y: 0.15 }, C: { x: 0.5, y: 0.6 }, D: { x: 0.5, y: 1 } };
const POS6 = {
  A: { x: 0, y: 0.1 },
  B: { x: 0.3, y: 0.5 },
  C: { x: 0, y: 0.9 },
  D: { x: 0.6, y: 0.1 },
  E: { x: 0.6, y: 0.9 },
  F: { x: 1, y: 0.5 },
};

/** Взвешенный граф рисуем вручную: GraphView не показывает веса. */
function WeightedSvg() {
  const pts: Record<string, [number, number]> = { A: [40, 40], B: [200, 40], C: [120, 150], D: [120, 240] };
  const edges: [string, string, number][] = [
    ['A', 'B', 7],
    ['A', 'C', 2],
    ['B', 'C', 3],
    ['C', 'D', 5],
  ];
  return (
    <svg viewBox="0 0 240 280" className="h-auto w-full" role="img" aria-label="Взвешенный граф">
      {edges.map(([u, v, w]) => {
        const [x1, y1] = pts[u];
        const [x2, y2] = pts[v];
        return (
          <g key={`${u}${v}`}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#64748b" strokeWidth={1.6} />
            <rect x={(x1 + x2) / 2 - 10} y={(y1 + y2) / 2 - 9} width={20} height={18} rx={4} fill="#0f172a" stroke="#f59e0b" />
            <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 + 4} textAnchor="middle" fontSize="11" fill="#fbbf24" fontFamily="ui-monospace, monospace">
              {w}
            </text>
          </g>
        );
      })}
      {Object.entries(pts).map(([v, [x, y]]) => (
        <g key={v} transform={`translate(${x},${y})`}>
          <circle r={18} fill="#1e293b" stroke="#475569" strokeWidth={2.5} />
          <text textAnchor="middle" dy="0.35em" fontSize="13" fontWeight="600" fill="#e2e8f0" fontFamily="ui-monospace, monospace">
            {v}
          </text>
        </g>
      ))}
    </svg>
  );
}

const PANELS = [
  { title: 'Undirected (неориентированный)', note: 'Ребро A–B можно пройти в обе стороны. deg(C) = 3.' },
  { title: 'Directed (ориентированный)', note: 'Дуга A → B только в одну сторону. in-deg(B) = 2, out-deg(C) = 2.' },
  { title: 'Weighted (взвешенный)', note: 'У каждого ребра есть вес (длина, цена, время).' },
  { title: 'Disconnected (несвязный)', note: '3 connected components: {A,B,C}, {D,E}, {F}.' },
];

export function GraphTypesDiagram() {
  const views = [
    <GraphView key="u" graph={UNDIRECTED} positions={POS4} width={240} height={280} />,
    <GraphView key="d" graph={DIRECTED} positions={POS4} width={240} height={280} />,
    <WeightedSvg key="w" />,
    <GraphView key="c" graph={COMPONENTS} positions={POS6} width={240} height={280} />,
  ];
  return (
    <Card>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PANELS.map((p, i) => (
          <div key={p.title} className="rounded-xl border border-slate-800 bg-slate-950/50 p-2">
            <div className="px-1 text-sm font-semibold text-emerald-300">{p.title}</div>
            <div className="mx-auto max-w-[220px]">{views[i]}</div>
            <p className="px-1 text-xs leading-relaxed text-slate-400">{p.note}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
