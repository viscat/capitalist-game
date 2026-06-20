# CLAUDE.md

Guia per treballar en aquest repositori. Llegeix-la abans d'afegir features: explica
l'arquitectura, el model de joc i les receptes per estendre'l sense trencar res.

## Què és

**Capitalist Game** és un joc per torns sobre la **vida financera d'una persona**, des
del naixement fins (de moment) als 18 anys. La tesi de disseny: **l'origen familiar
condiciona el punt de sortida**, però el benestar no es compra només amb diners (el
temps i la cura dels pares hi pesen molt, amb rendiments decreixents per la riquesa).

Idioma del producte i del codi: **català** (comentaris, noms de domini i UI). Si
escrius codi nou, mantén-ho en català per coherència.

## Comandes

Cal Node ≥ 22 (CI fa servir Node 22; el codi i els tests també funcionen amb Node 24+).

```bash
npm install      # dependències
npm run dev      # servidor de desenvolupament (http://localhost:5173)
npm run test     # tests (Vitest, una passada)
npm run test:watch
npm run lint     # ESLint
npm run build    # tsc -b (typecheck) + vite build (producció)
```

Abans de fer commit o obrir PR: **`npm run lint && npm run test && npm run build`**
han de passar (és el que valida la CI a `.github/workflows/ci.yml`).

## Arquitectura

Tres capes amb dependència estrictament unidireccional:

```
domain/  (lògica pura, sense React)  ←  state/ (React Context + autosave)  ←  components/ (UI)
                                          ↑
                                      i18n/ (diccionari + hook de traducció)
```

- **`src/domain/`** — Tot el model i el motor del joc. **Pur**: funcions deterministes,
  sense React, sense `localStorage`, sense `Date.now()` dins de la lògica de torn
  (l'aleatorietat passa per un RNG serialitzable). Això permet provar-ho fàcilment i
  reutilitzar-ho en altres entorns (mòbil, backend) en el futur. **No importis res de
  React ni de `components/` des de `domain/`.**
- **`src/state/GameContext.tsx`** — Únic pont entre el domini i React. Manté el
  `GameState`, exposa accions (`startGame`, `nextTurn`, `choose`, ...) i fa **autosave**
  de l'estat sencer a `localStorage` (la clau és `capitalist-game/save/v1`).
- **`src/components/`** — Pantalles i widgets. No contenen lògica de joc; criden les
  accions del context i mostren l'estat.
- **`src/i18n/`** — i18n propi i lleuger. Català per defecte. Tot el text visible passa
  per claus.
- **`src/lib/format.ts`** — Format d'euros i mapes de benestar→color/etiqueta.

## El bucle de joc (màquina d'estats)

El joc avança per **fases** (`LifeStage`) i s'atura en **fites** (`MilestoneId`) que
obren una pantalla de decisió.

| Fase | Edat | Durada del torn | Què tria el jugador |
|------|------|-----------------|---------------------|
| `infancia` | 0–12 | 1 any | només «Següent any» (decisions puntuals via esdeveniments) |
| `adolescencia` | 12–16 | 1 trimestre | una **acció** de targeta cada torn |
| `estudis_post` | 16–18 (batxillerat / grau mitjà) | 1 trimestre | una **acció** de targeta |
| `laboral` | 16–18 (treball / nini) | 1 mes | ajusta el **pressupost** mensual |

Transicions (fites):
- Als **12** → fita `institut` (una sola opció: continuar) → passa a `adolescencia`.
- Als **16** → fita `postobligatori` (4 opcions) → `estudis_post` (batxillerat/grau_mig)
  o `laboral` (treball/nini), segons l'`Itinerari` triat.
- Als **18** → `acabat = true` → pantalla `GameOver` (la vida adulta arribarà més
  endavant).

Flux d'un torn (`advanceTurn` a `src/domain/engine.ts`):
1. Si hi ha `pendingEvent`, `pendingMilestone` o `acabat`, no avança.
2. Suma els mesos de la fase i fa **derivar el benestar** cap a la seva referència
   d'entorn (`baselineBenestar`) una fracció `DERIVA_BENESTAR` per torn.
3. Aplica el **flux econòmic** de la fase (estalvi anual de la criatura, paga
   trimestral + estipendi, o `applyBudgetMonth` a la fase laboral).
4. Si és fase d'acció i s'ha passat un `actionId`, aplica l'efecte de l'acció.
5. **Selecciona un esdeveniment** ponderat (`selectEvent`) del pool de la fase.
6. Si l'esdeveniment té `choices`, el deixa com a `pendingEvent` i espera
   `applyChoice`. Si no, el resol immediatament (`resolveEvent`).
7. `resolveEvent` aplica efectes, persisteix canvis de sou, escriu al `historial` i
   marca fita/final segons l'edat.

Punts clau perquè res no es bloquegi:
- A les fases d'acció, **sempre hi ha almenys una acció jugable**: si totes queden
  bloquejades, `actionOptions` desbloqueja el «trimestre tranquil».
- Les fites es comproven **dins de `resolveEvent`**, de manera que mai se salten encara
  que el torn que creua el llindar tingui un esdeveniment amb decisió.

## Model de domini (fitxers clau)

- **`types.ts`** — Totes les interfícies. `GameState` és l'estat serialitzable complet.
- **`constants.ts`** — Edats llindar, mesos per fase, sou base, `DERIVA_BENESTAR`, etc.
  Ajusta el *balanceig temporal* aquí.
- **`stats.ts`** — El cor de les regles numèriques: benestar de referència, paga,
  estalvi, sou inicial, matalàs familiar (`resolveDespesaGreu`), pressupost mensual
  (`applyBudgetMonth`), aportació obligatòria a casa, augments de sou. Ajusta el
  *balanceig econòmic i de benestar* aquí.
- **`engine.ts`** — `newGame`, `newGameAt16` (inici ràpid de proves), `advanceTurn`,
  `applyChoice`, `applyMilestoneChoice`, `actionOptions`. El motor; no hi posis
  constants numèriques “màgiques”, deriva-les de `stats.ts`/`constants.ts`.
- **`rng.ts`** — RNG determinista (mulberry32). L'estat és un sol número dins de
  `GameState.rngState`, així les partides són reproduïbles (clau per als tests).
- **`time.ts`** — Conversió mesos↔anys, estacions del curs, i data de calendari.
- **`events/`** — Catàlegs d'esdeveniments per situació + selecció ponderada (`engine.ts`).
- **`actions/adolescencia.ts`** — Accions de targeta de les fases d'estudi.
- **`family/presets.ts`** — Les 6 famílies inicials.
- **`milestones.ts`** — Definició de les fites i les seves opcions.

### Invariants que cal respectar

- **Immutabilitat**: les funcions de domini retornen còpies noves (`applyEffect`,
  `applyBudgetMonth`...). No mutis `person`/`patrimoni`/`state` en lloc.
- **Determinisme**: tota aleatorietat passa pel RNG i actualitza `rngState`. No facis
  servir `Math.random()` dins de la lògica de torn (sí que es pot per a coses no
  jugables com la generació de noms a `identitat.ts`).
- **Sense deute**: els comptes (`efectiu`, `estalvi`, `inversions`) mai baixen de zero;
  el que no es pot pagar es modela com a *descobert* (penalització de benestar via el
  matalàs familiar), no com a saldo negatiu.
- **El benestar sempre 0..100** (`clampBenestar`).

## Model econòmic i de benestar (la “física” del joc)

- **`benestar`** (0..100) és l'única stat. Cada torn gravita cap a una **referència
  d'entorn** (`familyBaselineBenestar` + ajustos d'itinerari/atur). La referència puja
  amb la cura rebuda, la seguretat econòmica i el patrimoni (rendiments decreixents) i
  baixa amb la **precarietat de classe** (penalització explícita per a `pobra` i
  `treballadora`).
- Els esdeveniments i accions empenyen el benestar amunt/avall sobre aquesta deriva.
- **Diners**: durant la infància la família aporta un estalvi anual; a l'adolescència
  hi ha una paga trimestral i accions per ingressar/gastar; a la fase laboral hi ha sou
  (o suport familiar si ets «nini») gestionat amb un **pressupost mensual**.
- **Despeses greus** (`despesaGreu`): passen pel **matalàs familiar** — pagues el que
  pots, la família cobreix fins a un màxim segons el seu patrimoni, i el dèficit restant
  (*descobert*) resta benestar. Aquí és on l'origen es nota més.
- **Aportació obligatòria a casa**: mentre vius a casa i tens sou, una part va a la
  família (més alta com més pobra), respectada pel pressupost per defecte i pel mínim.

Si toques aquests números, els tests de `stats.test.ts` i `engine.test.ts` codifiquen
les **relacions** esperades (p. ex. “més recursos ⇒ més paga”, “les classes baixes ho
tenen més difícil”), no valors exactes. Mantén-les vàlides o actualitza-les amb
intenció.

## Convencions d'i18n

- Tot el text visible es referencia amb una **clau plana amb punts** definida a
  `src/i18n/locales/ca.ts` i es resol amb `t('clau')` o `t('clau', { param })`.
- **Una clau absent no peta**: `translate` retorna la pròpia clau, així que sortiria
  crua a la pantalla. Per evitar-ho, `src/i18n/coverage.test.ts` verifica que tot el
  contingut del joc (esdeveniments, accions, fites i les claus derivades dinàmicament
  com `category.*`, `family.*.name`, `mes.*`, etc.) té traducció. **Afegeix la clau al
  diccionari _i_, si introdueixes una família dinàmica de claus nova, amplia aquest
  test.**
- Interpolació: `{nom}` dins del valor → `t('clau', { nom })`.

## Receptes per afegir features

### Afegir un esdeveniment

1. Tria el pool correcte a `src/domain/events/` (`pool.ts` infància,
   `adolescencia.ts`, `laboral.ts` per a treball/atur/nini/comuns).
2. Afegeix un objecte `GameEvent` amb `id` únic, `category`, `titleKey`/`descKey`,
   `weight(familia)` (probabilitat ponderada pel context) i un `effect` immediat **o**
   `choices` (cada opció amb `effect` o `resolve(state)` per a efectes calculats).
3. Afegeix les claus i18n corresponents a `ca.ts` (títol, descripció i etiquetes
   d'opció). Si fas servir `params`, posa els placeholders al text.
4. `npm run test` — el test de cobertura i18n hauria de passar.

### Afegir una acció (fase d'estudi)

Edita `src/domain/actions/adolescencia.ts`: nou `GameAction` amb `effect` per trimestre.
Si depèn del context (p. ex. només a l'estiu), afegeix `available(state)` i
`lockedReasonKey`. Recorda les claus i18n. El motor ja gestiona el bloqueig per diners
i per benestar de manera genèrica.

### Afegir una família

Afegeix una entrada a `FAMILY_PRESETS` i a `FAMILY_PRESET_ORDER`
(`src/domain/family/presets.ts`), un valor a `FamilyClass` (`types.ts`) i les entrades
a `PRECARIETAT_BENESTAR`/`PRECARIETAT_SALARI`/`FACTOR_APORTACIO` (`stats.ts`, són
`Record<FamilyClass, ...>`, així que el typecheck t'obligarà). Claus i18n `family.<id>.*`.

### Afegir una fase de vida nova (full de ruta: 18+)

El motor ja està pensat per encaixar-ho. Passos típics:
1. Afegeix el valor a `LifeStage` (i `MilestoneId`/`Itinerari` si cal) a `types.ts`.
2. Defineix la durada del torn a `turnMonths` i el flux econòmic dins de `advanceTurn`.
3. Crea el pool d'esdeveniments i, si la fase és d'acció, registra-la a `isActionStage`
   i `eventPool`.
4. Defineix la fita d'entrada a `milestones.ts` i fes que `resolveEvent` la dispari a
   l'edat llindar; gestiona la tria a `applyMilestoneChoice`.
5. Mou el final (`acabat`) a la nova edat màxima (ara `EDAT_FI_POSTOBLIGATORI`).
6. UI: `App.tsx` decideix quina pantalla mostrar; `GameScreen.tsx` tria el panell
   (acció / pressupost / botó simple) segons la fase.

### Afegir un idioma

Duplica `src/i18n/locales/ca.ts`, tradueix els valors, registra'l a `LOCALES` i amplia
`Locale` a `src/i18n/index.tsx`. El `setLocale` ja existeix al context d'i18n.

## Tests

- Vitest amb entorn `jsdom`. Setup global a `src/test/setup.ts` (instal·la un
  `localStorage` en memòria perquè els tests siguin deterministes en qualsevol versió de
  Node — Node 24+ porta un `localStorage` natiu que d'altra manera interferiria).
- `domain/*.test.ts` cobreixen el motor i les regles (incloent-hi **determinisme** per
  llavor i partides completes fins als 18).
- `App.test.tsx` és un smoke test del flux de pantalles.
- `i18n/coverage.test.ts` blinda la cobertura de claus.

## Desplegament

GitHub Pages via `.github/workflows/deploy.yml` (push a `main`). La build serveix sota
`/capitalist-game/` per defecte (vegeu `base` a `vite.config.ts`); en local serveix des
de l'arrel.

El **base path és configurable** amb la variable d'entorn `BASE_PATH`: per autoallotjar
el joc a l'arrel d'un host (Proxmox/LXC, Docker...) construeix amb `BASE_PATH=/ npm run
build`. És una SPA estàtica (estat al `localStorage`), sense backend. Vegeu la secció
**Desplegament → Autoallotjament (Proxmox)** del README, amb `deploy/nginx.conf` i el
`Dockerfile` a punt.

## “Gotchas”

- L'inici ràpid **«Proves: començar als 16»** (`newGameAt16`) salta directament a la
  fita dels 16 amb una mica de capital inicial. És una drecera de proves exposada a la
  UI; tingue-ho present si fas captures o demos.
- `actionOptions` calcula la caixa **prevista** sumant la paga del trimestre però **no**
  l'estipendi de grau mitjà; el bloqueig per diners és conservador (mai et deixa gastar
  de més), no exacte.
- L'autosave persisteix el `GameState` sencer amb clau versionada (`/save/v1`). Si
  canvies l'esquema de manera incompatible, **puja la versió de la clau** a
  `GameContext.tsx` per no carregar partides velles trencades.
