import type { GameEvent } from '../types'

// Esdeveniments mensuals de la fase laboral (16-18). Es trien segons l'itinerari:
// els de feina per a 'treball' i els d'inactivitat per a 'nini'.
export const TREBALL_EVENTS: GameEvent[] = [
  {
    id: 'pujada_sou',
    category: 'economia',
    titleKey: 'event.pujada_sou.title',
    descKey: 'event.pujada_sou.desc',
    weight: () => 1,
    effect: { efectiu: 120, benestar: 5 },
  },
  {
    id: 'paga_extra',
    category: 'economia',
    titleKey: 'event.paga_extra.title',
    descKey: 'event.paga_extra.desc',
    params: { amount: 200 },
    weight: () => 1.2,
    effect: { efectiu: 200, benestar: 4 },
  },
  {
    id: 'hores_extra',
    category: 'economia',
    titleKey: 'event.hores_extra.title',
    descKey: 'event.hores_extra.desc',
    params: { amount: 150 },
    weight: () => 1.5,
    choices: [
      {
        id: 'acceptar',
        labelKey: 'event.hores_extra.choice.acceptar',
        effect: { efectiu: 150, benestar: -4 },
      },
      {
        id: 'rebutjar',
        labelKey: 'event.hores_extra.choice.rebutjar',
        effect: { benestar: 1 },
      },
    ],
  },
  {
    id: 'conflicte_cap',
    category: 'economia',
    titleKey: 'event.conflicte_cap.title',
    descKey: 'event.conflicte_cap.desc',
    weight: () => 1.5,
    effect: { benestar: -6 },
  },
  {
    id: 'feina_dura',
    category: 'salut',
    titleKey: 'event.feina_dura.title',
    descKey: 'event.feina_dura.desc',
    weight: () => 1.5,
    effect: { benestar: -4 },
  },
  {
    id: 'companys_feina',
    category: 'escola',
    titleKey: 'event.companys_feina.title',
    descKey: 'event.companys_feina.desc',
    weight: () => 1.5,
    effect: { benestar: 5 },
  },
]

export const NINI_EVENTS: GameEvent[] = [
  {
    id: 'avorriment',
    category: 'salut',
    titleKey: 'event.avorriment.title',
    descKey: 'event.avorriment.desc',
    weight: () => 2,
    effect: { benestar: -5 },
  },
  {
    id: 'pressio_familiar',
    category: 'familia',
    titleKey: 'event.pressio_familiar.title',
    descKey: 'event.pressio_familiar.desc',
    weight: () => 2,
    effect: { benestar: -6 },
  },
  {
    id: 'amics_avancen',
    category: 'escola',
    titleKey: 'event.amics_avancen.title',
    descKey: 'event.amics_avancen.desc',
    weight: () => 1.5,
    effect: { benestar: -4 },
  },
  {
    id: 'temps_lliure',
    category: 'salut',
    titleKey: 'event.temps_lliure.title',
    descKey: 'event.temps_lliure.desc',
    weight: () => 1.5,
    effect: { benestar: 4 },
  },
  {
    id: 'oferta_reengantxar',
    category: 'economia',
    titleKey: 'event.oferta_reengantxar.title',
    descKey: 'event.oferta_reengantxar.desc',
    params: { amount: 150 },
    weight: () => 1.2,
    choices: [
      {
        id: 'acceptar',
        labelKey: 'event.oferta_reengantxar.choice.acceptar',
        effect: { efectiu: 150, benestar: 4 },
      },
      {
        id: 'passar',
        labelKey: 'event.oferta_reengantxar.choice.passar',
        effect: { benestar: -2 },
      },
    ],
  },
]
