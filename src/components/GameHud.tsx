import { dataActual, edatAnys } from '../domain/time'
import { useT } from '../i18n'
import { useCoachmark } from '../state/tutorial'
import { formatEuros } from '../lib/format'
import { StatRing } from './StatRing'

/**
 * HUD superior compacte de joc (fix a dalt del shell): anells de benestar i salut, patrimoni
 * net destacat, edat/data i generació. Cada stat clau registra un coachmark del tutorial.
 */
export function GameHud({
  nom,
  subtitol,
  benestar,
  salut,
  net,
  edatMesos,
  dataNaixement,
  generacio = 1,
  vincles = 0,
  fills = 0,
  onBack,
}: {
  nom?: string
  subtitol: string
  benestar: number
  salut: number
  net: number
  edatMesos: number
  dataNaixement?: string
  generacio?: number
  vincles?: number
  fills?: number
  onBack: () => void
}) {
  const { t } = useT()
  const anys = edatAnys(edatMesos)
  const dt = dataNaixement ? dataActual(dataNaixement, edatMesos) : null
  const benestarRef = useCoachmark<HTMLDivElement>('benestar')
  const salutRef = useCoachmark<HTMLDivElement>('salut')
  const dinersRef = useCoachmark<HTMLDivElement>('diners')
  const vinclesRef = useCoachmark<HTMLSpanElement>('vincles')
  const fillsRef = useCoachmark<HTMLSpanElement>('fills')

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg2/85 px-4 pt-2 pb-2.5 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center gap-1.5">
        <button
          onClick={onBack}
          aria-label={t('app.title')}
          className="-ml-1 shrink-0 rounded-lg px-1.5 py-1 text-inkfaint transition hover:text-inksoft"
        >
          ←
        </button>
        <div className="min-w-0 flex-1">
          {nom && <div className="truncate text-sm font-semibold text-ink">{nom}</div>}
          <div className="truncate text-[11px] text-inkfaint">{subtitol}</div>
        </div>
        {generacio > 1 && (
          <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent2 ring-1 ring-accent/30">
            {t('game.generacio', { n: generacio })}
          </span>
        )}
        <div className="shrink-0 text-right">
          <div className="text-sm font-bold tabular-nums text-ink">{t('game.age', { anys })}</div>
          {dt && (
            <div className="text-[10px] text-inkfaint">
              {t(`mes.${dt.mesIndex}`)} {dt.any}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto mt-2 flex max-w-md items-center gap-3">
        <div ref={benestarRef}>
          <StatRing value={benestar} icon="🙂" label={t('stat.benestar')} />
        </div>
        <div ref={salutRef}>
          <StatRing value={salut} icon="❤️" label={t('stat.salut')} />
        </div>
        <div ref={dinersRef} className="ml-auto text-right">
          <div
            className={`text-lg font-black tabular-nums ${net < 0 ? 'text-danger' : 'text-money'}`}
          >
            {formatEuros(net)}
          </div>
          <div className="text-[9px] uppercase tracking-wider text-inkfaint">
            {t('patrimoni.total')}
          </div>
        </div>
      </div>

      {(vincles > 0 || fills > 0) && (
        <div className="mx-auto mt-1.5 flex max-w-md items-center gap-2 text-[11px]">
          {vincles > 0 && (
            <span
              ref={vinclesRef}
              className="rounded-full bg-white/5 px-2 py-0.5 font-medium text-inksoft"
            >
              🤝 {Math.round(vincles * 100)}%
            </span>
          )}
          {fills > 0 && (
            <span
              ref={fillsRef}
              className="rounded-full bg-white/5 px-2 py-0.5 font-medium text-inksoft"
            >
              👶 {fills}
            </span>
          )}
        </div>
      )}
    </header>
  )
}
