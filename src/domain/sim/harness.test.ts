import { describe, expect, it } from 'vitest'
import { HABITATGE_REAL_MAX, HABITATGE_REAL_MIN } from '../constants'
import { FAMILY_PRESET_ORDER } from '../family/presets'
import {
  type ClassSummary,
  type SimPolicy,
  fraccioSenseAscens,
  playoutDynasty,
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
    // El règim fort dóna més benestar i, sobretot, molta més SUPERVIVÈNCIA i seguretat material
    // al pobre passiu (sense estalvi privat: és la via NO-individual). Amb sous ja indexats, el
    // benestar és enganxós (a prop del sostre de classe), així que el senyal fort és arribar als
    // 67 i el patrimoni — la sanitat pública i la xarxa eviten la ruïna i la mort precoç.
    expect(social.benestarMediana).toBeGreaterThanOrEqual(residual.benestarMediana)
    expect(social.arribaA67).toBeGreaterThan(residual.arribaA67 + 0.12)
    expect(social.patrimoniRealMediana).toBeGreaterThan(residual.patrimoniRealMediana)
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

// El joc s'ha de poder jugar moltes generacions sense trencar-se: el cost de la vida i de
// l'habitatge no poden desindexar-se infinitament dels sous (si no, a la 3a generació un lloguer
// val 450k€/mes amb un sou de 3k€ i tothom mor). Aquests tests juguen dinasties llargues i
// comproven que els preus queden ACOTATS i que la vida segueix sent assequible generació rere
// generació (sense col·lapse demogràfic per inflació).
describe('dinastia llarga: el joc no es trenca a moltes generacions', () => {
  const POLITIQUES: [string, SimPolicy][] = [
    ['estudis', { postobligatori: 'batxillerat', majoria: 'universitat' }],
    ['treball', { postobligatori: 'treball', majoria: 'carrera' }],
  ]

  for (const gensObjectiu of [10, 20, 30]) {
    it(
      `arriba a ${gensObjectiu}+ generacions amb preus acotats i vida assequible`,
      { timeout: 60_000 },
      () => {
        // Dinastia FORÇADA (sintetitza hereu si cal) per estressar la maquinària de preus a molt
        // llarg termini, aïllant «exploten els preus?» de la sort reproductiva.
        const dyn = playoutDynasty('mitjana', POLITIQUES[0][1], gensObjectiu, 4242, undefined, true)
        // S'arriba a l'objectiu de generacions sense trencar res.
        expect(dyn.length).toBe(gensObjectiu)

        const ultima = dyn[dyn.length - 1]
        console.log(
          `\n=== Dinastia ${gensObjectiu}+ gen (mitjana, estudis) ===\n` +
            `gens jugades: ${dyn.length} · última gen: IPC ×${(ultima.ipc / 100).toFixed(0)} · ` +
            `habitatge ×${(ultima.indexHabitatge / 100).toFixed(0)} · ratio hab/IPC ${ultima.ratioHabitatge.toFixed(2)} · ` +
            `lloguer hab ${ultima.lloguerHabitacioMensual}€/mes · sou net ${ultima.salariNetMensual}€/mes\n` +
            `edatMort per gen: ${dyn.map((g) => g.edatMort).join(', ')}\n` +
            `benestar per gen: ${dyn.map((g) => g.benestar).join(', ')}`,
        )

        for (const g of dyn) {
          // Cap valor es trenca (ni NaN ni infinit).
          expect(Number.isFinite(g.ipc)).toBe(true)
          expect(Number.isFinite(g.indexHabitatge)).toBe(true)
          expect(Number.isFinite(g.salariNetMensual)).toBe(true)
          // L'habitatge queda ACOTAT relatiu a l'IPC (no es desindexa infinitament).
          expect(g.ratioHabitatge).toBeLessThanOrEqual(HABITATGE_REAL_MAX + 0.05)
          expect(g.ratioHabitatge).toBeGreaterThanOrEqual(HABITATGE_REAL_MIN - 0.05)
          // ASSEQUIBILITAT: una habitació mai no costa més que ~2 mesos de sou net (abans, sense
          // acotar, arribava a valer 150× el sou → tothom moria). Amb sous indexats i habitatge
          // acotat, el lloguer es manté en proporció al sou generació rere generació.
          if (g.salariNetMensual > 0) {
            expect(g.lloguerHabitacioMensual).toBeLessThan(g.salariNetMensual * 2)
          }
        }
        // NO HI HA COL·LAPSE DEMOGRÀFIC: les generacions tardanes segueixen vivint (no tothom mor
        // jove ni amb benestar zero per culpa de la inflació). La 2a meitat de la dinastia manté un
        // benestar i una longevitat raonables.
        const segonaMeitat = dyn.slice(Math.floor(dyn.length / 2))
        const benestarMig =
          segonaMeitat.reduce((s, g) => s + g.benestar, 0) / segonaMeitat.length
        const edatMortMitjana =
          segonaMeitat.reduce((s, g) => s + g.edatMort, 0) / segonaMeitat.length
        expect(benestarMig).toBeGreaterThan(30)
        expect(edatMortMitjana).toBeGreaterThan(60)
      },
    )
  }

  it('a totes les classes i polítiques, la dinastia no s’extingeix per col·lapse de preus', () => {
    // Smoke test ampli: cap combinació classe×política produeix preus no acotats en 15 generacions.
    for (const cls of FAMILY_PRESET_ORDER) {
      for (const [, policy] of POLITIQUES) {
        const dyn = playoutDynasty(cls, policy, 15, 777, undefined, true)
        expect(dyn.length).toBe(15)
        for (const g of dyn) {
          expect(Number.isFinite(g.ipc)).toBe(true)
          expect(g.ratioHabitatge).toBeLessThanOrEqual(HABITATGE_REAL_MAX + 0.05)
          if (g.salariNetMensual > 0) {
            expect(g.lloguerHabitacioMensual).toBeLessThan(g.salariNetMensual * 3)
          }
        }
      }
    }
  })

  it('amb reproducció NATURAL, una dinastia acomodada perdura diverses generacions', () => {
    // Sense forçar: una llar que es reprodueix bé (mitjana, estudis) encadena unes quantes
    // generacions abans d'extingir-se per atzar reproductiu (no per col·lapse de preus).
    let millor = 0
    for (const seed of [1, 7, 42, 100, 2024]) {
      const dyn = playoutDynasty('mitjana', POLITIQUES[0][1], 30, seed)
      millor = Math.max(millor, dyn.length)
      for (const g of dyn) {
        expect(g.ratioHabitatge).toBeLessThanOrEqual(HABITATGE_REAL_MAX + 0.05)
      }
    }
    expect(millor).toBeGreaterThanOrEqual(3)
  })
})
