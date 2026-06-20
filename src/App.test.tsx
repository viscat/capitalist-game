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

    // Creació de personatge: comencem la vida
    expect(screen.getByText('Qui seràs?')).toBeTruthy()
    fireEvent.click(screen.getByText('Començar la vida'))

    // Pantalla de joc: es mostra la barra de benestar
    expect(screen.getByText('Benestar')).toBeTruthy()

    // Avancem un any (si no apareix una decisió que oculti el botó)
    const next = screen.queryByText('Següent any →')
    if (next) fireEvent.click(next)
    expect(screen.getByText('Benestar')).toBeTruthy()
  })

  it('el quick-start de carrera mostra el panell d’inversió', () => {
    renderApp()

    // Inici ràpid a la fase de carrera (22 anys). El botó duu un emoji al davant,
    // així que cerquem per coincidència parcial.
    fireEvent.click(screen.getByText(/Proves: carrera/))
    fireEvent.click(screen.getAllByText('Començar als 22')[0])
    fireEvent.click(screen.getByText('Començar la vida'))

    // Es mostra el panell d'inversió amb les seves partides (també surten al
    // resum de patrimoni, per això n'hi pot haver més d'una ocurrència).
    expect(screen.getByText('On poses els teus diners?')).toBeTruthy()
    expect(screen.getAllByText('Fons indexat').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pla de pensions').length).toBeGreaterThan(0)
  })
})
