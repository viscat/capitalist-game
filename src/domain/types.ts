// Model de domini del joc. Tot aquest mòdul és pur (sense React) perquè la
// lògica es pugui reutilitzar en altres entorns (mòbil, backend, tests).

export type FamilyClass =
  | 'pobra'
  | 'treballadora'
  | 'mitjana'
  | 'alta'
  | 'rica'
  | 'super_rica'

// Infància (torns anuals) i adolescència/ESO (torns estacionals). El motor està
// pensat per encaixar fases futures (estudis, vida adulta...) sense reescriure.
export type LifeStage = 'infancia' | 'adolescencia'

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
}

export interface EventChoice {
  id: string
  /** Clau i18n de l'etiqueta de l'opció. */
  labelKey: string
  effect: EventEffect
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
  historial: LogEntry[]
  acabat: boolean
}
