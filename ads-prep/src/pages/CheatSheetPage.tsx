import { PageHeader } from '../components/layout/Layout';
import { CodeBlock } from '../components/ui/CodeBlock';
import { Markup } from '../components/ui/Markup';
import { Callout, Card, Reveal } from '../components/ui/primitives';

interface Row {
  algo: string;
  op: string;
  best: string;
  avg: string;
  worst: string;
  space: string;
  why: string;
}

const GROUPS: { title: string; color: string; rows: Row[] }[] = [
  {
    title: 'Hash Tables (Lecture 8)',
    color: '#8b5cf6',
    rows: [
      { algo: 'Separate Chaining', op: 'insert / search / delete', best: 'O(1)', avg: 'O(1 + α)', worst: 'O(n)', space: 'O(n + m)', why: 'Hash function сразу даёт bucket — это O(1). Дальше просматриваем цепочку; её средняя длина = load factor α = n/m. Если все ключи попали в один bucket (плохая hash function), цепочка длины n → O(n).' },
      { algo: 'Open Addressing (Linear / Quadratic Probing)', op: 'insert / search / delete', best: 'O(1)', avg: 'O(1/(1−α)) ≈ O(1)', worst: 'O(n)', space: 'O(m)', why: 'Пока таблица заполнена не сильно (α ≤ 0.7), нужно в среднем несколько проб. При α → 1 число проб резко растёт; в худшем случае просматриваем всю таблицу. Хранится только массив из m ячеек.' },
      { algo: 'Rehashing (resize ×2)', op: 'один resize / insert амортизированно', best: 'O(1)', avg: 'O(1) amortized', worst: 'O(n) для одного insert', space: 'O(n)', why: 'Resize перевставляет все n ключей — O(n), но происходит редко (после удвоения следующий через n вставок). Распределяем стоимость: в среднем O(1) на insert.' },
    ],
  },
  {
    title: 'String Matching (Lectures 8–9)',
    color: '#06b6d4',
    rows: [
      { algo: 'Naive search', op: 'поиск', best: 'O(n)', avg: 'O(n)*', worst: 'O(n·m)', space: 'O(1)', why: 'Для каждого из n−m+1 сдвигов сравниваем до m символов. Худший случай: text = "AAAA…A", pattern = "AA…AB" — на каждом сдвиге почти m сравнений. *На «случайном» тексте несовпадение обычно на первом символе.' },
      { algo: 'Rabin-Karp', op: 'поиск', best: 'O(n + m)', avg: 'O(n + m)', worst: 'O(n·m)', space: 'O(1)', why: 'Хеш образца и первого окна — O(m). Rolling hash пересчитывает окно за O(1), окон n−m+1 → O(n). Худший случай — при каждом окне хеш совпадает (много spurious hits или text = "AAAA", pattern = "AA"), и каждый раз сравниваем m символов.' },
      { algo: 'KMP: build LPS', op: 'препроцессинг', best: 'O(m)', avg: 'O(m)', worst: 'O(m)', space: 'O(m)', why: 'i только растёт (m шагов), а length уменьшается не больше раз, чем увеличивался → суммарно ≤ 2m шагов. Массив LPS — m чисел.' },
      { algo: 'KMP: search', op: 'поиск', best: 'O(n)', avg: 'O(n)', worst: 'O(n)', space: 'O(m)', why: 'Указатель i в тексте НИКОГДА не двигается назад. Каждое сравнение либо увеличивает i, либо уменьшает j (а j не может уменьшаться больше раз, чем увеличивался). Итого ≤ 2n сравнений; вместе с LPS — O(n + m) в ЛЮБОМ случае.' },
    ],
  },
  {
    title: 'Traversals & Topological Sort (Lectures 10–11)',
    color: '#f59e0b',
    rows: [
      { algo: 'BFS', op: 'обход / shortest path (unweighted)', best: 'O(V + E)', avg: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)', why: 'Каждая вершина попадает в очередь один раз (visited), и при её извлечении мы просматриваем её список соседей. Сумма длин всех списков = O(E). С Adjacency Matrix — O(V²), т.к. соседей ищем по всей строке. Память: visited, dist, очередь — до V элементов.' },
      { algo: 'DFS (recursive / iterative)', op: 'обход / компоненты / циклы', best: 'O(V + E)', avg: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)', why: 'Та же логика: каждая вершина посещается один раз, каждое ребро просматривается один (орграф) или два (неориентированный) раза. Глубина рекурсии / размер стека — до V (граф-цепочка).' },
      { algo: "Kahn's Algorithm", op: 'topological sort', best: 'O(V + E)', avg: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)', why: 'Подсчёт in-degree — проход по всем рёбрам O(E). Каждая вершина один раз попадает в очередь, при извлечении уменьшаем in-degree её соседей — снова суммарно O(E).' },
      { algo: 'Topological Sort via DFS', op: 'topological sort', best: 'O(V + E)', avg: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)', why: 'Обычный DFS по всем вершинам + запись в finish order + разворот списка O(V).' },
      { algo: 'Cycle detection (DFS colors / Kahn)', op: 'есть ли цикл', best: 'O(V + E)', avg: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)', why: 'Один DFS с тремя цветами (WHITE/GRAY/BLACK) или проверка len(order) < V после Kahn.' },
    ],
  },
];


const REP_HEAD = ['Представление', 'Space', 'Есть ли ребро (u,v)?', 'Перебор соседей u', 'Добавить ребро', 'Добавить вершину', 'Удалить ребро'];
const REP_ROWS = [
  ['Adjacency Matrix', 'O(V²)', 'O(1)', 'O(V)', 'O(1)', 'O(V²)', 'O(1)'],
  ['Adjacency List', 'O(V + E)', 'O(deg(u))', 'O(deg(u))', 'O(1)', 'O(1)', 'O(deg(u))'],
  ['Edge List', 'O(E)', 'O(E)', 'O(E)', 'O(1)', 'O(1)', 'O(E)'],
];
const REP_WHY = [
  '**Adjacency Matrix**: таблица V×V хранится всегда, даже если рёбер мало → O(V²) памяти. Проверка `M[u][v]` — одно обращение O(1). Соседей ищем по всей строке — O(V). Добавить вершину = построить матрицу (V+1)×(V+1). Лучше всего для плотных графов (E ≈ V²) и частых проверок «есть ли ребро».',
  '**Adjacency List**: для каждой вершины список соседей; суммарная длина = E (орграф) или 2E (неориентированный) → O(V + E). Перебор соседей — ровно deg(u) шагов, поэтому BFS/DFS работают за O(V + E). Лучший выбор для разреженных графов.',
  '**Edge List**: просто список пар (u, v) → O(E). Компактно и удобно сортировать рёбра, но любой вопрос о конкретной вершине требует просмотра всех E рёбер. Изолированные вершины в нём не видны — их нужно хранить отдельно.',
];

const RULES = [
  { t: 'Отбрасываем константы', d: '`3n + 5` → **O(n)**. `n/2` → **O(n)**. Big O описывает скорость РОСТА, а не точное число операций.' },
  { t: 'Оставляем старший член', d: '`n² + n + 100` → **O(n²)**. При больших n младшие слагаемые ничтожны.' },
  { t: 'Последовательные части складываются', d: 'Построить LPS (O(m)), потом поиск (O(n)) → **O(n + m)**.' },
  { t: 'Вложенные циклы перемножаются', d: 'Для каждого из n сдвигов сравниваем до m символов → **O(n·m)**.' },
  { t: 'Считайте, сколько раз выполняется «самая частая» строка', d: 'В BFS это проверка соседа `if v not in visited` — она выполняется один раз на каждый элемент каждого списка смежности → **O(E)**, плюс O(V) на сами вершины.' },
  { t: 'Аргумент «потенциала» (amortized)', d: 'Если указатель только растёт до n, а другой может уменьшаться не больше, чем рос, общее число шагов ≤ 2n — даже если внутри есть while. Так доказывают O(n) для KMP.' },
  { t: 'Space — это ДОПОЛНИТЕЛЬНАЯ память', d: 'Массив LPS → O(m); visited/queue → O(V); рекурсия глубины d → O(d) в стеке вызовов.' },
  { t: 'Указывайте, в каком случае', d: 'Hash table: average O(1), но worst O(n). Rabin-Karp: average O(n+m), worst O(nm). На экзамене всегда уточняйте случай!' },
];

const EXERCISES = [
  { code: `for i in range(n):\n    for j in range(i, n):\n        print(i, j)`, a: '**O(n²)**. Внутренний цикл выполняется n + (n−1) + … + 1 = n(n+1)/2 раз. Константа 1/2 отбрасывается.' },
  { code: `i = 1\nwhile i < n:\n    i *= 2`, a: '**O(log n)**. i удваивается: 1, 2, 4, …, — после k шагов i = 2^k ≥ n, значит k = log₂ n.' },
  { code: `for u in vertices:\n    for v in adj[u]:\n        work(u, v)`, a: '**O(V + E)** для Adjacency List: внешний цикл V раз, а внутренний СУММАРНО по всем u выполняется Σdeg(u) = E (или 2E) раз. Это НЕ O(V·E)!' },
  { code: `for u in range(V):\n    for v in range(V):\n        if M[u][v]:\n            work(u, v)`, a: '**O(V²)** — то же самое, но с Adjacency Matrix: проверяем все V² ячеек независимо от числа рёбер.' },
  { code: `def f(text, pat):\n    lps = build_lps(pat)     # O(m)\n    i = j = 0\n    while i < len(text):\n        ...  # KMP step`, a: '**O(n + m)**. Построение LPS O(m) + поиск O(n), т.к. i не уменьшается, а j уменьшается не больше раз, чем рос.' },
  { code: `table = [None] * m\nfor k in keys:            # n ключей\n    insert(table, k)      # linear probing`, a: 'Average **O(n)** (каждая вставка O(1) в среднем при небольшом α), worst **O(n²)** (если все ключи дают один и тот же индекс: i-я вставка делает i проб). Space **O(m)**.' },
];

export function CheatSheetPage() {
  return (
    <div>
      <PageHeader
        title="Complexity Cheat Sheet"
        subtitle="Все сложности тем экзамена в одном месте: Best / Average / Worst / Space и объяснение простыми словами. Внизу — как определять Big O самостоятельно, с упражнениями."
      />
      <Callout kind="note" title="Обозначения">
        n — длина текста или число ключей; m — длина образца или размер hash table; α = n/m — load factor; V — число вершин; E — число рёбер; deg(u) — число соседей вершины u.
      </Callout>
      {GROUPS.map((g) => (
        <section key={g.title} className="mt-8">
          <h2 className="mb-3 flex items-center gap-3 text-xl font-bold text-white">
            <span className="h-3 w-3 rounded-full" style={{ background: g.color }} />
            {g.title}
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-800/70 text-slate-200">
                <tr>
                  <th className="px-4 py-3">Алгоритм</th>
                  <th className="px-4 py-3">Операция</th>
                  <th className="px-4 py-3">Best</th>
                  <th className="px-4 py-3">Average</th>
                  <th className="px-4 py-3">Worst</th>
                  <th className="px-4 py-3">Space</th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map((r) => (
                  <tr key={r.algo + r.op} className="border-t border-slate-800 align-top">
                    <td className="px-4 py-3 font-semibold text-slate-100">{r.algo}</td>
                    <td className="px-4 py-3 text-slate-400">{r.op}</td>
                    <td className="px-4 py-3 font-mono text-emerald-300">{r.best}</td>
                    <td className="px-4 py-3 font-mono text-sky-300">{r.avg}</td>
                    <td className="px-4 py-3 font-mono text-rose-300">{r.worst}</td>
                    <td className="px-4 py-3 font-mono text-amber-300">{r.space}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {g.rows.map((r) => (
              <div key={r.algo + r.op + 'w'} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm">
                <div className="mb-1 font-semibold text-slate-100">Почему {r.algo}?</div>
                <div className="leading-6 text-slate-300">{r.why}</div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-3 text-xl font-bold text-white">
          <span className="h-3 w-3 rounded-full" style={{ background: '#10b981' }} />
          Graph Representation (Lecture 10)
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-800/70 text-slate-200">
              <tr>{REP_HEAD.map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody>
              {REP_ROWS.map((r) => (
                <tr key={r[0]} className="border-t border-slate-800">
                  {r.map((c, i) => (
                    <td key={i} className={`px-4 py-3 ${i === 0 ? 'font-semibold text-slate-100' : i === 1 ? 'font-mono text-amber-300' : 'font-mono text-sky-300'}`}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {REP_WHY.map((w, i) => (
            <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm leading-6 text-slate-300"><Markup text={w} /></div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-2 text-2xl font-bold text-white">🧮 Как самостоятельно определить Big O</h2>
        <p className="mb-5 text-slate-400">Big O отвечает на вопрос: «во сколько раз вырастет время, если входные данные вырастут?» Вот правила, которых хватает для всех задач экзамена.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {RULES.map((r, i) => (
            <Card key={i}>
              <div className="font-semibold text-white">
                {i + 1}. {r.t}
              </div>
              <div className="mt-1 text-sm leading-6 text-slate-300">
                <Markup text={r.d} />
              </div>
            </Card>
          ))}
        </div>
        <h3 className="mt-8 mb-3 text-lg font-semibold text-white">Упражнения: определите сложность</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {EXERCISES.map((e, i) => (
            <Card key={i}>
              <div className="text-sm font-medium text-slate-200">Упражнение {i + 1}</div>
              <CodeBlock code={e.code} />
              <Reveal>
                <Markup text={e.a} />
              </Reveal>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
