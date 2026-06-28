import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * Ajuda contextual MÒBIL: un petit botó «ⓘ» al costat d'una etiqueta que, en tocar-lo, obre una
 * targeta amb l'explicació. A diferència de l'atribut `title` (que només surt amb el ratolí), és
 * accessible amb el dit. Tornar a tocar-lo o tocar fora la tanca.
 */
export function Tip({
  text,
  children,
  align = 'left',
}: {
  text: string
  children: ReactNode
  /** Cap a quina vora s'alinea la targeta (per a elements arran de vora dreta). */
  align?: 'left' | 'right'
}) {
  const [obert, setObert] = useState(false)
  const arrelRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!obert) return
    const fora = (e: PointerEvent) => {
      if (!arrelRef.current?.contains(e.target as Node)) setObert(false)
    }
    document.addEventListener('pointerdown', fora)
    return () => document.removeEventListener('pointerdown', fora)
  }, [obert])

  return (
    <span ref={arrelRef} className="relative inline-flex items-center gap-1">
      {children}
      <button
        type="button"
        onClick={() => setObert((v) => !v)}
        aria-label={obert ? 'Amaga l’ajuda' : 'Mostra l’ajuda'}
        aria-expanded={obert}
        className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold leading-none ring-1 transition ${
          obert
            ? 'bg-accent/30 text-ink ring-accent/50'
            : 'bg-slate-700/70 text-slate-300 ring-slate-600 hover:bg-slate-600'
        }`}
      >
        i
      </button>
      {obert && (
        <span
          role="status"
          className={`absolute top-full z-50 mt-1 w-56 animate-card-in rounded-lg border border-line/70 bg-bg2/95 p-2.5 text-left text-xs font-normal leading-relaxed text-inksoft shadow-xl backdrop-blur-xl ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {text}
        </span>
      )}
    </span>
  )
}
