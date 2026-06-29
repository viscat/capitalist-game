import type { CSSProperties } from 'react'
import type { EventEffect } from '../domain/types'
import { useT } from '../i18n'
import { formatEuros } from '../lib/format'

interface Badge {
  label: string
  text: string
  positive: boolean
  /** Magnitud destacada (xocs grans: crac de mercat, despesa greu): el badge pesa més. */
  fort?: boolean
}

const MONEY_FIELDS: (keyof EventEffect)[] = ['efectiu', 'inversions']

export function EffectList({ effect }: { effect: EventEffect }) {
  const { t } = useT()
  const badges: Badge[] = []

  if (effect.benestar) {
    const v = effect.benestar
    badges.push({
      label: t('stat.benestar'),
      text: `${v > 0 ? '+' : ''}${v}`,
      positive: v > 0,
    })
  }
  for (const field of MONEY_FIELDS) {
    const v = effect[field]
    if (typeof v === 'number' && v !== 0) {
      badges.push({
        label: t(`patrimoni.${field}`),
        text: `${v > 0 ? '+' : ''}${formatEuros(v)}`,
        positive: v > 0,
      })
    }
  }
  if (effect.despesaGreu) {
    badges.push({
      label: t('effect.despesaGreu'),
      text: `−${formatEuros(effect.despesaGreu)}`,
      positive: false,
      fort: true,
    })
  }
  // Herència en vida: surt del teu patrimoni líquid ARA (es transfereix als fills).
  if (effect.llegatEnVidaDelta && effect.llegatEnVidaDelta > 0) {
    badges.push({
      label: t('effect.llegatEnVida'),
      text: `−${formatEuros(effect.llegatEnVidaDelta)}`,
      positive: false,
    })
  }
  if (effect.salutDelta) {
    const v = effect.salutDelta
    badges.push({
      label: `❤️ ${t('stat.salut')}`,
      text: `${v > 0 ? '+' : ''}${v}`,
      positive: v > 0,
    })
  }
  if (effect.moralitatDelta) {
    const v = effect.moralitatDelta
    badges.push({
      label: `⚖️ ${t('stat.moralitat')}`,
      text: `${v > 0 ? '+' : ''}${v}`,
      positive: v > 0,
    })
  }
  if (effect.poderSindicalDelta) {
    const pct = Math.round(effect.poderSindicalDelta * 100)
    badges.push({
      label: `✊ ${t('stat.sindicat')}`,
      text: `${pct > 0 ? '+' : ''}${pct}%`,
      positive: pct > 0,
    })
  }
  if (effect.mercatPct) {
    const pct = Math.round(effect.mercatPct * 100)
    badges.push({
      label: t('effect.mercat'),
      text: `${pct > 0 ? '+' : ''}${pct}%`,
      positive: pct > 0,
      fort: Math.abs(pct) >= 15,
    })
  }
  if (effect.salariNou !== undefined) {
    badges.push(
      effect.salariNou === 0
        ? { label: t('effect.atur'), text: '', positive: false }
        : {
            label: t('effect.salariNou'),
            text: `${formatEuros(effect.salariNou)}/mes`,
            positive: true,
          },
    )
  } else if (effect.salariDelta) {
    const v = effect.salariDelta
    badges.push({
      label: t('effect.salari'),
      text: `${v > 0 ? '+' : ''}${formatEuros(v)}/mes`,
      positive: v > 0,
    })
  }
  // Stats no monetaris: fer-ne visible l'impacte de cada decisió.
  if (effect.vinclesDelta) {
    const pct = Math.round(effect.vinclesDelta * 100)
    badges.push({
      label: `🤝 ${t('stat.vincles')}`,
      text: `${pct > 0 ? '+' : ''}${pct}%`,
      positive: pct > 0,
    })
  }
  if (effect.academicDelta) {
    const pct = Math.round(effect.academicDelta * 100)
    badges.push({
      label: `🎓 ${t('stat.academic')}`,
      text: `${pct > 0 ? '+' : ''}${pct}%`,
      positive: pct > 0,
    })
  }
  if (effect.salutCronicaDelta) {
    // És una penalització crònica de benestar (sempre dolenta).
    badges.push({
      label: `🩹 ${t('stat.sequela')}`,
      text: `−${Math.round(effect.salutCronicaDelta)}`,
      positive: false,
    })
  }

  if (badges.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b, i) => (
        <span
          key={b.label}
          style={{ '--i': i } as CSSProperties}
          className={`animate-badge-in rounded-full font-medium ${
            b.fort ? 'px-3 py-1 text-sm font-bold ring-1' : 'px-2.5 py-0.5 text-xs'
          } ${
            b.positive
              ? `bg-money/15 text-money ${b.fort ? 'ring-money/40' : ''}`
              : `bg-danger/15 text-danger ${b.fort ? 'ring-danger/40' : ''}`
          }`}
        >
          {b.label} {b.text}
        </span>
      ))}
    </div>
  )
}
