import { augmentSou, salariAdultInicial } from '../stats'
import type { GameEvent } from '../types'

// Esdeveniments de la vida adulta (torns anuals).
//
// - UNIVERSITAT_EVENTS: vida d'estudiant (18→22), sobretot benestar i alguna
//   despesa/ingrés puntual.
// - CARRERA_EVENTS: vida laboral adulta (→35), amb canvis de sou persistents i,
//   sobretot, els XOCS DE MERCAT (`mercatPct`) que fan visible la volatilitat de
//   la inversió: el missatge financer és que el fons indexat puja i baixa, però a
//   llarg termini compon — convé no vendre presa del pànic.

/** Universitat (18→22). */
export const UNIVERSITAT_EVENTS: GameEvent[] = [
  {
    id: 'examens_uni',
    category: 'escola',
    titleKey: 'event.examens_uni.title',
    descKey: 'event.examens_uni.desc',
    weight: () => 2,
    effect: { benestar: -5 },
  },
  {
    id: 'aprovar_curs',
    category: 'escola',
    titleKey: 'event.aprovar_curs.title',
    descKey: 'event.aprovar_curs.desc',
    weight: () => 2,
    effect: { benestar: 6 },
  },
  {
    id: 'suspendre_uni',
    category: 'escola',
    titleKey: 'event.suspendre_uni.title',
    descKey: 'event.suspendre_uni.desc',
    weight: () => 1.2,
    effect: { benestar: -6 },
  },
  {
    id: 'colla_uni',
    category: 'escola',
    titleKey: 'event.colla_uni.title',
    descKey: 'event.colla_uni.desc',
    weight: () => 2,
    effect: { benestar: 7 },
  },
  {
    id: 'festa_uni',
    category: 'escola',
    titleKey: 'event.festa_uni.title',
    descKey: 'event.festa_uni.desc',
    params: { cost: 60 },
    weight: () => 1.5,
    effect: { efectiu: -60, benestar: 5 },
  },
  {
    id: 'erasmus',
    category: 'familia',
    titleKey: 'event.erasmus.title',
    descKey: 'event.erasmus.desc',
    params: { cost: 1200 },
    weight: () => 1,
    choices: [
      {
        id: 'anar',
        labelKey: 'event.erasmus.choice.anar',
        effect: { efectiu: -1200, benestar: 12 },
      },
      {
        id: 'quedarse',
        labelKey: 'event.erasmus.choice.quedarse',
        effect: { benestar: -2 },
      },
    ],
  },
  {
    id: 'beca_merit',
    category: 'economia',
    titleKey: 'event.beca_merit.title',
    descKey: 'event.beca_merit.desc',
    params: { amount: 700 },
    weight: () => 1.2,
    effect: { efectiu: 700, benestar: 3 },
  },
  {
    id: 'practiques_uni',
    category: 'economia',
    titleKey: 'event.practiques_uni.title',
    descKey: 'event.practiques_uni.desc',
    params: { amount: 1200 },
    weight: () => 1.4,
    choices: [
      {
        id: 'acceptar',
        labelKey: 'event.practiques_uni.choice.acceptar',
        effect: { efectiu: 1200, benestar: -3 },
      },
      {
        id: 'rebutjar',
        labelKey: 'event.practiques_uni.choice.rebutjar',
        effect: { benestar: 1 },
      },
    ],
  },
]

/** Carrera adulta amb inversions (→35). */
export const CARRERA_EVENTS: GameEvent[] = [
  // --- Sou i feina (canvis persistents) ---
  {
    id: 'pujada_anual',
    category: 'economia',
    titleKey: 'event.pujada_anual.title',
    descKey: 'event.pujada_anual.desc',
    weight: () => 1.4,
    effect: { salariDelta: 120, benestar: 4 },
  },
  {
    id: 'ascens_carrera',
    category: 'economia',
    titleKey: 'event.ascens_carrera.title',
    descKey: 'event.ascens_carrera.desc',
    weight: () => 1,
    choices: [
      {
        id: 'acceptar',
        labelKey: 'event.ascens_carrera.choice.acceptar',
        effect: { salariDelta: 300, benestar: -5 },
      },
      {
        id: 'rebutjar',
        labelKey: 'event.ascens_carrera.choice.rebutjar',
        effect: { benestar: 2 },
      },
    ],
  },
  {
    id: 'negociar_sou',
    category: 'economia',
    titleKey: 'event.negociar_sou.title',
    descKey: 'event.negociar_sou.desc',
    weight: () => 1,
    choices: [
      {
        id: 'negociar',
        labelKey: 'event.negociar_sou.choice.negociar',
        effect: { benestar: -2 },
        resolve: (s) => ({
          salariDelta: augmentSou(s.salari ?? 0, s.person.stats.benestar),
          benestar: -2,
        }),
      },
      {
        id: 'conformar',
        labelKey: 'event.negociar_sou.choice.conformar',
        effect: { benestar: -1 },
      },
    ],
  },
  {
    id: 'retallada_carrera',
    category: 'economia',
    titleKey: 'event.retallada_carrera.title',
    descKey: 'event.retallada_carrera.desc',
    weight: () => 0.9,
    effect: { salariDelta: -150, benestar: -5 },
  },
  {
    id: 'acomiadament',
    category: 'economia',
    titleKey: 'event.acomiadament.title',
    descKey: 'event.acomiadament.desc',
    weight: () => 0.4,
    effect: { salariNou: 0, benestar: -12 },
  },
  {
    id: 'nova_feina',
    category: 'economia',
    titleKey: 'event.nova_feina.title',
    descKey: 'event.nova_feina.desc',
    weight: () => 0.8,
    choices: [
      {
        id: 'canviar',
        labelKey: 'event.nova_feina.choice.canviar',
        effect: { benestar: 3 },
        resolve: (s) => ({
          salariNou: Math.round(((s.salari ?? 0) * 1.2) / 25) * 25 + 100,
          benestar: 3,
        }),
      },
      {
        id: 'quedarse',
        labelKey: 'event.nova_feina.choice.quedarse',
        effect: { benestar: 0 },
      },
    ],
  },

  // --- Mercat (volatilitat de la inversió) ---
  {
    id: 'crisi_mercat',
    category: 'economia',
    titleKey: 'event.crisi_mercat.title',
    descKey: 'event.crisi_mercat.desc',
    weight: () => 1.1,
    effect: { mercatPct: -0.28, benestar: -6 },
  },
  {
    id: 'rally_mercat',
    category: 'economia',
    titleKey: 'event.rally_mercat.title',
    descKey: 'event.rally_mercat.desc',
    weight: () => 1.1,
    effect: { mercatPct: 0.18, benestar: 3 },
  },
  {
    id: 'consell_inversio',
    category: 'economia',
    titleKey: 'event.consell_inversio.title',
    descKey: 'event.consell_inversio.desc',
    params: { amount: 1500 },
    weight: () => 1.2,
    choices: [
      {
        id: 'invertir',
        labelKey: 'event.consell_inversio.choice.invertir',
        effect: { benestar: 1 },
        // Mou fins a 1500 € d'efectiu al fons indexat (mai més del que tens).
        resolve: (s) => {
          const amt = Math.min(1500, s.person.patrimoni.efectiu)
          return { efectiu: -amt, fonsIndexat: amt, benestar: 1 }
        },
      },
      {
        id: 'passar',
        labelKey: 'event.consell_inversio.choice.passar',
        effect: {},
      },
    ],
  },

  // --- Vida adulta ---
  {
    id: 'cotxe_nou',
    category: 'economia',
    titleKey: 'event.cotxe_nou.title',
    descKey: 'event.cotxe_nou.desc',
    params: { cost: 11000 },
    weight: () => 0.8,
    choices: [
      {
        id: 'comprar',
        labelKey: 'event.cotxe_nou.choice.comprar',
        effect: { despesaGreu: 11000, benestar: 6 },
      },
      {
        id: 'segona_ma',
        labelKey: 'event.cotxe_nou.choice.segona_ma',
        effect: { despesaGreu: 4000, benestar: 2 },
      },
    ],
  },
  {
    id: 'viatge_adult',
    category: 'salut',
    titleKey: 'event.viatge_adult.title',
    descKey: 'event.viatge_adult.desc',
    params: { cost: 1800 },
    weight: () => 1.2,
    choices: [
      {
        id: 'anar',
        labelKey: 'event.viatge_adult.choice.anar',
        effect: { efectiu: -1800, benestar: 9 },
      },
      {
        id: 'esperar',
        labelKey: 'event.viatge_adult.choice.esperar',
        effect: { benestar: -1 },
      },
    ],
  },
  {
    id: 'formacio_adult',
    category: 'escola',
    titleKey: 'event.formacio_adult.title',
    descKey: 'event.formacio_adult.desc',
    params: { cost: 1200 },
    weight: () => 1,
    choices: [
      {
        id: 'formar',
        labelKey: 'event.formacio_adult.choice.formar',
        effect: { efectiu: -1200, salariDelta: 90, benestar: 1 },
      },
      {
        id: 'passar',
        labelKey: 'event.formacio_adult.choice.passar',
        effect: { benestar: -1 },
      },
    ],
  },
  {
    id: 'herencia_adult',
    category: 'regal',
    titleKey: 'event.herencia_adult.title',
    descKey: 'event.herencia_adult.desc',
    params: { amount: 8000 },
    weight: () => 0.4,
    effect: { estalvi: 8000, benestar: -4 },
  },
  {
    id: 'ajudar_familia_adult',
    category: 'familia',
    titleKey: 'event.ajudar_familia_adult.title',
    descKey: 'event.ajudar_familia_adult.desc',
    params: { amount: 3000 },
    weight: () => 0.9,
    choices: [
      {
        id: 'ajudar',
        labelKey: 'event.ajudar_familia_adult.choice.ajudar',
        effect: { despesaGreu: 3000, benestar: 4 },
      },
      {
        id: 'no_puc',
        labelKey: 'event.ajudar_familia_adult.choice.no_puc',
        effect: { benestar: -4 },
      },
    ],
  },
]

/**
 * A l'atur durant la carrera (sou 0). Sobretot, vies per tornar a treballar; així
 * un acomiadament no condemna la partida (com a la fase laboral 16-18).
 */
export const ATUR_ADULT_EVENTS: GameEvent[] = [
  {
    id: 'oferta_carrera',
    category: 'economia',
    titleKey: 'event.oferta_carrera.title',
    descKey: 'event.oferta_carrera.desc',
    weight: () => 2.5,
    choices: [
      {
        id: 'acceptar',
        labelKey: 'event.oferta_carrera.choice.acceptar',
        effect: { benestar: 6 },
        resolve: (s) => ({
          salariNou: salariAdultInicial(s.familia, s.teDiploma ?? false),
          benestar: 6,
        }),
      },
      {
        id: 'esperar',
        labelKey: 'event.oferta_carrera.choice.esperar',
        effect: { benestar: -3 },
      },
    ],
  },
  {
    id: 'feina_pont',
    category: 'economia',
    titleKey: 'event.feina_pont.title',
    descKey: 'event.feina_pont.desc',
    weight: () => 1.8,
    choices: [
      {
        id: 'acceptar',
        labelKey: 'event.feina_pont.choice.acceptar',
        effect: { benestar: 1 },
        resolve: (s) => ({
          salariNou:
            Math.round((salariAdultInicial(s.familia, s.teDiploma ?? false) * 0.6) / 25) *
            25,
          benestar: 1,
        }),
      },
      {
        id: 'rebutjar',
        labelKey: 'event.feina_pont.choice.rebutjar',
        effect: { benestar: -2 },
      },
    ],
  },
  {
    id: 'subsidi_atur',
    category: 'economia',
    titleKey: 'event.subsidi_atur.title',
    descKey: 'event.subsidi_atur.desc',
    params: { amount: 4000 },
    weight: () => 1.4,
    effect: { efectiu: 4000, benestar: -2 },
  },
  {
    id: 'desanim_adult',
    category: 'salut',
    titleKey: 'event.desanim_adult.title',
    descKey: 'event.desanim_adult.desc',
    weight: () => 1.2,
    effect: { benestar: -5 },
  },
]
