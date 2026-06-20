import { useEffect, useState } from 'react'
import { dataActual, edatAnys } from '../domain/time'
import { useT } from '../i18n'
import { benestarColor, formatEuros } from '../lib/format'

/** Barra fixa i compacta que apareix en fer scroll (pensada per a mòbil). */
export function SummaryBar({
  nom,
  benestar,
  efectiu,
  edatMesos,
  dataNaixement,
}: {
  nom?: string
  benestar: number
  efectiu: number
  edatMesos: number
  dataNaixement?: string
}) {
  const { t } = useT()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 96)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const b = Math.round(benestar)
  const anys = edatAnys(edatMesos)
  const dt = dataNaixement ? dataActual(dataNaixement, edatMesos) : null

  return (
    <div
      className={`fixed inset-x-0 top-0 z-50 border-b border-slate-700/60 bg-slate-900/90 backdrop-blur transition-transform duration-200 ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2 text-sm">
        {nom && (
          <span className="truncate font-semibold text-slate-100">{nom}</span>
        )}
        <span className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${benestarColor(b)}`} />
          <span className="text-slate-300">{b}</span>
        </span>
        <span className="text-emerald-300">{formatEuros(efectiu)}</span>
        <span className="ml-auto text-slate-400">
          {t('game.age', { anys })}
          {dt && ` · ${t(`mes.${dt.mesIndex}`)} ${dt.any}`}
        </span>
      </div>
    </div>
  )
}
