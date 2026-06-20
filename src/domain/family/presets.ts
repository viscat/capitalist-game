import type { Familia, FamilyClass } from '../types'

export interface FamilyPreset {
  id: FamilyClass
  /** Claus i18n. */
  nameKey: string
  descKey: string
  familia: Familia
}

// Nota de disseny: les famílies amb més recursos solen dedicar menys hores de
// cura directa (progenitors absents per feina exigent o delegació en cuidadors),
// cosa que crea la tensió central del joc: més diners no compren automàticament
// més benestar.
export const FAMILY_PRESETS: Record<FamilyClass, FamilyPreset> = {
  pobra: {
    id: 'pobra',
    nameKey: 'family.pobra.name',
    descKey: 'family.pobra.desc',
    familia: {
      classe: 'pobra',
      patrimoni: 2_000,
      ingressosMensuals: 1_100,
      horesFeina: 45,
      horesCura: 35,
      cuidadorContractat: false,
    },
  },
  treballadora: {
    id: 'treballadora',
    nameKey: 'family.treballadora.name',
    descKey: 'family.treballadora.desc',
    familia: {
      classe: 'treballadora',
      patrimoni: 15_000,
      ingressosMensuals: 2_200,
      horesFeina: 40,
      horesCura: 30,
      cuidadorContractat: false,
    },
  },
  mitjana: {
    id: 'mitjana',
    nameKey: 'family.mitjana.name',
    descKey: 'family.mitjana.desc',
    familia: {
      classe: 'mitjana',
      patrimoni: 80_000,
      ingressosMensuals: 3_800,
      horesFeina: 38,
      horesCura: 28,
      cuidadorContractat: false,
    },
  },
  alta: {
    id: 'alta',
    nameKey: 'family.alta.name',
    descKey: 'family.alta.desc',
    familia: {
      classe: 'alta',
      patrimoni: 350_000,
      ingressosMensuals: 7_000,
      horesFeina: 45,
      horesCura: 18,
      cuidadorContractat: true,
    },
  },
  rica: {
    id: 'rica',
    nameKey: 'family.rica.name',
    descKey: 'family.rica.desc',
    familia: {
      classe: 'rica',
      patrimoni: 2_000_000,
      ingressosMensuals: 15_000,
      horesFeina: 50,
      horesCura: 10,
      cuidadorContractat: true,
    },
  },
  super_rica: {
    id: 'super_rica',
    nameKey: 'family.super_rica.name',
    descKey: 'family.super_rica.desc',
    familia: {
      classe: 'super_rica',
      patrimoni: 30_000_000,
      ingressosMensuals: 60_000,
      horesFeina: 30,
      horesCura: 8,
      cuidadorContractat: true,
    },
  },
}

export const FAMILY_PRESET_ORDER: FamilyClass[] = [
  'pobra',
  'treballadora',
  'mitjana',
  'alta',
  'rica',
  'super_rica',
]
