import {
  INDEX_RENDIMENT_MIN,
  INDEX_RENDIMENT_RANG,
  FACTOR_DESPESA_PARELLA,
  INTERES_DEUTE,
  MESOS_PER_ANY,
  NIVELL_VIDA_DEFAULT,
  PAS_PLA,
} from '../domain/constants'
import {
  ajutPublicMax,
  benestarNivellVida,
  benestarOciAnual,
  cobreixVidaFamiliar,
  contribucioLlar,
  costFillsAnual,
  costVidaPropi,
  defaultPlaInversio,
  fillsDependents,
  desgravacioPensions,
  ingressosAnualsCarrera,
  minimOciAnual,
  netMensual,
  patrimoniTotal,
  pensioPublicaAnual,
  repartDeficit,
} from '../domain/stats'
import { costHabitatgeAnualNet } from '../domain/housing'
import type { NivellVida, PlaInversio } from '../domain/types'
import { useGame } from '../state/GameContext'
import { useT } from '../i18n'
import { useCoachmark } from '../state/tutorial'
import { formatEuros } from '../lib/format'
import { AmountStepper } from './AmountStepper'

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
  const { state, setPla, setNivellVida, setVidaSenzilla } = useGame()
  const coachRef = useCoachmark<HTMLDivElement>('pla_inversio')
  const deuteRef = useCoachmark<HTMLDivElement>('deute')
  if (!state) return null

  // El model treballa en anual; el panell ho presenta tot en mensual. Jubilat → pensió.
  const income = state.jubilat ? pensioPublicaAnual(state) : ingressosAnualsCarrera(state)
  const nivell = state.nivellVida ?? NIVELL_VIDA_DEFAULT
  // Viure amb els pares = un sol cost (contribució a la llar: manutenció + ajuda), sense
  // pagar el cost de vida a part ni triar-ne el nivell. Viure sol = cost de vida sencer
  // (segons el nivell) + habitatge, i s'atura l'ajuda a la família.
  const ambPares = (state.habitatge?.tipus ?? 'amb_pares') === 'amb_pares'
  const net = state.jubilat
    ? Math.round(income / MESOS_PER_ANY)
    : netMensual(state.salari ?? 0)
  // Viure en parella reparteix les despeses estructurals (cost de vida + habitatge).
  const factorParella = state.parella ? FACTOR_DESPESA_PARELLA : 1
  const costVida = Math.round(
    (ambPares
      ? contribucioLlar(state.familia, net)
      : costVidaPropi(state.familia, state.habitatge, nivell)) * factorParella,
  )
  const cobertFamilia = ambPares
    ? 0
    : cobreixVidaFamiliar(state.familia, state.habitatge, nivell)
  const costHab = ambPares
    ? 0
    : Math.round(costHabitatgeAnualNet(state.habitatge, state.familia) * factorParella)
  // Criança dels fills dependents (cost net, ja descomptada la prestació pública): és una
  // despesa obligatòria de l'any, com l'habitatge.
  const costFills = costFillsAnual(state)
  const fillsDeps = fillsDependents(state)
  const obligatori = costVida + costHab + costFills
  const efectiu = state.person.patrimoni.efectiu
  const estalvi = state.person.patrimoni.estalvi
  // Pots repartir el sou + els teus estalvis (efectiu + estalvi), per damunt del sou.
  const assignable = Math.max(0, income + efectiu + estalvi - obligatori)
  // Deute de consum pendent: compon i bloqueja la inversió fins saldar-lo.
  const deuteActual = state.person.patrimoni.deute ?? 0
  const interesDeutePct = Math.round(INTERES_DEUTE * 100)

  const pla = state.plaInversio ?? defaultPlaInversio(income)
  const total = CATEGORIES.reduce((sum, k) => sum + pla[k], 0)

  // Balanç del mes: ingrés − obligatori − pla. Pot ser negatiu (tires d'estalvis).
  const balancMes = perMes(income - obligatori - total)
  // Dèficit: quan les necessitats (obligatori + oci) superen sou + estalvis + família.
  // El que ningú cobreix es converteix en DEUTE (no és un xoc puntual de benestar).
  const deficit = repartDeficit(
    Math.max(0, obligatori + pla.oci - (efectiu + income)),
    estalvi,
    state.familia,
    ajutPublicMax(patrimoniTotal(state.person), income),
  )

  const benestar = benestarOciAnual(pla.oci, income)
  const minOci = minimOciAnual(income)
  const desgravacio = desgravacioPensions(pla.fonsPensions)
  const benNivell = ambPares ? 0 : benestarNivellVida(nivell, state.vidaSenzilla)
  // Benestar felt de l'any: oci + nivell de vida (tots dos es noten cada any).
  const benestarAny = benestar + benNivell
  // Petjada ecològica (indicador cosmètic): com més consum/patrimoni material, més alta.
  const petjada =
    nivell === 'alt' || state.person.patrimoni.cases.length > 0
      ? 'alta'
      : nivell === 'mig'
        ? 'mitjana'
        : 'baixa'

  // Marge anual encara assignable (sense passar de l'ingrés + estalvis). El màxim per
  // partida és el seu valor + aquest marge (l'AmountStepper treballa en mensual).
  const margeAnual = Math.max(0, assignable - total)

  return (
    <div ref={coachRef} className="rounded-2xl bg-slate-800/70 p-5 ring-1 ring-slate-700/50">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-slate-300">{t('pla.title')}</h3>
        <span className="text-sm text-slate-400">
          {t('pla.income')}: {formatEuros(perMes(income))}/mes
        </span>
      </div>

      {deuteActual > 0 && (
        <div ref={deuteRef} className="mb-3 rounded-lg border border-red-500/40 bg-red-950/30 p-3">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-red-300">{t('pla.deute')}</span>
            <span className="font-mono font-bold text-red-400">
              −{formatEuros(deuteActual)}
            </span>
          </div>
          <p className="mt-1 text-xs text-red-300/80">
            {t('pla.deute.nota', {
              amount: formatEuros(deuteActual),
              pct: interesDeutePct,
            })}
          </p>
        </div>
      )}

      <div className="space-y-2">
        {ambPares ? (
          /* Vius amb els pares: un sol cost (manutenció + ajuda a casa). No es tria nivell. */
          <div className="rounded-lg bg-slate-700/30 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-200">
                  {t('pla.contribucioLlar')}
                </div>
                <div className="text-xs text-slate-500">{t('pla.contribucioLlar.desc')}</div>
              </div>
              <span className="w-20 text-right font-mono text-sm text-amber-300/90">
                {formatEuros(perMes(costVida))}
              </span>
            </div>
            {(state.familia.classe === 'pobra' ||
              state.familia.classe === 'treballadora') && (
              <p className="mt-1 text-xs text-amber-400/80">🏠 {t('pla.contribucioLlar.humil')}</p>
            )}
          </div>
        ) : (
          /* Vius sol: cost de vida sencer; tries el nivell (mínim/mig/alt). */
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
                  className={`min-h-9 flex-1 rounded-md px-2 py-2 text-xs transition ${
                    nivell === n
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {t(`nivellVida.${n}`)}
                </button>
              ))}
            </div>
            {nivell === 'minim' && (
              <button
                onClick={() => setVidaSenzilla(!state.vidaSenzilla)}
                className={`mt-2 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition ${
                  state.vidaSenzilla
                    ? 'bg-emerald-700/40 text-emerald-200 ring-1 ring-emerald-600/50'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <span>🌱 {t('pla.vidaSenzilla')}</span>
                <span>{state.vidaSenzilla ? '✓' : ''}</span>
              </button>
            )}
            {nivell === 'minim' && state.vidaSenzilla && (
              <p className="mt-1 text-xs text-emerald-300/80">{t('pla.vidaSenzilla.nota')}</p>
            )}
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
            {(state.familia.classe === 'pobra' ||
              state.familia.classe === 'treballadora') && (
              <p className="mt-1 text-xs text-amber-400/80">💸 {t('pla.sobrecost')}</p>
            )}
          </div>
        )}

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

        {/* Criança dels fills dependents: obligatori, no es pot modificar. */}
        {costFills > 0 && (
          <div className="flex items-center justify-between gap-3 opacity-90">
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-300">
                👶 {t('pla.costFills', { fills: fillsDeps })}
              </div>
              <div className="text-xs text-slate-500">{t('pla.costFills.desc')}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500" aria-hidden>
                🔒
              </span>
              <span className="w-20 text-right font-mono text-sm text-amber-300/90">
                {formatEuros(perMes(costFills))}
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
            <AmountStepper
              value={perMes(pla[k])}
              min={0}
              max={perMes(pla[k] + margeAnual)}
              step={perMes(PAS_PLA)}
              onChange={(mes) => setPla({ ...pla, [k]: mes * MESOS_PER_ANY })}
              ariaLabel={t(`pla.${k}`)}
            />
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-1 border-t border-slate-700 pt-3 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">{t('pla.benestar')}</span>
          <span
            className={`font-semibold ${
              benestarAny > 0
                ? 'text-emerald-300'
                : benestarAny < 0
                  ? 'text-amber-400'
                  : 'text-slate-300'
            }`}
          >
            {benestarAny > 0 ? '+' : ''}
            {benestarAny}
          </span>
        </div>
        {benestar < 0 && (
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
            {t('pla.balanc.deute', {
              amount: formatEuros(perMes(deficit.descobert)),
            })}
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>🌍 {t('pla.petjada')}</span>
        <span
          className={
            petjada === 'alta'
              ? 'text-amber-400/90'
              : petjada === 'mitjana'
                ? 'text-slate-400'
                : 'text-emerald-300/80'
          }
        >
          {t(`pla.petjada.${petjada}`)}
        </span>
      </div>

      <p className="mt-3 text-xs text-slate-500">{t('pla.nota')}</p>
    </div>
  )
}
