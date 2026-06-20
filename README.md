# Capitalist Game

Joc per torns sobre la **vida financera d'una persona**, des del naixement fins a
la mort. L'objectiu és posar llum sobre la importància de les finances personals i
sobre com l'origen familiar condiciona el punt de sortida en un món capitalista.

### 🎮 Juga-hi: https://viscat.github.io/capitalist-game/

> Estat actual: **beta 1** — una vida jugable de **0 a 35 anys**: infància (torns
> anuals), adolescència / ESO (trimestral, amb paga i decisions), la bifurcació
> dels 16 cap a **estudiar o treballar**, i la vida adulta des dels 18:
> **universitat** o **carrera professional** amb un **pla d'inversió** anual (estalvi,
> fons indexat i pla de pensions) on es veu l'**interès compost**. La resta de la
> vida adulta arribarà més endavant.

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
6. Als **18 anys** arribes a la **majoria d'edat** i tries: anar a la **universitat**
   (quatre anys que costen diners però donen un títol i millor sou) o entrar de ple a
   la **carrera professional**.
7. A la **carrera** (torns anuals fins als 35) cada any decideixes el teu **pla
   d'inversió**: quant va a oci, estalvi, **fons indexat** (més rendiment però volàtil)
   i **pla de pensions** (estable, desgrava, però bloquejat). Les inversions **componen**
   any rere any —amb cracs i rallys de mercat pel mig— i al final veus quina part del
   teu patrimoni l'has fet treballar. Aquí entra el concepte d'inversió a llarg termini.
8. Als **35 anys** acaba aquesta iteració amb el balanç de la teva vida financera.

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

## Desplegament

El joc és una **SPA estàtica**: tot l'estat es desa al navegador (`localStorage`),
així que **no cal backend ni base de dades**. N'hi ha prou de servir la carpeta
`dist/` amb qualsevol servidor web.

La branca `main` es publica automàticament a **GitHub Pages**
(`.github/workflows/deploy.yml`), sota `/capitalist-game/`.

### Autoallotjament (Proxmox)

> **Important:** per servir-lo a l'arrel d'un host (i no sota `/capitalist-game/`),
> construeix amb `BASE_PATH=/`. La variable `BASE_PATH` controla el camí dels assets.

#### Opció A — Contenidor LXC + nginx (recomanat)

1. A Proxmox, crea un **contenidor LXC** (plantilla Debian 12, sense privilegis,
   ~1 vCPU / 512 MB RAM / 4 GB disc) amb accés a la xarxa (IP per DHCP o fixa).
2. Entra a la consola del contenidor i instal·la nginx:
   ```bash
   apt update && apt install -y nginx
   mkdir -p /var/www/capitalist-game
   ```
3. Posa-hi la build. Pots construir-la a la teva màquina i copiar-la:
   ```bash
   # a la teva màquina, dins del repo
   BASE_PATH=/ npm ci && BASE_PATH=/ npm run build
   scp -r dist/* root@IP_DEL_CONTENIDOR:/var/www/capitalist-game/
   ```
   …o bé clonar i construir dins del contenidor (cal Node ≥ 22 i git):
   ```bash
   apt install -y git
   curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt install -y nodejs
   git clone https://github.com/viscat/capitalist-game.git
   cd capitalist-game && BASE_PATH=/ npm ci && BASE_PATH=/ npm run build
   cp -r dist/* /var/www/capitalist-game/
   ```
4. Configura nginx amb [`deploy/nginx.conf`](deploy/nginx.conf):
   ```bash
   cp deploy/nginx.conf /etc/nginx/conf.d/capitalist-game.conf
   rm -f /etc/nginx/sites-enabled/default   # treu el site per defecte
   nginx -t && systemctl reload nginx
   ```
5. Obre `http://IP_DEL_CONTENIDOR/` al navegador.

Per actualitzar: reconstrueix i torna a copiar `dist/` a `/var/www/capitalist-game`.

#### Opció B — Docker

Si fas servir Docker (en un LXC o VM de Proxmox), hi ha un [`Dockerfile`](Dockerfile)
multinivell que construeix i serveix amb nginx:

```bash
docker build -t capitalist-game .
docker run -d --restart unless-stopped -p 8080:80 --name capitalist-game capitalist-game
```

El joc quedarà a `http://IP_DEL_HOST:8080/`. Per servir-lo sota un subcamí, passa
`--build-arg BASE_PATH=/elteu-subcami/`.

## Full de ruta (futures iteracions)

Vida adulta a partir dels 18: universitat i emancipació, feina qualificada i
carrera, parella i fills, habitatge (lloguer/hipoteca), inversions i deute, i
esdeveniments adults (salut, atur, imprevistos). El motor de torns i `LifeStage`
ja estan pensats per encaixar-ho sense reescriure (mira [CLAUDE.md](CLAUDE.md)).
