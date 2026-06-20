import { salariInicial } from '../stats'
import type { GameEvent } from '../types'

// Esdeveniments de la fase laboral (16-18), separats per situació. Molts tenen
// decisió i conseqüències sobre el sou (salariDelta/salariNou), el benestar i les
// despeses. Els canvis de sou són persistents.

/** Amb feina (sou > 0). */
export const TREBALL_EVENTS: GameEvent[] = [
  {
    id: 'pujada_sou',
    category: 'economia',
    titleKey: 'event.pujada_sou.title',
    descKey: 'event.pujada_sou.desc',
    weight: () => 1,
    effect: { salariDelta: 100, benestar: 5 },
  },
  {
    id: 'demanar_augment',
    category: 'economia',
    titleKey: 'event.demanar_augment.title',
    descKey: 'event.demanar_augment.desc',
    weight: () => 1.2,
    choices: [
      {
        id: 'demanar',
        labelKey: 'event.demanar_augment.choice.demanar',
        effect: { salariDelta: 120, benestar: -2 },
      },
      {
        id: 'callar',
        labelKey: 'event.demanar_augment.choice.callar',
        effect: { benestar: -1 },
      },
    ],
  },
  {
    id: 'ascens',
    category: 'economia',
    titleKey: 'event.ascens.title',
    descKey: 'event.ascens.desc',
    weight: () => 0.8,
    choices: [
      {
        id: 'acceptar',
        labelKey: 'event.ascens.choice.acceptar',
        effect: { salariDelta: 200, benestar: -5 },
      },
      {
        id: 'rebutjar',
        labelKey: 'event.ascens.choice.rebutjar',
        effect: { benestar: 2 },
      },
    ],
  },
  {
    id: 'retallada',
    category: 'economia',
    titleKey: 'event.retallada.title',
    descKey: 'event.retallada.desc',
    weight: () => 1,
    effect: { salariDelta: -80, benestar: -5 },
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
    id: 'paga_extra',
    category: 'economia',
    titleKey: 'event.paga_extra.title',
    descKey: 'event.paga_extra.desc',
    params: { amount: 200 },
    weight: () => 1.2,
    effect: { efectiu: 200, benestar: 4 },
  },
  {
    id: 'conflicte_cap',
    category: 'economia',
    titleKey: 'event.conflicte_cap.title',
    descKey: 'event.conflicte_cap.desc',
    weight: () => 1.3,
    effect: { benestar: -6 },
  },
  {
    id: 'companys_feina',
    category: 'escola',
    titleKey: 'event.companys_feina.title',
    descKey: 'event.companys_feina.desc',
    weight: () => 1.5,
    effect: { benestar: 5 },
  },
  {
    id: 'perdre_feina',
    category: 'economia',
    titleKey: 'event.perdre_feina.title',
    descKey: 'event.perdre_feina.desc',
    weight: () => 0.5,
    effect: { salariNou: 0, benestar: -10 },
  },
]

/** A l'atur (itinerari treball amb sou 0). */
export const ATUR_EVENTS: GameEvent[] = [
  {
    id: 'oferta_feina',
    category: 'economia',
    titleKey: 'event.oferta_feina.title',
    descKey: 'event.oferta_feina.desc',
    weight: () => 2.5,
    choices: [
      {
        id: 'acceptar',
        labelKey: 'event.oferta_feina.choice.acceptar',
        effect: { benestar: 6 },
        resolve: (s) => ({ salariNou: salariInicial(s.familia), benestar: 6 }),
      },
      {
        id: 'esperar',
        labelKey: 'event.oferta_feina.choice.esperar',
        effect: { benestar: -3 },
      },
    ],
  },
  {
    id: 'oferta_precaria',
    category: 'economia',
    titleKey: 'event.oferta_precaria.title',
    descKey: 'event.oferta_precaria.desc',
    weight: () => 2,
    choices: [
      {
        id: 'acceptar',
        labelKey: 'event.oferta_precaria.choice.acceptar',
        effect: { benestar: 1 },
        resolve: (s) => ({
          salariNou: Math.round((salariInicial(s.familia) * 0.7) / 25) * 25,
          benestar: 1,
        }),
      },
      {
        id: 'rebutjar',
        labelKey: 'event.oferta_precaria.choice.rebutjar',
        effect: { benestar: -2 },
      },
    ],
  },
  {
    id: 'feineta',
    category: 'economia',
    titleKey: 'event.feineta.title',
    descKey: 'event.feineta.desc',
    params: { amount: 120 },
    weight: () => 1.5,
    effect: { efectiu: 120, benestar: 1 },
  },
  {
    id: 'desanim',
    category: 'salut',
    titleKey: 'event.desanim.title',
    descKey: 'event.desanim.desc',
    weight: () => 1.5,
    effect: { benestar: -6 },
  },
]

/** No fer res (nini). */
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
    id: 'curset_pares',
    category: 'familia',
    titleKey: 'event.curset_pares.title',
    descKey: 'event.curset_pares.desc',
    weight: () => 1.2,
    choices: [
      {
        id: 'apuntar',
        labelKey: 'event.curset_pares.choice.apuntar',
        effect: { benestar: 5 },
      },
      {
        id: 'passar',
        labelKey: 'event.curset_pares.choice.passar',
        effect: { benestar: -2 },
      },
    ],
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

/**
 * Xocs i decisions de vida que poden passar a qualsevol a partir dels 16. Les
 * despeses greus passen pel matalàs familiar: aquí és on l'origen es nota més.
 */
export const COMMON_LIFE_EVENTS: GameEvent[] = [
  {
    id: 'emergencia_salut',
    category: 'salut',
    titleKey: 'event.emergencia_salut.title',
    descKey: 'event.emergencia_salut.desc',
    params: { cost: 2500 },
    weight: () => 0.6,
    effect: { despesaGreu: 2500, benestar: -6 },
  },
  {
    id: 'accident',
    category: 'salut',
    titleKey: 'event.accident.title',
    descKey: 'event.accident.desc',
    params: { cost: 1500 },
    weight: () => 0.7,
    choices: [
      {
        id: 'privat',
        labelKey: 'event.accident.choice.privat',
        effect: { despesaGreu: 1500, benestar: 1 },
      },
      {
        id: 'public',
        labelKey: 'event.accident.choice.public',
        effect: { benestar: -5 },
      },
    ],
  },
  {
    id: 'avaria',
    category: 'economia',
    titleKey: 'event.avaria.title',
    descKey: 'event.avaria.desc',
    params: { cost: 900 },
    weight: () => 0.9,
    effect: { despesaGreu: 900, benestar: -3 },
  },
  {
    id: 'multa',
    category: 'economia',
    titleKey: 'event.multa.title',
    descKey: 'event.multa.desc',
    params: { cost: 600 },
    weight: () => 0.8,
    effect: { despesaGreu: 600, benestar: -3 },
  },
  {
    id: 'amic_demana',
    category: 'familia',
    titleKey: 'event.amic_demana.title',
    descKey: 'event.amic_demana.desc',
    params: { amount: 200 },
    weight: () => 1,
    choices: [
      {
        id: 'deixar',
        labelKey: 'event.amic_demana.choice.deixar',
        effect: { efectiu: -200, benestar: 3 },
      },
      {
        id: 'no',
        labelKey: 'event.amic_demana.choice.no',
        effect: { benestar: -2 },
      },
    ],
  },
  {
    id: 'compra_temptadora',
    category: 'economia',
    titleKey: 'event.compra_temptadora.title',
    descKey: 'event.compra_temptadora.desc',
    params: { cost: 300 },
    weight: () => 1,
    choices: [
      {
        id: 'comprar',
        labelKey: 'event.compra_temptadora.choice.comprar',
        effect: { efectiu: -300, benestar: 6 },
      },
      {
        id: 'contenir',
        labelKey: 'event.compra_temptadora.choice.contenir',
        effect: { benestar: -1 },
      },
    ],
  },
]
