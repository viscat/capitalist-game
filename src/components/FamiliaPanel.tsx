import type { GameState } from '../domain/types'
import { edatAnys } from '../domain/time'
import { useT } from '../i18n'
import { Baby, HeartHandshake, Icon } from './icons'

/**
 * Bloc «Família»: mostra la parella (si n'hi ha) i cada fill amb el seu nom i l'edat actual.
 * Només es renderitza quan hi ha alguna cosa a mostrar (parella o fills).
 */
export function FamiliaPanel({ state }: { state: GameState }) {
  const { t } = useT()
  const fills = state.fills ?? 0
  if (!state.parella && fills === 0) return null

  const edatProgenitor = edatAnys(state.person.edatMesos)
  const naixements = state.fillsNaixement ?? []
  const noms = state.fillsNoms ?? []

  return (
    <div className="rounded-xl bg-surface/60 p-4">
      <h3 className="mb-3 text-sm font-semibold text-inksoft">
        👨‍👩‍👧 {t('familia.title')}
      </h3>
      <div className="space-y-1.5">
        {state.parella && (
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1.5 text-inksoft">
              <Icon icon={HeartHandshake} size={14} /> {t('familia.parella')}
            </span>
            <span className="font-medium text-ink">{state.parella.nom}</span>
          </div>
        )}
        {fills > 0 &&
          Array.from({ length: fills }).map((_, i) => {
            const edat = Math.max(0, edatProgenitor - edatAnys(naixements[i] ?? 0))
            return (
              <div key={i} className="flex justify-between text-sm">
                <span className="flex items-center gap-1.5 text-inksoft">
                  <Icon icon={Baby} size={14} /> {noms[i] ?? t('familia.fill')}
                </span>
                <span className="font-medium text-ink">
                  {t('familia.edat', { anys: edat })}
                </span>
              </div>
            )
          })}
      </div>
    </div>
  )
}
