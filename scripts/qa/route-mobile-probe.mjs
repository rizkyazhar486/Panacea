// Sonda de rota em navegador real (Chromium via Playwright) — ferramenta de QA, não faz parte de `npm run uji`.
//
// Por que existe: o app usa HashRouter e a maioria das telas exige sessão salva. Abrir "/rota" (sem "#")
// ou sem sessão renderiza a Home/landing para QUALQUER rota, o que parece "o navegador não consegue
// verificar a UI". Esta sonda abre "/#/rota" com uma sessão de teste (papel owner, sintética) e mede.
//
// Uso:
//   npm run build && npx vite preview --port 4399 --strictPort &
//   node scripts/qa/route-mobile-probe.mjs /owner-analytics [--base http://localhost:4399] [--width 390] [--height 844]
//   --inject "<js>"  executa JS na página antes de medir (usado para provar que os detectores falham pelo nome).
// Variáveis: PLAYWRIGHT_MODULE (caminho de playwright/index.mjs), CHROMIUM_PATH (executável do Chromium).
// Saída: JSON com hash, h1, overflow horizontal em px, contagem/altura de inputs, erros de página, 600 chars de texto.
// Código de saída 1 se houver overflow horizontal (> 0 px), erro de página, ou a sonda terminar fora da rota pedida.
// A sessão é sintética (sem dados reais) e só existe no armazenamento do contexto efêmero do navegador.
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d }
const rota = process.argv[2]
if (!rota || !rota.startsWith('/')) { console.error('ROTA_INVALIDA: informe uma rota começando com "/" (ex.: /owner-analytics)'); process.exit(2) }
const base = arg('--base', 'http://localhost:4399'), width = Number(arg('--width', 390)), height = Number(arg('--height', 844))
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright')
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width, height } })
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('panacea_onboarded_v1', '1'); localStorage.setItem('panacea_assessment_prompt_v1', '1')
    localStorage.setItem('panaceamed.session.v1', JSON.stringify({ loginAt: Date.now(), account: { id: 'qa-owner', email: 'qa-owner@example.com', name: 'QA Owner', role: 'owner', isOwner: true, isSubscriber: true, loggedAt: new Date().toISOString() } }))
  } catch { /* armazenamento indisponível */ }
})
const page = await ctx.newPage()
const erros = []
page.on('pageerror', (e) => erros.push(String(e).slice(0, 160)))
await page.goto(`${base}/#${rota}`, { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)
const inject = arg('--inject', '')
if (inject) { await page.evaluate((code) => { (0, eval)(code) }, inject); await page.waitForTimeout(300) }
const info = await page.evaluate(() => ({
  hash: location.hash,
  h1: document.querySelector('h1')?.textContent?.slice(0, 80) ?? null,
  overflowPx: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  inputs: [...document.querySelectorAll('input:not([type=checkbox]):not([type=hidden])')].map((i) => ({ valor: i.value, w: Math.round(i.getBoundingClientRect().width), h: Math.round(i.getBoundingClientRect().height) })),
  texto: document.body.innerText.replace(/\n+/g, ' | ').slice(0, 600),
}))
await browser.close()
console.log(JSON.stringify({ rota, viewport: `${width}x${height}`, ...info, erros }, null, 1))
const falhas = []
if (info.overflowPx > 0) falhas.push(`OVERFLOW_HORIZONTAL: ${info.overflowPx}px`)
if (erros.length) falhas.push(`ERRO_DE_PAGINA: ${erros[0]}`)
if (info.hash !== `#${rota}`) falhas.push(`ROTA_DIVERGENTE: pedido #${rota}, atual ${info.hash}`)
if (falhas.length) { console.error(falhas.join('\n')); process.exit(1) }
