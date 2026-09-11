import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

type MicroTopicKey =
  | 'retina'
  | 'cochlea'
  | 'synapse'
  | 'nephron'
  | 'alveolus'
  | 'beta-cell'
  | 'hepatocyte'
  | 'coagulation'
  | 'immune-synapse'
  | 'microcirculation'

type ShockMode = 'baseline' | 'hypovolemic' | 'cardiogenic' | 'distributive' | 'obstructive'

type MicroTopic = {
  key: MicroTopicKey
  icon: string
  label: string
  scale: string
  subtitle: string
  summary: string
  structures: string[]
  steps: string[]
  equations?: string[]
  clinicalBridge: string
}

type Animator = (timeSeconds: number) => void

const TOPICS: MicroTopic[] = [
  {
    key: 'retina', icon: '👁️', label: 'Retina / vision', scale: '10–300 µm', subtitle: 'Photon → photoreceptor → retinal circuit',
    summary: 'Layered schematic of photoreceptors, bipolar/interneuron processing and ganglion-cell output. Moving photons represent incident light; they are not a ray-traced prediction of an individual eye.',
    structures: ['photoreceptor outer segments', 'outer nuclear layer', 'bipolar / horizontal / amacrine network', 'ganglion layer', 'optic output'],
    steps: ['Photons traverse transparent retinal layers.', 'Rods/cones transduce light through photopigment signaling.', 'Retinal interneurons reshape spatial and temporal information.', 'Ganglion cells encode output as action potentials toward the optic nerve.'],
    equations: ['Photon energy: E = hν', 'Optical power: P = 1/f'],
    clinicalBridge: 'Disease can affect different layers: photoreceptor degeneration, macular disease, retinal vascular injury, optic neuropathy and cortical visual disorders are not interchangeable mechanisms.',
  },
  {
    key: 'cochlea', icon: '🦻', label: 'Cochlea', scale: '10 µm–35 mm', subtitle: 'Traveling wave → hair-cell transduction',
    summary: 'A spiral cochlear scaffold with a moving basilar-membrane signal. The animation emphasizes tonotopic propagation rather than pretending to reproduce patient-specific audiometry.',
    structures: ['cochlear spiral', 'basilar membrane', 'inner/outer hair-cell zone', 'stereocilia interface', 'auditory-nerve output'],
    steps: ['Stapes motion launches a fluid-pressure wave.', 'Basilar-membrane mechanics create a place-dependent traveling-wave peak.', 'Hair-bundle deflection gates mechanoelectrical transduction channels.', 'Inner hair cells drive afferent auditory-nerve signaling.'],
    equations: ['Sound level: dB = 20 log₁₀(p/p₀)', 'Frequency: f = 1/T'],
    clinicalBridge: 'Conductive loss, cochlear hair-cell injury, auditory neuropathy and central processing disorders occur at different anatomical levels.',
  },
  {
    key: 'synapse', icon: '🧠', label: 'Synapse + BBB', scale: '20 nm–20 µm', subtitle: 'Release · receptor · neurovascular gate',
    summary: 'A synaptic cleft sits beside a simplified blood-brain-barrier microvessel. Vesicles and transmitter particles illustrate sequence and direction—not exact molecular counts or concentrations.',
    structures: ['presynaptic bouton', 'synaptic vesicles', 'synaptic cleft', 'postsynaptic membrane', 'endothelium / tight junction', 'pericyte / astrocyte endfoot'],
    steps: ['Action-potential arrival opens voltage-gated Ca²⁺ channels.', 'Ca²⁺-dependent vesicle fusion releases transmitter.', 'Receptor binding changes postsynaptic conductance.', 'BBB endothelial tight junctions and selective transport regulate exchange with CNS interstitium.'],
    equations: ['Nernst: Eion = (RT/zF) ln([ion]out/[ion]in)', 'Current: I = g(V − Erev)'],
    clinicalBridge: 'Synaptic dysfunction and BBB dysfunction are related but distinct. A permeable BBB does not mean unrestricted molecular passage.',
  },
  {
    key: 'nephron', icon: '🫘', label: 'Nephron', scale: '20 µm–5 cm', subtitle: 'Filter · reabsorb · concentrate',
    summary: 'A procedural glomerulus and nephron path show filtrate flow, segmental handling and collecting-duct water control. The geometry is mechanistic and not a histology reconstruction.',
    structures: ['glomerular tuft', 'Bowman space', 'proximal tubule', 'loop of Henle', 'distal tubule', 'collecting duct'],
    steps: ['Glomerular pressure drives ultrafiltration across the filtration barrier.', 'Proximal tubule performs bulk solute and water reabsorption.', 'Loop architecture supports the medullary osmotic gradient.', 'Distal nephron and collecting duct fine-tune electrolytes, acid-base and water under hormonal control.'],
    equations: ['Clearance: Cx = Ux × V / Px', 'Filtration fraction: FF = GFR / RPF'],
    clinicalBridge: 'A single eGFR, FeNa or urine osmolality does not reveal every nephron mechanism; interpretation depends on measurements and clinical context.',
  },
  {
    key: 'alveolus', icon: '🫁', label: 'Alveolus', scale: '0.1–0.4 mm', subtitle: 'Ventilation · diffusion · capillary exchange',
    summary: 'Translucent alveolar sacs and a capillary loop visualize O₂ moving toward blood and CO₂ moving toward alveolar gas across a thin exchange interface.',
    structures: ['alveolar airspace', 'type I epithelial surface', 'capillary loop', 'erythrocytes', 'air-blood interface'],
    steps: ['Ventilation renews alveolar gas.', 'O₂ follows a partial-pressure gradient across the air-blood barrier.', 'Hemoglobin binding supports blood O₂ carriage.', 'CO₂ diffuses in the opposite direction and is removed by ventilation.'],
    equations: ['Fick diffusion: V̇gas ∝ A × D × ΔP / T', 'Alveolar ventilation: V̇A = (VT − VD) × RR'],
    clinicalBridge: 'Hypoxemia can result from V/Q mismatch, shunt, hypoventilation, diffusion limitation or low inspired oxygen; low SpO₂ alone does not identify the mechanism.',
  },
  {
    key: 'beta-cell', icon: '🔵', label: 'β-cell / insulin', scale: '5–15 µm', subtitle: 'Glucose sensing → granule exocytosis → GLUT4',
    summary: 'A β-cell and neighboring insulin-responsive target cell illustrate glucose sensing, insulin-granule release and downstream GLUT4 recruitment as linked but separate events.',
    structures: ['β-cell membrane', 'mitochondrial/nutrient-sensing context', 'insulin granules', 'insulin receptor', 'GLUT4 vesicles', 'target-cell membrane'],
    steps: ['Glucose metabolism raises the β-cell ATP/ADP signal.', 'KATP-channel closure and depolarization promote Ca²⁺ entry.', 'Ca²⁺ triggers insulin-granule exocytosis.', 'Insulin-receptor signaling promotes GLUT4 translocation in muscle/adipose; muscle contraction can also stimulate uptake.'],
    equations: ['HOMA-IR surrogate = fasting insulin × fasting glucose / 405'],
    clinicalBridge: 'Type 1 diabetes centers on loss of insulin-producing β cells; type 2 diabetes combines insulin resistance with progressive β-cell dysfunction. HOMA-IR is not a standalone diagnosis.',
  },
  {
    key: 'hepatocyte', icon: '🧬', label: 'Hepatocyte metabolism', scale: '20–30 µm', subtitle: 'Store · oxidize · synthesize · detoxify',
    summary: 'A hepatocyte-centered network turns carbohydrate, lipid and nitrogen metabolism into a navigable spatial map. Animated substrate streams represent pathway direction rather than measured flux.',
    structures: ['hepatocyte', 'glycogen pool', 'mitochondrial context', 'glycolysis node', 'gluconeogenesis node', 'urea-cycle node'],
    steps: ['Fed-state signaling favors glucose uptake/storage and lipogenesis.', 'Fasting shifts toward glycogenolysis and gluconeogenesis.', 'Amino-acid nitrogen is transferred and ultimately routed toward urea formation.', 'Mitochondrial oxidation and cytosolic pathways exchange substrates according to metabolic state.'],
    equations: ['Mass balance: accumulation = input − output + production − consumption'],
    clinicalBridge: 'Serum glucose, AST/ALT, lactate or ammonia each sample only part of liver physiology; they should not be interpreted as a single “liver metabolism score”.',
  },
  {
    key: 'coagulation', icon: '🩸', label: 'Coagulation', scale: '2 µm–2 mm', subtitle: 'Platelet plug → thrombin → fibrin',
    summary: 'A vessel-wall injury attracts platelets and overlays a fibrin mesh. The sequence separates primary hemostasis, secondary coagulation and later fibrinolysis.',
    structures: ['endothelium', 'subendothelial injury', 'platelets', 'vWF/GPIb context', 'thrombin/fibrin context', 'fibrin mesh'],
    steps: ['Vessel injury exposes adhesive subendothelial structures.', 'Platelets adhere, activate and aggregate to form a primary plug.', 'Coagulation reactions generate thrombin and cross-linked fibrin support.', 'Fibrinolysis later remodels the stabilized clot as repair proceeds.'],
    equations: ['Hemostasis is a reaction network; PT/INR and aPTT sample different laboratory pathways rather than measuring “all clotting”.'],
    clinicalBridge: 'Platelet disorders, coagulation-factor deficiencies, anticoagulant effects and pathologic thrombosis require different mechanistic interpretations.',
  },
  {
    key: 'immune-synapse', icon: '🛡️', label: 'Immune synapse', scale: '5–20 µm', subtitle: 'Antigen recognition · co-stimulation · response',
    summary: 'An antigen-presenting cell and T cell meet at a contact interface with simplified receptor bridges and cytokine particles. It is a topology lesson, not a molecular-dynamics simulation.',
    structures: ['antigen-presenting cell', 'MHC-peptide', 'T-cell receptor', 'co-stimulatory interface', 'T cell', 'cytokine field'],
    steps: ['APC presents processed peptide in MHC.', 'TCR recognition provides antigen-specific signal.', 'Co-stimulatory and inhibitory signals tune activation.', 'Activated lymphocytes alter transcription, proliferation and effector programs.'],
    equations: ['Response is context- and receptor-dependent; no universal numeric “immune strength” is generated.'],
    clinicalBridge: 'Autoimmunity, immunodeficiency, allergy and cancer immune escape alter different parts of recognition, tolerance or effector function.',
  },
  {
    key: 'microcirculation', icon: '⚡', label: 'Microcirculation / shock', scale: '5–100 µm', subtitle: 'Tone · flow · exchange · oxygen delivery',
    summary: 'A branching arteriole-capillary-venule network visualizes red-cell transit and teaching patterns of vascular tone/flow across major shock categories. It is intentionally qualitative.',
    structures: ['arteriole', 'capillary network', 'venule', 'erythrocyte stream', 'interstitial exchange field'],
    steps: ['Arteriolar tone controls resistance and regional distribution.', 'Capillary flow brings erythrocytes close to tissue exchange surfaces.', 'Venous capacitance and return influence preload.', 'Shock can impair oxygen delivery through different combinations of volume, pump function, vascular tone and obstruction.'],
    equations: ['DO₂ = CO × CaO₂', 'Poiseuille teaching relation: Q ∝ ΔP × r⁴ / (ηL)', 'Shock index = HR / SBP (context only)'],
    clinicalBridge: 'Macro-hemodynamic pressure can improve while microcirculatory dysfunction persists. The presets here are teaching archetypes, not bedside treatment targets.',
  },
]

const SHOCK_LABELS: Record<ShockMode, string> = {
  baseline: 'Baseline',
  hypovolemic: 'Hypovolemic',
  cardiogenic: 'Cardiogenic',
  distributive: 'Distributive',
  obstructive: 'Obstructive',
}

function physical(color: THREE.ColorRepresentation, opacity = 1, emissive?: THREE.ColorRepresentation) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.32,
    metalness: 0.02,
    transparent: opacity < 1,
    opacity,
    transmission: opacity < 0.45 ? 0.12 : 0,
    emissive: emissive ?? 0x000000,
    emissiveIntensity: emissive ? 0.3 : 0,
    side: THREE.DoubleSide,
  })
}

function sphere(radius: number, color: THREE.ColorRepresentation, opacity = 1) {
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 28, 20), physical(color, opacity, color))
}

function cylinder(a: THREE.Vector3, b: THREE.Vector3, radius: number, color: THREE.ColorRepresentation, opacity = 1) {
  const delta = new THREE.Vector3().subVectors(b, a)
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, delta.length(), 18), physical(color, opacity, color))
  mesh.position.copy(a).add(b).multiplyScalar(0.5)
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.clone().normalize())
  return mesh
}

function tube(points: THREE.Vector3[], radius: number, color: THREE.ColorRepresentation, opacity = 1, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal')
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, radius, 14, closed), physical(color, opacity, color))
  return { mesh, curve }
}

function particleStream(
  parent: THREE.Object3D,
  points: THREE.Vector3[],
  color: THREE.ColorRepresentation,
  count: number,
  speed: number,
  radius: number,
  animators: Animator[],
  closed = false,
) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal')
  const particles = Array.from({ length: count }, (_, index) => {
    const p = sphere(radius, color, 0.95)
    parent.add(p)
    return { mesh: p, offset: index / count }
  })
  animators.push((t) => {
    particles.forEach(({ mesh, offset }) => mesh.position.copy(curve.getPointAt((offset + t * speed) % 1)))
  })
}

function ring(parent: THREE.Object3D, radius: number, tubeRadius: number, color: THREE.ColorRepresentation, rotation: THREE.Euler, opacity = 1) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tubeRadius, 12, 64), physical(color, opacity, color))
  mesh.rotation.copy(rotation)
  parent.add(mesh)
  return mesh
}

function addRetina(world: THREE.Group, animators: Animator[]) {
  const layerColors = [0x7dd3fc, 0xa78bfa, 0xf0abfc, 0x34d399]
  for (let i = 0; i < 4; i += 1) {
    const layer = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.7, 0.12), physical(layerColors[i], 0.14))
    layer.position.z = -0.55 + i * 0.42
    world.add(layer)
  }
  for (let x = -1.8; x <= 1.8; x += 0.38) {
    const isCone = Math.abs(x) < 0.75
    const receptor = new THREE.Mesh(new THREE.CylinderGeometry(isCone ? 0.1 : 0.065, isCone ? 0.045 : 0.065, 0.7, 12), physical(isCone ? 0xfbbf24 : 0x60a5fa, 0.88, isCone ? 0xf59e0b : 0x2563eb))
    receptor.rotation.x = Math.PI / 2
    receptor.position.set(x, 0.6 * Math.sin(x * 2), -0.85)
    world.add(receptor)
  }
  const photons = Array.from({ length: 18 }, (_, i) => {
    const p = sphere(0.055, i % 3 === 0 ? 0xfef08a : 0x93c5fd, 0.95)
    p.position.set(-2 + (i % 6) * 0.8, -1 + Math.floor(i / 6) * 0.8, 2.2)
    world.add(p)
    return p
  })
  animators.push((t) => photons.forEach((p, i) => { p.position.z = 2.2 - ((t * 1.25 + i * 0.16) % 3.4) }))
  const axon = tube([new THREE.Vector3(-1.8, -1, 0.95), new THREE.Vector3(0, -1.15, 1.1), new THREE.Vector3(2.5, -0.7, 1.3)], 0.06, 0x34d399, 0.8)
  world.add(axon.mesh)
  particleStream(world, [new THREE.Vector3(-1.8, -1, 0.95), new THREE.Vector3(0, -1.15, 1.1), new THREE.Vector3(2.5, -0.7, 1.3)], 0xa7f3d0, 6, 0.16, 0.06, animators)
}

function addCochlea(world: THREE.Group, animators: Animator[]) {
  const spiral: THREE.Vector3[] = []
  for (let i = 0; i < 90; i += 1) {
    const u = i / 89
    const theta = u * Math.PI * 5.5
    const r = 2.25 * (1 - u * 0.78)
    spiral.push(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, (u - 0.5) * 0.7))
  }
  const cochlea = tube(spiral, 0.18, 0xf59e0b, 0.55)
  world.add(cochlea.mesh)
  particleStream(world, spiral, 0xfef3c7, 12, 0.08, 0.07, animators)
  for (let i = 0; i < 24; i += 1) {
    const u = 0.08 + i / 28
    const p = cochlea.curve.getPointAt(Math.min(u, 0.96))
    const hair = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.26, 8), physical(i < 8 ? 0x60a5fa : i < 16 ? 0xa78bfa : 0xf472b6, 0.9))
    hair.position.copy(p)
    hair.position.z += 0.24
    world.add(hair)
  }
  const nerve = tube([spiral[spiral.length - 1], new THREE.Vector3(0.2, 0, 0.7), new THREE.Vector3(2.8, 0.5, 1.2)], 0.07, 0x22d3ee, 0.8)
  world.add(nerve.mesh)
}

function addSynapse(world: THREE.Group, animators: Animator[]) {
  const pre = sphere(1.15, 0x8b5cf6, 0.32)
  pre.position.set(-1.45, 0, 0)
  world.add(pre)
  const post = sphere(1.2, 0x06b6d4, 0.22)
  post.position.set(1.55, 0, 0)
  world.add(post)
  const vesicles: THREE.Mesh[] = []
  for (let i = 0; i < 14; i += 1) {
    const v = sphere(0.12, 0xf9a8d4, 0.85)
    v.position.set(-1.2 + (i % 4) * 0.22, -0.55 + Math.floor(i / 4) * 0.35, 0.25 * Math.sin(i))
    world.add(v)
    vesicles.push(v)
  }
  const transmitters: THREE.Mesh[] = []
  for (let i = 0; i < 10; i += 1) {
    const p = sphere(0.055, 0xfef08a, 0.95)
    world.add(p)
    transmitters.push(p)
  }
  animators.push((t) => transmitters.forEach((p, i) => {
    const u = (t * 0.35 + i / transmitters.length) % 1
    p.position.set(-0.24 + u * 0.52, -0.45 + (i % 5) * 0.23, 0.18 * Math.sin(u * Math.PI * 2 + i))
  }))
  animators.push((t) => vesicles.forEach((v, i) => { v.scale.setScalar(0.92 + 0.08 * Math.sin(t * 2 + i)) }))

  const vessel = cylinder(new THREE.Vector3(-2.7, -2.0, -0.8), new THREE.Vector3(2.7, -2.0, -0.8), 0.42, 0xef4444, 0.2)
  vessel.rotation.z = Math.PI / 2
  world.add(vessel)
  for (let x = -2.2; x <= 2.2; x += 0.42) {
    const tight = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.55), physical(0x38bdf8, 0.72))
    tight.position.set(x, -1.73, -0.8)
    world.add(tight)
  }
  ring(world, 0.6, 0.08, 0x34d399, new THREE.Euler(Math.PI / 2, 0, 0), 0.65).position.set(0.3, -2.25, -0.8)
  const astro = sphere(0.55, 0xa7f3d0, 0.18)
  astro.scale.set(2.2, 0.45, 1.3)
  astro.position.set(0.8, -1.35, -0.75)
  world.add(astro)
}

function addNephron(world: THREE.Group, animators: Animator[]) {
  const glomerulus: THREE.Vector3[] = []
  for (let i = 0; i < 70; i += 1) {
    const u = i / 69
    const theta = u * Math.PI * 10
    glomerulus.push(new THREE.Vector3(-1.75 + Math.cos(theta) * (0.55 + 0.08 * Math.sin(theta * 0.4)), 1.0 + Math.sin(theta) * 0.55, Math.sin(theta * 0.7) * 0.38))
  }
  world.add(tube(glomerulus, 0.07, 0xef4444, 0.75).mesh)
  const path = [
    new THREE.Vector3(-1.1, 1.0, 0), new THREE.Vector3(-0.2, 1.25, 0.2), new THREE.Vector3(0.5, 0.7, 0.1),
    new THREE.Vector3(0.65, -1.8, -0.2), new THREE.Vector3(1.25, -2.2, 0), new THREE.Vector3(1.5, 0.4, 0.2),
    new THREE.Vector3(2.1, 1.1, 0), new THREE.Vector3(2.35, -1.7, 0),
  ]
  world.add(tube(path, 0.14, 0xfbbf24, 0.55).mesh)
  particleStream(world, path, 0x67e8f9, 14, 0.07, 0.07, animators)
  const collecting = cylinder(new THREE.Vector3(2.35, 1.7, 0), new THREE.Vector3(2.35, -2.2, 0), 0.2, 0x22d3ee, 0.34)
  world.add(collecting)
  for (let i = 0; i < 9; i += 1) {
    const water = sphere(0.055, 0x93c5fd, 0.92)
    world.add(water)
    animators.push((t) => {
      water.position.set(2.35 + 0.65 * Math.sin(t * 0.6 + i), 1.5 - ((t * 0.45 + i * 0.4) % 3.4), 0.2 * Math.cos(t + i))
    })
  }
}

function addAlveolus(world: THREE.Group, animators: Animator[]) {
  const centers = [
    new THREE.Vector3(-0.9, 0.45, 0), new THREE.Vector3(0.1, 0.8, -0.2), new THREE.Vector3(1.0, 0.25, 0.15),
    new THREE.Vector3(-0.4, -0.55, 0.2), new THREE.Vector3(0.65, -0.7, -0.15),
  ]
  centers.forEach((c, i) => {
    const sac = sphere(0.82, i % 2 ? 0x60a5fa : 0x22d3ee, 0.13)
    sac.position.copy(c)
    world.add(sac)
  })
  const capillary = [
    new THREE.Vector3(-2.0, -1.1, 0.2), new THREE.Vector3(-1.2, -0.2, 0.7), new THREE.Vector3(-0.2, -1.35, 0.7),
    new THREE.Vector3(0.8, -0.2, 0.65), new THREE.Vector3(1.5, -1.0, 0.45), new THREE.Vector3(2.1, -0.2, 0.15),
  ]
  world.add(tube(capillary, 0.18, 0xef4444, 0.3).mesh)
  particleStream(world, capillary, 0xfb7185, 12, 0.08, 0.095, animators)
  for (let i = 0; i < 12; i += 1) {
    const oxygen = sphere(0.05, 0x38bdf8, 0.95)
    const carbon = sphere(0.045, 0xfbbf24, 0.9)
    world.add(oxygen, carbon)
    animators.push((t) => {
      const u = (t * 0.35 + i / 12) % 1
      oxygen.position.set(-1.1 + (i % 6) * 0.43, 0.6 - u * 1.6, 0.75 - u * 0.15)
      carbon.position.set(-1.0 + (i % 6) * 0.43, -0.95 + u * 1.55, 0.55 + u * 0.15)
    })
  }
}

function addBetaCell(world: THREE.Group, animators: Animator[]) {
  const beta = sphere(1.5, 0x2563eb, 0.2)
  beta.position.x = -1.15
  world.add(beta)
  const nucleus = sphere(0.55, 0x8b5cf6, 0.28)
  nucleus.position.set(-1.35, -0.15, -0.15)
  world.add(nucleus)
  const granules: THREE.Mesh[] = []
  for (let i = 0; i < 20; i += 1) {
    const g = sphere(0.09, 0xf472b6, 0.92)
    const angle = i * 2.399
    const r = 0.45 + (i % 4) * 0.18
    g.position.set(-1.15 + Math.cos(angle) * r, Math.sin(angle) * r, 0.45 * Math.sin(i * 0.8))
    world.add(g)
    granules.push(g)
  }
  animators.push((t) => granules.forEach((g, i) => {
    const release = Math.max(0, Math.sin(t * 0.65 + i * 0.7))
    if (i % 4 === 0) g.position.x = -0.1 + release * 0.65
  }))
  const target = sphere(1.2, 0x10b981, 0.16)
  target.position.x = 2.15
  world.add(target)
  for (let i = 0; i < 10; i += 1) {
    const transporter = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.32, 0.13), physical(0xfbbf24, 0.9, 0xf59e0b))
    const angle = (i / 10) * Math.PI * 2
    transporter.position.set(2.15 + Math.cos(angle) * 1.18, Math.sin(angle) * 1.18, 0)
    transporter.rotation.z = angle
    world.add(transporter)
  }
  for (let i = 0; i < 12; i += 1) {
    const glucose = sphere(0.065, 0xfef08a, 0.92)
    world.add(glucose)
    animators.push((t) => {
      const u = (t * 0.18 + i / 12) % 1
      glucose.position.set(0.45 + u * 1.55, -1.7 + (i % 4) * 0.22, 0.35 * Math.sin(i + t))
    })
  }
}

function addHepatocyte(world: THREE.Group, animators: Animator[]) {
  const cell = sphere(1.35, 0xf59e0b, 0.15)
  world.add(cell)
  const nucleus = sphere(0.5, 0xa78bfa, 0.28)
  world.add(nucleus)
  const nodes = [
    { p: new THREE.Vector3(-2.3, 1.3, 0), c: 0x60a5fa },
    { p: new THREE.Vector3(2.3, 1.25, 0), c: 0x34d399 },
    { p: new THREE.Vector3(-2.2, -1.35, 0), c: 0xf472b6 },
    { p: new THREE.Vector3(2.2, -1.4, 0), c: 0xfbbf24 },
  ]
  nodes.forEach(({ p, c }) => {
    const n = sphere(0.34, c, 0.75)
    n.position.copy(p)
    world.add(n)
    world.add(cylinder(p, new THREE.Vector3(0, 0, 0), 0.055, c, 0.5))
    particleStream(world, [p, new THREE.Vector3(p.x * 0.45, p.y * 0.4, 0.2), new THREE.Vector3(0, 0, 0)], c, 4, 0.09, 0.055, animators)
  })
  const mitochondrion = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.6, 8, 16), physical(0xef4444, 0.6, 0xef4444))
  mitochondrion.rotation.z = 0.8
  mitochondrion.position.set(0.5, -0.4, 0.45)
  world.add(mitochondrion)
}

function addCoagulation(world: THREE.Group, animators: Animator[]) {
  const vesselFloor = new THREE.Mesh(new THREE.BoxGeometry(5.5, 2.8, 0.15), physical(0x7f1d1d, 0.3))
  vesselFloor.position.z = -0.65
  world.add(vesselFloor)
  const injury = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.16), physical(0xf97316, 0.9, 0xf97316))
  injury.position.set(0.3, 0, -0.55)
  world.add(injury)
  const platelets: THREE.Mesh[] = []
  for (let i = 0; i < 22; i += 1) {
    const platelet = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.055, 16), physical(0xfbbf24, 0.9, 0xf59e0b))
    platelet.rotation.x = Math.PI / 2
    world.add(platelet)
    platelets.push(platelet)
  }
  animators.push((t) => platelets.forEach((p, i) => {
    const u = Math.min(1, ((t * 0.12 + i * 0.045) % 1.7))
    const startX = -2.5 + (i % 8) * 0.35
    p.position.set(startX + (0.2 - startX) * u, -1 + (i % 6) * 0.4 * (1 - u), -0.25 + (i % 3) * 0.12)
  }))
  for (let i = 0; i < 18; i += 1) {
    const angle = (i / 18) * Math.PI
    const a = new THREE.Vector3(-0.55 + Math.cos(angle) * 1.0, -0.95 + (i % 5) * 0.45, -0.15)
    const b = new THREE.Vector3(1.0 - Math.cos(angle) * 0.85, 0.95 - (i % 6) * 0.35, 0.15)
    world.add(cylinder(a, b, 0.018, 0xf8fafc, 0.7))
  }
}

function addImmuneSynapse(world: THREE.Group, animators: Animator[]) {
  const apc = sphere(1.45, 0x7c3aed, 0.22)
  apc.position.x = -1.2
  world.add(apc)
  const tcell = sphere(1.35, 0x06b6d4, 0.2)
  tcell.position.x = 1.35
  world.add(tcell)
  for (let i = 0; i < 9; i += 1) {
    const y = -0.75 + i * 0.19
    world.add(cylinder(new THREE.Vector3(-0.17, y, -0.15), new THREE.Vector3(0.22, y + 0.05 * Math.sin(i), 0.15), 0.035, i % 3 === 0 ? 0xfbbf24 : 0xf472b6, 0.9))
  }
  const cytokines: THREE.Mesh[] = []
  for (let i = 0; i < 18; i += 1) {
    const c = sphere(0.055, i % 2 ? 0x34d399 : 0xa7f3d0, 0.9)
    world.add(c)
    cytokines.push(c)
  }
  animators.push((t) => cytokines.forEach((c, i) => {
    const angle = i * 2.399
    const r = 1.45 + ((t * 0.22 + i * 0.08) % 1.6)
    c.position.set(1.35 + Math.cos(angle) * r, Math.sin(angle) * r, 0.35 * Math.sin(angle * 1.7))
  }))
}

function addMicrocirculation(world: THREE.Group, animators: Animator[], mode: ShockMode) {
  const modeConfig: Record<ShockMode, { radius: number; speed: number; tone: number; noteColor: number }> = {
    baseline: { radius: 0.16, speed: 0.095, tone: 1, noteColor: 0x22d3ee },
    hypovolemic: { radius: 0.12, speed: 0.055, tone: 0.85, noteColor: 0xfbbf24 },
    cardiogenic: { radius: 0.16, speed: 0.045, tone: 1.05, noteColor: 0xf97316 },
    distributive: { radius: 0.23, speed: 0.08, tone: 1.35, noteColor: 0xef4444 },
    obstructive: { radius: 0.14, speed: 0.035, tone: 1.0, noteColor: 0xa78bfa },
  }
  const config = modeConfig[mode]
  const trunks = [
    [new THREE.Vector3(-2.7, 0, 0), new THREE.Vector3(-1.2, 0, 0), new THREE.Vector3(0, 1.15, 0), new THREE.Vector3(1.35, 1.2, 0), new THREE.Vector3(2.7, 0.7, 0)],
    [new THREE.Vector3(-1.2, 0, 0), new THREE.Vector3(0, -1.15, 0), new THREE.Vector3(1.35, -1.2, 0), new THREE.Vector3(2.7, -0.7, 0)],
    [new THREE.Vector3(0, 1.15, 0), new THREE.Vector3(0.25, 0.25, 0.35), new THREE.Vector3(0, -1.15, 0)],
  ]
  trunks.forEach((points, index) => {
    world.add(tube(points, config.radius * (index === 2 ? 0.75 : 1), index === 0 ? 0xef4444 : index === 1 ? 0x3b82f6 : 0xf472b6, 0.3).mesh)
    particleStream(world, points, index === 1 ? 0x60a5fa : 0xfb7185, index === 2 ? 5 : 11, config.speed * (index === 2 ? 0.8 : 1), 0.075, animators)
  })
  const halo = ring(world, 1.75, 0.035, config.noteColor, new THREE.Euler(Math.PI / 2, 0, 0), 0.45)
  halo.scale.setScalar(config.tone)
  animators.push((t) => { halo.material instanceof THREE.MeshPhysicalMaterial && (halo.material.emissiveIntensity = 0.2 + 0.15 * (0.5 + 0.5 * Math.sin(t * 1.3))) })
}

function buildMicroModel(world: THREE.Group, topic: MicroTopicKey, animators: Animator[], shockMode: ShockMode) {
  if (topic === 'retina') addRetina(world, animators)
  if (topic === 'cochlea') addCochlea(world, animators)
  if (topic === 'synapse') addSynapse(world, animators)
  if (topic === 'nephron') addNephron(world, animators)
  if (topic === 'alveolus') addAlveolus(world, animators)
  if (topic === 'beta-cell') addBetaCell(world, animators)
  if (topic === 'hepatocyte') addHepatocyte(world, animators)
  if (topic === 'coagulation') addCoagulation(world, animators)
  if (topic === 'immune-synapse') addImmuneSynapse(world, animators)
  if (topic === 'microcirculation') addMicrocirculation(world, animators, shockMode)
}

function fitCamera(camera: THREE.PerspectiveCamera, controls: OrbitControls, object: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(object)
  const sphereBounds = box.getBoundingSphere(new THREE.Sphere())
  const radius = Math.max(sphereBounds.radius, 1)
  const distance = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov) / 2) * 1.08
  camera.position.set(sphereBounds.center.x + distance * 0.18, sphereBounds.center.y + distance * 0.06, sphereBounds.center.z + distance)
  camera.near = Math.max(0.01, radius / 120)
  camera.far = distance * 20
  camera.updateProjectionMatrix()
  controls.target.copy(sphereBounds.center)
  controls.minDistance = radius * 0.7
  controls.maxDistance = radius * 7
  controls.update()
}

export function MicroPhysiologyExplorer() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [topicKey, setTopicKey] = useState<MicroTopicKey>('retina')
  const [stepIndex, setStepIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [shockMode, setShockMode] = useState<ShockMode>('baseline')
  const topic = useMemo(() => TOPICS.find((item) => item.key === topicKey) ?? TOPICS[0], [topicKey])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let disposed = false
    mount.innerHTML = ''

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x05070b)
    scene.fog = new THREE.FogExp2(0x05070b, 0.035)
    const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.08
    mount.appendChild(renderer.domElement)

    const pmrem = new THREE.PMREMGenerator(renderer)
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = environment
    scene.add(new THREE.HemisphereLight(0xdbeafe, 0x020617, 1.7))
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6)
    keyLight.position.set(4, 5, 6)
    scene.add(keyLight)
    const cyan = new THREE.PointLight(0x22d3ee, 20, 9)
    cyan.position.set(-3, 1.5, 2.5)
    scene.add(cyan)
    const magenta = new THREE.PointLight(0xf472b6, 18, 9)
    magenta.position.set(3, -1.5, 2)
    scene.add(magenta)

    const starGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(240 * 3)
    for (let i = 0; i < 240; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 18
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12
      positions[i * 3 + 2] = -2 - Math.random() * 8
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const starMaterial = new THREE.PointsMaterial({ color: 0x94a3b8, size: 0.025, transparent: true, opacity: 0.65 })
    const stars = new THREE.Points(starGeometry, starMaterial)
    scene.add(stars)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.075
    controls.enablePan = true
    controls.autoRotate = false

    const world = new THREE.Group()
    scene.add(world)
    const animators: Animator[] = []
    buildMicroModel(world, topicKey, animators, shockMode)
    fitCamera(camera, controls, world)

    const resize = () => {
      const width = Math.max(1, mount.clientWidth)
      const height = Math.max(1, mount.clientHeight)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(mount)

    let frame = 0
    const start = performance.now()
    const animate = () => {
      if (disposed) return
      const time = (performance.now() - start) / 1000
      if (playing) animators.forEach((animator) => animator(time))
      controls.update()
      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      controls.dispose()
      world.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return
        object.geometry.dispose()
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        materials.forEach((material) => material.dispose())
      })
      starGeometry.dispose()
      starMaterial.dispose()
      environment.dispose()
      pmrem.dispose()
      renderer.dispose()
      mount.innerHTML = ''
    }
  }, [topicKey, shockMode, playing])

  function chooseTopic(next: MicroTopicKey) {
    setTopicKey(next)
    setStepIndex(0)
    if (next !== 'microcirculation') setShockMode('baseline')
  }

  return (
    <section className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#080b11]">
      <header className="border-b border-neutral-200 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,.10),transparent_35%),radial-gradient(circle_at_82%_18%,rgba(244,114,182,.10),transparent_34%)] p-4 dark:border-white/10 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="text-[9px] font-black uppercase tracking-[.2em] text-fuchsia-700 dark:text-fuchsia-300">Multi-scale micro-3D physiology</div>
            <h3 className="mt-1 text-xl font-black tracking-tight text-neutral-950 dark:text-white sm:text-2xl">From organ anatomy to cells, barriers and molecular events.</h3>
            <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">Procedural Three.js teaching models complement—not replace—the source HRA anatomy above. Rotate, zoom and inspect moving physiology without deforming the anatomical source model.</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-[8px] font-black uppercase tracking-wide text-cyan-800 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-200">Interactive WebGL</span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[8px] font-black uppercase tracking-wide text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200">Schematic · educational</span>
            <span className="rounded-full border border-neutral-200 px-3 py-1.5 text-[8px] font-black uppercase tracking-wide text-neutral-500 dark:border-white/10 dark:text-neutral-300">Not diagnostic</span>
          </div>
        </div>

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {TOPICS.map((item) => (
            <button key={item.key} onClick={() => chooseTopic(item.key)} className={`min-w-[154px] shrink-0 rounded-2xl border p-3 text-left transition ${item.key === topicKey ? 'border-fuchsia-300 bg-fuchsia-50 shadow-sm dark:border-fuchsia-300/30 dark:bg-fuchsia-300/10' : 'border-neutral-200 bg-white/70 hover:border-neutral-300 dark:border-white/10 dark:bg-white/[.025]'}`}>
              <div className="flex items-center gap-2"><span className="text-base">{item.icon}</span><span className="text-[10px] font-black text-neutral-950 dark:text-white">{item.label}</span></div>
              <div className="mt-1 text-[8px] font-bold uppercase tracking-wide text-neutral-400">{item.scale}</div>
              <div className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">{item.subtitle}</div>
            </button>
          ))}
        </div>
      </header>

      <div className="grid xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
        <div className="relative min-h-[520px] bg-[#05070b]">
          <div ref={mountRef} className="absolute inset-0" aria-label={`Interactive schematic 3D model: ${topic.label}`} />
          <div className="pointer-events-none absolute left-3 top-3 rounded-2xl border border-white/10 bg-black/35 px-3 py-2 backdrop-blur-xl">
            <div className="text-[8px] font-black uppercase tracking-[.16em] text-white/45">Now exploring</div>
            <div className="mt-0.5 text-sm font-black text-white">{topic.icon} {topic.label}</div>
            <div className="text-[9px] font-semibold text-cyan-200">Approx. scale {topic.scale}</div>
          </div>
          <button onClick={() => setPlaying((value) => !value)} className="absolute bottom-3 left-3 rounded-full border border-white/15 bg-black/45 px-3 py-2 text-[9px] font-black text-white backdrop-blur-xl">{playing ? 'Pause mechanism' : 'Play mechanism'}</button>
          <div className="pointer-events-none absolute bottom-3 right-3 rounded-full border border-white/10 bg-black/35 px-3 py-2 text-[8px] font-bold text-white/65 backdrop-blur-xl">Drag to orbit · pinch/scroll to zoom</div>
        </div>

        <aside className="border-t border-neutral-200 p-4 dark:border-white/10 xl:border-l xl:border-t-0 sm:p-5">
          <div className="text-[9px] font-black uppercase tracking-[.16em] text-fuchsia-700 dark:text-fuchsia-300">Mechanism map</div>
          <h4 className="mt-1 text-lg font-black text-neutral-950 dark:text-white">{topic.subtitle}</h4>
          <p className="mt-2 text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">{topic.summary}</p>

          {topic.key === 'microcirculation' && (
            <div className="mt-4">
              <div className="mb-2 text-[8px] font-black uppercase tracking-[.14em] text-neutral-400">Teaching hemodynamic archetype</div>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(SHOCK_LABELS) as ShockMode[]).map((mode) => (
                  <button key={mode} onClick={() => setShockMode(mode)} className={`rounded-full border px-2.5 py-1.5 text-[8px] font-black ${shockMode === mode ? 'border-rose-400 bg-rose-500 text-white' : 'border-neutral-200 text-neutral-500 dark:border-white/10 dark:text-neutral-300'}`}>{SHOCK_LABELS[mode]}</button>
                ))}
              </div>
              <p className="mt-2 text-[8px] leading-relaxed text-neutral-400">Preset changes are qualitative visualization cues only; they do not calculate a patient’s vascular resistance, cardiac output or treatment target.</p>
            </div>
          )}

          <div className="mt-4">
            <div className="text-[8px] font-black uppercase tracking-[.14em] text-neutral-400">Visible structures</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {topic.structures.map((structure) => <span key={structure} className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-1 text-[8px] font-bold text-neutral-600 dark:border-white/10 dark:bg-white/[.035] dark:text-neutral-300">{structure}</span>)}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="text-[8px] font-black uppercase tracking-[.14em] text-neutral-400">Sequence</div>
            {topic.steps.map((step, index) => (
              <button key={step} onClick={() => setStepIndex(index)} className={`w-full rounded-2xl border p-3 text-left transition ${stepIndex === index ? 'border-cyan-300 bg-cyan-50 dark:border-cyan-300/25 dark:bg-cyan-300/10' : 'border-neutral-200 dark:border-white/10'}`}>
                <div className="flex gap-2"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-neutral-950 text-[8px] font-black text-white dark:bg-white dark:text-neutral-950">{index + 1}</span><p className="text-[9px] leading-relaxed text-neutral-600 dark:text-neutral-300">{step}</p></div>
              </button>
            ))}
          </div>

          {topic.equations && (
            <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]">
              <div className="text-[8px] font-black uppercase tracking-[.14em] text-neutral-400">Equation bridge</div>
              <div className="mt-2 space-y-1.5">{topic.equations.map((equation) => <div key={equation} className="font-mono text-[9px] font-bold text-neutral-700 dark:text-neutral-200">{equation}</div>)}</div>
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-300/20 dark:bg-emerald-300/[.07]">
            <div className="text-[8px] font-black uppercase tracking-[.14em] text-emerald-800 dark:text-emerald-300">Clinical bridge</div>
            <p className="mt-1 text-[9px] leading-relaxed text-emerald-950/75 dark:text-emerald-100/70">{topic.clinicalBridge}</p>
          </div>
        </aside>
      </div>
    </section>
  )
}
