import { describe, expect, it } from 'vitest'
import { ca } from './locales/ca'
import { ADOLESCENCE_ACTIONS } from '../domain/actions/adolescencia'
import { ADOLESCENCE_EVENTS } from '../domain/events/adolescencia'
import {
  ATUR_ADULT_EVENTS,
  CARRERA_EVENTS,
  UNIVERSITAT_EVENTS,
} from '../domain/events/adult'
import {
  ATUR_EVENTS,
  COMMON_LIFE_EVENTS,
  NINI_EVENTS,
  TREBALL_EVENTS,
} from '../domain/events/laboral'
import { CHILDHOOD_EVENTS } from '../domain/events/pool'
import { PROPIETATS } from '../domain/housing'
import { FAMILY_PRESETS } from '../domain/family/presets'
import { MILESTONES } from '../domain/milestones'
import type {
  EventCategory,
  FamilyClass,
  GameEvent,
  Itinerari,
  LifeStage,
  QualitatOferta,
} from '../domain/types'

// Una clau i18n absent NO peta: `translate` retorna la pròpia clau, així que es
// mostraria crua a la UI sense avisar. Aquest test garanteix que tot el contingut
// del joc (esdeveniments, accions, fites i les claus derivades dinàmicament) té
// traducció al diccionari català.

const has = (key: string) => Object.prototype.hasOwnProperty.call(ca, key)

const ALL_EVENTS: GameEvent[] = [
  ...CHILDHOOD_EVENTS,
  ...ADOLESCENCE_EVENTS,
  ...TREBALL_EVENTS,
  ...ATUR_EVENTS,
  ...NINI_EVENTS,
  ...UNIVERSITAT_EVENTS,
  ...CARRERA_EVENTS,
  ...ATUR_ADULT_EVENTS,
  ...COMMON_LIFE_EVENTS,
]

// Enumeracions (només existeixen com a tipus): es repliquen aquí per recórrer-les.
const CATEGORIES: EventCategory[] = [
  'familia',
  'economia',
  'regal',
  'salut',
  'escola',
]
const STAGES: LifeStage[] = [
  'infancia',
  'adolescencia',
  'estudis_post',
  'laboral',
  'universitat',
  'carrera',
]
const ITINERARIS: Itinerari[] = ['batxillerat', 'grau_mig', 'treball', 'nini']
const CLASSES: FamilyClass[] = Object.keys(FAMILY_PRESETS) as FamilyClass[]
const BENESTAR_BUCKETS = ['molt_baix', 'baix', 'mig', 'alt', 'molt_alt']
const QUALITATS_OFERTA: QualitatOferta[] = ['precaria', 'estandard', 'bona']

describe('cobertura i18n (català)', () => {
  it('tots els esdeveniments tenen títol, descripció i etiquetes d’opció', () => {
    const missing: string[] = []
    for (const e of ALL_EVENTS) {
      if (!has(e.titleKey)) missing.push(e.titleKey)
      if (!has(e.descKey)) missing.push(e.descKey)
      for (const c of e.choices ?? []) {
        if (!has(c.labelKey)) missing.push(c.labelKey)
      }
    }
    expect(missing).toEqual([])
  })

  it('els identificadors d’esdeveniment són únics dins de cada pool', () => {
    const ids = ALL_EVENTS.map((e) => e.id)
    // (Es permet el mateix id en pools diferents; aquí només comprovem duplicats globals evidents.)
    const dups = ids.filter((id, i) => ids.indexOf(id) !== i)
    expect(dups).toEqual([])
  })

  it('totes les accions tenen etiqueta, descripció i motiu de bloqueig', () => {
    const missing: string[] = []
    for (const a of ADOLESCENCE_ACTIONS) {
      if (!has(a.labelKey)) missing.push(a.labelKey)
      if (!has(a.descKey)) missing.push(a.descKey)
      if (a.lockedReasonKey && !has(a.lockedReasonKey)) {
        missing.push(a.lockedReasonKey)
      }
    }
    // Motius de bloqueig genèrics emesos pel motor (engine.ts).
    for (const k of ['action.locked.diners', 'action.locked.benestar']) {
      if (!has(k)) missing.push(k)
    }
    expect(missing).toEqual([])
  })

  it('totes les fites tenen els seus textos i resums per tram de benestar', () => {
    const missing: string[] = []
    for (const def of Object.values(MILESTONES)) {
      for (const k of [
        def.kickerKey,
        def.titleKey,
        def.summaryTitleKey,
        def.loreTitleKey,
        ...def.loreKeys,
      ]) {
        if (!has(k)) missing.push(k)
      }
      for (const bucket of BENESTAR_BUCKETS) {
        const k = `${def.summaryPrefix}.${bucket}`
        if (!has(k)) missing.push(k)
      }
      for (const o of def.options) {
        if (!has(o.labelKey)) missing.push(o.labelKey)
        if (o.descKey && !has(o.descKey)) missing.push(o.descKey)
      }
    }
    expect(missing).toEqual([])
  })

  it('les claus derivades dinàmicament a la UI existeixen', () => {
    const keys = [
      ...CLASSES.flatMap((c) => [`family.${c}.name`, `family.${c}.desc`]),
      ...CATEGORIES.map((c) => `category.${c}`),
      ...STAGES.map((s) => `game.stage.${s}`),
      ...ITINERARIS.flatMap((i) => [
        `itinerari.${i}.label`,
        `itinerari.${i}.short`,
        `itinerari.${i}.desc`,
      ]),
      ...BENESTAR_BUCKETS.map((b) => `benestar.${b}`),
      ...Array.from({ length: 12 }, (_, i) => `mes.${i}`),
      ...['estalvi', 'oci', 'compres', 'casa'].flatMap((k) => [
        `budget.${k}`,
        `budget.${k}.desc`,
      ]),
      ...['oci', 'estalvi', 'fonsIndexat', 'fonsPensions', 'costVida', 'costHabitatge'].flatMap(
        (k) => [`pla.${k}`, `pla.${k}.desc`],
      ),
      ...['minim', 'mig', 'alt'].map((n) => `nivellVida.${n}`),
      ...QUALITATS_OFERTA.map((q) => `oferta.${q}`),
      ...['efectiu', 'estalvi', 'inversions', 'fonsIndexat', 'fonsPensions'].map(
        (f) => `patrimoni.${f}`,
      ),
      ...['amb_pares', 'habitacio', 'pis_lloguer', 'propietat'].map(
        (h) => `tipusHabitatge.${h}`,
      ),
      ...PROPIETATS.map((p) => `propietat.${p.id}`),
    ]
    expect(keys.filter((k) => !has(k))).toEqual([])
  })
})
