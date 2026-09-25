// One Shape — satu permukaan yang berpindah dan berubah wujud mengikuti pilihan
// aktif, alih-alih setiap tombol menyalakan latarnya sendiri. Bahasa gerak ini
// berasal dari prototipe "one-shape" (pegas ω = 17 rad/s, ζ = 0,82).
//
// Pegas teredam per sumbu: a = ω²(target − x) − 2ζω·v, diintegrasikan dengan
// Euler semi-implisit. Integrasi (bukan rumus tertutup) dipakai karena target
// bisa berganti di tengah gerak; kecepatan yang sedang berjalan dipertahankan,
// sehingga bentuknya tidak pernah "melompat".

export const OMEGA_BAWAAN = 17
export const ZETA_BAWAAN = 0.82
/** Langkah integrasi terbesar; frame yang lebih panjang dipecah. */
const DT_MAKS = 1 / 120

export interface Kotak { x: number; y: number; w: number; h: number; r: number }
export type KeadaanPegas = { pos: Kotak; vel: Kotak }

const KUNCI: (keyof Kotak)[] = ['x', 'y', 'w', 'h', 'r']
const nol = (): Kotak => ({ x: 0, y: 0, w: 0, h: 0, r: 0 })

export function keadaanAwal(k: Kotak): KeadaanPegas {
  return { pos: { ...k }, vel: nol() }
}

export function langkahPegas(s: KeadaanPegas, target: Kotak, dt: number, omega = OMEGA_BAWAAN, zeta = ZETA_BAWAAN): KeadaanPegas {
  if (!(dt > 0) || !Number.isFinite(dt)) return s
  const pos = { ...s.pos }
  const vel = { ...s.vel }
  let sisa = Math.min(dt, 0.25) // tab tersembunyi lama: jangan meledak
  while (sisa > 1e-9) {
    const h = Math.min(sisa, DT_MAKS)
    for (const k of KUNCI) {
      const a = omega * omega * (target[k] - pos[k]) - 2 * zeta * omega * vel[k]
      vel[k] += a * h
      pos[k] += vel[k] * h
    }
    sisa -= h
  }
  return { pos, vel }
}

/** Diam bila setiap sumbu berada < 0,25 px dari target dan hampir tak bergerak. */
export function sudahDiam(s: KeadaanPegas, target: Kotak): boolean {
  return KUNCI.every((k) => Math.abs(s.pos[k] - target[k]) < 0.25 && Math.abs(s.vel[k]) < 2)
}
