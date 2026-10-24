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
        'const controls = new OrbitControls(camera, renderer.domElement); window.__qaCamera = camera; window.__qaControls = controls').replace('const raycaster = new THREE.Raycaster()', 'window.__qaMeshes = meshes; window.__qaTHREE = THREE; const raycaster = new THREE.Raycaster()') }))
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
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, hasTouch: true })
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  await page.route('**/bodyexposure/dataset-inspection/fetal-parcels/**', async route => {
    const relative = new URL(route.request().url()).pathname.split('/fetal-parcels/')[1]
    assert(relative && !relative.includes('..'))
    await route.fulfill({ body: await readFile(new URL(relative, assetBase)),
      contentType: relative.endsWith('.json') ? 'application/json' : relative.endsWith('.png') ? 'image/png' : 'model/gltf-binary' })
  })
  await page.goto(`http://127.0.0.1:${server.address().port}`)
  await page.waitForFunction(() => document.querySelector('.fpi-controls button')?.disabled === false)
  // Expose only label 9 so a source-surface point cannot be occluded by another region.
  for (const label of [1,2,3,4,5]) await page.getByRole('checkbox', { name: `Show region ${label}`, exact: true }).uncheck()
  await page.getByRole('checkbox', { name: 'Show region 9', exact: true }).check()
  await page.locator('canvas').scrollIntoViewIfNeeded()
  const surfacePoint = () => page.evaluate(() => {
    const THREE = window.__qaTHREE, mesh = window.__qaMeshes.get(9)[0]
    const positions = mesh.geometry.attributes.position, index = mesh.geometry.index
    const center = new THREE.Vector3()
    for (let i=0;i<3;i++) center.add(new THREE.Vector3().fromBufferAttribute(positions, index ? index.getX(i) : i))
    center.divideScalar(3).applyMatrix4(mesh.matrixWorld).project(window.__qaCamera)
    const rect = document.querySelector('canvas').getBoundingClientRect()
    return { x: rect.left + (center.x+1)*rect.width/2, y: rect.top + (1-center.y)*rect.height/2 }
  })
  let point = await surfacePoint()
  assert(point.x > 0 && point.x < 1440 && point.y > 0 && point.y < 900, 'source-surface point is in the viewport')
  const selected = () => page.getByRole('button', { name: /^Region 1/ }).getAttribute('aria-pressed')
  assert.equal(await selected(), 'true')
  await page.mouse.click(point.x, point.y, { button: 'right' })
  assert.equal(await selected(), 'true', 'right-button pan/context gesture must not select a region')
  const canvas = page.locator('canvas')
  await page.mouse.move(point.x, point.y)
  await page.mouse.down()
  await canvas.dispatchEvent('pointercancel', { pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, clientX: point.x, clientY: point.y })
  await page.mouse.up()
  assert.equal(await selected(), 'true', 'cancelled pointer must not select')
  await page.mouse.click(point.x, point.y)
  assert.equal(await page.getByRole('button', { name: /^Region 9/ }).getAttribute('aria-pressed'), 'true', 'primary click still selects the actual source surface')
  await page.getByRole('button', { name: /^Region 1/ }).click()
  await canvas.scrollIntoViewIfNeeded()
  point = await surfacePoint()
  await page.touchscreen.tap(point.x, point.y)
  assert.equal(await page.getByRole('button', { name: /^Region 9/ }).getAttribute('aria-pressed'), 'true', 'primary touch still selects the source surface')
  assert.deepEqual(errors, [])
  console.log('fetal-pointer-picking: PASS (right button, cancelled pointer, primary mouse/touch source-surface taps; SwiftShader)')
} finally {
  await browser?.close()
  await new Promise(resolve => server.close(resolve))
}
