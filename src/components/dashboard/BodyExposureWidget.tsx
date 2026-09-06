import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

type Props = {
  className?: string
  hero?: boolean
  interactive?: boolean
  showCta?: boolean
}

const HRA_BASE = 'https://raw.githubusercontent.com/hubmapconsortium/ccf-releases/main/v1.2/models/'
const HRA_MODELS = [
  { file: 'VH_M_Skin.glb', kind: 'skin' as const },
  { file: 'VH_M_Heart.glb', kind: 'organ' as const },
  { file: 'VH_M_Lung.glb', kind: 'organ' as const },
  { file: 'VH_M_Blood_Vasculature.glb', kind: 'organ' as const },
]

const loader = new GLTFLoader()
const modelCache = new Map<string, Promise<THREE.Group>>()

function loadModel(file: string) {
  const existing = modelCache.get(file)
  if (existing) return existing
  const promise = new Promise<THREE.Group>((resolve, reject) => {
    loader.load(`${HRA_BASE}${file}`, (gltf) => resolve(gltf.scene), undefined, reject)
  })
  modelCache.set(file, promise)
  return promise
}

function cloneModel(base: THREE.Group, kind: 'skin' | 'organ') {
  const model = base.clone(true)
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || !object.material) return
    object.material = Array.isArray(object.material)
      ? object.material.map((material) => material.clone())
      : object.material.clone()
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    for (const material of materials) {
      if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
        material.envMapIntensity = 0.72
        material.roughness = Math.max(material.roughness ?? 0.45, 0.32)
        material.metalness = Math.min(material.metalness ?? 0, 0.04)
      }
      if (kind === 'skin') {
        material.transparent = true
        material.opacity = 0.2
        material.depthWrite = false
        material.side = THREE.DoubleSide
      }
    }
  })
  return model
}

const VIEW_SHORTCUTS = [
  { label: 'Front', angle: 0 },
  { label: 'Side', angle: Math.PI / 2 },
  { label: 'Back', angle: Math.PI },
] as const

const EXPLORE = [
  { to: '/body-explorer?mode=realistic-atlas', label: 'Anatomy' },
  { to: '/body-explorer?mode=digital-twin', label: 'Body → Cell' },
  { to: '/body-explorer?mode=cell-genome', label: 'Cell → DNA' },
  { to: '/body-explorer?mode=surgery', label: 'Surgery' },
] as const

export function BodyExposureWidget({ className = '', hero = false, interactive = true, showCta = true }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const rotationRef = useRef(0)
  const zoomRef = useRef(1)
  const dragRef = useRef({ active: false, startX: 0, startRotation: 0 })
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [zoomLabel, setZoomLabel] = useState(100)

  function showView(angle: number) {
    if (!interactive) return
    rotationRef.current = angle
  }

  function setZoom(next: number) {
    if (!interactive) return
    const value = Math.min(1.38, Math.max(0.74, next))
    zoomRef.current = value
    setZoomLabel(Math.round(100 / value))
  }

  function fitView() {
    rotationRef.current = 0
    setZoom(1)
  }

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(hero ? 28 : 29, 1, 0.001, 10000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, hero ? 2 : 1.5))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const pmrem = new THREE.PMREMGenerator(renderer)
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = environment

    const hemi = new THREE.HemisphereLight(0xf4f7fa, 0x11161b, 1.55)
    scene.add(hemi)
    const key = new THREE.DirectionalLight(0xffffff, 2.5)
    key.position.set(3, 5, 5)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xbcd8f2, 1.0)
    fill.position.set(-4, 1.5, 3)
    scene.add(fill)
    const rim = new THREE.DirectionalLight(0xffdfd0, 0.9)
    rim.position.set(2, 4, -5)
    scene.add(rim)

    const pivot = new THREE.Group()
    scene.add(pivot)
    let disposed = false
    let visible = true
    let raf = 0
    let baseCameraZ = 2
    let targetY = 0

    const resize = () => {
      const width = Math.max(1, mount.clientWidth)
      const height = Math.max(1, mount.clientHeight)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting }, { threshold: 0.05 })
    observer.observe(mount)

    void loadModel('VH_M_Skin.glb').then((base) => {
      if (disposed) return
      const skin = cloneModel(base, 'skin')
      const box = new THREE.Box3().setFromObject(skin)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      pivot.position.set(-center.x, -center.y, -center.z)
      pivot.add(skin)

      const height = Math.max(size.y, 0.1)
      baseCameraZ = height * (hero ? 1.05 : 1.18)
      targetY = 0
      camera.position.set(0, height * 0.015, baseCameraZ)
      camera.lookAt(0, targetY, 0)
      camera.near = Math.max(height / 1000, 0.001)
      camera.far = height * 20
      camera.updateProjectionMatrix()

      const internals = HRA_MODELS.filter((item) => item.kind === 'organ')
      void Promise.allSettled(internals.map(async (item) => {
        const organBase = await loadModel(item.file)
        if (disposed) return
        pivot.add(cloneModel(organBase, 'organ'))
      })).then(() => { if (!disposed) setStatus('ready') })
    }).catch(() => { if (!disposed) setStatus('error') })

    const onPointerDown = (event: PointerEvent) => {
      if (!interactive) return
      dragRef.current = { active: true, startX: event.clientX, startRotation: rotationRef.current }
      mount.setPointerCapture?.(event.pointerId)
    }
    const onPointerMove = (event: PointerEvent) => {
      if (!interactive || !dragRef.current.active) return
      rotationRef.current = dragRef.current.startRotation + (event.clientX - dragRef.current.startX) * 0.012
    }
    const onPointerUp = (event: PointerEvent) => {
      if (!interactive) return
      dragRef.current.active = false
      if (mount.hasPointerCapture?.(event.pointerId)) mount.releasePointerCapture?.(event.pointerId)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (!interactive) return
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        rotationRef.current += event.key === 'ArrowLeft' ? -Math.PI / 8 : Math.PI / 8
      } else if (event.key === '+' || event.key === '=') {
        event.preventDefault()
        setZoom(zoomRef.current - 0.1)
      } else if (event.key === '-') {
        event.preventDefault()
        setZoom(zoomRef.current + 0.1)
      } else if (event.key === '0' || event.key.toLowerCase() === 'f') {
        event.preventDefault()
        fitView()
      }
    }
    mount.addEventListener('pointerdown', onPointerDown)
    mount.addEventListener('pointermove', onPointerMove)
    mount.addEventListener('pointerup', onPointerUp)
    mount.addEventListener('pointercancel', onPointerUp)
    mount.addEventListener('keydown', onKeyDown)

    const animate = () => {
      if (visible) {
        pivot.rotation.y += (rotationRef.current - pivot.rotation.y) * 0.11
        const desiredZ = baseCameraZ * zoomRef.current
        camera.position.z += (desiredZ - camera.position.z) * 0.11
        camera.lookAt(0, targetY, 0)
        renderer.render(scene, camera)
      }
      raf = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      observer.disconnect()
      mount.removeEventListener('pointerdown', onPointerDown)
      mount.removeEventListener('pointermove', onPointerMove)
      mount.removeEventListener('pointerup', onPointerUp)
      mount.removeEventListener('pointercancel', onPointerUp)
      mount.removeEventListener('keydown', onKeyDown)
      environment.dispose()
      pmrem.dispose()
      renderer.dispose()
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement)
    }
  }, [hero, interactive])

  return (
    <section className={`relative overflow-hidden rounded-[28px] border border-white/10 bg-[#080b0e] shadow-[0_22px_60px_rgba(4,10,14,.28)] ${className}`}>
      <div ref={mountRef} className={`relative z-10 w-full select-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300/70 ${interactive ? 'cursor-grab touch-none active:cursor-grabbing' : ''} ${hero ? 'h-[clamp(430px,68vh,760px)]' : 'h-[320px]'}`} aria-label="HuBMAP Human Reference Atlas body preview. Drag to rotate and use the view controls." role={interactive ? 'application' : 'img'} tabIndex={interactive ? 0 : -1} />

      <div className="pointer-events-none absolute inset-x-4 top-4 z-20 flex items-start justify-between gap-3">
        <div className="max-w-[72%]">
          <span className="inline-flex rounded-full border border-white/12 bg-black/45 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.14em] text-cyan-200 backdrop-blur-xl">HuBMAP Human Reference Atlas</span>
          <h2 className="mt-2 text-[17px] font-black tracking-[-.025em] text-white sm:text-xl">Reference human anatomy</h2>
          <p className="mt-1 max-w-md text-[10px] font-medium leading-relaxed text-white/55">Visible Human reference skin, heart, lungs and blood vasculature. Source geometry is loaded from the HRA release rather than generated as decorative anatomy.</p>
        </div>
        <span className="shrink-0 rounded-full border border-white/12 bg-black/45 px-2.5 py-1 text-[9px] font-black text-white/70 backdrop-blur-xl">{status === 'ready' ? 'HRA ready' : status === 'error' ? 'Source unavailable' : 'Loading HRA…'}</span>
      </div>

      {interactive && status === 'ready' && (
        <div className="absolute inset-x-3 bottom-3 z-30 flex justify-center" aria-label="3D body controls">
          <div className="flex flex-wrap justify-center gap-1 rounded-full border border-white/10 bg-black/55 p-1.5 backdrop-blur-xl">
            {VIEW_SHORTCUTS.map((item) => <button key={item.label} type="button" onClick={() => showView(item.angle)} className="rounded-full px-3 py-2 text-[9px] font-black text-white/75 transition hover:bg-white/10 hover:text-white active:scale-95">{item.label}</button>)}
            <span className="mx-0.5 h-7 w-px self-center bg-white/10" aria-hidden />
            <button type="button" onClick={() => setZoom(zoomRef.current + 0.1)} className="grid h-8 w-8 place-items-center rounded-full text-sm font-black text-white/75 hover:bg-white/10" aria-label="Zoom out">−</button>
            <button type="button" onClick={fitView} className="rounded-full px-2.5 py-2 text-[9px] font-black text-white/65 hover:bg-white/10">Fit</button>
            <button type="button" onClick={() => setZoom(zoomRef.current - 0.1)} className="grid h-8 w-8 place-items-center rounded-full text-sm font-black text-white/75 hover:bg-white/10" aria-label="Zoom in">＋</button>
            <span className="self-center px-1 text-[9px] font-black tabular-nums text-white/35">{zoomLabel}%</span>
          </div>
        </div>
      )}

      {status === 'error' && <div className="absolute inset-x-4 bottom-4 z-30 rounded-2xl border border-rose-300/20 bg-black/65 p-3 text-[10px] font-semibold text-rose-100 backdrop-blur-xl">The external HRA model could not be loaded. Open the full atlas to retry or inspect the live source references.</div>}

      {hero && <div className="absolute bottom-16 left-3 right-3 z-30 hidden gap-2 sm:flex">{EXPLORE.map((item) => <Link key={item.to} to={item.to} className="flex min-w-0 flex-1 items-center justify-between rounded-2xl border border-white/10 bg-black/45 px-3 py-2.5 text-[9px] font-black text-white/75 backdrop-blur-xl transition hover:bg-white/10 hover:text-white"><span className="truncate">{item.label}</span><span>→</span></Link>)}</div>}

      {showCta && !hero && <Link to="/body-explorer?mode=realistic-atlas" className="absolute bottom-[62px] right-4 z-30 hidden rounded-full border border-white/10 bg-white px-3.5 py-2 text-[9px] font-black text-neutral-950 shadow-sm sm:inline-flex">Open HRA anatomy →</Link>}

      <a href="https://humanatlas.io/3d-reference-library" target="_blank" rel="noreferrer" className="absolute bottom-[66px] left-4 z-30 text-[8px] font-bold uppercase tracking-[.12em] text-white/35 hover:text-white/70">Source: HuBMAP HRA · CC BY 4.0 ↗</a>
    </section>
  )
}
