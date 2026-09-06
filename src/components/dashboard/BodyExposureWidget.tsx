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
  const dragRef = useRef({ active: false, startX: 0, startRotation: 0 })
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  function showView(angle: number) {
    if (!interactive) return
    rotationRef.current = angle
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

    // Neutral studio lighting. The previous cyan/green rim lights made a
    // reference body look synthetic and harder to read as anatomy.
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
      camera.position.set(0, height * 0.035, height * (hero ? 1.16 : 1.25))
      camera.lookAt(0, height * 0.015, 0)
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
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()
      rotationRef.current += event.key === 'ArrowLeft' ? -Math.PI / 8 : Math.PI / 8
    }
    mount.addEventListener('pointerdown', onPointerDown)
    mount.addEventListener('pointermove', onPointerMove)
    mount.addEventListener('pointerup', onPointerUp)
    mount.addEventListener('pointercancel', onPointerUp)
    mount.addEventListener('keydown', onKeyDown)

    const animate = () => {
      if (visible) {
        // Deliberately no auto-spin, pulse, bob or pointer parallax. The body
        // stays still like a real atlas specimen until the user rotates it.
        pivot.rotation.y += (rotationRef.current - pivot.rotation.y) * 0.12
        pivot.rotation.x += (0 - pivot.rotation.x) * 0.12
        pivot.position.y = 0
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
    <div className={`panacea-body-widget relative overflow-hidden bg-gradient-to-b from-[#182027] via-[#0f151a] to-[#090d10] ${className}`}>
      <div className="pointer-events-none absolute inset-x-[15%] bottom-[7%] h-[12%] rounded-[50%] bg-black/45 blur-2xl" aria-hidden />
      <div
        ref={mountRef}
        className={`relative z-10 w-full select-none ${interactive ? 'cursor-grab touch-none active:cursor-grabbing' : ''} ${hero ? 'h-[clamp(360px,62vh,720px)]' : 'h-[250px]'}`}
        aria-label="Interactive reference human body. Drag left or right to rotate the model."
        role={interactive ? 'application' : 'img'}
        tabIndex={interactive ? 0 : -1}
      />

      <div className="pointer-events-none absolute inset-x-4 top-4 z-20 flex items-start justify-between gap-2">
        <div>
          <span className="rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.14em] text-white/85 backdrop-blur-xl">Reference body</span>
          <div className="mt-2 text-[10px] font-semibold text-white/70">{interactive ? 'Drag the body to rotate' : 'Reference anatomy'}</div>
        </div>
        <span className="rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[10px] font-bold text-white/80 backdrop-blur-xl">
          {status === 'ready' ? '3D ready' : status === 'error' ? 'Preview unavailable' : 'Loading…'}
        </span>
      </div>

      {interactive && status === 'ready' && (
        <div className="absolute inset-x-3 bottom-3 z-30 flex justify-center gap-1.5" aria-label="3D view shortcuts">
          {[
            ['Front', 0],
            ['Side', Math.PI / 2],
            ['Back', Math.PI],
          ].map(([label, angle]) => (
            <button
              key={String(label)}
              type="button"
              onClick={() => showView(Number(angle))}
              className="rounded-full border border-white/15 bg-black/55 px-3.5 py-2 text-[10px] font-black text-white/85 backdrop-blur-xl transition hover:bg-white/15 hover:text-white"
            >
              {String(label)}
            </button>
          ))}
        </div>
      )}

      {!hero && (
        <div className="pointer-events-none absolute bottom-14 left-4 right-4 z-20 sm:right-36">
          <div className="text-sm font-black text-white">A body you can orient before opening the atlas</div>
          <div className="mt-1 max-w-md text-[11px] leading-relaxed text-white/70">Reference anatomy only—not your scan. Front, side and back stay still until you move them.</div>
        </div>
      )}

      {showCta && (
        <Link to="/body-explorer" className="liquid-orbit-button pointer-events-auto absolute bottom-14 right-4 z-30 hidden sm:inline-flex">
          Open anatomy atlas <span aria-hidden>→</span>
        </Link>
      )}
    </div>
  )
}
