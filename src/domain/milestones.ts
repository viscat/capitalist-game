import type { Itinerari, LifeStage, MilestoneId } from './types'

export interface MilestoneOption {
  id: string
  labelKey: string
  descKey: string
  lifeStage: LifeStage
  itinerari?: Itinerari
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
}
