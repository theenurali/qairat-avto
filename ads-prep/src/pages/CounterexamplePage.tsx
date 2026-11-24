import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CxTaskView } from '../components/CxTaskView';
import { PageHeader } from '../components/layout/Layout';
import { Badge, Card } from '../components/ui/primitives';
import { MODULES } from '../content';
import { CX_TASKS } from '../data/counterexamples';
import { useProgress } from '../lib/progress';
import { TOPIC_NAMES } from '../types';
import { DIFF_LABEL, ModuleFilter } from './TracingPage';

const STRATEGY = [
  { t: 'Поймите контракт', d: 'Прочитайте, что функция ДОЛЖНА делать. Контрпример — это вход, на котором ответ кода ≠ правильному ответу (или код падает / зацикливается).' },
  { t: 'Найдите подозрительную строку', d: 'Сравните код с эталонным алгоритмом из урока: граница цикла, обновление указателя, условие if, что именно отмечается visited, что возвращается.' },
  { t: 'Спросите: «когда эта строка важна?»', d: 'Ошибка проявляется не на любых данных. Например, отсутствие % m важно только при collision в конце таблицы; j = 0 вместо lps[j−1] — только при перекрывающихся вхождениях.' },
  { t: 'Постройте МИНИМАЛЬНЫЙ пример', d: 'Чем меньше данных, тем проще проследить вручную и объяснить на экзамене. 2–4 ключа, строка из 3–6 символов, граф из 3–4 вершин.' },
  { t: 'Проверьте граничные случаи', d: 'Пустой вход, один элемент, дубликаты, совпадение в самом начале/конце, цикл в графе, несвязный граф, изолированная вершина, повторное посещение вершины.' },
  { t: 'Проследите обе версии', d: 'Запишите вывод кода с ошибкой и правильный вывод. На экзамене нужно указать вход, ожидаемый вывод, фактический вывод и одну фразу «почему».' },
];

export function CxList() {
  const [params] = useSearchParams();
  const mod = params.get('module');
  const { state } = useProgress();
  return (
    <div>
      <PageHeader
        title="Counterexample Training"
        subtitle="На экзамене дают код с ошибкой и просят найти входные данные, на которых он работает неправильно. Здесь вы вводите свои данные — сайт запускает и код с ошибкой, и правильный код, и сравнивает результаты."
      />
      <Card className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-white">🧭 Как искать контрпример — алгоритм из 6 шагов</h2>
        <ol className="grid gap-3 md:grid-cols-2">
          {STRATEGY.map((s, i) => (
            <li key={i} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-sm">
              <div className="font-semibold text-slate-100">
                {i + 1}. {s.t}
              </div>
              <div className="mt-1 text-slate-400">{s.d}</div>
            </li>
          ))}
        </ol>
      </Card>
      <ModuleFilter base="/counterexamples" />
      {MODULES.filter((m) => !mod || m.id === mod).map((m) => {
        const list = CX_TASKS.filter((t) => t.module === m.id);
        return (
          <section key={m.id} className="mb-8">
            <h2 className="mb-3 flex items-center gap-3 text-lg font-semibold text-white">
              <span className="h-3 w-3 rounded-full" style={{ background: m.color }} />
              Module {m.number}: {m.title}
              <span className="text-sm font-normal text-slate-400">
                {list.filter((t) => state.counter[t.id]?.solved).length}/{list.length}
              </span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((t) => (
                <Link key={t.id} to={`/counterexamples/${t.id}`} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-600">
                  <div className="flex justify-between">
                    <Badge>{TOPIC_NAMES[t.topic]}</Badge>
                    <span>{state.counter[t.id]?.solved ? '✅' : state.counter[t.id] ? '🔁' : ''}</span>
                  </div>
                  <div className="mt-2 font-medium text-slate-100">{t.title}</div>
                  <div className="mt-1 text-xs text-slate-500">{DIFF_LABEL[t.difficulty]}</div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function CxDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { recordCounter } = useProgress();
  const idx = CX_TASKS.findIndex((t) => t.id === id);
  const task = CX_TASKS[idx];
  if (!task) return <div className="text-slate-300">Задача не найдена. <Link to="/counterexamples" className="text-indigo-300">К списку</Link></div>;
  const next = CX_TASKS[idx + 1];
  return (
    <div>
      <Link to={`/counterexamples?module=${task.module}`} className="text-sm text-slate-400 hover:text-slate-200">
        ← Все задачи модуля
      </Link>
      <div className="mt-3 mb-5 flex flex-wrap items-center gap-2">
        <h1 className="mr-2 text-2xl font-bold text-white">🐞 {task.title}</h1>
        <Badge tone="indigo">{TOPIC_NAMES[task.topic]}</Badge>
        <Badge>{DIFF_LABEL[task.difficulty]}</Badge>
      </div>
      <Card>
        <CxTaskView task={task} onRun={(broken) => recordCounter(task.id, broken)} />
      </Card>
      <div className="mt-6 flex justify-between">
        {idx > 0 ? (
          <button type="button" className="text-sm text-slate-400 hover:text-white" onClick={() => navigate(`/counterexamples/${CX_TASKS[idx - 1].id}`)}>
            ← Предыдущая
          </button>
        ) : (
          <span />
        )}
        {next && (
          <button type="button" className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400" onClick={() => navigate(`/counterexamples/${next.id}`)}>
            Следующая задача →
          </button>
        )}
      </div>
    </div>
  );
}
