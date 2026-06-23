import { useGame } from '../state/GameContext'
import { useT } from '../i18n'
import { edatAnys } from '../domain/time'
import { patrimoniTotal } from '../domain/stats'
import { nomComplet } from '../domain/identitat'
import { ActionPanel } from './ActionPanel'
import { BudgetPanel } from './BudgetPanel'
import { HabitatgePanel } from './HabitatgePanel'
import { InvestmentPanel } from './InvestmentPanel'
import { InvestmentChart } from './InvestmentChart'
import { JobSearchPanel } from './JobSearchPanel'
import { UniversityPanel } from './UniversityPanel'
import { EventCard } from './EventCard'
import { PatrimoniPanel } from './PatrimoniPanel'
import { StatBar } from './StatBar'
import { SummaryBar } from './SummaryBar'
import { TurnLog } from './TurnLog'

export function GameScreen() {
  const { t } = useT()
  const { state, nextTurn, choose, reset } = useGame()
  if (!state) return null

  const { person, familia, historial, pendingEvent, lifeStage, itinerari, salari } =
    state
  const anys = edatAnys(person.edatMesos)
  const lastEntry = historial[historial.length - 1]
  const esAccions = lifeStage === 'adolescencia' || lifeStage === 'estudis_post'
  const esLaboral = lifeStage === 'laboral'
  const esInfancia = lifeStage === 'infancia'
  const esUniversitat = lifeStage === 'universitat'
  const esCarrera = lifeStage === 'carrera'
  // A la carrera sense sou s'està buscant feina (a l'entrada o després d'un acomiadament).
  const esCercaFeina = esCarrera && !salari
  const esAdult = esUniversitat || esCarrera
  // El botó simple de «Següent any» val només per a la infància (la universitat té el seu
  // panell de dedicació anual).
  const esAnual = esInfancia
  const aLatur =
    (lifeStage === 'laboral' && itinerari === 'treball' && !salari) || esCercaFeina
  const nom = state.identitat?.nom
  const net = patrimoniTotal(person) - (state.habitatge?.hipoteca?.deute ?? 0)

  // A les fases adultes prevalen l'etiqueta de fase per damunt de l'itinerari dels 16.
  const subtitol = aLatur
    ? t('context.atur')
    : esAdult || !itinerari
      ? t(`game.stage.${lifeStage}`)
      : t(`itinerari.${itinerari}.short`)

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <SummaryBar
        nom={nom}
        benestar={person.stats.benestar}
        net={net}
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
            {subtitol} · {t('game.turn', { torn: state.torn })}
          </div>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[18rem_1fr_18rem]">
        <aside className="order-2 space-y-4 lg:order-1">
          <StatBar
            benestar={person.stats.benestar}
            vincles={state.vinclesSocials}
            sequela={state.salutCronica}
          />
          <PatrimoniPanel
            person={person}
            familia={familia}
            stage={lifeStage}
            itinerari={itinerari}
            salari={salari}
            identitat={state.identitat}
            habitatge={state.habitatge}
          />
        </aside>

        <main className="order-1 space-y-4 lg:order-2">
          <EventCard
            pending={pendingEvent}
            lastEntry={lastEntry}
            onChoose={choose}
          />
          {!pendingEvent && esAccions && <ActionPanel />}
          {!pendingEvent && esLaboral && <BudgetPanel />}
          {!pendingEvent && esUniversitat && <UniversityPanel />}
          {!pendingEvent && esCercaFeina && <JobSearchPanel />}
          {!pendingEvent && esAdult && !esCercaFeina && <HabitatgePanel />}
          {!pendingEvent && esCarrera && !esCercaFeina && <InvestmentPanel />}
          {esCarrera && state.patrimoniHist && state.patrimoniHist.length >= 2 && (
            <InvestmentChart hist={state.patrimoniHist} />
          )}
          {!pendingEvent && esAnual && (
            <button
              onClick={() => nextTurn()}
              className="w-full rounded-xl bg-emerald-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-emerald-500"
            >
              {t('game.nextYear')}
            </button>
          )}
        </main>

        <aside className="order-3 lg:order-3">
          <TurnLog historial={historial} />
        </aside>
      </div>
    </div>
  )
}
