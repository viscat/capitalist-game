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
  COST_FORMACIO_ANUAL,
  COST_SALUT_ANUAL,
  EDAT_REVISIO_50,
  EMPRESA_CAPITAL_MAX,
  EMPRESA_CAPITAL_MIN,
  EMPRESA_REINVERSIO_DEFAULT,
  EMPRESA_SOU_EMPLEATS,
  FACTOR_DESPESA_PARELLA,
  FORMACIO_INVERSIO_DELTA,
  HABITATGE_REAL_MAX,
  HABITATGE_REAL_MIN,
  INDEX_HABITATGE_INICIAL,
  IPC_INICIAL,
  MAX_FILLS,
  INTERES_DEUTE,
  MORALITAT_INICIAL,
  MORALITAT_LLINDAR_BO,
  SALARI_INDEXACIO,
  SALUT_INVERSIO_DELTA,
  SINDICAT_CONVENI_BONUS,
  SINDICAT_DECAIMENT_ANUAL,
  SINDICAT_PROTECCIO_LLINDAR,
  MESOS_PER_ANY,
  NIVELL_VIDA_DEFAULT,
  REVALORACIO_HABITATGE,
  SALUT_INICIAL,
} from './constants'
import {
  amortitzaHipoteca,
  costHabitatgeAnualNet,
  generaOfertesLloguer,
} from './housing'
import { nomPerSeed } from './identitat'
import { generaOfertes } from './jobs'
import { ADOLESCENCE_ACTIONS } from './actions/adolescencia'
import { UNIVERSITY_ACTIONS } from './actions/universitat'
import { selectEvent } from './events/engine'
import { ADOLESCENCE_EVENTS } from './events/adolescencia'
import {
  AJUT_PARES_EVENTS,
  ATUR_ADULT_EVENTS,
  ATZAR_EVENTS,
  CARRERA_EVENTS,
  DEPREDADOR_EVENTS,
  DESCENDENCIA_EVENTS,
  FILLS_EVENTS,
  HABITACIO_EVENTS,
  HERENCIA_DINASTIA_EVENTS,
  HERENCIA_PARES_EVENTS,
  HERENCIA_VIDA_EVENTS,
  LLOGUER_EVENTS,
  MORAL_EVENTS,
  PROPIETARI_EVENTS,
  PARELLA_EVENTS,
  SALUT_EDAT_EVENTS,
  SINDICAT_EVENTS,
  UNIVERSITAT_EVENTS,
} from './events/adult'
import {
  ATUR_EVENTS,
  COMMON_LIFE_EVENTS,
  NINI_EVENTS,
  TREBALL_EVENTS,
} from './events/laboral'
import { CHILDHOOD_EVENTS } from './events/pool'
import { FAMILY_PRESETS, FAMILY_PRESET_ORDER } from './family/presets'
import { MILESTONES } from './milestones'
import { rng, seedFromTime } from './rng'
import {
  ajudaCasaBenestar,
  ajutPublicMax,
  aportacioMinima,
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
  factorHabitatge,
  factorIPC,
  costFillsAnual,
  coberturaSanitariaPublica,
  costVidaAnual,
  costVidaPropi,
  habilitatEmprenedora,
  pFracasEmpresaAnual,
  beneficiEmpresaAnual,
  eficaciaCuraSalut,
  moralitatActual,
  poderSindicalActual,
  factorAportacioLlar,
  factorServeisPublics,
  factorSindical,
  fillsDependents,
  inflacioAnual,
  variacioHabitatgeAnual,
  defaultPlaInversio,
  estalviAnualCriatura,
  factorSalariPersonal,
  familyBaselineBenestar,
  herenciaVida,
  impostSuccessions,
  ingressosAnualsCarrera,
  ingressosMensuals16,
  llegatPerFill,
  netMensual,
  pagaMensual,
  pagaPerAjudaCasa,
  patrimoniTotal,
  pensioPublicaAnual,
  potViureFrugal,
  prestacioAturAnual,
  rendimentIndexAnual,
  repartDeficit,
  resolveDespesaGreu,
  salariAdultInicial,
  salariInicial,
  sostreSalari,
  suportUniversitatAnual,
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
  NivellSouEmpleats,
  RegimPolitic,
} from './types'

/** Petit ajut MENSUAL de pràctiques per a qui fa un grau mitjà (es prorrateja × 12). */
const ESTIPENDI_GRAU_MIG_MENSUAL = 50

/** Opcions de personalització en crear una partida. */
export interface NewGameSetup {
  dataNaixement?: string
  identitat?: Identitat
  regimPolitic?: RegimPolitic
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
    stats: {
      benestar: familyBaselineBenestar(familia),
      salut: SALUT_INICIAL,
      moralitat: MORALITAT_INICIAL,
    },
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
    ipc: IPC_INICIAL,
    indexHabitatge: INDEX_HABITATGE_INICIAL,
    regimPolitic: setup.regimPolitic ?? 'mixt',
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
    stats: {
      benestar: familyBaselineBenestar(familia),
      salut: SALUT_INICIAL,
      moralitat: MORALITAT_INICIAL,
    },
    patrimoni: { ...emptyPatrimoni(), efectiu: 250 },
  }
  return {
    torn: 16,
    lifeStage: 'adolescencia',
    person,
    familia,
    identitat: setup.identitat,
    dataNaixement: setup.dataNaixement,
    rngState: seed >>> 0,
    ipc: IPC_INICIAL,
    indexHabitatge: INDEX_HABITATGE_INICIAL,
    regimPolitic: setup.regimPolitic ?? 'mixt',
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
    stats: { benestar: 55, salut: SALUT_INICIAL, moralitat: MORALITAT_INICIAL },
    patrimoni: { ...emptyPatrimoni(), efectiu: 3000, inversions: 2000 },
  }
  return {
    torn: 22,
    lifeStage: 'carrera',
    person,
    familia,
    identitat: setup.identitat,
    dataNaixement: setup.dataNaixement,
    rngState: seed >>> 0,
    ipc: IPC_INICIAL,
    indexHabitatge: INDEX_HABITATGE_INICIAL,
    regimPolitic: setup.regimPolitic ?? 'mixt',
    teDiploma,
    salari,
    salariBase: salari,
    // Pla buit: el jugador el reparteix des de zero (coherent amb l'entrada normal).
    plaInversio: { oci: 0, inversions: 0 },
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
    inversions: 0,
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
 * Classe en què s'acaba (per a l'hereu o per a un mateix), amb inèrcia de classe forta
 * (reproducció social): l'origen condiciona molt el destí.
 * Pots CAURE sense fre, però PUJAR està limitat a UN sol graó per generació: la mobilitat existeix
 * (jugar bé i acumular riquesa real et fa enfilar un esglaó), però no hi ha salts de pobre a ric en
 * una vida —cal construir-ho generació rere generació—. Així es manté la crítica (l'origen pesa
 * moltíssim i pujar és dur) però jugar bé té recompensa real.
 *
 * `llegatReal` ha de venir ja DESINFLAT per l'IPC (en termes reals), perquè la inflació d'una vida
 * no "pugi de classe" pel sol fet que els números nominals creixen.
 */
export function classeHereu(origen: FamilyClass, llegatReal: number): FamilyClass {
  const rangOrigen = FAMILY_PRESET_ORDER.indexOf(origen)
  const perRiquesa = classePerPatrimoni(llegatReal)
  const rangRiquesa = FAMILY_PRESET_ORDER.indexOf(perRiquesa)
  // Caure: sense fre (la riquesa per sota de l'origen mana).
  if (rangRiquesa <= rangOrigen) return perRiquesa
  // Pujar: fins a la classe que et permet la teva riquesa real, però com a molt UN graó per vida.
  return FAMILY_PRESET_ORDER[Math.min(rangRiquesa, rangOrigen + 1)]
}

/**
 * Família d'origen de la nova generació: la llar TÍPICA de la classe que correspon a
 * l'herència rebuda (el fill d'un ric neix en una llar rica; el d'algú que mor sense res, en
 * una de pobra). El patrimoni concret heretat NO es posa aquí: arriba més tard, a l'edat que
 * el progenitor va morir (vegeu `continuaGeneracio` i `herenciaPendent`).
 */
export function familiaHereva(patrimoniHeretat: number): Familia {
  return FAMILY_PRESETS[classePerPatrimoni(patrimoniHeretat)].familia
}

/**
 * Continua la dinastia amb un descendent: comença una vida NOVA des del naixement (FLASHBACK).
 * El fill neix en una llar de la classe que correspon a l'herència, però **no la rep al néixer**:
 * la rebrà a l'edat que tenia quan el progenitor (tu) va morir (es recorda a `herenciaPendent` i
 * s'atorga llavors amb un esdeveniment previst). Conserva el cognom (llinatge) i la seva data de
 * naixement és l'any REAL en què va néixer (quan el progenitor el va tenir), no l'any de la mort:
 * així l'edat (0) i l'any de calendari quadren, i l'herència arriba justament l'any de la mort.
 */
export function continuaGeneracio(state: GameState): GameState {
  const fills = state.fills ?? 0
  if (fills <= 0) return state
  // Classe de l'hereu: inèrcia de classe forta a partir de l'herència REAL (desinflada per l'IPC).
  const llegat = llegatPerFill(state)
  const llegatReal = llegat / factorIPC(state)
  const familia = FAMILY_PRESETS[classeHereu(state.familia.classe, llegatReal)].familia
  const edatMortProgenitor = edatAnys(state.person.edatMesos)
  const naixementMesosProgenitor = state.fillsNaixement?.[0] ?? 0
  const edatProgenitorAlNaixer = edatAnys(naixementMesosProgenitor)
  const edatHerencia = Math.max(1, edatMortProgenitor - edatProgenitorAlNaixer)
  let dataNaixement = state.dataNaixement
  if (dataNaixement) {
    const d = dataActual(dataNaixement, naixementMesosProgenitor)
    dataNaixement = `${d.any}-${String(d.mesIndex + 1).padStart(2, '0')}-01`
  }

  // El MÓN es RE-BASA a cada generació: els preus (IPC i habitatge) tornen a 100 al naixement de
  // l'hereu. Si no, la inflació s'acumularia sense fre al llarg de les generacions (a la 3a, un
  // lloguer valdria milers de vegades el sou i tothom moriria). Cada vida és, doncs, el seu propi
  // arc d'inflació des de zero. Per preservar la TRANSMISSIÓ REAL de riquesa, l'herència es
  // DESINFLA pel factor de preus del món del progenitor (es passa a euros del nou món base-100).
  const fWorld = factorIPC(state)
  // L'herència es reparteix en TRES parts (totes desinflades al nou món):
  // 1) HERÈNCIA EN VIDA: els regals que el progenitor va fer en vida ja els té l'hereu de petit
  //    → comencen com a patrimoni inicial (els ha rebut durant la infància/joventut).
  const inVidaPerFill =
    Math.round((state.llegatEnVida ?? 0) / fWorld / fills / 100) * 100
  // 2) ESTAT LÍQUID a la mort (efectiu + inversions, net de successions), per fill → diferit.
  const liquidEstate =
    Math.max(0, state.person.patrimoni.efectiu + state.person.patrimoni.inversions) /
    fWorld
  const liquidPerFillBrut = liquidEstate / fills
  const liquidPerFill =
    Math.round(
      Math.max(0, liquidPerFillBrut - impostSuccessions(liquidPerFillBrut)) / 100,
    ) * 100
  // 3) CASES: l'hereu que continua el llinatge es queda l'habitatge familiar (propietats), que
  //    rep en propietat a la mort del progenitor (valor desinflat al nou món).
  const casesHeretades = state.person.patrimoni.cases.map((v) =>
    Math.round(v / fWorld),
  )

  const person: Person = {
    edatMesos: 0,
    stats: {
      benestar: familyBaselineBenestar(familia),
      salut: SALUT_INICIAL,
      moralitat: MORALITAT_INICIAL,
    },
    patrimoni: { ...emptyPatrimoni(), inversions: inVidaPerFill },
  }
  const teHerenciaDiferida = liquidPerFill > 0 || casesHeretades.length > 0
  return {
    torn: 0,
    lifeStage: 'infancia',
    person,
    familia,
    identitat: state.identitat,
    dataNaixement,
    rngState: state.rngState,
    // El MÓN es re-basa: els preus tornen a 100 al naixement de l'hereu (cada vida té el seu propi
    // arc d'inflació). Evita l'explosió nominal acumulada al llarg de generacions; l'herència ja
    // s'ha desinflat a aquest nou món. La INDEXACIÓ del sou i el topall d'habitatge segueixen
    // operant DINS de cada vida (l'habitatge encara s'encareix per damunt dels sous al llarg dels
    // anys, fins al topall: la crisi de l'habitatge es viu, però no es torna infinita).
    ipc: IPC_INICIAL,
    indexHabitatge: INDEX_HABITATGE_INICIAL,
    // El règim del benestar és del MÓN: la dinastia l'hereta (no es reinicia amb cada generació).
    regimPolitic: state.regimPolitic ?? 'mixt',
    generacio: (state.generacio ?? 1) + 1,
    herenciaPendent: teHerenciaDiferida
      ? { import: liquidPerFill, cases: casesHeretades, edat: edatHerencia }
      : undefined,
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
  let next = state
  // Feina: a l'atur (carrera, sou 0) hi ha cerca de feina; amb sou, s'esborren les ofertes. Si
  // l'atur és VOLUNTARI (has deixat la feina), NO es generen ofertes: vius de l'empresa/estalvis.
  if (next.lifeStage === 'carrera' && (next.salari ?? 0) === 0 && !next.aturVoluntari) {
    const { ofertes, rngState } = generaOfertes(next, next.rngState)
    next = { ...next, ofertesFeina: ofertes, rngState }
  } else if (next.ofertesFeina) {
    next = { ...next, ofertesFeina: undefined }
  }
  // Lloguer: a les fases adultes, si no ets propietari, el mercat ofereix unes quantes opcions
  // (preus variats) CADA any. En comprar (propietari), s'esborren.
  const potLlogar =
    (next.lifeStage === 'universitat' ||
      next.lifeStage === 'carrera' ||
      next.lifeStage === 'jubilacio') &&
    next.habitatge?.tipus !== 'propietat'
  if (potLlogar) {
    const r = generaOfertesLloguer(next.rngState, factorHabitatge(next))
    next = { ...next, ofertesLloguer: r.ofertes, rngState: r.state }
  } else if (next.ofertesLloguer) {
    next = { ...next, ofertesLloguer: undefined }
  }
  return next
}

/** Viu de lloguer (habitació o pis): exposat a la inseguretat habitacional. */
function esLloguer(state: GameState): boolean {
  return (
    state.habitatge?.tipus === 'habitacio' || state.habitatge?.tipus === 'pis_lloguer'
  )
}

/** Treu tots els esdeveniments amb un id concret del pool (p. ex. protecció contra acomiadament). */
function removeById(pool: GameEvent[], id: string): GameEvent[] {
  return pool.filter((e) => e.id !== id)
}

/** Pot oferir herència en vida: té fills i prou patrimoni líquid per avançar-ne una part. */
function potHeretarEnVida(state: GameState): boolean {
  const p = state.person.patrimoni
  return (state.fills ?? 0) > 0 && p.efectiu + p.inversions > 30_000
}

/** Anys entre ofertes GARANTIDES de vida personal (buscar parella / tenir un fill). */
const ANYS_REOFERTA_VIDA = 3

/**
 * Oferta GARANTIDA de vida personal: formar parella i tenir fills no es deixa a l'atzar dels
 * esdeveniments (es podia no oferir mai en una partida). Mentre s'hi és elegible, el motor força
 * l'opció cada pocs anys (`ANYS_REOFERTA_VIDA`): primer trobar parella; després, amb parella i dins
 * de la finestra fèrtil, tenir un fill. El jugador sempre pot dir que no; es torna a oferir més
 * endavant. Retorna l'esdeveniment a forçar, o null si no toca (cooldown / no elegible).
 */
function vidaPersonalForcada(
  state: GameState,
  anys: number,
  torn: number,
): GameEvent | null {
  if (state.lifeStage !== 'carrera' && state.lifeStage !== 'jubilacio') return null
  if (torn - (state.ultimaOfertaVida ?? -ANYS_REOFERTA_VIDA - 1) < ANYS_REOFERTA_VIDA) {
    return null
  }
  // Sense parella: sempre s'ofereix conèixer-ne una (requisit per als fills).
  if (!state.parella) return PARELLA_EVENTS[0]
  // Amb parella i dins de la finestra fèrtil, sense haver arribat al màxim: s'ofereix tenir un fill.
  if (
    anys >= EDAT_FERTIL_MIN &&
    anys <= EDAT_FERTIL_MAX &&
    (state.fills ?? 0) < MAX_FILLS
  ) {
    return DESCENDENCIA_EVENTS[0]
  }
  return null
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
      // La sort i la mala sort (cops de sort, imprevistos, herències llunyanes, estafes): variància
      // que fa que dues vides de la mateixa classe puguin divergir. La loteria de la vida.
      pool.push(...ATZAR_EVENTS)
      // A partir dels ~50, el risc de salut propi de l'edat (i la cura dels pares grans)
      // s'afegeix al pool: el cos passa factura amb els anys.
      if (edat >= EDAT_REVISIO_50) pool.push(...SALUT_EDAT_EVENTS)
      // De lloguer: inseguretat habitacional (fi de contracte, desnonament → perds el pis). Una
      // HABITACIÓ compartida hi suma conflictes i incomoditats (no és el mateix que un pis sencer);
      // ser PROPIETARI no té risc de desnonament però porta despeses pròpies (derrames, avaries).
      if (esLloguer(state)) pool.push(...LLOGUER_EVENTS)
      if (state.habitatge?.tipus === 'habitacio') pool.push(...HABITACIO_EVENTS)
      if (state.habitatge?.tipus === 'propietat') pool.push(...PROPIETARI_EVENTS)
      // (Muntar i gestionar una EMPRESA ja no és un esdeveniment a l'atzar: és un sistema propi
      // amb decisions al `EmpresaPanel` —fundar, reinversió, sou propi, sou dels empleats—.)
      // Amb feina: acció col·lectiva (sindicar-se, vagues). Via d'ascens COMPARTIDA.
      if ((state.salari ?? 0) > 0) pool.push(...SINDICAT_EVENTS)
      // Cruïlles morals (frau/solidaritat): sempre presents a la vida adulta.
      pool.push(...MORAL_EVENTS)
      // OPORTUNITATS DEPREDADORES: enriquir-se a costa dels altres. El sistema només les obre a
      // qui ja NO és "bo" (moralitat per sota del llindar): la via depredadora es retroalimenta.
      if (moralitatActual(state) < MORALITAT_LLINDAR_BO) {
        // Desnonar/apujar el lloguer abusivament: només si tens més d'una casa (en llogues).
        if (state.person.patrimoni.cases.length >= 2) {
          pool.push(DEPREDADOR_EVENTS[0])
        }
        // Suborn a la feina: només amb feina.
        if ((state.salari ?? 0) > 0) pool.push(DEPREDADOR_EVENTS[1])
      }
      // (Parella i descendència ja NO van a l'atzar del pool: s'ofereixen de manera GARANTIDA cada
      // pocs anys mentre s'hi és elegible —vegeu `vidaPersonalForcada`—, perquè formar família
      // sigui sempre una opció i no depengui de la sort dels esdeveniments.)
      // Amb fills dependents a càrrec: alegries i ensurts de la criança (benestar amunt i avall).
      if (fillsDependents(state) > 0) pool.push(...FILLS_EVENTS)
      // Amb fills i un coixí, pot sortir l'opció d'herència en vida.
      if (potHeretarEnVida(state)) pool.push(...HERENCIA_VIDA_EVENTS)
      // Mentre els pares viuen: ajut econòmic puntual (segons classe). Quan envelleixes
      // (~40+), poden morir i n'heretes (un sol cop). En una dinastia, l'herència del
      // progenitor ja està PREVISTA (`herenciaPendent`), així que no en surt una d'aleatòria.
      if (!state.herenciaParesRebuda) {
        pool.push(...AJUT_PARES_EVENTS)
        if (edat >= 40 && !state.herenciaPendent) pool.push(...HERENCIA_PARES_EVENTS)
      }
      // Protecció col·lectiva: amb prou poder sindical, els acomiadaments queden aturats (la
      // força organitzada protegeix la feina; és l'altra cara del poder de l'empresari).
      if (poderSindicalActual(state) >= SINDICAT_PROTECCIO_LLINDAR) {
        return removeById(pool, 'acomiadament')
      }
      return pool
    }
    case 'jubilacio': {
      // Jubilació: vida tranquil·la amb risc de salut d'edat i vida quotidiana; sense feina.
      const pool = [...SALUT_EDAT_EVENTS, ...COMMON_LIFE_EVENTS, ...ATZAR_EVENTS]
      if (esLloguer(state)) pool.push(...LLOGUER_EVENTS)
      if (state.habitatge?.tipus === 'habitacio') pool.push(...HABITACIO_EVENTS)
      if (state.habitatge?.tipus === 'propietat') pool.push(...PROPIETARI_EVENTS)
      // (Parella: oferta garantida via `vidaPersonalForcada`, no a l'atzar del pool.)
      if (fillsDependents(state) > 0) pool.push(...FILLS_EVENTS)
      if (potHeretarEnVida(state)) pool.push(...HERENCIA_VIDA_EVENTS)
      // Si encara no han mort els pares (i no és una herència de dinastia prevista), poden morir.
      if (!state.herenciaParesRebuda && !state.herenciaPendent) {
        pool.push(...HERENCIA_PARES_EVENTS)
      }
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
  // Deriva de FONS del benestar (cap a la referència d'entorn), NO causada per l'esdeveniment:
  // és l'"efecte fantasma" que fa que el benestar real es mogui diferent del "+N" de l'event.
  const derivaBenestar = benestar - state.person.stats.benestar
  // Declivi anual de la salut: edat + benestar (estrès/precarietat) + seqüeles, modulat per
  // el progrés mèdic de l'època (esperança de vida actual i futura). El benestar que es fa
  // servir és el ja derivat d'aquest any. Pot recuperar-se (delta negatiu) si la persona és
  // jove i benestant. Els esdeveniments de salut hi sumaran cops a sobre.
  // L'època es fixa pel teu ANY DE NAIXEMENT (la medicina de la teva generació), no per l'any
  // corrent: si no, una sola vida que arriba a dècades futures "envelliria cada cop més a poc a
  // poc" i es faria centenària. Així el ritme d'envelliment és constant tota la vida; les
  // generacions futures (nascudes més tard) viuen una mica més (progrés mèdic entre generacions).
  const anyNaixement = state.dataNaixement
    ? dataActual(state.dataNaixement, 0).any
    : undefined
  const factorEpoca =
    anyNaixement !== undefined ? factorEsperancaVida(anyNaixement) : 1
  const salut = clampSalut(
    Math.round(
      state.person.stats.salut -
        declividSalutAnual(anys, benestar, state.salutCronica ?? 0, factorEpoca),
    ),
  )
  // Deriva de FONS de la salut (desgast per edat + precarietat + seqüeles), abans de cap cop
  // de l'esdeveniment. És l'altra meitat de l'"efecte fantasma".
  const derivaSalut = salut - state.person.stats.salut
  let person: Person = {
    ...state.person,
    edatMesos,
    stats: { ...state.person.stats, benestar, salut },
  }
  let habitatge = state.habitatge
  let patrimoniHist = state.patrimoniHist
  // Empresa pròpia: pot tancar (fracàs) o créixer (reinversió) aquest any (vegeu el bloc de carrera).
  let empresa = state.empresa
  let empresaHist = state.empresaHist
  // Cost de matrícula d'aquest any d'universitat (després de beca), per registrar-lo a l'historial.
  let matriculaUniAny = 0

  // Estat del RNG d'aquest torn (pot avançar abans de seleccionar l'esdeveniment,
  // p. ex. per sortejar el rendiment anual del fons indexat).
  let rngState = state.rngState

  // IPC: els preus de consum varien cada any (pot caure, però la tendència és a l'alça). La taxa
  // és determinista a partir del RNG PERÒ no el consumeix (no altera la seqüència d'esdeveniments).
  const ipc =
    Math.round(
      (state.ipc ?? IPC_INICIAL) * (1 + inflacioAnual(state.rngState + anys)) * 100,
    ) / 100
  // Inflació efectiva d'enguany i factor de preus actual (per a la revisió salarial i el terra).
  const inflacioAny = ipc / (state.ipc ?? IPC_INICIAL) - 1
  const factorIpcActual = ipc / IPC_INICIAL
  // Índex de l'habitatge: camí PROPI (no l'IPC), de mitjana més alt → l'habitatge s'encareix més.
  // PERÒ acotat a una banda relativa a l'IPC: l'habitatge pot ser molt més car que el nivell
  // general de preus (fins a HABITATGE_REAL_MAX×), però NO infinitament — sense aquest límit, al
  // cap de poques generacions un lloguer valdria milers de vegades el sou i tothom moriria. Quan
  // toca sostre, el mercat es corregeix (la bombolla esclata). És la correcció estructural.
  const indexHabitatgeRaw =
    (state.indexHabitatge ?? INDEX_HABITATGE_INICIAL) *
    (1 + variacioHabitatgeAnual(state.rngState + anys))
  const indexHabitatge =
    Math.round(
      Math.min(
        ipc * HABITATGE_REAL_MAX,
        Math.max(ipc * HABITATGE_REAL_MIN, indexHabitatgeRaw),
      ) * 100,
    ) / 100

  // Flux econòmic per fase.
  if (stage === 'infancia') {
    person = {
      ...person,
      patrimoni: {
        ...person.patrimoni,
        inversions: person.patrimoni.inversions + estalviAnualCriatura(state.familia),
      },
    }
  } else if (stage === 'laboral') {
    // Fase laboral 16-18: MATEIX model econòmic que la carrera (un sol panell de despeses/ingressos
    // a tota la vida laboral). Vius amb els pares, així que l'única despesa obligatòria és
    // l'aportació a casa (treball; el nini no aporta). La resta es reparteix entre oci i estalvi/
    // inversió, i el dèficit es torna deute, igual que a la carrera. Sense exposició al mercat
    // (indexReturn 0): no es consumeix RNG aquí, es manté el determinisme de la seqüència.
    const monthly = ingressosMensuals16(state)
    const income = monthly * MESOS_PER_ANY
    const aportacio =
      state.itinerari === 'treball'
        ? aportacioMinima(state.familia, monthly) * MESOS_PER_ANY
        : 0
    const pla = state.plaInversio ?? defaultPlaInversio(income)
    person = applyCareerYear(
      person,
      pla,
      income,
      0, // sense rendiment del mercat per als estalvis d'un adolescent
      0, // cost de vida: viu amb els pares (el cobreixen ells)
      0, // sense habitatge propi
      state.familia,
      aportacio, // aportació obligatòria a casa (treball)
      0, // benestarNivell
      0, // sense fills dependents
      factorIPC(state),
      factorServeisPublics(state),
    )
  } else if (stage === 'universitat') {
    // Any d'universitat. La MATRÍCULA (menys beca) la pagues SEMPRE de la teva butxaca: estudiar
    // costa diners a tothom (a la privada, molt; a la pública, menys; el pobre amb beca, encara
    // menys, però MAI res). El suport familiar cobreix el COST DE VIDA (habitatge + manutenció si
    // vius sol), però NO és diner sobrant a la butxaca: una família rica et paga la vida mentre
    // estudies, no t'omple el compte. Així la uni MAI dóna diners; el dèficit es torna DEUTE.
    const ambPares = (habitatge?.tipus ?? 'amb_pares') === 'amb_pares'
    const costHab = ambPares ? 0 : costHabitatgeAnualNet(habitatge, state.familia)
    const costVidaUni = ambPares ? 0 : costVidaAnual('minim')
    const costVida = costHab + costVidaUni
    // El suport familiar només pot cobrir despeses de vida reals (mai genera sobrant).
    const suportVida = Math.min(suportUniversitatAnual(state.familia), costVida)
    const matriculaNeta = balancUniversitatAnual(state.familia, state.tipusUniversitat)
    matriculaUniAny = Math.max(0, -matriculaNeta) // cost net de matrícula (després de beca)
    const fluxNet = matriculaNeta + suportVida - costVida
    let efectiu = person.patrimoni.efectiu
    let inversions = person.patrimoni.inversions
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
        inversions,
        state.familia,
        ajutPublicMax(patrimoniTotal(person), 0, factorServeisPublics(state)),
      )
      inversions -= r.propi
      deute += r.descobert
    }
    person = {
      ...person,
      patrimoni: {
        ...person.patrimoni,
        efectiu: Math.max(0, Math.round(efectiu)),
        inversions: Math.max(0, Math.round(inversions)),
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
    const f = factorIPC(state)
    // Ingrés de l'any. Ni el SOU ni la PENSIÓ van lligats a l'IPC (no s'indexen amb la inflació):
    // es queden nominals i, per tant, perden poder adquisitiu amb els anys (estancament salarial
    // i pensions que no es revaloren). La pensió es deriva del sou de jubilar-se, també nominal.
    const incomeFeina =
      stage === 'jubilacio'
        ? pensioPublicaAnual(state)
        : (state.salari ?? 0) > 0
          ? ingressosAnualsCarrera(state)
          : // Sense sou: prestació d'atur només si l'atur és INVOLUNTARI. Qui deixa la feina per
            // decisió pròpia (atur voluntari) no cobra res: viu de l'empresa, inversions i estalvis.
            state.aturVoluntari
            ? 0
            : prestacioAturAnual(state.salariBase ?? 0, state.anysExperiencia ?? 0)
    // EMPRESA pròpia: si en tens una, aquest any es juga la SUPERVIVÈNCIA (la majoria tanquen els
    // primers anys). Si sobreviu, genera benefici que es reparteix entre REINVERSIÓ (creix el
    // capital) i el TEU SOU (s'afegeix a l'ingrés). El fracàs en perd el capital invertit (ja havia
    // sortit del patrimoni en fundar/reinvertir): qui pot REINTENTAR —el ric— acaba encertant-ne una.
    let empresaSou = 0 // el teu sou de l'empresa, real → nominal (× f)
    let empresaBenestar = 0
    let empresaMoralitat = 0
    if (empresa) {
      const rollFracas = rng(rngState)
      rngState = rollFracas.state
      const habilitat = habilitatEmprenedora(state)
      if (rollFracas.value < pFracasEmpresaAnual(empresa, habilitat)) {
        // FRACÀS: l'empresa tanca. El capital ja s'havia compromès; ara es perd del tot.
        empresaHist = [
          ...(empresaHist ?? []),
          { edat: anys, capital: 0, benefici: 0, reinvertit: 0, sou: 0, fracas: true },
        ]
        empresa = undefined
        empresaBenestar = -10
      } else {
        const rollSort = rng(rngState)
        rngState = rollSort.state
        const luck = 0.7 + rollSort.value * 0.6
        const benefici = beneficiEmpresaAnual(empresa, luck)
        empresaMoralitat = EMPRESA_SOU_EMPLEATS[empresa.souEmpleats].moralitatAnual
        let capital = empresa.capital
        let reinvertit = 0
        let souTeu = 0
        if (benefici > 0) {
          const reinv = Math.max(
            0,
            Math.min(1, state.reinversioEmpresa ?? EMPRESA_REINVERSIO_DEFAULT),
          )
          // El capital se satura a EMPRESA_CAPITAL_MAX: el que es reinvertiria de més torna al
          // teu sou (el mercat ja no absorbeix més creixement).
          reinvertit = Math.min(
            Math.round(benefici * reinv),
            Math.max(0, EMPRESA_CAPITAL_MAX - capital),
          )
          capital += reinvertit
          souTeu = benefici - reinvertit
          empresaSou = souTeu * f
        } else {
          capital = Math.max(0, capital + benefici) // mal any: l'empresa minva
        }
        empresa = { ...empresa, capital, anys: empresa.anys + 1 }
        empresaHist = [
          ...(empresaHist ?? []),
          { edat: anys, capital, benefici, reinvertit, sou: souTeu },
        ]
      }
    }
    // Premi de CONVENI: l'acció col·lectiva arrenca millores salarials recurrents (escala amb el
    // poder sindical). Només sobre l'ingrés del TREBALL (carrera amb sou), no sobre la pensió.
    const conveni =
      stage === 'carrera' && (state.salari ?? 0) > 0
        ? incomeFeina * poderSindicalActual(state) * SINDICAT_CONVENI_BONUS
        : 0
    const income = incomeFeina + empresaSou + conveni
    const pla = state.plaInversio ?? defaultPlaInversio(income)
    // Viure amb els pares: un SOL cost (contribució a la llar = manutenció + ajuda a casa),
    // sense pagar el cost de vida a part ni triar-ne el nivell (ells et mantenen). Viure
    // sol: cost de vida sencer (segons el nivell que tries) + habitatge, i s'atura l'ajuda.
    const ambPares = (habitatge?.tipus ?? 'amb_pares') === 'amb_pares'
    const net = stage === 'jubilacio' ? income / MESOS_PER_ANY : netMensual(state.salari ?? 0)
    // Viure en parella reparteix les despeses estructurals (lloguer/hipoteca + cost de vida)
    // entre dues persones: l'altra n'assumeix una part, així que la teva minva (sigui quin
    // sigui l'habitatge: casa els pares, habitació, lloguer o propietat).
    const factorParella = state.parella ? FACTOR_DESPESA_PARELLA : 1
    // Cost de vida. Viure AMB ELS PARES = contribució a la llar: una fracció de l'INGRÉS (ja és
    // nominal, NO s'hi torna a aplicar l'IPC). Viure SOL = cost de vida propi, que SÍ s'encareix
    // amb l'IPC (× f). L'habitatge va a part (índex d'habitatge / quota fixa).
    const costVidaBase = ambPares
      ? contribucioLlar(state.familia, net, factorAportacioLlar(state))
      : Math.round(costVidaPropi(state.familia, habitatge, state.nivellVida) * f)
    // Accions fixes: inversió en salut i/o formació (cost anual nominal afegit a les necessitats).
    const costSalut = state.inversioSalut ? Math.round(COST_SALUT_ANUAL * f) : 0
    const costFormacio = state.inversioFormacio ? Math.round(COST_FORMACIO_ANUAL * f) : 0
    const costVida = Math.round(costVidaBase * factorParella) + costSalut + costFormacio
    const costHab = ambPares
      ? 0
      : Math.round(costHabitatgeAnualNet(habitatge, state.familia) * factorParella)
    const indexReturn = rendimentIndexAnual(draw.value)
    // Valor invertit ABANS d'aplicar l'any (per derivar l'aportació real d'enguany).
    const prevInversions = person.patrimoni.inversions
    person = applyCareerYear(
      person,
      pla,
      income,
      indexReturn,
      costVida,
      costHab,
      state.familia,
      0, // l'ajuda a la família ja va inclosa a la contribució a la llar (amb_pares); 0 si vius sol
      ambPares
        ? 0
        : benestarNivellVida(
            state.nivellVida,
            Boolean(state.vidaSenzilla) && potViureFrugal(state),
          ),
      costFillsAnual(state), // criança dels fills dependents (ja en euros nominals amb IPC)
      f, // factor IPC: desinfla el benestar (oci/descobert) i les xarxes d'ajut
      factorServeisPublics(state), // règim del benestar: eixampla la xarxa pública
    )
    // Efectes de l'empresa sobre les stats: el cop de tancar (fracàs) i la deriva de moralitat
    // segons com es paguen els empleats (l'explotació corca la moralitat any rere any).
    if (empresaBenestar !== 0 || empresaMoralitat !== 0) {
      person = applyEffect(person, {
        benestar: empresaBenestar,
        moralitatDelta: empresaMoralitat,
      })
    }
    // Aportació REAL d'enguany a la cartera = valor nou − valor crescut (el que ha pujat pel
    // rendiment no és aportació). Acumulada, és el «que has posat» que es compara al gràfic.
    const aportatAny = Math.max(
      0,
      person.patrimoni.inversions - Math.round(prevInversions * (1 + indexReturn)),
    )
    const aportatAcum = (state.patrimoniHist?.at(-1)?.aportat ?? 0) + aportatAny
    // Instantània anual del patrimoni invertit, per al gràfic de rendiment.
    patrimoniHist = [
      ...(state.patrimoniHist ?? []),
      {
        edat: anys,
        inversions: person.patrimoni.inversions,
        aportat: aportatAcum,
      },
    ]
    // Efecte de l'acció fixa de SALUT: recupera salut (ja n'has pagat el cost amb costVida). La
    // seva eficàcia s'esvaeix amb l'edat (cuidar-se ajuda, però no et fa immortal: als 85+ amb
    // prou feines compensa l'envelliment).
    if (state.inversioSalut) {
      person = {
        ...person,
        stats: {
          ...person.stats,
          salut: clampSalut(
            person.stats.salut + SALUT_INVERSIO_DELTA * eficaciaCuraSalut(anys),
          ),
        },
      }
    }
    // L'efecte de FORMACIÓ (puja el nivell acadèmic) s'aplica a `base` més avall (extraAcademic).
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
    // El lloguer es revisa cada any amb l'ÍNDEX DE L'HABITATGE (no l'IPC), i per al llogater que
    // ja hi viu mai baixa (revisió de renda enganxosa a la baixa): puja o es manté.
    if (
      (habitatge?.tipus === 'habitacio' || habitatge?.tipus === 'pis_lloguer') &&
      habitatge.lloguerAnual
    ) {
      const factorRevisio = Math.max(
        1,
        indexHabitatge / (state.indexHabitatge ?? INDEX_HABITATGE_INICIAL),
      )
      habitatge = {
        ...habitatge,
        lloguerAnual: Math.round((habitatge.lloguerAnual * factorRevisio) / 100) * 100,
      }
    }
  }

  const entries: LogEntry[] = []
  // Universitat: deixa constància ANUAL del cost de la matrícula (després de beca) a l'historial.
  // És informatiu (el flux ja l'ha cobrat); el deute que en resulti ja es modela a part.
  if (stage === 'universitat' && matriculaUniAny > 0) {
    entries.push({
      torn,
      edatAnys: anys,
      eventId: 'matricula_uni',
      titleKey: 'log.matricula.title',
      descKey: 'log.matricula.desc',
      params: { import: matriculaUniAny },
      category: 'escola',
      kind: 'event',
      // El cost es mostra com a despesa al historial (el flux ja l'ha cobrat; aquest efecte
      // NO es torna a aplicar: és una entrada informativa, no es passa per `applyEffect`).
      effect: { efectiu: -matriculaUniAny },
    })
  }
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

  // Herència de dinastia PREVISTA: si el fill arriba a l'edat en què va morir el progenitor,
  // es dispara l'esdeveniment d'herència (no aleatori), en lloc d'un esdeveniment normal.
  const herenciaDue =
    state.herenciaPendent !== undefined && anys >= state.herenciaPendent.edat
  let event: GameEvent
  let nextRng: number
  let ultimaOfertaVida = state.ultimaOfertaVida
  const vidaForcada = herenciaDue ? null : vidaPersonalForcada(state, anys, torn)
  if (herenciaDue) {
    event = HERENCIA_DINASTIA_EVENTS[0]
    nextRng = rngState
  } else if (vidaForcada) {
    // Oferta garantida de parella/fill: no consumeix el RNG (no altera la seqüència d'events).
    event = vidaForcada
    nextRng = rngState
    ultimaOfertaVida = torn
  } else {
    const sel = selectEvent(eventPool(state), state.familia, rngState, state.ultimEventId)
    event = sel.event
    nextRng = sel.rngState
  }

  // Formació contínua (acció fixa de la vida adulta): puja el nivell acadèmic cada any (ja
  // n'has pagat el cost amb costVida). El nivell acadèmic alimenta la frugalitat i el benestar.
  if ((stage === 'carrera' || stage === 'jubilacio') && state.inversioFormacio) {
    accAcademic += FORMACIO_INVERSIO_DELTA
  }

  // Aplica els stats no monetaris acumulats per les accions (gating de vincles per deute,
  // com a resolveEvent). Els events del torn hi sumaran els seus deltes a sobre.
  const vinclesAccio =
    accVincles > 0 && (person.patrimoni.deute ?? 0) > 0 ? accVincles * 0.6 : accVincles
  const base: GameState = {
    ...state,
    torn,
    person,
    habitatge,
    patrimoniHist,
    anysExperiencia,
    empresa, // pot haver tancat (fracàs) o crescut (reinversió) aquest any
    empresaHist,
    ipc,
    indexHabitatge,
    // El sou es revisa cada any: (1) REVISIÓ ANUAL PARCIAL (COLA) — puja una fracció de la
    // inflació d'enguany (`SALARI_INDEXACIO` < 1), així que LAGA els preus (estancament salarial
    // real) però no es congela nominalment (que el faria erosionar a zero al llarg de generacions);
    // (2) TERRA del capital humà INDEXAT a l'IPC — formar-se aixeca aquest terra de manera fiable,
    // i com que és × factorIPC, una nova generació no comença cobrant euros-base en un món inflat.
    // L'acció col·lectiva (poder sindical) també apuja el terra. El sostre (× IPC) s'aplica a
    // resolveEvent. Resultat: sous sostenibles a llarg termini que, tot i així, laguen els preus.
    salari:
      (stage === 'carrera' || stage === 'laboral') && (state.salari ?? 0) > 0
        ? Math.max(
            Math.round((state.salari ?? 0) * (1 + inflacioAny * SALARI_INDEXACIO)),
            Math.round(
              salariAdultInicial(
                state.familia,
                state.teDiploma ?? false,
                Math.max(0, Math.min(1, (state.nivellAcademic ?? 0) + accAcademic)),
                state.tipusUniversitat === 'privada',
              ) *
                factorIpcActual *
                factorSindical(state),
            ),
          )
        : state.salari,
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
    ultimaOfertaVida,
    derivaPendent: { benestar: derivaBenestar, salut: derivaSalut },
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
    // Les despeses greus de SALUT les cobreix parcialment la sanitat pública (segons el règim):
    // un estat fort fa el cop de malaltia molt menys ruïnós i més simètric entre classes.
    const cobertura =
      event.category === 'salut' ? coberturaSanitariaPublica(state) : 0
    const res = resolveDespesaGreu(person, state.familia, effect.despesaGreu, cobertura)
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

  // Perdre l'habitatge de lloguer (desnonament / fi de contracte): tornes a casa els pares.
  let habitatge = state.habitatge
  if (
    effect.perdHabitatge &&
    (habitatge?.tipus === 'habitacio' || habitatge?.tipus === 'pis_lloguer')
  ) {
    habitatge = { tipus: 'amb_pares' }
  }

  // Heretar cases (herència del progenitor): s'afegeixen com a propietats. Si encara no eres
  // propietari, passes a viure a l'habitatge heretat (sense hipoteca: ja està pagat).
  if (effect.heretaCases && effect.heretaCases.length > 0) {
    person = {
      ...person,
      patrimoni: {
        ...person.patrimoni,
        cases: [...person.patrimoni.cases, ...effect.heretaCases],
      },
    }
    if (habitatge?.tipus !== 'propietat') {
      habitatge = { tipus: 'propietat' }
    }
  }

  // Canvis de sou persistents.
  let salari = state.salari
  if (effect.salariNou !== undefined) {
    salari = Math.max(0, Math.round(effect.salariNou))
  } else if (effect.salariDelta) {
    salari = Math.max(0, Math.round((salari ?? 0) + effect.salariDelta))
  }
  // Sostre salarial: la carrera fa plateau (no s'infla indefinidament en 49 anys de vida
  // laboral). Cap el sou a un múltiple realista del de partida; no afecta el 0 (atur). El sostre
  // PUJA amb l'IPC: el sou no s'indexa automàticament, però qui negocia augments actius pot
  // mantenir el ritme de la inflació (jugar bé compensa l'estancament; la passivitat no).
  if (salari !== undefined && salari > 0) {
    salari = Math.min(
      salari,
      Math.round(
        sostreSalari(
          state.familia,
          state.teDiploma ?? false,
          state.nivellAcademic,
          state.tipusUniversitat === 'privada',
        ) *
          factorIPC(state) *
          factorSindical(state),
      ),
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
    // Efecte fantasma: la deriva de fons d'aquest torn (no és de l'esdeveniment).
    derivaBenestar: state.derivaPendent?.benestar || undefined,
    derivaSalut: state.derivaPendent?.salut || undefined,
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

  // Herència dels pares: un cop morts i heretat, no torna a passar (i s'esborra la pendent).
  const herenciaParesRebuda = effect.marcaHerenciaPares || state.herenciaParesRebuda
  const herenciaPendent = effect.marcaHerenciaPares ? undefined : state.herenciaPendent

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
    vinclesDelta *= 0.6
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

  // Parella estable: requisit per tenir fills. Se li assigna un nom DETERMINISTA (a partir
  // del RNG) perquè la partida sigui reproduïble. Només s'estableix si encara no en tens.
  const parella =
    effect.marcaParella && !state.parella
      ? { nom: nomPerSeed(state.rngState) }
      : state.parella

  // Descendència: si l'efecte porta un fill, l'incrementem i registrem l'edat (mesos) del
  // progenitor al naixement (per calcular els anys de criança) i un nom per a cada fill.
  let fills = state.fills
  let fillsNaixement = state.fillsNaixement
  let fillsNoms = state.fillsNoms
  if (effect.fillsDelta && effect.fillsDelta > 0) {
    fills = (state.fills ?? 0) + effect.fillsDelta
    const naixements = [...(state.fillsNaixement ?? [])]
    const noms = [...(state.fillsNoms ?? [])]
    for (let i = 0; i < effect.fillsDelta; i++) {
      naixements.push(person.edatMesos)
      noms.push(nomPerSeed(state.rngState + naixements.length))
    }
    fillsNaixement = naixements
    fillsNoms = noms
  }

  // Herència en vida: transfereix patrimoni líquid (efectiu → estalvi → fons indexat) al pot
  // de llegat als descendents (lliure de successions). Surt del teu patrimoni ara.
  let llegatEnVida = state.llegatEnVida
  if (effect.llegatEnVidaDelta && effect.llegatEnVidaDelta > 0) {
    const pat = { ...person.patrimoni }
    let restant = effect.llegatEnVidaDelta
    for (const font of ['efectiu', 'inversions'] as const) {
      const treu = Math.min(restant, pat[font])
      pat[font] = Math.round(pat[font] - treu)
      restant -= treu
    }
    const donat = effect.llegatEnVidaDelta - restant
    person = { ...person, patrimoni: pat }
    llegatEnVida = (state.llegatEnVida ?? 0) + donat
  }

  // Acció col·lectiva: afiliar-se o secundar una vaga apuja el poder sindical; cada any sense
  // reforçar-lo decau una mica (l'organització s'ha de mantenir viva). Clampat a 0..1.
  let poderSindical = Math.max(0, (state.poderSindical ?? 0) - SINDICAT_DECAIMENT_ANUAL)
  if (effect.poderSindicalDelta) {
    poderSindical = Math.max(0, Math.min(1, poderSindical + effect.poderSindicalDelta))
  }

  // Història de vida: una instantània per any (benestar, salut, patrimoni net) per dibuixar
  // l'evolució al resum final.
  const vidaHist = [
    ...(state.vidaHist ?? []),
    {
      edat: anys,
      benestar: Math.round(person.stats.benestar),
      salut: Math.round(person.stats.salut),
      moralitat: Math.round(person.stats.moralitat ?? MORALITAT_INICIAL),
      net: Math.round(patrimoniTotal(person)),
      ipc: Math.round(state.ipc ?? IPC_INICIAL),
    },
  ]

  // Si un acomiadament ha deixat el sou a 0 a la carrera, ambOfertes hi genera
  // automàticament les ofertes de cerca de feina.
  return ambOfertes({
    ...state,
    person,
    habitatge,
    salari,
    vidaHist,
    ultimAugmentMes,
    salutCronica,
    vinclesSocials,
    nivellAcademic,
    herenciaParesRebuda,
    herenciaPendent,
    parella,
    fills,
    fillsNaixement,
    fillsNoms,
    llegatEnVida,
    poderSindical,
    pendingEvent: undefined,
    pendingMilestone,
    derivaPendent: undefined,
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
    // Tria d'universitat (pública/privada): fixa la matrícula i el prestigi de tota la carrera.
    tipusUniversitat: option.tipusUniversitat ?? state.tipusUniversitat,
    pendingMilestone: undefined,
  }
  // Jubilació: deixes de treballar. La pensió (derivada de `salariBase`) és l'ingrés.
  if (option.lifeStage === 'jubilacio') {
    next.jubilat = true
    // BASE REGULADORA = el sou que tenies en JUBILAR-TE (amb tots els augments de la carrera),
    // no el sou inicial. Si arribes als 67 a l'atur, es manté l'última base coneguda.
    if ((state.salari ?? 0) > 0) next.salariBase = state.salari
    next.salari = 0
    next.ofertesFeina = undefined
  }
  if (option.itinerari === 'treball') {
    // El sou de partida porta la bretxa de gènere/origen (discriminació d'accés).
    const sou = Math.round(salariInicial(state.familia) * factorSalariPersonal(state.identitat))
    next.salari = next.salariBase = sou
  }
  if (option.lifeStage === 'laboral') {
    // Mateix model que la carrera: pla d'ingressos/despeses (oci + estalvi/inversió).
    next.plaInversio = defaultPlaInversio(ingressosMensuals16(next) * MESOS_PER_ANY)
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
          inversions: next.person.patrimoni.inversions + herencia,
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
      vinclesDelta *= 0.6
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
    plaInversio: state.plaInversio ?? { oci: 0, inversions: 0 },
    ofertesFeina: undefined,
    historial: [...state.historial, entry],
  }
}

// --- Emprenedoria: accions de l'empresa pròpia (vegeu DESIGN_EMPRENEDORIA.md) ---

/**
 * Funda una empresa invertint-hi `capitalInicial` dels teus estalvis (efectiu, després inversions).
 * El capital queda EN RISC: si l'empresa fracassa (cada any es juga), el perds. Repetible: poder
 * tornar-ho a provar després d'un fracàs —cosa que demana capital— és la clau de l'èxit emprenedor.
 */
export function fundarEmpresa(state: GameState, capitalInicial: number): GameState {
  if (state.empresa) return state
  const p = state.person.patrimoni
  const liquid = p.efectiu + p.inversions
  const capital = Math.round(Math.min(Math.max(capitalInicial, 0), liquid))
  if (capital < EMPRESA_CAPITAL_MIN) return state
  const patrimoni = { ...p }
  const deEfectiu = Math.min(capital, patrimoni.efectiu)
  patrimoni.efectiu = Math.round(patrimoni.efectiu - deEfectiu)
  patrimoni.inversions = Math.max(0, Math.round(patrimoni.inversions - (capital - deEfectiu)))
  return {
    ...state,
    person: { ...state.person, patrimoni },
    empresa: { capital, souEmpleats: 'mercat', anys: 0 },
    intentsEmpresa: (state.intentsEmpresa ?? 0) + 1,
    reinversioEmpresa: state.reinversioEmpresa ?? EMPRESA_REINVERSIO_DEFAULT,
  }
}

/** Tanca voluntàriament l'empresa i en recupera el capital actual (la ven) als estalvis líquids. */
export function tancarEmpresa(state: GameState): GameState {
  if (!state.empresa) return state
  const patrimoni = {
    ...state.person.patrimoni,
    efectiu: Math.round(state.person.patrimoni.efectiu + state.empresa.capital),
  }
  return { ...state, person: { ...state.person, patrimoni }, empresa: undefined }
}

/** Fixa la fracció (0..1) del benefici que es reinverteix (la resta és el teu sou). */
export function setReinversioEmpresa(state: GameState, fraccio: number): GameState {
  return { ...state, reinversioEmpresa: Math.max(0, Math.min(1, fraccio)) }
}

/** Fixa la política de sou dels empleats (afecta benefici, moralitat i supervivència). */
export function setSouEmpleats(state: GameState, nivell: NivellSouEmpleats): GameState {
  if (!state.empresa) return state
  return { ...state, empresa: { ...state.empresa, souEmpleats: nivell } }
}

/**
 * Deixa de treballar per compte aliè (atur VOLUNTARI): el sou passa a 0, sense prestació ni cerca
 * de feina automàtica. Es viu de l'empresa, les inversions i els estalvis. Només té sentit a la
 * carrera amb sou; reversible amb `tornarABuscarFeina`.
 */
export function deixarFeina(state: GameState): GameState {
  if (state.lifeStage !== 'carrera' || (state.salari ?? 0) <= 0) return state
  return { ...state, salari: 0, aturVoluntari: true, ofertesFeina: undefined }
}

/** Torna a buscar feina després d'haver deixat de treballar: reactiva la cerca (genera ofertes). */
export function tornarABuscarFeina(state: GameState): GameState {
  if (!state.aturVoluntari) return state
  return ambOfertes({ ...state, aturVoluntari: false })
}
