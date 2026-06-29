import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { statRampHex } from '../lib/format'

/** Mini-anell de progrés (SVG, sense dependències) per a stats 0..100 amb icona al centre. */
export function StatRing({
  value,
  icon,
  size = 44,
  label,
  delta,
  pulseKey,
}: {
  value: number
  icon: ReactNode
  size?: number
  label?: string
  /**
   * Variació a mostrar com a "+N/−N" flotant. IMPORTANT: és el canvi APLICAT per
   * l'esdeveniment d'aquest torn (el mateix que surt a l'historial), NO la diferència bruta del
   * valor entre torns. Així el numeret coincideix sempre amb el que diu l'historial; la deriva
   * d'entorn i el declivi d'edat mouen l'anell però no generen un "+N" fantasma.
   */
  delta?: number | null
  /** Canvia per torn (p. ex. la llargada de l'historial): dispara el "pop" una sola vegada. */
  pulseKey?: string | number
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)))
  // Mostrem el +N/−N (i fem "pop" al número) NOMÉS quan arriba un torn nou (canvi de `pulseKey`)
  // amb una variació no nul·la. El primer render no compta.
  const prevKeyRef = useRef(pulseKey)
  const [shown, setShown] = useState<number | null>(null)
  const delta_ = delta == null ? null : Math.round(delta)
  useEffect(() => {
    if (pulseKey === prevKeyRef.current) return
    prevKeyRef.current = pulseKey
    // Sense variació en aquesta stat aquest torn: no fem "pop" (un pop anterior ja s'esvaeix sol).
    if (delta_ == null || delta_ === 0) return
    // setState diferit (no síncron dins de l'efecte): evita la cascada de renders.
    const show = setTimeout(() => setShown(delta_), 0)
    const hide = setTimeout(() => setShown(null), 1100)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
  }, [pulseKey, delta_])

  const r = (size - 6) / 2
  const c = 2 * Math.PI * r
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      title={label}
      aria-label={label ? `${label}: ${v}` : undefined}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="3.5"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={statRampHex(v)}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v / 100)}
          style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(.22,1,.36,1)' }}
        />
      </svg>
      <span className="absolute flex flex-col items-center leading-none">
        <span className="text-inksoft" aria-hidden>
          {icon}
        </span>
        <span
          key={v}
          className={`mt-0.5 text-[10px] font-bold tabular-nums text-ink ${
            shown != null && shown !== 0 ? 'animate-stat-pop' : ''
          }`}
        >
          {v}
        </span>
      </span>
      {shown != null && shown !== 0 && (
        <span
          className={`pointer-events-none absolute -top-0.5 left-1/2 animate-stat-delta text-[10px] font-black tabular-nums ${
            shown > 0 ? 'text-money' : 'text-danger'
          }`}
        >
          {shown > 0 ? `+${shown}` : shown}
        </span>
      )}
    </span>
  )
}
