import { MESOS_PER_ANY } from './constants'

/** Anys complets d'edat. */
export function edatAnys(edatMesos: number): number {
  return Math.floor(edatMesos / MESOS_PER_ANY)
}

/** Data de naixement per defecte: avui (ISO `YYYY-MM-DD`). */
export function avuiISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Data actual de la partida (mes i any del calendari) a partir de la data de
 * naixement i els mesos viscuts.
 */
export function dataActual(
  dataNaixementISO: string,
  edatMesos: number,
): { mesIndex: number; any: number } {
  const [any, mes] = dataNaixementISO.split('-').map(Number)
  const total = mes - 1 + edatMesos
  const mesIndex = ((total % 12) + 12) % 12
  return { mesIndex, any: any + Math.floor(total / 12) }
}
