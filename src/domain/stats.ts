import {
  BENESTAR_MAX,
  BENESTAR_MIN,
  COST_VIDA_NIVELLS,
  NIVELL_VIDA_DEFAULT,
  DESGRAVACIO_PENSIONS,
  INDEX_RENDIMENT_MIN,
  INDEX_RENDIMENT_RANG,
  LIMIT_DESGRAVACIO_PENSIONS,
  MATRICULA_ANUAL,
  PAS_PLA,
  PREMI_DIPLOMA,
  RENDIMENT_ESTALVI,
  RENDIMENT_INVERSIONS,
  RENDIMENT_PENSIONS,
  SALARI_ADULT_BASE,
  SALARI_BASE_16,
  SALARI_MINIM_MENSUAL,
} from './constants'
import type {
  Budget,
  EventEffect,
  Familia,
  FamilyClass,
  GameState,
  Habitatge,
  Itinerari,
  NivellVida,
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
const PRECARIETAT_BENESTAR: Record<FamilyClass, number> = {
  pobra: 14,
  treballadora: 8,
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

/** Estalvi que la família aporta cada any al compte de la criatura. */
export function estalviAnualCriatura(familia: Familia): number {
  const perPatrimoni = familia.patrimoni * 0.002
  const perIngressos = Math.max(0, familia.ingressosMensuals - 1500) * 0.05
  return Math.round((perPatrimoni + perIngressos) / 10) * 10
}

/**
 * Paga mensual que rep l'adolescent segons la capacitat de la família. Marca el
 * punt de partida de la gestió activa dels diners.
 */
export function pagaMensual(familia: Familia): number {
  const perIngressos = familia.ingressosMensuals * 0.008
  const perPatrimoni = Math.min(familia.patrimoni, 2_000_000) * 0.00015
  return Math.round((perIngressos + perPatrimoni) / 5) * 5
}

/** Aplica un EventEffect a una persona retornant una còpia nova (immutable). */
export function applyEffect(person: Person, effect: EventEffect): Person {
  // Els comptes no baixen de zero (no modelem deute en aquesta fase).
  const patrimoni = { ...person.patrimoni }
  if (effect.efectiu)
    patrimoni.efectiu = Math.max(0, Math.round(patrimoni.efectiu + effect.efectiu))
  if (effect.estalvi)
    patrimoni.estalvi = Math.max(0, Math.round(patrimoni.estalvi + effect.estalvi))
  if (effect.inversions)
    patrimoni.inversions = Math.max(
      0,
      Math.round(patrimoni.inversions + effect.inversions),
    )
  if (effect.fonsIndexat)
    patrimoni.fonsIndexat = Math.max(
      0,
      Math.round(patrimoni.fonsIndexat + effect.fonsIndexat),
    )
  if (effect.fonsPensions)
    patrimoni.fonsPensions = Math.max(
      0,
      Math.round(patrimoni.fonsPensions + effect.fonsPensions),
    )
  // Xoc de mercat: variació percentual del fons indexat (crisi o eufòria).
  if (effect.mercatPct)
    patrimoni.fonsIndexat = Math.max(
      0,
      Math.round(patrimoni.fonsIndexat * (1 + effect.mercatPct)),
    )

  const stats = { ...person.stats }
  if (effect.benestar) stats.benestar = clampBenestar(stats.benestar + effect.benestar)

  return { ...person, stats, patrimoni }
}

/** Patrimoni net total de la persona. */
export function patrimoniTotal(person: Person): number {
  const { efectiu, estalvi, inversions, fonsIndexat, fonsPensions, cases } =
    person.patrimoni
  return (
    efectiu +
    estalvi +
    inversions +
    fonsIndexat +
    fonsPensions +
    cases.reduce((a, b) => a + b, 0)
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

/** Benestar de referència tenint en compte família, itinerari, fase i atur. */
export function baselineBenestar(state: GameState): number {
  // Vida d'estudiant universitari: encara depens de casa, però amb aire i propòsit.
  if (state.lifeStage === 'universitat') {
    return clampBenestar(
      familyBaselineBenestar(state.familia) + 4 + benestarHabitatge(state.habitatge),
    )
  }
  // Vida adulta: la referència ja no depèn de la família sinó del teu propi camí.
  if (state.lifeStage === 'carrera') {
    return clampBenestar(adultBaselineBenestar(state) + benestarHabitatge(state.habitatge))
  }

  let offset = itinerariBenestarOffset(state.itinerari)
  // A l'atur (treball amb sou 0): inseguretat i pressió.
  if (state.itinerari === 'treball' && state.salari === 0) offset -= 8
  return clampBenestar(familyBaselineBenestar(state.familia) + offset)
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

export function adultBaselineBenestar(state: GameState): number {
  // La seguretat econòmica depèn del que es cobra de veritat (net), no del brut.
  const incomeM = netMensual(state.salari ?? 0)
  const econ = clamp(incomeM / 3500, 0, 1)
  const wealth = clamp(patrimoniTotal(state.person) / 600_000, 0, 1)
  let base = 38 + econ * 30 + wealth * 16 + benestarNivellVida(state.nivellVida)
  if (incomeM === 0) base -= 12
  return clampBenestar(Math.round(base))
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

export interface DespesaGreuResult {
  person: Person
  donacio: number
  descobert: number
}

/**
 * Resol una despesa greu amb el matalàs familiar: el jugador paga el que pot
 * (efectiu → estalvi), la família cobreix el dèficit fins a `ajutFamiliarMax`, i
 * el descobert restant resta benestar (estrès). Mai genera deute.
 */
export function resolveDespesaGreu(
  person: Person,
  familia: Familia,
  cost: number,
): DespesaGreuResult {
  const patrimoni = { ...person.patrimoni }
  let restant = cost

  const pagaDe = (font: 'efectiu' | 'estalvi') => {
    const real = Math.min(restant, patrimoni[font])
    patrimoni[font] = Math.round(patrimoni[font] - real)
    restant -= real
  }
  pagaDe('efectiu')
  pagaDe('estalvi')

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

/** Augment de sou en demanar-ne un: entre el 2% (benestar 0) i el 10% (benestar 100). */
export function augmentSou(salari: number, benestar: number): number {
  const pct = 0.02 + (clampBenestar(benestar) / 100) * 0.08
  return Math.round((salari * pct) / 5) * 5
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

/** Pressupost mensual per defecte; respecta l'aportació mínima obligatòria a casa. */
export function defaultBudget(income: number, minCasa = 0): Budget {
  const round = (n: number) => Math.max(0, Math.round(n / 5) * 5)
  const casa = Math.max(round(income * 0.1), minCasa)
  const rest = Math.max(0, income - casa)
  return {
    casa,
    estalvi: round(rest * 0.4),
    oci: round(rest * 0.35),
    compres: round(rest * 0.25),
  }
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
 * Aplica un mes a la fase laboral: ingressa, paga l'aportació obligatòria a casa,
 * mou l'estalvi al patrimoni, gasta oci/compres i deixa el sobrant a efectiu (mai
 * negatiu). El benestar reacciona a la despesa discrecional (oci + compres): cal
 * gastar un mínim per no perdre'n i, per sobre, se'n guanya (rendiments decreixents).
 */
export function applyBudgetMonth(
  person: Person,
  budget: Budget,
  income: number,
  minCasa = 0,
): Person {
  const patrimoni = { ...person.patrimoni }
  // Caixa disponible aquest mes (ingrés + el que ja hi havia).
  let disponible = patrimoni.efectiu + income

  const gasta = (n: number) => {
    const real = Math.max(0, Math.min(n, disponible))
    disponible -= real
    return real
  }
  // L'aportació a la família és obligatòria: es paga primer i mai per sota del mínim.
  gasta(Math.max(budget.casa, minCasa))
  const aEstalvi = gasta(budget.estalvi)
  const oci = gasta(budget.oci)
  const compres = gasta(budget.compres)

  patrimoni.estalvi = Math.round(patrimoni.estalvi + aEstalvi)
  patrimoni.efectiu = Math.round(disponible)

  // El benestar depèn de la despesa en oci+compres respecte al mínim de manteniment.
  const deltaBenestar = benestarEstilDeVida(oci, compres, income)

  const stats = {
    ...person.stats,
    benestar: clampBenestar(person.stats.benestar + deltaBenestar),
  }
  return { ...person, stats, patrimoni }
}

// --- Universitat (18→22) ---

/** Suport familiar anual durant la universitat (com més recursos, més ajut). */
export function suportUniversitatAnual(familia: Familia): number {
  const perIngressos = familia.ingressosMensuals * 12 * 0.06
  const perPatrimoni = Math.min(familia.patrimoni, 1_000_000) * 0.002
  return Math.round((perIngressos + perPatrimoni) / 50) * 50
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
export function salariAdultInicial(familia: Familia, teDiploma: boolean): number {
  const premi = teDiploma ? PREMI_DIPLOMA : 0
  if (familia.classe === 'pobra' || familia.classe === 'treballadora') {
    return SALARI_MINIM_MENSUAL + premi
  }
  const plusContactes = clamp(familia.patrimoni * 0.0005, 0, 500)
  const sou =
    SALARI_ADULT_BASE + premi + plusContactes - PRECARIETAT_SALARI[familia.classe]
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

// Un nivell de vida més alt (millor menjar, més confort) dóna una mica de benestar;
// un de mínim, en treu. És el contrapès de gastar més o menys en el dia a dia.
const COST_VIDA_BENESTAR: Record<NivellVida, number> = {
  minim: -3,
  mig: 0,
  alt: 3,
}

/** Efecte del nivell de vida sobre el benestar de referència adult. */
export function benestarNivellVida(nivell: NivellVida = NIVELL_VIDA_DEFAULT): number {
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

/**
 * Cost de vida que paga la persona. Si viu amb els pares, la família en cobreix una
 * fracció segons la seva classe; si viu pel seu compte, el paga sencer.
 */
export function costVidaPropi(
  familia: Familia,
  habitatge?: Habitatge,
  nivell: NivellVida = NIVELL_VIDA_DEFAULT,
): number {
  const total = costVidaAnual(nivell)
  if (habitatge?.tipus === 'amb_pares') {
    return Math.round(total * (1 - COBERTURA_VIDA_FAMILIAR[familia.classe]))
  }
  return total
}

/** Part del cost de vida que cobreixen els pares (0 si no vius amb ells). */
export function cobreixVidaFamiliar(
  familia: Familia,
  habitatge?: Habitatge,
  nivell: NivellVida = NIVELL_VIDA_DEFAULT,
): number {
  return costVidaAnual(nivell) - costVidaPropi(familia, habitatge, nivell)
}

/** Rendiment anual del fons indexat a partir d'un valor aleatori [0,1): volàtil. */
export function rendimentIndexAnual(rngValue: number): number {
  return INDEX_RENDIMENT_MIN + rngValue * INDEX_RENDIMENT_RANG
}

/** Desgravació fiscal que torna a efectiu segons l'aportació al pla de pensions. */
export function desgravacioPensions(aportacio: number): number {
  return Math.round(
    Math.min(aportacio, LIMIT_DESGRAVACIO_PENSIONS) * DESGRAVACIO_PENSIONS,
  )
}

/**
 * Aplica un any de rendiments compostos al patrimoni invertit. El fons indexat
 * varia segons `indexReturn` (pot baixar!); pensions i inversions creixen estables;
 * l'estalvi a penes (la inflació se'l menja). Aquí és on es veu l'interès compost.
 */
export function creixementInversions(
  patrimoni: Patrimoni,
  indexReturn: number,
): Patrimoni {
  return {
    ...patrimoni,
    estalvi: Math.round(patrimoni.estalvi * (1 + RENDIMENT_ESTALVI)),
    inversions: Math.round(patrimoni.inversions * (1 + RENDIMENT_INVERSIONS)),
    fonsIndexat: Math.max(0, Math.round(patrimoni.fonsIndexat * (1 + indexReturn))),
    fonsPensions: Math.round(patrimoni.fonsPensions * (1 + RENDIMENT_PENSIONS)),
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

/** Pla d'inversió anual per defecte (prioritza fons indexat i una mica de pensions). */
export function defaultPlaInversio(annualIncome: number): PlaInversio {
  const round = (n: number) => Math.max(0, Math.round(n / PAS_PLA) * PAS_PLA)
  const rest = Math.max(0, annualIncome - costVidaAnual())
  return {
    oci: round(rest * 0.35),
    estalvi: round(rest * 0.15),
    fonsIndexat: round(rest * 0.35),
    fonsPensions: round(rest * 0.15),
  }
}

/**
 * Aplica un any de la fase de carrera. Per ordre: 1) els diners ja invertits
 * creixen (interès compost); 2) s'ingressa el sou; 3) es paga el cost de vida
 * obligatori; 4) es reparteix segons el pla (oci, estalvi, fons indexat, pensions);
 * 5) la desgravació del pla de pensions torna a efectiu; 6) el sobrant queda a
 * efectiu (mai negatiu). El benestar reacciona a l'oci respecte al mínim de manteniment.
 */
export function applyCareerYear(
  person: Person,
  pla: PlaInversio,
  annualIncome: number,
  indexReturn: number,
  costVida = costVidaAnual(),
  costHabitatge = 0,
): Person {
  const patrimoni = creixementInversions(person.patrimoni, indexReturn)
  let disponible = patrimoni.efectiu + annualIncome

  const gasta = (n: number) => {
    const real = Math.max(0, Math.min(n, disponible))
    disponible -= real
    return real
  }

  // Despeses obligatòries: cost de vida (o la teva part) i habitatge (lloguer o hipoteca).
  gasta(costVida)
  gasta(costHabitatge)
  const oci = gasta(pla.oci)
  const aEstalvi = gasta(pla.estalvi)
  const aIndex = gasta(pla.fonsIndexat)
  const aPensions = gasta(pla.fonsPensions)

  patrimoni.estalvi = Math.round(patrimoni.estalvi + aEstalvi)
  patrimoni.fonsIndexat = Math.round(patrimoni.fonsIndexat + aIndex)
  patrimoni.fonsPensions = Math.round(patrimoni.fonsPensions + aPensions)

  // La desgravació fiscal de l'aportació a pensions torna a efectiu.
  disponible += desgravacioPensions(aPensions)
  patrimoni.efectiu = Math.round(disponible)

  const stats = {
    ...person.stats,
    benestar: clampBenestar(person.stats.benestar + benestarOciAnual(oci, annualIncome)),
  }
  return { ...person, stats, patrimoni }
}
