import type { CSSProperties } from 'react'
import { MILESTONES } from '../domain/milestones'
import { patrimoniTotal } from '../domain/stats'
import { useGame } from '../state/GameContext'
import { useCoachmark } from '../state/tutorial'
import { useT } from '../i18n'
import { formatEurosCompact } from '../lib/format'
import { useCountUp } from '../lib/useCountUp'
import { LifeCharts } from './LifeCharts'
import { SalutAvis, StatRings } from './StatRings'

function benestarBucket(b: number): string {
  if (b < 20) return 'molt_baix'
  if (b < 40) return 'baix'
  if (b < 60) return 'mig'
  if (b < 80) return 'alt'
  return 'molt_alt'
}

export function MilestoneScreen() {
  const { t } = useT()
  const { state, chooseMilestone } = useGame()
  const esJubilacio = state?.pendingMilestone === 'jubilacio'
  const coachRef = useCoachmark<HTMLDivElement>(esJubilacio ? 'jubilacio' : 'milestone')
  // Hooks abans de qualsevol return condicional (regles dels hooks): valors segurs si no hi ha estat.
  const benestar = Math.round(state?.person.stats.benestar ?? 0)
  const benestarAnimat = Math.round(useCountUp(benestar))
  const patrimoniAnimat = Math.round(useCountUp(state ? patrimoniTotal(state.person) : 0))
  if (!state?.pendingMilestone) return null

  const def = MILESTONES[state.pendingMilestone]
  const bucket = benestarBucket(benestar)
  const unaOpcio = def.options.length === 1

  return (
    <div className="flex min-h-[100dvh] flex-col p-4">
      {/* Barra superior fixa amb els 4 stats vitals, també a les fites d'edat. */}
      <div className="mx-auto w-full max-w-md rounded-2xl border border-line/60 bg-bg2/70 px-4 py-2.5 backdrop-blur-xl">
        <StatRings
          benestar={state.person.stats.benestar}
          salut={state.person.stats.salut}
          moralitat={state.person.stats.moralitat}
          academic={state.nivellAcademic}
          vincles={state.vinclesSocials}
        />
        <SalutAvis salut={state.person.stats.salut} />
      </div>

      <div className="m-auto w-full max-w-md py-6">
        <div className="relative">
          {/* Halo d'una pulsació darrere el títol: el moment "respira" en obrir-se. */}
          <div
            aria-hidden
            className={`animate-halo-once pointer-events-none absolute -inset-x-6 -top-4 -bottom-2 -z-10 rounded-full blur-2xl ${
              esJubilacio ? 'bg-gold/20' : 'bg-accent/20'
            }`}
          />
          <p
            ref={coachRef}
            className={`text-xs font-bold uppercase tracking-[0.18em] ${
              esJubilacio ? 'text-gold' : 'text-accent2'
            }`}
          >
            {t(def.kickerKey)}
          </p>
          <h1 className="animate-title-settle mt-1 text-3xl font-black text-ink">
            {t(def.titleKey)}
          </h1>
        </div>

        {/* Resum de l'etapa */}
        <div
          className="animate-reveal-up mt-6 rounded-2xl bg-surface/70 p-5 ring-1 ring-line/50 shadow-card"
          style={{ '--i': 1 } as CSSProperties}
        >
          <h2 className="text-sm font-semibold text-inksoft">
            {t(def.summaryTitleKey)}
          </h2>
          <p className="mt-2 text-inksoft">
            {t(`${def.summaryPrefix}.${bucket}`)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-inkfaint">
                {t('transition.benestar')}
              </div>
              <div className="text-2xl font-bold tabular-nums text-money">
                {benestarAnimat}
                <span className="text-base font-normal text-inkfaint">/100</span>
              </div>
              <div className="text-xs text-inkfaint">{t(`benestar.${bucket}`)}</div>
            </div>
            <div>
              <div className="text-xs text-inkfaint">
                {t('transition.estalvi')}
              </div>
              <div className="text-2xl font-bold tabular-nums text-money">
                {formatEurosCompact(patrimoniAnimat)}
              </div>
              <div className="text-xs text-inkfaint">
                {t(`family.${state.familia.classe}.name`)}
              </div>
            </div>
          </div>
        </div>

        {/* Lore */}
        <div
          className="animate-reveal-up mt-4 rounded-2xl bg-surface/40 p-5"
          style={{ '--i': 2 } as CSSProperties}
        >
          <h2 className="text-sm font-semibold text-inksoft">
            {t(def.loreTitleKey)}
          </h2>
          {def.loreKeys.map((k) => (
            <p key={k} className="mt-2 leading-relaxed text-inksoft">
              {t(k)}
            </p>
          ))}
        </div>

        {/* Evolució fins ara: stats, patrimoni net i IPC (inflació) */}
        {state.vidaHist && state.vidaHist.length >= 2 && (
          <div className="animate-reveal-up mt-4" style={{ '--i': 3 } as CSSProperties}>
            <LifeCharts hist={state.vidaHist} />
          </div>
        )}

        {/* Opcions */}
        {unaOpcio ? (
          <button
            onClick={() => chooseMilestone(def.options[0].id)}
            className="btn-game btn-game--gold animate-pulse-glow mt-6"
          >
            {t(def.options[0].labelKey)}
          </button>
        ) : (
          <div className="mt-6 grid gap-2.5">
            {def.options.map((o) => (
              <button
                key={o.id}
                onClick={() => chooseMilestone(o.id)}
                className="option-card flex-col items-start gap-1"
              >
                <span className="font-semibold text-ink">{t(o.labelKey)}</span>
                <span className="text-xs text-inksoft">{t(o.descKey)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
