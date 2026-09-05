// ─────────────────────────────────────────────────────────────────────────────
// Bentuk gelombang untuk gerak fisiologis pada model 3D.
//
// Dipisahkan dari Body3D.tsx supaya bisa DIUJI. Perhitungannya sebelumnya
// tertanam di dalam loop render, dan satu-satunya cara memeriksanya adalah
// melihat layar — padahal justru sifat yang paling penting (bahwa peristaltik
// MENJALAR dan denyut arteri TERTUNDA) tidak kelihatan dari satu tangkapan
// layar, dan tidak dapat diperiksa sama sekali dari sandbox tanpa GPU.
//
// Ketiganya sengaja BUKAN sinus. Bentuk gelombangnya membawa isi fisiologisnya:
// sistol lebih cepat daripada diastol, inspirasi lebih pendek daripada
// ekspirasi, dan peristaltik hanya meremas sebagian kecil saluran pada satu
// saat sementara sisanya melebar menerima isinya.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Seberapa jauh fase digeser dari ujung atas saluran ke ujung bawah, dalam
 * satuan siklus.
 *
 * HARUS di bawah 1. Nilai 1,5 yang dipakai lebih dulu membuat gelombangnya
 * melilit lebih dari satu putaran di sepanjang saluran, sehingga pada satu
 * saat ada LEBIH DARI SATU remasan dan arah jalarnya terbaca ambigu — ruas
 * distal bahkan tampak meremas lebih dulu daripada ruas proksimal. Peristaltik
 * sungguhan menjalar satu arah, dari lambung ke anus.
 *
 * Ditemukan oleh pengujian, bukan dengan melihat layar: sifat ini justru tidak
 * kelihatan dari satu tangkapan gambar.
 */
export const SEBAR_PERISTALTIK = 0.85

/** Faktor skala jantung. fase 0..1 dalam satu siklus. */
export function gelombangJantung(fase: number): number {
  const f = ((fase % 1) + 1) % 1
  // Sistol menempati kira-kira sepertiga awal dan berlangsung cepat; sisanya
  // diastol yang mengisi lebih lambat.
  const kontraksi = f < 0.33
    ? Math.sin((f / 0.33) * Math.PI)
    : -0.15 * Math.sin(((f - 0.33) / 0.67) * Math.PI)
  return 1 - kontraksi * 0.07
}

/** Faktor skala paru. Inspirasi aktif dan pendek, ekspirasi pasif dan panjang. */
export function gelombangNapas(fase: number): number {
  const f = ((fase % 1) + 1) % 1
  const kembang = f < 0.4
    ? Math.sin((f / 0.4) * (Math.PI / 2))
    : Math.cos(((f - 0.4) / 0.6) * (Math.PI / 2))
  return 1 + kembang * 0.05
}

/**
 * Faktor skala satu ruas usus.
 *
 * `posisi` 0 di ujung atas saluran (lambung), 1 di ujung bawah (rektum).
 * Selisih fase menurut posisi itulah yang membuat gelombangnya MENJALAR,
 * bukan seluruh usus meremas serempak.
 */
export function gelombangPeristaltik(waktuSiklus: number, posisi: number): number {
  const f = (((waktuSiklus - posisi * SEBAR_PERISTALTIK) % 1) + 1) % 1
  // Gelombangnya sempit: hanya sebagian kecil saluran meremas pada satu saat.
  const remas = f > 0 && f < 0.25 ? Math.sin((f / 0.25) * Math.PI) : 0
  return 1 - remas * 0.12
}

/**
 * Faktor skala satu arteri.
 *
 * `jedaDetik` adalah waktu tempuh gelombang nadi dari jantung ke pembuluh itu.
 * Karena itu arteri di tungkai berdenyut SESUDAH aorta, bukan bersamaan.
 */
export function gelombangNadi(waktuDetik: number, periodeDetik: number, jedaDetik: number): number {
  if (periodeDetik <= 0) return 1
  const f = ((((waktuDetik - jedaDetik) % periodeDetik) + periodeDetik) % periodeDetik) / periodeDetik
  // Naik cepat, turun perlahan — bentuk gelombang nadi, bukan sinus.
  const nadi = f < 0.2 ? Math.sin((f / 0.2) * Math.PI) : 0
  return 1 + nadi * 0.035
}
