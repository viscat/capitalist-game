import {
  ENTRADA_HIPOTECA,
  INTERES_HIPOTECA,
  LLOGUER_HABITACIO_ANUAL,
  LLOGUER_PIS_ANUAL,
  RATI_ENDEUTAMENT_MAX,
} from './constants'
import { netAnual } from './stats'
import type {
  Familia,
  FamilyClass,
  GameState,
  Habitatge,
  Hipoteca,
  TipusHabitatge,
} from './types'

/** Opció de lloguer (habitació o pis sencer). */
export interface OpcioLloguer {
  tipus: 'habitacio' | 'pis_lloguer'
  lloguerAnual: number
}

export const OPCIONS_LLOGUER: OpcioLloguer[] = [
  { tipus: 'habitacio', lloguerAnual: LLOGUER_HABITACIO_ANUAL },
  { tipus: 'pis_lloguer', lloguerAnual: LLOGUER_PIS_ANUAL },
]

/** Habitatge en venda. */
export interface Propietat {
  id: string
  preu: number
}

// Catàleg de propietats a comprar, de menys a més cares.
export const PROPIETATS: Propietat[] = [
  { id: 'estudi', preu: 95_000 },
  { id: 'pis_petit', preu: 160_000 },
  { id: 'pis', preu: 240_000 },
  { id: 'casa', preu: 360_000 },
]

export function getPropietat(id: string): Propietat | undefined {
  return PROPIETATS.find((p) => p.id === id)
}

/** Entrada (pagament inicial) necessària per a un preu. */
export function entradaHipoteca(preu: number): number {
  return Math.round(preu * ENTRADA_HIPOTECA)
}

/** Calcula la hipoteca (deute i quota anual) per a un preu i termini. */
export function calculaHipoteca(preu: number, anys: number): Hipoteca {
  const deute = preu - entradaHipoteca(preu)
  const r = INTERES_HIPOTECA
  const quotaAnual =
    r > 0
      ? Math.round((deute * r) / (1 - Math.pow(1 + r, -anys)))
      : Math.round(deute / anys)
  return { deute, quotaAnual, anysRestants: anys }
}

/** Ingrés NET anual de la persona (el que el banc mira per concedir la hipoteca). */
function ingressosAnuals(state: GameState): number {
  return netAnual((state.salari ?? 0) * 12)
}

/** El banc concedeix la hipoteca si la quota no supera el màxim ràtio d'endeutament. */
export function bancConcedeix(quotaAnual: number, annualIncome: number): boolean {
  return annualIncome > 0 && quotaAnual <= RATI_ENDEUTAMENT_MAX * annualIncome
}

/**
 * Diners disponibles per comprar (entrada o pagament al comptat): efectiu + estalvi + fons
 * indexat (es poden liquidar les inversions per comprar). El pla de pensions queda bloquejat.
 */
export function liquidDisponible(state: GameState): number {
  const p = state.person.patrimoni
  return p.efectiu + p.estalvi + p.fonsIndexat
}

// L'origen pesa també a l'hora de comprar: la família pot regalar part de
// l'entrada segons la seva classe (una fracció del seu patrimoni). La pobra no
// pot aportar res; la treballadora molt poc; com més amunt, més marge.
const FACTOR_AJUT_ENTRADA: Record<FamilyClass, number> = {
  pobra: 0,
  treballadora: 0.03,
  mitjana: 0.1,
  alta: 0.2,
  rica: 0.3,
  super_rica: 0.4,
}

/** Quant pot regalar la família per a l'entrada, segons la seva classe social. */
export function ajutEntradaMax(familia: Familia): number {
  return Math.round(familia.patrimoni * FACTOR_AJUT_ENTRADA[familia.classe])
}

// Els pares també poden ajudar amb la QUOTA de la hipoteca (no només l'entrada): cobreixen
// una fracció de la quota anual segons la seva classe. Una altra via per la qual l'origen
// acomodat alleuja el cost de l'habitatge.
const FACTOR_AJUT_HIPOTECA: Record<FamilyClass, number> = {
  pobra: 0,
  treballadora: 0.05,
  mitjana: 0.15,
  alta: 0.3,
  rica: 0.5,
  super_rica: 0.6,
}

/** Ajut anual de la família a la quota de la hipoteca (0 si no hi ha hipoteca viva). */
export function ajutHipotecaFamiliar(familia: Familia, habitatge?: Habitatge): number {
  if (habitatge?.tipus !== 'propietat' || !habitatge.hipoteca) return 0
  return Math.round(habitatge.hipoteca.quotaAnual * FACTOR_AJUT_HIPOTECA[familia.classe])
}

/** Cost anual NET de l'habitatge: la quota/lloguer menys l'ajut de la família a la hipoteca. */
export function costHabitatgeAnualNet(habitatge: Habitatge | undefined, familia: Familia): number {
  return Math.max(0, costHabitatgeAnual(habitatge) - ajutHipotecaFamiliar(familia, habitatge))
}

/** Resum d'una possible compra, per a la UI. */
export interface OfertaCompra {
  preu: number
  entrada: number
  hipoteca: Hipoteca
  /** Part de l'entrada que cobreix la família (regal segons la classe social). */
  ajutFamiliar: number
  teEntrada: boolean
  bancAprova: boolean
}

export function ofertaCompra(
  state: GameState,
  preu: number,
  anys: number,
): OfertaCompra {
  // `anys === 0` = compra AL COMPTAT (sense hipoteca): pagues el preu sencer.
  const comptat = anys === 0
  const entrada = comptat ? preu : entradaHipoteca(preu)
  const hipoteca = comptat
    ? { deute: 0, quotaAnual: 0, anysRestants: 0 }
    : calculaHipoteca(preu, anys)
  // La família només cobreix el que no arribes a posar tu, fins al seu màxim.
  const liquid = liquidDisponible(state)
  const falta = Math.max(0, entrada - liquid)
  const ajutFamiliar = Math.min(falta, ajutEntradaMax(state.familia))
  return {
    preu,
    entrada,
    hipoteca,
    ajutFamiliar,
    teEntrada: liquid + ajutFamiliar >= entrada,
    // Al comptat no cal aprovació del banc (no hi ha préstec).
    bancAprova: comptat ? true : bancConcedeix(hipoteca.quotaAnual, ingressosAnuals(state)),
  }
}

/** Cost anual en efectiu de l'habitatge actual (lloguer o quota d'hipoteca). */
export function costHabitatgeAnual(habitatge?: Habitatge): number {
  if (!habitatge) return 0
  if (habitatge.tipus === 'propietat') return habitatge.hipoteca?.quotaAnual ?? 0
  return habitatge.lloguerAnual ?? 0
}

/** Amortitza un any d'hipoteca; retorna la hipoteca nova o `undefined` si queda saldada. */
export function amortitzaHipoteca(hip: Hipoteca): Hipoteca | undefined {
  const interes = Math.round(hip.deute * INTERES_HIPOTECA)
  const capital = Math.max(0, hip.quotaAnual - interes)
  const deute = Math.max(0, Math.round(hip.deute - capital))
  const anysRestants = hip.anysRestants - 1
  if (deute <= 0 || anysRestants <= 0) return undefined
  return { deute, quotaAnual: hip.quotaAnual, anysRestants }
}

/** Canvia a un lloguer (habitació o pis). */
export function llogar(state: GameState, tipus: OpcioLloguer['tipus']): GameState {
  const opcio = OPCIONS_LLOGUER.find((o) => o.tipus === tipus)
  if (!opcio) return state
  return { ...state, habitatge: { tipus, lloguerAnual: opcio.lloguerAnual } }
}

/** Torna a viure amb els pares (deixa el lloguer). */
export function tornarAmbPares(state: GameState): GameState {
  if (state.habitatge?.tipus === 'propietat') return state // no s'abandona una propietat
  return { ...state, habitatge: { tipus: 'amb_pares' } }
}

/**
 * Compra un habitatge: paga l'entrada (efectiu → estalvi), suma el valor a les
 * cases en propietat i obre la hipoteca. No fa res si no es pot pagar l'entrada o
 * el banc no concedeix la hipoteca.
 */
export function comprarCasa(
  state: GameState,
  propietatId: string,
  anys: number,
): GameState {
  const propietat = getPropietat(propietatId)
  if (!propietat || state.habitatge?.tipus === 'propietat') return state

  const oferta = ofertaCompra(state, propietat.preu, anys)
  if (!oferta.teEntrada || !oferta.bancAprova) return state

  // El jugador paga la part de l'entrada (o el preu sencer, si és al comptat) que no regala
  // la família, liquidant primer efectiu, després estalvi i finalment el fons indexat.
  const pat = { ...state.person.patrimoni }
  let restant = oferta.entrada - oferta.ajutFamiliar
  for (const font of ['efectiu', 'estalvi', 'fonsIndexat'] as const) {
    const treu = Math.min(restant, pat[font])
    pat[font] = Math.round(pat[font] - treu)
    restant -= treu
  }
  pat.cases = [...pat.cases, propietat.preu]

  // Al comptat (o si la hipoteca queda en 0) no es desa cap hipoteca.
  const hipoteca = oferta.hipoteca.deute > 0 ? oferta.hipoteca : undefined

  return {
    ...state,
    person: { ...state.person, patrimoni: pat },
    habitatge: { tipus: 'propietat' as TipusHabitatge, hipoteca },
  }
}
