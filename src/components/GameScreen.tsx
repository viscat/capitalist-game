import { useGame } from '../state/GameContext'
import { useT } from '../i18n'
import { edatAnys, estacioFromEdat } from '../domain/time'
import { nomComplet } from '../domain/identitat'
import { ActionPanel } from './ActionPanel'
import { BudgetPanel } from './BudgetPanel'
import { EventCard } from './EventCard'
import { PatrimoniPanel } from './PatrimoniPanel'
import { StatBar } from './StatBar'
import { SummaryBar } from './SummaryBar'
import { TurnLog } from './TurnLog'

export function GameScreen() {
  const { t } = useT()
  const { state, nextTurn, choose, reset, actions } = useGame()
  if (!state) return null

  const { person, familia, historial, pendingEvent, lifeStage, itinerari, salari } =
    state
  const anys = edatAnys(person.edatMesos)
  const lastEntry = historial[historial.length - 1]
  const esEstacional = lifeStage === 'adolescencia' || lifeStage === 'estudis_post'
  const esLaboral = lifeStage === 'laboral'
  const esInfancia = lifeStage === 'infancia'
  const aLatur = lifeStage === 'laboral' && itinerari === 'treball' && !salari
  const nom = state.identitat?.nom

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <SummaryBar
        nom={nom}
        benestar={person.stats.benestar}
        efectiu={person.patrimoni.efectiu}
        edatMesos={person.edatMesos}
        dataNaixement={state.dataNaixement}
      />
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            onClick={reset}
            className="text-xs text-slate-500 transition hover:text-slate-300"
          >
            ← {t('app.title')}
          </button>
          <h1 className="text-2xl font-bold text-slate-100">
            {state.identitat ? nomComplet(state.identitat) : t(`family.${familia.classe}.name`)}
          </h1>
          {state.identitat && (
            <div className="text-xs text-slate-500">
              {t(`family.${familia.classe}.name`)}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-slate-200">
            {anys === 0 ? t('game.ageZero') : t('game.age', { anys })}
          </div>
          <div className="text-sm text-slate-500">
            {aLatur
              ? t('context.atur')
              : itinerari
                ? t(`itinerari.${itinerari}.short`)
                : t(`game.stage.${lifeStage}`)}
            {esEstacional &&
              ` · ${t(`season.${estacioFromEdat(person.edatMesos)}`)}`}{' '}
            · {t('game.turn', { torn: state.torn })}
          </div>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[18rem_1fr_18rem]">
        <aside className="space-y-4">
          <StatBar benestar={person.stats.benestar} />
          <PatrimoniPanel
            person={person}
            familia={familia}
            stage={lifeStage}
            itinerari={itinerari}
            salari={salari}
            identitat={state.identitat}
          />
        </aside>

        <main className="space-y-4">
          <EventCard
            pending={pendingEvent}
            lastEntry={lastEntry}
            onChoose={choose}
          />
          {!pendingEvent && esEstacional && (
            <ActionPanel actions={actions} onAct={(id) => nextTurn(id)} />
          )}
          {!pendingEvent && esLaboral && <BudgetPanel />}
          {!pendingEvent && esInfancia && (
            <button
              onClick={() => nextTurn()}
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
