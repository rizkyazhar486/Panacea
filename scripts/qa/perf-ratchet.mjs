// F2 / Task 45 — gerbang ratchet performa untuk scripts/qa/perf-audit.mjs. Murni: tanpa fs, jam, jaringan, atau peramban.
// Kenapa byte JS per rute, bukan TBT/LCP: waktu di runner CI berderau (TBT mobile historis 204-1592 ms), sehingga menggerbang detik akan flaky
// atau memaksa toleransi selebar itu hingga tak bermakna. Byte JS yang benar-benar dimuat sebuah rute (encodedBodySize, build produksi,
// `vite preview` tanpa kompresi) bergantung pada build, bukan mesin; ia menangkap regresi lazy-load/pemisahan chunk yang menjadi penyebab utama
// TBT mobile. TBT/LCP/CLS tetap DILAPORKAN terhadap acuan Web Vitals, tidak digerbang — ini bukan klaim bahwa anggaran waktu terpenuhi.
// Aturan: setiap pasangan viewport/halaman yang diukur wajib punya batas; median bytesJs <= floor(batas x (1 + toleransiByte)) dan
// median requests <= batas + toleransiRequest; median tak terukur, entri baseline yang hilang dari pengukuran, atau baseline cacat = GAGAL (fail-closed).

export const kunciPerf = (viewport, halaman) => `${viewport}/${halaman}`

const bilBulatPositif = (x) => Number.isSafeInteger(x) && x > 0

/** Validasi baseline; mengembalikan daftar masalah (kosong = sah). */
export function masalahBaselinePerf(baseline) {
  if (!baseline || typeof baseline !== 'object' || Array.isArray(baseline)) return ['baseline bukan objek']
  const m = []
  const { toleransiByte, toleransiRequest, batas } = baseline
  if (typeof toleransiByte !== 'number' || !Number.isFinite(toleransiByte) || toleransiByte < 0 || toleransiByte > 0.1) m.push('toleransiByte harus angka 0..0,1')
  if (!Number.isSafeInteger(toleransiRequest) || toleransiRequest < 0 || toleransiRequest > 5) m.push('toleransiRequest harus bilangan bulat 0..5')
  if (!batas || typeof batas !== 'object' || Array.isArray(batas) || Object.keys(batas).length === 0) { m.push('batas kosong atau bukan objek'); return m }
  for (const [k, v] of Object.entries(batas)) {
    if (!/^[^/\s]+\/[^/\s]+$/.test(k)) m.push(`kunci batas tidak sah: ${k}`)
    if (!v || typeof v !== 'object' || !bilBulatPositif(v.bytesJs) || !bilBulatPositif(v.requests)) m.push(`batas ${k} wajib bytesJs dan requests bilangan bulat positif`)
  }
  return m
}

/**
 * Bandingkan hasil perf-audit dengan baseline.
 * hasil: [{ viewport, halaman, agg: { bytesJs: { median }, requests: { median } } }]
 * → { ok, pelanggaran: [{ kunci, jenis, metrik?, terukur?, batas? }], saranTurun: [{ kunci, metrik, terukur, batas }] }
 */
export function bandingkanPerf(hasil, baseline) {
  const masalah = masalahBaselinePerf(baseline)
  if (masalah.length) return { ok: false, pelanggaran: masalah.map((pesan) => ({ kunci: '-', jenis: 'baseline-cacat', pesan })), saranTurun: [] }
  if (!Array.isArray(hasil) || hasil.length === 0) return { ok: false, pelanggaran: [{ kunci: '-', jenis: 'tanpa-pengukuran' }], saranTurun: [] }
  const pelanggaran = []
  const saranTurun = []
  const terlihat = new Set()
  for (const r of hasil) {
    const kunci = kunciPerf(r?.viewport, r?.halaman)
    if (terlihat.has(kunci)) { pelanggaran.push({ kunci, jenis: 'duplikat' }); continue }
    terlihat.add(kunci)
    const b = baseline.batas[kunci]
    if (!b) { pelanggaran.push({ kunci, jenis: 'tanpa-baseline' }); continue }
    const aturan = [
      ['bytesJs', Math.floor(b.bytesJs * (1 + baseline.toleransiByte)), b.bytesJs * (1 - baseline.toleransiByte)],
      ['requests', b.requests + baseline.toleransiRequest, b.requests - baseline.toleransiRequest],
    ]
    for (const [metrik, maks, bawah] of aturan) {
      const x = r?.agg?.[metrik]?.median
      if (typeof x !== 'number' || !Number.isFinite(x) || x < 0) { pelanggaran.push({ kunci, jenis: 'tak-terukur', metrik }); continue }
      if (x > maks) pelanggaran.push({ kunci, jenis: 'melebihi', metrik, terukur: x, batas: maks })
      else if (x < bawah) saranTurun.push({ kunci, metrik, terukur: x, batas: b[metrik] })
    }
  }
  for (const kunci of Object.keys(baseline.batas)) if (!terlihat.has(kunci)) pelanggaran.push({ kunci, jenis: 'hilang-dari-pengukuran' })
  return { ok: pelanggaran.length === 0, pelanggaran, saranTurun }
}
