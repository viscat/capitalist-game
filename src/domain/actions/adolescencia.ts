import type { GameAction } from '../types'

// Accions que l'adolescent pot triar cada any (un torn = un any). El nucli del joc
// en aquesta fase és la tensió entre gastar (benestar immediat) i estalviar /
// ingressar. Cada acció representa la decisió destacada de l'any (no és recurrent
// mensual), per això els imports són puntuals.
export const ADOLESCENCE_ACTIONS: GameAction[] = [
  {
    id: 'sortir_amics',
    category: 'escola',
    labelKey: 'action.sortir_amics.label',
    descKey: 'action.sortir_amics.desc',
    effect: { efectiu: -45, benestar: 6 },
  },
  {
    id: 'mes_tranquil',
    category: 'familia',
    labelKey: 'action.mes_tranquil.label',
    descKey: 'action.mes_tranquil.desc',
    effect: { benestar: -1 },
  },
  {
    id: 'ajudar_casa',
    category: 'economia',
    labelKey: 'action.ajudar_casa.label',
    descKey: 'action.ajudar_casa.desc',
    effect: { efectiu: 60, benestar: -3 },
  },
  {
    id: 'caprici',
    category: 'economia',
    labelKey: 'action.caprici.label',
    descKey: 'action.caprici.desc',
    effect: { efectiu: -150, benestar: 9 },
  },
  {
    id: 'feina_estiu',
    category: 'economia',
    labelKey: 'action.feina_estiu.label',
    descKey: 'action.feina_estiu.desc',
    effect: { efectiu: 700, benestar: -6 },
  },
]

export function findAction(id: string): GameAction | undefined {
  return ADOLESCENCE_ACTIONS.find((a) => a.id === id)
}
