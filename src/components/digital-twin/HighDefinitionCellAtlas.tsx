import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

type StructureId = 'all' | 'membrane' | 'nucleus' | 'mitochondria' | 'er' | 'golgi' | 'lysosome' | 'ribosome' | 'cytoskeleton'
type Quality = 'balanced' | 'hd'

type StructureMeta = {
  id: StructureId
  label: string
  note: string
}

const STRUCTURES: StructureMeta[] = [
  { id: 'all', label: 'Whole cell', note: 'Spatial overview' },
  { id: 'membrane', label: 'Membrane', note: 'Plasma membrane' },
  { id: 'nucleus', label: 'Nucleus', note: 'Envelope · chromatin · nucleolus' },
  { id: 'mitochondria', label: 'Mitochondria', note: 'Outer membrane · cristae' },
  { id: 'er', label: 'Rough ER', note: 'Perinuclear membrane network' },
  { id: 'golgi', label: 'Golgi', note: 'Stacked cisternae' },
  { id: 'lysosome', label: 'Vesicles', note: 'Lysosome / peroxisome scale' },
  { id: 'ribosome', label: 'Ribosomes', note: 'Cytosolic / ER-bound' },
  { id: 'cytoskeleton', label: 'Cytoskeleton', note: 'Structural filament network' },
]

function makeOrganicSphere(radius: number, width = 64, height = 48, irregularity = 0.04) {
  const geometry = new THREE.SphereGeometry(radius, width, height)
  const position = geometry.attributes.position as THREE.BufferAttribute
  const vertex = new THREE.Vector3()
  for (let i = 0; i < position.count; i += 1) {
    vertex.fromBufferAttribute(position, i)
    const normal = vertex.clone().normalize()
    const perturb = 1 + irregularity * (
      Math.sin(normal.x * 5.7 + normal.y * 2.2) +
      Math.sin(normal.y * 7.1 - normal.z * 1.8) +
      Math.sin(normal.z * 6.3 + normal.x * 2.9)
    ) / 3
    vertex.multiplyScalar(perturb)
    position.setXYZ(i, vertex.x, vertex.y, vertex.z)
  }
  position.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
}

function makeTube(points: THREE.Vector3[], radius: number, radialSegments = 8) {
  const curve = new THREE.CatmullRomCurve3(points)
  return new THREE.TubeGeometry(curve, Math.max(28, points.length * 12), radius, radialSegments, false)
}

function seededRandom(seed = 17) {
  let value = seed >>> 0
  return () => {
    value = (1664525 * value + 1013904223) >>> 0
    return value / 4294967296
  }
}

function materialList(material: THREE.Material | THREE.Material[]) {
  return Array.isArray(material) ? material : [material]
}

export function HighDefinitionCellAtlas() {
  const mountRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const structureRef = useRef(new Map<StructureId, THREE.Object3D[]>())
  const [focus, setFocus] = useState<StructureId>('all')
  const [quality, setQuality] = useState<Quality>('balanced')
  const [picked, setPicked] = useState('Whole-cell structural model')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x05080c)
    scene.fog = new THREE.FogExp2(0x05080c, 0.032)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(31, 1, 0.01, 100)
    camera.position.set(0.15, 0.08, 5.55)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.setClearColor(0x05080c, 1)
    rendererRef.current = renderer
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.07
    controls.enablePan = false
    controls.minDistance = 2.45
    controls.maxDistance = 9
    controls.autoRotate = false
    controls.target.set(0, 0, 0)
    controlsRef.current = controls

    const pmrem = new THREE.PMREMGenerator(renderer)
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.05).texture
    scene.environment = environment

    scene.add(new THREE.HemisphereLight(0xeaf7ff, 0x071018, 1.55))
    const key = new THREE.DirectionalLight(0xffffff, 3.1)
    key.position.set(4.5, 5.5, 6)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0x8fd8ff, 1.65)
    fill.position.set(-5, 1.2, 3.5)
    scene.add(fill)
    const rim = new THREE.DirectionalLight(0xff9bc8, 1.45)
    rim.position.set(3, 2.5, -5)
    scene.add(rim)
    const warm = new THREE.PointLight(0xffb67c, 0.8, 10)
    warm.position.set(-2.4, -1.8, 1.8)
    scene.add(warm)

    const root = new THREE.Group()
    root.rotation.set(-0.08, 0.18, -0.04)
    scene.add(root)

    const register = (id: StructureId, object: THREE.Object3D, label: string) => {
      object.userData.structureId = id
      object.userData.label = label
      const list = structureRef.current.get(id) ?? []
      list.push(object)
      structureRef.current.set(id, list)
      return object
    }

    const membraneMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x80d9e6,
      roughness: 0.28,
      metalness: 0,
      transparent: true,
      opacity: 0.2,
      transmission: 0.12,
      thickness: 0.32,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const membrane = register('membrane', new THREE.Mesh(makeOrganicSphere(1.78, 72, 56, 0.055), membraneMaterial), 'Plasma membrane') as THREE.Mesh
    membrane.scale.set(1.28, 0.9, 0.84)
    root.add(membrane)

    const membraneInner = register('membrane', new THREE.Mesh(
      makeOrganicSphere(1.68, 64, 48, 0.045),
      new THREE.MeshPhysicalMaterial({ color: 0x0b2632, roughness: 0.52, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.BackSide }),
    ), 'Cytoplasmic boundary') as THREE.Mesh
    membraneInner.scale.copy(membrane.scale)
    root.add(membraneInner)

    const nucleusGroup = register('nucleus', new THREE.Group(), 'Nucleus') as THREE.Group
    nucleusGroup.position.set(-0.13, 0.02, 0)
    root.add(nucleusGroup)

    const nucleus = new THREE.Mesh(
      makeOrganicSphere(0.82, 64, 48, 0.035),
      new THREE.MeshPhysicalMaterial({ color: 0x705590, roughness: 0.32, transparent: true, opacity: 0.75, transmission: 0.06, thickness: 0.18 }),
    )
    nucleus.scale.set(1.02, 0.92, 0.88)
    nucleus.userData.structureId = 'nucleus'
    nucleus.userData.label = 'Nuclear envelope'
    nucleusGroup.add(nucleus)

    const nucleolus = new THREE.Mesh(
      makeOrganicSphere(0.26, 36, 28, 0.025),
      new THREE.MeshPhysicalMaterial({ color: 0xc47fa9, roughness: 0.45, metalness: 0.01 }),
    )
    nucleolus.position.set(0.2, -0.06, 0.18)
    nucleolus.userData.structureId = 'nucleus'
    nucleolus.userData.label = 'Nucleolus'
    nucleusGroup.add(nucleolus)

    const chromatinMaterial = new THREE.MeshStandardMaterial({ color: 0xd4c3ee, roughness: 0.58, transparent: true, opacity: 0.48 })
    for (let strand = 0; strand < 6; strand += 1) {
      const points: THREE.Vector3[] = []
      for (let i = 0; i < 9; i += 1) {
        const t = i / 8
        const angle = t * Math.PI * 2.2 + strand * 0.72
        const r = 0.26 + 0.25 * Math.sin(t * Math.PI)
        points.push(new THREE.Vector3(
          Math.cos(angle) * r,
          (t - 0.5) * 0.92 + Math.sin(angle * 0.8) * 0.06,
          Math.sin(angle) * r * 0.72,
        ))
      }
      const fiber = new THREE.Mesh(makeTube(points, 0.012, 6), chromatinMaterial.clone())
      fiber.userData.structureId = 'nucleus'
      fiber.userData.label = 'Chromatin fiber'
      nucleusGroup.add(fiber)
    }

    const mitochondriaMaterial = new THREE.MeshPhysicalMaterial({ color: 0xb9574e, roughness: 0.42, clearcoat: 0.12, clearcoatRoughness: 0.4 })
    const cristaMaterial = new THREE.MeshStandardMaterial({ color: 0xffc0a6, roughness: 0.52 })
    const mitoPositions = [
      [-1.18, 0.72, 0.2, -0.35], [1.08, 0.55, -0.35, 0.28], [-1.24, -0.62, -0.2, 0.42],
      [1.12, -0.6, 0.28, -0.24], [0.65, 0.08, 0.72, 0.52], [-0.68, 0.12, -0.76, -0.48],
    ] as const
    mitoPositions.forEach(([x, y, z, rot], index) => {
      const group = register('mitochondria', new THREE.Group(), `Mitochondrion ${index + 1}`) as THREE.Group
      group.position.set(x, y, z)
      group.rotation.z = rot
      group.rotation.y = rot * 0.8
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 40, 28), mitochondriaMaterial.clone())
      body.scale.set(1.55, 0.62, 0.68)
      body.userData.structureId = 'mitochondria'
      body.userData.label = 'Mitochondrial outer membrane'
      group.add(body)
      for (let c = -2; c <= 2; c += 1) {
        const points: THREE.Vector3[] = []
        for (let p = 0; p < 8; p += 1) {
          const tx = -0.35 + p * 0.1
          points.push(new THREE.Vector3(tx, Math.sin(p * 1.35 + c) * 0.065 + c * 0.035, 0.19))
        }
        const crista = new THREE.Mesh(makeTube(points, 0.008, 5), cristaMaterial.clone())
        crista.userData.structureId = 'mitochondria'
        crista.userData.label = 'Mitochondrial cristae'
        group.add(crista)
      }
      root.add(group)
    })

    const erMaterial = new THREE.MeshStandardMaterial({ color: 0x4fae9e, roughness: 0.5, metalness: 0.01 })
    for (let layer = 0; layer < 7; layer += 1) {
      const points: THREE.Vector3[] = []
      for (let i = 0; i < 14; i += 1) {
        const angle = (i / 13) * Math.PI * 2
        const r = 0.93 + layer * 0.055 + Math.sin(i * 1.7 + layer) * 0.06
        points.push(new THREE.Vector3(
          Math.cos(angle) * r - 0.1,
          Math.sin(angle) * (0.6 + layer * 0.018) + (layer - 3) * 0.045,
          -0.28 + Math.sin(angle * 2 + layer) * 0.1,
        ))
      }
      const er = register('er', new THREE.Mesh(makeTube(points, 0.024, 7), erMaterial.clone()), 'Rough endoplasmic reticulum') as THREE.Mesh
      root.add(er)
    }

    const golgiMaterial = new THREE.MeshPhysicalMaterial({ color: 0xd3a14f, roughness: 0.44, clearcoat: 0.08 })
    for (let layer = 0; layer < 6; layer += 1) {
      const points: THREE.Vector3[] = []
      for (let i = 0; i < 10; i += 1) {
        const t = i / 9
        const angle = -1.15 + t * 2.3
        points.push(new THREE.Vector3(
          0.88 + Math.cos(angle) * (0.48 + layer * 0.02),
          -0.15 + Math.sin(angle) * (0.31 + layer * 0.01) + layer * 0.055,
          -0.58 + layer * 0.025,
        ))
      }
      const cisterna = register('golgi', new THREE.Mesh(makeTube(points, 0.03, 8), golgiMaterial.clone()), 'Golgi cisterna') as THREE.Mesh
      root.add(cisterna)
    }

    const vesicleMaterial = new THREE.MeshPhysicalMaterial({ color: 0x66aadd, roughness: 0.35, transparent: true, opacity: 0.78, transmission: 0.05 })
    const vesicles = [
      [1.25, 0.16, -0.44, 0.12], [1.34, -0.05, -0.53, 0.09], [0.98, -0.48, -0.66, 0.14],
      [-0.92, 0.84, -0.22, 0.11], [-1.05, -0.14, 0.62, 0.13], [0.42, -0.92, -0.3, 0.1],
    ] as const
    vesicles.forEach(([x, y, z, r], index) => {
      const vesicle = register('lysosome', new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), vesicleMaterial.clone()), index % 2 ? 'Peroxisome-scale vesicle' : 'Lysosome-scale vesicle') as THREE.Mesh
      vesicle.position.set(x, y, z)
      root.add(vesicle)
    })

    const random = seededRandom(41)
    const ribosomeGeometry = new THREE.SphereGeometry(0.018, 10, 8)
    const ribosomeMaterial = new THREE.MeshStandardMaterial({ color: 0xe2f2f0, roughness: 0.58 })
    const ribosomes = register('ribosome', new THREE.InstancedMesh(ribosomeGeometry, ribosomeMaterial, 155), 'Ribosome field') as THREE.InstancedMesh
    const dummy = new THREE.Object3D()
    let placed = 0
    while (placed < 155) {
      const x = (random() - 0.5) * 3.55
      const y = (random() - 0.5) * 2.35
      const z = (random() - 0.5) * 2.0
      const ellipsoid = (x / 2.05) ** 2 + (y / 1.45) ** 2 + (z / 1.2) ** 2
      const nucleusDistance = ((x + 0.13) / 0.86) ** 2 + (y / 0.8) ** 2 + (z / 0.76) ** 2
      if (ellipsoid > 0.88 || nucleusDistance < 1.08) continue
      dummy.position.set(x, y, z)
      const scale = 0.72 + random() * 0.58
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      ribosomes.setMatrixAt(placed, dummy.matrix)
      placed += 1
    }
    ribosomes.instanceMatrix.needsUpdate = true
    root.add(ribosomes)

    const cytoskeletonMaterial = new THREE.MeshStandardMaterial({ color: 0x70c7e8, roughness: 0.48, transparent: true, opacity: 0.5 })
    for (let strand = 0; strand < 13; strand += 1) {
      const y = -1.0 + (strand / 12) * 2.0
      const points = [
        new THREE.Vector3(-1.7, y, -0.52 + Math.sin(strand) * 0.16),
        new THREE.Vector3(-0.75, y * 0.62, 0.15 + Math.cos(strand) * 0.22),
        new THREE.Vector3(0.45, -y * 0.24, -0.12 + Math.sin(strand * 0.7) * 0.2),
        new THREE.Vector3(1.65, y * 0.76, 0.46 + Math.cos(strand * 0.8) * 0.12),
      ]
      const filament = register('cytoskeleton', new THREE.Mesh(makeTube(points, 0.009, 5), cytoskeletonMaterial.clone()), 'Cytoskeletal filament') as THREE.Mesh
      root.add(filament)
    }

    const resize = () => {
      const width = Math.max(1, mount.clientWidth)
      const height = Math.max(1, mount.clientHeight)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)

    let visible = true
    const intersectionObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting }, { threshold: 0.03 })
    intersectionObserver.observe(mount)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const onPointerUp = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(root.children, true).find((item) => item.object.visible)
      if (!hit) return
      let object: THREE.Object3D | null = hit.object
      while (object && !object.userData.label && object.parent !== root) object = object.parent
      setPicked(object?.userData.label || hit.object.userData.label || 'Cell structure')
    }
    renderer.domElement.addEventListener('pointerup', onPointerUp)

    let frame = 0
    const animate = () => {
      controls.update()
      if (visible && document.visibilityState !== 'hidden') renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }
    animate()
    setReady(true)

    return () => {
      setReady(false)
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      controls.dispose()
      root.traverse((object) => {
        const mesh = object as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
        if (mesh.material) materialList(mesh.material).forEach((material) => material.dispose())
      })
      environment.dispose()
      pmrem.dispose()
      renderer.dispose()
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement)
      rendererRef.current = null
      cameraRef.current = null
      controlsRef.current = null
      sceneRef.current = null
      structureRef.current.clear()
    }
  }, [])

  useEffect(() => {
    for (const [id, objects] of structureRef.current.entries()) {
      const active = focus === 'all' || id === focus || (focus !== 'membrane' && id === 'membrane')
      for (const object of objects) object.visible = active
    }
  }, [focus, ready])

  useEffect(() => {
    const renderer = rendererRef.current
    const mount = mountRef.current
    const camera = cameraRef.current
    if (!renderer || !mount || !camera) return
    const ua = navigator.userAgent || ''
    const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const cap = quality === 'hd' ? (isIOS ? 1.6 : 2) : (isIOS ? 1.1 : 1.35)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap))
    const width = Math.max(1, mount.clientWidth)
    const height = Math.max(1, mount.clientHeight)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }, [quality, ready])

  function resetView() {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return
    camera.position.set(0.15, 0.08, 5.55)
    controls.target.set(0, 0, 0)
    controls.update()
    setFocus('all')
    setPicked('Whole-cell structural model')
  }

  return (
    <section className="overflow-hidden rounded-[26px] border border-white/10 bg-[#05080c] shadow-[0_24px_70px_rgba(0,0,0,.24)]">
      <div className="border-b border-white/10 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[9px] font-medium uppercase tracking-[.14em] text-cyan-300">3D structural reconstruction</div>
            <h3 className="mt-1 text-[17px] font-semibold tracking-tight text-white sm:text-xl">High-definition human cell atlas</h3>
            <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-white/50">Spatial teaching model for organelle relationships. It is paired with real Human Protein Atlas microscopy below and is not presented as a patient-specific microscopic acquisition.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setQuality((value) => value === 'hd' ? 'balanced' : 'hd')} className={`rounded-full border px-3 py-2 text-[9px] font-semibold ${quality === 'hd' ? 'border-cyan-300 bg-cyan-300 text-[#051018]' : 'border-white/10 bg-white/[.05] text-white/70'}`}>{quality === 'hd' ? 'HD on' : 'HD'}</button>
            <button type="button" onClick={resetView} className="rounded-full border border-white/10 bg-white/[.05] px-3 py-2 text-[9px] font-semibold text-white/70">Reset view</button>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_270px]">
        <div className="relative min-w-0">
          <div ref={mountRef} className="h-[clamp(430px,62vh,720px)] w-full touch-none" aria-label="Interactive high-definition 3D cell structural atlas" role="application" />
          <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-[9px] font-medium text-white/65 backdrop-blur-xl">Drag rotate · pinch / wheel zoom · tap structure</div>
          <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex justify-center">
            <div className="rounded-full border border-white/10 bg-black/55 px-3 py-2 text-[9px] font-medium text-white/75 backdrop-blur-xl">Selected · {picked}</div>
          </div>
        </div>

        <aside className="border-t border-white/10 bg-[#080d12] p-4 xl:border-l xl:border-t-0 sm:p-5">
          <div className="text-[9px] font-medium uppercase tracking-[.14em] text-white/35">Isolate anatomy</div>
          <div className="mt-3 space-y-1.5">
            {STRUCTURES.map((item) => (
              <button key={item.id} type="button" onClick={() => setFocus(item.id)} className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${focus === item.id ? 'border-cyan-300/70 bg-cyan-300/10 text-white' : 'border-white/[.07] bg-white/[.025] text-white/65 hover:bg-white/[.05]'}`}>
                <span className="block text-[11px] font-semibold">{item.label}</span>
                <span className="mt-0.5 block text-[9px] leading-relaxed text-white/38">{item.note}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-white/[.07] bg-white/[.025] p-3 text-[9px] leading-relaxed text-white/42">
            Detail strategy: preserve real-source microscopy as reference, use this renderer only for 3D spatial relationships, and keep SVG schematic views as lightweight educational fallback rather than the primary representation.
          </div>
        </aside>
      </div>
    </section>
  )
}

export default HighDefinitionCellAtlas
