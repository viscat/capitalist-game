import { describe, expect, it } from 'vitest'
import {
  actionOptions,
  advanceTurn,
  applyChoice,
  applyMilestoneChoice,
  newGame,
  newGameAt16,
} from './engine'
import { familyBaselineBenestar, ingressosMensuals16, salariInicial } from './stats'
import { edatAnys } from './time'
import {
  EDAT_FI_ADOLESCENCIA,
  EDAT_FI_INFANCIA,
  EDAT_FI_POSTOBLIGATORI,
  MESOS_PER_ANY,
} from './constants'
import type { GameEvent, GameState } from './types'

/** Estat laboral (treball) acabat de començar, per provar el sou i les despeses. */
function laboralTreball(seed = 7): GameState {
  return applyMilestoneChoice(newGameAt16('mitjana', seed), 'treball')
}

/** Adjunta un esdeveniment amb una sola opció i en resol l'efecte. */
function resolWith(s: GameState, effect: GameEvent['choices']): GameState {
  const ev: GameEvent = {
    id: 'test_ev',
    category: 'economia',
    titleKey: 't',
    descKey: 'd',
    weight: () => 1,
    choices: effect,
  }
  return applyChoice({ ...s, pendingEvent: ev }, ev.choices![0].id)
}

function firstEnabled(s: GameState): string | undefined {
  return actionOptions(s).find((o) => !o.disabled)?.action.id
}

/** Avança un pas resolent decisions i fites (a la fita dels 16 tria `itinerari`). */
function step(s: GameState, itinerari = 'batxillerat'): GameState {
  if (s.pendingEvent) return applyChoice(s, s.pendingEvent.choices![0].id)
  if (s.pendingMilestone === 'institut') return applyMilestoneChoice(s, 'continuar')
  if (s.pendingMilestone === 'postobligatori') {
    return applyMilestoneChoice(s, itinerari)
  }
  if (s.lifeStage === 'adolescencia' || s.lifeStage === 'estudis_post') {
    return advanceTurn(s, firstEnabled(s))
  }
  return advanceTurn(s)
}

function playToEnd(
  presetId: Parameters<typeof newGame>[0],
  seed: number,
  itinerari = 'batxillerat',
): GameState {
  let s = newGame(presetId, seed)
  for (let i = 0; i < 600 && !s.acabat; i++) s = step(s, itinerari)
  return s
}

function playUntil(
  start: GameState,
  done: (s: GameState) => boolean,
  itinerari = 'batxillerat',
): GameState {
  let s = start
  for (let i = 0; i < 300 && !done(s) && !s.acabat; i++) s = step(s, itinerari)
  return s
}

describe('newGame i fites', () => {
  it('comença a la infància', () => {
    const s = newGame('mitjana', 1)
    expect(s.person.stats.benestar).toBe(familyBaselineBenestar(s.familia))
    expect(s.lifeStage).toBe('infancia')
    expect(s.acabat).toBe(false)
  })

  it('als 12 obre la fita institut i continuePhase passa a adolescència', () => {
    const fork = playUntil(newGame('mitjana', 3), (s) => !!s.pendingMilestone)
    expect(fork.pendingMilestone).toBe('institut')
    expect(fork.lifeStage).toBe('infancia')
    expect(fork.person.edatMesos).toBe(EDAT_FI_INFANCIA * MESOS_PER_ANY)
    const ado = applyMilestoneChoice(fork, 'continuar')
    expect(ado.lifeStage).toBe('adolescencia')
    expect(ado.pendingMilestone).toBeUndefined()
  })

  it('als 16 obre la fita postobligatòria sense acabar', () => {
    const ado = applyMilestoneChoice(
      playUntil(newGame('mitjana', 3), (s) => s.pendingMilestone === 'institut'),
      'continuar',
    )
    const fork = playUntil(ado, (s) => s.pendingMilestone === 'postobligatori')
    expect(fork.pendingMilestone).toBe('postobligatori')
    expect(fork.acabat).toBe(false)
    expect(fork.person.edatMesos).toBe(EDAT_FI_ADOLESCENCIA * MESOS_PER_ANY)
  })
})

describe('inici ràpid als 16', () => {
  it('aterra directament a la fita dels 16', () => {
    const s = newGameAt16('mitjana', 1)
    expect(s.pendingMilestone).toBe('postobligatori')
    expect(edatAnys(s.person.edatMesos)).toBe(16)
  })
})

describe('fork dels 16', () => {
  const fork = () => newGameAt16('mitjana', 7)

  it('triar batxillerat porta a estudis trimestrals', () => {
    const s = applyMilestoneChoice(fork(), 'batxillerat')
    expect(s.lifeStage).toBe('estudis_post')
    expect(s.itinerari).toBe('batxillerat')
    expect(s.pressupost).toBeUndefined()
    expect(actionOptions(s).length).toBeGreaterThan(0)
  })

  it('triar treball porta a la fase laboral amb pressupost i sou inicial', () => {
    const s = applyMilestoneChoice(fork(), 'treball')
    expect(s.lifeStage).toBe('laboral')
    expect(s.itinerari).toBe('treball')
    expect(s.pressupost).toBeDefined()
    expect(s.salari).toBe(salariInicial(s.familia))
    expect(actionOptions(s)).toHaveLength(0) // laboral no usa targetes
  })
})

describe('sou dinàmic i atur', () => {
  it('una pujada de sou augmenta l’ingrés mensual', () => {
    const s = laboralTreball()
    const abans = ingressosMensuals16(s)
    const after = resolWith(s, [{ id: 'a', labelKey: 'x', effect: { salariDelta: 150 } }])
    expect(after.salari).toBe(s.salari! + 150)
    expect(ingressosMensuals16(after)).toBe(abans + 150)
  })

  it('perdre la feina posa el sou a 0 i atura els ingressos', () => {
    const s = laboralTreball()
    const after = resolWith(s, [{ id: 'a', labelKey: 'x', effect: { salariNou: 0 } }])
    expect(after.salari).toBe(0)
    expect(ingressosMensuals16(after)).toBe(0)
  })

  it('una despesa greu que no pots pagar baixa el benestar (família pobra)', () => {
    let s = applyMilestoneChoice(newGameAt16('pobra', 7), 'treball')
    s = { ...s, person: { ...s.person, stats: { benestar: 70 } } }
    const after = resolWith(s, [
      { id: 'a', labelKey: 'x', effect: { despesaGreu: 3000 } },
    ])
    expect(after.person.stats.benestar).toBeLessThan(70)
    expect(after.historial.at(-1)!.descobert).toBeGreaterThan(0)
    expect(after.person.patrimoni.efectiu).toBeGreaterThanOrEqual(0)
  })
})

describe('fase laboral i pressupost', () => {
  it('cada mes avança 1 mes, ingressa i estalvia segons el pressupost', () => {
    const s = applyMilestoneChoice(newGameAt16('mitjana', 7), 'treball')
    const estalviAbans = s.person.patrimoni.estalvi
    const after = advanceTurn(s)
    expect(after.person.edatMesos).toBe(s.person.edatMesos + 1)
    expect(after.person.patrimoni.estalvi).toBeGreaterThan(estalviAbans)
    expect(after.person.patrimoni.efectiu).toBeGreaterThanOrEqual(0)
  })

  it('treballar dóna més ingrés que no fer res', () => {
    const tre = applyMilestoneChoice(newGameAt16('mitjana', 7), 'treball')
    const nin = applyMilestoneChoice(newGameAt16('mitjana', 7), 'nini')
    expect(ingressosMensuals16(tre)).toBeGreaterThan(ingressosMensuals16(nin))
  })
})

describe('final als 18', () => {
  it('la branca d’estudis acaba als 18', () => {
    const s = playToEnd('mitjana', 11, 'batxillerat')
    expect(s.acabat).toBe(true)
    expect(s.person.edatMesos).toBe(EDAT_FI_POSTOBLIGATORI * MESOS_PER_ANY)
  })

  it('la branca laboral acaba als 18 amb benestar i efectiu acotats', () => {
    const s = playToEnd('treballadora', 5, 'treball')
    expect(s.acabat).toBe(true)
    expect(s.person.edatMesos).toBe(EDAT_FI_POSTOBLIGATORI * MESOS_PER_ANY)
    expect(s.person.stats.benestar).toBeGreaterThanOrEqual(0)
    expect(s.person.stats.benestar).toBeLessThanOrEqual(100)
    expect(s.person.patrimoni.efectiu).toBeGreaterThanOrEqual(0)
  })

  it('és determinista per a una mateixa llavor i itinerari', () => {
    expect(playToEnd('alta', 42, 'treball')).toEqual(playToEnd('alta', 42, 'treball'))
  })
})

describe('decisions', () => {
  it('applyChoice resol el pendent i l’afegeix a l’historial', () => {
    let s = advanceTurn(newGame('mitjana', 0))
    for (let seed = 0; seed < 200 && !s.pendingEvent; seed++) {
      s = advanceTurn(newGame('mitjana', seed))
    }
    expect(s.pendingEvent).toBeDefined()
    const after = applyChoice(s, s.pendingEvent!.choices![0].id)
    expect(after.pendingEvent).toBeUndefined()
    expect(after.historial.at(-1)!.choiceLabelKey).toBeDefined()
  })
})
