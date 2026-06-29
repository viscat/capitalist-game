/**
 * Capa de so + vibració OPT-IN (desactivada per defecte). El to és seriós: no és un joc
 * arcade, així que els sons són curts, sintetitzats (Web Audio, sense fitxers) i discrets —
 * un tic en passar l'any, un clic en decidir, una nota greu en morir. Tot es pot silenciar.
 *
 * Disseny:
 * - Sense dependències ni assets: cada efecte és un oscil·lador amb una envolupant curta.
 * - L'AudioContext es crea MANDRÓS dins d'un gest de l'usuari (els efectes es disparen des
 *   d'accions amb botó), com exigeixen les polítiques d'autoplay dels navegadors.
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
  if (v) getCtx() // desbloqueja l'àudio dins del gest que ha activat el so
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
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
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

/** Una nota: oscil·lador amb envolupant exponencial curta (atac ràpid, caiguda suau). */
function tone(
  c: AudioContext,
  freq: number,
  {
    dur = 0.18,
    type = 'sine' as OscillatorType,
    gain = 0.06,
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
  tick: (c) => tone(c, 320, { dur: 0.09, type: 'triangle', gain: 0.05 }),
  // Decisió presa: clic net.
  select: (c) => tone(c, 540, { dur: 0.07, type: 'sine', gain: 0.05 }),
  // Fita d'edat: dues notes ascendents.
  milestone: (c) => {
    tone(c, 660, { dur: 0.16, type: 'sine', gain: 0.06 })
    tone(c, 880, { dur: 0.22, type: 'sine', gain: 0.06, at: 0.14 })
  },
  // Bon final: petit arpegi major (digne, no festiu).
  triomf: (c) => {
    tone(c, 523, { dur: 0.18, gain: 0.06 })
    tone(c, 659, { dur: 0.18, gain: 0.06, at: 0.16 })
    tone(c, 784, { dur: 0.34, gain: 0.06, at: 0.32 })
  },
  // Mort: nota greu llarga, ombrívola.
  death: (c) => {
    tone(c, 150, { dur: 0.9, type: 'sine', gain: 0.07 })
    tone(c, 98, { dur: 1.1, type: 'sine', gain: 0.06, at: 0.12 })
  },
  // Xoc (crac de mercat, despesa greu): dues freqüències properes = dissonància curta.
  shock: (c) => {
    tone(c, 220, { dur: 0.28, type: 'sawtooth', gain: 0.05 })
    tone(c, 233, { dur: 0.28, type: 'sawtooth', gain: 0.05 })
  },
  // Ingrés: blip ascendent ràpid.
  coin: (c) => {
    tone(c, 880, { dur: 0.06, type: 'square', gain: 0.04 })
    tone(c, 1320, { dur: 0.08, type: 'square', gain: 0.04, at: 0.05 })
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
