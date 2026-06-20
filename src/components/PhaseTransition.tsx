import { patrimoniTotal } from '../domain/stats'
import { useGame } from '../state/GameContext'
import { useT } from '../i18n'
import { formatEuros } from '../lib/format'

function benestarBucket(b: number): string {
  if (b < 20) return 'molt_baix'
  if (b < 40) return 'baix'
  if (b < 60) return 'mig'
  if (b < 80) return 'alt'
  return 'molt_alt'
}

export function PhaseTransition() {
  const { t } = useT()
  const { state, continuePhase } = useGame()
  if (!state) return null

  const benestar = Math.round(state.person.stats.benestar)
  const bucket = benestarBucket(benestar)

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="max-w-xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-400">
          {t('transition.kicker')}
        </p>
        <h1 className="mt-1 text-4xl font-black text-slate-100">
          {t('transition.title')}
        </h1>

        {/* Resum de la infància */}
        <div className="mt-6 rounded-2xl bg-slate-800/70 p-5 ring-1 ring-slate-700/50">
          <h2 className="text-sm font-semibold text-slate-300">
            {t('transition.summaryTitle')}
          </h2>
          <p className="mt-2 text-slate-300">{t(`transition.summary.${bucket}`)}</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-slate-500">
                {t('transition.benestar')}
              </div>
              <div className="text-2xl font-bold text-emerald-300">
                {benestar}
                <span className="text-base font-normal text-slate-500">/100</span>
              </div>
              <div className="text-xs text-slate-500">
                {t(`benestar.${bucket}`)}
              </div>
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

        {/* Lore de l'adolescència */}
        <div className="mt-4 rounded-2xl bg-slate-800/40 p-5">
          <h2 className="text-sm font-semibold text-slate-300">
            {t('transition.loreTitle')}
          </h2>
          <p className="mt-2 leading-relaxed text-slate-300">
            {t('transition.lore1')}
          </p>
          <p className="mt-3 leading-relaxed text-slate-300">
            {t('transition.lore2')}
          </p>
        </div>

        <button
          onClick={continuePhase}
          className="mt-6 w-full rounded-xl bg-indigo-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-indigo-500"
        >
          {t('transition.continue')}
        </button>
      </div>
    </div>
  )
}
