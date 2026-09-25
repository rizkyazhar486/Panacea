// Batas akses data klinis (pasien, rekam medis AI-EMR, vital, penunjang, edukasi).
//
// SEBELUMNYA: /api/clinical mengembalikan SELURUH simpanan klinis kepada siapa pun
// yang login, termasuk pasien, dan rute tulisnya menerima patientId apa pun.
// SEKARANG:
// - klinisi terverifikasi (peran efektif 'dokter') dan pemilik: data praktik, seperti
//   sebelumnya (model satu praktik);
// - selain itu: HANYA rekam "diri" yang terhubung ke akunnya sendiri. Id rekam diri
//   = 'self-' + 16 alfanumerik pertama surel — skema yang bisa bertabrakan, jadi
//   akses juga mensyaratkan pencarian balik menunjuk pengguna yang SAMA (tabrakan
//   gagal tertutup).
import type { Clinical } from './store.js'

export interface PenggunaAkses { id: string; email: string; role: string }

export const idPasienDiri = (email: string) => `self-${email.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16)}`

export function klinisiAtauPemilik(u: PenggunaAkses, pemilik: boolean): boolean {
  return pemilik || u.role === 'dokter' || u.role === 'owner'
}

export function bolehAksesPasien(
  u: PenggunaAkses, patientId: string, pemilik: boolean,
  cariPemilikRekamDiri: (patientId: string) => { id: string } | undefined,
): boolean {
  if (klinisiAtauPemilik(u, pemilik)) return true
  if (!patientId || patientId !== idPasienDiri(u.email)) return false
  return cariPemilikRekamDiri(patientId)?.id === u.id
}

/** Salinan simpanan klinis yang hanya berisi pasien yang boleh diakses. */
export function saringKlinis(c: Clinical, boleh: (patientId: string) => boolean): Clinical {
  const pilih = <T,>(o: Record<string, T>) => Object.fromEntries(Object.entries(o).filter(([k]) => boleh(k)))
  return {
    patients: c.patients.filter((p) => boleh(String(p?.id ?? ''))),
    vitals: pilih(c.vitals), supportive: pilih(c.supportive), records: pilih(c.records), education: pilih(c.education), encounters: pilih(c.encounters ?? {}),
  }
}
