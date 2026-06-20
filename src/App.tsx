import { useState } from 'react'
import { FamilySelect } from './components/FamilySelect'
import { GameOver } from './components/GameOver'
import { GameScreen } from './components/GameScreen'
import { StartScreen } from './components/StartScreen'
import { useGame } from './state/GameContext'

export default function App() {
  const { state } = useGame()
  const [showFamily, setShowFamily] = useState(false)

  if (state) {
    return state.acabat ? <GameOver /> : <GameScreen />
  }

  return showFamily ? (
    <FamilySelect onBack={() => setShowFamily(false)} />
  ) : (
    <StartScreen onNew={() => setShowFamily(true)} />
  )
}
