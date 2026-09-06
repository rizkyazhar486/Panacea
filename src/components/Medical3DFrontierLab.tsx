import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Card, SectionTitle } from './ui'
import {
  MEDICAL_3D_FRONTIER,
  medical3DFrontierSpec,
  relativeFlowIndex,
  relativePoiseuilleResistance,
  type Medical3DFrontierId,
} from '../lib/medical3DFrontier'

function clearScene(scene: THREE.Scene) {
  const keep = new Set(scene.children.filter((x) => x.userData.keep))
  for (const child of [...scene.children]) {
    if (keep.has(child)) continue
    scene.remove(child)
    child.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      mesh.geometry?.dispose?.()
      const material = mesh.material
      if (Array.isArray(material)) material.forEach((m) => m.dispose())
      else material?.dispose?.()
    })
  }
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
  const chamberMat = material(0x7f1d1d, 0.56)
  const left = new THREE.Mesh(new THREE.SphereGeometry(0.78, 40, 40), chamberMat.clone())
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
  const spec = useMemo(() => medical3DFrontierSpec(mode), [mode])
  const resistance = relativePoiseuilleResistance(radiusRatio)
  const flow = relativeFlowIndex(deltaPressure, radiusRatio)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x05080c)
    scene.fog = new THREE.Fog(0x05080c, 6, 12)
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(0, 0.4, 6.7)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)

    const ambient = new THREE.AmbientLight(0xffffff, 1.5)
    ambient.userData.keep = true
    const key = new THREE.DirectionalLight(0xffffff, 3.2)
    key.position.set(4, 6, 5)
    key.userData.keep = true
    const rim = new THREE.DirectionalLight(0x60a5fa, 2.2)
    rim.position.set(-5, 2, -4)
    rim.userData.keep = true
    scene.add(ambient, key, rim)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.minDistance = 3.2
    controls.maxDistance = 10

    const resize = () => {
      const w = Math.max(1, mount.clientWidth)
      const h = Math.max(1, mount.clientHeight)
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(mount)
    resize()
    buildMode(scene, mode)

    let raf = 0
    const clock = new THREE.Clock()
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      scene.traverse((obj) => {
        const group = obj as THREE.Group
        const curve = group.userData.flowCurve as THREE.Curve<THREE.Vector3> | undefined
        if (curve) {
          group.children.forEach((child) => {
            const phase = (child.userData.phase as number | undefined) ?? 0
            const p = curve.getPoint((phase + t * 0.13) % 1)
            child.position.copy(p)
          })
        }
        const stage = obj.userData.embryoStage as number | undefined
        if (stage !== undefined) {
          const pulse = 1 + Math.sin(t * 1.4 + stage * 0.7) * 0.025
          obj.scale.setScalar(pulse)
        }
      })
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      controls.dispose()
      clearScene(scene)
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [mode])

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="p-5 pb-3">
        <SectionTitle
          title="3D Frontier Medical Lab"
          subtitle="Four high-value spatial modules that do not duplicate the existing anatomy, cell, surgery or biomechanics labs"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {MEDICAL_3D_FRONTIER.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${mode === item.id ? 'border-brand bg-brand/15 text-brand-dark dark:text-brand' : 'border-neutral-200 bg-white text-neutral-500 hover:border-brand/40 dark:border-white/10 dark:bg-white/5'}`}
            >
              {item.shortLabel}
            </button>
          ))}
        </div>
      </div>

      <div className="relative border-y border-neutral-100 bg-[#05080c] dark:border-white/10">
        <div ref={mountRef} className="h-[430px] w-full touch-none" aria-label={`${spec.label} interactive 3D teaching scene`} />
        <div className="pointer-events-none absolute left-3 top-3 max-w-[72%] rounded-xl border border-white/10 bg-black/45 px-3 py-2 backdrop-blur">
          <div className="text-xs font-black text-white">{spec.label}</div>
          <div className="mt-1 text-[10px] leading-snug text-white/65">Drag to orbit · pinch/scroll to zoom · educational schematic</div>
        </div>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{spec.mission}</p>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Layers</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {spec.visualLayers.map((x) => <span key={x} className="rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-bold text-neutral-600 dark:bg-white/5 dark:text-neutral-300">{x}</span>)}
            </div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
            <b>Truth boundary:</b> {spec.scientificBoundary}
          </div>
        </div>

        <div className="space-y-3">
          {mode === 'hemodynamics-4d' ? (
            <div className="rounded-2xl border border-neutral-100 p-4 dark:border-white/10">
              <div className="text-xs font-black">Relative hemodynamics teaching model</div>
              <label className="mt-3 block text-[11px] font-bold text-neutral-500">Pressure gradient index: {deltaPressure.toFixed(1)}</label>
              <input className="w-full accent-green-600" type="range" min="0" max="2" step="0.1" value={deltaPressure} onChange={(e) => setDeltaPressure(Number(e.target.value))} />
              <label className="mt-3 block text-[11px] font-bold text-neutral-500">Radius ratio: {radiusRatio.toFixed(2)}×</label>
              <input className="w-full accent-green-600" type="range" min="0.5" max="1.5" step="0.05" value={radiusRatio} onChange={(e) => setRadiusRatio(Number(e.target.value))} />
              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-neutral-50 p-2 dark:bg-white/5"><div className="text-[9px] uppercase text-neutral-400">Relative R</div><div className="text-lg font-black">{resistance.toFixed(2)}</div></div>
                <div className="rounded-xl bg-neutral-50 p-2 dark:bg-white/5"><div className="text-[9px] uppercase text-neutral-400">Flow index</div><div className="text-lg font-black">{flow.toFixed(2)}</div></div>
              </div>
              <div className="mt-2 text-[10px] leading-relaxed text-neutral-500">Teaching relationship: R ∝ 1/r⁴ and Q ∝ ΔP/R. This is not clinical flow quantification.</div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-neutral-100 p-4 dark:border-white/10">
            <div className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Astra target</div>
            <p className="mt-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">{spec.astraTarget}</p>
          </div>
          <div className="rounded-2xl border border-neutral-100 p-4 dark:border-white/10">
            <div className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Integrate with</div>
            <div className="mt-2 flex flex-wrap gap-1.5">{spec.integrations.map((x) => <span key={x} className="rounded-lg bg-brand/10 px-2 py-1 text-[10px] font-bold text-brand-dark dark:text-brand">{x}</span>)}</div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default Medical3DFrontierLab
