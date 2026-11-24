import { Link, useParams } from 'react-router-dom';
import { CxOutcome } from '../../components/CxTaskView';
import { McqCard } from '../../components/McqCard';
import { OpenReview, OpenStatement } from '../../components/OpenQuestionCard';
import { ResultBreakdown, TracingStatement } from '../../components/TracingTaskView';
import { CodeBlock } from '../../components/ui/CodeBlock';
import { Markup } from '../../components/ui/Markup';
import { Badge, Callout, Card, ProgressBar } from '../../components/ui/primitives';
import { ALL_LESSONS } from '../../content';
import { SECTION_NAMES, getMock, type MockItem } from '../../data/mockExams';
import { checkAnswer } from '../../lib/answer';
import { fmtTime } from '../../lib/mockGrading';
import { useProgress, type MockAnswer, type MockResult as Result } from '../../lib/progress';
import { TOPIC_NAMES, type TopicId } from '../../types';

function grade(pct: number): { label: string; color: string } {
  if (pct >= 90) return { label: 'Отлично (A)', color: '#10b981' };
  if (pct >= 75) return { label: 'Хорошо (B)', color: '#22c55e' };
  if (pct >= 60) return { label: 'Удовлетворительно (C)', color: '#f59e0b' };
  return { label: 'Нужно подтянуть', color: '#f43f5e' };
}

function ItemReview({ item, ans, got, checks }: { item: MockItem; ans: MockAnswer | undefined; got: number; checks: boolean[] }) {
  const header = (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <Badge tone={got === item.points ? 'emerald' : got > 0 ? 'amber' : 'rose'}>
        {got}/{item.points} б.
      </Badge>
      <Badge>{SECTION_NAMES[item.kind]}</Badge>
      <Badge tone="indigo">{TOPIC_NAMES[item.topic]}</Badge>
    </div>
  );
  switch (item.kind) {
    case 'mcq':
      return (
        <div>
          {header}
          <McqCard q={item.q} chosen={ans?.choice} revealed onChoose={() => undefined} locked />
          {ans?.choice === undefined && <div className="mt-2 text-sm text-rose-300">Ответ не дан.</div>}
        </div>
      );
    case 'tracing':
      return (
        <Card>
          {header}
          <TracingStatement task={item.task} />
          <div className="mt-3 text-sm text-slate-400">
            Ваш ответ: <span className="font-mono text-slate-100">{ans?.text?.trim() || '(нет ответа)'}</span>
          </div>
          <ResultBreakdown task={item.task} result={checkAnswer(ans?.text ?? '', item.task.expected, item.task.compare)} />
        </Card>
      );
    case 'cx': {
      const r = ans?.fields ? item.task.evaluate(ans.fields) : null;
      return (
        <Card>
          {header}
          <div className="text-lg font-semibold text-white">🐞 {item.task.title}</div>
          <CodeBlock code={item.task.buggyCode} danger={[item.task.bugLine]} caption={`Ошибка в строке ${item.task.bugLine}`} />
          <div className="text-sm text-slate-400">
            Ваши данные:{' '}
            <span className="font-mono text-slate-100">
              {ans?.fields ? Object.entries(ans.fields).filter(([, v]) => v.trim()).map(([k, v]) => `${k} = ${v}`).join('; ') || '(пусто)' : '(нет ответа)'}
            </span>
          </div>
          {r && <CxOutcome r={r} />}
          <Callout kind="note" title="Разбор">
            <div className="mb-2 font-mono text-xs text-slate-400">
              Эталон: {Object.entries(item.task.sample).filter(([, x]) => x).map(([k, x]) => `${k} = ${x}`).join('; ')}
            </div>
            <Markup text={item.task.explanation} />
          </Callout>
        </Card>
      );
    }
    case 'open':
      return (
        <Card>
          {header}
          <OpenStatement q={item.q} />
          <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm whitespace-pre-wrap text-slate-300">{ans?.text?.trim() || '(нет ответа)'}</div>
          <OpenReview q={item.q} answer={ans?.text ?? ''} checked={checks} />
        </Card>
      );
  }
}

function topicBreakdown(r: Result) {
  const map = new Map<TopicId, { got: number; max: number }>();
  for (const it of r.items) {
    const t = it.topic as TopicId;
    const cur = map.get(t) ?? { got: 0, max: 0 };
    map.set(t, { got: cur.got + it.got, max: cur.max + it.max });
  }
  return [...map.entries()].map(([topic, v]) => ({ topic, ...v, pct: v.max ? Math.round((100 * v.got) / v.max) : 0 }));
}

export function MockResultPage() {
  const { idx = '' } = useParams();
  const { state } = useProgress();
  const r = state.mockResults[Number(idx)];
  const exam = r ? getMock(r.examId) : undefined;
  if (!r || !exam) return <div className="text-slate-300">Результат не найден. <Link to="/mock" className="text-indigo-300">К Mock Exams</Link></div>;

  const pct = Math.round((100 * r.score) / r.max);
  const g = grade(pct);
  const full = r.items.filter((i) => i.got === i.max).length;
  const topics = topicBreakdown(r).sort((a, b) => a.pct - b.pct);
  const weak = topics.filter((t) => t.pct < 60);
  const sections = (['mcq', 'tracing', 'cx', 'open'] as const).map((k) => {
    const ids = new Set(exam.items.filter((i) => i.kind === k).map((i) => i.id));
    const its = r.items.filter((i) => ids.has(i.itemId));
    return { k, got: its.reduce((s, i) => s + i.got, 0), max: its.reduce((s, i) => s + i.max, 0) };
  });
  const mistakes = exam.items.filter((it) => (r.items.find((x) => x.itemId === it.id)?.got ?? 0) < it.points);

  return (
    <div>
      <Link to="/mock" className="text-sm text-slate-400 hover:text-slate-200">
        ← Mock Exams
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">Результат: {exam.title}</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-2">
          <div className="text-sm text-slate-400">Общий результат</div>
          <div className="mt-1 flex items-end gap-3">
            <span className="text-5xl font-bold text-white">{pct}%</span>
            <span className="pb-2 font-mono text-slate-300">
              {r.score} / {r.max} баллов
            </span>
          </div>
          <div className="mt-2 font-semibold" style={{ color: g.color }}>
            {g.label}
          </div>
          <ProgressBar value={pct} color={g.color} className="mt-3" />
        </Card>
        <Card>
          <div className="text-sm text-slate-400">Полностью верных заданий</div>
          <div className="mt-1 text-3xl font-bold text-white">
            {full} / {exam.items.length}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-slate-400">Затрачено времени</div>
          <div className="mt-1 font-mono text-3xl font-bold text-white">{fmtTime(r.finishedAt - r.startedAt)}</div>
          <div className="text-xs text-slate-500">из {exam.minutes}:00</div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-white">По форматам</h2>
          <div className="space-y-3">
            {sections.map((s) => (
              <div key={s.k}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-300">{SECTION_NAMES[s.k]}</span>
                  <span className="font-mono text-slate-400">
                    {s.got}/{s.max}
                  </span>
                </div>
                <ProgressBar value={s.max ? (100 * s.got) / s.max : 0} />
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold text-white">По темам</h2>
          <div className="space-y-3">
            {topics.map((t) => (
              <div key={t.topic}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-300">{TOPIC_NAMES[t.topic]}</span>
                  <span className="font-mono text-slate-400">{t.pct}%</span>
                </div>
                <ProgressBar value={t.pct} color={t.pct >= 75 ? '#10b981' : t.pct >= 60 ? '#f59e0b' : '#f43f5e'} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="mb-2 font-semibold text-white">🎯 Что повторить</h2>
        {weak.length === 0 ? (
          <div className="text-sm text-slate-300">Слабых тем (ниже 60%) нет. Для закрепления пройдите другой вариант Mock Exam и задачи на контрпримеры.</div>
        ) : (
          <ul className="space-y-3">
            {weak.map((t) => {
              const lessons = ALL_LESSONS.filter((x) => x.lesson.topic === t.topic);
              return (
                <li key={t.topic} className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 text-sm">
                  <div className="font-semibold text-rose-200">
                    {TOPIC_NAMES[t.topic]} — {t.pct}%
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {lessons.map(({ lesson }) => (
                      <Link key={lesson.id} to={`/lesson/${lesson.id}`} className="rounded-md bg-slate-800 px-2 py-1 text-slate-200 hover:bg-slate-700">
                        📖 {lesson.title}
                      </Link>
                    ))}
                    <Link to={`/tracing?module=${lessons[0]?.module.id ?? ''}`} className="rounded-md bg-slate-800 px-2 py-1 text-slate-200 hover:bg-slate-700">
                      🔍 Tracing по модулю
                    </Link>
                    <Link to={`/theory?topic=${t.topic}`} className="rounded-md bg-slate-800 px-2 py-1 text-slate-200 hover:bg-slate-700">
                      ✅ Тест по теме
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <h2 className="mt-10 mb-4 text-xl font-bold text-white">Разбор ошибок ({mistakes.length})</h2>
      <div className="space-y-6">
        {mistakes.map((it) => (
          <ItemReview key={it.id} item={it} ans={r.answers[it.id]} got={r.items.find((x) => x.itemId === it.id)?.got ?? 0} checks={r.openChecks[it.id] ?? []} />
        ))}
        {mistakes.length === 0 && <Callout kind="success">Все задания решены полностью — превосходно!</Callout>}
      </div>
      <details className="mt-10">
        <summary className="cursor-pointer text-sm text-slate-400 hover:text-slate-200">Показать разбор всех заданий, включая верные</summary>
        <div className="mt-4 space-y-6">
          {exam.items
            .filter((it) => !mistakes.includes(it))
            .map((it) => (
              <ItemReview key={it.id} item={it} ans={r.answers[it.id]} got={r.items.find((x) => x.itemId === it.id)?.got ?? 0} checks={r.openChecks[it.id] ?? []} />
            ))}
        </div>
      </details>
    </div>
  );
}
