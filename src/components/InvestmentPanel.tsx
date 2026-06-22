import {
  INDEX_RENDIMENT_MIN,
  INDEX_RENDIMENT_RANG,
  MESOS_PER_ANY,
  NIVELL_VIDA_DEFAULT,
  PAS_PLA,
} from '../domain/constants'
import {
  benestarNivellVida,
  benestarOciAnual,
  cobreixVidaFamiliar,
  costVidaPropi,
  defaultPlaInversio,
  desgravacioPensions,
  ingressosAnualsCarrera,
  minimOciAnual,
  penalitzacioDescobert,
  repartDeficit,
} from '../domain/stats'
import { costHabitatgeAnual } from '../domain/housing'
import type { NivellVida, PlaInversio } from '../domain/types'
import { useGame } from '../state/GameContext'
import { useT } from '../i18n'
import { formatEuros } from '../lib/format'

const CATEGORIES: (keyof PlaInversio)[] = [
  'oci',
  'estalvi',
  'fonsIndexat',
  'fonsPensions',
]

const NIVELLS_VIDA: NivellVida[] = ['minim', 'mig', 'alt']

/** Rendiment mitjà esperat del fons indexat (per a la nota informativa). */
const INDEX_MITJANA_PCT = Math.round((INDEX_RENDIMENT_MIN + INDEX_RENDIMENT_RANG / 2) * 100)

/** Converteix un import anual del model en l'import mensual que es mostra al panell. */
const perMes = (anual: number) => Math.round(anual / MESOS_PER_ANY)

export function InvestmentPanel() {
  const { t } = useT()
  const { state, setPla, setNivellVida, nextTurn } = useGame()
  if (!state) return null

  // El model treballa en anual; el panell ho presenta tot en mensual.
  const income = ingressosAnualsCarrera(state)
  const nivell = state.nivellVida ?? NIVELL_VIDA_DEFAULT
  // El cost de vida és la teva aportació; si vius amb els pares, en cobreixen una part.
  const costVida = costVidaPropi(state.familia, state.habitatge, nivell)
  const cobertFamilia = cobreixVidaFamiliar(state.familia, state.habitatge, nivell)
  const costHab = costHabitatgeAnual(state.habitatge)
  const obligatori = costVida + costHab
  const efectiu = state.person.patrimoni.efectiu
  const estalvi = state.person.patrimoni.estalvi
  // Pots repartir el sou + els teus estalvis (efectiu + estalvi), per damunt del sou.
  const assignable = Math.max(0, income + efectiu + estalvi - obligatori)

  const pla = state.plaInversio ?? defaultPlaInversio(income)
  const total = CATEGORIES.reduce((sum, k) => sum + pla[k], 0)

  // Balanç del mes: ingrés − obligatori − pla. Pot ser negatiu (tires d'estalvis).
  const balancMes = perMes(income - obligatori - total)
  // Descobert: quan les necessitats (obligatori + oci) superen sou + estalvis + família.
  const deficit = repartDeficit(
    Math.max(0, obligatori + pla.oci - (efectiu + income)),
    estalvi,
    state.familia,
  )
  const benestarDescobert = penalitzacioDescobert(deficit.descobert)

  const benestar = benestarOciAnual(pla.oci, income)
  const minOci = minimOciAnual(income)
  const desgravacio = desgravacioPensions(pla.fonsPensions)
  const benNivell = benestarNivellVida(nivell)

  const set = (k: keyof PlaInversio, delta: number) => {
    // Pots assignar per sobre del sou mentre ho cobreixin els teus estalvis.
    if (delta > 0 && total + delta > assignable) return
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
        {/* Cost de vida: tries el nivell (mínim/mig/alt); l'import no és lliure. */}
        <div className="rounded-lg bg-slate-700/30 p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-200">{t('pla.costVida')}</div>
              <div className="text-xs text-slate-500">{t('pla.costVida.desc')}</div>
            </div>
            <span className="w-20 text-right font-mono text-sm text-amber-300/90">
              {formatEuros(perMes(costVida))}
            </span>
          </div>
          <div className="flex gap-2">
            {NIVELLS_VIDA.map((n) => (
              <button
                key={n}
                onClick={() => setNivellVida(n)}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs transition ${
                  nivell === n
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {t(`nivellVida.${n}`)}
              </button>
            ))}
          </div>
          {benNivell !== 0 && (
            <p className="mt-2 text-xs text-slate-400">
              {t('nivellVida.benestar')}: {benNivell > 0 ? '+' : ''}
              {benNivell}
            </p>
          )}
          {cobertFamilia > 0 && (
            <p className="mt-1 text-xs text-emerald-300/90">
              🏠 {t('pla.costVida.cobreix', { amount: formatEuros(perMes(cobertFamilia)) })}
            </p>
          )}
        </div>

        {/* Habitatge (lloguer o hipoteca): obligatori, no es pot modificar. */}
        {costHab > 0 && (
          <div className="flex items-center justify-between gap-3 opacity-90">
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-300">
                {t('pla.costHabitatge')}
              </div>
              <div className="text-xs text-slate-500">{t('pla.costHabitatge.desc')}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500" aria-hidden>
                🔒
              </span>
              <span className="w-20 text-right font-mono text-sm text-amber-300/90">
                {formatEuros(perMes(costHab))}
              </span>
            </div>
          </div>
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
                disabled={total + PAS_PLA > assignable}
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
          <span className="text-slate-400">{t('pla.balanc')}</span>
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
          <p className="text-xs text-amber-400/80">{t('pla.balanc.estalvis')}</p>
        )}
        {deficit.descobert > 0 && (
          <p className="text-xs text-red-400">
            {t('pla.balanc.descobert', {
              amount: formatEuros(perMes(deficit.descobert)),
              punts: benestarDescobert,
            })}
          </p>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-500">{t('pla.nota')}</p>
      <button
        onClick={() => nextTurn()}
        className="mt-2 w-full rounded-xl bg-emerald-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-emerald-500"
      >
        {t('pla.nextYear')}
      </button>
    </div>
  )
}
