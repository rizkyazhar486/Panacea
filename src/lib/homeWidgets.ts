// ─────────────────────────────────────────────────────────────────────────────
// Pilihan kartu di Beranda.
//
// Fitur sudah banyak, dan tidak semua orang memakai bagian yang sama. Alih-alih
// menebak mana yang penting bagi setiap orang, biarkan pengguna memilih sendiri
// apa yang muncul di Beranda.
//
// Bawaannya sengaja sedikit — tiga kartu — karena beranda yang penuh sejak awal
// justru membuat orang berhenti membacanya. Sisanya tinggal dinyalakan.
//
// PENTING SAAT MENAMBAH HALAMAN BARU: daftar ini ditulis manual dan TIDAK
// diturunkan dari navigasi, karena tiap kartu punya label dan ringkasan yang
// digubah khusus untuk beranda. Akibatnya halaman baru tidak muncul di sini
// sampai didaftarkan — itu yang sempat terjadi pada CrossFit, Peregangan dan
// Harada. Kalau Anda menambah halaman yang layak jadi pintasan beranda,
// tambahkan barisnya di sini juga.
// ─────────────────────────────────────────────────────────────────────────────

export interface WidgetDef {
  id: string
  label: string
  ringkas: string
  ke: string
  emoji: string
  /** Nyala secara bawaan bagi pengguna baru. */
  bawaan?: boolean
}

export const WIDGETS: WidgetDef[] = [
  { id: 'pelatih', label: 'Pelatih Latihan', ringkas: 'Sesi berikutnya, rangkuman sesi terakhir, dan status kesegaran', ke: '/riwayat-latihan', emoji: '🏃', bawaan: true },
  { id: 'bodyBattery', label: 'Body Battery', ringkas: 'Cadangan energi hari ini', ke: '/body-battery', emoji: '🔋', bawaan: true },
  { id: 'targetLatihan', label: 'Target Latihan', ringkas: 'Kemajuan target pekan atau bulan ini', ke: '/analisis-pro', emoji: '🎯', bawaan: true },
  { id: 'kebugaran', label: 'Kebugaran & Kesegaran', ringkas: 'Beban kronis melawan kelelahan akut', ke: '/analisis-pro', emoji: '📈' },
  { id: 'usahaTerbaik', label: 'Usaha Terbaik', ringkas: 'Rekor waktu per jarak', ke: '/analisis-pro', emoji: '🏅' },
  { id: 'detakJantung', label: 'Detak Jantung', ringkas: 'Sampel terbaru dari jam tangan', ke: '/log-detak-jantung', emoji: '❤️' },
  { id: 'tidur', label: 'Sleep Pattern', ringkas: 'Durasi dan tahapan tidur semalam', ke: '/pola-tidur', emoji: '😴' },
  { id: 'healthData', label: 'Data Kesehatan', ringkas: 'Metrik yang terisi otomatis dari perangkat', ke: '/health-data', emoji: '🩺' },
  { id: 'latihanTerpandu', label: 'Latihan Terpandu', ringkas: 'Sesi berpanduan dengan video bentuk gerakan', ke: '/workout', emoji: '🏋️' },
  { id: 'crossfit', label: 'CrossFit & AMRAP', ringkas: 'Benchmark bernama dengan jam mulai, jeda dan ketuk ronde', ke: '/crossfit', emoji: '🔥' },
  { id: 'teknikLari', label: 'Teknik Lari', ringkas: 'Irama langkah, jangkauan kaki, napas, start', ke: '/teknik-lari', emoji: '🏃‍♂️' },
  { id: 'peregangan', label: 'Peregangan & Postur', ringkas: 'Rutinitas sebelum lari, sesudah sepeda, jeda kerja duduk', ke: '/peregangan', emoji: '🧘' },
  { id: 'harada', label: 'Kisi Harada 9×9', ringkas: 'Satu sasaran, delapan penopang, 64 tindakan', ke: '/harada', emoji: '🧩' },
  { id: 'nutrisi', label: 'Nutrisi', ringkas: 'Asupan hari ini', ke: '/nutrition', emoji: '🥗' },
  { id: 'obat', label: 'Pengingat Obat', ringkas: 'Jadwal minum obat berikutnya', ke: '/med-reminders', emoji: '💊' },
  { id: 'skor', label: 'Skor Olahraga', ringkas: 'Pertandingan tim yang Anda ikuti', ke: '/sports-scores', emoji: '⚽' },
  { id: 'keuangan', label: 'Keuangan', ringkas: 'Summary dompet dan transaksi', ke: '/keuangan', emoji: '💰' },
]

const KUNCI = 'pmd-home-widgets'

export function widgetBawaan(): string[] {
  return WIDGETS.filter((w) => w.bawaan).map((w) => w.id)
}

export function ambilWidget(): string[] {
  try {
    const raw = localStorage.getItem(KUNCI)
    if (!raw) return widgetBawaan()
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return widgetBawaan()
    // Saring id yang sudah tidak ada lagi, agar kartu yang dihapus dari aplikasi
    // tidak meninggalkan slot kosong di beranda seseorang.
    return arr.filter((id) => typeof id === 'string' && WIDGETS.some((w) => w.id === id))
  } catch {
    return widgetBawaan()
  }
}

export function simpanWidget(ids: string[]): void {
  try { localStorage.setItem(KUNCI, JSON.stringify(ids)) } catch { /* kuota penuh */ }
  try { window.dispatchEvent(new Event('panacea:home-widgets')) } catch { /* ignore */ }
}

export function alihkanWidget(id: string): string[] {
  const kini = ambilWidget()
  const next = kini.includes(id) ? kini.filter((x) => x !== id) : [...kini, id]
  simpanWidget(next)
  return next
}
