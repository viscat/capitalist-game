import { describe, expect, it } from 'vitest'
import { advanceTurn, newGameAtCarrera } from './engine'
import { patrimoniTotal } from './stats'
import {
  amortitzaHipoteca,
  calculaHipoteca,
  comprarCasa,
  costHabitatgeAnual,
  entradaHipoteca,
  llogar,
  ofertaCompra,
  tornarAmbPares,
} from './housing'
import type { GameState } from './types'

function ricCarrera(): GameState {
  const s = newGameAtCarrera('mitjana', 1)
  // Prou líquid per a l'entrada d'un habitatge.
  return { ...s, person: { ...s.person, patrimoni: { ...s.person.patrimoni, estalvi: 40_000 } } }
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
