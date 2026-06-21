import {
  INDEX_RENDIMENT_MIN,
  INDEX_RENDIMENT_RANG,
  MESOS_PER_ANY,
  PAS_PLA,
} from '../domain/constants'
import {
  benestarOciAnual,
  cobreixVidaFamiliar,
  costVidaPropi,
  defaultPlaInversio,
  desgravacioPensions,
  ingressosAnualsCarrera,
  minimOciAnual,
} from '../domain/stats'
import { costHabitatgeAnual } from '../domain/housing'
import type { PlaInversio } from '../domain/types'
import { useGame } from '../state/GameContext'
import { useT } from '../i18n'
import { formatEuros } from '../lib/format'

const CATEGORIES: (keyof PlaInversio)[] = [
  'oci',
  'estalvi',
  'fonsIndexat',
  'fonsPensions',
]

/** Rendiment mitjà esperat del fons indexat (per a la nota informativa). */
const INDEX_MITJANA_PCT = Math.round((INDEX_RENDIMENT_MIN + INDEX_RENDIMENT_RANG / 2) * 100)

/** Converteix un import anual del model en l'import mensual que es mostra al panell. */
const perMes = (anual: number) => Math.round(anual / MESOS_PER_ANY)

export function InvestmentPanel() {
  const { t } = useT()
  const { state, setPla, nextTurn } = useGame()
  if (!state) return null

  // El model treballa en anual; el panell ho presenta tot en mensual.
  const income = ingressosAnualsCarrera(state)
  // El cost de vida és la teva aportació; si vius amb els pares, en cobreixen una part.
  const costVida = costVidaPropi(income, state.familia, state.habitatge)
  const cobertFamilia = cobreixVidaFamiliar(income, state.familia, state.habitatge)
  const costHab = costHabitatgeAnual(state.habitatge)
  const efectiu = state.person.patrimoni.efectiu
  // El que es pot repartir: efectiu acumulat + sou − despeses obligatòries.
  const disponible = Math.max(0, efectiu + income - costVida - costHab)

  const pla = state.plaInversio ?? defaultPlaInversio(income)
  const total = CATEGORIES.reduce((sum, k) => sum + pla[k], 0)
  const lliure = Math.max(0, disponible - total)

  const benestar = benestarOciAnual(pla.oci, income)
  const minOci = minimOciAnual(income)
  const desgravacio = desgravacioPensions(pla.fonsPensions)

  // Despeses obligatòries: surten com a elements de la distribució però no es poden tocar.
  const obligatoris: { id: string; import: number }[] = [
    { id: 'costVida', import: costVida },
    ...(costHab > 0 ? [{ id: 'costHabitatge', import: costHab }] : []),
  ]

  const set = (k: keyof PlaInversio, delta: number) => {
    if (delta > 0 && total + delta > disponible) return // no assignis més del que tens
    setPla({ ...pla, [k]: Math.max(0, pla[k] + delta) })
  }

  return (
    <div className="rounded-2xl bg-slate-800/70 p-5 ring-1 ring-slate-700/50">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-slate-300">{t('pla.title')}</h3>
        <span className="text-sm text-slate-400">
          {t('pla.income')}: {formatEuros(perMes(income))}/mes
        </span>
      </div>

      <div className="space-y-2">
        {/* Despeses obligatòries (no editables). */}
        {obligatoris.map((o) => (
          <div key={o.id} className="flex items-center justify-between gap-3 opacity-90">
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-300">{t(`pla.${o.id}`)}</div>
              <div className="text-xs text-slate-500">{t(`pla.${o.id}.desc`)}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500" aria-hidden>
                🔒
              </span>
              <span className="w-20 text-right font-mono text-sm text-amber-300/90">
                {formatEuros(perMes(o.import))}
              </span>
            </div>
          </div>
        ))}
        {cobertFamilia > 0 && (
          <p className="text-xs text-emerald-300/90">
            🏠 {t('pla.costVida.cobreix', { amount: formatEuros(perMes(cobertFamilia)) })}
          </p>
        )}

        {/* Repartiment lliure. */}
        {CATEGORIES.map((k) => (
          <div key={k} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-100">{t(`pla.${k}`)}</div>
              <div className="text-xs text-slate-500">{t(`pla.${k}.desc`)}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => set(k, -PAS_PLA)}
                disabled={pla[k] <= 0}
                className="h-7 w-7 rounded-md bg-slate-700 text-slate-200 transition hover:bg-slate-600 disabled:opacity-40"
              >
                −
              </button>
              <span className="w-20 text-right font-mono text-sm text-slate-100">
                {formatEuros(perMes(pla[k]))}
              </span>
              <button
                onClick={() => set(k, PAS_PLA)}
                disabled={total + PAS_PLA > disponible}
                className="h-7 w-7 rounded-md bg-slate-700 text-slate-200 transition hover:bg-slate-600 disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-1 border-t border-slate-700 pt-3 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">{t('pla.benestar')}</span>
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
            {benestar}
          </span>
        </div>
        {benestar <= 0 && (
          <p className="text-xs text-amber-400/80">
            {t('pla.benestar.min', { min: formatEuros(perMes(minOci)) })}
          </p>
        )}
        <p className="text-xs text-sky-300/90">
          📈 {t('pla.notaIndex', { pct: INDEX_MITJANA_PCT })}
        </p>
        {desgravacio > 0 && (
          <p className="text-xs text-emerald-300/90">
            🧾 {t('pla.notaPensions', { amount: formatEuros(perMes(desgravacio)) })}
          </p>
        )}
        <div className="flex justify-between">
          <span className="text-slate-400">{t('pla.lliure')}</span>
          <span className="font-medium text-emerald-300">
            {formatEuros(perMes(lliure))}/mes
          </span>
        </div>
      </div>

      <button
        onClick={() => nextTurn()}
        className="mt-4 w-full rounded-xl bg-emerald-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-emerald-500"
      >
        {t('pla.nextYear')}
      </button>
    </div>
  )
}
