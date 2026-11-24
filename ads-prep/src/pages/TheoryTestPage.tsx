import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/Layout';
import { McqCard } from '../components/McqCard';
import { Button, Card, ProgressBar } from '../components/ui/primitives';
import { MODULES } from '../content';
import { MCQ_BANK } from '../data/questionBank';
import { useProgress } from '../lib/progress';
import { TOPIC_NAMES, type MCQ, type TopicId } from '../types';

const CATS: { id: MCQ['category'] | 'all'; label: string }[] = [
  { id: 'all', label: 'Все категории' },
  { id: 'definition', label: 'Определения' },
  { id: 'principle', label: 'Принципы работы' },
  { id: 'comparison', label: 'Сравнение' },
  { id: 'proscons', label: 'Плюсы/минусы' },
  { id: 'time', label: 'Time Complexity' },
  { id: 'space', label: 'Space Complexity' },
  { id: 'why-how', label: 'Why / How' },
  { id: 'code', label: 'Код' },
];

/** Детерминированное перемешивание (Mulberry32). */
export function shuffled<T>(arr: readonly T[], seed: number): T[] {
  let a = seed >>> 0;
  const rnd = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const res = [...arr];
  for (let i = res.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [res[i], res[j]] = [res[j], res[i]];
  }
  return res;
}

export function TheoryTestPage() {
  const [params, setParams] = useSearchParams();
  const { state, recordMcq } = useProgress();
  const mod = params.get('module') ?? 'all';
  const topic = (params.get('topic') ?? 'all') as TopicId | 'all';
  const cat = params.get('cat') ?? 'all';
  const onlyWrong = params.get('wrong') === '1';
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const [pos, setPos] = useState(0);
  const [session, setSession] = useState<Record<string, number>>({});

  const list = useMemo(() => {
    const filtered = MCQ_BANK.filter(
      (q) =>
        (mod === 'all' || q.module === mod) &&
        (topic === 'all' || q.topic === topic) &&
        (cat === 'all' || q.category === cat) &&
        (!onlyWrong || (state.mcq[q.id] && !state.mcq[q.id].solved) || (state.mcq[q.id]?.wrong ?? 0) > 0),
    );
    return shuffled(filtered, seed);
    // state.mcq намеренно не в зависимостях: список не должен перестраиваться после каждого ответа
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mod, topic, cat, onlyWrong, seed]);

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v === 'all' || v === '') next.delete(k);
    else next.set(k, v);
    if (k === 'module') next.delete('topic');
    setParams(next);
    setPos(0);
    setSession({});
  };

  const topicsForModule = (Object.keys(TOPIC_NAMES) as TopicId[]).filter((t) => mod === 'all' || MCQ_BANK.some((q) => q.module === mod && q.topic === t));
  const q = list[Math.min(pos, list.length - 1)];
  const answered = Object.keys(session).length;
  const right = list.filter((x) => session[x.id] === x.correct).length;

  return (
    <div>
      <PageHeader
        title="Theory Test"
        subtitle={`База из ${MCQ_BANK.length} вопросов с четырьмя вариантами: определения, принципы, сравнения, сложность, Why/How. Правильный ответ скрыт, пока вы не выберете вариант; после выбора — подробное объяснение.`}
      />
      <Card className="mb-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">
            <span className="mb-1 block text-xs text-slate-400">Модуль</span>
            <select value={mod} onChange={(e) => set('module', e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100">
              <option value="all">Все модули</option>
              {MODULES.map((m) => (
                <option key={m.id} value={m.id}>
                  M{m.number}: {m.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-slate-400">Тема</span>
            <select value={topic} onChange={(e) => set('topic', e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100">
              <option value="all">Все темы</option>
              {topicsForModule.map((t) => (
                <option key={t} value={t}>
                  {TOPIC_NAMES[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-slate-400">Категория</span>
            <select value={cat} onChange={(e) => set('cat', e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100">
              {CATS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm text-slate-300">
            <input type="checkbox" checked={onlyWrong} onChange={(e) => set('wrong', e.target.checked ? '1' : '')} className="h-4 w-4 accent-indigo-500" />
            Только вопросы с ошибками
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-400">
          <span>
            В подборке: <b className="text-slate-200">{list.length}</b>
          </span>
          <span>
            Отвечено в сессии: <b className="text-slate-200">{answered}</b>, верно: <b className="text-emerald-300">{right}</b>
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSeed(Math.floor(Math.random() * 1e9));
              setPos(0);
              setSession({});
            }}
          >
            🔀 Перемешать заново
          </Button>
        </div>
      </Card>

      {list.length === 0 ? (
        <Card>
          <div className="text-slate-300">{onlyWrong ? 'Нет вопросов с ошибками по этим фильтрам — отлично! 🎉' : 'Нет вопросов по выбранным фильтрам.'}</div>
        </Card>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-3">
            <ProgressBar value={(100 * (pos + 1)) / list.length} />
            <span className="whitespace-nowrap font-mono text-xs text-slate-400">
              {pos + 1} / {list.length}
            </span>
          </div>
          <McqCard
            key={q.id}
            q={q}
            index={pos}
            chosen={session[q.id]}
            revealed={session[q.id] !== undefined}
            onChoose={(c) => {
              setSession((s) => ({ ...s, [q.id]: c }));
              recordMcq(q.id, c === q.correct, c);
            }}
          />
          <div className="mt-4 flex justify-between">
            <Button variant="secondary" disabled={pos === 0} onClick={() => setPos((p) => p - 1)}>
              ← Назад
            </Button>
            {pos < list.length - 1 ? (
              <Button onClick={() => setPos((p) => p + 1)}>Следующий вопрос →</Button>
            ) : (
              <span className="self-center text-sm text-slate-400">
                Подборка закончена: {right}/{list.length} верно ({Math.round((100 * right) / list.length)}%)
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
