import { DERIVA_BENESTAR, EDAT_FI_INFANCIA, MESOS_PER_ANY } from './constants'
import { selectEvent } from './events/engine'
import { CHILDHOOD_EVENTS } from './events/pool'
import { FAMILY_PRESETS } from './family/presets'
import { seedFromTime } from './rng'
import {
  applyEffect,
  clampBenestar,
  estalviAnualCriatura,
  familyBaselineBenestar,
} from './stats'
import type {
  EventEffect,
  FamilyClass,
  GameEvent,
  GameState,
  LogEntry,
  Person,
} from './types'

/** Crea una partida nova a partir d'un preset de família. */
export function newGame(
  presetId: FamilyClass,
  seed: number = seedFromTime(),
): GameState {
  const preset = FAMILY_PRESETS[presetId]
  const familia = { ...preset.familia }
  const person: Person = {
    edatMesos: 0,
    stats: { benestar: familyBaselineBenestar(familia) },
    patrimoni: { efectiu: 0, estalvi: 0, inversions: 0, cases: [] },
  }
  return {
    torn: 0,
    lifeStage: 'infancia',
    person,
    familia,
    rngState: seed >>> 0,
    historial: [],
    acabat: false,
  }
}

/**
 * Avança un torn (un any d'infància): envelleix, aplica el flux passiu i tria un
 * esdeveniment. Si l'esdeveniment requereix una decisió, queda pendent fins que
 * el jugador crida `applyChoice`.
 */
export function advanceTurn(state: GameState): GameState {
  if (state.acabat || state.pendingEvent) return state

  const torn = state.torn + 1
  const edatMesos = state.person.edatMesos + MESOS_PER_ANY
  const edatAnys = Math.round(edatMesos / MESOS_PER_ANY)

  // Flux passiu: estalvi aportat per la família + deriva del benestar cap a la
  // referència del seu entorn (els xocs dels esdeveniments es recuperen a poc a
  // poc).
  const baseline = familyBaselineBenestar(state.familia)
  const benestarDerivat = clampBenestar(
    Math.round(
      state.person.stats.benestar +
        (baseline - state.person.stats.benestar) * DERIVA_BENESTAR,
    ),
  )
  const person: Person = {
    ...state.person,
    edatMesos,
    stats: { ...state.person.stats, benestar: benestarDerivat },
    patrimoni: {
      ...state.person.patrimoni,
      estalvi:
        state.person.patrimoni.estalvi + estalviAnualCriatura(state.familia),
    },
  }

  const { event, rngState } = selectEvent(
    CHILDHOOD_EVENTS,
    state.familia,
    state.rngState,
    state.ultimEventId,
  )

  const base: GameState = {
    ...state,
    torn,
    person,
    rngState,
    ultimEventId: event.id,
  }

  if (event.choices && event.choices.length > 0) {
    return { ...base, pendingEvent: event }
  }
  return resolveEvent(base, event, event.effect ?? {}, edatAnys)
}

/** Resol l'esdeveniment pendent aplicant l'opció escollida pel jugador. */
export function applyChoice(state: GameState, choiceId: string): GameState {
  const event = state.pendingEvent
  if (!event || !event.choices) return state
  const choice = event.choices.find((c) => c.id === choiceId)
  if (!choice) return state
  const edatAnys = Math.round(state.person.edatMesos / MESOS_PER_ANY)
  return resolveEvent(state, event, choice.effect, edatAnys, choice.labelKey)
}

function resolveEvent(
  state: GameState,
  event: GameEvent,
  effect: EventEffect,
  edatAnys: number,
  choiceLabelKey?: string,
): GameState {
  const person = applyEffect(state.person, effect)
  const entry: LogEntry = {
    torn: state.torn,
    edatAnys,
    eventId: event.id,
    titleKey: event.titleKey,
    descKey: event.descKey,
    params: event.params,
    category: event.category,
    choiceLabelKey,
    effect,
  }
  const acabat = person.edatMesos >= EDAT_FI_INFANCIA * MESOS_PER_ANY
  return {
    ...state,
    person,
    pendingEvent: undefined,
    historial: [...state.historial, entry],
    acabat,
  }
}
