import { MESOS_PER_ANY } from '../domain/constants'
import { useGame } from '../state/GameContext'
import { useT } from '../i18n'
import { EventCard } from './EventCard'
import { PatrimoniPanel } from './PatrimoniPanel'
import { StatBar } from './StatBar'
import { TurnLog } from './TurnLog'

export function GameScreen() {
  const { t } = useT()
  const { state, nextTurn, choose, reset } = useGame()
  if (!state) return null

  const { person, familia, historial, pendingEvent } = state
  const edatAnys = Math.floor(person.edatMesos / MESOS_PER_ANY)
  const lastEntry = historial[historial.length - 1]

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            onClick={reset}
            className="text-xs text-slate-500 transition hover:text-slate-300"
          >
            ← {t('app.title')}
          </button>
          <h1 className="text-2xl font-bold text-slate-100">
            {t(`family.${familia.classe}.name`)}
          </h1>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-slate-200">
            {edatAnys === 0 ? t('game.ageZero') : t('game.age', { anys: edatAnys })}
          </div>
          <div className="text-sm text-slate-500">
            {t('game.stage.infancia')} · {t('game.turn', { torn: state.torn })}
          </div>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[18rem_1fr_18rem]">
        <aside className="space-y-4">
          <StatBar benestar={person.stats.benestar} />
          <PatrimoniPanel person={person} familia={familia} />
        </aside>

        <main className="space-y-4">
          <EventCard
            pending={pendingEvent}
            lastEntry={lastEntry}
            onChoose={choose}
          />
          {!pendingEvent && (
            <button
              onClick={nextTurn}
              className="w-full rounded-xl bg-emerald-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-emerald-500"
            >
              {t('game.nextYear')}
            </button>
          )}
        </main>

        <aside>
          <TurnLog historial={historial} />
        </aside>
      </div>
    </div>
  )
}
