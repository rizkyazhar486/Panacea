import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

type PathologyKey =
  | 'diabetic-retinopathy'
  | 'noise-induced-hearing-loss'
  | 'bbb-disruption'
  | 'acute-tubular-injury'
  | 'ards'
  | 'type1-diabetes'
  | 'hepatic-steatosis'
  | 'thrombosis'
  | 'autoimmune-activation'
  | 'distributive-shock'

type PathologyProfile = {
  key: PathologyKey
  icon: string
  label: string
  system: string
  scale: string
  normal: string
  disease: string
  visualCue: string
  mechanisms: string[]
  observables: string[]
}

type Animator = (timeSeconds: number) => void

type Variant = 'normal' | 'disease'

const PROFILES: PathologyProfile[] = [
  {
    key: 'diabetic-retinopathy', icon: '👁️', label: 'Diabetic retinopathy', system: 'Retinal microvasculature', scale: '10–300 µm',
    normal: 'Perfused retinal capillaries maintain a selective blood-retina barrier beside organized neural layers.',
    disease: 'Chronic metabolic and vascular stress can produce capillary injury, permeability change, microaneurysms and hemorrhagic/exudative lesions; severity and stage vary.',
    visualCue: 'The disease side adds focal vascular swellings and leakage markers without pretending to reconstruct a fundus image.',
    mechanisms: ['Capillary endothelial/pericyte dysfunction', 'Barrier permeability and microvascular leakage', 'Capillary non-perfusion and retinal ischemic signaling', 'Advanced disease may recruit pathologic neovascular responses'],
    observables: ['Fundus photography / ophthalmoscopy', 'OCT / OCT-A where appropriate', 'Visual acuity and symptom context', 'Glycemic and vascular-risk context'],
  },
  {
    key: 'noise-induced-hearing-loss', icon: '🦻', label: 'Noise-induced hearing loss', system: 'Cochlear hair-cell system', scale: '10 µm–35 mm',
    normal: 'Basilar-membrane mechanics and viable inner/outer hair cells support frequency-specific mechanoelectrical transduction.',
    disease: 'Excess acoustic exposure can injure cochlear hair cells and synapses. Pattern depends on exposure level, duration, frequency content and susceptibility.',
    visualCue: 'The disease side dims and removes a subset of hair-cell markers while preserving the cochlear scaffold.',
    mechanisms: ['Mechanical/metabolic stress in sensory epithelium', 'Outer-hair-cell dysfunction', 'Possible cochlear synaptopathy', 'Permanent threshold shift when injury is irreversible'],
    observables: ['Pure-tone audiometry', 'Speech testing', 'Otoacoustic emissions in selected settings', 'Exposure history'],
  },
  {
    key: 'bbb-disruption', icon: '🧠', label: 'Blood-brain-barrier disruption', system: 'Neurovascular unit', scale: '20 nm–20 µm',
    normal: 'Endothelial tight-junction architecture and selective transport constrain exchange between blood and CNS interstitium.',
    disease: 'Inflammation, ischemia, trauma and other insults can alter endothelial barrier properties and neurovascular signaling; permeability is selective, not all-or-none.',
    visualCue: 'The disease side introduces gaps and controlled leakage particles rather than depicting an unrestricted open vessel.',
    mechanisms: ['Endothelial/tight-junction alteration', 'Basement-membrane and pericyte involvement', 'Astrocyte-endfoot and inflammatory signaling', 'Changed molecular permeability and edema risk'],
    observables: ['Clinical context and neurologic examination', 'MRI/CT depending indication', 'Contrast/perfusion techniques in selected research/clinical settings', 'CSF or biomarker data when clinically justified'],
  },
  {
    key: 'acute-tubular-injury', icon: '🫘', label: 'Acute tubular injury', system: 'Nephron', scale: '20 µm–5 cm',
    normal: 'Filtered fluid traverses intact tubular epithelium with segment-specific reabsorption, secretion and concentration processes.',
    disease: 'Ischemic or toxic injury can impair tubular epithelial function, alter flow and contribute to casts/backleak; actual AKI has multiple mechanisms and etiologies.',
    visualCue: 'The disease side narrows functional flow, adds intraluminal obstruction markers and reduces particle transit.',
    mechanisms: ['Tubular epithelial injury', 'Impaired reabsorptive function', 'Tubular obstruction / backleak context', 'Renal hemodynamic contribution can coexist'],
    observables: ['Serum creatinine trend', 'Urine output', 'Urinalysis / sediment', 'Hemodynamic, medication and exposure context'],
  },
  {
    key: 'ards', icon: '🫁', label: 'ARDS / permeability edema', system: 'Alveolar-capillary unit', scale: '0.1–0.4 mm',
    normal: 'Thin alveolar-capillary interfaces support gas diffusion while alveolar fluid is tightly regulated.',
    disease: 'Diffuse inflammatory injury increases permeability and alveolar edema, reducing aerated surface and worsening shunt/VQ physiology. This is not a CT reconstruction.',
    visualCue: 'The disease side adds translucent intra-alveolar fluid and thickens the exchange interface while slowing gas markers.',
    mechanisms: ['Diffuse alveolar-capillary injury', 'Protein-rich permeability edema', 'Reduced aerated lung / shunt physiology', 'Heterogeneous regional mechanics'],
    observables: ['Oxygenation and ventilatory data', 'Chest imaging', 'Clinical trigger and timing', 'Arterial blood gas when indicated'],
  },
  {
    key: 'type1-diabetes', icon: '🔵', label: 'Type 1 diabetes', system: 'Pancreatic β-cell', scale: '5–15 µm',
    normal: 'Glucose sensing couples β-cell metabolism to membrane depolarization, calcium entry and insulin-granule exocytosis.',
    disease: 'Autoimmune destruction of insulin-producing β cells leads to severe insulin deficiency. The comparator depicts mechanism, not a patient-specific islet count.',
    visualCue: 'The disease side reduces β-cell/granule representation and introduces immune-cell markers around the islet-like cell.',
    mechanisms: ['Loss of immune tolerance to β-cell antigens', 'Progressive β-cell destruction', 'Insulin deficiency', 'Hyperglycemia and ketogenesis risk when insulin is insufficient'],
    observables: ['Plasma glucose / HbA1c', 'Ketones when clinically indicated', 'C-peptide in selected contexts', 'Islet autoantibodies for classification where appropriate'],
  },
  {
    key: 'hepatic-steatosis', icon: '🧬', label: 'Hepatic steatosis', system: 'Hepatocyte metabolism', scale: '20–30 µm',
    normal: 'Hepatocytes dynamically balance substrate oxidation, glycogen storage, lipogenesis, export and nitrogen handling.',
    disease: 'Steatosis is excess intracellular triglyceride accumulation. It is not synonymous with steatohepatitis, fibrosis or liver failure.',
    visualCue: 'The disease side fills the hepatocyte with large lipid droplets and de-emphasizes normal substrate-routing streams.',
    mechanisms: ['Fatty-acid delivery and de-novo lipogenesis', 'Imbalance between oxidation, storage and export', 'Lipotoxic/inflammatory injury can occur in steatohepatitis', 'Fibrosis requires separate disease progression'],
    observables: ['Liver imaging', 'Metabolic-risk context', 'Liver enzymes as imperfect injury markers', 'Fibrosis assessment when clinically appropriate'],
  },
  {
    key: 'thrombosis', icon: '🩸', label: 'Pathologic thrombosis', system: 'Hemostasis', scale: '2 µm–2 mm',
    normal: 'Hemostatic activation remains localized to vascular injury and is counterbalanced by anticoagulant and fibrinolytic systems.',
    disease: 'Pathologic intravascular thrombus formation can obstruct blood flow. Composition and mechanism differ across arterial, venous and microvascular thrombosis.',
    visualCue: 'The disease side accumulates platelets and a dense fibrin-like mesh inside the vessel lumen.',
    mechanisms: ['Endothelial injury/dysfunction', 'Abnormal flow or stasis', 'Hypercoagulability', 'Platelet, thrombin and fibrin contributions vary by setting'],
    observables: ['Imaging chosen for suspected vascular bed', 'Platelet/coagulation studies when relevant', 'D-dimer only in validated diagnostic pathways', 'Clinical pretest probability'],
  },
  {
    key: 'autoimmune-activation', icon: '🛡️', label: 'Autoimmune activation', system: 'Adaptive immune synapse', scale: '5–20 µm',
    normal: 'Antigen recognition is constrained by tolerance, co-stimulatory balance and regulatory networks.',
    disease: 'Autoimmune disease reflects inappropriate immune recognition or effector activity against self structures; each disease has distinct antigens, tissues and pathways.',
    visualCue: 'The disease side increases receptor-bridge and cytokine markers to show dysregulated activation, not a universal “immune strength” score.',
    mechanisms: ['Breakdown of central/peripheral tolerance', 'Autoreactive lymphocyte activation', 'Autoantibody and/or T-cell effector mechanisms', 'Target-organ inflammation and damage'],
    observables: ['Disease-specific clinical phenotype', 'Targeted autoantibodies when validated', 'Inflammatory markers in context', 'Organ-specific testing'],
  },
  {
    key: 'distributive-shock', icon: '⚡', label: 'Distributive shock', system: 'Microcirculation', scale: '5–100 µm',
    normal: 'Arteriolar tone and capillary recruitment distribute flow according to tissue metabolic demand.',
    disease: 'Distributive shock features pathologic vasodilation and maldistributed flow, often with relative intravascular depletion and heterogeneous microcirculatory perfusion.',
    visualCue: 'The disease side dilates vascular branches and slows/heterogenizes red-cell marker transit.',
    mechanisms: ['Loss of vascular tone', 'Relative hypovolemia / altered venous capacitance', 'Maldistributed regional flow', 'Microcirculatory dysfunction may persist despite macro-hemodynamic improvement'],
    observables: ['Blood pressure and perfusion examination', 'Lactate trend in context', 'Cardiac output / echo when indicated', 'Etiology-specific infectious, allergic or neurogenic evaluation'],
  },
]

function material(color: THREE.ColorRepresentation, opacity = 1, emissive?: THREE.ColorRepresentation) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.34,
    metalness: 0.02,
    transparent: opacity < 1,
    opacity,
    transmission: opacity < 0.35 ? 0.1 : 0,
    emissive: emissive ?? 0x000000,
    emissiveIntensity: emissive ? 0.22 : 0,
    side: THREE.DoubleSide,
  })
}

function ball(radius: number, color: THREE.ColorRepresentation, opacity = 1) {
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 22, 16), material(color, opacity, color))
}

function tube(points: THREE.Vector3[], radius: number, color: THREE.ColorRepresentation, opacity = 1) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal')
  return {
    mesh: new THREE.Mesh(new THREE.TubeGeometry(curve, 72, radius, 12, false), material(color, opacity, color)),
    curve,
  }
}

function stream(parent: THREE.Object3D, points: THREE.Vector3[], color: THREE.ColorRepresentation, count: number, speed: number, animators: Animator[], radius = 0.055) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal')
  const particles = Array.from({ length: count }, (_, index) => {
    const particle = ball(radius, color, 0.9)
    parent.add(particle)
    return { particle, offset: index / Math.max(1, count) }
  })
  animators.push((time) => {
    particles.forEach(({ particle, offset }) => particle.position.copy(curve.getPointAt((offset + time * speed) % 1)))
  })
}

function addRetina(parent: THREE.Group, variant: Variant, animators: Animator[]) {
  for (let i = 0; i < 4; i += 1) {
    const layer = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.5, 0.1), material([0x38bdf8, 0xa78bfa, 0xf472b6, 0x34d399][i], 0.12))
    layer.position.z = -0.55 + i * 0.38
    parent.add(layer)
  }
  const vesselPath = [new THREE.Vector3(-1.8, -0.5, 0.8), new THREE.Vector3(-0.8, 0.3, 0.85), new THREE.Vector3(0.1, -0.25, 0.88), new THREE.Vector3(1.8, 0.55, 0.9)]
  parent.add(tube(vesselPath, variant === 'disease' ? 0.095 : 0.075, 0xef4444, 0.55).mesh)
  stream(parent, vesselPath, 0xfb7185, variant === 'disease' ? 6 : 9, variant === 'disease' ? 0.035 : 0.075, animators)
  if (variant === 'disease') {
    ;[-1.0, -0.2, 0.65, 1.15].forEach((x, i) => {
      const lesion = ball(i % 2 ? 0.13 : 0.18, i % 2 ? 0xf97316 : 0xdc2626, 0.7)
      lesion.position.set(x, -0.1 + i * 0.18, 0.92)
      parent.add(lesion)
      const leak = ball(0.08, 0xfbbf24, 0.55)
      leak.position.set(x + 0.15, 0.08 + i * 0.16, 0.98)
      parent.add(leak)
    })
  }
}

function addCochlea(parent: THREE.Group, variant: Variant, animators: Animator[]) {
  const points: THREE.Vector3[] = []
  for (let i = 0; i < 80; i += 1) {
    const u = i / 79
    const theta = u * Math.PI * 5.2
    const r = 1.9 * (1 - u * 0.78)
    points.push(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, (u - 0.5) * 0.6))
  }
  const spiral = tube(points, 0.15, 0xf59e0b, 0.48)
  parent.add(spiral.mesh)
  stream(parent, points, 0xfef3c7, variant === 'disease' ? 7 : 11, variant === 'disease' ? 0.035 : 0.07, animators)
  for (let i = 0; i < 20; i += 1) {
    const u = 0.05 + i / 24
    const p = spiral.curve.getPointAt(Math.min(0.96, u))
    const damaged = variant === 'disease' && i < 8
    const hair = new THREE.Mesh(new THREE.ConeGeometry(0.05, damaged ? 0.07 : 0.24, 8), material(damaged ? 0x64748b : 0x22d3ee, damaged ? 0.3 : 0.85))
    hair.position.copy(p)
    hair.position.z += 0.22
    parent.add(hair)
  }
}

function addBbb(parent: THREE.Group, variant: Variant, animators: Animator[]) {
  const vessel = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.0, 1.0), material(0xef4444, 0.12))
  parent.add(vessel)
  for (let i = 0; i < 10; i += 1) {
    if (variant === 'disease' && (i === 4 || i === 7)) continue
    const junction = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 1.05), material(0x38bdf8, 0.72))
    junction.position.x = -1.8 + i * 0.4
    parent.add(junction)
  }
  const path = [new THREE.Vector3(-1.8, 0, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(1.8, 0, 0)]
  stream(parent, path, 0xfb7185, 8, 0.07, animators, 0.07)
  if (variant === 'disease') {
    for (let i = 0; i < 10; i += 1) {
      const leak = ball(0.055, 0xfbbf24, 0.9)
      parent.add(leak)
      animators.push((time) => {
        const u = (time * 0.18 + i / 10) % 1
        leak.position.set(-0.5 + (i % 5) * 0.25, 0.25 + u * 1.2, 0.35 * Math.sin(i + time))
      })
    }
  }
}

function addNephron(parent: THREE.Group, variant: Variant, animators: Animator[]) {
  const glom = new THREE.Mesh(new THREE.TorusKnotGeometry(0.6, 0.07, 90, 10), material(0xef4444, 0.65))
  glom.position.set(-1.45, 0.75, 0)
  parent.add(glom)
  const path = [new THREE.Vector3(-0.9, 0.75, 0), new THREE.Vector3(-0.1, 1.0, 0.1), new THREE.Vector3(0.55, 0.3, 0), new THREE.Vector3(0.5, -1.4, 0), new THREE.Vector3(1.25, -1.55, 0), new THREE.Vector3(1.45, 0.8, 0)]
  parent.add(tube(path, variant === 'disease' ? 0.2 : 0.13, variant === 'disease' ? 0xf97316 : 0xfbbf24, 0.48).mesh)
  stream(parent, path, 0x67e8f9, variant === 'disease' ? 6 : 12, variant === 'disease' ? 0.025 : 0.065, animators)
  if (variant === 'disease') {
    ;[0.15, 0.42, 0.7].forEach((u) => {
      const cast = ball(0.16, 0x92400e, 0.78)
      cast.position.copy(new THREE.CatmullRomCurve3(path).getPointAt(u))
      parent.add(cast)
    })
  }
}

function addArds(parent: THREE.Group, variant: Variant, animators: Animator[]) {
  const centers = [new THREE.Vector3(-0.9, 0.4, 0), new THREE.Vector3(0.05, 0.7, 0), new THREE.Vector3(0.95, 0.25, 0), new THREE.Vector3(-0.35, -0.55, 0), new THREE.Vector3(0.65, -0.65, 0)]
  centers.forEach((center, index) => {
    const sac = ball(0.72, index % 2 ? 0x60a5fa : 0x22d3ee, variant === 'disease' ? 0.08 : 0.14)
    sac.position.copy(center)
    parent.add(sac)
    if (variant === 'disease') {
      const fluid = ball(0.52, 0x93c5fd, 0.16)
      fluid.position.copy(center).add(new THREE.Vector3(0, -0.18, 0))
      parent.add(fluid)
    }
  })
  const capillary = [new THREE.Vector3(-1.8, -1.0, 0.6), new THREE.Vector3(-0.7, -0.2, 0.65), new THREE.Vector3(0.3, -1.1, 0.65), new THREE.Vector3(1.8, -0.25, 0.5)]
  parent.add(tube(capillary, variant === 'disease' ? 0.22 : 0.14, 0xef4444, 0.26).mesh)
  stream(parent, capillary, 0xfb7185, 9, variant === 'disease' ? 0.035 : 0.07, animators)
  for (let i = 0; i < (variant === 'disease' ? 5 : 11); i += 1) {
    const gas = ball(0.05, 0x38bdf8, 0.9)
    parent.add(gas)
    animators.push((time) => {
      const u = (time * (variant === 'disease' ? 0.16 : 0.3) + i / 11) % 1
      gas.position.set(-1.0 + (i % 6) * 0.38, 0.7 - u * 1.4, 0.7)
    })
  }
}

function addBeta(parent: THREE.Group, variant: Variant, animators: Animator[]) {
  const beta = ball(1.35, variant === 'disease' ? 0x64748b : 0x2563eb, variant === 'disease' ? 0.12 : 0.2)
  parent.add(beta)
  const granuleCount = variant === 'disease' ? 5 : 20
  for (let i = 0; i < granuleCount; i += 1) {
    const granule = ball(0.09, 0xf472b6, 0.9)
    const angle = i * 2.399
    granule.position.set(Math.cos(angle) * (0.45 + (i % 4) * 0.16), Math.sin(angle) * (0.45 + (i % 4) * 0.16), 0.35 * Math.sin(i))
    parent.add(granule)
  }
  if (variant === 'disease') {
    for (let i = 0; i < 14; i += 1) {
      const immune = ball(0.13, i % 2 ? 0x22d3ee : 0xa78bfa, 0.78)
      const angle = (i / 14) * Math.PI * 2
      immune.position.set(Math.cos(angle) * 1.75, Math.sin(angle) * 1.75, 0.3 * Math.sin(i))
      parent.add(immune)
      animators.push((time) => { immune.rotation.y = time * 0.4 + i })
    }
  }
}

function addSteatosis(parent: THREE.Group, variant: Variant, animators: Animator[]) {
  const cell = ball(1.45, 0xf59e0b, 0.16)
  parent.add(cell)
  const nucleus = ball(0.48, 0xa78bfa, 0.3)
  nucleus.position.set(variant === 'disease' ? 0.65 : 0, 0, 0)
  parent.add(nucleus)
  const lipidCount = variant === 'disease' ? 11 : 2
  for (let i = 0; i < lipidCount; i += 1) {
    const droplet = ball(variant === 'disease' ? 0.24 + (i % 3) * 0.06 : 0.1, 0xfef08a, variant === 'disease' ? 0.55 : 0.22)
    const angle = i * 2.399
    droplet.position.set(Math.cos(angle) * (0.45 + (i % 4) * 0.18), Math.sin(angle) * (0.45 + (i % 4) * 0.18), 0.35 * Math.sin(i * 0.7))
    parent.add(droplet)
  }
  const path = [new THREE.Vector3(-2, 0.8, 0), new THREE.Vector3(-0.7, 0.3, 0.2), new THREE.Vector3(0, 0, 0)]
  stream(parent, path, 0x34d399, variant === 'disease' ? 3 : 7, variant === 'disease' ? 0.03 : 0.07, animators)
}

function addThrombus(parent: THREE.Group, variant: Variant, animators: Animator[]) {
  const vessel = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 4.8, 28, 1, true), material(0xef4444, 0.12))
  vessel.rotation.z = Math.PI / 2
  parent.add(vessel)
  const path = [new THREE.Vector3(-2.1, 0, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(2.1, 0, 0)]
  stream(parent, path, 0xfb7185, variant === 'disease' ? 6 : 12, variant === 'disease' ? 0.03 : 0.08, animators, 0.08)
  if (variant === 'disease') {
    for (let i = 0; i < 26; i += 1) {
      const platelet = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 12), material(0xfbbf24, 0.9, 0xf59e0b))
      platelet.rotation.x = Math.PI / 2
      platelet.position.set(-0.15 + (i % 5) * 0.1, -0.65 + (i % 9) * 0.16, -0.45 + (i % 4) * 0.28)
      parent.add(platelet)
    }
    for (let i = 0; i < 18; i += 1) {
      const a = new THREE.Vector3(-0.7, -0.75 + (i % 7) * 0.22, -0.55 + (i % 4) * 0.3)
      const b = new THREE.Vector3(0.75, 0.65 - (i % 6) * 0.22, 0.5 - (i % 5) * 0.22)
      parent.add(tube([a, b], 0.018, 0xf8fafc, 0.7).mesh)
    }
  }
}

function addAutoimmune(parent: THREE.Group, variant: Variant, animators: Animator[]) {
  const apc = ball(1.15, 0x7c3aed, 0.2)
  apc.position.x = -1.05
  parent.add(apc)
  const tcell = ball(1.1, 0x06b6d4, 0.18)
  tcell.position.x = 1.1
  parent.add(tcell)
  const links = variant === 'disease' ? 13 : 6
  for (let i = 0; i < links; i += 1) {
    const y = -0.75 + (i / Math.max(1, links - 1)) * 1.5
    parent.add(tube([new THREE.Vector3(-0.12, y, -0.1), new THREE.Vector3(0.18, y + 0.05 * Math.sin(i), 0.12)], 0.025, i % 3 ? 0xf472b6 : 0xfbbf24, 0.85).mesh)
  }
  const cytokineCount = variant === 'disease' ? 24 : 8
  for (let i = 0; i < cytokineCount; i += 1) {
    const cytokine = ball(0.05, i % 2 ? 0x34d399 : 0xf472b6, 0.9)
    parent.add(cytokine)
    animators.push((time) => {
      const angle = i * 2.399
      const r = 1.35 + ((time * (variant === 'disease' ? 0.3 : 0.16) + i * 0.05) % 1.3)
      cytokine.position.set(1.1 + Math.cos(angle) * r, Math.sin(angle) * r, 0.25 * Math.sin(angle))
    })
  }
}

function addShock(parent: THREE.Group, variant: Variant, animators: Animator[]) {
  const radius = variant === 'disease' ? 0.24 : 0.15
  const speed = variant === 'disease' ? 0.04 : 0.09
  const branches = [
    [new THREE.Vector3(-2.2, 0, 0), new THREE.Vector3(-0.7, 0, 0), new THREE.Vector3(0.35, 0.9, 0), new THREE.Vector3(2.2, 0.75, 0)],
    [new THREE.Vector3(-0.7, 0, 0), new THREE.Vector3(0.35, -0.9, 0), new THREE.Vector3(2.2, -0.75, 0)],
  ]
  branches.forEach((points, index) => {
    parent.add(tube(points, radius, index ? 0x3b82f6 : 0xef4444, 0.28).mesh)
    stream(parent, points, index ? 0x60a5fa : 0xfb7185, variant === 'disease' ? 7 : 11, speed * (index ? 0.82 : 1), animators, 0.075)
  })
  if (variant === 'disease') {
    for (let i = 0; i < 6; i += 1) {
      const marker = ball(0.1, 0xfbbf24, 0.65)
      marker.position.set(-0.5 + (i % 3) * 0.7, -1.4 + Math.floor(i / 3) * 2.8, 0.4)
      parent.add(marker)
    }
  }
}

function buildModel(parent: THREE.Group, key: PathologyKey, variant: Variant, animators: Animator[]) {
  if (key === 'diabetic-retinopathy') addRetina(parent, variant, animators)
  if (key === 'noise-induced-hearing-loss') addCochlea(parent, variant, animators)
  if (key === 'bbb-disruption') addBbb(parent, variant, animators)
  if (key === 'acute-tubular-injury') addNephron(parent, variant, animators)
  if (key === 'ards') addArds(parent, variant, animators)
  if (key === 'type1-diabetes') addBeta(parent, variant, animators)
  if (key === 'hepatic-steatosis') addSteatosis(parent, variant, animators)
  if (key === 'thrombosis') addThrombus(parent, variant, animators)
  if (key === 'autoimmune-activation') addAutoimmune(parent, variant, animators)
  if (key === 'distributive-shock') addShock(parent, variant, animators)
}

function fit(camera: THREE.PerspectiveCamera, controls: OrbitControls, root: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(root)
  const sphereBounds = box.getBoundingSphere(new THREE.Sphere())
  const radius = Math.max(1, sphereBounds.radius)
  const distance = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov) / 2) * 1.1
  camera.position.set(sphereBounds.center.x + distance * 0.12, sphereBounds.center.y + distance * 0.05, sphereBounds.center.z + distance)
  camera.near = Math.max(0.01, radius / 120)
  camera.far = distance * 20
  camera.updateProjectionMatrix()
  controls.target.copy(sphereBounds.center)
  controls.minDistance = radius * 0.7
  controls.maxDistance = radius * 6
  controls.update()
}

export function MicroPathologyComparator() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [profileKey, setProfileKey] = useState<PathologyKey>('diabetic-retinopathy')
  const [playing, setPlaying] = useState(true)
  const profile = useMemo(() => PROFILES.find((item) => item.key === profileKey) ?? PROFILES[0], [profileKey])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let disposed = false
    mount.innerHTML = ''

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x05070b)
    scene.fog = new THREE.FogExp2(0x05070b, 0.028)
    const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 120)
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.08
    mount.appendChild(renderer.domElement)

    const pmrem = new THREE.PMREMGenerator(renderer)
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = environment
    scene.add(new THREE.HemisphereLight(0xdbeafe, 0x020617, 1.55))
    const key = new THREE.DirectionalLight(0xffffff, 2.4)
    key.position.set(4, 6, 7)
    scene.add(key)
    const normalLight = new THREE.PointLight(0x22d3ee, 18, 10)
    normalLight.position.set(-4, 2, 3)
    scene.add(normalLight)
    const diseaseLight = new THREE.PointLight(0xf43f5e, 18, 10)
    diseaseLight.position.set(4, 2, 3)
    scene.add(diseaseLight)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.075
    controls.enablePan = true
    controls.autoRotate = false

    const root = new THREE.Group()
    scene.add(root)
    const normal = new THREE.Group()
    normal.position.x = -3.15
    root.add(normal)
    const disease = new THREE.Group()
    disease.position.x = 3.15
    root.add(disease)
    const animators: Animator[] = []
    buildModel(normal, profileKey, 'normal', animators)
    buildModel(disease, profileKey, 'disease', animators)

    const divider = new THREE.Mesh(new THREE.BoxGeometry(0.012, 4.8, 0.012), material(0x64748b, 0.22))
    root.add(divider)
    fit(camera, controls, root)

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
      if (playing) {
        const time = (performance.now() - start) / 1000
        animators.forEach((animator) => animator(time))
      }
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
      root.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return
        object.geometry.dispose()
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        materials.forEach((item) => item.dispose())
      })
      environment.dispose()
      pmrem.dispose()
      renderer.dispose()
      mount.innerHTML = ''
    }
  }, [profileKey, playing])

  return (
    <section className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#080b11]">
      <header className="border-b border-neutral-200 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,.10),transparent_35%),radial-gradient(circle_at_82%_18%,rgba(244,63,94,.11),transparent_34%)] p-4 dark:border-white/10 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="text-[9px] font-black uppercase tracking-[.2em] text-rose-700 dark:text-rose-300">Normal ↔ pathology micro-3D</div>
            <h3 className="mt-1 text-xl font-black tracking-tight text-neutral-950 dark:text-white sm:text-2xl">See what changes without rewriting the source anatomy.</h3>
            <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">Side-by-side procedural teaching models compare a physiologic baseline with a disease mechanism. These are mechanistic visualizations, not patient reconstructions, diagnostic images or treatment simulators.</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-[8px] font-black uppercase tracking-wide text-cyan-800 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-200">Left · baseline</span>
            <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[8px] font-black uppercase tracking-wide text-rose-800 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200">Right · pathology</span>
            <span className="rounded-full border border-neutral-200 px-3 py-1.5 text-[8px] font-black uppercase tracking-wide text-neutral-500 dark:border-white/10 dark:text-neutral-300">Educational only</span>
          </div>
        </div>

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {PROFILES.map((item) => (
            <button key={item.key} onClick={() => setProfileKey(item.key)} className={`min-w-[170px] shrink-0 rounded-2xl border p-3 text-left transition ${profileKey === item.key ? 'border-rose-300 bg-rose-50 shadow-sm dark:border-rose-300/30 dark:bg-rose-300/10' : 'border-neutral-200 bg-white/70 hover:border-neutral-300 dark:border-white/10 dark:bg-white/[.025]'}`}>
              <div className="flex items-center gap-2"><span className="text-base">{item.icon}</span><span className="text-[10px] font-black text-neutral-950 dark:text-white">{item.label}</span></div>
              <div className="mt-1 text-[8px] font-bold uppercase tracking-wide text-neutral-400">{item.system} · {item.scale}</div>
            </button>
          ))}
        </div>
      </header>

      <div className="grid xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,.6fr)]">
        <div className="relative min-h-[540px] bg-[#05070b]">
          <div ref={mountRef} className="absolute inset-0" aria-label={`Normal versus pathology 3D comparison: ${profile.label}`} />
          <div className="pointer-events-none absolute inset-x-3 top-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-950/25 px-3 py-2 backdrop-blur-xl">
              <div className="text-[8px] font-black uppercase tracking-[.16em] text-cyan-200/60">Physiologic baseline</div>
              <div className="mt-0.5 text-[11px] font-black text-white">Normal mechanism</div>
            </div>
            <div className="rounded-2xl border border-rose-300/15 bg-rose-950/25 px-3 py-2 text-right backdrop-blur-xl">
              <div className="text-[8px] font-black uppercase tracking-[.16em] text-rose-200/60">Pathology model</div>
              <div className="mt-0.5 text-[11px] font-black text-white">{profile.label}</div>
            </div>
          </div>
          <button onClick={() => setPlaying((value) => !value)} className="absolute bottom-3 left-3 rounded-full border border-white/15 bg-black/45 px-3 py-2 text-[9px] font-black text-white backdrop-blur-xl">{playing ? 'Pause mechanism' : 'Play mechanism'}</button>
          <div className="pointer-events-none absolute bottom-3 right-3 rounded-full border border-white/10 bg-black/35 px-3 py-2 text-[8px] font-bold text-white/65 backdrop-blur-xl">Drag to orbit · pinch/scroll to zoom</div>
        </div>

        <aside className="border-t border-neutral-200 p-4 dark:border-white/10 xl:border-l xl:border-t-0 sm:p-5">
          <div className="text-[9px] font-black uppercase tracking-[.16em] text-rose-700 dark:text-rose-300">{profile.system}</div>
          <h4 className="mt-1 text-lg font-black text-neutral-950 dark:text-white">{profile.icon} {profile.label}</h4>
          <div className="mt-3 grid gap-2">
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-3 dark:border-cyan-300/20 dark:bg-cyan-300/[.06]">
              <div className="text-[8px] font-black uppercase tracking-[.14em] text-cyan-800 dark:text-cyan-300">Baseline</div>
              <p className="mt-1 text-[9px] leading-relaxed text-cyan-950/75 dark:text-cyan-100/70">{profile.normal}</p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 dark:border-rose-300/20 dark:bg-rose-300/[.06]">
              <div className="text-[8px] font-black uppercase tracking-[.14em] text-rose-800 dark:text-rose-300">Disease mechanism</div>
              <p className="mt-1 text-[9px] leading-relaxed text-rose-950/75 dark:text-rose-100/70">{profile.disease}</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/[.025]">
            <div className="text-[8px] font-black uppercase tracking-[.14em] text-neutral-400">What the 3D changes mean</div>
            <p className="mt-1 text-[9px] leading-relaxed text-neutral-600 dark:text-neutral-300">{profile.visualCue}</p>
          </div>

          <div className="mt-4">
            <div className="text-[8px] font-black uppercase tracking-[.14em] text-neutral-400">Mechanism chain</div>
            <div className="mt-2 space-y-1.5">
              {profile.mechanisms.map((mechanism, index) => (
                <div key={mechanism} className="flex gap-2 rounded-xl border border-neutral-200 p-2.5 dark:border-white/10">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-neutral-950 text-[8px] font-black text-white dark:bg-white dark:text-neutral-950">{index + 1}</span>
                  <span className="text-[9px] leading-relaxed text-neutral-600 dark:text-neutral-300">{mechanism}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-[8px] font-black uppercase tracking-[.14em] text-neutral-400">What would actually be observed</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.observables.map((item) => <span key={item} className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-1 text-[8px] font-bold text-neutral-600 dark:border-white/10 dark:bg-white/[.035] dark:text-neutral-300">{item}</span>)}
            </div>
          </div>

          <p className="mt-4 text-[8px] leading-relaxed text-neutral-400">Visual severity is not a patient severity score. Panacea should only move from an educational profile to patient-specific inference when appropriate measured data, validated models and clinical context are available.</p>
        </aside>
      </div>
    </section>
  )
}
