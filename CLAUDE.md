# CLAUDE.md

Guia per treballar en aquest repositori. Llegeix-la abans d'afegir features: explica
l'arquitectura, el model de joc i les receptes per estendre'l sense trencar res.

## Què és

**Capitalist Game** és un joc per torns sobre la **vida financera d'una persona**, des
del naixement fins a la jubilació (67 anys). La tesi de disseny: **l'origen familiar
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

**Tots els torns avancen 1 any** (`turnMonths` sempre retorna `MESOS_PER_ANY`), per
coherència al llarg de tota la vida. El que canvia per fase és **com es genera el flux
econòmic d'aquell any** i què tria el jugador. Els imports (paga, pressupost, sou...)
es **decideixen i es mostren en mensual** però s'apliquen prorratejats a l'any (× 12);
la UI ho fa explícit amb una nota a cada panell.

| Fase | Edat | Què tria el jugador (imports mensuals, torn = 1 any) |
|------|------|------------------------------------------------------|
| `infancia` | 0–12 | només «Següent any» (decisions puntuals via esdeveniments) |
| `adolescencia` | 12–16 | una **acció** de targeta cada any |
| `estudis_post` | 16–18 (batxillerat / grau mitjà) | una **acció** de targeta cada any |
| `laboral` | 16–18 (treball / nini) | ajusta el **pressupost** mensual (s'aplica × 12) |
| `universitat` | 18–22 | només «Següent any» (suport familiar − matrícula) |
| `carrera` | 18/22–**67** | ajusta el **pla d'inversió** (mensual; s'aplica × 12) |
| `jubilacio` | **67–mort** | pla d'inversió/estalvi vivint de la **pensió** (sense sou) |

Transicions (fites):
- Als **12** → fita `institut` (una sola opció: continuar) → passa a `adolescencia`.
- Als **16** → fita `postobligatori` (4 opcions) → `estudis_post` (batxillerat/grau_mig)
  o `laboral` (treball/nini), segons l'`Itinerari` triat.
- Als **18** → fita `majoria` (2 opcions) → `universitat` o `carrera` (vida laboral
  adulta amb inversions). Qui entra directament a `carrera` ho fa **sense títol**.
- Als **22** → fita `fi_uni` (una sola opció) → `carrera` **amb títol** (`teDiploma`),
  que dóna un premi de sou.
- Als **40 / 50 / 60** → fites de **mitja carrera** (`cruilla_40`, `revisio_50`, `recta_60`):
  **no canvien de fase** (segueix `carrera`), apliquen un `EventEffect` de *trade-off*
  (sou ↔ benestar/vincles/salut). Es disparen **exactament en creuar el llindar** (vegeu
  `resolveEvent`), una sola vegada. La tria s'aplica a `applyMilestoneChoice` (camp
  `MilestoneOption.effect`).
- Als **67** → fita `jubilacio` → fase **`jubilacio`**: deixes de treballar i vius de la
  **pensió pública** (`pensioPublicaAnual`) i els estalvis/inversions. **La partida NO
  s'acaba** (la vida continua fins a la mort). `jubilat = true`, `salari = 0`.
- **Parella**: cal tenir **parella estable** (`state.parella`, amb nom) abans de tenir fills.
  Pot sortir l'esdeveniment `coneixer_parella` (`PARELLA_EVENTS`, `effect.marcaParella`) mentre no
  en tens; el motor li assigna un nom determinista (`nomPerSeed`). Viure en parella **reparteix** el
  cost de vida + l'habitatge entre els dos (`FACTOR_DESPESA_PARELLA`), en qualsevol habitatge.
- **Descendència**: dins de la **finestra fèrtil** (26–42), **amb parella** i fins a `MAX_FILLS`,
  pot sortir l'esdeveniment `tenir_fill` (decisió). Un fill dóna benestar i vincles, però afegeix un
  **cost de criança net** anual (`costFillsAnual` = cost − prestació pública `ajutFillsAnual`)
  a les necessitats de la carrera mentre és dependent (~22 anys). Cada fill té **nom** (`fillsNoms`) i
  **edat** visible (de `fillsNaixement`); amb fills dependents surten `FILLS_EVENTS` (alegries +benestar
  i ensurts −benestar). El `FamiliaPanel` (calaix de detalls) mostra parella i fills (nom + edat); el
  `GameOver` mostra els fills i el **llegat per fill** (`llegatPerFill`). Vegeu DESIGN.md §8.9.
- **IPC (inflació)**: `GameState.ipc` (base 100 al naixement) creix cada any amb una inflació
  (`inflacioAnual`, ~0,5–5%) DETERMINISTA a partir del RNG però **sense consumir-lo** (no altera
  la seqüència d'esdeveniments). A la **carrera/jubilació**, l'IPC encareix en NOMINAL l'**ingrés**,
  el **cost de vida**, la **criança dels fills** (`costFillsAnual`) i l'**habitatge** (preus de
  compra i ofertes de lloguer): tot creix plegat, així el balanceig REAL es manté. El **benestar**
  es calcula en termes REALS: les funcions que comparen diners amb llindars absoluts es desinflen
  per `factorIPC` (patrimoni i deute a `adultBaselineBenestar`, descobert a `applyCareerYear`, i les
  xarxes d'ajut a `repartDeficit`/`ajutPublicMax` via el paràmetre `factorIPCActual`). Es desa a
  `vidaHist` i es dibuixa (amb stats i patrimoni net) a `LifeCharts`, que surt a cada **fita d'edat**
  (`MilestoneScreen`) i al `GameOver`. La dinastia hereta l'IPC del món (els preus no es reinicien).
  El **jugador simulat** (harness) reajusta el pla d'inversió cada any a l'ingrés nominal (com qui
  apuja la despesa amb la inflació); sense fer-ho, l'oci/estalvi fixats s'erosionarien.
- **MORT = l'únic final.** A qualsevol edat, si la `salut` arriba a **0** → `acabat = true` +
  `mort = true`. La salut (stat `Stats.salut`, 0..100) es degrada amb l'**edat**
  (`declividSalutAnual`, calibrada a l'esperança de vida ~84 per a un sa; un sa mor de vellesa,
  un precari molt abans), amb el **benestar baix** (estrès/precarietat) i amb els
  **esdeveniments de salut** (`EventEffect.salutDelta`; les malalties no pagades —descobert
  d'una despesa `category:'salut'`— fan mal extra). Acoblament bidireccional: salut baixa
  rebaixa el benestar (`benestarPerSalut`). El **progrés mèdic** (`factorEsperancaVida`) allarga
  la vida en èpoques futures → les generacions posteriors viuen més.
- **Dinastia (herència + continuació).** En morir amb fills, el `GameOver` ofereix
  **continuar amb un descendent** (`continuaGeneracio`): comença una vida nova des del
  naixement en una llar la riquesa de la qual és l'**herència per fill** (`llegatPerFill` =
  estate net amb successions + herència en vida, repartit). La classe de la nova llar surt de
  `classeHereu(origen, llegatReal)`: **inèrcia de classe MOLT forta** (reproducció social). Pots
  CAURE lliurement, però PUJAR és gairebé impossible —com a molt un graó i només amb una fortuna
  real extraordinària (`LLINDAR_ASCENS_CLASSE`)—. El `llegat` es **desinfla per l'IPC** abans de
  mapar-lo (la inflació no puja de classe). Objectiu de disseny (DESIGN §8.4, verificat al harness
  amb `fraccioSenseAscens`): qui neix pobre mor pobre ~100%; treballador → treballador o pobre; etc.
  L'**herència en vida** (event `herencia_en_vida` → `EventEffect.llegatEnVidaDelta`) transfereix
  patrimoni als fills mentre vius (lliure de successions; acumulat a `GameState.llegatEnVida`).
  En **continuar el llinatge**, l'herència es reparteix en tres: (1) l'**herència en vida** la
  rep l'hereu d'entrada (patrimoni inicial: els regals que va rebre de petit); (2) l'**estat
  líquid** a la mort (net de successions) i (3) les **cases** (s'hereten com a propietat) es
  difereixen a `herenciaPendent` i arriben a l'edat de la mort del progenitor (`EventEffect.heretaCases`).
- **Habitatge: múltiples cases.** Es pot comprar **més d'una casa** (`comprarCasa` no bloqueja si ja
  ets propietari): les hipoteques es **combinen** en una de sola (deute i quota sumats) i el banc
  mira el límit d'endeutament sobre el **total** de quotes. El preu de compra i el lloguer segueixen
  l'**índex d'habitatge** (`factorHabitatge`/`indexHabitatge`), NO l'IPC.
- **Règim del benestar (capa POLÍTICA, Fase 3).** `GameState.regimPolitic` (`residual` | `mixt` |
  `socialdemocrata`, es tria a la creació del personatge i és propietat del MÓN —la dinastia
  l'hereta—) escala `factorServeisPublics(state)` (`FACTOR_SERVEIS_PUBLICS`). Aquest factor és la
  via d'ascens **NO individual**: (1) **erosiona el residu** de `precarietatAdulta` fins a
  `PRECARIETAT_EROSIO_SERVEIS` (un estat fort abaixa la precarietat estructural per a tothom, sense
  estalvi privat) i (2) **eixampla la xarxa pública** `ajutPublicMax` (llindars i cobertura més
  alts). Es propaga a `applyCareerYear`/`applyBudgetYear` via paràmetre `factorServeis`. Validat al
  harness (`simulateClass(..., regimPolitic)`): el pobre PASSIU puja de benestar ~8→16 i la
  supervivència als 67 quasi es triplica només canviant de règim. Missatge: les regles són
  contingents (política), no naturals.

Flux d'un torn (`advanceTurn` a `src/domain/engine.ts`):
1. Si hi ha `pendingEvent`, `pendingMilestone` o `acabat`, no avança.
2. Suma els 12 mesos de l'any i fa **derivar el benestar** cap a la seva referència
   d'entorn (`baselineBenestar`) una fracció `DERIVA_BENESTAR` per torn.
3. Aplica el **flux econòmic** de l'any (estalvi anual de la criatura; paga + estipendi
   mensuals × 12; `applyBudgetYear` a la fase laboral; `applyCareerYear` a la carrera).
4. Si és fase d'acció i s'ha passat un `actionId`, aplica l'efecte de l'acció.
5. **Selecciona un esdeveniment** ponderat (`selectEvent`) del pool de la fase.
6. Si l'esdeveniment té `choices`, el deixa com a `pendingEvent` i espera
   `applyChoice`. Si no, el resol immediatament (`resolveEvent`).
7. `resolveEvent` aplica efectes, persisteix canvis de sou (amb **sostre salarial**),
   escriu al `historial` i marca fita/final. **Si la `salut` ha arribat a 0**, acaba la
   partida com a **mort** (`acabat` + `mort`); si no, comprova la **jubilació als 67**
   (`acabat` + `jubilat`) i les fites del llindar (incloses 40/50/60).

Punts clau perquè res no es bloquegi:
- A les fases d'acció, **sempre hi ha almenys una acció jugable**: si totes queden
  bloquejades, `actionOptions` desbloqueja l'«any tranquil».
- Les fites es comproven **dins de `resolveEvent`**, de manera que mai se salten encara
  que el torn que creua el llindar tingui un esdeveniment amb decisió.

## Model de domini (fitxers clau)

- **`types.ts`** — Totes les interfícies. `GameState` és l'estat serialitzable complet.
- **`constants.ts`** — Edats llindar, mesos per fase, sou base, `DERIVA_BENESTAR`, etc.
  Ajusta el *balanceig temporal* aquí.
- **`stats.ts`** — El cor de les regles numèriques: benestar de referència, paga,
  estalvi, sou inicial, matalàs familiar (`resolveDespesaGreu`), pressupost mensual
  aplicat a l'any (`applyBudgetYear`), aportació obligatòria a casa, augments de sou.
  Ajusta el *balanceig econòmic i de benestar* aquí.
- **`engine.ts`** — `newGame`, `newGameAt16` (inici ràpid de proves), `advanceTurn`,
  `applyChoice`, `applyMilestoneChoice`, `actionOptions`. El motor; no hi posis
  constants numèriques “màgiques”, deriva-les de `stats.ts`/`constants.ts`.
- **`rng.ts`** — RNG determinista (mulberry32). L'estat és un sol número dins de
  `GameState.rngState`, així les partides són reproduïbles (clau per als tests).
- **`time.ts`** — Conversió mesos↔anys i data de calendari.
- **`events/`** — Catàlegs d'esdeveniments per situació + selecció ponderada (`engine.ts`).
- **`jobs.ts`** — Cerca de feina a la vida adulta: ocupabilitat i generació d'ofertes.
- **`actions/adolescencia.ts`** — Accions de targeta de les fases d'estudi.
- **`family/presets.ts`** — Les 6 famílies inicials.
- **`milestones.ts`** — Definició de les fites i les seves opcions.

### Invariants que cal respectar

- **Immutabilitat**: les funcions de domini retornen còpies noves (`applyEffect`,
  `applyBudgetYear`...). No mutis `person`/`patrimoni`/`state` en lloc.
- **Determinisme**: tota aleatorietat passa pel RNG i actualitza `rngState`. No facis
  servir `Math.random()` dins de la lògica de torn (sí que es pot per a coses no
  jugables com la generació de noms a `identitat.ts`).
- **Comptes mai negatius**: `efectiu` i `inversions` mai baixen de zero. El **deute** sí que es modela, però com una **línia
  pròpia i positiva** (`patrimoni.deute`, l'import que es deu): a la **carrera**, el dèficit
  que ni els estalvis ni el matalàs familiar cobreixen es converteix en deute que **compon**
  (`INTERES_DEUTE`), **bloqueja la inversió** fins extingir-se i té un sostre (~2,5× ingrés;
  l'excés és descobert puntual). `patrimoniTotal` el resta, així que el patrimoni net pot ser
  negatiu. És la trampa estructural de la pobresa (vegeu DESIGN.md §8). A les fases prèvies
  (infància, laboral) el que no es pot pagar encara es modela com a *descobert* puntual
  (`penalitzacioDescobert`), no com a deute acumulat.
- **El benestar sempre 0..100** (`clampBenestar`). Arribar a 0 ja **no** mata, però erosiona
  ràpidament la salut.
- **La salut sempre 0..100** (`clampSalut`). **Arribar a 0 = mort** (fi de partida a qualsevol
  edat). És el pool de mortalitat: edat + benestar baix + malalties.

## Model econòmic i de benestar (la “física” del joc)

- **`benestar`** (0..100) és la stat de **qualitat de vida** (com es viu). Cada torn gravita
  cap a una **referència d'entorn** (`familyBaselineBenestar` + ajustos d'itinerari/atur). La
  referència puja amb la cura rebuda, la seguretat econòmica i el patrimoni (rendiments
  decreixents) i baixa amb la **precarietat de classe** (penalització explícita per a `pobra`
  i `treballadora`) i amb la **salut baixa** (`benestarPerSalut`).
- **`salut`** (0..100) és la stat de **mortalitat** (quant es viu): es degrada amb l'edat, el
  benestar baix i les malalties; a 0, la persona mor. Benestar i salut s'acoblen: la
  precarietat (benestar baix) escurça la vida, i la malaltia (salut baixa) deprimeix.
- Els esdeveniments i accions empenyen el benestar amunt/avall sobre aquesta deriva.
- **Diners**: durant la infància la família aporta un estalvi anual; a l'adolescència
  hi ha una paga trimestral i accions per ingressar/gastar; a la fase laboral hi ha sou
  (o suport familiar si ets «nini») gestionat amb un **pressupost mensual**.
- **Despeses greus** (`despesaGreu`): passen pel **matalàs familiar** — pagues el que
  pots, la família cobreix fins a un màxim segons el seu patrimoni, i el dèficit restant
  (*descobert*) resta benestar. Aquí és on l'origen es nota més.
- **Pressupost/pla amb dèficit**: tant `applyBudgetYear` (laboral) com `applyCareerYear`
  (carrera) admeten **gastar per sobre de l'ingrés**. Les necessitats de l'any (cost de
  vida + habitatge + oci) es paguen de l'ingrés i, si no arriba, dels **estalvis propis**
  (efectiu + venent inversions) → **xarxa familiar** (`repartDeficit` / `ajutFamiliarMax`) →
  **descobert** (`penalitzacioDescobert`, resta benestar). Les aportacions a inversió
  només es fan si sobra (mai a crèdit). La UI mostra el **Balanç del mes** (pot ser
  negatiu = «tires d'estalvis») i, si escau, el descobert amb els punts de benestar que
  costa. El topall dels botons és ingrés + estalvis propis.
- **Aportació obligatòria a casa**: mentre vius a casa i tens sou, una part va a la
  família (més alta com més pobra), respectada pel pressupost per defecte i pel mínim.

Si toques aquests números, els tests de `stats.test.ts` i `engine.test.ts` codifiquen
les **relacions** esperades (p. ex. “més recursos ⇒ més paga”, “les classes baixes ho
tenen més difícil”), no valors exactes. Mantén-les vàlides o actualitza-les amb
intenció.

### Cerca de feina (entrada a la vida adulta i atur)

Entrar a `carrera` (als 18 o 22) **no et regala feina**: hi entres **a l'atur**
(`salari = 0`) i has de **buscar-la**. No s'afegeix cap `LifeStage`: l'estat de cerca
és `carrera` + `salari 0` + `state.ofertesFeina` (el motor ja tractava `carrera` amb
`salari 0` com a atur per a `eventPool` i `adultBaselineBenestar`).

- **`domain/jobs.ts`** — `ocupabilitat(state)` (0..1) a partir d'estudis (`teDiploma`/
  itinerari), contactes (patrimoni de la família), **experiència** (`anysExperiencia`),
  ànim i una petita penalització per edat; `salariBaseOferta` (sou de partida millorat
  per experiència); `generaOfertes(state, rngState)` deterministe (sempre ≥1 oferta ⇒
  mai bloqueja; més ocupabilitat ⇒ més ofertes i millors).
- **Helper `ambOfertes`** (`engine.ts`) centralitza-ho: si acabes un torn a `carrera`
  sense sou, (re)genera ofertes; amb sou, les esborra. Es crida des d'`applyMilestoneChoice`
  (entrada), `resolveEvent` (acomiadament a mig camí) i — via aquests — cada any de cerca.
- **`acceptarOferta(state, id)`** fixa el sou i el pla d'inversió i **no** consumeix el
  torn; «Segueix buscant» (`advanceTurn`) sí: passa un any (gastes estalvis, baixa
  l'ànim) i regenera ofertes. L'atur ja no dóna feina per esdeveniment aleatori
  (`ATUR_ADULT_EVENTS` només són color: subsidi i desànim).
- **Experiència**: `advanceTurn` suma `anysExperiencia` cada any amb sou (carrera o
  feina dels 16-18). UI: `components/JobSearchPanel.tsx`.

### Inversions (fase de carrera, el missatge financer)

A `carrera`, cada any el jugador reparteix els seus diners amb un **pla** (`PlaInversio`: només
**oci** i **inversió**) i la cartera invertida **compon** any rere any (`applyCareerYear`,
`creixementInversions` a `stats.ts`). El model és deliberadament SIMPLE: un sol vehicle.

- **inversió** (`Patrimoni.inversions`) — l'únic vehicle d'estalvi/inversió (no hi ha ni compte
  d'estalvi ni pla de pensions). Rendiment esperat alt però **volàtil**: cada any es sorteja amb
  el RNG (`rendimentIndexAnual`, mitjana ≈ +6%, pot ser negatiu) i, a més, hi ha xocs de mercat
  puntuals (`EventEffect.mercatPct`, p. ex. un crac −28%). És **líquid**: es ven per comprar
  habitatge o cobrir dèficits. Missatge: a llarg termini compon, però cal aguantar els sotracs.
- **efectiu** — caixa líquida sense rendiment (el sobrant del torn hi va a parar).
- Ordre del torn: creix la cartera → ingressa el sou → cost de vida obligatori → aportació a
  inversió (si sobra) → el sobrant va a efectiu (mai negatiu).

L'origen segueix pesant: més patrimoni i el **títol universitari** (`teDiploma`) donen
un sou inicial més alt (`salariAdultInicial`), i més sou ⇒ més capacitat d'inversió ⇒
més interès compost. Si es perd la feina (sou 0), el pool passa a `ATUR_ADULT_EVENTS`
(recuperació), perquè un acomiadament no condemni la partida.

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

Edita `src/domain/actions/adolescencia.ts`: nou `GameAction` amb `effect` puntual de
l'any (cada acció representa la decisió destacada d'aquell any, no un import recurrent).
Si depèn del context, afegeix `available(state)` i `lockedReasonKey`. Recorda les claus
i18n. El motor ja gestiona el bloqueig per diners i per benestar de manera genèrica.

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
- `domain/sim/harness.ts` + `harness.test.ts` són el **harness de simulació**: juguen
  centenars de partides completes (0→67) per classe i n'imprimeixen la distribució
  d'outcomes (benestar/patrimoni a la jubilació). És l'eina per validar la **corba objectiu** de
  DESIGN.md §8.4 amb dades, no amb arguments, en tocar el balanceig de `stats.ts`. El
  jugador simulat és **passiu** per defecte (no tria accions); la política amb `actiu:
  true` (p. ex. `estudis_actiu`) fa que estudiï a fons a la universitat (`uni_estudis`),
  que és **la via d'escapada** per mesurar la cua de mobilitat del pobre (§8.4). Sense
  joc actiu, l'origen humil queda condemnat.

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
- `actionOptions` calcula la caixa **prevista** sumant la paga de l'any (paga mensual
  × 12) però **no** l'estipendi de grau mitjà; el bloqueig per diners és conservador
  (mai et deixa gastar de més), no exacte.
- L'autosave persisteix el `GameState` sencer amb clau versionada (`/save/vN`). Si
  canvies l'esquema de manera incompatible, **puja la versió de la clau** a
  `GameContext.tsx` per no carregar partides velles trencades.
