import { patrimoniTotal } from '../domain/stats'
import { useGame } from '../state/GameContext'
import { useT } from '../i18n'
import { benestarLevelKey, formatEuros } from '../lib/format'

export function GameOver() {
  const { t } = useT()
  const { state, reset } = useGame()
  if (!state) return null

  const benestar = Math.round(state.person.stats.benestar)

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-black text-slate-100">
          {t('gameover.title')}
        </h1>
        <p className="mt-3 text-slate-400">{t('gameover.subtitle')}</p>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-slate-800/70 p-5">
            <div className="text-sm text-slate-400">
              {t('gameover.benestarFinal')}
            </div>
            <div className="mt-1 text-3xl font-bold text-emerald-300">
              {benestar}
            </div>
            <div className="text-xs text-slate-500">
              {t(benestarLevelKey(benestar))}
            </div>
          </div>
          <div className="rounded-xl bg-slate-800/70 p-5">
            <div className="text-sm text-slate-400">
              {t('gameover.patrimoniFinal')}
            </div>
            <div className="mt-1 text-3xl font-bold text-emerald-300">
              {formatEuros(patrimoniTotal(state.person))}
            </div>
          </div>
        </div>

        <p className="mt-6 text-sm italic text-slate-500">
          {t('gameover.soon')}
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-500"
        >
          {t('gameover.restart')}
        </button>
      </div>
    </div>
  )
}
