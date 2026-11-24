import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LangToggle } from '../../lib/lang';
import { useProgress } from '../../lib/progress';
import { useOverallStats } from '../../lib/stats';
import { ProgressBar } from '../ui/primitives';

const NAV: { to: string; label: string; icon: string; hint: string }[] = [
  { to: '/', label: 'Dashboard', icon: '🏠', hint: 'Главная' },
  { to: '/path', label: 'Learning Path', icon: '🧭', hint: 'Модули и уроки' },
  { to: '/tracing', label: 'Tracing Practice', icon: '🔍', hint: 'Проследи алгоритм' },
  { to: '/counterexamples', label: 'Counterexamples', icon: '🐞', hint: 'Найди ошибку' },
  { to: '/theory', label: 'Theory Test', icon: '✅', hint: 'Multiple Choice' },
  { to: '/open', label: 'Open Questions', icon: '✍️', hint: 'Открытые вопросы' },
  { to: '/cheatsheet', label: 'Complexity', icon: '📊', hint: 'Шпаргалка Big O' },
  { to: '/mock', label: 'Mock Exam', icon: '⏱️', hint: 'Симулятор экзамена' },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const stats = useOverallStats();
  return (
    <div className="flex h-full flex-col">
      <NavLink to="/" onClick={onNavigate} className="flex items-center gap-3 px-5 py-5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 font-mono text-lg font-bold text-white shadow-lg shadow-indigo-500/30">
          A
        </span>
        <span>
          <span className="block text-sm font-bold tracking-wide text-white">ADS Exam Prep</span>
          <span className="block text-xs text-slate-400">Algorithms & Data Structures</span>
        </span>
      </NavLink>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                isActive ? 'bg-indigo-500/15 text-white ring-1 ring-indigo-500/30' : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
              }`
            }
          >
            <span className="text-base">{n.icon}</span>
            <span className="flex-1">
              <span className="block font-medium">{n.label}</span>
              <span className="block text-[11px] text-slate-500 group-hover:text-slate-400">{n.hint}</span>
            </span>
          </NavLink>
        ))}
      </nav>
      <div className="mx-3 mt-3 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
        <span className="text-xs text-slate-400">Язык кода</span>
        <LangToggle />
      </div>
      <div className="m-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="mb-2 flex justify-between text-xs text-slate-400">
          <span>Общий прогресс</span>
          <span className="font-mono text-slate-200">{stats.overall}%</span>
        </div>
        <ProgressBar value={stats.overall} />
        <div className="mt-2 text-[11px] text-slate-500">Экзамен: 29 ноября 2026 · 60 минут</div>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { setLastRoute } = useProgress();

  useEffect(() => {
    // запоминаем место, чтобы после обновления/возврата продолжить отсюда
    if (location.pathname !== '/') setLastRoute(location.pathname);
    window.scrollTo({ top: 0 });
  }, [location.pathname, setLastRoute]);

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-800/80 bg-slate-950/80 backdrop-blur lg:block">
        <SidebarContent />
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur lg:hidden">
        <NavLink to="/" className="font-bold text-white">
          ADS Exam Prep
        </NavLink>
        <LangToggle size="xs" className="ml-auto mr-3" />
        <button
          type="button"
          aria-label="Открыть меню"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200"
        >
          ☰ Меню
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Закрыть меню" className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 overflow-y-auto border-r border-slate-800 bg-slate-950">
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-3xl text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
