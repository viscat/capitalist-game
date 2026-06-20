import { BENESTAR_MAX, BENESTAR_MIN, SALARI_TREBALL_16 } from './constants'
import type { Budget, EventEffect, Familia, GameState, Itinerari, Person } from './types'

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function clampBenestar(value: number): number {
  return clamp(value, BENESTAR_MIN, BENESTAR_MAX)
}

// --- Indicadors derivats del context familiar (0..1) ---

/**
 * Cura efectiva rebuda: hores de cura dels progenitors + part de la cura
 * delegada a un cuidador contractat (que compensa, però no del tot, l'absència
 * parental).
 */
export function careScore(familia: Familia): number {
  const cura = familia.horesCura + (familia.cuidadorContractat ? 15 : 0)
  return clamp(cura / 45, 0, 1)
}

/** Seguretat econòmica de la llar segons els ingressos mensuals. */
export function econSecurity(familia: Familia): number {
  return clamp(familia.ingressosMensuals / 4500, 0, 1)
}

/** Comoditat derivada del patrimoni acumulat. */
export function wealthComfort(familia: Familia): number {
  return clamp(familia.patrimoni / 800_000, 0, 1)
}

/**
 * Benestar de referència cap al qual gravita la criatura segons el seu entorn.
 * Missatge de disseny: el temps i la cura pesen molt; els diners ajuden fins a
 * un punt (rendiments decreixents). Una família rica amb progenitors absents pot
 * no superar una família treballadora molt present.
 */
export function familyBaselineBenestar(familia: Familia): number {
  const baseline =
    28 +
    careScore(familia) * 24 +
    econSecurity(familia) * 30 +
    wealthComfort(familia) * 8
  return clampBenestar(Math.round(baseline))
}

/** Estalvi que la família aporta cada any al compte de la criatura. */
export function estalviAnualCriatura(familia: Familia): number {
  const perPatrimoni = familia.patrimoni * 0.002
  const perIngressos = Math.max(0, familia.ingressosMensuals - 1500) * 0.05
  return Math.round((perPatrimoni + perIngressos) / 10) * 10
}

/**
 * Paga mensual que rep l'adolescent segons la capacitat de la família. Marca el
 * punt de partida de la gestió activa dels diners.
 */
export function pagaMensual(familia: Familia): number {
  const perIngressos = familia.ingressosMensuals * 0.008
  const perPatrimoni = Math.min(familia.patrimoni, 2_000_000) * 0.00015
  return Math.round((perIngressos + perPatrimoni) / 5) * 5
}

/** Aplica un EventEffect a una persona retornant una còpia nova (immutable). */
export function applyEffect(person: Person, effect: EventEffect): Person {
  // Els comptes no baixen de zero (no modelem deute en aquesta fase).
  const patrimoni = { ...person.patrimoni }
  if (effect.efectiu)
    patrimoni.efectiu = Math.max(0, Math.round(patrimoni.efectiu + effect.efectiu))
  if (effect.estalvi)
    patrimoni.estalvi = Math.max(0, Math.round(patrimoni.estalvi + effect.estalvi))
  if (effect.inversions)
    patrimoni.inversions = Math.max(
      0,
      Math.round(patrimoni.inversions + effect.inversions),
    )

  const stats = { ...person.stats }
  if (effect.benestar) stats.benestar = clampBenestar(stats.benestar + effect.benestar)

  return { ...person, stats, patrimoni }
}

/** Patrimoni net total de la persona. */
export function patrimoniTotal(person: Person): number {
  const { efectiu, estalvi, inversions, cases } = person.patrimoni
  return efectiu + estalvi + inversions + cases.reduce((a, b) => a + b, 0)
}

// --- Fase 16→18 ---

/** Petit ajust del benestar de referència segons l'itinerari triat als 16. */
export function itinerariBenestarOffset(itinerari?: Itinerari): number {
  switch (itinerari) {
    case 'treball':
      return 2 // propòsit i diners propis, però cansat
    case 'nini':
      return -6 // llibertat inicial, però estancament i pressió
    case 'grau_mig':
      return 1
    default:
      return 0
  }
}

/** Benestar de referència tenint en compte família i itinerari. */
export function baselineBenestar(state: GameState): number {
  return clampBenestar(
    familyBaselineBenestar(state.familia) +
      itinerariBenestarOffset(state.itinerari),
  )
}

/** Ingrés mensual a la fase laboral: sou (treball) o suport familiar (nini). */
export function ingressosMensuals16(state: GameState): number {
  return state.itinerari === 'treball'
    ? SALARI_TREBALL_16
    : pagaMensual(state.familia)
}

/** Pressupost mensual per defecte a partir de l'ingrés disponible. */
export function defaultBudget(income: number): Budget {
  const round = (n: number) => Math.round(n / 5) * 5
  return {
    estalvi: round(income * 0.25),
    oci: round(income * 0.2),
    compres: round(income * 0.15),
    casa: round(income * 0.1),
  }
}

/**
 * Aplica un mes a la fase laboral: ingressa, mou l'estalvi al patrimoni, gasta
 * oci/compres/casa i deixa el sobrant a efectiu (mai negatiu). El benestar reacciona
 * a l'estil de vida (poc oci penalitza; un mínim de vida social i alguna compra
 * apugen una mica), de manera que estalviar-ho tot té un cost de benestar.
 */
export function applyBudgetMonth(
  person: Person,
  budget: Budget,
  income: number,
): Person {
  const patrimoni = { ...person.patrimoni }
  // Caixa disponible aquest mes (ingrés + el que ja hi havia).
  let disponible = patrimoni.efectiu + income

  const gasta = (n: number) => {
    const real = Math.max(0, Math.min(n, disponible))
    disponible -= real
    return real
  }
  const aEstalvi = gasta(budget.estalvi)
  const oci = gasta(budget.oci)
  gasta(budget.compres)
  gasta(budget.casa)

  patrimoni.estalvi = Math.round(patrimoni.estalvi + aEstalvi)
  patrimoni.efectiu = Math.round(disponible)

  // Efecte de l'estil de vida sobre el benestar (petit, mensual).
  const ociRatio = income > 0 ? oci / income : 0
  let deltaBenestar = 0
  if (ociRatio < 0.05) deltaBenestar -= 2
  else if (ociRatio >= 0.15) deltaBenestar += 2

  const stats = {
    ...person.stats,
    benestar: clampBenestar(person.stats.benestar + deltaBenestar),
  }
  return { ...person, stats, patrimoni }
}
