import { PAS_PRESSUPOST } from '../domain/constants'
import { defaultBudget, ingressosMensuals16 } from '../domain/stats'
import type { Budget } from '../domain/types'
import { useGame } from '../state/GameContext'
import { useT } from '../i18n'
import { formatEuros } from '../lib/format'

const CATEGORIES: (keyof Budget)[] = ['estalvi', 'oci', 'compres', 'casa']

export function BudgetPanel() {
  const { t } = useT()
  const { state, setBudget, nextTurn } = useGame()
  if (!state) return null

  const income = ingressosMensuals16(state)
  const budget = state.pressupost ?? defaultBudget(income)
  const total = CATEGORIES.reduce((sum, k) => sum + budget[k], 0)
  const lliure = income - total

  const set = (k: keyof Budget, delta: number) => {
    const next = Math.max(0, budget[k] + delta)
    if (delta > 0 && total + delta > income) return // no assignis més del que ingresses
    setBudget({ ...budget, [k]: next })
  }

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
              <div className="text-xs text-slate-500">{t(`budget.${k}.desc`)}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => set(k, -PAS_PRESSUPOST)}
                disabled={budget[k] <= 0}
                className="h-7 w-7 rounded-md bg-slate-700 text-slate-200 transition hover:bg-slate-600 disabled:opacity-40"
              >
                −
              </button>
              <span className="w-16 text-right font-mono text-sm text-slate-100">
                {formatEuros(budget[k])}
              </span>
              <button
                onClick={() => set(k, PAS_PRESSUPOST)}
                disabled={total + PAS_PRESSUPOST > income}
                className="h-7 w-7 rounded-md bg-slate-700 text-slate-200 transition hover:bg-slate-600 disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex justify-between border-t border-slate-700 pt-3 text-sm">
        <span className="text-slate-400">{t('budget.lliure')}</span>
        <span className="font-medium text-emerald-300">{formatEuros(lliure)}</span>
      </div>

      <button
        onClick={() => nextTurn()}
        className="mt-4 w-full rounded-xl bg-emerald-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-emerald-500"
      >
        {t('budget.nextMonth')}
      </button>
    </div>
  )
}
