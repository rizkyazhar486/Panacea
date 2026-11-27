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
