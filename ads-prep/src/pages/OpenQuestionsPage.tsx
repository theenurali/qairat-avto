import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/Layout';
import { OpenQuestionCard } from '../components/OpenQuestionCard';
import { Card } from '../components/ui/primitives';
import { OPEN_BANK } from '../data/questionBank';
import { useProgress } from '../lib/progress';
import { ModuleFilter } from './TracingPage';

const TIPS = [
  '**Определение → механизм → сложность → пример.** Такая структура покрывает почти все ключевые пункты.',
  'Называйте термины по-английски: *collision*, *load factor*, *LPS array*, *in-degree*, *visited set*.',
  'Всегда указывайте **Time** и **Space Complexity** и объясняйте, откуда они берутся.',
  'Один маленький пример (3–5 элементов) часто убеждает экзаменатора лучше длинного текста.',
  'Для вопросов «What is the difference…» используйте сравнение по пунктам: структура данных, порядок, применение, сложность.',
];

export function OpenQuestionsPage() {
  const [params] = useSearchParams();
  const mod = params.get('module');
  const { state, saveOpen } = useProgress();
  const list = OPEN_BANK.filter((q) => !mod || q.module === mod);
  return (
    <div>
      <PageHeader
        title="Open Questions"
        subtitle="Открытые вопросы как на экзамене. Вопрос — на английском с переводом. Напишите ответ, затем сравните с образцом и отметьте, какие ключевые моменты вы раскрыли. Ответы сохраняются автоматически."
      />
      <Card className="mb-6">
        <div className="mb-2 font-semibold text-white">✍️ Как писать сильный ответ</div>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300 marker:text-indigo-400">
          {TIPS.map((t, i) => (
            <li key={i}>
              {t.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).map((p, j) =>
                p.startsWith('**') ? <b key={j} className="text-slate-100">{p.slice(2, -2)}</b> : p.startsWith('*') ? <i key={j}>{p.slice(1, -1)}</i> : p,
              )}
            </li>
          ))}
        </ul>
      </Card>
      <ModuleFilter base="/open" />
      <div className="space-y-5">
        {list.map((q, i) => {
          const saved = state.open[q.id];
          return (
            <OpenQuestionCard
              key={q.id}
              q={q}
              index={i}
              initialAnswer={saved?.answer}
              initialChecked={saved && saved.checked.length ? saved.checked : undefined}
              onSave={(answer, checked) => saveOpen(q.id, answer, checked)}
            />
          );
        })}
      </div>
    </div>
  );
}
