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
    effect: { benestar: 5 },
  },
  {
    id: 'uni_treball',
    category: 'economia',
    labelKey: 'uni.treball.label',
    descKey: 'uni.treball.desc',
    effect: { efectiu: 2500, benestar: -4 },
  },
  {
    id: 'uni_social',
    category: 'familia',
    labelKey: 'uni.social.label',
    descKey: 'uni.social.desc',
    effect: { benestar: 4, vinclesDelta: 0.12 },
  },
]
