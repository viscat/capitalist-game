import type { GameAction } from '../types'

// Dedicació de cada any d'universitat (18-22). A diferència de les fases joves, aquí es
// tria UNA sola dedicació per any (no és multiselecció): com enfoques el curs. Dóna textura
// i decisions a una fase que abans només era «Següent any».
export const UNIVERSITY_ACTIONS: GameAction[] = [
  {
    id: 'uni_estudis',
    category: 'escola',
    labelKey: 'uni.estudis.label',
    descKey: 'uni.estudis.desc',
    // Estudiar a fons és un SACRIFICI de benestar: estrès, no surts, no vius la teva joventut
    // ni socialitzes mentre els altres sí. No dóna benestar (en TREU) però apuja el nivell
    // acadèmic, que es paga DESPRÉS (millor sou i ocupabilitat). La pujada acadèmica és LENTA
    // (~0,30 a fons en 4 anys). Qui grinya els estudis arriba a la vida adulta amb el benestar i
    // els vincles tocats: la inversió en futur es paga amb la vida d'ara.
    effect: { benestar: -7, academicDelta: 0.07, vinclesDelta: -0.02 },
  },
  {
    id: 'uni_treball',
    category: 'economia',
    labelKey: 'uni.treball.label',
    descKey: 'uni.treball.desc',
    // Diners ara, però cansa i et treu temps d'estudiar (no apuja el nivell acadèmic).
    // Menys generós que abans perquè no eclipsi la via d'estudiar a fons.
    effect: { efectiu: 1500, benestar: -4 },
  },
  {
    id: 'uni_social',
    category: 'familia',
    labelKey: 'uni.social.label',
    descKey: 'uni.social.desc',
    effect: { benestar: 4, vinclesDelta: 0.12 },
  },
]
