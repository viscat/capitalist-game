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
  // Jubilació (67 → mort): es viu de la pensió i els estalvis; ja no hi ha sou ni feina.
  | 'jubilacio'

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

/**
 * Oferta de lloguer del mercat (es regenera cada any): una habitació o un pis sencer amb un
 * preu concret. Objecte pla i serialitzable (autosave). Trobar lloguer barat és qüestió de sort.
 */
export interface OfertaLloguer {
  /** Id estable dins del lot d'ofertes (p. ex. "ll0"). */
  id: string
  tipus: 'habitacio' | 'pis_lloguer'
  /** Lloguer anual concret d'aquesta oferta. */
  lloguerAnual: number
}

/** Fites de la vida que obren una pantalla de decisió. */
export type MilestoneId =
  | 'institut'
  | 'postobligatori'
  | 'majoria'
  | 'fi_uni'
  // Fites de mitja carrera (no canvien de fase: mantenen `carrera` i apliquen un efecte).
  | 'cruilla_40'
  | 'revisio_50'
  | 'recta_60'
  // Jubilació als 67: transició de `carrera` a `jubilacio` (la vida continua fins a la mort).
  | 'jubilacio'

/** Pressupost mensual de la fase laboral (imports en €). El sobrant va a efectiu. */
export interface Budget {
  oci: number
  compres: number
  casa: number
}

/**
 * Pla d'estalvi i inversió ANUAL de la fase de carrera (imports en €/any). De
 * l'ingrés net anual, primer es paga el cost de vida (obligatori) i la resta es
 * reparteix entre aquestes partides; el sobrant queda a efectiu.
 */
export interface PlaInversio {
  /** Despesa discrecional (oci/vida): és el que dóna o treu benestar. */
  oci: number
  /**
   * Inversió: el que destines a fer créixer el patrimoni. Rendiment esperat alt però VOLÀTIL
   * (puja i baixa amb el mercat). És l'únic vehicle d'estalvi/inversió del joc (no hi ha ni
   * compte d'estalvi ni pla de pensions: el missatge és invertir a llarg termini i aguantar).
   */
  inversions: number
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
  /**
   * Salut global 0..100. Es degrada amb l'edat, amb el benestar baix (estrès, ansietat) i
   * amb els esdeveniments de salut (malalties, tractaments no pagats…). Quan arriba a 0, la
   * persona mor (substitueix la mort per benestar 0). Comença a 100 (sa de naixement).
   */
  salut: number
}

export interface Patrimoni {
  /** Diners líquids disponibles (caixa). */
  efectiu: number
  /**
   * Cartera d'inversió: l'únic vehicle per fer créixer els diners. Líquid (es pot vendre per
   * comprar o cobrir dèficits) i volàtil (rendiment de mercat, pot baixar). Substitueix els
   * antics conceptes de compte d'estalvi, fons indexat i pla de pensions.
   */
  inversions: number
  /** Valor de cada casa en propietat. */
  cases: number[]
  /**
   * Deute de consum pendent (import positiu del que es deu). A diferència dels altres
   * comptes (que mai són negatius), aquesta línia modela el saldo deutor que compon i
   * resta del patrimoni net. Absent o 0 = sense deute.
   */
  deute?: number
}

export interface Progenitor {
  nom: string
  cognoms: string
}

/** Gènere de la persona (eix de desigualtat: bretxa salarial, càrrega de cures). */
export type Genere = 'dona' | 'home' | 'no_binari'

/**
 * Origen percebut (eix de desigualtat ortogonal a la classe): condiciona l'accés al
 * mercat laboral i de l'habitatge per discriminació. `autocton` = sense penalització;
 * `migrant` = origen migrant/racialitzat amb barreres documentades.
 */
export type Origen = 'autocton' | 'migrant'

/** Identitat personalitzable de la persona i els seus pares. */
export interface Identitat {
  nom: string
  cognoms: string
  pare: Progenitor
  mare: Progenitor
  /** Gènere de la persona (per defecte, no s'aplica cap bretxa si absent). */
  genere?: Genere
  /** Origen percebut (per defecte, autòcton: sense penalització). */
  origen?: Origen
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
  /** Variació de la cartera d'inversió (estalvi/inversió de tota la vida). */
  inversions?: number
  /** Cases (valors) que s'hereten com a PROPIETAT (p. ex. l'herència del progenitor). */
  heretaCases?: number[]
  /** Xoc de mercat: variació percentual aplicada a la cartera d'inversió (p. ex. -0.3 = -30%). */
  mercatPct?: number
  /** Canvi persistent del sou mensual (fase laboral). */
  salariDelta?: number
  /** Fixa el sou mensual a aquest valor (0 = perdre la feina, o sou d'una nova feina). */
  salariNou?: number
  /** Despesa gran subjecta al matalàs familiar (separada d'`efectiu`). */
  despesaGreu?: number
  /** Marca que aquest efecte és una pujada de sou demanada (cooldown anual). */
  marcaAugmentSou?: boolean
  /**
   * Cop directe a la stat de salut (`Stats.salut`): malalties, estrès, ansietat, accidents.
   * Negatiu = empitjora la salut (acosta a la mort). Es clampa a 0..100 com el benestar.
   */
  salutDelta?: number
  /**
   * Penalització CRÒNICA i duradora de benestar (incapacitat, seqüela permanent):
   * s'acumula a `GameState.salutCronica` i rebaixa la referència de benestar adult de
   * manera persistent, a diferència del cop puntual de `benestar`.
   */
  salutCronicaDelta?: number
  /**
   * Variació dels vincles socials (0..1 a `GameState.vinclesSocials`): amistats, parella,
   * comunitat, sentit. Font de benestar NO monetària (P7); difícil de construir quan
   * s'està desbordat per la precarietat.
   */
  vinclesDelta?: number
  /**
   * Variació del nivell acadèmic (0..1 a `GameState.nivellAcademic`): esforç i rendiment a
   * la universitat. No dóna benestar immediat, però millora el sou de partida i
   * l'ocupabilitat en sortir.
   */
  academicDelta?: number
  /**
   * Herència EN VIDA: import que es transfereix als descendents ara (surt del teu patrimoni
   * líquid i s'acumula a `GameState.llegatEnVida`, lliure d'impost de successions). Ajuda els
   * fills i redueix el teu estate; quan continues amb un descendent, s'hi suma.
   */
  llegatEnVidaDelta?: number
  /** Marca que els pares han mort i ja s'ha rebut la seva herència (no torna a passar). */
  marcaHerenciaPares?: boolean
  /** Marca que s'estableix una parella estable (el motor li assigna un nom). */
  marcaParella?: boolean
  /** Perds l'habitatge de lloguer (desnonament, fi de contracte): tornes a casa els pares. */
  perdHabitatge?: boolean
  /**
   * Nombre de fills que afegeix aquest efecte (descendència): normalment 1. El motor
   * incrementa `GameState.fills` i registra l'edat (en mesos) del progenitor al naixement
   * a `GameState.fillsNaixement` per calcular els anys de criança (cost recurrent).
   */
  fillsDelta?: number
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
  /**
   * Cost de TEMPS de l'acció en setmanes (sobre un pressupost anual de `SETMANES_ANY`).
   * Permet triar diverses accions l'any fins que s'esgota el temps (o els diners).
   */
  setmanes?: number
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
  /**
   * Índex de preus al consum (IPC), base 100 al naixement; creix any rere any amb la inflació.
   * Encareix l'habitatge (preus de compra i lloguer) al llarg de la vida. Absent = 100.
   */
  ipc?: number
  /**
   * Índex del preu de l'habitatge (base 100 al naixement). Segueix el SEU propi camí, no l'IPC:
   * a llarg termini puja més de pressa (encareix lloguer i compra). Absent = 100.
   */
  indexHabitatge?: number
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
  /** Acció fixa: inverteix cada any en SALUT (recupera salut a canvi d'un cost anual). */
  inversioSalut?: boolean
  /** Acció fixa: inverteix cada any en FORMACIÓ (puja el nivell acadèmic a canvi d'un cost anual). */
  inversioFormacio?: boolean
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
  /** Ofertes de lloguer del mercat aquest any (es regeneren cada torn a les fases adultes). */
  ofertesLloguer?: OfertaLloguer[]
  /**
   * Penalització crònica de benestar acumulada (incapacitat, seqüeles permanents). Resta
   * de la referència de benestar adult de manera duradora. Absent o 0 = sense seqüeles.
   */
  salutCronica?: number
  /**
   * Vincles socials (0..1): amistats, parella, comunitat, sentit. Font de benestar NO
   * monetària (P7) que pot sostenir una vida plena amb poc patrimoni. Absent = 0.
   */
  vinclesSocials?: number
  /**
   * Nivell acadèmic (0..1): esforç/rendiment acumulat a la universitat. Millora el sou de
   * partida i l'ocupabilitat en entrar a la carrera. Absent = 0.
   */
  nivellAcademic?: number
  /**
   * El jugador ha triat explícitament una «vida senzilla» (frugalitat per elecció): viure
   * amb el mínim deixa de penalitzar el benestar (no és privació, és tria). Absent = false.
   */
  vidaSenzilla?: boolean
  /**
   * Instantànies anuals del patrimoni invertit (fase de carrera), per dibuixar-ne l'evolució
   * en un gràfic. Una entrada per any viscut a la carrera.
   */
  patrimoniHist?: PatrimoniSnapshot[]
  /**
   * Història de vida: una instantània per any de benestar, salut i patrimoni net. Serveix per
   * dibuixar l'evolució d'aquests indicadors al resum final (quan la persona mor).
   */
  vidaHist?: VidaSnapshot[]
  historial: LogEntry[]
  acabat: boolean
  /**
   * La partida ha acabat per MORT: la `salut` ha arribat a 0 (per edat, malalties, estrès o
   * tractaments no pagats acumulats). Pot passar a qualsevol edat; a diferència del final per
   * jubilació (67), és una vida truncada. Substitueix l'antiga "espiral" per benestar 0.
   */
  mort?: boolean
  /**
   * La persona està JUBILADA (≥67): viu de la pensió i els estalvis, ja no treballa. La
   * partida NO acaba aquí (continua fins a la mort). Absent = false.
   */
  jubilat?: boolean
  /** Generació de la dinastia (1 = protagonista inicial; 2+ = descendents continuats). */
  generacio?: number
  /**
   * Herència de dinastia PENDENT de rebre: quan continues amb un descendent, no reps
   * l'herència al néixer, sinó a l'edat que tenies quan el teu progenitor (la generació
   * anterior) va morir. `import` = capital a rebre; `edat` = anys del fill en aquell moment.
   */
  herenciaPendent?: {
    /** Capital líquid a rebre (efectiu/inversions, net de successions). */
    import: number
    /** Cases (valors) que s'hereten com a PROPIETAT en aquell moment. */
    cases?: number[]
    /** Anys del fill quan el rep (= edat que tenia quan el progenitor va morir). */
    edat: number
  }
  /**
   * Patrimoni transferit als descendents EN VIDA (herència anticipada, lliure de successions).
   * Es reparteix entre els fills quan es continua amb un descendent. Absent = 0.
   */
  llegatEnVida?: number
  /**
   * Selecció d'accions de les fases joves (adolescència / estudis post), recordada ENTRE anys
   * perquè el jugador no l'hagi de repetir cada any. Mapa d'id d'acció → quantitat triada.
   */
  accionsSeleccio?: Record<string, number>
  /** Els pares ja han mort i s'ha rebut l'herència (perquè no es repeteixi). Absent = false. */
  herenciaParesRebuda?: boolean
  /**
   * Parella estable (amb nom). Cal tenir-ne per poder tenir fills; quan es viu en parella, el
   * cost de vida i l'habitatge es comparteixen. Absent = sense parella.
   */
  parella?: { nom: string }
  /** Nombre de fills tinguts (descendència). Absent = 0. */
  fills?: number
  /** Nom de cada fill (paral·lel a `fillsNaixement`). */
  fillsNoms?: string[]
  /**
   * Edat (en mesos) del progenitor al naixement de cada fill. Permet saber quants fills són
   * encara dependents (criança) i, per tant, el cost recurrent anual. Una entrada per fill.
   */
  fillsNaixement?: number[]
}

/** Instantània anual del patrimoni invertit (per al gràfic de rendiment). */
export interface PatrimoniSnapshot {
  edat: number
  /** Valor actual de la cartera d'inversió. */
  inversions: number
  /**
   * Suma ACUMULADA de les aportacions fetes a la cartera (el que has posat de la teva butxaca,
   * sense rendiments). Comparada amb el valor actual fa visible quant ha crescut pel rendiment.
   */
  aportat: number
}

/** Instantània anual de la vida (per als gràfics d'evolució del resum final). */
export interface VidaSnapshot {
  edat: number
  benestar: number
  salut: number
  /** Patrimoni net (pot ser negatiu si hi ha deute). */
  net: number
  /** Índex de preus (IPC) en aquell any (base 100 al naixement). */
  ipc?: number
}

/** Una acció amb el seu estat de disponibilitat per a la UI. */
export interface ActionOption {
  action: GameAction
  disabled: boolean
  /** Clau i18n del motiu pel qual està deshabilitada. */
  reasonKey?: string
}
