import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { I18nProvider } from '../i18n'
import { SalutAvis } from './StatRings'

function renderAvis(salut: number) {
  return render(
    <I18nProvider>
      <SalutAvis salut={salut} />
    </I18nProvider>,
  )
}

afterEach(cleanup)

// Regressió: mai s'han de veure DOS banners de salut alhora (p. ex. "Salut baixa" sota
// "Salut crítica"). El nivell és mútuament excloent: surt un únic avís segons la salut.
describe('SalutAvis: un sol banner segons el nivell', () => {
  it('salut crítica: només surt el banner crític, no el de salut baixa', () => {
    renderAvis(5) // < 10 → crítica
    expect(screen.getByText(/crítica/i)).toBeTruthy()
    expect(screen.queryByText(/^salut baixa$/i)).toBeNull()
  })

  it('salut baixa: surt el banner de salut baixa', () => {
    renderAvis(20) // < 25 → baixa
    expect(screen.getByText(/salut baixa/i)).toBeTruthy()
  })

  it('salut sana: no surt cap banner', () => {
    const { container } = renderAvis(80)
    expect(container.textContent ?? '').toBe('')
  })
})
