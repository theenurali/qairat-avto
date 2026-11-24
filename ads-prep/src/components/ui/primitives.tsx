import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Markup } from './Markup';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return <div className={`min-w-0 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/20 ${className}`}>{children}</div>;
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-indigo-500 text-white hover:bg-indigo-400 disabled:bg-indigo-500/40',
  secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700 disabled:opacity-40',
  ghost: 'text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40',
  success: 'bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-40',
  danger: 'bg-rose-500 text-white hover:bg-rose-400 disabled:opacity-40',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md';
}

export function Button({ variant = 'primary', size = 'md', className = '', ...rest }: ButtonProps) {
  const sz = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm';
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed ${sz} ${VARIANTS[variant]} ${className}`}
      {...rest}
    />
  );
}

interface ProgressBarProps {
  value: number; // 0..100
  color?: string;
  className?: string;
}

export function ProgressBar({ value, color = '#6366f1', className = '' }: ProgressBarProps) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-slate-800 ${className}`}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${v}%`, background: color }} />
    </div>
  );
}

interface BadgeProps {
  children: ReactNode;
  tone?: 'slate' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';
}

const TONES = {
  slate: 'bg-slate-800 text-slate-300',
  indigo: 'bg-indigo-500/15 text-indigo-300',
  emerald: 'bg-emerald-500/15 text-emerald-300',
  amber: 'bg-amber-500/15 text-amber-300',
  rose: 'bg-rose-500/15 text-rose-300',
  sky: 'bg-sky-500/15 text-sky-300',
};

export function Badge({ children, tone = 'slate' }: BadgeProps) {
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}>{children}</span>;
}

interface CalloutProps {
  kind: 'note' | 'tip' | 'warning' | 'analogy' | 'success' | 'error';
  title?: string;
  children: ReactNode;
}

const CALLOUT = {
  note: { cls: 'border-sky-500/40 bg-sky-500/5', icon: 'ℹ️', def: 'Заметка' },
  tip: { cls: 'border-emerald-500/40 bg-emerald-500/5', icon: '💡', def: 'Совет' },
  warning: { cls: 'border-amber-500/40 bg-amber-500/5', icon: '⚠️', def: 'Внимание' },
  analogy: { cls: 'border-fuchsia-500/40 bg-fuchsia-500/5', icon: '🧠', def: 'Аналогия из жизни' },
  success: { cls: 'border-emerald-500/50 bg-emerald-500/10', icon: '✅', def: 'Верно' },
  error: { cls: 'border-rose-500/50 bg-rose-500/10', icon: '❌', def: 'Ошибка' },
};

export function Callout({ kind, title, children }: CalloutProps) {
  const c = CALLOUT[kind];
  return (
    <div className={`my-4 rounded-xl border-l-4 p-4 ${c.cls}`}>
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-100">
        <span>{c.icon}</span>
        {title ?? c.def}
      </div>
      <div className="text-[15px] leading-relaxed text-slate-300">{children}</div>
    </div>
  );
}

interface RevealProps {
  label?: string;
  children: ReactNode;
}

export function Reveal({ label = 'Показать ответ', children }: RevealProps) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} className="text-sm font-medium text-indigo-300 hover:text-indigo-200">
        {open ? '▾ Скрыть' : `▸ ${label}`}
      </button>
      {open && <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm leading-relaxed text-slate-300">{children}</div>}
    </div>
  );
}

export function Text({ text }: { text: string }) {
  return <Markup text={text} />;
}

interface StepControlsProps {
  step: number;
  total: number;
  onStep: (n: number) => void;
  playing?: boolean;
  onTogglePlay?: () => void;
}

/** Общие кнопки навигации по шагам визуализаций. */
export function StepControls({ step, total, onStep, playing, onTogglePlay }: StepControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="secondary" onClick={() => onStep(0)} disabled={step === 0}>
        ⏮ В начало
      </Button>
      <Button size="sm" variant="secondary" onClick={() => onStep(step - 1)} disabled={step === 0}>
        ◀ Назад
      </Button>
      {onTogglePlay && (
        <Button size="sm" variant="primary" onClick={onTogglePlay} disabled={total === 0}>
          {playing ? '⏸ Пауза' : '▶ Авто'}
        </Button>
      )}
      <Button size="sm" variant="secondary" onClick={() => onStep(step + 1)} disabled={step >= total - 1}>
        Вперёд ▶
      </Button>
      <span className="ml-1 font-mono text-xs text-slate-400">
        шаг {total === 0 ? 0 : step + 1} / {total}
      </span>
    </div>
  );
}
