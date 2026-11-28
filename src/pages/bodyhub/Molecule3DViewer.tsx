import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { body3dPixelRatio } from '../../lib/body3dQuality'
import { parseSdfV2000, summarizeSdfChemistry, type SdfChemistrySummary, type SdfMolecule } from '../../lib/kimia/sdfV2000'
import { buatRendererAman } from '../../lib/rendererAman'
import { mulaiLoopTerjaga, type LoopTerjaga } from '../../lib/loopRenderTerjaga'

export type MoleculeRenderMode = 'ball-and-stick' | 'space-filling' | 'polarity-shell'

// Jmol CPK element colours, the common convention in molecular viewers.
const ELEMENT_COLOR: Record<string, number> = {
  H: 0xf1f5f9, C: 0x7c8694, N: 0x3b82f6, O: 0xef4444, P: 0xf97316, S: 0xeab308,
  Na: 0xab5cf2, Mg: 0x8aff00, Cl: 0x22c55e, K: 0x8f40d4, Ca: 0x4ade80, Fe: 0xe06633, Zn: 0x7d80b0,
}

// Pauling electronegativity polarity hull colours (O/N strongly electronegative, P/S moderate polar, C/H hydrophobic).
const POLARITY_COLOR: Record<string, number> = {
  O: 0xfb7185,
  N: 0x38bdf8,
  P: 0xfbbf24,
  S: 0xfde047,
  C: 0x94a3b8,
  H: 0xcbd5e1,
}

// Bondi van der Waals radii (Å, scaled cleanly for space-filling and polarity-shell visualization).
const VDW_RADIUS: Record<string, number> = {
  H: 0.92, C: 1.32, N: 1.22, O: 1.18, P: 1.42, S: 1.42,
}
const BALL_RADIUS: Record<string, number> = { H: 0.21 }
const ATOM_RADIUS = 0.34
const BOND_RADIUS = 0.085

function disposeGroup(group: THREE.Group) {
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      geometries.add(obj.geometry)
      if (Array.isArray(obj.material)) obj.material.forEach((m) => materials.add(m))
      else materials.add(obj.material)
    }
  })
  geometries.forEach((g) => g.dispose())
  materials.forEach((m) => m.dispose())
}

function buildMolecule(molecule: SdfMolecule, mode: MoleculeRenderMode): THREE.Group {
  const group = new THREE.Group()
  const center = new THREE.Vector3()
  const positions = molecule.atoms.map((atom) => new THREE.Vector3(atom.x, atom.y, atom.z))
  positions.forEach((p) => center.add(p))
  center.divideScalar(Math.max(1, positions.length))
  positions.forEach((p) => p.sub(center))

  const sphere = new THREE.SphereGeometry(1, 24, 16)
  const atomMaterials = new Map<string, THREE.MeshStandardMaterial>()
  const getAtomMaterial = (el: string) => {
    const key = `${mode}:${el}`
    const existing = atomMaterials.get(key)
    if (existing) return existing
    const mat = new THREE.MeshStandardMaterial({
      color: ELEMENT_COLOR[el] ?? 0xff1493,
      roughness: mode === 'space-filling' ? 0.36 : 0.26,
      metalness: 0.08,
    })
    atomMaterials.set(key, mat)
    return mat
  }

  // 1. Primary atoms (Ball & Stick core, Space-Filling vdW, or Polarity-Shell core)
  molecule.atoms.forEach((atom, index) => {
    const mesh = new THREE.Mesh(sphere, getAtomMaterial(atom.element))
    mesh.position.copy(positions[index]!)
    const radius = mode === 'space-filling'
      ? (VDW_RADIUS[atom.element] ?? 1.28)
      : (BALL_RADIUS[atom.element] ?? ATOM_RADIUS)
    mesh.scale.setScalar(radius)
    group.add(mesh)
  })

  // 2. Two-tone split CPK covalent bonds (PyMOL/ChimeraX style) with true parallel double/triple orders
  if (mode === 'ball-and-stick' || mode === 'polarity-shell') {
    const cylinder = new THREE.CylinderGeometry(1, 1, 1, 12)
    const up = new THREE.Vector3(0, 1, 0)
    for (const bond of molecule.bonds) {
      const a = positions[bond.a]!
      const b = positions[bond.b]!
      const elA = molecule.atoms[bond.a]!.element
      const elB = molecule.atoms[bond.b]!.element
      const dir = new THREE.Vector3().subVectors(b, a)
      const len = dir.length()
      if (len < 1e-4) continue
      const dirNorm = dir.clone().divideScalar(len)
      const perp = new THREE.Vector3(0, 0, 1).cross(dirNorm)
      if (perp.lengthSq() < 1e-4) perp.set(1, 0, 0).cross(dirNorm)
      perp.normalize()
      const count = bond.order === 3 ? 3 : bond.order === 2 || bond.order === 4 ? 2 : 1
      const offsets = count === 1 ? [0] : count === 2 ? [-0.08, 0.08] : [-0.11, 0, 0.11]
      const r = count > 1 ? BOND_RADIUS * 0.72 : BOND_RADIUS
      const halfLen = len * 0.5
      const quat = new THREE.Quaternion().setFromUnitVectors(up, dirNorm)
      const matA = getAtomMaterial(elA)
      const matB = getAtomMaterial(elB)
      for (const offset of offsets) {
        const halfA = new THREE.Mesh(cylinder, matA)
        halfA.position.copy(a).lerp(b, 0.25).addScaledVector(perp, offset)
        halfA.quaternion.copy(quat)
        halfA.scale.set(r, halfLen, r)
        group.add(halfA)

        const halfB = new THREE.Mesh(cylinder, matB)
        halfB.position.copy(a).lerp(b, 0.75).addScaledVector(perp, offset)
        halfB.quaternion.copy(quat)
        halfB.scale.set(r, halfLen, r)
        group.add(halfB)
      }
    }
  }

  // 3. Translucent Pauling Electronegativity Polarity Shell surrounding covalent core
  if (mode === 'polarity-shell') {
    const shellMaterials = new Map<string, THREE.MeshPhysicalMaterial>()
    const getShellMat = (el: string) => {
      const existing = shellMaterials.get(el)
      if (existing) return existing
      const polar = el === 'O' || el === 'N' || el === 'P' || el === 'S'
      const mat = new THREE.MeshPhysicalMaterial({
        color: POLARITY_COLOR[el] ?? 0x94a3b8,
        emissive: polar ? (POLARITY_COLOR[el] ?? 0x38bdf8) : 0x000000,
        emissiveIntensity: polar ? 0.22 : 0,
        roughness: 0.22,
        metalness: 0,
        transparent: true,
        opacity: polar ? 0.34 : 0.14,
        depthWrite: false,
      })
      shellMaterials.set(el, mat)
      return mat
    }
    molecule.atoms.forEach((atom, index) => {
      const shell = new THREE.Mesh(sphere, getShellMat(atom.element))
      shell.position.copy(positions[index]!)
      shell.scale.setScalar((VDW_RADIUS[atom.element] ?? 1.24) * 1.06)
      group.add(shell)
    })
  }

  return group
}

export function Molecule3DViewer({
  sdfUrl,
  label,
  mode = 'ball-and-stick',
  onInspect,
}: {
  sdfUrl: string
  label: string
  mode?: MoleculeRenderMode
  onInspect?: (summary: SdfChemistrySummary | null) => void
}) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const onInspectRef = useRef(onInspect)
  onInspectRef.current = onInspect
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    setState('loading')
    let disposed = false
    const renderer = buatRendererAman({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    if (!renderer) {
      setState('failed')
      onInspectRef.current?.(null)
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
    const key = new THREE.DirectionalLight(0xffffff, 1.38)
    key.position.set(3, 4, 6)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x67e8f9, 0.55)
    rim.position.set(-4, -2, -4)
    scene.add(rim)
    const fill = new THREE.DirectionalLight(0xfda4af, 0.3)
    fill.position.set(4, -3, -2)
    scene.add(fill)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    controls.autoRotateSpeed = 0.75

    const size = () => {
      const w = host.clientWidth
      const h = host.clientHeight
      if (w < 2 || h < 2) return
      renderer.setPixelRatio(body3dPixelRatio(w, h, window.devicePixelRatio || 1, window.matchMedia('(max-width: 640px)').matches))
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    size()
    const ro = new ResizeObserver(size)
    ro.observe(host)

    let loop: LoopTerjaga | null = null
    let builtGroup: THREE.Group | null = null
    const onContextLost = (e: Event) => {
      e.preventDefault()
      loop?.kontekHilang()
      if (!disposed) setState('failed')
    }
    renderer.domElement.addEventListener('webglcontextlost', onContextLost, false)

    const controller = new AbortController()
    fetch(sdfUrl, { signal: controller.signal })
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((text) => {
        if (disposed) return
        const molecule = parseSdfV2000(text)
        onInspectRef.current?.(summarizeSdfChemistry(molecule))
        const group = buildMolecule(molecule, mode)
        builtGroup = group
        scene.add(group)
        const box = new THREE.Box3().setFromObject(group)
        const sphere = box.getBoundingSphere(new THREE.Sphere())
        const radius = Math.max(sphere.radius, 1.5)
        const dist = (radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.18
        camera.position.set(0, radius * 0.25, dist)
        controls.minDistance = radius * 1.2
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
          onInspectRef.current?.(null)
          setState('failed')
        }
      })

    return () => {
      disposed = true
      controller.abort()
      loop?.hentikan()
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
      ro.disconnect()
      controls.dispose()
      if (builtGroup) disposeGroup(builtGroup)
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [sdfUrl, mode])

  return (
    <div ref={hostRef} className="relative h-full w-full" role="img" aria-label={`3D molecular conformer of ${label} (${mode})`}>
      {state === 'loading' && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-[10px] font-black text-white/45">
          Loading 3D conformer…
        </div>
      )}
      {state === 'failed' && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-[10px] font-black text-white/45">
          3D conformer unavailable
        </div>
      )}
    </div>
  )
}
