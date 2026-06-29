/**
 * Capa de SO (música ambiental + efectes) i VIBRACIÓ, OPT-IN (desactivada per defecte). Música de
 * fons melòdica i lenta (pads + arpegi sintetitzats, sense fitxers) i efectes curts. Un sol botó.
 *
 * Disseny:
 * - Sense dependències ni assets: tot és Web Audio (oscil·ladors + envolupants).
 * - L'AudioContext es crea i es desbloqueja dins d'un GEST de l'usuari (en activar el so) i, per
 *   robustesa, es REPRÈN a cada interacció mentre el so és actiu (els navegadors el suspenen sols).
 * - En activar el so sona una confirmació immediata, perquè l'usuari sàpiga que funciona.
 * - La preferència es desa a localStorage; per defecte OFF. En jsdom (tests) sense AudioContext
 *   tot són no-ops segurs.
 */

const KEY = 'capitalist-game/sound/v1'

export type SfxName = 'tick' | 'select' | 'milestone' | 'triomf' | 'death' | 'shock' | 'coin'

let enabled = false
let ctx: AudioContext | null = null
const listeners = new Set<() => void>()

function load() {
  try {
    enabled = localStorage.getItem(KEY) === 'on'
  } catch {
    enabled = false
  }
}
load()

export function isSoundEnabled(): boolean {
  return enabled
}

export function setSoundEnabled(v: boolean): void {
  enabled = v
  try {
    localStorage.setItem(KEY, v ? 'on' : 'off')
  } catch {
    /* ignora (mode privat, etc.) */
  }
  if (v) {
    getCtx() // desbloqueja l'àudio dins del gest que ha activat el so
    startMusic()
    playSfx('select') // confirmació immediata: l'usuari sent que el so funciona
  } else {
    stopMusic()
  }
  listeners.forEach((l) => l())
}

/** Subscripció per a `useSyncExternalStore` (el toggle reacciona al canvi). */
export function subscribeSound(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC: typeof AudioContext | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  if (!ctx) {
    try {
      ctx = new AC()
    } catch {
      return null
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

// =============================== Música ambiental ===============================
// Progressió lenta i melancòlica (La menor: i – VI – III – VII): pad sostingut + un ARPEGI suau
// que li dóna moviment melòdic (perquè s'entengui com a música, no soroll de fons inaudible).

const midiToHz = (n: number) => 440 * Math.pow(2, (n - 69) / 12)
const CHORDS: number[][] = [
  [45, 57, 60, 64], // Am
  [41, 53, 57, 60], // F
  [48, 55, 60, 64], // C
  [43, 55, 59, 62], // G
]
const BAR = 4 // segons per acord
const ARP_NOTES = 8 // notes d'arpegi per compàs

let musicGain: GainNode | null = null
let musicTimer: ReturnType<typeof setTimeout> | null = null
let musicNextTime = 0
let musicChord = 0

function pad(c: AudioContext, midi: number, start: number, peak: number) {
  if (!musicGain) return
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = 'triangle'
  osc.frequency.value = midiToHz(midi)
  g.gain.setValueAtTime(0.0001, start)
  g.gain.exponentialRampToValueAtTime(peak, start + 0.4)
  g.gain.exponentialRampToValueAtTime(0.0001, start + BAR)
  osc.connect(g).connect(musicGain)
  osc.start(start)
  osc.stop(start + BAR + 0.1)
}

function pluck(c: AudioContext, midi: number, start: number, peak: number) {
  if (!musicGain) return
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = 'sine'
  osc.frequency.value = midiToHz(midi)
  g.gain.setValueAtTime(0.0001, start)
  g.gain.exponentialRampToValueAtTime(peak, start + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, start + 0.5)
  osc.connect(g).connect(musicGain)
  osc.start(start)
  osc.stop(start + 0.55)
}

function scheduleChord(c: AudioContext, freqs: number[], start: number) {
  // Pad sostingut (baix + acord).
  pad(c, freqs[0] - 12, start, 0.14) // baix una octava avall
  for (let i = 1; i < freqs.length; i++) pad(c, freqs[i], start, 0.07)
  // Arpegi: recorre les notes altes de l'acord al llarg del compàs (moviment melòdic).
  const arpPool = [freqs[1], freqs[2], freqs[3], freqs[2] + 12, freqs[3], freqs[2]]
  for (let i = 0; i < ARP_NOTES; i++) {
    pluck(c, arpPool[i % arpPool.length], start + (i * BAR) / ARP_NOTES, 0.1)
  }
}

function musicLoop() {
  const c = getCtx()
  if (!c || !musicGain) return
  // Programa els acords que entren dins de la finestra de look-ahead (~2 s).
  while (musicNextTime < c.currentTime + 2) {
    scheduleChord(c, CHORDS[musicChord % CHORDS.length], musicNextTime)
    musicNextTime += BAR
    musicChord++
  }
  musicTimer = setTimeout(musicLoop, 500)
}

function startMusic() {
  const c = getCtx()
  if (!c || musicTimer) return
  if (!musicGain) {
    musicGain = c.createGain()
    musicGain.connect(c.destination)
  }
  // Puja el volum mestre ràpidament (clarament audible, però sense espantar).
  musicGain.gain.cancelScheduledValues(c.currentTime)
  musicGain.gain.setValueAtTime(0.0001, c.currentTime)
  musicGain.gain.exponentialRampToValueAtTime(0.9, c.currentTime + 0.8)
  musicNextTime = c.currentTime + 0.1
  musicChord = 0
  musicLoop()
}

function stopMusic() {
  if (musicTimer) {
    clearTimeout(musicTimer)
    musicTimer = null
  }
  if (musicGain && ctx) {
    musicGain.gain.cancelScheduledValues(ctx.currentTime)
    musicGain.gain.setValueAtTime(Math.max(0.0001, musicGain.gain.value), ctx.currentTime)
    musicGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6)
  }
}

// ============================= Efectes puntuals (SFX) =============================

/** Una nota: oscil·lador amb envolupant exponencial curta (atac ràpid, caiguda suau). */
function tone(
  c: AudioContext,
  freq: number,
  {
    dur = 0.18,
    type = 'sine' as OscillatorType,
    gain = 0.16,
    at = 0,
  }: { dur?: number; type?: OscillatorType; gain?: number; at?: number } = {},
) {
  const t0 = c.currentTime + at
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

const SFX: Record<SfxName, (c: AudioContext) => void> = {
  tick: (c) => tone(c, 330, { dur: 0.12, type: 'triangle', gain: 0.16 }),
  select: (c) => tone(c, 560, { dur: 0.1, type: 'sine', gain: 0.16 }),
  milestone: (c) => {
    tone(c, 660, { dur: 0.18, type: 'sine', gain: 0.18 })
    tone(c, 880, { dur: 0.28, type: 'sine', gain: 0.18, at: 0.15 })
  },
  triomf: (c) => {
    tone(c, 523, { dur: 0.2, gain: 0.18 })
    tone(c, 659, { dur: 0.2, gain: 0.18, at: 0.17 })
    tone(c, 784, { dur: 0.42, gain: 0.18, at: 0.34 })
  },
  death: (c) => {
    tone(c, 160, { dur: 1, type: 'sine', gain: 0.2 })
    tone(c, 98, { dur: 1.3, type: 'sine', gain: 0.18, at: 0.14 })
  },
  shock: (c) => {
    tone(c, 220, { dur: 0.32, type: 'sawtooth', gain: 0.13 })
    tone(c, 233, { dur: 0.32, type: 'sawtooth', gain: 0.13 })
  },
  coin: (c) => {
    tone(c, 880, { dur: 0.08, type: 'square', gain: 0.12 })
    tone(c, 1320, { dur: 0.11, type: 'square', gain: 0.12, at: 0.05 })
  },
}

const HAPTICS: Record<SfxName, number | number[]> = {
  tick: 8,
  select: 12,
  milestone: [20, 40, 30],
  triomf: [20, 40, 20, 40, 40],
  death: [120, 60, 180],
  shock: [40, 30, 40],
  coin: 10,
}

/** Reprodueix un efecte (so + vibració) si l'usuari ho ha activat. No-op si està desactivat. */
export function playSfx(name: SfxName): void {
  if (!enabled) return
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(HAPTICS[name])
    }
  } catch {
    /* alguns navegadors llancen si no hi ha gest; ignora */
  }
  const c = getCtx()
  if (!c) return
  try {
    SFX[name](c)
  } catch {
    /* àudio no disponible */
  }
}

// Robustesa: a CADA interacció de l'usuari, si el so és actiu, assegura que l'AudioContext està en
// marxa (els navegadors el suspenen quan la pestanya passa a segon pla o sense gest previ) i, si la
// música s'havia aturat, la torna a engegar. Així el so "es desbloqueja" sol a la primera acció.
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  const onGesture = () => {
    if (!enabled) return
    getCtx() // crea/reprèn el context
    if (!musicTimer) startMusic()
  }
  window.addEventListener('pointerdown', onGesture)
  window.addEventListener('keydown', onGesture)
}
