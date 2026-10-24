// Actual viewer + source GLB; camera exposure exists only in this test bundle.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const assetBase = new URL('../public/bodyexposure/dataset-inspection/fetal-parcels/', import.meta.url)
const component = await readFile(new URL('../src/pages/FetalParcelInspector.tsx', import.meta.url), 'utf8')
const bundle = await build({
  stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {MemoryRouter} from 'react-router-dom';
    import {FetalParcelInspector} from './src/pages/FetalParcelInspector';
    createRoot(document.getElementById('root')).render(<MemoryRouter><FetalParcelInspector/></MemoryRouter>);`, resolveDir: root, loader: 'tsx' },
  bundle: true, write: false, format: 'esm', jsx: 'automatic', outfile: 'app.js',
  define: { 'import.meta.env.BASE_URL': '"/"', 'process.env.NODE_ENV': '"production"' },
  plugins: [{ name: 'test-camera', setup(builder) {
    builder.onLoad({ filter: /FetalParcelInspector\.tsx$/ }, () => ({ loader: 'tsx', resolveDir: `${root}src/pages`,
      contents: component.replace('const controls = new OrbitControls(camera, renderer.domElement)',
        'const controls = new OrbitControls(camera, renderer.domElement); window.__qaCamera = camera; window.__qaControls = controls') }))
    builder.onLoad({ filter: /\.css$/ }, () => ({ loader: 'empty', contents: '' }))
  } }],
})
const server = createServer((req, res) => {
  res.setHeader('Content-Type', req.url === '/app.js' ? 'text/javascript' : 'text/html')
  res.end(req.url === '/app.js' ? bundle.outputFiles[0].text : '<style>.fpi-canvas{width:100%;height:400px}button{min-height:32px}</style><div id="root"></div><script type="module" src="/app.js"></script>')
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
let browser
try {
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  await page.route('**/bodyexposure/dataset-inspection/fetal-parcels/**', async route => {
    const relative = new URL(route.request().url()).pathname.split('/fetal-parcels/')[1]
    assert(relative && !relative.includes('..'))
    await route.fulfill({ body: await readFile(new URL(relative, assetBase)),
      contentType: relative.endsWith('.json') ? 'application/json' : relative.endsWith('.png') ? 'image/png' : 'model/gltf-binary' })
  })
  await page.goto(`http://127.0.0.1:${server.address().port}`)
  const left = page.getByRole('button', { name: 'Left', exact: true })
  await page.waitForFunction(() => document.querySelector('.fpi-controls button')?.disabled === false)
  await left.click()
  const direction = () => page.evaluate(() => window.__qaCamera.position.clone().sub(window.__qaControls.target).normalize().toArray())
  assert((await direction())[0] > 0.99)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForFunction(() => Math.abs(window.__qaCamera.aspect - document.querySelector('.fpi-canvas').getBoundingClientRect().width / 400) < 1e-6)
  assert((await direction())[0] > 0.99, 'left view must survive mobile resize')
  await page.getByRole('button', { name: /^Region 9/ }).click()
  await page.getByRole('button', { name: 'Focus selected region' }).click()
  const center = await page.evaluate(() => window.__qaControls.target.toArray())
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.waitForFunction(() => Math.abs(window.__qaCamera.aspect - document.querySelector('.fpi-canvas').getBoundingClientRect().width / 400) < 1e-6)
  assert.deepEqual(await page.evaluate(() => window.__qaControls.target.toArray()), center, 'selected source-region focus survives desktop resize')
  assert((await direction())[2] > 0.99)
  assert.deepEqual(errors, [])
  console.log('fetal-resize-view: PASS (left view and selected-region focus; source GLB; SwiftShader WebGL)')
} finally {
  await browser?.close()
  await new Promise(resolve => server.close(resolve))
}
