# DESIGN.md — La tesi del joc i la seva «física»

Aquest document recull **la intenció de disseny i la posició política** de *Capitalist
Game*, i com es tradueix en regles numèriques concretes. No descriu l'arquitectura del
codi (això és a [CLAUDE.md](CLAUDE.md)); descriu **per què el joc funciona com funciona**
i **quines afirmacions sobre el món fa cada mecànica**.

Està escrit, expressament, perquè es pugui **criticar**. Cada decisió de modelat
s'enuncia com una **afirmació discutible**, amb els paràmetres reals al costat
(`fitxer.ts`), perquè qualsevol revisió — des de qualsevol mirada política o econòmica —
sàpiga exactament què s'està afirmant i on tocar-ho.

---

## 1. La tesi

> **L'origen familiar condiciona el punt de sortida en un món capitalista, però el
> benestar d'una vida no es compra només amb diners: el temps i la cura hi pesen tant
> com els recursos, i la riquesa té rendiments decreixents sobre la felicitat.**

D'aquí se'n deriven dues afirmacions polítiques que el joc sosté simultàniament — i que
estan en tensió:

1. **Afirmació estructural (forta, gairebé determinista):** la classe d'origen no és
   només un punt de partida en diners; imposa una **penalització persistent i
   pràcticament inescapable** (estrès, inestabilitat, menys contactes, pitjors primeres
   feines, càrrega familiar) que marca tota la vida. **Per a la classe pobra, l'esforç
   amb prou feines mou l'agulla**: la mobilitat ascendent existeix com a *cua
   estadística minúscula*, no com a norma ni com a promesa. Per a les classes riques,
   l'estructura **protegeix** fins al punt que només la mala sort (malaltia greu, crac)
   amenaça els seus números.
2. **Afirmació post-materialista:** per sobre d'un cert llindar, més diners aporten poc
   benestar; el temps de cura, la seguretat i el propòsit n'aporten molt. Una família
   treballadora present pot criar una vida més plena que una família rica absent.

El joc **no és neutral**: ha triat modelar el món d'una manera que fa aquestes dues
afirmacions visibles i jugables. Tot aquest document és la llista d'on, com i amb quina
força ho fa.

> **Nota sobre el grau de determinisme.** Una versió anterior d'aquesta tesi deia que «la
> mobilitat existeix però rema a contracorrent» i que «no és fatalisme absolut». La
> direcció de disseny actual és **més dura i deliberada**: per al pobre, gairebé
> fatalisme; per al ric, gairebé immunitat tret de l'atzar. Això és una **posició de
> disseny escollida**, no un descuit — i la corba de la secció següent és la seva forma
> mesurable. La feina del moderador (perfil 6) és que la física sostingui aquesta corba
> **sense fer el joc injugable ni deshonest**.

### La corba d'outcomes objectiu (el nord del balanceig)

Com que el domini és **pur i determinista** (RNG serialitzable), es poden simular moltes
partides per llavor i classe i **mesurar** la distribució real d'outcomes als 35 anys.
Aquesta taula és l'**objectiu de balanceig**: el que la física *hauria* de produir, i el
patró que tota revisió (i el moderador) ha de fer complir.

| Classe | Patrimoni als 35 (joc típic) | Sostre de benestar | Paper de l'atzar |
|--------|------------------------------|--------------------|------------------|
| **pobra** | ≈ 0 / negligible, **fins i tot jugant bé** | **≤ 20/100** com a màxim absolut | només pot **empitjorar** |
| treballadora | escàs i fràgil | moderat | empitjora més que millora |
| mitjana | acumula si juga bé | franja mitjana | l'agència compta |
| alta | s'acomoda | alt | l'agència compta poc |
| **rica / super-rica** | creix **gairebé sempre** | alt per defecte | **només la mala sort** (malaltia, crac) baixa els números |

> **Lectura:** la **sort té signe oposat segons la classe**. Per al pobre, l'estructura
> domina i l'atzar dolent només afegeix dany; per al ric, l'estructura protegeix i només
> l'atzar dolent obre escletxes. Aquesta asimetria *és* la tesi.

> **Matís (refinat per la revisió crítica, vegeu §8.4):** «gairebé impossible» **no** vol
> dir «impossible». Hi ha una **cua de mobilitat de ~3–5%** (verificable per simulació
> multi-llavor), escapada *amb cicatrius* (benestar terminal acotat, no la vida «resolta»
> del ric) i sobretot per la via de l'**educació pública**. A més, el joc reconeix una
> **victòria no-monetària** (arribar als 35 amb poc patrimoni però temps, vincles, salut i
> sentit) amb la mateixa dignitat que el patrimoni alt.

> **Estat actual vs objectiu (gap conegut).** La física vigent **encara no compleix**
> aquesta corba: el benestar de referència del pobre avui surt ≈ **40/100** a la infància
> i ≈ **49/100** a la vida adulta (`familyBaselineBenestar` / `adultBaselineBenestar`),
> molt per sobre del sostre de 20. I la caiguda del ric per mala sort és poc pronunciada
> (no hi ha malalties greus de llarga durada; els cracs només toquen el fons indexat).
> Tancar aquest gap és l'objectiu principal de la revisió.

> **Restricció de jugabilitat (no negociable).** «Gairebé impossible» **no** vol dir
> «avorrit» ni «sense decisions». El pobre ha de tenir **eleccions amb sentit dins del
> seu sostre baix** (què sacrifica, a qui ajuda, com aguanta un cop), de manera que la
> partida sigui *dura i significativa*, no una derrota passiva. Si una palanca acosta la
> corba però mata la jugabilitat, no s'aplica tal qual.

---

## 2. El benestar és l'única mètrica de «victòria»

No es guanya per diners. L'única stat és **`benestar` (0..100)** — felicitat, angoixa i
tranquil·litat condensades en un número. Els diners són **instrumentals**: importen
només en la mesura que compren seguretat, eviten descoberts i, amb rendiments
decreixents, una mica de confort.

> **Afirmació:** el sentit d'una vida financera es mesura en benestar, no en patrimoni.
> El patrimoni que no es tradueix en benestar (riquesa acumulada sense temps ni
> seguretat) val, a efectes del joc, ben poc.

**Mecànica de la deriva** (`engine.ts`, `DERIVA_BENESTAR = 0.25`): cada any el benestar
gravita un 25% cap a una **referència d'entorn** (`baselineBenestar`). Els esdeveniments
i decisions empenyen per sobre o per sota, però l'entorn t'hi torna a arrossegar. És el
mecanisme central que fa que **l'estructura pesi més que les decisions puntuals**: pots
tenir un bon any, però si el teu entorn de referència és baix, hi tornes.

> **Punt de crítica obert:** un 25% de deriva fa que l'agència individual sigui
> relativament feble davant l'estructura. És una decisió política (l'estructura mana).
> Pujar-lo donaria més pes a les decisions del jugador (lectura més «meritocràtica»);
> baixar-lo, més determinisme de classe.

---

## 3. El benestar de referència: la fórmula on viu la ideologia

`familyBaselineBenestar` (`stats.ts`) durant la infància i adolescència:

```
baseline = 28
         + cura      × 24   // careScore: hores de cura / 45, amb cuidador = +15h
         + seguretat × 30   // econSecurity: ingressos mensuals / 4500
         + patrimoni ×  8   // wealthComfort: patrimoni / 800.000 (saturat)
         − PRECARIETAT_BENESTAR[classe]
```

Cada coeficient és una **afirmació quantitativa**:

| Component | Pes | Què afirma |
|-----------|-----|------------|
| Cura | **24** | El temps dels pares importa gairebé tant com la seguretat econòmica. |
| Seguretat econòmica | **30** | Tenir els ingressos coberts és el factor individual més important. |
| Comoditat per patrimoni | **8** (saturat a 800k€) | La riquesa pura aporta poc i **satura**: de 800k€ a 30M€ no canvia res. |
| Precarietat de classe | **−14 / −8 / 0** | Ser pobre resta benestar *més enllà* del que expliquen els ingressos. |

**`PRECARIETAT_BENESTAR`** (`stats.ts`): `pobra: 14`, `treballadora: 8`, la resta `0`.

> **Afirmació clau (i la més carregada políticament):** la pobresa fa mal *per si
> mateixa*, no només per la manca de diners. Encara que dos llars tinguessin els
> mateixos ingressos i cura, la d'origen pobre arrencaria 14 punts per sota per l'estrès,
> la inestabilitat i la manca d'oportunitats que la classe arrossega.

> **Punts de crítica oberts:**
> - Una mirada liberal podria objectar que aquesta penalització **fixa per classe** és
>   double-counting: si els ingressos i el patrimoni ja són baixos, ¿per què castigar
>   *altre cop* per l'etiqueta de classe? El joc respon: perquè la classe captura coses
>   que ingressos+patrimoni no (xarxa, expectatives, estabilitat), però és una decisió
>   discutible.
> - La cura es **satura a 45h** i el cuidador contractat compta com +15h «que compensa
>   però no del tot». ¿És realista que un cuidador pagat substitueixi la cura parental en
>   un terç? Una mirada conservadora-familiarista i una de mercat hi discreparien.
> - La comoditat per patrimoni satura a 800k€. ¿La riquesa extrema (30M€) de debò no
>   aporta *cap* benestar addicional via seguretat radical? Decisió post-materialista
>   forta.

**Disseny dels presets de família** (`family/presets.ts`) — fet expressament perquè la
tensia central sigui jugable: **com més rica la família, menys hores de cura.**

| Família | Patrimoni | Ingressos/mes | Hores cura | Cuidador |
|---------|-----------|---------------|------------|----------|
| pobra | 2.000 € | 1.100 € | 35 | no |
| treballadora | 15.000 € | 2.200 € | 30 | no |
| mitjana | 80.000 € | 3.800 € | 28 | no |
| alta | 350.000 € | 7.000 € | 18 | sí |
| rica | 2.000.000 € | 15.000 € | 10 | sí |
| super-rica | 30.000.000 € | 60.000 € | 8 | sí |

> **Afirmació:** la riquesa i la presència parental estan **anticorrelacionades** (pares
> absents per feines exigents o delegació). Això és el que permet que «una treballadora
> present superi una rica absent». **És una hipòtesi de disseny, no un fet** — i
> segurament el supòsit més atacable del joc: hi ha famílies riques molt presents i
> pobres on dos progenitors fan jornades impossibles. El joc tria la correlació que fa
> el seu missatge cert.

---

## 4. L'origen es nota als diners: punts de partida i «matalàs»

### Estalvi i paga (infància i adolescència)
- `estalviAnualCriatura` i `pagaMensual` (`stats.ts`) escalen amb ingressos i patrimoni.
  **Afirmació:** els fills de famílies riques comencen a gestionar diners abans i amb
  més marge — el capital es transmet des del bressol.

### El matalàs familiar — `resolveDespesaGreu` i `ajutFamiliarMax` (`stats.ts`)
Davant una **despesa greu**, pagues el que pots (efectiu → estalvi); la família cobreix
fins a `ajutFamiliarMax = patrimoni × 0,1`; el que queda és **descobert** i resta
benestar (fins a −30). **Mai es genera deute** (els comptes no baixen de zero; el dèficit
es modela com a estrès, no com a saldo negatiu).

> **Afirmació:** la mateixa desgràcia (una despesa de 5.000 €) és un ensurt per a una
> família rica (10% de 2M€ = 200.000 € de matalàs) i una catàstrofe vital per a una de
> pobra (10% de 2.000 € = 200 € de matalàs). **Aquí és on l'origen es nota més.** La
> desigualtat no és tenir més o menys, sinó **qui pot absorbir un cop sense trencar-se.**

> **Punt de crítica obert:** el matalàs és un **10% lineal del patrimoni** per a tothom.
> ¿És realista que els rics aboquin proporcionalment el mateix que els pobres a salvar un
> fill? Es podria argumentar tant que els rics en donarien menys (%) com més (en valor
> absolut il·limitat). La decisió actual és simple i potser massa generosa amb els rics.

### Decisió «sense deute»
És una decisió de disseny conscient: el joc **es nega a modelar el deute** en aquesta
fase. La precarietat es paga en benestar, no en saldo negatiu.

> **Punt de crítica obert:** el deute (crèdits ràpids, descoberts bancaris, usura) és una
> de les **trampes de classe** més reals i el joc l'omet del tot. Una crítica de
> precarietat real diria que això **suavitza** la duresa de ser pobre: a la vida real no
> «perds una mica de benestar», t'endeutes a interès compost i la cosa s'espiralitza.

---

## 5. La vida adulta: feina, impostos i inversió

### El salari de partida ja ve marcat per l'origen
`salariInicial` / `salariAdultInicial` (`stats.ts`):
- **`PRECARIETAT_SALARI`**: `pobra: −120`, `treballadora: −60`, resta `0` (€/mes).
- **Plus per contactes**: `patrimoni × 0,0005` (capat). El capital social compra millors
  primeres feines.
- A la vida adulta, **pobra i treballadora comencen al salari mínim** (17.000 €/any),
  fins i tot amb títol (el títol s'hi suma per sobre).
- **`PREMI_DIPLOMA`**: +800 €/mes bruts pel títol universitari.

> **Afirmació:** la mateixa persona, mateixos estudis, cobra menys si ve de baix —
> per contactes, per les feines a què té accés, per com negocia. El títol ajuda però **no
> iguala**: un titulat d'origen pobre arrenca del mínim + premi; un de classe alta,
> d'una base molt superior + contactes.

> **Punt de crítica obert:** clavar pobra/treballadora al salari mínim és una
> simplificació dura. Nega, per disseny, els casos d'èxit (l'enginyer d'origen humil que
> cobra bé des del primer dia). És coherent amb la tesi estructural però una mirada
> meritocràtica ho veuria com una profecia autocomplerta.

### Es comença a l'atur, no amb feina regalada
Entrar a la vida adulta (`jobs.ts`) et posa **a l'atur** amb ofertes a buscar.
L'ocupabilitat depèn d'estudis, contactes (= patrimoni familiar), experiència, ànim i
edat. **Sempre hi ha ≥1 oferta** (mai bloqueja), però més ocupabilitat = més i millors
ofertes.

> **Afirmació:** la feina no es regala. El **≥1 oferta sempre** és una garantia de
> *jugabilitat* (que la partida no es bloquegi), **no** una promesa de mobilitat: per al
> pobre, l'oferta que arriba és dolenta i no canvia la seva corba. La «sortida» existeix
> com a mecànica, no com a ascens social.

### Impostos progressius (model tipus Espanya)
`desglosNominaAnual` (`stats.ts`): cotització SS (6,35%, base màxima), mínim personal
exempt (5.550 €) i **IRPF per trams** (19% → 47%). El benestar adult depèn del **net**,
no del brut.

> **Afirmació:** el joc incorpora la **redistribució fiscal** com a part de la física del
> món. La progressivitat existeix i es nota. (Una mirada libertària hi veuria fricció
> il·legítima; una socialdemòcrata, insuficient — no hi ha encara prestacions, rendes
> mínimes ni serveis públics modelats com a retorn d'aquests impostos.)

### La inversió i l'interès compost — el missatge financer central
`applyCareerYear` + `creixementInversions` (`stats.ts`, `constants.ts`):
- **estalvi**: rendiment 0% (la inflació se'l menja).
- **fons indexat**: mitjana ≈ +6%, **volàtil** (entre −10% i +22% anual, sortejat amb
  RNG) + xocs de mercat puntuals (cracs). Missatge: compon a llarg termini, però cal
  **aguantar els sotracs sense vendre**.
- **pla de pensions**: +4% estable, **desgrava** (20% torna a efectiu) però **bloquejat**.
- Les aportacions **només es fan si sobra** (mai s'inverteix a crèdit).

> **Afirmació:** la riquesa es construeix fent treballar els diners a llarg termini, i
> qui pot invertir (qui té marge per damunt del cost de vida) **es distancia per interès
> compost**. Com que el marge depèn del sou, i el sou de l'origen, **el compost amplifica
> la desigualtat de partida**: és el motor matemàtic de la tesi estructural.

> **Punts de crítica oberts:**
> - El joc ensenya educació financera (diversificar, aguantar, desgravar) alhora que
>   denuncia la desigualtat. ¿Hi ha tensió entre «el sistema és injust» i «aquí tens com
>   jugar-hi bé»? Una crítica diria que **normalitza** la financiarització de la vida.
> - El cost de vida (`COST_VIDA_NIVELLS`: 6.000–9.600 €/any) i l'habitatge són **iguals
>   per a tothom**: no modela que els pobres paguen més car el crèdit, l'habitatge
>   precari o l'energia (la «pobresa surt cara»).

### Aportació obligatòria a casa i cobertura familiar
- **`FACTOR_APORTACIO`** (mentre vius a casa i cobres): pobra **50%** del sou (màx 700 €),
  treballadora 35%, ... super-rica 0%.
- **`COBERTURA_VIDA_FAMILIAR`** (si vius amb els pares, quant et cobreixen): pobra **0%**
  (ho pagues tot), rica/super-rica **100%**.

> **Afirmació:** la solidaritat familiar va en **els dos sentits i és asimètrica per
> classe**: el jove pobre que comença a treballar **ha de mantenir la família** (la seva
> renda és necessària a casa), mentre que el ric pot acumular-la sencera perquè els pares
> li cobreixen tot. La família com a xarxa de seguretat **i** com a càrrega, segons
> d'on vens. És potser la mecànica que millor captura la trampa de classe.

> **Punt de crítica obert:** un 50% del sou + sostre de 700 € per a la més pobra és molt
> dur i podria fer la classe pobra **injugable** a la fase laboral jove. Cal validar que
> no sigui una espiral de la qual no es pot sortir (¿és això realisme o és frustració de
> disseny?).

---

## 6. Resum: el mapa de les decisions de valor

Per a qui hagi de criticar la física, aquí estan **concentrades les palanques
ideològiques** (totes a `stats.ts`/`constants.ts`):

| Palanca | Valor actual | Si puja… | Si baixa… |
|---------|-------------|----------|-----------|
| `DERIVA_BENESTAR` | 0,25 | mana l'estructura | mana l'agència individual |
| `PRECARIETAT_BENESTAR` | 14/8/0 | la classe pesa més | món més meritocràtic |
| `PRECARIETAT_SALARI` | 120/60/0 | feines més desiguals | mercat més «cec» a l'origen |
| Pes de la cura (24) vs seguretat (30) | gairebé iguals | post-materialisme | materialisme |
| Saturació de `wealthComfort` (800k€) | satura aviat | la riquesa compra benestar | encara més post-material |
| `ajutFamiliarMax` (10% patrimoni) | lineal | rics salven més | tothom més sol |
| `FACTOR_APORTACIO` pobra (50%) | molt alt | família com a càrrega | joves més lliures |
| Premi diploma vs terra de salari mínim | títol ajuda, no iguala | l'educació salva | l'origen mana igual |
| Absència de deute | no modelat | — | (modelar-lo) endureix la precarietat |
| Absència de serveis públics | no modelats | — | (modelar-los) suavitzaria via Estat |

> **El que el joc NO modela (i és en si una posició):** deute i usura, cost diferencial
> de ser pobre, serveis públics i prestacions com a retorn dels impostos, discriminació
> (gènere, origen, racialització), atzar de salut greu de llarga durada, herències. Cada
> absència és una decisió sobre què es vol fer visible — i un terreny obvi per a la
> crítica.
>
> **Actualització:** la revisió crítica (§8) **decideix tancar bona part d'aquestes
> absències** — modelar deute acumulatiu, cost de vida diferencial, herència, salut
> (catastròfica i estructural) i una capa pública residual. Discriminació de gènere/origen
> queda fora d'aquesta ronda.

---

## 7. Per a la revisió crítica (ús previst d'aquest document)

Aquest document existeix per alimentar una **revisió des de mirades polítiques diverses**
(p. ex. liberal/mercat, socialdemòcrata, marxista/estructuralista, conservadora-
familiarista, post-materialista/decreixement). Per a cada mecànica, la pregunta útil no
és «està bé?» sinó:

1. **Quina afirmació sobre el món fa aquesta regla?** (ja enunciada aquí)
2. **És coherent amb l'evidència** que aquella mirada considera vàlida?
3. **És coherent internament** amb la resta de la física del joc?
4. Si es canviés, **quina afirmació diferent faria** i quin paràmetre concret tocaria?

L'objectiu de la crítica és **millorar la versemblança i la honestedat del model**, no
imposar una conclusió política única. El joc té tesi; el que es revisa és si la seva
física **sosté la tesi de manera justa i no fa trampes** — i on, potser, la tesi
s'hauria de matisar perquè el model no s'aguanta.

---

## 8. Decisions de la revisió crítica (Ronda 1 — rondes amb rèplica)

Resultat de la revisió de sis perfils (cinc lents polítiques + un moderador-game
designer) sobre la física de §1–§6, en dues rondes (crítica → proposta del moderador →
rèplica → tancament). És la **direcció de disseny acordada**, encara **no codi
implementat**. `P1…P10` són les palanques.

### 8.1 El gir metodològic: mecanismes, no etiquetes

El descobriment central: l'eix que de debò dividia les crítiques **no era polític sinó
metodològic** — *decretar* el destí de classe amb una penalització indexada a l'etiqueta
(`PRECARIETAT_BENESTAR`, terra de SMI a `salariAdultInicial`) vs *fer-lo emergir* de
mecanismes verificables. El **liberal i el marxista —oposats— hi van convergir**.

**Decisió:** el desavantatge de classe es canalitza per **mecanismes** (deute que compon,
cost de vida diferencial, volatilitat d'ingressos, time-poverty), no per una constant que
«sap» la teva classe i et resta punts. `PRECARIETAT_BENESTAR` es **redueix cap a
residual/zero**; l'estrès crònic que abans capturava passa a **derivar-se de la volatilitat
d'ingressos i la càrrega de deute** (que el pobre té estructuralment). Així el sostre ≤20
**emergeix** en lloc d'estar hardcoded — i el model deixa de ser un sermó indexat a una
etiqueta.

### 8.2 Els cinc innegociables (tots satisfactibles alhora)

La troballa més forta del moderador: un cop el desavantatge es ruta per mecanismes, els
cinc innegociables resulten **ortogonals** i es poden honrar **simultàniament**.

| Lent | Innegociable | Com es satisfà |
|------|--------------|----------------|
| Liberal | cap penalització indexada a l'**etiqueta** de classe | §8.1: `PRECARIETAT`→residual; desavantatge via P1/P2/volatilitat |
| Marxista | el deute és un **saldo persistent** que compon i bloqueja la inversió futura | P1 redissenyat com a **estat**, no esdeveniment |
| Conservador | la cura parental **no pot ser inferior** per defecte | P3 reformulat: precarietat = **més variança**, no mitjana més baixa |
| Socialdemòcrata | ≥1 mecanisme públic amb **efecte jugable positiu** per al pobre que «ho fa tot bé» | P8: **educació pública** (`FACTOR_BECA`) com a via principal de la cua |
| Post-materialista | ≥1 **ruta guanyadora no-monetària**, amb la mateixa dignitat | nova **condició de final** no-monetària (§8.4) |

### 8.3 Canvis decidits

- **P1 — Deute acumulatiu [ALTA].** Saldo negatiu que **compon** (~20% TAE) i **bloqueja
  aportacions a inversió/estalvi** fins a extingir-se. No és un esdeveniment puntual: és la
  trampa estructural que reprodueix la pobresa malgrat bones decisions. *(innegociable
  marxista; el liberal l'accepta com a preu emergent, no etiqueta)*
- **P2 — Cost de vida diferencial [ALTA].** Multiplicador sobre un cost base **compartit**
  (no valor independent per classe): pobra ~1,15–1,25 … alta ≤1,0. «La pobresa surt cara.»
- **P3 — Qualitat de la cura com a VARIANÇA [ALTA].** La cura sota estrès econòmic no val
  *menys*, sinó que és *inestable*: **més sigma** en el sorteig de benestar infantil del
  pobre (pics de connexió profunda i episodis de desbordament), **no** un baseline
  inferior. La baixada del pobre ve de P1/P2 (econòmic), no de desvalorar l'afecte
  parental. *(reformulació que reconcilia marxista i conservador — innegociable conservador)*
- **P4 — `PRECARIETAT_BENESTAR`→residual + compensador comunitari [TITULAR].** Vegeu §8.1.
  El **compensador comunitari** (xarxa construïda) és una **palanca positiva** que dóna
  «eleccions amb sentit dins del sostre baix», topada perquè no aixequi el benestar real
  del pobre per sobre del sostre.
- **P5 — Salut: cua catastròfica + erosió estructural [ALTA].** Dos canals: (a) malalties
  greus **rares i d'impacte fort** (el que fa caure el **ric** — la seva única amenaça,
  per premissa); (b) **erosió de salut per classe** (hores de feina, estrès) que pesa
  sobre el pobre de manera contínua. *(post-mat: la salut és estructural, no només atzar)*
- **P6 — Herència/transmissió de capital [ALTA].** En entrar a carrera: pobra 0,
  rica/super-rica una fracció (capital que permet **rebutjar ofertes dolentes** → eleva el
  llindar d'acceptació → resiliència **emergent** del ric). Amb una mica de fricció (no del
  tot gratuïta). *(marxista, Piketty)*
- **P7 — `adultBaselineBenestar` no-monetari + `wealth` 16→8 [ALTA].** Afegir
  vincles/temps/sobirania amb pes **comparable** a l'econòmic, **substitutiu** per damunt
  d'un llindar de patrimoni (el ric **no** acumula diners *i* comunitat per duplicat).
  Arregla la fractura «infància post-material / adultesa materialista». **Tensió de
  calibratge:** §8.5.
- **P8 — Capa pública modesta, finançada i causal [ALTA, calibrar].** L'Estat **no** és
  deus ex machina: gasta els impostos **ja recaptats** (la progressivitat ja modelada *és*
  el finançament). Prestació d'atur **lligada a l'historial de cotització** (el precari en
  rep menys i abans s'esgota); IMV amb **no-take-up modelat com a estigma/burocràcia/
  informació** (no atzar pur) — reduïble amb informació/educació. Visibilitat a la UI:
  «has cotitzat X → tens dret a Y». La degradació es narra com a **subfinançament de
  classe**, no com a incompetència. **Reconciliació amb la premissa:** la capa pública
  redueix la *profunditat* de la caiguda però **no aixeca el sostre**; el pobre que «ho fa
  tot bé» troba la cua de mobilitat sobretot per **educació pública**, no per un rescat.
  *(innegociable socialdemòcrata; reconcilia amb liberal —està finançat— i marxista —la
  degradació és causal, no tècnica)*
- **P9 — Deriva asimètrica/diferencial [ALTA].** Més fàcil caure que pujar; per al ric, els
  bons anys persisteixen (resiliència d'estatus); per al pobre, torna ràpid a la referència
  baixa. *(pujada a ALTA per insistència marxista: és la mecànica més estructuralista)*
- **P10 — Matalàs progressiu [BAIXA].** `ajutFamiliarMax` deixa de ser 10% lineal: més
  fracció per als molt vulnerables, **topall absolut** per als molt rics (no aboquen
  milions per una despesa petita).

### 8.4 La corba refinada: cua de mobilitat i victòria no-monetària

Refinament de la premissa de §1 (**confirmat** com a direcció de producte):

- **Cua de mobilitat ascendent ~3–5%**, no 0% — *verificable per simulació multi-llavor*.
  Ni 0% (indefensable empíricament — liberal) ni gran (dilueix la tesi — marxista).
  *(Recalibrat a la ronda actual a **~1–2%** i només per la via educativa activa; vegeu §8.6.)*
- **Amb cicatrius:** qui escapa ho fa amb **benestar terminal acotat (~≤65)**, no la vida
  «resolta» del ric. La mobilitat real té cost (sobre-esforç, pèrdua de xarxa). *(marxista)*
- **Via principal: educació pública** (`FACTOR_BECA` + bona seqüència d'estudis), no
  loteria ni herència. *(socialdemòcrata)*
- **Victòria no-monetària reconeguda:** arribar als 35 amb poc patrimoni però **temps
  sobirà, vincles forts, salut i projecte de sentit** és un **final digne i explícit**.
  *(innegociable post-materialista)*
- **Frugalitat declarada:** «vida senzilla per elecció» és una **opció explícita** del
  jugador, no una inferència del motor; només llavors la frugalitat no penalitza. *(post-mat)*
- **Indicador ecològic mínim:** encara que el mecanisme complet s'ajorni, un indicador
  visible de petjada del consum evita normalitzar el creixement infinit. *(post-mat, compromís)*

### 8.5 La tensió de calibratge pendent (per a la fase d'implementació)

La forma de la corba ja està **confirmada** (§8.4): cua ~3–5% amb cicatrius via educació
pública, i victòria no-monetària com a final digne i explícit. El que resta pendent és un
**supòsit de calibratge** que només la simulació pot validar: **P7 (no-monetari) vs la
premissa.** El conservador vol que un adult sense diners però amb família/comunitat
fortes arribi a baseline 55–60; la premissa vol sostre del pobre ≤20. Es reconcilien
perquè **el pobre és també time-poor i està endeutat** (P1) → no pot construir fàcilment el
factor no-monetari, que queda reservat a la cua. **Aquest és el supòsit que aguanta tota la
corba:** si la simulació mostra que el pobre acumula vincles amb massa facilitat, el sostre
es trenca. Cal calibrar-ho amb dades.

**Rebutjat/ajornat amb motiu:** pujar `PRECARIETAT` a 25 (substituït per mecanismes);
eliminar-la del tot abans de validar que els mecanismes tanquen la corba (residu pont fins
a la simulació); cost ecològic complet (→ indicador mínim); impost de successions a
l'herència (→ knob de tuning, no nucli); discriminació de gènere/origen (fora d'abast
d'aquesta ronda).

### 8.6 Estat d'implementació i validació per simulació

**Eina:** `src/domain/sim/harness.ts` juga partides completes (0→35) de manera pura i
determinista amb una política de joc, i `harness.test.ts` n'imprimeix la distribució
d'outcomes per classe. És el bucle «el moderador valida els seus propis números»: cap
canvi de balanceig s'accepta sense veure'n l'efecte sobre la corba.

**Baseline mesurat (abans dels canvis)** — confirmava i superava el gap de §1: la classe
**pobra** acabava *còmoda* (benestar mediana **62**, patrimoni **+130.000 €**, 64% per
sobre de 60 de benestar). La física no produïa la corba objectiu.

**Roadmap implementat (totes les palanques de §8.3 + §8.4):**

| Palanca | Estat | Fitxer |
|---------|-------|--------|
| P1 Deute acumulatiu (compon, bloqueja inversió, sostre ~2,5× ingrés) | ✅ | `stats.ts` `applyCareerYear`, `constants.ts` `INTERES_DEUTE` |
| P2 Cost de vida diferencial per classe | ✅ | `stats.ts` `COST_VIDA_FACTOR_CLASSE`, `costVidaPropi` |
| Obligació familiar a la carrera | ✅ | `stats.ts` `aportacioFamiliarCarrera` |
| P3 Cura com a **variança** a la infància (no mitjana més baixa) | ✅ | `events/pool.ts` (`connexio_profunda`/`tensio_llar`) |
| P4 Reduir `PRECARIETAT_BENESTAR` a un residu (14/8 → **6/3**) | ✅ | `stats.ts` `PRECARIETAT_BENESTAR` |
| P5 Salut: malaltia greu + esgotament + incapacitat (seqüela crònica) | ✅ | `events/adult.ts`, `salutCronica` |
| P6 Herència/transmissió de capital en entrar a la carrera | ✅ | `stats.ts` `herenciaVida`, `engine.ts` |
| P7 No-monetari: `vinclesSocials` (substitutiu, gated pel deute) + `wealth` 16→10 | ✅ | `stats.ts` `adultBaselineBenestar`, `engine.ts` |
| P8 Capa pública: IMV de darrera instància + prestació d'atur | ✅ | `stats.ts` `ajutPublicMax`/`prestacioAturAnual`, `constants.ts` |
| P9 Deriva asimètrica (cau ràpid, puja lent) | ✅ | `constants.ts` `DERIVA_PUJADA/BAIXA`, `engine.ts` |
| Victòria no-monetària (final «vida plena») | ✅ | `components/GameOver.tsx` |
| Frugalitat declarada (`vidaSenzilla`) | ✅ | `stats.ts` `benestarNivellVida`, UI |
| Indicador ecològic (cosmètic) | ✅ | `components/InvestmentPanel.tsx` |
| **Espiral de destrucció (benestar 0 = fi de partida)** | ✅ | `engine.ts` `resolveEvent`, `GameOver.tsx` |
| **Residu de precarietat ADULT (sostre baix per a classes baixes)** | ✅ | `stats.ts` `PRECARIETAT_BENESTAR_ADULT` |
| **Ajuda a casa no remunerada (pobra/treballadora)** | ✅ | `stats.ts` `pagaPerAjudaCasa`, `engine.ts` |

**Espiral de destrucció (nova condició de DERROTA).** El benestar segueix acotat a 0..100,
però **arribar a 0 acaba la partida a qualsevol edat** (`acabat` + `espiral`): no és un
estat estable del qual la deriva remunti, és el punt sense retorn. Combinada amb la deriva
asimètrica (cau ràpid) i un sostre baix, fa que les classes baixes no només acabin «pitjor»
sinó que sovint **no arribin als 35**. És el gir que fa la precarietat *letal*, no només
incòmoda. Mesurar la mediana ja no amaga el problema: una vida que toca fons s'acaba a 0.

**Corba mesurada final** — 400 llavors/classe (passiu = no tria accions; *actiu* = estudia
a fons a la universitat, la via d'escapada de §8.4):

| Classe | benestar (mediana) | patrimoni | cua ≥60 | objectiu §8.4 |
|--------|--------------------|-----------|---------|----------------|
| **pobra (passiu, estudis/treball)** | **0** | ~−35.000 € | **0%** | enfonsada, espiral ✅ |
| **pobra (actiu, via estudis)** | 0 | ~−4.000 € | **2,0%** (p90 39) | ~1% cua d'escapada amb cicatrius ✅ |
| treballadora (passiu) | 30–37 | ~35.000 € | 0–3% | **molt dura però viable** ✅ |
| treballadora (actiu) | 45 | ~70.000 € | 17% (p90 63) | sostre ~50–60 fins i tot jugant perfecte ✅ |
| mitjana | 53–71 | ~195–250.000 € | 29–80% | franja mitjana |
| rica | 67–80 | ~500.000 € | 70–94% | alt + cua de mala sort ✅ |
| super-rica | 69–82 | ~2,0 M€ (amb herència) | 80–97% | alt ✅ |

> **Recalibratge (ronda actual).** El target de §8.4 s'endureix per decisió de producte: la
> **treballadora** passa de «moderat» (mediana ~50, còmoda) a **precària estable** (mediana
> ~30, sostre ~50–60 amb joc perfecte), i la **cua del pobre** es retalla de 3–5% a **~1–2%**
> i només per la via educativa activa. El pobre **passiu** queda condemnat a l'espiral.

**Com encaixa tot (claus de calibratge):**
- El desavantatge del pobre és en bona part **emergent** (deute + cost diferencial +
  obligació familiar + deriva asimètrica + l'espiral que el remata), no només per etiqueta —
  el gir de §8.1. Però el recalibratge actual **augmenta el residu de classe** com a palanca
  directa: `PRECARIETAT_BENESTAR` (jove) puja a 10/7 i s'afegeix `PRECARIETAT_BENESTAR_ADULT`
  (16/11) que **rebaixa el sostre adult sostenible** de pobra/treballadora. És el lever que
  capa el joc perfecte: per molt bé que jugui, la treballadora gravita a una referència baixa.
- **La capa pública (P8) no aixeca el sostre.** L'IMV és un terra de *darrera instància*:
  només per a qui té poc patrimoni **i** ingressos molt baixos (atur), no per al treballador
  pobre (que segueix atrapat). La prestació d'atur depèn d'haver cotitzat. Així el retorn
  públic existeix i és visible, però és insuficient — coherent amb la lent socialdemòcrata.
- **El factor no-monetari (P7) no trenca el ≤20.** Els `vinclesSocials` són *substitutius*
  (el ric no els acumula per duplicat) i el seu creixement es **redueix al 30% mentre hi ha
  deute**: com el pobre viu endeutat, amb prou feines els cultiva. La «vida plena» queda
  reservada a qui s'escapa de la trampa — exactament el supòsit de §8.5, ara mecànic.
- **El ric només cau per mala sort** (P5): la seqüela crònica de la `incapacitat` és l'únic
  mecanisme durador que l'enfonsa; la mediana es manté alta.

**Superfície a la UI:** deute i patrimoni net negatiu (`PatrimoniPanel`/`GameOver`),
seqüela crònica i vincles (`StatBar`/`GameOver`), prestació d'atur (`JobSearchPanel`),
frugalitat declarada i petjada ecològica (`InvestmentPanel`), i tres finals amb la mateixa
dignitat —sòlid, **vida plena** (no-monetari) i precari— (`GameOver`).

### 8.7 Iteracions posteriors: eixos de desigualtat i redistribució

- **Impost de successions** (`impostSuccessions`): l'herència en vida (P6) passa per un
  impost progressiu (exempt fins a 50.000 €, tipus creixent fins al 34%). Limita —no
  elimina— la reproducció de capital: la super-rica rep menys coixí net del que transmet.
- **Cost ecològic** (`petjadaEcologicaBenestar`): un nivell de vida alt i l'acumulació
  material (propietats) resten una mica de benestar a la referència adulta. Petit però
  mecànic: el creixement no és gratis. (Indicador visible a la UI.)
- **Discriminació de gènere i origen** — nous eixos **ortogonals a la classe**
  (`Identitat.genere`, `Identitat.origen`), que s'escullen a la creació del personatge:
  - **Bretxa salarial** (`factorSalariPersonal`): dona 0,86, no binari 0,90; origen migrant
    0,90 (multiplicatiu). S'aplica al sou de partida i a les ofertes.
  - **Discriminació d'accés** (`penalitzacioOcupabilitatOrigen`): −0,12 d'ocupabilitat per
    origen migrant → menys i pitjors ofertes.
  - **Resultat mesurat (interseccionalitat)** — mateixa classe i estudis, identitat diferent:
    a `mitjana`, home/autòcton acaba amb ~200.000 € i 58% d'escapada; dona/migrant amb
    ~150.000 € i 30%. A `pobra`, la discriminació gairebé **elimina** l'escapada (0,3% vs
    3%). La classe, el gènere i l'origen **es componen**.

La tesi de §1 s'amplia: no només la **classe** condiciona el punt de sortida, sinó també
el **gènere** i l'**origen**, i els tres eixos es reforcen. La corba es valida contínuament
amb `domain/sim/harness.test.ts` (inclou ara una comparació de discriminació).

### 8.8 La vida laboral completa: fins a la jubilació (67 anys)

El joc s'estén dels 35 als **67 anys (jubilació)**. La fase `carrera` cobreix tota la vida
laboral adulta; **la jubilació és el clímax financer**: als 67 «es cobra» tot l'estalvi i la
inversió de la vida.

- **Final als 67** (`engine.ts` `resolveEvent`, `EDAT_JUBILACIO`): `acabat` + `jubilat`. La
  pantalla de `GameOver` mostra el **balanç de jubilació** (`stats.ts`):
  - **Pensió pública** (`pensioPublicaAnual`): contributiva tipus Espanya. Cal un mínim
    d'anys cotitzats (`anysExperiencia ≥ 15`); la taxa de reemplaçament va del 50% (15 anys)
    al 100% (36 anys) sobre la base reguladora, amb mínim (~700 €/mes) i màxim (~3.000 €/mes).
    La precarietat laboral (carreres curtes, atur) també es paga a la vellesa.
  - **Renda del patrimoni** (`rendaPatrimoniAnual`): retirada segura (~4%/any) del pla de
    pensions —ara **desbloquejat**— + estalvi + fons indexat + inversions. La recompensa de
    l'interès compost.
  - **Veredicte** (`veredicteJubilacio`): renda vs. necessitats → jubilació *daurada* /
    *tranquil·la* / *precària* (i la *vida plena* no-monetària segueix valent).
- **Fites de mitja carrera** (40 / 50 / 60): decisions de *trade-off* (sou ↔ benestar/vincles/
  salut) que donen textura i preparen —o no— la jubilació. Mantenen la fase `carrera`.
- **Reajustos per edat** (realisme a edats altes): **sostre salarial** (`sostreSalari`, el sou
  no s'infla indefinidament), **plateau de pujades** (`augmentSou` decreix amb l'edat),
  **cerca de feina molt més dura als 55+** (`jobs.ts`), i **risc de salut creixent**
  (`SALUT_EDAT_EVENTS` als 50+, ponderat per `EXPOSICIO_SALUT`).

**Corba mesurada a la jubilació (67)** — l'horitzó llarg amplifica la tesi: l'interès compost
distancia encara més els rics, i l'espiral (benestar 0) sobre 49 anys de vida adulta fa que
les classes baixes sovint **ni arribin a jubilar-se**:

| Classe | % que arriba als 67 | Jubilació (renda típica) |
|--------|---------------------|--------------------------|
| **pobra** | **0–11%** (espiral als 20–30) | precària si hi arriba |
| **treballadora** | **36–53%** (molt dura però viable) | pensió ~2.200 €/mes; renda ~3.000–5.700 €/mes |
| mitjana | ~98–100% | tranquil·la / daurada |
| rica / super-rica | 100% | daurada (renda 8–15k €/mes per l'interès compost) |

> La permadeath per espiral sobre un horitzó de 49 anys adults fa, per disseny, que el pobre
> gairebé mai es jubili i que la meitat de la classe treballadora no hi arribi: la precarietat
> no és només viure pitjor, és **no arribar a la vellesa amb dignitat**.

### 8.9 Descendència: la família com a privilegi de classe

A la vida adulta, dins d'una **finestra fèrtil** (26–42 anys) i fins a un màxim de fills, pot
aparèixer la decisió de **tenir un fill** (`DESCENDENCIA_EVENTS`, gated a `eventPool`). El fill
és una font de **benestar i vincles** (P7, no monetària) però amb un **cost de criança recurrent**
mentre és dependent (`costFillsAnual`, ~22 anys):

- **Cost net** = cost brut (`COST_FILL_ANUAL`, escalat pel nivell de vida) − **prestació pública
  per fill** (`ajutFillsAnual`, *means-tested*: plena per a renda baixa, ~0 per als acomodats).
  A diferència del consum general, **no** s'hi aplica el sobrecost de classe (l'escola i la
  sanitat públiques aplanen el cost dels fills): així tenir un fill és una tensió real, no una
  condemna automàtica per als humils.
- **Llegat** (`llegatPerFill`, mostrat a `GameOver`): el patrimoni net es reparteix entre els
  fills. Tanca el cercle de la reproducció de classe (com l'`herenciaVida` rebuda als 18): els
  fills arrenquen d'on tu els deixes.

**El missatge** (verificat per simulació, jugador raonable que no té fills si va contra les
cordes): la **capacitat de formar família està estratificada per classe**.

| Classe | Fills (mitjana) | Tenen fills |
|--------|-----------------|-------------|
| rica / super-rica | ~1,9 | ~90% |
| mitjana | ~1,8 | ~88% |
| treballadora | ~0,3 | ~16–20% (només quan estan estables) |
| pobra | ~0 | gairebé mai (no arriben a una posició prou estable) |

> La descendència **no trenca** la corba de classe ni la viabilitat de la treballadora: qui
> pot permetre-s'ho té família i en gaudeix; qui va just hi renuncia o ho paga car. El dret a
> tenir fills, com tota la resta, depèn del punt de sortida.

### 8.10 La mort: la salut com a pool de mortalitat

La mort deixa de ser un interruptor cru (abans: `benestar = 0` → espiral instantània) i passa
a ser el resultat d'una stat de **salut (`Stats.salut`, 0..100)**. Quan la salut arriba a 0, la
persona **mor** (`GameState.mort`), a qualsevol edat. Substitueix l'espiral: el benestar 0 ja
no mata de cop, sinó que **erosiona la salut** (la precarietat mata, però gradualment).

**Què degrada la salut** (`declividSalutAnual` + `EventEffect.salutDelta`, a `stats.ts`/`engine.ts`):
- **Edat**: declivi suau que accelera amb els anys (una persona sana arriba viva als 67 i
  moriria de vellesa més tard). Calibrat perquè l'edat *sola* no mati abans de jubilar-se.
- **Benestar baix** (estrès, ansietat, precarietat): per sota de ~45 de benestar la salut
  s'erosiona; per sobre, es **recupera** una mica. És el canal pel qual la pobresa escurça la
  vida.
- **Seqüeles cròniques** (`salutCronica`): una discapacitat redueix qualitat (benestar) **i**
  esperança de vida (accelera el declivi) — decisió de disseny: unificades.
- **Esdeveniments de salut**: malalties, esgotament, ansietat, operacions, xacres d'edat
  (ponderats per `EXPOSICIO_SALUT[classe]`: la precarietat hi exposa més). I **els tractaments
  que no es poden pagar** (descobert d'una despesa `category:'salut'`) fan **mal extra** a la
  salut: no poder pagar la cura es paga amb anys de vida.

**Acoblament bidireccional**: salut baixa rebaixa el benestar de referència (`benestarPerSalut`);
amb la deriva, això crea una **espiral gradual** (malaltia → menys benestar → menys salut)
en comptes d'una mort instantània.

**Corba mesurada** (mortalitat abans dels 67, harness): manté la tesi de classe que abans
duia l'espiral, però més rica i realista.

| Classe | Mortalitat (via estudis activa) | Edat de mort (med) |
|--------|--------------------------------|---------------------|
| pobra | ~97–100% | ~36–43 |
| treballadora | ~51% (estudis) · ~82% (treball, sense títol) | ~54–55 |
| mitjana | ~17–27% | ~54–61 |
| rica / super-rica | ~5–14% | ~57–65 |

> Els **sans i benestants arriben a jubilar-se** (mitjana ~83% via estudis, rics ~90%+); la
> mort prematura ve de la **salut erosionada** —precarietat, malalties i tractaments no
> pagats—, no de l'edat en si. La desigualtat ja no és només viure pitjor: és **viure menys**.

### 8.11 La vida sencera i la dinastia: mort, esperança de vida i herència

El joc ja no acaba als 67. La vida **continua fins a la mort** (`salut = 0`), i la jubilació
passa a ser una **fase jugable** (`jubilacio`, 67 → mort): es viu de la pensió pública i dels
estalvis/inversions, sense sou. Així el cicle financer es tanca de debò —incloent-hi com es
gasta (o s'esgota) el que s'ha acumulat a la vellesa.

**Esperança de vida (actual i futura).** El declivi de salut per edat (`declividSalutAnual`)
es calibra perquè una persona **sana i benestant** mori de vellesa cap als **~84 anys**
(esperança de vida actual). El benestar alt allarga la vida (recuperació de salut) i el baix
l'escurça → un **gradient de longevitat per classe** mesurat: rics ~82–83, mitjana ~77,
treballadora ~64, pobra ~36–43. El **progrés mèdic** (`factorEsperancaVida`) modula
l'envelliment per any de calendari: les generacions futures viuen una mica més (esperança de
vida creixent).

**Herència i reproducció de classe (dinastia).** En morir amb descendència, es pot
**continuar amb un descendent** (`continuaGeneracio`): comença una vida nova des del naixement
en una llar de la **classe** que correspon a l'herència. L'herència NO es rep al néixer: el
motor recorda l'edat que tenia el fill quan el progenitor va morir (`herenciaPendent`) i, en
arribar-hi, dispara un **esdeveniment previst** (`herencia_dinastia`) que la lliura (cases,
fons, estalvis convertits en capital). L'herència per fill (`llegatPerFill`) suma:
- el **patrimoni en morir** (≥0), repartit entre els fills i tributat per **successions**
  (progressiu, per hereu);
- l'**herència en vida** (`llegatEnVida`), transferida mentre vivies (event `herencia_en_vida`),
  **lliure d'impost** — l'avantatge fiscal de donar aviat, un missatge financer real.

La **classe de la nova generació** surt del patrimoni heretat (`classePerPatrimoni`): el fill
d'un ric neix en una llar rica; el d'algú que mor sense res, en una de pobra. I com que
l'estate es **reparteix** entre els fills, la riquesa es **dilueix** entre hereus (mobilitat
descendent si no s'acumula prou). El cicle es tanca amb el que l'obria —l'`herenciaVida` que
es rep als 18—: **neixes on et deixen els teus, i deixes els teus on has pogut arribar.**

> La mort i l'herència fan literal la tesi del joc: la desigualtat no és només viure pitjor
> ni viure menys, sinó **transmetre (o no) el punt de sortida a la generació següent**. La
> dinastia converteix la reproducció de classe en la mecànica central del llarg termini.
