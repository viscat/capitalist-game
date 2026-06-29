import { useState } from 'react'
import {
  EMPRESA_CAPITAL_MAX,
  EMPRESA_CAPITAL_MIN,
  EMPRESA_FRACAS_BASE,
  EMPRESA_SOU_EMPLEATS,
} from '../domain/constants'
import {
  beneficiEmpresaAnual,
  empleatsEmpresa,
  habilitatEmprenedora,
  pFracasEmpresaAnual,
} from '../domain/stats'
import type { NivellSouEmpleats } from '../domain/types'
import { useGame } from '../state/GameContext'
import { useT } from '../i18n'
import { formatEuros } from '../lib/format'

const SOUS: readonly NivellSouEmpleats[] = [
  'precari',
  'molt_baix',
  'baix',
  'mercat',
  'alt',
  'molt_alt',
]

/**
 * Panell d'EMPRENEDORIA (carrera). Sense empresa: oferta de fundar-ne una (amb avís que la majoria
 * fracassen). Amb empresa: estat (capital, plantilla, anys, risc de tancar) i decisions (reinversió
 * vs sou propi, sou dels empleats, tancar). Vegeu DESIGN_EMPRENEDORIA.md.
 */
export function EmpresaPanel() {
  const { t } = useT()
  const { state, fundarEmpresa, tancarEmpresa, setReinversioEmpresa, setSouEmpleats } =
    useGame()
  const liquid = state
    ? state.person.patrimoni.efectiu + state.person.patrimoni.inversions
    : 0
  // Aposta inicial per defecte: ~40% del líquid (deixant marge per reintentar si fracassa).
  const [aposta, setAposta] = useState(0)
  if (!state) return null

  const empresa = state.empresa

  // --- SENSE empresa: fundar ---
  if (!empresa) {
    const apostaDefault = Math.max(
      EMPRESA_CAPITAL_MIN,
      Math.min(liquid, Math.round((aposta || liquid * 0.4) / 1000) * 1000),
    )
    const potFundar = liquid >= EMPRESA_CAPITAL_MIN
    const pas = 5000
    return (
      <div className="rounded-2xl bg-surface/60 p-4 ring-1 ring-line/50">
        <h3 className="text-sm font-bold text-ink">🏭 {t('empresa.fundar.titol')}</h3>
        <p className="mt-1 text-xs leading-relaxed text-inksoft">
          {t('empresa.fundar.avis')}
        </p>
        {potFundar ? (
          <>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-inksoft">{t('empresa.capitalInicial')}</span>
              <span className="font-bold tabular-nums text-ink">
                {formatEuros(apostaDefault)}
              </span>
            </div>
            <input
              type="range"
              min={EMPRESA_CAPITAL_MIN}
              max={Math.max(EMPRESA_CAPITAL_MIN, Math.round(liquid / pas) * pas)}
              step={pas}
              value={apostaDefault}
              onChange={(e) => setAposta(Number(e.target.value))}
              className="mt-2 w-full accent-accent"
            />
            <p className="mt-1 text-[11px] text-inkfaint">{t('empresa.fundar.risc')}</p>
            <button
              onClick={() => {
                fundarEmpresa(apostaDefault)
                setAposta(0)
              }}
              className="btn-game mt-3 w-full"
            >
              {t('empresa.fundar.accio', { capital: formatEuros(apostaDefault) })}
            </button>
          </>
        ) : (
          <p className="mt-3 text-xs text-inkfaint">
            {t('empresa.fundar.sensecapital', {
              minim: formatEuros(EMPRESA_CAPITAL_MIN),
            })}
          </p>
        )}
      </div>
    )
  }

  // --- AMB empresa: gestió ---
  const empleats = empleatsEmpresa(empresa)
  const habilitat = habilitatEmprenedora(state)
  const pFracas = Math.round(pFracasEmpresaAnual(empresa, habilitat) * 100)
  const beneficiTipic = beneficiEmpresaAnual(empresa, 1)
  const reinv = state.reinversioEmpresa ?? 0.5
  const cfg = EMPRESA_SOU_EMPLEATS[empresa.souEmpleats]

  return (
    <div className="rounded-2xl bg-surface/60 p-4 ring-1 ring-line/50">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-bold text-ink">🏭 {t('empresa.titol')}</h3>
        <span className="text-xs text-inkfaint">
          {t('empresa.anys', { anys: empresa.anys })}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <Stat label={t('empresa.capital')} value={formatEuros(empresa.capital)} />
        <Stat label={t('empresa.empleats')} value={String(empleats)} />
        <Stat
          label={t('empresa.risc')}
          value={`${pFracas}%`}
          danger={pFracas >= EMPRESA_FRACAS_BASE * 100 * 0.6}
        />
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-inkfaint">
        {t('empresa.beneficiTipic', { benefici: formatEuros(Math.max(0, beneficiTipic)) })}
      </p>

      {/* Sou dels empleats: plusvàlua vs moralitat */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-inksoft">✊ {t('empresa.souEmpleats')}</span>
          <span className="text-inkfaint">
            {formatEuros(cfg.souAnual)}/{t('empresa.any')}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          {SOUS.map((nivell) => (
            <button
              key={nivell}
              onClick={() => setSouEmpleats(nivell)}
              className={`flex-1 rounded-lg px-1.5 py-1 text-[10px] font-medium transition ${
                empresa.souEmpleats === nivell
                  ? 'bg-accent/30 text-ink ring-1 ring-accent/50'
                  : 'bg-surface text-inksoft ring-1 ring-line/60 hover:bg-bg2'
              }`}
            >
              {t(`empresa.sou.${nivell}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Reinversió vs sou propi */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-inksoft">{t('empresa.reinversio')}</span>
          <span className="font-bold tabular-nums text-ink">
            {Math.round(reinv * 100)}% / {Math.round((1 - reinv) * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(reinv * 100)}
          onChange={(e) => setReinversioEmpresa(Number(e.target.value) / 100)}
          className="mt-1 w-full accent-accent"
        />
        <p className="mt-1 text-[11px] text-inkfaint">{t('empresa.reinversio.desc')}</p>
      </div>

      {empresa.capital >= EMPRESA_CAPITAL_MAX && (
        <p className="mt-2 text-[11px] text-amber-300/90">{t('empresa.saturada')}</p>
      )}

      <button
        onClick={tancarEmpresa}
        className="mt-3 w-full rounded-xl border border-line/60 py-2 text-xs font-medium text-inksoft transition hover:bg-bg2"
      >
        {t('empresa.tancar', { capital: formatEuros(empresa.capital) })}
      </button>
    </div>
  )
}

function Stat({
  label,
  value,
  danger,
}: {
  label: string
  value: string
  danger?: boolean
}) {
  return (
    <div className="rounded-lg bg-surface/70 p-2 ring-1 ring-line/40">
      <div className="text-[10px] uppercase tracking-wide text-inkfaint">{label}</div>
      <div className={`text-sm font-bold tabular-nums ${danger ? 'text-danger' : 'text-ink'}`}>
        {value}
      </div>
    </div>
  )
}
