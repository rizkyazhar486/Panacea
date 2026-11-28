// Struktur sekunder dari geometri backbone, mengikuti definisi ikatan-H
// Kabsch & Sander (DSSP, Biopolymers 1983;22:2577-2637): energi elektrostatik
// C=O···H-N, ikatan bila E < -0.5 kkal/mol. Dipakai bila berkas tidak membawa
// rekaman HELIX/SHEET (model AlphaFold DB). Versi ringkas: heliks-α dari
// dua 4-turn berurutan; untai-β dari jembatan paralel/antiparalel yang
// bertetangga. Heliks 3-10/π dan belokan tidak dibedakan (jadi 'C').

export type Vec = [number, number, number]
export interface BackboneResidue { N: Vec; CA: Vec; C: Vec; O: Vec; proline: boolean }
export type Ss = 'H' | 'E' | 'C'

const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dist = (a: Vec, b: Vec) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

export function assignSecondaryStructure(res: BackboneResidue[]): Ss[] {
  const n = res.length
  // Residu i tersambung ke i-1 bila ikatan peptida C(i-1)–N(i) ada (< 2.0 Å).
  const linked = res.map((r, i) => i > 0 && dist(res[i - 1]!.C, r.N) < 2.0)
  // Posisi H amida: N + arah (C−O) residu sebelumnya, 1.0 Å.
  const H: (Vec | null)[] = res.map((r, i) => {
    if (!linked[i] || r.proline) return null
    const d = sub(res[i - 1]!.C, res[i - 1]!.O)
    const l = Math.hypot(...d) || 1
    return [r.N[0] + d[0] / l, r.N[1] + d[1] / l, r.N[2] + d[2] / l]
  })

  // Grid ruang 9 Å di atas Cα supaya pasangan jauh tidak dihitung.
  const cell = 9
  const key = (p: Vec) => `${Math.floor(p[0] / cell)},${Math.floor(p[1] / cell)},${Math.floor(p[2] / cell)}`
  const grid = new Map<string, number[]>()
  res.forEach((r, i) => { const k = key(r.CA); const list = grid.get(k); if (list) list.push(i); else grid.set(k, [i]) })
  const near = (i: number) => {
    const [x, y, z] = res[i]!.CA.map((v) => Math.floor(v / cell))
    const out: number[] = []
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      for (const j of grid.get(`${x! + dx},${y! + dy},${z! + dz}`) ?? []) if (dist(res[i]!.CA, res[j]!.CA) < cell) out.push(j)
    }
    return out
  }

  // hb.get(a) = himpunan b dengan C=O(a) berikatan ke N-H(b).
  const hb = new Map<number, Set<number>>()
  for (let a = 0; a < n; a++) {
    const { C, O } = res[a]!
    for (const b of near(a)) {
      const h = H[b]
      if (!h || Math.abs(a - b) < 2) continue
      const N = res[b]!.N
      const e = 0.084 * 332 * (1 / dist(O, N) + 1 / dist(C, h) - 1 / dist(O, h) - 1 / dist(C, N))
      if (e < -0.5) { const set = hb.get(a); if (set) set.add(b); else hb.set(a, new Set([b])) }
    }
  }
  const bond = (a: number, b: number) => a >= 0 && b >= 0 && a < n && b < n && (hb.get(a)?.has(b) ?? false)

  const ss: Ss[] = Array(n).fill('C')
  // Heliks-α: 4-turn di i-1 dan i → residu i..i+3.
  for (let i = 1; i + 4 < n; i++) {
    if (bond(i - 1, i + 3) && bond(i, i + 4)) for (let k = i; k <= i + 3; k++) ss[k] = 'H'
  }

  const bridged = new Set<number>()
  for (let i = 1; i < n - 1; i++) {
    for (const j of near(i)) {
      if (Math.abs(i - j) < 3 || j < 1 || j >= n - 1) continue
      const parallel = (bond(i - 1, j) && bond(j, i + 1)) || (bond(j - 1, i) && bond(i, j + 1))
      const anti = (bond(i, j) && bond(j, i)) || (bond(i - 1, j + 1) && bond(j - 1, i + 1))
      if (parallel || anti) { bridged.add(i); bridged.add(j) }
    }
  }
  // Jembatan tunggal (DSSP 'B') tidak digambar sebagai untai; perlu tetangga yang juga berjembatan.
  for (const i of bridged) {
    if (ss[i] === 'H') continue
    if (bridged.has(i - 1) || bridged.has(i + 1)) ss[i] = 'E'
  }
  return ss
}
