import type { LogEntry } from '../domain/types'
import { useT } from '../i18n'
import { formatEuros } from '../lib/format'
import { Icon, TriangleAlert, Users } from './icons'
import { EffectList } from './EffectList'

export function TurnLog({ historial }: { historial: LogEntry[] }) {
  const { t } = useT()
  const items = [...historial].reverse()

  return (
    <div className="rounded-xl bg-surface/40 p-4">
      <h3 className="mb-3 text-sm font-semibold text-inksoft">
        {t('log.title')}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-inkfaint">{t('log.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((entry, i) => (
            <li
              key={`${entry.torn}-${i}`}
              className={`border-l-2 pl-3 ${
                entry.kind === 'action'
                  ? 'border-accent/60'
                  : 'border-line'
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-ink">
                  {entry.kind === 'action' && '▸ '}
                  {t(entry.titleKey)}
                </span>
                <span className="shrink-0 text-xs text-inkfaint">
                  {t('game.age', { anys: entry.edatAnys })}
                </span>
              </div>
              {entry.choiceLabelKey && (
                <p className="mt-0.5 text-xs italic text-inkfaint">
                  {t('log.choice', { opcio: t(entry.choiceLabelKey) })}
                </p>
              )}
              <div className="mt-1">
                <EffectList effect={entry.effect} />
              </div>
              {entry.donacio ? (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-money">
                  <Icon icon={Users} size={12} />
                  {t('note.donacio', { amount: formatEuros(entry.donacio) })}
                </p>
              ) : null}
              {entry.descobert ? (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-gold">
                  <Icon icon={TriangleAlert} size={12} />
                  {t('note.descobert', { amount: formatEuros(entry.descobert) })}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
