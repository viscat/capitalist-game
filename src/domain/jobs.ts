// Cerca de feina a la vida adulta (fase `carrera`). Mòdul pur i determinista: les
// ofertes es generen amb el RNG serialitzable, com la resta de la lògica de torn.
//
// Missatge de disseny: entrar al món laboral no et regala una feina. Has de buscar-la,
// i el que trobes depèn de la teva OCUPABILITAT: estudis (títol/itinerari), contactes
// (classe/patrimoni de la família), experiència acumulada i edat. L'origen segueix
// pesant; l'experiència recompensa una trajectòria estable.

import { SALARI_MINIM_MENSUAL } from './constants'
import { rng } from './rng'
import { clamp, salariAdultInicial } from './stats'
import { edatAnys } from './time'
import type { GameState, OfertaFeina, QualitatOferta } from './types'

/** Anys d'experiència acumulats (0 si encara no s'ha treballat mai). */
export function anysExperiencia(state: GameState): number {
  return state.anysExperiencia ?? 0
}

/** Aportació de l'educació a l'ocupabilitat (títol > grau mitjà > batxillerat > ...). */
function eduScore(state: GameState): number {
  if (state.teDiploma) return 0.35
  switch (state.itinerari) {
    case 'grau_mig':
      return 0.22
    case 'batxillerat':
      return 0.15
    case 'treball':
      return 0.1
    case 'nini':
      return 0.05
    default:
      return 0.08
  }
}

/**
 * Ocupabilitat (0..1): probabilitat i qualitat de trobar feina. Combina estudis,
 * contactes de la família, experiència, ànim i una petita penalització per buscar
 * la primera feina a una edat tardana.
 */
export function ocupabilitat(state: GameState): number {
  const contactes = clamp(state.familia.patrimoni / 800_000, 0, 1) * 0.2
  const experiencia = clamp(anysExperiencia(state) / 8, 0, 1) * 0.25
  const anim = (state.person.stats.benestar / 100) * 0.05
  const penalitzacioEdat = clamp((edatAnys(state.person.edatMesos) - 25) / 15, 0, 1) * 0.1
  return clamp(eduScore(state) + contactes + experiencia + anim - penalitzacioEdat, 0, 1)
}

/** Sou BRUT mensual de referència d'una oferta: el de partida adult millorat per experiència. */
export function salariBaseOferta(state: GameState): number {
  const base = salariAdultInicial(state.familia, state.teDiploma ?? false)
  return Math.round(base * (1 + clamp(anysExperiencia(state) / 10, 0, 1) * 0.4))
}

/** Factor de sou segons la qualitat de l'oferta. */
const FACTOR_QUALITAT: Record<QualitatOferta, number> = {
  precaria: 0.6,
  estandard: 0.9,
  bona: 1.25,
}

/** Qualitat d'una oferta a partir d'un valor [0,1) esbiaixat per l'ocupabilitat. */
function qualitatDe(rngValue: number, occ: number): QualitatOferta {
  const q = rngValue * 0.6 + occ * 0.4 // l'ocupabilitat empeny la qualitat amunt
  if (q < 0.4) return 'precaria'
  if (q < 0.75) return 'estandard'
  return 'bona'
}

/**
 * Genera el lot d'ofertes d'un any de cerca. Sempre n'hi ha **almenys una** (mai
 * deixa la partida bloquejada): com més ocupabilitat, més ofertes i de més qualitat.
 * Deterministe: consumeix i retorna l'estat del RNG.
 */
export function generaOfertes(
  state: GameState,
  rngState: number,
): { ofertes: OfertaFeina[]; rngState: number } {
  const occ = ocupabilitat(state)
  const n = clamp(1 + Math.round(occ * 2), 1, 3)
  const base = salariBaseOferta(state)

  const ofertes: OfertaFeina[] = []
  let estat = rngState
  for (let i = 0; i < n; i++) {
    const rq = rng(estat)
    estat = rq.state
    const qualitat = qualitatDe(rq.value, occ)
    const rs = rng(estat)
    estat = rs.state
    const factor = FACTOR_QUALITAT[qualitat] + (rs.value - 0.5) * 0.1
    const sou = Math.max(SALARI_MINIM_MENSUAL, Math.round((base * factor) / 25) * 25)
    ofertes.push({ id: `of${i}`, sou, qualitat })
  }
  return { ofertes, rngState: estat }
}
