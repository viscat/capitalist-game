import { MILESTONES } from '../domain/milestones'
import { patrimoniTotal } from '../domain/stats'
import { useGame } from '../state/GameContext'
import { useCoachmark } from '../state/tutorial'
import { useT } from '../i18n'
import { formatEuros } from '../lib/format'

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
  if (!state?.pendingMilestone) return null

  const def = MILESTONES[state.pendingMilestone]
  const benestar = Math.round(state.person.stats.benestar)
  const bucket = benestarBucket(benestar)
  const unaOpcio = def.options.length === 1

  return (
    <div className="flex min-h-[100dvh] items-center justify-center p-6">
      <div ref={coachRef} className="w-full max-w-md animate-card-in">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent2">
          {t(def.kickerKey)}
        </p>
        <h1 className="mt-1 text-4xl font-black text-slate-100">
          {t(def.titleKey)}
        </h1>

        {/* Resum de l'etapa */}
        <div className="mt-6 rounded-2xl bg-slate-800/70 p-5 ring-1 ring-slate-700/50">
          <h2 className="text-sm font-semibold text-slate-300">
            {t(def.summaryTitleKey)}
          </h2>
          <p className="mt-2 text-slate-300">
            {t(`${def.summaryPrefix}.${bucket}`)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-slate-500">
                {t('transition.benestar')}
              </div>
              <div className="text-2xl font-bold text-emerald-300">
                {benestar}
                <span className="text-base font-normal text-slate-500">/100</span>
              </div>
              <div className="text-xs text-slate-500">{t(`benestar.${bucket}`)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">
                {t('transition.estalvi')}
              </div>
              <div className="text-2xl font-bold text-emerald-300">
                {formatEuros(patrimoniTotal(state.person))}
              </div>
              <div className="text-xs text-slate-500">
                {t(`family.${state.familia.classe}.name`)}
              </div>
            </div>
          </div>
        </div>

        {/* Lore */}
        <div className="mt-4 rounded-2xl bg-slate-800/40 p-5">
          <h2 className="text-sm font-semibold text-slate-300">
            {t(def.loreTitleKey)}
          </h2>
          {def.loreKeys.map((k) => (
            <p key={k} className="mt-2 leading-relaxed text-slate-300">
              {t(k)}
            </p>
          ))}
        </div>

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
