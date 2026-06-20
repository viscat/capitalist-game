import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import App from './App'
import { I18nProvider } from './i18n'
import { GameProvider } from './state/GameContext'

function renderApp() {
  return render(
    <I18nProvider>
      <GameProvider>
        <App />
      </GameProvider>
    </I18nProvider>,
  )
}

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('flux de l’app', () => {
  it('va de l’inici a la selecció de família i a la partida', () => {
    renderApp()

    // Pantalla inicial
    fireEvent.click(screen.getByText('Nova partida'))

    // Selecció de família: triem la primera
    expect(screen.getByText('On naixeràs?')).toBeTruthy()
    fireEvent.click(screen.getAllByText('Néixer aquí')[0])

    // Pantalla de joc: es mostra la barra de benestar
    expect(screen.getByText('Benestar')).toBeTruthy()

    // Avancem un any (si no apareix una decisió que oculti el botó)
    const next = screen.queryByText('Següent any →')
    if (next) fireEvent.click(next)
    expect(screen.getByText('Benestar')).toBeTruthy()
  })
})
