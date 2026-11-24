import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, ProgressBar } from '../components/ui/primitives';
import { ALL_LESSONS, MODULES } from '../content';
import { DEFAULT_EXAM, useProgress } from '../lib/progress';
import { useOverallStats, type OverallStats } from '../lib/stats';
import { TOPIC_NAMES } from '../types';

function Countdown({ iso }: { iso: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = new Date(iso).getTime() - now;
  if (Number.isNaN(diff)) return <div className="text-slate-400">Укажите дату экзамена</div>;
  if (diff <= 0) return <div className="text-2xl font-bold text-emerald-300">Экзамен уже начался — удачи! 🍀</div>;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return (
    <div className="flex gap-3">
      {[
        [d, 'дней'],
        [h, 'часов'],
        [m, 'минут'],
        [s, 'секунд'],
      ].map(([v, l]) => (
        <div key={l} className="min-w-[64px] rounded-xl bg-slate-950/60 px-3 py-2 text-center ring-1 ring-slate-800">
          <div className="font-mono text-2xl font-bold text-white sm:text-3xl">{String(v).padStart(2, '0')}</div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500">{l}</div>
        </div>
      ))}
    </div>
  );
}

function Ring({ value, size = 132 }: { value: number; size?: number }) {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Прогресс ${value}%`}>
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#1e293b" strokeWidth={12} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="url(#ringGrad)"
        strokeWidth={12}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" fill="#fff" fontSize="26" fontWeight="700">
        {value}%
      </text>
    </svg>
  );
}

function TopicChart({ stats }: { stats: OverallStats }) {
  return (
    <div className="space-y-3">
      {stats.topics.map((t) => {
        const pct = t.accuracy === null ? 0 : Math.round(t.accuracy * 100);
        const color = t.accuracy === null ? '#334155' : pct >= 75 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#f43f5e';
        return (
          <div key={t.topic}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-slate-300">{TOPIC_NAMES[t.topic]}</span>
              <span className="font-mono text-xs text-slate-400">{t.accuracy === null ? 'нет попыток' : `${pct}% · ${t.right}/${t.attempts}`}</span>
            </div>
            <ProgressBar value={t.accuracy === null ? 0 : pct} color={color} />
          </div>
        );
      })}
    </div>
  );
}

function MockTrend() {
  const { state } = useProgress();
  const pts = state.mockResults.map((r) => Math.round((100 * r.score) / r.max));
  if (pts.length === 0) return <div className="text-sm text-slate-500">Пока нет попыток Mock Exam.</div>;
  const W = 320;
  const H = 110;
  const x = (i: number) => (pts.length === 1 ? W / 2 : 16 + (i * (W - 32)) / (pts.length - 1));
  const y = (v: number) => H - 14 - (v / 100) * (H - 28);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Динамика результатов Mock Exam">
      <line x1={0} x2={W} y1={y(60)} y2={y(60)} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.5} />
      <text x={W - 4} y={y(60) - 4} textAnchor="end" fontSize="9" fill="#f59e0b">60%</text>
      <polyline points={pts.map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" stroke="#818cf8" strokeWidth={2.5} />
      {pts.map((v, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(v)} r={4} fill="#6366f1" />
          <text x={x(i)} y={y(v) - 8} textAnchor="middle" fontSize="10" fill="#e2e8f0">
            {v}%
          </text>
        </g>
      ))}
    </svg>
  );
}

export function Dashboard() {
  const stats = useOverallStats();
  const { state, setExamDate, resetAll } = useProgress();
  const navigate = useNavigate();
  const firstIncomplete = ALL_LESSONS.find(({ lesson }) => !state.lessonsCompleted[lesson.id]);
  const continueTo = state.lastRoute || (firstIncomplete ? `/lesson/${firstIncomplete.lesson.id}` : '/mock');
  const continueLabel = state.lastRoute ? 'Продолжить с того же места' : firstIncomplete ? `Начать: ${firstIncomplete.lesson.title}` : 'Перейти к Mock Exam';

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-indigo-600/25 via-slate-900 to-fuchsia-600/15 p-6 sm:p-8">
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-xl">
            <div className="text-sm font-medium text-indigo-300">Algorithms & Data Structures · Final Exam</div>
            <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Привет! Готовимся к экзамену 👋</h1>
            <p className="mt-3 text-slate-300">
              Hash Tables, Rabin-Karp, KMP, представления графов, BFS, DFS и Topological Sort — с нуля до уверенного решения задач. Формат экзамена: Tracing, Open Questions, Multiple Choice, Counterexample — 60 минут.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={() => navigate(continueTo)} className="px-5 py-2.5 text-base">
                ▶ Continue Learning
              </Button>
              <Link to="/path" className="rounded-lg border border-slate-600 px-5 py-2.5 text-base text-slate-100 hover:bg-slate-800">
                Learning Path
              </Link>
            </div>
            <div className="mt-2 text-xs text-slate-400">{continueLabel}</div>
          </div>
          <div>
            <div className="mb-2 text-sm text-slate-400">До экзамена осталось</div>
            <Countdown iso={state.examDateTime} />
            <label className="mt-3 block text-xs text-slate-500">
              Дата и время экзамена:{' '}
              <input
                type="datetime-local"
                value={state.examDateTime}
                onChange={(e) => setExamDate(e.target.value || DEFAULT_EXAM)}
                className="ml-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-slate-200"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-4 lg:col-span-1">
          <Ring value={stats.overall} size={110} />
          <div>
            <div className="text-sm text-slate-400">Общий прогресс</div>
            <div className="text-xs text-slate-500">уроки, практика, тесты, mock</div>
          </div>
        </Card>
        <Card>
          <div className="text-sm text-slate-400">Изучено тем (уроков)</div>
          <div className="mt-1 text-3xl font-bold text-white">
            {stats.lessonsDone}
            <span className="text-lg text-slate-500"> / {stats.lessonsTotal}</span>
          </div>
          <ProgressBar value={(100 * stats.lessonsDone) / Math.max(1, stats.lessonsTotal)} className="mt-3" />
        </Card>
        <Card>
          <div className="text-sm text-slate-400">Решено задач</div>
          <div className="mt-1 text-3xl font-bold text-white">{stats.problemsSolved}</div>
          <div className="mt-2 space-y-0.5 text-xs text-slate-400">
            <div>Tracing: {stats.tracingSolved}/{stats.tracingTotal}</div>
            <div>Counterexamples: {stats.cxSolved}/{stats.cxTotal}</div>
            <div>Theory MCQ: {stats.mcqCorrect}/{stats.mcqTotal}</div>
          </div>
        </Card>
        <Card>
          <div className="text-sm text-slate-400">Mock Exams</div>
          <div className="mt-1 text-3xl font-bold text-white">
            {stats.mocksDone}
            <span className="text-lg text-slate-500"> / 3 варианта</span>
          </div>
          <Link to="/mock" className="mt-3 inline-block text-sm text-indigo-300 hover:text-indigo-200">
            Открыть симулятор →
          </Link>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-semibold text-white">Прогресс по модулям</h2>
          <div className="space-y-4">
            {stats.modules.map((m) => {
              const mod = MODULES.find((x) => x.id === m.id)!;
              return (
                <Link key={m.id} to={`/module/${m.id}`} className="block rounded-xl p-2 hover:bg-slate-800/40">
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-slate-200">
                      <span className="mr-2 font-mono text-xs" style={{ color: m.color }}>
                        M{mod.number}
                      </span>
                      {m.title}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      {m.percent}% · уроков {m.lessonsDone}/{m.lessonsTotal}
                    </span>
                  </div>
                  <ProgressBar value={m.percent} color={m.color} />
                </Link>
              );
            })}
          </div>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold text-white">⚠️ Слабые темы</h2>
          {stats.weakTopics.length === 0 ? (
            <div className="text-sm text-slate-400">
              {stats.topics.every((t) => t.attempts === 0)
                ? 'Пока недостаточно данных. Решайте задачи и тесты — здесь появятся темы, где точность ниже 70%.'
                : 'Слабых тем нет — так держать! 💪'}
            </div>
          ) : (
            <ul className="space-y-2">
              {stats.weakTopics.map((t) => {
                const lesson = ALL_LESSONS.find((x) => x.lesson.topic === t.topic);
                return (
                  <li key={t.topic} className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3">
                    <div className="font-medium text-rose-200">{TOPIC_NAMES[t.topic]}</div>
                    <div className="text-xs text-slate-400">{t.reason}</div>
                    {lesson && (
                      <Link to={`/lesson/${lesson.lesson.id}`} className="mt-1 inline-block text-xs text-indigo-300 hover:text-indigo-200">
                        Повторить урок →
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-4 text-xs text-slate-500">
            Не начатые темы: {stats.topics.filter((t) => t.attempts === 0).map((t) => TOPIC_NAMES[t.topic]).join(', ') || 'нет'}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold text-white">Точность по темам</h2>
          <TopicChart stats={stats} />
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold text-white">Результаты Mock Exam</h2>
          <MockTrend />
          <h3 className="mt-6 mb-2 text-sm font-semibold text-slate-300">Рекомендуемый план</h3>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-400 marker:text-indigo-400">
            <li>Уроки модулей 1–4 по порядку (каждый с мини-экзаменом).</li>
            <li>После каждого модуля — Tracing Practice и Counterexamples этого модуля.</li>
            <li>Theory Test → режим «только ошибки», пока не останется пусто.</li>
            <li>Open Questions: напишите ответы и сравните с образцом.</li>
            <li>Mock Exam ×3 за последние 2–3 дня до экзамена.</li>
          </ol>
        </Card>
      </div>

      <div className="text-center">
        <button
          type="button"
          className="text-xs text-slate-600 hover:text-rose-300"
          onClick={() => {
            if (window.confirm('Сбросить весь прогресс? Это действие нельзя отменить.')) resetAll();
          }}
        >
          Сбросить прогресс
        </button>
      </div>
    </div>
  );
}
