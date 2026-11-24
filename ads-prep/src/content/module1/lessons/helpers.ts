import { chainInsertAll, hashInt, openInsertAll, slotToString, type ProbeMode } from '../../../lib/algorithms/hashing';
import { rabinKarp, type RKParams } from '../../../lib/algorithms/rabinKarp';

type Step = { title: string; text: string; state?: string };

function chainsToState(chains: number[][]): string {
  return chains.map((c, i) => `${i}: ${c.length ? c.join(' → ') : '∅'}`).join('\n');
}

/** Пошаговая вставка в Separate Chaining (генерируется кодом — без ручных ошибок). */
export function chainingSteps(m: number, keys: number[]): Step[] {
  const out: Step[] = [];
  for (let k = 0; k < keys.length; k++) {
    const prefix = keys.slice(0, k + 1);
    const { chains } = chainInsertAll(m, prefix);
    const before = chainInsertAll(m, keys.slice(0, k)).chains;
    const key = keys[k];
    const b = hashInt(key, m);
    const collision = before[b].length > 0;
    out.push({
      title: `Insert ${key}`,
      text: `h(${key}) = ${key} mod ${m} = ${b}. ${
        collision
          ? `Bucket ${b} уже содержит [${before[b].join(', ')}] → **collision**. Добавляем ${key} в КОНЕЦ цепочки.`
          : `Bucket ${b} пуст → цепочка теперь [${key}].`
      }`,
      state: chainsToState(chains),
    });
  }
  return out;
}

function tableToState(table: (number | null | 'DEL')[]): string {
  const idx = table.map((_, i) => String(i).padStart(4)).join('');
  const val = table.map((s) => slotToString(s).padStart(4)).join('');
  return `index:${idx}\nvalue:${val}`;
}

function probeWord(n: number): string {
  const d = n % 10;
  const dd = n % 100;
  if (d === 1 && dd !== 11) return 'проба';
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return 'пробы';
  return 'проб';
}

/** Пошаговая вставка в Open Addressing (linear / quadratic). */
export function openSteps(m: number, keys: number[], mode: ProbeMode): Step[] {
  const { log } = openInsertAll(m, keys, mode);
  return log.map((r, k) => {
    const key = keys[k];
    const h = hashInt(key, m);
    const probes = r.probes
      .map((p) => {
        const f = mode === 'linear' ? `(${h}+${p.attempt}) mod ${m}` : `(${h}+${p.attempt}²) mod ${m}`;
        const st = p.action === 'placed' ? 'свободно ✓' : 'занято';
        return `i=${p.attempt}: ${f} = ${p.index} → ${st}`;
      })
      .join('; ');
    return {
      title: `Insert ${key}`,
      text: `h(${key}) = ${key} mod ${m} = ${h}. ${probes}.${r.probes.length > 1 ? ` Понадобилось ${r.probes.length} ${probeWord(r.probes.length)}.` : ''}`,
      state: tableToState(r.table),
    };
  });
}

/** Пошаговый Rabin-Karp по окнам. */
export function rkSteps(text: string, pattern: string, p: RKParams): Step[] {
  const res = rabinKarp(text, pattern, p);
  const head: Step = {
    title: 'Подготовка',
    text: `m = ${pattern.length}, h = d^(m−1) mod q = ${p.base}^${pattern.length - 1} mod ${p.q} = ${res.h}. hash("${pattern}") = ${res.patternHash}.`,
    state: `text    = ${text}\npattern = ${pattern}\np = ${res.patternHash}, h = ${res.h}`,
  };
  const body = res.windows.map((w) => {
    const how = w.roll ? `Rolling: ${w.roll}.` : `Первое окно считаем напрямую: ${w.window} mod ${p.q} = ${w.hash}.`;
    const verdict =
      w.kind === 'match'
        ? `t = p = ${w.hash} → сравниваем символы: "${w.window}" == "${pattern}" → **match** в позиции ${w.i}.`
        : w.kind === 'spurious'
          ? `t = p = ${w.hash}, но "${w.window}" ≠ "${pattern}" → **spurious hit** (ложное срабатывание).`
          : `t = ${w.hash} ≠ p = ${res.patternHash} → окно пропускаем без сравнения символов.`;
    const pad = ' '.repeat(w.i);
    return {
      title: `Окно s = ${w.i}: "${w.window}"`,
      text: `${how} ${verdict}`,
      state: `${text}\n${pad}${'^'.repeat(pattern.length)}  t = ${w.hash}`,
    };
  });
  return [head, ...body];
}
