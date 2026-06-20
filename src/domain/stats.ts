import { BENESTAR_MAX, BENESTAR_MIN } from './constants'
import type { EventEffect, Familia, Person } from './types'

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
