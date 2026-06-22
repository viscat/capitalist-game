import { dataActual, edatAnys } from '../domain/time'
import { useT } from '../i18n'
import { benestarColor, formatEuros } from '../lib/format'

/**
 * HUD persistent (sticky) amb les constants vitals de la partida: sempre visible, tant a
 * mòbil (on l'acció va primer i el detall queda més avall) com a escriptori. Mostra
 * benestar, patrimoni net i edat/data.
 */
export function SummaryBar({
  nom,
  benestar,
  net,
  edatMesos,
  dataNaixement,
}: {
  nom?: string
  benestar: number
  /** Patrimoni net (pot ser negatiu si hi ha deute). */
  net: number
  edatMesos: number
  dataNaixement?: string
}) {
  const { t } = useT()
  const b = Math.round(benestar)
  const anys = edatAnys(edatMesos)
  const dt = dataNaixement ? dataActual(dataNaixement, edatMesos) : null

  return (
    <div className="sticky top-0 z-50 -mx-4 mb-4 border-b border-slate-700/60 bg-slate-900/90 px-4 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center gap-3 py-2 text-sm">
        {nom && (
          <span className="hidden truncate font-semibold text-slate-100 sm:inline">
            {nom}
          </span>
        )}
        <span className="flex items-center gap-1.5" title={t('stat.benestar')}>
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${benestarColor(b)}`} />
          <span className="font-medium text-slate-200">{b}</span>
        </span>
        <span
          className={`font-medium tabular-nums ${net < 0 ? 'text-red-400' : 'text-emerald-300'}`}
          title={t('patrimoni.total')}
        >
          {formatEuros(net)}
        </span>
        <span className="ml-auto whitespace-nowrap text-slate-400">
          {t('game.age', { anys })}
          {dt && <span className="hidden sm:inline"> · {t(`mes.${dt.mesIndex}`)} {dt.any}</span>}
        </span>
      </div>
    </div>
  )
}
