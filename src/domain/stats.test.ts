import { describe, expect, it } from 'vitest'
import {
  applyEffect,
  clampBenestar,
  estalviAnualCriatura,
  familyBaselineBenestar,
  pagaMensual,
} from './stats'
import { FAMILY_PRESETS } from './family/presets'
import type { Person } from './types'

const person: Person = {
  edatMesos: 0,
  stats: { benestar: 50 },
  patrimoni: { efectiu: 0, estalvi: 0, inversions: 0, cases: [] },
}

describe('clampBenestar', () => {
  it('manté el valor dins de 0..100', () => {
    expect(clampBenestar(-10)).toBe(0)
    expect(clampBenestar(140)).toBe(100)
    expect(clampBenestar(55)).toBe(55)
  })
})

describe('applyEffect', () => {
  it('aplica deltes de benestar i patrimoni de forma immutable', () => {
    const next = applyEffect(person, { benestar: 10, estalvi: 50 })
    expect(next.stats.benestar).toBe(60)
    expect(next.patrimoni.estalvi).toBe(50)
    expect(person.stats.benestar).toBe(50) // l'original no canvia
  })

  it('acota el benestar al màxim', () => {
    const next = applyEffect({ ...person, stats: { benestar: 98 } }, { benestar: 10 })
    expect(next.stats.benestar).toBe(100)
  })

  it('no deixa l’efectiu per sota de zero', () => {
    const ric = {
      ...person,
      patrimoni: { ...person.patrimoni, efectiu: 30 },
    }
    const next = applyEffect(ric, { efectiu: -100 })
    expect(next.patrimoni.efectiu).toBe(0)
  })
})

describe('pagaMensual', () => {
  it('és més gran com més recursos té la família', () => {
    const pobra = pagaMensual(FAMILY_PRESETS.pobra.familia)
    const mitjana = pagaMensual(FAMILY_PRESETS.mitjana.familia)
    const rica = pagaMensual(FAMILY_PRESETS.rica.familia)
    expect(pobra).toBeLessThan(mitjana)
    expect(mitjana).toBeLessThan(rica)
    expect(pobra).toBeGreaterThanOrEqual(0)
  })
})

describe('familyBaselineBenestar', () => {
  it('creix de famílies pobres a famílies amb més recursos', () => {
    const pobra = familyBaselineBenestar(FAMILY_PRESETS.pobra.familia)
    const mitjana = familyBaselineBenestar(FAMILY_PRESETS.mitjana.familia)
    const alta = familyBaselineBenestar(FAMILY_PRESETS.alta.familia)
    expect(pobra).toBeLessThan(mitjana)
    expect(mitjana).toBeLessThanOrEqual(alta)
    expect(pobra).toBeGreaterThanOrEqual(0)
    expect(alta).toBeLessThanOrEqual(100)
  })
})

describe('estalviAnualCriatura', () => {
  it('és més gran com més recursos té la família', () => {
    const pobra = estalviAnualCriatura(FAMILY_PRESETS.pobra.familia)
    const rica = estalviAnualCriatura(FAMILY_PRESETS.rica.familia)
    expect(pobra).toBeLessThan(rica)
    expect(pobra).toBeGreaterThanOrEqual(0)
  })
})
