// Harness de simulació: juga partides completes (0→35) de manera determinista i
// pura, per MESURAR la corba d'outcomes per classe (vegeu DESIGN.md §1 i §8.4).
//
// No forma part del joc: és l'eina del "moderador-tester" per validar amb dades
// (no amb arguments) que la física produeix la corba objectiu. Tot passa pel RNG
// serialitzable, així que cada llavor és reproduïble.

import {
  acceptarOferta,
  actionOptions,
  advanceTurn,
  applyChoice,
  applyMilestoneChoice,
  classeHereu,
  newGame,
} from '../engine'
import type { NewGameSetup } from '../engine'
import { FAMILY_PRESET_ORDER } from '../family/presets'
import { edatAnys } from '../time'
import {
  defaultPlaInversio,
  factorIPC,
  ingressosAnualsCarrera,
  patrimoniTotal,
} from '../stats'
import type {
  EventEffect,
  FamilyClass,
  GameState,
  Identitat,
  Itinerari,
  RegimPolitic,
} from '../types'

/** Camí de vida que segueix el jugador simulat a les fites. */
export interface SimPolicy {
  /** Tria als 16 (fita `postobligatori`). */
  postobligatori: Itinerari
  /** Tria als 18 (fita `majoria`): seguir estudiant o entrar a la carrera. */
  majoria: 'universitat' | 'carrera'
  /**
   * Jugador ACTIU: a la universitat dedica l'any a estudiar a fons (`uni_estudis`), que
   * apuja el nivell acadèmic i, per tant, el sou de partida i l'ocupabilitat. És la via
   * d'escapada principal de DESIGN §8.4 (educació pública); sense això, el jugador simulat
   * és passiu (no tria cap acció) i no pot accedir a la cua de mobilitat.
   */
  actiu?: boolean
}

/**
 * Accions que tria el jugador ACTIU en una fase d'acció. Es concentra en la via d'escapada
 * realista: estudiar a fons a la universitat (puja `nivellAcademic` → millor sou). A les
 * fases joves no tria res (evita el cost de benestar d'activitats que, amb la mortalitat, poden
 * enfonsar una vida ja precària).
 */
function activeActions(state: GameState): string[] {
  if (state.lifeStage !== 'universitat') return []
  const estudia = actionOptions(state).find(
    (o) => o.action.id === 'uni_estudis' && !o.disabled,
  )
  return estudia ? ['uni_estudis'] : []
}

/** Efecte immediat d'una opció d'esdeveniment (dinàmic si té `resolve`). */
function choiceEffect(
  source: { effect?: EventEffect; resolve?: (s: GameState) => EventEffect },
  state: GameState,
): EventEffect {
  return source.resolve ? source.resolve(state) : (source.effect ?? {})
}

/** Tria d'opció en una fita segons la política. */
function milestoneChoice(state: GameState, policy: SimPolicy): string {
  switch (state.pendingMilestone) {
    case 'institut':
      return 'continuar'
    case 'postobligatori':
      return policy.postobligatori
    case 'majoria':
      return policy.majoria
    case 'fi_uni':
      return 'comencar_carrera'
    // Fites de mitja carrera: el jugador simulat prioritza el benestar (la mètrica de
    // victòria), com fa `eventChoice`, així que tria l'opció que el cuida (menys sou).
    case 'cruilla_40':
      return 'conciliar'
    case 'revisio_50':
      return 'cuidar_se'
    case 'recta_60':
      return 'desaccelerar'
    case 'jubilacio':
      return 'jubilar'
    default:
      return ''
  }
}

/**
 * Jugador simulat davant d'un esdeveniment amb decisió: tria l'opció que maximitza
 * el benestar immediat (i, a igualtat, la que deixa més diners). Representa algú que
 * intenta estar bé sense arruïnar-se — una política neutra i consistent.
 */
function eventChoice(state: GameState): string {
  const choices = state.pendingEvent?.choices ?? []
  // Descendència: un jugador raonable no té un fill quan està financerament contra les
  // cordes (deute, benestar baix o sense coixí líquid). Si va bé, sí que en té.
  if (state.pendingEvent?.id === 'tenir_fill') {
    const p = state.person.patrimoni
    const precari =
      (p.deute ?? 0) > 0 ||
      state.person.stats.benestar < 35 ||
      p.efectiu + p.inversions < 5000
    return precari ? 'no' : 'si'
  }
  // Emprenedoria: un jugador raonable munta un negoci si té coixí (capital i sense deute) i és
  // prou jove per recuperar-se d'un fracàs. És una aposta de mobilitat (alta variància).
  if (state.pendingEvent?.id === 'muntar_negoci') {
    const p = state.person.patrimoni
    // Només qui ja va prou bé (coixí gran, sense deute, benestar alt, jove) fa l'aposta: la
    // emprenedoria és per enfilar la cua, no una jugada desesperada que arruïna el qui va just.
    const teCoixi =
      (p.deute ?? 0) === 0 &&
      p.efectiu + p.inversions >= 50_000 &&
      state.person.stats.benestar > 55 &&
      edatAnys(state.person.edatMesos) < 50
    return teCoixi ? 'muntar' : 'no'
  }
  let best = choices[0]
  let bestScore = -Infinity
  for (const c of choices) {
    const eff = choiceEffect(c, state)
    const diners =
      (eff.efectiu ?? 0) + (eff.inversions ?? 0) - (eff.despesaGreu ?? 0)
    const score = (eff.benestar ?? 0) * 1000 + diners
    if (score > bestScore) {
      bestScore = score
      best = c
    }
  }
  return best?.id ?? ''
}

/**
 * Juga una partida fins al final aplicant la política. Manté els pressupostos i
 * plans d'inversió per defecte del motor (joc "raonable" sense microgestió) i, a
 * la cerca de feina, accepta sempre la millor oferta disponible (no s'està a l'atur).
 */
export function playout(initial: GameState, policy: SimPolicy): GameState {
  let s = initial
  let guard = 0
  while (!s.acabat && guard++ < 5000) {
    if (s.pendingMilestone) {
      s = applyMilestoneChoice(s, milestoneChoice(s, policy))
      continue
    }
    if (s.pendingEvent) {
      s = applyChoice(s, eventChoice(s))
      continue
    }
    // Cerca de feina (carrera, a l'atur amb ofertes): accepta la millor i continua.
    if (
      s.lifeStage === 'carrera' &&
      (s.salari ?? 0) === 0 &&
      s.ofertesFeina &&
      s.ofertesFeina.length > 0
    ) {
      const best = [...s.ofertesFeina].sort((a, b) => b.sou - a.sou)[0]
      s = acceptarOferta(s, best.id)
      continue
    }
    // Jugador «raonable»: adopta el pla d'inversió per defecte i el reajusta cada any a
    // l'ingrés NOMINAL d'aquell any (com qui apuja la despesa/estalvi amb la inflació), perquè
    // el seu oci/estalvi no s'erosioni amb l'IPC al llarg de dècades.
    if ((s.lifeStage === 'carrera' || s.lifeStage === 'jubilacio') && (s.salari ?? 0) > 0) {
      s = {
        ...s,
        plaInversio: defaultPlaInversio(
          Math.round(ingressosAnualsCarrera(s) * factorIPC(s)),
        ),
      }
    }
    s = advanceTurn(s, policy.actiu ? activeActions(s) : undefined)
  }
  return s
}

/** Resultat final d'una partida simulada. */
export interface SimOutcome {
  benestar: number
  patrimoni: number
  /** Patrimoni net REAL (desinflat per l'IPC) — comparable entre èpoques. */
  patrimoniReal: number
  salari: number
  teDiploma: boolean
  /** Classe econòmica en què mor (segons el patrimoni net REAL, desinflat per l'IPC). */
  classeFinal: FamilyClass
  /** Edat a la mort. */
  edatMort: number
  /** Va morir amb deute de consum pendent. */
  ambDeute: boolean
  /** Va morir amb patrimoni net negatiu. */
  netNegatiu: boolean
  /** Va arribar a ser propietari d'habitatge. */
  propietari: boolean
  /** Va tenir fills. */
  ambFills: boolean
}

/** Llavor decorrelacionada a partir d'un índex (evita seqüències correlacionades). */
function seedFor(i: number): number {
  return ((i + 1) * 0x9e3779b1) >>> 0
}

/** Simula `nSeeds` partides d'una classe amb una política i retorna els outcomes. */
export function simulateClass(
  cls: FamilyClass,
  nSeeds: number,
  policy: SimPolicy,
  identitat?: Identitat,
  regimPolitic?: RegimPolitic,
): SimOutcome[] {
  const out: SimOutcome[] = []
  for (let i = 0; i < nSeeds; i++) {
    const setup: NewGameSetup = {}
    if (identitat) setup.identitat = identitat
    if (regimPolitic) setup.regimPolitic = regimPolitic
    const final = playout(newGame(cls, seedFor(i), setup), policy)
    const deuteHipoteca = final.habitatge?.hipoteca?.deute ?? 0
    const net = patrimoniTotal(final.person) - deuteHipoteca
    const netReal = net / factorIPC(final)
    out.push({
      benestar: final.person.stats.benestar,
      patrimoni: patrimoniTotal(final.person),
      patrimoniReal: Math.round(netReal),
      salari: final.salari ?? 0,
      teDiploma: !!final.teDiploma,
      // La classe en què mor: ancorada a l'origen (només es pot caure; pujar és quasi impossible).
      classeFinal: classeHereu(cls, netReal),
      edatMort: edatAnys(final.person.edatMesos),
      ambDeute: (final.person.patrimoni.deute ?? 0) > 0,
      netNegatiu: net < 0,
      propietari: final.person.patrimoni.cases.length > 0,
      ambFills: (final.fills ?? 0) > 0,
    })
  }
  return out
}

// --- Estadística d'agregació ---

export function median(xs: number[]): number {
  return percentile(xs, 50)
}

export function percentile(xs: number[], p: number): number {
  if (xs.length === 0) return 0
  const sorted = [...xs].sort((a, b) => a - b)
  const idx = clampIdx(Math.round((p / 100) * (sorted.length - 1)), sorted.length)
  return sorted[idx]
}

export function mean(xs: number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length
}

/** Fracció (0..1) d'elements que compleixen el predicat. */
export function fraction(xs: number[], pred: (x: number) => boolean): number {
  return xs.length === 0 ? 0 : xs.filter(pred).length / xs.length
}

function clampIdx(i: number, len: number): number {
  return Math.max(0, Math.min(len - 1, i))
}

/** Resum estadístic d'una tirada de simulació per classe. */
export interface ClassSummary {
  benestarMediana: number
  benestarP10: number
  benestarP90: number
  patrimoniMediana: number
  /** Fracció amb benestar ≥ 60 als 35 (proxy de la "cua de mobilitat"). */
  cuaBenestar60: number
  /** Distribució de la classe econòmica en què MOREN (recompte per classe). */
  classeFinal: Record<FamilyClass, number>
  /** Edat mediana a la mort. */
  edatMortMediana: number
  /** Fracció que arriben a la jubilació (67 anys). */
  arribaA67: number
  /** Fracció que mor amb deute de consum. */
  ambDeute: number
  /** Fracció que mor amb patrimoni net negatiu. */
  netNegatiu: number
  /** Fracció que arriba a ser propietari. */
  propietari: number
  /** Fracció que té fills. */
  ambFills: number
  /** Gini del patrimoni net REAL final (0 = igualtat, 1 = màxima desigualtat). */
  giniPatrimoni: number
  /** Patrimoni net REAL mitjà (desinflat). */
  patrimoniRealMediana: number
}

/** Índex de Gini d'una llista de valors (es desplacen perquè no n'hi hagi de negatius). */
function gini(valors: number[]): number {
  if (valors.length === 0) return 0
  const min = Math.min(0, ...valors)
  const xs = valors.map((v) => v - min).sort((a, b) => a - b)
  const n = xs.length
  const suma = xs.reduce((a, b) => a + b, 0)
  if (suma === 0) return 0
  let acum = 0
  for (let i = 0; i < n; i++) acum += (i + 1) * xs[i]
  return Math.max(0, Math.min(1, (2 * acum) / (n * suma) - (n + 1) / n))
}

export function summarize(outcomes: SimOutcome[]): ClassSummary {
  const b = outcomes.map((o) => o.benestar)
  const p = outcomes.map((o) => o.patrimoni)
  const classeFinal = Object.fromEntries(
    FAMILY_PRESET_ORDER.map((c) => [c, 0]),
  ) as Record<FamilyClass, number>
  for (const o of outcomes) classeFinal[o.classeFinal]++
  return {
    benestarMediana: median(b),
    benestarP10: percentile(b, 10),
    benestarP90: percentile(b, 90),
    patrimoniMediana: Math.round(median(p)),
    cuaBenestar60: fraction(b, (x) => x >= 60),
    classeFinal,
    edatMortMediana: median(outcomes.map((o) => o.edatMort)),
    arribaA67: fraction(outcomes.map((o) => o.edatMort), (x) => x >= 67),
    ambDeute: fraction(outcomes.map((o) => (o.ambDeute ? 1 : 0)), (x) => x === 1),
    netNegatiu: fraction(outcomes.map((o) => (o.netNegatiu ? 1 : 0)), (x) => x === 1),
    propietari: fraction(outcomes.map((o) => (o.propietari ? 1 : 0)), (x) => x === 1),
    ambFills: fraction(outcomes.map((o) => (o.ambFills ? 1 : 0)), (x) => x === 1),
    giniPatrimoni: gini(outcomes.map((o) => o.patrimoniReal)),
    patrimoniRealMediana: Math.round(median(outcomes.map((o) => o.patrimoniReal))),
  }
}

/** Fracció (0..1) de morts en una classe d'IGUAL o INFERIOR rang que l'origen (no han pujat). */
export function fraccioSenseAscens(
  summary: ClassSummary,
  origen: FamilyClass,
): number {
  const rangOrigen = FAMILY_PRESET_ORDER.indexOf(origen)
  let total = 0
  let senseAscens = 0
  for (const c of FAMILY_PRESET_ORDER) {
    const n = summary.classeFinal[c]
    total += n
    if (FAMILY_PRESET_ORDER.indexOf(c) <= rangOrigen) senseAscens += n
  }
  return total === 0 ? 1 : senseAscens / total
}
