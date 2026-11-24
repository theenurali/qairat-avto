import { useState } from 'react';
import type { OpenQuestion } from '../types';
import { TOPIC_NAMES } from '../types';
import { Markup } from './ui/Markup';
import { Badge, Button } from './ui/primitives';

/** Какие ключевые пункты, вероятно, упомянуты (по ключевым словам). Это только подсказка! */
export function detectKeyPoints(q: OpenQuestion, answer: string): boolean[] {
  const a = answer.toLowerCase();
  return q.keyPoints.map((kp) => kp.keywords.some((k) => k && a.includes(k.toLowerCase())));
}

export function OpenStatement({ q, index }: { q: OpenQuestion; index?: number }) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {index !== undefined && <span className="font-mono text-xs text-slate-500">#{index + 1}</span>}
        <Badge tone="indigo">{TOPIC_NAMES[q.topic]}</Badge>
        <Badge>Open Question</Badge>
      </div>
      <div className="text-lg font-semibold text-white">{q.en}</div>
      <div className="mt-1 text-sm text-slate-400">🇷🇺 {q.ru}</div>
    </div>
  );
}

interface ReviewProps {
  q: OpenQuestion;
  answer: string;
  checked: boolean[];
  onToggle?: (i: number) => void;
}

/** Образцовый ответ + чек-лист ключевых пунктов для самооценки. */
export function OpenReview({ q, answer, checked, onToggle }: ReviewProps) {
  const auto = detectKeyPoints(q, answer);
  const score = checked.filter(Boolean).length;
  return (
    <div className="mt-4 space-y-4 animate-fadeup">
      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
        <div className="mb-2 text-sm font-semibold text-emerald-300">📗 Пример хорошего ответа</div>
        <div className="text-sm leading-7 text-slate-300">
          <Markup text={q.model} />
        </div>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
        <div className="mb-1 text-sm font-semibold text-indigo-300">✅ Ключевые моменты — что обязательно должно быть в ответе</div>
        <div className="mb-3 text-xs text-slate-500">
          Отметьте пункты, которые действительно есть в вашем ответе. Значок 🔎 — автоматическая подсказка по ключевым словам (может ошибаться, решаете вы).
        </div>
        <ul className="space-y-2">
          {q.keyPoints.map((kp, i) => (
            <li key={i}>
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <input type="checkbox" checked={checked[i] ?? false} disabled={!onToggle} onChange={() => onToggle?.(i)} className="mt-1 h-4 w-4 accent-emerald-500" />
                <span className={checked[i] ? 'text-slate-100' : 'text-slate-400'}>
                  <Markup text={kp.text} />
                  {auto[i] && <span className="ml-2 text-xs text-sky-300">🔎 похоже, упомянуто</span>}
                </span>
              </label>
            </li>
          ))}
        </ul>
        <div className="mt-3 text-sm text-slate-300">
          Самооценка: <b>{score}</b> / {q.keyPoints.length}
        </div>
      </div>
    </div>
  );
}

interface CardProps {
  q: OpenQuestion;
  index?: number;
  initialAnswer?: string;
  initialChecked?: boolean[];
  onSave: (answer: string, checked: boolean[]) => void;
}

export function OpenQuestionCard({ q, index, initialAnswer = '', initialChecked, onSave }: CardProps) {
  const [answer, setAnswer] = useState(initialAnswer);
  const [revealed, setRevealed] = useState(Boolean(initialChecked));
  const [checked, setChecked] = useState<boolean[]>(initialChecked ?? q.keyPoints.map(() => false));

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <OpenStatement q={q} index={index} />
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onBlur={() => onSave(answer, revealed ? checked : [])}
        rows={5}
        placeholder="Напишите ответ своими словами (можно на русском, термины — на английском)…"
        className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-slate-100 outline-none focus:border-indigo-400"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {!revealed ? (
          <Button
            onClick={() => {
              const auto = detectKeyPoints(q, answer);
              setChecked(auto);
              setRevealed(true);
              onSave(answer, auto);
            }}
            disabled={answer.trim().length < 10}
          >
            Сравнить с образцом
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => setRevealed(false)}>
            Скрыть образец
          </Button>
        )}
        <span className="text-xs text-slate-500">{answer.trim().split(/\s+/).filter(Boolean).length} слов</span>
      </div>
      {revealed && (
        <OpenReview
          q={q}
          answer={answer}
          checked={checked}
          onToggle={(i) => {
            const next = checked.map((c, j) => (j === i ? !c : c));
            setChecked(next);
            onSave(answer, next);
          }}
        />
      )}
    </div>
  );
}
