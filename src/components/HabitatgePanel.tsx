import { useState } from 'react'
import { MESOS_PER_ANY, TERMINIS_HIPOTECA } from '../domain/constants'
import {
  PROPIETATS,
  ajutHipotecaFamiliar,
  calculaVenda,
  liquidDisponible,
  ofertaCompra,
} from '../domain/housing'
import { factorHabitatge } from '../domain/stats'
import { useGame } from '../state/GameContext'
import { useT } from '../i18n'
import { useCoachmark } from '../state/tutorial'
import { formatEuros } from '../lib/format'

type Vista = 'resum' | 'comprar' | { propietatId: string }

export function HabitatgePanel() {
  const { t } = useT()
  const { state, llogar, comprarCasa, vendreCasa, tornarAmbPares } = useGame()
  const [vista, setVista] = useState<Vista>('resum')
  const [anys, setAnys] = useState(TERMINIS_HIPOTECA[1])
  const coachRef = useCoachmark<HTMLDivElement>('habitatge')
  if (!state) return null

  const habitatge = state.habitatge ?? { tipus: 'amb_pares' as const }
  const esPropietari = habitatge.tipus === 'propietat'
  // Els torns són anuals, però lloguer i quota es mostren en MENSUAL (com la resta de panells).
  const perMes = (anual: number) => Math.round(anual / MESOS_PER_ANY)

  const CARD = 'rounded-2xl bg-surface/70 p-5 ring-1 ring-line/50'

  // --- Vista: navegar propietats («buscar casa/pis») ---
  if (vista === 'comprar') {
    return (
      <div className={CARD}>
        <Header title={t('habitatge.buscarCasa')} onBack={() => setVista('resum')} />
        <p className="mb-3 text-xs text-inkfaint">
          {t('habitatge.liquid', { amount: formatEuros(liquidDisponible(state)) })}
        </p>
        <div className="space-y-2">
          {PROPIETATS.map((p) => (
            <button
              key={p.id}
              onClick={() => setVista({ propietatId: p.id })}
              className="flex w-full items-center justify-between rounded-lg bg-surface2/60 p-3 text-left transition hover:bg-accent/80"
            >
              <span className="font-medium text-ink">{t(`propietat.${p.id}`)}</span>
              <span className="font-mono text-sm text-inksoft">
                {formatEuros(Math.round((p.preu * factorHabitatge(state)) / 100) * 100)}
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // --- Vista: hipoteca d'una propietat concreta («buscar hipoteca») ---
  if (typeof vista === 'object') {
    const propietat = PROPIETATS.find((p) => p.id === vista.propietatId)!
    const oferta = ofertaCompra(state, propietat.preu, anys)
    const potComprar = oferta.teEntrada && oferta.bancAprova
    return (
      <div className={CARD}>
        <Header
          title={t(`propietat.${propietat.id}`)}
          onBack={() => setVista('comprar')}
        />
        <div className="space-y-1.5 text-sm">
          <Row label={t('habitatge.preu')} value={formatEuros(oferta.preu)} />
          <Row label={t('habitatge.entrada')} value={formatEuros(oferta.entrada)} />
          <Row
            label={t('habitatge.despeses')}
            value={`+${formatEuros(oferta.despeses)}`}
          />
          {oferta.enParella && (
            <div className="flex justify-between">
              <span className="text-inksoft">💑 {t('habitatge.parellaMeitat')}</span>
              <span className="font-medium text-money">−50%</span>
            </div>
          )}
          {oferta.ajutFamiliar > 0 && (
            <div className="flex justify-between">
              <span className="text-inksoft">{t('habitatge.ajutFamiliar')}</span>
              <span className="font-medium text-money">
                +{formatEuros(oferta.ajutFamiliar)}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t border-line/60 pt-1.5">
            <span className="font-semibold text-inksoft">
              {t('habitatge.aportacioInicial')}
            </span>
            <span className="font-bold text-gold">
              {formatEuros(oferta.aportacioInicial)}
            </span>
          </div>
          {oferta.hipoteca.quotaAnual > 0 && (
            <Row
              label={t('habitatge.quota')}
              value={`${formatEuros(perMes(oferta.hipoteca.quotaAnual))}/mes`}
            />
          )}
          {(() => {
            const ajutHip = ajutHipotecaFamiliar(state.familia, {
              tipus: 'propietat',
              hipoteca: oferta.hipoteca,
            })
            return ajutHip > 0 ? (
              <div className="flex justify-between">
                <span className="text-inksoft">{t('habitatge.ajutHipoteca')}</span>
                <span className="font-medium text-money">−{formatEuros(perMes(ajutHip))}/mes</span>
              </div>
            ) : null
          })()}
        </div>

        <div className="mt-3">
          <div className="mb-1 text-xs text-inkfaint">{t('habitatge.termini')}</div>
          <div className="flex flex-wrap gap-2">
            {[0, ...TERMINIS_HIPOTECA].map((n) => (
              <button
                key={n}
                onClick={() => setAnys(n)}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  anys === n
                    ? 'bg-accent text-white'
                    : 'bg-surface2 text-inksoft hover:bg-line'
                }`}
              >
                {n === 0 ? t('habitatge.comptat') : t('habitatge.anys', { anys: n })}
              </button>
            ))}
          </div>
        </div>

        {!oferta.teEntrada && (
          <p className="mt-3 text-xs text-gold">🔒 {t('habitatge.noEntrada')}</p>
        )}
        {oferta.teEntrada && !oferta.bancAprova && (
          <p className="mt-3 text-xs text-gold">🔒 {t('habitatge.bancRebutja')}</p>
        )}

        <button
          onClick={() => {
            comprarCasa(propietat.id, anys)
            setVista('resum')
          }}
          disabled={!potComprar}
          className="mt-4 w-full rounded-xl bg-money px-6 py-3 font-semibold text-bg transition hover:bg-money2 disabled:opacity-40"
        >
          {t('habitatge.confirmaCompra')}
        </button>
      </div>
    )
  }

  // --- Vista: resum de la situació actual ---
  return (
    <div ref={coachRef} className={CARD}>
      <h3 className="mb-2 text-sm font-semibold text-inksoft">
        {t('habitatge.title')}
      </h3>
      <div className="mb-3 space-y-1 text-sm">
        <Row label={t('habitatge.actual')} value={t(`tipusHabitatge.${habitatge.tipus}`)} />
        {habitatge.lloguerAnual ? (
          <Row
            label={t('habitatge.lloguer')}
            value={`${formatEuros(perMes(habitatge.lloguerAnual))}/mes`}
          />
        ) : null}
        {esPropietari && (
          <>
            <Row
              label={t('habitatge.casesCount', {
                n: state.person.patrimoni.cases.length,
              })}
              value={formatEuros(
                state.person.patrimoni.cases.reduce((a, b) => a + b, 0),
              )}
            />
            {habitatge.hipoteca ? (
              <>
                <Row
                  label={t('habitatge.quota')}
                  value={`${formatEuros(perMes(habitatge.hipoteca.quotaAnual))}/mes`}
                />
                <Row
                  label={t('habitatge.deute')}
                  value={formatEuros(habitatge.hipoteca.deute)}
                />
              </>
            ) : (
              <p className="text-xs text-money">{t('habitatge.sensehipoteca')}</p>
            )}
          </>
        )}
      </div>

      {/* Propietari: pot comprar MÉS cases (inversió immobiliària) o VENDRE les que té. */}
      {esPropietari && (
        <div className="space-y-2">
          <button
            onClick={() => setVista('comprar')}
            className="w-full rounded-lg bg-accent p-3 font-medium text-white transition hover:bg-accent2"
          >
            🏠 {t('habitatge.comprarMes')}
          </button>
          <p className="pt-1 text-xs text-inkfaint">{t('habitatge.vendre.titol')}</p>
          {state.person.patrimoni.cases.map((valor, i) => {
            const venda = calculaVenda(state, i)
            return (
              <button
                key={i}
                onClick={() => vendreCasa(i)}
                className="flex w-full items-center justify-between rounded-lg bg-surface2/60 p-3 text-left transition hover:bg-danger/70"
              >
                <span className="text-sm">
                  <span className="font-medium text-ink">
                    {t('habitatge.vendre.casa', { n: i + 1 })}
                  </span>
                  <span className="block text-[11px] text-inksoft">
                    {t('habitatge.vendre.valor', { valor: formatEuros(valor) })}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-xs text-inksoft">{t('habitatge.vendre.reps')}</span>
                  <span className="font-semibold text-money">
                    {formatEuros(venda ? venda.net : 0)}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}

      {!esPropietari && (
        <div className="space-y-2">
          <p className="text-xs text-inkfaint">{t('habitatge.mercatLloguer')}</p>
          {(state.ofertesLloguer ?? []).map((o) => {
            const actual =
              habitatge.tipus === o.tipus && habitatge.lloguerAnual === o.lloguerAnual
            return (
              <button
                key={o.id}
                onClick={() => llogar(o.id)}
                disabled={actual}
                className="flex w-full items-center justify-between rounded-lg bg-surface2/60 p-3 text-left transition hover:bg-accent/80 disabled:opacity-40"
              >
                <span className="font-medium text-ink">
                  {t(`tipusHabitatge.${o.tipus}`)}
                </span>
                <span className="font-mono text-sm text-inksoft">
                  {formatEuros(perMes(o.lloguerAnual))}/mes
                </span>
              </button>
            )
          })}
          <button
            onClick={() => setVista('comprar')}
            className="w-full rounded-lg bg-accent p-3 font-medium text-white transition hover:bg-accent2"
          >
            🏠 {t('habitatge.comprar')}
          </button>
          {!esPropietari && habitatge.tipus !== 'amb_pares' && (
            <button
              onClick={tornarAmbPares}
              className="w-full rounded-lg bg-surface2/60 p-2 text-sm text-inksoft transition hover:bg-line"
            >
              {t('habitatge.tornarPares')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-inksoft">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  )
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <button
        onClick={onBack}
        className="text-sm text-inksoft transition hover:text-ink"
      >
        ←
      </button>
      <h3 className="text-sm font-semibold text-inksoft">{title}</h3>
    </div>
  )
}
