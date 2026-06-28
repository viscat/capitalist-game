// Constants de joc.
import type { NivellVida } from './types'

export const BENESTAR_MIN = 0
export const BENESTAR_MAX = 100

// --- Salut (0..100): pool de mortalitat. Quan arriba a 0, la persona mor. ---
export const SALUT_MIN = 0
export const SALUT_MAX = 100
/** Salut inicial al naixement (sa). */
export const SALUT_INICIAL = 100
/**
 * Esperança de vida de referència (anys) per a una persona SANA i benestant: el declivi per
 * edat es calibra perquè la mort natural arribi al voltant d'aquesta edat (≈ Espanya actual).
 */
export const ESPERANCA_VIDA = 84
/**
 * Any de calendari de referència per a l'esperança de vida "actual". Per a anys posteriors,
 * el progrés mèdic allarga la vida (futur); per a anys anteriors, l'escurça. Vegeu
 * `factorEsperancaVida` a `stats.ts`.
 */
export const ANY_REFERENCIA_ESPERANCA = 2025
/** Anys de vida guanyats per dècada de progrés mèdic (esperança de vida futura creixent). */
export const GUANY_ESPERANCA_PER_DECADA = 1.2

export const MESOS_PER_ANY = 12

/** Pressupost de temps anual (setmanes) per a les accions de les fases joves. */
export const SETMANES_ANY = 52

/** Edat (en anys) a la qual la infància dóna pas a l'adolescència (institut). */
export const EDAT_FI_INFANCIA = 12

/** Edat (en anys) a la qual acaba l'ESO i arriba el fork estudiar/treballar. */
export const EDAT_FI_ADOLESCENCIA = 16

/** Edat (en anys) a la qual acaba la fase postobligatòria (16→18). */
export const EDAT_FI_POSTOBLIGATORI = 18

/** Edat (en anys) a la qual s'acaba la carrera universitària (18→22). */
export const EDAT_FI_UNIVERSITAT = 22

/**
 * Edat (en anys) de la JUBILACIÓ: fi de la vida laboral i de la partida. La carrera
 * adulta s'estén fins aquí; als 67 es fa el balanç de jubilació (pensió pública + pla de
 * pensions + rendes del patrimoni). La mort (salut 0) pot acabar la partida abans.
 */
export const EDAT_JUBILACIO = 67

/** Fites de decisió a mitja carrera (donen textura i preparen la jubilació). */
export const EDAT_CRUILLA_40 = 40
export const EDAT_REVISIO_50 = 50
export const EDAT_RECTA_60 = 60

// --- Descendència (tenir fills, a la vida adulta) ---

/** Finestra d'edat en què pot aparèixer l'opció de tenir un fill. */
export const EDAT_FERTIL_MIN = 26
export const EDAT_FERTIL_MAX = 42
/** Nombre màxim de fills. */
export const MAX_FILLS = 3
/**
 * Nivell de frugalitat (0..100) mínim per poder viure de manera frugal sense penalització de
 * benestar. Es guanya amb la formació (nivell acadèmic) i amb l'edat (saviesa/experiència).
 */
export const FRUGALITAT_LLINDAR = 75
/**
 * Fracció de les despeses estructurals (lloguer/hipoteca + cost de vida) que assumeixes quan
 * vius en parella: l'altra persona cobreix la resta. < 1 perquè compartir abarateix (economies
 * d'escala de la llar), però no a la meitat exacta (part del consum segueix sent personal).
 */
export const FACTOR_DESPESA_PARELLA = 0.62
/** Anys que un fill és dependent (genera cost de criança al progenitor). */
export const DEPENDENCIA_FILLS_ANYS = 22
/**
 * Cost anual base de criar un fill dependent (alimentació, roba, escola, extraescolars...).
 * S'escala amb el nivell de vida i amb el sobrecost de classe ("la pobresa surt cara"): per
 * a una llar humil un fill pesa molt més en proporció. Ordre de magnitud realista (Espanya).
 */
export const COST_FILL_ANUAL = 4_000

/** Sou BRUT mensual base d'una primera feina als 16-18 (s'hi suma un plus per família). */
export const SALARI_BASE_16 = 800

/** Sou BRUT mensual base d'una feina adulta (18+), sense títol universitari. */
export const SALARI_ADULT_BASE = 1650

/** Plus de sou BRUT mensual per tenir un títol universitari. */
export const PREMI_DIPLOMA = 800

/** Salari mínim interprofessional: 17.000 € bruts anuals (terra del sou adult). */
export const SALARI_MINIM_ANUAL = 17_000
export const SALARI_MINIM_MENSUAL = Math.round(SALARI_MINIM_ANUAL / MESOS_PER_ANY)

/** Pas d'ajust del pressupost mensual (€). */
export const PAS_PRESSUPOST = 25

/** Pas d'ajust del pla d'inversió anual (€). Múltiple de 12 → passos mensuals nets. */
export const PAS_PLA = 300

/** Fracció del desfasament cap al benestar de referència que es recupera per torn. */
export const DERIVA_BENESTAR = 0.25

// Deriva ASIMÈTRICA del benestar (P9): és més fàcil caure que pujar. Quan el benestar
// està per sobre de la referència (cal baixar), la caiguda és ràpida; quan està per sota
// (cal pujar), la recuperació és lenta. Reforça que un cop dolent costa de remuntar i que
// l'estructura t'arrossega cap a la teva referència de classe.
export const DERIVA_PUJADA = 0.18
export const DERIVA_BAIXA = 0.32

/**
 * Interès anual del deute de consum (P1). Quan ni l'ingrés, ni els estalvis propis, ni la
 * xarxa familiar cobreixen les necessitats de l'any, el dèficit no desapareix: es
 * converteix en DEUTE que compon a aquest tipus i bloqueja qualsevol inversió fins que
 * s'extingeix. És el mecanisme estructural que reprodueix la pobresa malgrat bones
 * decisions (la trampa del deute, no una penalització per etiqueta de classe).
 */
export const INTERES_DEUTE = 0.18

// --- Capa pública del benestar (P8): existeix però és insuficient i arriba tard ---

/** Renda mínima anual (tipus IMV): terra públic per a qui cau (≈650 €/mes). */
export const IMV_ANUAL = 7_800
/**
 * Taxa efectiva d'accés a l'IMV (1 − no-take-up). A la realitat, una gran part de qui hi
 * té dret no el cobra (desconeixement, burocràcia, estigma): modelem aquesta degradació
 * com una cobertura parcial del dèficit, no com un rescat complet.
 */
export const IMV_COBERTURA = 0.3
/** Fracció del net que cobreix la prestació d'atur (depèn d'haver cotitzat). */
export const PRESTACIO_ATUR_FRACCIO = 0.6

// --- Inversió en salut i formació (accions fixes de la vida adulta) ---

/** Cost anual (real, s'escala amb l'IPC) de cuidar la salut: gimnàs, revisions, bona alimentació. */
export const COST_SALUT_ANUAL = 1800
/** Punts de salut que recupera cada any qui hi inverteix (compensa part del declivi). */
export const SALUT_INVERSIO_DELTA = 5
/** Cost anual (real, s'escala amb l'IPC) de seguir formant-se al llarg de la vida. */
export const COST_FORMACIO_ANUAL = 2200
/** Increment anual de nivell acadèmic (0..1) per qui inverteix en formació contínua. */
export const FORMACIO_INVERSIO_DELTA = 0.05

// --- Rendiment anual de la inversió (fase de carrera) ---

/** Rendiment anual de la cartera d'inversió = MIN + aleatori·RANG (mitjana ≈ +6%, volàtil). */
export const INDEX_RENDIMENT_MIN = -0.1
export const INDEX_RENDIMENT_RANG = 0.32

// --- Universitat i cost de vida adult ---

/**
 * Cost de vida anual a la fase adulta (supermercat + subministraments): el dia a dia.
 * Valor fix per nivell de vida que tria el jugador (mínim / mig / alt).
 */
export const COST_VIDA_NIVELLS: Record<NivellVida, number> = {
  minim: 6_000, // 500 €/mes
  mig: 8_400, // 700 €/mes
  alt: 9_600, // 800 €/mes
}
/** Nivell de vida per defecte en entrar a la vida adulta. */
export const NIVELL_VIDA_DEFAULT: NivellVida = 'mig'

/** Cost anual de matrícula i material universitari. */
export const MATRICULA_ANUAL = 2000

// --- Habitatge (a partir dels 18) ---

/** Lloguer anual d'una habitació en un pis compartit. */
export const LLOGUER_HABITACIO_ANUAL = 4200
/** Lloguer anual d'un pis sencer. */
export const LLOGUER_PIS_ANUAL = 10800
/** Nombre d'ofertes de lloguer que apareixen cada any al mercat. */
export const LLOGUER_OFERTES_PER_ANY = 3

/** Entrada mínima per comprar un habitatge (fracció del preu). */
export const ENTRADA_HIPOTECA = 0.2
/**
 * Despeses de compra (fracció del preu), a banda de l'entrada i pagades també al comptat:
 * impost de transmissions/IVA (~10%), notaria, registre, gestoria, tassació i comissió. És el
 * sobrecost real que fa que comprar exigeixi molt més que l'entrada nominal.
 */
export const DESPESES_COMPRA = 0.12
/** En parella, la fracció de l'entrada + despeses que paga cadascú (l'altra meitat, la parella). */
export const FRACCIO_ENTRADA_PARELLA = 0.5
/** Interès anual de la hipoteca. */
export const INTERES_HIPOTECA = 0.03
/** Terminis d'hipoteca oferts (anys). */
export const TERMINIS_HIPOTECA = [20, 30]
/** El banc concedeix la hipoteca si la quota anual no supera aquesta fracció de l'ingrés. */
export const RATI_ENDEUTAMENT_MAX = 0.4
/** Revaloració anual mitjana de l'habitatge en propietat. */
export const REVALORACIO_HABITATGE = 0.02

// --- IPC (inflació) ---

/** Índex de preus al consum inicial (base 100 al naixement). Creix any rere any. */
export const IPC_INICIAL = 100
/**
 * Inflació anual mínima i màxima (es sorteja dins d'aquesta banda cada any). El mínim és
 * NEGATIU: alguns anys hi ha deflació (els preus baixen). Tot i així la mitjana és positiva
 * (~+2%), així que la tendència en finestres de 10-20 anys sempre és a l'alça.
 */
export const IPC_INFLACIO_MIN = -0.01
export const IPC_INFLACIO_MAX = 0.05

// --- Índex del preu de l'habitatge (lloguer i compra) ---
// L'habitatge NO segueix l'IPC: té el seu propi índex, que a llarg termini creix MÉS de pressa
// (l'habitatge s'encareix per damunt dels preus de consum → la crisi de l'accés a l'habitatge).
/** Índex de l'habitatge inicial (base 100 al naixement). */
export const INDEX_HABITATGE_INICIAL = 100
/** Variació anual mínima i màxima del preu de l'habitatge (mitjana ~+3,5%, per sobre de l'IPC). */
export const HABITATGE_VAR_MIN = -0.02
export const HABITATGE_VAR_MAX = 0.09
