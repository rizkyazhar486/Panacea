// Bakes Home's hero body: one front view of the shipped Z-Anatomy atlas (public/anatomy, CC BY-SA 4.0, see
// public/anatomy/CREDITS.txt) rendered to a transparent WebP, plus where each body system's structure lands in that
// image. The hotspots on Home are therefore projected from the real atlas meshes with the same camera, not drawn by
// hand. Re-run after an atlas update:
//
//   npm run build && npx vite preview --port 4173 &   # serves public/anatomy
//   node scripts/bangun/bake-home-body.mjs            # needs Playwright + Chromium (not a repo dependency)
//
// Writes public/home/atlas-body-front.webp and src/domains/body-exposure/data/homeBodyAnchors.ts.

import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { build } from 'esbuild'

const ORIGIN = process.env.BAKE_ORIGIN ?? 'http://127.0.0.1:4173'
const WIDTH = 720
const HEIGHT = 1440

/** One structure per system, by exact atlas node name. `inAtlas: false` = the system has no organ in the atlas. */
const ANCHORS = [
  { id: 'nervous', file: 'nervous', node: 'Middle frontal gyrus.r' },
  { id: 'sensory-ent', file: 'nervous', node: 'Anterior segment of eyeball.l' },
  { id: 'endocrine', file: 'visceral', node: 'Thyroid gland' },
  { id: 'respiratory', file: 'visceral', node: 'Superior lobe of right lung' },
  { id: 'cardiovascular', file: 'cardiovascular', node: 'Left ventricle' },
  { id: 'lymphatic-immune', file: 'lymphoid', node: 'Spleen' },
  { id: 'digestive', file: 'visceral', node: 'Stomach' },
  { id: 'urinary', file: 'visceral', node: 'Kidney.l' },
  { id: 'reproductive', file: 'skeletal', node: 'Sacrum', inAtlas: false },
  { id: 'integumentary-surface', file: 'surface', node: 'Anterior region of forearm.l' },
  { id: 'musculoskeletal', file: 'muscular', node: 'Rectus femoris muscle.r' },
]
const VISIBLE = ['skeletal', 'muscular']

const page_script = `
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
window.bake = async ({ origin, width, height, anchors, visible }) => {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
  renderer.setSize(width, height)
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  document.body.appendChild(renderer.domElement)
  const scene = new THREE.Scene()
  scene.add(new THREE.HemisphereLight(0xd8f6ff, 0x1a0c10, 1.1))
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(1.2, 2.5, 3); scene.add(key)
  const rimL = new THREE.DirectionalLight(0x5ee7ff, 2.4); rimL.position.set(-3, 1.5, -2); scene.add(rimL)
  const rimR = new THREE.DirectionalLight(0x9d7bff, 1.8); rimR.position.set(3, 1, -2.5); scene.add(rimR)
  const loader = new GLTFLoader()
  loader.setMeshoptDecoder(MeshoptDecoder)
  const files = [...new Set([...visible, ...anchors.map((a) => a.file)])]
  const roots = {}
  for (const f of files) {
    const gltf = await loader.loadAsync(origin + '/anatomy/' + f + '.glb')
    const json = gltf.parser.json
    gltf.scene.traverse((o) => {
      const a = gltf.parser.associations.get(o)
      if (a && a.nodes !== undefined) o.userData.originalName = json.nodes[a.nodes].name
      // The source files carry two instruction labels next to the feet; they are not anatomy.
      if (o.userData.originalName === 'HOW TO ...' || o.userData.originalName === 'Take a picture') o.visible = false
    })
    gltf.scene.visible = visible.includes(f)
    scene.add(gltf.scene)
    roots[f] = gltf.scene
  }
  scene.updateMatrixWorld(true)
  const box = new THREE.Box3()
  for (const f of visible) box.expandByObject(roots[f])
  const size = box.getSize(new THREE.Vector3()), centre = box.getCenter(new THREE.Vector3())
  const fov = 18
  const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 100)
  const dist = (size.y * 1.06) / 2 / Math.tan((fov * Math.PI) / 360)
  camera.position.set(centre.x, centre.y, box.max.z + dist)
  camera.lookAt(centre)
  camera.updateMatrixWorld(true)
  renderer.render(scene, camera)
  const out = []
  for (const a of anchors) {
    let hit = null
    roots[a.file].traverse((o) => { if (!hit && o.userData.originalName === a.node) hit = o })
    if (!hit) { out.push({ id: a.id, missing: true }); continue }
    const hitBox = new THREE.Box3().setFromObject(hit)
    // A label node without meshes has an empty box whose centre is the origin (the floor): refuse it.
    if (hitBox.isEmpty()) { out.push({ id: a.id, missing: true }); continue }
    const c = hitBox.getCenter(new THREE.Vector3()).project(camera)
    out.push({ id: a.id, x: (c.x + 1) / 2, y: (1 - c.y) / 2, inAtlas: a.inAtlas !== false })
  }
  const image = renderer.domElement.toDataURL('image/webp', 0.86)

  // Second pass, same camera and meshes: a holographic read of the atlas. Each layer is lit only at its silhouette
  // (Fresnel rim), muscle in cyan, bone in white, the cardiovascular tree in red and the nervous system in violet.
  // Geometry is untouched; only the materials change.
  const rim = (color, power, alpha) => new THREE.ShaderMaterial({
    uniforms: { c: { value: new THREE.Color(color) }, p: { value: power }, a: { value: alpha } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 c; uniform float p; uniform float a; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), p); gl_FragColor = vec4(c * (0.25 + 1.6 * f), clamp(a * (0.12 + f), 0.0, 1.0)); }',
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  })
  const holo = { muscular: rim('#4fd8ff', 2.4, 0.5), skeletal: rim('#e6eeff', 1.6, 0.85), cardiovascular: rim('#ff4d6d', 1.4, 0.9), nervous: rim('#b48cff', 1.8, 0.45) }
  scene.background = null
  for (const f of Object.keys(roots)) {
    roots[f].visible = f in holo
    if (f in holo) roots[f].traverse((o) => { if (o.isMesh) o.material = holo[f] })
  }
  renderer.toneMapping = THREE.NoToneMapping
  renderer.render(scene, camera)
  const holoImage = renderer.domElement.toDataURL('image/webp', 0.8)
  return { image, holoImage, anchors: out }
}
`

const bundle = await build({ stdin: { contents: page_script, resolveDir: process.cwd(), loader: 'js' }, bundle: true, write: false, format: 'iife', logLevel: 'silent' })
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE ?? '/opt/node-tools/node_modules/playwright')
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage()
await page.goto(`${ORIGIN}/anatomy/CREDITS.txt`)
await page.evaluate(() => { document.documentElement.innerHTML = '<body style="margin:0;background:transparent"></body>' })
await page.addScriptTag({ content: bundle.outputFiles[0].text })
const result = await page.evaluate((args) => window.bake(args), { origin: ORIGIN, width: WIDTH, height: HEIGHT, anchors: ANCHORS, visible: VISIBLE })
await browser.close()

const missing = result.anchors.filter((a) => a.missing)
if (missing.length) throw new Error(`atlas nodes not found or without meshes: ${missing.map((a) => a.id).join(', ')}`)
mkdirSync('public/home', { recursive: true })
writeFileSync('public/home/atlas-body-front.webp', Buffer.from(result.image.split(',')[1], 'base64'))
writeFileSync('public/home/atlas-body-holo.webp', Buffer.from(result.holoImage.split(',')[1], 'base64'))
const r4 = (v) => Math.round(v * 10000) / 10000
const rows = result.anchors.map((a) => `  { id: '${a.id}', x: ${r4(a.x)}, y: ${r4(a.y)}, inAtlas: ${a.inAtlas} },`).join('\n')
writeFileSync('src/domains/body-exposure/data/homeBodyAnchors.ts', `// GENERATED by scripts/bangun/bake-home-body.mjs — do not edit by hand.
// Where each body system's atlas structure lands in public/home/atlas-body-front.webp (${WIDTH}×${HEIGHT}), as fractions of
// the image width/height, projected with the camera that rendered the image. inAtlas=false: the shipped atlas has no
// organ for that system, so the point marks its region only.
import type { BodySystemId } from './bodySystems.ts'

export const HOME_BODY_IMAGE = { src: 'home/atlas-body-front.webp', width: ${WIDTH}, height: ${HEIGHT} } as const
export const HOME_BODY_HOLO = { src: 'home/atlas-body-holo.webp', width: ${WIDTH}, height: ${HEIGHT} } as const

export const HOME_BODY_ANCHORS: ReadonlyArray<{ readonly id: BodySystemId; readonly x: number; readonly y: number; readonly inAtlas: boolean }> = [
${rows}
]
`)
console.log('baked', result.anchors.map((a) => `${a.id}@${r4(a.x)},${r4(a.y)}`).join(' '))
