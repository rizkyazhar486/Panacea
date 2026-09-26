// Batas akses data klinis (pasien, rekam medis AI-EMR, vital, penunjang, edukasi).
//
// SEBELUMNYA: /api/clinical mengembalikan SELURUH simpanan klinis kepada siapa pun
// yang login, termasuk pasien, dan rute tulisnya menerima patientId apa pun.
// SEKARANG:
// - klinisi terverifikasi (peran efektif 'dokter') dan pemilik: data praktik, seperti
//   sebelumnya (model satu praktik);
// - selain itu: HANYA rekam "diri" yang terhubung ke akunnya sendiri.
//   Id primer = 'self-u-' + userId stabil dari server, sehingga perubahan surel
//   tidak membuat identitas pasien baru. Id berbasis surel lama tetap diterima
//   hanya sebagai alias kompatibilitas dan selalu harus resolve balik ke userId
//   yang sama (tabrakan gagal tertutup).
import type { Clinical } from './store.js'

export interface PenggunaAkses { id: string; email: string; role: string }

export const idPasienDiri = (userId: string) => `self-u-${userId.trim()}`
export const idPasienDiriLegacy = (email: string) => `self-${email.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16)}`

export function klinisiAtauPemilik(u: PenggunaAkses, pemilik: boolean): boolean {
  return pemilik || u.role === 'dokter' || u.role === 'owner'
}

export function bolehAksesPasien(
  u: PenggunaAkses, patientId: string, pemilik: boolean,
  cariPemilikRekamDiri: (patientId: string) => { id: string } | undefined,
  tertaut?: (patientId: string) => boolean,
): boolean {
  if (klinisiAtauPemilik(u, pemilik)) return true
  if (tertaut?.(patientId)) return true
  if (!patientId) return false
  const kandidat = new Set([idPasienDiri(u.id), idPasienDiriLegacy(u.email)])
  if (!kandidat.has(patientId)) return false
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

// ── Tautan pasien praktik ↔ akun pasien ─────────────────────────────────────
// Pasien yang dibuat dokter (id praktik acak) sebelumnya tidak pernah bisa
// terhubung ke akun pasiennya; satu-satunya jembatan adalah id 'self-' dari
// surel. Tautan kini EKSPLISIT dan DISETUJUI pasien:
// - klinisi menerbitkan kode sekali pakai (berlaku 7 hari) untuk satu pasien praktik;
// - server hanya menyimpan HASH kode; kode mentah hanya dikembalikan sekali;
// - pasien menebus kode dari akunnya sendiri -> tautan {pasienPraktik -> userId};
// - satu pasien praktik hanya tertaut ke satu akun; kode kedaluwarsa/terpakai gagal.
import { createHash, randomBytes } from 'node:crypto'

export interface KodeTaut { hash: string; patientId: string; dibuatOleh: string; dibuatPada: string; kedaluwarsa: string; dipakaiPada?: string; dipakaiOleh?: string }
export interface TautanPasien { patientId: string; userId: string; ditautkanPada: string; kodeDari: string }

export const MASA_KODE_TAUT_MS = 7 * 24 * 60 * 60_000
const ALFABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // tanpa 0/O/1/I/L
export const hashKode = (kode: string) => createHash('sha256').update(kode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')).digest('hex')

export function terbitkanKodeTaut(patientId: string, penerbit: { id: string; klinisi: boolean }, kini: Date, acak: (n: number) => Buffer = randomBytes):
  { ok: true; kode: string; catatan: KodeTaut } | { ok: false; alasan: 'not-clinician' | 'no-patient' } {
  if (!penerbit.klinisi) return { ok: false, alasan: 'not-clinician' }
  if (!patientId || patientId.startsWith('self-')) return { ok: false, alasan: 'no-patient' }
  const b = acak(10)
  const mentah = Array.from(b, (x) => ALFABET[x % ALFABET.length]).join('')
  const kode = `${mentah.slice(0, 5)}-${mentah.slice(5)}`
  return { ok: true, kode, catatan: { hash: hashKode(kode), patientId, dibuatOleh: penerbit.id, dibuatPada: kini.toISOString(), kedaluwarsa: new Date(kini.getTime() + MASA_KODE_TAUT_MS).toISOString() } }
}

export function tebusKodeTaut(kode: string, pengguna: { id: string }, daftarKode: readonly KodeTaut[], tautan: Record<string, TautanPasien>, kini: Date):
  { ok: true; tautan: TautanPasien; kodeHash: string } | { ok: false; alasan: 'invalid' | 'expired' | 'used' | 'already-linked' } {
  const h = hashKode(kode ?? '')
  const k = daftarKode.find((x) => x.hash === h)
  if (!k) return { ok: false, alasan: 'invalid' }
  if (k.dipakaiPada) return { ok: false, alasan: 'used' }
  if (Date.parse(k.kedaluwarsa) <= kini.getTime()) return { ok: false, alasan: 'expired' }
  const ada = tautan[k.patientId]
  if (ada && ada.userId !== pengguna.id) return { ok: false, alasan: 'already-linked' }
  return { ok: true, kodeHash: h, tautan: { patientId: k.patientId, userId: pengguna.id, ditautkanPada: kini.toISOString(), kodeDari: k.dibuatOleh } }
}

/** Akses pasien lewat tautan eksplisit (selain rekam diri). */
export function tertautKe(u: { id: string }, patientId: string, tautan: Record<string, TautanPasien> | undefined): boolean {
  return Boolean(patientId && tautan?.[patientId]?.userId === u.id)
}

/**
 * Status tautan untuk sisi dokter: hanya boolean + kapan, TANPA userId pasien
 * (dokter tidak perlu tahu akun mana; membocorkannya tidak menambah kegunaan
 * dan melanggar batas privasi tautan yang eksplisit-disetujui-pasien).
 */
export function statusTautanPasien(patientId: string, tautan: Record<string, TautanPasien> | undefined): { linked: boolean; linkedAt?: string } {
  const t = tautan?.[patientId]
  return t ? { linked: true, linkedAt: t.ditautkanPada } : { linked: false }
}
