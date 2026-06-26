import type { VidaSnapshot } from '../domain/types'
import { useT } from '../i18n'
import { formatEurosCompact } from '../lib/format'

const W = 320
const H = 140
const PAD = 26
// Marge esquerre més ample per a les etiquetes de l'eix Y (imports compactes, p. ex. "1,5 M €").
const PAD_L = 50

interface Serie {
  color: string
  label: string
  valor: (s: VidaSnapshot) => number
}

/** Gràfic de línies (SVG pur) amb una banda 0..(max) i una baseline opcional al zero. */
function LineChart({
  hist,
  series,
  min,
  max,
  fmt,
  title,
}: {
  hist: VidaSnapshot[]
  series: Serie[]
  min: number
  max: number
  fmt: (v: number) => string
  title: string
}) {
  const rang = max - min || 1
  const x = (i: number) => PAD_L + (i / (hist.length - 1)) * (W - PAD_L - PAD)
  const y = (v: number) => H - PAD - ((v - min) / rang) * (H - 2 * PAD)
  const linia = (serie: Serie) =>
    hist.map((s, i) => `${x(i).toFixed(1)},${y(serie.valor(s)).toFixed(1)}`).join(' ')
  const edatMin = hist[0].edat
  const edatMax = hist[hist.length - 1].edat
  const zeroY = min < 0 && max > 0 ? y(0) : null

  return (
    <div className="rounded-2xl bg-surface/80 p-4 ring-1 ring-line/60">
      <h3 className="mb-2 text-sm font-semibold text-inksoft">{title}</h3>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={title}>
        <line x1={PAD_L} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#475569" strokeWidth="1" />
        <line x1={PAD_L} y1={PAD} x2={PAD_L} y2={H - PAD} stroke="#475569" strokeWidth="1" />
        {zeroY !== null && (
          <line
            x1={PAD_L}
            y1={zeroY}
            x2={W - PAD}
            y2={zeroY}
            stroke="#64748b"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}
        <text x={PAD_L - 5} y={PAD + 4} textAnchor="end" fontSize="8" fill="#94a3b8">
          {fmt(max)}
        </text>
        <text x={PAD_L - 5} y={H - PAD} textAnchor="end" fontSize="8" fill="#94a3b8">
          {fmt(min)}
        </text>
        <text x={x(0)} y={H - PAD + 12} textAnchor="middle" fontSize="8" fill="#94a3b8">
          {edatMin}
        </text>
        <text x={x(hist.length - 1)} y={H - PAD + 12} textAnchor="middle" fontSize="8" fill="#94a3b8">
          {edatMax}
        </text>
        {series.map((s) => (
          <polyline
            key={s.label}
            points={linia(s)}
            fill="none"
            stroke={s.color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {series.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-inksoft">
            <span className="inline-block h-2 w-3 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Els dos gràfics d'evolució de la vida que es mostren al resum final (mort). */
export function LifeCharts({ hist }: { hist: VidaSnapshot[] }) {
  const { t } = useT()
  if (!hist || hist.length < 2) return null

  const nets = hist.map((s) => s.net)
  const maxNet = Math.max(0, ...nets)
  const minNet = Math.min(0, ...nets)

  return (
    <div className="space-y-3">
      <LineChart
        hist={hist}
        title={t('chart.vida.title')}
        min={0}
        max={100}
        fmt={(v) => String(v)}
        series={[
          { color: '#22d39a', label: t('stat.benestar'), valor: (s) => s.benestar },
          { color: '#f6504f', label: t('stat.salut'), valor: (s) => s.salut },
        ]}
      />
      <LineChart
        hist={hist}
        title={t('chart.patrimoni.title')}
        min={minNet}
        max={maxNet}
        fmt={formatEurosCompact}
        series={[
          { color: '#f5c451', label: t('patrimoni.total'), valor: (s) => s.net },
        ]}
      />
    </div>
  )
}
