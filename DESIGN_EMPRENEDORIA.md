# Anàlisi de disseny — Emprenedoria (empresa pròpia)

> Feature gran. Aquest document és l'anàlisi PRÈVIA (demanada): tesi, dades, model, balanceig
> objectiu i pla d'implementació. La implementació posterior s'hi ha d'ajustar i validar al harness.

## 1. Tesi de disseny (crítica)

L'èxit empresarial **no és principalment mèrit ni talent**: és la capacitat d'**absorbir el
fracàs** i tornar-ho a provar. La majoria de projectes tanquen als pocs anys. Qui té **capital**
pot fallar moltes vegades i encertar-ne una; qui no, queda **arruïnat al primer fracàs** i no pot
reintentar. És la cara dura del "self-made": *necessites diners per poder arriscar-te als guanys
que paguen*. El joc ho ha de fer SENTIR: l'emprenedoria és una **loteria amb entrada de pagament**
on el ric compra molts bitllets i el pobre, com a molt, un (i sol perdre'l).

Això NO contradiu la resta del joc: és la versió d'alta variància de "el capital genera capital".
La via individual segueix sent rara i cara; la diferència de classe es manté (i s'aguditza).

## 2. Dades reals (per calibrar)

- **Supervivència d'empreses (BLS, EUA):** ~21% tanquen el **1r any**; **~48% als 5 anys**;
  **~65% als 10 anys**. La mortalitat és alta i sostinguda, sobretot els primers anys ("vall de
  la mort").
- **Startups ambicioses / VC:** la xifra popular és **~90% de fracàs** a llarg termini (molt més
  alta que el negoci mitjà perquè busquen creixement, no supervivència).
- **Emprenedors en sèrie:** ~**30%** d'èxit vs ~**18%** dels novells (Harvard) → l'experiència
  prèvia gairebé **dobla** les probabilitats (aprenentatge + xarxa + accés a capital). Els que
  repeteixen en el **mateix sector** encara ho fan ~50% millor.
- **Conclusió de calibratge:** modelarem una mortalitat alta i decreixent amb l'edat de l'empresa
  (vall de la mort), amb l'èxit a llarg termini reservat a qui sobreviu el filtre — i el
  determinant pràctic de "sobreviure el filtre" és poder **reintentar** (capital) i una mica
  d'experiència acumulada.

Fonts: [BLS via Failory](https://www.failory.com/blog/startup-failure-rate),
[Demandsage](https://www.demandsage.com/startup-failure-rate/),
[Harvard via Inc.](https://www.inc.com/elizabeth-macbride/why-repeat-entrepreneurs-succeed.html).

## 3. Model

### Estat `GameState.empresa` (nou)
```ts
interface Empresa {
  capital: number              // mida/salut de l'empresa; creix amb reinversió i beneficis
  empleats: number             // treballadors contractats
  souEmpleats: NivellSouEmpleats
  anys: number                 // anys operant (mortalitat alta els primers)
}
// + GameState.intentsEmpresa: nombre de vegades que has FUNDAT (experiència → learning by doing)
```
(Es manté `souEmpleats`/`dividend` integrant-ho aquí; substitueix el `muntar_negoci` d'un sol cop.)

### Fundar (acció REPETIBLE)
- Disponible a la **carrera**. Hi inverteixes un **capital inicial** dels teus estalvis (tries
  quant; mínim ~10k). Com més capital hi poses, més resistència i potencial (però més perds si cau).
- Incrementa `intentsEmpresa`. La 1a vegada ets novell; cada intent posterior puja una mica
  l'habilitat (aprenentatge), però el factor dominant és poder **tornar-ho a provar**.

### Any d'empresa (a `advanceTurn`, si `empresa` activa)
1. **Roll de SUPERVIVÈNCIA.** `pFracas(anys, habilitat)` alta els primers anys i decreixent:
   any 0-1 ~25-30%, acumulat ~50% als 5 anys, ~70-90% als 10 per a les ambicioses. `habilitat` =
   capital humà (`nivellAcademic`) + contactes (`vincles`) + experiència (`intentsEmpresa`) +
   coixí de capital de l'empresa. Modula a la baixa el fracàs, però **no l'elimina** (sempre hi ha
   atzar: ningú no té l'èxit garantit).
2. **FRACÀS** → l'empresa tanca (`empresa = undefined`), perds el capital invertit, cop de benestar
   i una mica de salut (estrès). Pots **tornar a fundar** si et queda capital → la clau del ric.
3. **SUPERVIVÈNCIA** → l'empresa genera **benefici** = f(capital, empleats, política de sou, sort)
   − cost dels sous dels empleats. El benefici es reparteix segons les teves decisions:
   - **Reinversió** (fracció del benefici que torna al capital de l'empresa → més benefici futur).
   - **El teu sou** (la resta del benefici → al teu ingrés; per definició ≤ benefici).
   - **Sou dels empleats** (precari→molt_alt): menys sou = més benefici per a tu **i menys
     moralitat** (explotació, ja modelada) **i una mica pitjor supervivència/creixement** (gent
     desmotivada, rotació) → trade-off real, no només moral.
4. **Creixement.** El capital reinvertit fa créixer l'empresa; una empresa que **sobreviu la vall
   de la mort i es reinverteix** esdevé consolidada (benefici alt i estable) → la via a la gran
   riquesa. Arribar-hi és rar (filtre de fracàs).

### Decisions (panell `EmpresaPanel`, a la carrera)
- Fundar / tancar voluntàriament.
- **Reinversió vs sou propi** (control 0–100% del benefici).
- **Sou dels empleats** (els 6 nivells existents).
- (Contractar més empleats = una forma de reinvertir en creixement.)

## 4. Balanceig objectiu (validar al harness)

- **Pobre:** o no pot fundar (poc capital) o hi va amb tot → el fracàs (probable) l'**arruïna** i
  no pot reintentar. L'emprenedoria NO és una via d'escapada per a l'origen humil (de fet l'enfonsa
  més sovint). Mediana: pèrdua.
- **Ric:** funda amb una **fracció** del patrimoni, sobreviu a 3-5 fracassos sense ensorrar-se, i
  la cua dels que encerten una empresa consolidada arriba a **grans fortunes**. La riquesa
  entra/surt per la porta del capital, no del talent.
- **Net (EV):** lleugerament **negatiu** per a qui no es pot permetre molts intents; **positiu i de
  cua grossa** per a qui sí. El gradient de classe s'aguditza (gini amunt entre els que ho proven).
- **No-trencar:** no és un *money-printer* automàtic; els fracassos costen diners reals i la
  majoria no arriben a consolidar. Es valida amb un harness que jugui emprenedors de cada classe.

## 5. Pla d'implementació
1. **Domini:** `Empresa` a `types.ts`; constants de balanceig; `engine.ts` (fundar, any d'empresa,
   fracàs/supervivència, repartiment de benefici, integració amb `advanceTurn`/ingrés);
   `intentsEmpresa`. RNG serialitzable (determinista per llavor).
2. **UI:** `EmpresaPanel` a la carrera (fundar, reinversió/sou propi, sou empleats, estat de
   l'empresa) + accions al `GameContext`. i18n.
3. **Tests + harness:** unitats (fundar, fracàs, repartiment) + política de simulació
   `emprenedor` per classe que comprovi la tesi (pobre s'arruïna; ric té cua d'èxit).
4. **Docs:** actualitzar `CLAUDE.md` (substituir la nota del negoci d'un sol cop per la del sistema
   d'empresa) i `DESIGN.md` si cal.

**Invariant:** l'origen segueix manant; l'emprenedoria és una loteria de pagament que el ric pot
jugar moltes vegades i el pobre gairebé mai — la crítica, no una drecera meritocràtica.
