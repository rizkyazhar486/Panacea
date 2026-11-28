// Bakes UHD studio anatomical renders for the PanaceaMed Landing Page from the shipped Z-Anatomy
// atlas (public/anatomy/*.glb, CC BY-SA 4.0, see public/anatomy/CREDITS.txt).
// Usage:
//   PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node scripts/bangun/bake-landing-plates.mjs
//
// Writes:
//   public/landing/cardio-vascular-uhd.webp
//   public/landing/neuro-cranial-uhd.webp
//   public/landing/multiscale-systems-uhd.webp

import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { extname, join, resolve } from 'node:path'
import { build } from 'esbuild'

const WIDTH = 1600
const HEIGHT = 1000
const PUBLIC_DIR = resolve('public')

function resolvePlaywrightPath() {
  if (process.env.PLAYWRIGHT_MODULE) return process.env.PLAYWRIGHT_MODULE
  const candidates = [
    '/opt/node-tools/node_modules/playwright',
    '/Users/rizkyazhar/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs',
  ]
  return candidates.find((p) => existsSync(p)) ?? 'playwright'
}

function startStaticServer() {
  const mimeTypes = {
    '.glb': 'model/gltf-binary',
    '.txt': 'text/plain; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
  }
  const server = createServer((req, res) => {
    const reqPath = decodeURIComponent((req.url ?? '/').split('?')[0])
    if (reqPath === '/__bake.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end('<!doctype html><html><body style="margin:0;background:#050a08"></body></html>')
      return
    }
    const cleanPath = reqPath.replace(/^\/+/, '')
    const abs = resolve(PUBLIC_DIR, cleanPath)
    if (!abs.startsWith(PUBLIC_DIR) || !existsSync(abs)) {
      res.writeHead(404)
      res.end('Not found')
      return
    }
    res.writeHead(200, { 'Content-Type': mimeTypes[extname(abs)] ?? 'application/octet-stream' })
    res.end(readFileSync(abs))
  })
  return new Promise((resolvePort) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      resolvePort({ server, origin: `http://127.0.0.1:${addr.port}` })
    })
  })
}

const pageScript = `
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

function createStudioBackdrop(topHex, midHex, botHex, glowHex) {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 512
  const ctx = c.getContext('2d')
  const lin = ctx.createLinearGradient(0, 0, 0, 512)
  lin.addColorStop(0, topHex)
  lin.addColorStop(0.55, midHex)
  lin.addColorStop(1, botHex)
  ctx.fillStyle = lin
  ctx.fillRect(0, 0, 512, 512)
  const rad = ctx.createRadialGradient(256, 230, 12, 256, 230, 270)
  rad.addColorStop(0, glowHex)
  rad.addColorStop(1, 'rgba(5,10,8,0)')
  ctx.fillStyle = rad
  ctx.fillRect(0, 0, 512, 512)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

window.bakeLandingPlates = async ({ origin, width, height }) => {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(1)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.12
  document.body.appendChild(renderer.domElement)

  const loader = new GLTFLoader()
  loader.setMeshoptDecoder(MeshoptDecoder)
  const files = ['skeletal', 'cardiovascular', 'nervous', 'visceral', 'lymphoid', 'surface']
  const originals = {}

  for (const f of files) {
    const gltf = await loader.loadAsync(origin + '/anatomy/' + f + '.glb')
    const json = gltf.parser.json
    gltf.scene.traverse((o) => {
      const a = gltf.parser.associations.get(o)
      if (a && a.nodes !== undefined) o.userData.originalName = json.nodes[a.nodes].name
      if (o.userData.originalName === 'HOW TO ...' || o.userData.originalName === 'Take a picture') {
        o.visible = false
      }
      if (o.isMesh && o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material]
        const c = mats[0]?.color
        o.userData.baseRgb = c ? [c.r, c.g, c.b] : [0.85, 0.90, 0.88]
      }
    })
    originals[f] = gltf.scene
  }

  const colorFrom = (o, fallbackHex) => {
    const rgb = o.userData?.baseRgb
    return Array.isArray(rgb) ? new THREE.Color(rgb[0], rgb[1], rgb[2]) : new THREE.Color(fallbackHex)
  }

  const skelBox = new THREE.Box3().setFromObject(originals.skeletal)
  const skelCentre = skelBox.getCenter(new THREE.Vector3())
  const skelSize = skelBox.getSize(new THREE.Vector3())
  const minY = skelBox.min.y
  const H = skelSize.y

  function makeGhostMaterial(hex, opacity) {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(hex),
      roughness: 0.45,
      metalness: 0.05,
      transparent: true,
      opacity,
      depthWrite: false,
      side: THREE.FrontSide,
    })
  }

  function makeRimShader(hex, power, opacity) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(hex) },
        uPower: { value: power },
        uAlpha: { value: opacity },
      },
      vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform vec3 uColor; uniform float uPower; uniform float uAlpha; varying vec3 vN; varying vec3 vV; void main(){ float rim = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uPower); gl_FragColor = vec4(uColor * (0.22 + 1.35 * rim), clamp(uAlpha * (0.12 + rim), 0.0, 0.90)); }',
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
  }

  function renderPlate({ backdrop, yFracCenter, spanFrac, azimuthRad, elevRad, setupLayers }) {
    const scene = new THREE.Scene()
    scene.background = backdrop

    scene.add(new THREE.HemisphereLight(0xeefcf6, 0x0b1612, 0.85))
    const key = new THREE.DirectionalLight(0xffffff, 2.05)
    key.position.set(1.8, 2.4, 2.8)
    scene.add(key)
    const emeraldRim = new THREE.DirectionalLight(0x34d399, 1.85)
    emeraldRim.position.set(-2.6, 1.4, -1.8)
    scene.add(emeraldRim)
    const coolRim = new THREE.DirectionalLight(0x7dd3fc, 1.15)
    coolRim.position.set(2.4, 0.9, -2.2)
    scene.add(coolRim)

    for (const f of files) {
      const clone = originals[f].clone(true)
      clone.traverse((o) => {
        if (o.isMesh) {
          o.material = new THREE.MeshStandardMaterial({
            color: colorFrom(o, 0xdbe7e2),
            roughness: 0.36,
            metalness: 0.08,
          })
        }
      })
      clone.visible = false
      scene.add(clone)
      setupLayers(f, clone, makeGhostMaterial, makeRimShader)
    }

    const fov = 20
    const camera = new THREE.PerspectiveCamera(fov, width / height, 0.02, 40)
    const targetY = minY + yFracCenter * H
    const target = new THREE.Vector3(skelCentre.x, targetY, skelCentre.z)
    const dist = ((spanFrac * H) / 2) / Math.tan((fov * Math.PI) / 360)
    camera.position.set(
      target.x + Math.sin(azimuthRad) * dist,
      target.y + Math.sin(elevRad) * dist * 0.42,
      target.z + Math.cos(azimuthRad) * dist,
    )
    camera.lookAt(target)
    camera.updateMatrixWorld(true)
    renderer.render(scene, camera)
    return renderer.domElement.toDataURL('image/webp', 0.9)
  }

  // Plate 1: Thoracic Cardiovascular & Carotid Studio Macro
  const cardio = renderPlate({
    backdrop: createStudioBackdrop('#060f0b', '#0a1913', '#040806', 'rgba(16, 185, 129, 0.16)'),
    yFracCenter: 0.745,
    spanFrac: 0.26,
    azimuthRad: 0.36,
    elevRad: 0.10,
    setupLayers: (f, obj, ghost, rim) => {
      if (f === 'cardiovascular') {
        obj.visible = true
        obj.traverse((o) => {
          if (o.isMesh) {
            o.material = new THREE.MeshPhysicalMaterial({
              color: colorFrom(o, 0xc8374a),
              roughness: 0.28,
              metalness: 0.06,
              clearcoat: 0.30,
              clearcoatRoughness: 0.24,
            })
          }
        })
      } else if (f === 'skeletal') {
        obj.visible = true
        const mat = ghost('#94a3b8', 0.17)
        obj.traverse((o) => { if (o.isMesh) o.material = mat })
      } else if (f === 'visceral') {
        obj.visible = true
        const mat = rim('#64748b', 2.5, 0.15)
        obj.traverse((o) => { if (o.isMesh) o.material = mat })
      }
    },
  })

  const isEyeNode = (o) => {
    const re = /(eyeball|sclera|cornea|iris|pupil|lens|vitreous|choroid|retina|anterior chamber|posterior chamber)/i
    let cur = o
    while (cur) {
      if (re.test(String(cur.userData?.originalName ?? ''))) return true
      cur = cur.parent
    }
    return false
  }

  // Plate 2: Cranial Cortex, Cranial Nerves & Cervical Neural Architecture
  const neuro = renderPlate({
    backdrop: createStudioBackdrop('#060c10', '#09161b', '#04080a', 'rgba(52, 211, 153, 0.15)'),
    yFracCenter: 0.905,
    spanFrac: 0.22,
    azimuthRad: 0.58,
    elevRad: 0.12,
    setupLayers: (f, obj, ghost, rim) => {
      if (f === 'nervous') {
        obj.visible = true
        obj.traverse((o) => {
          if (!o.isMesh) return
          if (isEyeNode(o)) {
            o.material = rim('#64748b', 2.8, 0.15)
            return
          }
          o.material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#cbd5e1'),
            emissive: new THREE.Color('#064e3b'),
            emissiveIntensity: 0.12,
            roughness: 0.42,
            metalness: 0.06,
          })
        })
      } else if (f === 'skeletal') {
        obj.visible = true
        const mat = rim('#cbd5e1', 2.0, 0.30)
        obj.traverse((o) => { if (o.isMesh) o.material = mat })
      } else if (f === 'cardiovascular') {
        obj.visible = true
        // Keep the atlas's own artery/vein colours: one flat rose tint painted the
        // jugular veins and dural sinuses as arteries.
        obj.traverse((o) => {
          if (!o.isMesh) return
          const mat = ghost('#e11d48', 0.5)
          mat.color = colorFrom(o, 0xe11d48)
          o.material = mat
        })
      }
    },
  })

  // Plate 3: Whole-Torso & Cranial Multi-Organ Longitudinal Digital Twin (clean anatomical framing)
  const multiscale = renderPlate({
    backdrop: createStudioBackdrop('#050a08', '#0a1813', '#030605', 'rgba(16, 185, 129, 0.18)'),
    yFracCenter: 0.770,
    spanFrac: 0.47,
    azimuthRad: -0.40,
    elevRad: 0.08,
    setupLayers: (f, obj, ghost, rim) => {
      const hideEditorialExclusion = (o) => {
        const nm = String(o.userData?.originalName ?? '')
        if (/(omentum|peritoneum|fascia|penis|scrotum|testis|testicular|epididymis|vas deferens|ductus deferens|seminal|prostate|vulva|clitoris|vagina)/i.test(nm)) {
          o.visible = false
        }
      }
      if (f === 'visceral') {
        obj.visible = true
        obj.traverse((o) => {
          hideEditorialExclusion(o)
          if (o.isMesh && o.visible) {
            const nm = String(o.userData?.originalName ?? '')
            const isLungOrPleura = /(lung|lobe|pleura)/i.test(nm)
            o.material = new THREE.MeshPhysicalMaterial({
              color: colorFrom(o, 0x94a3b8),
              roughness: 0.40,
              metalness: 0.05,
              transparent: true,
              opacity: isLungOrPleura ? 0.38 : 0.78,
              depthWrite: !isLungOrPleura,
            })
          }
        })
      } else if (f === 'cardiovascular') {
        obj.visible = true
        obj.traverse((o) => {
          if (o.isMesh) {
            o.material = new THREE.MeshStandardMaterial({ color: colorFrom(o, 0xe11d48), roughness: 0.30, metalness: 0.08 })
          }
        })
      } else if (f === 'nervous') {
        obj.visible = true
        const mat = rim('#6ee7b7', 1.9, 0.48)
        obj.traverse((o) => {
          if (o.isMesh) {
            o.material = isEyeNode(o) ? rim('#64748b', 2.8, 0.12) : mat
          }
        })
      } else if (f === 'lymphoid') {
        obj.visible = true
        obj.traverse((o) => {
          if (o.isMesh) {
            o.material = new THREE.MeshStandardMaterial({ color: new THREE.Color('#10b981'), roughness: 0.36 })
          }
        })
      } else if (f === 'skeletal') {
        obj.visible = true
        const mat = ghost('#cbd5e1', 0.14)
        obj.traverse((o) => { if (o.isMesh) o.material = mat })
      }
    },
  })

  return { cardio, neuro, multiscale }
}
`

const bundle = await build({
  stdin: { contents: pageScript, resolveDir: process.cwd(), loader: 'js' },
  bundle: true,
  write: false,
  format: 'iife',
  logLevel: 'silent',
})

const { server, origin } = await startStaticServer()
let browser
try {
  const pwMod = resolvePlaywrightPath()
  const { chromium } = createRequire(import.meta.url)(pwMod)
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  browser = await chromium.launch({
    headless: true,
    ...(existsSync(chromePath) ? { executablePath: chromePath } : {}),
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  })
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } })
  await page.goto(`${origin}/__bake.html`)
  await page.addScriptTag({ content: bundle.outputFiles[0].text })
  const res = await page.evaluate((args) => window.bakeLandingPlates(args), {
    origin,
    width: WIDTH,
    height: HEIGHT,
  })
  mkdirSync(join(PUBLIC_DIR, 'landing'), { recursive: true })
  writeFileSync(join(PUBLIC_DIR, 'landing/cardio-vascular-uhd.webp'), Buffer.from(res.cardio.split(',')[1], 'base64'))
  writeFileSync(join(PUBLIC_DIR, 'landing/neuro-cranial-uhd.webp'), Buffer.from(res.neuro.split(',')[1], 'base64'))
  writeFileSync(join(PUBLIC_DIR, 'landing/multiscale-systems-uhd.webp'), Buffer.from(res.multiscale.split(',')[1], 'base64'))
  console.log('Baked 3 UHD Z-Anatomy landing plates successfully')
} finally {
  if (browser) await browser.close()
  server.close()
}
