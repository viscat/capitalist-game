import {
  costVidaPropi,
  desglosBenestarAdult,
  factorIPC,
  llegatPerFill,
  nivellMoralitat,
  patrimoniTotal,
  pensioPublicaAnual,
  rendaPatrimoniAnual,
  veredicteJubilacio,
} from '../domain/stats'
import {
  Baby,
  Bandage,
  Dices,
  Dna,
  Factory,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Heart,
  Icon,
  Landmark,
  Megaphone,
  Scale,
  TrendingUp,
  Users,
  type LucideIcon,
} from './icons'
import { costHabitatgeAnualNet } from '../domain/housing'
import { MESOS_PER_ANY } from '../domain/constants'
import { edatAnys } from '../domain/time'
import { InvestmentChart } from './InvestmentChart'
import { LifeCharts } from './LifeCharts'
import type { CSSProperties } from 'react'
import { useGame } from '../state/GameContext'
import { useCoachmark } from '../state/tutorial'
import { useT } from '../i18n'
import { benestarLevelKey, formatEurosCompact } from '../lib/format'
import { useCountUp } from '../lib/useCountUp'

function Line({ label, value, icon }: { label: string; value: string; icon?: LucideIcon }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="flex items-center gap-1.5 text-inkfaint">
        {icon && <Icon icon={icon} size={14} />}
        {label}
      </span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  )
}

export function GameOver() {
  const { t } = useT()
  const { state, reset, continuarGeneracio } = useGame()
  const dinastiaRef = useCoachmark<HTMLDivElement>('dinastia')
  // Hooks abans de qualsevol return condicional. Els números heroi s'animen (compten amunt).
  const benestarAnim = Math.round(useCountUp(Math.round(state?.person.stats.benestar ?? 0)))
  const totalAnim = Math.round(
    useCountUp(
      state ? patrimoniTotal(state.person) - (state.habitatge?.hipoteca?.deute ?? 0) : 0,
    ),
  )
  if (!state) return null

  const generacio = state.generacio ?? 1
  const esAdult =
    state.lifeStage === 'universitat' ||
    state.lifeStage === 'carrera' ||
    state.lifeStage === 'jubilacio'

  const benestar = Math.round(state.person.stats.benestar)
  const { efectiu, inversions, cases } = state.person.patrimoni
  const invertit = inversions
  const deuteHipoteca = state.habitatge?.hipoteca?.deute ?? 0
  const deuteConsum = state.person.patrimoni.deute ?? 0
  const total = patrimoniTotal(state.person) - deuteHipoteca
  // Quina part del patrimoni ha vingut d'haver invertit (no de tenir-ho parat).
  const pctInvertit = total > 0 ? Math.round((invertit / total) * 100) : 0

  const vincles = state.vinclesSocials ?? 0
  const sequela = state.salutCronica ?? 0
  const fills = state.fills ?? 0
  const llegat = llegatPerFill(state)

  // Balanç de jubilació: renda vs. necessitats, en euros d'aquell any (com es veu al joc). Ni el
  // sou ni la pensió s'indexen a l'IPC (queden nominals); el cost de vida SÍ que s'encareix amb
  // l'IPC (× f), igual que durant la carrera. Per això una pensió no indexada perd terreny.
  const f = factorIPC(state)
  const pensioAnual = pensioPublicaAnual(state)
  const rendaPatrimoni = rendaPatrimoniAnual(state.person)
  const rendaAnual = pensioAnual + rendaPatrimoni
  const necessitatsAnual =
    Math.round(costVidaPropi(state.familia, state.habitatge, state.nivellVida) * f) +
    costHabitatgeAnualNet(state.habitatge, state.familia)
  const veredicte = veredicteJubilacio(rendaAnual, necessitatsAnual)
  const salut = Math.round(state.person.stats.salut)
  const moralitat = Math.round(state.person.stats.moralitat ?? 50)

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

  // QUÈ HA MARCAT LA VIDA: atribueix el resultat a la seva FONT (origen, política, esforç,
  // col·lectiu, explotació, herència). Llegibilitat de la causa: el gradient és ESTRUCTURA, no
  // només mèrit. Cada factor és [icona, text]; només es mostren els que han pesat de debò.
  const sou = state.empresa?.souEmpleats
  const explotador = sou === 'precari' || sou === 'molt_baix' || sou === 'baix'
  const factors: [LucideIcon, string][] = [
    [Dices, t('gameover.factor.origen', { classe: t(`family.${state.familia.classe}.name`) })],
    [Landmark, t('gameover.factor.regim', { regim: t(`regim.${state.regimPolitic ?? 'mixt'}.nom`) })],
  ]
  if (state.teDiploma) factors.push([GraduationCap, t('gameover.factor.diploma')])
  if (state.empresa || (state.intentsEmpresa ?? 0) > 0)
    factors.push([
      Factory,
      explotador ? t('gameover.factor.negoci_explotador') : t('gameover.factor.negoci_just'),
    ])
  if ((state.poderSindical ?? 0) >= 0.25) factors.push([Megaphone, t('gameover.factor.sindicat')])
  if (state.herenciaParesRebuda || (state.llegatEnVida ?? 0) > 0)
    factors.push([Dna, t('gameover.factor.herencia')])
  if (nivellMoralitat(moralitat) === 'bo')
    factors.push([HeartHandshake, t('gameover.factor.moral_bo')])
  if (nivellMoralitat(moralitat) === 'malvat')
    factors.push([Scale, t('gameover.factor.moral_malvat')])

  // Tractament emocional del títol segons el desenllaç: la MORT és sòbria i desaturada; el
  // TRIOMF (vida plena / jubilació daurada / sòlida) és daurat amb un halo; la resta, neutre.
  const esMort = finalTipus === 'mort'
  const esTriomf = finalTipus === 'plena' || finalTipus === 'jub_daurada' || finalTipus === 'solid'
  const haloClass = esMort ? 'bg-danger/15' : esTriomf ? 'bg-gold/25' : 'bg-accent/15'
  const titleClass = esMort ? 'text-inksoft' : esTriomf ? 'text-gold2' : 'text-ink'
  // Comptador d'índex per escalonar la revelació (cada bloc puja un rere l'altre).
  let i = 0
  const reveal = () => ({ '--i': i++ }) as CSSProperties

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="relative">
          <div
            aria-hidden
            className={`animate-halo-once pointer-events-none absolute -inset-x-8 -top-6 -bottom-4 -z-10 rounded-full blur-3xl ${haloClass}`}
          />
          <h1 className={`animate-title-settle text-4xl font-black ${titleClass}`}>
            {t(`gameover.final.${finalTipus}.title`)}
          </h1>
        </div>
        <p className="animate-reveal-up mt-3 text-inksoft" style={reveal()}>
          {finalTipus === 'mort'
            ? t('gameover.final.mort.desc', { edat: edatAnys(state.person.edatMesos) })
            : t(`gameover.final.${finalTipus}.desc`)}
        </p>

        <div className="animate-reveal-up mt-8 grid grid-cols-2 gap-4" style={reveal()}>
          <div className="rounded-2xl bg-surface/70 p-5 ring-1 ring-line/50 shadow-card">
            <div className="text-sm text-inkfaint">{t('gameover.benestarFinal')}</div>
            <div className="mt-1 text-3xl font-bold tabular-nums text-money">{benestarAnim}</div>
            <div className="text-xs text-inkfaint">{t(benestarLevelKey(benestar))}</div>
          </div>
          <div className="rounded-2xl bg-surface/70 p-5 ring-1 ring-line/50 shadow-card">
            <div className="text-sm text-inkfaint">{t('gameover.patrimoniFinal')}</div>
            <div
              className={`mt-1 text-3xl font-bold tabular-nums ${
                total < 0 ? 'text-danger' : 'text-money'
              }`}
            >
              {formatEurosCompact(totalAnim)}
            </div>
          </div>
        </div>

        <div className="animate-reveal-up mt-4 rounded-2xl bg-surface/60 p-5 text-left" style={reveal()}>
          <h2 className="mb-3 text-sm font-semibold text-inksoft">
            {t('gameover.desglos')}
          </h2>
          <div className="space-y-1.5">
            <Line label={t('patrimoni.efectiu')} value={formatEurosCompact(efectiu)} />
            <Line label={t('patrimoni.inversions')} value={formatEurosCompact(inversions)} />
            {cases.length > 0 && (
              <Line label={t('patrimoni.cases')} value={String(cases.length)} />
            )}
            {deuteConsum > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-danger">{t('patrimoni.deute')}</span>
                <span className="font-medium text-danger">
                  −{formatEurosCompact(deuteConsum)}
                </span>
              </div>
            )}
          </div>
          <div className="mt-3 space-y-1.5 border-t border-line/60 pt-3">
            <Line icon={Heart} label={t('stat.salut')} value={`${salut}/100`} />
            <Line
              icon={Scale}
              label={t('stat.moralitat')}
              value={`${t(`moralitat.banda.${nivellMoralitat(moralitat)}`)} · ${moralitat}/100`}
            />
            <Line icon={Handshake} label={t('stat.vincles')} value={`${Math.round(vincles * 100)}%`} />
            {fills > 0 && <Line icon={Baby} label={t('stat.fills')} value={String(fills)} />}
            {sequela > 0 && (
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1.5 text-danger">
                  <Icon icon={Bandage} size={14} /> {t('stat.sequela')}
                </span>
                <span className="font-medium text-danger">−{Math.round(sequela)}</span>
              </div>
            )}
          </div>
          <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-money/90">
            <Icon icon={TrendingUp} size={14} className="mt-0.5 shrink-0" />
            <span>{t('gameover.notaInversio', { pct: pctInvertit })}</span>
          </p>
        </div>

        {/* Què ha marcat la vida: atribució del resultat a la seva font (estructura vs esforç). */}
        <div className="animate-reveal-up mt-4 rounded-2xl bg-surface/60 p-5 text-left" style={reveal()}>
          <h2 className="mb-3 text-sm font-semibold text-inksoft">
            {t('gameover.factors.titol')}
          </h2>
          <ul className="space-y-2">
            {factors.map(([icon, text], idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-inksoft">
                <Icon icon={icon} size={16} className="mt-0.5 shrink-0 text-inkfaint" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
          {/* Contrafàctic de règim: el terra el va moure la REGLA (la política), no tu. */}
          <p className="mt-3 flex items-start gap-2 border-t border-line/60 pt-3 text-xs leading-relaxed text-gold/90">
            <Icon icon={Landmark} size={14} className="mt-0.5 shrink-0" />
            <span>{t(`gameover.contrafactic.${state.regimPolitic ?? 'mixt'}`)}</span>
          </p>
        </div>

        {/* Balanç de jubilació: d'on viuràs ara que has plegat. */}
        {state.jubilat && (
          <div className="animate-reveal-up mt-4 rounded-2xl bg-surface/60 p-5 text-left" style={reveal()}>
            <h2 className="mb-3 text-sm font-semibold text-inksoft">
              {t('gameover.jubilacio.titol')}
            </h2>
            <div className="space-y-1.5">
              <Line
                label={t('gameover.jubilacio.pensio')}
                value={`${formatEurosCompact(Math.round(pensioAnual / MESOS_PER_ANY))}/mes`}
              />
              <Line
                label={t('gameover.jubilacio.rendaPatrimoni')}
                value={`${formatEurosCompact(Math.round(rendaPatrimoni / MESOS_PER_ANY))}/mes`}
              />
              <div className="flex justify-between border-t border-line/60 pt-1.5 text-sm">
                <span className="font-semibold text-ink">
                  {t('gameover.jubilacio.total')}
                </span>
                <span className="font-bold text-money">
                  {formatEurosCompact(Math.round(rendaAnual / MESOS_PER_ANY))}/mes
                </span>
              </div>
              <Line
                label={t('gameover.jubilacio.necessitats')}
                value={`${formatEurosCompact(Math.round(necessitatsAnual / MESOS_PER_ANY))}/mes`}
              />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-gold/90">
              {t(`gameover.jubilacio.${veredicte}`)}
            </p>
          </div>
        )}

        {/* Per què el teu benestar: desglossament llegible (què t'apuja i què t'esfondra). */}
        {esAdult && (
          <div className="animate-reveal-up mt-4 rounded-2xl bg-surface/40 p-4 text-left" style={reveal()}>
            <h2 className="mb-2 text-sm font-semibold text-inksoft">
              {t('gameover.desglosBenestar')}
            </h2>
            <div className="space-y-1">
              {desglosBenestarAdult(state).map((c) => (
                <div key={c.clau} className="flex justify-between text-sm">
                  <span className="text-inkfaint">{t(c.clau)}</span>
                  <span
                    className={
                      c.valor > 0
                        ? 'font-medium text-money'
                        : c.valor < 0
                          ? 'font-medium text-danger'
                          : 'text-inkfaint'
                    }
                  >
                    {c.valor > 0 ? '+' : ''}
                    {c.valor}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evolució de la vida: salut+benestar i patrimoni net, al llarg de tots els anys. */}
        {state.vidaHist && state.vidaHist.length >= 2 && (
          <div className="animate-reveal-up mt-4 text-left" style={reveal()}>
            <LifeCharts hist={state.vidaHist} />
          </div>
        )}

        {state.patrimoniHist && state.patrimoniHist.length >= 2 && (
          <div className="animate-reveal-up mt-3 text-left" style={reveal()}>
            <InvestmentChart hist={state.patrimoniHist} />
          </div>
        )}

        {/* Herència i dinastia: si deixes descendència, pots continuar amb la generació següent. */}
        {fills > 0 && (
          <div
            ref={dinastiaRef}
            className="animate-reveal-up mt-4 rounded-2xl bg-accent/10 p-5 text-left ring-1 ring-accent/30"
            style={reveal()}
          >
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-accent2">
              <Icon icon={Users} size={16} /> {t('gameover.dinastia.titol')}
            </h2>
            <p className="text-sm text-inksoft">
              {t('gameover.dinastia.herencia', { fills, llegat: formatEurosCompact(llegat) })}
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
