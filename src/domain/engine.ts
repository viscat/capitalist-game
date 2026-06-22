import {
  DERIVA_BENESTAR,
  EDAT_FI_ADOLESCENCIA,
  EDAT_FI_CARRERA,
  EDAT_FI_INFANCIA,
  EDAT_FI_POSTOBLIGATORI,
  EDAT_FI_UNIVERSITAT,
  MESOS_PER_ANY,
  MESOS_PER_ESTACIO,
  NIVELL_VIDA_DEFAULT,
  REVALORACIO_HABITATGE,
} from './constants'
import { amortitzaHipoteca, costHabitatgeAnual } from './housing'
import { ADOLESCENCE_ACTIONS, findAction } from './actions/adolescencia'
import { selectEvent } from './events/engine'
import { ADOLESCENCE_EVENTS } from './events/adolescencia'
import { ATUR_ADULT_EVENTS, CARRERA_EVENTS, UNIVERSITAT_EVENTS } from './events/adult'
import {
  ATUR_EVENTS,
  COMMON_LIFE_EVENTS,
  NINI_EVENTS,
  TREBALL_EVENTS,
} from './events/laboral'
import { CHILDHOOD_EVENTS } from './events/pool'
import { FAMILY_PRESETS } from './family/presets'
import { MILESTONES } from './milestones'
import { rng, seedFromTime } from './rng'
import {
  aportacioMinima,
  applyBudgetMonth,
  applyCareerYear,
  applyEffect,
  balancUniversitatAnual,
  baselineBenestar,
  clampBenestar,
  costVidaPropi,
  defaultBudget,
  defaultPlaInversio,
  estalviAnualCriatura,
  familyBaselineBenestar,
  ingressosAnualsCarrera,
  ingressosMensuals16,
  netAnual,
  pagaMensual,
  rendimentIndexAnual,
  resolveDespesaGreu,
  salariAdultInicial,
  salariInicial,
} from './stats'
import { edatAnys } from './time'
import type {
  ActionOption,
  EventEffect,
  FamilyClass,
  GameEvent,
  GameState,
  Identitat,
  LifeStage,
  LogEntry,
  Person,
} from './types'

/** Petit ajut mensual de pràctiques per a qui fa un grau mitjà (per trimestre). */
const ESTIPENDI_GRAU_MIG = 150

/** Opcions de personalització en crear una partida. */
export interface NewGameSetup {
  dataNaixement?: string
  identitat?: Identitat
}

/** Crea una partida nova a partir d'un preset de família. */
export function newGame(
  presetId: FamilyClass,
  seed: number = seedFromTime(),
  setup: NewGameSetup = {},
): GameState {
  const preset = FAMILY_PRESETS[presetId]
  const familia = { ...preset.familia }
  const person: Person = {
    edatMesos: 0,
    stats: { benestar: familyBaselineBenestar(familia) },
    patrimoni: emptyPatrimoni(),
  }
  return {
    torn: 0,
    lifeStage: 'infancia',
    person,
    familia,
    identitat: setup.identitat,
    dataNaixement: setup.dataNaixement,
    rngState: seed >>> 0,
    historial: [],
    acabat: false,
  }
}

/** Inici ràpid directament al fork dels 16 anys (per a proves manuals). */
export function newGameAt16(
  presetId: FamilyClass,
  seed: number = seedFromTime(),
  setup: NewGameSetup = {},
): GameState {
  const preset = FAMILY_PRESETS[presetId]
  const familia = { ...preset.familia }
  const person: Person = {
    edatMesos: EDAT_FI_ADOLESCENCIA * MESOS_PER_ANY,
    stats: { benestar: familyBaselineBenestar(familia) },
    patrimoni: { ...emptyPatrimoni(), efectiu: 50, estalvi: 200 },
  }
  return {
    torn: 16,
    lifeStage: 'adolescencia',
    person,
    familia,
    identitat: setup.identitat,
    dataNaixement: setup.dataNaixement,
    rngState: seed >>> 0,
    pendingMilestone: 'postobligatori',
    historial: [],
    acabat: false,
  }
}

/** Inici ràpid a la fase de carrera (22 anys, amb títol), per provar les inversions. */
export function newGameAtCarrera(
  presetId: FamilyClass,
  seed: number = seedFromTime(),
  setup: NewGameSetup = {},
): GameState {
  const preset = FAMILY_PRESETS[presetId]
  const familia = { ...preset.familia }
  const teDiploma = true
  const salari = salariAdultInicial(familia, teDiploma)
  const person: Person = {
    edatMesos: EDAT_FI_UNIVERSITAT * MESOS_PER_ANY,
    stats: { benestar: 55 },
    patrimoni: { ...emptyPatrimoni(), efectiu: 3000, estalvi: 2000 },
  }
  return {
    torn: 22,
    lifeStage: 'carrera',
    person,
    familia,
    identitat: setup.identitat,
    dataNaixement: setup.dataNaixement,
    rngState: seed >>> 0,
    teDiploma,
    salari,
    salariBase: salari,
    plaInversio: defaultPlaInversio(netAnual(salari * 12)),
    nivellVida: NIVELL_VIDA_DEFAULT,
    habitatge: { tipus: 'amb_pares' },
    historial: [],
    acabat: false,
  }
}

/** Patrimoni buit (tots els comptes a zero). */
function emptyPatrimoni(): Person['patrimoni'] {
  return {
    efectiu: 0,
    estalvi: 0,
    inversions: 0,
    fonsIndexat: 0,
    fonsPensions: 0,
    cases: [],
  }
}

/** Mesos que avança cada torn segons la fase. */
function turnMonths(stage: LifeStage): number {
  if (stage === 'infancia' || stage === 'universitat' || stage === 'carrera') {
    return MESOS_PER_ANY
  }
  if (stage === 'laboral') return 1
  return MESOS_PER_ESTACIO
}

/** Fases en què el jugador tria una acció de targeta cada torn. */
function isActionStage(stage: LifeStage): boolean {
  return stage === 'adolescencia' || stage === 'estudis_post'
}

/** Pool d'esdeveniments corresponent a la fase (i situació) actual. */
function eventPool(state: GameState): GameEvent[] {
  switch (state.lifeStage) {
    case 'infancia':
      return CHILDHOOD_EVENTS
    case 'estudis_post':
      return [...ADOLESCENCE_EVENTS, ...COMMON_LIFE_EVENTS]
    case 'universitat':
      return [...UNIVERSITAT_EVENTS, ...COMMON_LIFE_EVENTS]
    case 'carrera':
      // A l'atur (sou 0), prioritza tornar a treballar; si no, vida laboral normal.
      return (state.salari ?? 0) > 0
        ? [...CARRERA_EVENTS, ...COMMON_LIFE_EVENTS]
        : [...ATUR_ADULT_EVENTS, ...COMMON_LIFE_EVENTS]
    case 'laboral': {
      const base =
        state.itinerari === 'nini'
          ? NINI_EVENTS
          : (state.salari ?? 0) > 0
            ? TREBALL_EVENTS
            : ATUR_EVENTS
      let pool = [...base, ...COMMON_LIFE_EVENTS]
      // Demanar un augment: com a molt un cop l'any.
      if (
        state.ultimAugmentMes !== undefined &&
        state.person.edatMesos - state.ultimAugmentMes < MESOS_PER_ANY
      ) {
        pool = pool.filter((e) => e.id !== 'demanar_augment')
      }
      return pool
    }
    default:
      return ADOLESCENCE_EVENTS
  }
}

/** Resol l'efecte d'un esdeveniment/opció (dinàmic si té `resolve`). */
function resolveEffect(
  source: { effect?: EventEffect; resolve?: (s: GameState) => EventEffect },
  state: GameState,
): EventEffect {
  return source.resolve ? source.resolve(state) : (source.effect ?? {})
}

/**
 * Totes les accions de targeta amb el seu estat. No s'amaguen: les que no es
 * poden fer es retornen `disabled` amb el motiu (temporada, diners o benestar).
 * Buit fora de les fases d'acció.
 */
export function actionOptions(state: GameState): ActionOption[] {
  if (
    !isActionStage(state.lifeStage) ||
    state.acabat ||
    state.pendingEvent ||
    state.pendingMilestone
  ) {
    return []
  }
  // Caixa prevista després d'ingressar la paga del trimestre (no hi ha deute).
  const caixaPrevista =
    state.person.patrimoni.efectiu +
    pagaMensual(state.familia) * MESOS_PER_ESTACIO
  const benestar = state.person.stats.benestar

  const options = ADOLESCENCE_ACTIONS.map((action): ActionOption => {
    if (action.available && !action.available(state)) {
      return { action, disabled: true, reasonKey: action.lockedReasonKey }
    }
    const cost = action.effect.efectiu ?? 0
    if (cost < 0 && caixaPrevista + cost < 0) {
      return { action, disabled: true, reasonKey: 'action.locked.diners' }
    }
    const deltaBenestar = action.effect.benestar ?? 0
    if (deltaBenestar < 0 && benestar + deltaBenestar < 0) {
      return { action, disabled: true, reasonKey: 'action.locked.benestar' }
    }
    return { action, disabled: false }
  })

  // Garantia: sempre hi ha d'haver una opció jugable (el trimestre tranquil),
  // perquè el torn mai es bloquegi del tot.
  if (options.every((o) => o.disabled)) {
    const fallback = options.find((o) => o.action.id === 'mes_tranquil')
    if (fallback) fallback.disabled = false
  }
  return options
}

/**
 * Avança un torn segons la fase: infància (any), estudis (trimestre amb paga i
 * acció), laboral (mes amb ingrés + pressupost), universitat (any amb suport i
 * matrícula) o carrera (any amb sou, inversions i interès compost). Després pot
 * saltar un esdeveniment; si requereix decisió, queda pendent fins a `applyChoice`.
 */
export function advanceTurn(state: GameState, actionId?: string): GameState {
  if (state.acabat || state.pendingEvent || state.pendingMilestone) return state

  const stage = state.lifeStage
  const torn = state.torn + 1
  const edatMesos = state.person.edatMesos + turnMonths(stage)
  const anys = edatAnys(edatMesos)

  // Deriva del benestar cap a la referència de l'entorn.
  const baseline = baselineBenestar(state)
  const benestar = clampBenestar(
    Math.round(
      state.person.stats.benestar +
        (baseline - state.person.stats.benestar) * DERIVA_BENESTAR,
    ),
  )
  let person: Person = {
    ...state.person,
    edatMesos,
    stats: { ...state.person.stats, benestar },
  }
  let habitatge = state.habitatge

  // Estat del RNG d'aquest torn (pot avançar abans de seleccionar l'esdeveniment,
  // p. ex. per sortejar el rendiment anual del fons indexat).
  let rngState = state.rngState

  // Flux econòmic per fase.
  if (stage === 'infancia') {
    person = {
      ...person,
      patrimoni: {
        ...person.patrimoni,
        estalvi: person.patrimoni.estalvi + estalviAnualCriatura(state.familia),
      },
    }
  } else if (stage === 'laboral') {
    const income = ingressosMensuals16(state)
    const budget = state.pressupost ?? defaultBudget(income)
    const minCasa =
      state.itinerari === 'treball' ? aportacioMinima(state.familia, income) : 0
    person = applyBudgetMonth(person, budget, income, minCasa)
  } else if (stage === 'universitat') {
    // Any d'universitat: suport familiar + beca − matrícula − habitatge (mai deute).
    person = {
      ...person,
      patrimoni: {
        ...person.patrimoni,
        efectiu: Math.max(
          0,
          person.patrimoni.efectiu +
            balancUniversitatAnual(state.familia) -
            costHabitatgeAnual(habitatge),
        ),
      },
    }
  } else if (stage === 'carrera') {
    // Any de carrera: el fons indexat rendeix segons l'atzar del mercat.
    const draw = rng(rngState)
    rngState = draw.state
    const income = ingressosAnualsCarrera(state)
    const pla = state.plaInversio ?? defaultPlaInversio(income)
    person = applyCareerYear(
      person,
      pla,
      income,
      rendimentIndexAnual(draw.value),
      costVidaPropi(state.familia, habitatge, state.nivellVida),
      costHabitatgeAnual(habitatge),
    )
  } else {
    const estipendi =
      stage === 'estudis_post' && state.itinerari === 'grau_mig'
        ? ESTIPENDI_GRAU_MIG
        : 0
    person = {
      ...person,
      patrimoni: {
        ...person.patrimoni,
        efectiu:
          person.patrimoni.efectiu +
          pagaMensual(state.familia) * MESOS_PER_ESTACIO +
          estipendi,
      },
    }
  }

  // Habitatge (fases adultes): l'immoble es revalora i la hipoteca s'amortitza.
  if (stage === 'universitat' || stage === 'carrera') {
    if (person.patrimoni.cases.length > 0) {
      person = {
        ...person,
        patrimoni: {
          ...person.patrimoni,
          cases: person.patrimoni.cases.map((v) =>
            Math.round(v * (1 + REVALORACIO_HABITATGE)),
          ),
        },
      }
    }
    if (habitatge?.tipus === 'propietat' && habitatge.hipoteca) {
      habitatge = { ...habitatge, hipoteca: amortitzaHipoteca(habitatge.hipoteca) }
    }
  }

  const entries: LogEntry[] = []

  // Acció voluntària (fases d'estudi).
  if (isActionStage(stage) && actionId) {
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

  const { event, rngState: nextRng } = selectEvent(
    eventPool(state),
    state.familia,
    rngState,
    state.ultimEventId,
  )

  const base: GameState = {
    ...state,
    torn,
    person,
    habitatge,
    rngState: nextRng,
    ultimEventId: event.id,
    historial: [...state.historial, ...entries],
  }

  if (event.choices && event.choices.length > 0) {
    return { ...base, pendingEvent: event }
  }
  return resolveEvent(base, event, resolveEffect(event, base), anys)
}

/** Resol l'esdeveniment pendent aplicant l'opció escollida pel jugador. */
export function applyChoice(state: GameState, choiceId: string): GameState {
  const event = state.pendingEvent
  if (!event || !event.choices) return state
  const choice = event.choices.find((c) => c.id === choiceId)
  if (!choice) return state
  return resolveEvent(
    state,
    event,
    resolveEffect(choice, state),
    edatAnys(state.person.edatMesos),
    choice.labelKey,
  )
}

function resolveEvent(
  state: GameState,
  event: GameEvent,
  effect: EventEffect,
  anys: number,
  choiceLabelKey?: string,
): GameState {
  // Despesa greu: el matalàs familiar cobreix el que el jugador no pot pagar.
  let person = state.person
  let donacio: number | undefined
  let descobert: number | undefined
  if (effect.despesaGreu && effect.despesaGreu > 0) {
    const res = resolveDespesaGreu(person, state.familia, effect.despesaGreu)
    person = res.person
    donacio = res.donacio || undefined
    descobert = res.descobert || undefined
  }
  // Resta d'efectes sobre stats i patrimoni.
  person = applyEffect(person, effect)

  // Canvis de sou persistents.
  let salari = state.salari
  if (effect.salariNou !== undefined) {
    salari = Math.max(0, Math.round(effect.salariNou))
  } else if (effect.salariDelta) {
    salari = Math.max(0, Math.round((salari ?? 0) + effect.salariDelta))
  }

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
    donacio,
    descobert,
  }

  // Fites i final segons l'edat i la fase assolida.
  const mesos = person.edatMesos
  let acabat = false
  let pendingMilestone = state.pendingMilestone
  if (mesos >= EDAT_FI_CARRERA * MESOS_PER_ANY) {
    acabat = true
  } else if (
    state.lifeStage === 'infancia' &&
    mesos >= EDAT_FI_INFANCIA * MESOS_PER_ANY
  ) {
    pendingMilestone = 'institut'
  } else if (
    state.lifeStage === 'adolescencia' &&
    mesos >= EDAT_FI_ADOLESCENCIA * MESOS_PER_ANY
  ) {
    pendingMilestone = 'postobligatori'
  } else if (
    (state.lifeStage === 'estudis_post' || state.lifeStage === 'laboral') &&
    mesos >= EDAT_FI_POSTOBLIGATORI * MESOS_PER_ANY
  ) {
    pendingMilestone = 'majoria'
  } else if (
    state.lifeStage === 'universitat' &&
    mesos >= EDAT_FI_UNIVERSITAT * MESOS_PER_ANY
  ) {
    pendingMilestone = 'fi_uni'
  }

  // Cooldown de l'augment de sou demanat.
  const ultimAugmentMes = effect.marcaAugmentSou
    ? person.edatMesos
    : state.ultimAugmentMes

  return {
    ...state,
    person,
    salari,
    ultimAugmentMes,
    pendingEvent: undefined,
    pendingMilestone,
    historial: [...state.historial, entry],
    acabat,
  }
}

/**
 * Aplica l'opció escollida en una fita: canvia de fase i itinerari, inicialitza
 * el pressupost si entra a la fase laboral, i deixa constància al registre.
 */
export function applyMilestoneChoice(
  state: GameState,
  optionId: string,
): GameState {
  const milestone = state.pendingMilestone
  if (!milestone) return state
  const option = MILESTONES[milestone].options.find((o) => o.id === optionId)
  if (!option) return state

  const next: GameState = {
    ...state,
    lifeStage: option.lifeStage,
    itinerari: option.itinerari ?? state.itinerari,
    pendingMilestone: undefined,
  }
  if (option.itinerari === 'treball') {
    next.salari = next.salariBase = salariInicial(state.familia)
  }
  if (option.lifeStage === 'laboral') {
    const income = ingressosMensuals16(next)
    const minCasa =
      next.itinerari === 'treball' ? aportacioMinima(next.familia, income) : 0
    next.pressupost = defaultBudget(income, minCasa)
  }
  // Entrada a la vida adulta amb inversions: sou adult (amb premi si hi ha títol)
  // i pla d'inversió inicial.
  if (option.lifeStage === 'carrera') {
    const teDiploma = option.teDiploma ?? state.teDiploma ?? false
    const salari = salariAdultInicial(next.familia, teDiploma)
    next.teDiploma = teDiploma
    next.salari = next.salariBase = salari
    next.plaInversio = defaultPlaInversio(netAnual(salari * 12))
    next.nivellVida = NIVELL_VIDA_DEFAULT
  }
  // En entrar a la vida adulta (18+), per defecte es viu amb els pares fins que
  // es decideix llogar o comprar.
  if (
    (option.lifeStage === 'universitat' || option.lifeStage === 'carrera') &&
    !next.habitatge
  ) {
    next.habitatge = { tipus: 'amb_pares' }
  }
  const entry: LogEntry = {
    torn: state.torn,
    edatAnys: edatAnys(state.person.edatMesos),
    eventId: `milestone_${option.id}`,
    titleKey: option.labelKey,
    descKey: option.descKey,
    category: 'escola',
    kind: 'event',
    effect: {},
  }
  next.historial = [...state.historial, entry]
  return next
}
