import { useState } from 'react'
import { FamilySelect } from './components/FamilySelect'
import { GameOver } from './components/GameOver'
import { GameScreen } from './components/GameScreen'
import { MilestoneScreen } from './components/MilestoneScreen'
import { StartScreen } from './components/StartScreen'
import { useGame } from './state/GameContext'

export default function App() {
  const { state } = useGame()
  const [familyMode, setFamilyMode] = useState<null | 'normal' | 'at16'>(null)

  if (state) {
    if (state.acabat) return <GameOver />
    if (state.pendingMilestone) return <MilestoneScreen />
    return <GameScreen />
  }

  if (familyMode) {
    return (
      <FamilySelect mode={familyMode} onBack={() => setFamilyMode(null)} />
    )
  }
  return (
    <StartScreen
      onNew={() => setFamilyMode('normal')}
      onNewAt16={() => setFamilyMode('at16')}
    />
  )
}
