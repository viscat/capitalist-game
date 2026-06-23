import { useState } from 'react'
import { MESOS_PER_ANY, SETMANES_ANY } from '../domain/constants'
import { ajudaCasaSetmanes, pagaMensual } from '../domain/stats'
import { useGame } from '../state/GameContext'
import { useT } from '../i18n'
import { formatEuros } from '../lib/format'
import { EffectList } from './EffectList'

/**
 * Accions de les fases joves (12-18). Multiselecció: cada any tens un pressupost de TEMPS
 * (setmanes) i de DINERS (efectiu + paga de l'any); pots encadenar les accions que hi
 * càpiguen. No triar res = temps lliure (l'any passa sense efectes actius).
 */
export function ActionPanel() {
  const { t } = useT()
  const { state, actions, nextTurn } = useGame()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  if (!state) return null

  const dinersInicials =
    state.person.patrimoni.efectiu + pagaMensual(state.familia) * MESOS_PER_ANY

  // Setmanes ja compromeses ajudant a casa (més en famílies humils): redueixen el temps
  // lliure disponible per a activitats.
  const tempsCompromes = ajudaCasaSetmanes(state.familia)
  const tempsTotal = Math.max(0, SETMANES_ANY - tempsCompromes)

  const triades = actions.filter((o) => selected.has(o.action.id))
  const tempsUsat = triades.reduce((s, o) => s + (o.action.setmanes ?? 0), 0)
  const dinersDelta = triades.reduce((s, o) => s + (o.action.effect.efectiu ?? 0), 0)
  const tempsRestant = tempsTotal - tempsUsat
  const dinersRestants = dinersInicials + dinersDelta

  const potAfegir = (id: string, setmanes: number, cost: number) =>
    !selected.has(id) &&
    tempsUsat + setmanes <= tempsTotal &&
    dinersRestants + cost >= 0

  const toggle = (id: string, setmanes: number, cost: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (tempsUsat + setmanes <= tempsTotal && dinersRestants + cost >= 0)
        next.add(id)
      return next
    })
  }

  const viu = () => {
    nextTurn(Array.from(selected))
    setSelected(new Set())
  }

  const pctTemps = tempsTotal > 0 ? Math.round((tempsUsat / tempsTotal) * 100) : 0

  return (
    <div className="rounded-2xl bg-slate-800/70 p-5 ring-1 ring-slate-700/50">
      <h3 className="text-sm font-semibold text-slate-300">{t('action.title')}</h3>
      <p className="mb-3 text-xs text-slate-500">{t('action.nota')}</p>

      {/* Pressupostos de l'any: temps i diners. */}
      <div className="mb-3 space-y-2 rounded-lg bg-slate-900/40 p-3">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-slate-400">
            ⏳ {t('action.temps')}: {tempsRestant}/{tempsTotal} {t('action.setmanes')}
          </span>
          <span className={`font-medium ${dinersRestants < 0 ? 'text-red-400' : 'text-emerald-300'}`}>
            💶 {formatEuros(dinersRestants)}
          </span>
        </div>
        {tempsCompromes > 0 && (
          <p className="text-xs text-amber-400/80">
            🏠 {t('action.ajudaCasa', { setmanes: tempsCompromes })}
          </p>
        )}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{ width: `${pctTemps}%` }}
          />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {actions.map(({ action, disabled, reasonKey }) => {
          const setmanes = action.setmanes ?? 0
          const cost = action.effect.efectiu ?? 0
          const isSel = selected.has(action.id)
          const blocked = disabled || (!isSel && !potAfegir(action.id, setmanes, cost))
          return (
            <button
              key={action.id}
              onClick={() => !disabled && toggle(action.id, setmanes, cost)}
              disabled={disabled}
              aria-pressed={isSel}
              className={
                isSel
                  ? 'flex flex-col gap-1.5 rounded-lg bg-indigo-600/80 p-3 text-left ring-2 ring-indigo-400'
                  : blocked
                    ? 'flex cursor-not-allowed flex-col gap-1.5 rounded-lg bg-slate-800/40 p-3 text-left opacity-50 ring-1 ring-slate-700/50'
                    : 'flex flex-col gap-1.5 rounded-lg bg-slate-700/60 p-3 text-left transition hover:bg-indigo-600/60'
              }
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-100">{t(action.labelKey)}</span>
                {setmanes > 0 && (
                  <span className="shrink-0 text-xs text-slate-400">
                    ⏳ {setmanes} {t('action.setmanes')}
                  </span>
                )}
              </div>
              {disabled && reasonKey ? (
                <span className="text-xs font-medium text-amber-400/90">
                  🔒 {t(reasonKey)}
                </span>
              ) : (
                <span className="text-xs text-slate-400">{t(action.descKey)}</span>
              )}
              <EffectList effect={action.effect} />
            </button>
          )
        })}
      </div>

      <button
        onClick={viu}
        className="mt-4 w-full rounded-xl bg-emerald-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-emerald-500"
      >
        {selected.size === 0 ? t('action.viuLliure') : t('action.viu')}
      </button>
    </div>
  )
}
