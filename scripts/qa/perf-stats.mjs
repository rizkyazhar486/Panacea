// F2 / Task 45 — statistik dan anggaran murni untuk audit performa (scripts/qa/perf-audit.mjs). Terpisah agar dapat diuji tanpa peramban.
// Acuan anggaran: ambang "baik" Web Vitals (web.dev): LCP ≤ 2500 ms, CLS ≤ 0,1, TBT ≤ 200 ms (TBT sebagai proksi lab untuk INP). Ini ACUAN metodologi,
// BUKAN klaim bahwa aplikasi memenuhinya di perangkat pengguna: runner CI berbeda dari perangkat nyata dan tidak ada data lapangan (RUM).
export const ANGGARAN = Object.freeze({ lcpMs: 2500, cls: 0.1, tbtMs: 200 })

/** Median; kosong atau berisi nilai bukan-angka-hingga → null (tidak dikarang). */
export function median(xs) {
  if (!Array.isArray(xs) || xs.length === 0 || xs.some((x) => typeof x !== 'number' || !Number.isFinite(x))) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Total Blocking Time: jumlah (durasi − 50 ms) dari tugas panjang yang dimulai setelah FCP. Masukan tak sah → null. */
export function totalBlockingTime(longTasks, fcpMs) {
  if (!Array.isArray(longTasks) || typeof fcpMs !== 'number' || !Number.isFinite(fcpMs) || fcpMs < 0) return null
  let tbt = 0
  for (const t of longTasks) {
    if (!t || typeof t.startTime !== 'number' || typeof t.duration !== 'number' || !Number.isFinite(t.startTime) || !Number.isFinite(t.duration) || t.duration < 0) return null
    if (t.startTime >= fcpMs && t.duration > 50) tbt += t.duration - 50
  }
  return tbt
}

/** Cumulative Layout Shift: jumlah pergeseran yang TIDAK didahului masukan pengguna. */
export function cumulativeLayoutShift(shifts) {
  if (!Array.isArray(shifts)) return null
  let cls = 0
  for (const s of shifts) {
    if (!s || typeof s.value !== 'number' || !Number.isFinite(s.value) || s.value < 0) return null
    if (!s.hadRecentInput) cls += s.value
  }
  return cls
}

/** Agregasi sampel per metrik: median dan nilai terburuk (maks); metrik yang tak terukur pada ada sampel mana pun → null (bukan 0). */
export function agregat(samples, metrik) {
  const nilai = samples.map((s) => s[metrik])
  return { median: median(nilai), maks: nilai.every((x) => typeof x === 'number' && Number.isFinite(x)) ? Math.max(...nilai) : null, n: samples.length }
}

/** Status terhadap anggaran: 'lulus' | 'melebihi' | 'tak-terukur'. Batas inklusif (nilai sama dengan anggaran lulus). */
export function statusAnggaran(metrik, nilai) {
  const batas = ANGGARAN[metrik]
  if (batas === undefined) throw new Error(`anggaran tidak dikenal: ${metrik}`)
  if (typeof nilai !== 'number' || !Number.isFinite(nilai) || nilai < 0) return 'tak-terukur'
  return nilai <= batas ? 'lulus' : 'melebihi'
}
