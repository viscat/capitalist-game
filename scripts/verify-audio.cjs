/**
 * Verificació REAL (navegador) que el so/música funcionen, a ESCRIPTORI (Chromium) i a MÒBIL
 * (WebKit + iPhone, el motor de l'iOS Safari, que és on fallava). Carrega l'app, clica/toca el
 * botó de so i comprova que es crea un AudioContext que arriba a "running" i que s'engeguen
 * oscil·ladors. Headless no té altaveus, però un context "running" amb oscil·ladors connectats a
 * la sortida = àudio audible en maquinari real.
 *
 * No és part del test suite ni de la CI (requereix navegadors). Per executar-lo:
 *
 *   BASE_PATH=/ npm run build
 *   npx vite preview --port 4173 --strictPort &      # en una altra terminal
 *   npm i -D playwright && npx playwright install chromium webkit
 *   node scripts/verify-audio.cjs
 *
 * Surt amb codi 0 si l'àudio s'ha desbloquejat correctament en TOTS dos motors.
 */
const { chromium, webkit, devices } = require('playwright')

const URL = process.env.URL || 'http://localhost:4173/'

const SPY = () => {
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
}

async function run(label, browser, contextOpts, useTap) {
  const context = await browser.newContext(contextOpts)
  const page = await context.newPage()
  await page.addInitScript(SPY)
  await page.goto(URL, { waitUntil: 'networkidle' })
  const toggle = page.getByRole('button', { name: /activa la música i el so/i })
  await toggle.waitFor({ timeout: 5000 })
  if (useTap) await toggle.tap()
  else await toggle.click()
  await page.waitForTimeout(1500)
  const r = await page.evaluate(() => ({
    ctxCreated: window.__audio.ctxCreated,
    oscStarted: window.__audio.oscStarted,
    state: window.__audio.ctx && window.__audio.ctx.state,
  }))
  await browser.close()
  const ok = r.ctxCreated >= 1 && r.oscStarted >= 2 && r.state === 'running'
  console.log(`[${label}] ${JSON.stringify(r)} → ${ok ? 'PASS' : 'FAIL'}`)
  return ok
}

;(async () => {
  const desktop = await run('escriptori (Chromium)', await chromium.launch(), {}, false)
  const mobil = await run(
    'mòbil (WebKit / iPhone)',
    await webkit.launch(),
    { ...devices['iPhone 13'] },
    true,
  )
  if (!desktop || !mobil) {
    console.error('FAIL: el so no s’ha desbloquejat en algun motor')
    process.exit(1)
  }
  console.log('PASS: so desbloquejat a escriptori i a mòbil')
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
