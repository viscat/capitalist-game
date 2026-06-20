import { describe, expect, it } from 'vitest'
import { advanceTurn, applyChoice, newGame } from './engine'
import { familyBaselineBenestar } from './stats'
import { EDAT_FI_INFANCIA } from './constants'
import type { GameState } from './types'

/** Juga una partida sencera resolent les decisions amb la primera opció. */
function playToEnd(presetId: Parameters<typeof newGame>[0], seed: number): GameState {
  let s = newGame(presetId, seed)
  let guard = 0
  while (!s.acabat && guard < 100) {
    s = s.pendingEvent
      ? applyChoice(s, s.pendingEvent.choices![0].id)
      : advanceTurn(s)
    guard++
  }
  return s
}

describe('newGame', () => {
  it('inicialitza el benestar amb la referència de la família', () => {
    const s = newGame('mitjana', 1)
    expect(s.person.stats.benestar).toBe(familyBaselineBenestar(s.familia))
    expect(s.torn).toBe(0)
    expect(s.acabat).toBe(false)
    expect(s.person.edatMesos).toBe(0)
    expect(s.historial).toHaveLength(0)
  })
})

describe('advanceTurn', () => {
  it('envelleix un any i incrementa el torn', () => {
    const s = advanceTurn(newGame('treballadora', 7))
    expect(s.torn).toBe(1)
    expect(s.person.edatMesos).toBe(12)
  })

  it('és determinista per a una mateixa llavor', () => {
    expect(playToEnd('alta', 123)).toEqual(playToEnd('alta', 123))
  })

  it('produeix llavors diferents amb resultats diferents', () => {
    const a = playToEnd('mitjana', 1)
    const b = playToEnd('mitjana', 999)
    expect(a.historial).not.toEqual(b.historial)
  })
})

describe('partida completa', () => {
  it('acaba als 12 anys amb un historial per torn i benestar acotat', () => {
    const s = playToEnd('pobra', 42)
    expect(s.acabat).toBe(true)
    expect(s.person.edatMesos).toBe(EDAT_FI_INFANCIA * 12)
    expect(s.historial).toHaveLength(EDAT_FI_INFANCIA)
    expect(s.person.stats.benestar).toBeGreaterThanOrEqual(0)
    expect(s.person.stats.benestar).toBeLessThanOrEqual(100)
  })

  it('no avança un cop acabada', () => {
    const s = playToEnd('rica', 5)
    expect(advanceTurn(s)).toBe(s)
  })
})

describe('decisions', () => {
  it('applyChoice resol el pendent i l’afegeix a l’historial', () => {
    // Busquem una llavor que generi un esdeveniment amb decisió al primer torn.
    let s = newGame('mitjana', 0)
    for (let seed = 0; seed < 200 && !s.pendingEvent; seed++) {
      s = advanceTurn(newGame('mitjana', seed))
    }
    expect(s.pendingEvent).toBeDefined()
    const choiceId = s.pendingEvent!.choices![0].id
    const after = applyChoice(s, choiceId)
    expect(after.pendingEvent).toBeUndefined()
    expect(after.historial).toHaveLength(1)
    expect(after.historial[0].choiceLabelKey).toBeDefined()
  })

  it('no permet avançar mentre hi ha una decisió pendent', () => {
    let s = newGame('mitjana', 0)
    for (let seed = 0; seed < 200 && !s.pendingEvent; seed++) {
      s = advanceTurn(newGame('mitjana', seed))
    }
    expect(s.pendingEvent).toBeDefined()
    expect(advanceTurn(s)).toBe(s)
  })
})
