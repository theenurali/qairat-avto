import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/Layout';
import { TracingTaskView } from '../components/TracingTaskView';
import { Badge, Card } from '../components/ui/primitives';
import { MODULES } from '../content';
import { TRACING_TASKS } from '../data/tracing';
import { useProgress } from '../lib/progress';
import { TOPIC_NAMES } from '../types';

export const DIFF_LABEL = { 1: 'Лёгкая', 2: 'Средняя', 3: 'Сложная' } as const;
const DIFF_TONE = { 1: 'emerald', 2: 'amber', 3: 'rose' } as const;

export function ModuleFilter({ base }: { base: string }) {
  const [params] = useSearchParams();
  const cur = params.get('module') ?? 'all';
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {[{ id: 'all', label: 'Все модули' }, ...MODULES.map((m) => ({ id: m.id, label: `M${m.number}: ${m.title}` }))].map((o) => (
        <Link
          key={o.id}
          to={o.id === 'all' ? base : `${base}?module=${o.id}`}
          className={`rounded-full px-3 py-1.5 text-sm ${cur === o.id ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}

export function TracingList() {
  const [params] = useSearchParams();
  const mod = params.get('module');
  const { state } = useProgress();
  const tasks = TRACING_TASKS.filter((t) => !mod || t.module === mod);
  return (
    <div>
      <PageHeader
        title="Tracing Practice"
        subtitle="Как на экзамене: даны исходные данные и алгоритм — выполните его вручную и запишите результат. После проверки вы увидите, в какой позиции ошибка, и полное пошаговое решение. Задания идут от лёгких к сложным."
      />
      <ModuleFilter base="/tracing" />
      {MODULES.filter((m) => !mod || m.id === mod).map((m) => {
        const list = tasks.filter((t) => t.module === m.id);
        const solved = list.filter((t) => state.tracing[t.id]?.solved).length;
        return (
          <section key={m.id} className="mb-8">
            <h2 className="mb-3 flex items-center gap-3 text-lg font-semibold text-white">
              <span className="h-3 w-3 rounded-full" style={{ background: m.color }} />
              Module {m.number}: {m.title}
              <span className="text-sm font-normal text-slate-400">
                {solved}/{list.length}
              </span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((t, i) => {
                const a = state.tracing[t.id];
                return (
                  <Link key={t.id} to={`/tracing/${t.id}`} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-slate-500">#{i + 1}</span>
                      <span className="text-sm">{a?.solved ? '✅' : a ? '🔁' : ''}</span>
                    </div>
                    <div className="mt-1 font-medium text-slate-100">{t.title}</div>
                    <div className="mt-2 flex gap-2">
                      <Badge tone={DIFF_TONE[t.difficulty]}>{DIFF_LABEL[t.difficulty]}</Badge>
                      <Badge>{TOPIC_NAMES[t.topic]}</Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function TracingDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { recordTracing, state } = useProgress();
  const idx = TRACING_TASKS.findIndex((t) => t.id === id);
  const task = TRACING_TASKS[idx];
  if (!task) return <div className="text-slate-300">Задание не найдено. <Link to="/tracing" className="text-indigo-300">К списку</Link></div>;
  const sameModule = TRACING_TASKS.filter((t) => t.module === task.module);
  const pos = sameModule.indexOf(task);
  const next = TRACING_TASKS[idx + 1];
  const a = state.tracing[task.id];
  return (
    <div>
      <Link to={`/tracing?module=${task.module}`} className="text-sm text-slate-400 hover:text-slate-200">
        ← Все задания модуля
      </Link>
      <div className="mt-3 mb-5 flex flex-wrap items-center gap-2">
        <h1 className="mr-2 text-2xl font-bold text-white">{task.title}</h1>
        <Badge tone={DIFF_TONE[task.difficulty]}>{DIFF_LABEL[task.difficulty]}</Badge>
        <Badge tone="indigo">{TOPIC_NAMES[task.topic]}</Badge>
        <span className="text-sm text-slate-500">
          задание {pos + 1} из {sameModule.length}
        </span>
        {a && (
          <span className="text-sm text-slate-400">
            · попыток: {a.right + a.wrong}
            {a.solved ? ' · решено ✅' : ''}
          </span>
        )}
      </div>
      <Card>
        <TracingTaskView task={task} onResult={(ok) => recordTracing(task.id, ok)} />
      </Card>
      <div className="mt-6 flex justify-between">
        {idx > 0 ? (
          <button type="button" className="text-sm text-slate-400 hover:text-white" onClick={() => navigate(`/tracing/${TRACING_TASKS[idx - 1].id}`)}>
            ← Предыдущее
          </button>
        ) : (
          <span />
        )}
        {next && (
          <button type="button" className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400" onClick={() => navigate(`/tracing/${next.id}`)}>
            Следующее задание →
          </button>
        )}
      </div>
    </div>
  );
}
