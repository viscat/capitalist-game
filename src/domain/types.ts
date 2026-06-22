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
// pressupost). Als 18, vida adulta: universitat (anual) o carrera (anual, amb
// inversions). El motor està pensat per encaixar fases futures sense reescriure.
export type LifeStage =
  | 'infancia'
  | 'adolescencia'
  | 'estudis_post'
  | 'laboral'
  | 'universitat'
  | 'carrera'

/** Itinerari triat al fork dels 16 anys. */
export type Itinerari = 'batxillerat' | 'grau_mig' | 'treball' | 'nini'

/** Nivell de vida (cost del dia a dia) que tria la persona a la fase adulta. */
export type NivellVida = 'minim' | 'mig' | 'alt'

/** Qualitat d'una oferta de feina (determina sou i to). */
export type QualitatOferta = 'precaria' | 'estandard' | 'bona'

/**
 * Oferta de feina que apareix mentre es busca feina a la vida adulta. El sou és
 * BRUT mensual (com `salari`). Objecte pla i serialitzable (autosave).
 */
export interface OfertaFeina {
  /** Id estable dins del lot d'ofertes (p. ex. "of0"). */
  id: string
  /** Sou BRUT mensual que ofereix. */
  sou: number
  qualitat: QualitatOferta
}

/** Fites de la vida que obren una pantalla de decisió. */
export type MilestoneId =
  | 'institut'
  | 'postobligatori'
  | 'majoria'
  | 'fi_uni'

/** Pressupost mensual de la fase laboral (imports en €). El sobrant va a efectiu. */
export interface Budget {
  oci: number
  compres: number
  casa: number
  estalvi: number
}

/**
 * Pla d'estalvi i inversió ANUAL de la fase de carrera (imports en €/any). De
 * l'ingrés net anual, primer es paga el cost de vida (obligatori) i la resta es
 * reparteix entre aquestes partides; el sobrant queda a efectiu.
 */
export interface PlaInversio {
  /** Despesa discrecional (oci/vida): és el que dóna o treu benestar. */
  oci: number
  /** A compte d'estalvi: líquid i segur, però amb rendiment ~nul. */
  estalvi: number
  /** Fons indexat: més rendiment esperat però volàtil (puja i baixa). */
  fonsIndexat: number
  /** Pla de pensions: rendiment estable i desgravació fiscal, però bloquejat. */
  fonsPensions: number
}

/** On viu la persona adulta. */
export type TipusHabitatge =
  | 'amb_pares'
  | 'habitacio'
  | 'pis_lloguer'
  | 'propietat'

/** Hipoteca viva d'un habitatge en propietat. */
export interface Hipoteca {
  /** Deute pendent (capital). */
  deute: number
  /** Quota anual a pagar. */
  quotaAnual: number
  /** Anys que falten per acabar de pagar. */
  anysRestants: number
}

/** Situació d'habitatge de la persona adulta (a partir dels 18). */
export interface Habitatge {
  tipus: TipusHabitatge
  /** Lloguer anual (habitació o pis de lloguer). */
  lloguerAnual?: number
  /** Hipoteca viva (si és en propietat i no s'ha pagat al comptat). */
  hipoteca?: Hipoteca
}

export interface Stats {
  /** Benestar global 0..100 (condensa felicitat / angoixa / tranquil·litat). */
  benestar: number
}

export interface Patrimoni {
  efectiu: number
  estalvi: number
  /** Inversions genèriques (heretat; rendiment moderat). */
  inversions: number
  /** Fons indexat: alt rendiment esperat, volàtil, líquid. */
  fonsIndexat: number
  /** Pla de pensions: rendiment estable, desgravació, bloquejat fins a la jubilació. */
  fonsPensions: number
  /** Valor de cada casa en propietat. */
  cases: number[]
}

export interface Progenitor {
  nom: string
  cognoms: string
}

/** Identitat personalitzable de la persona i els seus pares. */
export interface Identitat {
  nom: string
  cognoms: string
  pare: Progenitor
  mare: Progenitor
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
  fonsIndexat?: number
  fonsPensions?: number
  /** Xoc de mercat: variació percentual aplicada al fons indexat (p. ex. -0.3 = -30%). */
  mercatPct?: number
  /** Canvi persistent del sou mensual (fase laboral). */
  salariDelta?: number
  /** Fixa el sou mensual a aquest valor (0 = perdre la feina, o sou d'una nova feina). */
  salariNou?: number
  /** Despesa gran subjecta al matalàs familiar (separada d'`efectiu`). */
  despesaGreu?: number
  /** Marca que aquest efecte és una pujada de sou demanada (cooldown anual). */
  marcaAugmentSou?: boolean
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
  /** Identitat personalitzada (nom de la persona i dels pares). */
  identitat?: Identitat
  /** Data de naixement (ISO `YYYY-MM-DD`); per defecte, el dia que comença la partida. */
  dataNaixement?: string
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
  /** Pla d'estalvi i inversió anual actiu (fase de carrera). */
  plaInversio?: PlaInversio
  /** Nivell de vida triat (cost del dia a dia) a la fase adulta. Per defecte, mitjà. */
  nivellVida?: NivellVida
  /** Situació d'habitatge (a partir dels 18). Per defecte, viure amb els pares. */
  habitatge?: Habitatge
  /** Marca si la persona té un títol universitari (premi de sou a la carrera). */
  teDiploma?: boolean
  /** Sou mensual actual (treball). 0 amb itinerari 'treball' = a l'atur. */
  salari?: number
  /** Sou de referència d'aquesta partida (per a reincorporacions). */
  salariBase?: number
  /** Edat (mesos) en què es va demanar l'últim augment (cooldown anual). */
  ultimAugmentMes?: number
  /** Anys de feina acumulats (sou > 0). Millora l'ocupabilitat i el sou de partida. */
  anysExperiencia?: number
  /** Ofertes de feina actives mentre es busca feina a la carrera (sou 0 = a l'atur). */
  ofertesFeina?: OfertaFeina[]
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
