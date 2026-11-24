/**
 * Hash table algorithms with step traces.
 * Все функции чистые: возвращают новые таблицы, не мутируя входные.
 */

export const EMPTY = null;
export const DELETED = 'DEL' as const;
export type Slot = number | null | typeof DELETED;
export type ProbeMode = 'linear' | 'quadratic';

/** Неотрицательный остаток (как % в Python для отрицательных чисел). */
export function mod(a: number, m: number): number {
  return ((a % m) + m) % m;
}

/** h(k) = k mod m */
export function hashInt(key: number, m: number): number {
  return mod(key, m);
}

/** Сумма кодов символов mod m (простая, но слабая hash function). */
export function hashStringSum(s: string, m: number): number {
  let sum = 0;
  for (const ch of s) sum += ch.charCodeAt(0);
  return mod(sum, m);
}

/** Полиномиальный хеш (Horner): h = (h*base + ord(c)) mod m. */
export function hashStringPoly(s: string, m: number, base = 31): number {
  let h = 0;
  for (const ch of s) h = mod(h * base + ch.charCodeAt(0), m);
  return h;
}

/** Индекс i-й пробы. linear: (h+i) mod m, quadratic: (h+i^2) mod m. */
export function probeIndex(h: number, i: number, m: number, mode: ProbeMode): number {
  return mode === 'linear' ? mod(h + i, m) : mod(h + i * i, m);
}

export interface ProbeStep {
  attempt: number;
  index: number;
  slot: Slot;
  /** Что произошло на этой пробе. */
  action: 'occupied' | 'placed' | 'found' | 'skip-deleted' | 'empty-stop' | 'duplicate';
}

export interface OpenAddrResult {
  table: Slot[];
  probes: ProbeStep[];
  /** Индекс, куда помещён / где найден / откуда удалён ключ (или -1). */
  index: number;
  ok: boolean;
  message: string;
}

/**
 * Вставка в open addressing. DEL-ячейки можно переиспользовать,
 * но сначала проверяем, нет ли уже такого ключа дальше в цепочке проб.
 * Для простоты (и как в большинстве лекций) кладём ключ в первую EMPTY или DEL ячейку.
 */
export function openInsert(table: readonly Slot[], key: number, mode: ProbeMode): OpenAddrResult {
  const m = table.length;
  const h = hashInt(key, m);
  const probes: ProbeStep[] = [];
  for (let i = 0; i < m; i++) {
    const idx = probeIndex(h, i, m, mode);
    const slot = table[idx];
    if (slot === EMPTY || slot === DELETED) {
      probes.push({ attempt: i, index: idx, slot, action: 'placed' });
      const next = [...table];
      next[idx] = key;
      return { table: next, probes, index: idx, ok: true, message: `Ключ ${key} помещён в slot ${idx}` };
    }
    if (slot === key) {
      probes.push({ attempt: i, index: idx, slot, action: 'duplicate' });
      return { table: [...table], probes, index: idx, ok: false, message: `Ключ ${key} уже есть в slot ${idx}` };
    }
    probes.push({ attempt: i, index: idx, slot, action: 'occupied' });
  }
  return {
    table: [...table],
    probes,
    index: -1,
    ok: false,
    message:
      mode === 'quadratic'
        ? `Quadratic probing не нашёл свободную ячейку за ${m} проб (может случиться, даже если таблица не полна)`
        : 'Таблица заполнена',
  };
}

/** Поиск: идём по пробам, пропускаем DEL, останавливаемся на EMPTY. */
export function openSearch(table: readonly Slot[], key: number, mode: ProbeMode): OpenAddrResult {
  const m = table.length;
  const h = hashInt(key, m);
  const probes: ProbeStep[] = [];
  for (let i = 0; i < m; i++) {
    const idx = probeIndex(h, i, m, mode);
    const slot = table[idx];
    if (slot === EMPTY) {
      probes.push({ attempt: i, index: idx, slot, action: 'empty-stop' });
      return { table: [...table], probes, index: -1, ok: false, message: `Встретили EMPTY в slot ${idx} — ключа ${key} нет` };
    }
    if (slot === key) {
      probes.push({ attempt: i, index: idx, slot, action: 'found' });
      return { table: [...table], probes, index: idx, ok: true, message: `Ключ ${key} найден в slot ${idx}` };
    }
    probes.push({ attempt: i, index: idx, slot, action: slot === DELETED ? 'skip-deleted' : 'occupied' });
  }
  return { table: [...table], probes, index: -1, ok: false, message: `Ключ ${key} не найден (проверены все ${m} проб)` };
}

/** Удаление: находим ключ и ставим tombstone DEL (не EMPTY!). */
export function openDelete(table: readonly Slot[], key: number, mode: ProbeMode): OpenAddrResult {
  const found = openSearch(table, key, mode);
  if (!found.ok) return { ...found, message: `Удаление: ${found.message}` };
  const next = [...table];
  next[found.index] = DELETED;
  return { ...found, table: next, message: `Ключ ${key} удалён из slot ${found.index}, там теперь DEL (tombstone)` };
}

/* ----------------------------- Separate chaining ----------------------------- */

export type Chains = number[][];

export interface ChainResult {
  chains: Chains;
  bucket: number;
  /** Сколько элементов цепочки просмотрели. */
  compared: number;
  ok: boolean;
  message: string;
}

export function makeChains(m: number): Chains {
  return Array.from({ length: m }, () => []);
}

/** Вставка в конец цепочки (если ключа ещё нет). */
export function chainInsert(chains: Chains, key: number): ChainResult {
  const m = chains.length;
  const b = hashInt(key, m);
  const pos = chains[b].indexOf(key);
  if (pos !== -1) {
    return { chains, bucket: b, compared: pos + 1, ok: false, message: `Ключ ${key} уже в bucket ${b}` };
  }
  const next = chains.map((c, i) => (i === b ? [...c, key] : c));
  return { chains: next, bucket: b, compared: chains[b].length, ok: true, message: `Ключ ${key} добавлен в конец bucket ${b}` };
}

export function chainSearch(chains: Chains, key: number): ChainResult {
  const b = hashInt(key, chains.length);
  const pos = chains[b].indexOf(key);
  return pos === -1
    ? { chains, bucket: b, compared: chains[b].length, ok: false, message: `Ключа ${key} нет в bucket ${b}` }
    : { chains, bucket: b, compared: pos + 1, ok: true, message: `Ключ ${key} найден в bucket ${b}, позиция ${pos}` };
}

export function chainDelete(chains: Chains, key: number): ChainResult {
  const res = chainSearch(chains, key);
  if (!res.ok) return res;
  const next = chains.map((c, i) => (i === res.bucket ? c.filter((x) => x !== key) : c));
  return { ...res, chains: next, message: `Ключ ${key} удалён из bucket ${res.bucket}` };
}

/** Load factor α = n / m. */
export function loadFactor(n: number, m: number): number {
  return m === 0 ? 0 : n / m;
}

/** Последовательная вставка ключей (open addressing) — удобно для tracing. */
export function openInsertAll(m: number, keys: readonly number[], mode: ProbeMode): { table: Slot[]; log: OpenAddrResult[] } {
  let table: Slot[] = Array.from({ length: m }, () => EMPTY);
  const log: OpenAddrResult[] = [];
  for (const k of keys) {
    const r = openInsert(table, k, mode);
    log.push(r);
    table = r.table;
  }
  return { table, log };
}

export function chainInsertAll(m: number, keys: readonly number[]): { chains: Chains; log: ChainResult[] } {
  let chains = makeChains(m);
  const log: ChainResult[] = [];
  for (const k of keys) {
    const r = chainInsert(chains, k);
    log.push(r);
    chains = r.chains;
  }
  return { chains, log };
}

export function slotToString(s: Slot): string {
  return s === EMPTY ? '_' : String(s);
}
