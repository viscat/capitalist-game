import { ajutParesPuntual, augmentSou, escalaPerClasse, herenciaParesMort } from '../stats'
import { rng } from '../rng'
import { edatAnys } from '../time'
import type { FamilyClass, GameEvent, GameState } from '../types'

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/**
 * EMPRENEDORIA: muntar un negoci. Via de mobilitat d'ALTA variància (i alt sostre): pot fer-te
 * créixer el patrimoni per damunt del que permet un sou (acumulació de capital), però la majoria
 * de negocis fracassen i et deixen pitjor. La probabilitat d'èxit puja amb el capital humà, els
 * contactes (vincles) i el capital inicial → els rics arrisquen amb més xarxa (menys ruïna). És
 * el "capitalista" que faltava: jugar bé + capital obre un sostre que el sou sol no dóna.
 */
export const NEGOCI_EVENTS: GameEvent[] = [
  {
    id: 'muntar_negoci',
    category: 'economia',
    titleKey: 'event.muntar_negoci.title',
    descKey: 'event.muntar_negoci.desc',
    weight: () => 0.4,
    choices: [
      {
        id: 'muntar',
        labelKey: 'event.muntar_negoci.choice.muntar',
        effect: {},
        resolve: (s: GameState) => {
          const p = s.person.patrimoni
          const capital = p.efectiu + p.inversions
          const habilitat = clamp01(
            (s.nivellAcademic ?? 0) * 0.4 +
              (s.vinclesSocials ?? 0) * 0.3 +
              clamp01(capital / 120_000) * 0.3,
          )
          const roll = rng(s.rngState + 9001).value
          const pFracas = Math.max(0.12, 0.55 - habilitat * 0.4)
          if (roll < pFracas) {
            // Fracàs: perds part del capital invertit i un cop de benestar (no et deixa a zero).
            return {
              inversions: -Math.round(p.inversions * 0.3),
              benestar: -8,
              salutDelta: -1,
            }
          }
          if (roll > 0.82) {
            // Èxit gran: injecció de capital per damunt del que permet un sou (acumulació). El
            // negoci queda actiu AMB EMPLEATS a càrrec: ara decidiràs quant els pagues.
            return {
              inversions: Math.round(capital * 1.1 + 60_000),
              benestar: 8,
              vinclesDelta: 0.05,
              marcaNegoci: true,
            }
          }
          // Resultat modest: el negoci tira, creixement contingut, amb empleats a càrrec.
          return {
            inversions: Math.round(capital * 0.2 + 4_000),
            benestar: 2,
            marcaNegoci: true,
          }
        },
      },
      {
        id: 'no',
        labelKey: 'event.muntar_negoci.choice.no',
        effect: { benestar: 1 },
      },
    ],
  },
]

/**
 * GESTIÓ DEL NEGOCI: la decisió central de l'empresari, quant paga els seus treballadors. És la
 * mecànica d'EXPLOTACIÓ feta visible: pagar precari t'omple la butxaca (dividend alt via
 * `dividendNegociAnual`) però t'enfonsa la moralitat; pagar bé costa benefici però et fa "bo".
 * Apareix de manera recurrent mentre tinguis negoci (gating per `negociActiu` a `eventPool`).
 */
export const NEGOCI_GESTIO_EVENTS: GameEvent[] = [
  {
    id: 'sou_empleats',
    category: 'economia',
    titleKey: 'event.sou_empleats.title',
    descKey: 'event.sou_empleats.desc',
    weight: () => 2,
    choices: [
      {
        id: 'precari',
        labelKey: 'event.sou_empleats.choice.precari',
        effect: { souEmpleats: 'precari', moralitatDelta: -16, benestar: 1 },
      },
      {
        id: 'molt_baix',
        labelKey: 'event.sou_empleats.choice.molt_baix',
        effect: { souEmpleats: 'molt_baix', moralitatDelta: -10 },
      },
      {
        id: 'baix',
        labelKey: 'event.sou_empleats.choice.baix',
        effect: { souEmpleats: 'baix', moralitatDelta: -5 },
      },
      {
        id: 'mercat',
        labelKey: 'event.sou_empleats.choice.mercat',
        effect: { souEmpleats: 'mercat', moralitatDelta: 0 },
      },
      {
        id: 'alt',
        labelKey: 'event.sou_empleats.choice.alt',
        effect: { souEmpleats: 'alt', moralitatDelta: 8, benestar: 2, vinclesDelta: 0.04 },
      },
      {
        id: 'molt_alt',
        labelKey: 'event.sou_empleats.choice.molt_alt',
        effect: {
          souEmpleats: 'molt_alt',
          moralitatDelta: 14,
          benestar: 3,
          vinclesDelta: 0.06,
        },
      },
    ],
  },
]

/**
 * ACCIÓ COL·LECTIVA: sindicar-se i secundar vagues. És la via d'ascens COMPARTIDA (no individual):
 * construeix `poderSindical`, que protegeix la feina i apuja el sou de TOTHOM qui s'hi organitza
 * (via `factorSindical`). Gating per tenir feina a `eventPool`. Costa a curt termini (quotes, dies
 * de vaga no pagats), però el guany és col·lectiu i durador. El contrapès al poder del propietari.
 */
export const SINDICAT_EVENTS: GameEvent[] = [
  {
    id: 'afiliar_sindicat',
    category: 'economia',
    titleKey: 'event.afiliar_sindicat.title',
    descKey: 'event.afiliar_sindicat.desc',
    weight: () => 2.2,
    choices: [
      {
        id: 'afiliar',
        labelKey: 'event.afiliar_sindicat.choice.afiliar',
        effect: {
          poderSindicalDelta: 0.2,
          vinclesDelta: 0.05,
          benestar: 1,
          moralitatDelta: 2,
        },
      },
      {
        id: 'no',
        labelKey: 'event.afiliar_sindicat.choice.no',
        effect: {},
      },
    ],
  },
  {
    id: 'vaga',
    category: 'economia',
    titleKey: 'event.vaga.title',
    descKey: 'event.vaga.desc',
    weight: () => 1.8,
    choices: [
      {
        id: 'secundar',
        labelKey: 'event.vaga.choice.secundar',
        // Perds el jornal del dia de vaga, però reforces el poder col·lectiu i n'arrenques una
        // millora salarial compartida. Solidaritat → una mica de moralitat.
        effect: {
          efectiu: -200,
          poderSindicalDelta: 0.2,
          salariDelta: 120,
          benestar: -1,
          moralitatDelta: 2,
        },
      },
      {
        id: 'esquirol',
        labelKey: 'event.vaga.choice.esquirol',
        // Vas a treballar mentre els companys fan vaga: ni guany col·lectiu ni solidaritat.
        effect: { benestar: 1, moralitatDelta: -3 },
      },
    ],
  },
]

/**
 * DECISIONS MORALS de la vida adulta: cruïlles on la via ràpida als diners costa moralitat i la
 * via justa costa diners. Disponibles a tothom (gating fi per banda moral a `eventPool`: les
 * oportunitats clarament depredadores només arriben a qui ja s'hi ha endinsat). És la crítica
 * feta mecànica: el sistema premia qui no té escrúpols, però guanyar-ho tot té un preu humà.
 */
export const MORAL_EVENTS: GameEvent[] = [
  {
    id: 'frau_fiscal',
    category: 'economia',
    titleKey: 'event.frau_fiscal.title',
    descKey: 'event.frau_fiscal.desc',
    weight: () => 1,
    choices: [
      {
        id: 'defraudar',
        labelKey: 'event.frau_fiscal.choice.defraudar',
        // Estalvies impostos (diners ara) a canvi de moralitat i una mica d'angoixa.
        effect: { efectiu: 6000, moralitatDelta: -12, benestar: -1 },
      },
      {
        id: 'pagar',
        labelKey: 'event.frau_fiscal.choice.pagar',
        effect: { moralitatDelta: 3, benestar: 1 },
      },
    ],
  },
  {
    id: 'donatiu_solidari',
    category: 'familia',
    titleKey: 'event.donatiu_solidari.title',
    descKey: 'event.donatiu_solidari.desc',
    params: { amount: 2000 },
    weight: () => 1,
    choices: [
      {
        id: 'donar',
        labelKey: 'event.donatiu_solidari.choice.donar',
        // Dones diners a una causa: et costa efectiu però puja moralitat, vincles i benestar.
        effect: {
          efectiu: -2000,
          moralitatDelta: 9,
          vinclesDelta: 0.06,
          benestar: 3,
        },
      },
      {
        id: 'passar',
        labelKey: 'event.donatiu_solidari.choice.passar',
        effect: {},
      },
    ],
  },
  {
    id: 'voluntariat',
    category: 'familia',
    titleKey: 'event.voluntariat.title',
    descKey: 'event.voluntariat.desc',
    weight: () => 1,
    choices: [
      {
        id: 'apuntar',
        labelKey: 'event.voluntariat.choice.apuntar',
        effect: { moralitatDelta: 7, vinclesDelta: 0.08, benestar: 4 },
      },
      {
        id: 'no',
        labelKey: 'event.voluntariat.choice.no',
        effect: {},
      },
    ],
  },
]

/**
 * OPORTUNITATS DEPREDADORES: enriquir-se a costa dels altres. Només arriben a qui JA és
 * Neutral-tirant-a-Malvat (gating per banda moral a `eventPool`): el sistema obre portes a qui
 * no té escrúpols. Donen diners de debò, però enfonsen la moralitat.
 */
export const DEPREDADOR_EVENTS: GameEvent[] = [
  {
    id: 'desnonar_llogater',
    category: 'economia',
    titleKey: 'event.desnonar_llogater.title',
    descKey: 'event.desnonar_llogater.desc',
    // Només si ets propietari de més d'una casa (la lloguers): pujar el lloguer o desnonar.
    weight: () => 1,
    choices: [
      {
        id: 'desnonar',
        labelKey: 'event.desnonar_llogater.choice.desnonar',
        effect: { efectiu: 9000, moralitatDelta: -14, benestar: -1 },
      },
      {
        id: 'mantenir',
        labelKey: 'event.desnonar_llogater.choice.mantenir',
        effect: { moralitatDelta: 4, benestar: 1 },
      },
    ],
  },
  {
    id: 'suborn_feina',
    category: 'economia',
    titleKey: 'event.suborn_feina.title',
    descKey: 'event.suborn_feina.desc',
    weight: () => 1,
    choices: [
      {
        id: 'acceptar',
        labelKey: 'event.suborn_feina.choice.acceptar',
        effect: { efectiu: 12000, moralitatDelta: -15, benestar: -2 },
      },
      {
        id: 'denunciar',
        labelKey: 'event.suborn_feina.choice.denunciar',
        effect: { moralitatDelta: 8, benestar: -1, vinclesDelta: 0.03 },
      },
    ],
  },
]

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
    // Mercat de suma positiva: una feina ben feta crea valor i es reconeix (no tot és extracció).
    id: 'projecte_exitos',
    category: 'economia',
    titleKey: 'event.projecte_exitos.title',
    descKey: 'event.projecte_exitos.desc',
    weight: () => 1.2,
    effect: { salariDelta: 120, benestar: 6 },
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
    effect: { benestar: 3, vinclesDelta: 0.12, moralitatDelta: 2 },
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
        effect: { despesaGreu: 3000, benestar: 4, moralitatDelta: 4 },
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
 * HABITACIÓ compartida: viure en una habitació de lloguer no és com tenir un pis. Hi ha conflictes
 * amb els companys, soroll, manca d'intimitat i més inestabilitat. Esdeveniments propis (a sobre
 * dels de lloguer genèrics), gairebé tots benestar a la baixa: la precarietat habitacional viscuda.
 */
export const HABITACIO_EVENTS: GameEvent[] = [
  {
    id: 'conflicte_companys',
    category: 'familia',
    titleKey: 'event.conflicte_companys.title',
    descKey: 'event.conflicte_companys.desc',
    weight: () => 1.4,
    effect: { benestar: -6, vinclesDelta: -0.04 },
  },
  {
    id: 'soroll_nit',
    category: 'salut',
    titleKey: 'event.soroll_nit.title',
    descKey: 'event.soroll_nit.desc',
    weight: () => 1.2,
    effect: { benestar: -4, salutDelta: -2 },
  },
  {
    id: 'pujada_habitacio',
    category: 'economia',
    titleKey: 'event.pujada_habitacio.title',
    descKey: 'event.pujada_habitacio.desc',
    // L'habitació és el primer que apuja o et fan marxar: més inestabilitat que un pis.
    weight: () => 0.9,
    effect: { benestar: -7, perdHabitatge: true },
  },
]

/**
 * PROPIETAT: tenir casa pròpia dóna seguretat i arrelament (cap risc de desnonament), però porta
 * despeses pròpies del propietari (derrames de la comunitat, avaries, IBI, reformes) que el llogater
 * no paga. Gating per ser propietari a `eventPool`. La cara b de l'estabilitat: la casa també costa.
 */
export const PROPIETARI_EVENTS: GameEvent[] = [
  {
    id: 'derrama_comunitat',
    category: 'economia',
    titleKey: 'event.derrama_comunitat.title',
    descKey: 'event.derrama_comunitat.desc',
    params: { cost: 3000 },
    weight: () => 0.8,
    effect: { despesaGreu: 3000, benestar: -3 },
  },
  {
    id: 'avaria_llar',
    category: 'economia',
    titleKey: 'event.avaria_llar.title',
    descKey: 'event.avaria_llar.desc',
    params: { cost: 1800 },
    weight: () => 0.9,
    effect: { despesaGreu: 1800, benestar: -2 },
  },
  {
    id: 'la_meva_llar',
    category: 'familia',
    titleKey: 'event.la_meva_llar.title',
    descKey: 'event.la_meva_llar.desc',
    // L'arrelament de tenir casa pròpia: la seguretat de saber que ningú no et pot fer fora.
    weight: () => 1,
    effect: { benestar: 5, vinclesDelta: 0.04 },
  },
]

/**
 * ATZAR: la sort i la mala sort de la vida. Esdeveniments de variància ALTA i magnitud ALEATÒRIA
 * (l'import es sorteja amb el RNG, així que dues vides amb la mateixa classe poden divergir molt):
 * cops de sort, imprevistos cars, herències llunyanes, estafes. Pes baix però impacte gran. Fan
 * que el resultat no depengui NOMÉS de la classe i les decisions: la loteria de la vida també hi és.
 * La mitjana és lleugerament negativa (la sort no et fa ric tota sola), però la DISPERSIÓ creix.
 */
export const ATZAR_EVENTS: GameEvent[] = [
  {
    id: 'cop_de_sort',
    category: 'regal',
    titleKey: 'event.cop_de_sort.title',
    descKey: 'event.cop_de_sort.desc',
    weight: () => 0.4,
    resolve: (s: GameState) => {
      const r = rng(s.rngState + 5501).value
      return { inversions: Math.round((2000 + r * 13000) / 100) * 100, benestar: 4 }
    },
  },
  {
    id: 'imprevist_car',
    category: 'economia',
    titleKey: 'event.imprevist_car.title',
    descKey: 'event.imprevist_car.desc',
    weight: () => 0.5,
    resolve: (s: GameState) => {
      const r = rng(s.rngState + 6601).value
      return { despesaGreu: Math.round((1500 + r * 9000) / 100) * 100, benestar: -4 }
    },
  },
  {
    id: 'herencia_llunyana',
    category: 'regal',
    titleKey: 'event.herencia_llunyana.title',
    descKey: 'event.herencia_llunyana.desc',
    weight: () => 0.22,
    resolve: (s: GameState) => {
      const r = rng(s.rngState + 7701).value
      return {
        inversions: Math.round((3000 + r * 17000) / 100) * 100,
        benestar: 2,
        salutDelta: -1,
      }
    },
  },
  {
    id: 'estafa',
    category: 'economia',
    titleKey: 'event.estafa.title',
    descKey: 'event.estafa.desc',
    weight: () => 0.35,
    resolve: (s: GameState) => {
      // Et timen amb una inversió fraudulenta: perds una part (10-40%) dels estalvis invertits.
      const r = rng(s.rngState + 8801).value
      const pct = 0.1 + r * 0.3
      return {
        inversions: -Math.round(s.person.patrimoni.inversions * pct),
        benestar: -6,
      }
    },
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
            moralitatDelta: 3,
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
