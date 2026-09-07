import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Pause, Play, RotateCcw, Scan } from 'lucide-react'
import { advanceMedicalTime, flowParticlePhase, medicalCameraDistance, MEDICAL_4D_DURATION } from '../lib/medical4D'
import './medical4D.css'
import {
  MEDICAL_3D_FRONTIER,
  medical3DFrontierSpec,
  relativeFlowIndex,
  relativePoiseuilleResistance,
  relativeVelocityIndex,
  type Medical3DFrontierId,
} from '../lib/medical3DFrontier'

function clearScene(scene: THREE.Scene) {
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const keep = new Set(scene.children.filter((x) => x.userData.keep))
  for (const child of [...scene.children]) {
    if (keep.has(child)) continue
    scene.remove(child)
    child.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.geometry) geometries.add(mesh.geometry)
      const material = mesh.material
      if (Array.isArray(material)) material.forEach((m) => materials.add(m))
      else if (material) materials.add(material)
    })
  }
  geometries.forEach(g => g.dispose())
  materials.forEach(m => m.dispose())
}

function material(color: number, opacity = 1, emissive = 0) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.42,
    metalness: 0.04,
    transparent: opacity < 1,
    opacity,
    emissive,
    emissiveIntensity: emissive ? 0.28 : 0,
    depthWrite: opacity >= 1,
  })
}

function addTube(scene: THREE.Scene, points: THREE.Vector3[], radius: number, color: number, opacity = 1) {
  const curve = new THREE.CatmullRomCurve3(points)
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, radius, 12, false), material(color, opacity))
  scene.add(tube)
  return curve
}

function addFlowParticles(scene: THREE.Scene, curve: THREE.Curve<THREE.Vector3>, color: number, count: number) {
  const group = new THREE.Group()
  group.userData.flowCurve = curve
  for (let i = 0; i < count; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), material(color, 0.95, color))
    p.userData.phase = i / count
    group.add(p)
  }
  scene.add(group)
  return group
}

function buildHemodynamics(scene: THREE.Scene) {
  const left = new THREE.Mesh(new THREE.SphereGeometry(0.78, 40, 40), material(0xb44444, 0.56))
  left.scale.set(0.85, 1.15, 0.78)
  left.position.set(-0.55, -0.25, 0)
  const right = left.clone()
  right.material = material(0x1e3a8a, 0.5)
  right.position.set(0.55, -0.22, 0.05)
  scene.add(left, right)

  const systemic = addTube(scene, [new THREE.Vector3(-0.6, 0.35, 0), new THREE.Vector3(-0.8, 1.15, 0), new THREE.Vector3(0, 1.8, -0.1), new THREE.Vector3(1.45, 1.25, -0.2)], 0.11, 0xef4444, 0.84)
  const pulmonary = addTube(scene, [new THREE.Vector3(0.55, 0.28, 0), new THREE.Vector3(0.72, 0.95, 0.15), new THREE.Vector3(1.45, 0.7, 0.45)], 0.1, 0x3b82f6, 0.84)
  const shunt = addTube(scene, [new THREE.Vector3(0.16, -0.15, 0.15), new THREE.Vector3(0, 0.02, 0.22), new THREE.Vector3(-0.18, -0.08, 0.18)], 0.055, 0xf59e0b, 0.94)
  addFlowParticles(scene, systemic, 0xfca5a5, 12)
  addFlowParticles(scene, pulmonary, 0x93c5fd, 9)
  addFlowParticles(scene, shunt, 0xfbbf24, 6)
}

function buildNeuro(scene: THREE.Scene) {
  const brain = new THREE.Mesh(new THREE.SphereGeometry(1.25, 48, 48), material(0xc4b5fd, 0.18))
  brain.scale.set(1.15, 0.82, 0.95)
  brain.position.y = 0.9
  scene.add(brain)
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 2.7, 18), material(0xe5e7eb, 0.5))
  cord.position.y = -1.15
  scene.add(cord)

  const tracts = [
    { c: 0xef4444, x: -0.35, z: 0.14 },
    { c: 0xf59e0b, x: 0.32, z: -0.1 },
    { c: 0x22c55e, x: -0.06, z: -0.25 },
  ]
  for (const t of tracts) {
    const curve = addTube(scene, [
      new THREE.Vector3(t.x * 1.8, 1.45, t.z),
      new THREE.Vector3(t.x, 0.55, t.z * 0.6),
      new THREE.Vector3(-t.x * 0.25, -0.15, t.z * 0.3),
      new THREE.Vector3(t.x * 0.38, -1.25, t.z * 0.2),
      new THREE.Vector3(t.x * 0.25, -2.25, t.z * 0.12),
    ], 0.045, t.c, 0.95)
    addFlowParticles(scene, curve, t.c, 8)
  }
  const optic = addTube(scene, [new THREE.Vector3(-0.95, 0.95, 0.65), new THREE.Vector3(-0.25, 0.9, 0.2), new THREE.Vector3(0, 0.82, 0), new THREE.Vector3(0.72, 1.15, -0.5)], 0.035, 0x60a5fa)
  addFlowParticles(scene, optic, 0x93c5fd, 7)
}

function buildEmbryology(scene: THREE.Scene) {
  const stages = [
    { x: -2.15, s: 0.38, c: 0xf9a8d4 },
    { x: -1.15, s: 0.48, c: 0xf472b6 },
    { x: -0.05, s: 0.58, c: 0xa78bfa },
    { x: 1.05, s: 0.66, c: 0x60a5fa },
    { x: 2.15, s: 0.74, c: 0x34d399 },
  ]
  stages.forEach((st, i) => {
    const group = new THREE.Group()
    const core = new THREE.Mesh(new THREE.SphereGeometry(st.s, 32, 32), material(st.c, 0.68))
    core.scale.set(0.78, 1 + i * 0.06, 0.72)
    group.add(core)
    if (i >= 2) {
      const neural = new THREE.Mesh(new THREE.TorusGeometry(st.s * 0.46, 0.045, 10, 40), material(0x2563eb, 0.9))
      neural.rotation.x = Math.PI / 2
      neural.position.set(0, st.s * 0.25, st.s * 0.55)
      group.add(neural)
    }
    if (i >= 3) {
      const heartTube = new THREE.Mesh(new THREE.TorusKnotGeometry(st.s * 0.16, 0.04, 48, 8, 2, 3), material(0xef4444, 0.92))
      heartTube.position.set(st.s * 0.18, 0, st.s * 0.62)
      group.add(heartTube)
    }
    group.position.x = st.x
    group.userData.embryoStage = i
    scene.add(group)
  })
}

function buildTumorMicroenvironment(scene: THREE.Scene) {
  const tumor = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 4), material(0x991b1b, 0.52))
  scene.add(tumor)
  const hypoxia = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 32), material(0x581c87, 0.26))
  scene.add(hypoxia)
  const vessel = addTube(scene, [new THREE.Vector3(-2, -0.75, 0.7), new THREE.Vector3(-0.9, -0.45, 0.2), new THREE.Vector3(0.2, -0.8, -0.25), new THREE.Vector3(2, -0.55, -0.5)], 0.09, 0xdc2626, 0.8)
  addFlowParticles(scene, vessel, 0xfca5a5, 10)

  for (let i = 0; i < 34; i++) {
    const a = i * 2.399
    const r = 0.35 + (i % 7) * 0.12
    const y = -0.55 + (i % 9) * 0.13
    const cell = new THREE.Mesh(new THREE.SphereGeometry(0.09 + (i % 3) * 0.012, 12, 12), material(i % 5 === 0 ? 0x22c55e : 0xdc2626, 0.9))
    cell.position.set(Math.cos(a) * r, y, Math.sin(a) * r)
    scene.add(cell)
  }
  for (let i = 0; i < 16; i++) {
    const a = i * 1.73
    const immune = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 14), material(0x2563eb, 0.95, 0x2563eb))
    immune.position.set(Math.cos(a) * (1.25 + (i % 4) * 0.12), -0.6 + (i % 6) * 0.23, Math.sin(a) * (1.15 + (i % 3) * 0.18))
    scene.add(immune)
  }
}

function buildMode(scene: THREE.Scene, mode: Medical3DFrontierId) {
  clearScene(scene)
  if (mode === 'hemodynamics-4d') buildHemodynamics(scene)
  else if (mode === 'neuro-tract-connectome') buildNeuro(scene)
  else if (mode === 'embryology-morphogenesis') buildEmbryology(scene)
  else buildTumorMicroenvironment(scene)
}

export function Medical3DFrontierLab() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const [mode, setMode] = useState<Medical3DFrontierId>('hemodynamics-4d')
  const [deltaPressure, setDeltaPressure] = useState(1)
  const [radiusRatio, setRadiusRatio] = useState(1)
  const [playing, setPlaying] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [speed, setSpeed] = useState(1)
  const [time, setTime] = useState(0)
  const [retry, setRetry] = useState(0)
  const [error, setError] = useState('')
  const timeRef = useRef(0)
  const settings = useRef({ playing, speed, deltaPressure, radiusRatio })
  settings.current = { playing, speed, deltaPressure, radiusRatio }
  const resetCamera = useRef<() => void>(() => {})
  const spec = medical3DFrontierSpec(mode)
  const resistance = relativePoiseuilleResistance(radiusRatio)
  const flow = relativeFlowIndex(deltaPressure, radiusRatio)
  const velocity = relativeVelocityIndex(deltaPressure, radiusRatio)

  function seek(value: number) {
    timeRef.current = value
    setTime(value)
  }

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const changed = () => { if (preference.matches) setPlaying(false) }
    preference.addEventListener('change', changed)
    return () => preference.removeEventListener('change', changed)
  }, [])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    setError('')
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }) }
    catch { setError('3D graphics are unavailable. Model parameters remain available.'); setPlaying(false); return }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.setAttribute('role', 'img')
    renderer.domElement.setAttribute('aria-label', medical3DFrontierSpec(mode).shortLabel + ' educational 4D scene')
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x111b1c)
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    const ambient = new THREE.HemisphereLight(0xffffff, 0x657772, 2.2)
    const key = new THREE.DirectionalLight(0xffffff, 3.2)
    key.position.set(4, 6, 5)
    const rim = new THREE.DirectionalLight(0x9ee5d1, 2)
    rim.position.set(-5, 2, -4)
    buildMode(scene, mode)
    const bounds = new THREE.Box3().setFromObject(scene).getBoundingSphere(new THREE.Sphere())
    scene.add(ambient, key, rim)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = false
    controls.target.copy(bounds.center)
    const frameCamera = () => {
      const distance = medicalCameraDistance(bounds.radius * 1.08, camera.aspect, camera.fov)
      camera.position.copy(bounds.center).add(new THREE.Vector3(0, 0, distance))
      controls.target.copy(bounds.center)
      controls.minDistance = bounds.radius * 1.25
      controls.maxDistance = distance * 3
      camera.far = Math.max(100, distance * 5)
      camera.updateProjectionMatrix()
      controls.update()
    }
    resetCamera.current = frameCamera
    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      frameCamera()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(mount)
    resize()

    const flows: THREE.Group[] = []
    const stages: THREE.Object3D[] = []
    const tubes: THREE.Mesh<THREE.TubeGeometry>[] = []
    scene.traverse(obj => {
      if (obj.userData.flowCurve) flows.push(obj as THREE.Group)
      if (obj.userData.embryoStage !== undefined) stages.push(obj)
      if (mode === 'hemodynamics-4d' && obj instanceof THREE.Mesh && obj.geometry instanceof THREE.TubeGeometry) {
        obj.userData.baseRadius = obj.geometry.parameters.radius
        tubes.push(obj)
      }
    })
    let raf = 0, last = performance.now(), published = 0, previousRadius = 1, contextLost = false
    const onContextLost = (event: Event) => {
      event.preventDefault()
      contextLost = true
      cancelAnimationFrame(raf)
      setPlaying(false)
      setError('Graphics context lost. Reload the scene to continue.')
    }
    renderer.domElement.addEventListener('webglcontextlost', onContextLost)
    const animate = (now: number) => {
      if (contextLost) return
      const dt = (now - last) / 1000
      last = now
      const current = settings.current
      const active = current.playing && !document.hidden && mount.clientWidth > 0
      timeRef.current = advanceMedicalTime(timeRef.current, dt, current.speed, active)
      const t = timeRef.current
      if (active && t >= MEDICAL_4D_DURATION) setPlaying(false)
      if (now - published >= 100) { setTime(t); published = now }
      if (previousRadius !== current.radiusRatio) {
        for (const tube of tubes) {
          const path = tube.geometry.parameters.path
          tube.geometry.dispose()
          tube.geometry = new THREE.TubeGeometry(path, 96, tube.userData.baseRadius * current.radiusRatio, 12, false)
        }
        previousRadius = current.radiusRatio
      }
      const speedIndex = mode === 'hemodynamics-4d' ? relativeVelocityIndex(current.deltaPressure, current.radiusRatio) : 1
      for (const group of flows) {
        const curve = group.userData.flowCurve as THREE.Curve<THREE.Vector3>
        for (const child of group.children) curve.getPointAt(flowParticlePhase(t, child.userData.phase, speedIndex), child.position)
      }
      for (const obj of stages) obj.scale.setScalar(1 + Math.sin(t * 1.4 + obj.userData.embryoStage * 0.7) * 0.025)
      controls.update()
      if (!document.hidden) renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
      controls.dispose()
      clearScene(scene)
      renderer.dispose()
      renderer.domElement.remove()
      resetCamera.current = () => {}
    }
  }, [mode, retry])

  return (
    <section className="medical-4d" aria-label="4D medical lab">
      <header className="medical-4d-heading">
        <div><span className="medical-4d-kicker">Educational simulation</span><h2>4D Medical Lab</h2></div>
        <span className="medical-4d-origin">Procedural geometry / 3D + time</span>
      </header>
      <div className="medical-4d-modes" aria-label="Medical scene">
        {MEDICAL_3D_FRONTIER.map(item => (
          <button key={item.id} type="button" aria-pressed={mode === item.id} onClick={() => { setMode(item.id); seek(0) }}>{item.shortLabel}</button>
        ))}
      </div>
      <div className="medical-4d-stage">
        <div className="medical-4d-caption">{spec.shortLabel}<span>Schematic, not patient data</span></div>
        <div ref={mountRef} className="medical-4d-canvas" />
        {error && <div className="medical-4d-error" role="alert"><p>{error}</p><button onClick={() => setRetry(n => n + 1)}><RotateCcw size={16} /> Reload scene</button></div>}
      </div>
      <div className="medical-4d-timeline">
        <button className="medical-4d-icon" disabled={!!error} title={playing ? 'Pause time' : 'Play time'} aria-label={playing ? 'Pause time' : 'Play time'} onClick={() => { if (timeRef.current >= MEDICAL_4D_DURATION) seek(0); setPlaying(!playing) }}>{playing ? <Pause size={18} /> : <Play size={18} />}</button>
        <button className="medical-4d-icon" title="Restart time" aria-label="Restart time" onClick={() => seek(0)}><RotateCcw size={17} /></button>
        <label className="medical-4d-scrubber">Simulation time
          <input type="range" min="0" max={MEDICAL_4D_DURATION} step="0.01" value={time} onChange={e => { setPlaying(false); seek(Number(e.target.value)) }} />
        </label>
        <output className="medical-4d-time" aria-label="Elapsed simulation time">{time.toFixed(2)} s</output>
        <label className="medical-4d-speed">Speed<select value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value="0.25">0.25x</option><option value="0.5">0.5x</option><option value="1">1x</option><option value="2">2x</option></select></label>
        <button className="medical-4d-icon" title="Fit model" aria-label="Fit model" onClick={() => resetCamera.current()}><Scan size={18} /></button>
      </div>
      {mode === 'hemodynamics-4d' && <div className="medical-4d-parameters">
        <label>Pressure gradient index <output>{deltaPressure.toFixed(1)}</output><input aria-label="Pressure gradient index" type="range" min="0" max="2" step="0.1" value={deltaPressure} onChange={e => setDeltaPressure(Number(e.target.value))} /></label>
        <label>Vessel radius ratio <output>{radiusRatio.toFixed(2)}x</output><input aria-label="Vessel radius ratio" type="range" min="0.5" max="1.5" step="0.05" value={radiusRatio} onChange={e => setRadiusRatio(Number(e.target.value))} /></label>
        <dl><div><dt>Relative resistance</dt><dd>{resistance.toFixed(2)}</dd></div><div><dt>Flow index</dt><dd>{flow.toFixed(2)}</dd></div><div><dt>Mean-speed index</dt><dd>{velocity.toFixed(2)}</dd></div></dl>
        <p className="medical-4d-assumption">Fixed length and viscosity; ideal steady laminar flow. R = 1/r⁴, Q = ΔP/R, mean speed = Q/r². Particle transit is illustrative; this is not pulsatile CFD or measured blood velocity. <a href="https://openstax.org/books/college-physics/pages/12-4-viscosity-and-laminar-flow-poiseuilles-law" target="_blank" rel="noreferrer">Model reference</a></p>
      </div>}
      <p className="medical-4d-boundary">{spec.scientificBoundary}</p>
    </section>
  )
}

export default Medical3DFrontierLab
