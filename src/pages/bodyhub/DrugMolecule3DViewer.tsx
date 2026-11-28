import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { body3dPixelRatio } from '../../lib/body3dQuality'
import { buatRendererAman } from '../../lib/rendererAman'
import { mulaiLoopTerjaga, type LoopTerjaga } from '../../lib/loopRenderTerjaga'

export type DrugRenderMode = 'ball-and-stick' | 'space-filling' | 'polarity-shell'

interface RdkitDrugJson {
  name: string
  formula: string
  atoms: [string, number, number, number][]
  bonds: [number, number, number][]
}

export interface DrugMoleculeMeta {
  readonly formula: string
  readonly atomCount: number
  readonly bondCount: number
}

const CPK: Record<string, number> = {
  H: 0xf1f5f9, C: 0x7c8694, N: 0x3b82f6, O: 0xef4444, F: 0x22d3ee,
  P: 0xf97316, S: 0xeab308, Cl: 0x22c55e, Br: 0xb91c1c, I: 0x9333ea,
}
const POLARITY: Record<string, number> = {
  O: 0xfb7185, N: 0x38bdf8, F: 0x22d3ee, Cl: 0x4ade80, S: 0xfde047, P: 0xfbbf24, C: 0x94a3b8, H: 0xcbd5e1,
}
const VDW: Record<string, number> = { H: 0.92, C: 1.32, N: 1.22, O: 1.18, F: 1.15, S: 1.42, P: 1.42, Cl: 1.38 }

function buildDrugGroup(data: RdkitDrugJson, mode: DrugRenderMode): THREE.Group {
  const group = new THREE.Group()
  const pts = data.atoms.map(([, x, y, z]) => new THREE.Vector3(x, y, z))
  const center = new THREE.Vector3()
  pts.forEach((p) => center.add(p))
  center.divideScalar(Math.max(1, pts.length))
  pts.forEach((p) => p.sub(center))

  const sphere = new THREE.SphereGeometry(1, 22, 14)
  const mats = new Map<string, THREE.MeshStandardMaterial>()
  const getMat = (el: string) => {
    const m = mats.get(el)
    if (m) return m
    const next = new THREE.MeshStandardMaterial({
      color: CPK[el] ?? 0xec4899,
      roughness: mode === 'space-filling' ? 0.38 : 0.26,
      metalness: 0.08,
    })
    mats.set(el, next)
    return next
  }

  data.atoms.forEach(([el], i) => {
    const mesh = new THREE.Mesh(sphere, getMat(el))
    mesh.position.copy(pts[i]!)
    mesh.scale.setScalar(mode === 'space-filling' ? (VDW[el] ?? 1.26) : (el === 'H' ? 0.2 : 0.34))
    group.add(mesh)
  })

  if (mode !== 'space-filling') {
    const cyl = new THREE.CylinderGeometry(1, 1, 1, 10)
    const up = new THREE.Vector3(0, 1, 0)
    for (const [ai, bi, order] of data.bonds) {
      const a = pts[ai], b = pts[bi]
      if (!a || !b) continue
      const dir = new THREE.Vector3().subVectors(b, a)
      const len = dir.length()
      if (len < 1e-4) continue
      const norm = dir.clone().divideScalar(len)
      const perp = new THREE.Vector3(0, 0, 1).cross(norm)
      if (perp.lengthSq() < 1e-4) perp.set(1, 0, 0).cross(norm)
      perp.normalize()
      const count = order === 3 ? 3 : order === 2 || order === 4 ? 2 : 1
      const offsets = count === 1 ? [0] : count === 2 ? [-0.08, 0.08] : [-0.11, 0, 0.11]
      const r = count > 1 ? 0.062 : 0.084
      const quat = new THREE.Quaternion().setFromUnitVectors(up, norm)
      const matA = getMat(data.atoms[ai]![0])
      const matB = getMat(data.atoms[bi]![0])
      for (const off of offsets) {
        const hA = new THREE.Mesh(cyl, matA)
        hA.position.copy(a).lerp(b, 0.25).addScaledVector(perp, off)
        hA.quaternion.copy(quat)
        hA.scale.set(r, len * 0.5, r)
        group.add(hA)

        const hB = new THREE.Mesh(cyl, matB)
        hB.position.copy(a).lerp(b, 0.75).addScaledVector(perp, off)
        hB.quaternion.copy(quat)
        hB.scale.set(r, len * 0.5, r)
        group.add(hB)
      }
    }
  }

  if (mode === 'polarity-shell') {
    const shells = new Map<string, THREE.MeshPhysicalMaterial>()
    const getShell = (el: string) => {
      const s = shells.get(el)
      if (s) return s
      const polar = el === 'O' || el === 'N' || el === 'F' || el === 'S' || el === 'P' || el === 'Cl'
      const next = new THREE.MeshPhysicalMaterial({
        color: POLARITY[el] ?? 0x94a3b8,
        emissive: polar ? (POLARITY[el] ?? 0x38bdf8) : 0x000000,
        emissiveIntensity: polar ? 0.22 : 0,
        roughness: 0.22,
        transparent: true,
        opacity: polar ? 0.34 : 0.13,
        depthWrite: false,
      })
      shells.set(el, next)
      return next
    }
    data.atoms.forEach(([el], i) => {
      const sh = new THREE.Mesh(sphere, getShell(el))
      sh.position.copy(pts[i]!)
      sh.scale.setScalar((VDW[el] ?? 1.24) * 1.06)
      group.add(sh)
    })
  }
  return group
}

export function DrugMolecule3DViewer({
  slug,
  label,
  mode = 'ball-and-stick',
  onMeta,
}: {
  slug: string
  label: string
  mode?: DrugRenderMode
  onMeta?: (meta: DrugMoleculeMeta | null) => void
}) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const metaRef = useRef(onMeta)
  metaRef.current = onMeta
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    setState('loading')
    let disposed = false
    const renderer = buatRendererAman({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    if (!renderer) {
      setState('failed')
      metaRef.current?.(null)
      return
    }
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.dataset.drugMolecule3d = slug
    renderer.domElement.setAttribute('aria-hidden', 'true')
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 400)
    scene.add(new THREE.AmbientLight(0xffffff, 0.72))
    const key = new THREE.DirectionalLight(0xffffff, 1.38)
    key.position.set(3, 4, 6)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x67e8f9, 0.52)
    rim.position.set(-4, -2, -4)
    scene.add(rim)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    controls.autoRotateSpeed = 0.8

    const resize = () => {
      const w = host.clientWidth
      const h = host.clientHeight
      if (w < 2 || h < 2) return
      renderer.setPixelRatio(body3dPixelRatio(w, h, window.devicePixelRatio || 1, window.matchMedia('(max-width: 640px)').matches))
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    let loop: LoopTerjaga | null = null
    const onLost = (e: Event) => {
      e.preventDefault()
      loop?.kontekHilang()
      if (!disposed) setState('failed')
    }
    renderer.domElement.addEventListener('webglcontextlost', onLost, false)

    const ac = new AbortController()
    fetch(`${import.meta.env.BASE_URL}molecules/${slug}.json`, { signal: ac.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data: RdkitDrugJson) => {
        if (disposed) return
        metaRef.current?.({ formula: data.formula, atomCount: data.atoms.length, bondCount: data.bonds.length })
        const group = buildDrugGroup(data, mode)
        scene.add(group)
        const radius = Math.max(1.5, new THREE.Box3().setFromObject(group).getBoundingSphere(new THREE.Sphere()).radius)
        const dist = (radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.18
        camera.position.set(0, radius * 0.2, dist)
        controls.minDistance = radius * 1.1
        controls.maxDistance = dist * 2.5
        controls.update()
        setState('ready')
        loop = mulaiLoopTerjaga(host, () => {
          controls.update()
          renderer.render(scene, camera)
        })
      })
      .catch(() => {
        if (!disposed) {
          metaRef.current?.(null)
          setState('failed')
        }
      })

    return () => {
      disposed = true
      ac.abort()
      loop?.hentikan()
      renderer.domElement.removeEventListener('webglcontextlost', onLost)
      ro.disconnect()
      controls.dispose()
      const geos = new Set<THREE.BufferGeometry>()
      const mats = new Set<THREE.Material>()
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          geos.add(obj.geometry)
          if (Array.isArray(obj.material)) obj.material.forEach((m) => mats.add(m))
          else mats.add(obj.material)
        }
      })
      geos.forEach((g) => g.dispose())
      mats.forEach((m) => m.dispose())
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [slug, mode])

  return (
    <div ref={hostRef} className="relative h-full w-full" role="img" aria-label={`3D RDKit conformer of ${label} (${mode})`}>
      {state !== 'ready' && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-[10px] font-bold text-white/50">
          {state === 'loading' ? `Loading ${label} 3D conformer…` : '3D viewer unavailable on this device'}
        </div>
      )}
    </div>
  )
}
