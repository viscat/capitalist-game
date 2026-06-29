import { EDAT_FI_ADOLESCENCIA } from '../constants'
import { edatAnys } from '../time'
import type { GameAction } from '../types'

// Accions que el jove pot triar cada any (un torn = un any). Com que l'any és llarg,
// se'n poden encadenar DIVERSES fins a esgotar el pressupost de TEMPS (setmanes) o de
// DINERS: la tensió és repartir temps/diners entre gaudir, ingressar i descansar. Cada
// acció té un cost de temps (`setmanes`) a banda del seu efecte econòmic/benestar.
// No triar res = temps lliure (l'any passa sense efectes actius).
export const ADOLESCENCE_ACTIONS: GameAction[] = [
  {
    id: 'estudiar',
    category: 'escola',
    labelKey: 'action.estudiar.label',
    descKey: 'action.estudiar.desc',
    // Dedicar-se als estudis: una mica menys de benestar (esforç), però apuja el nivell
    // acadèmic. Com més s'hi dedica (multiselecció), més puja. Val per a l'ESO i el batxillerat.
    // Pujada lenta (el coneixement s'acumula a poc a poc; no es domina una matèria en un any).
    effect: { benestar: -2, academicDelta: 0.03 },
    setmanes: 12,
  },
  {
    id: 'sortir_amics',
    category: 'escola',
    labelKey: 'action.sortir_amics.label',
    descKey: 'action.sortir_amics.desc',
    // Sortir amb els amics teixeix vincles (font de benestar no monetària).
    effect: { efectiu: -45, benestar: 6, vinclesDelta: 0.05 },
    setmanes: 10,
  },
  {
    id: 'hobby',
    category: 'escola',
    labelKey: 'action.hobby.label',
    descKey: 'action.hobby.desc',
    effect: { efectiu: -60, benestar: 5, vinclesDelta: 0.03 },
    setmanes: 12,
  },
  {
    id: 'caprici',
    category: 'economia',
    labelKey: 'action.caprici.label',
    descKey: 'action.caprici.desc',
    effect: { efectiu: -150, benestar: 9 },
    setmanes: 4,
  },
  {
    id: 'ajudar_casa',
    category: 'economia',
    labelKey: 'action.ajudar_casa.label',
    descKey: 'action.ajudar_casa.desc',
    effect: { efectiu: 60, benestar: -3 },
    setmanes: 8,
  },
  {
    id: 'vendre_coses',
    category: 'economia',
    labelKey: 'action.vendre_coses.label',
    descKey: 'action.vendre_coses.desc',
    effect: { efectiu: 40, benestar: -1 },
    setmanes: 4,
  },
  {
    id: 'feina_estiu',
    category: 'economia',
    labelKey: 'action.feina_estiu.label',
    descKey: 'action.feina_estiu.desc',
    effect: { efectiu: 700, benestar: -6 },
    setmanes: 20,
    // Treballar a l'estiu només a partir dels 16 (abans, ets massa jove).
    available: (s) => edatAnys(s.person.edatMesos) >= EDAT_FI_ADOLESCENCIA,
    lockedReasonKey: 'action.locked.edat16',
  },
]

export function findAction(id: string): GameAction | undefined {
  return ADOLESCENCE_ACTIONS.find((a) => a.id === id)
}
