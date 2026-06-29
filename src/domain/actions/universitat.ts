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
    // Estudiar fort estressa i no surts: no dóna benestar, però apuja el nivell acadèmic,
    // que es paga després (millor sou i ocupabilitat en sortir). La pujada és LENTA: dedicar-s'hi
    // a fons els 4 anys de carrera arriba a ~0,30 (no a 0,9): el coneixement s'acumula a poc a poc.
    effect: { benestar: -3, academicDelta: 0.07 },
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
