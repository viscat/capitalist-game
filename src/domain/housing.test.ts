import { describe, expect, it } from 'vitest'
import { advanceTurn, newGameAtCarrera } from './engine'
import { patrimoniTotal } from './stats'
import {
  ajutEntradaMax,
  amortitzaHipoteca,
  calculaHipoteca,
  comprarCasa,
  costHabitatgeAnual,
  entradaHipoteca,
  llogar,
  ofertaCompra,
  tornarAmbPares,
} from './housing'
import type { FamilyClass, GameState } from './types'

function ricCarrera(): GameState {
  const s = newGameAtCarrera('mitjana', 1)
  // Prou líquid per a l'entrada d'un habitatge.
  return { ...s, person: { ...s.person, patrimoni: { ...s.person.patrimoni, estalvi: 40_000 } } }
}

function carreraAmbLiquid(classe: FamilyClass, liquid: number): GameState {
  const s = newGameAtCarrera(classe, 1)
  return {
    ...s,
    person: {
      ...s.person,
      patrimoni: { ...s.person.patrimoni, efectiu: 0, estalvi: liquid },
    },
  }
}

describe('hipoteca', () => {
  it('l’entrada és el 20% i la quota anual és positiva', () => {
    expect(entradaHipoteca(100_000)).toBe(20_000)
    const h = calculaHipoteca(100_000, 30)
    expect(h.deute).toBe(80_000)
    expect(h.quotaAnual).toBeGreaterThan(0)
    expect(h.anysRestants).toBe(30)
  })

  it('s’amortitza fins a quedar saldada', () => {
    let hip = calculaHipoteca(100_000, 2)
    hip = amortitzaHipoteca(hip)!
    expect(hip.deute).toBeLessThan(80_000)
    const fi = amortitzaHipoteca(hip)
    expect(fi).toBeUndefined() // últim any: saldada
  })
})

describe('llogar', () => {
  it('canvia a lloguer amb el seu cost anual', () => {
    const s = llogar(ricCarrera(), 'pis_lloguer')
    expect(s.habitatge?.tipus).toBe('pis_lloguer')
    expect(costHabitatgeAnual(s.habitatge)).toBeGreaterThan(0)
    expect(tornarAmbPares(s).habitatge?.tipus).toBe('amb_pares')
  })
})

describe('comprarCasa', () => {
  it('compra si hi ha entrada i el banc aprova: suma la casa i obre hipoteca', () => {
    const s = ricCarrera()
    const after = comprarCasa(s, 'estudi', 30)
    expect(after.habitatge?.tipus).toBe('propietat')
    expect(after.habitatge?.hipoteca).toBeDefined()
    expect(after.person.patrimoni.cases.length).toBe(1)
    // Ha pagat l'entrada (líquid més baix que abans).
    const liquidAbans = s.person.patrimoni.efectiu + s.person.patrimoni.estalvi
    const liquidDespres = after.person.patrimoni.efectiu + after.person.patrimoni.estalvi
    expect(liquidDespres).toBeLessThan(liquidAbans)
  })

  it('no compra si no es pot pagar l’entrada', () => {
    const pobre = newGameAtCarrera('mitjana', 1) // poc líquid d'inici
    const after = comprarCasa(pobre, 'casa', 30)
    expect(after.habitatge?.tipus).not.toBe('propietat')
    expect(after.person.patrimoni.cases.length).toBe(0)
  })
})

describe('cost de l’habitatge en un any de carrera', () => {
  it('pagar lloguer redueix més el patrimoni que viure amb els pares', () => {
    const base = ricCarrera()
    const ambPares = advanceTurn(base)
    const llogat = advanceTurn(llogar(base, 'pis_lloguer'))
    expect(patrimoniTotal(llogat.person)).toBeLessThan(
      patrimoniTotal(ambPares.person),
    )
  })
})

describe('ofertaCompra', () => {
  it('marca si tens l’entrada i si el banc aprova', () => {
    const oferta = ofertaCompra(ricCarrera(), 95_000, 30)
    expect(oferta.entrada).toBe(19_000)
    expect(oferta.teEntrada).toBe(true)
    expect(typeof oferta.bancAprova).toBe('boolean')
  })
})

describe('ajut familiar per a l’entrada', () => {
  it('la pobra no aporta res i la treballadora molt poc; creix amb la classe', () => {
    const pobra = ajutEntradaMax(newGameAtCarrera('pobra', 1).familia)
    const treballadora = ajutEntradaMax(newGameAtCarrera('treballadora', 1).familia)
    const mitjana = ajutEntradaMax(newGameAtCarrera('mitjana', 1).familia)
    const alta = ajutEntradaMax(newGameAtCarrera('alta', 1).familia)
    expect(pobra).toBe(0)
    expect(treballadora).toBeGreaterThan(0)
    expect(treballadora).toBeLessThan(mitjana)
    expect(mitjana).toBeLessThan(alta)
  })

  it('l’ajut només cobreix el que et falta per a l’entrada', () => {
    // Líquid (12.000 €) per sota de l'entrada de l'estudi (19.000 €): falten 7.000.
    const s = carreraAmbLiquid('alta', 12_000)
    const oferta = ofertaCompra(s, 95_000, 30)
    expect(oferta.entrada).toBe(19_000)
    expect(oferta.ajutFamiliar).toBe(7_000)
    expect(oferta.teEntrada).toBe(true)
  })

  it('amb la mateixa caixa, la família alta deixa comprar i la pobra no', () => {
    const ric = comprarCasa(carreraAmbLiquid('alta', 12_000), 'estudi', 30)
    const pobre = comprarCasa(carreraAmbLiquid('pobra', 12_000), 'estudi', 30)
    expect(ric.habitatge?.tipus).toBe('propietat')
    expect(pobre.habitatge?.tipus).not.toBe('propietat')
  })
})
