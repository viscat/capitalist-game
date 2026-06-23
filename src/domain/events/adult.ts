import { augmentSou, escalaPerClasse } from '../stats'
import type { FamilyClass, GameEvent } from '../types'

// Probabilitat que la família d'origen et demani ajuda econòmica, per classe: alta per a
// les llars precàries (la teva renda hi és necessària), gairebé nul·la per a les acomodades
// (els pares no et demanen diners; si de cas, te'n donen). Corregeix la incoherència que una
// família super-rica "passi un mal moment" i et demani diners.
const AJUT_FAMILIA_PES: Record<FamilyClass, number> = {
  pobra: 1.6,
  treballadora: 1.3,
  mitjana: 0.8,
  alta: 0.3,
  rica: 0.1,
  super_rica: 0.05,
}

// L'herència escala amb el patrimoni de la família d'origen: petita per a les llars
// humils, gran per a les riques. Una mateixa xifra no és coherent per a totes les classes.
const HERENCIA_PES: Record<FamilyClass, number> = {
  pobra: 0.4,
  treballadora: 0.6,
  mitjana: 1,
  alta: 2,
  rica: 4,
  super_rica: 8,
}

// Exposició a xocs de salut segons la classe d'origen (P5). La precarietat —pitjor
// feina, més estrès físic, menys prevenció, pitjor entorn— hi exposa MÉS. No és una
// penalització plana per etiqueta: és més PROBABILITAT de patir el xoc. Per al ric és
// rar (la seva única amenaça real, ja que res estructural no el fa caure); per al pobre,
// freqüent (la salut com a càrrega estructural de classe, no com a simple mala sort).
const EXPOSICIO_SALUT: Record<FamilyClass, number> = {
  pobra: 1.4,
  treballadora: 1.2,
  mitjana: 1,
  alta: 0.8,
  rica: 0.6,
  super_rica: 0.5,
}

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
    weight: () => 0.4,
    // L'import heretat escala amb la riquesa de la família d'origen.
    resolve: (s) => ({
      estalvi: escalaPerClasse(8000, s.familia.classe, HERENCIA_PES),
      benestar: -4,
    }),
  },
  // --- Salut (P5): catàstrofe per al ric, erosió estructural per al pobre ---
  {
    id: 'malaltia_greu',
    category: 'salut',
    titleKey: 'event.malaltia_greu.title',
    descKey: 'event.malaltia_greu.desc',
    params: { cost: 6000 },
    // Despesa greu (passa pel matalàs familiar) + cop fort de benestar. El ric ho cobreix
    // amb el matalàs però igualment se'n ressent; el pobre, sense matalàs, hi suma el
    // descobert. Pes baix però escalat per l'exposició de classe.
    weight: (f) => 0.5 * EXPOSICIO_SALUT[f.classe],
    effect: { despesaGreu: 6000, benestar: -24 },
  },
  {
    id: 'esgotament',
    category: 'salut',
    titleKey: 'event.esgotament.title',
    descKey: 'event.esgotament.desc',
    // Esgotament/salut mental per condicions de feina precàries i estrès crònic: només
    // benestar, però molt més freqüent com més baixa és la classe.
    weight: (f) => 0.7 * EXPOSICIO_SALUT[f.classe],
    effect: { benestar: -10 },
  },
  {
    id: 'incapacitat',
    category: 'salut',
    titleKey: 'event.incapacitat.title',
    descKey: 'event.incapacitat.desc',
    params: { cost: 9000 },
    // Molt rara, però et canvia la vida: despesa greu + cop fort + SEQÜELA permanent
    // (penalització crònica de benestar que la deriva no recupera). És l'única via que pot
    // enfonsar un ric fins a números clarament baixos: pura mala sort, res estructural.
    weight: (f) => 0.18 * EXPOSICIO_SALUT[f.classe],
    effect: { despesaGreu: 9000, benestar: -18, salutCronicaDelta: 22 },
  },
  // --- Vincles (P7): la via de benestar NO monetària (amistats, parella, comunitat) ---
  {
    id: 'parella_estable',
    category: 'familia',
    titleKey: 'event.parella_estable.title',
    descKey: 'event.parella_estable.desc',
    weight: () => 1,
    effect: { benestar: 6, vinclesDelta: 0.18 },
  },
  {
    id: 'arrelar_comunitat',
    category: 'familia',
    titleKey: 'event.arrelar_comunitat.title',
    descKey: 'event.arrelar_comunitat.desc',
    weight: () => 1.1,
    effect: { benestar: 3, vinclesDelta: 0.12 },
  },
  {
    id: 'aillament',
    category: 'salut',
    titleKey: 'event.aillament.title',
    descKey: 'event.aillament.desc',
    weight: () => 0.9,
    effect: { benestar: -5, vinclesDelta: -0.1 },
  },
  {
    id: 'ajudar_familia_adult',
    category: 'familia',
    titleKey: 'event.ajudar_familia_adult.title',
    descKey: 'event.ajudar_familia_adult.desc',
    params: { amount: 3000 },
    weight: (f) => 0.9 * AJUT_FAMILIA_PES[f.classe],
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
 * A l'atur durant la carrera (sou 0), mentre es busca feina. Aquí NO s'hi troba
 * feina (això es fa al panell de cerca, segons l'ocupabilitat): són esdeveniments de
 * color de la temporada d'atur (un ajut econòmic, el desànim de la cerca llarga).
 */
export const ATUR_ADULT_EVENTS: GameEvent[] = [
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
