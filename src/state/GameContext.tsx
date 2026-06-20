import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { advanceTurn, applyChoice, newGame } from '../domain/engine'
import type { FamilyClass, GameState } from '../domain/types'

const STORAGE_KEY = 'capitalist-game/save/v1'

function loadSave(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as GameState) : null
  } catch {
    return null
  }
}

interface GameContextValue {
  state: GameState | null
  hasSave: boolean
  startGame: (preset: FamilyClass) => void
  continueGame: () => void
  nextTurn: () => void
  choose: (choiceId: string) => void
  reset: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState | null>(null)
  const [hasSave, setHasSave] = useState<boolean>(() => loadSave() !== null)

  // Autosave: la lògica del joc és pura, així que persistim l'estat sencer.
  useEffect(() => {
    if (!state) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      setHasSave(true)
    } catch {
      /* emmagatzematge no disponible: continuem sense desar */
    }
  }, [state])

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      hasSave,
      startGame: (preset) => setState(newGame(preset)),
      continueGame: () => setState(loadSave()),
      nextTurn: () => setState((s) => (s ? advanceTurn(s) : s)),
      choose: (choiceId) => setState((s) => (s ? applyChoice(s, choiceId) : s)),
      reset: () => {
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch {
          /* ignore */
        }
        setHasSave(false)
        setState(null)
      },
    }),
    [state, hasSave],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame s’ha d’utilitzar dins d’un GameProvider')
  return ctx
}
