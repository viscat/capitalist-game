import type { EventCategory, GameEvent, LogEntry } from '../domain/types'
import { useT } from '../i18n'
import { useCoachmark } from '../state/tutorial'
import { formatEuros } from '../lib/format'
import { EffectList } from './EffectList'

function CategoryBadge({ category }: { category: EventCategory }) {
  const { t } = useT()
  return (
    <span className="inline-flex items-center rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-accent2 ring-1 ring-accent/25">
      {t(`category.${category}`)}
    </span>
  )
}

const CARD =
  'relative overflow-hidden rounded-2xl bg-surface/90 p-5 ring-1 ring-line/60 shadow-card animate-card-in'

export function EventCard({
  pending,
  lastEntry,
  onChoose,
}: {
  pending?: GameEvent
  lastEntry?: LogEntry
  onChoose: (id: string) => void
}) {
  const { t } = useT()
  const choiceRef = useCoachmark<HTMLDivElement>('event_choice')
  const resultRef = useCoachmark<HTMLDivElement>('event_result')

  if (pending) {
    return (
      <div ref={choiceRef} className={CARD} key={pending.id}>
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent to-accent2" />
        <CategoryBadge category={pending.category} />
        <h2 className="mt-3 text-xl font-bold text-ink">{t(pending.titleKey)}</h2>
        <p className="mt-2 text-inksoft">{t(pending.descKey, pending.params)}</p>
        <div className="mt-5 mb-2 text-xs font-bold uppercase tracking-wider text-inkfaint">
          {t('event.choose')}
        </div>
        <div className="flex flex-col gap-2.5">
          {pending.choices?.map((c) => (
            <button key={c.id} onClick={() => onChoose(c.id)} className="option-card group">
              <span className="font-semibold text-ink">{t(c.labelKey)}</span>
              <span className="text-accent2 transition-transform group-active:translate-x-0.5">
                ›
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (lastEntry) {
    return (
      <div ref={resultRef} className={CARD} key={lastEntry.torn + lastEntry.eventId}>
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-money to-money2 opacity-60" />
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-inkfaint">
          {t('event.thisYear')}
        </div>
        <CategoryBadge category={lastEntry.category} />
        <h2 className="mt-3 text-xl font-bold text-ink">{t(lastEntry.titleKey)}</h2>
        <p className="mt-2 text-inksoft">{t(lastEntry.descKey, lastEntry.params)}</p>
        {lastEntry.choiceLabelKey && (
          <p className="mt-2 text-sm italic text-inkfaint">
            {t('log.choice', { opcio: t(lastEntry.choiceLabelKey) })}
          </p>
        )}
        <div className="mt-4">
          <EffectList effect={lastEntry.effect} />
        </div>
        {lastEntry.donacio ? (
          <p className="mt-3 text-sm font-medium text-money">
            👪 {t('note.donacio', { amount: formatEuros(lastEntry.donacio) })}
          </p>
        ) : null}
        {lastEntry.descobert ? (
          <p className="mt-1 text-sm font-medium text-gold">
            ⚠️ {t('note.descobert', { amount: formatEuros(lastEntry.descobert) })}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className={CARD}>
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent to-accent2" />
      <h2 className="text-xl font-bold text-ink">{t('game.birth.title')}</h2>
      <p className="mt-2 text-inksoft">{t('game.birth.desc')}</p>
    </div>
  )
}
