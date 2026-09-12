import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  getEffectiveAnatomySourceNodeSnapshot,
  normalizeAnatomySourceName,
  resolveAllAnatomySourceNodes,
} from '../lib/anatomySourceNodeRegistry'
import { body3dPixelRatio } from '../lib/body3dQuality'
import { digestiveFlowVisualState, type DigestiveFlowPhase } from '../lib/digestiveFlowVisual'

interface Target {
  id: string
  label: string
  hints: readonly string[]
  phase: DigestiveFlowPhase | 'accessory'
}

const TARGETS: readonly Target[] = [
  { id: 'esophagus', label: 'Esophagus', hints: ['esophagus', 'oesophagus'], phase: 'upper' },
  { id: 'stomach', label: 'Stomach', hints: ['stomach'], phase: 'upper' },
  { id: 'duodenum', label: 'Duodenum', hints: ['duodenum'], phase: 'small-bowel' },
  { id: 'jejunum', label: 'Jejunum', hints: ['jejunum'], phase: 'small-bowel' },
  { id: 'ileum', label: 'Ileum', hints: ['ileum'], phase: 'small-bowel' },
  { id: 'cecum', label: 'Cecum', hints: ['cecum', 'caecum'], phase: 'colon' },
  { id: 'ascending-colon', label: 'Ascending colon', hints: ['ascending colon'], phase: 'colon' },
  { id: 'transverse-colon', label: 'Transverse colon', hints: ['transverse colon'], phase: 'colon' },
  { id: 'descending-colon', label: 'Descending colon', hints: ['descending colon'], phase: 'colon' },
  { id: 'sigmoid-colon', label: 'Sigmoid colon', hints: ['sigmoid colon'], phase: 'colon' },
  { id: 'rectum', label: 'Rectum', hints: ['rectum'], phase: 'colon' },
  { id: 'liver', label: 'Liver', hints: ['liver'], phase: 'accessory' },
  { id: 'gallbladder', label: 'Gallbladder', hints: ['gallbladder', 'gall bladder'], phase: 'accessory' },
  { id: 'pancreas', label: 'Pancreas', hints: ['pancreas'], phase: 'accessory' },
]

const PHASE_LABEL: Record<DigestiveFlowPhase, string> = {
  upper: 'Upper GI',
  'small-bowel': 'Small bowel',
  colon: 'Colon',
}

function centerOf(object: THREE.Object3D | null) {
  if (!object) return null
  const box = new THREE.Box3().setFromObject(object)
  return box.isEmpty() ? null : box.getCenter(new THREE.Vector3())
}

export default function DigestiveFlow3D() {
  const containerRef = useRef<HTMLDivElement>(null)
  const phaseRef = useRef<DigestiveFlowPhase>('upper')
  const [phase, setPhase] = useState<DigestiveFlowPhase>('upper')
  const [loading, setLoading] = useState(false)
  const [opened, setOpened] = useState(false)
  const [error, setError] = useState('')
  const [routeCount, setRouteCount] = useState(0)

  const resolved = useMemo(() => {
    const visceral = getEffectiveAnatomySourceNodeSnapshot().filter((bundle) => bundle.file === 'visceral.glb')
    return TARGETS.map((target) => ({
      ...target,
      names: [...new Set(resolveAllAnatomySourceNodes(target.hints, visceral, 8).flatMap((match) => match.names))],
    }))
  }, [])
  const represented = resolved.filter((target) => target.names.length > 0)
  const unavailable = resolved.filter((target) => target.names.length === 0)

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    if (!opened) return
    const container = containerRef.current
    if (!container) return
    setLoading(true)
    setError('')

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 1000)
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setError('This device could not start the digestive 3D render.')
      setLoading(false)
      return
    }
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.dataset.digestiveFlow3d = 'true'
    container.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.8))
    const key = new THREE.DirectionalLight(0xffffff, 1.15)
    key.position.set(2, 3, 4)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xffb35a, 0.42)
    rim.position.set(-3, 1, -2)
    scene.add(rim)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = false

    const resize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      if (w < 2 || h < 2) return
      renderer.setPixelRatio(body3dPixelRatio(w, h, window.devicePixelRatio || 1, window.matchMedia('(max-width: 640px)').matches))
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

    const exactNames = new Set(represented.flatMap((target) => target.names).map(normalizeAnatomySourceName))
    const targetByName = new Map<string, (typeof represented)[number]>()
    for (const target of represented) for (const name of target.names) targetByName.set(normalizeAnatomySourceName(name), target)
    const targetObjects = new Map<string, THREE.Object3D[]>()
    const materials = new Map<THREE.MeshStandardMaterial, DigestiveFlowPhase | 'accessory'>()
    let particleMesh: THREE.InstancedMesh | null = null
    let particleGeo: THREE.SphereGeometry | null = null
    let particleMat: THREE.MeshBasicMaterial | null = null
    let routes: { phase: DigestiveFlowPhase; curve: THREE.CatmullRomCurve3 }[] = []
    let disposed = false

    new GLTFLoader().load(`${import.meta.env.BASE_URL}anatomy/visceral.glb`, (gltf) => {
      if (disposed) return
      gltf.scene.traverse((object) => {
        if (!(object as THREE.Mesh).isMesh) return
        const mesh = object as THREE.Mesh
        const keyName = normalizeAnatomySourceName(mesh.name)
        mesh.visible = exactNames.has(keyName)
        if (!mesh.visible) return
        const target = targetByName.get(keyName)
        if (!target) { mesh.visible = false; return }
        const sourceMaterial = mesh.material as THREE.Material | THREE.Material[]
        if (Array.isArray(sourceMaterial) || !(sourceMaterial as THREE.MeshStandardMaterial).isMeshStandardMaterial) { mesh.visible = false; return }
        const cloned = (sourceMaterial as THREE.MeshStandardMaterial).clone()
        cloned.transparent = true
        cloned.opacity = target.phase === 'accessory' ? 0.42 : 0.78
        mesh.material = cloned
        materials.set(cloned, target.phase)
        const list = targetObjects.get(target.id) ?? []
        list.push(mesh)
        targetObjects.set(target.id, list)
      })
      scene.add(gltf.scene)

      const phases: DigestiveFlowPhase[] = ['upper', 'small-bowel', 'colon']
      for (const p of phases) {
        const points = represented
          .filter((target) => target.phase === p)
          .map((target) => centerOf(targetObjects.get(target.id)?.[0] ?? null))
        let contiguous: THREE.Vector3[] = []
        const flush = () => {
          if (contiguous.length >= 2) routes.push({ phase: p, curve: new THREE.CatmullRomCurve3(contiguous, false, 'centripetal') })
          contiguous = []
        }
        for (const point of points) point ? contiguous.push(point) : flush()
        flush()
      }

      const box = new THREE.Box3()
      for (const objects of targetObjects.values()) for (const object of objects) box.expandByObject(object)
      if (box.isEmpty()) {
        setError('No reviewed digestive source-node names resolved into the shipped visceral geometry.')
        setLoading(false)
        return
      }
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      const span = Math.max(size.x, size.y, size.z, 0.05)
      controls.target.copy(center)
      camera.position.set(center.x + span * 0.3, center.y + span * 0.1, center.z + span * 2.3)
      camera.lookAt(center)

      particleGeo = new THREE.SphereGeometry(span * 0.008, 8, 6)
      particleMat = new THREE.MeshBasicMaterial({ color: 0xffc45a, transparent: true, opacity: 0.75, depthWrite: false })
      particleMesh = new THREE.InstancedMesh(particleGeo, particleMat, Math.max(1, routes.length * 4))
      particleMesh.frustumCulled = false
      scene.add(particleMesh)
      setRouteCount(routes.length)
      setLoading(false)
    }, undefined, () => {
      if (!disposed) { setError('Could not load the shipped visceral source geometry.'); setLoading(false) }
    })

    const clock = new THREE.Clock()
    const temp = new THREE.Object3D()
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let inViewport = true
    let documentVisible = !document.hidden
    const render = () => {
      raf = 0
      if (!inViewport || !documentVisible) return
      const visual = digestiveFlowVisualState(reduced ? 0 : clock.getElapsedTime(), phaseRef.current)
      for (const [material, materialPhase] of materials) {
        const active = materialPhase === phaseRef.current
        material.emissive.setRGB(active ? visual.organEmphasis : 0, active ? visual.organEmphasis * 0.35 : 0, 0)
        material.emissiveIntensity = 1
        material.opacity = materialPhase === 'accessory' ? 0.38 : active ? 0.92 : 0.24
      }
      if (particleMesh && particleMat) {
        particleMat.opacity = reduced ? 0.3 : visual.particleOpacity
        let i = 0
        for (const route of routes.filter((r) => r.phase === phaseRef.current)) {
          for (let offset = 0; offset < 4; offset++) {
            temp.position.copy(route.curve.getPointAt((visual.progress + offset / 4) % 1))
            temp.scale.setScalar(1)
            temp.updateMatrix()
            particleMesh.setMatrixAt(i++, temp.matrix)
          }
        }
        for (; i < particleMesh.count; i++) { temp.scale.setScalar(0); temp.updateMatrix(); particleMesh.setMatrixAt(i, temp.matrix) }
        particleMesh.instanceMatrix.needsUpdate = true
      }
      controls.update()
      renderer.render(scene, camera)
      raf = requestAnimationFrame(render)
    }
    const start = () => { if (!raf && inViewport && documentVisible) raf = requestAnimationFrame(render) }
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0 }
    const io = new IntersectionObserver(([entry]) => { inViewport = Boolean(entry?.isIntersecting); inViewport ? start() : stop() }, { rootMargin: '128px' })
    io.observe(container)
    const onVisibility = () => { documentVisible = !document.hidden; documentVisible ? start() : stop() }
    document.addEventListener('visibilitychange', onVisibility)
    start()

    return () => {
      disposed = true; stop(); io.disconnect(); ro.disconnect(); document.removeEventListener('visibilitychange', onVisibility); controls.dispose()
      particleGeo?.dispose(); particleMat?.dispose()
      scene.traverse((object) => { const mesh = object as THREE.Mesh; if (!mesh.isMesh) return; const material = mesh.material as THREE.Material | THREE.Material[]; if (Array.isArray(material)) material.forEach((m) => m.dispose()); else material.dispose() })
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove()
    }
  }, [opened])

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-300/20 dark:bg-amber-300/[.04]" aria-label="Digestive source geometry 3D">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><div className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">Digestive · source-backed 3D</div><h4 className="mt-1 text-sm font-black text-neutral-950 dark:text-white">GI tract source geometry + directional teaching cue</h4><p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300">Only exact names resolved from the shipped visceral GLB index are rendered. Missing structures break the route instead of being replaced with invented geometry.</p></div>
        <button type="button" aria-expanded={opened} onClick={() => setOpened((v) => !v)} className="min-h-11 rounded-xl border border-amber-300 bg-white px-4 text-[10px] font-black text-amber-800 dark:bg-white/5 dark:text-amber-200">{opened ? 'Close Digestive 3D' : 'Open Digestive 3D'}</button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 text-[8px] font-black"><span className="rounded-full border border-emerald-300/40 px-2 py-1 text-emerald-700 dark:text-emerald-300">{represented.length} targets resolve</span><span className="rounded-full border border-neutral-300/40 px-2 py-1 text-neutral-500">{unavailable.length} unavailable</span></div>
      {opened && <div className="mt-3 space-y-2"><div className="flex flex-wrap gap-1.5">{(['upper','small-bowel','colon'] as DigestiveFlowPhase[]).map((p) => <button key={p} type="button" aria-pressed={phase===p} onClick={() => setPhase(p)} className={`min-h-10 rounded-full border px-3 text-[9px] font-black ${phase===p ? 'border-amber-500 bg-amber-500 text-black' : 'border-neutral-200 dark:border-white/10'}`}>{PHASE_LABEL[p]}</button>)}</div><div className="relative overflow-hidden rounded-2xl bg-neutral-950"><div ref={containerRef} className="h-[340px] w-full" aria-hidden="true" />{loading && <div role="status" className="absolute inset-0 flex items-center justify-center text-xs font-bold text-neutral-400">Loading digestive source geometry…</div>}{error && <div role="alert" className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs font-bold text-neutral-400">{error}</div>}<div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[8px] font-black text-amber-200">{PHASE_LABEL[phase]} · {routeCount} source route segments</div></div><p className="text-[9px] leading-relaxed text-neutral-500">Moving particles show educational direction only. Animation period is a display cycle, not measured peristalsis, gastric emptying, intestinal transit, pressure, motility, diagnosis, or patient physiology.</p>{unavailable.length > 0 && <details className="text-[9px] text-neutral-500"><summary className="cursor-pointer font-black">Unavailable source targets ({unavailable.length})</summary><div className="mt-1 flex flex-wrap gap-1">{unavailable.map((target) => <span key={target.id} className="rounded-full border border-neutral-200 px-2 py-1 dark:border-white/10">{target.label}</span>)}</div></details>}</div>}
    </section>
  )
}
