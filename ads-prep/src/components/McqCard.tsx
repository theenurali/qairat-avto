import type { MCQ } from '../types';
import { TOPIC_NAMES } from '../types';
import { CodeBlock } from './ui/CodeBlock';
import { Markup } from './ui/Markup';
import { Badge } from './ui/primitives';

const LETTERS = ['A', 'B', 'C', 'D'];

const CATEGORY_RU: Record<MCQ['category'], string> = {
  definition: 'Определение',
  principle: 'Принцип работы',
  comparison: 'Сравнение',
  proscons: 'Плюсы и минусы',
  time: 'Time Complexity',
  space: 'Space Complexity',
  'why-how': 'Why / How',
  code: 'Код',
};

interface McqCardProps {
  q: MCQ;
  index?: number;
  /** Выбранный вариант (или undefined). */
  chosen?: number;
  /** Показывать ли правильный ответ и объяснение. */
  revealed: boolean;
  onChoose: (choice: number) => void;
  /** Можно ли менять выбор (в mock exam до сдачи — да). */
  locked?: boolean;
}

export function McqCard({ q, index, chosen, revealed, onChoose, locked }: McqCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {index !== undefined && <span className="font-mono text-xs text-slate-500">#{index + 1}</span>}
        <Badge tone="indigo">{TOPIC_NAMES[q.topic]}</Badge>
        <Badge>{CATEGORY_RU[q.category]}</Badge>
      </div>
      <div className="text-[15px] font-medium leading-relaxed text-slate-100">
        <Markup text={q.question} />
      </div>
      {q.code && <CodeBlock code={q.code} />}
      <div className="mt-4 grid gap-2">
        {q.options.map((opt, i) => {
          const isChosen = chosen === i;
          const isCorrect = q.correct === i;
          let cls = 'border-slate-700 bg-slate-800/40 hover:border-indigo-400/60 hover:bg-slate-800';
          if (revealed) {
            if (isCorrect) cls = 'border-emerald-500/70 bg-emerald-500/10';
            else if (isChosen) cls = 'border-rose-500/70 bg-rose-500/10';
            else cls = 'border-slate-800 bg-slate-900/40 opacity-70';
          } else if (isChosen) cls = 'border-indigo-400 bg-indigo-500/15';
          return (
            <button
              key={i}
              type="button"
              disabled={locked || revealed}
              onClick={() => onChoose(i)}
              className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors disabled:cursor-default ${cls}`}
            >
              <span
                className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md font-mono text-xs ${
                  revealed && isCorrect ? 'bg-emerald-500 text-white' : revealed && isChosen ? 'bg-rose-500 text-white' : isChosen ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {LETTERS[i]}
              </span>
              <span className="flex-1 text-slate-200">
                <Markup text={opt} />
                {revealed && q.optionNotes && (isChosen || isCorrect) && (
                  <span className="mt-1 block text-xs text-slate-400">
                    <Markup text={q.optionNotes[i]} />
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      {revealed && (
        <div className={`mt-4 rounded-xl border-l-4 p-4 text-sm leading-relaxed ${chosen === q.correct ? 'border-emerald-500 bg-emerald-500/10' : 'border-rose-500 bg-rose-500/10'}`}>
          <div className="mb-1 font-semibold text-slate-100">
            {chosen === undefined ? `Правильный ответ: ${LETTERS[q.correct]}` : chosen === q.correct ? '✅ Верно!' : `❌ Неверно. Правильный ответ: ${LETTERS[q.correct]}`}
          </div>
          <div className="text-slate-300">
            <Markup text={q.explanation} />
          </div>
        </div>
      )}
    </div>
  );
}
