import { describe, expect, it } from 'vitest'
import { anysExperiencia, generaOfertes, ocupabilitat, salariBaseOferta } from './jobs'
import { newGameAtCarrera } from './engine'
import { SALARI_MINIM_MENSUAL } from './constants'
import type { GameState } from './types'

// Estat base a la fase de carrera (la drecera assigna sou; per a la cerca el posem a 0).
function adult(overrides: Partial<GameState> = {}): GameState {
  return { ...newGameAtCarrera('mitjana', 1), salari: 0, ...overrides }
}

describe('ocupabilitat', () => {
  it('el títol universitari millora l’ocupabilitat', () => {
    const base = adult()
    expect(ocupabilitat({ ...base, teDiploma: true })).toBeGreaterThan(
      ocupabilitat({ ...base, teDiploma: false }),
    )
  })

  it('l’experiència millora l’ocupabilitat', () => {
    const base = adult({ teDiploma: false })
    expect(ocupabilitat({ ...base, anysExperiencia: 8 })).toBeGreaterThan(
      ocupabilitat({ ...base, anysExperiencia: 0 }),
    )
  })

  it('una família amb més patrimoni (contactes) dóna més ocupabilitat', () => {
    const pobra = { ...newGameAtCarrera('pobra', 1), salari: 0, teDiploma: false }
    const rica = { ...newGameAtCarrera('rica', 1), salari: 0, teDiploma: false }
    expect(ocupabilitat(rica)).toBeGreaterThan(ocupabilitat(pobra))
  })

  it('està acotada a 0..1', () => {
    const top = adult({ teDiploma: true, anysExperiencia: 50 })
    expect(ocupabilitat(top)).toBeLessThanOrEqual(1)
    expect(ocupabilitat(top)).toBeGreaterThanOrEqual(0)
  })
})

describe('salariBaseOferta', () => {
  it('l’experiència apuja el sou de referència', () => {
    const base = adult({ teDiploma: false })
    expect(salariBaseOferta({ ...base, anysExperiencia: 10 })).toBeGreaterThan(
      salariBaseOferta({ ...base, anysExperiencia: 0 }),
    )
  })
})

describe('generaOfertes', () => {
  it('sempre genera almenys una oferta, mai per sota del salari mínim', () => {
    const { ofertes } = generaOfertes(adult({ teDiploma: false }), 123)
    expect(ofertes.length).toBeGreaterThanOrEqual(1)
    expect(ofertes.length).toBeLessThanOrEqual(3)
    for (const o of ofertes) {
      expect(o.sou).toBeGreaterThanOrEqual(SALARI_MINIM_MENSUAL)
    }
  })

  it('és deterministe per a la mateixa llavor i avança l’estat del RNG', () => {
    const s = adult()
    const a = generaOfertes(s, 999)
    const b = generaOfertes(s, 999)
    expect(a).toEqual(b)
    expect(a.rngState).not.toBe(999)
  })

  it('més ocupabilitat tendeix a donar més ofertes', () => {
    const alta = adult({ teDiploma: true, anysExperiencia: 8 })
    const baixa = { ...newGameAtCarrera('pobra', 1), salari: 0, teDiploma: false }
    expect(generaOfertes(alta, 7).ofertes.length).toBeGreaterThanOrEqual(
      generaOfertes(baixa, 7).ofertes.length,
    )
  })
})

describe('anysExperiencia', () => {
  it('retorna 0 si no s’ha treballat mai', () => {
    expect(anysExperiencia(adult())).toBe(0)
    expect(anysExperiencia(adult({ anysExperiencia: 4 }))).toBe(4)
  })
})
