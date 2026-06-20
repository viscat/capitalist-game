// Model de domini del joc. Tot aquest mòdul és pur (sense React) perquè la
// lògica es pugui reutilitzar en altres entorns (mòbil, backend, tests).

export type FamilyClass =
  | 'pobra'
  | 'treballadora'
  | 'mitjana'
  | 'alta'
  | 'rica'
  | 'super_rica'

// Fases de la vida. Infància (anual) i adolescència/ESO (trimestral); als 16
// es ramifica en estudis postobligatoris (trimestral) o feina/nini (mensual, amb
// pressupost). El motor està pensat per encaixar fases futures sense reescriure.
export type LifeStage =
  | 'infancia'
  | 'adolescencia'
  | 'estudis_post'
  | 'laboral'

/** Itinerari triat al fork dels 16 anys. */
export type Itinerari = 'batxillerat' | 'grau_mig' | 'treball' | 'nini'

/** Fites de la vida que obren una pantalla de decisió. */
export type MilestoneId = 'institut' | 'postobligatori'

/** Pressupost mensual de la fase laboral (imports en €). El sobrant va a efectiu. */
export interface Budget {
  oci: number
  compres: number
  casa: number
  estalvi: number
}

export interface Stats {
  /** Benestar global 0..100 (condensa felicitat / angoixa / tranquil·litat). */
  benestar: number
}

export interface Patrimoni {
  efectiu: number
  estalvi: number
  inversions: number
  /** Valor de cada casa en propietat. */
  cases: number[]
}

export interface Familia {
  classe: FamilyClass
  /** Patrimoni net de la llar. */
  patrimoni: number
  /** Ingressos nets mensuals de la llar. */
  ingressosMensuals: number
  /** Hores de feina setmanals (mitjana dels progenitors). */
  horesFeina: number
  /** Hores setmanals que els progenitors dediquen a cuidar la criatura. */
  horesCura: number
  /** Tenen algú contractat per cuidar la criatura. */
  cuidadorContractat: boolean
}

export interface Person {
  edatMesos: number
  stats: Stats
  patrimoni: Patrimoni
}

export type EventCategory =
  | 'familia'
  | 'economia'
  | 'regal'
  | 'salut'
  | 'escola'

/** Deltes que un esdeveniment aplica a stats i/o patrimoni. */
export interface EventEffect {
  benestar?: number
  efectiu?: number
  estalvi?: number
  inversions?: number
  /** Canvi persistent del sou mensual (fase laboral). */
  salariDelta?: number
  /** Fixa el sou mensual a aquest valor (0 = perdre la feina, o sou d'una nova feina). */
  salariNou?: number
  /** Despesa gran subjecta al matalàs familiar (separada d'`efectiu`). */
  despesaGreu?: number
}

export interface EventChoice {
  id: string
  /** Clau i18n de l'etiqueta de l'opció. */
  labelKey: string
  effect: EventEffect
  /** Efecte calculat segons l'estat (preval sobre `effect`). */
  resolve?: (state: GameState) => EventEffect
}

export interface GameEvent {
  id: string
  category: EventCategory
  titleKey: string
  descKey: string
  /** Valors per interpolar al text (p. ex. { amount: 50 }). */
  params?: Record<string, number>
  /** Pes base per a la selecció ponderada; pot dependre del context familiar. */
  weight: (familia: Familia) => number
  /** Efecte immediat (si no hi ha opcions). */
  effect?: EventEffect
  /** Efecte immediat calculat segons l'estat (preval sobre `effect`). */
  resolve?: (state: GameState) => EventEffect
  /** Si hi ha opcions, el jugador ha de triar abans de continuar. */
  choices?: EventChoice[]
}

/**
 * Acció proactiva que el jugador tria a l'inici d'un torn (adolescència). A
 * diferència dels esdeveniments (reactius), és una decisió voluntària amb cost i
 * efecte coneguts.
 */
export interface GameAction {
  id: string
  category: EventCategory
  labelKey: string
  descKey: string
  effect: EventEffect
  /** Disponible només si es compleix la condició de context (p. ex. estiu). */
  available?: (state: GameState) => boolean
  /** Motiu (clau i18n) que s'ensenya quan `available` falla. */
  lockedReasonKey?: string
}

/** Entrada de l'historial: què ha passat en un torn i quin efecte ha tingut. */
export interface LogEntry {
  torn: number
  edatAnys: number
  eventId: string
  titleKey: string
  descKey: string
  params?: Record<string, number>
  category: EventCategory
  /** Distingeix una acció voluntària del jugador d'un esdeveniment reactiu. */
  kind?: 'event' | 'action'
  /** Etiqueta de l'opció escollida, si l'esdeveniment en tenia. */
  choiceLabelKey?: string
  /** Efecte realment aplicat. */
  effect: EventEffect
  /** Diners que la família ha cobert d'una despesa greu. */
  donacio?: number
  /** Part d'una despesa greu que ningú ha pogut cobrir. */
  descobert?: number
}

export interface GameState {
  /** Torn actual. Torn 0 = naixement. */
  torn: number
  lifeStage: LifeStage
  person: Person
  familia: Familia
  /** Estat del generador pseudoaleatori (serialitzable). */
  rngState: number
  /** Id de l'últim esdeveniment, per evitar repeticions immediates. */
  ultimEventId?: string
  /** Esdeveniment pendent d'una decisió del jugador (bloqueja el següent torn). */
  pendingEvent?: GameEvent
  /** Fita pendent: la UI mostra la pantalla de decisió corresponent. */
  pendingMilestone?: MilestoneId
  /** Itinerari triat als 16 (fases estudis_post / laboral). */
  itinerari?: Itinerari
  /** Pressupost mensual actiu (fase laboral). */
  pressupost?: Budget
  /** Sou mensual actual (treball). 0 amb itinerari 'treball' = a l'atur. */
  salari?: number
  /** Sou de referència d'aquesta partida (per a reincorporacions). */
  salariBase?: number
  historial: LogEntry[]
  acabat: boolean
}

/** Una acció amb el seu estat de disponibilitat per a la UI. */
export interface ActionOption {
  action: GameAction
  disabled: boolean
  /** Clau i18n del motiu pel qual està deshabilitada. */
  reasonKey?: string
}
