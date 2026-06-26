import { dataActual, edatAnys } from '../domain/time'
import { useT } from '../i18n'
import { useCoachmark } from '../state/tutorial'
import { formatEuros } from '../lib/format'
import { SalutAvis, StatRings } from './StatRings'

/**
 * HUD superior compacte de joc (fix a dalt del shell): els 4 stats vitals com a anells
 * (benestar, salut, acadèmic, vincles), patrimoni net destacat, edat/data i generació.
 * Avisa quan la salut és perillosament baixa.
 */
export function GameHud({
  nom,
  subtitol,
  benestar,
  salut,
  academic = 0,
  vincles = 0,
  net,
  edatMesos,
  dataNaixement,
  generacio = 1,
  fills = 0,
  onBack,
}: {
  nom?: string
  subtitol: string
  benestar: number
  salut: number
  academic?: number
  vincles?: number
  net: number
  edatMesos: number
  dataNaixement?: string
  generacio?: number
  fills?: number
  onBack: () => void
}) {
  const { t } = useT()
  const anys = edatAnys(edatMesos)
  const dt = dataNaixement ? dataActual(dataNaixement, edatMesos) : null
  const dinersRef = useCoachmark<HTMLDivElement>('diners')

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
          <div className="truncate text-[11px] text-inkfaint">
            {subtitol}
            {fills > 0 && ` · 👶 ${fills}`}
          </div>
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
        <StatRings benestar={benestar} salut={salut} academic={academic} vincles={vincles} />
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

      <SalutAvis salut={salut} />
    </header>
  )
}
