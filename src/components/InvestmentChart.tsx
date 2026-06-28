import type { PatrimoniSnapshot } from '../domain/types'
import { useT } from '../i18n'
import { formatEurosCompact } from '../lib/format'

const W = 320
const H = 150
const PAD = 26
// Marge esquerre ample per a l'etiqueta de l'eix Y (import compacte sense tallar-se).
const PAD_L = 50

// Dues sèries: el que has APORTAT (de la teva butxaca) i el VALOR actual de la cartera
// (ja amb els rendiments). La distància entre les dues és el que ha crescut (o encongit)
// la inversió pel rendiment compost.
type Punt = { edat: number; aportat: number; valor: number }
const SERIES: { key: 'valor' | 'aportat'; color: string; labelKey: string }[] = [
  { key: 'valor', color: '#34d399', labelKey: 'chart.valor' },
  { key: 'aportat', color: '#94a3b8', labelKey: 'chart.aportat' },
]

/**
 * Gràfic de línies (SVG pur, sense dependències) de l'evolució de les inversions al llarg
 * de la carrera. Compara el que has aportat amb el valor actual de la cartera, fent visible
 * l'interès compost (i els sotracs del fons indexat).
 */
export function InvestmentChart({ hist }: { hist: PatrimoniSnapshot[] }) {
  const { t } = useT()
  if (hist.length < 2) return null

  const punts: Punt[] = hist.map((s) => ({
    edat: s.edat,
    aportat: s.aportat,
    valor: s.inversions,
  }))

  const maxVal = Math.max(1, ...punts.flatMap((p) => [p.aportat, p.valor]))
  const x = (i: number) => PAD_L + (i / (punts.length - 1)) * (W - PAD_L - PAD)
  const y = (v: number) => H - PAD - (v / maxVal) * (H - 2 * PAD)

  const linia = (key: 'valor' | 'aportat') =>
    punts.map((p, i) => `${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ')

  const edatMin = punts[0].edat
  const edatMax = punts[punts.length - 1].edat

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
        <line x1={PAD_L} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#475569" strokeWidth="1" />
        <line x1={PAD_L} y1={PAD} x2={PAD_L} y2={H - PAD} stroke="#475569" strokeWidth="1" />
        {/* Etiqueta del valor màxim */}
        <text x={PAD_L - 5} y={PAD + 4} textAnchor="end" fontSize="8" fill="#94a3b8">
          {formatEurosCompact(maxVal)}
        </text>
        <text x={PAD_L - 5} y={H - PAD} textAnchor="end" fontSize="8" fill="#94a3b8">
          0
        </text>
        {/* Edats (extrems) */}
        <text x={x(0)} y={H - PAD + 12} textAnchor="middle" fontSize="8" fill="#94a3b8">
          {edatMin}
        </text>
        <text x={x(punts.length - 1)} y={H - PAD + 12} textAnchor="middle" fontSize="8" fill="#94a3b8">
          {edatMax}
        </text>
        {/* Sèries */}
        {SERIES.map((s) => (
          <polyline
            key={s.key}
            points={linia(s.key)}
            fill="none"
            stroke={s.color}
            strokeWidth="2"
            strokeDasharray={s.key === 'aportat' ? '4 3' : undefined}
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
