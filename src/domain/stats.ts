import { BENESTAR_MAX, BENESTAR_MIN, SALARI_BASE_16 } from './constants'
import type {
  Budget,
  EventEffect,
  Familia,
  FamilyClass,
  GameState,
  Itinerari,
  Person,
} from './types'

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

/** Benestar de referència tenint en compte família, itinerari i atur. */
export function baselineBenestar(state: GameState): number {
  let offset = itinerariBenestarOffset(state.itinerari)
  // A l'atur (treball amb sou 0): inseguretat i pressió.
  if (state.itinerari === 'treball' && state.salari === 0) offset -= 8
  return clampBenestar(familyBaselineBenestar(state.familia) + offset)
}

/** Sou inicial d'una primera feina: base + un plus modest per contactes familiars. */
export function salariInicial(familia: Familia): number {
  const plusContactes = clamp(familia.patrimoni * 0.0005, 0, 350)
  return Math.round((SALARI_BASE_16 + plusContactes) / 25) * 25
}

/** Ingrés mensual a la fase laboral: sou actual (treball) o suport familiar (nini). */
export function ingressosMensuals16(state: GameState): number {
  return state.itinerari === 'treball'
    ? state.salari ?? 0
    : pagaMensual(state.familia)
}

/** Capacitat de la família per cobrir una emergència puntual (matalàs econòmic). */
export function ajutFamiliarMax(familia: Familia): number {
  return Math.round(familia.patrimoni * 0.1)
}

export interface DespesaGreuResult {
  person: Person
  donacio: number
  descobert: number
}

/**
 * Resol una despesa greu amb el matalàs familiar: el jugador paga el que pot
 * (efectiu → estalvi), la família cobreix el dèficit fins a `ajutFamiliarMax`, i
 * el descobert restant resta benestar (estrès). Mai genera deute.
 */
export function resolveDespesaGreu(
  person: Person,
  familia: Familia,
  cost: number,
): DespesaGreuResult {
  const patrimoni = { ...person.patrimoni }
  let restant = cost

  const pagaDe = (font: 'efectiu' | 'estalvi') => {
    const real = Math.min(restant, patrimoni[font])
    patrimoni[font] = Math.round(patrimoni[font] - real)
    restant -= real
  }
  pagaDe('efectiu')
  pagaDe('estalvi')

  const donacio = Math.min(restant, ajutFamiliarMax(familia))
  restant -= donacio
  const descobert = restant

  // El descobert genera estrès: penalització de benestar escalada.
  const penalitzacio = descobert > 0 ? Math.min(30, Math.ceil(descobert / 80)) : 0
  const stats = {
    ...person.stats,
    benestar: clampBenestar(person.stats.benestar - penalitzacio),
  }

  return {
    person: { ...person, stats, patrimoni },
    donacio,
    descobert,
  }
}

/** Augment de sou en demanar-ne un: entre el 2% (benestar 0) i el 10% (benestar 100). */
export function augmentSou(salari: number, benestar: number): number {
  const pct = 0.02 + (clampBenestar(benestar) / 100) * 0.08
  return Math.round((salari * pct) / 5) * 5
}

// Mentre es viu a casa, l'aportació a la família és obligatòria i més alta com més
// pobra és la família (la més pobra: 50% del sou, fins a un màxim de 700 €/mes).
const FACTOR_APORTACIO: Record<FamilyClass, number> = {
  pobra: 0.5,
  treballadora: 0.35,
  mitjana: 0.2,
  alta: 0.1,
  rica: 0.05,
  super_rica: 0,
}
const APORTACIO_MAX = 700

/** Aportació mínima obligatòria a la família segons l'origen i l'ingrés. */
export function aportacioMinima(familia: Familia, income: number): number {
  if (income <= 0) return 0
  const min = Math.min(FACTOR_APORTACIO[familia.classe] * income, APORTACIO_MAX)
  return Math.round(min / 5) * 5
}

/** Pressupost mensual per defecte; respecta l'aportació mínima obligatòria a casa. */
export function defaultBudget(income: number, minCasa = 0): Budget {
  const round = (n: number) => Math.max(0, Math.round(n / 5) * 5)
  const casa = Math.max(round(income * 0.1), minCasa)
  const rest = Math.max(0, income - casa)
  return {
    casa,
    estalvi: round(rest * 0.4),
    oci: round(rest * 0.35),
    compres: round(rest * 0.25),
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
  minCasa = 0,
): Person {
  const patrimoni = { ...person.patrimoni }
  // Caixa disponible aquest mes (ingrés + el que ja hi havia).
  let disponible = patrimoni.efectiu + income

  const gasta = (n: number) => {
    const real = Math.max(0, Math.min(n, disponible))
    disponible -= real
    return real
  }
  // L'aportació a la família és obligatòria: es paga primer i mai per sota del mínim.
  gasta(Math.max(budget.casa, minCasa))
  const aEstalvi = gasta(budget.estalvi)
  const oci = gasta(budget.oci)
  gasta(budget.compres)

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
