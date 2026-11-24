import type { ReactNode } from 'react';

/** Оттенки ячеек для строковых визуализаций (text / pattern / LPS). */
export type CellTone = 'plain' | 'match' | 'mismatch' | 'known' | 'found' | 'muted' | 'new' | 'focus';

const TONE: Record<CellTone, string> = {
  plain: 'border-slate-700 bg-slate-800/80 text-slate-100',
  match: 'border-emerald-400 bg-emerald-500/30 text-emerald-50 ring-2 ring-emerald-400/60',
  mismatch: 'border-rose-400 bg-rose-500/30 text-rose-50 ring-2 ring-rose-400/60',
  known: 'border-cyan-600/70 bg-cyan-500/15 text-cyan-100',
  found: 'border-amber-500/70 bg-amber-500/15 text-amber-100',
  muted: 'border-slate-800 bg-slate-900/40 text-slate-500',
  new: 'border-amber-400 bg-amber-400/25 text-amber-50 ring-2 ring-amber-300/60',
  focus: 'border-indigo-400 bg-indigo-500/25 text-indigo-50',
};

interface CellProps {
  children?: ReactNode;
  tone?: CellTone;
  onClick?: () => void;
  title?: string;
}

/** Квадратная ячейка фиксированной ширины — все строки выравниваются по индексам. */
export function Cell({ children, tone = 'plain', onClick, title }: CellProps) {
  const base = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border font-mono text-sm font-semibold transition-all duration-300';
  if (onClick) {
    return (
      <button type="button" title={title} onClick={onClick} className={`${base} ${TONE[tone]} cursor-pointer hover:brightness-125`}>
        {children}
      </button>
    );
  }
  return (
    <div title={title} className={`${base} ${TONE[tone]}`}>
      {children}
    </div>
  );
}

/** Пустая ячейка-заполнитель (для сдвига pattern). */
export function Blank({ children }: { children?: ReactNode }) {
  return <div className="flex h-8 w-8 shrink-0 items-center justify-center font-mono text-xs text-slate-500">{children}</div>;
}

interface RowProps {
  label: string;
  children: ReactNode;
}

/** Строка с подписью слева. */
export function Row({ label, children }: RowProps) {
  return (
    <div className="flex items-center gap-1">
      <div className="w-16 shrink-0 pr-2 text-right font-mono text-xs text-slate-400">{label}</div>
      {children}
    </div>
  );
}

/** Ряд индексов 0..n-1. */
export function IndexRow({ n, label = 'index' }: { n: number; label?: string }) {
  return (
    <Row label={label}>
      {Array.from({ length: n }, (_, k) => (
        <Blank key={k}>{k}</Blank>
      ))}
    </Row>
  );
}

/** Ряд указателей: в позициях из marks рисуется стрелка с подписью. */
export function PointerRow({ n, marks, label = '' }: { n: number; marks: Record<number, string>; label?: string }) {
  return (
    <Row label={label}>
      {Array.from({ length: n }, (_, k) => (
        <Blank key={k}>
          {marks[k] !== undefined ? <span className="font-bold text-amber-300">{marks[k]}</span> : null}
        </Blank>
      ))}
    </Row>
  );
}

interface StrInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  placeholder?: string;
}

/** Поле ввода строки с ограничением длины. */
export function StrInput({ label, value, onChange, max, placeholder }: StrInputProps) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-slate-400">
      <span>
        {label} <span className="text-slate-600">(до {max} символов)</span>
      </span>
      <input
        value={value}
        maxLength={max}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.replace(/\s+/g, '').slice(0, max))}
        className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-cyan-400"
        spellCheck={false}
      />
    </label>
  );
}
