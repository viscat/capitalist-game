import { describe, expect, it } from 'vitest'
import { advanceTurn, applyChoice, availableActions, newGame } from './engine'
import { familyBaselineBenestar } from './stats'
import { EDAT_FI_ADOLESCENCIA, EDAT_FI_INFANCIA, MESOS_PER_ANY } from './constants'
import type { GameState } from './types'

/** Juga una partida sencera resolent decisions i triant sempre la primera acció. */
function playToEnd(presetId: Parameters<typeof newGame>[0], seed: number): GameState {
  let s = newGame(presetId, seed)
  let guard = 0
  while (!s.acabat && guard < 500) {
    if (s.pendingEvent) {
      s = applyChoice(s, s.pendingEvent.choices![0].id)
    } else if (s.lifeStage === 'adolescencia') {
      s = advanceTurn(s, availableActions(s)[0]?.id)
    } else {
      s = advanceTurn(s)
    }
    guard++
  }
  return s
}

/** Avança fins a entrar a una fase determinada (resolent decisions). */
function playUntilStage(
  presetId: Parameters<typeof newGame>[0],
  seed: number,
  stage: GameState['lifeStage'],
): GameState {
  let s = newGame(presetId, seed)
  let guard = 0
  while (s.lifeStage !== stage && !s.acabat && guard < 100) {
    s = s.pendingEvent
      ? applyChoice(s, s.pendingEvent.choices![0].id)
      : advanceTurn(s, availableActions(s)[0]?.id)
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
    expect(s.lifeStage).toBe('infancia')
    expect(s.person.edatMesos).toBe(0)
  })
})

describe('advanceTurn — infància', () => {
  it('envelleix un any i incrementa el torn', () => {
    const s = advanceTurn(newGame('treballadora', 7))
    expect(s.torn).toBe(1)
    expect(s.person.edatMesos).toBe(12)
  })

  it('és determinista per a una mateixa llavor', () => {
    expect(playToEnd('alta', 123)).toEqual(playToEnd('alta', 123))
  })
})

describe('transició a l’adolescència', () => {
  it('passa a adolescència als 12 anys sense acabar la partida', () => {
    const s = playUntilStage('mitjana', 3, 'adolescencia')
    expect(s.lifeStage).toBe('adolescencia')
    expect(s.acabat).toBe(false)
    expect(s.person.edatMesos).toBe(EDAT_FI_INFANCIA * MESOS_PER_ANY)
  })

  it('no hi ha accions a la infància i sí a l’adolescència', () => {
    expect(availableActions(newGame('mitjana', 3))).toHaveLength(0)
    const ado = playUntilStage('mitjana', 3, 'adolescencia')
    expect(availableActions(ado).length).toBeGreaterThan(0)
  })
})

describe('adolescència — torns trimestrals i paga', () => {
  it('cada torn avança 3 mesos i ingressa la paga', () => {
    const ado = playUntilStage('mitjana', 3, 'adolescencia')
    const efectiuAbans = ado.person.patrimoni.efectiu
    // «Trimestre tranquil» no gasta ni ingressa res a banda de la paga.
    const seguent = advanceTurn(ado, 'mes_tranquil')
    expect(seguent.person.edatMesos).toBe(ado.person.edatMesos + 3)
    expect(seguent.person.patrimoni.efectiu).toBeGreaterThan(efectiuAbans)
  })

  it('la feina d’estiu només està disponible a l’estiu', () => {
    let s = playUntilStage('mitjana', 3, 'adolescencia')
    let estiu = false
    let altra = false
    for (let i = 0; i < 16 && !s.acabat; i++) {
      const teFeinaEstiu = availableActions(s).some((a) => a.id === 'feina_estiu')
      if (teFeinaEstiu) estiu = true
      else altra = true
      s = s.pendingEvent
        ? applyChoice(s, s.pendingEvent.choices![0].id)
        : advanceTurn(s, 'mes_tranquil')
    }
    expect(estiu).toBe(true)
    expect(altra).toBe(true)
  })
})

describe('partida completa', () => {
  it('acaba als 16 anys amb benestar acotat', () => {
    const s = playToEnd('pobra', 42)
    expect(s.acabat).toBe(true)
    expect(s.person.edatMesos).toBe(EDAT_FI_ADOLESCENCIA * MESOS_PER_ANY)
    expect(s.person.stats.benestar).toBeGreaterThanOrEqual(0)
    expect(s.person.stats.benestar).toBeLessThanOrEqual(100)
    expect(s.person.patrimoni.efectiu).toBeGreaterThanOrEqual(0)
  })

  it('no avança un cop acabada', () => {
    const s = playToEnd('rica', 5)
    expect(advanceTurn(s, 'mes_tranquil')).toBe(s)
  })
})

describe('decisions', () => {
  it('applyChoice resol el pendent i l’afegeix a l’historial', () => {
    let s = advanceTurn(newGame('mitjana', 0))
    for (let seed = 0; seed < 200 && !s.pendingEvent; seed++) {
      s = advanceTurn(newGame('mitjana', seed))
    }
    expect(s.pendingEvent).toBeDefined()
    const longAbans = s.historial.length
    const after = applyChoice(s, s.pendingEvent!.choices![0].id)
    expect(after.pendingEvent).toBeUndefined()
    expect(after.historial.length).toBe(longAbans + 1)
    expect(after.historial.at(-1)!.choiceLabelKey).toBeDefined()
  })
})
