import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { nivellMoralitat } from '../domain/stats'
import { useT } from '../i18n'
import { useCoachmark } from '../state/tutorial'
import { StatRing } from './StatRing'

/** Nivell d'alerta de salut: cap / baixa (<25) / crítica (<10) / extrema (<1). */
export function salutAlerta(salut: number): 'none' | 'baixa' | 'critica' | 'extrema' {
  if (salut < 1) return 'extrema'
  if (salut < 10) return 'critica'
  if (salut < 25) return 'baixa'
  return 'none'
}

/** Icona moral segons la banda (Malvat 😈 / Neutral 😐 / Bo 😇). */
export function moralitatIcon(moralitat: number): string {
  const n = nivellMoralitat(moralitat)
  return n === 'bo' ? '😇' : n === 'malvat' ? '😈' : '😐'
}

type StatId = 'benestar' | 'salut' | 'moralitat' | 'academic' | 'vincles'

/**
 * Els stats vitals com a anells (icona + indicador circular), sempre visibles: benestar, salut,
 * moralitat, nivell acadèmic i vincles. La salut pulsa en vermell quan el risc de mort és alt.
 *
 * Cada anell és un BOTÓ: en tocar-lo (pensat per a mòbil, on no hi ha hover) s'obre una targeta
 * explicativa amb el nom, el valor i què significa la stat. Tornar a tocar-lo o tocar fora la tanca.
 * Així les ajudes són accessibles amb el dit, no només amb el ratolí (`title`). Cada anell registra
 * també el seu coachmark del tutorial.
 */
export function StatRings({
  benestar,
  salut,
  moralitat = 50,
  academic = 0,
  vincles = 0,
  size = 38,
}: {
  benestar: number
  salut: number
  moralitat?: number
  academic?: number
  vincles?: number
  size?: number
}) {
  const { t } = useT()
  const benestarRef = useCoachmark<HTMLButtonElement>('benestar')
  const salutRef = useCoachmark<HTMLButtonElement>('salut')
  const moralitatRef = useCoachmark<HTMLButtonElement>('moralitat')
  // Acadèmic i vincles són sempre visibles, però el tutorial només surt quan ja són rellevants.
  const academicRef = useCoachmark<HTMLButtonElement>('academic', academic > 0)
  const vinclesRef = useCoachmark<HTMLButtonElement>('vincles', vincles > 0)
  const alerta = salutAlerta(salut)

  // Quin stat té la targeta d'ajuda oberta (null = cap). Tocar a fora la tanca.
  const [obert, setObert] = useState<StatId | null>(null)
  const arrelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!obert) return
    const fora = (e: PointerEvent) => {
      if (!arrelRef.current?.contains(e.target as Node)) setObert(null)
    }
    document.addEventListener('pointerdown', fora)
    return () => document.removeEventListener('pointerdown', fora)
  }, [obert])

  const moralBanda = nivellMoralitat(moralitat)
  const rings: {
    id: StatId
    icon: string
    valor: number
    valorText: string
    ref: RefObject<HTMLButtonElement | null>
    wrapClass?: string
  }[] = [
    {
      id: 'benestar',
      icon: '🙂',
      valor: benestar,
      valorText: `${Math.round(benestar)}/100`,
      ref: benestarRef,
    },
    {
      id: 'salut',
      icon: '❤️',
      valor: salut,
      valorText: `${Math.round(salut)}/100`,
      ref: salutRef,
      wrapClass: alerta !== 'none' ? `salut-alerta-${alerta}` : undefined,
    },
    {
      id: 'moralitat',
      icon: moralitatIcon(moralitat),
      valor: moralitat,
      valorText: `${t(`moralitat.banda.${moralBanda}`)} · ${Math.round(moralitat)}/100`,
      ref: moralitatRef,
    },
    {
      id: 'academic',
      icon: '🎓',
      valor: academic * 100,
      valorText: `${Math.round(academic * 100)}%`,
      ref: academicRef,
    },
    {
      id: 'vincles',
      icon: '🤝',
      valor: vincles * 100,
      valorText: `${Math.round(vincles * 100)}%`,
      ref: vinclesRef,
    },
  ]

  const seleccionat = rings.find((r) => r.id === obert)

  return (
    <div ref={arrelRef} className="relative">
      <div className="flex items-center gap-2">
        {rings.map((r) => (
          <button
            key={r.id}
            ref={r.ref}
            type="button"
            onClick={() => setObert((prev) => (prev === r.id ? null : r.id))}
            aria-label={`${t(`stat.${r.id}`)}: ${r.valorText}`}
            aria-expanded={obert === r.id}
            className={`rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-accent/60 ${
              obert === r.id ? 'ring-2 ring-accent/50' : ''
            } ${r.wrapClass ?? ''}`}
          >
            <StatRing value={r.valor} icon={r.icon} size={size} label={t(`stat.${r.id}`)} />
          </button>
        ))}
      </div>

      {seleccionat && (
        <div
          role="status"
          className="absolute left-0 right-0 top-full z-50 mt-2 animate-card-in rounded-xl border border-line/70 bg-bg2/95 p-3 text-left shadow-xl backdrop-blur-xl"
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
              <span aria-hidden>{seleccionat.icon}</span>
              {t(`stat.${seleccionat.id}`)}
            </span>
            <span className="text-xs font-semibold tabular-nums text-inksoft">
              {seleccionat.valorText}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-inksoft">
            {t(`stat.${seleccionat.id}.tip`)}
          </p>
        </div>
      )}
    </div>
  )
}

/** Banner d'avís de mort imminent (escalat) quan la salut és molt baixa. */
export function SalutAvis({ salut }: { salut: number }) {
  const { t } = useT()
  const alerta = salutAlerta(salut)
  if (alerta === 'none') return null
  // Un SOL banner segons el nivell (baixa | crítica | extrema), mai dos alhora. Fons OPAC perquè
  // mai s'hi vegi a través cap altre avís de sota (HUD translúcid) ni quedi superposat. La `key`
  // força React a substituir el node en canviar de nivell (no reaprofitar el de "salut baixa").
  const estil =
    alerta === 'baixa'
      ? 'bg-[#2a1416] text-danger ring-danger/30'
      : 'bg-[#3a1012] text-danger ring-danger/60 animate-pulse'
  return (
    <div
      key={alerta}
      className={`mx-auto mt-2 flex max-w-md items-center justify-center gap-1.5 rounded-lg px-3 py-1 text-center text-[11px] font-bold uppercase tracking-wide ring-1 ${estil}`}
    >
      ⚠️ {t(`salut.perill.${alerta}`)}
    </div>
  )
}
