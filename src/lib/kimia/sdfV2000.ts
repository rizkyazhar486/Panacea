// Minimal MDL V2000 molfile reader for PubChem 3D conformer SDFs. It reads the
// first record's atom and bond blocks only; properties and charges are ignored.

export interface SdfAtom {
  element: string
  x: number
  y: number
  z: number
}

export interface SdfBond {
  a: number
  b: number
  /** 1 single, 2 double, 3 triple, 4 aromatic (V2000 codes). */
  order: number
}

export interface SdfMolecule {
  atoms: SdfAtom[]
  bonds: SdfBond[]
}

export interface SdfChemistrySummary {
  readonly hillFormula: string
  readonly atomCount: number
  readonly heavyAtomCount: number
  readonly bondCount: number
  readonly molarMassDa: number
  readonly polarHeavyCount: number
  readonly polarHeavyFraction: number
  readonly maxBondOrder: number
}

// IUPAC 2021 standard atomic weights (Da / g·mol^-1) for biological elements.
const ATOMIC_WEIGHT_DA: Readonly<Record<string, number>> = {
  H: 1.008, C: 12.011, N: 14.007, O: 15.999, F: 18.998,
  Na: 22.99, Mg: 24.305, P: 30.974, S: 32.06, Cl: 35.45,
  K: 39.098, Ca: 40.078, Fe: 55.845, Zn: 65.38, I: 126.904,
}

// Pauling electronegativity >= 2.5 heteroatoms contributing to molecular polarity / H-bonding.
const POLAR_HETEROATOMS = new Set(['O', 'N', 'P', 'S', 'F', 'Cl'])

export function parseSdfV2000(text: string): SdfMolecule {
  const lines = text.split(/\r?\n/)
  const counts = lines[3] ?? ''
  if (!counts.includes('V2000')) throw new Error('Not a V2000 molfile')
  const atomCount = Number(counts.slice(0, 3))
  const bondCount = Number(counts.slice(3, 6))
  if (!Number.isInteger(atomCount) || !Number.isInteger(bondCount)) throw new Error('Unreadable counts line')

  const atoms: SdfAtom[] = []
  for (let i = 0; i < atomCount; i++) {
    const line = lines[4 + i] ?? ''
    atoms.push({
      x: Number(line.slice(0, 10)),
      y: Number(line.slice(10, 20)),
      z: Number(line.slice(20, 30)),
      element: line.slice(31, 34).trim(),
    })
  }
  const bonds: SdfBond[] = []
  for (let i = 0; i < bondCount; i++) {
    const line = lines[4 + atomCount + i] ?? ''
    bonds.push({ a: Number(line.slice(0, 3)) - 1, b: Number(line.slice(3, 6)) - 1, order: Number(line.slice(6, 9)) })
  }
  if (atoms.some((atom) => !atom.element || [atom.x, atom.y, atom.z].some(Number.isNaN))) throw new Error('Unreadable atom block')
  if (bonds.some((bond) => !atoms[bond.a] || !atoms[bond.b])) throw new Error('Bond references a missing atom')
  return { atoms, bonds }
}

/** Element counts in Hill order (C, H, then alphabetical), e.g. "C10H16N5O13P3". */
export function hillFormula(molecule: SdfMolecule): string {
  const counts = new Map<string, number>()
  for (const atom of molecule.atoms) counts.set(atom.element, (counts.get(atom.element) ?? 0) + 1)
  const keys = [...counts.keys()].sort()
  const order = counts.has('C') ? ['C', ...(counts.has('H') ? ['H'] : []), ...keys.filter((k) => k !== 'C' && k !== 'H')] : keys
  return order.map((k) => k + ((counts.get(k) ?? 0) > 1 ? counts.get(k) : '')).join('')
}

/** Exact molecular mass in Daltons computed directly from parsed SDF atoms. */
export function molarMassDa(molecule: SdfMolecule): number {
  let mass = 0
  for (const atom of molecule.atoms) mass += ATOMIC_WEIGHT_DA[atom.element] ?? 12.011
  return Math.round(mass * 100) / 100
}

/** Deterministic physical-chemistry summary computed strictly from parsed SDF atoms and bonds. */
export function summarizeSdfChemistry(molecule: SdfMolecule): SdfChemistrySummary {
  let heavyAtomCount = 0
  let polarHeavyCount = 0
  for (const atom of molecule.atoms) {
    if (atom.element !== 'H') {
      heavyAtomCount += 1
      if (POLAR_HETEROATOMS.has(atom.element)) polarHeavyCount += 1
    }
  }
  const maxBondOrder = molecule.bonds.reduce((max, b) => Math.max(max, b.order === 4 ? 2 : b.order), 1)
  return {
    hillFormula: hillFormula(molecule),
    atomCount: molecule.atoms.length,
    heavyAtomCount,
    bondCount: molecule.bonds.length,
    molarMassDa: molarMassDa(molecule),
    polarHeavyCount,
    polarHeavyFraction: heavyAtomCount > 0 ? Math.round((polarHeavyCount / heavyAtomCount) * 1000) / 1000 : 0,
    maxBondOrder,
  }
}
