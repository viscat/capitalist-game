import { useState } from 'react'
import type { ReactNode } from 'react'
import { useGame } from '../state/GameContext'
import { useT } from '../i18n'
import { patrimoniTotal } from '../domain/stats'
import { nomComplet } from '../domain/identitat'
import { ActionCTA, ActionPanel } from './ActionPanel'
import { AppShell } from './AppShell'
import { BudgetPanel } from './BudgetPanel'
import { GameHud } from './GameHud'
import { HabitatgePanel } from './HabitatgePanel'
import { InvestmentPanel } from './InvestmentPanel'
import { InvestmentChart } from './InvestmentChart'
import { JobSearchPanel } from './JobSearchPanel'
import { UniversityPanel } from './UniversityPanel'
import { EventCard } from './EventCard'
import { FamiliaPanel } from './FamiliaPanel'
import { PatrimoniPanel } from './PatrimoniPanel'
import { StatBar } from './StatBar'
import { TurnLog } from './TurnLog'

export function GameScreen() {
  const { t } = useT()
  const { state, choose, reset, nextTurn } = useGame()
  const [detallObert, setDetallObert] = useState(false)
  if (!state) return null

  const { person, familia, historial, pendingEvent, lifeStage, itinerari, salari } = state
  const lastEntry = historial[historial.length - 1]
  const esAccions = lifeStage === 'adolescencia' || lifeStage === 'estudis_post'
  const esLaboral = lifeStage === 'laboral'
  const esInfancia = lifeStage === 'infancia'
  const esUniversitat = lifeStage === 'universitat'
  const esCarrera = lifeStage === 'carrera'
  const esJubilacio = lifeStage === 'jubilacio'
  const esCercaFeina = esCarrera && !salari
  const esAdult = esUniversitat || esCarrera || esJubilacio
  const esInversio = esCarrera || esJubilacio
  const esAnual = esInfancia
  const aLatur =
    (lifeStage === 'laboral' && itinerari === 'treball' && !salari) || esCercaFeina
  const nom = state.identitat ? nomComplet(state.identitat) : t(`family.${familia.classe}.name`)
  const net = patrimoniTotal(person) - (state.habitatge?.hipoteca?.deute ?? 0)

  const subtitol = aLatur
    ? t('context.atur')
    : esAdult || !itinerari
      ? t(`game.stage.${lifeStage}`)
      : t(`itinerari.${itinerari}.short`)

  const hud = (
    <GameHud
      nom={nom}
      subtitol={subtitol}
      benestar={person.stats.benestar}
      salut={person.stats.salut}
      academic={state.nivellAcademic}
      vincles={state.vinclesSocials}
      net={net}
      edatMesos={person.edatMesos}
      dataNaixement={state.dataNaixement}
      generacio={state.generacio ?? 1}
      fills={state.fills}
      parella={Boolean(state.parella)}
      onBack={reset}
    />
  )

  // CTA primari de la fase, al peu FIX del shell (sempre visible, mai tapa el contingut).
  // Les fases de llista de tries (esdeveniment, universitat, cerca de feina) no en tenen:
  // les seves opcions JA són botons dins del cos.
  const footer = pendingEvent ? null : esAccions ? (
    <ActionCTA />
  ) : esLaboral ? (
    <button onClick={() => nextTurn()} className="btn-game btn-game--money">
      {t('budget.nextYear')}
    </button>
  ) : esInversio && !esCercaFeina ? (
    <button onClick={() => nextTurn()} className="btn-game btn-game--money">
      {t('pla.nextYear')}
    </button>
  ) : esAnual ? (
    <button
      onClick={() => nextTurn()}
      className="btn-game btn-game--money animate-pulse-glow"
    >
      {t('game.nextYear')}
    </button>
  ) : null

  return (
    <AppShell hud={hud} footer={footer}>
      <EventCard pending={pendingEvent} lastEntry={lastEntry} onChoose={choose} />

      {!pendingEvent && esAccions && <ActionPanel />}
      {!pendingEvent && esLaboral && <BudgetPanel />}
      {!pendingEvent && esUniversitat && <UniversityPanel />}
      {!pendingEvent && esCercaFeina && <JobSearchPanel />}
      {!pendingEvent && esAdult && !esCercaFeina && <HabitatgePanel />}
      {!pendingEvent && esInversio && !esCercaFeina && <InvestmentPanel />}
      {esInversio && state.patrimoniHist && state.patrimoniHist.length >= 2 && (
        <div className="mt-3">
          <InvestmentChart hist={state.patrimoniHist} />
        </div>
      )}

      {/* Accés al detall (patrimoni + historial) en un calaix, per no competir per l'espai. */}
      <button
        onClick={() => setDetallObert(true)}
        className="mt-4 w-full rounded-xl border border-line/60 bg-surface/50 py-2 text-xs font-medium text-inksoft transition hover:bg-surface"
      >
        📊 {t('game.detalls')}
      </button>

      {detallObert && (
        <DetallDrawer onClose={() => setDetallObert(false)}>
          <StatBar
            benestar={person.stats.benestar}
            salut={person.stats.salut}
            vincles={state.vinclesSocials}
            sequela={state.salutCronica}
            academic={state.nivellAcademic}
            fills={state.fills}
          />
          <FamiliaPanel state={state} />
          <PatrimoniPanel
            person={person}
            familia={familia}
            stage={lifeStage}
            itinerari={itinerari}
            salari={salari}
            identitat={state.identitat}
            habitatge={state.habitatge}
          />
          <TurnLog historial={historial} />
        </DetallDrawer>
      )}
    </AppShell>
  )
}

/** Calaix inferior (bottom-sheet) amb el detall: patrimoni i historial. */
function DetallDrawer({
  children,
  onClose,
}: {
  children: ReactNode
  onClose: () => void
}) {
  const { t } = useT()
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true">
      <button
        aria-label={t('game.tancar')}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
      />
      <div className="relative max-h-[80dvh] overflow-y-auto rounded-t-2xl border-t border-line/60 bg-bg2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-card animate-bar-up">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink">📊 {t('game.detalls')}</h2>
          <button
            onClick={onClose}
            className="rounded-lg bg-surface2 px-3 py-1 text-sm text-inksoft transition hover:text-ink"
          >
            {t('game.tancar')}
          </button>
        </div>
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  )
}
