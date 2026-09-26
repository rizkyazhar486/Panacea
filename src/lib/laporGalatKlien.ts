// Pelapor galat runtime browser → POST /api/client-errors. Aman-privasi: hanya pesan
// terpangkas, nama dasar berkas, baris, rute hash tanpa query, nama fitur. Paling banyak
// MAKS laporan unik per sesi; kegagalan kirim diabaikan (telemetri tidak boleh merusak aplikasi).
export interface LaporanGalat { jenis: 'error' | 'rejection' | 'boundary'; pesan: string; berkas: string; baris: number; rute: string; fitur: string; versi: string }
export const MAKS_LAPORAN_PER_SESI = 5

export function buatPelapor(kirim: (l: LaporanGalat) => void, rute: () => string, versi = '') {
  const terkirim = new Set<string>()
  return (jenis: LaporanGalat['jenis'], pesan: unknown, berkas = '', baris = 0, fitur = '') => {
    const teks = (pesan instanceof Error ? `${pesan.name}: ${pesan.message}` : String(pesan ?? '')).slice(0, 200)
    const l: LaporanGalat = { jenis, pesan: teks, berkas: String(berkas).split(/[?#]/)[0].split('/').pop()?.slice(0, 80) ?? '', baris: Number.isInteger(baris) ? baris : 0, rute: rute().split('?')[0].slice(0, 120), fitur: fitur.slice(0, 60), versi }
    const tanda = `${l.jenis}|${l.pesan}|${l.berkas}|${l.baris}`
    if (terkirim.has(tanda) || terkirim.size >= MAKS_LAPORAN_PER_SESI) return false
    terkirim.add(tanda)
    try { kirim(l) } catch { /* telemetri tidak boleh melempar */ }
    return true
  }
}

let lapor: ReturnType<typeof buatPelapor> | null = null
export function laporGalat(jenis: LaporanGalat['jenis'], pesan: unknown, fitur = '') { lapor?.(jenis, pesan, '', 0, fitur) }

export function pasangPelaporGalat(apiBase: string, versi: string) {
  if (lapor || typeof window === 'undefined') return
  const url = `${apiBase}/api/client-errors`
  lapor = buatPelapor((l) => {
    const badan = JSON.stringify(l)
    if (navigator.sendBeacon?.(url, new Blob([badan], { type: 'application/json' }))) return
    void fetch(url, { method: 'POST', body: badan, headers: { 'content-type': 'application/json' }, keepalive: true }).catch(() => {})
  }, () => location.hash.replace(/^#/, '') || '/', versi)
  window.addEventListener('error', (e) => lapor?.('error', e.error ?? e.message, e.filename, e.lineno))
  window.addEventListener('unhandledrejection', (e) => lapor?.('rejection', e.reason))
}
