import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type CodeLang = 'python' | 'cpp';

export const LANG_LABEL: Record<CodeLang, string> = { python: 'Python', cpp: 'C++' };

const KEY = 'ads-prep-code-lang';

interface LangApi {
  lang: CodeLang;
  setLang: (l: CodeLang) => void;
}

const Ctx = createContext<LangApi>({ lang: 'python', setLang: () => undefined });

function readInitial(): CodeLang {
  try {
    return localStorage.getItem(KEY) === 'cpp' ? 'cpp' : 'python';
  } catch {
    return 'python';
  }
}

/** Глобальный выбор языка примеров кода (Python / C++), сохраняется в localStorage. */
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<CodeLang>(readInitial);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      // без localStorage выбор живёт только до перезагрузки
    }
  }, [lang]);
  const setLang = useCallback((l: CodeLang) => setLangState(l), []);
  const api = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useLang(): LangApi {
  return useContext(Ctx);
}

interface ToggleProps {
  className?: string;
  size?: 'sm' | 'xs';
}

/** Переключатель Python / C++. */
export function LangToggle({ className = '', size = 'sm' }: ToggleProps) {
  const { lang, setLang } = useLang();
  const pad = size === 'xs' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';
  return (
    <div role="radiogroup" aria-label="Язык кода" className={`inline-flex rounded-lg bg-slate-800/80 p-0.5 ring-1 ring-slate-700 ${className}`}>
      {(['python', 'cpp'] as const).map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={lang === l}
          onClick={() => setLang(l)}
          className={`rounded-md font-medium transition-colors ${pad} ${lang === l ? (l === 'python' ? 'bg-sky-500 text-white' : 'bg-violet-500 text-white') : 'text-slate-400 hover:text-slate-100'}`}
        >
          {LANG_LABEL[l]}
        </button>
      ))}
    </div>
  );
}
