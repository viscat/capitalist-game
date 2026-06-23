import {
  BENESTAR_MAX,
  BENESTAR_MIN,
  COST_VIDA_NIVELLS,
  NIVELL_VIDA_DEFAULT,
  DESGRAVACIO_PENSIONS,
  IMV_ANUAL,
  IMV_COBERTURA,
  INDEX_RENDIMENT_MIN,
  INDEX_RENDIMENT_RANG,
  INTERES_DEUTE,
  PRESTACIO_ATUR_FRACCIO,
  LIMIT_DESGRAVACIO_PENSIONS,
  MATRICULA_ANUAL,
  MESOS_PER_ANY,
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
  Genere,
  Habitatge,
  Identitat,
  Itinerari,
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
  pobra: 6,
  treballadora: 3,
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

/** Patrimoni net total de la persona (actius menys el deute de consum pendent). */
export function patrimoniTotal(person: Person): number {
  const { efectiu, estalvi, inversions, fonsIndexat, fonsPensions, cases, deute } =
    person.patrimoni
  return (
    efectiu +
    estalvi +
    inversions +
    fonsIndexat +
    fonsPensions +
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
  // El patrimoni net ja descompta el deute; pesa menys que abans (P7: 16→10), perquè
  // la riquesa acumulada no és el factor dominant del benestar a la vida adulta.
  const wealth = clamp(patrimoniTotal(state.person) / 600_000, 0, 1)
  // El nivell de vida ja NO desplaça el baseline (es notava massa poc per la deriva):
  // ara és un delta anual felt a `applyCareerYear`, com l'oci.
  let base = 38 + econ * 30 + wealth * 10
  if (incomeM === 0) base -= 12
  // Factor NO monetari (P7): vincles, temps, comunitat, sentit. És SUBSTITUTIU, no additiu,
  // per als rics: qui ja té molt patrimoni no acumula benestar per duplicat (el seu wealth
  // ja en cobreix part). Per al pobre, en canvi, és una font de benestar plena —i una via
  // de "vida plena" amb poc patrimoni— però costa de construir quan vas desbordat.
  base += (state.vinclesSocials ?? 0) * 18 * (1 - wealth * 0.5)
  // Viure endeutat rebaixa la referència de benestar (no només via el patrimoni net).
  base -= penalitzacioDeute(state.person.patrimoni.deute ?? 0, incomeM * MESOS_PER_ANY)
  // Seqüeles cròniques (incapacitat): rebaixa duradora, no recuperable amb la deriva.
  base -= state.salutCronica ?? 0
  // Cost ecològic del consum: un nivell de vida alt i l'acumulació material pesen una mica.
  base -= petjadaEcologicaBenestar(state.nivellVida, state.person.patrimoni.cases.length)
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
): RepartDeficit {
  if (deficit <= 0) return { propi: 0, donacio: 0, ajutPublic: 0, descobert: 0 }
  const propi = Math.min(deficit, Math.max(0, reservaPropia))
  let falta = deficit - propi
  const donacio = familia ? Math.min(falta, ajutFamiliarMax(familia)) : 0
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
export function ajutPublicMax(patrimoniNet: number, annualIncome: number): number {
  if (patrimoniNet >= 20_000) return 0
  if (annualIncome >= 12_000) return 0
  return Math.round(IMV_ANUAL * IMV_COBERTURA)
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

// A la vida adulta (carrera), els fills de famílies amb pocs recursos continuen
// sostenint la llar d'origen: una part del sou net se'n va a casa. És la solidaritat
// familiar asimètrica que ja modela la fase laboral, però que no s'atura als 18 quan la
// família segueix necessitant la teva renda. Per a les classes acomodades és 0 (no han de
// mantenir ningú; els pares, fins i tot, els donen un coixí). Drena el marge d'estalvi del
// pobre adult i és una de les vies per les quals no pot acumular.
const APORTACIO_CARRERA: Record<FamilyClass, number> = {
  pobra: 0.35,
  treballadora: 0.2,
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
 * Pressupost mensual per defecte: només es pre-omple l'**obligatori** (l'aportació mínima a
 * casa); tota la resta (estalvi, oci, compres) comença a **0** perquè el jugador el
 * construeixi des de zero i mai parteixi d'un pressupost que supera l'ingrés.
 */
export function defaultBudget(_income: number, minCasa = 0): Budget {
  return { casa: minCasa, estalvi: 0, oci: 0, compres: 0 }
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
 * propis i, després, de la xarxa familiar; el que ningú cobreix és **descobert** i
 * resta benestar (`penalitzacioDescobert`). L'aportació a estalvi només es fa si sobra
 * (mai s'estalvia a crèdit). Mai genera deute. El benestar per oci+compres s'aplica un
 * cop l'any.
 */
export function applyBudgetYear(
  person: Person,
  budget: Budget,
  income: number,
  minCasa = 0,
  familia?: Familia,
): Person {
  const patrimoni = { ...person.patrimoni }
  // Necessitats anuals (consum obligatori + discrecional) i caixa de l'any.
  const necessitats =
    (Math.max(budget.casa, minCasa) + budget.oci + budget.compres) * MESOS_PER_ANY
  const caixa = patrimoni.efectiu + income * MESOS_PER_ANY
  let estalvi = patrimoni.estalvi
  let descobert = 0

  if (caixa >= necessitats) {
    // Sobra: aporta a estalvi el que es pugui i deixa la resta a efectiu.
    let rem = caixa - necessitats
    const aEstalvi = Math.min(budget.estalvi * MESOS_PER_ANY, rem)
    estalvi += aEstalvi
    rem -= aEstalvi
    patrimoni.efectiu = Math.round(rem)
  } else {
    // Dèficit: estalvis propis → xarxa familiar → xarxa pública (IMV) → descobert.
    const r = repartDeficit(
      necessitats - caixa,
      estalvi,
      familia,
      ajutPublicMax(patrimoniTotal(person), income * MESOS_PER_ANY),
    )
    estalvi -= r.propi
    descobert = r.descobert
    patrimoni.efectiu = 0
  }
  patrimoni.estalvi = Math.round(estalvi)

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
export function salariAdultInicial(
  familia: Familia,
  teDiploma: boolean,
  nivellAcademic = 0,
): number {
  const premi = teDiploma ? PREMI_DIPLOMA : 0
  // Bonus per haver estudiat a fons: l'esforç acadèmic es paga amb un sou de partida millor.
  const bonusAcademic = Math.round(nivellAcademic * 600)
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
  pobra: 1.25,
  treballadora: 1.12,
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
 * Aplica un any de la fase de carrera. Els diners invertits creixen (interès compost);
 * després les **necessitats** (cost de vida + habitatge + oci) es paguen de l'ingrés i
 * els estalvis, amb el **matalàs familiar** i, si cal, **descobert** (resta benestar)
 * quan ni l'ingrés ni els estalvis ni la família hi arriben. Les **aportacions**
 * (fons indexat, pla de pensions, estalvi) només es fan si sobra (mai a crèdit ni amb
 * diners de la família). La desgravació de pensions torna a efectiu. Mai genera deute.
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
): Person {
  const patrimoni = creixementInversions(person.patrimoni, indexReturn)
  // Sostre del deute: cap entitat presta sense fre. Es pot deure fins a ~2,5 anys
  // d'ingrés (o un mínim si no hi ha sou); l'excés no es pot finançar i és un descobert
  // dur (vas sense, no t'endeutes més). El deute compon al seu interès, capat al sostre.
  const maxDeute = Math.max(annualIncome * 2.5, 15000)
  let deute = Math.min(
    Math.round((patrimoni.deute ?? 0) * (1 + INTERES_DEUTE)),
    maxDeute,
  )
  // Necessitats de l'any: consum + habitatge + oci + aportació a la família d'origen.
  const necessitats = costVida + costHabitatge + pla.oci + aportacioFamilia
  const caixa = patrimoni.efectiu + annualIncome
  let estalvi = patrimoni.estalvi
  let nouDescobert = 0

  if (caixa >= necessitats) {
    let rem = caixa - necessitats
    // El deute es paga ABANS d'invertir: bloqueja l'estalvi i la inversió fins extingir-se.
    const pagaDeute = Math.min(rem, deute)
    deute -= pagaDeute
    rem -= pagaDeute
    if (deute > 0) {
      // Encara endeutat: tot el marge ha anat a deute, no es pot invertir res.
      patrimoni.efectiu = Math.round(rem)
    } else {
      // Sense deute: reparteix entre aportacions (capades al sobrant) i efectiu.
      const aIndex = Math.min(pla.fonsIndexat, rem)
      rem -= aIndex
      const aPensions = Math.min(pla.fonsPensions, rem)
      rem -= aPensions
      const aEstalvi = Math.min(pla.estalvi, rem)
      rem -= aEstalvi
      estalvi += aEstalvi
      patrimoni.fonsIndexat = Math.round(patrimoni.fonsIndexat + aIndex)
      patrimoni.fonsPensions = Math.round(patrimoni.fonsPensions + aPensions)
      // La desgravació fiscal de l'aportació a pensions torna a efectiu.
      patrimoni.efectiu = Math.round(rem + desgravacioPensions(aPensions))
    }
  } else {
    // Dèficit: estalvis propis → xarxa familiar → xarxa pública (IMV degradat) → el que
    // ningú cobreix es converteix en DEUTE (s'acumula i compon). El que no es pot ni
    // finançar (per sobre del sostre) és descobert dur: un xoc puntual de benestar.
    const r = repartDeficit(
      necessitats - caixa,
      estalvi,
      familia,
      ajutPublicMax(patrimoniTotal(person), annualIncome),
    )
    estalvi -= r.propi
    deute += r.descobert
    if (deute > maxDeute) {
      nouDescobert = deute - maxDeute
      deute = maxDeute
    }
    patrimoni.efectiu = 0
  }
  patrimoni.estalvi = Math.round(estalvi)
  patrimoni.deute = deute > 0 ? Math.round(deute) : undefined

  // El benestar d'aquest any reflecteix l'estil de vida (oci + nivell de vida) i el XOC
  // d'un dèficit nou no finançable. L'estrès CRÒNIC de viure endeutat NO es resta aquí
  // (seria doble comptabilitat): ja rebaixa la referència a `adultBaselineBenestar`.
  const deltaBenestar =
    benestarOciAnual(pla.oci, annualIncome) +
    benestarNivell -
    penalitzacioDescobert(nouDescobert)
  const stats = {
    ...person.stats,
    benestar: clampBenestar(person.stats.benestar + deltaBenestar),
  }
  return { ...person, stats, patrimoni }
}
