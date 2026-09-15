import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

type TissueKey = 'skin' | 'bone' | 'soft' | 'lung' | 'vessel' | 'detail'
type RenderMode = 'surface' | 'volume' | 'overlay'
type PlaneKey = 'x' | 'y' | 'z'

type TissueSpec = {
  key: TissueKey
  label: string
  hu: number
  opacity: number
  color: number
}

const TISSUES: TissueSpec[] = [
  { key: 'lung', label: 'Air / lung', hu: -760, opacity: 0.18, color: 0x35536a },
  { key: 'skin', label: 'Surface', hu: 5, opacity: 0.12, color: 0xc9a68e },
  { key: 'soft', label: 'Soft tissue', hu: 55, opacity: 0.34, color: 0x8a4d45 },
  { key: 'vessel', label: 'Contrast vessel', hu: 320, opacity: 0.92, color: 0xb9594f },
  { key: 'detail', label: 'High-density detail', hu: 620, opacity: 0.8, color: 0xcab9a2 },
  { key: 'bone', label: 'Bone', hu: 980, opacity: 0.95, color: 0xe6ddd0 },
]

const PRESETS = [
  { key: 'bone', label: 'Bone', low: 250, high: 1500 },
  { key: 'soft', label: 'Soft tissue', low: -80, high: 220 },
  { key: 'lung', label: 'Lung', low: -1000, high: -200 },
  { key: 'vessel', label: 'Vessel', low: 120, high: 650 },
  { key: 'wide', label: 'Wide', low: -1000, high: 1500 },
] as const

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function makeMaterial(spec: TissueSpec) {
  return new THREE.MeshPhysicalMaterial({
    color: spec.color,
    roughness: spec.key === 'bone' ? 0.78 : 0.54,
    metalness: 0,
    transparent: true,
    opacity: spec.opacity,
    depthWrite: spec.opacity > 0.75,
    side: THREE.DoubleSide,
    clippingPlanes: [],
  })
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((object) => {
    const mesh = object as THREE.Mesh
    if (mesh.geometry) mesh.geometry.dispose()
    if (mesh.material) {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const material of materials) material.dispose()
    }
  })
}

function MprPanel({ plane, value }: { plane: PlaneKey; value: number }) {
  const cross = clamp(value, 0, 1) * 100
  const x = plane === 'x' ? cross : 50
  const y = plane === 'y' ? cross : plane === 'z' ? 100 - cross : 50
  const label = plane === 'x' ? 'Sagittal' : plane === 'y' ? 'Coronal' : 'Axial'
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-black/80 p-2">
      <div className="mb-1 flex items-center justify-between gap-2 text-[9px] font-black uppercase tracking-[0.12em] text-white/60">
        <span>{label}</span><span>{Math.round(value * 100)}%</span>
      </div>
      <svg viewBox="0 0 120 92" className="w-full" role="img" aria-label={`${label} synthetic teaching slice`}>
        <defs>
          <radialGradient id={`mpr-${plane}`} cx="50%" cy="48%" r="58%">
            <stop offset="0%" stopColor="#d9d4ca" stopOpacity=".82" />
            <stop offset="32%" stopColor="#8b847d" stopOpacity=".68" />
            <stop offset="58%" stopColor="#34383d" stopOpacity=".95" />
            <stop offset="100%" stopColor="#111317" />
          </radialGradient>
        </defs>
        <rect width="120" height="92" fill="#080a0d" />
        <ellipse cx="60" cy="46" rx="42" ry="35" fill={`url(#mpr-${plane})`} stroke="#9fa6ad" strokeOpacity=".5" />
        <ellipse cx="45" cy="45" rx="11" ry="18" fill="#10171b" opacity=".88" />
        <ellipse cx="75" cy="45" rx="11" ry="18" fill="#10171b" opacity=".88" />
        <circle cx="60" cy="49" r="9" fill="#8a4d45" opacity=".92" />
        <path d="M60 19 L60 74" stroke="#e3ded2" strokeWidth="3" strokeOpacity=".75" />
        <line x1={x} x2={x} y1="4" y2="88" stroke="#00BF63" strokeWidth="1" opacity=".9" />
        <line x1="4" x2="116" y1={y} y2={y} stroke="#00BF63" strokeWidth="1" opacity=".9" />
      </svg>
    </div>
  )
}

export function RadiologyReconstructionLab() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const [mode, setMode] = useState<RenderMode>('overlay')
  const [low, setLow] = useState(-120)
  const [high, setHigh] = useState(1100)
  const [slicePlane, setSlicePlane] = useState<PlaneKey>('z')
  const [slice, setSlice] = useState(0.56)
  const [stereo, setStereo] = useState(false)
  const [cleanup, setCleanup] = useState(true)
  const [quality, setQuality] = useState<'light' | 'full'>('light')
  const [visibleTissues, setVisibleTissues] = useState<Set<TissueKey>>(() => new Set(TISSUES.map((t) => t.key)))
  const [fatal, setFatal] = useState('')

  const selectedCount = useMemo(() => TISSUES.filter((t) => visibleTissues.has(t.key) && t.hu >= low && t.hu <= high).length, [visibleTissues, low, high])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let disposed = false
    let visible = true
    let raf = 0
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50)
    camera.position.set(4.8, 2.7, 6.7)
    const renderer = new THREE.WebGLRenderer({ antialias: quality === 'full', alpha: true, powerPreference: quality === 'light' ? 'low-power' : 'high-performance' })
    renderer.localClippingEnabled = true
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setClearColor(0x05070a, 1)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'light' ? 1.25 : 2))
    renderer.domElement.setAttribute('data-radiology-reconstruction3d', 'synthetic-phantom')
    renderer.domElement.setAttribute('aria-label', 'Interactive synthetic CT MRI reconstruction teaching phantom')
    renderer.domElement.setAttribute('role', 'img')
    mount.replaceChildren(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 4.2
    controls.maxDistance = 11
    controls.target.set(0, 0.35, 0)

    scene.add(new THREE.HemisphereLight(0xffffff, 0x24303a, 1.8))
    const key = new THREE.DirectionalLight(0xffffff, 2.6)
    key.position.set(4, 7, 6)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x88aaff, 1.2)
    rim.position.set(-6, 2, -5)
    scene.add(rim)

    const root = new THREE.Group()
    root.rotation.y = -0.18
    scene.add(root)

    const groups = new Map<TissueKey, THREE.Group>()
    const materials = new Map<TissueKey, THREE.MeshPhysicalMaterial>()
    for (const tissue of TISSUES) {
      const group = new THREE.Group()
      group.userData.tissue = tissue.key
      groups.set(tissue.key, group)
      const material = makeMaterial(tissue)
      materials.set(tissue.key, material)
      root.add(group)
    }

    const mesh = (geometry: THREE.BufferGeometry, tissue: TissueKey, position: [number, number, number], scale: [number, number, number], rotation?: [number, number, number]) => {
      const object = new THREE.Mesh(geometry, materials.get(tissue)!)
      object.position.set(...position)
      object.scale.set(...scale)
      if (rotation) object.rotation.set(...rotation)
      groups.get(tissue)!.add(object)
      return object
    }

    // Deliberately synthetic imaging phantom: approximate spatial cues only, not anatomical geometry.
    mesh(new THREE.SphereGeometry(1, 40, 32), 'skin', [0, 1.9, 0], [1.03, 1.2, 0.98])
    mesh(new THREE.SphereGeometry(1, 34, 28), 'bone', [0, 2.02, 0], [0.78, 0.88, 0.76])
    mesh(new THREE.SphereGeometry(1, 36, 28), 'skin', [0, -0.2, 0], [1.6, 2.05, 0.92])
    mesh(new THREE.CylinderGeometry(0.11, 0.12, 3.7, 16), 'bone', [0, -0.15, -0.22], [1, 1, 1])
    mesh(new THREE.SphereGeometry(1, 28, 22), 'lung', [-0.58, 0.23, 0.02], [0.54, 1.0, 0.46], [0, 0, -0.08])
    mesh(new THREE.SphereGeometry(1, 28, 22), 'lung', [0.58, 0.23, 0.02], [0.54, 1.0, 0.46], [0, 0, 0.08])
    mesh(new THREE.SphereGeometry(1, 28, 24), 'soft', [0.12, -0.04, 0.36], [0.5, 0.63, 0.46], [0.05, 0, -0.25])
    mesh(new THREE.CylinderGeometry(0.08, 0.13, 3.2, 18), 'vessel', [0.02, 0.05, 0.46], [1, 1, 1], [0, 0, 0.03])
    mesh(new THREE.TorusGeometry(0.42, 0.07, 12, 42, Math.PI * 1.55), 'vessel', [0.18, 0.6, 0.35], [1, 1, 1], [Math.PI / 2, 0.2, -0.5])
    for (let y = -1.45; y < 1.25; y += 0.36) {
      mesh(new THREE.TorusGeometry(0.82, 0.045, 10, 40, Math.PI * 1.45), 'detail', [0, y, -0.08], [1, 1, 1], [Math.PI / 2, 0, 0.32])
    }
    for (let i = 0; i < 13; i++) {
      const a = (i / 13) * Math.PI * 2
      mesh(new THREE.SphereGeometry(0.055, 10, 8), 'detail', [Math.cos(a) * 1.32, -1.3 + (i % 4) * 0.6, Math.sin(a) * 0.64], [1, 1, 1])
    }

    const clip = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)
    for (const material of materials.values()) material.clippingPlanes = [clip]

    const stereoCamera = new THREE.StereoCamera()
    stereoCamera.eyeSep = 0.055

    const resize = () => {
      const width = Math.max(1, mount.clientWidth)
      const height = Math.max(300, Math.round(Math.min(560, width * 0.82)))
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(mount)
    resize()

    const updateScene = () => {
      const axis = slicePlane === 'x' ? new THREE.Vector3(-1, 0, 0) : slicePlane === 'y' ? new THREE.Vector3(0, -1, 0) : new THREE.Vector3(0, 0, -1)
      clip.normal.copy(axis)
      clip.constant = (slice - 0.5) * 3.8
      for (const tissue of TISSUES) {
        const group = groups.get(tissue.key)!
        const inWindow = tissue.hu >= low && tissue.hu <= high
        const chosen = visibleTissues.has(tissue.key)
        group.visible = inWindow && chosen && !(cleanup && tissue.key === 'detail' && high < 800)
        const material = materials.get(tissue.key)!
        material.opacity = mode === 'surface' ? Math.min(1, tissue.opacity * 1.25) : mode === 'volume' ? Math.max(0.08, tissue.opacity * 0.48) : tissue.opacity
        material.wireframe = mode === 'volume' && tissue.key !== 'vessel'
        material.depthWrite = material.opacity > 0.72
        material.needsUpdate = true
      }
    }

    const render = () => {
      if (disposed || !visible || document.hidden) return
      updateScene()
      controls.update()
      const width = renderer.domElement.width / renderer.getPixelRatio()
      const height = renderer.domElement.height / renderer.getPixelRatio()
      renderer.setScissorTest(false)
      renderer.setViewport(0, 0, width, height)
      if (!stereo) {
        renderer.render(scene, camera)
      } else {
        stereoCamera.update(camera)
        renderer.setScissorTest(true)
        const half = Math.floor(width / 2)
        renderer.setScissor(0, 0, half, height)
        renderer.setViewport(0, 0, half, height)
        renderer.render(scene, stereoCamera.cameraL)
        renderer.setScissor(half, 0, width - half, height)
        renderer.setViewport(half, 0, width - half, height)
        renderer.render(scene, stereoCamera.cameraR)
        renderer.setScissorTest(false)
      }
      raf = requestAnimationFrame(render)
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      cancelAnimationFrame(raf)
      if (visible && !document.hidden) raf = requestAnimationFrame(render)
    }, { threshold: 0.02 })
    io.observe(mount)
    const onVisibility = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden && visible) raf = requestAnimationFrame(render)
    }
    document.addEventListener('visibilitychange', onVisibility)
    const onContextLost = (event: Event) => {
      event.preventDefault()
      setFatal('WebGL context was lost. Reload this panel to continue the reconstruction simulation.')
    }
    renderer.domElement.addEventListener('webglcontextlost', onContextLost)
    raf = requestAnimationFrame(render)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
      controls.dispose()
      disposeObject(root)
      renderer.renderLists.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      mount.replaceChildren()
    }
  }, [mode, low, high, slicePlane, slice, stereo, cleanup, quality, visibleTissues])

  function applyPreset(lowNext: number, highNext: number) {
    setLow(lowNext)
    setHigh(highNext)
  }

  function toggleTissue(key: TissueKey) {
    setVisibleTissues((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <section data-radiology-reconstruction-lab="synthetic" className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-950 p-3 text-white dark:border-white/10">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-white/45">Radiology reconstruction lab</div>
          <h3 className="mt-0.5 text-sm font-black">Surface + volume reconstruction simulator</h3>
          <p className="mt-1 max-w-2xl text-[10.5px] leading-relaxed text-white/55">Interactive teaching phantom inspired by CT/MRI reconstruction workstations. It is generated geometry, not a DICOM study and not suitable for diagnosis.</p>
        </div>
        <div className="flex flex-wrap gap-1">
          <span className="rounded-full border border-white/10 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-white/45">synthetic phantom</span>
          <span className="rounded-full border border-white/10 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-white/45">WebGL</span>
        </div>
      </div>

      <div className="grid gap-2 lg:grid-cols-[minmax(0,1.7fr)_minmax(260px,.8fr)]">
        <div className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-black">
          {fatal ? <div role="alert" className="p-4 text-sm text-red-300">{fatal}</div> : <div ref={mountRef} className="min-h-[300px] w-full" />}
        </div>

        <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.035] p-2.5">
          <div>
            <div className="mb-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/45">Render mode</div>
            <div className="grid grid-cols-3 gap-1">
              {(['surface', 'volume', 'overlay'] as RenderMode[]).map((item) => (
                <button key={item} type="button" aria-pressed={mode === item} onClick={() => setMode(item)} className={`min-h-11 rounded-lg border px-2 text-[10px] font-black capitalize ${mode === item ? 'border-[#00BF63] bg-[#00BF63]/15 text-white' : 'border-white/10 text-white/60'}`}>{item}</button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.12em] text-white/45"><span>Threshold window</span><span>{low} → {high} HU</span></div>
            <label className="block text-[10px] text-white/50">Lower<input aria-label="Lower reconstruction threshold" type="range" min={-1000} max={1400} step={10} value={low} onChange={(e) => setLow(Math.min(Number(e.target.value), high - 10))} className="w-full accent-[#00BF63]" /></label>
            <label className="block text-[10px] text-white/50">Upper<input aria-label="Upper reconstruction threshold" type="range" min={-900} max={1600} step={10} value={high} onChange={(e) => setHigh(Math.max(Number(e.target.value), low + 10))} className="w-full accent-[#00BF63]" /></label>
            <div className="mt-1 flex flex-wrap gap-1">
              {PRESETS.map((preset) => <button key={preset.key} type="button" onClick={() => applyPreset(preset.low, preset.high)} className="min-h-9 rounded-full border border-white/10 px-2.5 text-[9px] font-black text-white/60">{preset.label}</button>)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1">
            <button type="button" aria-pressed={cleanup} onClick={() => setCleanup((v) => !v)} className={`min-h-11 rounded-lg border px-2 text-[10px] font-black ${cleanup ? 'border-[#00BF63] bg-[#00BF63]/15' : 'border-white/10 text-white/60'}`}>{cleanup ? 'Disconnected hidden' : 'Show small parts'}</button>
            <button type="button" aria-pressed={stereo} onClick={() => setStereo((v) => !v)} className={`min-h-11 rounded-lg border px-2 text-[10px] font-black ${stereo ? 'border-[#00BF63] bg-[#00BF63]/15' : 'border-white/10 text-white/60'}`}>{stereo ? 'Stereo SBS on' : 'Stereo SBS'}</button>
            <button type="button" aria-pressed={quality === 'light'} onClick={() => setQuality((v) => v === 'light' ? 'full' : 'light')} className="min-h-11 rounded-lg border border-white/10 px-2 text-[10px] font-black text-white/60">{quality === 'light' ? 'Lightweight render' : 'Full render'}</button>
            <div className="flex min-h-11 items-center justify-center rounded-lg border border-white/10 px-2 text-center text-[10px] font-black text-white/45">{selectedCount} tissue classes visible</div>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/45">Component isolation</div>
        <div className="flex flex-wrap gap-1">
          {TISSUES.map((tissue) => <button key={tissue.key} type="button" aria-pressed={visibleTissues.has(tissue.key)} onClick={() => toggleTissue(tissue.key)} className={`min-h-10 rounded-full border px-3 text-[10px] font-black ${visibleTissues.has(tissue.key) ? 'border-white/25 bg-white/10 text-white' : 'border-white/10 text-white/35'}`}>{tissue.label}</button>)}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-2.5">
          <div className="mb-1 flex flex-wrap gap-1">
            {(['x', 'y', 'z'] as PlaneKey[]).map((plane) => <button key={plane} type="button" aria-pressed={slicePlane === plane} onClick={() => setSlicePlane(plane)} className={`min-h-10 min-w-10 rounded-lg border px-3 text-[10px] font-black uppercase ${slicePlane === plane ? 'border-[#00BF63] bg-[#00BF63]/15' : 'border-white/10 text-white/50'}`}>{plane}</button>)}
          </div>
          <label className="block text-[10px] text-white/55">Section position · {Math.round(slice * 100)}%<input aria-label="Reconstruction section position" type="range" min={0.02} max={0.98} step={0.01} value={slice} onChange={(e) => setSlice(Number(e.target.value))} className="mt-1 w-full accent-[#00BF63]" /></label>
          <p className="mt-1 text-[9.5px] leading-relaxed text-white/40">The clipping plane and all three MPR crosshairs are linked, mirroring the coordinated 3D + tri-view workflow shown in the reference screenshots.</p>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <MprPanel plane="x" value={slicePlane === 'x' ? slice : 0.5} />
          <MprPanel plane="y" value={slicePlane === 'y' ? slice : 0.5} />
          <MprPanel plane="z" value={slicePlane === 'z' ? slice : 0.5} />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 p-2.5">
          <div className="text-[9px] font-black uppercase tracking-[0.12em] text-white/45">Implemented now</div>
          <p className="mt-1 text-[10px] leading-relaxed text-white/55">Linked surface/volume states, threshold presets, tissue visibility, disconnected-component suppression, clipping sections, MPR crosshairs, orbit navigation, stereo side-by-side and bounded performance modes.</p>
        </div>
        <div className="rounded-xl border border-white/10 p-2.5">
          <div className="text-[9px] font-black uppercase tracking-[0.12em] text-white/45">Fail-closed boundary</div>
          <p className="mt-1 text-[10px] leading-relaxed text-white/55">DICOM import, MRI/CT segmentation, STL/DICOM export, patient measurement and diagnostic inference are intentionally not claimed by this synthetic mode. Those require a validated medical-imaging pipeline and source-specific QA.</p>
        </div>
      </div>
    </section>
  )
}

export default RadiologyReconstructionLab
