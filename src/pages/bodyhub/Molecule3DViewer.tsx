import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { body3dPixelRatio } from '../../lib/body3dQuality'
import { parseSdfV2000, type SdfMolecule } from '../../lib/kimia/sdfV2000'

// Jmol CPK element colours, the common convention in molecular viewers.
const ELEMENT_COLOR: Record<string, number> = {
  H: 0xffffff, C: 0x909090, N: 0x3050f8, O: 0xff0d0d, P: 0xff8000, S: 0xffff30,
}
const ELEMENT_RADIUS: Record<string, number> = { H: 0.22 }
const ATOM_RADIUS = 0.36
const BOND_RADIUS = 0.09

function buildMolecule(molecule: SdfMolecule): THREE.Group {
  const group = new THREE.Group()
  const center = new THREE.Vector3()
  const positions = molecule.atoms.map((atom) => new THREE.Vector3(atom.x, atom.y, atom.z))
  positions.forEach((p) => center.add(p))
  center.divideScalar(Math.max(1, positions.length))
  positions.forEach((p) => p.sub(center))

  const sphere = new THREE.SphereGeometry(1, 24, 16)
  molecule.atoms.forEach((atom, index) => {
    const material = new THREE.MeshStandardMaterial({ color: ELEMENT_COLOR[atom.element] ?? 0xff1493, roughness: 0.35, metalness: 0.05 })
    const mesh = new THREE.Mesh(sphere, material)
    mesh.position.copy(positions[index]!)
    mesh.scale.setScalar(ELEMENT_RADIUS[atom.element] ?? ATOM_RADIUS)
    group.add(mesh)
  })

  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 12)
  const bondMaterial = new THREE.MeshStandardMaterial({ color: 0xb8c4cc, roughness: 0.5 })
  const up = new THREE.Vector3(0, 1, 0)
  for (const bond of molecule.bonds) {
    const a = positions[bond.a]!
    const b = positions[bond.b]!
    const axis = new THREE.Vector3().subVectors(b, a)
    const length = axis.length()
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, axis.clone().normalize())
    // Double and triple bonds are drawn as parallel sticks offset sideways.
    const lines = bond.order === 2 ? 2 : bond.order === 3 ? 3 : 1
    const side = new THREE.Vector3().crossVectors(axis, new THREE.Vector3(0, 0, 1))
    if (side.lengthSq() < 1e-6) side.crossVectors(axis, new THREE.Vector3(1, 0, 0))
    side.normalize().multiplyScalar(0.14)
    for (let i = 0; i < lines; i++) {
      const offset = side.clone().multiplyScalar(i - (lines - 1) / 2)
      const mesh = new THREE.Mesh(cylinder, bondMaterial)
      mesh.position.copy(a).add(b).multiplyScalar(0.5).add(offset)
      mesh.quaternion.copy(quaternion)
      mesh.scale.set(lines > 1 ? BOND_RADIUS * 0.7 : BOND_RADIUS, length, lines > 1 ? BOND_RADIUS * 0.7 : BOND_RADIUS)
      group.add(mesh)
    }
  }
  return group
}

export function Molecule3DViewer({ sdfUrl, label }: { sdfUrl: string; label: string }) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    setState('loading')
    let disposed = false
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
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

    scene.add(new THREE.AmbientLight(0xffffff, 0.7))
    const key = new THREE.DirectionalLight(0xffffff, 1.3)
    key.position.set(3, 4, 6)
    scene.add(key)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    controls.autoRotateSpeed = 1.2

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

    let frame = 0
    const loop = () => {
      controls.update()
      renderer.render(scene, camera)
      frame = requestAnimationFrame(loop)
    }

    fetch(sdfUrl)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((text) => {
        if (disposed) return
        const group = buildMolecule(parseSdfV2000(text))
        scene.add(group)
        const radius = new THREE.Box3().setFromObject(group).getBoundingSphere(new THREE.Sphere()).radius
        camera.position.set(0, 0, Math.max(3, radius * 2.25))
        camera.near = 0.1
        camera.far = radius * 20 + 50
        camera.updateProjectionMatrix()
        setState('ready')
        loop()
      })
      .catch(() => { if (!disposed) setState('failed') })

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      ro.disconnect()
      controls.dispose()
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh
        if (!mesh.isMesh) return
        mesh.geometry.dispose()
        const material = mesh.material as THREE.Material
        material.dispose()
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [sdfUrl])

  return (
    <div className="relative h-full w-full" data-molecule-3d-state={state}>
      <div ref={hostRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" role="img" aria-label={`${label} 3D conformer, drag to rotate`} />
      {state !== 'ready' && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-[10px] font-bold text-white/40" role="status">
          {state === 'loading' ? `Loading ${label} 3D…` : `${label} 3D could not be rendered on this device.`}
        </div>
      )}
    </div>
  )
}
