import { MESOS_PER_ANY } from './constants'

// Estacions del curs acadèmic. L'adolescència comença als 12 anys a la Tardor
// (setembre) i avança un trimestre per torn.
export type Estacio = 'tardor' | 'hivern' | 'primavera' | 'estiu'

export const ESTACIONS: Estacio[] = ['tardor', 'hivern', 'primavera', 'estiu']

/** Estació corresponent a una edat en mesos (4 trimestres per any). */
export function estacioFromEdat(edatMesos: number): Estacio {
  const trimestre = Math.floor(edatMesos / 3) % 4
  return ESTACIONS[trimestre]
}

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
