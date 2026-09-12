import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CARDIO_BY_NAME, CARDIO_PARTS } from '../lib/cardioAtlas.gen'
import { cardiacCycleVisualState } from '../lib/cardiacCycleVisual'
import { body3dPixelRatio } from '../lib/body3dQuality'

interface Props {
  hr?: number
  tinggi?: number
}

const N_PARTIKEL = 14
const JALUR = {
  rightFill: ['Cavity of right atrium', 'Anterior leaflet of tricuspid valve', 'Cavity of right ventricle'],
  rightEject: ['Cavity of right ventricle', 'Right anterior cusp of pulmonary valve', 'Pulmonary trunk'],
  leftFill: ['Cavity of left atrium', 'Anterior leaflet of mitral valve', 'Cavity of left ventricle'],
  leftEject: ['Cavity of left ventricle', 'Anterior cusp of aortic valve', 'Ascending aorta'],
} as const

const TAMBAHAN = new Set([
  'Pulmonary trunk', 'Ascending aorta', 'Superior vena cava', 'Inferior vena cava',
  'Left superior pulmonary vein', 'Right superior pulmonary vein',
])

function kurva(nama: readonly string[]): THREE.CatmullRomCurve3 | null {
  const titik = nama
    .map((n) => CARDIO_BY_NAME[n.toLowerCase()]?.centroid)
    .filter((p): p is [number, number, number] => Boolean(p))
    .map((p) => new THREE.Vector3(p[0], p[1], p[2]))
  return titik.length >= 2 ? new THREE.CatmullRomCurve3(titik, false, 'centripetal') : null
}

function buatPartikel(scene: THREE.Scene, curve: THREE.CatmullRomCurve3 | null, warna: string) {
  if (!curve) return null
  const geo = new THREE.SphereGeometry(0.012, 8, 6)
  const mat = new THREE.MeshBasicMaterial({ color: warna, transparent: true, opacity: 0.8, depthWrite: false })
  const mesh = new THREE.InstancedMesh(geo, mat, N_PARTIKEL)
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  mesh.frustumCulled = false
  scene.add(mesh)
  return { curve, mesh, mat, geo, t: 0 }
}

function namaBersih(s: string): string {
  return s.replace(/\s/g, '_').replace(/[^\w-]/g, '')
}

export function CardiacCycle3D({ hr = 72, tinggi = 300 }: Props) {
  const wadahRef = useRef<HTMLDivElement>(null)
  const hrRef = useRef(hr)
  hrRef.current = hr
  const [muat, setMuat] = useState(true)
  const [gagal, setGagal] = useState('')

  useEffect(() => {
    const wadah = wadahRef.current
    if (!wadah) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100)
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setGagal('This device could not start the cardiac 3D render.')
      setMuat(false)
      return
    }
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.dataset.cardiacCycle3d = 'true'
    wadah.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.75))
    const key = new THREE.DirectionalLight(0xffffff, 1.25)
    key.position.set(2, 3, 4)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xffffff, 0.45)
    rim.position.set(-3, 1, -2)
    scene.add(rim)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true

    const resize = () => {
      const w = wadah.clientWidth
      const h = wadah.clientHeight
      if (w < 2 || h < 2) return
      const mobile = window.matchMedia('(max-width: 640px)').matches
      renderer.setPixelRatio(body3dPixelRatio(w, h, window.devicePixelRatio || 1, mobile))
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wadah)

    const source = new Map(CARDIO_PARTS.map((p) => [namaBersih(p.name), p]))
    const meshes: THREE.Mesh[] = []
    const warna = new Map<THREE.Mesh, THREE.Color>()
    let root: THREE.Group | null = null

    const flows = [
      { flow: buatPartikel(scene, kurva(JALUR.rightFill), '#5aa2ff'), mode: 'fill' as const },
      { flow: buatPartikel(scene, kurva(JALUR.rightEject), '#5aa2ff'), mode: 'eject' as const },
      { flow: buatPartikel(scene, kurva(JALUR.leftFill), '#ff5a5a'), mode: 'fill' as const },
      { flow: buatPartikel(scene, kurva(JALUR.leftEject), '#ff5a5a'), mode: 'eject' as const },
    ]
    const tmp = new THREE.Object3D()

    // cardio.glb dan seluruh berkas di public/organs terkompresi meshopt.
    // Tanpa dekodernya GLTFLoader menolak berkasnya dan kanvasnya diam.
    const loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)
    loader.load(
      `${import.meta.env.BASE_URL}cardio/cardio.glb`,
      (gltf) => {
        root = gltf.scene
        root.traverse((o) => {
          if (!(o as THREE.Mesh).isMesh) return
          const m = o as THREE.Mesh
          const meta = source.get(namaBersih(m.name))
          if (!meta) {
            m.visible = false
            return
          }
          const keep = meta.region === 'heart' || TAMBAHAN.has(meta.name)
          m.visible = keep
          if (!keep) return
          const material = m.material as THREE.Material | THREE.Material[]
          if (Array.isArray(material)) {
            m.visible = false
            return
          }
          const cloned = (material as THREE.MeshStandardMaterial).clone()
          cloned.transparent = true
          m.material = cloned
          m.name = meta.name
          warna.set(m, cloned.color.clone())
          meshes.push(m)
        })
        scene.add(root)

        const box = new THREE.Box3()
        for (const m of meshes) box.expandByObject(m)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        const span = Math.max(size.x, size.y, size.z, 0.05)
        controls.target.copy(center)
        camera.position.set(center.x + span * 0.4, center.y + span * 0.15, center.z + span * 2.4)
        camera.lookAt(center)
        setMuat(false)
      },
      undefined,
      () => {
        setGagal('Could not load the source heart geometry.')
        setMuat(false)
      },
    )

    const clock = new THREE.Clock()
    let raf = 0
    let inViewport = true
    let documentVisible = !document.hidden

    const render = () => {
      raf = 0
      if (!inViewport || !documentVisible) return
      const dt = Math.min(clock.getDelta(), 0.1)
      const elapsed = clock.getElapsedTime()
      const state = cardiacCycleVisualState(elapsed, hrRef.current)

      for (const m of meshes) {
        const mat = m.material as THREE.MeshStandardMaterial
        const original = warna.get(m)
        if (original) mat.color.copy(original)
        mat.emissive.setRGB(0, 0, 0)
        mat.emissiveIntensity = 1
        mat.opacity = 0.82

        const n = m.name.toLowerCase()
        const av = /mitral|tricuspid/.test(n)
        const semilunar = /aortic|pulmonary/.test(n) && /leaflet|cusp/.test(n)
        const atrium = /atrium/.test(n)
        const ventricle = /ventricle/.test(n)

        if (av) {
          const k = state.avValvesOpen ? 0.7 : 0.08
          mat.emissive.setRGB(0.15 * k, 0.65 * k, 0.25 * k)
          mat.opacity = state.avValvesOpen ? 1 : 0.5
        } else if (semilunar) {
          const k = state.semilunarValvesOpen ? 0.75 : 0.08
          mat.emissive.setRGB(0.8 * k, 0.35 * k, 0.08 * k)
          mat.opacity = state.semilunarValvesOpen ? 1 : 0.5
        } else if (atrium) {
          const k = 0.12 + state.atrialKick * 0.55
          mat.emissive.setRGB(k * 0.25, k * 0.18, k * 0.35)
        } else if (ventricle) {
          const k = 0.1 + state.systolicPulse * 0.5
          mat.emissive.setRGB(k * 0.45, k * 0.12, k * 0.12)
        }
      }

      for (const item of flows) {
        const f = item.flow
        if (!f) continue
        const activity = item.mode === 'fill'
          ? Math.max(0.08, state.diastolicPulse, state.atrialKick)
          : Math.max(0.05, state.systolicPulse)
        f.mat.opacity = Math.min(0.95, 0.12 + activity * 0.83)
        f.t = (f.t + dt * (0.08 + activity * 0.9)) % 1
        for (let i = 0; i < N_PARTIKEL; i++) {
          const p = f.curve.getPointAt((f.t + i / N_PARTIKEL) % 1)
          const r = 0.65 + activity * 0.55
          tmp.position.copy(p)
          tmp.scale.setScalar(r)
          tmp.updateMatrix()
          f.mesh.setMatrixAt(i, tmp.matrix)
        }
        f.mesh.instanceMatrix.needsUpdate = true
      }

      controls.update()
      renderer.render(scene, camera)
      raf = requestAnimationFrame(render)
    }

    const start = () => {
      if (!raf && inViewport && documentVisible) raf = requestAnimationFrame(render)
    }
    const stop = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }
    const io = new IntersectionObserver(([entry]) => {
      inViewport = Boolean(entry?.isIntersecting)
      if (inViewport) start()
      else stop()
    }, { rootMargin: '128px' })
    io.observe(wadah)
    const onVisibility = () => {
      documentVisible = !document.hidden
      if (documentVisible) start()
      else stop()
    }
    document.addEventListener('visibilitychange', onVisibility)
    start()

    return () => {
      stop()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      controls.dispose()
      for (const item of flows) {
        item.flow?.geo.dispose()
        item.flow?.mat.dispose()
      }
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        if (!m.isMesh) return
        m.geometry.dispose()
        const material = m.material as THREE.Material | THREE.Material[]
        if (Array.isArray(material)) material.forEach((x) => x.dispose())
        else material.dispose()
      })
      renderer.renderLists.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div className="relative overflow-hidden rounded-2xl bg-neutral-50 dark:bg-white/5">
      <div ref={wadahRef} style={{ height: tinggi }} className="w-full" />
      {muat && !gagal && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-neutral-500">Loading cardiac cycle render…</span>
        </div>
      )}
      {gagal && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <span className="text-center text-xs font-semibold text-neutral-500">{gagal}</span>
        </div>
      )}
    </div>
  )
}

export default CardiacCycle3D
