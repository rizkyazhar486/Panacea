import * as THREE from 'three'
import type { Atom, Struktur } from '../../../lib/molekul/struktur'
import { assignSecondaryStructure, type Ss, type Vec } from '../../../lib/molekul/strukturSekunder'

// Cartoon (ribbon) geometry from a parsed structure. Proteins: a spline through
// Cα with the carbonyl as guide vector (Richardson ribbon): flat ribbons for
// α-helices, arrows for β-strands, round tubes for coil. Nucleic acids: a tube
// through C4' with base rings as filled slabs. Ligands: ball and stick.
// Every vertex keeps its residue index so the viewer can name what is hovered.

export type ColourScheme = 'plddt' | 'secondary' | 'hydrophobicity' | 'chain' | 'rainbow'

/** Kyte & Doolittle (1982) hydropathy index: +4.5 hydrophobic (ILE) to -4.5 hydrophilic (ARG). */
export const KYTE_DOOLITTLE: Readonly<Record<string, number>> = {
  ILE: 4.5, VAL: 4.2, LEU: 3.8, PHE: 2.8, CYS: 2.5, MET: 1.9, ALA: 1.8,
  GLY: -0.4, THR: -0.7, SER: -0.8, TRP: -0.9, TYR: -1.3, PRO: -1.6,
  HIS: -3.2, GLU: -3.5, GLN: -3.5, ASP: -3.5, ASN: -3.5, LYS: -3.9, ARG: -4.5,
}

export function hydropathyScore(residueName: string): number {
  return KYTE_DOOLITTLE[residueName.toUpperCase()] ?? 0
}

export function hydropathyColour(residueName: string): THREE.Color {
  const score = hydropathyScore(residueName)
  const t = Math.max(-1, Math.min(1, score / 4.5))
  const neutral = new THREE.Color('#e2e8f0')
  if (t >= 0) return neutral.lerp(new THREE.Color('#ea580c'), t)
  return neutral.lerp(new THREE.Color('#0284c7'), -t)
}

export function secondaryColour(ss: Ss): THREE.Color {
  if (ss === 'H') return new THREE.Color('#f43f5e')
  if (ss === 'E') return new THREE.Color('#f59e0b')
  return new THREE.Color('#94a3b8')
}

export interface ResidueInfo { name: string; seq: number; chain: string; bFactor: number; ss: Ss | 'N' }
export interface CartoonMesh { mesh: THREE.Mesh; residueOfVertex: Int32Array }
export interface Cartoon { group: THREE.Group; meshes: CartoonMesh[]; residues: ResidueInfo[]; radius: number; center: THREE.Vector3; counts: { protein: number; nucleotide: number; ligand: number } }

const NUCLEOTIDES = new Set(['A', 'C', 'G', 'U', 'T', 'DA', 'DC', 'DG', 'DT', 'DU'])
const SAMPLES = 10
const RING_PYR = ['N1', 'C2', 'N3', 'C4', 'C5', 'C6']
const RING_PUR5 = ['C4', 'C5', 'N7', 'C8', 'N9']

/** AlphaFold DB model-confidence bands (pLDDT, stored in the B-factor column). */
export function plddtColour(p: number) {
  if (p > 90) return new THREE.Color('#0053d6')
  if (p > 70) return new THREE.Color('#65cbf3')
  if (p > 50) return new THREE.Color('#ffdb13')
  return new THREE.Color('#ff7d45')
}
const CHAIN_PALETTE = ['#2f6fec', '#f08a24', '#1fb37a', '#e0406e', '#8a5cf0', '#e8c020', '#18b0c8', '#e8583a', '#7cc23a', '#c64fc6']
const BASE_COLOUR: Record<string, string> = { A: '#f03e3e', G: '#2fb344', C: '#f5b800', T: '#1c7ed6', U: '#0fb5c9' }

type Group = { name: string; seq: number; iCode: string; chain: string; het: boolean; atoms: Map<string, Atom> }

function groupResidues(s: Struktur): Group[] {
  const atoms = [...s.rantai.flatMap((r) => r.residu.flatMap((x) => x.atom)), ...s.hetatm].sort((a, b) => a.serial - b.serial)
  const groups: Group[] = []
  for (const a of atoms) {
    let g = groups[groups.length - 1]
    if (!g || g.chain !== a.rantai || g.seq !== a.resSeq || g.iCode !== a.iCode) {
      g = { name: a.resNama, seq: a.resSeq, iCode: a.iCode, chain: a.rantai, het: a.het, atoms: new Map() }
      groups.push(g)
    }
    g.atoms.set(a.nama, a)
  }
  return groups
}

const v3 = (a: Atom) => new THREE.Vector3(a.x, a.y, a.z)
const vec = (a: Atom): Vec => [a.x, a.y, a.z]
const isAmino = (g: Group) => ['N', 'CA', 'C', 'O'].every((n) => g.atoms.has(n))
const isNucleotide = (g: Group) => g.atoms.has("C4'") && (g.atoms.has("C1'") || g.atoms.has('P'))

/** Splits a residue list where consecutive anchors are further apart than `gap` Å. */
function segments<T>(items: T[], anchor: (t: T) => THREE.Vector3, gap: number): T[][] {
  const out: T[][] = []
  let cur: T[] = []
  for (const it of items) {
    if (cur.length && anchor(cur[cur.length - 1]!).distanceTo(anchor(it)) > gap) { out.push(cur); cur = [] }
    cur.push(it)
  }
  if (cur.length) out.push(cur)
  return out.filter((s) => s.length >= 2)
}

type Profile = { w: number; t: number; p: number }

/** Sweeps a superellipse cross-section along a spline through `points`. */
function sweep(points: THREE.Vector3[], guides: THREE.Vector3[], profileAt: (u: number) => Profile, colourAt: (u: number) => THREE.Color, residueAt: (u: number) => number): CartoonMesh {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal')
  const k = points.length
  const m = (k - 1) * SAMPLES + 1
  const ring = 14
  const pos = new Float32Array(m * ring * 3)
  const col = new Float32Array(m * ring * 3)
  const resOf = new Int32Array(m * ring)
  const p = new THREE.Vector3(), tan = new THREE.Vector3(), side = new THREE.Vector3(), up = new THREE.Vector3(), g = new THREE.Vector3()
  let prevSide: THREE.Vector3 | null = null
  for (let s = 0; s < m; s++) {
    const u = s / SAMPLES
    const t = u / (k - 1)
    curve.getPoint(t, p)
    curve.getTangent(t, tan)
    const i0 = Math.min(k - 1, Math.floor(u))
    const i1 = Math.min(k - 1, i0 + 1)
    g.copy(guides[i0]!).lerp(guides[i1]!, u - i0)
    side.copy(g).addScaledVector(tan, -g.dot(tan))
    if (side.lengthSq() < 1e-6) side.copy(prevSide ?? new THREE.Vector3(0, 1, 0))
    side.normalize()
    if (prevSide && side.dot(prevSide) < 0) side.negate()
    prevSide = side.clone()
    up.crossVectors(tan, side).normalize()
    const { w, t: th, p: ex } = profileAt(u)
    const c = colourAt(u)
    const r = residueAt(u)
    for (let j = 0; j < ring; j++) {
      const a = (j / ring) * Math.PI * 2
      const ca = Math.cos(a), sa = Math.sin(a)
      const x = (w / 2) * Math.sign(ca) * Math.abs(ca) ** ex
      const y = (th / 2) * Math.sign(sa) * Math.abs(sa) ** ex
      const o = (s * ring + j) * 3
      pos[o] = p.x + side.x * x + up.x * y
      pos[o + 1] = p.y + side.y * x + up.y * y
      pos[o + 2] = p.z + side.z * x + up.z * y
      col[o] = c.r; col[o + 1] = c.g; col[o + 2] = c.b
      resOf[s * ring + j] = r
    }
  }
  const index: number[] = []
  for (let s = 0; s < m - 1; s++) {
    for (let j = 0; j < ring; j++) {
      const a = s * ring + j, b = s * ring + ((j + 1) % ring), c = a + ring, d = b + ring
      index.push(a, c, b, b, c, d)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(col, 3))
  geometry.setIndex(index)
  geometry.computeVertexNormals()
  return { mesh: new THREE.Mesh(geometry), residueOfVertex: resOf }
}

const smooth = (x: number) => x * x * (3 - 2 * x)

export function buildCartoon(s: Struktur, scheme: ColourScheme): Cartoon {
  const groups = groupResidues(s)
  const residues: ResidueInfo[] = []
  const meshes: CartoonMesh[] = []
  const group = new THREE.Group()
  const chainIds = [...new Set(groups.map((g) => g.chain))]
  const chainColour = (id: string) => new THREE.Color(CHAIN_PALETTE[chainIds.indexOf(id) % CHAIN_PALETTE.length]!)

  // --- Protein ---
  const amino = groups.filter(isAmino)
  const ss = s.heliks.length || s.lembar.length
    ? amino.map((g) => {
      const r = s.rantai.find((c) => c.id === g.chain)?.residu.find((x) => x.seq === g.seq && x.iCode === g.iCode)
      return r?.ss === 'helix' ? 'H' : r?.ss === 'sheet' ? 'E' : 'C'
    }) as Ss[]
    : assignSecondaryStructure(amino.map((g) => ({ N: vec(g.atoms.get('N')!), CA: vec(g.atoms.get('CA')!), C: vec(g.atoms.get('C')!), O: vec(g.atoms.get('O')!), proline: g.name === 'PRO' })))
  const aminoIndex = new Map<Group, number>()
  amino.forEach((g, i) => {
    aminoIndex.set(g, residues.length)
    residues.push({ name: g.name, seq: g.seq, chain: g.chain, bFactor: g.atoms.get('CA')!.bFactor, ss: ss[i]! })
  })
  const proteinColour = (g: Group, iInChain: number, chainLength: number, residueSs: Ss) => {
    if (scheme === 'plddt') return plddtColour(g.atoms.get('CA')!.bFactor)
    if (scheme === 'secondary') return secondaryColour(residueSs)
    if (scheme === 'hydrophobicity') return hydropathyColour(g.name)
    if (scheme === 'rainbow') return new THREE.Color().setHSL(0.66 * (1 - iInChain / Math.max(1, chainLength - 1)), 0.78, 0.55)
    return chainColour(g.chain)
  }
  for (const chain of chainIds) {
    const inChain = amino.filter((g) => g.chain === chain)
    for (const seg of segments(inChain, (g) => v3(g.atoms.get('CA')!), 4.3)) {
      const pts = seg.map((g) => v3(g.atoms.get('CA')!))
      const guides: THREE.Vector3[] = []
      seg.forEach((g, i) => {
        const d = v3(g.atoms.get('O')!).sub(v3(g.atoms.get('C')!)).normalize()
        if (i > 0 && d.dot(guides[i - 1]!) < 0) d.negate()
        guides.push(d)
      })
      const segSs = seg.map((g) => residues[aminoIndex.get(g)!]!.ss as Ss)
      // Helix guides are averaged with neighbours so the ribbon faces outward smoothly.
      const smoothGuides = guides.map((g, i) => (segSs[i] === 'H' ? g.clone().add(guides[i - 1] ?? g).add(guides[i + 1] ?? g).normalize() : g))
      const shape = (k: Ss): Profile => (k === 'H' ? { w: 2.3, t: 0.42, p: 0.35 } : k === 'E' ? { w: 2.0, t: 0.45, p: 0.3 } : { w: 0.62, t: 0.62, p: 1 })
      const profileAt = (u: number): Profile => {
        const i = Math.min(seg.length - 1, Math.floor(u))
        const f = u - i
        const a = segSs[i]!, b = segSs[Math.min(seg.length - 1, i + 1)]!
        // β-strand ends as an arrowhead over its last residue.
        if (a === 'E' && b !== 'E') return { w: 3.4 * (1 - f) + 0.6 * f, t: 0.45, p: 0.3 }
        const pa = shape(a), pb = shape(b), m = smooth(f)
        return { w: pa.w + (pb.w - pa.w) * m, t: pa.t + (pb.t - pa.t) * m, p: pa.p + (pb.p - pa.p) * m }
      }
      const colours = seg.map((g, i) => proteinColour(g, inChain.indexOf(g), inChain.length, segSs[i]!))
      const cm = sweep(
        pts, smoothGuides, profileAt,
        (u) => { const i = Math.min(seg.length - 1, Math.round(u)); return colours[i]! },
        (u) => aminoIndex.get(seg[Math.min(seg.length - 1, Math.round(u))]!)!,
      )
      meshes.push(cm)
    }
  }

  // --- Nucleic acids ---
  const nucleic = groups.filter((g) => !isAmino(g) && isNucleotide(g))
  const nucIndex = new Map<Group, number>()
  for (const g of nucleic) {
    nucIndex.set(g, residues.length)
    residues.push({ name: g.name, seq: g.seq, chain: g.chain, bFactor: g.atoms.get("C4'")!.bFactor, ss: 'N' })
  }
  const strandColour = (chain: string) => new THREE.Color(scheme === 'chain' ? CHAIN_PALETTE[(chainIds.indexOf(chain) + 3) % CHAIN_PALETTE.length]! : '#d9dee8')
  for (const chain of chainIds) {
    for (const seg of segments(nucleic.filter((g) => g.chain === chain), (g) => v3(g.atoms.get("C4'")!), 8.5)) {
      const pts = seg.map((g) => v3(g.atoms.get("C4'")!))
      const guides = seg.map((g, i) => v3(seg[Math.min(seg.length - 1, i + 1)]!.atoms.get("C4'")!).sub(v3(seg[Math.max(0, i - 1)]!.atoms.get("C4'")!)).cross(new THREE.Vector3(0, 0, 1)).normalize())
      const colour = strandColour(chain)
      meshes.push(sweep(pts, guides, () => ({ w: 1.6, t: 1.6, p: 1 }), () => colour, (u) => nucIndex.get(seg[Math.min(seg.length - 1, Math.round(u))]!)!))
    }
  }
  // Base slabs: the ring atoms as a filled plate, plus a stick from C4' to the glycosidic N.
  const slabPos: number[] = [], slabCol: number[] = [], slabRes: number[] = [], slabIdx: number[] = []
  const pushSlab = (ring: THREE.Vector3[], colour: THREE.Color, residue: number) => {
    const centroid = ring.reduce((a, b) => a.add(b), new THREE.Vector3()).divideScalar(ring.length)
    const normal = new THREE.Vector3().subVectors(ring[0]!, centroid).cross(new THREE.Vector3().subVectors(ring[1]!, centroid)).normalize().multiplyScalar(0.32)
    for (const side of [1, -1]) {
      const base = slabPos.length / 3
      for (const q of [centroid, ...ring]) {
        slabPos.push(q.x + normal.x * side, q.y + normal.y * side, q.z + normal.z * side)
        slabCol.push(colour.r, colour.g, colour.b)
        slabRes.push(residue)
      }
      for (let i = 0; i < ring.length; i++) {
        const a = base + 1 + i, b = base + 1 + ((i + 1) % ring.length)
        if (side > 0) slabIdx.push(base, a, b); else slabIdx.push(base, b, a)
      }
    }
    // Rim between the two faces.
    const top = slabPos.length / 3 - 2 * (ring.length + 1)
    const bottom = top + ring.length + 1
    for (let i = 0; i < ring.length; i++) {
      const a = top + 1 + i, b = top + 1 + ((i + 1) % ring.length), c = bottom + 1 + i, d = bottom + 1 + ((i + 1) % ring.length)
      slabIdx.push(a, c, b, b, c, d)
    }
  }
  const sticks: { from: THREE.Vector3; to: THREE.Vector3; colour: THREE.Color; residue: number }[] = []
  for (const g of nucleic) {
    const letter = g.name.replace(/^D/, '').slice(-1)
    const colour = new THREE.Color(BASE_COLOUR[letter] ?? '#c9c9c9')
    const residue = nucIndex.get(g)!
    const six = RING_PYR.map((n) => g.atoms.get(n))
    if (six.every(Boolean)) pushSlab(six.map((a) => v3(a!)), colour, residue)
    const five = RING_PUR5.map((n) => g.atoms.get(n))
    if (five.every(Boolean)) pushSlab(five.map((a) => v3(a!)), colour, residue)
    const glyco = g.atoms.get('N9') ?? g.atoms.get('N1')
    if (glyco) sticks.push({ from: v3(g.atoms.get("C4'")!), to: v3(glyco), colour, residue })
  }
  if (slabPos.length) {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(slabPos, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(slabCol, 3))
    geometry.setIndex(slabIdx)
    geometry.computeVertexNormals()
    meshes.push({ mesh: new THREE.Mesh(geometry), residueOfVertex: Int32Array.from(slabRes) })
  }
  if (sticks.length) {
    const unit = new THREE.CylinderGeometry(0.42, 0.42, 1, 10, 1)
    const parts: THREE.BufferGeometry[] = []
    const res: number[] = []
    const yAxis = new THREE.Vector3(0, 1, 0)
    for (const st of sticks) {
      const dir = new THREE.Vector3().subVectors(st.to, st.from)
      const g = unit.clone()
      g.scale(1, dir.length(), 1)
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(yAxis, dir.clone().normalize()))
      g.translate((st.from.x + st.to.x) / 2, (st.from.y + st.to.y) / 2, (st.from.z + st.to.z) / 2)
      const n = g.attributes.position!.count
      g.setAttribute('color', new THREE.Float32BufferAttribute(Array.from({ length: n }, () => [st.colour.r, st.colour.g, st.colour.b]).flat(), 3))
      g.deleteAttribute('uv')
      parts.push(g)
      for (let i = 0; i < n; i++) res.push(st.residue)
    }
    meshes.push({ mesh: new THREE.Mesh(mergeGeometries(parts)), residueOfVertex: Int32Array.from(res) })
    unit.dispose()
  }

  // --- Ligands (ball and stick) ---
  const ligands = groups.filter((g) => g.het && !isAmino(g) && !isNucleotide(g))
  const ELEMENT: Record<string, string> = { C: '#9aa3ad', N: '#4b6cff', O: '#ff4d4d', S: '#ffd84d', P: '#ff9f40', FE: '#ff8c1a', ZN: '#7d80b0', MG: '#7cff7c', MN: '#c77dff' }
  const ligandParts: THREE.BufferGeometry[] = []
  const ligandRes: number[] = []
  for (const g of ligands) {
    const residue = residues.length
    residues.push({ name: g.name, seq: g.seq, chain: g.chain, bFactor: 0, ss: 'C' })
    const atoms = [...g.atoms.values()]
    const add = (geom: THREE.BufferGeometry, colour: THREE.Color) => {
      const n = geom.attributes.position!.count
      geom.setAttribute('color', new THREE.Float32BufferAttribute(Array.from({ length: n }, () => [colour.r, colour.g, colour.b]).flat(), 3))
      geom.deleteAttribute('uv')
      ligandParts.push(geom)
      for (let i = 0; i < n; i++) ligandRes.push(residue)
    }
    for (const a of atoms) {
      const el = a.elemen.toUpperCase()
      const sphere = new THREE.SphereGeometry(atoms.length === 1 ? 0.9 : el === 'FE' ? 0.75 : 0.42, 14, 10)
      sphere.translate(a.x, a.y, a.z)
      add(sphere, new THREE.Color(ELEMENT[el] ?? '#e0e0e0'))
    }
    for (let i = 0; i < atoms.length; i++) for (let j = i + 1; j < atoms.length; j++) {
      const a = v3(atoms[i]!), b = v3(atoms[j]!)
      const d = a.distanceTo(b)
      if (d > 2.1 || d < 0.4) continue
      const cyl = new THREE.CylinderGeometry(0.16, 0.16, d, 8, 1)
      cyl.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()))
      cyl.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2)
      add(cyl, new THREE.Color('#c8ced6'))
    }
  }
  if (ligandParts.length) meshes.push({ mesh: new THREE.Mesh(mergeGeometries(ligandParts)), residueOfVertex: Int32Array.from(ligandRes) })

  for (const m of meshes) group.add(m.mesh)
  const sphere = new THREE.Box3().setFromObject(group).getBoundingSphere(new THREE.Sphere())
  return { group, meshes, residues, radius: sphere.radius, center: sphere.center, counts: { protein: amino.length, nucleotide: nucleic.length, ligand: ligands.length } }
}

/** Minimal non-indexed/indexed merge for geometries sharing position+normal+color. */
function mergeGeometries(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const pos: number[] = [], nor: number[] = [], col: number[] = [], idx: number[] = []
  let offset = 0
  for (const g of parts) {
    const p = g.attributes.position!, n = g.attributes.normal!, c = g.attributes.color!
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); col.push(c.getX(i), c.getY(i), c.getZ(i)) }
    const index = g.index
    if (index) for (let i = 0; i < index.count; i++) idx.push(index.getX(i) + offset)
    else for (let i = 0; i < p.count; i++) idx.push(i + offset)
    offset += p.count
    g.dispose()
  }
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  out.setIndex(idx)
  return out
}
