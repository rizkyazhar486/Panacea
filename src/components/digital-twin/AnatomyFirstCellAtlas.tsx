import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

type StructureId =
  | 'all'
  | 'membrane'
  | 'cytoplasm'
  | 'nucleus'
  | 'nuclear-pore'
  | 'chromatin'
  | 'nucleolus'
  | 'mitochondria'
  | 'rough-er'
  | 'smooth-er'
  | 'ribosome'
  | 'golgi'
  | 'lysosome'
  | 'peroxisome'
  | 'vesicle'
  | 'centrosome'
  | 'cytoskeleton'

type Quality = 'balanced' | 'hd'

type StructureMeta = {
  id: StructureId
  label: string
  detail: string
}

type ViewerApi = {
  renderer: THREE.WebGLRenderer
  camera: THREE.PerspectiveCamera
  controls: OrbitControls
  scene: THREE.Scene
  root: THREE.Group
  render: () => void
}

const STRUCTURES: StructureMeta[] = [
  { id: 'all', label: 'Whole cell', detail: 'All major organelles in spatial context' },
  { id: 'membrane', label: 'Plasma membrane', detail: 'Cell boundary / phospholipid-bilayer scale' },
  { id: 'cytoplasm', label: 'Cytoplasm', detail: 'Aqueous intracellular compartment surrounding organelles' },
  { id: 'nucleus', label: 'Nucleus', detail: 'Double envelope enclosing chromatin' },
  { id: 'nuclear-pore', label: 'Nuclear pores', detail: 'Nuclear-envelope transport complexes' },
  { id: 'chromatin', label: 'Chromatin', detail: 'DNA–protein fibers within the nucleus' },
  { id: 'nucleolus', label: 'Nucleolus', detail: 'Ribosomal RNA synthesis / assembly compartment' },
  { id: 'mitochondria', label: 'Mitochondria', detail: 'Outer membrane, inner membrane and cristae' },
  { id: 'rough-er', label: 'Rough ER', detail: 'Perinuclear membrane network with bound ribosomes' },
  { id: 'smooth-er', label: 'Smooth ER', detail: 'Tubular membrane network without bound ribosomes' },
  { id: 'ribosome', label: 'Ribosomes', detail: 'Cytosolic and ER-bound translation machinery' },
  { id: 'golgi', label: 'Golgi apparatus', detail: 'Stacked cisternae and associated vesicles' },
  { id: 'lysosome', label: 'Lysosomes', detail: 'Acidic degradative vesicles' },
  { id: 'peroxisome', label: 'Peroxisomes', detail: 'Oxidative metabolic organelles' },
  { id: 'vesicle', label: 'Transport vesicles', detail: 'Membrane trafficking compartments' },
  { id: 'centrosome', label: 'Centrosome', detail: 'Paired centrioles and microtubule-organizing region' },
  { id: 'cytoskeleton', label: 'Cytoskeleton', detail: 'Microtubule / filament structural network' },
]

function materialList(material: THREE.Material | THREE.Material[]) {
  return Array.isArray(material) ? material : [material]
}

function seededRandom(seed = 23) {
  let value = seed >>> 0
  return () => {
    value = (1664525 * value + 1013904223) >>> 0
    return value / 4294967296
  }
}

function organicSphere(radius: number, width = 56, height = 40, irregularity = 0.035) {
  const geometry = new THREE.SphereGeometry(radius, width, height)
  const position = geometry.attributes.position as THREE.BufferAttribute
  const vertex = new THREE.Vector3()
  for (let i = 0; i < position.count; i += 1) {
    vertex.fromBufferAttribute(position, i)
    const normal = vertex.clone().normalize()
    const perturb = 1 + irregularity * (
      Math.sin(normal.x * 6.1 + normal.y * 2.3) +
      Math.sin(normal.y * 7.3 - normal.z * 1.7) +
      Math.sin(normal.z * 5.9 + normal.x * 2.7)
    ) / 3
    vertex.multiplyScalar(perturb)
    position.setXYZ(i, vertex.x, vertex.y, vertex.z)
  }
  position.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
}

function tube(points: THREE.Vector3[], radius: number, radialSegments = 7, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'catmullrom', 0.5)
  return new THREE.TubeGeometry(curve, Math.max(28, points.length * 10), radius, radialSegments, closed)
}

function iOSDevice() {
  if (typeof navigator === 'undefined') return false
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function qualityCap(quality: Quality) {
  if (iOSDevice()) return quality === 'hd' ? 1.45 : 1.05
  return quality === 'hd' ? 1.85 : 1.3
}

function fitObject(camera: THREE.PerspectiveCamera, controls: OrbitControls, object: THREE.Object3D, padding = 1.35) {
  const box = new THREE.Box3().setFromObject(object)
  if (box.isEmpty()) return
  const sphere = box.getBoundingSphere(new THREE.Sphere())
  const radius = Math.max(sphere.radius, 0.01)
  const fov = THREE.MathUtils.degToRad(camera.fov)
  const distance = radius / Math.sin(fov / 2) * padding
  camera.near = Math.max(radius / 100, 0.01)
  camera.far = Math.max(distance * 8, radius * 20)
  camera.position.set(sphere.center.x + distance * 0.08, sphere.center.y + distance * 0.03, sphere.center.z + distance)
  controls.target.copy(sphere.center)
  controls.minDistance = radius * 0.6
  controls.maxDistance = distance * 2.5
  camera.updateProjectionMatrix()
  controls.update()
}

function labelForObject(object: THREE.Object3D | null) {
  let current = object
  while (current) {
    if (typeof current.userData.label === 'string' && current.userData.label) return current.userData.label as string
    current = current.parent
  }
  return 'Cell structure'
}

export function AnatomyFirstCellAtlas() {
  const mountRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<ViewerApi | null>(null)
  const structureRef = useRef(new Map<StructureId, THREE.Object3D[]>())
  const [focus, setFocus] = useState<StructureId>('all')
  const [quality, setQuality] = useState<Quality>('balanced')
  const [selected, setSelected] = useState('Whole-cell anatomy')
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  const focusMeta = useMemo(() => STRUCTURES.find((item) => item.id === focus) ?? STRUCTURES[0], [focus])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let disposed = false
    let resizeObserver: ResizeObserver | null = null

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x05080c)

    const camera = new THREE.PerspectiveCamera(31, 1, 0.01, 100)
    camera.position.set(0.15, 0.05, 5.8)

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    } catch {
      setError('Interactive 3D is unavailable in this browser session.')
      return
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.02
    renderer.setClearColor(0x05080c, 1)
    renderer.domElement.style.touchAction = 'none'
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, qualityCap('balanced')))
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = false
    controls.enablePan = false
    controls.autoRotate = false
    controls.target.set(0, 0, 0)

    const pmrem = new THREE.PMREMGenerator(renderer)
    const room = new RoomEnvironment()
    const environment = pmrem.fromScene(room, 0.04).texture
    room.dispose()
    pmrem.dispose()
    scene.environment = environment

    scene.add(new THREE.HemisphereLight(0xeaf7ff, 0x071018, 1.35))
    const key = new THREE.DirectionalLight(0xffffff, 2.65)
    key.position.set(4.5, 5.5, 6)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0x8fd8ff, 1.15)
    fill.position.set(-5, 1.2, 3.5)
    scene.add(fill)
    const rim = new THREE.DirectionalLight(0xffa2c8, 0.95)
    rim.position.set(3, 2.5, -5)
    scene.add(rim)

    const root = new THREE.Group()
    root.rotation.set(-0.06, 0.15, -0.025)
    scene.add(root)

    const register = (id: StructureId, object: THREE.Object3D, label: string) => {
      object.userData.structureId = id
      object.userData.label = label
      const list = structureRef.current.get(id) ?? []
      list.push(object)
      structureRef.current.set(id, list)
      return object
    }

    const membrane = register(
      'membrane',
      new THREE.Mesh(
        organicSphere(1.82, 68, 52, 0.052),
        new THREE.MeshPhysicalMaterial({
          color: 0xb6d9d4,
          roughness: 0.4,
          metalness: 0,
          transparent: true,
          opacity: 0.28,
          transmission: 0.08,
          thickness: 0.25,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      ),
      'Plasma membrane',
    ) as THREE.Mesh
    membrane.scale.set(1.27, 0.91, 0.84)
    root.add(membrane)

    const cytoplasm = register(
      'cytoplasm',
      new THREE.Mesh(
        organicSphere(1.70, 56, 42, 0.045),
        new THREE.MeshPhysicalMaterial({ color: 0x776c59, roughness: 0.66, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.BackSide }),
      ),
      'Cytoplasm',
    ) as THREE.Mesh
    cytoplasm.scale.copy(membrane.scale)
    root.add(cytoplasm)

    const nucleusGroup = register('nucleus', new THREE.Group(), 'Nucleus') as THREE.Group
    nucleusGroup.position.set(-0.12, 0.05, 0.02)
    root.add(nucleusGroup)

    const nuclearEnvelope = new THREE.Mesh(
      organicSphere(0.82, 58, 44, 0.025),
      new THREE.MeshPhysicalMaterial({ color: 0x6a4b86, roughness: 0.38, transparent: true, opacity: 0.82, transmission: 0.025, thickness: 0.16 }),
    )
    nuclearEnvelope.scale.set(1.04, 0.94, 0.90)
    nuclearEnvelope.userData.structureId = 'nucleus'
    nuclearEnvelope.userData.label = 'Nuclear envelope'
    nucleusGroup.add(nuclearEnvelope)

    const nucleolus = register(
      'nucleolus',
      new THREE.Mesh(
        organicSphere(0.245, 32, 24, 0.02),
        new THREE.MeshPhysicalMaterial({ color: 0xb870a5, roughness: 0.46 }),
      ),
      'Nucleolus',
    ) as THREE.Mesh
    nucleolus.position.set(0.19, -0.08, 0.18)
    nucleusGroup.add(nucleolus)

    const chromatinMaterial = new THREE.MeshStandardMaterial({ color: 0xcbb8e8, roughness: 0.64, transparent: true, opacity: 0.55 })
    for (let strand = 0; strand < 8; strand += 1) {
      const points: THREE.Vector3[] = []
      for (let i = 0; i < 11; i += 1) {
        const t = i / 10
        const angle = t * Math.PI * 2.4 + strand * 0.63
        const radius = 0.22 + Math.sin(t * Math.PI) * 0.33
        points.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          (t - 0.5) * 0.92 + Math.sin(angle * 0.75) * 0.05,
          Math.sin(angle) * radius * 0.72,
        ))
      }
      const fiber = register('chromatin', new THREE.Mesh(tube(points, 0.010, 6), chromatinMaterial.clone()), 'Chromatin fiber') as THREE.Mesh
      nucleusGroup.add(fiber)
    }

    const poreMaterial = new THREE.MeshStandardMaterial({ color: 0x8ed7e2, roughness: 0.52 })
    for (let i = 0; i < 22; i += 1) {
      const phi = Math.acos(1 - 2 * ((i + 0.5) / 22))
      const theta = Math.PI * (1 + Math.sqrt(5)) * i
      const x = Math.sin(phi) * Math.cos(theta) * 0.83
      const y = Math.cos(phi) * 0.77
      const z = Math.sin(phi) * Math.sin(theta) * 0.72
      const pore = register('nuclear-pore', new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.009, 6, 16), poreMaterial.clone()), 'Nuclear pore complex') as THREE.Mesh
      pore.position.set(x, y, z)
      pore.lookAt(new THREE.Vector3(0, 0, 0))
      nucleusGroup.add(pore)
    }

    const mitochondriaMaterial = new THREE.MeshPhysicalMaterial({ color: 0xa85545, roughness: 0.47, clearcoat: 0.08 })
    const cristaMaterial = new THREE.MeshStandardMaterial({ color: 0xf0ad8f, roughness: 0.56 })
    const mitochondria = [
      [-1.22, 0.70, 0.18, -0.35], [1.10, 0.55, -0.34, 0.28], [-1.25, -0.64, -0.18, 0.42],
      [1.12, -0.62, 0.27, -0.24], [0.68, 0.08, 0.73, 0.52], [-0.70, 0.12, -0.73, -0.48],
    ] as const
    mitochondria.forEach(([x, y, z, rot], index) => {
      const group = register('mitochondria', new THREE.Group(), `Mitochondrion ${index + 1}`) as THREE.Group
      group.position.set(x, y, z)
      group.rotation.z = rot
      group.rotation.y = rot * 0.7
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 34, 24), mitochondriaMaterial.clone())
      body.scale.set(1.5, 0.61, 0.67)
      body.userData.label = 'Mitochondrial outer membrane'
      body.userData.structureId = 'mitochondria'
      group.add(body)
      for (let c = -2; c <= 2; c += 1) {
        const points: THREE.Vector3[] = []
        for (let p = 0; p < 9; p += 1) {
          const tx = -0.34 + p * 0.085
          points.push(new THREE.Vector3(tx, Math.sin(p * 1.22 + c) * 0.06 + c * 0.035, 0.20))
        }
        const crista = new THREE.Mesh(tube(points, 0.007, 5), cristaMaterial.clone())
        crista.userData.label = 'Mitochondrial cristae'
        crista.userData.structureId = 'mitochondria'
        group.add(crista)
      }
      root.add(group)
    })

    const roughErMaterial = new THREE.MeshStandardMaterial({ color: 0x4b88a8, roughness: 0.56 })
    const roughErObjects: THREE.Object3D[] = []
    for (let layer = 0; layer < 7; layer += 1) {
      const points: THREE.Vector3[] = []
      for (let i = 0; i < 18; i += 1) {
        const angle = (i / 17) * Math.PI * 2
        const r = 0.94 + layer * 0.048 + Math.sin(i * 1.55 + layer) * 0.055
        points.push(new THREE.Vector3(
          Math.cos(angle) * r - 0.12,
          Math.sin(angle) * (0.59 + layer * 0.012) + (layer - 3) * 0.042,
          -0.28 + Math.sin(angle * 2 + layer) * 0.105,
        ))
      }
      const er = register('rough-er', new THREE.Mesh(tube(points, 0.025, 7, true), roughErMaterial.clone()), 'Rough endoplasmic reticulum') as THREE.Mesh
      roughErObjects.push(er)
      root.add(er)
    }

    const smoothErMaterial = new THREE.MeshStandardMaterial({ color: 0x5fa995, roughness: 0.58 })
    for (let branch = 0; branch < 9; branch += 1) {
      const points: THREE.Vector3[] = []
      for (let i = 0; i < 8; i += 1) {
        const t = i / 7
        points.push(new THREE.Vector3(
          -1.18 + t * 0.75 + Math.sin(t * 5 + branch) * 0.10,
          -0.92 + branch * 0.18 + Math.sin(t * 4 + branch * 0.4) * 0.08,
          0.42 + Math.cos(t * 4 + branch) * 0.12,
        ))
      }
      const er = register('smooth-er', new THREE.Mesh(tube(points, 0.018, 6), smoothErMaterial.clone()), 'Smooth endoplasmic reticulum') as THREE.Mesh
      root.add(er)
    }

    const golgiMaterial = new THREE.MeshPhysicalMaterial({ color: 0x7a9a68, roughness: 0.5, clearcoat: 0.04 })
    for (let layer = 0; layer < 7; layer += 1) {
      const points: THREE.Vector3[] = []
      for (let i = 0; i < 12; i += 1) {
        const t = i / 11
        const angle = -1.1 + t * 2.2
        points.push(new THREE.Vector3(
          0.88 + Math.cos(angle) * (0.47 + layer * 0.018),
          -0.18 + Math.sin(angle) * (0.30 + layer * 0.008) + layer * 0.052,
          -0.58 + layer * 0.025,
        ))
      }
      const cisterna = register('golgi', new THREE.Mesh(tube(points, 0.027, 7), golgiMaterial.clone()), 'Golgi cisterna') as THREE.Mesh
      root.add(cisterna)
    }

    const addSphereOrganelle = (id: StructureId, label: string, position: [number, number, number], radius: number, color: number) => {
      const mesh = register(id, new THREE.Mesh(new THREE.SphereGeometry(radius, 22, 16), new THREE.MeshPhysicalMaterial({ color, roughness: 0.45 })), label) as THREE.Mesh
      mesh.position.set(...position)
      root.add(mesh)
      return mesh
    }

    addSphereOrganelle('lysosome', 'Lysosome', [-1.02, 0.86, -0.25], 0.13, 0x8b5777)
    addSphereOrganelle('lysosome', 'Lysosome', [0.40, -0.92, -0.30], 0.11, 0x8b5777)
    addSphereOrganelle('peroxisome', 'Peroxisome', [-1.08, -0.12, 0.62], 0.12, 0x967538)
    addSphereOrganelle('peroxisome', 'Peroxisome', [1.22, 0.22, -0.36], 0.10, 0x967538)
    addSphereOrganelle('vesicle', 'Transport vesicle', [1.34, -0.05, -0.53], 0.085, 0x6c93b5)
    addSphereOrganelle('vesicle', 'Transport vesicle', [0.98, -0.48, -0.66], 0.075, 0x6c93b5)
    addSphereOrganelle('vesicle', 'Transport vesicle', [1.23, 0.40, -0.48], 0.065, 0x6c93b5)

    const random = seededRandom(41)
    const ribosomeGeometry = new THREE.SphereGeometry(0.018, 8, 6)
    const ribosomeMaterial = new THREE.MeshStandardMaterial({ color: 0xc16c5d, roughness: 0.68 })
    const ribosomeCount = 150
    const ribosomes = register('ribosome', new THREE.InstancedMesh(ribosomeGeometry, ribosomeMaterial, ribosomeCount), 'Ribosomes') as THREE.InstancedMesh
    const dummy = new THREE.Object3D()
    for (let i = 0; i < ribosomeCount; i += 1) {
      const angle = random() * Math.PI * 2
      const radial = 0.90 + random() * 0.42
      dummy.position.set(
        Math.cos(angle) * radial - 0.10,
        (random() - 0.5) * 1.10,
        -0.25 + (random() - 0.5) * 0.40,
      )
      dummy.rotation.set(random() * Math.PI, random() * Math.PI, random() * Math.PI)
      dummy.updateMatrix()
      ribosomes.setMatrixAt(i, dummy.matrix)
    }
    ribosomes.instanceMatrix.needsUpdate = true
    root.add(ribosomes)

    const centrioleMaterial = new THREE.MeshStandardMaterial({ color: 0xd8bb67, roughness: 0.54 })
    const centrosome = register('centrosome', new THREE.Group(), 'Centrosome / paired centrioles') as THREE.Group
    centrosome.position.set(0.56, 0.63, 0.62)
    const centrioleA = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.42, 12, 1, true), centrioleMaterial.clone())
    centrioleA.rotation.z = Math.PI / 2
    centrioleA.userData.label = 'Centriole'
    const centrioleB = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.42, 12, 1, true), centrioleMaterial.clone())
    centrioleB.rotation.x = Math.PI / 2
    centrioleB.rotation.z = Math.PI / 4
    centrioleB.userData.label = 'Centriole'
    centrosome.add(centrioleA, centrioleB)
    root.add(centrosome)

    const cytoskeletonMaterial = new THREE.MeshStandardMaterial({ color: 0xb69370, roughness: 0.62, transparent: true, opacity: 0.62 })
    for (let strand = 0; strand < 16; strand += 1) {
      const y = -1.10 + strand * 0.145
      const points = [
        new THREE.Vector3(-1.72, y, -0.52 + Math.sin(strand) * 0.13),
        new THREE.Vector3(-0.78, y * 0.58, 0.15 + Math.cos(strand) * 0.20),
        new THREE.Vector3(0.45, -y * 0.22, -0.12 + Math.sin(strand * 0.7) * 0.18),
        new THREE.Vector3(1.68, y * 0.74, 0.45 + Math.cos(strand * 0.8) * 0.11),
      ]
      const filament = register('cytoskeleton', new THREE.Mesh(tube(points, 0.007, 5), cytoskeletonMaterial.clone()), 'Cytoskeletal filament') as THREE.Mesh
      root.add(filament)
    }

    const render = () => {
      if (!disposed) renderer.render(scene, camera)
    }

    const resize = () => {
      if (disposed) return
      const width = Math.max(1, mount.clientWidth)
      const height = Math.max(1, mount.clientHeight)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      render()
    }
    resize()
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(mount)
    } else {
      window.addEventListener('resize', resize)
    }

    controls.addEventListener('change', render)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const onPointerUp = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObject(root, true).find((item) => item.object.visible)
      if (!hit) return
      setSelected(labelForObject(hit.object))
      render()
    }

    const onContextLost = (event: Event) => {
      event.preventDefault()
      if (!disposed) setError('The browser released the WebGL context. Re-open this cell view after closing another heavy 3D view.')
    }

    renderer.domElement.addEventListener('pointerup', onPointerUp)
    renderer.domElement.addEventListener('webglcontextlost', onContextLost)

    fitObject(camera, controls, root, 1.45)
    apiRef.current = { renderer, camera, controls, scene, root, render }
    setReady(true)
    render()

    return () => {
      disposed = true
      setReady(false)
      apiRef.current = null
      resizeObserver?.disconnect()
      window.removeEventListener('resize', resize)
      controls.removeEventListener('change', render)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
      controls.dispose()
      root.traverse((object) => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.InstancedMesh)) return
        object.geometry?.dispose()
        if (object.material) materialList(object.material).forEach((material) => material.dispose())
      })
      environment.dispose()
      renderer.renderLists.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement)
      structureRef.current.clear()
    }
  }, [])

  useEffect(() => {
    const api = apiRef.current
    if (!api || !ready) return
    for (const [id, objects] of structureRef.current.entries()) {
      const visible = focus === 'all' || id === focus || (focus !== 'membrane' && focus !== 'cytoplasm' && id === 'membrane')
      objects.forEach((object) => { object.visible = visible })
    }
    if (focus === 'all') fitObject(api.camera, api.controls, api.root, 1.45)
    else {
      const objects = structureRef.current.get(focus) ?? []
      const group = new THREE.Group()
      objects.forEach((object) => group.add(object.clone(false)))
      if (objects.length) fitObject(api.camera, api.controls, objects.length === 1 ? objects[0] : api.root, objects.length === 1 ? 1.8 : 1.5)
    }
    setSelected(focusMeta.label)
    api.render()
  }, [focus, focusMeta.label, ready])

  useEffect(() => {
    const api = apiRef.current
    const mount = mountRef.current
    if (!api || !mount || !ready) return
    api.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, qualityCap(quality)))
    const width = Math.max(1, mount.clientWidth)
    const height = Math.max(1, mount.clientHeight)
    api.renderer.setSize(width, height, false)
    api.camera.aspect = width / height
    api.camera.updateProjectionMatrix()
    api.render()
  }, [quality, ready])

  function resetView() {
    const api = apiRef.current
    if (!api) return
    setFocus('all')
    setSelected('Whole-cell anatomy')
    fitObject(api.camera, api.controls, api.root, 1.45)
    api.render()
  }

  return (
    <section className="overflow-hidden rounded-[22px] border border-white/10 bg-[#05080c] shadow-[0_18px_52px_rgba(0,0,0,.2)]">
      <header className="border-b border-white/10 px-4 py-3.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl">
            <div className="text-[8px] font-medium uppercase tracking-[.13em] text-cyan-300">Cell anatomy · static by default</div>
            <h2 className="mt-1 text-[16px] font-semibold tracking-tight text-white">Human eukaryotic cell · organelle atlas</h2>
            <p className="mt-1 text-[10px] leading-relaxed text-white/52">
              A spatial reconstruction for anatomy teaching: membrane, nucleus, pores, chromatin, mitochondria, ER, Golgi, vesicles, centrosome, ribosomes and cytoskeleton. It does not auto-spin or pulse. Real microscopy remains the source reference below.
            </p>
          </div>
          <div className="flex gap-1.5">
            <button type="button" onClick={() => setQuality((value) => value === 'hd' ? 'balanced' : 'hd')} className={`rounded-full border px-3 py-1.5 text-[9px] font-semibold ${quality === 'hd' ? 'border-cyan-300 bg-cyan-300 text-[#051018]' : 'border-white/10 bg-white/[.05] text-white/70'}`}>
              {quality === 'hd' ? 'HD on' : 'HD'}
            </button>
            <button type="button" onClick={resetView} className="rounded-full border border-white/10 bg-white/[.05] px-3 py-1.5 text-[9px] font-semibold text-white/70">Fit</button>
          </div>
        </div>
      </header>

      {error && <div className="m-3 rounded-xl border border-rose-300/20 bg-rose-400/10 p-3 text-[9px] leading-relaxed text-rose-100">{error}</div>}

      <div className="grid xl:grid-cols-[minmax(0,1fr)_255px]">
        <div className="relative min-w-0">
          <div ref={mountRef} className="h-[clamp(420px,62vh,700px)] w-full touch-none" role="application" aria-label="Interactive static human cell anatomy atlas" />
          <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/10 bg-black/55 px-2.5 py-1.5 text-[8px] font-medium text-white/65 backdrop-blur-lg">
            Drag to inspect · pinch / wheel zoom · tap structure
          </div>
          <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex justify-center">
            <div className="rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-[8px] font-medium text-white/75 backdrop-blur-lg">Selected · {selected}</div>
          </div>
        </div>

        <aside className="border-t border-white/10 bg-[#080d12] p-3 xl:border-l xl:border-t-0">
          <div className="text-[8px] font-medium uppercase tracking-[.13em] text-white/35">Anatomical components</div>
          <div className="mt-2 max-h-[610px] space-y-1 overflow-y-auto pr-1">
            {STRUCTURES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFocus(item.id)}
                className={`w-full rounded-xl border px-2.5 py-2 text-left ${focus === item.id ? 'border-cyan-300/65 bg-cyan-300/10 text-white' : 'border-white/[.07] bg-white/[.025] text-white/68'}`}
              >
                <span className="block text-[10px] font-semibold">{item.label}</span>
                <span className="mt-0.5 block text-[8px] leading-relaxed text-white/38">{item.detail}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  )
}

export default AnatomyFirstCellAtlas
