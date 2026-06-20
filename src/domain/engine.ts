import {
  DERIVA_BENESTAR,
  EDAT_FI_ADOLESCENCIA,
  EDAT_FI_INFANCIA,
  MESOS_PER_ANY,
  MESOS_PER_ESTACIO,
} from './constants'
import { ADOLESCENCE_ACTIONS, findAction } from './actions/adolescencia'
import { selectEvent } from './events/engine'
import { ADOLESCENCE_EVENTS } from './events/adolescencia'
import { CHILDHOOD_EVENTS } from './events/pool'
import { FAMILY_PRESETS } from './family/presets'
import { seedFromTime } from './rng'
import {
  applyEffect,
  clampBenestar,
  estalviAnualCriatura,
  familyBaselineBenestar,
  pagaMensual,
} from './stats'
import { edatAnys } from './time'
import type {
  EventEffect,
  FamilyClass,
  GameAction,
  GameEvent,
  GameState,
  LifeStage,
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

/** Mesos que avança cada torn segons la fase. */
function turnMonths(stage: LifeStage): number {
  return stage === 'infancia' ? MESOS_PER_ANY : MESOS_PER_ESTACIO
}

/** Fase corresponent a una edat (en mesos) ja avançada. */
function stageForAge(edatMesos: number): LifeStage {
  return edatMesos >= EDAT_FI_INFANCIA * MESOS_PER_ANY ? 'adolescencia' : 'infancia'
}

/** Accions disponibles per al jugador en aquest torn (buides fora de l'adolescència). */
export function availableActions(state: GameState): GameAction[] {
  if (state.lifeStage !== 'adolescencia' || state.acabat || state.pendingEvent) {
    return []
  }
  // Caixa prevista després d'ingressar la paga del trimestre: no deixem triar
  // accions que no es poden pagar (no hi ha deute a l'adolescència).
  const caixaPrevista =
    state.person.patrimoni.efectiu +
    pagaMensual(state.familia) * MESOS_PER_ESTACIO
  return ADOLESCENCE_ACTIONS.filter((a) => {
    if (a.available && !a.available(state)) return false
    const cost = a.effect.efectiu ?? 0
    return cost >= 0 || caixaPrevista + cost >= 0
  })
}

/**
 * Avança un torn. A la infància és un any (flux passiu i un esdeveniment); a
 * l'adolescència és un trimestre, on s'aplica primer l'acció triada (`actionId`)
 * i després pot saltar un esdeveniment. Si l'esdeveniment requereix una decisió,
 * queda pendent fins que el jugador crida `applyChoice`.
 */
export function advanceTurn(state: GameState, actionId?: string): GameState {
  if (state.acabat || state.pendingEvent) return state

  const stage = state.lifeStage
  const torn = state.torn + 1
  const edatMesos = state.person.edatMesos + turnMonths(stage)
  const anys = edatAnys(edatMesos)

  // Deriva del benestar cap a la referència de l'entorn (els xocs es recuperen
  // a poc a poc).
  const baseline = familyBaselineBenestar(state.familia)
  const benestar = clampBenestar(
    Math.round(
      state.person.stats.benestar +
        (baseline - state.person.stats.benestar) * DERIVA_BENESTAR,
    ),
  )

  // Flux passiu de patrimoni: estalvi familiar (infància) o paga (adolescència).
  const patrimoni = { ...state.person.patrimoni }
  if (stage === 'infancia') {
    patrimoni.estalvi += estalviAnualCriatura(state.familia)
  } else {
    patrimoni.efectiu += pagaMensual(state.familia) * MESOS_PER_ESTACIO
  }

  let person: Person = {
    ...state.person,
    edatMesos,
    stats: { ...state.person.stats, benestar },
    patrimoni,
  }

  const entries: LogEntry[] = []

  // Avís en entrar a l'institut.
  const newStage = stageForAge(edatMesos)
  if (stage === 'infancia' && newStage === 'adolescencia') {
    entries.push({
      torn,
      edatAnys: anys,
      eventId: 'transicio_institut',
      titleKey: 'transition.institut.title',
      descKey: 'transition.institut.desc',
      category: 'escola',
      kind: 'event',
      effect: {},
    })
  }

  // Acció voluntària (només adolescència).
  if (stage === 'adolescencia' && actionId) {
    const action = findAction(actionId)
    if (action) {
      person = applyEffect(person, action.effect)
      entries.push({
        torn,
        edatAnys: anys,
        eventId: action.id,
        titleKey: action.labelKey,
        descKey: action.descKey,
        category: action.category,
        kind: 'action',
        effect: action.effect,
      })
    }
  }

  const pool = stage === 'adolescencia' ? ADOLESCENCE_EVENTS : CHILDHOOD_EVENTS
  const { event, rngState } = selectEvent(
    pool,
    state.familia,
    state.rngState,
    state.ultimEventId,
  )

  const base: GameState = {
    ...state,
    torn,
    person,
    lifeStage: newStage,
    rngState,
    ultimEventId: event.id,
    historial: [...state.historial, ...entries],
  }

  if (event.choices && event.choices.length > 0) {
    return { ...base, pendingEvent: event }
  }
  return resolveEvent(base, event, event.effect ?? {}, anys)
}

/** Resol l'esdeveniment pendent aplicant l'opció escollida pel jugador. */
export function applyChoice(state: GameState, choiceId: string): GameState {
  const event = state.pendingEvent
  if (!event || !event.choices) return state
  const choice = event.choices.find((c) => c.id === choiceId)
  if (!choice) return state
  return resolveEvent(state, event, choice.effect, edatAnys(state.person.edatMesos), choice.labelKey)
}

function resolveEvent(
  state: GameState,
  event: GameEvent,
  effect: EventEffect,
  anys: number,
  choiceLabelKey?: string,
): GameState {
  const person = applyEffect(state.person, effect)
  const entry: LogEntry = {
    torn: state.torn,
    edatAnys: anys,
    eventId: event.id,
    titleKey: event.titleKey,
    descKey: event.descKey,
    params: event.params,
    category: event.category,
    kind: 'event',
    choiceLabelKey,
    effect,
  }
  const acabat = person.edatMesos >= EDAT_FI_ADOLESCENCIA * MESOS_PER_ANY
  return {
    ...state,
    person,
    pendingEvent: undefined,
    historial: [...state.historial, entry],
    acabat,
  }
}
