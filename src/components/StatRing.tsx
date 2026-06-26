/** Color d'un anell d'estat (0..100), amb els mateixos llindars que `benestarColor`. */
function ringHex(v: number): string {
  if (v < 20) return '#f6504f'
  if (v < 40) return '#f97316'
  if (v < 60) return '#eab308'
  if (v < 80) return '#84cc16'
  return '#22d39a'
}

/** Mini-anell de progrés (SVG, sense dependències) per a stats 0..100 amb icona al centre. */
export function StatRing({
  value,
  icon,
  size = 44,
  label,
}: {
  value: number
  icon: string
  size?: number
  label?: string
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)))
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
          stroke={ringHex(v)}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v / 100)}
          style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(.22,1,.36,1)' }}
        />
      </svg>
      <span className="absolute flex flex-col items-center leading-none">
        <span className="text-[13px]" aria-hidden>
          {icon}
        </span>
        <span className="mt-0.5 text-[10px] font-bold tabular-nums text-ink">{v}</span>
      </span>
    </span>
  )
}
