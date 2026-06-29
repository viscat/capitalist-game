import type { ReactNode } from 'react'
import { MESOS_PER_ANY } from '../domain/constants'
import {
  becaUniversitat,
  costVidaAnual,
  matriculaAnual,
  suportUniversitatAnual,
} from '../domain/stats'
import { costHabitatgeAnualNet } from '../domain/housing'
import { useGame } from '../state/GameContext'
import { useT } from '../i18n'
import { formatEuros } from '../lib/format'
import { GraduationCap, Home, Icon, Lock } from './icons'

/**
 * Panell de DESPESES i INGRESSOS durant la universitat (mateixa lògica que `advanceTurn`). És
 * informatiu (els imports són obligatoris: matrícula, cost de vida, habitatge; el suport familiar
 * cobreix la vida però no la matrícula), i fa visible que estudiar SEMPRE costa i que el dèficit
 * es torna DEUTE. Es mostra en MENSUAL com la resta de panells.
 */
export function UniBudgetPanel() {
  const { t } = useT()
  const { state } = useGame()
  if (!state) return null

  const perMes = (anual: number) => Math.round(anual / MESOS_PER_ANY)
  const ambPares = (state.habitatge?.tipus ?? 'amb_pares') === 'amb_pares'
  const tipus = state.tipusUniversitat ?? 'publica'

  const costHab = ambPares ? 0 : costHabitatgeAnualNet(state.habitatge, state.familia)
  const costVidaUni = ambPares ? 0 : costVidaAnual('minim')
  const costVida = costHab + costVidaUni
  const matricula = matriculaAnual(tipus)
  const beca = becaUniversitat(state.familia, tipus)
  const matriculaNeta = matricula - beca // cost net de matrícula
  // El suport familiar cobreix el cost de VIDA (mai la matrícula, mai sobrant).
  const suport = Math.min(suportUniversitatAnual(state.familia), costVida)
  // Balanç de l'any: suport − cost de vida − matrícula neta (negatiu = tires d'estalvis → deute).
  const balanc = suport - costVida - matriculaNeta
  const deute = state.person.patrimoni.deute ?? 0

  return (
    <div className="rounded-2xl bg-surface/70 p-5 ring-1 ring-line/50">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-inksoft">
          <Icon icon={GraduationCap} size={16} /> {t('uni.pressupost.titol')}
        </h3>
        <span className="text-sm text-inksoft">
          {t('uni.pressupost.suport')}: {formatEuros(perMes(suport))}/mes
        </span>
      </div>

      {deute > 0 && (
        <div className="mb-3 rounded-lg border border-danger/40 bg-danger/10 p-3">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-danger">{t('pla.deute')}</span>
            <span className="font-mono font-bold text-danger">−{formatEuros(deute)}</span>
          </div>
          <p className="mt-1 text-xs text-danger/80">{t('uni.pressupost.deute.nota')}</p>
        </div>
      )}

      <div className="space-y-1.5 text-sm">
        <Row
          label={t('uni.pressupost.matricula')}
          desc={beca > 0 ? t('uni.pressupost.matricula.beca', { beca: formatEuros(perMes(beca)) }) : undefined}
          value={`−${formatEuros(perMes(matriculaNeta))}/mes`}
        />
        {costVidaUni > 0 && (
          <Row label={t('uni.pressupost.costVida')} value={`−${formatEuros(perMes(costVidaUni))}/mes`} />
        )}
        {costHab > 0 && (
          <Row
            icon={<Icon icon={Home} size={13} />}
            label={t('uni.pressupost.habitatge')}
            value={`−${formatEuros(perMes(costHab))}/mes`}
          />
        )}
        <div className="flex items-center justify-between border-t border-line/60 pt-1.5">
          <span className="font-semibold text-inksoft">{t('uni.pressupost.balanc')}</span>
          <span className={`font-semibold ${balanc < 0 ? 'text-gold' : 'text-money'}`}>
            {balanc >= 0 ? '+' : ''}
            {formatEuros(perMes(balanc))}/mes
          </span>
        </div>
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-inkfaint">
        <Icon icon={Lock} size={13} className="mt-0.5 shrink-0" />
        {t('uni.pressupost.nota')}
      </p>
    </div>
  )
}

function Row({
  label,
  desc,
  value,
  icon,
}: {
  label: string
  desc?: string
  value: string
  icon?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-ink">
          {icon}
          {label}
        </div>
        {desc && <div className="text-xs text-money/90">{desc}</div>}
      </div>
      <span className="shrink-0 font-mono text-gold/90">{value}</span>
    </div>
  )
}
