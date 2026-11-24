import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CxFields } from '../../components/CxTaskView';
import { McqCard } from '../../components/McqCard';
import { OpenReview, OpenStatement, detectKeyPoints } from '../../components/OpenQuestionCard';
import { TracingStatement } from '../../components/TracingTaskView';
import { CodeBlock } from '../../components/ui/CodeBlock';
import { Markup } from '../../components/ui/Markup';
import { Button, Callout, Card } from '../../components/ui/primitives';
import { SECTION_NAMES, getMock, maxScore, type MockItem } from '../../data/mockExams';
import { fmtTime, gradeExam, isAnswered } from '../../lib/mockGrading';
import { useProgress, type MockAnswer } from '../../lib/progress';

function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function ItemView({ item, ans, onAnswer }: { item: MockItem; ans: MockAnswer | undefined; onAnswer: (a: MockAnswer) => void }) {
  switch (item.kind) {
    case 'mcq':
      return <McqCard q={item.q} chosen={ans?.choice} revealed={false} onChoose={(c) => onAnswer({ choice: c })} />;
    case 'tracing':
      return (
        <Card>
          <TracingStatement task={item.task} />
          <div className="mt-4 mb-1 text-sm font-medium text-slate-200">Ваш ответ</div>
          <div className="mb-2 text-xs text-slate-500">Формат: {item.task.format}</div>
          <textarea
            value={ans?.text ?? ''}
            onChange={(e) => onAnswer({ text: e.target.value })}
            rows={2}
            spellCheck={false}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-slate-100 outline-none focus:border-indigo-400"
          />
        </Card>
      );
    case 'cx':
      return (
        <Card>
          <Callout kind="note" title="Что функция должна делать">
            <Markup text={item.task.goal} />
          </Callout>
          <CodeBlock code={item.task.buggyCode} cpp={item.task.buggyCodeCpp} caption="Код с ошибкой" />
          <div className="mt-3 mb-2 text-sm font-medium text-slate-200">Введите входные данные, на которых этот код выдаёт НЕПРАВИЛЬНЫЙ результат:</div>
          <CxFields task={item.task} values={ans?.fields ?? {}} onChange={(f) => onAnswer({ fields: f })} />
          <div className="mt-2 text-xs text-slate-500">На экзамене нельзя запустить код — проследите его вручную. Проверка будет после сдачи.</div>
        </Card>
      );
    case 'open':
      return (
        <Card>
          <OpenStatement q={item.q} />
          <textarea
            value={ans?.text ?? ''}
            onChange={(e) => onAnswer({ text: e.target.value })}
            rows={7}
            placeholder="Ваш развёрнутый ответ…"
            className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-slate-100 outline-none focus:border-indigo-400"
          />
        </Card>
      );
  }
}

export function MockRunner() {
  const { id = '' } = useParams();
  const exam = getMock(id);
  const navigate = useNavigate();
  const { state, startMock, answerMock, abandonMock, finishMock } = useProgress();
  const now = useNow();
  const [pos, setPos] = useState(0);
  const [phase, setPhase] = useState<'answer' | 'review'>('answer');
  const [checks, setChecks] = useState<Record<string, boolean[]>>({});
  const session = state.mockSession;
  const active = Boolean(exam && session?.examId === exam.id);
  const remaining = exam && session && active ? exam.minutes * 60000 - (now - session.startedAt) : 0;
  const openItems = useMemo(() => exam?.items.filter((i): i is Extract<MockItem, { kind: 'open' }> => i.kind === 'open') ?? [], [exam]);

  const toReview = () => {
    if (!session) return;
    const init: Record<string, boolean[]> = {};
    for (const it of openItems) init[it.id] = detectKeyPoints(it.q, session.answers[it.id]?.text ?? '');
    setChecks(init);
    setPhase('review');
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    if (active && phase === 'answer' && remaining <= 0) toReview();
    // toReview зависит от session, достаточно реагировать на время
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, phase, remaining <= 0]);

  if (!exam) return <div className="text-slate-300">Вариант не найден. <Link to="/mock" className="text-indigo-300">К списку</Link></div>;

  if (!active || !session) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link to="/mock" className="text-sm text-slate-400 hover:text-slate-200">
          ← Mock Exams
        </Link>
        <Card className="mt-4">
          <h1 className="text-2xl font-bold text-white">{exam.title}</h1>
          <p className="mt-2 text-slate-400">{exam.description}</p>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-300">
            <li>Время: <b>{exam.minutes} минут</b>. Таймер стартует сразу и не останавливается (даже при обновлении страницы).</li>
            <li>{exam.items.length} заданий, максимум <b>{maxScore(exam)} баллов</b>. Ответы сохраняются автоматически.</li>
            <li>Правильные ответы НЕ показываются до завершения — как на настоящем экзамене.</li>
            <li>Tracing оценивается с частичными баллами, Counterexample — проверяется запуском кода после сдачи, Open Questions — самооценка по ключевым пунктам.</li>
            <li>Когда время выйдет, экзамен завершится автоматически.</li>
          </ul>
          {session && session.examId !== exam.id && (
            <Callout kind="warning">Сейчас идёт другой экзамен. Начав этот, вы прервёте его без сохранения результата.</Callout>
          )}
          <Button
            className="mt-5"
            onClick={() => {
              startMock(exam.id);
              setPos(0);
              setPhase('answer');
            }}
          >
            ▶ Начать экзамен
          </Button>
        </Card>
      </div>
    );
  }

  const item = exam.items[pos];
  const answeredCount = exam.items.filter((it) => isAnswered(it, session.answers[it.id])).length;
  const low = remaining < 5 * 60000;

  if (phase === 'review') {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white">Самооценка открытых вопросов</h1>
        <p className="mt-2 mb-6 text-slate-400">
          Сравните свои ответы с образцом и честно отметьте раскрытые ключевые пункты (галочки предзаполнены автоподсказкой по ключевым словам). Остальные задания проверяются автоматически.
        </p>
        <div className="space-y-6">
          {openItems.map((it) => (
            <Card key={it.id}>
              <OpenStatement q={it.q} />
              <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm whitespace-pre-wrap text-slate-300">
                {session.answers[it.id]?.text?.trim() || <span className="text-slate-500">(ответ не дан — 0 баллов)</span>}
              </div>
              <OpenReview
                q={it.q}
                answer={session.answers[it.id]?.text ?? ''}
                checked={checks[it.id] ?? []}
                onToggle={(i) => setChecks((c) => ({ ...c, [it.id]: (c[it.id] ?? []).map((x, j) => (j === i ? !x : x)) }))}
              />
            </Card>
          ))}
        </div>
        <Button
          className="mt-6"
          onClick={() => {
            const answeredOpen = Object.fromEntries(openItems.map((it) => [it.id, (session.answers[it.id]?.text ?? '').trim() ? checks[it.id] ?? [] : []]));
            const result = gradeExam(exam, session.startedAt, session.answers, answeredOpen);
            const idx = state.mockResults.length;
            finishMock(result);
            navigate(`/mock/result/${idx}`);
          }}
        >
          Завершить и посмотреть результат →
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-14 z-20 -mx-4 mb-5 border-b border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur lg:top-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-white">{exam.title}</div>
          <div className={`rounded-lg px-3 py-1 font-mono text-lg font-bold ${low ? 'animate-pulse bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-100'}`}>⏱ {fmtTime(remaining)}</div>
          <div className="text-sm text-slate-400">
            Отвечено {answeredCount}/{exam.items.length}
          </div>
          <Button
            size="sm"
            variant="success"
            onClick={() => {
              const left = exam.items.length - answeredCount;
              if (window.confirm(left > 0 ? `Без ответа: ${left}. Завершить экзамен?` : 'Завершить экзамен?')) toReview();
            }}
          >
            Сдать экзамен
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {exam.items.map((it, i) => (
            <button
              key={it.id}
              type="button"
              title={SECTION_NAMES[it.kind]}
              onClick={() => setPos(i)}
              className={`h-8 w-8 rounded-md font-mono text-xs ${i === pos ? 'ring-2 ring-indigo-400' : ''} ${
                isAnswered(it, session.answers[it.id]) ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-semibold text-indigo-300">{SECTION_NAMES[item.kind]}</span>
        <span className="text-slate-400">
          Задание {pos + 1} · {item.points} {item.points === 1 ? 'балл' : 'балла(ов)'}
        </span>
      </div>
      <ItemView key={item.id} item={item} ans={session.answers[item.id]} onAnswer={(a) => answerMock(item.id, a)} />
      <div className="mt-5 flex justify-between">
        <Button variant="secondary" disabled={pos === 0} onClick={() => setPos((p) => p - 1)}>
          ← Назад
        </Button>
        {pos < exam.items.length - 1 ? (
          <Button onClick={() => setPos((p) => p + 1)}>Далее →</Button>
        ) : (
          <Button variant="success" onClick={toReview}>
            Сдать экзамен
          </Button>
        )}
      </div>
      <div className="mt-10 text-center">
        <button
          type="button"
          className="text-xs text-slate-500 hover:text-rose-300"
          onClick={() => {
            if (window.confirm('Прервать экзамен без сохранения результата?')) {
              abandonMock();
              navigate('/mock');
            }
          }}
        >
          Прервать экзамен без результата
        </button>
      </div>
    </div>
  );
}
