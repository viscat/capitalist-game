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
