import { describe, expect, it } from 'vitest'
import { dataActual } from './time'

describe('dataActual', () => {
  it('retorna el mes i any de naixement amb 0 mesos', () => {
    expect(dataActual('2026-06-15', 0)).toEqual({ mesIndex: 5, any: 2026 })
  })

  it('avança correctament un any', () => {
    expect(dataActual('2026-06-15', 12)).toEqual({ mesIndex: 5, any: 2027 })
  })

  it('passa al gener de l’any següent set mesos després de juny', () => {
    expect(dataActual('2026-06-15', 7)).toEqual({ mesIndex: 0, any: 2027 })
  })
})
