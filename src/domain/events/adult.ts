import { ajutParesPuntual, augmentSou, escalaPerClasse, herenciaParesMort } from '../stats'
import { edatAnys } from '../time'
import type { FamilyClass, GameEvent } from '../types'

// Probabilitat que la família d'origen et demani ajuda econòmica, per classe: alta per a
// les llars precàries (la teva renda hi és necessària), gairebé nul·la per a les acomodades
// (els pares no et demanen diners; si de cas, te'n donen). Corregeix la incoherència que una
// família super-rica "passi un mal moment" i et demani diners.
const AJUT_FAMILIA_PES: Record<FamilyClass, number> = {
  pobra: 1,
  treballadora: 0.9,
  mitjana: 0.6,
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
          salariDelta: augmentSou(
            s.salari ?? 0,
            s.person.stats.benestar,
            edatAnys(s.person.edatMesos),
          ),
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
          return { efectiu: -amt, inversions: amt, benestar: 1 }
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
      inversions: escalaPerClasse(8000, s.familia.classe, HERENCIA_PES),
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
    effect: { despesaGreu: 6000, benestar: -24, salutDelta: -14 },
  },
  {
    id: 'esgotament',
    category: 'salut',
    titleKey: 'event.esgotament.title',
    descKey: 'event.esgotament.desc',
    // Esgotament/salut mental per condicions de feina precàries i estrès crònic: benestar i
    // salut, molt més freqüent com més baixa és la classe.
    weight: (f) => 0.7 * EXPOSICIO_SALUT[f.classe],
    effect: { benestar: -10, salutDelta: -6 },
  },
  {
    id: 'incapacitat',
    category: 'salut',
    titleKey: 'event.incapacitat.title',
    descKey: 'event.incapacitat.desc',
    params: { cost: 9000 },
    // Molt rara, però et canvia la vida: despesa greu + cop fort + SEQÜELA permanent
    // (penalització crònica de benestar) + gran cop de salut (acosta la mort). És una via
    // que pot enfonsar un ric: pura mala sort, res estructural.
    weight: (f) => 0.18 * EXPOSICIO_SALUT[f.classe],
    effect: { despesaGreu: 9000, benestar: -18, salutCronicaDelta: 22, salutDelta: -25 },
  },
  // --- Vincles (P7): la via de benestar NO monetària (amistats, comunitat) ---
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
  // --- Salut mental (estrès, ansietat): erosiona la salut; la teràpia ajuda però costa, i
  // qui no la pot pagar (descobert) encara hi perd més salut (tractament no fet). ---
  {
    id: 'ansietat',
    category: 'salut',
    titleKey: 'event.ansietat.title',
    descKey: 'event.ansietat.desc',
    params: { cost: 1500 },
    weight: (f) => 0.8 * EXPOSICIO_SALUT[f.classe],
    choices: [
      {
        id: 'terapia',
        labelKey: 'event.ansietat.choice.terapia',
        // Vas a teràpia: despesa (matalàs familiar); si no la pots pagar, el descobert et
        // resta més salut (tractament no fet). Si la pots pagar, te'n recuperes força.
        effect: { despesaGreu: 1500, benestar: 2, salutDelta: -2 },
      },
      {
        id: 'aguantar',
        labelKey: 'event.ansietat.choice.aguantar',
        effect: { benestar: -7, salutDelta: -9 },
      },
    ],
  },
  {
    id: 'estres_cronic',
    category: 'salut',
    titleKey: 'event.estres_cronic.title',
    descKey: 'event.estres_cronic.desc',
    // Estrès crònic (jornades, conciliació, precarietat): desgast silenciós de la salut.
    weight: (f) => 0.7 * EXPOSICIO_SALUT[f.classe],
    effect: { benestar: -4, salutDelta: -6 },
  },
]

/**
 * Xocs de salut propis de l'EDAT (50+): el cos passa factura i arriba la cura dels pares
 * grans. S'afegeixen al pool de la carrera a partir dels ~50 (`eventPool`), ponderats per
 * l'exposició de classe (la precarietat envelleix pitjor: pitjor feina, menys prevenció).
 * Modelen el risc de salut CREIXENT amb l'edat, que els pesos estàtics no capturaven.
 */
export const SALUT_EDAT_EVENTS: GameEvent[] = [
  {
    id: 'xacra_edat',
    category: 'salut',
    titleKey: 'event.xacra_edat.title',
    descKey: 'event.xacra_edat.desc',
    weight: (f) => 0.8 * EXPOSICIO_SALUT[f.classe],
    effect: { benestar: -6, salutCronicaDelta: 4, salutDelta: -8 },
  },
  {
    id: 'operacio',
    category: 'salut',
    titleKey: 'event.operacio.title',
    descKey: 'event.operacio.desc',
    params: { cost: 5000 },
    weight: (f) => 0.6 * EXPOSICIO_SALUT[f.classe],
    effect: { despesaGreu: 5000, benestar: -12, salutCronicaDelta: 6, salutDelta: -12 },
  },
  {
    id: 'cura_pares_grans',
    category: 'familia',
    titleKey: 'event.cura_pares_grans.title',
    descKey: 'event.cura_pares_grans.desc',
    params: { amount: 4000 },
    // La cura dels pares grans recau més sobre les llars humils (menys recursos per delegar).
    weight: (f) => 0.9 * AJUT_FAMILIA_PES[f.classe],
    choices: [
      {
        id: 'cuidar',
        labelKey: 'event.cura_pares_grans.choice.cuidar',
        effect: { despesaGreu: 4000, benestar: -4, vinclesDelta: 0.06 },
      },
      {
        id: 'residencia',
        labelKey: 'event.cura_pares_grans.choice.residencia',
        effect: { despesaGreu: 8000, benestar: -2 },
      },
    ],
  },
]

/**
 * Descendència: l'oportunitat de tenir un fill, dins de la finestra fèrtil (vegeu
 * `eventPool`). És una decisió: el fill dóna benestar i vincles (P7, no monetari) però porta
 * un cost de criança recurrent (vegeu `costFillsAnual`) que pesa molt més en una llar humil.
 */
export const DESCENDENCIA_EVENTS: GameEvent[] = [
  {
    id: 'tenir_fill',
    category: 'familia',
    titleKey: 'event.tenir_fill.title',
    descKey: 'event.tenir_fill.desc',
    // Pes alt dins de la finestra fèrtil perquè l'opció de formar família sigui ben visible
    // (apareix de manera fiable, no es perd entre la resta d'esdeveniments).
    weight: () => 6,
    choices: [
      {
        id: 'si',
        labelKey: 'event.tenir_fill.choice.si',
        // Alegria i vincle forts; el cost econòmic arriba després, any rere any.
        effect: { benestar: 9, vinclesDelta: 0.2, fillsDelta: 1 },
      },
      {
        id: 'no',
        labelKey: 'event.tenir_fill.choice.no',
        effect: {},
      },
    ],
  },
]

/**
 * LLOGUER: riscos de viure de lloguer. El propietari ven, no et renoven el contracte o et
 * desnonen: perds el pis/habitació i tornes a casa els pares (un cop). Gating per estar de
 * lloguer a `eventPool`. És la inseguretat habitacional de qui no és propietari.
 */
export const LLOGUER_EVENTS: GameEvent[] = [
  {
    id: 'fi_contracte_lloguer',
    category: 'economia',
    titleKey: 'event.fi_contracte_lloguer.title',
    descKey: 'event.fi_contracte_lloguer.desc',
    weight: () => 0.7,
    effect: { benestar: -8, perdHabitatge: true },
  },
  {
    id: 'desnonament',
    category: 'economia',
    titleKey: 'event.desnonament.title',
    descKey: 'event.desnonament.desc',
    weight: () => 0.4,
    effect: { benestar: -12, perdHabitatge: true },
  },
]

/**
 * PARELLA: conèixer algú i decidir formar una parella estable. És el requisit previ per tenir
 * fills i, a més, fa que les despeses estructurals de la llar es comparteixin. Només apareix
 * mentre no en tens (gating a `eventPool`). Pes alt perquè sigui ben visible com a opció.
 */
export const PARELLA_EVENTS: GameEvent[] = [
  {
    id: 'coneixer_parella',
    category: 'familia',
    titleKey: 'event.coneixer_parella.title',
    descKey: 'event.coneixer_parella.desc',
    weight: () => 5,
    choices: [
      {
        id: 'si',
        labelKey: 'event.coneixer_parella.choice.si',
        // Establir parella: benestar i vincle forts, i marca la parella (despeses compartides).
        effect: { benestar: 7, vinclesDelta: 0.18, marcaParella: true },
      },
      {
        id: 'no',
        labelKey: 'event.coneixer_parella.choice.no',
        effect: { benestar: 1 },
      },
    ],
  },
]

/**
 * FILLS: la vida amb criatures dependents. Tenir un fill no és només despesa: la criança porta
 * alegries (fites, complicitat → benestar i vincles amunt) però també ensurts (quan el fill ho
 * passa malament → benestar avall). Gating per fills dependents a `eventPool`.
 */
export const FILLS_EVENTS: GameEvent[] = [
  {
    id: 'fill_fita_felic',
    category: 'familia',
    titleKey: 'event.fill_fita_felic.title',
    descKey: 'event.fill_fita_felic.desc',
    weight: () => 2.4,
    effect: { benestar: 8, vinclesDelta: 0.1 },
  },
  {
    id: 'fill_complicitat',
    category: 'familia',
    titleKey: 'event.fill_complicitat.title',
    descKey: 'event.fill_complicitat.desc',
    weight: () => 2,
    effect: { benestar: 6, vinclesDelta: 0.08 },
  },
  {
    id: 'fill_dificultats',
    category: 'familia',
    titleKey: 'event.fill_dificultats.title',
    descKey: 'event.fill_dificultats.desc',
    weight: () => 1.6,
    effect: { benestar: -7, vinclesDelta: 0.02 },
  },
  {
    id: 'fill_malaltia',
    category: 'salut',
    titleKey: 'event.fill_malaltia.title',
    descKey: 'event.fill_malaltia.desc',
    weight: () => 1.2,
    // L'ensurt fa mal (benestar), però cuidar-lo estreny el vincle.
    effect: { benestar: -9, vinclesDelta: 0.06, despesaGreu: 1200 },
  },
]

/**
 * Herència EN VIDA: si tens fills i un coixí, pots avançar-los part del patrimoni ara
 * (lliure d'impost de successions). Redueix el teu estate i el teu marge, però ajuda els
 * fills (i et fa sentir bé). El que dónes s'acumula a `GameState.llegatEnVida` i es reparteix
 * entre els descendents quan continues amb un d'ells. Gating per fills i patrimoni a `eventPool`.
 */
export const HERENCIA_VIDA_EVENTS: GameEvent[] = [
  {
    id: 'herencia_en_vida',
    category: 'familia',
    titleKey: 'event.herencia_en_vida.title',
    descKey: 'event.herencia_en_vida.desc',
    weight: () => 1,
    choices: [
      {
        id: 'donar',
        labelKey: 'event.herencia_en_vida.choice.donar',
        effect: {},
        // Dóna ~30% del patrimoni líquid als fills (lliure de successions).
        resolve: (s) => {
          const p = s.person.patrimoni
          const liquid = p.efectiu + p.inversions
          return {
            llegatEnVidaDelta: Math.round((liquid * 0.3) / 100) * 100,
            benestar: 4,
            vinclesDelta: 0.05,
          }
        },
      },
      {
        id: 'no',
        labelKey: 'event.herencia_en_vida.choice.no',
        effect: {},
      },
    ],
  },
]

// Probabilitat que els pares t'ajudin econòmicament en vida, per classe: nul·la a les llars
// que no poden, alta a les acomodades. L'altra cara de la transmissió de capital.
const AJUT_PARES_PES: Record<FamilyClass, number> = {
  pobra: 0,
  treballadora: 0.4,
  mitjana: 0.9,
  alta: 1.4,
  rica: 1.8,
  super_rica: 2.2,
}

/**
 * Herència que es REP dels pares. En vida: un ajut puntual (els rics ajuden els fills; els
 * pobres no poden). Per mort: quan moren els pares, n'heretes el patrimoni (una fortuna per
 * al ric, gairebé res per al pobre). És el mecanisme directe de reproducció de classe vist
 * des del costat de qui rep.
 */
export const AJUT_PARES_EVENTS: GameEvent[] = [
  {
    id: 'ajut_pares',
    category: 'familia',
    titleKey: 'event.ajut_pares.title',
    descKey: 'event.ajut_pares.desc',
    weight: (f) => AJUT_PARES_PES[f.classe],
    resolve: (s) => ({ efectiu: ajutParesPuntual(s.familia), benestar: 3, vinclesDelta: 0.03 }),
  },
]

export const HERENCIA_PARES_EVENTS: GameEvent[] = [
  {
    id: 'herencia_pares',
    category: 'familia',
    titleKey: 'event.herencia_pares.title',
    descKey: 'event.herencia_pares.desc',
    weight: () => 1.5,
    // Dol (benestar/salut avall) + l'herència que reps (segons el patrimoni familiar). Marca
    // que ja ha passat perquè no es repeteixi.
    resolve: (s) => ({
      inversions: herenciaParesMort(s.familia),
      benestar: -12,
      vinclesDelta: -0.08,
      salutDelta: -2,
      marcaHerenciaPares: true,
    }),
  },
]

/**
 * Herència de DINASTIA: quan continues amb un descendent, el progenitor (la generació
 * anterior) mor a una edat concreta i sabuda; en aquell moment el fill rep l'herència que
 * havies deixat (`GameState.herenciaPendent`). Esdeveniment previst (no aleatori): el motor
 * el dispara a l'edat exacta (vegeu `advanceTurn`).
 */
export const HERENCIA_DINASTIA_EVENTS: GameEvent[] = [
  {
    id: 'herencia_dinastia',
    category: 'familia',
    titleKey: 'event.herencia_dinastia.title',
    descKey: 'event.herencia_dinastia.desc',
    weight: () => 1,
    resolve: (s) => ({
      inversions: s.herenciaPendent?.import ?? 0,
      heretaCases: s.herenciaPendent?.cases,
      benestar: -10,
      vinclesDelta: -0.05,
      salutDelta: -2,
      marcaHerenciaPares: true,
    }),
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
