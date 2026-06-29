import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { I18nProvider } from '../i18n'
import { StatRings } from './StatRings'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

// Regressió: el "+N/−N" flotant d'un anell ha de coincidir amb el canvi APLICAT per
// l'esdeveniment (el mateix que mostra l'historial), NO amb la diferència bruta del valor
// (que inclou la deriva d'entorn i el declivi d'edat). Per això surt de `efecte`.
describe('StatRings: el delta flotant surt de l’efecte aplicat', () => {
  it('mostra exactament el benestar de l’efecte, encara que el valor s’hagi mogut una altra cosa', () => {
    vi.useFakeTimers()
    const { rerender } = render(
      <I18nProvider>
        <StatRings benestar={50} salut={50} efecteKey={0} />
      </I18nProvider>,
    )
    // Nou torn: l'esdeveniment aplica benestar +10, però el valor net puja només a 57
    // (deriva −3). El numeret ha de dir +10 (com l'historial), no +7.
    rerender(
      <I18nProvider>
        <StatRings benestar={57} salut={48} efecte={{ benestar: 10 }} efecteKey={1} />
      </I18nProvider>,
    )
    act(() => vi.advanceTimersByTime(20))
    expect(screen.getByText('+10')).toBeTruthy()
    // La salut ha baixat 2 punts (declivi d'edat) però l'efecte no en porta: cap "−2" fantasma.
    expect(screen.queryByText('−2')).toBeNull()
  })
})
