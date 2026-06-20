import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { I18nProvider } from './i18n'
import { GameProvider } from './state/GameContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <GameProvider>
        <div className="min-h-full bg-slate-900 text-slate-100">
          <App />
        </div>
      </GameProvider>
    </I18nProvider>
  </StrictMode>,
)
