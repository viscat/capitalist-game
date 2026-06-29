import { useGame } from '../state/GameContext'
import { useT } from '../i18n'
import { EffectList } from './EffectList'

/**
 * Dedicació de l'any d'universitat: el jugador en tria UNA (estudiar a fons, treballar i
 * estudiar, o vida universitària) i avança l'any. Dóna decisions a una fase que abans era
 * només «Següent any».
 */
export function UniversityPanel() {
  const { t } = useT()
  const { actions, nextTurn } = useGame()

  return (
    <div className="rounded-2xl bg-surface/70 p-5 ring-1 ring-line/50">
      <h3 className="text-sm font-semibold text-inksoft">{t('uni.title')}</h3>
      <p className="mb-3 text-xs text-inkfaint">{t('uni.nota')}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {actions.map(({ action }) => (
          <button
            key={action.id}
            onClick={() => nextTurn([action.id])}
            className="flex flex-col gap-1.5 rounded-lg bg-surface2/60 p-3 text-left transition hover:bg-accent/70"
          >
            <span className="font-medium text-ink">{t(action.labelKey)}</span>
            <span className="text-xs text-inksoft">{t(action.descKey)}</span>
            <EffectList effect={action.effect} />
          </button>
        ))}
      </div>
    </div>
  )
}
