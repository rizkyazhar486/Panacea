// Pengukuran yang dilakukan berkala, bukan tiap hari — dan jadwal skrining.
//
// MENGAPA DIPISAH DARI VITALS. Angka dari perangkat masuk sendiri setiap hari;
// yang di sini justru sebaliknya: diukur sengaja, jarang, dan nilainya baru
// bermakna sebagai perbandingan antar-pengukuran yang berjauhan. Menyimpannya
// bersama bacaan harian akan menenggelamkannya.
//
// DUA PENGUKURAN YANG DIPILIH, dan alasannya bukan karena mudah:
//   · KEKUATAN GENGGAM berulang kali muncul pada penelitian kohor besar
//     sebagai penanda yang menyertai kematian dan kemandirian di usia lanjut.
//     Ia tidak mengukur "usia biologis" — ia mengukur kekuatan genggam, dan
//     itulah yang ditulis.
//   · BERDIRI SATU KAKI menguji keseimbangan, yang menurun lebih cepat
//     daripada yang disadari orang dan berhubungan dengan risiko jatuh. Sekali
//     lagi: yang diukur lamanya berdiri, bukan ramalan apa pun.
//
// JADWAL SKRINING DITULIS SENDIRI OLEH PEMAKAINYA. Aplikasi ini tidak
// menentukan siapa perlu diperiksa apa dan sejak umur berapa — anjuran itu
// berbeda antar-negara dan antar-orang, dan menentukannya sendiri berarti
// memberi nasihat medis tanpa mengetahui riwayatnya. Yang dikerjakan di sini
// hanya mengingat jarak yang sudah disepakati pemakainya dengan dokternya.

export interface Ukur {
  id: string
  jenis: 'genggam' | 'keseimbangan'
  /** yyyy-mm-dd */
  tanggal: string
  /** kg untuk genggam, detik untuk keseimbangan. */
  nilai: number
  /** Sisi tubuh, hanya untuk genggam. */
  sisi?: 'kanan' | 'kiri'
}

export interface Skrining {
  id: string
  nama: string
  /** Jarak yang disepakati, dalam bulan. */
  bulan: number
  /** yyyy-mm-dd terakhir dikerjakan; kosong berarti belum pernah. */
  terakhir?: string
}

const KUNCI_UKUR = 'pmd_ukur_berkala_v1'
const KUNCI_SKRIN = 'pmd_skrining_v1'

function baca<T>(kunci: string): T[] {
  try {
    const v = JSON.parse(localStorage.getItem(kunci) || '[]')
    return Array.isArray(v) ? v : []
  } catch { return [] }
}
function tulis(kunci: string, v: unknown, peristiwa: string) {
  try { localStorage.setItem(kunci, JSON.stringify(v)) } catch { /* kuota */ }
  try { window.dispatchEvent(new Event(peristiwa)) } catch { /* ignore */ }
}

export function hariIni(): string {
  const d = new Date()
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// ── Pengukuran ─────────────────────────────────────────────────────────────
export function ambilUkur(jenis?: Ukur['jenis']): Ukur[] {
  const semua = baca<Ukur>(KUNCI_UKUR).filter((u) => u && typeof u.nilai === 'number' && u.nilai > 0)
  return (jenis ? semua.filter((u) => u.jenis === jenis) : semua).sort((a, b) => a.tanggal.localeCompare(b.tanggal))
}

export function catatUkur(jenis: Ukur['jenis'], nilai: number, sisi?: Ukur['sisi']): void {
  const bersih = Math.max(0.1, Math.min(jenis === 'genggam' ? 120 : 600, nilai))
  const semua = baca<Ukur>(KUNCI_UKUR)
  semua.push({ id: `${jenis}-${Date.now()}`, jenis, tanggal: hariIni(), nilai: Math.round(bersih * 10) / 10, sisi })
  tulis(KUNCI_UKUR, semua.slice(-300), 'panacea:ukur')
}

export function hapusUkur(id: string): void {
  tulis(KUNCI_UKUR, baca<Ukur>(KUNCI_UKUR).filter((u) => u.id !== id), 'panacea:ukur')
}

/** Berapa hari sejak pengukuran terakhir jenis ini; null bila belum pernah. */
export function umurUkur(jenis: Ukur['jenis']): number | null {
  const d = ambilUkur(jenis)
  if (!d.length) return null
  const t = Date.parse(`${d[d.length - 1].tanggal}T00:00:00`)
  return Number.isNaN(t) ? null : Math.floor((Date.now() - t) / 864e5)
}

// ── Skrining ───────────────────────────────────────────────────────────────
export function ambilSkrining(): Skrining[] {
  return baca<Skrining>(KUNCI_SKRIN).filter((s) => s && typeof s.nama === 'string' && typeof s.bulan === 'number')
}

export function tambahSkrining(nama: string, bulan: number, terakhir?: string): void {
  const bersih = nama.trim().slice(0, 48)
  if (!bersih) return
  const semua = ambilSkrining()
  semua.push({ id: `sk${Date.now()}`, nama: bersih, bulan: Math.max(1, Math.min(120, Math.round(bulan))), terakhir })
  tulis(KUNCI_SKRIN, semua.slice(0, 40), 'panacea:skrining')
}

export function tandaiSkrining(id: string): void {
  tulis(KUNCI_SKRIN, ambilSkrining().map((s) => (s.id === id ? { ...s, terakhir: hariIni() } : s)), 'panacea:skrining')
}

export function hapusSkrining(id: string): void {
  tulis(KUNCI_SKRIN, ambilSkrining().filter((s) => s.id !== id), 'panacea:skrining')
}

/** Sisa hari menuju jatuh tempo; negatif berarti sudah lewat. Null bila belum pernah. */
export function sisaHari(s: Skrining): number | null {
  if (!s.terakhir) return null
  const t = Date.parse(`${s.terakhir}T00:00:00`)
  if (Number.isNaN(t)) return null
  const jatuh = t + s.bulan * 30.44 * 864e5
  return Math.round((jatuh - Date.now()) / 864e5)
}

/** Berapa butir yang sudah lewat jatuh tempo — dipakai ringkasan ke server. */
export function jumlahLewat(): number {
  return ambilSkrining().filter((s) => {
    const sisa = sisaHari(s)
    return sisa != null && sisa < 0
  }).length
}
