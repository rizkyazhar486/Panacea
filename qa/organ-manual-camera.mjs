// Actual source viewer: manual camera commands must suspend the introductory spin.
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
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
  for (const width of [320, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.route(`**/${asset}`, route => route.fulfill({ contentType: 'model/gltf-binary', body: bytes }))
    await page.goto(`http://127.0.0.1:${server.address().port}`)
    await page.waitForFunction(() => document.querySelector('canvas')?.dataset.organMesh === '4')
    await page.waitForFunction(() => window.__qaRenderer.info.render.triangles > 0)
    const command = action => page.evaluate(action => window.dispatchEvent(new CustomEvent('panacea:body3d-camera', { detail: { action } })), action)
    assert.equal(await page.evaluate(() => window.__qaControls.autoRotate), true, 'initial invitation remains enabled without reduced motion')
    await command('backdrop')
    assert.equal(await page.evaluate(() => window.__qaControls.autoRotate), true, 'unrelated backdrop command does not take over the organ camera')
    for (const action of ['front', 'back', 'reset', 'zoomIn', 'zoomOut']) {
      await page.evaluate(() => { window.__qaControls.autoRotate = true })
      await command(action)
      assert.equal(await page.evaluate(() => window.__qaControls.autoRotate), false, `${action} must stop automatic rotation`)
    }
    await command('front')
    const drift = await page.evaluate(async () => {
      const frames = count => new Promise(resolve => { const next = () => --count <= 0 ? resolve() : requestAnimationFrame(next); requestAnimationFrame(next) })
      await frames(30)
      const before = window.__qaCamera.position.clone().sub(window.__qaControls.target).normalize()
      await frames(30)
      const after = window.__qaCamera.position.clone().sub(window.__qaControls.target).normalize()
      return before.angleTo(after)
    })
    assert(drift < 0.01, `front view stays steady after damping settles, drift=${drift}`)
    assert.deepEqual(errors, [])
    await page.close()
    console.log(`organ-manual-camera: ${width}px PASS (4 female reference meshes, manual controls suspend spin, front view stable; SwiftShader)`)
  }
} finally {
  await browser?.close()
  await new Promise(resolve => server.close(resolve))
}
