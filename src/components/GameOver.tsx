import {
  costVidaPropi,
  llegatPerFill,
  patrimoniTotal,
  pensioPublicaAnual,
  rendaJubilacioAnual,
  rendaPatrimoniAnual,
  veredicteJubilacio,
} from '../domain/stats'
import { costHabitatgeAnual } from '../domain/housing'
import { MESOS_PER_ANY } from '../domain/constants'
import { edatAnys } from '../domain/time'
import { InvestmentChart } from './InvestmentChart'
import { LifeCharts } from './LifeCharts'
import { useGame } from '../state/GameContext'
import { useCoachmark } from '../state/tutorial'
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
  const { state, reset, continuarGeneracio } = useGame()
  const dinastiaRef = useCoachmark<HTMLDivElement>('dinastia')
  if (!state) return null

  const generacio = state.generacio ?? 1

  const benestar = Math.round(state.person.stats.benestar)
  const { efectiu, estalvi, inversions, fonsIndexat, fonsPensions, cases } =
    state.person.patrimoni
  const invertit = inversions + fonsIndexat + fonsPensions
  const deuteHipoteca = state.habitatge?.hipoteca?.deute ?? 0
  const deuteConsum = state.person.patrimoni.deute ?? 0
  const total = patrimoniTotal(state.person) - deuteHipoteca
  // Quina part del patrimoni ha vingut d'haver invertit (no de tenir-ho parat).
  const pctInvertit = total > 0 ? Math.round((invertit / total) * 100) : 0

  const vincles = state.vinclesSocials ?? 0
  const sequela = state.salutCronica ?? 0
  const fills = state.fills ?? 0
  const llegat = llegatPerFill(state)

  // Balanç de jubilació (final als 67): renda de jubilació vs. necessitats anuals.
  const pensioAnual = pensioPublicaAnual(state)
  const rendaPatrimoni = rendaPatrimoniAnual(state.person)
  const rendaAnual = rendaJubilacioAnual(state)
  const necessitatsAnual =
    costVidaPropi(state.familia, state.habitatge, state.nivellVida) +
    costHabitatgeAnual(state.habitatge)
  const veredicte = veredicteJubilacio(rendaAnual, necessitatsAnual)

  const salut = Math.round(state.person.stats.salut)

  // Tipus de final. La MORT (salut 0) preval: una vida truncada. Si t'has jubilat (67), el
  // veredicte és el balanç econòmic de la jubilació, EXCEPTE si has fet una "vida plena"
  // no-monetària (benestar i vincles forts amb poc patrimoni), que es reconeix amb dignitat.
  const finalTipus:
    | 'mort'
    | 'plena'
    | 'jub_daurada'
    | 'jub_tranquila'
    | 'jub_precaria'
    | 'solid'
    | 'precaria' = state.mort
    ? 'mort'
    : state.jubilat
      ? benestar >= 55 && vincles >= 0.45 && total < 100_000
        ? 'plena'
        : (`jub_${veredicte}` as const)
      : benestar >= 55 && vincles >= 0.45 && total < 100_000
        ? 'plena'
        : total >= 150_000 || benestar >= 65
          ? 'solid'
          : 'precaria'

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-black text-slate-100">
          {t(`gameover.final.${finalTipus}.title`)}
        </h1>
        <p className="mt-3 text-slate-400">
          {finalTipus === 'mort'
            ? t('gameover.final.mort.desc', { edat: edatAnys(state.person.edatMesos) })
            : t(`gameover.final.${finalTipus}.desc`)}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-slate-800/70 p-5">
            <div className="text-sm text-slate-400">{t('gameover.benestarFinal')}</div>
            <div className="mt-1 text-3xl font-bold text-emerald-300">{benestar}</div>
            <div className="text-xs text-slate-500">{t(benestarLevelKey(benestar))}</div>
          </div>
          <div className="rounded-xl bg-slate-800/70 p-5">
            <div className="text-sm text-slate-400">{t('gameover.patrimoniFinal')}</div>
            <div
              className={`mt-1 text-3xl font-bold ${
                total < 0 ? 'text-red-400' : 'text-emerald-300'
              }`}
            >
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
            {deuteConsum > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-red-300">{t('patrimoni.deute')}</span>
                <span className="font-medium text-red-400">
                  −{formatEuros(deuteConsum)}
                </span>
              </div>
            )}
          </div>
          <div className="mt-3 space-y-1.5 border-t border-slate-700/60 pt-3">
            <Line label={`❤️ ${t('stat.salut')}`} value={`${salut}/100`} />
            <Line
              label={`🤝 ${t('stat.vincles')}`}
              value={`${Math.round(vincles * 100)}%`}
            />
            {fills > 0 && (
              <Line label={`👶 ${t('stat.fills')}`} value={String(fills)} />
            )}
            {sequela > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-red-300">🩹 {t('stat.sequela')}</span>
                <span className="font-medium text-red-400">−{Math.round(sequela)}</span>
              </div>
            )}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-sky-300/90">
            📈 {t('gameover.notaInversio', { pct: pctInvertit })}
          </p>
        </div>

        {/* Balanç de jubilació: d'on viuràs ara que has plegat. */}
        {state.jubilat && (
          <div className="mt-4 rounded-xl bg-slate-800/60 p-5 text-left">
            <h2 className="mb-3 text-sm font-semibold text-slate-300">
              {t('gameover.jubilacio.titol')}
            </h2>
            <div className="space-y-1.5">
              <Line
                label={t('gameover.jubilacio.pensio')}
                value={`${formatEuros(Math.round(pensioAnual / MESOS_PER_ANY))}/mes`}
              />
              <Line
                label={t('gameover.jubilacio.rendaPatrimoni')}
                value={`${formatEuros(Math.round(rendaPatrimoni / MESOS_PER_ANY))}/mes`}
              />
              <div className="flex justify-between border-t border-slate-700/60 pt-1.5 text-sm">
                <span className="font-semibold text-slate-200">
                  {t('gameover.jubilacio.total')}
                </span>
                <span className="font-bold text-emerald-300">
                  {formatEuros(Math.round(rendaAnual / MESOS_PER_ANY))}/mes
                </span>
              </div>
              <Line
                label={t('gameover.jubilacio.necessitats')}
                value={`${formatEuros(Math.round(necessitatsAnual / MESOS_PER_ANY))}/mes`}
              />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-amber-300/90">
              {t(`gameover.jubilacio.${veredicte}`)}
            </p>
          </div>
        )}

        {/* Evolució de la vida: salut+benestar i patrimoni net, al llarg de tots els anys. */}
        {state.vidaHist && state.vidaHist.length >= 2 && (
          <div className="mt-4 text-left">
            <LifeCharts hist={state.vidaHist} />
          </div>
        )}

        {state.patrimoniHist && state.patrimoniHist.length >= 2 && (
          <div className="mt-3 text-left">
            <InvestmentChart hist={state.patrimoniHist} />
          </div>
        )}

        {/* Herència i dinastia: si deixes descendència, pots continuar amb la generació següent. */}
        {fills > 0 && (
          <div
            ref={dinastiaRef}
            className="mt-4 rounded-2xl bg-accent/10 p-5 text-left ring-1 ring-accent/30"
          >
            <h2 className="mb-2 text-sm font-bold text-accent2">
              👨‍👩‍👧 {t('gameover.dinastia.titol')}
            </h2>
            <p className="text-sm text-inksoft">
              {t('gameover.dinastia.herencia', { fills, llegat: formatEuros(llegat) })}
            </p>
            <button
              onClick={continuarGeneracio}
              className="btn-game btn-game--gold animate-pulse-glow mt-3"
            >
              {t('gameover.dinastia.continuar', { generacio: generacio + 1 })}
            </button>
          </div>
        )}
        <button onClick={reset} className="btn-game btn-game--ghost mt-4">
          {t('gameover.restart')}
        </button>
      </div>
    </div>
  )
}
