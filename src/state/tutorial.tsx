import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode, RefObject } from 'react'
import { useT } from '../i18n'

// Mode TUTORIAL/DEMO: el primer cop que un element rellevant apareix a pantalla, es mostra
// un coachmark (spotlight + popover) que explica què és i com afecta. Un element vist no
// torna a sortir. Es recorda a localStorage (clau pròpia, independent del save del joc).

const TUTORIAL_KEY = 'capitalist-game/tutorial/v1'

/**
 * Ordre de PRIORITAT dels coachmarks: si n'apareixen diversos de nous alhora, es mostren un
 * a un en aquest ordre. Cada id té `tutorial.<id>.title` i `.body` a l'i18n.
 */
export const TUTORIAL_ORDER = [
  'benestar',
  'salut',
  'diners',
  'event_result',
  'event_choice',
  'milestone',
  'accions',
  'pressupost',
  'pla_inversio',
  'cerca_feina',
  'habitatge',
  'vincles',
  'academic',
  'fills',
  'deute',
  'sequela',
  'jubilacio',
  'dinastia',
] as const

export type CoachId = (typeof TUTORIAL_ORDER)[number]

function loadSeen(): Record<string, true> {
  try {
    const raw = localStorage.getItem(TUTORIAL_KEY)
    return raw ? (JSON.parse(raw) as Record<string, true>) : {}
  } catch {
    return {}
  }
}

interface TutorialCtx {
  enabled: boolean
  seen: Record<string, true>
  register: (id: CoachId, ref: RefObject<HTMLElement | null>) => void
  unregister: (id: CoachId) => void
  active: CoachId | null
  refs: RefObject<Map<CoachId, RefObject<HTMLElement | null>>>
  markSeen: (id: CoachId) => void
  skipAll: () => void
  resetTutorial: () => void
}

const Ctx = createContext<TutorialCtx | null>(null)

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [seen, setSeen] = useState<Record<string, true>>(() => loadSeen())
  const [enabled, setEnabled] = useState(true)
  // Ids actualment muntats a pantalla (estat, per derivar-ne l'actiu sense llegir refs al render).
  const [registered, setRegistered] = useState<Record<string, true>>({})
  const refs = useRef<Map<CoachId, RefObject<HTMLElement | null>>>(new Map())

  const register = useCallback((id: CoachId, ref: RefObject<HTMLElement | null>) => {
    refs.current.set(id, ref)
    setRegistered((r) => (r[id] ? r : { ...r, [id]: true }))
  }, [])
  const unregister = useCallback((id: CoachId) => {
    refs.current.delete(id)
    setRegistered((r) => {
      if (!r[id]) return r
      const next = { ...r }
      delete next[id]
      return next
    })
  }, [])

  // L'actiu: el primer id (per prioritat) muntat i no vist.
  const active = useMemo<CoachId | null>(() => {
    if (!enabled) return null
    for (const id of TUTORIAL_ORDER) {
      if (registered[id] && !seen[id]) return id
    }
    return null
  }, [enabled, registered, seen])

  const markSeen = useCallback((id: CoachId) => {
    const next: Record<string, true> = { ...loadSeen(), [id]: true }
    setSeen(next)
    try {
      localStorage.setItem(TUTORIAL_KEY, JSON.stringify(next))
    } catch {
      /* sense persistència: continuem */
    }
  }, [])
  const skipAll = useCallback(() => setEnabled(false), [])
  const resetTutorial = useCallback(() => {
    try {
      localStorage.removeItem(TUTORIAL_KEY)
    } catch {
      /* ignore */
    }
    setSeen({})
    setEnabled(true)
  }, [])

  const value = useMemo<TutorialCtx>(
    () => ({
      enabled,
      seen,
      register,
      unregister,
      active,
      refs,
      markSeen,
      skipAll,
      resetTutorial,
    }),
    [enabled, seen, register, unregister, active, markSeen, skipAll, resetTutorial],
  )

  return (
    <Ctx.Provider value={value}>
      {children}
      <CoachmarkOverlay />
    </Ctx.Provider>
  )
}

export function useTutorial(): TutorialCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTutorial dins de TutorialProvider')
  return ctx
}

/**
 * Marca un element perquè, el primer cop que es mostri, s'hi mostri el coachmark. Retorna un
 * ref per posar a l'element a ressaltar. Sense efecte si ja s'ha vist o el tutorial està off.
 */
export function useCoachmark<T extends HTMLElement = HTMLElement>(
  id: CoachId,
): RefObject<T | null> {
  const ctx = useContext(Ctx)
  const ref = useRef<T | null>(null)
  const seen = ctx?.seen[id]
  const enabled = ctx?.enabled
  const register = ctx?.register
  const unregister = ctx?.unregister
  useEffect(() => {
    if (!register || !unregister || seen || !enabled) return
    register(id, ref)
    return () => unregister(id)
  }, [register, unregister, id, seen, enabled])
  return ref
}

function CoachmarkOverlay() {
  const { active, refs, markSeen, skipAll } = useTutorial()
  const { t } = useT()
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (!active) return
    const el = refs.current.get(active)?.current
    if (!el) {
      markSeen(active) // element no mesurable: el saltem (defensiu)
      return
    }
    // Mesura en el següent frame (post-layout), evitant setState síncron dins de l'effect.
    const raf = requestAnimationFrame(() => setRect(el.getBoundingClientRect()))
    return () => cancelAnimationFrame(raf)
  }, [active, refs, markSeen])

  // Quan no hi ha coachmark actiu, no es mostra res (el rect antic s'ignora).

  if (!active || !rect) return null

  const vh = window.innerHeight
  const placeBelow = rect.bottom < vh * 0.55
  const popTop = placeBelow ? rect.bottom + 14 : undefined
  const popBottom = placeBelow ? undefined : vh - rect.top + 14
  const left = Math.max(12, Math.min(rect.left, window.innerWidth - 12 - 320))

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
      <div
        className="pointer-events-none absolute rounded-2xl"
        style={{
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
          animation: 'spot-breathe 2s ease-in-out infinite',
        }}
      />
      <div
        className="absolute w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl bg-surface/95 p-4 shadow-card ring-1 ring-accent/40 backdrop-blur-xl animate-card-in"
        style={{ top: popTop, bottom: popBottom, left }}
      >
        <h3 className="text-base font-bold text-ink">{t(`tutorial.${active}.title`)}</h3>
        <p className="mt-1 text-sm leading-relaxed text-inksoft">
          {t(`tutorial.${active}.body`)}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={skipAll}
            className="text-xs font-medium text-inkfaint transition hover:text-inksoft"
          >
            {t('coach.skip')}
          </button>
          <button onClick={() => markSeen(active)} className="btn-game w-auto px-5 py-2 text-sm">
            {t('coach.next')}
          </button>
        </div>
      </div>
    </div>
  )
}
