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

export function BodyExposureWidget({ className = '', hero = false, interactive = true, showCta = true }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const rotationRef = useRef(0)
  const hasInteractedRef = useRef(false)
  const dragRef = useRef({ active: false, startX: 0, startRotation: 0 })
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  function showView(angle: number) {
    if (!interactive) return
    hasInteractedRef.current = true
    rotationRef.current = angle
  }

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(hero ? 30 : 28, 1, 0.01, 100)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, hero ? 2 : 1.5))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.08
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const pmrem = new THREE.PMREMGenerator(renderer)
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = environment

    const key = new THREE.DirectionalLight(0xffe6b0, 3.1)
    key.position.set(2.4, 4.5, 4)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0x7ef0ff, 1.8)
    fill.position.set(-3, 1, 2)
    scene.add(fill)
    const rim = new THREE.DirectionalLight(0x5cff9b, 2.1)
    rim.position.set(0, 2, -4)
    scene.add(rim)

    const pivot = new THREE.Group()
    scene.add(pivot)
    let disposed = false
    let visible = true
    let raf = 0

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
          color: 0xb87568,
          roughness: 0.4,
          metalness: 0,
          clearcoat: 0.2,
          clearcoatRoughness: 0.38,
          sheen: 0.32,
          sheenColor: new THREE.Color(0xffd8c6),
          transmission: 0.03,
          thickness: 0.35,
          transparent: true,
          opacity: hero ? 0.95 : 0.92,
          side: THREE.DoubleSide,
        })
      })
      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      model.position.sub(center)
      pivot.add(model)
      const height = Math.max(size.y, 0.1)
      camera.position.set(0, height * 0.05, height * (hero ? 1.18 : 1.28))
      camera.lookAt(0, height * 0.02, 0)
      camera.near = Math.max(height / 100, 0.01)
      camera.far = height * 10
      camera.updateProjectionMatrix()
      setStatus('ready')
    }).catch(() => { if (!disposed) setStatus('error') })

    const parallax = { x: 0, y: 0 }
    const onPointerDown = (event: PointerEvent) => {
      if (!interactive) return
      dragRef.current = { active: true, startX: event.clientX, startRotation: rotationRef.current }
      hasInteractedRef.current = true
      mount.setPointerCapture?.(event.pointerId)
    }
    const onPointerMove = (event: PointerEvent) => {
      if (!interactive) return
      const rect = mount.getBoundingClientRect()
      parallax.x = ((event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2
      parallax.y = ((event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 2
      if (dragRef.current.active) {
        rotationRef.current = dragRef.current.startRotation + (event.clientX - dragRef.current.startX) * 0.012
      }
    }
    const onPointerUp = (event: PointerEvent) => {
      if (!interactive) return
      dragRef.current.active = false
      if (mount.hasPointerCapture?.(event.pointerId)) mount.releasePointerCapture?.(event.pointerId)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (!interactive) return
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()
      hasInteractedRef.current = true
      rotationRef.current += event.key === 'ArrowLeft' ? -Math.PI / 8 : Math.PI / 8
    }
    mount.addEventListener('pointerdown', onPointerDown)
    mount.addEventListener('pointermove', onPointerMove)
    mount.addEventListener('pointerup', onPointerUp)
    mount.addEventListener('pointercancel', onPointerUp)
    mount.addEventListener('keydown', onKeyDown)

    const clock = new THREE.Clock()
    const animate = () => {
      const t = clock.getElapsedTime()
      if (visible) {
        const baseRotation = hasInteractedRef.current ? rotationRef.current : t * 0.075
        const targetY = baseRotation + (dragRef.current.active ? 0 : parallax.x * 0.055)
        pivot.rotation.y += (targetY - pivot.rotation.y) * 0.075
        pivot.rotation.x += ((parallax.y * 0.025) - pivot.rotation.x) * 0.04
        pivot.position.y = Math.sin(t * 0.9) * 0.008
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
    <div className={`panacea-body-widget relative overflow-hidden ${className}`}>
      <div className="pointer-events-none absolute inset-0 panacea-orbit-field" aria-hidden />
      <div
        ref={mountRef}
        className={`relative z-10 w-full select-none ${interactive ? 'cursor-grab touch-none active:cursor-grabbing' : ''} ${hero ? 'h-[clamp(360px,62vh,720px)]' : 'h-[250px]'}`}
        aria-label="Interactive 3D reference human body. Drag left or right to rotate."
        role={interactive ? 'application' : 'img'}
        tabIndex={interactive ? 0 : -1}
      />

      <div className="pointer-events-none absolute inset-x-4 top-4 z-20 flex items-start justify-between gap-2">
        <div>
          <span className="panacea-kicker">3D body preview</span>
          <div className="mt-1 text-[10px] font-semibold text-white/55">{interactive ? 'Drag to rotate · use arrows on keyboard' : 'Reference anatomy'}</div>
        </div>
        <span className="rounded-full border border-white/15 bg-black/25 px-2.5 py-1 text-[10px] font-bold text-white/70 backdrop-blur-xl">
          {status === 'ready' ? 'Ready' : status === 'error' ? 'Preview unavailable' : 'Loading…'}
        </span>
      </div>

      {interactive && status === 'ready' && (
        <div className="absolute right-3 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-1.5 sm:flex" aria-label="3D view shortcuts">
          {[
            ['Front', 0],
            ['Side', Math.PI / 2],
            ['Back', Math.PI],
          ].map(([label, angle]) => (
            <button
              key={String(label)}
              type="button"
              onClick={() => showView(Number(angle))}
              className="rounded-full border border-white/12 bg-black/30 px-3 py-1.5 text-[9px] font-black text-white/70 backdrop-blur-xl transition hover:border-white/30 hover:bg-white/10 hover:text-white"
            >
              {String(label)}
            </button>
          ))}
        </div>
      )}

      {!hero && (
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-20 pr-0 sm:pr-32">
          <div className="text-sm font-black text-white">See where things are before opening the details</div>
          <div className="mt-1 max-w-md text-[11px] leading-relaxed text-white/65">This is a reference human model—not your scan. Rotate it here, then open the atlas for anatomy, physiology, radiology and workout views.</div>
        </div>
      )}

      {interactive && hero && (
        <div className="pointer-events-none absolute bottom-4 right-4 z-20 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[9px] font-bold text-white/55 backdrop-blur-xl sm:hidden">
          Swipe body left ↔ right
        </div>
      )}

      {showCta && (
        <Link to="/body-explorer" className="liquid-orbit-button pointer-events-auto absolute bottom-4 right-4 z-30 hidden sm:inline-flex">
          Explore the body <span aria-hidden>→</span>
        </Link>
      )}
    </div>
  )
}
