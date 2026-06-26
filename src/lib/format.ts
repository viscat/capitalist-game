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

/** Color (classes Tailwind) de la barra de benestar segons el valor. */
export function benestarColor(benestar: number): string {
  if (benestar < 20) return 'bg-red-600'
  if (benestar < 40) return 'bg-orange-500'
  if (benestar < 60) return 'bg-yellow-500'
  if (benestar < 80) return 'bg-lime-500'
  return 'bg-emerald-500'
}
