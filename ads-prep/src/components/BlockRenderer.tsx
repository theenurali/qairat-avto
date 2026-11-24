import type { ComponentType, ReactNode } from 'react';
import type { Block } from '../types';
import { CodeBlock } from './ui/CodeBlock';
import { Markup } from './ui/Markup';
import { Callout, Reveal } from './ui/primitives';

interface BlockRendererProps {
  blocks: Block[];
  visualizers: Record<string, ComponentType>;
}

function Section({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <section className="my-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
        <span>{icon}</span> {title}
      </h3>
      {children}
    </section>
  );
}

function RenderBlock({ b, visualizers }: { b: Block; visualizers: Record<string, ComponentType> }) {
  switch (b.kind) {
    case 'h2':
      return <h2 className="mt-10 mb-3 border-b border-slate-800 pb-2 text-xl font-bold text-white sm:text-2xl">{b.text}</h2>;
    case 'h3':
      return <h3 className="mt-6 mb-2 text-lg font-semibold text-slate-100">{b.text}</h3>;
    case 'p':
      return (
        <p className="my-3 text-[15px] leading-7 text-slate-300">
          <Markup text={b.text} />
        </p>
      );
    case 'analogy':
      return (
        <Callout kind="analogy" title={b.title ? `Аналогия: ${b.title}` : undefined}>
          <Markup text={b.text} />
        </Callout>
      );
    case 'note':
    case 'tip':
    case 'warning':
      return (
        <Callout kind={b.kind} title={b.title}>
          <Markup text={b.text} />
        </Callout>
      );
    case 'list': {
      const Tag = b.ordered ? 'ol' : 'ul';
      return (
        <Tag className={`my-3 space-y-1.5 pl-6 text-[15px] leading-7 text-slate-300 ${b.ordered ? 'list-decimal' : 'list-disc'} marker:text-indigo-400`}>
          {b.items.map((it, i) => (
            <li key={i}>
              <Markup text={it} />
            </li>
          ))}
        </Tag>
      );
    }
    case 'code':
      return <CodeBlock code={b.code} cpp={b.cpp} caption={b.caption} explain={b.explain} cppExplain={b.cppExplain} />;
    case 'table':
      return (
        <div className="my-4 overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full min-w-[480px] text-left text-sm">
            {b.caption && <caption className="bg-slate-900/80 px-4 py-2 text-left text-xs text-slate-400">{b.caption}</caption>}
            <thead className="bg-slate-800/70 text-slate-200">
              <tr>
                {b.headers.map((h, i) => (
                  <th key={i} className="px-4 py-2.5 font-semibold">
                    <Markup text={h} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i} className="border-t border-slate-800 odd:bg-slate-900/30">
                  {r.map((c, j) => (
                    <td key={j} className="px-4 py-2.5 align-top text-slate-300">
                      <Markup text={c} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'steps':
      return (
        <div className="my-5 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="mb-4 text-sm font-semibold uppercase tracking-wider text-indigo-300">🪜 {b.title}</div>
          <ol className="relative space-y-4 border-l border-slate-700 pl-6">
            {b.steps.map((s, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[34px] grid h-5 w-5 place-items-center rounded-full bg-indigo-500 font-mono text-[10px] font-bold text-white">{i + 1}</span>
                <div className="font-medium text-slate-100">
                  <Markup text={s.title} />
                </div>
                <div className="mt-1 text-sm leading-6 text-slate-300">
                  <Markup text={s.text} />
                </div>
                {s.state && <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950/80 px-3 py-2 font-mono text-xs leading-5 text-amber-200">{s.state}</pre>}
              </li>
            ))}
          </ol>
        </div>
      );
    case 'viz': {
      const V = visualizers[b.id];
      return (
        <figure className="my-6">
          <div className="rounded-2xl border border-indigo-500/25 bg-gradient-to-b from-indigo-500/5 to-transparent p-3 sm:p-5">
            {V ? <V /> : <div className="text-sm text-rose-300">Визуализация «{b.id}» не найдена.</div>}
          </div>
          {b.caption && <figcaption className="mt-2 text-center text-xs text-slate-500">{b.caption}</figcaption>}
        </figure>
      );
    }
    case 'complexity':
      return (
        <Section title="Time & Space Complexity" icon="⏱️">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-2 pr-3">Операция</th>
                  <th className="pb-2 pr-3">Best</th>
                  <th className="pb-2 pr-3">Average</th>
                  <th className="pb-2 pr-3">Worst</th>
                  <th className="pb-2 pr-3">Space</th>
                </tr>
              </thead>
              <tbody>
                {b.rows.map((r, i) => (
                  <tr key={i} className="border-t border-slate-800 align-top">
                    <td className="py-2 pr-3 font-medium text-slate-100">{r.op}</td>
                    <td className="py-2 pr-3 font-mono text-emerald-300">{r.best ?? '—'}</td>
                    <td className="py-2 pr-3 font-mono text-sky-300">{r.avg}</td>
                    <td className="py-2 pr-3 font-mono text-rose-300">{r.worst}</td>
                    <td className="py-2 pr-3 font-mono text-amber-300">{r.space}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            {b.rows.map((r, i) => (
              <p key={i}>
                <span className="font-semibold text-slate-100">{r.op}:</span> <Markup text={r.why} />
              </p>
            ))}
          </div>
        </Section>
      );
    case 'mistakes':
      return (
        <Section title="Типичные ошибки" icon="⚠️">
          <ul className="space-y-3">
            {b.items.map((m, i) => (
              <li key={i} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-sm">
                <div className="text-rose-300">
                  ✗ <Markup text={m.mistake} />
                </div>
                <div className="mt-1 text-emerald-300">
                  ✓ <Markup text={m.fix} />
                </div>
              </li>
            ))}
          </ul>
        </Section>
      );
    case 'selfcheck':
      return (
        <Section title="Вопросы для самопроверки" icon="🤔">
          <ol className="space-y-4">
            {b.items.map((it, i) => (
              <li key={i} className="text-sm">
                <div className="mb-1 font-medium text-slate-100">
                  {i + 1}. <Markup text={it.q} />
                </div>
                <Reveal>
                  <Markup text={it.a} />
                </Reveal>
              </li>
            ))}
          </ol>
        </Section>
      );
    case 'practice':
      return (
        <Section title="Практические задания" icon="🛠️">
          <ol className="space-y-4">
            {b.items.map((it, i) => (
              <li key={i} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm">
                <div className="mb-2 font-medium text-slate-100">
                  Задание {i + 1}. <Markup text={it.task} />
                </div>
                <Reveal label="Показать решение">
                  <Markup text={it.solution} />
                </Reveal>
              </li>
            ))}
          </ol>
        </Section>
      );
    case 'summary':
      return (
        <div className="my-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <div className="mb-2 font-semibold text-emerald-300">📌 Главное</div>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-slate-300 marker:text-emerald-400">
            {b.items.map((it, i) => (
              <li key={i}>
                <Markup text={it} />
              </li>
            ))}
          </ul>
        </div>
      );
    default:
      return null;
  }
}

export function BlockRenderer({ blocks, visualizers }: BlockRendererProps) {
  return (
    <div>
      {blocks.map((b, i) => (
        <RenderBlock key={i} b={b} visualizers={visualizers} />
      ))}
    </div>
  );
}
