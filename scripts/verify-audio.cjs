/**
 * Verificació REAL (navegador) que el so/música funcionen: carrega l'app en un Chromium de debò,
 * clica el botó de so i comprova que es crea un AudioContext que arriba a l'estat "running" i que
 * s'engeguen oscil·ladors (la confirmació + la música). Headless no té altaveus, però un context
 * "running" amb oscil·ladors connectats a la sortida = àudio audible en maquinari real.
 *
 * No és part del test suite ni de la CI (requereix un navegador). Per executar-lo:
 *
 *   BASE_PATH=/ npm run build
 *   npx vite preview --port 4173 --strictPort &      # en una altra terminal
 *   npm i -D playwright && npx playwright install chromium
 *   node scripts/verify-audio.cjs
 *
 * Surt amb codi 0 si l'àudio s'ha desbloquejat correctament.
 */
const { chromium } = require('playwright')

const URL = process.env.URL || 'http://localhost:4173/'

;(async () => {
  const browser = await chromium.launch()
  const page = await (await browser.newContext()).newPage()

  // Instrumenta AudioContext abans de carregar l'app: compta contexts/oscil·ladors i en guarda
  // una referència per llegir-ne l'estat (running/suspended).
  await page.addInitScript(() => {
    window.__audio = { ctxCreated: 0, oscStarted: 0, ctx: null }
    const wrap = (Orig) => {
      if (!Orig) return Orig
      return new Proxy(Orig, {
        construct(target, args) {
          const inst = new target(...args)
          window.__audio.ctxCreated++
          window.__audio.ctx = inst
          const oc = inst.createOscillator.bind(inst)
          inst.createOscillator = function () {
            const osc = oc()
            const os = osc.start.bind(osc)
            osc.start = function (...a) {
              window.__audio.oscStarted++
              return os(...a)
            }
            return osc
          }
          return inst
        },
      })
    }
    window.AudioContext = wrap(window.AudioContext)
    if (window.webkitAudioContext) window.webkitAudioContext = wrap(window.webkitAudioContext)
  })

  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /activa la música i el so/i }).click()
  await page.waitForTimeout(1200)

  const r = await page.evaluate(() => ({
    ctxCreated: window.__audio.ctxCreated,
    oscStarted: window.__audio.oscStarted,
    state: window.__audio.ctx && window.__audio.ctx.state,
  }))
  console.log('Resultat:', JSON.stringify(r))
  await browser.close()

  const ok = r.ctxCreated >= 1 && r.oscStarted >= 2 && r.state === 'running'
  if (!ok) {
    console.error('FAIL: el graf d’àudio no s’ha desbloquejat en activar el so')
    process.exit(1)
  }
  console.log(`PASS: AudioContext "${r.state}", oscil·ladors engegats = ${r.oscStarted}`)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
