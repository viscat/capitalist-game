import { describe, expect, it } from 'vitest'
import { FAMILY_PRESET_ORDER } from '../family/presets'
import {
  type ClassSummary,
  type SimPolicy,
  fraccioSenseAscens,
  simulateClass,
  summarize,
} from './harness'

// Aquest test NO és una asserció de balanceig: és l'INFORME del moderador-tester.
// Imprimeix la distribució d'outcomes als 35 anys per classe i política, per
// comparar-la amb la corba objectiu de DESIGN.md §8.4. Les úniques assercions són
// invariants robustos (benestar dins de rang; el ric viu millor que el pobre).

// Cada partida es juga ara fins a la mort (vides senceres, ~80-90 torns), més costós que
// quan s'acabava als 35; abaixem una mica les llavors i donem marge de temps al test.
const N = 250

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
    `p90 ${String(s.benestarP90).padStart(3)}`,
    `cua≥60 ${pct(s.cuaBenestar60).padStart(6)}`,
    `patr real ${String(s.patrimoniRealMediana).padStart(9)}€`,
    `mort ${String(s.edatMortMediana).padStart(2)}`,
    `67+ ${pct(s.arribaA67).padStart(6)}`,
    `deute ${pct(s.ambDeute).padStart(6)}`,
    `prop ${pct(s.propietari).padStart(6)}`,
    `fills ${pct(s.ambFills).padStart(6)}`,
    `gini ${s.giniPatrimoni.toFixed(2)}`,
  ].join('  ')
}

describe('sim: corba d’outcomes per classe (informe)', () => {
  // Simulació pesada (vides senceres × moltes llavors × classes × polítiques): marge ample.
  it('imprimeix la distribució i compleix invariants bàsics', { timeout: 60_000 }, () => {
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
      // El privilegi (home/autòcton) acaba, de mediana, amb almenys tant BENESTAR (la mètrica de
      // victòria). Tolerància petita: al TERRA de la pobresa (benestar ~5-8) la mediana és sorollosa
      // i una sola tirada pot invertir el signe sense significar res. No comparem patrimoni
      // (artefacte del moment de la mort en una classe condemnada).
      expect(p.benestarMediana).toBeGreaterThanOrEqual(d.benestarMediana - 3)
    }

    // --- Corba de la pobresa: mobilitat de classe (en quina classe MOREN) ---
    // L'objectiu de disseny: l'origen condiciona el destí. Quasi ningú puja de classe; caure sí.
    for (const name of Object.keys(POLICIES)) {
      const lines: string[] = []
      for (const cls of FAMILY_PRESET_ORDER) {
        const s = summaries[name][cls]
        const dist = FAMILY_PRESET_ORDER.map(
          (c) => `${c.slice(0, 4)} ${pct(s.classeFinal[c] / N).padStart(6)}`,
        ).join(' · ')
        lines.push(`${cls.padEnd(14)} sense ascens ${pct(fraccioSenseAscens(s, cls)).padStart(6)} | ${dist}`)
      }
      console.log(`\n=== Mobilitat de classe «${name}» (mor en classe…) ===\n${lines.join('\n')}`)
    }

    // Invariants del nou disseny: CRÍTICA DURA (l'origen pesa moltíssim) PERÒ jugar bé recompensa.
    for (const name of Object.keys(POLICIES)) {
      for (const cls of FAMILY_PRESET_ORDER) {
        const s = summaries[name][cls]
        expect(s.benestarMediana).toBeGreaterThanOrEqual(0)
        expect(s.benestarMediana).toBeLessThanOrEqual(100)
        // SENSE SALTS: en una sola vida es puja com a molt UN graó de classe (mai de pobre a ric).
        const rangOrigen = FAMILY_PRESET_ORDER.indexOf(cls)
        for (let r = rangOrigen + 2; r < FAMILY_PRESET_ORDER.length; r++) {
          expect(s.classeFinal[FAMILY_PRESET_ORDER[r]]).toBe(0)
        }
      }
      // El ric viu, de mediana, clarament millor que el pobre (gradient de classe pronunciat).
      expect(summaries[name]['rica'].benestarMediana).toBeGreaterThan(
        summaries[name]['pobra'].benestarMediana + 30,
      )
      // L'origen segueix predint molt el resultat fins i tot amb bon joc: el pobre, de mediana,
      // ho té molt pitjor que la mitjana (la crítica es manté).
      expect(summaries[name]['mitjana'].benestarMediana).toBeGreaterThan(
        summaries[name]['pobra'].benestarMediana + 20,
      )
    }
    // JUGAR BÉ RECOMPENSA: per a les classes baixes, el millor joc (estudiar a fons) dóna més
    // benestar i més mobilitat que el joc passiu/laboral. "Si el jugues bé, te'n pots sortir."
    for (const cls of ['pobra', 'treballadora'] as const) {
      expect(summaries['estudis_actiu'][cls].benestarMediana).toBeGreaterThan(
        summaries['treball'][cls].benestarMediana,
      )
    }
    // El bon joc obre mobilitat real per al pobre (pot enfilar un graó), però no és automàtic.
    const ascensPobreActiu =
      1 - fraccioSenseAscens(summaries['estudis_actiu']['pobra'], 'pobra')
    expect(ascensPobreActiu).toBeGreaterThan(0.1)
  })

  // Capa de RÈGIM del benestar (Fase 3, clau de volta): la política mou el terra. El mateix
  // pobre PASSIU viu millor sota un estat social fort que sota un de residual, SENSE haver
  // d'estalviar res. És la via NO-individual d'ascens (vegeu DESIGN.md §6 / DESIGN_REVIEW_R2.md).
  it('el règim del benestar aixeca el terra del pobre passiu', { timeout: 60_000 }, () => {
    const passiva: SimPolicy = { postobligatori: 'treball', majoria: 'carrera' }
    const residual = summarize(simulateClass('pobra', N, passiva, undefined, 'residual'))
    const mixt = summarize(simulateClass('pobra', N, passiva, undefined, 'mixt'))
    const social = summarize(
      simulateClass('pobra', N, passiva, undefined, 'socialdemocrata'),
    )
    console.log(
      `\n=== Règim del benestar (pobra, PASSIVA) ===\n` +
        `${row('residual', residual)}\n${row('mixt', mixt)}\n${row('socialdem.', social)}`,
    )
    // Monotonia: més estat social ⇒ millor terra de benestar per al pobre passiu.
    expect(social.benestarMediana).toBeGreaterThan(residual.benestarMediana)
    expect(mixt.benestarMediana).toBeGreaterThanOrEqual(residual.benestarMediana)
    // El salt és material: el règim fort aixeca el pobre passiu de manera notable (≥6 punts),
    // sense estalvi privat (és la palanca col·lectiva, no individual).
    expect(social.benestarMediana).toBeGreaterThanOrEqual(residual.benestarMediana + 6)
  })

  // Acció COL·LECTIVA (Fase 3): sindicar-se i secundar vagues és una via d'ascens COMPARTIDA. El
  // treballador que s'organitza viu millor que el que no ho fa, sense estudis ni negoci (via no
  // individual). Valida que la 3a palanca de la Fase 3 mou de debò la mediana del treballador.
  it('l’acció col·lectiva millora el treballador que s’organitza', { timeout: 60_000 }, () => {
    const soliari: SimPolicy = { postobligatori: 'treball', majoria: 'carrera' }
    const collectiu: SimPolicy = { ...soliari, collectiu: true }
    const sol = summarize(simulateClass('treballadora', N, soliari))
    const org = summarize(simulateClass('treballadora', N, collectiu))
    console.log(
      `\n=== Acció col·lectiva (treballadora) ===\n` +
        `${row('en solitari', sol)}\n${row('organitzat', org)}`,
    )
    // L'acció col·lectiva guanya SEGURETAT MATERIAL (l'efecte propi d'un sindicat): més patrimoni
    // real i no menys benestar. El benestar és enganxós (a prop del sostre de classe), així que el
    // senyal fort és el patrimoni: el conveni i la protecció de la feina capitalitzen amb els anys.
    expect(org.patrimoniRealMediana).toBeGreaterThan(sol.patrimoniRealMediana * 1.15)
    expect(org.benestarMediana).toBeGreaterThanOrEqual(sol.benestarMediana)
  })
})
