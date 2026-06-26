import {
  DERIVA_BAIXA,
  DERIVA_PUJADA,
  EDAT_CRUILLA_40,
  EDAT_FERTIL_MAX,
  EDAT_FERTIL_MIN,
  EDAT_FI_ADOLESCENCIA,
  EDAT_FI_INFANCIA,
  EDAT_FI_POSTOBLIGATORI,
  EDAT_FI_UNIVERSITAT,
  EDAT_JUBILACIO,
  EDAT_RECTA_60,
  EDAT_REVISIO_50,
  MAX_FILLS,
  INTERES_DEUTE,
  MESOS_PER_ANY,
  NIVELL_VIDA_DEFAULT,
  RENDIMENT_PENSIONS,
  REVALORACIO_HABITATGE,
  SALUT_INICIAL,
} from './constants'
import { amortitzaHipoteca, costHabitatgeAnual } from './housing'
import { generaOfertes } from './jobs'
import { ADOLESCENCE_ACTIONS } from './actions/adolescencia'
import { UNIVERSITY_ACTIONS } from './actions/universitat'
import { selectEvent } from './events/engine'
import { ADOLESCENCE_EVENTS } from './events/adolescencia'
import {
  AJUT_PARES_EVENTS,
  ATUR_ADULT_EVENTS,
  CARRERA_EVENTS,
  DESCENDENCIA_EVENTS,
  HERENCIA_PARES_EVENTS,
  HERENCIA_VIDA_EVENTS,
  SALUT_EDAT_EVENTS,
  UNIVERSITAT_EVENTS,
} from './events/adult'
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
  ajudaCasaBenestar,
  ajutPublicMax,
  aportacioMinima,
  applyBudgetYear,
  applyCareerYear,
  applyEffect,
  balancUniversitatAnual,
  baselineBenestar,
  benestarNivellVida,
  clampBenestar,
  clampSalut,
  contribucioLlar,
  declividSalutAnual,
  factorEsperancaVida,
  costFillsAnual,
  costVidaAnual,
  costVidaPropi,
  defaultBudget,
  defaultPlaInversio,
  estalviAnualCriatura,
  factorSalariPersonal,
  familyBaselineBenestar,
  herenciaVida,
  ingressosAnualsCarrera,
  ingressosMensuals16,
  llegatPerFill,
  netMensual,
  pagaMensual,
  pagaPerAjudaCasa,
  patrimoniTotal,
  pensioPublicaAnual,
  prestacioAturAnual,
  rendimentIndexAnual,
  repartDeficit,
  resolveDespesaGreu,
  salariAdultInicial,
  salariInicial,
  sostreSalari,
} from './stats'
import { dataActual, edatAnys } from './time'
import type {
  ActionOption,
  EventEffect,
  Familia,
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
    stats: { benestar: familyBaselineBenestar(familia), salut: SALUT_INICIAL },
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
    stats: { benestar: familyBaselineBenestar(familia), salut: SALUT_INICIAL },
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
    stats: { benestar: 55, salut: SALUT_INICIAL },
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
    // Pla buit: el jugador el reparteix des de zero (coherent amb l'entrada normal).
    plaInversio: { oci: 0, estalvi: 0, fonsIndexat: 0, fonsPensions: 0 },
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

// Llindars de patrimoni heretat → classe de la llar de la nova generació. La riquesa que
// deixes determina en quina classe neixen els teus fills: la reproducció de classe, explícita.
const PATRIMONI_CLASSE: [number, FamilyClass][] = [
  [5_000_000, 'super_rica'],
  [1_000_000, 'rica'],
  [250_000, 'alta'],
  [50_000, 'mitjana'],
  [8_000, 'treballadora'],
  [0, 'pobra'],
]

/** Classe de la llar d'un hereu segons el patrimoni que rep. */
export function classePerPatrimoni(patrimoni: number): FamilyClass {
  for (const [llindar, classe] of PATRIMONI_CLASSE) {
    if (patrimoni >= llindar) return classe
  }
  return 'pobra'
}

/**
 * Família d'origen de la nova generació: classe segons el patrimoni heretat, amb el perfil
 * d'ingressos/cura d'aquella classe però amb el patrimoni REAL heretat. Així el fill d'un ric
 * neix en una llar rica; el d'algú que mor sense res, en una de pobra.
 */
export function familiaHereva(patrimoniHeretat: number): Familia {
  const classe = classePerPatrimoni(patrimoniHeretat)
  const base = FAMILY_PRESETS[classe].familia
  return { ...base, patrimoni: Math.max(0, Math.round(patrimoniHeretat)) }
}

/**
 * Continua la dinastia amb un descendent: comença una vida nova (des del naixement) per a un
 * fill, que neix en una llar la riquesa de la qual és l'herència que li deixes (mort + en
 * vida). El nou protagonista neix a la data de la teva mort (dècades després → més esperança
 * de vida) i conserva el cognom (llinatge). Reutilitza tot el cicle de vida (0 → mort).
 */
export function continuaGeneracio(state: GameState): GameState {
  if ((state.fills ?? 0) <= 0) return state
  const llegat = llegatPerFill(state)
  const familia = familiaHereva(llegat)
  // El nou protagonista neix a la data (de calendari) de la mort del progenitor.
  let dataNaixement = state.dataNaixement
  if (dataNaixement) {
    const d = dataActual(dataNaixement, state.person.edatMesos)
    dataNaixement = `${d.any}-${String(d.mesIndex + 1).padStart(2, '0')}-01`
  }
  const person: Person = {
    edatMesos: 0,
    stats: { benestar: familyBaselineBenestar(familia), salut: SALUT_INICIAL },
    patrimoni: emptyPatrimoni(),
  }
  return {
    torn: 0,
    lifeStage: 'infancia',
    person,
    familia,
    identitat: state.identitat,
    dataNaixement,
    rngState: state.rngState,
    generacio: (state.generacio ?? 1) + 1,
    historial: [],
    acabat: false,
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

/** Pot oferir herència en vida: té fills i prou patrimoni líquid per avançar-ne una part. */
function potHeretarEnVida(state: GameState): boolean {
  const p = state.person.patrimoni
  return (state.fills ?? 0) > 0 && p.efectiu + p.estalvi + p.fonsIndexat > 30_000
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
    case 'carrera': {
      // A l'atur (sou 0), prioritza tornar a treballar; si no, vida laboral normal.
      const base =
        (state.salari ?? 0) > 0
          ? [...CARRERA_EVENTS, ...COMMON_LIFE_EVENTS]
          : [...ATUR_ADULT_EVENTS, ...COMMON_LIFE_EVENTS]
      const edat = edatAnys(state.person.edatMesos)
      const pool = [...base]
      // A partir dels ~50, el risc de salut propi de l'edat (i la cura dels pares grans)
      // s'afegeix al pool: el cos passa factura amb els anys.
      if (edat >= EDAT_REVISIO_50) pool.push(...SALUT_EDAT_EVENTS)
      // Dins de la finestra fèrtil i sense haver arribat al màxim de fills, pot aparèixer
      // l'oportunitat de tenir descendència.
      if (
        edat >= EDAT_FERTIL_MIN &&
        edat <= EDAT_FERTIL_MAX &&
        (state.fills ?? 0) < MAX_FILLS
      ) {
        pool.push(...DESCENDENCIA_EVENTS)
      }
      // Amb fills i un coixí, pot sortir l'opció d'herència en vida.
      if (potHeretarEnVida(state)) pool.push(...HERENCIA_VIDA_EVENTS)
      // Mentre els pares viuen: ajut econòmic puntual (segons classe). Quan envelleixes
      // (~40+), poden morir i n'heretes (un sol cop).
      if (!state.herenciaParesRebuda) {
        pool.push(...AJUT_PARES_EVENTS)
        if (edat >= 40) pool.push(...HERENCIA_PARES_EVENTS)
      }
      return pool
    }
    case 'jubilacio': {
      // Jubilació: vida tranquil·la amb risc de salut d'edat i vida quotidiana; sense feina.
      const pool = [...SALUT_EDAT_EVENTS, ...COMMON_LIFE_EVENTS]
      if (potHeretarEnVida(state)) pool.push(...HERENCIA_VIDA_EVENTS)
      // Si encara no han mort els pares, a aquesta edat segurament ho faran.
      if (!state.herenciaParesRebuda) pool.push(...HERENCIA_PARES_EVENTS)
      return pool
    }
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
  // Declivi anual de la salut: edat + benestar (estrès/precarietat) + seqüeles, modulat per
  // el progrés mèdic de l'època (esperança de vida actual i futura). El benestar que es fa
  // servir és el ja derivat d'aquest any. Pot recuperar-se (delta negatiu) si la persona és
  // jove i benestant. Els esdeveniments de salut hi sumaran cops a sobre.
  const anyCalendari = state.dataNaixement
    ? dataActual(state.dataNaixement, edatMesos).any
    : undefined
  const factorEpoca =
    anyCalendari !== undefined ? factorEsperancaVida(anyCalendari) : 1
  const salut = clampSalut(
    Math.round(
      state.person.stats.salut -
        declividSalutAnual(anys, benestar, state.salutCronica ?? 0, factorEpoca),
    ),
  )
  let person: Person = {
    ...state.person,
    edatMesos,
    stats: { ...state.person.stats, benestar, salut },
  }
  let habitatge = state.habitatge
  let patrimoniHist = state.patrimoniHist

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
    // Any d'universitat: suport familiar + beca − matrícula, menys habitatge i (si vius
    // sol) un cost de vida frugal d'estudiant. El dèficit que ni els estalvis ni la xarxa
    // cobreixen es torna DEUTE que compon (com a la carrera): estudiar sense suport
    // familiar es paga amb anys de deute. La família pobra, a més, no et pot mantenir
    // (suport 0) i et necessita aportant a casa: estudiar de l'origen humil és dur.
    const ambPares = (habitatge?.tipus ?? 'amb_pares') === 'amb_pares'
    const costHab = ambPares ? 0 : costHabitatgeAnual(habitatge)
    const costVidaUni = ambPares ? 0 : costVidaAnual('minim')
    const fluxNet = balancUniversitatAnual(state.familia) - costHab - costVidaUni
    let efectiu = person.patrimoni.efectiu
    let estalvi = person.patrimoni.estalvi
    let deute = Math.round((person.patrimoni.deute ?? 0) * (1 + INTERES_DEUTE))
    if (fluxNet >= 0) {
      efectiu += fluxNet
      const pagaDeute = Math.min(efectiu, deute)
      efectiu -= pagaDeute
      deute -= pagaDeute
    } else {
      const deficit = -fluxNet
      const fromEfectiu = Math.min(efectiu, deficit)
      efectiu -= fromEfectiu
      const r = repartDeficit(
        deficit - fromEfectiu,
        estalvi,
        state.familia,
        ajutPublicMax(patrimoniTotal(person), 0),
      )
      estalvi -= r.propi
      deute += r.descobert
    }
    person = {
      ...person,
      patrimoni: {
        ...person.patrimoni,
        efectiu: Math.max(0, Math.round(efectiu)),
        estalvi: Math.max(0, Math.round(estalvi)),
        deute: deute > 0 ? Math.round(deute) : undefined,
      },
    }
    // Pressió familiar de l'origen humil: mentre estudies, la família segueix necessitant
    // que aportis (cost de benestar modest, com a les fases joves).
    person = applyEffect(person, { benestar: ajudaCasaBenestar(state.familia) })
  } else if (stage === 'carrera' || stage === 'jubilacio') {
    // Any de carrera o jubilació: el fons indexat rendeix segons l'atzar del mercat.
    const draw = rng(rngState)
    rngState = draw.state
    // Ingrés de l'any: jubilat → pensió pública; en actiu amb sou → net; a l'atur → prestació.
    const income =
      stage === 'jubilacio'
        ? pensioPublicaAnual(state)
        : (state.salari ?? 0) > 0
          ? ingressosAnualsCarrera(state)
          : prestacioAturAnual(state.salariBase ?? 0, state.anysExperiencia ?? 0)
    const pla = state.plaInversio ?? defaultPlaInversio(income)
    // Viure amb els pares: un SOL cost (contribució a la llar = manutenció + ajuda a casa),
    // sense pagar el cost de vida a part ni triar-ne el nivell (ells et mantenen). Viure
    // sol: cost de vida sencer (segons el nivell que tries) + habitatge, i s'atura l'ajuda.
    const ambPares = (habitatge?.tipus ?? 'amb_pares') === 'amb_pares'
    const net = stage === 'jubilacio' ? income / MESOS_PER_ANY : netMensual(state.salari ?? 0)
    const costVida = ambPares
      ? contribucioLlar(state.familia, net)
      : costVidaPropi(state.familia, habitatge, state.nivellVida)
    const indexReturn = rendimentIndexAnual(draw.value)
    // Valors invertits ABANS d'aplicar l'any (per derivar les aportacions reals d'enguany).
    const prevIndex = person.patrimoni.fonsIndexat
    const prevPensions = person.patrimoni.fonsPensions
    person = applyCareerYear(
      person,
      pla,
      income,
      indexReturn,
      costVida,
      ambPares ? 0 : costHabitatgeAnual(habitatge),
      state.familia,
      0, // l'ajuda a la família ja va inclosa a la contribució a la llar (amb_pares); 0 si vius sol
      ambPares ? 0 : benestarNivellVida(state.nivellVida, state.vidaSenzilla),
      costFillsAnual(state), // criança dels fills dependents
    )
    // Aportació REAL d'enguany al fons indexat + pensions = valor nou − valor crescut (el
    // que ha pujat pel rendiment no és aportació). Acumulada, és el «que has posat» que es
    // compara amb el valor actual al gràfic.
    const aportatAny =
      Math.max(0, person.patrimoni.fonsIndexat - Math.round(prevIndex * (1 + indexReturn))) +
      Math.max(0, person.patrimoni.fonsPensions - Math.round(prevPensions * (1 + RENDIMENT_PENSIONS)))
    const aportatAcum = (state.patrimoniHist?.at(-1)?.aportat ?? 0) + aportatAny
    // Instantània anual del patrimoni invertit, per al gràfic de rendiment.
    patrimoniHist = [
      ...(state.patrimoniHist ?? []),
      {
        edat: anys,
        fonsIndexat: person.patrimoni.fonsIndexat,
        fonsPensions: person.patrimoni.fonsPensions,
        estalvi: person.patrimoni.estalvi,
        aportat: aportatAcum,
      },
    ]
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
    // Ajuda obligatòria a casa/negoci familiar (més en famílies humils): menys temps i
    // energia propis. El temps compromès es reflecteix al pressupost de l'ActionPanel; aquí
    // se n'aplica el cost de benestar.
    person = applyEffect(person, { benestar: ajudaCasaBenestar(state.familia) })
  }

  // Habitatge (fases adultes): l'immoble es revalora i la hipoteca s'amortitza.
  if (stage === 'universitat' || stage === 'carrera' || stage === 'jubilacio') {
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
  // Stats no monetaris que poden moure les accions (dedicació universitària, etc.).
  // applyEffect només toca patrimoni i benestar, així que els acumulem a part.
  let accAcademic = 0
  let accVincles = 0
  let accSalut = 0

  // Accions voluntàries de l'any (fases d'acció): se'n poden haver triat diverses.
  if (isActionStage(stage) && actionIds) {
    const cataleg = stageActions(state)
    for (const actionId of actionIds) {
      const action = cataleg.find((a) => a.id === actionId)
      if (!action) continue
      // «Ajudar a casa» només es remunera de la mitjana amunt: per a la pobra i la
      // treballadora és ajuda no pagada (la família ho necessita), així que dóna 0 €.
      const effect =
        action.id === 'ajudar_casa'
          ? { ...action.effect, efectiu: pagaPerAjudaCasa(state.familia) }
          : action.effect
      person = applyEffect(person, effect)
      accAcademic += effect.academicDelta ?? 0
      accVincles += effect.vinclesDelta ?? 0
      accSalut += effect.salutCronicaDelta ?? 0
      entries.push({
        torn,
        edatAnys: anys,
        eventId: action.id,
        titleKey: action.labelKey,
        descKey: action.descKey,
        category: action.category,
        kind: 'action',
        effect,
      })
    }
  }

  const { event, rngState: nextRng } = selectEvent(
    eventPool(state),
    state.familia,
    rngState,
    state.ultimEventId,
  )

  // Aplica els stats no monetaris acumulats per les accions (gating de vincles per deute,
  // com a resolveEvent). Els events del torn hi sumaran els seus deltes a sobre.
  const vinclesAccio =
    accVincles > 0 && (person.patrimoni.deute ?? 0) > 0 ? accVincles * 0.3 : accVincles
  const base: GameState = {
    ...state,
    torn,
    person,
    habitatge,
    patrimoniHist,
    anysExperiencia,
    nivellAcademic:
      accAcademic !== 0
        ? Math.max(0, Math.min(1, (state.nivellAcademic ?? 0) + accAcademic))
        : state.nivellAcademic,
    vinclesSocials:
      vinclesAccio !== 0
        ? Math.max(0, Math.min(1, (state.vinclesSocials ?? 0) + vinclesAccio))
        : state.vinclesSocials,
    salutCronica:
      accSalut !== 0
        ? Math.min(40, Math.max(0, (state.salutCronica ?? 0) + accSalut))
        : state.salutCronica,
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
    // Tractament no pagat: si una despesa de SALUT no es pot cobrir (descobert), la cura no
    // es fa i la salut se'n ressent (a banda del cop de benestar que ja aplica el descobert).
    if (event.category === 'salut' && res.descobert > 0) {
      person = applyEffect(person, { salutDelta: -Math.ceil(res.descobert / 600) })
    }
  }
  // Resta d'efectes sobre stats i patrimoni (inclou salutDelta).
  person = applyEffect(person, effect)

  // Canvis de sou persistents.
  let salari = state.salari
  if (effect.salariNou !== undefined) {
    salari = Math.max(0, Math.round(effect.salariNou))
  } else if (effect.salariDelta) {
    salari = Math.max(0, Math.round((salari ?? 0) + effect.salariDelta))
  }
  // Sostre salarial: la carrera fa plateau (no s'infla indefinidament en 49 anys de vida
  // laboral). Cap el sou a un múltiple realista del de partida; no afecta el 0 (atur).
  if (salari !== undefined && salari > 0) {
    salari = Math.min(
      salari,
      sostreSalari(state.familia, state.teDiploma ?? false, state.nivellAcademic),
    )
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
  // Una fita de mitja carrera es dispara EXACTAMENT en creuar el llindar (aquest torn ha
  // passat de sota a sobre de l'edat), de manera que es dispari una sola vegada sense
  // necessitat d'estat extra (la fase es manté `carrera`, no pot servir-ne de guarda).
  const creua = (edat: number) =>
    state.lifeStage === 'carrera' &&
    mesos >= edat * MESOS_PER_ANY &&
    mesos - MESOS_PER_ANY < edat * MESOS_PER_ANY
  let acabat = false
  // MORT (a qualsevol edat): si la salut arriba a 0, la persona mor. És el resultat acumulat
  // de l'edat, la precarietat (benestar baix), les malalties i els tractaments no pagats.
  // (Substitueix l'antiga mort instantània per benestar 0: ara el benestar baix erosiona la
  // salut, però no mata de cop.)
  let mort = state.mort ?? false
  const jubilat = state.jubilat ?? false
  let pendingMilestone = state.pendingMilestone
  if (person.stats.salut <= 0) {
    // L'únic final de la partida: la mort (salut 0), a qualsevol edat.
    acabat = true
    mort = true
  } else if (state.lifeStage === 'carrera' && mesos >= EDAT_JUBILACIO * MESOS_PER_ANY) {
    // Als 67 et jubiles: NO s'acaba la partida, es transiciona a la fase de jubilació
    // (es continua vivint —de la pensió i els estalvis— fins a la mort).
    pendingMilestone = 'jubilacio'
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
  } else if (creua(EDAT_CRUILLA_40)) {
    pendingMilestone = 'cruilla_40'
  } else if (creua(EDAT_REVISIO_50)) {
    pendingMilestone = 'revisio_50'
  } else if (creua(EDAT_RECTA_60)) {
    pendingMilestone = 'recta_60'
  }

  // Cooldown de l'augment de sou demanat.
  const ultimAugmentMes = effect.marcaAugmentSou
    ? person.edatMesos
    : state.ultimAugmentMes

  // Herència dels pares: un cop morts i heretat, no torna a passar.
  const herenciaParesRebuda = effect.marcaHerenciaPares || state.herenciaParesRebuda

  // Seqüela crònica (incapacitat): s'acumula i perdura, rebaixant la referència adulta.
  // Amb sostre (40) perquè incapacitats repetides no la facin créixer sense límit.
  const salutCronica = effect.salutCronicaDelta
    ? Math.min(40, Math.max(0, (state.salutCronica ?? 0) + effect.salutCronicaDelta))
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

  // Nivell acadèmic (0..1): s'acumula amb l'esforç a la universitat.
  const nivellAcademic =
    effect.academicDelta !== undefined
      ? Math.max(0, Math.min(1, (state.nivellAcademic ?? 0) + effect.academicDelta))
      : state.nivellAcademic

  // Descendència: si l'efecte porta un fill, l'incrementem i registrem l'edat (mesos) del
  // progenitor al naixement, per calcular els anys de criança (cost recurrent).
  let fills = state.fills
  let fillsNaixement = state.fillsNaixement
  if (effect.fillsDelta && effect.fillsDelta > 0) {
    fills = (state.fills ?? 0) + effect.fillsDelta
    const naixements = [...(state.fillsNaixement ?? [])]
    for (let i = 0; i < effect.fillsDelta; i++) naixements.push(person.edatMesos)
    fillsNaixement = naixements
  }

  // Herència en vida: transfereix patrimoni líquid (efectiu → estalvi → fons indexat) al pot
  // de llegat als descendents (lliure de successions). Surt del teu patrimoni ara.
  let llegatEnVida = state.llegatEnVida
  if (effect.llegatEnVidaDelta && effect.llegatEnVidaDelta > 0) {
    const pat = { ...person.patrimoni }
    let restant = effect.llegatEnVidaDelta
    for (const font of ['efectiu', 'estalvi', 'fonsIndexat'] as const) {
      const treu = Math.min(restant, pat[font])
      pat[font] = Math.round(pat[font] - treu)
      restant -= treu
    }
    const donat = effect.llegatEnVidaDelta - restant
    person = { ...person, patrimoni: pat }
    llegatEnVida = (state.llegatEnVida ?? 0) + donat
  }

  // Història de vida: una instantània per any (benestar, salut, patrimoni net) per dibuixar
  // l'evolució al resum final.
  const vidaHist = [
    ...(state.vidaHist ?? []),
    {
      edat: anys,
      benestar: Math.round(person.stats.benestar),
      salut: Math.round(person.stats.salut),
      net: Math.round(patrimoniTotal(person)),
    },
  ]

  // Si un acomiadament ha deixat el sou a 0 a la carrera, ambOfertes hi genera
  // automàticament les ofertes de cerca de feina.
  return ambOfertes({
    ...state,
    person,
    salari,
    vidaHist,
    ultimAugmentMes,
    salutCronica,
    vinclesSocials,
    nivellAcademic,
    herenciaParesRebuda,
    fills,
    fillsNaixement,
    llegatEnVida,
    pendingEvent: undefined,
    pendingMilestone,
    historial: [...state.historial, entry],
    acabat,
    mort,
    jubilat,
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
  // Jubilació: deixes de treballar. El sou passa a 0 (la pensió, derivada de `salariBase`,
  // és l'ingrés); s'esborren ofertes de feina pendents.
  if (option.lifeStage === 'jubilacio') {
    next.jubilat = true
    next.salari = 0
    next.ofertesFeina = undefined
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
  // ENTRADA a la carrera (només quan es ve d'una altra fase): NO et regalen feina.
  // Comences a l'atur (sou 0) i has de buscar-la; les ofertes les genera `ambOfertes` al
  // final. El pla d'inversió es fixa en acceptar una oferta (quan ja hi ha sou).
  const entraCarrera = option.lifeStage === 'carrera' && state.lifeStage !== 'carrera'
  if (entraCarrera) {
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
    (option.lifeStage === 'universitat' || entraCarrera) &&
    !next.habitatge
  ) {
    next.habitatge = { tipus: 'amb_pares' }
  }
  // Fites de mitja carrera (40/50/60): apliquen un EventEffect (trade-off de sou/benestar/
  // vincles/salut) sense canviar de fase. Es resol com a `resolveEvent`.
  if (option.effect && !entraCarrera) {
    const eff = option.effect
    next.person = applyEffect(next.person, eff)
    if (eff.salariNou !== undefined) {
      next.salari = Math.max(0, Math.round(eff.salariNou))
    } else if (eff.salariDelta) {
      next.salari = Math.max(0, Math.round((next.salari ?? 0) + eff.salariDelta))
    }
    if (eff.salutCronicaDelta) {
      next.salutCronica = Math.min(
        40,
        Math.max(0, (state.salutCronica ?? 0) + eff.salutCronicaDelta),
      )
    }
    // Vincles: el guany es redueix molt si es viu endeutat (com a `resolveEvent`).
    let vinclesDelta = eff.vinclesDelta
    if (vinclesDelta !== undefined && vinclesDelta > 0 && (next.person.patrimoni.deute ?? 0) > 0) {
      vinclesDelta *= 0.3
    }
    if (vinclesDelta !== undefined) {
      next.vinclesSocials = Math.max(0, Math.min(1, (state.vinclesSocials ?? 0) + vinclesDelta))
    }
  }
  const entry: LogEntry = {
    torn: state.torn,
    edatAnys: edatAnys(state.person.edatMesos),
    eventId: `milestone_${option.id}`,
    titleKey: option.labelKey,
    descKey: option.descKey,
    category: 'escola',
    kind: 'event',
    effect: !entraCarrera && option.effect ? option.effect : {},
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
    // El pla d'inversió comença BUIT: el jugador reparteix des de zero (cap categoria
    // opcional pre-omplerta). Les obligacions (cost de vida/habitatge) ja les calcula el motor.
    plaInversio: state.plaInversio ?? { oci: 0, estalvi: 0, fonsIndexat: 0, fonsPensions: 0 },
    ofertesFeina: undefined,
    historial: [...state.historial, entry],
  }
}
