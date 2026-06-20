const euros = new Intl.NumberFormat('ca-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

export function formatEuros(n: number): string {
  return euros.format(n)
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
