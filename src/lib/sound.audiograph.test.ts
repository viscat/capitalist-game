import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { playSfx, setSoundEnabled } from './sound'

// Mock mínim de la Web Audio API per verificar que, amb el so activat, REALMENT es construeix
// el graf d'àudio (s'hi creen oscil·ladors i s'engeguen). jsdom no porta AudioContext, així que
// l'injectem nosaltres. Si aquest test passa, la lògica de so és correcta i un problema real
// seria d'entorn (gest d'usuari / autoplay), no de codi.
let started = 0
let oscCreated = 0

class FakeParam {
  value = 0
  setValueAtTime() {}
  exponentialRampToValueAtTime() {}
  cancelScheduledValues() {}
}
class FakeNode {
  gain = new FakeParam()
  frequency = new FakeParam()
  type = 'sine'
  connect(dest: unknown) {
    return dest
  }
  start() {
    started++
  }
  stop() {}
}
class FakeAudioContext {
  state = 'running'
  currentTime = 0
  destination = {}
  createOscillator() {
    oscCreated++
    return new FakeNode()
  }
  createGain() {
    return new FakeNode()
  }
  resume() {
    this.state = 'running'
    return Promise.resolve()
  }
}

beforeEach(() => {
  started = 0
  oscCreated = 0
  ;(window as unknown as { AudioContext: unknown }).AudioContext =
    FakeAudioContext as unknown as typeof AudioContext
  vi.useFakeTimers()
})

afterEach(() => {
  setSoundEnabled(false)
  vi.useRealTimers()
  delete (window as unknown as { AudioContext?: unknown }).AudioContext
})

describe('graf d’àudio (amb AudioContext mockejat)', () => {
  it('activar el so construeix i engega la música (oscil·ladors)', () => {
    setSoundEnabled(true)
    expect(oscCreated).toBeGreaterThan(0)
    expect(started).toBeGreaterThan(0)
  })

  it('playSfx crea i engega un oscil·lador quan el so és actiu', () => {
    setSoundEnabled(true)
    const abans = started
    playSfx('death')
    expect(started).toBeGreaterThan(abans)
  })
})
