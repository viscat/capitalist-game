import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  actionOptions,
  advanceTurn,
  applyChoice,
  applyMilestoneChoice,
  newGame,
  newGameAt16,
  newGameAtCarrera,
} from '../domain/engine'
import { comprarCasa, llogar, tornarAmbPares } from '../domain/housing'
import type { OpcioLloguer } from '../domain/housing'
import { avuiISO } from '../domain/time'
import type {
  ActionOption,
  Budget,
  FamilyClass,
  GameState,
  Identitat,
  NivellVida,
  PlaInversio,
} from '../domain/types'

// Versió de l'esquema desat. La fase adulta hi va afegir camps al patrimoni
// (fons indexat, pla de pensions): pugem la versió per no carregar partides velles.
const STORAGE_KEY = 'capitalist-game/save/v4'

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
  startGame: (preset: FamilyClass, identitat?: Identitat) => void
  /** Inici ràpid al fork dels 16 (proves manuals). */
  startGameAt16: (preset: FamilyClass, identitat?: Identitat) => void
  /** Inici ràpid a la fase de carrera als 22 (proves d'inversió). */
  startGameAtCarrera: (preset: FamilyClass, identitat?: Identitat) => void
  continueGame: () => void
  /** Avança un torn. A les fases d'estudi cal passar l'`actionId` triat. */
  nextTurn: (actionId?: string) => void
  choose: (choiceId: string) => void
  /** Aplica l'opció escollida en una fita (pantalla de decisió). */
  chooseMilestone: (optionId: string) => void
  /** Desa el pressupost mensual (fase laboral). */
  setBudget: (budget: Budget) => void
  /** Desa el pla d'inversió anual (fase de carrera). */
  setPla: (pla: PlaInversio) => void
  /** Tria el nivell de vida (cost del dia a dia) a la fase adulta. */
  setNivellVida: (nivell: NivellVida) => void
  /** Lloga una habitació o un pis. */
  llogar: (tipus: OpcioLloguer['tipus']) => void
  /** Compra un habitatge amb hipoteca (a `anys` anys). */
  comprarCasa: (propietatId: string, anys: number) => void
  /** Torna a viure amb els pares (deixa el lloguer). */
  tornarAmbPares: () => void
  reset: () => void
  actions: ActionOption[]
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState | null>(null)
  const [hasSave, setHasSave] = useState<boolean>(() => loadSave() !== null)

  // Autosave: la lògica del joc és pura, així que persistim l'estat sencer.
  // (`hasSave` només es consulta a la pantalla inicial, quan no hi ha partida
  // activa, així que no cal actualitzar-lo aquí.)
  useEffect(() => {
    if (!state) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* emmagatzematge no disponible: continuem sense desar */
    }
  }, [state])

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      hasSave,
      startGame: (preset, identitat) =>
        setState(newGame(preset, undefined, { dataNaixement: avuiISO(), identitat })),
      startGameAt16: (preset, identitat) =>
        setState(
          newGameAt16(preset, undefined, { dataNaixement: avuiISO(), identitat }),
        ),
      startGameAtCarrera: (preset, identitat) =>
        setState(
          newGameAtCarrera(preset, undefined, { dataNaixement: avuiISO(), identitat }),
        ),
      continueGame: () => setState(loadSave()),
      nextTurn: (actionId) =>
        setState((s) => (s ? advanceTurn(s, actionId) : s)),
      choose: (choiceId) => setState((s) => (s ? applyChoice(s, choiceId) : s)),
      chooseMilestone: (optionId) =>
        setState((s) => (s ? applyMilestoneChoice(s, optionId) : s)),
      setBudget: (budget) =>
        setState((s) => (s ? { ...s, pressupost: budget } : s)),
      setPla: (pla) => setState((s) => (s ? { ...s, plaInversio: pla } : s)),
      setNivellVida: (nivell) =>
        setState((s) => (s ? { ...s, nivellVida: nivell } : s)),
      llogar: (tipus) => setState((s) => (s ? llogar(s, tipus) : s)),
      comprarCasa: (propietatId, anys) =>
        setState((s) => (s ? comprarCasa(s, propietatId, anys) : s)),
      tornarAmbPares: () => setState((s) => (s ? tornarAmbPares(s) : s)),
      reset: () => {
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch {
          /* ignore */
        }
        setHasSave(false)
        setState(null)
      },
      actions: state ? actionOptions(state) : [],
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
