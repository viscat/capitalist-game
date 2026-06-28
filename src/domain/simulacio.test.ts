import { describe, expect, it } from 'vitest'
import {
  acceptarOferta,
  actionOptions,
  advanceTurn,
  applyChoice,
  applyMilestoneChoice,
  newGame,
  newGameAtCarrera,
} from './engine'
import { MILESTONES } from './milestones'
import { FAMILY_PRESET_ORDER } from './family/presets'
import { comprarCasa } from './housing'
import { edatAnys } from './time'
import { EDAT_JUBILACIO } from './constants'
import type { GameState, MilestoneId } from './types'

// Bateria de simulació: juga partides COMPLETES de debò (resolent fites i decisions)
// i comprova els invariants del joc en cada torn. Blinda que el motor no es bloqueja,
// que els comptes mai van a deute, que el benestar es manté 0..100, que la partida és
// determinista per llavor i que l'estat és serialitzable (autosave).

const COMPTES = ['efectiu', 'inversions'] as const

/** Comprova els invariants numèrics del joc en un estat qualsevol. */
function assertInvariants(s: GameState, ctx: string) {
  const p = s.person.patrimoni
  for (const k of COMPTES) {
    expect(p[k], `${ctx}: ${k} no pot ser negatiu (${p[k]})`).toBeGreaterThanOrEqual(0)
    expect(Number.isFinite(p[k]), `${ctx}: ${k} ha de ser finit`).toBe(true)
  }
  for (const v of p.cases) {
    expect(v, `${ctx}: el valor d'una casa no pot ser negatiu`).toBeGreaterThanOrEqual(0)
  }
  expect(s.person.stats.benestar, `${ctx}: benestar >= 0`).toBeGreaterThanOrEqual(0)
  expect(s.person.stats.benestar, `${ctx}: benestar <= 100`).toBeLessThanOrEqual(100)
  const deute = s.habitatge?.hipoteca?.deute
  if (deute !== undefined) {
    expect(deute, `${ctx}: el deute de la hipoteca no pot ser negatiu`).toBeGreaterThanOrEqual(0)
  }
}

type Estrategia = Partial<Record<MilestoneId, string>>

// Itineraris representatius que cobreixen totes les branques de la màquina d'estats.
const ESTRATEGIES: Record<string, Estrategia> = {
  universitat: { postobligatori: 'batxillerat', majoria: 'universitat' },
  treball: { postobligatori: 'treball', majoria: 'carrera' },
  nini: { postobligatori: 'nini', majoria: 'carrera' },
  grau_mig: { postobligatori: 'grau_mig', majoria: 'carrera' },
}

interface FitaVista {
  id: MilestoneId
  edat: number
}

/**
 * Juga una partida fins al final resolent fites (segons l'estratègia), decisions
 * d'esdeveniment (primera opció) i triant sempre una acció jugable. Retorna l'estat
 * final i les fites vistes. Llança si detecta un bloqueig (soft-lock).
 */
function jugaPartida(s0: GameState, estrategia: Estrategia): {
  estat: GameState
  fites: FitaVista[]
} {
  let s = s0
  const fites: FitaVista[] = []
  let guarda = 0
  while (!s.acabat) {
    if (guarda++ > 5000) throw new Error('SOFT-LOCK: la partida no acaba mai')
    assertInvariants(s, `torn ${s.torn} (${s.lifeStage})`)

    if (s.pendingMilestone) {
      fites.push({ id: s.pendingMilestone, edat: edatAnys(s.person.edatMesos) })
      const tria =
        estrategia[s.pendingMilestone] ?? MILESTONES[s.pendingMilestone].options[0].id
      s = applyMilestoneChoice(s, tria)
    } else if (s.pendingEvent) {
      const choices = s.pendingEvent.choices
      // Un esdeveniment pendent sempre té opcions (els altres es resolen sols).
      expect(choices && choices.length, `event ${s.pendingEvent.id} sense opcions`).toBeTruthy()
      s = applyChoice(s, choices![0].id)
    } else if (
      s.lifeStage === 'carrera' &&
      (s.salari ?? 0) === 0 &&
      s.ofertesFeina?.length
    ) {
      // A l'atur a la carrera: accepta la primera oferta (la cerca sempre ofereix una).
      s = acceptarOferta(s, s.ofertesFeina[0].id)
    } else {
      const opcions = actionOptions(s)
      if (opcions.length > 0) {
        const jugable = opcions.find((o) => !o.disabled)
        // A les fases d'acció SEMPRE hi ha d'haver almenys una acció jugable.
        expect(jugable, `cap acció jugable a ${s.lifeStage}`).toBeTruthy()
        s = advanceTurn(s, [jugable!.action.id])
      } else {
        s = advanceTurn(s)
      }
    }
  }
  assertInvariants(s, 'estat final')
  return { estat: s, fites }
}

describe('simulació de partides completes (naixement → mort)', () => {
  // Vides senceres (fins a la mort) × classes × itineraris × llavors: marge de temps ampli.
  it('no es bloqueja, manté els invariants i acaba SEMPRE per mort (salut 0)', { timeout: 30_000 }, () => {
    for (const classe of FAMILY_PRESET_ORDER) {
      for (const [nom, estrategia] of Object.entries(ESTRATEGIES)) {
        for (let seed = 1; seed <= 8; seed++) {
          const ctx = `${classe}/${nom}/seed${seed}`
          const { estat, fites } = jugaPartida(newGame(classe, seed), estrategia)

          expect(estat.acabat, `${ctx}: partida acabada`).toBe(true)
          // L'únic final és la mort (salut 0), a qualsevol edat (ja no s'acaba als 67).
          expect(estat.mort, `${ctx}: acaba per mort`).toBe(true)
          expect(Math.round(estat.person.stats.salut), `${ctx}: mort amb salut 0`).toBe(0)

          const edatFinal = edatAnys(estat.person.edatMesos)
          const ids = fites.map((f) => f.id)
          // Si ha viscut prou, ha de passar per les fites obligatòries.
          if (edatFinal >= 13)
            expect(ids, `${ctx}: passa per la fita d'institut`).toContain('institut')
          if (edatFinal >= 17)
            expect(ids, `${ctx}: passa per la fita de postobligatori`).toContain('postobligatori')
          // Qui viu més enllà dels 67 s'ha jubilat (transició, no final). Qui mor JUST als
          // 67 pot haver mort abans de jubilar-se (la mort té prioritat sobre la fita).
          if (edatFinal > EDAT_JUBILACIO) {
            expect(ids, `${ctx}: passa per la jubilació`).toContain('jubilacio')
            expect(estat.jubilat, `${ctx}: marcat com a jubilat`).toBe(true)
          }

          // Les fites que s'hagin disparat ho fan exactament a l'edat llindar.
          for (const f of fites) {
            if (f.id === 'institut') expect(f.edat, `${ctx}: institut als 12`).toBe(12)
            if (f.id === 'postobligatori') expect(f.edat, `${ctx}: postobligatori als 16`).toBe(16)
            if (f.id === 'majoria') expect(f.edat, `${ctx}: majoria als 18`).toBe(18)
            if (f.id === 'fi_uni') expect(f.edat, `${ctx}: fi d'universitat als 22`).toBe(22)
            if (f.id === 'jubilacio') expect(f.edat, `${ctx}: jubilació als 67`).toBe(EDAT_JUBILACIO)
          }
        }
      }
    }
  })
})

describe('determinisme', () => {
  it('la mateixa llavor i estratègia donen exactament la mateixa partida', () => {
    for (const classe of FAMILY_PRESET_ORDER) {
      for (const seed of [1, 42, 777]) {
        const a = jugaPartida(newGame(classe, seed), ESTRATEGIES.universitat).estat
        const b = jugaPartida(newGame(classe, seed), ESTRATEGIES.universitat).estat
        expect(JSON.stringify(a)).toBe(JSON.stringify(b))
      }
    }
  })
})

describe('autosave (serialització)', () => {
  it('l’estat final sobreviu a JSON.stringify → parse sense pèrdua', () => {
    const { estat } = jugaPartida(newGame('mitjana', 5), ESTRATEGIES.treball)
    expect(JSON.parse(JSON.stringify(estat))).toEqual(estat)
  })
})

describe('hipoteca: amortització jugant de debò', () => {
  it('el deute baixa cada any processat i mai es torna negatiu', () => {
    // Nota: el termini mínim és de 20 anys i la partida acaba als 35, així que una
    // hipoteca no s'arriba a saldar del tot dins del joc; el que comprovem és que
    // s'amortitza correctament any rere any. (La saldació total fins a 0 ja es prova
    // directament a housing.test.ts amb amortitzaHipoteca.)
    let s: GameState = newGameAtCarrera('mitjana', 3)
    s = {
      ...s,
      person: { ...s.person, patrimoni: { ...s.person.patrimoni, inversions: 60_000 } },
    }
    s = comprarCasa(s, 'pis_petit', 20)
    expect(s.habitatge?.tipus).toBe('propietat')

    let anysProcessats = 0
    while (!s.acabat) {
      if (s.pendingMilestone) {
        s = applyMilestoneChoice(s, MILESTONES[s.pendingMilestone].options[0].id)
        continue
      }
      if (s.pendingEvent) {
        s = applyChoice(s, s.pendingEvent.choices![0].id)
        continue
      }
      const deuteAbans = s.habitatge?.hipoteca?.deute
      s = advanceTurn(s)
      assertInvariants(s, `hipoteca any ${anysProcessats}`)
      if (deuteAbans !== undefined) {
        anysProcessats++
        const deuteDespres = s.habitatge?.hipoteca?.deute
        if (deuteDespres === undefined) break // saldada (no esperat dins del joc, però vàlid)
        expect(deuteDespres, `el deute baixa (any ${anysProcessats})`).toBeLessThan(deuteAbans)
      }
    }

    // S'han processat diversos anys d'amortització abans d'acabar la partida.
    expect(anysProcessats, 'almenys uns quants anys d’amortització').toBeGreaterThan(5)
  })
})
