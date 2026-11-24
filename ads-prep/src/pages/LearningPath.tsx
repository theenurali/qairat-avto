import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/Layout';
import { Badge, Card, ProgressBar } from '../components/ui/primitives';
import { MODULES, getModule } from '../content';
import { CX_TASKS } from '../data/counterexamples';
import { TRACING_TASKS } from '../data/tracing';
import { useProgress } from '../lib/progress';
import { useOverallStats } from '../lib/stats';
import { TOPIC_NAMES } from '../types';

export function LearningPath() {
  const stats = useOverallStats();
  const { state } = useProgress();
  return (
    <div>
      <PageHeader
        title="Learning Path"
        subtitle="4 модуля по темам экзамена (лекции 8–11). Проходите по порядку: каждый следующий модуль опирается на предыдущий. В каждом уроке — теория с нуля, визуализации, код, сложность, ошибки и мини-экзамен."
      />
      <div className="grid gap-5 md:grid-cols-2">
        {MODULES.map((m) => {
          const ms = stats.modules.find((x) => x.id === m.id)!;
          return (
            <Card key={m.id} className="relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: m.color }} />
              <div className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: m.color }}>
                Module {m.number}
              </div>
              <h2 className="text-xl font-bold text-white">{m.title}</h2>
              <p className="mt-2 text-sm text-slate-400">{m.description}</p>
              <div className="mt-4 flex items-center gap-3">
                <ProgressBar value={ms.percent} color={m.color} />
                <span className="font-mono text-xs text-slate-300">{ms.percent}%</span>
              </div>
              <ul className="mt-4 space-y-1.5">
                {m.lessons.map((l, i) => {
                  const done = state.lessonsCompleted[l.id];
                  return (
                    <li key={l.id}>
                      <Link to={`/lesson/${l.id}`} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-800/60">
                        <span className={`grid h-6 w-6 place-items-center rounded-full text-xs ${done ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          {done ? '✓' : i + 1}
                        </span>
                        <span className="flex-1 text-slate-200">{l.title}</span>
                        <span className="text-xs text-slate-500">{l.minutes} мин</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to={`/module/${m.id}`} className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-700">
                  Обзор модуля →
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function ModulePage() {
  const { id = '' } = useParams();
  const m = getModule(id);
  const { state } = useProgress();
  if (!m) return <div className="text-slate-300">Модуль не найден. <Link to="/path" className="text-indigo-300">К списку модулей</Link></div>;
  const tr = TRACING_TASKS.filter((t) => t.module === m.id);
  const cx = CX_TASKS.filter((t) => t.module === m.id);
  const topics = [...new Set(m.lessons.map((l) => l.topic))];
  return (
    <div>
      <Link to="/path" className="text-sm text-slate-400 hover:text-slate-200">
        ← Learning Path
      </Link>
      <PageHeader title={`Module ${m.number}: ${m.title}`} subtitle={m.description} />
      <div className="mb-6 flex flex-wrap gap-2">
        {topics.map((t) => (
          <Badge key={t} tone="indigo">
            {TOPIC_NAMES[t]}
          </Badge>
        ))}
      </div>
      <h2 className="mb-3 text-lg font-semibold text-white">Уроки</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {m.lessons.map((l, i) => {
          const done = state.lessonsCompleted[l.id];
          return (
            <Link key={l.id} to={`/lesson/${l.id}`} className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-600">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Урок {i + 1}</span>
                <span>{l.minutes} мин</span>
              </div>
              <div className="mt-2 font-semibold text-white group-hover:text-indigo-200">{l.title}</div>
              <div className="mt-1 text-sm text-slate-400">{l.subtitle}</div>
              <div className="mt-3 text-xs">
                {done ? (
                  <span className="text-emerald-300">
                    ✓ Мини-экзамен: {done.score}/{done.total}
                  </span>
                ) : state.lessonsOpened[l.id] ? (
                  <span className="text-amber-300">в процессе</span>
                ) : (
                  <span className="text-slate-500">не начат</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
      <h2 className="mt-8 mb-3 text-lg font-semibold text-white">Практика по модулю</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Link to={`/tracing?module=${m.id}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-600">
          <div className="text-lg">🔍 Tracing Practice</div>
          <div className="mt-1 text-sm text-slate-400">
            {tr.filter((t) => state.tracing[t.id]?.solved).length} из {tr.length} решено
          </div>
        </Link>
        <Link to={`/counterexamples?module=${m.id}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-600">
          <div className="text-lg">🐞 Counterexamples</div>
          <div className="mt-1 text-sm text-slate-400">
            {cx.filter((t) => state.counter[t.id]?.solved).length} из {cx.length} решено
          </div>
        </Link>
        <Link to={`/theory?module=${m.id}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-600">
          <div className="text-lg">✅ Theory Test по модулю</div>
          <div className="mt-1 text-sm text-slate-400">Multiple choice с объяснениями</div>
        </Link>
        <Link to={`/open?module=${m.id}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-600">
          <div className="text-lg">✍️ Open Questions</div>
          <div className="mt-1 text-sm text-slate-400">Тренируйте развёрнутые ответы</div>
        </Link>
      </div>
    </div>
  );
}
