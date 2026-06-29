import { afterEach, describe, expect, it } from 'vitest'
import { isSoundEnabled, playSfx, setSoundEnabled } from './sound'

afterEach(() => setSoundEnabled(false))

// En jsdom no hi ha AudioContext: la capa de so ha de ser un no-op segur (mai llança), però
// la preferència (activat/desactivat) sí que ha de funcionar i ser reactiva.
describe('capa de so (opt-in)', () => {
  it('per defecte està desactivada', () => {
    expect(isSoundEnabled()).toBe(false)
  })

  it('activar/desactivar canvia l’estat i no llança sense AudioContext', () => {
    setSoundEnabled(true)
    expect(isSoundEnabled()).toBe(true)
    expect(() => playSfx('tick')).not.toThrow()
    expect(() => playSfx('death')).not.toThrow()
    setSoundEnabled(false)
    expect(isSoundEnabled()).toBe(false)
    // Desactivat: playSfx no fa res (i tampoc llança).
    expect(() => playSfx('coin')).not.toThrow()
  })
})
