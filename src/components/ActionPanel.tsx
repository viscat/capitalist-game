import { MESOS_PER_ANY, SETMANES_ANY } from '../domain/constants'
import { ajudaCasaSetmanes, pagaMensual, pagaPerAjudaCasa } from '../domain/stats'
import type { GameAction } from '../domain/types'
import { useGame } from '../state/GameContext'
import { useT } from '../i18n'
import { useCoachmark } from '../state/tutorial'
import { formatEuros } from '../lib/format'
import { EffectList } from './EffectList'

/**
 * Accions de les fases joves (12-18). Multiselecció amb MULTIPLICADOR: cada any tens un
 * pressupost de TEMPS (setmanes) i de DINERS (efectiu + paga de l'any); pots repetir una
 * mateixa acció diverses vegades mentre hi càpiga. No triar res = temps lliure (l'any
 * passa sense efectes actius). La selecció es RECORDA entre anys (es desa a `GameState`),
 * així el jugador no l'ha de repetir cada any.
 */
export function ActionPanel() {
  const { t } = useT()
  const { state, actions, setAccionsSeleccio } = useGame()
  const coachRef = useCoachmark<HTMLDivElement>('accions')
  if (!state) return null

  const counts = state.accionsSeleccio ?? {}

  const dinersInicials =
    state.person.patrimoni.efectiu + pagaMensual(state.familia) * MESOS_PER_ANY

  // Setmanes ja compromeses ajudant a casa (més en famílies humils): redueixen el temps
  // lliure disponible per a activitats.
  const tempsCompromes = ajudaCasaSetmanes(state.familia)
  const tempsTotal = Math.max(0, SETMANES_ANY - tempsCompromes)

  // Efecte EFECTIU d'una acció segons la família: «ajudar a casa» no es remunera a la
  // pobra/treballadora, així que mostrem i pressupostem 0 € (coherent amb el motor).
  const effEffect = (action: GameAction) =>
    action.id === 'ajudar_casa'
      ? { ...action.effect, efectiu: pagaPerAjudaCasa(state.familia) }
      : action.effect

  const countOf = (id: string) => counts[id] ?? 0
  const tempsUsat = actions.reduce(
    (s, o) => s + countOf(o.action.id) * (o.action.setmanes ?? 0),
    0,
  )
  const dinersDelta = actions.reduce(
    (s, o) => s + countOf(o.action.id) * (effEffect(o.action).efectiu ?? 0),
    0,
  )
  const tempsRestant = tempsTotal - tempsUsat
  const dinersRestants = dinersInicials + dinersDelta

  // Pots afegir-ne una més si hi cap en temps i si no et deixa els diners en negatiu.
  const potAfegir = (setmanes: number, cost: number) =>
    tempsUsat + setmanes <= tempsTotal && dinersRestants + cost >= 0

  const inc = (id: string, setmanes: number, cost: number) => {
    if (!potAfegir(setmanes, cost)) return
    setAccionsSeleccio({ ...counts, [id]: countOf(id) + 1 })
  }
  const dec = (id: string) => {
    const n = countOf(id) - 1
    const next = { ...counts }
    if (n <= 0) delete next[id]
    else next[id] = n
    setAccionsSeleccio(next)
  }


  const pctTemps = tempsTotal > 0 ? Math.round((tempsUsat / tempsTotal) * 100) : 0

  return (
    <div ref={coachRef} className="rounded-2xl bg-slate-800/70 p-5 ring-1 ring-slate-700/50">
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
          const effecte = effEffect(action)
          const cost = effecte.efectiu ?? 0
          const n = countOf(action.id)
          const isSel = n > 0
          const canAdd = !disabled && potAfegir(setmanes, cost)
          return (
            <div
              key={action.id}
              className={
                isSel
                  ? 'flex flex-col gap-1.5 rounded-lg bg-indigo-600/80 p-3 text-left ring-2 ring-indigo-400'
                  : disabled
                    ? 'flex flex-col gap-1.5 rounded-lg bg-slate-800/40 p-3 text-left opacity-50 ring-1 ring-slate-700/50'
                    : 'flex flex-col gap-1.5 rounded-lg bg-slate-700/60 p-3 text-left ring-1 ring-slate-700/50'
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
              <EffectList effect={effecte} />
              {!disabled && (
                <div className="mt-1 flex items-center justify-end gap-2">
                  <button
                    onClick={() => dec(action.id)}
                    disabled={n === 0}
                    aria-label={`− ${t(action.labelKey)}`}
                    className="flex h-11 w-11 items-center justify-center rounded-lg bg-bg/60 text-xl font-bold text-ink transition hover:bg-bg active:scale-95 disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="min-w-6 text-center font-mono text-sm font-semibold text-ink">
                    {n}
                  </span>
                  <button
                    onClick={() => inc(action.id, setmanes, cost)}
                    disabled={!canAdd}
                    aria-label={`+ ${t(action.labelKey)}`}
                    className="flex h-11 w-11 items-center justify-center rounded-lg bg-bg/60 text-xl font-bold text-ink transition hover:bg-bg active:scale-95 disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * CTA primari de la fase d'accions ("Viu l'any"). Viu al peu FIX del shell (`AppShell.footer`),
 * separat del cos scrollable, perquè sempre sigui accessible. Llegeix la selecció del context.
 */
export function ActionCTA() {
  const { t } = useT()
  const { state, actions, nextTurn } = useGame()
  if (!state) return null
  const counts = state.accionsSeleccio ?? {}
  const countOf = (id: string) => counts[id] ?? 0
  const totalTriades = actions.reduce((s, o) => s + countOf(o.action.id), 0)
  const viu = () => {
    // Construeix la llista d'accions repetint cada id segons el seu multiplicador.
    const ids: string[] = []
    for (const o of actions) {
      for (let i = 0; i < countOf(o.action.id); i++) ids.push(o.action.id)
    }
    // NO buidem la selecció: es recorda per a l'any vinent (el jugador pot ajustar-la).
    nextTurn(ids)
  }
  return (
    <button onClick={viu} className="btn-game btn-game--money">
      {totalTriades === 0 ? t('action.viuLliure') : t('action.viu')}
    </button>
  )
}
