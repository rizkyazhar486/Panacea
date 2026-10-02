// Geometri molekul: vektor, sudut, dihedral (konvensi tanda IUPAC-IUB 1970), dan
// superposisi SE(3) optimal (metode kuaternion Horn 1987; setara Kabsch 1976,
// selalu rotasi sejati det=+1 — tidak pernah refleksi).
export type V3 = readonly [number, number, number]

export const kurang = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
export const tambah = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
export const skala = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k]
export const titik = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const silang = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
export const panjang = (a: V3) => Math.sqrt(titik(a, a))
export const jarak = (a: V3, b: V3) => panjang(kurang(a, b))

/** Sudut a-b-c dalam derajat. */
export function sudut(a: V3, b: V3, c: V3): number {
  const u = kurang(a, b), v = kurang(c, b)
  return (Math.acos(Math.max(-1, Math.min(1, titik(u, v) / (panjang(u) * panjang(v))))) * 180) / Math.PI
}

/** Dihedral a-b-c-d dalam derajat (−180, 180]; positif = searah jarum jam (IUPAC). */
export function dihedral(a: V3, b: V3, c: V3, d: V3): number {
  const b0 = kurang(a, b), b1 = kurang(c, b), b2 = kurang(d, c)
  const n1 = panjang(b1), b1n = skala(b1, 1 / n1)
  const v = kurang(b0, skala(b1n, titik(b0, b1n)))
  const w = kurang(b2, skala(b1n, titik(b2, b1n)))
  const x = titik(v, w), y = titik(silang(b1n, v), w)
  return (Math.atan2(y, x) * 180) / Math.PI
}

/** Volume bertanda (a−p)·[(b−p)×(c−p)] — dasar pemeriksaan kiralitas Cα. */
export const volumeBertanda = (p: V3, a: V3, b: V3, c: V3) => titik(kurang(a, p), silang(kurang(b, p), kurang(c, p)))

export interface SE3 { R: [V3, V3, V3]; t: V3 }

export const terapkan = (T: SE3, p: V3): V3 => tambah([titik(T.R[0], p), titik(T.R[1], p), titik(T.R[2], p)], T.t)

export function rotasiDariKuaternion(q: readonly [number, number, number, number]): [V3, V3, V3] {
  const [w, x, y, z] = q
  return [
    [w * w + x * x - y * y - z * z, 2 * (x * y - w * z), 2 * (x * z + w * y)],
    [2 * (x * y + w * z), w * w - x * x + y * y - z * z, 2 * (y * z - w * x)],
    [2 * (x * z - w * y), 2 * (y * z + w * x), w * w - x * x - y * y + z * z],
  ]
}

/** Vektor eigen dominan matriks simetris 4×4 (rotasi Jacobi). */
function eigenDominan(M: number[][]): number[] {
  const A = M.map((r) => r.slice()), V = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0
    for (let p = 0; p < 4; p++) for (let q = p + 1; q < 4; q++) off += A[p][q] ** 2
    if (off < 1e-22) break
    for (let p = 0; p < 4; p++) for (let q = p + 1; q < 4; q++) {
      if (Math.abs(A[p][q]) < 1e-30) continue
      const th = (A[q][q] - A[p][p]) / (2 * A[p][q])
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c
      for (let k = 0; k < 4; k++) { const akp = A[k][p], akq = A[k][q]; A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq }
      for (let k = 0; k < 4; k++) { const apk = A[p][k], aqk = A[q][k]; A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk }
      for (let k = 0; k < 4; k++) { const vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq }
    }
  }
  let i = 0; for (let k = 1; k < 4; k++) if (A[k][k] > A[i][i]) i = k
  return [V[0][i], V[1][i], V[2][i], V[3][i]]
}

/** Transformasi SE(3) yang memetakan `bergerak` ke `acuan` dengan RMSD minimum. */
export function superposisi(bergerak: readonly V3[], acuan: readonly V3[]): { T: SE3; rmsd: number } {
  if (bergerak.length !== acuan.length || bergerak.length < 3) throw new Error('superposition needs ≥3 paired points')
  const n = bergerak.length
  const cm = skala(bergerak.reduce((s, p) => tambah(s, p), [0, 0, 0] as V3), 1 / n)
  const ca = skala(acuan.reduce((s, p) => tambah(s, p), [0, 0, 0] as V3), 1 / n)
  let Sxx = 0, Sxy = 0, Sxz = 0, Syx = 0, Syy = 0, Syz = 0, Szx = 0, Szy = 0, Szz = 0
  for (let i = 0; i < n; i++) {
    const a = kurang(bergerak[i], cm), b = kurang(acuan[i], ca)
    Sxx += a[0] * b[0]; Sxy += a[0] * b[1]; Sxz += a[0] * b[2]; Syx += a[1] * b[0]; Syy += a[1] * b[1]; Syz += a[1] * b[2]; Szx += a[2] * b[0]; Szy += a[2] * b[1]; Szz += a[2] * b[2]
  }
  const N = [
    [Sxx + Syy + Szz, Syz - Szy, Szx - Sxz, Sxy - Syx],
    [Syz - Szy, Sxx - Syy - Szz, Sxy + Syx, Szx + Sxz],
    [Szx - Sxz, Sxy + Syx, -Sxx + Syy - Szz, Syz + Szy],
    [Sxy - Syx, Szx + Sxz, Syz + Szy, -Sxx - Syy + Szz],
  ]
  const q = eigenDominan(N) as [number, number, number, number]
  const R = rotasiDariKuaternion(q)
  const t = kurang(ca, [titik(R[0], cm), titik(R[1], cm), titik(R[2], cm)])
  const T: SE3 = { R, t }
  let ss = 0; for (let i = 0; i < n; i++) ss += jarak(terapkan(T, bergerak[i]), acuan[i]) ** 2
  return { T, rmsd: Math.sqrt(ss / n) }
}
