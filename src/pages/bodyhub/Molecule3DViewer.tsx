import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { body3dPixelRatio } from '../../lib/body3dQuality'
import { parseSdfV2000, type SdfMolecule } from '../../lib/kimia/sdfV2000'
import { buatRendererAman } from '../../lib/rendererAman'
import { mulaiLoopTerjaga, type LoopTerjaga } from '../../lib/loopRenderTerjaga'

export type MoleculeRenderMode = 'ball-and-stick' | 'space-filling'

// Jmol CPK element colours, the common convention in molecular viewers.
const ELEMENT_COLOR: Record<string, number> = {
  H: 0xffffff, C: 0x909090, N: 0x3050f8, O: 0xff0d0d, P: 0xff8000, S: 0xffff30,
  Na: 0xab5cf2, Mg: 0x8aff00, Cl: 0x1ff01f, K: 0x8f40d4, Ca: 0x3dff00, Fe: 0xe06633, Zn: 0x7d80b0,
}
// Bondi van der Waals radii (Å, scaled cleanly for space-filling visualization).
const VDW_RADIUS: Record<string, number> = {
  H: 0.92, C: 1.32, N: 1.22, O: 1.18, P: 1.42, S: 1.42,
}
const BALL_RADIUS: Record<string, number> = { H: 0.22 }
const ATOM_RADIUS = 0.36
const BOND_RADIUS = 0.09

function buildMolecule(molecule: SdfMolecule, mode: MoleculeRenderMode): THREE.Group {
  const group = new THREE.Group()
  const center = new THREE.Vector3()
  const positions = molecule.atoms.map((atom) => new THREE.Vector3(atom.x, atom.y, atom.z))
  positions.forEach((p) => center.add(p))
  center.divideScalar(Math.max(1, positions.length))
  positions.forEach((p) => p.sub(center))

  const sphere = new THREE.SphereGeometry(1, 24, 16)
  molecule.atoms.forEach((atom, index) => {
    const material = new THREE.MeshStandardMaterial({
      color: ELEMENT_COLOR[atom.element] ?? 0xff1493,
      roughness: mode === 'space-filling' ? 0.42 : 0.32,
      metalness: 0.06,
    })
    const mesh = new THREE.Mesh(sphere, material)
    mesh.position.copy(positions[index]!)
    const radius = mode === 'space-filling'
      ? (VDW_RADIUS[atom.element] ?? 1.28)
      : (BALL_RADIUS[atom.element] ?? ATOM_RADIUS)
    mesh.scale.setScalar(radius)
    group.add(mesh)
  })

  if (mode === 'ball-and-stick') {
    const cylinder = new THREE.CylinderGeometry(1, 1, 1, 12)
    const bondMaterial = new THREE.MeshStandardMaterial({ color: 0xb8c4cc, roughness: 0.5 })
    const up = new THREE.Vector3(0, 1, 0)
    for (const bond of molecule.bonds) {
      const a = positions[bond.a]!
      const b = positions[bond.b]!
      const dir = new THREE.Vector3().subVectors(b, a)
      const len = dir.length()
      if (len < 1e-4) continue
      const dirNorm = dir.clone().divideScalar(len)
      const perp = new THREE.Vector3(0, 0, 1).cross(dirNorm)
      if (perp.lengthSq() < 1e-4) perp.set(1, 0, 0).cross(dirNorm)
      perp.normalize()
      const count = bond.order === 3 ? 3 : bond.order === 2 || bond.order === 4 ? 2 : 1
      const offsets = count === 1 ? [0] : count === 2 ? [-0.08, 0.08] : [-0.11, 0, 0.11]
      for (const offset of offsets) {
        const stick = new THREE.Mesh(cylinder, bondMaterial)
        stick.position.copy(a).add(b).multiplyScalar(0.5).addScaledVector(perp, offset)
        stick.quaternion.setFromUnitVectors(up, dirNorm)
        stick.scale.set(count > 1 ? BOND_RADIUS * 0.72 : BOND_RADIUS, len, count > 1 ? BOND_RADIUS * 0.72 : BOND_RADIUS)
        group.add(stick)
      }
    }
  }
  return group
}

export function Molecule3DViewer({
  sdfUrl,
  label,
  mode = 'ball-and-stick',
}: {
  sdfUrl: string
  label: string
  mode?: MoleculeRenderMode
}) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    setState('loading')
    let disposed = false
    const renderer = buatRendererAman({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    if (!renderer) {
      setState('failed')
      return
    }
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 500)
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.dataset.molecule3d = 'true'
    renderer.domElement.setAttribute('aria-hidden', 'true')
    host.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.72))
    const key = new THREE.DirectionalLight(0xffffff, 1.35)
    key.position.set(3, 4, 6)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x93c5fd, 0.5)
    rim.position.set(-4, -2, -4)
    scene.add(rim)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    controls.autoRotateSpeed = 1.1

    const resize = () => {
      const w = host.clientWidth
      const h = host.clientHeight
      if (w < 2 || h < 2) return
      renderer.setPixelRatio(body3dPixelRatio(w, h, window.devicePixelRatio || 1, window.matchMedia('(max-width: 640px)').matches))
      renderer.setSize(w, h)
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
    }
    renderer.domElement.addEventListener('webglcontextlost', onLost)

    fetch(sdfUrl)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((text) => {
        if (disposed) return
        const group = buildMolecule(parseSdfV2000(text), mode)
        scene.add(group)
        const radius = new THREE.Box3().setFromObject(group).getBoundingSphere(new THREE.Sphere()).radius
        camera.position.set(0, 0, Math.max(3, radius * 2.3))
        camera.near = 0.1
        camera.far = radius * 20 + 50
        camera.updateProjectionMatrix()
        setState('ready')
        loop = mulaiLoopTerjaga(host, () => {
          controls.update()
          renderer.render(scene, camera)
        })
      })
      .catch(() => { if (!disposed) setState('failed') })

    return () => {
      disposed = true
      loop?.hentikan()
      renderer.domElement.removeEventListener('webglcontextlost', onLost)
      ro.disconnect()
      controls.dispose()
      const disposedGeos = new Set<THREE.BufferGeometry>()
      const disposedMats = new Set<THREE.Material>()
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh
        if (!mesh.isMesh) return
        if (!disposedGeos.has(mesh.geometry)) {
          mesh.geometry.dispose()
          disposedGeos.add(mesh.geometry)
        }
        const material = mesh.material as THREE.Material
        if (!disposedMats.has(material)) {
          material.dispose()
          disposedMats.add(material)
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [sdfUrl, mode])

  return (
    <div className="relative h-full w-full" data-molecule-3d-state={state} data-molecule-render-mode={mode}>
      <div ref={hostRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" role="img" aria-label={`${label} 3D conformer, drag to rotate`} />
      {state !== 'ready' && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-[10px] font-bold text-white/40" role="status">
          {state === 'loading' ? `Loading ${label} 3D…` : `${label} 3D could not be rendered on this device.`}
        </div>
      )}
    </div>
  )
}
