import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

export type MicroStage = 'cell' | 'nucleus' | 'chromatin' | 'dna' | 'sequencing'

type StageMeta = {
  key: MicroStage
  label: string
  scale: string
  detail: string
}

const STAGES: StageMeta[] = [
  { key: 'cell', label: 'Cell', scale: '~10–30 µm', detail: 'Eukaryotic cell architecture: membrane, cytoskeleton, nucleus, ER, Golgi and mitochondria.' },
  { key: 'nucleus', label: 'Nucleus', scale: '~5–10 µm', detail: 'Nuclear envelope, pores, nucleolus and chromatin territories.' },
  { key: 'chromatin', label: 'Chromatin', scale: '10–30 nm', detail: 'DNA packaging around histone octamers into nucleosomes and chromatin fibers.' },
  { key: 'dna', label: 'DNA', scale: '~2 nm', detail: 'Double helix with antiparallel sugar-phosphate backbones and paired nucleobases.' },
  { key: 'sequencing', label: 'Sequencing', scale: 'base-level', detail: 'Nanopore concept view with raw-current trace and basecalling provenance gate.' },
]

const BASES = ['A', 'T', 'G', 'C'] as const
const BASE_COLOR: Record<(typeof BASES)[number], number> = {
  A: 0x65d67c,
  T: 0xef6a6a,
  G: 0xe5b84b,
  C: 0x5da6ff,
}

function mat(color: number, roughness = 0.42, clearcoat = 0.06, opacity = 1) {
  const material = new THREE.MeshPhysicalMaterial({
    color,
    roughness,
    metalness: 0,
    clearcoat,
    clearcoatRoughness: 0.44,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity > 0.55,
  })
  material.envMapIntensity = 1
  return material
}

function tube(curve: THREE.Curve<THREE.Vector3>, radius: number, material: THREE.Material, tubularSegments = 96) {
  return new THREE.Mesh(new THREE.TubeGeometry(curve, tubularSegments, radius, 10, false), material)
}

function helixPoint(t: number, radius: number, pitch: number, phase = 0) {
  const angle = t * Math.PI * 8 + phase
  return new THREE.Vector3(Math.cos(angle) * radius, (t - 0.5) * pitch, Math.sin(angle) * radius)
}

function addLabelled(group: THREE.Group, object: THREE.Object3D, label: string) {
  object.userData.label = label
  group.add(object)
  return object
}

function addMitochondrion(parent: THREE.Group, position: THREE.Vector3, rotation: THREE.Euler, scale = 1) {
  const group = new THREE.Group()
  group.position.copy(position)
  group.rotation.copy(rotation)
  group.scale.setScalar(scale)

  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 64, 40),
    new THREE.MeshPhysicalMaterial({
      color: 0x9a4a33,
      roughness: 0.43,
      clearcoat: 0.12,
      clearcoatRoughness: 0.4,
      transmission: 0.015,
      thickness: 0.08,
    }),
  )
  shell.scale.set(1.45, 0.62, 0.68)
  shell.userData.label = 'Mitochondrion · outer membrane'
  group.add(shell)

  const cristaMaterial = mat(0xf2a16f, 0.5, 0.025, 0.9)
  for (let i = -4; i <= 4; i += 1) {
    const points: THREE.Vector3[] = []
    for (let j = 0; j <= 36; j += 1) {
      const x = (j / 36 - 0.5) * 1.05
      const y = i * 0.065 + Math.sin(j * 0.65 + i) * 0.09
      const z = Math.cos(j * 0.46 + i) * 0.22
      points.push(new THREE.Vector3(x, y, z))
    }
    const curve = new THREE.CatmullRomCurve3(points)
    const crista = tube(curve, 0.018, cristaMaterial, 64)
    crista.userData.label = 'Mitochondrial crista'
    group.add(crista)
  }

  parent.add(group)
}

function addRoughER(parent: THREE.Group) {
  const membrane = mat(0x446ca8, 0.48, 0.04, 0.9)
  const ribosome = mat(0xe27278, 0.56, 0.02)
  for (let sheet = 0; sheet < 6; sheet += 1) {
    const points: THREE.Vector3[] = []
    for (let i = 0; i <= 80; i += 1) {
      const t = i / 80
      const angle = t * Math.PI * 2.35 + sheet * 0.24
      const radius = 1.48 + sheet * 0.11 + Math.sin(t * 14 + sheet) * 0.045
      points.push(new THREE.Vector3(Math.cos(angle) * radius, -0.26 + sheet * 0.1 + Math.sin(t * 10) * 0.055, Math.sin(angle) * radius * 0.65))
    }
    const er = tube(new THREE.CatmullRomCurve3(points), 0.055, membrane, 120)
    er.userData.label = 'Rough endoplasmic reticulum'
    parent.add(er)

    for (let i = 5; i < points.length; i += 10) {
      const p = points[i]
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), ribosome)
      bead.position.copy(p).multiplyScalar(1.015)
      bead.userData.label = 'Ribosome on rough ER'
      parent.add(bead)
    }
  }
}

function addGolgi(parent: THREE.Group) {
  const golgi = new THREE.Group()
  golgi.position.set(1.55, -0.82, 0.72)
  golgi.rotation.set(0.2, -0.35, -0.18)
  const membrane = mat(0x75b797, 0.49, 0.06, 0.95)
  for (let i = 0; i < 7; i += 1) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.58 + i * 0.02, i * 0.09, -0.08),
      new THREE.Vector3(-0.2, i * 0.09 + 0.08, 0.03),
      new THREE.Vector3(0.24, i * 0.09 + 0.05, -0.02),
      new THREE.Vector3(0.6 - i * 0.015, i * 0.09, 0.08),
    ])
    const cisterna = tube(curve, 0.052, membrane, 64)
    cisterna.scale.z = 1.5
    cisterna.userData.label = 'Golgi cisterna'
    golgi.add(cisterna)
  }
  for (let i = 0; i < 10; i += 1) {
    const vesicle = new THREE.Mesh(new THREE.SphereGeometry(0.075 + (i % 3) * 0.012, 18, 14), membrane)
    const angle = i * 1.7
    vesicle.position.set(Math.cos(angle) * (0.62 + (i % 2) * 0.12), 0.1 + (i % 5) * 0.11, Math.sin(angle) * 0.45)
    vesicle.userData.label = 'Golgi transport vesicle'
    golgi.add(vesicle)
  }
  parent.add(golgi)
}

function addCytoskeleton(parent: THREE.Group) {
  const microtubule = mat(0x4fc0c7, 0.55, 0.02, 0.42)
  const actin = mat(0xea8067, 0.55, 0.02, 0.35)
  for (let i = 0; i < 30; i += 1) {
    const a = i * 1.91
    const b = i * 0.63
    const start = new THREE.Vector3(Math.sin(a) * 0.42, Math.cos(b) * 0.36, Math.cos(a) * 0.35)
    const end = new THREE.Vector3(Math.sin(a * 1.3) * 2.15, Math.cos(b * 1.4) * 1.55, Math.cos(a * 0.8) * 1.75)
    const mid = start.clone().lerp(end, 0.52).add(new THREE.Vector3(Math.sin(i) * 0.22, Math.cos(i * 0.7) * 0.18, Math.sin(i * 1.3) * 0.2))
    const filament = tube(new THREE.CatmullRomCurve3([start, mid, end]), i % 3 === 0 ? 0.016 : 0.009, i % 3 === 0 ? microtubule : actin, 42)
    filament.userData.label = i % 3 === 0 ? 'Microtubule' : 'Actin filament'
    parent.add(filament)
  }
}

function addNucleus(parent: THREE.Group, radius = 0.95) {
  const group = new THREE.Group()
  group.userData.label = 'Nucleus'

  const envelope = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 80, 56),
    new THREE.MeshPhysicalMaterial({
      color: 0x55417b,
      roughness: 0.44,
      clearcoat: 0.09,
      clearcoatRoughness: 0.42,
      transmission: 0.08,
      thickness: 0.12,
      transparent: true,
      opacity: 0.72,
      depthWrite: true,
    }),
  )
  envelope.scale.set(1.08, 0.93, 1)
  envelope.userData.label = 'Nuclear envelope · double membrane'
  group.add(envelope)

  const inner = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.91, 64, 44), mat(0x352b55, 0.58, 0.03, 0.28))
  inner.scale.copy(envelope.scale)
  inner.userData.label = 'Nucleoplasm'
  group.add(inner)

  const chromatinMat = mat(0xc2a8e7, 0.62, 0.02, 0.46)
  for (let strand = 0; strand < 22; strand += 1) {
    const points: THREE.Vector3[] = []
    for (let i = 0; i < 22; i += 1) {
      const t = i / 21
      const r = radius * (0.3 + ((strand * 17 + i * 11) % 50) / 100)
      const theta = strand * 0.91 + t * Math.PI * (1.5 + (strand % 4) * 0.4)
      const phi = strand * 0.43 + t * Math.PI * 2.1
      points.push(new THREE.Vector3(
        Math.cos(theta) * Math.sin(phi) * r,
        Math.cos(phi) * r * 0.76,
        Math.sin(theta) * Math.sin(phi) * r,
      ))
    }
    const fiber = tube(new THREE.CatmullRomCurve3(points), 0.012 + (strand % 3) * 0.003, chromatinMat, 48)
    fiber.userData.label = 'Chromatin fiber'
    group.add(fiber)
  }

  const nucleolus = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.24, 42, 28), mat(0xae6cab, 0.5, 0.05, 0.92))
  nucleolus.position.set(0.2, -0.06, 0.15)
  nucleolus.userData.label = 'Nucleolus'
  group.add(nucleolus)

  const poreMaterial = mat(0xb5e9ef, 0.42, 0.08, 0.86)
  for (let i = 0; i < 34; i += 1) {
    const y = 1 - (i / 33) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const angle = i * 2.399963
    const normal = new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r).normalize()
    const pore = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.036, radius * 0.009, 8, 16), poreMaterial)
    pore.position.copy(normal).multiplyScalar(radius * 1.02)
    pore.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)
    pore.userData.label = 'Nuclear pore complex'
    group.add(pore)
  }

  parent.add(group)
  return group
}

function buildCellScene(root: THREE.Group) {
  const cell = new THREE.Group()
  cell.rotation.set(-0.1, 0.35, 0.08)
  root.add(cell)

  const membraneGeometry = new THREE.SphereGeometry(2.65, 96, 72)
  const positions = membraneGeometry.attributes.position
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i)
    const y = positions.getY(i)
    const z = positions.getZ(i)
    const length = Math.sqrt(x * x + y * y + z * z) || 1
    const ripple = 1 + Math.sin(x * 3.7 + y * 2.9) * 0.018 + Math.sin(z * 4.8 - x * 1.6) * 0.012
    positions.setXYZ(i, x / length * 2.65 * ripple, y / length * 2.25 * ripple, z / length * 2.38 * ripple)
  }
  membraneGeometry.computeVertexNormals()
  const membrane = new THREE.Mesh(
    membraneGeometry,
    new THREE.MeshPhysicalMaterial({
      color: 0x8ca9a0,
      roughness: 0.38,
      clearcoat: 0.16,
      clearcoatRoughness: 0.35,
      transmission: 0.2,
      thickness: 0.32,
      transparent: true,
      opacity: 0.34,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  membrane.userData.label = 'Plasma membrane · phospholipid bilayer'
  cell.add(membrane)

  const cytoplasm = new THREE.Mesh(new THREE.SphereGeometry(2.48, 64, 48), mat(0x675c46, 0.68, 0.02, 0.12))
  cytoplasm.scale.set(1, 0.85, 0.9)
  cytoplasm.userData.label = 'Cytoplasm / cytosol'
  cell.add(cytoplasm)

  addCytoskeleton(cell)
  addRoughER(cell)
  addGolgi(cell)
  const nucleus = addNucleus(cell, 1.02)
  nucleus.position.set(0.22, 0.22, 0.06)

  addMitochondrion(cell, new THREE.Vector3(-1.42, 0.72, 0.95), new THREE.Euler(0.2, 0.4, -0.18), 0.75)
  addMitochondrion(cell, new THREE.Vector3(1.5, 0.76, -0.86), new THREE.Euler(-0.2, -0.6, 0.4), 0.65)
  addMitochondrion(cell, new THREE.Vector3(-1.48, -0.92, -0.64), new THREE.Euler(0.4, 0.1, 0.25), 0.58)
  addMitochondrion(cell, new THREE.Vector3(1.58, -0.58, 0.12), new THREE.Euler(-0.4, 0.25, -0.35), 0.52)

  const lysosomeMat = mat(0x9b5d8d, 0.4, 0.11, 0.8)
  const peroxMat = mat(0x9f7d3b, 0.54, 0.04, 0.88)
  for (let i = 0; i < 16; i += 1) {
    const angle = i * 1.79
    const radius = 1.45 + (i % 4) * 0.18
    const sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11 + (i % 3) * 0.018, 2), i % 2 ? lysosomeMat : peroxMat)
    sphere.position.set(Math.cos(angle) * radius, -0.9 + (i % 6) * 0.34, Math.sin(angle * 0.7) * 1.15)
    sphere.userData.label = i % 2 ? 'Lysosome' : 'Peroxisome'
    cell.add(sphere)
  }

  return { target: new THREE.Vector3(0, 0, 0), distance: 8.2 }
}

function buildNucleusScene(root: THREE.Group) {
  const nucleus = addNucleus(root, 2.05)
  nucleus.rotation.set(0.08, -0.28, 0)
  return { target: new THREE.Vector3(0, 0, 0), distance: 6.6 }
}

function buildChromatinScene(root: THREE.Group) {
  const histoneMaterial = mat(0x6c5aa5, 0.42, 0.08)
  const dnaMaterialA = mat(0x7a91e8, 0.34, 0.16)
  const dnaMaterialB = mat(0xb782e0, 0.34, 0.16)

  for (let n = -4; n <= 4; n += 1) {
    const cx = n * 0.68
    const cy = Math.sin(n * 0.9) * 0.5
    const cz = Math.cos(n * 0.72) * 0.3
    const histone = new THREE.Group()
    histone.position.set(cx, cy, cz)
    histone.userData.label = 'Histone octamer (H2A/H2B/H3/H4)'
    for (let i = 0; i < 8; i += 1) {
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.19, 28, 20), histoneMaterial)
      const angle = i / 8 * Math.PI * 2
      bead.position.set(Math.cos(angle) * 0.2, (i % 2 ? 1 : -1) * 0.12, Math.sin(angle) * 0.2)
      histone.add(bead)
    }
    root.add(histone)

    const pointsA: THREE.Vector3[] = []
    const pointsB: THREE.Vector3[] = []
    for (let i = 0; i <= 64; i += 1) {
      const t = i / 64
      const angle = t * Math.PI * 3.4
      const r = 0.36
      pointsA.push(new THREE.Vector3(cx + Math.cos(angle) * r, cy + (t - 0.5) * 0.55, cz + Math.sin(angle) * r))
      pointsB.push(new THREE.Vector3(cx + Math.cos(angle + Math.PI) * r, cy + (t - 0.5) * 0.55, cz + Math.sin(angle + Math.PI) * r))
    }
    const strandA = tube(new THREE.CatmullRomCurve3(pointsA), 0.022, dnaMaterialA, 72)
    const strandB = tube(new THREE.CatmullRomCurve3(pointsB), 0.022, dnaMaterialB, 72)
    strandA.userData.label = 'DNA wrapped around histone core'
    strandB.userData.label = 'DNA wrapped around histone core'
    root.add(strandA, strandB)
  }

  const linkerMaterial = mat(0x8ad6dc, 0.4, 0.07)
  const linkerPoints: THREE.Vector3[] = []
  for (let i = -4; i <= 4; i += 1) linkerPoints.push(new THREE.Vector3(i * 0.68, Math.sin(i * 0.9) * 0.5, Math.cos(i * 0.72) * 0.3))
  const linker = tube(new THREE.CatmullRomCurve3(linkerPoints), 0.035, linkerMaterial, 120)
  linker.userData.label = 'Linker DNA / chromatin fiber'
  root.add(linker)

  root.rotation.set(-0.25, -0.15, 0.16)
  return { target: new THREE.Vector3(0, 0, 0), distance: 7.4 }
}

function buildDNA(root: THREE.Group, sequencing = false) {
  const strandAColor = sequencing ? 0x72d7e0 : 0x8498ff
  const strandBColor = sequencing ? 0xd29aff : 0xb886ef
  const strandA = mat(strandAColor, 0.3, 0.2)
  const strandB = mat(strandBColor, 0.3, 0.2)
  const pointsA: THREE.Vector3[] = []
  const pointsB: THREE.Vector3[] = []
  const pairs = 28
  for (let i = 0; i <= 180; i += 1) {
    const t = i / 180
    pointsA.push(helixPoint(t, 0.72, 5.8, 0))
    pointsB.push(helixPoint(t, 0.72, 5.8, Math.PI))
  }
  const a = tube(new THREE.CatmullRomCurve3(pointsA), 0.075, strandA, 180)
  const b = tube(new THREE.CatmullRomCurve3(pointsB), 0.075, strandB, 180)
  a.userData.label = 'DNA sugar-phosphate backbone · strand 1'
  b.userData.label = 'DNA sugar-phosphate backbone · strand 2'
  root.add(a, b)

  for (let i = 0; i < pairs; i += 1) {
    const t = (i + 0.5) / pairs
    const p1 = helixPoint(t, 0.68, 5.8, 0)
    const p2 = helixPoint(t, 0.68, 5.8, Math.PI)
    const base1 = BASES[(i * 3 + 2) % 4]
    const base2 = base1 === 'A' ? 'T' : base1 === 'T' ? 'A' : base1 === 'G' ? 'C' : 'G'
    const midpoint = p1.clone().lerp(p2, 0.5)
    const direction = p2.clone().sub(p1)
    const length = direction.length()
    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, length, 14), mat(BASE_COLOR[base1], 0.36, 0.08))
    cylinder.position.copy(midpoint)
    cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize())
    cylinder.userData.label = `${base1}–${base2} nucleotide base pair`
    root.add(cylinder)

    const half = new THREE.Mesh(new THREE.SphereGeometry(0.09, 18, 12), mat(BASE_COLOR[base2], 0.34, 0.09))
    half.position.copy(p2.clone().lerp(p1, 0.34))
    half.userData.label = `${base2} nucleobase`
    root.add(half)
  }

  root.rotation.set(0.18, 0.2, sequencing ? 0 : 0.55)
  return { target: new THREE.Vector3(0, 0, 0), distance: sequencing ? 8 : 7.8 }
}

function buildSequencingScene(root: THREE.Group) {
  const dna = new THREE.Group()
  dna.scale.setScalar(0.62)
  dna.position.y = 0.1
  root.add(dna)
  buildDNA(dna, true)

  const poreMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x4f7d9a,
    roughness: 0.5,
    clearcoat: 0.06,
    transmission: 0.1,
    thickness: 0.4,
    transparent: true,
    opacity: 0.86,
  })
  const pore = new THREE.Group()
  pore.userData.label = 'Nanopore protein complex · conceptual structure'
  for (let i = 0; i < 12; i += 1) {
    const angle = i / 12 * Math.PI * 2
    const lobe = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.75, 8, 18), poreMaterial)
    lobe.position.set(Math.cos(angle) * 1.08, 0, Math.sin(angle) * 1.08)
    lobe.rotation.z = Math.PI / 2
    lobe.rotation.y = -angle
    pore.add(lobe)
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.04, 0.18, 16, 64), poreMaterial)
  ring.rotation.x = Math.PI / 2
  pore.add(ring)
  root.add(pore)

  const membrane = new THREE.Mesh(
    new THREE.CylinderGeometry(2.25, 2.25, 0.16, 96),
    new THREE.MeshPhysicalMaterial({ color: 0x6a7b82, roughness: 0.55, transmission: 0.26, thickness: 0.3, transparent: true, opacity: 0.32, side: THREE.DoubleSide }),
  )
  membrane.userData.label = 'Sequencing membrane · conceptual'
  root.add(membrane)

  return { target: new THREE.Vector3(0, 0, 0), distance: 8.6 }
}

function CurrentTrace() {
  const path = useMemo(() => {
    const points: string[] = []
    for (let i = 0; i < 120; i += 1) {
      const x = i / 119 * 100
      const signal = 50 + Math.sin(i * 0.31) * 13 + Math.sin(i * 0.83) * 8 + ((i * 17) % 11) * 0.8
      points.push(`${x.toFixed(2)},${(100 - signal).toFixed(2)}`)
    }
    return points.join(' ')
  }, [])
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-24 w-full" aria-label="Synthetic nanopore ionic current trace">
      <defs><linearGradient id="traceFade" x1="0" x2="1"><stop stopColor="#77d9ff"/><stop offset="1" stopColor="#b28cff"/></linearGradient></defs>
      {[20, 40, 60, 80].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="rgba(255,255,255,.08)" strokeWidth=".35" />)}
      <polyline points={path} fill="none" stroke="url(#traceFade)" strokeWidth="1.3" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function CinematicCellGenomeExplorer({ initialStage = 'cell', compact = false }: { initialStage?: MicroStage; compact?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState<MicroStage>(initialStage)
  const [selected, setSelected] = useState('')
  const [ready, setReady] = useState(false)
  const stageRef = useRef(stage)
  const rootRef = useRef<THREE.Group | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)

  stageRef.current = stage
  const meta = STAGES.find((item) => item.key === stage) ?? STAGES[0]

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x02060b)

    const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 200)
    camera.position.set(0.3, 0.1, 8)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.18
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5))
    renderer.setSize(Math.max(container.clientWidth, 1), Math.max(container.clientHeight, 1), false)
    container.appendChild(renderer.domElement)

    const pmrem = new THREE.PMREMGenerator(renderer)
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = environment.texture
    scene.environmentIntensity = 1

    const hemi = new THREE.HemisphereLight(0xd6efff, 0x2b1711, 1.15)
    scene.add(hemi)
    const key = new THREE.DirectionalLight(0xffffff, 2.8)
    key.position.set(4, 5, 5)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0x8ccfff, 1.15)
    fill.position.set(-5, 1, 3)
    scene.add(fill)
    const rim = new THREE.DirectionalLight(0xb793ff, 1.3)
    rim.position.set(2, 1, -5)
    scene.add(rim)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.07
    controls.rotateSpeed = 0.58
    controls.zoomSpeed = 0.72
    controls.panSpeed = 0.5
    controls.minDistance = 2
    controls.maxDistance = 16
    controlsRef.current = controls

    const root = new THREE.Group()
    rootRef.current = root
    scene.add(root)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const pick = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObject(root, true).find((item) => item.object.visible)
      if (!hit) return
      let object: THREE.Object3D | null = hit.object
      while (object && !object.userData.label) object = object.parent
      if (object?.userData.label) setSelected(String(object.userData.label))
    }
    renderer.domElement.addEventListener('pointerup', pick)

    const resize = () => {
      const width = Math.max(container.clientWidth, 1)
      const height = Math.max(container.clientHeight, 1)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5))
      renderer.setSize(width, height, false)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()

    let animation = 0
    const clock = new THREE.Clock()
    const renderLoop = () => {
      animation = requestAnimationFrame(renderLoop)
      const elapsed = clock.getElapsedTime()
      if (rootRef.current && stageRef.current !== 'sequencing') rootRef.current.rotation.y += 0.00045
      if (stageRef.current === 'sequencing' && rootRef.current) rootRef.current.position.y = Math.sin(elapsed * 0.45) * 0.015
      controls.update()
      renderer.render(scene, camera)
    }
    renderLoop()
    setReady(true)

    return () => {
      cancelAnimationFrame(animation)
      observer.disconnect()
      renderer.domElement.removeEventListener('pointerup', pick)
      controls.dispose()
      environment.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.domElement.remove()
      scene.clear()
      rootRef.current = null
      cameraRef.current = null
      controlsRef.current = null
    }
  }, [])

  useEffect(() => {
    const root = rootRef.current
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!root || !camera || !controls) return
    while (root.children.length) root.remove(root.children[0])
    root.position.set(0, 0, 0)
    root.rotation.set(0, 0, 0)
    setSelected('')

    const framing = stage === 'cell'
      ? buildCellScene(root)
      : stage === 'nucleus'
        ? buildNucleusScene(root)
        : stage === 'chromatin'
          ? buildChromatinScene(root)
          : stage === 'dna'
            ? buildDNA(root)
            : buildSequencingScene(root)

    camera.position.set(0.25, 0.12, framing.distance)
    controls.target.copy(framing.target)
    controls.update()
  }, [stage, ready])

  return (
    <section className={`overflow-hidden border border-cyan-300/15 bg-[#02060b] text-white shadow-[0_32px_110px_rgba(0,0,0,.38)] ${compact ? 'rounded-2xl' : 'rounded-[32px]'}`}>
      <header className="border-b border-white/8 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <div className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-300">PanaceaMed · high-fidelity cellular atlas</div>
            <h2 className={`${compact ? 'text-xl' : 'text-2xl sm:text-4xl'} mt-2 font-black tracking-[-.045em]`}>Cell → nucleus → chromatin → DNA → sequencing</h2>
            <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-white/50 sm:text-xs">Interactive structural model rendered in Three.js. It is an educational reference scene, not patient microscopy. Sequencing evidence remains empty until a real POD5/FASTQ/BAM/CRAM/VCF source is connected.</p>
          </div>
          <div className="rounded-2xl border border-emerald-300/18 bg-emerald-300/[.06] px-3 py-2 text-right">
            <div className="text-[8px] font-black uppercase tracking-wide text-emerald-300">Render</div>
            <div className="mt-1 text-[10px] font-black">Three.js · PBR · orbit/pick</div>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {STAGES.map((item, index) => (
            <button key={item.key} onClick={() => setStage(item.key)} className={`shrink-0 rounded-full border px-3 py-2 text-[9px] font-black transition ${stage === item.key ? 'border-cyan-300 bg-cyan-300 text-[#041016]' : 'border-white/10 bg-white/[.035] text-white/52 hover:border-white/20'}`}>
              <span className="mr-1 opacity-55">{index + 1}</span>{item.label}
            </button>
          ))}
        </div>
      </header>

      <div className={`grid ${stage === 'sequencing' ? 'xl:grid-cols-[1.3fr_.7fr]' : 'xl:grid-cols-[1fr_320px]'}`}>
        <div className={`relative ${compact ? 'h-[500px]' : 'h-[590px]'} min-w-0 border-b border-white/8 xl:border-b-0 xl:border-r`}>
          <div ref={containerRef} className="absolute inset-0" />
          <div className="pointer-events-none absolute left-3 top-3 rounded-xl border border-white/10 bg-black/42 px-3 py-2 backdrop-blur-xl">
            <div className="text-[8px] font-black uppercase tracking-[.16em] text-violet-200">{meta.label} · {meta.scale}</div>
            <div className="mt-1 max-w-xs text-[9px] leading-relaxed text-white/42">Drag to orbit · pinch/scroll to zoom · tap a structure</div>
          </div>
          {selected && <div className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-xl border border-cyan-300/16 bg-black/55 px-3 py-2 text-[10px] font-black text-cyan-100 backdrop-blur-xl">{selected}</div>}
        </div>

        <aside className="p-4 sm:p-5">
          <div className="text-[9px] font-black uppercase tracking-[.18em] text-white/30">Current scale</div>
          <div className="mt-1 text-xl font-black">{meta.label}</div>
          <div className="mt-1 text-xs font-black text-cyan-300">{meta.scale}</div>
          <p className="mt-3 text-[11px] leading-relaxed text-white/46">{meta.detail}</p>

          <div className="mt-5 space-y-2">
            {(stage === 'cell' ? [
              ['Plasma membrane', 'Semi-transparent irregular bilayer boundary'],
              ['Cytoskeleton', 'Microtubule and actin filament network'],
              ['Mitochondria', 'Outer membrane with internal cristae'],
              ['Rough ER', 'Tubular membrane network with ribosomes'],
              ['Golgi', 'Stacked cisternae and transport vesicles'],
              ['Nucleus', 'Envelope, pores, chromatin and nucleolus'],
            ] : stage === 'nucleus' ? [
              ['Nuclear envelope', 'Double-membrane structural shell'],
              ['Nuclear pores', 'Distributed pore complexes'],
              ['Chromatin', 'Multiple 3D fibers/territories'],
              ['Nucleolus', 'Dense ribosome-biogenesis compartment'],
            ] : stage === 'chromatin' ? [
              ['Histone octamer', 'H2A, H2B, H3 and H4 core representation'],
              ['Wrapped DNA', 'Approximate nucleosome path'],
              ['Linker DNA', 'Connects adjacent nucleosomes'],
            ] : stage === 'dna' ? [
              ['Backbones', 'Two antiparallel helical strands'],
              ['Base pairs', 'A–T and G–C pair representation'],
              ['Major/minor groove', 'Emerges from helical geometry'],
            ] : [
              ['Nanopore protein', 'Conceptual pore complex, not a literal ONT protein structure'],
              ['DNA translocation', 'Structural visualization only'],
              ['Ionic current', 'Synthetic signal shown below'],
              ['Basecalling', 'Requires real raw signal before patient-level interpretation'],
            ]).map(([title, detail]) => (
              <div key={title} className="rounded-xl border border-white/8 bg-white/[.025] p-3">
                <div className="text-[10px] font-black text-white/78">{title}</div>
                <div className="mt-1 text-[9px] leading-relaxed text-white/32">{detail}</div>
              </div>
            ))}
          </div>

          {stage === 'sequencing' && (
            <div className="mt-4 rounded-2xl border border-violet-300/15 bg-violet-300/[.045] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[8px] font-black uppercase tracking-[.16em] text-violet-200">Synthetic raw current</span>
                <span className="rounded-full border border-amber-200/15 bg-amber-200/[.06] px-2 py-1 text-[8px] font-black text-amber-100">NO REAL RUN LOADED</span>
              </div>
              <div className="mt-2"><CurrentTrace /></div>
              <div className="mt-2 font-mono text-[10px] tracking-[.2em] text-white/68">A T G C C A T G A A C T G</div>
              <p className="mt-2 text-[9px] leading-relaxed text-white/30">Connect/upload POD5, FASTQ, BAM/CRAM or VCF before displaying patient-derived read depth, variants, methylation or basecalling metrics.</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}

export default CinematicCellGenomeExplorer
