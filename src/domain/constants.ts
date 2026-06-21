// Constants de joc.

export const BENESTAR_MIN = 0
export const BENESTAR_MAX = 100

export const MESOS_PER_ANY = 12

/** Durada d'un torn estacional (un trimestre). */
export const MESOS_PER_ESTACIO = 3

/** Edat (en anys) a la qual la infància dóna pas a l'adolescència (institut). */
export const EDAT_FI_INFANCIA = 12

/** Edat (en anys) a la qual acaba l'ESO i arriba el fork estudiar/treballar. */
export const EDAT_FI_ADOLESCENCIA = 16

/** Edat (en anys) a la qual acaba la fase postobligatòria (16→18). */
export const EDAT_FI_POSTOBLIGATORI = 18

/** Edat (en anys) a la qual s'acaba la carrera universitària (18→22). */
export const EDAT_FI_UNIVERSITAT = 22

/** Edat (en anys) a la qual acaba aquesta iteració de la vida adulta. */
export const EDAT_FI_CARRERA = 35

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

// --- Rendiments anuals de la inversió (fase de carrera) ---

/** Rendiment anual del compte d'estalvi (gairebé nul: la inflació se'l menja). */
export const RENDIMENT_ESTALVI = 0.0

/** Rendiment anual mitjà de les inversions genèriques. */
export const RENDIMENT_INVERSIONS = 0.03

/** Rendiment anual del pla de pensions: estable i baix. */
export const RENDIMENT_PENSIONS = 0.04

/** Rendiment anual del fons indexat = MIN + aleatori·RANG (mitjana ≈ +6%, volàtil). */
export const INDEX_RENDIMENT_MIN = -0.1
export const INDEX_RENDIMENT_RANG = 0.32

/** Desgravació fiscal de l'aportació anual al pla de pensions (es retorna a efectiu). */
export const DESGRAVACIO_PENSIONS = 0.2
/** Aportació anual al pla de pensions amb dret a desgravació (límit legal aproximat). */
export const LIMIT_DESGRAVACIO_PENSIONS = 1500

// --- Universitat i cost de vida adult ---

/** Cost de vida anual a la fase de carrera: base + fracció de l'ingrés (estil de vida). */
export const COST_VIDA_BASE = 8000
export const COST_VIDA_FACTOR = 0.2

/** Cost anual de matrícula i material universitari. */
export const MATRICULA_ANUAL = 2000

// --- Habitatge (a partir dels 18) ---

/** Lloguer anual d'una habitació en un pis compartit. */
export const LLOGUER_HABITACIO_ANUAL = 4200
/** Lloguer anual d'un pis sencer. */
export const LLOGUER_PIS_ANUAL = 10800

/** Entrada mínima per comprar un habitatge (fracció del preu). */
export const ENTRADA_HIPOTECA = 0.2
/** Interès anual de la hipoteca. */
export const INTERES_HIPOTECA = 0.03
/** Terminis d'hipoteca oferts (anys). */
export const TERMINIS_HIPOTECA = [20, 30]
/** El banc concedeix la hipoteca si la quota anual no supera aquesta fracció de l'ingrés. */
export const RATI_ENDEUTAMENT_MAX = 0.4
/** Revaloració anual mitjana de l'habitatge en propietat. */
export const REVALORACIO_HABITATGE = 0.02
