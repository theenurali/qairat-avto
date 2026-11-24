import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BlockRenderer } from '../components/BlockRenderer';
import { McqCard } from '../components/McqCard';
import { Badge, Button, Card } from '../components/ui/primitives';
import { ALL_LESSONS, findLesson } from '../content';
import { useProgress } from '../lib/progress';
import { TOPIC_NAMES, type Lesson } from '../types';

function MiniExam({ lesson }: { lesson: Lesson }) {
  const { completeLesson, recordMcq, state } = useProgress();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const qs = lesson.miniExam;
  const score = qs.filter((q) => answers[q.id] === q.correct).length;
  const allAnswered = qs.every((q) => answers[q.id] !== undefined);
  const prev = state.lessonsCompleted[lesson.id];

  useEffect(() => {
    setAnswers({});
    setSubmitted(false);
  }, [lesson.id]);

  const submit = () => {
    setSubmitted(true);
    for (const q of qs) recordMcq(q.id, answers[q.id] === q.correct, answers[q.id]);
    completeLesson(lesson.id, score, qs.length);
  };

  return (
    <section id="mini-exam" className="mt-12">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-white">🎓 Мини-экзамен по теме</h2>
        {prev && (
          <Badge tone="emerald">
            Лучший результат: {prev.score}/{prev.total}
          </Badge>
        )}
      </div>
      <p className="mb-5 text-sm text-slate-400">
        Ответьте на все {qs.length} вопросов и нажмите «Проверить». Правильные ответы скрыты до проверки. Урок считается пройденным после сдачи мини-экзамена.
      </p>
      <div className="space-y-4">
        {qs.map((q, i) => (
          <McqCard key={q.id} q={q} index={i} chosen={answers[q.id]} revealed={submitted} onChoose={(c) => setAnswers((a) => ({ ...a, [q.id]: c }))} />
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {!submitted ? (
          <Button onClick={submit} disabled={!allAnswered}>
            Проверить ({Object.keys(answers).length}/{qs.length})
          </Button>
        ) : (
          <>
            <Card className={`flex-1 ${score / qs.length >= 0.7 ? 'border-emerald-500/40' : 'border-amber-500/40'}`}>
              <div className="text-lg font-semibold text-white">
                Результат: {score} / {qs.length} ({Math.round((100 * score) / qs.length)}%)
              </div>
              <div className="mt-1 text-sm text-slate-400">
                {score / qs.length >= 0.7
                  ? 'Отлично! Тема усвоена. Закрепите её в Tracing Practice.'
                  : 'Перечитайте разделы, где были ошибки (объяснения выше), и попробуйте снова.'}
              </div>
            </Card>
            <Button
              variant="secondary"
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
              }}
            >
              Пройти ещё раз
            </Button>
          </>
        )}
      </div>
    </section>
  );
}

export function LessonPage() {
  const { id = '' } = useParams();
  const found = findLesson(id);
  const { openLesson } = useProgress();

  useEffect(() => {
    if (found) openLesson(found.lesson.id);
  }, [found, openLesson]);

  if (!found) {
    return (
      <div className="text-slate-300">
        Урок не найден. <Link to="/path" className="text-indigo-300">К Learning Path</Link>
      </div>
    );
  }
  const { module: m, lesson } = found;
  const idx = ALL_LESSONS.findIndex((x) => x.lesson.id === lesson.id);
  const prev = ALL_LESSONS[idx - 1];
  const next = ALL_LESSONS[idx + 1];

  return (
    <article>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-400">
        <Link to="/path" className="hover:text-slate-200">
          Learning Path
        </Link>
        <span>/</span>
        <Link to={`/module/${m.id}`} className="hover:text-slate-200">
          Module {m.number}
        </Link>
      </div>
      <header className="mb-8 rounded-3xl border border-slate-800 p-6 sm:p-8" style={{ background: `linear-gradient(135deg, ${m.color}22, transparent 60%)` }}>
        <div className="flex flex-wrap gap-2">
          <Badge tone="indigo">{TOPIC_NAMES[lesson.topic]}</Badge>
          <Badge>{lesson.minutes} мин</Badge>
        </div>
        <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">{lesson.title}</h1>
        <p className="mt-2 text-slate-300">{lesson.subtitle}</p>
        <a href="#mini-exam" onClick={(e) => { e.preventDefault(); document.getElementById('mini-exam')?.scrollIntoView({ behavior: 'smooth' }); }} className="mt-4 inline-block text-sm text-indigo-300 hover:text-indigo-200">
          ↓ Перейти к мини-экзамену
        </a>
      </header>

      <BlockRenderer blocks={lesson.blocks} visualizers={m.visualizers} />
      <MiniExam lesson={lesson} />

      <nav className="mt-12 grid gap-3 border-t border-slate-800 pt-6 sm:grid-cols-2">
        {prev ? (
          <Link to={`/lesson/${prev.lesson.id}`} className="rounded-xl border border-slate-800 p-4 hover:border-slate-600">
            <div className="text-xs text-slate-500">← Предыдущий урок</div>
            <div className="text-slate-200">{prev.lesson.title}</div>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={`/lesson/${next.lesson.id}`} className="rounded-xl border border-slate-800 p-4 text-right hover:border-slate-600">
            <div className="text-xs text-slate-500">Следующий урок →</div>
            <div className="text-slate-200">{next.lesson.title}</div>
          </Link>
        ) : (
          <Link to="/mock" className="rounded-xl border border-indigo-500/40 p-4 text-right hover:border-indigo-400">
            <div className="text-xs text-slate-500">Все уроки пройдены →</div>
            <div className="text-slate-200">Final Mock Exam</div>
          </Link>
        )}
      </nav>
    </article>
  );
}
