import { useState } from 'react'
import { CharacterCreation } from './components/CharacterCreation'
import { FamilySelect } from './components/FamilySelect'
import { GameOver } from './components/GameOver'
import { GameScreen } from './components/GameScreen'
import { MilestoneScreen } from './components/MilestoneScreen'
import { StartScreen } from './components/StartScreen'
import { useGame } from './state/GameContext'
import type { FamilyClass } from './domain/types'

type Setup = { mode: 'normal' | 'at16'; preset?: FamilyClass }

export default function App() {
  const { state } = useGame()
  const [setup, setSetup] = useState<Setup | null>(null)

  if (state) {
    if (state.acabat) return <GameOver />
    if (state.pendingMilestone) return <MilestoneScreen />
    return <GameScreen />
  }

  if (setup?.preset) {
    return (
      <CharacterCreation
        mode={setup.mode}
        preset={setup.preset}
        onBack={() => setSetup({ mode: setup.mode })}
      />
    )
  }
  if (setup) {
    return (
      <FamilySelect
        mode={setup.mode}
        onBack={() => setSetup(null)}
        onPick={(preset) => setSetup({ mode: setup.mode, preset })}
      />
    )
  }
  return (
    <StartScreen
      onNew={() => setSetup({ mode: 'normal' })}
      onNewAt16={() => setSetup({ mode: 'at16' })}
    />
  )
}
