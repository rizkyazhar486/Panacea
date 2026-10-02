// Multigrid geometrik + AMG agregasi: sifat numerik terukur, bukan klaim.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { selesaikan } from '../../src/lib/multiskala/multigrid.ts'
import { selesaikanAmg, kaliVektor } from '../../src/lib/multiskala/amgAgregasi.ts'
import { laplacianModular, STATUS_GRAF_SINTETIS } from '../../src/lib/multiskala/grafSintetis.ts'
import { jalankanKopling, rerata } from '../../src/lib/multiskala/kernelKopling.ts'
import { modulMolekul, modulSel, PARAM_ILUSTRATIF as P, regangAwal } from '../../src/lib/multiskala/contohKatupJaringan.ts'
import { modulJaringanMultigrid, daftarkanKorektor, ambilKorektor } from '../../src/lib/multiskala/jaringanMultigrid.ts'

// 1. Solusi buatan u=sin(πx)sin(πy): orde dua (rasio galat ≈4) dan jumlah siklus bebas grid.
const siklus: number[] = []; let galatSebelum = 0
for (const n of [17, 33, 65, 129]) {
  const h = 1 / (n - 1), k = new Float64Array(n * n).fill(1), f = new Float64Array(n * n)
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) f[j * n + i] = 2 * Math.PI ** 2 * Math.sin(Math.PI * i * h) * Math.sin(Math.PI * j * h)
  const r = selesaikan({ n, h, k }, f, 1e-10)
  let e = 0; for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) e = Math.max(e, Math.abs(r.u[j * n + i] - Math.sin(Math.PI * i * h) * Math.sin(Math.PI * j * h)))
  if (galatSebelum) assert.ok(Math.abs(galatSebelum / e - 4) < 0.1, `bukan orde dua: rasio ${(galatSebelum / e).toFixed(2)} pada n=${n}`)
  galatSebelum = e; siklus.push(r.siklus)
  const fk = r.faktor.slice(1); assert.ok(fk.reduce((a, b) => a + b, 0) / fk.length < 0.2, `faktor konvergensi V-cycle terlalu besar pada n=${n}`)
}
assert.ok(Math.max(...siklus) - Math.min(...siklus) <= 2, `jumlah siklus tidak bebas grid: ${siklus}`)
assert.throws(() => selesaikan({ n: 20, h: 0.05, k: new Float64Array(400).fill(1) }, new Float64Array(400)), /2\^m\+1/)
assert.throws(() => selesaikan({ n: 17, h: 1 / 16, k: new Float64Array(289).fill(0) }, new Float64Array(289)), /positive/)

// 2. AMG pada graf modular sintetis: jauh lebih cepat dari Jacobi, agregat mengikuti komunitas.
const { A, label } = laplacianModular()
const b = new Float64Array(A.n).map((_, i) => Math.sin(i * 0.37) + (label[i] % 2 ? 1 : -0.5))
const amg = selesaikanAmg(A, b, 1e-8)
assert.ok(amg.residualRelatif < 1e-8 && amg.siklus <= 15, `AMG tidak konvergen cepat (${amg.siklus} siklus)`)
assert.ok(amg.ukuranLevel.length >= 3 && amg.ukuranLevel.every((v, i, a) => i === 0 || v < a[i - 1]), `hierarki AMG tidak mengasar: ${amg.ukuranLevel}`)
const agg = amg.hierarki[0].agregat!; const peta = new Map<number, Map<number, number>>()
for (let i = 0; i < A.n; i++) { const m = peta.get(agg[i]) ?? new Map(); m.set(label[i], (m.get(label[i]) ?? 0) + 1); peta.set(agg[i], m) }
let murni = 0; for (const m of peta.values()) murni += Math.max(...m.values())
assert.ok(murni / A.n > 0.85, `agregat tidak mengikuti struktur komunitas (kemurnian ${(murni / A.n).toFixed(2)})`)
const d = new Float64Array(A.n); for (let i = 0; i < A.n; i++) for (let p = A.rowPtr[i]; p < A.rowPtr[i + 1]; p++) if (A.col[p] === i) d[i] = A.val[p]
const x = new Float64Array(A.n); const nb = Math.sqrt(b.reduce((s, v) => s + v * v, 0)); let rel = 1
for (let it = 0; it < amg.siklus * 40; it++) { const Ax = kaliVektor(A, x); let s = 0; for (let i = 0; i < A.n; i++) { const ri = b[i] - Ax[i]; s += ri * ri; x[i] += 0.6 * ri / d[i] } rel = Math.sqrt(s) / nb }
assert.ok(rel > 1e-4, 'pembanding Jacobi mencapai toleransi AMG dengan anggaran setara — uji tidak bermakna')
assert.match(STATUS_GRAF_SINTETIS, /not human connectome data/)

// 3. Modul jaringan multigrid mematuhi kontrak dan kopling tetap terbatas.
const h = jalankanKopling([modulMolekul(P), modulSel(P), modulJaringanMultigrid(P)], 100, [regangAwal(P)])
const eps = h.pesanTerakhir['tissue.strain'].medan.nilai
assert.ok(eps.every((v) => Number.isFinite(v) && v >= 0) && rerata(eps) > 0, 'regangan multigrid tidak valid')

// 4. Slot korektor terlatih gagal tertutup.
assert.throws(() => ambilKorektor('tissue'), /no trained residual corrector/, 'mode hibrida berjalan tanpa korektor terlatih')
assert.throws(() => daftarkanKorektor({ id: 'x', versi: '1', artefak: { sha256: 'bukan-hash', dataLatih: 'x', metrikValidasi: { l2: 0.1 } }, koreksi: (u) => u }), /sha256/)
assert.throws(() => daftarkanKorektor({ id: 'x', versi: '1', artefak: { sha256: 'a'.repeat(64), dataLatih: '', metrikValidasi: { l2: 0.1 } }, koreksi: (u) => u }), /training data/)
assert.match(readFileSync('src/components/PanelKoplingMultiSkala.tsx', 'utf8'), /modulJaringanMultigrid\(p\)/)
console.log(`multigrid-amg: orde dua (rasio 4.0), siklus bebas grid ${siklus.join('/')}, AMG ${amg.siklus} siklus ${amg.ukuranLevel.join('→')}, kemurnian agregat ${(murni / A.n).toFixed(2)}, korektor gagal tertutup`)
