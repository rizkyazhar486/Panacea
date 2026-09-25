// Bidang potong miring bebas untuk volume 3D.
//
// Bidang ditentukan oleh normal n (dari sudut kemiringan dan putaran) dan jarak
// d dari pusat volume. Voksel dengan dot(p, n) > d dibuang (sisi "depan" bidang).
// Ruang koordinat = kotak volume ternormalisasi [-0.5, 0.5]^3; jadi d dibatasi
// ±sqrt(3)/2, jarak sudut kotak terjauh dari pusat.
export const JARAK_MAKS = Math.sqrt(3) / 2

export interface BidangMiring { aktif: boolean; kemiringanDerajat: number; putaranDerajat: number; posisi: number }

export const BIDANG_AWAL: BidangMiring = { aktif: false, kemiringanDerajat: 30, putaranDerajat: 0, posisi: 0 }

/** Normal satuan: kemiringan dari sumbu Z ke bidang XY, putaran mengelilingi Z. */
export function normalBidang(b: BidangMiring): [number, number, number] {
  const t = (b.kemiringanDerajat * Math.PI) / 180, r = (b.putaranDerajat * Math.PI) / 180
  return [Math.sin(t) * Math.cos(r), Math.sin(t) * Math.sin(r), Math.cos(t)]
}

export function jarakBidang(b: BidangMiring): number {
  return Math.max(-JARAK_MAKS, Math.min(JARAK_MAKS, b.posisi))
}

/** Titik (ruang kotak) dipertahankan? Sama persis dengan uji di shader. */
export function dipertahankan(p: readonly [number, number, number], b: BidangMiring): boolean {
  if (!b.aktif) return true
  const n = normalBidang(b)
  return p[0] * n[0] + p[1] * n[1] + p[2] * n[2] <= jarakBidang(b)
}
