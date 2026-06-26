import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  acceptarOferta,
  actionOptions,
  advanceTurn,
  applyChoice,
  applyMilestoneChoice,
  continuaGeneracio,
  newGame,
  newGameAt16,
  newGameAtCarrera,
} from '../domain/engine'
import { comprarCasa, llogar, tornarAmbPares } from '../domain/housing'
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

// Versió de l'esquema desat. Pugem la versió quan canvia de manera incompatible:
// v5 unifica tots els torns a 1 any, així que les partides velles (amb edats no
// alineades a anys sencers) ja no es poden continuar sense quedar desquadrades.
// v6 afegeix la cerca de feina (camps nous a l'estat: ofertesFeina, anysExperiencia).
// v7 afegeix la stat de salut (Stats.salut) i la mort: partides velles no tindrien salut.
const STORAGE_KEY = 'capitalist-game/save/v9'

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
  /** Avança un torn. A les fases d'acció, passa-hi els `actionIds` triats (multiselecció). */
  nextTurn: (actionIds?: string[]) => void
  choose: (choiceId: string) => void
  /** Aplica l'opció escollida en una fita (pantalla de decisió). */
  chooseMilestone: (optionId: string) => void
  /** Desa el pressupost mensual (fase laboral). */
  setBudget: (budget: Budget) => void
  /** Desa el pla d'inversió anual (fase de carrera). */
  setPla: (pla: PlaInversio) => void
  /** Desa la selecció d'accions de l'adolescència (es recorda entre anys). */
  setAccionsSeleccio: (sel: Record<string, number>) => void
  /** Accepta una oferta de feina durant la cerca (fase de carrera a l'atur). */
  acceptarOferta: (ofertaId: string) => void
  /** Tria el nivell de vida (cost del dia a dia) a la fase adulta. */
  setNivellVida: (nivell: NivellVida) => void
  /** Activa/desactiva la «vida senzilla» (frugalitat per elecció: el mínim no penalitza). */
  setVidaSenzilla: (vidaSenzilla: boolean) => void
  /** Lloga una oferta concreta del mercat d'aquest any (per id). */
  llogar: (ofertaId: string) => void
  /** Compra un habitatge amb hipoteca (a `anys` anys). */
  comprarCasa: (propietatId: string, anys: number) => void
  /** Torna a viure amb els pares (deixa el lloguer). */
  tornarAmbPares: () => void
  /** En morir amb descendents: continua la dinastia amb un fill (nova generació). */
  continuarGeneracio: () => void
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
      nextTurn: (actionIds) =>
        setState((s) => (s ? advanceTurn(s, actionIds) : s)),
      choose: (choiceId) => setState((s) => (s ? applyChoice(s, choiceId) : s)),
      chooseMilestone: (optionId) =>
        setState((s) => (s ? applyMilestoneChoice(s, optionId) : s)),
      setBudget: (budget) =>
        setState((s) => (s ? { ...s, pressupost: budget } : s)),
      setPla: (pla) => setState((s) => (s ? { ...s, plaInversio: pla } : s)),
      setAccionsSeleccio: (sel) =>
        setState((s) => (s ? { ...s, accionsSeleccio: sel } : s)),
      acceptarOferta: (ofertaId) =>
        setState((s) => (s ? acceptarOferta(s, ofertaId) : s)),
      setNivellVida: (nivell) =>
        setState((s) => (s ? { ...s, nivellVida: nivell } : s)),
      setVidaSenzilla: (vidaSenzilla) =>
        setState((s) => (s ? { ...s, vidaSenzilla } : s)),
      llogar: (ofertaId) => setState((s) => (s ? llogar(s, ofertaId) : s)),
      comprarCasa: (propietatId, anys) =>
        setState((s) => (s ? comprarCasa(s, propietatId, anys) : s)),
      tornarAmbPares: () => setState((s) => (s ? tornarAmbPares(s) : s)),
      continuarGeneracio: () => setState((s) => (s ? continuaGeneracio(s) : s)),
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
