import { patrimoniTotal } from '../domain/stats'
import { useGame } from '../state/GameContext'
import { useT } from '../i18n'
import { benestarLevelKey, formatEuros } from '../lib/format'

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-100">{value}</span>
    </div>
  )
}

export function GameOver() {
  const { t } = useT()
  const { state, reset } = useGame()
  if (!state) return null

  const benestar = Math.round(state.person.stats.benestar)
  const { efectiu, estalvi, inversions, fonsIndexat, fonsPensions, cases } =
    state.person.patrimoni
  const invertit = inversions + fonsIndexat + fonsPensions
  const total = patrimoniTotal(state.person)
  // Quina part del patrimoni ha vingut d'haver invertit (no de tenir-ho parat).
  const pctInvertit = total > 0 ? Math.round((invertit / total) * 100) : 0

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-black text-slate-100">{t('gameover.title')}</h1>
        <p className="mt-3 text-slate-400">{t('gameover.subtitle')}</p>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-slate-800/70 p-5">
            <div className="text-sm text-slate-400">{t('gameover.benestarFinal')}</div>
            <div className="mt-1 text-3xl font-bold text-emerald-300">{benestar}</div>
            <div className="text-xs text-slate-500">{t(benestarLevelKey(benestar))}</div>
          </div>
          <div className="rounded-xl bg-slate-800/70 p-5">
            <div className="text-sm text-slate-400">{t('gameover.patrimoniFinal')}</div>
            <div className="mt-1 text-3xl font-bold text-emerald-300">
              {formatEuros(total)}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-slate-800/60 p-5 text-left">
          <h2 className="mb-3 text-sm font-semibold text-slate-300">
            {t('gameover.desglos')}
          </h2>
          <div className="space-y-1.5">
            <Line label={t('patrimoni.efectiu')} value={formatEuros(efectiu)} />
            <Line label={t('patrimoni.estalvi')} value={formatEuros(estalvi)} />
            <Line label={t('patrimoni.fonsIndexat')} value={formatEuros(fonsIndexat)} />
            <Line label={t('patrimoni.fonsPensions')} value={formatEuros(fonsPensions)} />
            {inversions > 0 && (
              <Line label={t('patrimoni.inversions')} value={formatEuros(inversions)} />
            )}
            {cases.length > 0 && (
              <Line label={t('patrimoni.cases')} value={String(cases.length)} />
            )}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-sky-300/90">
            📈 {t('gameover.notaInversio', { pct: pctInvertit })}
          </p>
        </div>

        <p className="mt-6 text-sm italic text-slate-500">{t('gameover.soon')}</p>
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
