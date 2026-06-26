import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { I18nProvider } from './i18n'
import { GameProvider } from './state/GameContext'
import { TutorialProvider } from './state/tutorial'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <GameProvider>
        <TutorialProvider>
          <div className="min-h-full text-ink">
            <App />
          </div>
        </TutorialProvider>
      </GameProvider>
    </I18nProvider>
  </StrictMode>,
)
