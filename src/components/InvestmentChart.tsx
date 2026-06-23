import type { PatrimoniSnapshot } from '../domain/types'
import { useT } from '../i18n'
import { formatEuros } from '../lib/format'

const W = 320
const H = 150
const PAD = 28

type SerieKey = 'fonsIndexat' | 'fonsPensions' | 'estalvi'
const SERIES: { key: SerieKey; color: string; labelKey: string }[] = [
  { key: 'fonsIndexat', color: '#34d399', labelKey: 'patrimoni.fonsIndexat' },
  { key: 'fonsPensions', color: '#38bdf8', labelKey: 'patrimoni.fonsPensions' },
  { key: 'estalvi', color: '#94a3b8', labelKey: 'patrimoni.estalvi' },
]

/**
 * Gràfic de línies (SVG pur, sense dependències) de l'evolució del patrimoni invertit al
 * llarg de la carrera: fons indexat, pla de pensions i estalvi. Fa visible l'interès
 * compost i la volatilitat del fons indexat.
 */
export function InvestmentChart({ hist }: { hist: PatrimoniSnapshot[] }) {
  const { t } = useT()
  if (hist.length < 2) return null

  const maxVal = Math.max(
    1,
    ...hist.flatMap((s) => [s.fonsIndexat, s.fonsPensions, s.estalvi]),
  )
  const x = (i: number) => PAD + (i / (hist.length - 1)) * (W - 2 * PAD)
  const y = (v: number) => H - PAD - (v / maxVal) * (H - 2 * PAD)

  const punts = (key: SerieKey) =>
    hist.map((s, i) => `${x(i).toFixed(1)},${y(s[key]).toFixed(1)}`).join(' ')

  const edatMin = hist[0].edat
  const edatMax = hist[hist.length - 1].edat

  return (
    <div className="rounded-2xl bg-slate-800/70 p-5 ring-1 ring-slate-700/50">
      <h3 className="mb-3 text-sm font-semibold text-slate-300">{t('chart.title')}</h3>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={t('chart.title')}
      >
        {/* Eixos */}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#475569" strokeWidth="1" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#475569" strokeWidth="1" />
        {/* Etiqueta del valor màxim */}
        <text x={PAD - 4} y={PAD + 4} textAnchor="end" fontSize="8" fill="#94a3b8">
          {formatEuros(maxVal)}
        </text>
        <text x={PAD - 4} y={H - PAD} textAnchor="end" fontSize="8" fill="#94a3b8">
          0
        </text>
        {/* Edats (extrems) */}
        <text x={PAD} y={H - PAD + 12} textAnchor="middle" fontSize="8" fill="#94a3b8">
          {edatMin}
        </text>
        <text x={W - PAD} y={H - PAD + 12} textAnchor="middle" fontSize="8" fill="#94a3b8">
          {edatMax}
        </text>
        {/* Sèries */}
        {SERIES.map((s) => (
          <polyline
            key={s.key}
            points={punts(s.key)}
            fill="none"
            stroke={s.color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
      </svg>
      {/* Llegenda */}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-slate-400">
            <span
              className="inline-block h-2 w-3 rounded-sm"
              style={{ backgroundColor: s.color }}
            />
            {t(s.labelKey)}
          </span>
        ))}
      </div>
    </div>
  )
}
