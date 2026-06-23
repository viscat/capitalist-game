// Harness de simulació: juga partides completes (0→35) de manera determinista i
// pura, per MESURAR la corba d'outcomes per classe (vegeu DESIGN.md §1 i §8.4).
//
// No forma part del joc: és l'eina del "moderador-tester" per validar amb dades
// (no amb arguments) que la física produeix la corba objectiu. Tot passa pel RNG
// serialitzable, així que cada llavor és reproduïble.

import {
  acceptarOferta,
  advanceTurn,
  applyChoice,
  applyMilestoneChoice,
  newGame,
} from '../engine'
import { defaultPlaInversio, ingressosAnualsCarrera, patrimoniTotal } from '../stats'
import type {
  EventEffect,
  FamilyClass,
  GameState,
  Identitat,
  Itinerari,
} from '../types'

/** Camí de vida que segueix el jugador simulat a les fites. */
export interface SimPolicy {
  /** Tria als 16 (fita `postobligatori`). */
  postobligatori: Itinerari
  /** Tria als 18 (fita `majoria`): seguir estudiant o entrar a la carrera. */
  majoria: 'universitat' | 'carrera'
}

/** Efecte immediat d'una opció d'esdeveniment (dinàmic si té `resolve`). */
function choiceEffect(
  source: { effect?: EventEffect; resolve?: (s: GameState) => EventEffect },
  state: GameState,
): EventEffect {
  return source.resolve ? source.resolve(state) : (source.effect ?? {})
}

/** Tria d'opció en una fita segons la política. */
function milestoneChoice(state: GameState, policy: SimPolicy): string {
  switch (state.pendingMilestone) {
    case 'institut':
      return 'continuar'
    case 'postobligatori':
      return policy.postobligatori
    case 'majoria':
      return policy.majoria
    case 'fi_uni':
      return 'comencar_carrera'
    default:
      return ''
  }
}

/**
 * Jugador simulat davant d'un esdeveniment amb decisió: tria l'opció que maximitza
 * el benestar immediat (i, a igualtat, la que deixa més diners). Representa algú que
 * intenta estar bé sense arruïnar-se — una política neutra i consistent.
 */
function eventChoice(state: GameState): string {
  const choices = state.pendingEvent?.choices ?? []
  let best = choices[0]
  let bestScore = -Infinity
  for (const c of choices) {
    const eff = choiceEffect(c, state)
    const diners =
      (eff.efectiu ?? 0) + (eff.estalvi ?? 0) - (eff.despesaGreu ?? 0)
    const score = (eff.benestar ?? 0) * 1000 + diners
    if (score > bestScore) {
      bestScore = score
      best = c
    }
  }
  return best?.id ?? ''
}

/**
 * Juga una partida fins al final aplicant la política. Manté els pressupostos i
 * plans d'inversió per defecte del motor (joc "raonable" sense microgestió) i, a
 * la cerca de feina, accepta sempre la millor oferta disponible (no s'està a l'atur).
 */
export function playout(initial: GameState, policy: SimPolicy): GameState {
  let s = initial
  let guard = 0
  while (!s.acabat && guard++ < 5000) {
    if (s.pendingMilestone) {
      s = applyMilestoneChoice(s, milestoneChoice(s, policy))
      continue
    }
    if (s.pendingEvent) {
      s = applyChoice(s, eventChoice(s))
      continue
    }
    // Cerca de feina (carrera, a l'atur amb ofertes): accepta la millor i continua.
    if (
      s.lifeStage === 'carrera' &&
      (s.salari ?? 0) === 0 &&
      s.ofertesFeina &&
      s.ofertesFeina.length > 0
    ) {
      const best = [...s.ofertesFeina].sort((a, b) => b.sou - a.sou)[0]
      s = acceptarOferta(s, best.id)
      // El pla d'inversió ara comença buit (el jugador el reparteix a mà); el jugador
      // simulat representa algú «raonable», així que adopta el pla per defecte sensat.
      s = { ...s, plaInversio: defaultPlaInversio(ingressosAnualsCarrera(s)) }
      continue
    }
    s = advanceTurn(s)
  }
  return s
}

/** Resultat final d'una partida simulada. */
export interface SimOutcome {
  benestar: number
  patrimoni: number
  salari: number
  teDiploma: boolean
}

/** Llavor decorrelacionada a partir d'un índex (evita seqüències correlacionades). */
function seedFor(i: number): number {
  return ((i + 1) * 0x9e3779b1) >>> 0
}

/** Simula `nSeeds` partides d'una classe amb una política i retorna els outcomes. */
export function simulateClass(
  cls: FamilyClass,
  nSeeds: number,
  policy: SimPolicy,
  identitat?: Identitat,
): SimOutcome[] {
  const out: SimOutcome[] = []
  for (let i = 0; i < nSeeds; i++) {
    const final = playout(
      newGame(cls, seedFor(i), identitat ? { identitat } : {}),
      policy,
    )
    out.push({
      benestar: final.person.stats.benestar,
      patrimoni: patrimoniTotal(final.person),
      salari: final.salari ?? 0,
      teDiploma: !!final.teDiploma,
    })
  }
  return out
}

// --- Estadística d'agregació ---

export function median(xs: number[]): number {
  return percentile(xs, 50)
}

export function percentile(xs: number[], p: number): number {
  if (xs.length === 0) return 0
  const sorted = [...xs].sort((a, b) => a - b)
  const idx = clampIdx(Math.round((p / 100) * (sorted.length - 1)), sorted.length)
  return sorted[idx]
}

export function mean(xs: number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length
}

/** Fracció (0..1) d'elements que compleixen el predicat. */
export function fraction(xs: number[], pred: (x: number) => boolean): number {
  return xs.length === 0 ? 0 : xs.filter(pred).length / xs.length
}

function clampIdx(i: number, len: number): number {
  return Math.max(0, Math.min(len - 1, i))
}

/** Resum estadístic d'una tirada de simulació per classe. */
export interface ClassSummary {
  benestarMediana: number
  benestarP10: number
  benestarP90: number
  patrimoniMediana: number
  /** Fracció amb benestar ≥ 60 als 35 (proxy de la "cua de mobilitat"). */
  cuaBenestar60: number
}

export function summarize(outcomes: SimOutcome[]): ClassSummary {
  const b = outcomes.map((o) => o.benestar)
  const p = outcomes.map((o) => o.patrimoni)
  return {
    benestarMediana: median(b),
    benestarP10: percentile(b, 10),
    benestarP90: percentile(b, 90),
    patrimoniMediana: Math.round(median(p)),
    cuaBenestar60: fraction(b, (x) => x >= 60),
  }
}
