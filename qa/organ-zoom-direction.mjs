// Actual source viewer, existing female bronchi GLB, camera-command direction.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const asset = 'bodyexposure/adult_female_main_bronchi_reference.respiratory.LOD3.glb'
const bytes = await readFile(new URL(`../public/${asset}`, import.meta.url))
const component = await readFile(new URL('../src/components/digital-twin/OrganModel3D.tsx', import.meta.url), 'utf8')
const bundle = await build({
  stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
    import {OrganModel3D} from './src/components/digital-twin/OrganModel3D';
    const organ = {id:'female-bronchi-reference',focusKey:null,label:'Female main bronchi reference',scientificName:'Main bronchi',accent:'#00BF63',illustrated:false,hotspots:[],sumber:'hubmap',berkas:${JSON.stringify(asset)}};
    createRoot(document.getElementById('root')).render(<OrganModel3D organ={organ}/>);`, resolveDir: root, loader: 'tsx' },
  bundle: true, write: false, format: 'esm', jsx: 'automatic',
  define: { 'import.meta.env.BASE_URL': '"/"', 'process.env.NODE_ENV': '"production"' },
  plugins: [{ name: 'test-camera', setup(builder) {
    builder.onLoad({ filter: /OrganModel3D\.tsx$/ }, () => ({ loader: 'tsx', resolveDir: `${root}src/components/digital-twin`,
      contents: component.replace('const controls = new OrbitControls(camera, renderer.domElement)',
        'const controls = new OrbitControls(camera, renderer.domElement); window.__qaCamera = camera; window.__qaControls = controls; window.__qaRenderer = renderer') }))
  } }],
})
const server = createServer((req, res) => {
  res.setHeader('Content-Type', req.url === '/app.js' ? 'text/javascript' : 'text/html')
  res.end(req.url === '/app.js' ? bundle.outputFiles[0].text : '<style>body{margin:0}[role=region]{width:100%;height:300px}[role=region]>div:first-child{height:100%;width:100%}</style><div id="root"></div><script type="module" src="/app.js"></script>')
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
let browser
try {
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test')
  browser = await chromium.launch({ headless: true,
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
  for (const width of [320, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.route(`**/${asset}`, route => route.fulfill({ contentType: 'model/gltf-binary', body: bytes }))
    await page.goto(`http://127.0.0.1:${server.address().port}`)
    await page.waitForFunction(() => document.querySelector('canvas')?.dataset.organMesh === '4')
    await page.waitForFunction(() => window.__qaRenderer.info.render.triangles > 0)
    await page.evaluate(() => { window.__qaControls.autoRotate = false })
    const distance = () => page.evaluate(() => window.__qaCamera.position.distanceTo(window.__qaControls.target))
    const command = action => page.evaluate(action => window.dispatchEvent(new CustomEvent('panacea:body3d-camera', { detail: { action } })), action)
    const initial = await distance()
    await command('zoomIn')
    const closer = await distance()
    assert(closer < initial, 'zoomIn must move the perspective camera closer')
    await command('zoomOut')
    const farther = await distance()
    assert(farther > closer, 'zoomOut must move the perspective camera farther')
    assert(Math.abs(farther-initial) < 1e-6, 'opposite zoom commands restore distance')
    await command('zoomIn'); await command('reset')
    assert(Math.abs(await distance()-initial) < 1e-6, 'reset preserves the original camera distance')
    assert.deepEqual(errors, [])
    await page.close()
    console.log(`organ-zoom-direction: ${width}px PASS (4 female reference meshes, zoom in/out/reset; SwiftShader)`)
  }
} finally {
  await browser?.close()
  await new Promise(resolve => server.close(resolve))
}
