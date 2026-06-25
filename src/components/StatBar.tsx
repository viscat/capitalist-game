import { useT } from '../i18n'
import { benestarColor, benestarLevelKey } from '../lib/format'

export function StatBar({
  benestar,
  vincles = 0,
  sequela = 0,
  academic = 0,
  fills = 0,
}: {
  benestar: number
  /** Vincles socials 0..1 (font de benestar no monetària). */
  vincles?: number
  /** Penalització crònica de benestar acumulada (seqüeles). */
  sequela?: number
  /** Nivell acadèmic 0..1 (millora sou i ocupabilitat en sortir de la universitat). */
  academic?: number
  /** Nombre de fills (descendència). */
  fills?: number
}) {
  const { t } = useT()
  const value = Math.round(benestar)
  const vinclesPct = Math.round(vincles * 100)
  const academicPct = Math.round(academic * 100)
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
      <div
        className="h-3 w-full overflow-hidden rounded-full bg-slate-700"
        title={t('stat.benestar.tip')}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${benestarColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
      {(vinclesPct > 0 || sequela > 0 || academicPct > 0 || fills > 0) && (
        <div className="mt-3 space-y-1.5 border-t border-slate-700/60 pt-2.5">
          {fills > 0 && (
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-400" title={t('stat.fills.tip')}>
                👶 {t('stat.fills')}
              </span>
              <span className="font-medium text-slate-200">{fills}</span>
            </div>
          )}
          {vinclesPct > 0 && (
            <div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-400" title={t('stat.vincles.tip')}>
                  🤝 {t('stat.vincles')}
                </span>
                <span className="text-slate-400">{vinclesPct}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-rose-400/80 transition-all duration-500"
                  style={{ width: `${vinclesPct}%` }}
                />
              </div>
            </div>
          )}
          {academicPct > 0 && (
            <div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-400" title={t('stat.academic.tip')}>
                  🎓 {t('stat.academic')}
                </span>
                <span className="text-slate-400">{academicPct}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-sky-400/80 transition-all duration-500"
                  style={{ width: `${academicPct}%` }}
                />
              </div>
            </div>
          )}
          {sequela > 0 && (
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-red-300" title={t('stat.sequela.tip')}>
                🩹 {t('stat.sequela')}
              </span>
              <span className="font-medium text-red-400">−{Math.round(sequela)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
