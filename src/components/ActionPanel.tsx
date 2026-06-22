import type { ActionOption } from '../domain/types'
import { useT } from '../i18n'
import { EffectList } from './EffectList'

export function ActionPanel({
  actions,
  onAct,
}: {
  actions: ActionOption[]
  onAct: (id: string) => void
}) {
  const { t } = useT()
  return (
    <div className="rounded-2xl bg-slate-800/70 p-5 ring-1 ring-slate-700/50">
      <h3 className="text-sm font-semibold text-slate-300">
        {t('action.title')}
      </h3>
      <p className="mb-3 text-xs text-slate-500">{t('action.nota')}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {actions.map(({ action, disabled, reasonKey }) => (
          <button
            key={action.id}
            onClick={() => onAct(action.id)}
            disabled={disabled}
            aria-disabled={disabled}
            className={
              disabled
                ? 'flex cursor-not-allowed flex-col gap-1.5 rounded-lg bg-slate-800/40 p-3 text-left opacity-50 ring-1 ring-slate-700/50'
                : 'flex flex-col gap-1.5 rounded-lg bg-slate-700/60 p-3 text-left transition hover:bg-indigo-600/80'
            }
          >
            <span className="font-medium text-slate-100">
              {t(action.labelKey)}
            </span>
            {disabled && reasonKey ? (
              <span className="text-xs font-medium text-amber-400/90">
                🔒 {t(reasonKey)}
              </span>
            ) : (
              <span className="text-xs text-slate-400">{t(action.descKey)}</span>
            )}
            <EffectList effect={action.effect} />
          </button>
        ))}
      </div>
    </div>
  )
}
