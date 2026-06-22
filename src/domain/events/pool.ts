import { careScore, econSecurity } from '../stats'
import type { GameEvent } from '../types'

// Catàleg d'esdeveniments de la fase d'infància (0-12 anys, 1 torn = 1 any).
// El `weight` pondera la probabilitat segons el context familiar: així el mateix
// joc se sent diferent segons l'origen (més estrès econòmic en famílies justes,
// més temps en família quan hi ha hores de cura, etc.).
//
// Durant la infància la criatura amb prou feines gestiona diners: la majoria
// d'esdeveniments mouen el benestar. L'únic diner "propi" són els regals, que
// introdueixen la primera decisió financera (estalviar vs gastar).
export const CHILDHOOD_EVENTS: GameEvent[] = [
  {
    id: 'temps_familia',
    category: 'familia',
    titleKey: 'event.temps_familia.title',
    descKey: 'event.temps_familia.desc',
    weight: (f) => 1 + careScore(f) * 3,
    effect: { benestar: 6 },
  },
  {
    id: 'discussions_pares',
    category: 'familia',
    titleKey: 'event.discussions_pares.title',
    descKey: 'event.discussions_pares.desc',
    weight: (f) => 1 + (1 - econSecurity(f)) * 4,
    effect: { benestar: -8 },
  },
  {
    id: 'vacances',
    category: 'familia',
    titleKey: 'event.vacances.title',
    descKey: 'event.vacances.desc',
    weight: (f) => 0.5 + econSecurity(f) * 2,
    effect: { benestar: 6 },
  },
  {
    id: 'mudanca',
    category: 'familia',
    titleKey: 'event.mudanca.title',
    descKey: 'event.mudanca.desc',
    weight: () => 0.8,
    effect: { benestar: -3 },
  },
  {
    id: 'germa_nou',
    category: 'familia',
    titleKey: 'event.germa_nou.title',
    descKey: 'event.germa_nou.desc',
    weight: () => 0.7,
    effect: { benestar: -2 },
  },
  {
    id: 'mes_just',
    category: 'economia',
    titleKey: 'event.mes_just.title',
    descKey: 'event.mes_just.desc',
    weight: (f) => 0.5 + (1 - econSecurity(f)) * 5,
    effect: { benestar: -6 },
  },
  {
    id: 'bon_any_economic',
    category: 'economia',
    titleKey: 'event.bon_any_economic.title',
    descKey: 'event.bon_any_economic.desc',
    weight: (f) => 0.5 + econSecurity(f) * 2.5,
    effect: { benestar: 4, estalvi: 30 },
  },
  {
    id: 'regal_diners_avis',
    category: 'regal',
    titleKey: 'event.regal_diners_avis.title',
    descKey: 'event.regal_diners_avis.desc',
    params: { amount: 50 },
    weight: () => 2,
    choices: [
      {
        id: 'estalviar',
        labelKey: 'event.regal_diners_avis.choice.estalviar',
        effect: { estalvi: 50, benestar: 1 },
      },
      {
        id: 'gastar',
        labelKey: 'event.regal_diners_avis.choice.gastar',
        effect: { benestar: 5 },
      },
    ],
  },
  {
    id: 'regal_joguina',
    category: 'regal',
    titleKey: 'event.regal_joguina.title',
    descKey: 'event.regal_joguina.desc',
    weight: () => 2,
    effect: { benestar: 5 },
  },
  {
    id: 'herencia',
    category: 'regal',
    titleKey: 'event.herencia.title',
    descKey: 'event.herencia.desc',
    params: { amount: 500 },
    weight: () => 0.4,
    effect: { estalvi: 500, benestar: -3 },
  },
  {
    id: 'malaltia_lleu',
    category: 'salut',
    titleKey: 'event.malaltia_lleu.title',
    descKey: 'event.malaltia_lleu.desc',
    weight: () => 1.5,
    effect: { benestar: -4 },
  },
  {
    id: 'accident_petit',
    category: 'salut',
    titleKey: 'event.accident_petit.title',
    descKey: 'event.accident_petit.desc',
    weight: (f) => 1 + (1 - econSecurity(f)) * 1.5,
    effect: { benestar: -5 },
  },
  {
    id: 'bon_amic',
    category: 'escola',
    titleKey: 'event.bon_amic.title',
    descKey: 'event.bon_amic.desc',
    weight: () => 2.5,
    effect: { benestar: 7, vinclesDelta: 0.04 },
  },
  // P3 — La cura sota precarietat no val MENYS, val INESTABLE: més variança (pics de
  // connexió profunda i episodis de desbordament), no una mitjana més baixa. Les dues
  // cares pesen igual i són més probables com més justa és l'economia familiar.
  {
    id: 'connexio_profunda',
    category: 'familia',
    titleKey: 'event.connexio_profunda.title',
    descKey: 'event.connexio_profunda.desc',
    weight: (f) => 1 + (1 - econSecurity(f)) * 3,
    effect: { benestar: 10, vinclesDelta: 0.03 },
  },
  {
    id: 'tensio_llar',
    category: 'familia',
    titleKey: 'event.tensio_llar.title',
    descKey: 'event.tensio_llar.desc',
    weight: (f) => 1 + (1 - econSecurity(f)) * 3,
    effect: { benestar: -10 },
  },
  {
    id: 'assetjament',
    category: 'escola',
    titleKey: 'event.assetjament.title',
    descKey: 'event.assetjament.desc',
    weight: () => 1.2,
    effect: { benestar: -9 },
  },
  {
    id: 'extraescolar',
    category: 'escola',
    titleKey: 'event.extraescolar.title',
    descKey: 'event.extraescolar.desc',
    weight: (f) => 1 + econSecurity(f) * 1.5,
    choices: [
      {
        id: 'apuntar',
        labelKey: 'event.extraescolar.choice.apuntar',
        effect: { benestar: 6 },
      },
      {
        id: 'no',
        labelKey: 'event.extraescolar.choice.no',
        effect: { benestar: -1 },
      },
    ],
  },
]
