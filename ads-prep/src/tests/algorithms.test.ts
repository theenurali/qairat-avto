import { describe, expect, it } from 'vitest';
import { buildLps, kmpSearch, lpsBrute } from '../lib/algorithms/kmp';
import { naiveSearch, rabinKarp, type RKParams } from '../lib/algorithms/rabinKarp';
import { bfs, dfsIterative, dfsRecursive, dfsTopo, hasDirectedCycle, isValidTopoOrder, kahn, makeGraph, type Edge } from '../lib/algorithms/graph';
import { openDelete, openInsertAll, openSearch, chainInsertAll, chainSearch } from '../lib/algorithms/hashing';
import { checkAnswer, tokenize } from '../lib/answer';

let seed = 12345;
const rnd = (n: number) => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed % n;
};
const randStr = (len: number, alpha: string) => Array.from({ length: len }, () => alpha[rnd(alpha.length)]).join('');

describe('KMP', () => {
  it('LPS matches brute force on random strings', () => {
    for (let k = 0; k < 400; k++) {
      const p = randStr(1 + rnd(12), 'AB');
      expect(buildLps(p)).toEqual(lpsBrute(p));
    }
  });
  it('known LPS values', () => {
    expect(buildLps('AABAACAABAA')).toEqual([0, 1, 0, 1, 2, 0, 1, 2, 3, 4, 5]);
    expect(buildLps('AAACAAAA')).toEqual([0, 1, 2, 0, 1, 2, 3, 3]);
    expect(buildLps('ABABCABAB')).toEqual([0, 0, 1, 2, 0, 1, 2, 3, 4]);
    expect(buildLps('')).toEqual([]);
  });
  it('search matches naive on random inputs incl. overlaps', () => {
    for (let k = 0; k < 400; k++) {
      const t = randStr(rnd(20), 'AB');
      const p = randStr(1 + rnd(4), 'AB');
      expect(kmpSearch(t, p).matches).toEqual(naiveSearch(t, p));
    }
    expect(kmpSearch('AAAAA', 'AA').matches).toEqual([0, 1, 2, 3]);
  });
});

describe('Rabin-Karp', () => {
  const params: RKParams[] = [
    { base: 10, q: 13, values: 'digit' },
    { base: 256, q: 101, values: 'ord' },
    { base: 26, q: 5, values: 'alpha' },
  ];
  it('finds same matches as naive and every spurious hit really differs', () => {
    for (const p of params) {
      for (let k = 0; k < 200; k++) {
        const alpha = p.values === 'digit' ? '0123456789' : 'abc';
        const t = randStr(rnd(25), alpha);
        const pat = randStr(1 + rnd(4), alpha);
        const r = rabinKarp(t, pat, p);
        expect(r.matches).toEqual(naiveSearch(t, pat));
        for (const s of r.spurious) expect(t.slice(s, s + pat.length)).not.toBe(pat);
      }
    }
  });
  it('CLRS example: spurious hit at 12, match at 6', () => {
    const r = rabinKarp('2359023141526739921', '31415', { base: 10, q: 13, values: 'digit' });
    expect(r.patternHash).toBe(7);
    expect(r.matches).toEqual([6]);
    expect(r.spurious).toEqual([12]);
  });
});

describe('Hash tables', () => {
  it('linear probing table and tombstones', () => {
    const { table } = openInsertAll(10, [12, 22, 32, 13, 42], 'linear');
    expect(table).toEqual([null, null, 12, 22, 32, 13, 42, null, null, null]);
    const del = openDelete(table, 22, 'linear');
    expect(del.table[3]).toBe('DEL');
    expect(openSearch(del.table, 42, 'linear').ok).toBe(true);
    expect(openSearch(del.table, 22, 'linear').ok).toBe(false);
  });
  it('quadratic probing', () => {
    const { table } = openInsertAll(10, [5, 15, 25, 35], 'quadratic');
    expect(table[5]).toBe(5);
    expect(table[6]).toBe(15);
    expect(table[9]).toBe(25);
    expect(table[4]).toBe(35);
  });
  it('chaining appends to end', () => {
    const { chains } = chainInsertAll(7, [15, 11, 27, 8, 12, 22]);
    expect(chains[1]).toEqual([15, 8, 22]);
    expect(chainSearch(chains, 22).ok).toBe(true);
  });
});

describe('Graphs', () => {
  const randomGraph = (n: number, m: number, directed: boolean, dag = false) => {
    const vs = Array.from({ length: n }, (_, i) => String(i));
    const edges: Edge[] = [];
    for (let k = 0; k < m; k++) {
      let a = rnd(n);
      let b = rnd(n);
      if (a === b) continue;
      if (dag && a > b) [a, b] = [b, a];
      if (edges.some(([u, v]) => (u === String(a) && v === String(b)) || (!directed && u === String(b) && v === String(a)))) continue;
      edges.push([String(a), String(b)]);
    }
    return makeGraph(vs, edges, directed);
  };

  it('BFS distances equal brute-force shortest paths', () => {
    for (let k = 0; k < 100; k++) {
      const g = randomGraph(7, 9, false);
      const r = bfs(g, '0');
      // Bellman-like relaxation as reference
      const d = new Map<string, number>([['0', 0]]);
      for (let it = 0; it < 8; it++)
        for (const [u, v] of g.edges) {
          for (const [a, b] of [[u, v], [v, u]]) {
            if (d.has(a) && (!d.has(b) || d.get(b)! > d.get(a)! + 1)) d.set(b, d.get(a)! + 1);
          }
        }
      expect([...r.dist.entries()].sort()).toEqual([...d.entries()].sort());
    }
  });
  it('iterative DFS (reverse push) equals recursive DFS order', () => {
    for (let k = 0; k < 100; k++) {
      const g = randomGraph(7, 10, k % 2 === 0);
      expect(dfsIterative(g, '0').order).toEqual(dfsRecursive(g, '0').order);
    }
  });
  it('topological sorts are valid; cycles detected consistently', () => {
    for (let k = 0; k < 150; k++) {
      const g = randomGraph(7, 10, true, k % 3 !== 0);
      const cyc = hasDirectedCycle(g);
      const kr = kahn(g);
      const dr = dfsTopo(g);
      expect(kr.hasCycle).toBe(cyc);
      expect(dr.hasCycle).toBe(cyc);
      if (!cyc) {
        expect(isValidTopoOrder(g, kr.order)).toBe(true);
        expect(isValidTopoOrder(g, dr.order)).toBe(true);
      }
    }
  });
});

describe('answer checking', () => {
  it('normalizes tokens', () => {
    expect(tokenize('[a, b] -> c')).toEqual(['A', 'B', 'C']);
    expect(tokenize('None, del, 3')).toEqual(['_', 'DEL', '3']);
    expect(checkAnswer('b-a, C-a', ['A-B', 'A-C'], 'set').correct).toBe(true);
    expect(checkAnswer('7 14 | | 9', ['7 14', '_', '9'], 'groups').correct).toBe(true);
    expect(checkAnswer('1, 2, 4', ['1', '2', '3'], 'list').firstError).toBe(2);
  });
});
