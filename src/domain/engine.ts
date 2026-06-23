import {
  DERIVA_BAIXA,
  DERIVA_PUJADA,
  EDAT_FI_ADOLESCENCIA,
  EDAT_FI_CARRERA,
  EDAT_FI_INFANCIA,
  EDAT_FI_POSTOBLIGATORI,
  EDAT_FI_UNIVERSITAT,
  MESOS_PER_ANY,
  NIVELL_VIDA_DEFAULT,
  REVALORACIO_HABITATGE,
} from './constants'
import { amortitzaHipoteca, costHabitatgeAnual } from './housing'
import { generaOfertes } from './jobs'
import { ADOLESCENCE_ACTIONS } from './actions/adolescencia'
import { UNIVERSITY_ACTIONS } from './actions/universitat'
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
  aportacioFamiliarCarrera,
  aportacioMinima,
  applyBudgetYear,
  applyCareerYear,
  applyEffect,
  balancUniversitatAnual,
  baselineBenestar,
  benestarNivellVida,
  clampBenestar,
  costVidaPropi,
  defaultBudget,
  defaultPlaInversio,
  estalviAnualCriatura,
  factorSalariPersonal,
  familyBaselineBenestar,
  herenciaVida,
  ingressosAnualsCarrera,
  ingressosMensuals16,
  netAnual,
  netMensual,
  pagaMensual,
  prestacioAturAnual,
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
  GameAction,
  GameEvent,
  GameState,
  Identitat,
  LifeStage,
  LogEntry,
  Person,
} from './types'

/** Petit ajut MENSUAL de pràctiques per a qui fa un grau mitjà (es prorrateja × 12). */
const ESTIPENDI_GRAU_MIG_MENSUAL = 50

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

/**
 * Mesos que avança cada torn. Tota la vida es juga a 1 torn = 1 any per coherència;
 * els imports (paga, pressupost, sou...) es decideixen en mensual i es prorrategen.
 */
function turnMonths(): number {
  return MESOS_PER_ANY
}

/** Fases en què el jugador tria accions de targeta cada torn. */
function isActionStage(stage: LifeStage): boolean {
  return (
    stage === 'adolescencia' || stage === 'estudis_post' || stage === 'universitat'
  )
}

/** Catàleg d'accions corresponent a la fase d'acció actual. */
function stageActions(state: GameState): GameAction[] {
  switch (state.lifeStage) {
    case 'universitat':
      return UNIVERSITY_ACTIONS
    default:
      return ADOLESCENCE_ACTIONS
  }
}

/**
 * Manté les ofertes de feina coherents amb l'estat. A `carrera` sense sou (a l'atur,
 * sigui en entrar al món laboral o després d'un acomiadament) (re)genera el lot
 * d'ofertes consumint el RNG; amb sou, esborra les ofertes. Centralitza la cerca de
 * feina perquè aparegui automàticament a tots els punts on s'acaba un torn a l'atur.
 */
function ambOfertes(state: GameState): GameState {
  if (state.lifeStage === 'carrera' && (state.salari ?? 0) === 0) {
    const { ofertes, rngState } = generaOfertes(state, state.rngState)
    return { ...state, ofertesFeina: ofertes, rngState }
  }
  if (state.ofertesFeina) return { ...state, ofertesFeina: undefined }
  return state
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
 * Accions disponibles a la fase d'acció actual. Només es marquen `disabled` per
 * disponibilitat de context (p. ex. temporada); el cost en diners i temps el gestiona
 * la UI de manera acumulada (multiselecció), ja que se'n poden triar diverses l'any.
 * No triar res sempre és vàlid (temps lliure), així que el torn mai es bloqueja.
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
  return stageActions(state).map((action): ActionOption => {
    if (action.available && !action.available(state)) {
      return { action, disabled: true, reasonKey: action.lockedReasonKey }
    }
    return { action, disabled: false }
  })
}

/**
 * Avança un torn. Tota la vida avança 1 any per torn; el que canvia segons la fase
 * és com es genera el flux econòmic d'aquell any: infància (estalvi familiar),
 * estudis (paga anual + acció), laboral (pressupost mensual prorratejat tot l'any),
 * universitat (suport − matrícula) o carrera (sou, inversions i interès compost).
 * Després pot saltar un esdeveniment; si requereix decisió, queda pendent fins a
 * `applyChoice`.
 */
export function advanceTurn(state: GameState, actionIds?: string[]): GameState {
  if (state.acabat || state.pendingEvent || state.pendingMilestone) return state

  const stage = state.lifeStage
  const torn = state.torn + 1
  const edatMesos = state.person.edatMesos + turnMonths()
  const anys = edatAnys(edatMesos)

  // Experiència laboral: cada any amb sou (carrera o feina dels 16-18) suma.
  const haTreballat =
    (stage === 'carrera' || (stage === 'laboral' && state.itinerari === 'treball')) &&
    (state.salari ?? 0) > 0
  const anysExperiencia = (state.anysExperiencia ?? 0) + (haTreballat ? 1 : 0)

  // Deriva ASIMÈTRICA del benestar cap a la referència de l'entorn (P9): és més fàcil
  // caure que pujar. Per sota de la referència, la recuperació és lenta; per sobre, la
  // caiguda és ràpida (un cop dolent costa de remuntar; l'estructura t'hi torna).
  const baseline = baselineBenestar(state)
  const gap = baseline - state.person.stats.benestar
  const derivaFactor = gap >= 0 ? DERIVA_PUJADA : DERIVA_BAIXA
  const benestar = clampBenestar(
    Math.round(state.person.stats.benestar + gap * derivaFactor),
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
    // El pressupost és mensual; un torn n'aplica un any sencer (× 12).
    const income = ingressosMensuals16(state)
    const budget = state.pressupost ?? defaultBudget(income)
    const minCasa =
      state.itinerari === 'treball' ? aportacioMinima(state.familia, income) : 0
    person = applyBudgetYear(person, budget, income, minCasa, state.familia)
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
    // A l'atur (sou 0), l'ingrés és la prestació d'atur (si has cotitzat); amb sou, el net.
    const income =
      (state.salari ?? 0) > 0
        ? ingressosAnualsCarrera(state)
        : prestacioAturAnual(state.salariBase ?? 0, state.anysExperiencia ?? 0)
    const pla = state.plaInversio ?? defaultPlaInversio(income)
    person = applyCareerYear(
      person,
      pla,
      income,
      rendimentIndexAnual(draw.value),
      costVidaPropi(state.familia, habitatge, state.nivellVida),
      costHabitatgeAnual(habitatge),
      state.familia,
      aportacioFamiliarCarrera(state.familia, netMensual(state.salari ?? 0)),
      benestarNivellVida(state.nivellVida, state.vidaSenzilla),
    )
  } else {
    // Fases d'acció (adolescència / estudis postobligatoris): la paga i l'estipendi
    // es decideixen en mensual i s'ingressen per tot l'any (× 12).
    const estipendiMensual =
      stage === 'estudis_post' && state.itinerari === 'grau_mig'
        ? ESTIPENDI_GRAU_MIG_MENSUAL
        : 0
    person = {
      ...person,
      patrimoni: {
        ...person.patrimoni,
        efectiu:
          person.patrimoni.efectiu +
          (pagaMensual(state.familia) + estipendiMensual) * MESOS_PER_ANY,
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

  // Accions voluntàries de l'any (fases d'acció): se'n poden haver triat diverses.
  if (isActionStage(stage) && actionIds) {
    const cataleg = stageActions(state)
    for (const actionId of actionIds) {
      const action = cataleg.find((a) => a.id === actionId)
      if (!action) continue
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
    anysExperiencia,
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

  // Seqüela crònica (incapacitat): s'acumula i perdura, rebaixant la referència adulta.
  const salutCronica = effect.salutCronicaDelta
    ? Math.max(0, (state.salutCronica ?? 0) + effect.salutCronicaDelta)
    : state.salutCronica

  // Vincles socials (0..1): es construeixen i s'erosionen amb la vida; font de benestar
  // no monetària (P7). Calibratge clau (§8.5): qui va endeutat amb prou feines pot
  // cultivar-los (temps i energia esgotats per la precarietat), així que els guanys es
  // redueixen molt si hi ha deute. Per això la "vida plena" amb poc patrimoni queda
  // reservada a qui s'escapa de la trampa del deute, no a tothom.
  let vinclesDelta = effect.vinclesDelta
  if (vinclesDelta !== undefined && vinclesDelta > 0 && (person.patrimoni.deute ?? 0) > 0) {
    vinclesDelta *= 0.3
  }
  const vinclesSocials =
    vinclesDelta !== undefined
      ? Math.max(0, Math.min(1, (state.vinclesSocials ?? 0) + vinclesDelta))
      : state.vinclesSocials

  // Si un acomiadament ha deixat el sou a 0 a la carrera, ambOfertes hi genera
  // automàticament les ofertes de cerca de feina.
  return ambOfertes({
    ...state,
    person,
    salari,
    ultimAugmentMes,
    salutCronica,
    vinclesSocials,
    pendingEvent: undefined,
    pendingMilestone,
    historial: [...state.historial, entry],
    acabat,
  })
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
    // El sou de partida porta la bretxa de gènere/origen (discriminació d'accés).
    const sou = Math.round(salariInicial(state.familia) * factorSalariPersonal(state.identitat))
    next.salari = next.salariBase = sou
  }
  if (option.lifeStage === 'laboral') {
    const income = ingressosMensuals16(next)
    const minCasa =
      next.itinerari === 'treball' ? aportacioMinima(next.familia, income) : 0
    next.pressupost = defaultBudget(income, minCasa)
  }
  // Entrada a la vida adulta: NO et regalen feina. Comences a l'atur (sou 0) i has
  // de buscar-la; les ofertes les genera `ambOfertes` al final. El pla d'inversió es
  // fixa en acceptar una oferta (quan ja hi ha sou).
  if (option.lifeStage === 'carrera') {
    next.teDiploma = option.teDiploma ?? state.teDiploma ?? false
    next.salari = next.salariBase = 0
    next.nivellVida = NIVELL_VIDA_DEFAULT
    // Herència en vida (P6): el capital es transmet, no es guanya. El ric arrenca la vida
    // adulta amb un coixí; el pobre, amb zero. Reproducció de classe directa.
    const herencia = herenciaVida(state.familia)
    if (herencia > 0) {
      next.person = {
        ...next.person,
        patrimoni: {
          ...next.person.patrimoni,
          estalvi: next.person.patrimoni.estalvi + herencia,
        },
      }
    }
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
  // En entrar a la carrera a l'atur, genera el primer lot d'ofertes de feina.
  return ambOfertes(next)
}

/**
 * Accepta una oferta de feina (durant la cerca a la carrera): fixa el sou, inicialitza
 * el pla d'inversió si encara no n'hi ha, esborra les ofertes i deixa constància. NO
 * avança el torn: trobes feina i vius l'any treballant (el panell d'inversió).
 */
export function acceptarOferta(state: GameState, ofertaId: string): GameState {
  const oferta = state.ofertesFeina?.find((o) => o.id === ofertaId)
  if (!oferta) return state
  const salari = oferta.sou
  const entry: LogEntry = {
    torn: state.torn,
    edatAnys: edatAnys(state.person.edatMesos),
    eventId: `oferta_${oferta.qualitat}`,
    titleKey: 'jobsearch.found.title',
    descKey: 'jobsearch.found.desc',
    params: { sou: salari },
    category: 'economia',
    kind: 'event',
    effect: { salariNou: salari },
  }
  return {
    ...state,
    salari,
    salariBase: salari,
    plaInversio: state.plaInversio ?? defaultPlaInversio(netAnual(salari * 12)),
    ofertesFeina: undefined,
    historial: [...state.historial, entry],
  }
}
