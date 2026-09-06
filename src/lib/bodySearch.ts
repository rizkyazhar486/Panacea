// ─────────────────────────────────────────────────────────────────────────────
// PENCARIAN STRUKTUR TUBUH.
//
// Model tubuh utuh memuat 2.587 struktur bernama, dan sampai sekarang
// satu-satunya cara menemukannya adalah mengetuknya di layar. Artinya struktur
// DI DALAM tubuh — justru yang paling ingin dicari orang — praktis tidak dapat
// ditemukan sama sekali: ia tertutup lapisan di atasnya, dan tidak ada daftar
// yang bisa dibuka.
//
// Yang dicari di sini hanya nama yang BENAR-BENAR ADA di dalam berkas
// geometrinya. Hasil pencarian yang tidak menuju ke struktur mana pun lebih
// buruk daripada hasil kosong: ia membuat pengguna mengira struktur itu ada
// dan sedang gagal ditampilkan.
// ─────────────────────────────────────────────────────────────────────────────

import { INDEKS_TUBUH, type StrukturTubuh } from './bodyIndex.gen'

export type { StrukturTubuh }
export { INDEKS_TUBUH }

export interface SaringTubuh {
  lapisan?: StrukturTubuh['l'] | null
  wilayah?: string | null
  sisi?: StrukturTubuh['s'] | null
}

/**
 * Skor kecocokan teks.
 *
 * Awal nama diberi bobot jauh lebih tinggi daripada tengah nama: seseorang yang
 * mengetik "tibia" mencari tulang tibia, bukan "Anterior tibial artery" yang
 * kebetulan memuat kata itu. Tanpa pembobotan ini, struktur yang namanya paling
 * panjang selalu menang, dan yang dicari justru tenggelam.
 */
export function skorTeks(nama: string, kueri: string): number {
  const n = nama.toLowerCase()
  const k = kueri.toLowerCase().trim()
  if (!k) return 0
  if (n === k) return 1000
  if (n.startsWith(k)) return 500 - n.length
  // Awal kata di tengah nama, mis. "tibial" di "Anterior tibial artery".
  const kata = n.split(/[\s,()-]+/)
  if (kata.some((w) => w.startsWith(k))) return 250 - n.length
  if (n.includes(k)) return 100 - n.length
  return 0
}

export interface HasilCari {
  struktur: StrukturTubuh
  skor: number
}

/**
 * Mencari struktur. Beberapa kata dicocokkan sebagai DAN, bukan ATAU: "left
 * femoral artery" harus menyempit ke satu struktur, bukan melebar ke setiap
 * struktur yang memuat kata "left".
 */
export function cariTubuh(kueri: string, saring: SaringTubuh = {}, maks = 40): HasilCari[] {
  const kata = kueri.toLowerCase().trim().split(/\s+/).filter(Boolean)
  const hasil: HasilCari[] = []
  for (const s of INDEKS_TUBUH) {
    if (saring.lapisan && s.l !== saring.lapisan) continue
    if (saring.wilayah && s.w !== saring.wilayah) continue
    if (saring.sisi && s.s !== saring.sisi) continue
    if (!kata.length) { hasil.push({ struktur: s, skor: 1 }); continue }
    let total = 0
    let semuaCocok = true
    for (const k of kata) {
      // Sisi tubuh dicari lewat kata biasa ("left", "kiri") walaupun di dalam
      // berkas ia hanya berupa akhiran ".l" yang tidak akan pernah diketik.
      if ((k === 'left' || k === 'kiri') && s.s === 'kiri') { total += 60; continue }
      if ((k === 'right' || k === 'kanan') && s.s === 'kanan') { total += 60; continue }
      const skor = skorTeks(s.b, k)
      if (skor <= 0) { semuaCocok = false; break }
      total += skor
    }
    if (semuaCocok && total > 0) hasil.push({ struktur: s, skor: total })
  }
  return hasil.sort((a, b) => b.skor - a.skor || a.struktur.b.localeCompare(b.struktur.b)).slice(0, maks)
}

/** Berapa struktur per lapisan — dipakai untuk mengatakan cakupannya apa adanya. */
export function cakupanTubuh(): Record<string, number> {
  const out: Record<string, number> = {}
  for (const s of INDEKS_TUBUH) out[s.l] = (out[s.l] ?? 0) + 1
  return out
}

/** Struktur berpasangan kiri-kanan digabung agar keduanya bisa disorot sekaligus. */
export function pasangan(s: StrukturTubuh): string[] {
  if (s.s === 'tengah') return [s.n]
  return INDEKS_TUBUH.filter((x) => x.b === s.b && x.l === s.l).map((x) => x.n)
}

/** Nama yang enak dibaca: "Femur.r" -> "Femur (right)". */
export function namaTampil(s: StrukturTubuh): string {
  const dasar = s.b.charAt(0).toUpperCase() + s.b.slice(1)
  return s.s === 'tengah' ? dasar : `${dasar} (${s.s === 'kiri' ? 'left' : 'right'})`
}
