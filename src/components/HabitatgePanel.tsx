import { useState } from 'react'
import { TERMINIS_HIPOTECA } from '../domain/constants'
import {
  OPCIONS_LLOGUER,
  PROPIETATS,
  liquidDisponible,
  ofertaCompra,
} from '../domain/housing'
import { useGame } from '../state/GameContext'
import { useT } from '../i18n'
import { formatEuros } from '../lib/format'

type Vista = 'resum' | 'comprar' | { propietatId: string }

export function HabitatgePanel() {
  const { t } = useT()
  const { state, llogar, comprarCasa, tornarAmbPares } = useGame()
  const [vista, setVista] = useState<Vista>('resum')
  const [anys, setAnys] = useState(TERMINIS_HIPOTECA[1])
  if (!state) return null

  const habitatge = state.habitatge ?? { tipus: 'amb_pares' as const }
  const esPropietari = habitatge.tipus === 'propietat'

  const CARD = 'rounded-2xl bg-slate-800/70 p-5 ring-1 ring-slate-700/50'

  // --- Vista: navegar propietats («buscar casa/pis») ---
  if (vista === 'comprar') {
    return (
      <div className={CARD}>
        <Header title={t('habitatge.buscarCasa')} onBack={() => setVista('resum')} />
        <p className="mb-3 text-xs text-slate-500">
          {t('habitatge.liquid', { amount: formatEuros(liquidDisponible(state)) })}
        </p>
        <div className="space-y-2">
          {PROPIETATS.map((p) => (
            <button
              key={p.id}
              onClick={() => setVista({ propietatId: p.id })}
              className="flex w-full items-center justify-between rounded-lg bg-slate-700/60 p-3 text-left transition hover:bg-indigo-600/80"
            >
              <span className="font-medium text-slate-100">{t(`propietat.${p.id}`)}</span>
              <span className="font-mono text-sm text-slate-300">
                {formatEuros(p.preu)}
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
          {oferta.ajutFamiliar > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-400">{t('habitatge.ajutFamiliar')}</span>
              <span className="font-medium text-emerald-300">
                +{formatEuros(oferta.ajutFamiliar)}
              </span>
            </div>
          )}
          <Row
            label={t('habitatge.quota')}
            value={`${formatEuros(oferta.hipoteca.quotaAnual)}/any`}
          />
        </div>

        <div className="mt-3">
          <div className="mb-1 text-xs text-slate-500">{t('habitatge.termini')}</div>
          <div className="flex gap-2">
            {TERMINIS_HIPOTECA.map((n) => (
              <button
                key={n}
                onClick={() => setAnys(n)}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  anys === n
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {t('habitatge.anys', { anys: n })}
              </button>
            ))}
          </div>
        </div>

        {!oferta.teEntrada && (
          <p className="mt-3 text-xs text-amber-400">🔒 {t('habitatge.noEntrada')}</p>
        )}
        {oferta.teEntrada && !oferta.bancAprova && (
          <p className="mt-3 text-xs text-amber-400">🔒 {t('habitatge.bancRebutja')}</p>
        )}

        <button
          onClick={() => {
            comprarCasa(propietat.id, anys)
            setVista('resum')
          }}
          disabled={!potComprar}
          className="mt-4 w-full rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-40"
        >
          {t('habitatge.confirmaCompra')}
        </button>
      </div>
    )
  }

  // --- Vista: resum de la situació actual ---
  return (
    <div className={CARD}>
      <h3 className="mb-2 text-sm font-semibold text-slate-300">
        {t('habitatge.title')}
      </h3>
      <div className="mb-3 space-y-1 text-sm">
        <Row label={t('habitatge.actual')} value={t(`tipusHabitatge.${habitatge.tipus}`)} />
        {habitatge.lloguerAnual ? (
          <Row
            label={t('habitatge.lloguer')}
            value={`${formatEuros(habitatge.lloguerAnual)}/any`}
          />
        ) : null}
        {esPropietari && (
          <>
            <Row
              label={t('habitatge.valor')}
              value={formatEuros(
                state.person.patrimoni.cases.reduce((a, b) => a + b, 0),
              )}
            />
            {habitatge.hipoteca ? (
              <>
                <Row
                  label={t('habitatge.quota')}
                  value={`${formatEuros(habitatge.hipoteca.quotaAnual)}/any`}
                />
                <Row
                  label={t('habitatge.deute')}
                  value={formatEuros(habitatge.hipoteca.deute)}
                />
              </>
            ) : (
              <p className="text-xs text-emerald-300">{t('habitatge.sensehipoteca')}</p>
            )}
          </>
        )}
      </div>

      {!esPropietari && (
        <div className="space-y-2">
          {OPCIONS_LLOGUER.map((o) => (
            <button
              key={o.tipus}
              onClick={() => llogar(o.tipus)}
              disabled={habitatge.tipus === o.tipus}
              className="flex w-full items-center justify-between rounded-lg bg-slate-700/60 p-3 text-left transition hover:bg-indigo-600/80 disabled:opacity-40"
            >
              <span className="font-medium text-slate-100">
                {t(`tipusHabitatge.${o.tipus}`)}
              </span>
              <span className="font-mono text-sm text-slate-300">
                {formatEuros(o.lloguerAnual)}/any
              </span>
            </button>
          ))}
          <button
            onClick={() => setVista('comprar')}
            className="w-full rounded-lg bg-indigo-600 p-3 font-medium text-white transition hover:bg-indigo-500"
          >
            🏠 {t('habitatge.comprar')}
          </button>
          {!esPropietari && habitatge.tipus !== 'amb_pares' && (
            <button
              onClick={tornarAmbPares}
              className="w-full rounded-lg bg-slate-700/60 p-2 text-sm text-slate-300 transition hover:bg-slate-600"
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
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-100">{value}</span>
    </div>
  )
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <button
        onClick={onBack}
        className="text-sm text-slate-400 transition hover:text-slate-200"
      >
        ←
      </button>
      <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
    </div>
  )
}
