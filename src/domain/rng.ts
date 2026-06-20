// Generador pseudoaleatori determinista (mulberry32). L'estat és un simple
// número, de manera que es pot serialitzar a localStorage i reproduir partides
// (clau per als tests).

export interface RngResult {
  value: number // [0, 1)
  state: number
}

export function rng(state: number): RngResult {
  let t = (state += 0x6d2b79f5)
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return { value, state: state >>> 0 }
}

/** Llavor inicial a partir del rellotge (no determinista; per a partides reals). */
export function seedFromTime(): number {
  return (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0
}
