import {
  COST_VENDA_HABITATGE,
  DESPESES_COMPRA,
  ENTRADA_HIPOTECA,
  FRACCIO_ENTRADA_PARELLA,
  INTERES_HIPOTECA,
  LLOGUER_HABITACIO_ANUAL,
  LLOGUER_OFERTES_PER_ANY,
  LLOGUER_PIS_ANUAL,
  RATI_ENDEUTAMENT_MAX,
} from './constants'
import { rng } from './rng'
import { benestarHabitatge, factorHabitatge, netAnual } from './stats'
import { edatAnys } from './time'
import type {
  Familia,
  FamilyClass,
  GameState,
  Habitatge,
  Hipoteca,
  LogEntry,
  OfertaLloguer,
  TipusHabitatge,
} from './types'

/**
 * Deixa constància al historial d'un canvi de situació d'habitatge, fent EXPLÍCIT l'efecte que
 * té sobre la referència de benestar (viure amb els pares < habitació < lloguer < propietat). El
 * benestar no salta de cop —gravita cap a la nova referència— però el jugador ha de poder veure
 * al log que la decisió d'habitatge MOU el benestar (abans no es reflectia enlloc).
 */
function registraCanviHabitatge(
  state: GameState,
  next: GameState,
  tipus: TipusHabitatge | 'venda',
): GameState {
  const deltaRef = benestarHabitatge(next.habitatge) - benestarHabitatge(state.habitatge)
  const entry: LogEntry = {
    torn: state.torn,
    edatAnys: edatAnys(state.person.edatMesos),
    eventId: `habitatge_${tipus}`,
    titleKey: `hist.habitatge.${tipus}.title`,
    descKey: `hist.habitatge.${tipus}.desc`,
    category: 'familia',
    kind: 'action',
    effect: deltaRef !== 0 ? { benestar: deltaRef } : {},
  }
  return { ...next, historial: [...next.historial, entry] }
}

/** Opció de lloguer (habitació o pis sencer). */
export interface OpcioLloguer {
  tipus: 'habitacio' | 'pis_lloguer'
  lloguerAnual: number
}

export const OPCIONS_LLOGUER: OpcioLloguer[] = [
  { tipus: 'habitacio', lloguerAnual: LLOGUER_HABITACIO_ANUAL },
  { tipus: 'pis_lloguer', lloguerAnual: LLOGUER_PIS_ANUAL },
]

/**
 * Genera el lot d'ofertes de lloguer d'aquest any (determinista a partir de `rngState`).
 * El mercat és divers i imperfecte: cada oferta surt amb un preu variat (~0,7×–1,4× del preu de
 * referència del seu tipus), així que trobar un lloguer barat depèn de la sort de l'any. Sempre
 * en surt almenys una habitació i un pis perquè el jugador no quedi mai bloquejat.
 */
export function generaOfertesLloguer(
  rngState: number,
  factorPreu = 1,
): {
  ofertes: OfertaLloguer[]
  state: number
} {
  let s = rngState
  const draw = () => {
    const r = rng(s)
    s = r.state
    return r.value
  }
  const tipus: OfertaLloguer['tipus'][] = ['habitacio', 'pis_lloguer']
  const ofertes: OfertaLloguer[] = []
  for (let i = 0; i < LLOGUER_OFERTES_PER_ANY; i++) {
    // Almenys una habitació i un pis garantits; la resta, aleatòria.
    const t = i < tipus.length ? tipus[i] : tipus[draw() < 0.5 ? 0 : 1]
    const base = t === 'habitacio' ? LLOGUER_HABITACIO_ANUAL : LLOGUER_PIS_ANUAL
    const factor = 0.7 + draw() * 0.7 // 0,7×–1,4× del preu de referència
    // El preu de referència puja amb l'IPC (els lloguers s'encareixen al llarg de la vida).
    ofertes.push({
      id: `ll${i}`,
      tipus: t,
      lloguerAnual: Math.round((base * factor * factorPreu) / 100) * 100,
    })
  }
  // Ordena per preu (de més barat a més car) perquè la llista sigui llegible.
  ofertes.sort((a, b) => a.lloguerAnual - b.lloguerAnual)
  return { ofertes, state: s }
}

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

/** Despeses de compra (ITP/IVA, notaria, registre, gestoria, tassació...): es paguen al comptat. */
export function despesesCompra(preu: number): number {
  return Math.round(preu * DESPESES_COMPRA)
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
 * Diners disponibles per comprar (entrada o pagament al comptat): efectiu + la cartera
 * d'inversió (es pot liquidar per comprar).
 */
export function liquidDisponible(state: GameState): number {
  const p = state.person.patrimoni
  return p.efectiu + p.inversions
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
  /** Despeses de transacció (impostos, notaria, gestoria, tassació...). */
  despeses: number
  hipoteca: Hipoteca
  /** Part de l'entrada que cobreix la família (regal segons la classe social). */
  ajutFamiliar: number
  /** Si compres en parella, l'altra meitat de l'aportació inicial la posa la parella. */
  enParella: boolean
  /** Diners (al comptat) que ha de posar el JUGADOR ara mateix (ja descomptats ajut i parella). */
  aportacioInicial: number
  teEntrada: boolean
  bancAprova: boolean
}

export function ofertaCompra(
  state: GameState,
  preuReal: number,
  anys: number,
): OfertaCompra {
  // El preu de catàleg és en euros "reals"; l'ÍNDEX DE L'HABITATGE (no l'IPC) l'encareix al
  // llarg de la vida (l'habitatge puja pel seu compte, més de pressa que els preus de consum).
  const preu = Math.round((preuReal * factorHabitatge(state)) / 100) * 100
  // `anys === 0` = compra AL COMPTAT (sense hipoteca): pagues el preu sencer.
  const comptat = anys === 0
  const entrada = comptat ? preu : entradaHipoteca(preu)
  const despeses = despesesCompra(preu)
  const hipoteca = comptat
    ? { deute: 0, quotaAnual: 0, anysRestants: 0 }
    : calculaHipoteca(preu, anys)
  // Comprar en parella reparteix l'aportació inicial (entrada + despeses): l'altra meitat la posa
  // la parella. La família, a més, pot regalar part de la TEVA meitat (segons la classe).
  const enParella = Boolean(state.parella)
  const fraccio = enParella ? FRACCIO_ENTRADA_PARELLA : 1
  const aportacioBruta = Math.round((entrada + despeses) * fraccio)
  const liquid = liquidDisponible(state)
  const falta = Math.max(0, aportacioBruta - liquid)
  const ajutFamiliar = Math.min(falta, ajutEntradaMax(state.familia))
  const aportacioInicial = Math.max(0, aportacioBruta - ajutFamiliar)
  // En parella, el banc compta els dos sous: relaxa el límit d'endeutament (dues rendes).
  const ingres = ingressosAnuals(state) * (enParella ? 1.8 : 1)
  // Per a una compra ADDICIONAL, el banc suma la quota de la hipoteca que ja tens: el límit
  // d'endeutament es mira sobre el TOTAL de quotes (no pots acumular hipoteques sense fre).
  const quotaExistent = state.habitatge?.hipoteca?.quotaAnual ?? 0
  return {
    preu,
    entrada,
    despeses,
    hipoteca,
    ajutFamiliar,
    enParella,
    aportacioInicial,
    teEntrada: liquid + ajutFamiliar >= aportacioBruta,
    // Al comptat no cal aprovació del banc (no hi ha préstec).
    bancAprova: comptat ? true : bancConcedeix(quotaExistent + hipoteca.quotaAnual, ingres),
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

/**
 * Canvia a un lloguer triant una OFERTA concreta del mercat d'aquest any (per id). Si no hi ha
 * ofertes desades (compatibilitat), accepta el tipus i fa servir el preu de referència.
 */
export function llogar(state: GameState, ofertaId: string): GameState {
  const oferta = state.ofertesLloguer?.find((o) => o.id === ofertaId)
  if (oferta) {
    return registraCanviHabitatge(
      state,
      { ...state, habitatge: { tipus: oferta.tipus, lloguerAnual: oferta.lloguerAnual } },
      oferta.tipus,
    )
  }
  // Compatibilitat: si l'id és un tipus (sense ofertes generades), usa el preu de referència.
  const opcio = OPCIONS_LLOGUER.find((o) => o.tipus === ofertaId)
  if (!opcio) return state
  return registraCanviHabitatge(
    state,
    { ...state, habitatge: { tipus: opcio.tipus, lloguerAnual: opcio.lloguerAnual } },
    opcio.tipus,
  )
}

/** Torna a viure amb els pares (deixa el lloguer). */
export function tornarAmbPares(state: GameState): GameState {
  if (state.habitatge?.tipus === 'propietat') return state // no s'abandona una propietat
  return registraCanviHabitatge(state, { ...state, habitatge: { tipus: 'amb_pares' } }, 'amb_pares')
}

/**
 * Compra un habitatge: paga l'aportació inicial (entrada + despeses de transacció, repartides
 * amb la parella i menys l'ajut familiar), liquidant efectiu → inversions; suma el valor a les
 * cases en propietat i obre/amplia la hipoteca. Es pot comprar MÉS D'UNA casa: les hipoteques
 * es combinen en una de sola (deute i quota sumats). No fa res si no es pot pagar o el banc no
 * concedeix el total d'endeutament.
 */
export function comprarCasa(
  state: GameState,
  propietatId: string,
  anys: number,
): GameState {
  const propietat = getPropietat(propietatId)
  if (!propietat) return state

  const oferta = ofertaCompra(state, propietat.preu, anys)
  if (!oferta.teEntrada || !oferta.bancAprova) return state

  // El jugador paga la seva aportació inicial (la parella ja n'ha cobert la meitat, i la família
  // l'ajut), liquidant primer efectiu i després la cartera d'inversió.
  const pat = { ...state.person.patrimoni }
  let restant = oferta.aportacioInicial
  for (const font of ['efectiu', 'inversions'] as const) {
    const treu = Math.min(restant, pat[font])
    pat[font] = Math.round(pat[font] - treu)
    restant -= treu
  }
  // El valor desat és el preu de mercat pagat (ja amb l'índex d'habitatge aplicat).
  pat.cases = [...pat.cases, oferta.preu]

  // La hipoteca nova es COMBINA amb la que ja tinguessis (compra addicional): deute i quota
  // sumats, i el termini més llarg dels dos.
  const previa = state.habitatge?.tipus === 'propietat' ? state.habitatge.hipoteca : undefined
  const nova = oferta.hipoteca.deute > 0 ? oferta.hipoteca : undefined
  let hipoteca: Hipoteca | undefined
  if (previa && nova) {
    hipoteca = {
      deute: previa.deute + nova.deute,
      quotaAnual: previa.quotaAnual + nova.quotaAnual,
      anysRestants: Math.max(previa.anysRestants, nova.anysRestants),
    }
  } else {
    hipoteca = nova ?? previa
  }

  return registraCanviHabitatge(
    state,
    {
      ...state,
      person: { ...state.person, patrimoni: pat },
      habitatge: { tipus: 'propietat' as TipusHabitatge, hipoteca },
    },
    'propietat',
  )
}

/** Desglossament econòmic de vendre la casa `index`: valor de mercat, cost de venda, part
 * d'hipoteca que cal cancel·lar i diners nets que rep el venedor. `null` si no és vàlid. */
export function calculaVenda(
  state: GameState,
  index: number,
): { valorBrut: number; costVenda: number; hipotecaCancela: number; net: number } | null {
  const cases = state.person.patrimoni.cases
  if (state.habitatge?.tipus !== 'propietat' || index < 0 || index >= cases.length) return null
  const valorBrut = cases[index]
  const total = cases.reduce((a, b) => a + b, 0)
  const esUltima = cases.length === 1
  const hip = state.habitatge.hipoteca
  // L'hipoteca és combinada: en vendre l'última casa es cancel·la sencera; si en queden, se'n
  // cancel·la la part proporcional al valor de la casa venuda.
  const hipotecaCancela = hip
    ? esUltima
      ? hip.deute
      : Math.round(hip.deute * (total > 0 ? valorBrut / total : 1))
    : 0
  const costVenda = Math.round(valorBrut * COST_VENDA_HABITATGE)
  const net = valorBrut - costVenda - hipotecaCancela
  return { valorBrut, costVenda, hipotecaCancela, net }
}

/**
 * Ven un immoble en propietat (`index` dins de `patrimoni.cases`). El venedor rep el valor de
 * mercat menys el cost de venda i la cancel·lació (proporcional) de la hipoteca; els diners nets
 * van a efectiu (si són negatius —immoble sota l'aigua—, generen deute de consum). Si era l'última
 * casa, es cancel·la tota la hipoteca i es torna a viure de lloguer/amb els pares (`amb_pares`).
 */
export function vendreCasa(state: GameState, index: number): GameState {
  const venda = calculaVenda(state, index)
  if (!venda) return state
  const cases = state.person.patrimoni.cases
  const esUltima = cases.length === 1
  const hip = state.habitatge?.tipus === 'propietat' ? state.habitatge.hipoteca : undefined

  const novesCases = cases.filter((_, i) => i !== index)
  const pat = { ...state.person.patrimoni, cases: novesCases }
  // Diners nets a caixa; si negatiu (deute superior al valor), es converteix en deute de consum.
  if (venda.net >= 0) {
    pat.efectiu = Math.round(pat.efectiu + venda.net)
  } else {
    pat.deute = Math.round((pat.deute ?? 0) - venda.net)
  }

  let novaHipoteca: Hipoteca | undefined
  let habitatge: Habitatge
  if (esUltima) {
    habitatge = { tipus: 'amb_pares' }
  } else {
    const total = cases.reduce((a, b) => a + b, 0)
    const fraccio = total > 0 ? venda.valorBrut / total : 0
    novaHipoteca = hip
      ? {
          deute: Math.max(0, hip.deute - venda.hipotecaCancela),
          quotaAnual: Math.round(hip.quotaAnual * (1 - fraccio)),
          anysRestants: hip.anysRestants,
        }
      : undefined
    if (novaHipoteca && novaHipoteca.deute <= 0) novaHipoteca = undefined
    habitatge = { tipus: 'propietat', hipoteca: novaHipoteca }
  }

  const entry: LogEntry = {
    torn: state.torn,
    edatAnys: edatAnys(state.person.edatMesos),
    eventId: 'habitatge_venda',
    titleKey: 'hist.habitatge.venda.title',
    descKey: 'hist.habitatge.venda.desc',
    params: { import: venda.net },
    category: 'economia',
    kind: 'action',
    effect: (() => {
      const d = benestarHabitatge(habitatge) - benestarHabitatge(state.habitatge)
      return d !== 0 ? { benestar: d } : {}
    })(),
  }

  return {
    ...state,
    person: { ...state.person, patrimoni: pat },
    habitatge,
    historial: [...state.historial, entry],
  }
}
