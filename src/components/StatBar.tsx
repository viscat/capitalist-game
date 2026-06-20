import { useT } from '../i18n'
import { benestarColor, benestarLevelKey } from '../lib/format'

export function StatBar({ benestar }: { benestar: number }) {
  const { t } = useT()
  const value = Math.round(benestar)
  return (
    <div className="rounded-xl bg-slate-800/60 p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-medium text-slate-300">
          {t('stat.benestar')}
        </span>
        <span className="text-sm text-slate-400">
          {t(benestarLevelKey(value))} · {value}/100
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-700">
        <div
          className={`h-full rounded-full transition-all duration-500 ${benestarColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
