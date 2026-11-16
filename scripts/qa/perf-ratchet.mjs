// F2 / Task 45 — gerbang ratchet performa (murni, tanpa peramban) untuk scripts/qa/perf-audit.mjs.
// Yang DIGERBANG hanya metrik yang stabil antar-run CI pada build yang sama (diamati di run 43489708796 dan 43529922257):
//   bytesJs (median, byte JS yang dimuat), requests (median), cls (median). Ketiganya ditentukan terutama oleh kode, bukan oleh beban runner.
// Yang TIDAK digerbang: LCP dan TBT. Pada dua run main berturut-turut TBT desktop chatbot 441 ms vs 109 ms dan TBT landing mobile 1411 vs 1221 ms
// tanpa perubahan kode yang relevan — gerbang pada angka itu akan gagal acak. Keduanya tetap dilaporkan terhadap anggaran Web Vitals (perf-stats.mjs).
// Fail-closed: baseline tidak ada/tidak valid, halaman baseline tidak terukur, atau halaman terukur tanpa baseline → gagal.

export const TOLERANSI = Object.freeze({ bytesJsRasio: 1.03, requestsTambah: 3, clsTambah: 0.02 })
const KUNCI_BASELINE = ['bytesJs', 'requests', 'cls']

const angkaSah = (x) => typeof x === 'number' && Number.isFinite(x) && x >= 0
export const kunciPengukuran = (r) => `${r.viewport}|${r.halaman}`

/** Validasi bentuk baseline. Mengembalikan pesan galat atau null. */
export function masalahBaseline(baseline) {
  if (!baseline || typeof baseline !== 'object' || !baseline.halaman || typeof baseline.halaman !== 'object' || Array.isArray(baseline.halaman)) return 'PERF_BASELINE tidak ada atau tidak valid: gerbang tidak dapat dinilai (fail-closed)'
  const entri = Object.entries(baseline.halaman)
  if (entri.length === 0) return 'PERF_BASELINE kosong: gerbang tidak dapat dinilai (fail-closed)'
  for (const [k, v] of entri) {
    if (!v || typeof v !== 'object') return `PERF_BASELINE ${k}: entri tidak valid`
    for (const m of KUNCI_BASELINE) if (!angkaSah(v[m])) return `PERF_BASELINE ${k}: ${m} tidak valid`
  }
  return null
}

/** Bandingkan hasil perf-audit (array {viewport, halaman, agg}) dengan baseline. Kosong = lulus. */
export function bandingkanPerf(hasil, baseline, toleransi = TOLERANSI) {
  const masalah = masalahBaseline(baseline)
  if (masalah) return [masalah]
  if (!Array.isArray(hasil) || hasil.length === 0) return ['tidak ada hasil pengukuran: gerbang tidak dapat dinilai (fail-closed)']
  const gagal = []
  const terukur = new Set()
  for (const r of hasil) {
    const k = kunciPengukuran(r)
    if (terukur.has(k)) { gagal.push(`${k}: pengukuran ganda`); continue }
    terukur.add(k)
    const b = baseline.halaman[k]
    if (!b) { gagal.push(`${k}: halaman terukur tanpa baseline (tambahkan ke PERF_BASELINE dengan bukti run CI)`); continue }
    const nilai = (m) => r?.agg?.[m]?.median
    const js = nilai('bytesJs'); const req = nilai('requests'); const cls = nilai('cls')
    if (!angkaSah(js)) gagal.push(`${k}: bytesJs tidak terukur`)
    else if (js > b.bytesJs * toleransi.bytesJsRasio) gagal.push(`${k}: bytesJs ${js} > baseline ${b.bytesJs} x ${toleransi.bytesJsRasio}`)
    if (!angkaSah(req)) gagal.push(`${k}: requests tidak terukur`)
    else if (req > b.requests + toleransi.requestsTambah) gagal.push(`${k}: requests ${req} > baseline ${b.requests} + ${toleransi.requestsTambah}`)
    if (!angkaSah(cls)) gagal.push(`${k}: cls tidak terukur`)
    else if (cls > b.cls + toleransi.clsTambah + 1e-9) gagal.push(`${k}: cls ${cls.toFixed(3)} > baseline ${b.cls} + ${toleransi.clsTambah}`)
  }
  for (const k of Object.keys(baseline.halaman)) if (!terukur.has(k)) gagal.push(`${k}: ada di baseline tetapi tidak diukur`)
  return gagal
}
