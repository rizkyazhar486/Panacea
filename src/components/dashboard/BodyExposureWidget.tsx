import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

type Props = {
  className?: string
  hero?: boolean
  interactive?: boolean
  showCta?: boolean
}

const loader = new GLTFLoader()
loader.setMeshoptDecoder(MeshoptDecoder)
let cached: Promise<THREE.Group> | null = null

function loadSurface() {
  if (!cached) {
    cached = new Promise((resolve, reject) => {
      loader.load(
        `${import.meta.env.BASE_URL}anatomy/surface.glb`,
        (gltf) => resolve(gltf.scene),
        undefined,
        reject,
      )
    })
  }
  return cached
}

const VIEW_SHORTCUTS = [
  { label: 'Front', angle: 0 },
  { label: 'Side', angle: Math.PI / 2 },
  { label: 'Back', angle: Math.PI },
] as const

const EXPLORE = [
  { to: '/body-explorer?mode=realistic-atlas', emoji: '🫀', label: 'Anatomy' },
  { to: '/body-explorer?mode=digital-twin', emoji: '🔬', label: 'Body → Cell' },
  { to: '/body-explorer?mode=workout-4d', emoji: '🏃', label: 'Exercise' },
  { to: '/body-explorer?mode=surgery', emoji: '🩺', label: 'Surgery' },
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
    const camera = new THREE.PerspectiveCamera(hero ? 29 : 28, 1, 0.01, 100)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, hero ? 2 : 1.5))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.02
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const pmrem = new THREE.PMREMGenerator(renderer)
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = environment

    const hemi = new THREE.HemisphereLight(0xfff7ef, 0x59616a, 1.35)
    scene.add(hemi)
    const key = new THREE.DirectionalLight(0xfff1df, 3.2)
    key.position.set(3.2, 5.2, 4.5)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xd8e4ef, 1.35)
    fill.position.set(-3.4, 2.2, 3)
    scene.add(fill)
    const rim = new THREE.DirectionalLight(0xffffff, 1.05)
    rim.position.set(-1, 3, -4)
    scene.add(rim)

    const pivot = new THREE.Group()
    scene.add(pivot)
    let disposed = false
    let visible = true
    let raf = 0
    let baseCameraZ = 2
    let targetY = 0

    const resize = () => {
      const w = Math.max(1, mount.clientWidth)
      const h = Math.max(1, mount.clientHeight)
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting }, { threshold: 0.05 })
    observer.observe(mount)

    loadSurface().then((base) => {
      if (disposed) return
      const model = base.clone(true)
      model.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return
        obj.material = new THREE.MeshPhysicalMaterial({
          color: 0xc98f7c,
          roughness: 0.56,
          metalness: 0,
          clearcoat: 0.06,
          clearcoatRoughness: 0.72,
          sheen: 0.12,
          sheenColor: new THREE.Color(0xffe5d8),
          transmission: 0,
          transparent: false,
          opacity: 1,
          side: THREE.DoubleSide,
        })
      })

      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      model.position.sub(center)
      pivot.add(model)

      const height = Math.max(size.y, 0.1)
      baseCameraZ = height * (hero ? 1.16 : 1.25)
      targetY = height * 0.015
      camera.position.set(0, height * 0.035, baseCameraZ)
      camera.lookAt(0, targetY, 0)
      camera.near = Math.max(height / 100, 0.01)
      camera.far = height * 10
      camera.updateProjectionMatrix()
      setStatus('ready')
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
        pivot.rotation.y += (rotationRef.current - pivot.rotation.y) * 0.12
        pivot.rotation.x += (0 - pivot.rotation.x) * 0.12
        pivot.position.y = 0
        const desiredZ = baseCameraZ * zoomRef.current
        camera.position.z += (desiredZ - camera.position.z) * 0.12
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
    <section className={`panacea-body-widget relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-[#182027] via-[#0f151a] to-[#090d10] shadow-[0_22px_60px_rgba(4,10,14,.28)] ${className}`}>
      <div className="pointer-events-none absolute inset-x-[15%] bottom-[7%] h-[12%] rounded-[50%] bg-black/45 blur-2xl" aria-hidden />
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-300/[.07] blur-3xl" aria-hidden />

      <div
        ref={mountRef}
        className={`relative z-10 w-full select-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300/70 ${interactive ? 'cursor-grab touch-none active:cursor-grabbing' : ''} ${hero ? 'h-[clamp(410px,66vh,760px)]' : 'h-[300px]'}`}
        aria-label="Interactive reference human body. Drag left or right to rotate. Use the view and zoom controls below."
        role={interactive ? 'application' : 'img'}
        tabIndex={interactive ? 0 : -1}
      />

      <div className="pointer-events-none absolute inset-x-4 top-4 z-20 flex items-start justify-between gap-3">
        <div className="max-w-[70%]">
          <span className="inline-flex rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.14em] text-white/85 backdrop-blur-xl">Body Exposure</span>
          <h2 className="mt-2 text-[17px] font-black tracking-[-.025em] text-white sm:text-xl">Your body, from outside in.</h2>
          <p className="mt-1 max-w-md text-[10px] font-medium leading-relaxed text-white/60">Start with a calm reference body, then open anatomy, cells, exercise or surgery only when you need the deeper layer.</p>
        </div>
        <span className="shrink-0 rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[10px] font-bold text-white/80 backdrop-blur-xl">
          {status === 'ready' ? 'Ready' : status === 'error' ? 'Preview unavailable' : 'Loading…'}
        </span>
      </div>

      {interactive && status === 'ready' && (
        <div className="absolute inset-x-3 bottom-3 z-30 flex flex-col items-center gap-2" aria-label="3D body controls">
          <div className="flex flex-wrap justify-center gap-1.5 rounded-full border border-white/10 bg-black/45 p-1.5 backdrop-blur-xl">
            {VIEW_SHORTCUTS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => showView(item.angle)}
                className="rounded-full px-3 py-2 text-[10px] font-black text-white/80 transition hover:bg-white/12 hover:text-white active:scale-95"
              >
                {item.label}
              </button>
            ))}
            <span className="mx-0.5 h-7 w-px self-center bg-white/10" aria-hidden />
            <button type="button" onClick={() => setZoom(zoomRef.current + 0.1)} className="grid h-8 w-8 place-items-center rounded-full text-sm font-black text-white/80 hover:bg-white/12" aria-label="Zoom out">−</button>
            <button type="button" onClick={fitView} className="rounded-full px-2.5 py-2 text-[9px] font-black text-white/70 hover:bg-white/12" aria-label="Fit body in view">Fit</button>
            <button type="button" onClick={() => setZoom(zoomRef.current - 0.1)} className="grid h-8 w-8 place-items-center rounded-full text-sm font-black text-white/80 hover:bg-white/12" aria-label="Zoom in">＋</button>
            <span className="self-center px-1 text-[9px] font-black tabular-nums text-white/45" aria-hidden>{zoomLabel}%</span>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-x-4 bottom-4 z-30 rounded-2xl border border-white/10 bg-black/55 p-3 text-[11px] text-white/70 backdrop-blur-xl">
          The lightweight body preview could not load. The full anatomy tools are still available below.
        </div>
      )}

      {hero && (
        <div className="absolute bottom-16 left-3 right-3 z-30 hidden gap-2 sm:flex">
          {EXPLORE.map((item) => (
            <Link key={item.to} to={item.to} className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-3 py-2.5 text-[10px] font-black text-white/80 backdrop-blur-xl transition hover:bg-white/10 hover:text-white">
              <span aria-hidden>{item.emoji}</span><span className="truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      )}

      {!hero && (
        <div className="pointer-events-none absolute bottom-[62px] left-4 right-4 z-20 sm:right-40">
          <div className="text-sm font-black text-white">A real reference body, not an animated toy</div>
          <div className="mt-1 max-w-md text-[10px] leading-relaxed text-white/60">No automatic pulse, bobbing or decorative body motion. Rotate only when you want another view.</div>
        </div>
      )}

      {showCta && !hero && (
        <Link to="/body-explorer?mode=realistic-atlas" className="liquid-orbit-button pointer-events-auto absolute bottom-[60px] right-4 z-30 hidden sm:inline-flex">
          Open 3D anatomy <span aria-hidden>→</span>
        </Link>
      )}
    </section>
  )
}
