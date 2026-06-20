import type { EventCategory, GameEvent, LogEntry } from '../domain/types'
import { useT } from '../i18n'
import { EffectList } from './EffectList'

function CategoryBadge({ category }: { category: EventCategory }) {
  const { t } = useT()
  return (
    <span className="inline-block rounded-full bg-slate-700/70 px-2.5 py-0.5 text-xs font-medium text-slate-300">
      {t(`category.${category}`)}
    </span>
  )
}

const CARD = 'rounded-2xl bg-slate-800/70 p-6 ring-1 ring-slate-700/50'

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

  if (pending) {
    return (
      <div className={CARD}>
        <CategoryBadge category={pending.category} />
        <h2 className="mt-3 text-xl font-bold text-slate-100">
          {t(pending.titleKey)}
        </h2>
        <p className="mt-2 text-slate-300">{t(pending.descKey, pending.params)}</p>
        <div className="mt-5 mb-2 text-sm font-semibold text-slate-400">
          {t('event.choose')}
        </div>
        <div className="flex flex-col gap-2">
          {pending.choices?.map((c) => (
            <button
              key={c.id}
              onClick={() => onChoose(c.id)}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-left font-medium text-white transition hover:bg-indigo-500"
            >
              {t(c.labelKey)}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (lastEntry) {
    return (
      <div className={CARD}>
        <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">
          {t('event.thisYear')}
        </div>
        <CategoryBadge category={lastEntry.category} />
        <h2 className="mt-3 text-xl font-bold text-slate-100">
          {t(lastEntry.titleKey)}
        </h2>
        <p className="mt-2 text-slate-300">
          {t(lastEntry.descKey, lastEntry.params)}
        </p>
        {lastEntry.choiceLabelKey && (
          <p className="mt-2 text-sm italic text-slate-400">
            {t('log.choice', { opcio: t(lastEntry.choiceLabelKey) })}
          </p>
        )}
        <div className="mt-4">
          <EffectList effect={lastEntry.effect} />
        </div>
      </div>
    )
  }

  return (
    <div className={CARD}>
      <h2 className="text-xl font-bold text-slate-100">
        {t('game.birth.title')}
      </h2>
      <p className="mt-2 text-slate-300">{t('game.birth.desc')}</p>
    </div>
  )
}
