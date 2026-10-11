import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PANACEA_QA_PLAYWRIGHT_MODULE || '@playwright/test')
const root = fileURLToPath(new URL('../../', import.meta.url))
const temporary = await mkdtemp(join(tmpdir(), 'panacea-opencell-recovery-'))
const published = await readFile(join(root, 'public/bodyexposure/opencell_index.json'))
const index = JSON.parse(published)
let attempts = 0
let browser
const server = createServer(async (request, response) => {
  if (request.url === '/opencell_index.json') {
    attempts++
    response.setHeader('Content-Type', 'application/json')
    if (attempts === 1) { response.writeHead(503); response.end('{}') }
    else if (attempts === 2) response.end('{}') // HTTP success with invalid source metadata.
    else response.end(published)
  } else if (request.url === '/component.js') {
    response.setHeader('Content-Type', 'text/javascript')
    response.end(await readFile(join(temporary, 'component.js')))
  } else {
    response.setHeader('Content-Type', 'text/html')
    response.end('<!doctype html><style>body{max-width:390px}summary,button{min-height:44px;padding:8px;display:block}</style><div id="root"></div><script type="module" src="/component.js"></script>')
  }
})

try {
  // Bundle the actual component, rather than a copied implementation or mocked UI.
  await build({
    stdin: {
      contents: `import {createRoot} from 'react-dom/client'; import {OpenCellPanel} from './src/domains/body-exposure/ui/OpenCellPanel.tsx'; createRoot(document.getElementById('root')).render(<OpenCellPanel baseUrl="/" />);`,
      resolveDir: root, loader: 'tsx',
    },
    bundle: true, jsx: 'automatic', format: 'esm', outfile: join(temporary, 'component.js'),
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true })
  page.setDefaultTimeout(15_000)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`http://127.0.0.1:${server.address().port}`)
  const panel = page.getByTestId('opencell-panel')
  await panel.locator('summary').click()
  await panel.getByRole('alert').filter({ hasText: 'HTTP 503' }).waitFor({ state: 'attached' })
  assert.equal(attempts, 1)
  assert.equal(await panel.getByLabel('Find a protein').count(), 0)
  await panel.getByRole('button', { name: 'Retry cell-scale data load', exact: true }).click()
  await panel.getByRole('alert').filter({ hasText: 'failed validation' }).waitFor({ state: 'attached' })
  assert.equal(attempts, 2)
  assert.equal(await panel.getByLabel('Find a protein').count(), 0, 'malformed HTTP-200 data must remain unusable')
  await panel.getByRole('button', { name: 'Retry cell-scale data load', exact: true }).click()
  await panel.getByLabel('Find a protein').waitFor({ state: 'attached' })
  assert.equal(attempts, 3, 'only explicit retries should request the source again')
  assert.equal(await panel.getByRole('alert').count(), 0)
  assert.match(await panel.getByLabel('Find a protein').getAttribute('placeholder'), new RegExp(`${index.proteins.length.toLocaleString('en')} proteins`))
  const text = await panel.textContent()
  assert.ok(text.includes(index.licence))
  assert.ok(text.includes(index.limitations))
  assert.ok(text.includes('Measured in cultured HEK293T cells, not in the tissue or body shown above.'))
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ ok: true, attempts, malformedSourceBlocked: true, publishedProteins: index.proteins.length, provenancePreserved: true, pageErrors: errors }))
} finally {
  await browser?.close()
  if (server.listening) await new Promise(resolve => { server.close(resolve); server.closeIdleConnections() })
  await rm(temporary, { recursive: true, force: true })
}
