import { useMemo, useState } from 'react';
import { adjacencyList, adjacencyMatrix, cmpLabel, makeGraph, type Edge, type Graph } from '../../../lib/algorithms/graph';
import { GraphView } from '../../../components/GraphView';
import { Badge, Button, Card } from '../../../components/ui/primitives';
import { PRESETS } from './presets';

const MAX_VERTICES = 12;
const LABEL_RE = /^[A-Za-z0-9_]{1,3}$/;

function sameEdge(a: Edge, b: Edge, directed: boolean): boolean {
  if (a[0] === b[0] && a[1] === b[1]) return true;
  return !directed && a[0] === b[1] && a[1] === b[0];
}

/** Убирает дубликаты рёбер (важно при переключении directed → undirected). */
function dedupe(edges: Edge[], directed: boolean): Edge[] {
  const out: Edge[] = [];
  for (const e of edges) if (!out.some((x) => sameEdge(x, e, directed))) out.push(e);
  return out;
}

function listEntries(g: Graph): number {
  if (g.directed) return g.edges.length;
  return g.edges.reduce((s, [u, v]) => s + (u === v ? 1 : 2), 0);
}

const OPS: [string, string, string, string][] = [
  ['Проверить ребро (u, v)', 'O(1)', 'O(deg(u))', 'O(E)'],
  ['Перебрать соседей u', 'O(V)', 'O(deg(u))', 'O(E)'],
  ['Добавить ребро', 'O(1)', 'O(1)', 'O(1)'],
  ['Удалить ребро', 'O(1)', 'O(deg(u))', 'O(E)'],
  ['Добавить вершину', 'O(V²) (пересоздать)', 'O(1)', 'O(1)'],
  ['Память', 'O(V²)', 'O(V + E)', 'O(E)'],
];

export function GraphRepEditor() {
  const [graph, setGraph] = useState<Graph>(PRESETS[0].graph);
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [positions, setPositions] = useState(PRESETS[0].positions);
  const [newVertex, setNewVertex] = useState('');
  const [edgeU, setEdgeU] = useState('');
  const [edgeV, setEdgeV] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [hoverEdge, setHoverEdge] = useState<string | null>(null);

  const matrix = useMemo(() => adjacencyMatrix(graph), [graph]);
  const adj = useMemo(() => adjacencyList(graph), [graph]);
  const V = graph.vertices.length;
  const E = graph.edges.length;

  const update = (g: Graph, text: string, ok = true) => {
    setGraph(g);
    setMessage({ ok, text });
  };

  const loadPreset = (id: string) => {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    setPresetId(id);
    setGraph(p.graph);
    setPositions(p.positions);
    setMessage(null);
  };

  const toggleDirected = () => {
    const directed = !graph.directed;
    const edges = dedupe(graph.edges, directed);
    const removed = graph.edges.length - edges.length;
    update(
      makeGraph(graph.vertices, edges, directed),
      directed
        ? 'Теперь граф ориентированный: каждое ребро u–v стало дугой u → v. Матрица может перестать быть симметричной.'
        : `Теперь граф неориентированный: матрица стала симметричной.${removed ? ` Склеено встречных дуг: ${removed}.` : ''}`,
    );
  };

  const addVertex = () => {
    const label = newVertex.trim();
    if (!LABEL_RE.test(label)) return setMessage({ ok: false, text: 'Метка вершины: 1–3 символа (буквы, цифры, _).' });
    if (graph.vertices.includes(label)) return setMessage({ ok: false, text: `Вершина «${label}» уже есть.` });
    if (V >= MAX_VERTICES) return setMessage({ ok: false, text: `Максимум ${MAX_VERTICES} вершин, чтобы матрица помещалась на экране.` });
    setPositions(undefined); // новая вершина → раскладка по кругу
    setNewVertex('');
    update(
      makeGraph([...graph.vertices, label].sort(cmpLabel), graph.edges, graph.directed),
      `Добавлена вершина ${label}. В матрице появились новая строка и столбец (V² = ${(V + 1) ** 2} ячеек), в списке — пустой список соседей.`,
    );
  };

  const removeVertex = (v: string) => {
    const edges = graph.edges.filter(([a, b]) => a !== v && b !== v);
    setPositions(undefined);
    update(
      makeGraph(graph.vertices.filter((x) => x !== v), edges, graph.directed),
      `Удалена вершина ${v} и ${graph.edges.length - edges.length} инцидентных рёбер.`,
    );
  };

  const addEdge = (u: string, v: string) => {
    if (!u || !v) return setMessage({ ok: false, text: 'Выберите обе вершины ребра.' });
    if (!graph.vertices.includes(u) || !graph.vertices.includes(v)) return setMessage({ ok: false, text: 'Таких вершин нет в графе.' });
    const e: Edge = [u, v];
    if (graph.edges.some((x) => sameEdge(x, e, graph.directed)))
      return setMessage({ ok: false, text: `Ребро ${u}${graph.directed ? '→' : '–'}${v} уже есть (кратные рёбра не используем).` });
    update(
      makeGraph(graph.vertices, [...graph.edges, e], graph.directed),
      u === v
        ? `Добавлена петля (self-loop) ${u}: единица на диагонали матрицы.`
        : `Добавлено ребро ${u}${graph.directed ? '→' : '–'}${v}.${graph.directed ? '' : ' В матрице появились две единицы (симметрично), в списке — две записи.'}`,
    );
  };

  const removeEdge = (e: Edge) => {
    update(
      makeGraph(graph.vertices, graph.edges.filter((x) => !sameEdge(x, e, graph.directed)), graph.directed),
      `Удалено ребро ${e[0]}${graph.directed ? '→' : '–'}${e[1]}.`,
    );
  };

  const toggleCell = (i: number, j: number) => {
    const e: Edge = [graph.vertices[i], graph.vertices[j]];
    const exists = graph.edges.find((x) => sameEdge(x, e, graph.directed));
    if (exists) removeEdge(exists);
    else addEdge(e[0], e[1]);
  };

  const hl = hoverEdge ? [hoverEdge] : [];

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={presetId}
          onChange={(e) => loadPreset(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
          aria-label="Готовый граф"
        >
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <Button size="sm" variant="secondary" onClick={toggleDirected}>
          {graph.directed ? '↔ Сделать неориентированным' : '→ Сделать ориентированным'}
        </Button>
        <Badge tone="emerald">{graph.directed ? 'Directed' : 'Undirected'}</Badge>
        <Badge tone="sky">V = {V}</Badge>
        <Badge tone="sky">E = {E}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-2">
          <div className="px-2 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Рисунок</div>
          <GraphView graph={graph} positions={positions} highlightEdges={hl} height={280} />
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Adjacency Matrix</span>
            <span className="normal-case tracking-normal text-slate-500">клик по ячейке = вкл/выкл ребро</span>
          </div>
          {V === 0 ? (
            <p className="text-sm text-slate-500">Нет вершин.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="border-collapse font-mono text-xs">
                <thead>
                  <tr>
                    <th className="h-7 w-7" />
                    {graph.vertices.map((v) => (
                      <th key={v} className="h-7 w-7 text-center text-emerald-300">
                        {v}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((row, i) => (
                    <tr key={graph.vertices[i]}>
                      <th className="pr-2 text-right text-emerald-300">{graph.vertices[i]}</th>
                      {row.map((cell, j) => {
                        const key = `${graph.vertices[i]}|${graph.vertices[j]}`;
                        return (
                          <td key={j} className="p-0.5">
                            <button
                              type="button"
                              onClick={() => toggleCell(i, j)}
                              onMouseEnter={() => cell && setHoverEdge(key)}
                              onMouseLeave={() => setHoverEdge(null)}
                              className={`h-7 w-7 rounded border text-center transition-colors ${
                                cell
                                  ? 'border-emerald-400/60 bg-emerald-500/25 text-emerald-200'
                                  : i === j
                                    ? 'border-slate-700 bg-slate-800/70 text-slate-600'
                                    : 'border-slate-800 bg-slate-900 text-slate-600 hover:border-slate-600'
                              }`}
                              aria-label={`Ячейка ${graph.vertices[i]}, ${graph.vertices[j]}`}
                            >
                              {cell}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Adjacency List</div>
          <ul className="space-y-1 font-mono text-sm">
            {graph.vertices.map((v) => (
              <li key={v} className="flex flex-wrap items-center gap-1">
                <span className="w-8 text-emerald-300">{v}</span>
                <span className="text-slate-500">→</span>
                {(adj.get(v) ?? []).length === 0 ? (
                  <span className="text-slate-600">[ ]</span>
                ) : (
                  (adj.get(v) ?? []).map((n, k) => (
                    <span
                      key={k}
                      onMouseEnter={() => setHoverEdge(`${v}|${n}`)}
                      onMouseLeave={() => setHoverEdge(null)}
                      className="rounded border border-slate-700 bg-slate-800 px-1.5 text-slate-200"
                    >
                      {n}
                    </span>
                  ))
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Edge List</div>
          {E === 0 ? (
            <p className="text-sm text-slate-500">Рёбер нет.</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5 font-mono text-sm">
              {graph.edges.map((e, k) => (
                <li
                  key={k}
                  onMouseEnter={() => setHoverEdge(`${e[0]}|${e[1]}`)}
                  onMouseLeave={() => setHoverEdge(null)}
                  className="flex items-center gap-1 rounded border border-slate-700 bg-slate-800 pl-2 text-slate-200"
                >
                  ({e[0]}, {e[1]})
                  <button
                    type="button"
                    onClick={() => removeEdge(e)}
                    className="px-1.5 text-rose-300 hover:text-rose-200"
                    aria-label={`Удалить ребро ${e[0]} ${e[1]}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 p-3">
          <div className="mb-2 text-sm font-medium text-slate-200">Вершины</div>
          <div className="flex gap-2">
            <input
              value={newVertex}
              onChange={(e) => setNewVertex(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addVertex()}
              placeholder="напр. G"
              className="w-24 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
              aria-label="Метка новой вершины"
            />
            <Button size="sm" onClick={addVertex}>
              + Вершина
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {graph.vertices.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => removeVertex(v)}
                className="rounded border border-slate-700 px-1.5 font-mono text-xs text-slate-300 hover:border-rose-400 hover:text-rose-300"
                title="Удалить вершину"
              >
                {v} ×
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 p-3">
          <div className="mb-2 text-sm font-medium text-slate-200">Добавить ребро</div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              [edgeU, setEdgeU, 'откуда'],
              [edgeV, setEdgeV, 'куда'],
            ].map(([val, set, label], k) => (
              <select
                key={k}
                value={val as string}
                onChange={(e) => (set as (s: string) => void)(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
                aria-label={label as string}
              >
                <option value="">{label as string}</option>
                {graph.vertices.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            ))}
            <Button size="sm" onClick={() => addEdge(edgeU, edgeV)}>
              + Ребро
            </Button>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 p-3 text-sm">
          <div className="mb-2 font-medium text-slate-200">Память (ячеек)</div>
          <div className="space-y-1 font-mono text-xs text-slate-300">
            <div>Matrix: V² = {V * V}</div>
            <div>
              List: V + {graph.directed ? 'E' : '2E'} = {V} + {listEntries(graph)} = {V + listEntries(graph)}
            </div>
            <div>Edge List: E = {E} пар</div>
          </div>
        </div>
      </div>

      {message && (
        <div className={`rounded-lg border px-3 py-2 text-sm ${message.ok ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-rose-500/40 bg-rose-500/10 text-rose-200'}`}>
          {message.text}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="py-1 pr-3">Операция</th>
              <th className="py-1 pr-3">Adjacency Matrix</th>
              <th className="py-1 pr-3">Adjacency List</th>
              <th className="py-1">Edge List</th>
            </tr>
          </thead>
          <tbody className="font-mono text-slate-300">
            {OPS.map((r) => (
              <tr key={r[0]} className="border-t border-slate-800">
                <td className="py-1.5 pr-3 font-sans text-slate-200">{r[0]}</td>
                <td className="py-1.5 pr-3">{r[1]}</td>
                <td className="py-1.5 pr-3">{r[2]}</td>
                <td className="py-1.5">{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
