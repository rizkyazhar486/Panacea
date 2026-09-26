// Algebraic Multigrid (AMG) agregasi-terhaluskan untuk matriks jarang SPD (CSR).
//
// Tanpa geometri sama sekali: hierarki dibangun HANYA dari entri matriks, sehingga
// berlaku untuk graf (Laplacian graf, mis. jaringan mirip-konektom) dan mesh tak
// terstruktur. Klasik, deterministik, tanpa jaringan saraf.
//
// Setup (per level):
//   1. kekuatan koneksi: |a_ij| ≥ θ·sqrt(|a_ii|·|a_jj|)  (Vaněk–Mandel–Brezina);
//   2. agregasi serakah: node yang belum teragregasi + tetangga kuatnya -> satu agregat;
//      sisa node menempel ke agregat tetangga kuat terkuat;
//   3. prolongasi tentatif P0: konstan per agregat (menangkap ruang-nol ~konstan);
//   4. penghalusan: P = (I − ω D⁻¹ A) P0, ω = 4/(3 ρ(D⁻¹A)) dengan ρ diestimasi;
//   5. R = Pᵀ, operator kasar Galerkin A_c = Pᵀ A P.
// Siklus: V-cycle dengan Jacobi terbobot sebagai smoother, Gauss-Seidel di level terkasar.

export interface CSR { n: number; rowPtr: Int32Array; col: Int32Array; val: Float64Array }

export function dariTriplet(n: number, tri: readonly [number, number, number][]): CSR {
  const baris: Map<number, number>[] = Array.from({ length: n }, () => new Map())
  for (const [i, j, v] of tri) baris[i].set(j, (baris[i].get(j) ?? 0) + v)
  const rowPtr = new Int32Array(n + 1)
  const col: number[] = [], val: number[] = []
  for (let i = 0; i < n; i++) {
    const e = [...baris[i].entries()].sort((a, b) => a[0] - b[0])
    for (const [j, v] of e) { col.push(j); val.push(v) }
    rowPtr[i + 1] = col.length
  }
  return { n, rowPtr, col: Int32Array.from(col), val: Float64Array.from(val) }
}

export function kaliVektor(A: CSR, x: Float64Array, y = new Float64Array(A.n)) {
  for (let i = 0; i < A.n; i++) { let s = 0; for (let p = A.rowPtr[i]; p < A.rowPtr[i + 1]; p++) s += A.val[p] * x[A.col[p]]; y[i] = s }
  return y
}

function diag(A: CSR): Float64Array {
  const d = new Float64Array(A.n)
  for (let i = 0; i < A.n; i++) for (let p = A.rowPtr[i]; p < A.rowPtr[i + 1]; p++) if (A.col[p] === i) d[i] = A.val[p]
  return d
}

/** Transpos CSR. */
function transpos(A: CSR, m: number): CSR {
  const tri: [number, number, number][] = []
  for (let i = 0; i < A.n; i++) for (let p = A.rowPtr[i]; p < A.rowPtr[i + 1]; p++) tri.push([A.col[p], i, A.val[p]])
  return dariTriplet(m, tri)
}

/** C = A·B (CSR, B punya `kolomB` kolom). */
function kali(A: CSR, B: CSR): CSR {
  const tri: [number, number, number][] = []
  for (let i = 0; i < A.n; i++) {
    const acc = new Map<number, number>()
    for (let p = A.rowPtr[i]; p < A.rowPtr[i + 1]; p++) {
      const k = A.col[p], a = A.val[p]
      for (let q = B.rowPtr[k]; q < B.rowPtr[k + 1]; q++) acc.set(B.col[q], (acc.get(B.col[q]) ?? 0) + a * B.val[q])
    }
    for (const [j, v] of acc) if (v !== 0) tri.push([i, j, v])
  }
  return dariTriplet(A.n, tri)
}

export function agregasi(A: CSR, theta = 0.08): Int32Array {
  const d = diag(A)
  const agg = new Int32Array(A.n).fill(-1)
  const kuat = (i: number, p: number) => A.col[p] !== i && Math.abs(A.val[p]) >= theta * Math.sqrt(Math.abs(d[i] * d[A.col[p]]))
  let nAgg = 0
  // Tahap 1: node yang seluruh tetangga kuatnya belum teragregasi menjadi benih.
  for (let i = 0; i < A.n; i++) {
    if (agg[i] >= 0) continue
    let bebas = true
    for (let p = A.rowPtr[i]; p < A.rowPtr[i + 1]; p++) if (kuat(i, p) && agg[A.col[p]] >= 0) { bebas = false; break }
    if (!bebas) continue
    agg[i] = nAgg
    for (let p = A.rowPtr[i]; p < A.rowPtr[i + 1]; p++) if (kuat(i, p)) agg[A.col[p]] = nAgg
    nAgg++
  }
  // Tahap 2: sisa menempel ke agregat tetangga kuat terkuat; bila tak ada, agregat sendiri.
  for (let i = 0; i < A.n; i++) {
    if (agg[i] >= 0) continue
    let terbaik = -1, bobot = 0
    for (let p = A.rowPtr[i]; p < A.rowPtr[i + 1]; p++) if (kuat(i, p) && agg[A.col[p]] >= 0 && Math.abs(A.val[p]) > bobot) { bobot = Math.abs(A.val[p]); terbaik = agg[A.col[p]] }
    agg[i] = terbaik >= 0 ? terbaik : nAgg++
  }
  return agg
}

function rhoDinvA(A: CSR, d: Float64Array, iter = 15): number {
  let x = new Float64Array(A.n).map((_, i) => 1 + ((i * 7919) % 13) / 13)
  let rho = 1
  for (let k = 0; k < iter; k++) {
    const y = kaliVektor(A, x)
    for (let i = 0; i < A.n; i++) y[i] /= d[i]
    const nrm = Math.sqrt(y.reduce((s, v) => s + v * v, 0))
    rho = nrm / Math.sqrt(x.reduce((s, v) => s + v * v, 0))
    x = y.map((v) => v / nrm)
  }
  return rho
}

export interface Level { A: CSR; P?: CSR; R?: CSR; d: Float64Array; agregat?: Int32Array }

export function bangunHierarki(A: CSR, opsi: { nKasar?: number; theta?: number; maksLevel?: number } = {}): Level[] {
  const nKasar = opsi.nKasar ?? 40, maks = opsi.maksLevel ?? 10
  const levels: Level[] = [{ A, d: diag(A) }]
  for (let l = 0; l < maks; l++) {
    const cur = levels[levels.length - 1]
    if (cur.A.n <= nKasar) break
    for (const v of cur.d) if (!(v > 0)) throw new Error('matrix must have a positive diagonal (SPD expected)')
    const agg = agregasi(cur.A, opsi.theta)
    const m = Math.max(...agg) + 1
    if (m >= cur.A.n) break // tidak mengasar: berhenti, jangan berputar
    const P0 = dariTriplet(cur.A.n, Array.from(agg, (a, i) => [i, a, 1] as [number, number, number]))
    const omega = 4 / (3 * rhoDinvA(cur.A, cur.d))
    // S = I − ω D⁻¹ A
    const triS: [number, number, number][] = []
    for (let i = 0; i < cur.A.n; i++) {
      triS.push([i, i, 1])
      for (let p = cur.A.rowPtr[i]; p < cur.A.rowPtr[i + 1]; p++) triS.push([i, cur.A.col[p], (-omega * cur.A.val[p]) / cur.d[i]])
    }
    const P = kali(dariTriplet(cur.A.n, triS), P0)
    const R = transpos(P, m)
    const Ac = kali(kali(R, cur.A), P)
    cur.P = P; cur.R = R; cur.agregat = agg
    levels.push({ A: Ac, d: diag(Ac) })
  }
  return levels
}

function smoothJacobi(A: CSR, d: Float64Array, x: Float64Array, b: Float64Array, s: number, omega = 0.6) {
  const Ax = new Float64Array(A.n)
  for (let k = 0; k < s; k++) { kaliVektor(A, x, Ax); for (let i = 0; i < A.n; i++) x[i] += (omega * (b[i] - Ax[i])) / d[i] }
}

function gsKasar(A: CSR, x: Float64Array, b: Float64Array, sapuan = 200) {
  for (let s = 0; s < sapuan; s++) for (let i = 0; i < A.n; i++) {
    let sum = b[i], dd = 0
    for (let p = A.rowPtr[i]; p < A.rowPtr[i + 1]; p++) { const j = A.col[p]; if (j === i) dd = A.val[p]; else sum -= A.val[p] * x[j] }
    x[i] = sum / dd
  }
}

export function vCycleAmg(L: Level[], l: number, x: Float64Array, b: Float64Array, nu = 2) {
  const lv = L[l]
  if (l === L.length - 1) { gsKasar(lv.A, x, b); return }
  smoothJacobi(lv.A, lv.d, x, b, nu)
  const r = kaliVektor(lv.A, x); for (let i = 0; i < r.length; i++) r[i] = b[i] - r[i]
  const rc = kaliVektor(lv.R!, r)
  const ec = new Float64Array(L[l + 1].A.n)
  vCycleAmg(L, l + 1, ec, rc, nu)
  const e = kaliVektor(lv.P!, ec)
  for (let i = 0; i < x.length; i++) x[i] += e[i]
  smoothJacobi(lv.A, lv.d, x, b, nu)
}

export function selesaikanAmg(A: CSR, b: Float64Array, tol = 1e-8, maks = 60) {
  const L = bangunHierarki(A)
  const x = new Float64Array(A.n)
  const nb = Math.sqrt(b.reduce((s, v) => s + v * v, 0)) || 1
  const res = () => { const r = kaliVektor(A, x); let s = 0; for (let i = 0; i < r.length; i++) s += (b[i] - r[i]) ** 2; return Math.sqrt(s) / nb }
  let rel = res(), siklus = 0
  while (rel > tol && siklus < maks) { vCycleAmg(L, 0, x, b); rel = res(); siklus++ }
  return { x, siklus, residualRelatif: rel, ukuranLevel: L.map((v) => v.A.n), hierarki: L }
}
