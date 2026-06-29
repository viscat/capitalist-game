/**
 * Capa de SO (música ambiental + efectes) i VIBRACIÓ, OPT-IN (desactivada per defecte). El to és
 * seriós: música de fons lenta i melancòlica (pads sintetitzats, sense fitxers) i efectes curts
 * (un tic en passar l'any, un clic en decidir, una nota greu en morir). Tot amb un sol botó.
 *
 * Disseny:
 * - Sense dependències ni assets: tot és Web Audio (oscil·ladors + envolupants).
 * - L'AudioContext es crea i es desbloqueja dins d'un GEST de l'usuari (en activar el so, o a la
 *   primera interacció si ja estava activat), com exigeixen les polítiques d'autoplay.
 * - La preferència es desa a localStorage; per defecte OFF. En jsdom (tests) no hi ha
 *   AudioContext ni vibrate: tot són no-ops segurs.
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
// Progressió lenta i melancòlica (La menor: i – VI – III – VII), pads suaus en bucle. Volum
// baix perquè acompanyi sense distreure. Es programa amb antelació (look-ahead scheduler).

const midiToHz = (n: number) => 440 * Math.pow(2, (n - 69) / 12)
const CHORDS: number[][] = [
  [45, 52, 57, 64], // Am  (A2 E3 A3 E4)
  [41, 48, 57, 60], // F   (F2 C3 A3 C4)
  [48, 55, 60, 64], // C   (C3 G3 C4 E4)
  [43, 50, 59, 62], // G   (G2 D3 B3 D4)
]
const BAR = 5 // segons per acord

let musicGain: GainNode | null = null
let musicTimer: ReturnType<typeof setTimeout> | null = null
let musicNextTime = 0
let musicChord = 0

function scheduleChord(c: AudioContext, freqsMidi: number[], start: number) {
  if (!musicGain) return
  freqsMidi.forEach((midi, i) => {
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = i === 0 ? 'sine' : 'triangle'
    osc.frequency.value = midiToHz(midi)
    const peak = i === 0 ? 0.07 : 0.04 // el baix una mica més present
    g.gain.setValueAtTime(0.0001, start)
    g.gain.exponentialRampToValueAtTime(peak, start + 1.4) // atac lent (pad)
    g.gain.exponentialRampToValueAtTime(0.0001, start + BAR) // s'esvaeix abans del següent acord
    osc.connect(g).connect(musicGain!)
    osc.start(start)
    osc.stop(start + BAR + 0.1)
  })
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
  musicTimer = setTimeout(musicLoop, 600)
}

function startMusic() {
  const c = getCtx()
  if (!c || musicTimer) return
  if (!musicGain) {
    musicGain = c.createGain()
    musicGain.connect(c.destination)
  }
  // Puja el volum mestre suaument (evita un clic en començar).
  musicGain.gain.cancelScheduledValues(c.currentTime)
  musicGain.gain.setValueAtTime(0.0001, c.currentTime)
  musicGain.gain.exponentialRampToValueAtTime(0.6, c.currentTime + 1.5)
  musicNextTime = c.currentTime + 0.15
  musicChord = 0
  musicLoop()
}

function stopMusic() {
  if (musicTimer) {
    clearTimeout(musicTimer)
    musicTimer = null
  }
  if (musicGain && ctx) {
    // Fade out del màster: silencia també els acords ja programats.
    musicGain.gain.cancelScheduledValues(ctx.currentTime)
    musicGain.gain.setValueAtTime(Math.max(0.0001, musicGain.gain.value), ctx.currentTime)
    musicGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7)
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
    gain = 0.09,
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
  // Un any passa: tic curt i discret.
  tick: (c) => tone(c, 320, { dur: 0.11, type: 'triangle', gain: 0.09 }),
  // Decisió presa: clic net.
  select: (c) => tone(c, 540, { dur: 0.09, type: 'sine', gain: 0.09 }),
  // Fita d'edat: dues notes ascendents.
  milestone: (c) => {
    tone(c, 660, { dur: 0.18, type: 'sine', gain: 0.1 })
    tone(c, 880, { dur: 0.26, type: 'sine', gain: 0.1, at: 0.15 })
  },
  // Bon final: petit arpegi major (digne, no festiu).
  triomf: (c) => {
    tone(c, 523, { dur: 0.2, gain: 0.1 })
    tone(c, 659, { dur: 0.2, gain: 0.1, at: 0.17 })
    tone(c, 784, { dur: 0.4, gain: 0.1, at: 0.34 })
  },
  // Mort: nota greu llarga, ombrívola.
  death: (c) => {
    tone(c, 150, { dur: 1, type: 'sine', gain: 0.11 })
    tone(c, 98, { dur: 1.2, type: 'sine', gain: 0.1, at: 0.12 })
  },
  // Xoc (crac de mercat, despesa greu): dues freqüències properes = dissonància curta.
  shock: (c) => {
    tone(c, 220, { dur: 0.3, type: 'sawtooth', gain: 0.08 })
    tone(c, 233, { dur: 0.3, type: 'sawtooth', gain: 0.08 })
  },
  // Ingrés: blip ascendent ràpid.
  coin: (c) => {
    tone(c, 880, { dur: 0.07, type: 'square', gain: 0.07 })
    tone(c, 1320, { dur: 0.1, type: 'square', gain: 0.07, at: 0.05 })
  },
}

// Patrons de vibració (ms) per a cada efecte. La mort vibra més.
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

// Si el so ja estava activat de sessions anteriors, l'àudio no pot sonar fins que hi ha un gest:
// engega la música a la PRIMERA interacció de l'usuari.
if (enabled && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  const kick = () => {
    window.removeEventListener('pointerdown', kick)
    if (enabled) startMusic()
  }
  window.addEventListener('pointerdown', kick, { once: true })
}
