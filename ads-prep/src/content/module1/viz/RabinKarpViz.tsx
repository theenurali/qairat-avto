import { useState } from 'react';
import { charVal, rabinKarp, type CharValue, type RKParams, type RKWindow } from '../../../lib/algorithms/rabinKarp';
import { Badge, Button, StepControls } from '../../../components/ui/primitives';
import { useStepper } from '../../../lib/useStepper';

interface Preset {
  name: string;
  text: string;
  pattern: string;
  params: RKParams;
}

const PRESETS: Preset[] = [
  { name: 'CLRS: цифры, d=10, q=13', text: '2359023141526739921', pattern: '31415', params: { base: 10, q: 13, values: 'digit' } },
  { name: 'Короткий: spurious hit', text: '3826154', pattern: '26', params: { base: 10, q: 11, values: 'digit' } },
  { name: 'Буквы: d=256, q=101', text: 'abracadabra', pattern: 'abra', params: { base: 256, q: 101, values: 'ord' } },
  { name: 'Маленький q → много ложных', text: 'abcdabcabcd', pattern: 'bca', params: { base: 26, q: 5, values: 'alpha' } },
];

const KIND_CLS: Record<RKWindow['kind'], string> = {
  match: 'border-emerald-400 bg-emerald-500/25 text-emerald-50',
  spurious: 'border-amber-400 bg-amber-500/25 text-amber-50',
  miss: 'border-violet-400 bg-violet-500/20 text-violet-50',
};
const KIND_TEXT: Record<RKWindow['kind'], string> = {
  match: '✅ хеши равны и символы совпали — настоящее вхождение (match)',
  spurious: '⚠️ хеши равны, но символы НЕ совпали — spurious hit (ложное срабатывание)',
  miss: 'хеши разные → окно точно не совпадает, символы НЕ сравниваем',
};
const VALUE_NAMES: Record<CharValue, string> = { digit: 'цифра (0–9)', ord: 'ord(c) — код символа', alpha: 'a=1, b=2, …' };

function validate(text: string, pattern: string, p: RKParams): string {
  if (pattern.length === 0) return 'Pattern не может быть пустым.';
  if (text.length > 48) return 'Text слишком длинный для визуализации (максимум 48 символов).';
  if (pattern.length > text.length) return 'Pattern длиннее текста — окон нет, совпадений быть не может.';
  if (!Number.isInteger(p.base) || p.base < 2 || p.base > 1000) return 'd должно быть целым от 2 до 1000.';
  if (!Number.isInteger(p.q) || p.q < 2 || p.q > 100000) return 'q должно быть целым от 2 до 100000.';
  return '';
}

export function RabinKarpViz() {
  const [text, setText] = useState(PRESETS[0].text);
  const [pattern, setPattern] = useState(PRESETS[0].pattern);
  const [params, setParams] = useState<RKParams>(PRESETS[0].params);

  const error = validate(text, pattern, params);
  const res = error ? null : rabinKarp(text, pattern, params);
  const windows = res?.windows ?? [];
  const { step, setStep, playing, togglePlay, reset } = useStepper(windows.length, 1100);

  const applyPreset = (p: Preset) => {
    setText(p.text);
    setPattern(p.pattern);
    setParams(p.params);
    reset();
  };

  const w = windows[step];
  const m = pattern.length;
  const upTo = windows.slice(0, step + 1);
  const hashCmp = upTo.length;
  const charCmp = upTo.reduce((a, x) => a + x.charChecks, 0);
  const matchesSoFar = upTo.filter((x) => x.kind === 'match').map((x) => x.i);
  const spuriousSoFar = upTo.filter((x) => x.kind === 'spurious').map((x) => x.i);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-100">Rabin-Karp Visualizer</span>
        <Badge tone="indigo">rolling hash</Badge>
      </div>

      <div className="flex flex-wrap gap-1">
        {PRESETS.map((p) => (
          <Button key={p.name} size="sm" variant="ghost" onClick={() => applyPreset(p)}>
            {p.name}
          </Button>
        ))}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Text (текст)
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              reset();
            }}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-indigo-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Pattern (образец)
          <input
            value={pattern}
            onChange={(e) => {
              setPattern(e.target.value);
              reset();
            }}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-indigo-400"
          />
        </label>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
        <label className="flex items-center gap-1">
          d =
          <input
            type="number"
            value={params.base}
            onChange={(e) => {
              setParams({ ...params, base: Number(e.target.value) });
              reset();
            }}
            className="w-20 rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-slate-100"
          />
        </label>
        <label className="flex items-center gap-1">
          q =
          <input
            type="number"
            value={params.q}
            onChange={(e) => {
              setParams({ ...params, q: Number(e.target.value) });
              reset();
            }}
            className="w-24 rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-slate-100"
          />
        </label>
        <label className="flex items-center gap-1">
          значение символа:
          <select
            value={params.values}
            onChange={(e) => {
              setParams({ ...params, values: e.target.value as CharValue });
              reset();
            }}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
          >
            {(Object.keys(VALUE_NAMES) as CharValue[]).map((v) => (
              <option key={v} value={v}>
                {VALUE_NAMES[v]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

      {res && w && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs sm:grid-cols-4">
            <div className="rounded-lg bg-slate-900 p-2">
              <div className="text-slate-500">hash(pattern)</div>
              <div className="text-lg text-amber-300">{res.patternHash}</div>
            </div>
            <div className="rounded-lg bg-slate-900 p-2">
              <div className="text-slate-500">h = d^(m−1) mod q</div>
              <div className="text-lg text-slate-100">{res.h}</div>
            </div>
            <div className="rounded-lg bg-slate-900 p-2">
              <div className="text-slate-500">сравнений хешей</div>
              <div className="text-lg text-slate-100">{hashCmp}</div>
            </div>
            <div className="rounded-lg bg-slate-900 p-2">
              <div className="text-slate-500">сравнений символов</div>
              <div className="text-lg text-slate-100">{charCmp}</div>
            </div>
          </div>

          {/* text with window */}
          <div className="mt-4 overflow-x-auto pb-2">
            <div className="flex gap-1">
              {[...text].map((c, i) => {
                const inWin = i >= w.i && i < w.i + m;
                const isMatch = matchesSoFar.some((s) => i >= s && i < s + m);
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className={`flex h-9 w-8 items-center justify-center rounded border font-mono text-sm transition-all duration-300 ${
                        inWin ? KIND_CLS[w.kind] : isMatch ? 'border-emerald-700 bg-emerald-900/30 text-emerald-200' : 'border-slate-700 bg-slate-900 text-slate-300'
                      }`}
                    >
                      {c === ' ' ? '␣' : c}
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">{i}</span>
                    <span className="font-mono text-[9px] text-slate-600">{charVal(c, params.values)}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-1 text-[10px] text-slate-600">нижняя строка — значение символа v(c)</div>
          </div>

          <div className="mt-2 rounded-lg bg-slate-900 p-3 font-mono text-xs leading-6 text-slate-200">
            <div>
              Окно s = {w.i}: "{w.window}"
            </div>
            {w.roll ? (
              <div>
                t<sub>{w.i}</sub> = (d·(t<sub>{w.i - 1}</sub> − v('{text[w.i - 1]}')·h) + v('{text[w.i + m - 1]}')) mod q = {w.roll}
              </div>
            ) : (
              <div>t₀ считаем схемой Горнера по первым m символам = {w.hash}</div>
            )}
            <div>
              t<sub>{w.i}</sub> = {w.hash} {w.hash === res.patternHash ? '==' : '≠'} {res.patternHash} = hash(pattern)
            </div>
            <div className={w.kind === 'match' ? 'text-emerald-300' : w.kind === 'spurious' ? 'text-amber-300' : 'text-slate-400'}>{KIND_TEXT[w.kind]}</div>
            {w.charChecks > 0 && <div className="text-slate-400">посимвольная проверка: {w.charChecks} сравнений</div>}
          </div>

          <div className="mt-3">
            <StepControls step={step} total={windows.length} onStep={setStep} playing={playing} onTogglePlay={togglePlay} />
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <span className="text-emerald-300">matches: [{matchesSoFar.join(', ')}]</span>
            <span className="text-amber-300">spurious hits: [{spuriousSoFar.join(', ')}]</span>
          </div>

          {/* history table */}
          <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-slate-800">
            <table className="w-full text-left font-mono text-xs">
              <thead className="sticky top-0 bg-slate-900 text-slate-500">
                <tr>
                  <th className="px-2 py-1">s</th>
                  <th className="px-2 py-1">окно</th>
                  <th className="px-2 py-1">hash</th>
                  <th className="px-2 py-1">результат</th>
                </tr>
              </thead>
              <tbody>
                {upTo.map((x) => (
                  <tr key={x.i} className={x.i === w.i ? 'bg-slate-800/70' : undefined}>
                    <td className="px-2 py-0.5 text-slate-400">{x.i}</td>
                    <td className="px-2 py-0.5 text-slate-200">{x.window}</td>
                    <td className="px-2 py-0.5 text-slate-200">{x.hash}</td>
                    <td className={`px-2 py-0.5 ${x.kind === 'match' ? 'text-emerald-300' : x.kind === 'spurious' ? 'text-amber-300' : 'text-slate-500'}`}>
                      {x.kind === 'match' ? 'match' : x.kind === 'spurious' ? 'spurious hit' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
