// Multigrid geometrik 2D untuk −∇·(k ∇u) = f (koefisien variabel), batas Dirichlet u=0.
//
// Dipakai sebagai solver "orde-rendah yang stabil" di kernel kopling: pondasi yang
// HARUS benar lebih dulu sebelum korektor residual terlatih (gaya HMgNO) boleh
// ditempel di atasnya. Semua klasik dan deterministik — tidak ada jaringan saraf.
//
// Komponen V-cycle standar:
//   smoother   : weighted Jacobi (ω=0.8) — ν1 pra, ν2 pasca;
//   residual   : r = f − A u (stensil 5-titik, koefisien rata-rata harmonik di muka sel);
//   restriksi  : full-weighting (stensil 1/16 [1 2 1; 2 4 2; 1 2 1]) pada grid (n−1)/2+1;
//   prolongasi : interpolasi bilinier;
//   grid kasar : koefisien di-restriksi (rata-rata) lalu diskretisasi ulang;
//   level kasar terakhir: banyak sapuan Gauss-Seidel.
// Grid simpul berukuran n×n dengan n = 2^m + 1.

export interface Grid { n: number; h: number; k: Float64Array }

const at = (n: number, i: number, j: number) => j * n + i
const harm = (a: number, b: number) => (2 * a * b) / (a + b)

export function operator(g: Grid, u: Float64Array, out: Float64Array) {
  const { n, h, k } = g
  const h2 = h * h
  out.fill(0)
  for (let j = 1; j < n - 1; j++) for (let i = 1; i < n - 1; i++) {
    const c = at(n, i, j), kc = k[c]
    const ke = harm(kc, k[c + 1]), kw = harm(kc, k[c - 1]), kn = harm(kc, k[c + n]), ks = harm(kc, k[c - n])
    out[c] = ((ke + kw + kn + ks) * u[c] - ke * u[c + 1] - kw * u[c - 1] - kn * u[c + n] - ks * u[c - n]) / h2
  }
}

function diagonal(g: Grid, c: number) {
  const { n, h, k } = g, kc = k[c]
  return (harm(kc, k[c + 1]) + harm(kc, k[c - 1]) + harm(kc, k[c + n]) + harm(kc, k[c - n])) / (h * h)
}

export function residual(g: Grid, u: Float64Array, f: Float64Array, r: Float64Array) {
  operator(g, u, r)
  for (let c = 0; c < r.length; c++) r[c] = f[c] - r[c]
  zeroBoundary(g.n, r)
}

function zeroBoundary(n: number, v: Float64Array) {
  for (let i = 0; i < n; i++) { v[i] = 0; v[(n - 1) * n + i] = 0; v[i * n] = 0; v[i * n + n - 1] = 0 }
}

export function jacobi(g: Grid, u: Float64Array, f: Float64Array, sapuan: number, omega = 0.8) {
  const r = new Float64Array(u.length)
  for (let s = 0; s < sapuan; s++) {
    residual(g, u, f, r)
    for (let j = 1; j < g.n - 1; j++) for (let i = 1; i < g.n - 1; i++) { const c = at(g.n, i, j); u[c] += (omega * r[c]) / diagonal(g, c) }
  }
}

function gaussSeidel(g: Grid, u: Float64Array, f: Float64Array, sapuan: number) {
  const { n, h, k } = g, h2 = h * h
  for (let s = 0; s < sapuan; s++) for (let j = 1; j < n - 1; j++) for (let i = 1; i < n - 1; i++) {
    const c = at(n, i, j), kc = k[c]
    const ke = harm(kc, k[c + 1]), kw = harm(kc, k[c - 1]), kn = harm(kc, k[c + n]), ks = harm(kc, k[c - n])
    u[c] = (f[c] * h2 + ke * u[c + 1] + kw * u[c - 1] + kn * u[c + n] + ks * u[c - n]) / (ke + kw + kn + ks)
  }
}

export function restriksi(nHalus: number, v: Float64Array): Float64Array {
  const nk = (nHalus - 1) / 2 + 1
  const out = new Float64Array(nk * nk)
  for (let J = 1; J < nk - 1; J++) for (let I = 1; I < nk - 1; I++) {
    const i = 2 * I, j = 2 * J
    out[at(nk, I, J)] = (4 * v[at(nHalus, i, j)]
      + 2 * (v[at(nHalus, i + 1, j)] + v[at(nHalus, i - 1, j)] + v[at(nHalus, i, j + 1)] + v[at(nHalus, i, j - 1)])
      + v[at(nHalus, i + 1, j + 1)] + v[at(nHalus, i - 1, j + 1)] + v[at(nHalus, i + 1, j - 1)] + v[at(nHalus, i - 1, j - 1)]) / 16
  }
  return out
}

export function prolongasi(nKasar: number, v: Float64Array): Float64Array {
  const nh = 2 * (nKasar - 1) + 1
  const out = new Float64Array(nh * nh)
  for (let j = 0; j < nh; j++) for (let i = 0; i < nh; i++) {
    const I = i / 2, J = j / 2, i0 = Math.floor(I), j0 = Math.floor(J)
    const i1 = Math.min(i0 + 1, nKasar - 1), j1 = Math.min(j0 + 1, nKasar - 1), fx = I - i0, fy = J - j0
    out[at(nh, i, j)] = (1 - fx) * (1 - fy) * v[at(nKasar, i0, j0)] + fx * (1 - fy) * v[at(nKasar, i1, j0)] + (1 - fx) * fy * v[at(nKasar, i0, j1)] + fx * fy * v[at(nKasar, i1, j1)]
  }
  zeroBoundary(nh, out)
  return out
}

function koefisienKasar(nHalus: number, k: Float64Array): Float64Array {
  const nk = (nHalus - 1) / 2 + 1
  const out = new Float64Array(nk * nk)
  for (let J = 0; J < nk; J++) for (let I = 0; I < nk; I++) {
    let s = 0, m = 0
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const i = 2 * I + di, j = 2 * J + dj
      if (i < 0 || j < 0 || i >= nHalus || j >= nHalus) continue
      s += k[at(nHalus, i, j)]; m++
    }
    out[at(nk, I, J)] = s / m
  }
  return out
}

export interface OpsiVCycle { nu1: number; nu2: number; nKasarMin: number }
const BAWAAN: OpsiVCycle = { nu1: 2, nu2: 2, nKasarMin: 5 }

/** Satu V-cycle rekursif; memperbarui u di tempat. */
export function vCycle(g: Grid, u: Float64Array, f: Float64Array, o: OpsiVCycle = BAWAAN) {
  if (g.n <= o.nKasarMin) { gaussSeidel(g, u, f, 50); return }
  jacobi(g, u, f, o.nu1)
  const r = new Float64Array(u.length)
  residual(g, u, f, r)
  const nk = (g.n - 1) / 2 + 1
  const gk: Grid = { n: nk, h: g.h * 2, k: koefisienKasar(g.n, g.k) }
  const rk = restriksi(g.n, r)
  const ek = new Float64Array(nk * nk)
  vCycle(gk, ek, rk, o)
  const e = prolongasi(nk, ek)
  for (let c = 0; c < u.length; c++) u[c] += e[c]
  jacobi(g, u, f, o.nu2)
}

export const norma = (v: Float64Array) => Math.sqrt(v.reduce((s, x) => s + x * x, 0) / v.length)

/** Selesaikan sampai ‖r‖/‖f‖ < tol; kembalikan riwayat faktor konvergensi. */
export function selesaikan(g: Grid, f: Float64Array, tol = 1e-8, maksSiklus = 30, o: OpsiVCycle = BAWAAN) {
  const n = g.n
  if (!Number.isInteger(Math.log2(n - 1))) throw new Error(`grid size must be 2^m+1 (got ${n})`)
  for (const v of g.k) if (!(v > 0) || !Number.isFinite(v)) throw new Error('coefficient must be positive and finite')
  const u = new Float64Array(n * n)
  const r = new Float64Array(n * n)
  const nf = norma(f) || 1
  const riwayat: number[] = []
  residual(g, u, f, r)
  let sebelum = norma(r)
  let siklus = 0
  while (sebelum / nf > tol && siklus < maksSiklus) {
    vCycle(g, u, f, o)
    residual(g, u, f, r)
    const kini = norma(r)
    riwayat.push(kini / sebelum)
    sebelum = kini
    siklus++
  }
  return { u, siklus, residualRelatif: sebelum / nf, faktor: riwayat }
}
