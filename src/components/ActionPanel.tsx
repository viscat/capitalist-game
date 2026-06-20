import type { GameAction } from '../domain/types'
import { useT } from '../i18n'
import { EffectList } from './EffectList'

export function ActionPanel({
  actions,
  onAct,
}: {
  actions: GameAction[]
  onAct: (id: string) => void
}) {
  const { t } = useT()
  return (
    <div className="rounded-2xl bg-slate-800/70 p-5 ring-1 ring-slate-700/50">
      <h3 className="mb-3 text-sm font-semibold text-slate-300">
        {t('action.title')}
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {actions.map((a) => (
          <button
            key={a.id}
            onClick={() => onAct(a.id)}
            className="flex flex-col gap-1.5 rounded-lg bg-slate-700/60 p-3 text-left transition hover:bg-indigo-600/80"
          >
            <span className="font-medium text-slate-100">{t(a.labelKey)}</span>
            <span className="text-xs text-slate-400">{t(a.descKey)}</span>
            <EffectList effect={a.effect} />
          </button>
        ))}
      </div>
    </div>
  )
}
