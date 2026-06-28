import { describe, expect, it } from 'vitest'
import {
  acceptarOferta,
  actionOptions,
  advanceTurn,
  applyChoice,
  applyMilestoneChoice,
  classePerPatrimoni,
  classeHereu,
  continuaGeneracio,
  familiaHereva,
  newGame,
  newGameAt16,
  newGameAtCarrera,
} from './engine'
import {
  aportacioMinima,
  augmentSou,
  familyBaselineBenestar,
  ingressosMensuals16,
  pensioPublicaAnual,
  salariInicial,
} from './stats'
import { MILESTONES } from './milestones'
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
  // Fites de mitja carrera (40/50/60) o qualsevol altra: resol amb la primera opció.
  if (s.pendingMilestone) {
    return applyMilestoneChoice(s, MILESTONES[s.pendingMilestone].options[0].id)
  }
  // A l'atur a la carrera, accepta la primera oferta (la cerca de feina no es bloqueja).
  if (s.lifeStage === 'carrera' && (s.salari ?? 0) === 0 && s.ofertesFeina?.length) {
    return acceptarOferta(s, s.ofertesFeina[0].id)
  }
  if (s.lifeStage === 'adolescencia' || s.lifeStage === 'estudis_post') {
    const a = firstEnabled(s)
    return advanceTurn(s, a ? [a] : [])
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
    s = { ...s, person: { ...s.person, stats: { benestar: 70, salut: 100 } } }
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
  it('cada torn avança 1 any i el sobrant del pressupost es queda com a efectiu', () => {
    const base = applyMilestoneChoice(newGameAt16('mitjana', 7), 'treball')
    // Pressupost frugal (oci/compres baixos): l'ingrés sobrant s'acumula a efectiu.
    const s = {
      ...base,
      pressupost: { ...base.pressupost!, oci: 0, compres: 0 },
    }
    const efectiuAbans = s.person.patrimoni.efectiu
    const after = advanceTurn(s)
    expect(after.person.edatMesos).toBe(s.person.edatMesos + MESOS_PER_ANY)
    expect(after.person.patrimoni.efectiu).toBeGreaterThan(efectiuAbans)
  })

  it('treballar dóna més ingrés que no fer res', () => {
    const tre = applyMilestoneChoice(newGameAt16('mitjana', 7), 'treball')
    const nin = applyMilestoneChoice(newGameAt16('mitjana', 7), 'nini')
    expect(ingressosMensuals16(tre)).toBeGreaterThan(ingressosMensuals16(nin))
  })
})

describe('herència dels pares', () => {
  it('rebre l’herència per mort marca l’estat (no es repeteix)', () => {
    const s = laboralTreball()
    expect(s.herenciaParesRebuda ?? false).toBe(false)
    const after = resolWith(s, [
      { id: 'a', labelKey: 'x', effect: { inversions: 5000, marcaHerenciaPares: true } },
    ])
    expect(after.herenciaParesRebuda).toBe(true)
  })
})

describe('selecció d’accions recordada entre anys', () => {
  it('accionsSeleccio es conserva en avançar un torn', () => {
    const s = { ...newGame('mitjana', 5), accionsSeleccio: { hobby: 2, sortir_amics: 1 } }
    const after = advanceTurn(s)
    expect(after.accionsSeleccio).toEqual({ hobby: 2, sortir_amics: 1 })
  })
})

describe('dinastia i herència', () => {
  it('classePerPatrimoni mapeja la riquesa heretada a una classe', () => {
    expect(classePerPatrimoni(0)).toBe('pobra')
    expect(classePerPatrimoni(20_000)).toBe('treballadora')
    expect(classePerPatrimoni(100_000)).toBe('mitjana')
    expect(classePerPatrimoni(2_000_000)).toBe('rica')
  })

  it('familiaHereva: més herència ⇒ classe més alta (llar típica de la classe)', () => {
    const pobre = familiaHereva(0)
    const ric = familiaHereva(1_500_000)
    expect(pobre.classe).toBe('pobra')
    expect(ric.classe).toBe('rica')
    // El patrimoni de la llar és el típic de la classe; l'herència concreta arriba després.
    expect(ric.patrimoni).toBeGreaterThan(0)
  })

  it('la nova generació rep l’herència en vida d’entrada i les cases es difereixen', () => {
    let s = newGameAtCarrera('mitjana', 3)
    s = {
      ...s,
      fills: 1,
      fillsNaixement: [30 * MESOS_PER_ANY],
      llegatEnVida: 40_000,
      person: {
        ...s.person,
        edatMesos: 60 * MESOS_PER_ANY,
        stats: { benestar: 60, salut: 0 },
        patrimoni: { efectiu: 0, inversions: 0, cases: [200_000] },
      },
    }
    const gen2 = continuaGeneracio(s)
    // L'herència EN VIDA es rep d'entrada (els regals que va fer el progenitor mentre vivia).
    expect(gen2.person.patrimoni.inversions).toBeGreaterThan(0)
    // Les CASES s'hereten com a propietat, diferides a l'edat de la mort del progenitor.
    expect(gen2.herenciaPendent?.cases).toEqual([200_000])
  })

  it('classeHereu: inèrcia forta, puja com a molt UN graó, cau lliure', () => {
    // Sense riquesa real, el pobre es queda pobre.
    expect(classeHereu('pobra', 0)).toBe('pobra')
    // Acumular riquesa et fa enfilar, però NOMÉS un graó per vida (mai de pobre a ric).
    expect(classeHereu('pobra', 200_000)).toBe('treballadora')
    expect(classeHereu('pobra', 5_000_000)).toBe('treballadora')
    // El treballador que prospera puja un graó (a mitjana).
    expect(classeHereu('treballadora', 200_000)).toBe('mitjana')
    // Caure és lliure: un ric que ho perd tot baixa de classe.
    expect(classeHereu('rica', 0)).toBe('pobra')
    expect(classeHereu('mitjana', 60_000)).toBe('mitjana')
  })

  it('herència en vida: transfereix patrimoni al pot de llegat i el treu del teu', () => {
    let s = newGameAtCarrera('rica', 3)
    s = {
      ...s,
      fills: 1,
      fillsNaixement: [s.person.edatMesos],
      person: {
        ...s.person,
        patrimoni: { ...s.person.patrimoni, inversions: 100_000 },
      },
    }
    const after = resolWith(s, [
      { id: 'd', labelKey: 'x', effect: { llegatEnVidaDelta: 30_000 } },
    ])
    expect(after.llegatEnVida).toBe(30_000)
    // El patrimoni líquid ha baixat en la mateixa quantitat.
    const liquidAbans = s.person.patrimoni.efectiu + s.person.patrimoni.inversions
    const liquidDespres = after.person.patrimoni.efectiu + after.person.patrimoni.inversions
    expect(liquidAbans - liquidDespres).toBe(30_000)
  })

  it('la dinastia difereix l’herència a l’edat de mort del progenitor', () => {
    let s = newGameAtCarrera('mitjana', 3)
    s = {
      ...s,
      fills: 1,
      fillsNaixement: [30 * MESOS_PER_ANY],
      person: {
        ...s.person,
        edatMesos: 60 * MESOS_PER_ANY,
        stats: { benestar: 60, salut: 0 },
        patrimoni: { ...s.person.patrimoni, inversions: 300_000 },
      },
    }
    const gen2 = continuaGeneracio(s)
    // El progenitor el va tenir als 30 i va morir als 60 → herència als 30 (no al néixer).
    expect(gen2.herenciaPendent).toMatchObject({ import: expect.any(Number), edat: 30 })
    expect(gen2.person.patrimoni.inversions).toBe(0) // no hereta al néixer

    // En arribar a l'edat de l'herència, es dispara l'esdeveniment previst i la rep.
    const previ = {
      ...gen2,
      lifeStage: 'carrera' as const,
      salari: 0,
      person: { ...gen2.person, edatMesos: 29 * MESOS_PER_ANY, stats: { benestar: 60, salut: 90 } },
    }
    const after = advanceTurn(previ)
    expect(after.historial.at(-1)!.eventId).toBe('herencia_dinastia')
    expect(after.herenciaPendent).toBeUndefined()
    expect(after.person.patrimoni.inversions).toBeGreaterThan(0)
  })

  it('continuaGeneracio comença una vida nova amb la família heretada', () => {
    // Estat "mort" amb fills i patrimoni: el descendent neix en una llar rica.
    let s = newGameAtCarrera('mitjana', 3)
    s = {
      ...s,
      acabat: true,
      mort: true,
      fills: 2,
      fillsNaixement: [s.person.edatMesos - 30 * 12, s.person.edatMesos - 28 * 12],
      person: {
        ...s.person,
        edatMesos: 80 * 12,
        patrimoni: { ...s.person.patrimoni, inversions: 1_000_000 },
      },
    }
    const gen2 = continuaGeneracio(s)
    expect(gen2.acabat).toBe(false)
    expect(gen2.lifeStage).toBe('infancia')
    expect(gen2.person.edatMesos).toBe(0)
    expect(gen2.generacio).toBe(2)
    expect(gen2.person.stats.salut).toBe(100)
    // Hereta una llar amb patrimoni (la riquesa del progenitor es transmet).
    expect(gen2.familia.patrimoni).toBeGreaterThan(0)
  })
})

describe('descendència', () => {
  it('tenir un fill incrementa els fills i en registra el naixement', () => {
    const s = newGameAtCarrera('mitjana', 3)
    const after = resolWith(s, [
      { id: 'a', labelKey: 'x', effect: { fillsDelta: 1, benestar: 6 } },
    ])
    expect(after.fills).toBe(1)
    expect(after.fillsNaixement).toEqual([s.person.edatMesos])
    expect(after.person.stats.benestar).toBeGreaterThan(s.person.stats.benestar)
  })

  it('el cost de criança redueix el patrimoni en avançar un any de carrera', () => {
    let s = newGameAtCarrera('mitjana', 3)
    // Dona efectiu per cobrir el cost i un fill petit (dependent).
    s = {
      ...s,
      fills: 1,
      fillsNaixement: [s.person.edatMesos],
      plaInversio: { oci: 0, inversions: 0 },
      person: { ...s.person, patrimoni: { ...s.person.patrimoni, efectiu: 40_000 } },
    }
    const senseFill = advanceTurn({ ...s, fills: 0, fillsNaixement: [] })
    const ambFill = advanceTurn(s)
    // Amb un fill dependent es gasta més (queda menys efectiu) que sense.
    expect(ambFill.person.patrimoni.efectiu).toBeLessThan(
      senseFill.person.patrimoni.efectiu,
    )
  })
})

describe('parella', () => {
  it('marcaParella estableix una parella amb nom', () => {
    const s = newGameAtCarrera('mitjana', 3)
    expect(s.parella).toBeUndefined()
    const after = resolWith(s, [
      { id: 'a', labelKey: 'x', effect: { marcaParella: true, benestar: 5 } },
    ])
    expect(after.parella).toBeDefined()
    expect(typeof after.parella?.nom).toBe('string')
    expect(after.parella?.nom.length).toBeGreaterThan(0)
  })

  it('viure en parella reparteix les despeses (queda més efectiu en avançar l’any)', () => {
    const base = {
      ...newGameAtCarrera('mitjana', 3),
      plaInversio: { oci: 0, inversions: 0 },
    }
    base.person = {
      ...base.person,
      patrimoni: { ...base.person.patrimoni, efectiu: 40_000 },
    }
    const sol = advanceTurn({ ...base, parella: undefined })
    const enParella = advanceTurn({ ...base, parella: { nom: 'Pau' } })
    expect(enParella.person.patrimoni.efectiu).toBeGreaterThan(
      sol.person.patrimoni.efectiu,
    )
  })

  it('cada fill rep un nom', () => {
    const s = newGameAtCarrera('mitjana', 3)
    const after = resolWith(s, [
      { id: 'a', labelKey: 'x', effect: { fillsDelta: 1 } },
    ])
    expect(after.fillsNoms).toHaveLength(1)
    expect(typeof after.fillsNoms?.[0]).toBe('string')
    expect(after.fillsNoms?.[0]?.length).toBeGreaterThan(0)
  })
})

describe('jubilació: pensió segons el sou de jubilar-se', () => {
  it('la base reguladora és el sou final (amb augments), no el sou inicial', () => {
    // Carrera amb sou inicial baix però que ha pujat molt al llarg de la vida.
    let s = newGameAtCarrera('mitjana', 5)
    s = {
      ...s,
      salari: 2600, // sou actual (amb augments)
      salariBase: 1300, // sou inicial de la carrera
      anysExperiencia: 40,
      pendingMilestone: 'jubilacio',
    }
    const jubilat = applyMilestoneChoice(s, 'jubilar')
    expect(jubilat.jubilat).toBe(true)
    // La base de la pensió ha de ser el sou de jubilar-se (2600), no l'inicial (1300).
    expect(jubilat.salariBase).toBe(2600)
    // La pensió amb base 2600 és més alta que si s'hagués calculat amb 1300.
    const pensioBaixa = pensioPublicaAnual({ ...jubilat, salariBase: 1300 })
    expect(pensioPublicaAnual(jubilat)).toBeGreaterThan(pensioBaixa)
  })
})

describe('mort (salut 0 = fi)', () => {
  it('quan la salut arriba a 0, la partida acaba marcada com a mort', () => {
    let s = laboralTreball()
    // Deixem la salut molt baixa i apliquem un cop que la porta a 0.
    s = { ...s, person: { ...s.person, stats: { benestar: 50, salut: 6 } } }
    const after = resolWith(s, [{ id: 'a', labelKey: 'x', effect: { salutDelta: -10 } }])
    expect(after.person.stats.salut).toBe(0)
    expect(after.acabat).toBe(true)
    expect(after.mort).toBe(true)
  })

  it('el benestar a 0 NO mata (només erosiona la salut)', () => {
    let s = laboralTreball()
    s = { ...s, person: { ...s.person, stats: { benestar: 5, salut: 80 } } }
    const after = resolWith(s, [{ id: 'a', labelKey: 'x', effect: { benestar: -20 } }])
    expect(after.person.stats.benestar).toBe(0)
    expect(after.acabat).toBe(false)
    expect(after.mort ?? false).toBe(false)
  })

  it('avançar un any amb benestar baix degrada la salut', () => {
    let s = newGameAtCarrera('pobra', 4)
    s = { ...s, person: { ...s.person, stats: { benestar: 10, salut: 80 } } }
    const after = advanceTurn(s)
    expect(after.person.stats.salut).toBeLessThan(80)
  })

  it('una despesa de salut no pagada (descobert) fa mal extra a la salut', () => {
    let s = applyMilestoneChoice(newGameAt16('pobra', 7), 'treball')
    s = {
      ...s,
      person: {
        ...s.person,
        stats: { benestar: 60, salut: 90 },
        patrimoni: { ...s.person.patrimoni, efectiu: 0, inversions: 0 },
      },
    }
    const ev: GameEvent = {
      id: 'op_test',
      category: 'salut',
      titleKey: 't',
      descKey: 'd',
      weight: () => 1,
      choices: [{ id: 'x', labelKey: 'x', effect: { despesaGreu: 8000, salutDelta: -5 } }],
    }
    const after = applyChoice({ ...s, pendingEvent: ev }, 'x')
    // Cau més de 5 (el salutDelta directe) perquè el descobert hi afegeix dany.
    expect(after.person.stats.salut).toBeLessThan(85)
  })
})

describe('vida fins a la mort (jubilació als 67)', () => {
  it('la branca universitària passa per la uni i acaba per mort (salut 0)', () => {
    const s = playToEnd('mitjana', 11, 'batxillerat')
    expect(s.acabat).toBe(true)
    expect(s.mort).toBe(true) // l'únic final és la mort (salut 0)
    expect(s.teDiploma).toBe(true)
    expect(Math.round(s.person.stats.salut)).toBe(0)
  })

  it('als 67 es dispara la jubilació i la vida continua (no acaba)', () => {
    // Carrera als 66, sa: en avançar creua els 67 → fita de jubilació (no mort, no fi).
    let s = newGameAtCarrera('mitjana', 3)
    s = {
      ...s,
      person: {
        ...s.person,
        edatMesos: 66 * MESOS_PER_ANY,
        stats: { benestar: 70, salut: 90 },
      },
    }
    const after = advanceTurn(s)
    expect(after.acabat).toBe(false)
    expect(after.pendingMilestone).toBe('jubilacio')
    const jubilat = applyMilestoneChoice(after, 'jubilar')
    expect(jubilat.lifeStage).toBe('jubilacio')
    expect(jubilat.jubilat).toBe(true)
    expect(jubilat.salari).toBe(0) // ja no es treballa: es viu de la pensió
    expect(jubilat.acabat).toBe(false)
  })

  it('la branca laboral acaba per mort amb benestar i comptes acotats', () => {
    const s = playToEnd('treballadora', 5, 'treball')
    expect(s.acabat).toBe(true)
    expect(s.mort).toBe(true)
    expect(s.teDiploma).toBe(false) // ha entrat a la carrera sense passar per la uni
    expect(s.person.stats.benestar).toBeGreaterThanOrEqual(0)
    expect(s.person.stats.benestar).toBeLessThanOrEqual(100)
    expect(s.person.patrimoni.efectiu).toBeGreaterThanOrEqual(0)
    expect(s.person.patrimoni.inversions).toBeGreaterThanOrEqual(0)
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
    // El pla comença buit (el jugador el reparteix); aquí n'assignem un per provar la inversió.
    const base = newGameAtCarrera('mitjana', 7)
    const s = {
      ...base,
      plaInversio: { oci: 2400, inversions: 6000 },
    }
    const after = advanceTurn(s)
    expect(after.person.edatMesos).toBe(s.person.edatMesos + MESOS_PER_ANY)
    expect(after.person.patrimoni.efectiu).toBeGreaterThanOrEqual(0)
    // Amb un pla amb aportacions, s'inverteix a la cartera.
    expect(after.person.patrimoni.inversions).toBeGreaterThan(0)
  })

  it('la cartera d’inversió acumula aportacions any rere any', () => {
    let s = newGameAtCarrera('alta', 3)
    s = { ...s, plaInversio: { oci: 0, inversions: 4000 } }
    let aportatPrev = 0
    for (let i = 0; i < 4 && !s.acabat; i++) {
      s = advanceTurn(s)
      if (s.pendingEvent) s = applyChoice(s, s.pendingEvent.choices![0].id)
    }
    // Amb aportacions sostingudes, el valor invertit acaba per damunt de zero.
    expect(s.person.patrimoni.inversions).toBeGreaterThan(aportatPrev)
    aportatPrev = s.person.patrimoni.inversions
    expect(aportatPrev).toBeGreaterThan(0)
  })

  it('un any treballat a la carrera suma experiència', () => {
    const s = newGameAtCarrera('mitjana', 7)
    expect(s.anysExperiencia ?? 0).toBe(0)
    const after = advanceTurn(s)
    expect(after.anysExperiencia).toBe(1)
  })

  it('invertir en salut recupera salut; invertir en formació puja el nivell acadèmic', () => {
    const base = {
      ...newGameAtCarrera('alta', 5),
      plaInversio: { oci: 0, inversions: 0 },
    }
    base.person = {
      ...base.person,
      stats: { ...base.person.stats, salut: 60 },
      patrimoni: { ...base.person.patrimoni, efectiu: 80_000 },
    }
    const sense = advanceTurn(base)
    const amb = advanceTurn({ ...base, inversioSalut: true, inversioFormacio: true })
    // La salut acaba més amunt invertint-hi (compensa part del declivi de l'any).
    expect(amb.person.stats.salut).toBeGreaterThan(sense.person.stats.salut)
    // El nivell acadèmic puja amb la formació contínua.
    expect(amb.nivellAcademic ?? 0).toBeGreaterThan(base.nivellAcademic ?? 0)
    // Té un cost: queda menys efectiu que sense invertir-hi.
    expect(amb.person.patrimoni.efectiu).toBeLessThan(sense.person.patrimoni.efectiu)
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
