import { describe, expect, it } from 'vitest'
import {
  actionOptions,
  advanceTurn,
  applyChoice,
  continuePhase,
  newGame,
} from './engine'
import { familyBaselineBenestar } from './stats'
import { EDAT_FI_ADOLESCENCIA, EDAT_FI_INFANCIA, MESOS_PER_ANY } from './constants'
import type { GameState } from './types'

/** Id de la primera acció habilitada disponible. */
function firstEnabled(s: GameState): string | undefined {
  return actionOptions(s).find((o) => !o.disabled)?.action.id
}

/** Avança un pas resolent decisions, transicions i triant una acció a l'adolescència. */
function step(s: GameState): GameState {
  if (s.pendingEvent) return applyChoice(s, s.pendingEvent.choices![0].id)
  if (s.transicioPendent) return continuePhase(s)
  if (s.lifeStage === 'adolescencia') return advanceTurn(s, firstEnabled(s))
  return advanceTurn(s)
}

/** Juga una partida sencera fins al final. */
function playToEnd(presetId: Parameters<typeof newGame>[0], seed: number): GameState {
  let s = newGame(presetId, seed)
  for (let i = 0; i < 500 && !s.acabat; i++) s = step(s)
  return s
}

/** Avança fins que es compleix una condició (resolent pel camí). */
function playUntil(
  presetId: Parameters<typeof newGame>[0],
  seed: number,
  done: (s: GameState) => boolean,
): GameState {
  let s = newGame(presetId, seed)
  for (let i = 0; i < 200 && !done(s) && !s.acabat; i++) s = step(s)
  return s
}

describe('newGame', () => {
  it('inicialitza el benestar amb la referència de la família', () => {
    const s = newGame('mitjana', 1)
    expect(s.person.stats.benestar).toBe(familyBaselineBenestar(s.familia))
    expect(s.torn).toBe(0)
    expect(s.acabat).toBe(false)
    expect(s.lifeStage).toBe('infancia')
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
  it('als 12 anys marca la transició sense canviar de fase ni acabar', () => {
    const s = playUntil('mitjana', 3, (g) => !!g.transicioPendent)
    expect(s.transicioPendent).toBe(true)
    expect(s.lifeStage).toBe('infancia')
    expect(s.acabat).toBe(false)
    expect(s.person.edatMesos).toBe(EDAT_FI_INFANCIA * MESOS_PER_ANY)
  })

  it('continuePhase passa a l’adolescència i deixa constància al registre', () => {
    const abans = playUntil('mitjana', 3, (g) => !!g.transicioPendent)
    const longAbans = abans.historial.length
    const ado = continuePhase(abans)
    expect(ado.lifeStage).toBe('adolescencia')
    expect(ado.transicioPendent).toBe(false)
    expect(ado.historial.length).toBe(longAbans + 1)
    expect(ado.historial.at(-1)!.eventId).toBe('transicio_institut')
  })
})

describe('actionOptions', () => {
  it('no n’hi ha a la infància i n’hi ha a l’adolescència', () => {
    expect(actionOptions(newGame('mitjana', 3))).toHaveLength(0)
    const ado = playUntil('mitjana', 3, (g) => g.lifeStage === 'adolescencia')
    expect(actionOptions(ado).length).toBeGreaterThan(0)
  })

  it('mostra les accions massa cares com a deshabilitades, no les amaga', () => {
    let ado = playUntil('pobra', 7, (g) => g.lifeStage === 'adolescencia')
    // Forcem manca d'efectiu per garantir que un caprici no és assequible.
    ado = { ...ado, person: { ...ado.person, patrimoni: { ...ado.person.patrimoni, efectiu: 0 } } }
    const opcions = actionOptions(ado)
    const caprici = opcions.find((o) => o.action.id === 'caprici')
    expect(caprici).toBeDefined()
    expect(caprici!.disabled).toBe(true)
    expect(caprici!.reasonKey).toBe('action.locked.diners')
    // Sempre queda almenys una acció habilitada (trimestre tranquil).
    expect(opcions.some((o) => !o.disabled)).toBe(true)
  })

  it('la feina d’estiu només està habilitada a l’estiu', () => {
    let s = playUntil('mitjana', 3, (g) => g.lifeStage === 'adolescencia')
    let habilitadaEstiu = false
    let deshabilitadaFora = false
    for (let i = 0; i < 16 && !s.acabat; i++) {
      const feina = actionOptions(s).find((o) => o.action.id === 'feina_estiu')
      if (feina && !feina.disabled) habilitadaEstiu = true
      if (feina && feina.disabled && feina.reasonKey === 'action.locked.estiu') {
        deshabilitadaFora = true
      }
      s = s.pendingEvent
        ? applyChoice(s, s.pendingEvent.choices![0].id)
        : advanceTurn(s, 'mes_tranquil')
    }
    expect(habilitadaEstiu).toBe(true)
    expect(deshabilitadaFora).toBe(true)
  })
})

describe('adolescència — paga', () => {
  it('cada torn avança 3 mesos i ingressa la paga', () => {
    const ado = playUntil('mitjana', 3, (g) => g.lifeStage === 'adolescencia')
    const efectiuAbans = ado.person.patrimoni.efectiu
    const seguent = advanceTurn(ado, 'mes_tranquil')
    expect(seguent.person.edatMesos).toBe(ado.person.edatMesos + 3)
    expect(seguent.person.patrimoni.efectiu).toBeGreaterThan(efectiuAbans)
  })
})

describe('partida completa', () => {
  it('acaba als 16 anys amb benestar i efectiu acotats', () => {
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
