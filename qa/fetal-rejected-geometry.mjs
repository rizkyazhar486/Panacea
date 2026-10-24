// Actual viewer + source GLB; camera exposure exists only in this test bundle.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const assetBase = new URL('../public/bodyexposure/dataset-inspection/fetal-parcels/', import.meta.url)
const source = await readFile(new URL('regions.glb', assetBase))
const oldJsonLength = source.readUInt32LE(12)
const json = JSON.parse(source.subarray(20, 20+oldJsonLength).toString())
const node = json.nodes.find(node => node.extras?.source_label === 1)
assert(node, 'source GLB includes label 1 metadata')
node.extras.clinical_validation = 'reviewed'
const encoded = Buffer.from(JSON.stringify(json))
const paddedLength = Math.ceil(encoded.length/4)*4
const tail = source.subarray(20+oldJsonLength)
const rejected = Buffer.alloc(20+paddedLength+tail.length, 0x20)
source.copy(rejected,0,0,12)
rejected.writeUInt32LE(rejected.length,8)
rejected.writeUInt32LE(paddedLength,12)
rejected.writeUInt32LE(0x4e4f534a,16)
encoded.copy(rejected,20); tail.copy(rejected,20+paddedLength)
const component = await readFile(new URL('../src/pages/bodyhub/FetalParcelInspector.tsx', import.meta.url), 'utf8')
const bundle = await build({
  stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {MemoryRouter} from 'react-router-dom';
    import {FetalParcelInspector} from './src/pages/bodyhub/FetalParcelInspector';
    createRoot(document.getElementById('root')).render(<MemoryRouter><FetalParcelInspector/></MemoryRouter>);`, resolveDir: root, loader: 'tsx' },
  bundle: true, write: false, format: 'esm', jsx: 'automatic', outfile: 'app.js',
  define: { 'import.meta.env.BASE_URL': '"/"', 'process.env.NODE_ENV': '"production"' },
  plugins: [{ name: 'test-camera', setup(builder) {
    builder.onLoad({ filter: /FetalParcelInspector\.tsx$/ }, () => ({ loader: 'tsx', resolveDir: `${root}src/pages/bodyhub`,
      contents: component.replace('const controls = new OrbitControls(camera, renderer.domElement)',
        'const controls = new OrbitControls(camera, renderer.domElement); window.__qaCamera = camera; window.__qaControls = controls').replace('const scene = new THREE.Scene()', 'const scene = new THREE.Scene(); window.__qaScene = scene') }))
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
  const { chromium } = await import('@playwright/test')
  browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  let rejectAsset = true
  await page.route('**/bodyexposure/dataset-inspection/fetal-parcels/**', async route => {
    const relative = new URL(route.request().url()).pathname.split('/fetal-parcels/')[1]
    assert(relative && !relative.includes('..'))
    await route.fulfill({ body: relative === 'regions.glb' ? (rejectAsset ? rejected : source) : await readFile(new URL(relative, assetBase)),
      contentType: relative.endsWith('.json') ? 'application/json' : relative.endsWith('.png') ? 'image/png' : 'model/gltf-binary' })
  })
  await page.goto(`http://127.0.0.1:${server.address().port}`)
  await page.getByRole('alert').filter({ hasText: 'Asset source identity differs' }).waitFor()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForFunction(() => Math.abs(window.__qaCamera.aspect - document.querySelector('.fpi-canvas').getBoundingClientRect().width / 400) < 1e-6)
  const meshes = await page.evaluate(() => {
    let count=0; window.__qaScene.traverse(object => { if (object.isMesh) count++ }); return count
  })
  assert.equal(meshes, 0, 'a rejected asset must not remain in the scene after resize')
  assert.equal(await page.getByRole('button', { name: 'Focus selected region' }).isDisabled(), true)
  rejectAsset = false
  await page.reload()
  await page.waitForFunction(() => document.querySelector('.fpi-controls button')?.disabled === false)
  assert.equal(await page.getByRole('alert').count(), 0, 'original asset remains accepted')
  assert.equal(await page.evaluate(() => { let count=0; window.__qaScene.traverse(object => { if (object.isMesh) count++ }); return count }), 9)
  assert.deepEqual(errors, [])
  console.log('fetal-rejected-geometry: PASS (invalid GLB metadata, resize, no rejected scene meshes, original asset accepted; SwiftShader)')
} finally {
  await browser?.close()
  await new Promise(resolve => server.close(resolve))
}
