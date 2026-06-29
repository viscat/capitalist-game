import { dataActual, edatAnys } from '../domain/time'
import type { EventEffect } from '../domain/types'
import { useT } from '../i18n'
import { useCoachmark } from '../state/tutorial'
import { formatEurosCompact } from '../lib/format'
import { useCountUp } from '../lib/useCountUp'
import { Baby, Banknote, HeartHandshake, Home, Icon } from './icons'
import { SalutAvis, StatRings } from './StatRings'
import { SoundToggle } from './SoundToggle'
import { Tip } from './Tip'

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
  moralitat = 50,
  academic = 0,
  vincles = 0,
  net,
  liquid,
  immobiliari = 0,
  edatMesos,
  dataNaixement,
  generacio = 1,
  fills = 0,
  parella = false,
  onBack,
  onDetalls,
  efecte,
  efecteKey,
}: {
  nom?: string
  subtitol: string
  benestar: number
  salut: number
  moralitat?: number
  academic?: number
  vincles?: number
  /** Efecte aplicat pel darrer esdeveniment (per al "+N/−N" dels anells; coincideix amb l'historial). */
  efecte?: EventEffect | null
  efecteKey?: string | number
  net: number
  /** Patrimoni LÍQUID (efectiu + inversions − deute de consum): el que pots gastar de debò. */
  liquid: number
  /** Patrimoni IMMOBILIARI net (cases − hipoteca): no és diner disponible (s'aprecia tot sol). */
  immobiliari?: number
  edatMesos: number
  dataNaixement?: string
  generacio?: number
  fills?: number
  parella?: boolean
  onBack: () => void
  /** Obre el calaix de detall (patrimoni + historial). */
  onDetalls?: () => void
}) {
  const { t } = useT()
  const anys = edatAnys(edatMesos)
  const dt = dataNaixement ? dataActual(dataNaixement, edatMesos) : null
  const dinersRef = useCoachmark<HTMLButtonElement>('diners')
  // El patrimoni net s'anima cap al nou valor (no salta): en un joc de diners, veure la xifra
  // MOURE'S és part de la sensació. La clau `anys` re-dispara el "pop" de l'edat cada any.
  const netAnimat = useCountUp(net)

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
          <div className="flex items-center gap-1 truncate text-[11px] text-inkfaint">
            <span className="truncate">{subtitol}</span>
            {parella && <Icon icon={HeartHandshake} size={12} className="shrink-0" />}
            {fills > 0 && (
              <span className="flex shrink-0 items-center gap-0.5">
                <Icon icon={Baby} size={12} /> {fills}
              </span>
            )}
          </div>
        </div>
        {generacio > 1 && (
          <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent2 ring-1 ring-accent/30">
            {t('game.generacio', { n: generacio })}
          </span>
        )}
        {/* So/música: sempre accessible des del HUD (per defecte OFF; en activar-lo sona una confirmació). */}
        <SoundToggle className="shrink-0" />
        <div className="shrink-0 text-right">
          <div key={anys} className="animate-stat-pop text-sm font-bold tabular-nums text-ink">
            {t('game.age', { anys })}
          </div>
          {dt && (
            // Salts anuals: només l'any de calendari (el mes no té sentit).
            <div key={dt.any} className="text-[10px] text-inkfaint">
              {dt.any}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto mt-2 flex max-w-md items-center gap-3">
        <StatRings
          benestar={benestar}
          salut={salut}
          moralitat={moralitat}
          academic={academic}
          vincles={vincles}
          efecte={efecte}
          efecteKey={efecteKey}
        />
        <button
          ref={dinersRef}
          type="button"
          onClick={onDetalls}
          disabled={!onDetalls}
          aria-label={t('patrimoni.veure.detall')}
          className="ml-auto rounded-lg px-2 py-1 text-right transition enabled:hover:bg-bg/40 disabled:cursor-default"
        >
          <div
            className={`text-lg font-black tabular-nums ${net < 0 ? 'text-danger' : 'text-money'}`}
          >
            {formatEurosCompact(Math.round(netAnimat))}
          </div>
          <div className="flex justify-end text-[9px] uppercase tracking-wider text-inkfaint">
            <Tip text={t('patrimoni.total.tip')} align="right">
              {t('patrimoni.total')}
            </Tip>
          </div>
          {immobiliari > 0 && (
            // Desdoblament: el net inclou la casa, que s'aprecia sola. Separa el LÍQUID
            // (el que pots gastar) de l'IMMOBILIARI perquè no sembli que tens més diners.
            <div className="mt-0.5 flex justify-end gap-2 text-[10px] tabular-nums text-inkfaint">
              <span title={t('patrimoni.liquid')} className="flex items-center gap-0.5">
                <Icon icon={Banknote} size={12} /> {formatEurosCompact(liquid)}
              </span>
              <span title={t('patrimoni.immobiliari')} className="flex items-center gap-0.5">
                <Icon icon={Home} size={12} /> {formatEurosCompact(immobiliari)}
              </span>
            </div>
          )}
        </button>
      </div>

      <SalutAvis salut={salut} />
    </header>
  )
}
