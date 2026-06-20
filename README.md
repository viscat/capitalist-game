# Capitalist Game

Joc per torns sobre la **vida financera d'una persona**, des del naixement fins a
la mort. L'objectiu és posar llum sobre la importància de les finances personals i
sobre com l'origen familiar condiciona el punt de sortida en un món capitalista.

### 🎮 Juga-hi: https://viscat.github.io/capitalist-game/

> Estat actual: **beta 1** — una vida jugable de **0 a 18 anys**: infància (torns
> anuals), adolescència / ESO (trimestral, amb paga i decisions) i la bifurcació
> dels 16 cap a **estudiar o treballar** (estudis trimestrals o vida laboral
> mensual amb pressupost). La vida adulta arribarà més endavant.

## Com funciona aquesta versió

1. Tries una de les **6 famílies** on néixer (pobra, treballadora, mitjana, alta,
   rica, super-rica). Cadascuna defineix patrimoni, ingressos, hores de feina i de
   cura, i si hi ha cuidador contractat.
2. Acompanyes la criatura **any rere any** fins als 12. Cada torn passa el temps,
   la família aporta estalvi i apareix un **esdeveniment** (família, economia,
   regals, salut, escola) que afecta el teu **benestar** i el teu **patrimoni**.
3. Alguns esdeveniments ofereixen una **decisió** (p. ex. estalviar o gastar un
   regal en diners) — la primera llavor del pensament financer.
4. Als **12 anys** entres a l'**institut (ESO)**: els torns passen a ser
   **trimestrals**, comences a rebre una **paga** i cada trimestre tries una
   **acció** (sortir amb amics, ajudar a casa per diners, feina d'estiu, un
   caprici, o un trimestre tranquil). Gestiones activament estalvi vs despesa.
5. Als **16 anys** acabes l'ESO i arribes al fork **seguir estudiant o treballar**.
   Tries entre **batxillerat**, **grau mitjà**, **posar-te a treballar** o **no fer
   res (nini)**. Si estudies, segueixes amb torns trimestrals; si treballes, passes
   a torns mensuals i gestiones un **pressupost** (estalvi, oci, compres i aportació
   obligatòria a casa), amb sou dinàmic, atur i despeses greus que posen a prova el
   matalàs familiar.
6. Als **18 anys** arribes a la majoria d'edat: fi de la beta 1.

### Idea de disseny

El **benestar** (0–100) condensa felicitat / angoixa / tranquil·litat. No depèn
només dels diners: el temps i la cura dels progenitors hi pesen molt, amb
rendiments decreixents per la riquesa. Una família rica amb pares absents pot no
superar una família treballadora molt present.

## Stack

- **React + TypeScript + Vite**
- **Tailwind CSS**
- **Vitest** per als tests
- Lògica de joc **pura** a `src/domain/` (sense React), per poder-la reutilitzar
  més endavant (mòbil, backend...).
- i18n propi i lleuger (`src/i18n/`), català per defecte i preparat per a més
  idiomes.

## Scripts

```bash
npm install      # instal·la dependències
npm run dev      # servidor de desenvolupament (http://localhost:5173)
npm run test     # tests (Vitest)
npm run build    # comprovació de tipus + build de producció
```

## Estructura

```
src/
  domain/        # model i motor del joc (pur, sense React)
    engine.ts    # newGame, advanceTurn, applyChoice, applyMilestoneChoice
    stats.ts     # benestar de referència, paga, sou, pressupost, matalàs familiar
    constants.ts # edats llindar, durada de torns, sou base...
    rng.ts       # RNG determinista i serialitzable (partides reproduïbles)
    actions/     # accions de targeta (fases d'estudi)
    events/      # catàlegs i selecció ponderada d'esdeveniments
    family/      # presets de família
    milestones.ts# fites amb pantalla de decisió (12, 16)
  i18n/          # diccionari + provider/hook de traducció
  state/         # GameContext (React) + autosave a localStorage
  components/    # pantalles i UI
  test/          # setup global de Vitest
```

Per a una visió més profunda de l'arquitectura, el model de joc i com afegir
features, mira **[CLAUDE.md](CLAUDE.md)**.

## Full de ruta (futures iteracions)

Vida adulta a partir dels 18: universitat i emancipació, feina qualificada i
carrera, parella i fills, habitatge (lloguer/hipoteca), inversions i deute, i
esdeveniments adults (salut, atur, imprevistos). El motor de torns i `LifeStage`
ja estan pensats per encaixar-ho sense reescriure (mira [CLAUDE.md](CLAUDE.md)).
