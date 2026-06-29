const euros = new Intl.NumberFormat('ca-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

export function formatEuros(n: number): string {
  return euros.format(n)
}

/**
 * Format COMPACTE d'euros per a espais reduïts (HUD, eixos de gràfics, resums): evita que
 * els imports llargs es tallin. Ex.: 850 → "850 €", 93000 → "93k €", 1.500.000 → "1,5 M €".
 */
export function formatEurosCompact(n: number): string {
  const abs = Math.abs(n)
  if (abs < 1000) return euros.format(n)
  const sign = n < 0 ? '−' : ''
  if (abs < 1_000_000) return `${sign}${Math.round(abs / 1000)}k €`
  const m = abs / 1_000_000
  const txt = m >= 100 ? String(Math.round(m)) : m.toFixed(1).replace('.0', '').replace('.', ',')
  return `${sign}${txt} M €`
}

/** Clau i18n del nivell de benestar segons el valor 0..100. */
export function benestarLevelKey(benestar: number): string {
  if (benestar < 20) return 'benestar.molt_baix'
  if (benestar < 40) return 'benestar.baix'
  if (benestar < 60) return 'benestar.mig'
  if (benestar < 80) return 'benestar.alt'
  return 'benestar.molt_alt'
}

/**
 * Rampa ÚNICA de color per a stats 0..100 (crit → baix → mig → alt → cim). És la font de
 * veritat compartida: els anells (`StatRing`) en fan servir els hexos directes i les barres
 * les classes Tailwind dels MATEIXOS tokens (`--color-stat-*` a `index.css`).
 */
export const STAT_RAMP = ['#f6504f', '#f97316', '#eab308', '#84cc16', '#22d39a'] as const

function statRampIndex(v: number): number {
  if (v < 20) return 0
  if (v < 40) return 1
  if (v < 60) return 2
  if (v < 80) return 3
  return 4
}

/** Hex de la rampa d'stats per a un valor 0..100 (per a SVG, p. ex. els anells). */
export function statRampHex(v: number): string {
  return STAT_RAMP[statRampIndex(v)]
}

/** Classe Tailwind de fons de la rampa d'stats (barres). */
export function benestarColor(benestar: number): string {
  return ['bg-stat-crit', 'bg-stat-low', 'bg-stat-mid', 'bg-stat-high', 'bg-stat-peak'][
    statRampIndex(benestar)
  ]
}
