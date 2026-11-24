import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/layout/Layout';
import { Badge, Card } from '../../components/ui/primitives';
import { MOCK_EXAMS, SECTION_NAMES, maxScore } from '../../data/mockExams';
import { fmtTime } from '../../lib/mockGrading';
import { useProgress } from '../../lib/progress';

export function MockHome() {
  const { state } = useProgress();
  const session = state.mockSession;
  return (
    <div>
      <PageHeader
        title="Final Mock Exam"
        subtitle="Полноценный симулятор: 60 минут, все 4 формата из объявления преподавателя (Multiple Choice, Tracing, Counterexample, Open Questions) и все 4 модуля. Таймер продолжает идти даже после обновления страницы."
      />
      {session && (
        <Card className="mb-6 border-amber-500/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-amber-300">⏳ У вас есть незавершённый экзамен</div>
              <div className="text-sm text-slate-400">{MOCK_EXAMS.find((e) => e.id === session.examId)?.title}</div>
            </div>
            <Link to={`/mock/${session.examId}`} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400">
              Продолжить
            </Link>
          </div>
        </Card>
      )}
      <div className="grid gap-5 lg:grid-cols-3">
        {MOCK_EXAMS.map((e) => {
          const results = state.mockResults.filter((r) => r.examId === e.id);
          const best = results.reduce((b, r) => Math.max(b, r.score / r.max), 0);
          const counts = (['mcq', 'tracing', 'cx', 'open'] as const).map((k) => ({ k, n: e.items.filter((i) => i.kind === k).length, pts: e.items.filter((i) => i.kind === k).reduce((s, i) => s + i.points, 0) }));
          return (
            <Card key={e.id} className="flex flex-col">
              <div className="text-lg font-bold text-white">{e.title}</div>
              <p className="mt-1 flex-1 text-sm text-slate-400">{e.description}</p>
              <ul className="mt-4 space-y-1 text-sm text-slate-300">
                {counts.map((c) => (
                  <li key={c.k} className="flex justify-between">
                    <span>{SECTION_NAMES[c.k]}</span>
                    <span className="font-mono text-slate-400">
                      {c.n} × · {c.pts} б.
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <Badge tone="indigo">{e.minutes} минут</Badge>
                <Badge>{maxScore(e)} баллов</Badge>
                {results.length > 0 && <Badge tone="emerald">лучший: {Math.round(best * 100)}%</Badge>}
              </div>
              <Link to={`/mock/${e.id}`} className="mt-4 rounded-lg bg-indigo-500 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-400">
                {session?.examId === e.id ? 'Продолжить экзамен' : results.length ? 'Пройти ещё раз' : 'Начать'}
              </Link>
            </Card>
          );
        })}
      </div>

      <h2 className="mt-10 mb-3 text-lg font-semibold text-white">История попыток</h2>
      {state.mockResults.length === 0 ? (
        <Card>
          <div className="text-sm text-slate-400">Пока нет завершённых экзаменов. Рекомендуем начать после прохождения всех 4 модулей.</div>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-slate-800/60 text-left text-slate-300">
              <tr>
                <th className="px-4 py-2">Дата</th>
                <th className="px-4 py-2">Вариант</th>
                <th className="px-4 py-2">Баллы</th>
                <th className="px-4 py-2">Время</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {state.mockResults
                .map((r, idx) => ({ r, idx }))
                .reverse()
                .map(({ r, idx }) => (
                  <tr key={idx} className="border-t border-slate-800">
                    <td className="px-4 py-2 text-slate-400">{new Date(r.finishedAt).toLocaleString('ru-RU')}</td>
                    <td className="px-4 py-2 text-slate-200">{MOCK_EXAMS.find((e) => e.id === r.examId)?.title ?? r.examId}</td>
                    <td className="px-4 py-2 font-mono text-slate-100">
                      {r.score}/{r.max} ({Math.round((100 * r.score) / r.max)}%)
                    </td>
                    <td className="px-4 py-2 font-mono text-slate-400">{fmtTime(r.finishedAt - r.startedAt)}</td>
                    <td className="px-4 py-2 text-right">
                      <Link to={`/mock/result/${idx}`} className="text-indigo-300 hover:text-indigo-200">
                        Разбор →
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
