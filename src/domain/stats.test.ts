import { describe, expect, it } from 'vitest'
import {
  ajutFamiliarMax,
  aportacioMinima,
  applyBudgetYear,
  applyCareerYear,
  applyEffect,
  augmentSou,
  balancUniversitatAnual,
  benestarEstilDeVida,
  benestarNivellVida,
  clampBenestar,
  cobreixVidaFamiliar,
  costVidaAnual,
  costVidaPropi,
  creixementInversions,
  desglosNominaAnual,
  desglosNominaMensual,
  desgravacioPensions,
  irpfAnual,
  netAnual,
  minimOciCompres,
  estalviAnualCriatura,
  familyBaselineBenestar,
  pagaMensual,
  penalitzacioDescobert,
  resolveDespesaGreu,
  salariAdultInicial,
  salariInicial,
} from './stats'
import { FAMILY_PRESETS } from './family/presets'
import { SALARI_MINIM_MENSUAL } from './constants'
import type { Patrimoni, Person } from './types'

const person: Person = {
  edatMesos: 0,
  stats: { benestar: 50 },
  patrimoni: {
    efectiu: 0,
    estalvi: 0,
    inversions: 0,
    fonsIndexat: 0,
    fonsPensions: 0,
    cases: [],
  },
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

describe('applyBudgetYear — benestar segons la despesa', () => {
  const base = {
    ...person,
    stats: { benestar: 50 },
    patrimoni: {
      efectiu: 0,
      estalvi: 0,
      inversions: 0,
      fonsIndexat: 0,
      fonsPensions: 0,
      cases: [],
    },
  }
  const budget = (oci: number, compres: number) => ({
    casa: 0,
    estalvi: 0,
    oci,
    compres,
  })

  it('gastar més en oci i compres puja més el benestar', () => {
    const poc = applyBudgetYear(base, budget(20, 0), 1000).stats.benestar
    const molt = applyBudgetYear(base, budget(300, 100), 1000).stats.benestar
    expect(molt).toBeGreaterThan(poc)
    expect(molt).toBeGreaterThan(50)
  })

  it('no permetre’s res baixa el benestar', () => {
    expect(applyBudgetYear(base, budget(0, 0), 1000).stats.benestar).toBeLessThan(
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
    patrimoni: {
      efectiu: 0,
      estalvi,
      inversions: 0,
      fonsIndexat: 0,
      fonsPensions: 0,
      cases: [],
    },
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

// --- Vida adulta i inversions ---

const patrimoniAmb = (parts: Partial<Patrimoni>): Patrimoni => ({
  efectiu: 0,
  estalvi: 0,
  inversions: 0,
  fonsIndexat: 0,
  fonsPensions: 0,
  cases: [],
  ...parts,
})

describe('salariAdultInicial', () => {
  it('el títol universitari apuja el sou', () => {
    const f = FAMILY_PRESETS.mitjana.familia
    expect(salariAdultInicial(f, true)).toBeGreaterThan(salariAdultInicial(f, false))
  })

  it('una família amb més contactes parteix d’un sou més alt', () => {
    const pobra = salariAdultInicial(FAMILY_PRESETS.pobra.familia, false)
    const rica = salariAdultInicial(FAMILY_PRESETS.rica.familia, false)
    expect(pobra).toBeLessThan(rica)
  })

  it('les classes pobra i treballadora comencen amb el salari mínim (17k bruts/any)', () => {
    const pobra = salariAdultInicial(FAMILY_PRESETS.pobra.familia, false)
    const treballadora = salariAdultInicial(FAMILY_PRESETS.treballadora.familia, false)
    expect(pobra).toBe(SALARI_MINIM_MENSUAL)
    expect(treballadora).toBe(SALARI_MINIM_MENSUAL)
    expect(pobra * 12).toBeGreaterThanOrEqual(16_900)
    expect(pobra * 12).toBeLessThanOrEqual(17_100)
    // Cap classe comença per sota del salari mínim.
    expect(salariAdultInicial(FAMILY_PRESETS.mitjana.familia, false)).toBeGreaterThanOrEqual(
      SALARI_MINIM_MENSUAL,
    )
  })
})

describe('balancUniversitatAnual', () => {
  it('és més alt com més recursos té la família, i mai negatiu per a la pobra', () => {
    const pobra = balancUniversitatAnual(FAMILY_PRESETS.pobra.familia)
    const rica = balancUniversitatAnual(FAMILY_PRESETS.rica.familia)
    expect(pobra).toBeGreaterThanOrEqual(0) // la beca compensa la matrícula
    expect(rica).toBeGreaterThan(pobra)
  })
})

describe('creixementInversions', () => {
  it('el pla de pensions creix de forma estable i el fons indexat segueix el mercat', () => {
    const p = patrimoniAmb({ fonsPensions: 1000, fonsIndexat: 1000 })
    const puja = creixementInversions(p, 0.1)
    expect(puja.fonsPensions).toBeGreaterThan(1000)
    expect(puja.fonsIndexat).toBe(1100)
    // En un mal any, el fons indexat baixa; el pla de pensions no.
    const baixa = creixementInversions(p, -0.2)
    expect(baixa.fonsIndexat).toBe(800)
    expect(baixa.fonsPensions).toBeGreaterThan(1000)
  })
})

describe('desgravacioPensions', () => {
  it('retorna una fracció de l’aportació, amb un límit', () => {
    expect(desgravacioPensions(1000)).toBe(200)
    // Per sobre del límit de desgravació, no creix més.
    expect(desgravacioPensions(5000)).toBe(desgravacioPensions(1500))
  })
})

describe('applyCareerYear', () => {
  const adult: Person = {
    edatMesos: 22 * 12,
    stats: { benestar: 50 },
    patrimoni: patrimoniAmb({ efectiu: 20000 }),
  }

  it('aporta a les inversions i la desgravació de pensions torna a efectiu', () => {
    const pla = { oci: 2000, estalvi: 1000, fonsIndexat: 3000, fonsPensions: 1000 }
    const after = applyCareerYear(adult, pla, 24000, 0.05)
    expect(after.patrimoni.fonsIndexat).toBeGreaterThan(0)
    expect(after.patrimoni.fonsPensions).toBe(1000)
    expect(after.patrimoni.estalvi).toBe(1000)
    expect(after.patrimoni.efectiu).toBeGreaterThanOrEqual(0)
  })

  it('no genera deute encara que el pla superi el disponible', () => {
    const pobre: Person = {
      edatMesos: 22 * 12,
      stats: { benestar: 50 },
      patrimoni: patrimoniAmb({ efectiu: 0 }),
    }
    const pla = { oci: 0, estalvi: 0, fonsIndexat: 99999, fonsPensions: 0 }
    const after = applyCareerYear(pobre, pla, 12000, 0.05)
    expect(after.patrimoni.efectiu).toBeGreaterThanOrEqual(0)
  })
})

describe('penalitzacioDescobert', () => {
  it('és 0 sense descobert i creix de forma acotada', () => {
    expect(penalitzacioDescobert(0)).toBe(0)
    expect(penalitzacioDescobert(500)).toBeGreaterThan(0)
    expect(penalitzacioDescobert(2000)).toBeGreaterThan(penalitzacioDescobert(500))
    expect(penalitzacioDescobert(1_000_000)).toBeLessThanOrEqual(15)
  })
})

describe('pressupost amb dèficit (gastar per sobre de l’ingrés)', () => {
  const cap = 0
  const adult = (efectiu: number, estalvi: number, benestar = 60): Person => ({
    edatMesos: 22 * 12,
    stats: { benestar },
    patrimoni: patrimoniAmb({ efectiu, estalvi }),
  })
  const plaZero = { oci: cap, estalvi: cap, fonsIndexat: cap, fonsPensions: cap }

  it('applyCareerYear: el dèficit (cost > ingrés) es paga tirant de l’estalvi, sense deute', () => {
    // Ingrés 0 i cost de vida 6000 → 6000 de dèficit; surt de l’estalvi.
    const after = applyCareerYear(adult(0, 5000), plaZero, 0, 0, 6000, 0, FAMILY_PRESETS.rica.familia)
    expect(after.patrimoni.estalvi).toBeLessThan(5000)
    expect(after.patrimoni.estalvi).toBeGreaterThanOrEqual(0)
    expect(after.patrimoni.efectiu).toBe(0)
  })

  it('applyCareerYear: la família cobreix part del dèficit (menys penalització que sense)', () => {
    const ambFamilia = applyCareerYear(adult(0, 0), plaZero, 0, 0, 6000, 0, FAMILY_PRESETS.rica.familia)
    const senseFamilia = applyCareerYear(adult(0, 0), plaZero, 0, 0, 6000, 0)
    expect(ambFamilia.stats.benestar).toBeGreaterThan(senseFamilia.stats.benestar)
    // Sense estalvis ni família suficient, el descobert resta benestar.
    expect(senseFamilia.stats.benestar).toBeLessThan(60)
    expect(senseFamilia.patrimoni.efectiu).toBe(0)
  })

  it('applyBudgetYear: gastar per sobre del sou tira de l’estalvi (no deute)', () => {
    const person: Person = {
      edatMesos: 16 * 12,
      stats: { benestar: 50 },
      patrimoni: patrimoniAmb({ efectiu: 0, estalvi: 3000 }),
    }
    // Sou 100/mes però 300/mes d’oci → dèficit anual cobert per l’estalvi.
    const budget = { casa: 0, estalvi: 0, oci: 300, compres: 0 }
    const after = applyBudgetYear(person, budget, 100, 0, FAMILY_PRESETS.mitjana.familia)
    expect(after.patrimoni.estalvi).toBeLessThan(3000)
    expect(after.patrimoni.estalvi).toBeGreaterThanOrEqual(0)
    expect(after.patrimoni.efectiu).toBe(0)
  })
})

describe('costVidaPropi (cobertura familiar mentre vius amb els pares)', () => {
  const ambPares = { tipus: 'amb_pares' as const }
  const llogat = { tipus: 'pis_lloguer' as const, lloguerAnual: 10_800 }

  it('amb pares pobres pagues tot el cost de vida; amb pares rics no en pagues res', () => {
    const total = costVidaAnual()
    expect(costVidaPropi(FAMILY_PRESETS.pobra.familia, ambPares)).toBe(total)
    expect(costVidaPropi(FAMILY_PRESETS.rica.familia, ambPares)).toBe(0)
    expect(costVidaPropi(FAMILY_PRESETS.super_rica.familia, ambPares)).toBe(0)
  })

  it('com més acomodada la família, menys cost de vida pagues vivint amb ells', () => {
    const pobra = costVidaPropi(FAMILY_PRESETS.pobra.familia, ambPares)
    const mitjana = costVidaPropi(FAMILY_PRESETS.mitjana.familia, ambPares)
    const alta = costVidaPropi(FAMILY_PRESETS.alta.familia, ambPares)
    expect(mitjana).toBeLessThan(pobra)
    expect(alta).toBeLessThan(mitjana)
  })

  it('el cost de vida és un valor fix per nivell (no depèn de l’ingrés)', () => {
    expect(costVidaAnual('minim')).toBe(6_000)
    expect(costVidaAnual('mig')).toBe(8_400)
    expect(costVidaAnual('alt')).toBe(9_600)
    expect(costVidaAnual('minim')).toBeLessThan(costVidaAnual('mig'))
    expect(costVidaAnual('mig')).toBeLessThan(costVidaAnual('alt'))
  })

  it('un nivell de vida més alt costa més però dóna més benestar', () => {
    expect(benestarNivellVida('minim')).toBeLessThan(benestarNivellVida('mig'))
    expect(benestarNivellVida('mig')).toBeLessThan(benestarNivellVida('alt'))
    expect(costVidaPropi(FAMILY_PRESETS.pobra.familia, llogat, 'alt')).toBeGreaterThan(
      costVidaPropi(FAMILY_PRESETS.pobra.familia, llogat, 'minim'),
    )
  })

  it('si vius pel teu compte pagues tot el cost de vida sigui quina sigui la família', () => {
    const total = costVidaAnual('mig')
    expect(costVidaPropi(FAMILY_PRESETS.rica.familia, llogat, 'mig')).toBe(total)
    expect(cobreixVidaFamiliar(FAMILY_PRESETS.rica.familia, llogat, 'mig')).toBe(0)
  })

  it('la part coberta + la part pròpia sumen el cost de vida total', () => {
    const f = FAMILY_PRESETS.alta.familia
    const propi = costVidaPropi(f, ambPares, 'alt')
    const cobert = cobreixVidaFamiliar(f, ambPares, 'alt')
    expect(propi + cobert).toBe(costVidaAnual('alt'))
    expect(cobert).toBeGreaterThan(0)
  })
})

describe('nòmina: del brut al net', () => {
  it('el net és més baix que el brut i quadra (brut = net + SS + IRPF)', () => {
    const n = desglosNominaAnual(24_000)
    expect(n.seguretatSocial).toBeGreaterThan(0)
    expect(n.irpf).toBeGreaterThan(0)
    expect(n.net).toBeLessThan(n.brut)
    expect(n.seguretatSocial + n.irpf + n.net).toBe(n.brut)
  })

  it('és progressiu: un sou alt paga un tipus efectiu d’IRPF més alt', () => {
    const baix = desglosNominaAnual(18_000)
    const alt = desglosNominaAnual(70_000)
    const tipusBaix = baix.irpf / baix.brut
    const tipusAlt = alt.irpf / alt.brut
    expect(tipusAlt).toBeGreaterThan(tipusBaix)
  })

  it('un sou molt baix gairebé no paga IRPF (mínim personal exempt)', () => {
    // Per sota del mínim personal + cotitzacions no queda base liquidable.
    expect(irpfAnual(0)).toBe(0)
    expect(desglosNominaAnual(5_000).irpf).toBe(0)
  })

  it('el desglossament mensual és coherent amb l’anual', () => {
    const mes = desglosNominaMensual(2_000)
    expect(mes.net).toBeLessThan(mes.brut)
    expect(mes.net).toBeGreaterThan(0)
    // El net mensual és aproximadament el net anual entre 12.
    expect(Math.abs(mes.net - netAnual(24_000) / 12)).toBeLessThan(2)
  })
})
