// Kebijakan frame untuk kanvas dekoratif InteractiveAura (hero landing). Murni dan deterministik:
// waktu disuntikkan sebagai parameter, tanpa DOM.
//
// Kenapa ada: setiap gambar ulang kanvas memaksa satu main frame penuh untuk SELURUH halaman
// (style, layout, commit, layerize). Diukur pada build produksi, 390x844, CPU 4x: loop 60 fps
// tanpa henti menyumbang sekitar 1 detik kerja main-thread per 3 detik setelah muat. Aura ini
// dekorasi, jadi ia boleh berhenti saat tidak terlihat atau saat pengguna meminta gerak dikurangi,
// dan cukup digambar paling banyak 30 kali per detik.

/** Jeda minimum antar gambar ulang aura: paling banyak 30 fps (jeda timer + menunggu vsync). */
export const AURA_FRAME_INTERVAL_MS = 1000 / 30

/** Fisika node aslinya ditulis per frame 60 fps; langkah ini menjaga kecepatan drift tetap sama. */
export const AURA_PHYSICS_STEP_MS = 1000 / 60

/** Batas langkah fisika per gambar, agar jeda panjang (tab kembali aktif) tidak membuat node melompat. */
export const AURA_MAX_PHYSICS_STEPS = 4

export type AuraMotionInput = {
  /** Kelas `.reduce-motion` di <html> (preferensi di Pengaturan aplikasi). */
  reduceMotionClass: boolean
  /** `(prefers-reduced-motion: reduce)` dari sistem operasi. */
  prefersReducedMotion: boolean
  /** Kanvas berpotongan dengan viewport. */
  onScreen: boolean
  /** `document.hidden`. */
  documentHidden: boolean
}

/** Aura hanya bergerak bila tidak ada preferensi gerak-dikurangi, terlihat, dan dokumen aktif. */
export function auraMayAnimate(input: AuraMotionInput): boolean {
  if (input.reduceMotionClass !== false) return false
  if (input.prefersReducedMotion !== false) return false
  if (input.onScreen !== true) return false
  if (input.documentHidden !== false) return false
  return true
}

/**
 * Berapa langkah fisika yang harus dijalankan untuk waktu yang berlalu sejak gambar terakhir.
 * Gagal tertutup: waktu tidak hingga, negatif, atau mundur menghasilkan 0 (tidak ada langkah).
 * Gambar pertama (`lastMs === null`) selalu satu langkah.
 */
export function auraPhysicsSteps(lastMs: number | null, nowMs: number): number {
  if (!Number.isFinite(nowMs) || nowMs < 0) return 0
  if (lastMs === null) return 1
  if (!Number.isFinite(lastMs) || lastMs < 0) return 0
  const elapsed = nowMs - lastMs
  if (elapsed <= 0) return 0
  return Math.min(AURA_MAX_PHYSICS_STEPS, Math.max(1, Math.round(elapsed / AURA_PHYSICS_STEP_MS)))
}
