// Logika murni Kartu Darurat: tanpa DOM, tanpa Date.now() tersembunyi, tanpa jaringan.
// Semua keputusan "apa yang boleh jadi tautan telepon / peta / teks bagikan" ada di sini
// supaya bisa diuji; komponen hanya merender hasilnya.

/** Nomor darurat bawaan bila pengguna belum mengisi (112 berlaku di banyak negara). */
export const DEFAULT_EMERGENCY_NUMBER = '112'

/**
 * Bersihkan masukan bebas menjadi nomor telepon yang aman untuk `tel:`.
 * Hanya digit, spasi, tanda hubung, titik, tanda kurung dan satu '+' di awal yang diterima; selain itu
 * ditolak seluruhnya (null). Kosong/tak bermakna -> null.
 */
export function sanitizePhone(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const t = raw.trim()
  // Gagal tertutup: huruf, titik koma (parameter tel:), skema lain, atau '+' di tengah = ditolak seluruhnya.
  // Membuang karakter diam-diam akan menelepon NOMOR LAIN dari yang diketik orang; menolak jatuh ke 112.
  if (!/^\+?[0-9\-. ()]+$/.test(t)) return null
  const body = t.replace(/[^0-9]/g, '')
  return body.length >= 2 && body.length <= 20 ? (t.startsWith('+') ? '+' : '') + body : null
}

/** Tautan tel: untuk nomor darurat lokal; jatuh ke 112 bila kosong atau tak valid. */
export function emergencyTelHref(raw: unknown): string {
  return `tel:${sanitizePhone(raw) ?? DEFAULT_EMERGENCY_NUMBER}`
}

/** Nomor yang DITAMPILKAN pada tombol; harus sama dengan yang akan dipanggil. */
export function emergencyDisplayNumber(raw: unknown): string {
  return sanitizePhone(raw) ?? DEFAULT_EMERGENCY_NUMBER
}

/** Tautan tel: untuk kontak darurat; null bila tidak valid (tombol tidak ditampilkan). */
export function contactTelHref(raw: unknown): string | null {
  const n = sanitizePhone(raw)
  return n ? `tel:${n}` : null
}

/**
 * Umur dalam tahun penuh menurut KALENDER (UTC); null bila tanggal lahir kosong, tak valid, atau di masa depan.
 * Versi lama membagi selisih milidetik dengan 365,25 hari sehingga pada hari ulang tahun bisa tampil kurang satu
 * tahun; di kartu medis itu tidak dapat diterima. Zona waktu: UTC, selisih paling banyak satu hari di sekitar tengah malam.
 */
export function ageYears(dob: unknown, nowMs: number): number | null {
  if (typeof dob !== 'string' || !dob || !Number.isFinite(nowMs)) return null
  const born = new Date(dob).getTime()
  if (!Number.isFinite(born) || born > nowMs) return null
  const b = new Date(born)
  const n = new Date(nowMs)
  let years = n.getUTCFullYear() - b.getUTCFullYear()
  if (n.getUTCMonth() < b.getUTCMonth() || (n.getUTCMonth() === b.getUTCMonth() && n.getUTCDate() < b.getUTCDate())) years -= 1
  return years >= 0 && years <= 150 ? years : null
}

/** Tautan peta; null bila koordinat tidak terbatas atau di luar rentang bumi. */
export function mapsUrl(latitude: unknown, longitude: unknown): string | null {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null
  return `https://maps.google.com/?q=${latitude},${longitude}`
}

export interface ShareInput { name: string; url: string; bloodType: string; allergies: string }

/** Teks bagikan; format identik dengan versi sebelumnya (uji regresi mengunci ini). */
export function emergencyShareText(i: ShareInput): string {
  return `🚨 EMERGENCY — ${i.name || 'I'} need help. My location: ${i.url}${i.bloodType ? ` · Blood type ${i.bloodType}` : ''}${i.allergies ? ` · Allergies: ${i.allergies}` : ''}`
}
