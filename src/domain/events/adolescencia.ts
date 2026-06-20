import { careScore, econSecurity } from '../stats'
import type { GameEvent } from '../types'

// Esdeveniments de la fase adolescent (ESO, torns trimestrals). Mantenen el
// benestar com a stat central i sovint toquen la butxaca, amb decisions que
// posen a prova la gestió dels diners (pressió de grup, capricis, feines).
export const ADOLESCENCE_EVENTS: GameEvent[] = [
  {
    id: 'examens',
    category: 'escola',
    titleKey: 'event.examens.title',
    descKey: 'event.examens.desc',
    weight: () => 2,
    effect: { benestar: -5 },
  },
  {
    id: 'primer_amor',
    category: 'familia',
    titleKey: 'event.primer_amor.title',
    descKey: 'event.primer_amor.desc',
    weight: () => 1.5,
    effect: { benestar: 8 },
  },
  {
    id: 'bon_grup_amics',
    category: 'escola',
    titleKey: 'event.bon_grup_amics.title',
    descKey: 'event.bon_grup_amics.desc',
    weight: () => 2,
    effect: { benestar: 7 },
  },
  {
    id: 'baralla_amics',
    category: 'escola',
    titleKey: 'event.baralla_amics.title',
    descKey: 'event.baralla_amics.desc',
    weight: () => 1.5,
    effect: { benestar: -7 },
  },
  {
    id: 'xarxes',
    category: 'escola',
    titleKey: 'event.xarxes.title',
    descKey: 'event.xarxes.desc',
    weight: () => 1.5,
    effect: { benestar: -4 },
  },
  {
    id: 'pressio_grup',
    category: 'escola',
    titleKey: 'event.pressio_grup.title',
    descKey: 'event.pressio_grup.desc',
    params: { cost: 60 },
    weight: () => 1.5,
    choices: [
      {
        id: 'cedir',
        labelKey: 'event.pressio_grup.choice.cedir',
        effect: { efectiu: -60, benestar: 3 },
      },
      {
        id: 'plantarse',
        labelKey: 'event.pressio_grup.choice.plantarse',
        effect: { benestar: -1 },
      },
    ],
  },
  {
    id: 'mobil_nou',
    category: 'economia',
    titleKey: 'event.mobil_nou.title',
    descKey: 'event.mobil_nou.desc',
    params: { cost: 250 },
    weight: () => 1.2,
    choices: [
      {
        id: 'comprar',
        labelKey: 'event.mobil_nou.choice.comprar',
        effect: { efectiu: -250, benestar: 7 },
      },
      {
        id: 'esperar',
        labelKey: 'event.mobil_nou.choice.esperar',
        effect: { benestar: -2 },
      },
    ],
  },
  {
    id: 'feina_caps_setmana',
    category: 'economia',
    titleKey: 'event.feina_caps_setmana.title',
    descKey: 'event.feina_caps_setmana.desc',
    params: { amount: 200 },
    weight: (f) => 1 + (1 - econSecurity(f)) * 1.5,
    choices: [
      {
        id: 'acceptar',
        labelKey: 'event.feina_caps_setmana.choice.acceptar',
        effect: { efectiu: 200, benestar: -4 },
      },
      {
        id: 'rebutjar',
        labelKey: 'event.feina_caps_setmana.choice.rebutjar',
        effect: {},
      },
    ],
  },
  {
    id: 'conflicte_pares',
    category: 'familia',
    titleKey: 'event.conflicte_pares.title',
    descKey: 'event.conflicte_pares.desc',
    weight: (f) => 1 + (1 - careScore(f)) * 2,
    effect: { benestar: -6 },
  },
  {
    id: 'paga_extra_avis',
    category: 'regal',
    titleKey: 'event.paga_extra_avis.title',
    descKey: 'event.paga_extra_avis.desc',
    params: { amount: 40 },
    weight: () => 1.2,
    effect: { efectiu: 40, benestar: 2 },
  },
  {
    id: 'despesa_inesperada',
    category: 'economia',
    titleKey: 'event.despesa_inesperada.title',
    descKey: 'event.despesa_inesperada.desc',
    params: { cost: 80 },
    weight: (f) => 1 + (1 - econSecurity(f)) * 1.5,
    effect: { efectiu: -80, benestar: -3 },
  },
  {
    id: 'esport_equip',
    category: 'escola',
    titleKey: 'event.esport_equip.title',
    descKey: 'event.esport_equip.desc',
    weight: () => 1.2,
    effect: { benestar: 6 },
  },
  {
    id: 'malaltia_ado',
    category: 'salut',
    titleKey: 'event.malaltia_ado.title',
    descKey: 'event.malaltia_ado.desc',
    weight: () => 1.2,
    effect: { benestar: -4 },
  },
  {
    id: 'festa',
    category: 'escola',
    titleKey: 'event.festa.title',
    descKey: 'event.festa.desc',
    params: { cost: 30 },
    weight: () => 1.5,
    effect: { efectiu: -30, benestar: 5 },
  },
]
