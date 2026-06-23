import { MESOS_PER_ANY, PAS_PRESSUPOST } from '../domain/constants'
import {
  aportacioMinima,
  benestarEstilDeVida,
  defaultBudget,
  ingressosMensuals16,
  minimOciCompres,
  penalitzacioDescobert,
  repartDeficit,
} from '../domain/stats'
import type { Budget } from '../domain/types'
import { useGame } from '../state/GameContext'
import { useT } from '../i18n'
import { formatEuros } from '../lib/format'
import { AmountStepper } from './AmountStepper'

const CATEGORIES: (keyof Budget)[] = ['estalvi', 'oci', 'compres', 'casa']

export function BudgetPanel() {
  const { t } = useT()
  const { state, setBudget, nextTurn } = useGame()
  if (!state) return null

  const income = ingressosMensuals16(state)
  // Aportació mínima obligatòria a casa (només si tens sou propi).
  const minCasa =
    state.itinerari === 'treball' ? aportacioMinima(state.familia, income) : 0
  const base = state.pressupost ?? defaultBudget(income, minCasa)
  // La casa mai per sota del mínim obligatori.
  const budget: Budget = { ...base, casa: Math.max(base.casa, minCasa) }
  const total = CATEGORIES.reduce((sum, k) => sum + budget[k], 0)

  // Pots gastar per sobre del sou tirant dels teus estalvis (repartits al llarg de l'any).
  const efectiu = state.person.patrimoni.efectiu
  const estalvi = state.person.patrimoni.estalvi
  const assignable = income + (efectiu + estalvi) / MESOS_PER_ANY

  // Balanç del mes: ingrés − pressupost. Pot ser negatiu (tires d'estalvis).
  const balancMes = income - total
  // Descobert: quan les necessitats anuals superen sou + estalvis + família.
  const necessitatsAnual = (budget.casa + budget.oci + budget.compres) * MESOS_PER_ANY
  const deficit = repartDeficit(
    Math.max(0, necessitatsAnual - (efectiu + income * MESOS_PER_ANY)),
    estalvi,
    state.familia,
  )
  const benestarDescobert = penalitzacioDescobert(deficit.descobert)

  // Benestar mensual segons l'oci+compres i el mínim per no perdre'n.
  const benestar = benestarEstilDeVida(budget.oci, budget.compres, income)
  const minOciCompres = minimOciCompres(income)

  const minOf = (k: keyof Budget) => (k === 'casa' ? minCasa : 0)
  // Marge disponible: el que encara es pot assignar sense passar del que es pot pagar
  // (ingrés + estalvis). El màxim per partida és el seu valor actual + aquest marge.
  const marge = Math.max(0, assignable - total)

  return (
    <div className="rounded-2xl bg-slate-800/70 p-5 ring-1 ring-slate-700/50">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-slate-300">
          {t('budget.title')}
        </h3>
        <span className="text-sm text-slate-400">
          {t('budget.income')}: {formatEuros(income)}/mes
        </span>
      </div>

      <div className="space-y-2">
        {CATEGORIES.map((k) => (
          <div key={k} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-100">
                {t(`budget.${k}`)}
              </div>
              <div className="text-xs text-slate-500">
                {k === 'casa' && minCasa > 0
                  ? t('budget.casa.obligatori', { min: formatEuros(minCasa) })
                  : t(`budget.${k}.desc`)}
              </div>
            </div>
            <AmountStepper
              value={budget[k]}
              min={minOf(k)}
              max={budget[k] + marge}
              step={PAS_PRESSUPOST}
              onChange={(v) => setBudget({ ...budget, [k]: v })}
              ariaLabel={t(`budget.${k}`)}
            />
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-1 border-t border-slate-700 pt-3 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">{t('budget.benestar')}</span>
          <span
            className={`font-semibold ${
              benestar > 0
                ? 'text-emerald-300'
                : benestar < 0
                  ? 'text-amber-400'
                  : 'text-slate-300'
            }`}
          >
            {benestar > 0 ? '+' : ''}
            {benestar}/mes
          </span>
        </div>
        {benestar <= 0 && (
          <p className="text-xs text-amber-400/80">
            {t('budget.benestar.min', { min: formatEuros(minOciCompres) })}
          </p>
        )}
        <div className="flex justify-between">
          <span className="text-slate-400">{t('budget.balanc')}</span>
          <span
            className={`font-semibold ${
              balancMes < 0 ? 'text-amber-400' : 'text-emerald-300'
            }`}
          >
            {balancMes >= 0 ? '+' : ''}
            {formatEuros(balancMes)}/mes
          </span>
        </div>
        {balancMes < 0 && deficit.descobert <= 0 && (
          <p className="text-xs text-amber-400/80">{t('budget.balanc.estalvis')}</p>
        )}
        {deficit.descobert > 0 && (
          <p className="text-xs text-red-400">
            {t('budget.balanc.descobert', {
              amount: formatEuros(Math.round(deficit.descobert / MESOS_PER_ANY)),
              punts: benestarDescobert,
            })}
          </p>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-500">{t('budget.nota')}</p>
      <button
        onClick={() => nextTurn()}
        className="mt-2 w-full rounded-xl bg-emerald-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-emerald-500"
      >
        {t('budget.nextYear')}
      </button>
    </div>
  )
}
