import type { ReactNode } from 'react';
import { LangToggle, useLang, type CodeLang } from '../../lib/lang';

const PY_KEYWORDS = new Set([
  'def', 'return', 'if', 'elif', 'else', 'for', 'while', 'in', 'not', 'and', 'or', 'is', 'None', 'True', 'False',
  'break', 'continue', 'import', 'from', 'class', 'pass', 'lambda', 'yield', 'with', 'as', 'try', 'except', 'raise',
  'global', 'nonlocal', 'del',
]);
const PY_BUILTINS = new Set(['len', 'range', 'print', 'set', 'list', 'dict', 'ord', 'chr', 'append', 'pop', 'popleft', 'deque', 'enumerate', 'reversed', 'sorted', 'min', 'max', 'abs', 'hash', 'add', 'remove', 'sum', 'any', 'all', 'zip', 'pow']);

const CPP_KEYWORDS = new Set([
  'int', 'long', 'bool', 'char', 'void', 'auto', 'const', 'unsigned', 'double', 'float', 'size_t', 'return', 'if', 'else',
  'for', 'while', 'do', 'break', 'continue', 'true', 'false', 'nullptr', 'struct', 'class', 'public', 'private', 'using',
  'namespace', 'static', 'new', 'delete', 'throw', 'try', 'catch', 'template', 'typename', 'enum', 'include', 'std',
]);
const CPP_BUILTINS = new Set([
  'vector', 'string', 'queue', 'stack', 'deque', 'unordered_set', 'unordered_map', 'set', 'map', 'list', 'pair', 'optional',
  'push_back', 'pop_back', 'push', 'pop', 'front', 'back', 'top', 'empty', 'size', 'insert', 'erase', 'count', 'find',
  'reverse', 'sort', 'begin', 'end', 'rbegin', 'rend', 'cout', 'endl', 'swap', 'max', 'min', 'abs', 'emplace_back', 'clear',
  'nullopt', 'function', 'runtime_error', 'resize', 'assign',
]);

const PY_TOKEN = /(#.*$|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\b\d+\b|\b[A-Za-z_][A-Za-z0-9_]*\b|\s+|.)/g;
const CPP_TOKEN = /(\/\/.*$|#\s*include.*$|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\b\d+\b|\b[A-Za-z_][A-Za-z0-9_]*\b|\s+|.)/g;

function highlightLine(line: string, lang: CodeLang): ReactNode[] {
  const re = lang === 'python' ? PY_TOKEN : CPP_TOKEN;
  const kw = lang === 'python' ? PY_KEYWORDS : CPP_KEYWORDS;
  const bi = lang === 'python' ? PY_BUILTINS : CPP_BUILTINS;
  const out: ReactNode[] = [];
  let m: RegExpExecArray | null;
  let i = 0;
  re.lastIndex = 0;
  while ((m = re.exec(line)) !== null) {
    const t = m[0];
    if (t === '') break;
    let cls = '';
    if (t.startsWith('#') && lang === 'python') cls = 'text-slate-500 italic';
    else if (t.startsWith('//')) cls = 'text-slate-500 italic';
    else if (t.startsWith('#')) cls = 'text-fuchsia-400';
    else if (t.startsWith("'") || t.startsWith('"')) cls = 'text-emerald-300';
    else if (/^\d+$/.test(t)) cls = 'text-orange-300';
    else if (kw.has(t)) cls = 'text-fuchsia-400';
    else if (bi.has(t)) cls = 'text-sky-300';
    out.push(
      <span key={i++} className={cls || undefined}>
        {t}
      </span>,
    );
  }
  return out;
}

interface CodeBlockProps {
  /** Python-версия (всегда есть). */
  code: string;
  /** C++-версия (если есть — показывается переключатель). */
  cpp?: string;
  caption?: string;
  /** Номера строк (1-based) для подсветки — Python / C++. */
  highlight?: number[];
  highlightCpp?: number[];
  /** Красная подсветка (строка с ошибкой) — Python / C++. */
  danger?: number[];
  dangerCpp?: number[];
  explain?: { line: number; text: string }[];
  cppExplain?: { line: number; text: string }[];
}

export function CodeBlock({ code, cpp, caption, highlight = [], highlightCpp = [], danger = [], dangerCpp = [], explain, cppExplain }: CodeBlockProps) {
  const { lang: preferred } = useLang();
  const lang: CodeLang = preferred === 'cpp' && cpp ? 'cpp' : 'python';
  const src = lang === 'cpp' ? cpp! : code;
  const hl = lang === 'cpp' ? highlightCpp : highlight;
  const dg = lang === 'cpp' ? dangerCpp : danger;
  const notes = lang === 'cpp' ? cppExplain : explain;
  const lines = src.replace(/\n$/, '').split('\n');
  return (
    <figure className="my-4 min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-800 bg-[#0b1020]">
      <figcaption className="flex flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-900/60 px-4 py-2 text-xs text-slate-400">
        <span className={`inline-block h-2 w-2 rounded-full ${lang === 'cpp' ? 'bg-violet-400' : 'bg-sky-400'}`} /> {caption ?? 'Код'}
        <span className="ml-auto">{cpp ? <LangToggle size="xs" /> : <span className="font-mono text-slate-500">Python</span>}</span>
      </figcaption>
      <pre className="overflow-x-auto py-3 text-[13px] leading-6">
        <code className="font-mono">
          {lines.map((line, idx) => {
            const n = idx + 1;
            const bg = dg.includes(n)
              ? 'bg-rose-500/15 border-l-2 border-rose-400'
              : hl.includes(n)
                ? 'bg-indigo-500/15 border-l-2 border-indigo-400'
                : 'border-l-2 border-transparent';
            return (
              <div key={idx} className={`flex pr-4 ${bg}`}>
                <span className="w-10 shrink-0 select-none pr-3 text-right text-slate-600">{n}</span>
                <span className="whitespace-pre text-slate-200">{highlightLine(line, lang)}</span>
              </div>
            );
          })}
        </code>
      </pre>
      {notes && notes.length > 0 && (
        <div className="border-t border-slate-800 bg-slate-900/40 px-4 py-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Разбор по строкам</div>
          <ul className="space-y-1.5 text-sm">
            {notes.map((e) => (
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
