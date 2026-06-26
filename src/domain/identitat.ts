import type { Genere, Identitat, Origen, Progenitor } from './types'

// Conjunts de noms per a la generació aleatòria de la identitat.
const NOMS = [
  'Laia', 'Marc', 'Aina', 'Pau', 'Júlia', 'Arnau', 'Carla', 'Jordi',
  'Martina', 'Pol', 'Emma', 'Biel', 'Ona', 'Nil', 'Gemma', 'Roc',
]
const NOMS_PARE = [
  'Josep', 'Antoni', 'Joan', 'Manel', 'Francesc', 'David', 'Sergi', 'Xavier',
]
const NOMS_MARE = [
  'Montserrat', 'Maria', 'Anna', 'Núria', 'Carme', 'Marta', 'Cristina', 'Sandra',
]
const COGNOMS = [
  'Garcia', 'Puig', 'Soler', 'Vila', 'Roca', 'Serra', 'Font', 'Bosch',
  'Costa', 'Ferrer', 'Mas', 'Pujol', 'Riera', 'Camps', 'Sala', 'Vidal',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Nom de pila DETERMINISTA a partir d'un enter (p. ex. l'estat del RNG): mateixa llavor →
 * mateix nom, perquè la partida sigui reproduïble (noms de parella i fills). No usa Math.random.
 */
export function nomPerSeed(seed: number): string {
  return NOMS[Math.abs(Math.trunc(seed)) % NOMS.length]
}

function dosCognoms(): string {
  return `${pick(COGNOMS)} ${pick(COGNOMS)}`
}

function primerCognom(cognoms: string): string {
  return cognoms.trim().split(/\s+/)[0] ?? cognoms
}

/** Cognoms de la persona = primer cognom del pare + primer de la mare. */
export function cognomsPersona(pare: Progenitor, mare: Progenitor): string {
  return `${primerCognom(pare.cognoms)} ${primerCognom(mare.cognoms)}`.trim()
}

export function nomComplet(identitat: Identitat): string {
  return `${identitat.nom} ${identitat.cognoms}`.trim()
}

/** Genera una identitat aleatòria coherent (cognoms de la persona derivats dels pares). */
export function randomIdentitat(): Identitat {
  const pare: Progenitor = { nom: pick(NOMS_PARE), cognoms: dosCognoms() }
  const mare: Progenitor = { nom: pick(NOMS_MARE), cognoms: dosCognoms() }
  // Gènere i origen també formen part del "punt de sortida": aleatoris, però presents.
  const genere: Genere = pick<Genere>(['dona', 'home'])
  const origen: Origen = Math.random() < 0.25 ? 'migrant' : 'autocton'
  return {
    nom: pick(NOMS),
    cognoms: cognomsPersona(pare, mare),
    pare,
    mare,
    genere,
    origen,
  }
}
