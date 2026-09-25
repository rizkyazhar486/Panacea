// Pengukuran jarak pada bidang MPR, dalam milimeter.
//
// Tiap bidang memakai jarak sumbunya sendiri: aksial (source) = kolom × baris
// piksel; dua bidang silang memakai jarak antar-irisan untuk sumbu vertikalnya.
// GAGAL TERTUTUP: bila jarak sumbu yang dipakai hanya asumsi 1 mm (Pixel Spacing
// tidak ada), tidak ada angka mm yang ditampilkan — angka yang salah skala lebih
// berbahaya daripada tidak ada angka. Jarak antar-irisan dari Slice Thickness
// (bukan posisi) ditandai perkiraan: tebal irisan tidak sama dengan jaraknya.
import type { BidangMpr, VolumeMpr } from './dicomMpr'

export interface TitikBidang { kolom: number; baris: number }
export type HasilUkur =
  | { ok: true; mm: number; perkiraan: boolean }
  | { ok: false; alasan: string }

export interface SkalaBidang { kolomMm: number; barisMm: number; sah: boolean; perkiraan: boolean }

/** Satu irisan tanpa volume: hanya Pixel Spacing miliknya sendiri. */
export function skalaIrisanTunggal(c: { jarakPiksel?: readonly number[] }): SkalaBidang {
  const [baris, kolom] = c.jarakPiksel ?? []
  const sah = Number.isFinite(baris) && Number.isFinite(kolom) && (baris as number) > 0 && (kolom as number) > 0
  return { kolomMm: sah ? (kolom as number) : 1, barisMm: sah ? (baris as number) : 1, sah, perkiraan: false }
}

export function skalaBidang(v: VolumeMpr, bidang: BidangMpr): SkalaBidang {
  const a = v.asalSpasi ?? { baris: 'asumsi', kolom: 'asumsi', iris: 'asumsi' }
  if (bidang === 'source') return { kolomMm: v.jarakKolomMm, barisMm: v.jarakBarisMm, sah: a.kolom === 'dicom' && a.baris === 'dicom', perkiraan: false }
  const irisSah = a.iris !== 'asumsi', perkiraan = a.iris === 'tebal-iris'
  if (bidang === 'cross-row') return { kolomMm: v.jarakKolomMm, barisMm: v.jarakIrisMm, sah: a.kolom === 'dicom' && irisSah, perkiraan }
  return { kolomMm: v.jarakBarisMm, barisMm: v.jarakIrisMm, sah: a.baris === 'dicom' && irisSah, perkiraan }
}

export function ukurJarak(v: VolumeMpr, bidang: BidangMpr, a: TitikBidang, b: TitikBidang): HasilUkur {
  return ukurDenganSkala(skalaBidang(v, bidang), a, b)
}

export function ukurDenganSkala(s: SkalaBidang, a: TitikBidang, b: TitikBidang): HasilUkur {
  if (!s.sah) return { ok: false, alasan: 'This series does not record the spacing needed on this plane, so no distance in mm is shown.' }
  const mm = Math.hypot((b.kolom - a.kolom) * s.kolomMm, (b.baris - a.baris) * s.barisMm)
  return { ok: true, mm, perkiraan: s.perkiraan }
}
