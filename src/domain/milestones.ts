import type { EventEffect, Itinerari, LifeStage, MilestoneId } from './types'

export interface MilestoneOption {
  id: string
  labelKey: string
  descKey: string
  lifeStage: LifeStage
  itinerari?: Itinerari
  /** En entrar a la carrera: marca si la persona té títol universitari (premi de sou). */
  teDiploma?: boolean
  /**
   * Efecte que aplica l'opció (fites de mitja carrera 40/50/60: no canvien de fase, sinó que
   * apliquen un *trade-off* sobre sou/benestar/vincles/salut). El motor el resol a
   * `applyMilestoneChoice` com un `EventEffect` qualsevol.
   */
  effect?: EventEffect
}

export interface MilestoneDef {
  id: MilestoneId
  kickerKey: string
  titleKey: string
  summaryTitleKey: string
  /** Prefix de les claus narratives del resum (`<prefix>.<tram>`). */
  summaryPrefix: string
  loreTitleKey: string
  loreKeys: string[]
  options: MilestoneOption[]
}

// Definicions de les fites que obren una pantalla de decisió. El resum (benestar,
// patrimoni, frase narrativa) és genèric i el comparteix la `MilestoneScreen`;
// aquí només hi ha el text propi de la fita i les opcions.
export const MILESTONES: Record<MilestoneId, MilestoneDef> = {
  institut: {
    id: 'institut',
    kickerKey: 'transition.kicker',
    titleKey: 'transition.title',
    summaryTitleKey: 'transition.summaryTitle',
    summaryPrefix: 'transition.summary',
    loreTitleKey: 'transition.loreTitle',
    loreKeys: ['transition.lore1', 'transition.lore2'],
    options: [
      {
        id: 'continuar',
        labelKey: 'transition.continue',
        descKey: '',
        lifeStage: 'adolescencia',
      },
    ],
  },
  postobligatori: {
    id: 'postobligatori',
    kickerKey: 'milestone.post.kicker',
    titleKey: 'milestone.post.title',
    summaryTitleKey: 'milestone.post.summaryTitle',
    summaryPrefix: 'milestone.post.summary',
    loreTitleKey: 'milestone.post.loreTitle',
    loreKeys: ['milestone.post.lore1', 'milestone.post.lore2'],
    options: [
      {
        id: 'batxillerat',
        labelKey: 'itinerari.batxillerat.label',
        descKey: 'itinerari.batxillerat.desc',
        lifeStage: 'estudis_post',
        itinerari: 'batxillerat',
      },
      {
        id: 'grau_mig',
        labelKey: 'itinerari.grau_mig.label',
        descKey: 'itinerari.grau_mig.desc',
        lifeStage: 'estudis_post',
        itinerari: 'grau_mig',
      },
      {
        id: 'treball',
        labelKey: 'itinerari.treball.label',
        descKey: 'itinerari.treball.desc',
        lifeStage: 'laboral',
        itinerari: 'treball',
      },
      {
        id: 'nini',
        labelKey: 'itinerari.nini.label',
        descKey: 'itinerari.nini.desc',
        lifeStage: 'laboral',
        itinerari: 'nini',
      },
    ],
  },
  majoria: {
    id: 'majoria',
    kickerKey: 'milestone.majoria.kicker',
    titleKey: 'milestone.majoria.title',
    summaryTitleKey: 'milestone.majoria.summaryTitle',
    summaryPrefix: 'milestone.majoria.summary',
    loreTitleKey: 'milestone.majoria.loreTitle',
    loreKeys: ['milestone.majoria.lore1', 'milestone.majoria.lore2'],
    options: [
      {
        id: 'universitat',
        labelKey: 'cami.universitat.label',
        descKey: 'cami.universitat.desc',
        lifeStage: 'universitat',
      },
      {
        id: 'carrera',
        labelKey: 'cami.carrera.label',
        descKey: 'cami.carrera.desc',
        lifeStage: 'carrera',
        teDiploma: false,
      },
    ],
  },
  fi_uni: {
    id: 'fi_uni',
    kickerKey: 'milestone.fi_uni.kicker',
    titleKey: 'milestone.fi_uni.title',
    summaryTitleKey: 'milestone.fi_uni.summaryTitle',
    summaryPrefix: 'milestone.fi_uni.summary',
    loreTitleKey: 'milestone.fi_uni.loreTitle',
    loreKeys: ['milestone.fi_uni.lore1', 'milestone.fi_uni.lore2'],
    options: [
      {
        id: 'comencar_carrera',
        labelKey: 'cami.carrera_titulat.label',
        descKey: 'cami.carrera_titulat.desc',
        lifeStage: 'carrera',
        teDiploma: true,
      },
    ],
  },
  // --- Fites de mitja carrera (40/50/60): no canvien de fase (segueix `carrera`), apliquen
  // un trade-off que influeix el benestar i la preparació per a la jubilació. ---
  cruilla_40: {
    id: 'cruilla_40',
    kickerKey: 'milestone.cruilla_40.kicker',
    titleKey: 'milestone.cruilla_40.title',
    summaryTitleKey: 'milestone.cruilla_40.summaryTitle',
    summaryPrefix: 'milestone.cruilla_40.summary',
    loreTitleKey: 'milestone.cruilla_40.loreTitle',
    loreKeys: ['milestone.cruilla_40.lore1', 'milestone.cruilla_40.lore2'],
    options: [
      {
        id: 'premer',
        labelKey: 'milestone.cruilla_40.premer.label',
        descKey: 'milestone.cruilla_40.premer.desc',
        lifeStage: 'carrera',
        effect: { salariDelta: 250, benestar: -5 },
      },
      {
        id: 'conciliar',
        labelKey: 'milestone.cruilla_40.conciliar.label',
        descKey: 'milestone.cruilla_40.conciliar.desc',
        lifeStage: 'carrera',
        effect: { salariDelta: -150, benestar: 6, vinclesDelta: 0.12 },
      },
    ],
  },
  revisio_50: {
    id: 'revisio_50',
    kickerKey: 'milestone.revisio_50.kicker',
    titleKey: 'milestone.revisio_50.title',
    summaryTitleKey: 'milestone.revisio_50.summaryTitle',
    summaryPrefix: 'milestone.revisio_50.summary',
    loreTitleKey: 'milestone.revisio_50.loreTitle',
    loreKeys: ['milestone.revisio_50.lore1', 'milestone.revisio_50.lore2'],
    options: [
      {
        id: 'aguantar',
        labelKey: 'milestone.revisio_50.aguantar.label',
        descKey: 'milestone.revisio_50.aguantar.desc',
        lifeStage: 'carrera',
        effect: { salariDelta: 150, salutCronicaDelta: 5, benestar: -4 },
      },
      {
        id: 'cuidar_se',
        labelKey: 'milestone.revisio_50.cuidar_se.label',
        descKey: 'milestone.revisio_50.cuidar_se.desc',
        lifeStage: 'carrera',
        effect: { salariDelta: -200, benestar: 6, vinclesDelta: 0.1 },
      },
    ],
  },
  recta_60: {
    id: 'recta_60',
    kickerKey: 'milestone.recta_60.kicker',
    titleKey: 'milestone.recta_60.title',
    summaryTitleKey: 'milestone.recta_60.summaryTitle',
    summaryPrefix: 'milestone.recta_60.summary',
    loreTitleKey: 'milestone.recta_60.loreTitle',
    loreKeys: ['milestone.recta_60.lore1', 'milestone.recta_60.lore2'],
    options: [
      {
        id: 'seguir_fort',
        labelKey: 'milestone.recta_60.seguir_fort.label',
        descKey: 'milestone.recta_60.seguir_fort.desc',
        lifeStage: 'carrera',
        effect: { salariDelta: 100, salutCronicaDelta: 3, benestar: -3 },
      },
      {
        id: 'desaccelerar',
        labelKey: 'milestone.recta_60.desaccelerar.label',
        descKey: 'milestone.recta_60.desaccelerar.desc',
        lifeStage: 'carrera',
        effect: { salariDelta: -250, benestar: 5, vinclesDelta: 0.12 },
      },
    ],
  },
  // Jubilació als 67: deixes de treballar i passes a viure de la pensió i els estalvis. La
  // vida continua (fins a la mort), no s'acaba la partida.
  jubilacio: {
    id: 'jubilacio',
    kickerKey: 'milestone.jubilacio.kicker',
    titleKey: 'milestone.jubilacio.title',
    summaryTitleKey: 'milestone.jubilacio.summaryTitle',
    summaryPrefix: 'milestone.jubilacio.summary',
    loreTitleKey: 'milestone.jubilacio.loreTitle',
    loreKeys: ['milestone.jubilacio.lore1', 'milestone.jubilacio.lore2'],
    options: [
      {
        id: 'jubilar',
        labelKey: 'milestone.jubilacio.jubilar.label',
        descKey: 'milestone.jubilacio.jubilar.desc',
        lifeStage: 'jubilacio',
      },
    ],
  },
}
