import { Fragment, type ReactNode } from 'react';

/**
 * Мини-разметка для текстов уроков: **bold**, `code`, *italic*, переносы строк.
 * Без dangerouslySetInnerHTML — безопасно.
 */
const TOKEN = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g;

function renderInline(text: string, keyBase: string): ReactNode[] {
  return text.split(TOKEN).map((part, i) => {
    const key = `${keyBase}-${i}`;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={key} className="font-semibold text-slate-50">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={key} className="rounded bg-slate-800/80 px-1.5 py-0.5 font-mono text-[0.88em] text-amber-200">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={key} className="text-slate-300">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

interface MarkupProps {
  text: string;
  className?: string;
}

export function Markup({ text, className }: MarkupProps) {
  const lines = text.split('\n');
  return (
    <span className={className}>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {renderInline(line, String(i))}
          {i < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </span>
  );
}
