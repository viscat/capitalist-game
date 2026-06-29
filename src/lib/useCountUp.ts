import { useEffect, useRef, useState } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Anima un número des del valor anterior fins al nou (ease-out, via requestAnimationFrame).
 * En un joc sobre diners, veure la xifra MOURE'S (no saltar) és el cor de la sensació. Quan
 * l'usuari prefereix menys moviment o no hi ha rAF (tests/jsdom), retorna sempre el valor
 * exacte. Tots els `setDisplay` passen dins del callback de rAF (asíncron), no a l'efecte.
 */
export function useCountUp(value: number, durationMs = 600): number {
  const animate = !prefersReducedMotion() && typeof requestAnimationFrame === 'function'
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!animate) return
    if (value === fromRef.current) return
    const from = fromRef.current
    const delta = value - from
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
      if (p < 1) {
        setDisplay(from + delta * eased)
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = value
        setDisplay(value)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [value, durationMs, animate])

  return animate ? display : value
}
