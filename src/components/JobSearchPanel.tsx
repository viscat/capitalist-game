import { MESOS_PER_ANY } from '../domain/constants'
import { anysExperiencia, ocupabilitat } from '../domain/jobs'
import { factorSalariPersonal, netMensual, prestacioAturAnual } from '../domain/stats'
import type { QualitatOferta } from '../domain/types'
import { useGame } from '../state/GameContext'
import { useT } from '../i18n'
import { useCoachmark } from '../state/tutorial'
import { formatEuros } from '../lib/format'

/** Color de l'etiqueta segons la qualitat de l'oferta. */
const COLOR_QUALITAT: Record<QualitatOferta, string> = {
  precaria: 'text-amber-400',
  estandard: 'text-slate-300',
  bona: 'text-emerald-300',
}

/** Tram qualitatiu de l'ocupabilitat (per a la nota informativa). */
function tramOcupabilitat(valor: number): 'baixa' | 'mitjana' | 'alta' {
  if (valor < 0.3) return 'baixa'
  if (valor < 0.6) return 'mitjana'
  return 'alta'
}

export function JobSearchPanel() {
  const { t } = useT()
  const { state, acceptarOferta, nextTurn } = useGame()
  const coachRef = useCoachmark<HTMLDivElement>('cerca_feina')
  if (!state) return null

  const ofertes = state.ofertesFeina ?? []
  const occ = ocupabilitat(state)
  const anys = anysExperiencia(state)
  // Prestació d'atur mentre busques (el retorn d'haver cotitzat). Sense cotització, 0.
  const prestacioMes = Math.round(
    prestacioAturAnual(state.salariBase ?? 0, anys) / MESOS_PER_ANY,
  )
  // Bretxa de gènere/origen: si < 1, les ofertes arriben rebaixades per discriminació.
  const bretxa = factorSalariPersonal(state.identitat)

  return (
    <div ref={coachRef} className="rounded-2xl bg-slate-800/70 p-5 ring-1 ring-slate-700/50">
      <h3 className="text-sm font-semibold text-slate-300">{t('jobsearch.title')}</h3>
      <p className="mt-1 text-xs text-slate-500">
        {t('jobsearch.ocupabilitat', {
          tram: t(`jobsearch.ocupabilitat.${tramOcupabilitat(occ)}`),
        })}
        {anys > 0 && ` · ${t('jobsearch.experiencia', { anys })}`}
      </p>
      <p className="mt-1 text-xs text-emerald-300/80">
        {prestacioMes > 0
          ? `🛟 ${t('jobsearch.prestacio', { amount: formatEuros(prestacioMes) })}`
          : `🛟 ${t('jobsearch.sensePrestacio')}`}
      </p>
      {bretxa < 1 && (
        <p className="mt-1 text-xs text-amber-400/80">
          ⚖️ {t('jobsearch.bretxa', { pct: Math.round((1 - bretxa) * 100) })}
        </p>
      )}

      <div className="mt-3 space-y-2">
        {ofertes.map((oferta) => (
          <div
            key={oferta.id}
            className="flex items-center justify-between gap-3 rounded-lg bg-slate-700/50 p-3"
          >
            <div className="min-w-0">
              <div className={`text-sm font-semibold ${COLOR_QUALITAT[oferta.qualitat]}`}>
                {t(`oferta.${oferta.qualitat}`)}
              </div>
              <div className="text-xs text-slate-400">
                {formatEuros(oferta.sou)}/mes · {t('jobsearch.net')}{' '}
                {formatEuros(netMensual(oferta.sou))}/mes
              </div>
            </div>
            <button
              onClick={() => acceptarOferta(oferta.id)}
              className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              {t('jobsearch.accept')}
            </button>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-500">{t('jobsearch.nota')}</p>
      <button
        onClick={() => nextTurn()}
        className="mt-2 w-full rounded-xl bg-slate-700 px-6 py-3 text-base font-semibold text-slate-100 transition hover:bg-slate-600"
      >
        {t('jobsearch.seguir')}
      </button>
    </div>
  )
}
