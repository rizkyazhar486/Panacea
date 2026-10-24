// Focused browser regression, using the real component and pinned local dataset.
// PLAYWRIGHT_MODULE=<installed module> CHROME_PATH=<Chrome> node qa/fetal-mri-retry.mjs
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const base = new URL('../public/bodyexposure/dataset-inspection/fetal-parcels/', import.meta.url)
const dataset = JSON.parse(await readFile(new URL('manifest.json', base), 'utf8'))
const manifest = JSON.parse(await readFile(new URL('mri/manifest.json', base), 'utf8'))
const { outputFiles } = await build({
  stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
    import {FetalMriContext} from './src/pages/FetalMriContext';
    createRoot(document.getElementById('root')).render(<FetalMriContext dataset={${JSON.stringify(dataset)}} selected={1}/>);`,
  resolveDir: root, loader: 'tsx' },
  bundle: true, write: false, format: 'esm', jsx: 'automatic',
  define: { 'import.meta.env.BASE_URL': '"/"', 'process.env.NODE_ENV': '"production"' },
})
const server = createServer((req, res) => {
  res.setHeader('Content-Type', req.url === '/app.js' ? 'text/javascript' : 'text/html')
  res.end(req.url === '/app.js' ? outputFiles[0].text : '<div id="root"></div><script type="module" src="/app.js"></script>')
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
let browser
try {
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: process.env.QA_SOFTWARE_RENDERING === '1' ? ['--disable-gpu'] : [] })
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } })
    const errors = []
    page.on('pageerror', e => errors.push(e.message))
    let attempts = 0
    let release
    const pending = new Promise(resolve => { release = resolve })
    await page.route('**/mri/*.png', async route => {
      const asset = new URL(route.request().url()).pathname.split('/').pop()
      assert(manifest.regions[0].images.some(image => image.asset === asset))
      await route.fulfill({ contentType: 'image/png', body: await readFile(new URL(`mri/${asset}`, base)) })
    })
    await page.route('**/mri/manifest.json', async route => {
      attempts++
      if (attempts === 1) return route.fulfill({ status: 503, body: 'temporarily unavailable' })
      if (attempts === 2) return route.fulfill({ json: { ...manifest, clinical_validation: 'reviewed' } })
      await pending
      return route.fulfill({ json: manifest })
    })
    await page.goto(`http://127.0.0.1:${server.address().port}`)
    await page.locator('summary').click()
    await page.getByRole('alert').waitFor()
    assert.equal(await page.locator('figure').count(), 0)
    const retry = page.getByRole('button', { name: 'Retry MRI context' })
    await retry.click({ timeout: 3000 })
    await page.getByRole('alert').waitFor()
    assert.equal(attempts, 2, 'retry must validate rather than display clinically promoted data')
    assert.equal(await page.locator('figure').count(), 0)
    await retry.click()
    await page.getByRole('status').waitFor()
    assert.equal(await page.getByRole('alert').count(), 0, 'retry clears the previous error')
    assert.equal(await retry.count(), 0, 'no duplicate retry while loading')
    release()
    await page.locator('figure').first().waitFor()
    assert.equal(await page.locator('figure').count(), 3)
    await page.waitForFunction(() => [...document.querySelectorAll('figure img')].every(image => image.complete && image.naturalWidth > 0))
    assert.equal(await page.getByRole('alert').count(), 0)
    assert.equal(await page.getByRole('status').count(), 0)
    assert.equal(attempts, 3)
    assert.deepEqual(errors, [])
    await page.close()
    console.log(`fetal-mri-retry: ${width}px PASS (503, rejected manifest, validated retry)`)
  }
} finally {
  await browser?.close()
  await new Promise(resolve => server.close(resolve))
}
