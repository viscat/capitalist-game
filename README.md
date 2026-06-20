# Capitalist Game

Joc per torns sobre la **vida financera d'una persona**, des del naixement fins a
la mort. L'objectiu és posar llum sobre la importància de les finances personals i
sobre com l'origen familiar condiciona el punt de sortida en un món capitalista.

### 🎮 Juga-hi: https://viscat.github.io/capitalist-game/

> Estat actual: **prototip jugable** — fase d'infància (0–12, torns anuals) i
> fase d'adolescència / ESO (12–16, torns trimestrals amb paga i decisions).

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
5. Als **16 anys** acabes l'ESO i arribes al fork **seguir estudiant o treballar**
   (les branques arribaran en una pròxima versió).

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
    engine.ts    # newGame, advanceTurn, applyChoice
    stats.ts     # benestar de referència, estalvi, efectes
    family/      # presets de família
    events/      # catàleg i selecció ponderada d'esdeveniments
  i18n/          # diccionari + provider/hook de traducció
  state/         # GameContext (React) + autosave a localStorage
  components/    # pantalles i UI
```

## Full de ruta (futures iteracions)

Adolescència mensual (12–16), decisions d'estudis (16/18), feina de becari,
emancipació, vida adulta amb pressupostos mensuals/anuals, i esdeveniments adults
(feina, parella, malaltia, inversions). El motor de torns i `LifeStage` ja estan
pensats per encaixar-ho sense reescriure.
