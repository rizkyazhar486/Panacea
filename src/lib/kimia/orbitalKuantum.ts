/**
 * PanaceaMed OS — Biological Periodic Table (18 Essential Elements) & Exact Hydrogenic Quantum Orbital Engine.
 *
 * Strictly grounded in textbook non-relativistic quantum mechanics (Griffiths Ch. 4 / Atkins):
 * - Real hydrogenic wavefunctions ψ_{n,l,m}(r, θ, φ) in Bohr radii (a0 = 0.529 Å) for 1s..3d orbitals.
 * - Radial probability distribution P(r) = 4π r² |R_{n,l}(r)|².
 * - Zero Bohr planetary orbit misconceptions, zero quantum-healing pseudoscience.
 */

export interface BioPeriodicElement {
  readonly z: number
  readonly symbol: string
  readonly name: string
  readonly atomicMassDa: number
  readonly electronConfig: string
  readonly physiologicalIon: string
  readonly bodyMassPct: number
  readonly referenceRange: string
  readonly bondingClass: 'covalent-backbone' | 'electrolyte-gradient' | 'cofactor-redox' | 'structural-mineral'
  readonly biologicalRole: string
}

export const BIO_PERIODIC_ELEMENTS: readonly BioPeriodicElement[] = [
  { z: 1, symbol: 'H', name: 'Hydrogen', atomicMassDa: 1.008, electronConfig: '1s¹', physiologicalIon: 'H⁺', bodyMassPct: 9.5, referenceRange: 'pH 7.35–7.45', bondingClass: 'covalent-backbone', biologicalRole: 'Hydrogen bonding in DNA/water & mitochondrial ΔpH proton-motive force.' },
  { z: 6, symbol: 'C', name: 'Carbon', atomicMassDa: 12.011, electronConfig: '[He] 2s² 2p²', physiologicalIon: 'Covalent', bodyMassPct: 18.5, referenceRange: 'Organic matrix', bondingClass: 'covalent-backbone', biologicalRole: 'Tetravalent covalent framework of proteins, nucleic acids, lipids & glucose.' },
  { z: 7, symbol: 'N', name: 'Nitrogen', atomicMassDa: 14.007, electronConfig: '[He] 2s² 2p³', physiologicalIon: 'NH₄⁺ / NO', bodyMassPct: 3.2, referenceRange: 'BUN 7–20 mg/dL', bondingClass: 'covalent-backbone', biologicalRole: 'Peptide amide bonds, purine/pyrimidine rings & endothelial NO signaling.' },
  { z: 8, symbol: 'O', name: 'Oxygen', atomicMassDa: 15.999, electronConfig: '[He] 2s² 2p⁴', physiologicalIon: 'O₂ / H₂O', bodyMassPct: 65.0, referenceRange: 'PaO₂ 80–100 mmHg', bondingClass: 'covalent-backbone', biologicalRole: 'Terminal electron acceptor at Complex IV driving mitochondrial OXPHOS ATP.' },
  { z: 11, symbol: 'Na', name: 'Sodium', atomicMassDa: 22.990, electronConfig: '[Ne] 3s¹', physiologicalIon: 'Na⁺', bodyMassPct: 0.2, referenceRange: '135–145 mEq/L', bondingClass: 'electrolyte-gradient', biologicalRole: 'Extracellular action-potential depolarization (Nav channels) & ECF osmolality.' },
  { z: 12, symbol: 'Mg', name: 'Magnesium', atomicMassDa: 24.305, electronConfig: '[Ne] 3s²', physiologicalIon: 'Mg²⁺', bodyMassPct: 0.05, referenceRange: '1.7–2.2 mg/dL', bondingClass: 'cofactor-redox', biologicalRole: 'Coordinates Mg-ATP phosphate groups, NMDA channel block & >300 kinases.' },
  { z: 15, symbol: 'P', name: 'Phosphorus', atomicMassDa: 30.974, electronConfig: '[Ne] 3s² 3p³', physiologicalIon: 'HPO₄²⁻', bodyMassPct: 1.0, referenceRange: '2.5–4.5 mg/dL', bondingClass: 'structural-mineral', biologicalRole: 'ATP phosphoanhydride bonds, DNA sugar-phosphate backbone & bone apatite.' },
  { z: 16, symbol: 'S', name: 'Sulfur', atomicMassDa: 32.06, electronConfig: '[Ne] 3s² 3p⁴', physiologicalIon: 'R-SH / SO₄²⁻', bodyMassPct: 0.25, referenceRange: 'Cysteine / GSH', bondingClass: 'covalent-backbone', biologicalRole: 'Disulfide bridges stabilizing tertiary protein folds, Fe-S clusters & glutathione.' },
  { z: 17, symbol: 'Cl', name: 'Chloride', atomicMassDa: 35.45, electronConfig: '[Ne] 3s² 3p⁵', physiologicalIon: 'Cl⁻', bodyMassPct: 0.2, referenceRange: '98–106 mEq/L', bondingClass: 'electrolyte-gradient', biologicalRole: 'GABA-A inhibitory hyperpolarization, CFTR airway hydration & gastric HCl.' },
  { z: 19, symbol: 'K', name: 'Potassium', atomicMassDa: 39.098, electronConfig: '[Ar] 4s¹', physiologicalIon: 'K⁺', bodyMassPct: 0.4, referenceRange: '3.5–5.0 mEq/L', bondingClass: 'electrolyte-gradient', biologicalRole: 'Intracellular cation setting cardiomyocyte & neuronal resting potential (-85 mV).' },
  { z: 20, symbol: 'Ca', name: 'Calcium', atomicMassDa: 40.078, electronConfig: '[Ar] 4s²', physiologicalIon: 'Ca²⁺', bodyMassPct: 1.5, referenceRange: '8.6–10.2 mg/dL', bondingClass: 'structural-mineral', biologicalRole: 'Troponin excitation-contraction coupling, synaptic vesicle release & bone mineral.' },
  { z: 25, symbol: 'Mn', name: 'Manganese', atomicMassDa: 54.938, electronConfig: '[Ar] 3d⁵ 4s²', physiologicalIon: 'Mn²⁺', bodyMassPct: 0.00002, referenceRange: '0.4–1.0 µg/L', bondingClass: 'cofactor-redox', biologicalRole: 'Mitochondrial Mn-SOD2 superoxide detoxification & arginase cofactor.' },
  { z: 26, symbol: 'Fe', name: 'Iron', atomicMassDa: 55.845, electronConfig: '[Ar] 3d⁶ 4s²', physiologicalIon: 'Fe²⁺ / Fe³⁺', bodyMassPct: 0.006, referenceRange: 'Ferritin 30–300 ng/mL', bondingClass: 'cofactor-redox', biologicalRole: 'Heme O₂ binding in hemoglobin/myoglobin & mitochondrial cytochromes.' },
  { z: 27, symbol: 'Co', name: 'Cobalt', atomicMassDa: 58.933, electronConfig: '[Ar] 3d⁷ 4s²', physiologicalIon: 'Co³⁺ (B12)', bodyMassPct: 0.000002, referenceRange: 'B12 200–900 pg/mL', bondingClass: 'cofactor-redox', biologicalRole: 'Corrin-ring metal center of cobalamin (Vitamin B12) for myelin & DNA synthesis.' },
  { z: 29, symbol: 'Cu', name: 'Copper', atomicMassDa: 63.546, electronConfig: '[Ar] 3d¹⁰ 4s¹', physiologicalIon: 'Cu⁺ / Cu²⁺', bodyMassPct: 0.0001, referenceRange: '70–140 µg/dL', bondingClass: 'cofactor-redox', biologicalRole: 'Cytochrome c oxidase (Complex IV) electron transfer & lysyl oxidase collagen cross-links.' },
  { z: 30, symbol: 'Zn', name: 'Zinc', atomicMassDa: 65.38, electronConfig: '[Ar] 3d¹⁰ 4s²', physiologicalIon: 'Zn²⁺', bodyMassPct: 0.003, referenceRange: '70–120 µg/dL', bondingClass: 'cofactor-redox', biologicalRole: 'Zinc-finger DNA transcription domains, carbonic anhydrase & insulin hexamers.' },
  { z: 34, symbol: 'Se', name: 'Selenium', atomicMassDa: 78.971, electronConfig: '[Ar] 3d¹⁰ 4s² 4p⁴', physiologicalIon: 'Selenocysteine', bodyMassPct: 0.00002, referenceRange: '70–150 µg/L', bondingClass: 'cofactor-redox', biologicalRole: 'Glutathione peroxidase antioxidant defense & thyroid T4→T3 deiodinases.' },
  { z: 53, symbol: 'I', name: 'Iodine', atomicMassDa: 126.904, electronConfig: '[Kr] 4d¹⁰ 5s² 5p⁵', physiologicalIon: 'I⁻', bodyMassPct: 0.00002, referenceRange: 'UIC 100–199 µg/L', bondingClass: 'cofactor-redox', biologicalRole: 'Covalent organification on thyroglobulin producing metabolic hormones T3/T4.' },
] as const

export type HydrogenicOrbitalId = '1s' | '2s' | '2pz' | '2px' | '3s' | '3pz' | '3dz2' | '3dxz' | '3dx2y2'

export interface OrbitalSpec {
  readonly id: HydrogenicOrbitalId
  readonly label: string
  readonly n: number
  readonly l: number
  readonly mLabel: string
  readonly radialNodes: number
  readonly angularNodes: number
  readonly maxRadiusBohr: number
  readonly summary: string
}

export const HYDROGENIC_ORBITALS: readonly OrbitalSpec[] = [
  { id: '1s', label: '1s', n: 1, l: 0, mLabel: 'm=0', radialNodes: 0, angularNodes: 0, maxRadiusBohr: 6, summary: 'Spherical ground-state probability density peaking at r = 1 a₀ (0.529 Å).' },
  { id: '2s', label: '2s', n: 2, l: 0, mLabel: 'm=0', radialNodes: 1, angularNodes: 0, maxRadiusBohr: 14, summary: 'Spherical orbital with one spherical radial node at r = 2 a₀.' },
  { id: '2pz', label: '2p_z', n: 2, l: 1, mLabel: 'm=0', radialNodes: 0, angularNodes: 1, maxRadiusBohr: 14, summary: 'Axial two-lobe density separated by the xy nodal plane (σ/π covalent bonding).' },
  { id: '2px', label: '2p_x', n: 2, l: 1, mLabel: 'm=±1', radialNodes: 0, angularNodes: 1, maxRadiusBohr: 14, summary: 'Orthogonal p-orbital lobe along x (sp²/sp³ hybridization in carbon & nitrogen).' },
  { id: '3s', label: '3s', n: 3, l: 0, mLabel: 'm=0', radialNodes: 2, angularNodes: 0, maxRadiusBohr: 22, summary: 'Valence s-orbital of Na/Mg/P/S/Cl with two concentric spherical radial nodes.' },
  { id: '3pz', label: '3p_z', n: 3, l: 1, mLabel: 'm=0', radialNodes: 1, angularNodes: 1, maxRadiusBohr: 22, summary: 'Valence p-orbital (P, S, Cl) combining one radial node and one nodal plane.' },
  { id: '3dz2', label: '3d_z²', n: 3, l: 2, mLabel: 'm=0', radialNodes: 0, angularNodes: 2, maxRadiusBohr: 22, summary: 'Axial lobes plus equatorial torus — coordinates O₂ on heme Fe²⁺ axial axis.' },
  { id: '3dxz', label: '3d_xz', n: 3, l: 2, mLabel: 'm=±1', radialNodes: 0, angularNodes: 2, maxRadiusBohr: 22, summary: 'Four-lobe d-orbital enabling π-backbonding in iron-porphyrin & cytochromes.' },
  { id: '3dx2y2', label: '3d_x²-y²', n: 3, l: 2, mLabel: 'm=±2', radialNodes: 0, angularNodes: 2, maxRadiusBohr: 22, summary: 'Four equatorial lobes interacting directly with porphyrin nitrogen ligands.' },
] as const

/** Real-valued hydrogenic wavefunction ψ(x,y,z) in atomic units (a₀ = 1). */
export function evaluateHydrogenicPsi(orbital: HydrogenicOrbitalId, x: number, y: number, z: number): number {
  const r = Math.hypot(x, y, z)
  const safeR = Math.max(r, 1e-9)
  switch (orbital) {
    case '1s':
      return (1 / Math.sqrt(Math.PI)) * Math.exp(-r)
    case '2s':
      return (1 / (4 * Math.sqrt(2 * Math.PI))) * (2 - r) * Math.exp(-r / 2)
    case '2pz':
      return (1 / (4 * Math.sqrt(2 * Math.PI))) * z * Math.exp(-r / 2)
    case '2px':
      return (1 / (4 * Math.sqrt(2 * Math.PI))) * x * Math.exp(-r / 2)
    case '3s':
      return (1 / (81 * Math.sqrt(3 * Math.PI))) * (27 - 18 * r + 2 * r * r) * Math.exp(-r / 3)
    case '3pz':
      return (Math.sqrt(2) / (81 * Math.sqrt(Math.PI))) * (6 - r) * z * Math.exp(-r / 3)
    case '3dz2':
      return (1 / (81 * Math.sqrt(6 * Math.PI))) * (3 * z * z - safeR * safeR) * Math.exp(-r / 3)
    case '3dxz':
      return (Math.sqrt(2) / (81 * Math.sqrt(Math.PI))) * (x * z) * Math.exp(-r / 3)
    case '3dx2y2':
      return (1 / (81 * Math.sqrt(2 * Math.PI))) * (x * x - y * y) * Math.exp(-r / 3)
  }
}

/** Normalized radial probability density P(r) = 4π r² |R_{n,l}(r)|² at radius r (Bohr radii). */
export function evaluateRadialProbability(n: number, l: number, r: number): number {
  if (r < 0) return 0
  let R = 0
  if (n === 1 && l === 0) R = 2 * Math.exp(-r)
  else if (n === 2 && l === 0) R = (1 / Math.sqrt(2)) * (1 - r / 2) * Math.exp(-r / 2)
  else if (n === 2 && l === 1) R = (1 / (2 * Math.sqrt(6))) * r * Math.exp(-r / 2)
  else if (n === 3 && l === 0) R = (2 / (81 * Math.sqrt(3))) * (27 - 18 * r + 2 * r * r) * Math.exp(-r / 3)
  else if (n === 3 && l === 1) R = (4 / (81 * Math.sqrt(6))) * (6 - r) * r * Math.exp(-r / 3)
  else if (n === 3 && l === 2) R = (4 / (81 * Math.sqrt(30))) * r * r * Math.exp(-r / 3)
  return r * r * R * R
}

export interface OrbitalCloudPoint {
  readonly x: number
  readonly y: number
  readonly z: number
  readonly sign: 1 | -1
}

/** Deterministic rejection-sampled 3D probability cloud proportional to |ψ(x,y,z)|². */
export function sampleOrbitalProbabilityCloud(orbital: HydrogenicOrbitalId, targetCount = 1400): readonly OrbitalCloudPoint[] {
  const spec = HYDROGENIC_ORBITALS.find((o) => o.id === orbital) ?? HYDROGENIC_ORBITALS[0]
  const bound = spec.maxRadiusBohr
  // Estimate peak density deterministically on axis/diagonal probes
  let maxDensity = 1e-12
  for (let i = 1; i <= 40; i++) {
    const t = (i / 40) * bound * 0.7
    for (const [px, py, pz] of [[t, 0, 0], [0, 0, t], [t * 0.7, 0, t * 0.7], [t * 0.6, t * 0.6, 0]]) {
      const psi = evaluateHydrogenicPsi(orbital, px, py, pz)
      if (psi * psi > maxDensity) maxDensity = psi * psi
    }
  }
  let seed = 0x517cc1b7 ^ (spec.n * 977 + spec.l * 131)
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  const points: OrbitalCloudPoint[] = []
  let attempts = 0
  const maxAttempts = targetCount * 90
  while (points.length < targetCount && attempts < maxAttempts) {
    attempts += 1
    const x = (rand() * 2 - 1) * bound
    const y = (rand() * 2 - 1) * bound
    const z = (rand() * 2 - 1) * bound
    if (x * x + y * y + z * z > bound * bound) continue
    const psi = evaluateHydrogenicPsi(orbital, x, y, z)
    if (rand() * maxDensity <= psi * psi) {
      points.push({ x, y, z, sign: psi >= 0 ? 1 : -1 })
    }
  }
  return points
}
