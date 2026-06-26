import { describe, expect, it } from 'vitest'
import { FAMILY_PRESET_ORDER } from '../family/presets'
import {
  type ClassSummary,
  type SimPolicy,
  simulateClass,
  summarize,
} from './harness'

// Aquest test NO és una asserció de balanceig: és l'INFORME del moderador-tester.
// Imprimeix la distribució d'outcomes als 35 anys per classe i política, per
// comparar-la amb la corba objectiu de DESIGN.md §8.4. Les úniques assercions són
// invariants robustos (benestar dins de rang; el ric viu millor que el pobre).

const N = 400

const POLICIES: Record<string, SimPolicy> = {
  estudis: { postobligatori: 'batxillerat', majoria: 'universitat' },
  treball: { postobligatori: 'treball', majoria: 'carrera' },
  // Jugador ACTIU per la via educativa (estudia a fons a la universitat): mesura la cua de
  // mobilitat de §8.4. És la millor jugada possible per a un origen humil.
  estudis_actiu: { postobligatori: 'batxillerat', majoria: 'universitat', actiu: true },
}

function pct(x: number): string {
  return `${(x * 100).toFixed(1)}%`
}

function row(label: string, s: ClassSummary): string {
  return [
    label.padEnd(14),
    `ben med ${String(s.benestarMediana).padStart(3)}`,
    `p10 ${String(s.benestarP10).padStart(3)}`,
    `p90 ${String(s.benestarP90).padStart(3)}`,
    `patr med ${String(s.patrimoniMediana).padStart(9)}€`,
    `cua≥60 ${pct(s.cuaBenestar60).padStart(6)}`,
  ].join('  ')
}

describe('sim: corba d’outcomes per classe (informe)', () => {
  it('imprimeix la distribució i compleix invariants bàsics', () => {
    const summaries: Record<string, Record<string, ClassSummary>> = {}

    for (const [name, policy] of Object.entries(POLICIES)) {
      summaries[name] = {}
      const lines: string[] = []
      for (const cls of FAMILY_PRESET_ORDER) {
        const s = summarize(simulateClass(cls, N, policy))
        summaries[name][cls] = s
        lines.push(row(cls, s))
      }
      console.log(`\n=== Política «${name}» (${N} llavors/classe) ===\n${lines.join('\n')}`)
    }

    // Discriminació (gènere/origen): mateixa classe i política, identitats diferents.
    const idBase = { nom: 'X', cognoms: 'Y', pare: { nom: 'P', cognoms: 'Y' }, mare: { nom: 'M', cognoms: 'Z' } }
    const privilegiat = { ...idBase, genere: 'home' as const, origen: 'autocton' as const }
    const discriminat = { ...idBase, genere: 'dona' as const, origen: 'migrant' as const }
    for (const cls of ['mitjana', 'pobra'] as const) {
      const p = summarize(simulateClass(cls, N, POLICIES.estudis, privilegiat))
      const d = summarize(simulateClass(cls, N, POLICIES.estudis, discriminat))
      console.log(
        `\n=== Discriminació (${cls}, estudis) ===\n` +
          `${row('home/autòcton', p)}\n${row('dona/migrant', d)}`,
      )
      // El privilegi (home/autòcton) acaba, de mediana, amb almenys tant BENESTAR (la
      // mètrica de victòria). No comparem patrimoni: en una classe condemnada (pobra), qui
      // pateix més discriminació mor abans i acumula MENYS deute, cosa que invertiria el
      // signe del patrimoni net (artefacte del moment de la mort, no un avantatge real).
      expect(p.benestarMediana).toBeGreaterThanOrEqual(d.benestarMediana)
    }

    // Invariants (robustos, no de balanceig fi):
    for (const name of Object.keys(POLICIES)) {
      for (const cls of FAMILY_PRESET_ORDER) {
        const s = summaries[name][cls]
        expect(s.benestarMediana).toBeGreaterThanOrEqual(0)
        expect(s.benestarMediana).toBeLessThanOrEqual(100)
      }
      // El ric viu, de mediana, clarament millor que el pobre.
      expect(summaries[name]['rica'].benestarMediana).toBeGreaterThan(
        summaries[name]['pobra'].benestarMediana,
      )
    }
  })
})
