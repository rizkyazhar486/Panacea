import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { body3dPixelRatio } from '../../../lib/body3dQuality'
import { segmentAt, type Centerline } from '../../../lib/endoskopi/garisTengah'
import { loadScopeRoute, type LoadedRoute, type LumenKind, type ScopeRoute } from './scopeRoutes'
import { mucosaTextures } from './mucosa'

// Endoluminal view: the camera rides the centerline traced from the atlas
// organ, inside a lumen whose calibre follows the atlas cross-sections. Fold
// patterns (haustra, rugae, plicae, cartilage rings) are illustrated relief on
// that real path; the mucosal surface is not patient or atlas texture.

const RADIAL = 72
const ALONG_PER_METRE = 1400

type Built = {
  curve: THREE.CatmullRomCurve3
  nodeT: number[]
  length: number
  frames: { normals: THREE.Vector3[]; binormals: THREE.Vector3[]; tangents: THREE.Vector3[] }
  samples: number
}

function radiusAt(line: Centerline, nodeT: number[], t: number) {
  const nodes = line.nodes
  let i = 0
  while (i < nodeT.length - 2 && nodeT[i + 1]! < t) i++
  const a = nodeT[i]!
  const b = nodeT[i + 1] ?? a
  const f = b > a ? (t - a) / (b - a) : 0
  const r = nodes[i]!.r * (1 - f) + (nodes[i + 1] ?? nodes[i]!).r * f
  return Math.min(0.045, Math.max(0.0065, r))
}

function relief(kind: LumenKind, s: number, theta: number, posterior: number) {
  const ring = (spacing: number, sharp: number) => Math.pow(Math.max(0, Math.cos((2 * Math.PI * s) / spacing)), sharp)
  switch (kind) {
    case 'colon': {
      // Semilunar haustral folds, interrupted at the three taeniae coli.
      const taenia = 0.5 - 0.5 * Math.cos(3 * theta)
      return 1 - 0.3 * ring(0.028, 8) * (0.3 + 0.7 * taenia)
    }
    case 'rectum':
      return 1 - 0.06 * ring(0.045, 4) * (0.5 + 0.5 * Math.sin(theta))
    case 'oesophagus':
      return 1 - 0.13 * Math.pow(Math.abs(Math.sin(4 * theta + s * 8)), 2)
    case 'gastric':
      return 1 - 0.11 * Math.pow(Math.abs(Math.sin(7 * theta + 0.25 * Math.sin(s * 70))), 3)
    case 'duodenum':
      return 1 - 0.2 * ring(0.009, 10)
    case 'trachea':
    case 'bronchus': {
      // C-shaped cartilage rings; the posterior membranous wall stays smooth.
      const d = Math.abs(Math.atan2(Math.sin(theta - posterior), Math.cos(theta - posterior)))
      const cartilage = d > 0.7 ? 1 : d / 0.7
      return 1 - 0.075 * ring(kind === 'trachea' ? 0.0045 : 0.004, 6) * cartilage
    }
  }
}

function buildLumen(loaded: LoadedRoute): { mesh: THREE.Mesh; built: Built } {
  const line = loaded.centerline
  const pts = line.nodes.map((n) => new THREE.Vector3(...n.p))
  const raw = new THREE.CatmullRomCurve3(pts, false, 'centripetal')
  const rawLengths = raw.getLengths(pts.length - 1)
  const nodeT = rawLengths.map((l) => l / rawLengths[rawLengths.length - 1]!)
  // A lumen wider than the bend radius folds through itself, so the scope
  // path is resampled every 1 cm and relaxed until bends stay wider than the tube.
  let smooth = raw.getSpacedPoints(Math.max(16, Math.round(raw.getLength() / 0.01)))
  for (let pass = 0; pass < 14; pass++) {
    smooth = smooth.map((p, i) => (i === 0 || i === smooth.length - 1 ? p : p.clone().multiplyScalar(2).add(smooth[i - 1]!).add(smooth[i + 1]!).multiplyScalar(0.25)))
  }
  const curve = new THREE.CatmullRomCurve3(smooth, false, 'centripetal')
  const length = curve.getLength()
  const samples = Math.max(200, Math.round(length * ALONG_PER_METRE))
  const frames = curve.computeFrenetFrames(samples, false)
  const posteriorWorld = new THREE.Vector3(0, 0, -1)

  const positions: number[] = []
  const uvs: number[] = []
  const kinds = loaded.route.segments.map((s) => s.kind)
  const p = new THREE.Vector3()
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    curve.getPointAt(t, p)
    const N = frames.normals[i]!
    const B = frames.binormals[i]!
    const s = t * length
    const kind = kinds[segmentAt(line, t)]!
    const r0 = radiusAt(line, nodeT, t)
    const posterior = Math.atan2(posteriorWorld.dot(B), posteriorWorld.dot(N))
    for (let j = 0; j <= RADIAL; j++) {
      const theta = (j / RADIAL) * Math.PI * 2
      const r = r0 * relief(kind, s, theta, posterior)
      const cx = Math.cos(theta)
      const sx = Math.sin(theta)
      positions.push(p.x + r * (cx * N.x + sx * B.x), p.y + r * (cx * N.y + sx * B.y), p.z + r * (cx * N.z + sx * B.z))
      uvs.push((j / RADIAL) * 3, s / 0.045)
    }
  }
  const index: number[] = []
  for (let i = 0; i < samples; i++) {
    for (let j = 0; j < RADIAL; j++) {
      const a = i * (RADIAL + 1) + j
      const b = a + RADIAL + 1
      // Wound to face inward: the camera always looks from inside the lumen.
      index.push(a, a + 1, b, b, a + 1, b + 1)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(index)
  geometry.computeVertexNormals()

  const tex = mucosaTextures(kinds[0]!)
  const material = new THREE.MeshPhysicalMaterial({
    map: tex.map,
    bumpMap: tex.bump,
    bumpScale: 1.2,
    roughness: 0.42,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    sheen: 0.4,
    sheenColor: new THREE.Color('#ffd6cc'),
    side: THREE.DoubleSide,
  })
  return { mesh: new THREE.Mesh(geometry, material), built: { curve, nodeT, length, frames, samples } }
}

export function useScopeRoute(route: ScopeRoute) {
  const [state, setState] = useState<{ loaded: LoadedRoute | null; failed: boolean }>({ loaded: null, failed: false })
  useEffect(() => {
    let live = true
    setState({ loaded: null, failed: false })
    loadScopeRoute(route)
      .then((loaded) => { if (live) setState({ loaded, failed: false }) })
      .catch(() => { if (live) setState({ loaded: null, failed: true }) })
    return () => { live = false }
  }, [route])
  return state
}

function createRenderer(host: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.domElement.setAttribute('aria-hidden', 'true')
  renderer.domElement.style.display = 'block'
  host.appendChild(renderer.domElement)
  return renderer
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    mesh.geometry.dispose()
    const m = mesh.material as THREE.Material
    m.dispose()
  })
}

export function EndoluminalScope3D({ route, progress }: { route: ScopeRoute; progress: number }) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const progressRef = useRef(progress)
  progressRef.current = progress
  const { loaded, failed } = useScopeRoute(route)
  const [glFailed, setGlFailed] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host || !loaded) return
    let renderer: THREE.WebGLRenderer
    try { renderer = createRenderer(host) } catch { setGlFailed(true); return }
    renderer.toneMappingExposure = 1.35
    renderer.domElement.dataset.endoluminalScope = route.id
    const scene = new THREE.Scene()
    const { mesh, built } = buildLumen(loaded)
    scene.add(mesh)
    const meanR = loaded.centerline.nodes.reduce((s, n) => s + n.r, 0) / loaded.centerline.nodes.length
    scene.fog = new THREE.Fog(0x050101, meanR * 0.6, meanR * 9)
    scene.add(new THREE.HemisphereLight(0xffe8e0, 0x200808, 0.18))

    const camera = new THREE.PerspectiveCamera(98, 1, 0.0004, 2)
    // Scope light: a cone from the tip, falling off into the dark lumen ahead.
    const lamp = new THREE.SpotLight(0xfff4ec, 0.009, meanR * 16, 1.15, 0.75, 2)
    const fill = new THREE.PointLight(0xffe6da, 0.0024, meanR * 6, 2)
    camera.add(lamp, fill)
    lamp.position.set(0, 0, 0)
    lamp.target.position.set(0, 0, -1)
    camera.add(lamp.target)
    scene.add(camera)

    const resize = () => {
      const w = host.clientWidth
      const h = host.clientHeight
      if (w < 2 || h < 2) return
      renderer.setPixelRatio(body3dPixelRatio(w, h, window.devicePixelRatio || 1, window.matchMedia('(max-width: 640px)').matches))
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    // Drag to look around the wall; the view eases back to the lumen axis.
    const look = { yaw: 0, pitch: 0, dragging: false, x: 0, y: 0 }
    const el = renderer.domElement
    const down = (e: PointerEvent) => { look.dragging = true; look.x = e.clientX; look.y = e.clientY; el.setPointerCapture(e.pointerId) }
    const move = (e: PointerEvent) => {
      if (!look.dragging) return
      look.yaw = Math.max(-1.1, Math.min(1.1, look.yaw - (e.clientX - look.x) * 0.006))
      look.pitch = Math.max(-0.9, Math.min(0.9, look.pitch - (e.clientY - look.y) * 0.006))
      look.x = e.clientX
      look.y = e.clientY
    }
    const up = () => { look.dragging = false }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.style.touchAction = 'pan-y'
    el.style.cursor = 'grab'

    let t = Math.min(0.995, progressRef.current)
    const pos = new THREE.Vector3()
    const ahead = new THREE.Vector3()
    const upV = new THREE.Vector3()
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const off = new THREE.Quaternion()
    const euler = new THREE.Euler()
    const clock = new THREE.Clock()
    let frame = 0
    const loop = () => {
      const dt = Math.min(0.05, clock.getDelta())
      t += (Math.min(0.995, progressRef.current) - t) * Math.min(1, dt * 5)
      if (!look.dragging) { look.yaw *= 1 - Math.min(1, dt * 1.5); look.pitch *= 1 - Math.min(1, dt * 1.5) }
      built.curve.getPointAt(t, pos)
      built.curve.getPointAt(Math.min(1, t + 0.02), ahead)
      const fi = Math.min(built.samples, Math.round(t * built.samples))
      upV.copy(built.frames.normals[fi]!)
      m.lookAt(pos, ahead, upV)
      q.setFromRotationMatrix(m)
      euler.set(look.pitch, look.yaw, 0, 'YXZ')
      off.setFromEuler(euler)
      camera.position.copy(pos)
      camera.quaternion.copy(q).multiply(off)
      renderer.render(scene, camera)
      frame = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      mesh.geometry.dispose()
      ;(mesh.material as THREE.Material).dispose()
      renderer.dispose()
      el.remove()
    }
  }, [loaded, route.id])

  return (
    <div className="absolute inset-0" data-endoluminal-state={failed || glFailed ? 'failed' : loaded ? 'ready' : 'loading'}>
      <div ref={hostRef} className="absolute inset-0" role="img" aria-label={`${route.label}: simulated endoluminal view along the reference-atlas route. Drag to look around.`} />
      {/* Endoscope optics: circular field with dark falloff at the rim. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_66%,rgba(0,0,0,.5)_82%,#000_98%)]" aria-hidden />
      {(!loaded || failed || glFailed) && (
        <div className="absolute inset-0 grid place-items-center text-[11px] font-bold text-white/45" role="status">
          {failed ? 'The reference route could not be loaded.' : glFailed ? 'This device could not start the 3D scope view.' : 'Preparing 3D lumen…'}
        </div>
      )}
    </div>
  )
}

export function ScopeRouteMap3D({ route, progress }: { route: ScopeRoute; progress: number }) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const progressRef = useRef(progress)
  progressRef.current = progress
  const { loaded } = useScopeRoute(route)

  useEffect(() => {
    const host = hostRef.current
    if (!host || !loaded) return
    let renderer: THREE.WebGLRenderer
    try { renderer = createRenderer(host) } catch { return }
    renderer.domElement.dataset.scopeRouteMap = route.id
    renderer.setClearColor(0x000000, 0)
    const scene = new THREE.Scene()
    scene.add(new THREE.HemisphereLight(0xffffff, 0x302020, 1.1))
    const key = new THREE.DirectionalLight(0xffffff, 1.6)
    key.position.set(0.4, 1, 1.2)
    scene.add(key)

    const organMaterial = new THREE.MeshPhysicalMaterial({ color: '#e58a83', roughness: 0.45, clearcoat: 0.6, transparent: true, opacity: 0.42, depthWrite: false })
    const organ = loaded.organ.clone()
    organ.traverse((o) => { const mesh = o as THREE.Mesh; if (mesh.isMesh) { mesh.material = organMaterial; mesh.geometry.computeVertexNormals() } })
    scene.add(organ)

    const pts = loaded.centerline.nodes.map((n) => new THREE.Vector3(...n.p))
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal')
    const box = new THREE.Box3().setFromObject(organ)
    const size = box.getSize(new THREE.Vector3()).length()
    const path = new THREE.Mesh(new THREE.TubeGeometry(curve, 300, size * 0.006, 8), new THREE.MeshBasicMaterial({ color: '#ffd1c7', transparent: true, opacity: 0.55 }))
    scene.add(path)
    const tip = new THREE.Mesh(new THREE.SphereGeometry(size * 0.022, 24, 16), new THREE.MeshBasicMaterial({ color: '#ffffff' }))
    const halo = new THREE.Mesh(new THREE.SphereGeometry(size * 0.045, 24, 16), new THREE.MeshBasicMaterial({ color: '#fb7185', transparent: true, opacity: 0.35, depthWrite: false }))
    scene.add(tip, halo)

    // Anterior view: camera in front of the body (+z), so the patient's left is on the viewer's right.
    const center = box.getCenter(new THREE.Vector3())
    const camera = new THREE.PerspectiveCamera(32, 1, 0.001, 20)
    camera.position.copy(center).add(new THREE.Vector3(0, 0, size * 1.75))
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.copy(center)
    controls.enablePan = false
    controls.enableDamping = true
    controls.minDistance = size * 0.6
    controls.maxDistance = size * 4

    const resize = () => {
      const w = host.clientWidth
      const h = host.clientHeight
      if (w < 2 || h < 2) return
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    let frame = 0
    const p = new THREE.Vector3()
    const clock = new THREE.Clock()
    const loop = () => {
      const time = clock.getElapsedTime()
      curve.getPointAt(Math.min(1, Math.max(0, progressRef.current)), p)
      tip.position.copy(p)
      halo.position.copy(p)
      halo.scale.setScalar(1 + 0.25 * Math.sin(time * 3))
      controls.update()
      renderer.render(scene, camera)
      frame = requestAnimationFrame(loop)
    }
    loop()
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      controls.dispose()
      organMaterial.dispose()
      disposeScene(scene)
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [loaded, route.id])

  return <div ref={hostRef} className="absolute inset-0 cursor-grab" role="img" aria-label={`${route.label} route on the reference-atlas organ, anterior view. Drag to rotate.`} />
}

