import type { ReactNode } from 'react';

const KEYWORDS = new Set([
  'def', 'return', 'if', 'elif', 'else', 'for', 'while', 'in', 'not', 'and', 'or', 'is', 'None', 'True', 'False',
  'break', 'continue', 'import', 'from', 'class', 'pass', 'lambda', 'yield', 'with', 'as', 'try', 'except', 'raise',
  'global', 'nonlocal', 'del',
]);
const BUILTINS = new Set(['len', 'range', 'print', 'set', 'list', 'dict', 'ord', 'chr', 'append', 'pop', 'popleft', 'deque', 'enumerate', 'reversed', 'sorted', 'min', 'max', 'abs', 'hash', 'add', 'remove', 'sum', 'any', 'all', 'zip']);

const TOKEN_RE = /(#.*$|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\b\d+\b|\b[A-Za-z_][A-Za-z0-9_]*\b|\s+|.)/g;

function highlightLine(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let m: RegExpExecArray | null;
  let i = 0;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(line)) !== null) {
    const t = m[0];
    if (t === '') break;
    let cls = '';
    if (t.startsWith('#')) cls = 'text-slate-500 italic';
    else if (t.startsWith("'") || t.startsWith('"')) cls = 'text-emerald-300';
    else if (/^\d+$/.test(t)) cls = 'text-orange-300';
    else if (KEYWORDS.has(t)) cls = 'text-fuchsia-400';
    else if (BUILTINS.has(t)) cls = 'text-sky-300';
    out.push(
      <span key={i++} className={cls || undefined}>
        {t}
      </span>,
    );
  }
  return out;
}

interface CodeBlockProps {
  code: string;
  caption?: string;
  /** Номера строк (1-based) для подсветки. */
  highlight?: number[];
  /** Красная подсветка (например строка с ошибкой). */
  danger?: number[];
  explain?: { line: number; text: string }[];
}

export function CodeBlock({ code, caption, highlight = [], danger = [], explain }: CodeBlockProps) {
  const lines = code.replace(/\n$/, '').split('\n');
  return (
    <figure className="my-4 min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-800 bg-[#0b1020]">
      {caption && (
        <figcaption className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/60 px-4 py-2 text-xs text-slate-400">
          <span className="inline-block h-2 w-2 rounded-full bg-sky-400" /> {caption}
          <span className="ml-auto font-mono text-slate-500">Python</span>
        </figcaption>
      )}
      <pre className="overflow-x-auto py-3 text-[13px] leading-6">
        <code className="font-mono">
          {lines.map((line, idx) => {
            const n = idx + 1;
            const bg = danger.includes(n)
              ? 'bg-rose-500/15 border-l-2 border-rose-400'
              : highlight.includes(n)
                ? 'bg-indigo-500/15 border-l-2 border-indigo-400'
                : 'border-l-2 border-transparent';
            return (
              <div key={idx} className={`flex pr-4 ${bg}`}>
                <span className="w-10 shrink-0 select-none pr-3 text-right text-slate-600">{n}</span>
                <span className="whitespace-pre text-slate-200">{highlightLine(line)}</span>
              </div>
            );
          })}
        </code>
      </pre>
      {explain && explain.length > 0 && (
        <div className="border-t border-slate-800 bg-slate-900/40 px-4 py-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Разбор по строкам</div>
          <ul className="space-y-1.5 text-sm">
            {explain.map((e) => (
              <li key={e.line} className="flex gap-3">
                <span className="mt-0.5 shrink-0 rounded bg-slate-800 px-1.5 font-mono text-xs text-sky-300">стр. {e.line}</span>
                <span className="text-slate-300">{e.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </figure>
  );
}
