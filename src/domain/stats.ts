import {
  ANY_REFERENCIA_ESPERANCA,
  BENESTAR_MAX,
  BENESTAR_MIN,
  COST_FILL_ANUAL,
  COST_VIDA_NIVELLS,
  DEPENDENCIA_FILLS_ANYS,
  DIVIDEND_NEGOCI_BASE,
  FACTOR_SERVEIS_PUBLICS,
  MORALITAT_INICIAL,
  MORALITAT_LLINDAR_BO,
  MORALITAT_LLINDAR_MALVAT,
  MORALITAT_MAX,
  MORALITAT_MIN,
  PRECARIETAT_EROSIO_SERVEIS,
  SANITAT_COBERTURA_MAX,
  SINDICAT_SOU_BONUS,
  SOU_EMPLEATS,
  NIVELL_VIDA_DEFAULT,
  FRUGALITAT_LLINDAR,
  HABITATGE_VAR_MAX,
  HABITATGE_VAR_MIN,
  IMV_ANUAL,
  IMV_COBERTURA,
  INDEX_HABITATGE_INICIAL,
  INDEX_RENDIMENT_MIN,
  INDEX_RENDIMENT_RANG,
  INTERES_DEUTE,
  IPC_INICIAL,
  IPC_INFLACIO_MAX,
  IPC_INFLACIO_MIN,
  PRESTACIO_ATUR_FRACCIO,
  MATRICULA_ANUAL,
  MESOS_PER_ANY,
  PAS_PLA,
  PREMI_DIPLOMA,
  SALARI_ADULT_BASE,
  SALARI_BASE_16,
  SALARI_MINIM_MENSUAL,
  SALUT_MAX,
  SALUT_MIN,
} from './constants'
import { rng } from './rng'
import type {
  Budget,
  EventEffect,
  Familia,
  FamilyClass,
  GameState,
  Genere,
  Habitatge,
  Identitat,
  Itinerari,
  NivellMoralitat,
  NivellVida,
  Origen,
  Patrimoni,
  Person,
  PlaInversio,
} from './types'

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function clampBenestar(value: number): number {
  return clamp(value, BENESTAR_MIN, BENESTAR_MAX)
}

export function clampSalut(value: number): number {
  return clamp(value, SALUT_MIN, SALUT_MAX)
}

export function clampMoralitat(value: number): number {
  return clamp(value, MORALITAT_MIN, MORALITAT_MAX)
}

/** Banda moral (Malvat/Neutral/Bo) a partir de la stat de moralitat. */
export function nivellMoralitat(moralitat: number): NivellMoralitat {
  if (moralitat <= MORALITAT_LLINDAR_MALVAT) return 'malvat'
  if (moralitat >= MORALITAT_LLINDAR_BO) return 'bo'
  return 'neutral'
}

/** Moralitat actual de l'estat (per defecte neutral si una partida vella no en té). */
export function moralitatActual(state: GameState): number {
  return state.person.stats.moralitat ?? MORALITAT_INICIAL
}

/**
 * Dividend ANUAL (real) del negoci propi segons la política de sou dels empleats: pagar menys
 * els treballadors et deixa MÉS dividend (plusvàlua extreta). En euros nominals si es multiplica
 * pel factor IPC a `applyCareerYear`.
 */
export function dividendNegociAnual(state: GameState): number {
  if (!state.negociActiu) return 0
  const nivell = state.souEmpleats ?? 'mercat'
  return Math.round(DIVIDEND_NEGOCI_BASE * SOU_EMPLEATS[nivell].dividend)
}

/**
 * Factor de l'envelliment segons l'època (esperança de vida actual i FUTURA). El progrés
 * mèdic allarga la vida: per a anys de calendari posteriors a la referència, el declivi per
 * edat és més lent (factor < 1 → es viu més); per a anys anteriors, més ràpid. Com que cada
 * generació de la dinastia neix dècades més tard, els descendents viuen una mica més.
 */
export function factorEsperancaVida(anyCalendari: number): number {
  const decades = (anyCalendari - ANY_REFERENCIA_ESPERANCA) / 10
  return clamp(1 - decades * 0.03, 0.7, 1.3)
}

/**
 * Declivi (o recuperació) ANUAL de la salut. La salut baixa amb:
 *  - l'EDAT (gairebé nul·la de jove, accelera molt a la vellesa): calibrada perquè una
 *    persona SANA i benestant mori de vellesa cap als ~84 anys (esperança de vida actual);
 *  - el BENESTAR baix (estrès, ansietat, precarietat) — i si el benestar és alt, la salut es
 *    RECUPERA una mica (delta negatiu) cap a 100 (per això els benestants viuen més);
 *  - les SEQÜELES cròniques (`salutCronica`): una discapacitat escurça la vida.
 * `factorEpoca` (≈1) modula l'envelliment segons el progrés mèdic de l'època.
 * Retorna els punts de salut que es PERDEN aquest any (negatiu = es recuperen).
 */
export function declividSalutAnual(
  edat: number,
  benestar: number,
  salutCronica = 0,
  factorEpoca = 1,
): number {
  // Edat: gairebé pla fins als 50, accelera, i es DISPARA a la vellesa (terme quadràtic a partir
  // dels ~72). Així ningú no viu gaire més enllà de ~90, encara que es cuidi molt: l'envelliment
  // acaba dominant qualsevol recuperació. Calibrat amb el harness (un sa mor de vellesa cap als ~84).
  const edatComp =
    (0.1 + Math.max(0, edat - 50) * 0.16 + Math.max(0, edat - 72) ** 2 * 0.04) *
    factorEpoca
  // La RECUPERACIÓ (benestar alt) s'esvaeix amb l'edat: als ~85 ja no pots "remuntar" la salut
  // com als 40 (el cos no respon igual). Per sota de 45 de benestar, en canvi, la precarietat
  // sempre erosiona (l'estrès fa mal a qualsevol edat).
  const recuperacioFactor = clamp(1 - Math.max(0, edat - 55) / 30, 0, 1)
  const benestarComp =
    benestar < 45
      ? Math.min((45 - benestar) * 0.06, 2.5)
      : -Math.min((benestar - 45) * 0.05, 1.8) * recuperacioFactor
  // Seqüela crònica: cada punt de seqüela accelera una mica el declivi.
  const cronicaComp = salutCronica * 0.08
  return edatComp + benestarComp + cronicaComp
}

/**
 * Factor d'eficàcia de la cura de la salut (gimnàs, revisions...) segons l'edat: plena de jove,
 * s'esvaeix cap als ~85 (cuidar-se ajuda, però no et fa immortal). Multiplica `SALUT_INVERSIO_DELTA`.
 */
export function eficaciaCuraSalut(edat: number): number {
  return clamp(1 - Math.max(0, edat - 55) / 30, 0, 1)
}

// --- Indicadors derivats del context familiar (0..1) ---

/**
 * Cura efectiva rebuda: hores de cura dels progenitors + part de la cura
 * delegada a un cuidador contractat (que compensa, però no del tot, l'absència
 * parental).
 */
export function careScore(familia: Familia): number {
  const cura = familia.horesCura + (familia.cuidadorContractat ? 15 : 0)
  return clamp(cura / 45, 0, 1)
}

/** Seguretat econòmica de la llar segons els ingressos mensuals. */
export function econSecurity(familia: Familia): number {
  return clamp(familia.ingressosMensuals / 4500, 0, 1)
}

/** Comoditat derivada del patrimoni acumulat. */
export function wealthComfort(familia: Familia): number {
  return clamp(familia.patrimoni / 800_000, 0, 1)
}

// Penalització de benestar per precarietat de classe: viure amb pocs recursos
// desgasta (inestabilitat, estrès, menys oportunitats) més enllà del que capturen
// els indicadors generals. Fa que les classes baixes ho tinguin clarament més difícil.
// Residu d'estrès/estigma de classe (P4). Abans era el pes principal del desavantatge
// (14/8); ara que el desavantatge adult emergeix de mecanismes (deute, cost diferencial,
// obligació familiar, exposició a la salut), aquí només en queda un RESIDU petit: l'estrès
// crònic de la inestabilitat que els indicadors econòmics no capturen del tot. Així el
// model deixa de "decretar" el destí per etiqueta i el fa emergir.
const PRECARIETAT_BENESTAR: Record<FamilyClass, number> = {
  pobra: 10,
  treballadora: 7,
  mitjana: 0,
  alta: 0,
  rica: 0,
  super_rica: 0,
}

/**
 * Benestar de referència cap al qual gravita la criatura segons el seu entorn.
 * Missatge de disseny: el temps i la cura pesen molt; els diners ajuden fins a
 * un punt (rendiments decreixents), però la precarietat de les classes baixes
 * pesa de valent.
 */
export function familyBaselineBenestar(familia: Familia): number {
  const baseline =
    28 +
    careScore(familia) * 24 +
    econSecurity(familia) * 30 +
    wealthComfort(familia) * 8 -
    PRECARIETAT_BENESTAR[familia.classe]
  return clampBenestar(Math.round(baseline))
}

/**
 * Estalvi que la família aporta cada any al compte de la criatura. Les famílies pobres
 * NO en poden aportar: no els sobra res per estalviar en nom dels fills (P: l'origen
 * humil no dóna coixí, ni de petit).
 */
export function estalviAnualCriatura(familia: Familia): number {
  if (familia.classe === 'pobra') return 0
  const perPatrimoni = familia.patrimoni * 0.002
  const perIngressos = Math.max(0, familia.ingressosMensuals - 1500) * 0.05
  return Math.round((perPatrimoni + perIngressos) / 10) * 10
}

/**
 * Paga mensual que rep l'adolescent segons la capacitat de la família. Marca el
 * punt de partida de la gestió activa dels diners. Les famílies pobres NO donen paga:
 * no poden permetre's donar diners als fills (al contrari, els necessiten ajudant a casa).
 */
export function pagaMensual(familia: Familia): number {
  if (familia.classe === 'pobra') return 0
  const perIngressos = familia.ingressosMensuals * 0.008
  const perPatrimoni = Math.min(familia.patrimoni, 2_000_000) * 0.00015
  return Math.round((perIngressos + perPatrimoni) / 5) * 5
}

// Diners que la criatura rep per l'acció «ajudar a casa». A les famílies pobra i
// treballadora l'ajuda NO es remunera: la família ho necessita (no és una feineta amb
// mesada, és sostenir la llar), de manera que ajudar resta temps i benestar però no dóna
// res. De la mitjana amunt, en canvi, «ajudar a casa» és una feineta amb una petita paga.
// Reforça la tesi del punt 1: els pares pobres no poden pagar l'ajuda dels fills.
const PAGA_AJUDA_CASA: Record<FamilyClass, number> = {
  pobra: 0,
  treballadora: 0,
  mitjana: 40,
  alta: 60,
  rica: 60,
  super_rica: 60,
}

/** Diners que rep el jove per l'acció «ajudar a casa» (0 per a pobra/treballadora). */
export function pagaPerAjudaCasa(familia: Familia): number {
  return PAGA_AJUDA_CASA[familia.classe]
}

/** Aplica un EventEffect a una persona retornant una còpia nova (immutable). */
export function applyEffect(person: Person, effect: EventEffect): Person {
  // Els comptes no baixen de zero (no modelem deute en aquesta fase).
  const patrimoni = { ...person.patrimoni }
  if (effect.efectiu)
    patrimoni.efectiu = Math.max(0, Math.round(patrimoni.efectiu + effect.efectiu))
  if (effect.inversions)
    patrimoni.inversions = Math.max(
      0,
      Math.round(patrimoni.inversions + effect.inversions),
    )
  // Xoc de mercat: variació percentual de la cartera d'inversió (crisi o eufòria).
  if (effect.mercatPct)
    patrimoni.inversions = Math.max(
      0,
      Math.round(patrimoni.inversions * (1 + effect.mercatPct)),
    )

  const stats = { ...person.stats }
  if (effect.benestar) stats.benestar = clampBenestar(stats.benestar + effect.benestar)
  if (effect.salutDelta) stats.salut = clampSalut(stats.salut + effect.salutDelta)
  if (effect.moralitatDelta)
    stats.moralitat = clampMoralitat(
      (stats.moralitat ?? MORALITAT_INICIAL) + effect.moralitatDelta,
    )

  return { ...person, stats, patrimoni }
}

// --- IPC (inflació) ---

/**
 * Inflació d'aquest any (fracció), DETERMINISTA a partir d'una llavor (l'estat del RNG), sense
 * consumir-lo: així no altera la seqüència d'esdeveniments (i el balanceig es manté). Es mou dins
 * de la banda [IPC_INFLACIO_MIN, IPC_INFLACIO_MAX] (mitjana ~2,75%).
 */
export function inflacioAnual(seed: number): number {
  // Offset primer per decorrelar de la selecció d'esdeveniments (que també usa el rngState).
  const r = rng(Math.trunc(seed) + 7919)
  return IPC_INFLACIO_MIN + r.value * (IPC_INFLACIO_MAX - IPC_INFLACIO_MIN)
}

/** Factor de preus actual (IPC/100): 1 al naixement, creix amb la inflació acumulada. */
export function factorIPC(state: GameState): number {
  return (state.ipc ?? IPC_INICIAL) / IPC_INICIAL
}

/**
 * Variació anual del preu de l'habitatge (fracció), determinista a partir d'una llavor sense
 * consumir el RNG. Banda pròpia (no la de l'IPC): pot caure, però la mitjana és més alta, així
 * que a llarg termini l'habitatge s'encareix per damunt dels preus de consum.
 */
export function variacioHabitatgeAnual(seed: number): number {
  const r = rng(Math.trunc(seed) + 104729)
  return HABITATGE_VAR_MIN + r.value * (HABITATGE_VAR_MAX - HABITATGE_VAR_MIN)
}

/** Factor del preu de l'habitatge actual (índex/100): 1 al naixement; índex propi, no l'IPC. */
export function factorHabitatge(state: GameState): number {
  return (state.indexHabitatge ?? INDEX_HABITATGE_INICIAL) / INDEX_HABITATGE_INICIAL
}

/** Força dels serveis públics del món (0..1) segons el règim del benestar (palanca política). */
export function factorServeisPublics(state: GameState): number {
  return FACTOR_SERVEIS_PUBLICS[state.regimPolitic ?? 'mixt']
}

/**
 * Cobertura pública de les despeses greus de SALUT (sanitat universal): fracció de la factura
 * mèdica que paga l'estat, escalada pel règim del benestar. Fa el cop de malaltia molt menys
 * ruïnós sota un estat fort i gairebé inexistent sota un de residual.
 */
export function coberturaSanitariaPublica(state: GameState): number {
  return factorServeisPublics(state) * SANITAT_COBERTURA_MAX
}

/** Poder sindical actual (0..1): organització col·lectiva acumulada. */
export function poderSindicalActual(state: GameState): number {
  return clamp(state.poderSindical ?? 0, 0, 1)
}

/**
 * Factor multiplicador del sou (terra i sostre) per l'acció col·lectiva: la negociació sindical
 * apuja els salaris per a tothom qui s'hi organitza. 1 sense sindicat; fins a 1+SINDICAT_SOU_BONUS
 * amb poder ple. És la via d'ascens COMPARTIDA (a diferència de l'estalvi o el negoci individuals).
 */
export function factorSindical(state: GameState): number {
  return 1 + poderSindicalActual(state) * SINDICAT_SOU_BONUS
}

// --- Frugalitat ---

/**
 * Nivell de frugalitat (0..100): la capacitat de viure bé amb poc. Es guanya amb la FORMACIÓ
 * (nivell acadèmic) i amb l'EDAT (saviesa/experiència vital). Saber viure amb austeritat sense
 * patir-ho no és innat: s'aprèn.
 */
export function frugalitat(state: GameState): number {
  const edat = state.person.edatMesos / MESOS_PER_ANY
  const perFormacio = (state.nivellAcademic ?? 0) * 55
  const perEdat = Math.max(0, edat - 18) * 0.9
  return Math.round(clamp(perFormacio + perEdat, 0, 100))
}

/** Pot viure de manera frugal sense penalització (frugalitat ≥ llindar). */
export function potViureFrugal(state: GameState): boolean {
  return frugalitat(state) >= FRUGALITAT_LLINDAR
}

/** Patrimoni net total de la persona (actius menys el deute de consum pendent). */
export function patrimoniTotal(person: Person): number {
  const { efectiu, inversions, cases, deute } = person.patrimoni
  return (
    efectiu +
    inversions +
    cases.reduce((a, b) => a + b, 0) -
    (deute ?? 0)
  )
}

// --- Fase 16→18 ---

/** Petit ajust del benestar de referència segons l'itinerari triat als 16. */
export function itinerariBenestarOffset(itinerari?: Itinerari): number {
  switch (itinerari) {
    case 'treball':
      return 2 // propòsit i diners propis, però cansat
    case 'nini':
      return -6 // llibertat inicial, però estancament i pressió
    case 'grau_mig':
      return 1
    default:
      return 0
  }
}

/**
 * Penalització de benestar per salut baixa (acoblament salut → benestar): estar malalt
 * deprimeix. Per sota de 50 de salut comença a pesar, fins a −12 quan la salut és molt baixa.
 * Amb la deriva del benestar, la caiguda és gradual (espiral controlada, no instantània).
 */
export function benestarPerSalut(salut: number): number {
  return clamp((50 - salut) / 4, 0, 12)
}

/** Benestar de referència tenint en compte família, itinerari, fase, atur i salut. */
export function baselineBenestar(state: GameState): number {
  const penalSalut = benestarPerSalut(state.person.stats.salut)
  // Vida d'estudiant universitari: encara depens de casa, però amb aire i propòsit.
  if (state.lifeStage === 'universitat') {
    return clampBenestar(
      familyBaselineBenestar(state.familia) +
        4 +
        benestarHabitatge(state.habitatge) -
        penalSalut,
    )
  }
  // Vida adulta: la referència ja no depèn de la família sinó del teu propi camí.
  if (state.lifeStage === 'carrera') {
    return clampBenestar(
      adultBaselineBenestar(state) + benestarHabitatge(state.habitatge) - penalSalut,
    )
  }

  let offset = itinerariBenestarOffset(state.itinerari)
  // A l'atur (treball amb sou 0): inseguretat i pressió.
  if (state.itinerari === 'treball' && state.salari === 0) offset -= 8
  return clampBenestar(familyBaselineBenestar(state.familia) + offset - penalSalut)
}

/**
 * Benestar de referència adult (fase de carrera): depèn del propi ingrés i del
 * patrimoni acumulat, no de la família. A l'atur, cau per la inseguretat.
 */
/** Efecte de la situació d'habitatge sobre el benestar de referència (independència). */
export function benestarHabitatge(habitatge?: Habitatge): number {
  switch (habitatge?.tipus) {
    case 'habitacio':
      return 1
    case 'pis_lloguer':
      return 4
    case 'propietat':
      return 6
    case 'amb_pares':
      return -3
    default:
      return 0
  }
}

// Residu de precarietat de classe a la VIDA ADULTA (carrera). A diferència de l'etapa jove
// (`PRECARIETAT_BENESTAR`), aquí abans no n'hi havia cap: el desavantatge adult emergia tot
// de mecanismes (deute, cost diferencial, obligació familiar). Però això deixava la
// treballadora massa còmoda (mediana ~50). Aquest residu rebaixa el SOSTRE adult sostenible
// de les classes baixes —l'objectiu de la deriva—, de manera que ni jugant perfecte no s'hi
// viu bé: l'estrès crònic de l'origen humil (inestabilitat, manca de xarxa, expectatives)
// que els indicadors d'ingrés/patrimoni no capturen. Per a la mitjana amunt és 0.
const PRECARIETAT_BENESTAR_ADULT: Record<FamilyClass, number> = {
  pobra: 16,
  treballadora: 11,
  mitjana: 0,
  alta: 0,
  rica: 0,
  super_rica: 0,
}

export function adultBaselineBenestar(state: GameState): number {
  // La seguretat econòmica depèn del poder adquisitiu REAL del sou: com que el sou NO s'indexa
  // a l'IPC, el mateix sou nominal compra menys amb els anys → es desinfla per l'IPC.
  const incomeM = netMensual(state.salari ?? 0) / factorIPC(state)
  const econ = clamp(incomeM / 3500, 0, 1)
  // El patrimoni net ja descompta el deute; pesa menys que abans (P7: 16→10), perquè
  // la riquesa acumulada no és el factor dominant del benestar a la vida adulta. Es DESINFLA
  // amb l'IPC (el benestar depèn del poder adquisitiu real, no del nombre nominal inflat).
  const wealth = clamp(patrimoniTotal(state.person) / factorIPC(state) / 600_000, 0, 1)
  // El nivell de vida ja NO desplaça el baseline (es notava massa poc per la deriva):
  // ara és un delta anual felt a `applyCareerYear`, com l'oci.
  let base = 38 + econ * 30 + wealth * 10
  if (incomeM === 0) base -= 12
  // Factor NO monetari (P7): vincles, temps, comunitat, sentit. És SUBSTITUTIU, no additiu,
  // per als rics: qui ja té molt patrimoni no acumula benestar per duplicat (el seu wealth
  // ja en cobreix part). Per al pobre, en canvi, és una font de benestar plena —i una via
  // de "vida plena" amb poc patrimoni— però costa de construir quan vas desbordat.
  base += (state.vinclesSocials ?? 0) * 18 * (1 - wealth * 0.5)
  // Viure endeutat rebaixa la referència de benestar (no només via el patrimoni net). El deute
  // és nominal: el desinflem per l'IPC perquè la seva relació amb l'ingrés (real) sigui correcta.
  base -= penalitzacioDeute(
    (state.person.patrimoni.deute ?? 0) / factorIPC(state),
    incomeM * MESOS_PER_ANY,
  )
  // Seqüeles cròniques (incapacitat): rebaixa duradora, no recuperable amb la deriva.
  base -= state.salutCronica ?? 0
  // Cost ecològic del consum: un nivell de vida alt i l'acumulació material pesen una mica.
  base -= petjadaEcologicaBenestar(state.nivellVida, state.person.patrimoni.cases.length)
  // Precarietat de classe EMERGENT (no etiqueta plana): comença com el residu de l'origen, però
  // s'esvaeix si te'n surts —sortir del deute i construir un coixí real—. Així jugar bé (estabilitzar
  // les finances) AIXECA el sostre del benestar; la crítica es manté (l'origen humil parteix amb el
  // residu sencer i li costa molt més arribar-hi), però deixa de ser una condemna fixa per etiqueta.
  base -= precarietatAdulta(state)
  return clampBenestar(Math.round(base))
}

/**
 * Penalització de precarietat adulta segons l'origen, MODULADA per l'estabilitat financera actual.
 * En deute o amb patrimoni negatiu: residu sencer (precarietat plena). Sense deute i amb un coixí
 * real creixent: el residu s'encongeix fins a ~30%. Recompensa explícitament jugar bé.
 */
export function precarietatAdulta(state: GameState): number {
  const residu = PRECARIETAT_BENESTAR_ADULT[state.familia.classe]
  if (residu === 0) return 0
  // PALANCA PÚBLICA: un estat social fort erosiona la precarietat estructural per a TOTHOM, sense
  // dependre de l'estalvi privat (els serveis universals mouen el terra). És la via no-individual.
  const erosioPublica = 1 - factorServeisPublics(state) * PRECARIETAT_EROSIO_SERVEIS
  // PALANCA PRIVADA: sortir del deute i acumular un coixí real també redueix el residu.
  let estabilitatPrivada = 1
  if ((state.person.patrimoni.deute ?? 0) <= 0) {
    const netReal = patrimoniTotal(state.person) / factorIPC(state)
    if (netReal > 0) estabilitatPrivada = clamp(1 - netReal / 80_000, 0.3, 1)
  }
  return Math.round(residu * estabilitatPrivada * erosioPublica)
}

/** Un component del benestar de referència, amb etiqueta i12n i valor (signat). */
export interface ComponentBenestar {
  clau: string
  valor: number
}

/**
 * Desglossament LLEGIBLE de la referència de benestar adult (`adultBaselineBenestar`): què t'apuja
 * i què t'esfondra el benestar. Perquè el jugador entengui PER QUÈ acaba com acaba (no és màgia).
 */
export function desglosBenestarAdult(state: GameState): ComponentBenestar[] {
  const f = factorIPC(state)
  const incomeM = netMensual(state.salari ?? 0) / f
  const econ = clamp(incomeM / 3500, 0, 1)
  const wealth = clamp(patrimoniTotal(state.person) / f / 600_000, 0, 1)
  const deute = penalitzacioDeute(
    (state.person.patrimoni.deute ?? 0) / f,
    incomeM * MESOS_PER_ANY,
  )
  const comps: ComponentBenestar[] = [
    { clau: 'desglos.base', valor: 38 },
    { clau: 'desglos.ingres', valor: Math.round(econ * 30) - (incomeM === 0 ? 12 : 0) },
    { clau: 'desglos.patrimoni', valor: Math.round(wealth * 10) },
    { clau: 'desglos.vincles', valor: Math.round((state.vinclesSocials ?? 0) * 18 * (1 - wealth * 0.5)) },
    { clau: 'desglos.deute', valor: -Math.round(deute) },
    { clau: 'desglos.sequela', valor: -(state.salutCronica ?? 0) },
    {
      clau: 'desglos.petjada',
      valor: -petjadaEcologicaBenestar(state.nivellVida, state.person.patrimoni.cases.length),
    },
    { clau: 'desglos.precarietat', valor: -precarietatAdulta(state) },
  ]
  // Només els que pesen (no soroll de zeros, tret de la base).
  return comps.filter((c) => c.valor !== 0 || c.clau === 'desglos.base')
}

// Primeres feines més precàries per a les classes baixes (menys contactes, feines
// pitjor pagades), a banda del plus per patrimoni.
const PRECARIETAT_SALARI: Record<FamilyClass, number> = {
  pobra: 120,
  treballadora: 60,
  mitjana: 0,
  alta: 0,
  rica: 0,
  super_rica: 0,
}

/** Sou inicial d'una primera feina: base + plus per contactes − precarietat de classe. */
export function salariInicial(familia: Familia): number {
  const plusContactes = clamp(familia.patrimoni * 0.0005, 0, 350)
  const sou = SALARI_BASE_16 + plusContactes - PRECARIETAT_SALARI[familia.classe]
  return Math.max(300, Math.round(sou / 25) * 25)
}

// --- Nòmina: del sou brut al net (model simplificat tipus Espanya) ---
// El sou (`salari`) es guarda sempre en BRUT. D'aquí se'n descompten la cotització
// del treballador a la Seguretat Social i l'IRPF; la resta és el net que es cobra.

/** Tipus de cotització del treballador a la Seguretat Social (≈ 6,35%). */
export const TIPUS_SS = 0.0635
/** Base màxima anual de cotització a la Seguretat Social. */
const BASE_MAX_SS_ANUAL = 58_000
/** Mínim personal anual exempt d'IRPF (no tributa). */
const MINIM_PERSONAL_IRPF = 5_550
// Trams marginals d'IRPF sobre la base liquidable anual.
const TRAMS_IRPF: { fins: number; tipus: number }[] = [
  { fins: 12_450, tipus: 0.19 },
  { fins: 20_200, tipus: 0.24 },
  { fins: 35_200, tipus: 0.3 },
  { fins: 60_000, tipus: 0.37 },
  { fins: 300_000, tipus: 0.45 },
  { fins: Infinity, tipus: 0.47 },
]

/** IRPF anual (progressiu per trams) sobre una base liquidable. */
export function irpfAnual(baseLiquidable: number): number {
  let base = Math.max(0, baseLiquidable)
  let impost = 0
  let anterior = 0
  for (const tram of TRAMS_IRPF) {
    if (base <= 0) break
    const tramImport = Math.min(base, tram.fins - anterior)
    impost += tramImport * tram.tipus
    base -= tramImport
    anterior = tram.fins
  }
  return Math.round(impost)
}

/** Desglossament d'una nòmina: brut, cotitzacions, impostos i net. */
export interface Nomina {
  brut: number
  seguretatSocial: number
  irpf: number
  net: number
}

/** Desglossa un sou brut anual en Seguretat Social, IRPF i net. */
export function desglosNominaAnual(brutAnual: number): Nomina {
  const brut = Math.max(0, Math.round(brutAnual))
  const seguretatSocial = Math.round(Math.min(brut, BASE_MAX_SS_ANUAL) * TIPUS_SS)
  const irpf = irpfAnual(brut - seguretatSocial - MINIM_PERSONAL_IRPF)
  return { brut, seguretatSocial, irpf, net: brut - seguretatSocial - irpf }
}

/** Desglossa un sou brut mensual (12 pagues) en Seguretat Social, IRPF i net. */
export function desglosNominaMensual(brutMensual: number): Nomina {
  const a = desglosNominaAnual(brutMensual * 12)
  return {
    brut: Math.round(a.brut / 12),
    seguretatSocial: Math.round(a.seguretatSocial / 12),
    irpf: Math.round(a.irpf / 12),
    net: Math.round(a.net / 12),
  }
}

/** Sou net mensual a partir del brut mensual. */
export function netMensual(brutMensual: number): number {
  return desglosNominaMensual(brutMensual).net
}

/** Ingrés net anual a partir del brut anual. */
export function netAnual(brutAnual: number): number {
  return desglosNominaAnual(brutAnual).net
}

/**
 * Ingrés mensual NET disponible a la fase laboral: sou net (treball) o suport
 * familiar (nini, sense impostos). El sou es guarda en brut: aquí en surt el net.
 */
export function ingressosMensuals16(state: GameState): number {
  return state.itinerari === 'treball'
    ? netMensual(state.salari ?? 0)
    : pagaMensual(state.familia)
}

/** Capacitat de la família per cobrir una emergència puntual (matalàs econòmic). */
export function ajutFamiliarMax(familia: Familia): number {
  return Math.round(familia.patrimoni * 0.1)
}

export interface RepartDeficit {
  /** Part del dèficit coberta amb estalvis propis (efectiu + estalvi). */
  propi: number
  /** Part coberta per la xarxa familiar (fins a `ajutFamiliarMax`). */
  donacio: number
  /** Part coberta per la xarxa pública (IMV/prestacions, degradada — P8). */
  ajutPublic: number
  /** Part que ningú ha pogut cobrir (resta benestar / es torna deute). */
  descobert: number
}

/**
 * Reparteix un dèficit anual: estalvis propis (`reservaPropia` = efectiu + estalvi) →
 * xarxa familiar (fins al matalàs) → xarxa pública (`ajutPublicMax`, p. ex. IMV degradat)
 * → la resta queda com a descobert. Sense `familia`, no hi ha ajut familiar; amb
 * `ajutPublicMax = 0` (per defecte), no hi ha xarxa pública.
 */
export function repartDeficit(
  deficit: number,
  reservaPropia: number,
  familia?: Familia,
  ajutPublicMax = 0,
  factorAjutFamiliar = 1,
): RepartDeficit {
  if (deficit <= 0) return { propi: 0, donacio: 0, ajutPublic: 0, descobert: 0 }
  const propi = Math.min(deficit, Math.max(0, reservaPropia))
  let falta = deficit - propi
  // El matalàs familiar es mesura en euros nominals: si hi ha inflació, escala amb l'IPC
  // (`factorAjutFamiliar`) perquè cobreixi la mateixa proporció real al llarg de la vida.
  const donacio = familia
    ? Math.min(falta, Math.round(ajutFamiliarMax(familia) * factorAjutFamiliar))
    : 0
  falta -= donacio
  const ajutPublic = Math.min(falta, Math.max(0, ajutPublicMax))
  falta -= ajutPublic
  return { propi, donacio, ajutPublic, descobert: falta }
}

/**
 * Ajut públic màxim (IMV degradat) disponible per cobrir un dèficit. És un terra de
 * DARRERA INSTÀNCIA: només arriba a qui té poc patrimoni *i* ingressos molt baixos (atur o
 * quasi), no al treballador pobre amb feina (la pobresa en actiu no en queda exclosa a la
 * realitat, i aquí tampoc no el rescata: segueix atrapat). I és PARCIAL (no-take-up:
 * burocràcia, estigma). No aixeca el sostre; només evita la destitució absoluta.
 */
export function ajutPublicMax(
  patrimoniNet: number,
  annualIncome: number,
  factorServeis = FACTOR_SERVEIS_PUBLICS.mixt,
): number {
  // Un estat social fort eixampla l'accés (llindars més alts, menys no-take-up) i la cobertura;
  // un de residual amb prou feines arriba. La política mou la xarxa, no només l'estalvi privat.
  const llindarPatrimoni = 20_000 * (0.5 + factorServeis)
  const llindarIngres = 12_000 * (0.5 + factorServeis)
  if (patrimoniNet >= llindarPatrimoni) return 0
  if (annualIncome >= llindarIngres) return 0
  // Cobertura base × (0,5..1,4) segons el règim: el socialdemòcrata cobreix molt més.
  return Math.round(IMV_ANUAL * IMV_COBERTURA * (0.5 + factorServeis))
}

/**
 * Prestació d'atur ANUAL durant la cerca de feina (carrera, sou 0). Lligada a haver
 * cotitzat: sense experiència no hi ha dret (queda l'IMV). És el retorn de les
 * cotitzacions que es paguen a cada nòmina.
 */
export function prestacioAturAnual(salariBase: number, anysExperiencia: number): number {
  if (anysExperiencia < 1) return 0
  return Math.round(netMensual(salariBase) * PRESTACIO_ATUR_FRACCIO) * MESOS_PER_ANY
}

// Transmissió de capital en entrar a la vida adulta (P6): herència en vida (ajut per a
// l'entrada d'un pis, finançar un projecte, un coixí) que NO es guanya, es rep. Fracció
// del patrimoni familiar; nul·la per a les classes baixes. És el mecanisme de reproducció
// de classe més directe: el ric arrenca la vida adulta amb un matalàs que el pobre no té.
const FACTOR_HERENCIA_VIDA: Record<FamilyClass, number> = {
  pobra: 0,
  treballadora: 0,
  mitjana: 0.005,
  alta: 0.015,
  rica: 0.03,
  super_rica: 0.04,
}

// Impost de successions progressiu (knob redistributiu sobre l'herència en vida, P6):
// les transmissions petites queden exemptes; com més gran l'herència, més se'n queda
// l'Estat. Limita —no elimina— la reproducció de capital de les classes altes.
const SUCCESSIONS_EXEMPT = 50_000
export function impostSuccessions(brut: number): number {
  const base = Math.max(0, brut - SUCCESSIONS_EXEMPT)
  if (base <= 0) return 0
  if (base <= 100_000) return Math.round(base * 0.1)
  if (base <= 500_000) return Math.round(10_000 + (base - 100_000) * 0.2)
  return Math.round(90_000 + (base - 500_000) * 0.34)
}

/** Capital NET que es rep en entrar a la carrera (herència en vida menys successions). */
export function herenciaVida(familia: Familia): number {
  const brut = familia.patrimoni * FACTOR_HERENCIA_VIDA[familia.classe]
  const net = brut - impostSuccessions(brut)
  return Math.round(net / 100) * 100
}

// --- Herència que es REP dels pares (l'altra cara de la transmissió de capital) ---

// Ajut econòmic puntual que els pares donen EN VIDA (un cop de mà per a un pis, un projecte,
// una mà al final de mes). Els pares pobres no en poden donar; els rics, molt. És una via
// directa per la qual l'origen acomodat allunya el seu fill de la precarietat.
const AJUT_PARES_PUNTUAL: Record<FamilyClass, number> = {
  pobra: 0,
  treballadora: 700,
  mitjana: 2_500,
  alta: 8_000,
  rica: 25_000,
  super_rica: 100_000,
}

/** Import d'un ajut puntual dels pares en vida (0 per a les llars que no en poden donar). */
export function ajutParesPuntual(familia: Familia): number {
  return AJUT_PARES_PUNTUAL[familia.classe]
}

// Fracció del patrimoni familiar que s'hereta quan moren els pares (l'estate principal). El
// ric hereta una fortuna; el pobre, gairebé res. Passa per l'impost de successions.
const FACTOR_HERENCIA_MORT: Record<FamilyClass, number> = {
  pobra: 0.05,
  treballadora: 0.08,
  mitjana: 0.12,
  alta: 0.15,
  rica: 0.18,
  super_rica: 0.2,
}

/** Capital NET que es rep quan moren els pares (herència menys impost de successions). */
export function herenciaParesMort(familia: Familia): number {
  const brut = familia.patrimoni * FACTOR_HERENCIA_MORT[familia.classe]
  const net = brut - impostSuccessions(brut)
  return Math.round(Math.max(0, net) / 100) * 100
}

// --- Eixos de desigualtat ortogonals a la classe: gènere i origen ---

// Bretxa salarial de gènere: a igualtat de tot, les dones cobren menys i pugen més lent;
// les persones no binàries també pateixen discriminació salarial. Ordre de magnitud
// proper a la bretxa real a Espanya.
const BRETXA_GENERE: Record<Genere, number> = {
  home: 1,
  dona: 0.86,
  no_binari: 0.9,
}

// Penalització de sou per origen migrant/racialitzat: menys contactes, currículums
// descartats per cognom, sostres informals.
const FACTOR_SALARI_ORIGEN: Record<Origen, number> = {
  autocton: 1,
  migrant: 0.9,
}

/** Factor multiplicatiu del sou segons gènere i origen (1 = sense penalització). */
export function factorSalariPersonal(identitat?: Identitat): number {
  const g = identitat?.genere ? BRETXA_GENERE[identitat.genere] : 1
  const o = identitat?.origen ? FACTOR_SALARI_ORIGEN[identitat.origen] : 1
  return g * o
}

/** Penalització d'ocupabilitat (0..1) per origen migrant/racialitzat (discriminació d'accés). */
export function penalitzacioOcupabilitatOrigen(identitat?: Identitat): number {
  return identitat?.origen === 'migrant' ? 0.12 : 0
}

// Cost ecològic del consum (lent post-materialista): un nivell de vida alt i l'acumulació
// material tenen una petjada que pesa —una mica— sobre el benestar. Petit però present:
// el creixement no és gratis ni infinit.
export function petjadaEcologicaBenestar(
  nivell: NivellVida = NIVELL_VIDA_DEFAULT,
  cases = 0,
): number {
  const p = (nivell === 'alt' ? 2 : 0) + cases
  return Math.min(p, 5)
}

/**
 * Escala un import base segons un multiplicador per classe. Per a esdeveniments el sentit
 * dels quals depèn del context: una mateixa xifra no significa el mateix per a una família
 * pobra que per a una de rica (una herència de 8.000 € és transformadora per a l'una i
 * simbòlica per a l'altra; una "ajuda a la família" no té sentit en una llar super-rica).
 */
export function escalaPerClasse(
  base: number,
  classe: FamilyClass,
  mapa: Record<FamilyClass, number>,
): number {
  return Math.round(base * mapa[classe])
}

/**
 * Penalització de benestar per un descobert anual del pressupost (no arribar a final
 * de mes ni amb estalvis ni amb ajut familiar). Escalada i acotada.
 */
export function penalitzacioDescobert(descobert: number): number {
  return descobert > 0 ? Math.min(15, Math.ceil(descobert / 250)) : 0
}

/**
 * Estrès de benestar per carregar deute (P1): escala amb el deute relatiu a l'ingrés
 * anual (no és el mateix deure 5.000 € guanyant-ne 60.000 que guanyant-ne 15.000) i està
 * acotat. És el cost continu de viure endeutat, no un xoc puntual.
 */
export function penalitzacioDeute(deute: number, annualIncome: number): number {
  if (deute <= 0) return 0
  const ref = Math.max(annualIncome, 6000)
  return clamp(Math.round((deute / ref) * 24), 0, 30)
}

export interface DespesaGreuResult {
  person: Person
  donacio: number
  descobert: number
}

/**
 * Resol una despesa greu amb el matalàs familiar: el jugador paga el que pot
 * (efectiu → ven inversions), la família cobreix el dèficit fins a `ajutFamiliarMax`, i
 * el descobert restant resta benestar (estrès). Mai genera deute.
 */
export function resolveDespesaGreu(
  person: Person,
  familia: Familia,
  cost: number,
  coberturaPublica = 0,
): DespesaGreuResult {
  const patrimoni = { ...person.patrimoni }
  // La sanitat pública (segons el règim) paga part de la factura abans del matalàs familiar:
  // el que cobreix l'estat ningú no l'ha d'avançar (ni esgota estalvis ni genera descobert).
  let restant = Math.round(cost * (1 - clamp(coberturaPublica, 0, 0.95)))

  const pagaDe = (font: 'efectiu' | 'inversions') => {
    const real = Math.min(restant, patrimoni[font])
    patrimoni[font] = Math.round(patrimoni[font] - real)
    restant -= real
  }
  pagaDe('efectiu')
  pagaDe('inversions')

  const donacio = Math.min(restant, ajutFamiliarMax(familia))
  restant -= donacio
  const descobert = restant

  // El descobert genera estrès: penalització de benestar escalada.
  const penalitzacio = descobert > 0 ? Math.min(30, Math.ceil(descobert / 80)) : 0
  const stats = {
    ...person.stats,
    benestar: clampBenestar(person.stats.benestar - penalitzacio),
  }

  return {
    person: { ...person, stats, patrimoni },
    donacio,
    descobert,
  }
}

/**
 * Augment de sou en demanar-ne un: entre el 2% (benestar 0) i el 10% (benestar 100). Es
 * **redueix amb l'edat**: les grans pujades s'acaben cap als 60 (la carrera fa plateau;
 * passats els 50 els ascensos i les negociacions rendeixen molt menys).
 */
export function augmentSou(salari: number, benestar: number, edat = 35): number {
  const pct = 0.02 + (clampBenestar(benestar) / 100) * 0.08
  const factorEdat = clamp(1 - (edat - 50) / 20, 0.5, 1)
  return Math.round((salari * pct * factorEdat) / 5) * 5
}

/**
 * Sostre realista del sou BRUT mensual al llarg de la carrera: el sou pot créixer amb
 * ascensos i negociacions, però no indefinidament. Es deriva del sou de partida adult
 * (que ja porta classe, títol i nivell acadèmic): una carrera pot arribar a multiplicar-lo
 * ~2,5×, no convertir un sou mínim en un sou directiu. Evita la inflació salarial irreal en
 * estendre la vida laboral fins als 67. Manté la desigualtat d'origen (el sostre del pobre
 * és més baix). Mai per sota del salari mínim.
 */
export function sostreSalari(
  familia: Familia,
  teDiploma = false,
  nivellAcademic = 0,
): number {
  const base = salariAdultInicial(familia, teDiploma, nivellAcademic)
  return Math.max(SALARI_MINIM_MENSUAL, Math.round((base * 2.5) / 25) * 25)
}

// Mentre es viu a casa, l'aportació a la família és obligatòria i més alta com més
// pobra és la família (la més pobra: 50% del sou, fins a un màxim de 700 €/mes).
const FACTOR_APORTACIO: Record<FamilyClass, number> = {
  pobra: 0.5,
  treballadora: 0.35,
  mitjana: 0.2,
  alta: 0.1,
  rica: 0.05,
  super_rica: 0,
}
const APORTACIO_MAX = 700

/** Aportació mínima obligatòria a la família segons l'origen i l'ingrés. */
export function aportacioMinima(familia: Familia, income: number): number {
  if (income <= 0) return 0
  const min = Math.min(FACTOR_APORTACIO[familia.classe] * income, APORTACIO_MAX)
  return Math.round(min / 5) * 5
}

// A la vida adulta (carrera), els fills de famílies amb pocs recursos continuen
// sostenint la llar d'origen: una part del sou net se'n va a casa. És la solidaritat
// familiar asimètrica que ja modela la fase laboral, però que no s'atura als 18 quan la
// família segueix necessitant la teva renda. Per a les classes acomodades és 0 (no han de
// mantenir ningú; els pares, fins i tot, els donen un coixí). Drena el marge d'estalvi del
// pobre adult i és una de les vies per les quals no pot acumular.
const APORTACIO_CARRERA: Record<FamilyClass, number> = {
  pobra: 0.4,
  treballadora: 0.3,
  mitjana: 0.05,
  alta: 0,
  rica: 0,
  super_rica: 0,
}

/** Aportació ANUAL a la família d'origen durant la carrera, a partir del net mensual. */
export function aportacioFamiliarCarrera(familia: Familia, netMensual: number): number {
  if (netMensual <= 0) return 0
  const mensual = Math.min(APORTACIO_CARRERA[familia.classe] * netMensual, APORTACIO_MAX)
  return Math.round(mensual) * MESOS_PER_ANY
}

/**
 * Cost ANUAL de viure amb els pares (fase adulta): un sol import que engloba la teva
 * manutenció (la part del cost de vida que NO et cobreix la família) i l'ajuda que dónes
 * a casa. Quan vius amb els pares NO pagues el cost de vida a part (ells et mantenen): el
 * que «pagues» és aquesta contribució a la llar. Escala amb la classe —la família pobra
 * absorbeix una part gran del teu sou perquè et necessita; de la mitjana amunt és, de
 * mitjana, propera al cost de vida baix; la rica no et demana res—. Quan te'n vas a viure
 * sol, en canvi, deixes de fer aquesta aportació però pagues el cost de vida i l'habitatge
 * sencers.
 */
export function contribucioLlar(
  familia: Familia,
  netMensual: number,
  factorAportacio = 1,
): number {
  const manutencio = costVidaPropi(familia, { tipus: 'amb_pares' }, 'mig')
  // La manutenció (el teu propi cost de viure a casa) la pagues sempre; l'aportació EXTRA per
  // sostenir la família d'origen es modula (`factorAportacio`): pesa molt de jove i solter, i
  // s'esvaeix amb l'edat i quan tens la teva pròpia família (que passa a ser prioritat).
  const total =
    manutencio + aportacioFamiliarCarrera(familia, netMensual) * factorAportacio
  // MAI per sobre del 100% del sou net: vius a casa dels pares, no pots aportar més del que
  // ingresses (el que falti per cobrir el cost real ja ho absorbeix la família).
  const netAnual = Math.max(0, netMensual) * MESOS_PER_ANY
  return Math.round(Math.min(total, netAnual))
}

/**
 * Factor (0..1) de l'aportació EXTRA a la família d'origen. Màxim de jove i solter; s'esvaeix
 * amb l'edat (cap als 45) i baixa quan tens parella o fills (la teva família té prioritat).
 */
export function factorAportacioLlar(state: GameState): number {
  const edat = state.person.edatMesos / MESOS_PER_ANY
  const perEdat = clamp(1 - Math.max(0, edat - 30) / 15, 0.15, 1)
  const teFamiliaPropia = Boolean(state.parella) || (state.fills ?? 0) > 0
  return perEdat * (teFamiliaPropia ? 0.4 : 1)
}

/**
 * Pressupost mensual per defecte: només es pre-omple l'**obligatori** (l'aportació mínima a
 * casa); la resta (oci, compres) comença a **0** perquè el jugador el construeixi des de zero
 * i mai parteixi d'un pressupost que supera l'ingrés. El que sobra es queda com a efectiu.
 */
export function defaultBudget(_income: number, minCasa = 0): Budget {
  return { casa: minCasa, oci: 0, compres: 0 }
}

// Setmanes de l'any (de 52) que un jove ja té compromeses ajudant a casa o al negoci
// familiar, segons la classe: les famílies humils necessiten que els fills hi ajudin molt,
// cosa que els deixa MENYS temps lliure per a activitats. És una de les maneres com l'origen
// limita les oportunitats de la joventut.
const AJUDA_CASA_SETMANES: Record<FamilyClass, number> = {
  pobra: 18,
  treballadora: 12,
  mitjana: 4,
  alta: 0,
  rica: 0,
  super_rica: 0,
}

/** Setmanes anuals que el jove dedica obligatòriament a ajudar a casa (per classe). */
export function ajudaCasaSetmanes(familia: Familia): number {
  return AJUDA_CASA_SETMANES[familia.classe]
}

/** Cost de benestar (modest) de l'ajuda obligatòria a casa: menys temps i energia propis. */
export function ajudaCasaBenestar(familia: Familia): number {
  return -Math.round(ajudaCasaSetmanes(familia) / 9)
}

/** Despesa mínima en oci+compres per no perdre benestar (≈ 12% de l'ingrés, acotat). */
export function minimOciCompres(income: number): number {
  return clamp(Math.round(income * 0.12), 40, 160)
}

/**
 * Benestar mensual segons la despesa discrecional (oci + compres): per sota del
 * mínim de manteniment es perd benestar (fins a −3), just al mínim s'està a 0, i
 * per sobre se'n guanya amb rendiments decreixents (fins a +5).
 */
export function benestarEstilDeVida(
  oci: number,
  compres: number,
  income: number,
): number {
  const d = oci + compres
  const min = minimOciCompres(income)
  if (d >= min) return clamp(Math.round(Math.sqrt(d - min) / 3.5), 0, 5)
  return -clamp(Math.round(((min - d) / min) * 3), 0, 3)
}

/**
 * Aplica un ANY sencer de la fase laboral a partir d'un pressupost MENSUAL (× 12).
 * Pots gastar per sobre de l'ingrés: les **necessitats** (aportació obligatòria a casa
 * + oci + compres) es paguen de l'ingrés i, si no arriben, es tira dels estalvis
 * propis (efectiu + inversions) i, després, de la xarxa familiar; el que ningú cobreix és
 * **descobert** i resta benestar (`penalitzacioDescobert`). El que sobra es queda com a
 * efectiu. Mai genera deute. El benestar per oci+compres s'aplica un cop l'any.
 */
export function applyBudgetYear(
  person: Person,
  budget: Budget,
  income: number,
  minCasa = 0,
  familia?: Familia,
  factorServeis = FACTOR_SERVEIS_PUBLICS.mixt,
): Person {
  const patrimoni = { ...person.patrimoni }
  // Necessitats anuals (consum obligatori + discrecional) i caixa de l'any.
  const necessitats =
    (Math.max(budget.casa, minCasa) + budget.oci + budget.compres) * MESOS_PER_ANY
  const caixa = patrimoni.efectiu + income * MESOS_PER_ANY
  let inversions = patrimoni.inversions
  let descobert = 0

  if (caixa >= necessitats) {
    // Sobra: es queda com a efectiu (a la fase laboral no s'inverteix encara).
    patrimoni.efectiu = Math.round(caixa - necessitats)
  } else {
    // Dèficit: estalvis propis (venent inversions) → xarxa familiar → pública → descobert.
    const r = repartDeficit(
      necessitats - caixa,
      inversions,
      familia,
      ajutPublicMax(patrimoniTotal(person), income * MESOS_PER_ANY, factorServeis),
    )
    inversions -= r.propi
    descobert = r.descobert
    patrimoni.efectiu = 0
  }
  patrimoni.inversions = Math.round(inversions)

  const deltaBenestar =
    benestarEstilDeVida(budget.oci, budget.compres, income) -
    penalitzacioDescobert(descobert)

  const stats = {
    ...person.stats,
    benestar: clampBenestar(person.stats.benestar + deltaBenestar),
  }
  return { ...person, stats, patrimoni }
}

// --- Universitat (18→22) ---

// Fins a quin punt la família pot mantenir un fill que estudia a la universitat en
// comptes de fer-lo treballar. La família pobra NO pot: necessita que el fill aporti, no
// pot permetre's mantenir-lo quatre anys sense ingressar (P: l'origen condiciona qui pot
// «permetre's» estudiar). La treballadora amb prou feines hi arriba; de la mitjana amunt,
// el suport és ple.
const SUPORT_UNI_FACTOR: Record<FamilyClass, number> = {
  pobra: 0,
  treballadora: 0.35,
  mitjana: 1,
  alta: 1,
  rica: 1,
  super_rica: 1,
}

/** Suport familiar anual durant la universitat (com més recursos, més ajut). */
export function suportUniversitatAnual(familia: Familia): number {
  const factor = SUPORT_UNI_FACTOR[familia.classe]
  if (factor === 0) return 0
  const perIngressos = familia.ingressosMensuals * 12 * 0.06
  const perPatrimoni = Math.min(familia.patrimoni, 1_000_000) * 0.002
  return Math.round((perIngressos + perPatrimoni) * factor / 50) * 50
}

// Beca per renda: cobreix més matrícula com més baixa és la renda familiar (les
// rendes baixes no es queden fora de la universitat, però l'origen segueix pesant).
const FACTOR_BECA: Record<FamilyClass, number> = {
  pobra: 1,
  treballadora: 0.7,
  mitjana: 0.3,
  alta: 0,
  rica: 0,
  super_rica: 0,
}

/** Beca universitària anual segons la renda (cobreix part o tota la matrícula). */
export function becaUniversitat(familia: Familia): number {
  return Math.round(MATRICULA_ANUAL * FACTOR_BECA[familia.classe])
}

/** Balanç econòmic d'un any d'universitat: suport familiar + beca − matrícula. */
export function balancUniversitatAnual(familia: Familia): number {
  return suportUniversitatAnual(familia) + becaUniversitat(familia) - MATRICULA_ANUAL
}

// --- Carrera adulta (inversions, 18/22 → 35) ---

/**
 * Sou brut mensual d'una primera feina adulta: base (+ títol) + contactes − precarietat.
 * Les classes pobra i treballadora comencen la vida adulta amb el salari mínim (el títol
 * universitari, si en tenen, s'hi suma per damunt). El salari mínim és el terra per a tothom.
 */
export function salariAdultInicial(
  familia: Familia,
  teDiploma: boolean,
  nivellAcademic = 0,
): number {
  const premi = teDiploma ? PREMI_DIPLOMA : 0
  // Bonus per haver estudiat a fons: el capital humà es paga amb un sou de partida MOLT millor
  // (recompensa fiable de l'esforç, no subjecta a la sort). És la palanca principal del pobre.
  const bonusAcademic = Math.round(nivellAcademic * 1100)
  if (familia.classe === 'pobra' || familia.classe === 'treballadora') {
    return SALARI_MINIM_MENSUAL + premi + bonusAcademic
  }
  const plusContactes = clamp(familia.patrimoni * 0.0005, 0, 500)
  const sou =
    SALARI_ADULT_BASE +
    premi +
    bonusAcademic +
    plusContactes -
    PRECARIETAT_SALARI[familia.classe]
  return Math.max(SALARI_MINIM_MENSUAL, Math.round(sou / 25) * 25)
}

/** Ingrés NET anual disponible a la fase de carrera (sou brut × 12, menys impostos). */
export function ingressosAnualsCarrera(state: GameState): number {
  return netAnual((state.salari ?? 0) * 12)
}

/** Cost de vida anual a la fase adulta segons el nivell de vida triat. */
export function costVidaAnual(nivell: NivellVida = NIVELL_VIDA_DEFAULT): number {
  return COST_VIDA_NIVELLS[nivell]
}

// Un nivell de vida més alt (millor menjar, més confort) dóna benestar cada any; un de
// mínim, en treu. És un DELTA ANUAL felt (com l'oci), no una empenta lenta del baseline:
// així triar el nivell de vida es nota de debò al benestar (viure bé ara vs invertir).
const COST_VIDA_BENESTAR: Record<NivellVida, number> = {
  minim: -4,
  mig: 0,
  alt: 4,
}

/**
 * Efecte ANUAL del nivell de vida sobre el benestar (s'aplica cada any a `applyCareerYear`,
 * al costat de l'oci). Si s'ha triat una «vida senzilla» (frugalitat per elecció), viure amb
 * el mínim deixa de penalitzar: no és privació, és una tria legítima.
 */
export function benestarNivellVida(
  nivell: NivellVida = NIVELL_VIDA_DEFAULT,
  vidaSenzilla = false,
): number {
  if (vidaSenzilla && nivell === 'minim') return 0
  return COST_VIDA_BENESTAR[nivell]
}

// Mentre vius amb els pares, el cost de vida és la teva aportació a la llar, però la
// família te'n cobreix una part segons la seva classe: la pobra no pot cobrir res
// (pagues tot el teu cost de vida), les riques i superriques t'ho cobreixen tot.
const COBERTURA_VIDA_FAMILIAR: Record<FamilyClass, number> = {
  pobra: 0,
  treballadora: 0.25,
  mitjana: 0.5,
  alta: 0.8,
  rica: 1,
  super_rica: 1,
}

// «La pobresa surt cara» (P2): per la mateixa cistella de consum, les classes baixes
// paguen MÉS (habitatge precari sense poder negociar, productes pitjors que s'espatllen,
// energia del mercat lliure, crèdit de consum, transport mal connectat). És un multiplicador
// sobre el cost base COMPARTIT, no un cost independent per classe: el mercat extreu renda
// a qui no pot negociar. Mitjana i amunt no paguen sobrecost.
const COST_VIDA_FACTOR_CLASSE: Record<FamilyClass, number> = {
  pobra: 1.35,
  treballadora: 1.2,
  mitjana: 1,
  alta: 1,
  rica: 1,
  super_rica: 1,
}

/**
 * Cost de vida que paga la persona. Si viu amb els pares, la família en cobreix una
 * fracció segons la seva classe; si viu pel seu compte, el paga sencer. A sobre,
 * les classes baixes paguen un sobrecost («la pobresa surt cara», P2).
 */
export function costVidaPropi(
  familia: Familia,
  habitatge?: Habitatge,
  nivell: NivellVida = NIVELL_VIDA_DEFAULT,
): number {
  const factor = COST_VIDA_FACTOR_CLASSE[familia.classe]
  const base =
    habitatge?.tipus === 'amb_pares'
      ? costVidaAnual(nivell) * (1 - COBERTURA_VIDA_FAMILIAR[familia.classe])
      : costVidaAnual(nivell)
  return Math.round(base * factor)
}

/** Part del cost de vida que cobreixen els pares (0 si no vius amb ells o si en pagues de més). */
export function cobreixVidaFamiliar(
  familia: Familia,
  habitatge?: Habitatge,
  nivell: NivellVida = NIVELL_VIDA_DEFAULT,
): number {
  return Math.max(0, costVidaAnual(nivell) - costVidaPropi(familia, habitatge, nivell))
}

/** Rendiment anual del fons indexat a partir d'un valor aleatori [0,1): volàtil. */
export function rendimentIndexAnual(rngValue: number): number {
  return INDEX_RENDIMENT_MIN + rngValue * INDEX_RENDIMENT_RANG
}


/**
 * Aplica un any de rendiment compost a la cartera d'inversió. El rendiment és VOLÀTIL
 * (`indexReturn`, pot baixar!). És l'únic vehicle de creixement: aquí es veu l'interès compost
 * a llarg termini, però cal aguantar els sotracs sense vendre.
 */
export function creixementInversions(
  patrimoni: Patrimoni,
  indexReturn: number,
): Patrimoni {
  return {
    ...patrimoni,
    inversions: Math.max(0, Math.round(patrimoni.inversions * (1 + indexReturn))),
  }
}

/** Mínim anual d'oci per no perdre benestar (≈ 12% de l'ingrés, acotat). */
export function minimOciAnual(annualIncome: number): number {
  return clamp(Math.round(annualIncome * 0.12), 1500, 9000)
}

/**
 * Benestar anual segons la despesa discrecional (oci): per sota del mínim de
 * manteniment se'n perd (fins a −4), al mínim s'està a 0 i per sobre se'n guanya
 * amb rendiments decreixents (fins a +6).
 */
export function benestarOciAnual(oci: number, annualIncome: number): number {
  const min = minimOciAnual(annualIncome)
  if (oci >= min) return clamp(Math.round(Math.sqrt(oci - min) / 18), 0, 6)
  return -clamp(Math.round(((min - oci) / min) * 4), 0, 4)
}

/** Pla anual per defecte: reparteix el marge entre oci i inversió. */
export function defaultPlaInversio(annualIncome: number): PlaInversio {
  const round = (n: number) => Math.max(0, Math.round(n / PAS_PLA) * PAS_PLA)
  const rest = Math.max(0, annualIncome - costVidaAnual())
  return {
    oci: round(rest * 0.35),
    inversions: round(rest * 0.5),
  }
}

/**
 * Aplica un any de la fase de carrera. Els diners invertits creixen (interès compost);
 * després les **necessitats** (cost de vida + habitatge + oci) es paguen de l'ingrés i, si
 * cal, venent inversions, amb el **matalàs familiar** i, si cal, **descobert** (resta benestar)
 * quan ni l'ingrés ni la cartera ni la família hi arriben. L'**aportació a inversió** només es
 * fa si sobra (mai a crèdit ni amb diners de la família). Mai genera deute.
 */
export function applyCareerYear(
  person: Person,
  pla: PlaInversio,
  annualIncome: number,
  indexReturn: number,
  costVida = costVidaAnual(),
  costHabitatge = 0,
  familia?: Familia,
  aportacioFamilia = 0,
  benestarNivell = 0,
  costFills = 0,
  factorIPCActual = 1,
  factorServeis = FACTOR_SERVEIS_PUBLICS.mixt,
): Person {
  const f = factorIPCActual
  const patrimoni = creixementInversions(person.patrimoni, indexReturn)
  // Sostre del deute: cap entitat presta sense fre. Es pot deure fins a ~2,5 anys
  // d'ingrés (o un mínim si no hi ha sou); l'excés no es pot finançar i és un descobert
  // dur (vas sense, no t'endeutes més). El deute compon al seu interès, capat al sostre.
  // El terra (en euros nominals) escala amb l'IPC.
  const maxDeute = Math.max(annualIncome * 2.5, 15000 * f)
  let deute = Math.min(
    Math.round((patrimoni.deute ?? 0) * (1 + INTERES_DEUTE)),
    maxDeute,
  )
  // Necessitats de l'any: consum + habitatge + oci + aportació a la família d'origen +
  // criança dels fills dependents.
  const necessitats = costVida + costHabitatge + pla.oci + aportacioFamilia + costFills
  const caixa = patrimoni.efectiu + annualIncome
  let inversions = patrimoni.inversions
  let nouDescobert = 0

  if (caixa >= necessitats) {
    let rem = caixa - necessitats
    // El deute es paga ABANS d'invertir: bloqueja la inversió fins extingir-se.
    const pagaDeute = Math.min(rem, deute)
    deute -= pagaDeute
    rem -= pagaDeute
    if (deute > 0) {
      // Encara endeutat: tot el marge ha anat a deute, no es pot invertir res.
      patrimoni.efectiu = Math.round(rem)
    } else {
      // Sense deute: aporta a inversió (capat al sobrant) i deixa la resta a efectiu.
      const aInversio = Math.min(pla.inversions, rem)
      rem -= aInversio
      inversions += aInversio
      patrimoni.efectiu = Math.round(rem)
    }
  } else {
    // Dèficit: ven inversions → xarxa familiar → xarxa pública (IMV degradat) → el que
    // ningú cobreix es converteix en DEUTE (s'acumula i compon). El que no es pot ni
    // finançar (per sobre del sostre) és descobert dur: un xoc puntual de benestar.
    // Les xarxes (pública i familiar) es mesuren en euros nominals: amb inflació, els seus
    // llindars es desinflen (means-test en termes reals) i la cobertura es reinfla, perquè
    // protegeixin la mateixa proporció real (no s'erosionin numèricament amb l'IPC).
    const r = repartDeficit(
      necessitats - caixa,
      inversions,
      familia,
      ajutPublicMax(patrimoniTotal(person) / f, annualIncome / f, factorServeis) * f,
      f,
    )
    inversions -= r.propi
    deute += r.descobert
    if (deute > maxDeute) {
      nouDescobert = deute - maxDeute
      deute = maxDeute
    }
    patrimoni.efectiu = 0
  }
  patrimoni.inversions = Math.max(0, Math.round(inversions))
  patrimoni.deute = deute > 0 ? Math.round(deute) : undefined

  // El benestar es calcula en termes REALS (poder adquisitiu): oci, ingrés i descobert es
  // desinflen per l'IPC, perquè un import nominal més gran per la inflació no canviï el benestar
  // que aporta o resta. Així, amb el sou estancat i els preus pujant, el benestar real cau.
  const deltaBenestar =
    benestarOciAnual(pla.oci / f, annualIncome / f) +
    benestarNivell -
    penalitzacioDescobert(Math.round(nouDescobert / f))
  const stats = {
    ...person.stats,
    benestar: clampBenestar(person.stats.benestar + deltaBenestar),
  }
  return { ...person, stats, patrimoni }
}

// --- Descendència (tenir fills, a la vida adulta) ---
// Els fills són una font de benestar i vincles (P7, no monetària) però amb un cost econòmic
// recurrent durant la criança. Aquí l'origen torna a pesar: per a una llar humil un fill és
// una càrrega que pot empènyer cap al deute i l'espiral; per a una de rica, és assumible.
// I al final, el patrimoni es transmet als fills (herència) → reproducció de classe.

/** Nombre de fills encara dependents (en edat de criança) en aquest moment. */
export function fillsDependents(state: GameState): number {
  const naixements = state.fillsNaixement ?? []
  const llindar = DEPENDENCIA_FILLS_ANYS * MESOS_PER_ANY
  return naixements.filter((b) => state.person.edatMesos - b < llindar).length
}

/** Prestació pública màxima anual per fill dependent (per a renda baixa). */
const AJUT_FILL_MAX = 2_500
/** Renda neta anual a partir de la qual la prestació per fill ja és nul·la. */
const AJUT_FILL_LLINDAR = 55_000

/**
 * Prestació pública ANUAL per fills dependents (tipus ajut per criança): **means-tested**,
 * plena per a rendes baixes i s'esvaeix cap a rendes mitjanes-altes. És el suport de l'estat
 * del benestar a les famílies, que alleuja —sense rescatar del tot— la càrrega del pobre i el
 * treballador (que altrament no es podrien permetre fills). Per als acomodats, ~0.
 */
export function ajutFillsAnual(state: GameState): number {
  const deps = fillsDependents(state)
  if (deps === 0) return 0
  const net = netAnual((state.salari ?? 0) * MESOS_PER_ANY)
  const perFill = clamp(AJUT_FILL_MAX * (1 - net / AJUT_FILL_LLINDAR), 0, AJUT_FILL_MAX)
  return Math.round(deps * perFill)
}

/**
 * Cost NET ANUAL de criança dels fills dependents (cost brut − prestació pública). Escala
 * amb el nivell de vida, però NO amb el sobrecost de classe: l'escola i la sanitat públiques
 * aplanen força el cost dels fills entre classes (a diferència del consum general). Així
 * tenir un fill és una tensió real per a la classe treballadora —drena el marge i pot
 * empènyer cap al deute i l'espiral— però no una condemna automàtica.
 */
export function costFillsAnual(state: GameState): number {
  const deps = fillsDependents(state)
  if (deps === 0) return 0
  const factorNivell =
    state.nivellVida === 'alt' ? 1.2 : state.nivellVida === 'minim' ? 0.85 : 1
  const brut = deps * COST_FILL_ANUAL * factorNivell
  const net = Math.max(0, brut - ajutFillsAnual(state))
  // Criar un fill també s'encareix amb l'IPC al llarg de la vida.
  return Math.round(net * factorIPC(state))
}

/**
 * Llegat per fill: el que CADA fill hereta. Suma dues vies:
 *  - **en morir**: el patrimoni net (≥0) es reparteix entre els fills i cada part tributa per
 *    successions (progressiu, per hereu — vegeu `impostSuccessions`);
 *  - **en vida**: el que ja s'ha transferit (`llegatEnVida`), lliure d'impost, repartit.
 * Tanca el cercle de la reproducció de classe (com l'`herenciaVida` rebuda als 18): el que
 * has acumulat el transmets, i els teus fills arrenquen des d'aquí.
 */
export function llegatPerFill(state: GameState): number {
  const fills = state.fills ?? 0
  if (fills === 0) return 0
  const estate = Math.max(0, patrimoniTotal(state.person))
  const perFillBrut = estate / fills
  const perFillMortNet = perFillBrut - impostSuccessions(perFillBrut)
  const enVidaPerFill = (state.llegatEnVida ?? 0) / fills
  return Math.round(Math.max(0, perFillMortNet + enVidaPerFill) / 100) * 100
}

// --- Jubilació (als 67): el balanç financer final, el clímax del joc ---
// Aquí "es cobra" tot l'estalvi i la inversió de la vida: la pensió pública (segons el que
// has cotitzat) i la renda del teu patrimoni (pla de pensions ja desbloquejat + inversions).
// Qui ha pogut compondre patrimoni i cotitzar de forma estable es jubila tranquil; qui ha
// quedat atrapat en la precarietat (o no hi ha arribat: espiral) es jubila al mínim o pitjor.

/** Pensió pública mínima i màxima mensuals (model tipus Espanya, simplificat). */
const PENSIO_MIN_MENSUAL = 700
const PENSIO_MAX_MENSUAL = 3000
/** Anys cotitzats per tenir-hi dret i per cobrar el 100% de la base reguladora. */
const ANYS_COTITZATS_MIN = 15
const ANYS_COTITZATS_PLENA = 36
/** Taxa de retirada anual "segura" del patrimoni acumulat (regla del ~4%). */
const TAXA_RETIRADA_SEGURA = 0.04

/**
 * Pensió pública NETA anual de jubilació. És contributiva: depèn dels **anys cotitzats**
 * (`anysExperiencia`) i d'una base reguladora (el sou de referència de la carrera). Sense
 * un mínim d'anys cotitzats no hi ha dret a pensió contributiva (queda la xarxa mínima, que
 * el joc modela com a 0 aquí: la precarietat laboral es paga també a la vellesa). Amb dret,
 * va d'un mínim (≈700 €/mes) a un màxim (≈3.000 €/mes) segons la base i els anys.
 */
export function pensioPublicaAnual(state: GameState): number {
  const anys = state.anysExperiencia ?? 0
  if (anys < ANYS_COTITZATS_MIN) return 0
  const baseMensual = Math.max(state.salari ?? 0, state.salariBase ?? 0)
  const taxa = clamp(
    0.5 +
      ((anys - ANYS_COTITZATS_MIN) / (ANYS_COTITZATS_PLENA - ANYS_COTITZATS_MIN)) * 0.5,
    0.5,
    1,
  )
  const brutMensual = clamp(baseMensual * taxa, PENSIO_MIN_MENSUAL, PENSIO_MAX_MENSUAL)
  return netAnual(brutMensual * MESOS_PER_ANY)
}

/**
 * Renda anual que genera el patrimoni a la jubilació: la cartera d'inversió, aplicant-hi una
 * retirada segura (~4%/any). És la recompensa de l'interès compost: qui ha pogut invertir hi té
 * una renda complementària.
 */
export function rendaPatrimoniAnual(person: Person): number {
  return Math.round(person.patrimoni.inversions * TAXA_RETIRADA_SEGURA)
}

/** Renda total anual de jubilació = pensió pública + renda del patrimoni. */
export function rendaJubilacioAnual(state: GameState): number {
  return pensioPublicaAnual(state) + rendaPatrimoniAnual(state.person)
}

/**
 * Veredicte monetari de la jubilació: compara la renda de jubilació amb les necessitats
 * anuals (cost de vida + habitatge). Daurada (renda folgada), tranquil·la (cobreix) o
 * precària (no arriba: la vellesa torna a ser una lluita).
 */
export function veredicteJubilacio(
  rendaAnual: number,
  necessitatsAnual: number,
): 'daurada' | 'tranquila' | 'precaria' {
  const ratio = necessitatsAnual > 0 ? rendaAnual / necessitatsAnual : 2
  if (ratio >= 1.5) return 'daurada'
  if (ratio >= 1) return 'tranquila'
  return 'precaria'
}
