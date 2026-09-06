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
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(hero ? 30 : 28, 1, 0.01, 100)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, hero ? 2 : 1.5))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
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
          roughness: 0.43,
          metalness: 0,
          clearcoat: 0.18,
          clearcoatRoughness: 0.42,
          sheen: 0.3,
          sheenColor: new THREE.Color(0xffd8c6),
          transmission: 0.025,
          thickness: 0.35,
          transparent: true,
          opacity: hero ? 0.94 : 0.91,
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

    const pointer = { x: 0, y: 0 }
    const onPointerMove = (event: PointerEvent) => {
      if (!interactive) return
      const rect = mount.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2
      pointer.y = ((event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 2
    }
    mount.addEventListener('pointermove', onPointerMove)

    const clock = new THREE.Clock()
    const animate = () => {
      const t = clock.getElapsedTime()
      if (visible) {
        const targetY = t * 0.11 + pointer.x * 0.12
        pivot.rotation.y += (targetY - pivot.rotation.y) * 0.025
        pivot.rotation.x += ((pointer.y * 0.035) - pivot.rotation.x) * 0.025
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
      mount.removeEventListener('pointermove', onPointerMove)
      environment.dispose()
      pmrem.dispose()
      renderer.dispose()
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement)
    }
  }, [hero, interactive])

  return (
    <div className={`panacea-body-widget relative overflow-hidden ${className}`}>
      <div className="pointer-events-none absolute inset-0 panacea-orbit-field" aria-hidden />
      <div ref={mountRef} className={`relative z-10 w-full ${hero ? 'h-[clamp(360px,62vh,720px)]' : 'h-[250px]'}`} aria-label="Interactive reference human anatomy preview" />
      <div className="pointer-events-none absolute inset-x-4 top-4 z-20 flex items-center justify-between gap-2">
        <span className="panacea-kicker">Reference anatomy · 3D</span>
        <span className="rounded-full border border-white/15 bg-black/20 px-2.5 py-1 text-[10px] font-bold text-white/70 backdrop-blur-xl">
          {status === 'ready' ? 'Live model' : status === 'error' ? 'Preview unavailable' : 'Loading atlas…'}
        </span>
      </div>
      {!hero && (
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-20">
          <div className="text-sm font-black text-white">Your body, from whole-person to molecular scale</div>
          <div className="mt-1 text-[11px] leading-relaxed text-white/65">Rotate the reference model here, then open the full Digital Twin for anatomy, radiology and 4D physiology.</div>
        </div>
      )}
      {showCta && (
        <Link to="/body-explorer" className="liquid-orbit-button pointer-events-auto absolute bottom-4 right-4 z-30 hidden sm:inline-flex">
          Open 4D atlas <span aria-hidden>→</span>
        </Link>
      )}
    </div>
  )
}
