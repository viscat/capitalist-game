import { rng } from '../rng'
import type { Familia, GameEvent } from '../types'

export interface EventSelection {
  event: GameEvent
  rngState: number
}

/**
 * Tria un esdeveniment mitjançant selecció ponderada segons el context familiar.
 * Exclou l'últim esdeveniment per evitar repeticions immediates. Determinista
 * donat un `rngState`.
 */
export function selectEvent(
  events: GameEvent[],
  familia: Familia,
  rngState: number,
  excludeId?: string,
): EventSelection {
  const pool = events.filter((e) => e.id !== excludeId)
  const weights = pool.map((e) => Math.max(0, e.weight(familia)))
  const total = weights.reduce((a, b) => a + b, 0)

  const { value, state } = rng(rngState)

  if (total <= 0) {
    return { event: pool[0] ?? events[0], rngState: state }
  }

  let r = value * total
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i]
    if (r <= 0) return { event: pool[i], rngState: state }
  }
  return { event: pool[pool.length - 1], rngState: state }
}
