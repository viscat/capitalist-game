import { describe, expect, it } from 'vitest'
import {
  ajutFamiliarMax,
  aportacioMinima,
  applyBudgetMonth,
  applyEffect,
  augmentSou,
  benestarEstilDeVida,
  clampBenestar,
  minimOciCompres,
  estalviAnualCriatura,
  familyBaselineBenestar,
  pagaMensual,
  resolveDespesaGreu,
  salariInicial,
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
    const treballadora = familyBaselineBenestar(FAMILY_PRESETS.treballadora.familia)
    const mitjana = familyBaselineBenestar(FAMILY_PRESETS.mitjana.familia)
    const alta = familyBaselineBenestar(FAMILY_PRESETS.alta.familia)
    expect(pobra).toBeLessThan(treballadora)
    expect(treballadora).toBeLessThan(mitjana)
    expect(mitjana).toBeLessThanOrEqual(alta)
    expect(pobra).toBeGreaterThanOrEqual(0)
    expect(alta).toBeLessThanOrEqual(100)
    // Les classes baixes ho tenen clarament més difícil.
    expect(pobra).toBeLessThanOrEqual(45)
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

describe('salariInicial', () => {
  it('és més alt com més acomodada és la família (contactes)', () => {
    const pobra = salariInicial(FAMILY_PRESETS.pobra.familia)
    const rica = salariInicial(FAMILY_PRESETS.rica.familia)
    expect(pobra).toBeLessThan(rica)
    expect(pobra).toBeGreaterThan(0)
  })
})

describe('ajutFamiliarMax', () => {
  it('creix amb la riquesa de la família', () => {
    const pobra = ajutFamiliarMax(FAMILY_PRESETS.pobra.familia)
    const rica = ajutFamiliarMax(FAMILY_PRESETS.rica.familia)
    expect(pobra).toBeLessThan(rica)
  })
})

describe('augmentSou', () => {
  it('va del 2% (benestar 0) al 10% (benestar 100) del sou', () => {
    expect(augmentSou(1000, 0)).toBe(20)
    expect(augmentSou(1000, 100)).toBe(100)
    expect(augmentSou(1000, 50)).toBeGreaterThan(augmentSou(1000, 0))
  })
})

describe('applyBudgetMonth — benestar segons la despesa', () => {
  const base = {
    ...person,
    stats: { benestar: 50 },
    patrimoni: { efectiu: 0, estalvi: 0, inversions: 0, cases: [] },
  }
  const budget = (oci: number, compres: number) => ({
    casa: 0,
    estalvi: 0,
    oci,
    compres,
  })

  it('gastar més en oci i compres puja més el benestar', () => {
    const poc = applyBudgetMonth(base, budget(20, 0), 1000).stats.benestar
    const molt = applyBudgetMonth(base, budget(300, 100), 1000).stats.benestar
    expect(molt).toBeGreaterThan(poc)
    expect(molt).toBeGreaterThan(50)
  })

  it('no permetre’s res baixa el benestar', () => {
    expect(applyBudgetMonth(base, budget(0, 0), 1000).stats.benestar).toBeLessThan(
      50,
    )
  })
})

describe('benestarEstilDeVida (mínim de manteniment)', () => {
  it('per sota del mínim es perd benestar, al mínim és 0 i per sobre se’n guanya', () => {
    const min = minimOciCompres(1000)
    expect(benestarEstilDeVida(0, 0, 1000)).toBeLessThan(0)
    expect(benestarEstilDeVida(min, 0, 1000)).toBe(0)
    expect(benestarEstilDeVida(min + 300, 0, 1000)).toBeGreaterThan(0)
  })

  it('com més per sota del mínim, més benestar es perd', () => {
    const min = minimOciCompres(1000)
    expect(benestarEstilDeVida(5, 0, 1000)).toBeLessThan(
      benestarEstilDeVida(min - 5, 0, 1000),
    )
  })
})

describe('aportacioMinima', () => {
  it('és més alta com més pobra és la família, amb un màxim de 700', () => {
    const pobra = aportacioMinima(FAMILY_PRESETS.pobra.familia, 2000)
    const rica = aportacioMinima(FAMILY_PRESETS.rica.familia, 2000)
    expect(pobra).toBeGreaterThan(rica)
    expect(pobra).toBe(700) // 50% de 2000 = 1000, però es capa a 700
  })

  it('és 0 sense ingrés', () => {
    expect(aportacioMinima(FAMILY_PRESETS.pobra.familia, 0)).toBe(0)
  })
})

describe('resolveDespesaGreu (matalàs familiar)', () => {
  const ambEstalvi = (estalvi: number): Person => ({
    ...person,
    stats: { benestar: 70 },
    patrimoni: { efectiu: 0, estalvi, inversions: 0, cases: [] },
  })

  it('una família rica cobreix tot i el benestar a penes baixa', () => {
    const res = resolveDespesaGreu(ambEstalvi(0), FAMILY_PRESETS.rica.familia, 2500)
    expect(res.descobert).toBe(0)
    expect(res.donacio).toBe(2500)
    expect(res.person.stats.benestar).toBe(70)
  })

  it('una família pobra deixa descobert i baixa el benestar', () => {
    const res = resolveDespesaGreu(ambEstalvi(0), FAMILY_PRESETS.pobra.familia, 2500)
    expect(res.descobert).toBeGreaterThan(0)
    expect(res.person.stats.benestar).toBeLessThan(70)
  })

  it('el jugador paga primer del seu estalvi', () => {
    const res = resolveDespesaGreu(ambEstalvi(1000), FAMILY_PRESETS.pobra.familia, 600)
    expect(res.person.patrimoni.estalvi).toBe(400)
    expect(res.descobert).toBe(0)
    expect(res.donacio).toBe(0)
  })
})
