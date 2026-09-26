// Galat runtime dari browser. Hanya diagnosis teknis: pesan dipangkas dan disamarkan
// (email, token/angka panjang, URL), berkas sumber hanya nama dasarnya, rute tanpa query.
// Tidak pernah: isi formulir, data klinis, identitas pengguna, stack lengkap.
export interface GalatKlien { jenis: 'error' | 'rejection' | 'boundary'; pesan: string; berkas: string; baris: number; rute: string; fitur: string; versi: string }

export function samarkan(t: string): string {
  return t
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email]')
    .replace(/https?:\/\/\S+/g, '[url]')
    .replace(/\b(Bearer\s+)?[A-Za-z0-9_-]{24,}\b/g, '[token]')
    .replace(/\d{4,}/g, '[n]')
}

const str = (v: unknown, n: number) => (typeof v === 'string' ? v : '').slice(0, n)
export function bersihkanGalatKlien(masuk: unknown): GalatKlien | null {
  if (!masuk || typeof masuk !== 'object') return null
  const m = masuk as Record<string, unknown>
  const jenis = m.jenis === 'error' || m.jenis === 'rejection' || m.jenis === 'boundary' ? m.jenis : null
  if (!jenis) return null
  const berkas = str(m.berkas, 200).split(/[?#]/)[0].split('/').pop() ?? ''
  const baris = Number.isInteger(m.baris) && (m.baris as number) >= 0 && (m.baris as number) < 1e7 ? (m.baris as number) : 0
  const rute = str(m.rute, 120).split('?')[0].replace(/\/[A-Za-z0-9_-]{16,}/g, '/:x')
  return { jenis, pesan: samarkan(str(m.pesan, 200)), berkas: samarkan(berkas).slice(0, 80), baris, rute: samarkan(rute), fitur: samarkan(str(m.fitur, 60)), versi: str(m.versi, 40).replace(/[^\w.-]/g, '') }
}

const terakhir: Array<GalatKlien & { at: string; jumlah: number }> = []
let total = 0
export function catatGalatKlien(g: GalatKlien, catat: (b: string) => void = (b) => console.log(b)) {
  total++
  const tanda = `${g.jenis}|${g.pesan}|${g.berkas}|${g.baris}`
  const ada = terakhir.find((x) => `${x.jenis}|${x.pesan}|${x.berkas}|${x.baris}` === tanda)
  if (ada) { ada.jumlah++; return }
  terakhir.push({ ...g, at: new Date().toISOString(), jumlah: 1 }); if (terakhir.length > 100) terakhir.shift()
  catat(JSON.stringify({ t: new Date().toISOString(), log: 'galat_klien', ...g }))
}
export function ringkasanGalatKlien() { return { total, unik: terakhir.length } }
export function daftarGalatKlien() { return terakhir.slice().reverse() }
export function aturUlangGalatKlien() { terakhir.length = 0; total = 0 }
