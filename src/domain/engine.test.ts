import { describe, expect, it } from 'vitest'
import {
  acceptarOferta,
  actionOptions,
  advanceTurn,
  applyChoice,
  applyMilestoneChoice,
  newGame,
  newGameAt16,
  newGameAtCarrera,
} from './engine'
import {
  aportacioMinima,
  augmentSou,
  familyBaselineBenestar,
  ingressosMensuals16,
  salariInicial,
} from './stats'
import { edatAnys } from './time'
import {
  EDAT_FI_ADOLESCENCIA,
  EDAT_FI_CARRERA,
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

/**
 * Avança un pas resolent decisions i fites. A la fita dels 16 tria `itinerari`;
 * als 18, qui ve de batxillerat va a la universitat i la resta a la carrera; als
 * 22 (fi d'universitat) comença la carrera.
 */
function step(s: GameState, itinerari = 'batxillerat'): GameState {
  if (s.pendingEvent) return applyChoice(s, s.pendingEvent.choices![0].id)
  if (s.pendingMilestone === 'institut') return applyMilestoneChoice(s, 'continuar')
  if (s.pendingMilestone === 'postobligatori') {
    return applyMilestoneChoice(s, itinerari)
  }
  if (s.pendingMilestone === 'majoria') {
    return applyMilestoneChoice(s, itinerari === 'batxillerat' ? 'universitat' : 'carrera')
  }
  if (s.pendingMilestone === 'fi_uni') {
    return applyMilestoneChoice(s, 'comencar_carrera')
  }
  // A l'atur a la carrera, accepta la primera oferta (la cerca de feina no es bloqueja).
  if (s.lifeStage === 'carrera' && (s.salari ?? 0) === 0 && s.ofertesFeina?.length) {
    return acceptarOferta(s, s.ofertesFeina[0].id)
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
  for (let i = 0; i < 1200 && !s.acabat; i++) s = step(s, itinerari)
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

  it('triar batxillerat porta a estudis postobligatoris (acció per any)', () => {
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
    // El sou és brut: pujar-lo augmenta el net, però menys de 150 (impostos).
    expect(ingressosMensuals16(after)).toBeGreaterThan(abans)
    expect(ingressosMensuals16(after)).toBeLessThan(abans + 150)
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

  it('demanar un augment apuja el sou i marca el cooldown anual', () => {
    const s = laboralTreball()
    const after = resolWith(s, [
      {
        id: 'a',
        labelKey: 'x',
        effect: {},
        resolve: (st) => ({
          salariDelta: augmentSou(st.salari ?? 0, st.person.stats.benestar),
          marcaAugmentSou: true,
        }),
      },
    ])
    expect(after.salari).toBeGreaterThan(s.salari!)
    expect(after.ultimAugmentMes).toBe(after.person.edatMesos)
  })
})

describe('aportació obligatòria a casa', () => {
  it('el pressupost inicial respecta el mínim obligatori segons la família', () => {
    const s = applyMilestoneChoice(newGameAt16('pobra', 7), 'treball')
    // L'aportació es calcula sobre l'ingrés net (el que es cobra), no el brut.
    const min = aportacioMinima(s.familia, ingressosMensuals16(s))
    expect(min).toBeGreaterThan(0)
    expect(s.pressupost!.casa).toBeGreaterThanOrEqual(min)
  })
})

describe('fase laboral i pressupost', () => {
  it('cada torn avança 1 any, ingressa i estalvia segons el pressupost mensual', () => {
    const s = applyMilestoneChoice(newGameAt16('mitjana', 7), 'treball')
    const estalviAbans = s.person.patrimoni.estalvi
    const after = advanceTurn(s)
    expect(after.person.edatMesos).toBe(s.person.edatMesos + MESOS_PER_ANY)
    expect(after.person.patrimoni.estalvi).toBeGreaterThan(estalviAbans)
    expect(after.person.patrimoni.efectiu).toBeGreaterThanOrEqual(0)
  })

  it('treballar dóna més ingrés que no fer res', () => {
    const tre = applyMilestoneChoice(newGameAt16('mitjana', 7), 'treball')
    const nin = applyMilestoneChoice(newGameAt16('mitjana', 7), 'nini')
    expect(ingressosMensuals16(tre)).toBeGreaterThan(ingressosMensuals16(nin))
  })
})

describe('final als 35', () => {
  it('la branca universitària passa per la uni i acaba als 35', () => {
    const s = playToEnd('mitjana', 11, 'batxillerat')
    expect(s.acabat).toBe(true)
    expect(s.teDiploma).toBe(true)
    expect(s.person.edatMesos).toBe(EDAT_FI_CARRERA * MESOS_PER_ANY)
  })

  it('la branca laboral acaba als 35 amb benestar i comptes acotats', () => {
    const s = playToEnd('treballadora', 5, 'treball')
    expect(s.acabat).toBe(true)
    expect(s.teDiploma).toBe(false) // ha entrat a la carrera sense passar per la uni
    expect(s.person.edatMesos).toBe(EDAT_FI_CARRERA * MESOS_PER_ANY)
    expect(s.person.stats.benestar).toBeGreaterThanOrEqual(0)
    expect(s.person.stats.benestar).toBeLessThanOrEqual(100)
    expect(s.person.patrimoni.efectiu).toBeGreaterThanOrEqual(0)
    expect(s.person.patrimoni.fonsIndexat).toBeGreaterThanOrEqual(0)
  })

  it('als 18 obre la fita de majoria d’edat (no acaba)', () => {
    const fork = playUntil(
      newGameAt16('mitjana', 3),
      (s) => s.pendingMilestone === 'postobligatori',
    )
    const lab = playUntil(
      applyMilestoneChoice(fork, 'treball'),
      (s) => s.pendingMilestone === 'majoria',
    )
    expect(lab.pendingMilestone).toBe('majoria')
    expect(lab.acabat).toBe(false)
    expect(lab.person.edatMesos).toBe(EDAT_FI_POSTOBLIGATORI * MESOS_PER_ANY)
  })

  it('és determinista per a una mateixa llavor i itinerari', () => {
    expect(playToEnd('alta', 42, 'treball')).toEqual(playToEnd('alta', 42, 'treball'))
  })
})

describe('universitat i carrera', () => {
  it('triar universitat als 18 hi entra sense títol fins als 22', () => {
    const fork = playUntil(
      applyMilestoneChoice(newGameAt16('mitjana', 7), 'batxillerat'),
      (s) => s.pendingMilestone === 'majoria',
    )
    const uni = applyMilestoneChoice(fork, 'universitat')
    expect(uni.lifeStage).toBe('universitat')
    expect(uni.teDiploma).toBeFalsy()
    // Als 22 arriba la fita de fi d'universitat i, en triar-la, comença la carrera amb títol.
    const fiUni = playUntil(uni, (s) => s.pendingMilestone === 'fi_uni')
    expect(fiUni.pendingMilestone).toBe('fi_uni')
    const carrera = applyMilestoneChoice(fiUni, 'comencar_carrera')
    expect(carrera.lifeStage).toBe('carrera')
    expect(carrera.teDiploma).toBe(true)
    // Entra a l'atur: no té sou encara, però hi ha ofertes per acceptar.
    expect(carrera.salari).toBe(0)
    expect(carrera.ofertesFeina?.length).toBeGreaterThan(0)
    expect(carrera.plaInversio).toBeUndefined()
    // En acceptar una oferta, passa a tenir sou i pla d'inversió.
    const ambFeina = acceptarOferta(carrera, carrera.ofertesFeina![0].id)
    expect(ambFeina.salari).toBeGreaterThan(0)
    expect(ambFeina.plaInversio).toBeDefined()
    expect(ambFeina.ofertesFeina).toBeUndefined()
  })

  it('un any de carrera avança 1 any, inverteix i deixa els comptes no negatius', () => {
    const s = newGameAtCarrera('mitjana', 7)
    const after = advanceTurn(s)
    expect(after.person.edatMesos).toBe(s.person.edatMesos + MESOS_PER_ANY)
    expect(after.person.patrimoni.efectiu).toBeGreaterThanOrEqual(0)
    // Amb el pla per defecte s'aporta a fons indexat i/o pla de pensions.
    const inv = after.person.patrimoni
    expect(inv.fonsIndexat + inv.fonsPensions).toBeGreaterThan(0)
  })

  it('el pla de pensions creix de forma estable any rere any', () => {
    let s = newGameAtCarrera('alta', 3)
    s = { ...s, plaInversio: { oci: 0, estalvi: 0, fonsIndexat: 0, fonsPensions: 2000 } }
    const fons: number[] = []
    for (let i = 0; i < 4 && !s.acabat; i++) {
      s = advanceTurn(s)
      if (s.pendingEvent) s = applyChoice(s, s.pendingEvent.choices![0].id)
      fons.push(s.person.patrimoni.fonsPensions)
    }
    // Sèrie monòtona creixent (aportació + rendiment estable, sense volatilitat).
    for (let i = 1; i < fons.length; i++) {
      expect(fons[i]).toBeGreaterThan(fons[i - 1])
    }
  })

  it('un any treballat a la carrera suma experiència', () => {
    const s = newGameAtCarrera('mitjana', 7)
    expect(s.anysExperiencia ?? 0).toBe(0)
    const after = advanceTurn(s)
    expect(after.anysExperiencia).toBe(1)
  })
})

describe('cerca de feina', () => {
  it('entrar a la carrera deixa a l’atur amb ofertes; acceptar-ne una dóna sou', () => {
    const fork = playUntil(
      newGameAt16('mitjana', 7),
      (s) => s.pendingMilestone === 'majoria',
      'treball',
    )
    const carrera = applyMilestoneChoice(fork, 'carrera')
    expect(carrera.lifeStage).toBe('carrera')
    expect(carrera.salari).toBe(0)
    expect(carrera.ofertesFeina?.length).toBeGreaterThan(0)
    const ambFeina = acceptarOferta(carrera, carrera.ofertesFeina![0].id)
    expect(ambFeina.salari).toBeGreaterThan(0)
    expect(ambFeina.ofertesFeina).toBeUndefined()
  })

  it('seguir buscant un any regenera ofertes i no es bloqueja', () => {
    const fork = playUntil(
      newGameAt16('treballadora', 5),
      (s) => s.pendingMilestone === 'majoria',
      'treball',
    )
    let s = applyMilestoneChoice(fork, 'carrera')
    expect(s.salari).toBe(0)
    // Segueix buscant: avança un any (pot saltar un esdeveniment d'atur) i torna a tenir ofertes.
    s = advanceTurn(s)
    if (s.pendingEvent) s = applyChoice(s, s.pendingEvent.choices![0].id)
    expect(s.salari).toBe(0)
    expect(s.ofertesFeina?.length).toBeGreaterThan(0)
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
