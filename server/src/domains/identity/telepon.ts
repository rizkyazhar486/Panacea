// Normalisasi nomor telepon ke bentuk E.164.
//
// Berkas ini berdiri sendiri, dan itu disengaja. Sebelumnya fungsi ini tinggal
// di dalam modul OTP SMS Twilio, sehingga modul Connect — yang sama sekali
// tidak mengirim SMS — ikut menarik seluruh berkas berbayar itu hanya untuk
// merapikan sebuah nomor. Ketika layanan SMS berbayar dicabut, ketergantungan
// semacam itulah yang membuat pencabutan jadi berisiko.
//
// Yang dilakukan fungsi ini hanya MERAPIKAN BENTUK. Ia tidak membuktikan nomor
// itu milik siapa pun, tidak membuktikan nomornya aktif, dan tidak boleh
// diperlakukan sebagai bukti identitas di mana pun dalam aplikasi ini.

/**
 * Rapikan nomor Indonesia ke E.164 (+62…). Menerima 08xx, 62xx, dan +62xx.
 * Mengembalikan null bila bentuknya tidak masuk akal sebagai nomor telepon.
 */
export function normalizePhone(raw: string): string | null {
  let p = (raw || '').replace(/[\s-]/g, '')
  if (!p) return null
  if (p.startsWith('+')) return /^\+\d{8,15}$/.test(p) ? p : null
  if (p.startsWith('0')) p = '62' + p.slice(1)
  else if (!p.startsWith('62')) p = '62' + p
  return /^\d{9,15}$/.test(p) ? '+' + p : null
}
