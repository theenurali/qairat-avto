import type { Graph } from '../lib/algorithms/graph';

export type NodeState = 'default' | 'current' | 'visited' | 'queued' | 'done' | 'path' | 'error';

interface GraphViewProps {
  graph: Graph;
  /** Фиксированные позиции (0..1 координаты). Если нет — раскладка по кругу. */
  positions?: Record<string, { x: number; y: number }>;
  nodeState?: Record<string, NodeState>;
  /** Подсвеченные рёбра "u|v". */
  highlightEdges?: string[];
  /** Подписи над вершинами (например dist или in-degree). */
  badges?: Record<string, string>;
  width?: number;
  height?: number;
  onNodeClick?: (v: string) => void;
}

const FILL: Record<NodeState, { fill: string; stroke: string; text: string }> = {
  default: { fill: '#1e293b', stroke: '#475569', text: '#e2e8f0' },
  current: { fill: '#f59e0b', stroke: '#fbbf24', text: '#0f172a' },
  visited: { fill: '#4f46e5', stroke: '#818cf8', text: '#ffffff' },
  queued: { fill: '#0e7490', stroke: '#22d3ee', text: '#ffffff' },
  done: { fill: '#059669', stroke: '#34d399', text: '#ffffff' },
  path: { fill: '#db2777', stroke: '#f472b6', text: '#ffffff' },
  error: { fill: '#e11d48', stroke: '#fb7185', text: '#ffffff' },
};

export const NODE_LEGEND: { state: NodeState; label: string }[] = [
  { state: 'default', label: 'не посещена' },
  { state: 'current', label: 'текущая' },
  { state: 'queued', label: 'в очереди / стеке' },
  { state: 'visited', label: 'visited' },
  { state: 'done', label: 'завершена' },
];

export function circleLayout(vertices: string[]): Record<string, { x: number; y: number }> {
  const n = vertices.length;
  const res: Record<string, { x: number; y: number }> = {};
  vertices.forEach((v, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(n, 1);
    res[v] = n === 1 ? { x: 0.5, y: 0.5 } : { x: 0.5 + 0.4 * Math.cos(a), y: 0.5 + 0.4 * Math.sin(a) };
  });
  return res;
}

export function GraphView({
  graph,
  positions,
  nodeState = {},
  highlightEdges = [],
  badges = {},
  width = 420,
  height = 300,
  onNodeClick,
}: GraphViewProps) {
  const pos = { ...circleLayout(graph.vertices), ...(positions ?? {}) };
  const R = 18;
  const P = (v: string) => ({ x: 30 + (pos[v]?.x ?? 0.5) * (width - 60), y: 30 + (pos[v]?.y ?? 0.5) * (height - 60) });
  const hl = new Set(highlightEdges);
  const markerId = `arrow-${graph.directed ? 'd' : 'u'}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full max-w-full select-none" role="img" aria-label="Граф">
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
        </marker>
        <marker id={`${markerId}-hl`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#f472b6" />
        </marker>
      </defs>
      {graph.edges.map(([u, v], i) => {
        const a = P(u);
        const b = P(v);
        const on = hl.has(`${u}|${v}`) || (!graph.directed && hl.has(`${v}|${u}`));
        if (u === v) {
          return (
            <circle key={i} cx={a.x} cy={a.y - R - 8} r={10} fill="none" stroke={on ? '#f472b6' : '#64748b'} strokeWidth={on ? 3 : 1.6} />
          );
        }
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        // обратное ребро в орграфе рисуем со смещением, чтобы не наложилось
        const twin = graph.directed && graph.edges.some(([x, y]) => x === v && y === u);
        const off = twin ? 6 : 0;
        const nx = (-dy / len) * off;
        const ny = (dx / len) * off;
        const x1 = a.x + (dx / len) * R + nx;
        const y1 = a.y + (dy / len) * R + ny;
        const x2 = b.x - (dx / len) * (R + (graph.directed ? 2 : 0)) + nx;
        const y2 = b.y - (dy / len) * (R + (graph.directed ? 2 : 0)) + ny;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={on ? '#f472b6' : '#64748b'}
            strokeWidth={on ? 3 : 1.6}
            markerEnd={graph.directed ? `url(#${markerId}${on ? '-hl' : ''})` : undefined}
            className="transition-all duration-300"
          />
        );
      })}
      {graph.vertices.map((v) => {
        const { x, y } = P(v);
        const st = FILL[nodeState[v] ?? 'default'];
        return (
          <g key={v} transform={`translate(${x},${y})`} onClick={onNodeClick ? () => onNodeClick(v) : undefined} className={onNodeClick ? 'cursor-pointer' : undefined}>
            <circle r={R} fill={st.fill} stroke={st.stroke} strokeWidth={2.5} className="transition-all duration-300" />
            <text textAnchor="middle" dy="0.35em" fontSize="13" fontWeight="600" fill={st.text} fontFamily="ui-monospace, monospace">
              {v}
            </text>
            {badges[v] !== undefined && (
              <g transform={`translate(${R - 2},${-R + 2})`}>
                <rect x={-2} y={-9} width={Math.max(18, badges[v].length * 7 + 6)} height={16} rx={8} fill="#0f172a" stroke="#f59e0b" />
                <text x={Math.max(18, badges[v].length * 7 + 6) / 2 - 2} y={3} textAnchor="middle" fontSize="10" fill="#fbbf24" fontFamily="ui-monospace, monospace">
                  {badges[v]}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function GraphLegend({ items = NODE_LEGEND }: { items?: { state: NodeState; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-slate-400">
      {items.map((it) => (
        <span key={it.state} className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full border-2" style={{ background: FILL[it.state].fill, borderColor: FILL[it.state].stroke }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}
