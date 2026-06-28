# Revisió de disseny — Ronda 2 (panel multidisciplinari)

> Coordinació: aquest document recull la revisió del disseny de *Capitalist Game* feta per un
> panel de **game designers**, **game testers** i **activistes** de tres sensibilitats
> (anticapitalista, socialdemòcrata, liberal), i en sintetitza un **pla de millora en 3 fases**.
> És el "nord" de la propera tanda d'iteracions; complementa `DESIGN.md` (la tesi i la "física").

## 0. Estat de partida (dades del harness, 250 llavors/classe)

- **Benestar (mediana):** pobra ~2, treballadora ~7–10, mitjana ~51–65, alta ~63–77, rica ~71–81.
  Les classes baixes tenen `cua≥60 ≈ 0%` i `p10 = 0`.
- **Mobilitat de classe (en quina classe MOREN, per patrimoni net real):** pobra→100% pobra;
  treballadora→~95% pobra; **mitjana només 32–41% es manté** (la resta CAU a pobra); alta ~30%;
  rica ~20%; super-rica ~39–42%. Ascens individual ≈ 0.
- **Causa principal del desajust actual:** sou i pensió **no indexats a l'IPC**, però el cost de
  vida sí → en una vida de ~67 anys l'IPC compon ~2,5–3,5× i **esclafa tothom**; fins i tot les
  classes mitjana/alta moren "pobres" per patrimoni. Això **contradiu la tesi** (§1 de `DESIGN.md`:
  "per al ric, l'estructura el protegeix; només la mala sort li baixa els números").

## 1. Diagnòstic transversal (on coincideixen TOTES les sensibilitats)

1. **La des-indexació ha trencat el balanç i la tesi.** Els sostres `sostreSalari` i
   `PENSIO_MAX_MENSUAL` són **nominals** i s'erosionen en silenci (el topall de 3.000 € de pensió
   val ~1.000 € reals al final). El ric ja no es manté ric "per defecte". *(tester, socialdem., designer)*
2. **Manca de llegibilitat.** El jugador no pot veure PER QUÈ decau (erosió silenciosa de l'IPC vs.
   penalització de classe vs. deute vs. salut). "He jugat bé i moro pobre" es llegeix com un bug.
   *(designer, tester, socialdem.)*
3. **Manca d'agència / fatalisme.** Les classes baixes amb prou feines tenen decisions amb impacte i
   moren joves; el 0% de mobilitat és alhora **poc divertit** (designer), **empíricament exagerat**
   (liberal) i **despolititzador** (anticapitalista: el fatalisme ensenya resignació, no crítica).
4. **`PRECARIETAT_BENESTAR_ADULT` (penalització plana per etiqueta de classe)** viola el principi
   propi del joc (§8.1: "mecanismes, no etiquetes"): cap política ni esforç la pot tocar.
   *(liberal, socialdem., designer)*

## 2. La tensió central i la seva reconciliació

Les tres sensibilitats divergeixen en **com** retornar agència:

- **Liberal:** agència INDIVIDUAL — una cua de mobilitat petita però real (3–5%) via educació
  (desbloquejar el capital humà del salari mínim) i **emprenedoria/risc**; mercats no només predadors.
- **Anticapitalista:** la sortida realista és **COL·LECTIVA** (sindicats, vagues, unions de
  llogateres) i **POLÍTICA** (un estat-món que canvia les regles compartides); fer **visible
  l'explotació** i el propietari com a part d'una relació, no com a "mal temps".
- **Socialdemòcrata:** **l'estat del benestar com a palanca** (capa de règim/època, pensions
  indexables, serveis universals com a coixí, habitatge social) que **mou el sostre**.

**Síntesi (clau de volta):** una **capa de règim politic/benestar** (`regimPolitic`) és terreny
neutral que satisfà els tres: el liberal hi llegeix "serveis finançats per l'impost progressiu ja
modelat" (no hi ha àpat gratis), el socialdemòcrata "la política mou el sostre", i l'anticapitalista
"la degradació és una **elecció política**, no física; l'acció col·lectiva canvia el règim". I la
mobilitat es reconcilia així: **es manté la reproducció de classe com a norma**, però el canvi arriba
per (a) escapada individual **rara**, (b) **acció col·lectiva**, (c) **règim polític** — mai pel sol
fet d'esforçar-se en solitari.

---

## 3. PLA DE MILLORA EN 3 FASES

### FASE 1 — Fonaments: arreglar l'economia trencada i fer-la llegible
*(consens total; màxima prioritat, mínima controvèrsia — cal fer-ho abans de res)*

1. **Arreglar la des-indexació sense perdre l'estancament salarial:**
   - Fer **REALS** els topalls: `sostreSalari` i els topalls de pensió × `factorIPC` (no s'erosionen).
   - Introduir una **deriva salarial real parcial** ajustable (els sous segueixen l'IPC per sota
     del cost de vida → "els sous no segueixen la inflació" sobreviu com a mecanisme **suau**, no com
     a col·lapse) i un `factorRevaloritzacioPensions ∈ [0,1]` (pensió parcialment indexada).
   - **Objectiu de balanç:** ric es manté ric ≥60–70%, alta ≥40–50%, mitjana ≥35%. La mobilitat
     descendent existeix però **no és universal**.
2. **Convertir `PRECARIETAT_BENESTAR_ADULT`** de constant plana per classe a **emergent** (funció del
   deute, la volatilitat i la pobresa de temps) — complir de debò §8.1.
3. **Agència dins la trampa (classes baixes):** decisions de **triatge** cada any dur (què sacrifiques:
   tractament→salut, ajornar deute→compon, recórrer a la família→vincles); **desbloquejar
   parcialment `vinclesSocials`** quan hi ha deute (30%→~60%); garantir ≥1 decisió que mogui el
   resultat cada torn. **Objectiu:** mediana de benestar de la pobra > 0 amb dispersió real (p. ex. 5–18).
4. **Capa de llegibilitat:** desglossament a `GameOver` i a les fites d'edat — components del benestar,
   **ingrés real vs. nominal**, impacte acumulat de l'IPC, bucle "impostos pagats → serveis rebuts".
   Línia per torn "inflació: −X% de poder adquisitiu".
5. **Mètriques noves al harness** (per poder validar tota la resta): % amb deute en morir, % amb
   patrimoni net negatiu, **edat mediana de mort i % que arriben a 67 per classe**, **Gini** del
   patrimoni final, % que arriben a ser propietaris, % amb fills.
6. **Bugs/edge cases:** base i topall de pensió reals; assercions per a anys de **deflació**
   (`IPC_INFLACIO_MIN`/`HABITATGE_VAR_MIN` negatius); el càstig a treballar després dels 50
   (`augmentSou` factorEdat→0,2 + IPC ⇒ sou real a la baixa).

### FASE 2 — Agència i realisme: canals individuals i de mercat
*(lideren liberal i designer; acotats per no esborrar la tesi)*

1. **Desbloquejar el capital humà:** a `salariAdultInicial`, que `bonusAcademic` + `PREMI_DIPLOMA`
   escalin **multiplicativament per damunt** del salari mínim per a pobra/treballadora (amb topall),
   no només apilats sobre el terra. Manté la bretxa via contactes i `sostreSalari` de partida, però
   un graduat pobre passa a ser una escapada **rara però real**.
2. **Formació contínua amb retorn real** a la fase de carrera (ja existeix `inversioFormacio`):
   que alimenti `augmentSou`, `sostreSalari` i `ocupabilitat`, no només la frugalitat.
3. **Camí d'emprenedoria / autònom (nou):** arriscar capital + temps; supervivència ponderada per
   capital humà, contactes i capital inicial (els rics, menys variància de ruïna → es preserva
   l'avantatge de classe); ventall ample de resultats (la majoria fracassen → trampa del deute; una
   cua té èxit **per damunt del sostre**). És **el canal de mobilitat que falta** i alhora manté la tesi.
4. **Cua de mobilitat real del 3–5%** assolible via educació + emprenedoria; **alinear `classeHereu`**
   perquè la cua documentada (§8.4) sigui realment assolible (resoldre la contradicció que el tester
   va detectar entre el benestar-escapada i el mapatge de classe per riquesa).
5. **Senyal de mercat de suma positiva:** alguna probabilitat que invertir / un negoci reeixit /
   acabar la hipoteca generi una guany llegible de "creació de valor", per equilibrar els
   esdeveniments de mercat avui només predadors (manté els cracs i el sobrecost de pobresa).

### FASE 3 — Profunditat estructural i política: acció col·lectiva i estat del benestar
*(lideren anticapitalista i socialdemòcrata; la capa de règim és la clau de volta que reconcilia tothom)*

1. **Capa de règim/època (`regimPolitic` / `RegimBenestar`):** un estat-món que escala un paquet
   (progressivitat de l'IRPF, cobertura i *take-up* de l'IMV, beques, revaloració de pensions, un nou
   `factorServeisPublics`) i **deriva per dècades de calendari** (expansió/retrocés). És la palanca
   que avui falta: converteix l'estat del benestar de **decorat** a **palanca**.
2. **Serveis universals com a coixí (no només transferències):** decommodificar el cost de vida de les
   classes baixes (erosionar el factor de sobrecost de pobresa cap a 1), **topall de despesa sanitària
   de butxaca** (la salut pública esmorteeix el canal de malaltia catastròfica — fa la bretxa
   simètrica), **escola bressol pública** (redueix el cost de criança), i un **tipus d'habitatge
   social** (lloguer topat i protegit de l'IPC). Fa **jugable** que més serveis comprimeixen la bretxa.
3. **Acció col·lectiva (`accioCollectiva` / `poderSindical`):**
   - **Sindicar-se** (acció de carrera): limita la probabilitat d'acomiadament, apuja el sostre
     salarial, guanya indemnització; cost de temps i **risc de represàlia**; **escala amb la
     participació** (en solitari, fracassa).
   - **Vaga** (esdeveniment multi-torn): pèrdua d'ingrés a curt termini per una victòria estructural
     probabilística (terra salarial, o un gir polític).
   - **Unió de llogateres / vaga de lloguer:** fa del propietari una **part contestable** —
     organitzar-se topa el traspàs de l'índex d'habitatge o guanya una congelació; fracassar arrisca
     el desnonament.
   - **Caixa de resistència / ajuda mútua:** un fons comú que substitueix el "matalàs familiar"
     **independentment de l'origen** — la resposta estructural de qui no té herència.
   - L'acció col·lectiva **apuja les probabilitats de girs de règim pro-treball** → lliga l'agència
     col·lectiva amb la capa política (punt 1).
4. **Fer del capital una PART, no "mal temps":** **visibilitat de l'explotació** (valor produït vs.
   sou cobrat), el propietari/llogater com a **relació**, l'empresari que **es beneficia** de
   l'acomiadament; la riquesa de dalt mostrada com a **acumulació/rendes**, no com a mèrit.
5. **Baixes per malaltia i permís parental** (substitució d'ingrés) perquè les classes
   treballadora/pobra puguin formar família sense col·lapse; **registre de redistribució visible**
   (impostos → serveis) a les fites i al `GameOver`.

---

## 4. Notes de coordinació

- **Seqüència:** la Fase 1 és **prerequisit** (sense arreglar la des-indexació i les mètriques, no es
  pot validar res). Les fases 2 i 3 es poden encavalcar, però la **capa de règim** (3.1) val la pena
  prioritzar-la dins la 3 perquè reconcilia les tres sensibilitats i en depèn molta cosa.
- **Innegociable que es manté:** l'origen condiciona el destí com a **norma estadística**; el canvi
  és possible però **car i no garantit** (individual rar, col·lectiu/polític estructural). No tornem a
  la mobilitat fàcil per grind.
- **Cada canvi de balanç es valida amb el harness** (i les mètriques noves de 1.5) contra els
  objectius numèrics, no amb arguments.
- **`PRECARIETAT_BENESTAR_ADULT`**: mantenir-la com a *límit superior sota un règim residual*, però
  que `factorServeisPublics` la pugui erosionar — si no, cap política no pot importar mai (el defecte
  fatal actual).
