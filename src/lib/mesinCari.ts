// Mesin pencari isi aplikasi.
//
// SATU KOTAK UNTUK SEMUANYA. Sebelum ini, mencari sesuatu menuntut orang tahu
// lebih dahulu benda apa yang dicarinya: fitur dicari di kisi fitur, penyakit
// di halaman SKDI, obat di tatalaksana, stasiun di rekap OSCE. Padahal yang
// diingat orang hanyalah katanya — "hipertensi", "amlodipin", "Wells", "tidur".
// Kotak ini mencari kata itu di seluruhnya sekaligus.
//
// DIMUAT SAAT DIBUTUHKAN. Berkas penyakit, tatalaksana, dan rekap OSCE besar;
// menyertakannya ke bundel awal akan memperlambat pembukaan aplikasi bagi
// semua orang demi satu halaman. Indeksnya dibangun pada ketikan pertama, lalu
// disimpan di memori.
//
// PERINGKAT SEDERHANA, DAN ITU DISENGAJA. Cocok di awal kata lebih tinggi
// daripada cocok di tengah; nama lebih tinggi daripada keterangan. Pembobotan
// yang lebih rumit membuat urutannya tidak dapat diterka pemakainya, dan
// urutan yang tidak dapat diterka membuat orang berhenti memercayai hasil.

export type JenisHasil = 'fitur' | 'penyakit' | 'obat' | 'stasiun' | 'kalkulator'

export interface Hasil {
  jenis: JenisHasil
  judul: string
  ringkas: string
  ke: string
  /** Dipakai untuk mengurutkan; makin besar makin dahulu. */
  skor: number
}

export const NAMA_JENIS: Record<JenisHasil, string> = {
  fitur: 'Features',
  penyakit: 'Diseases',
  obat: 'Drugs & treatment',
  stasiun: 'OSCE stations',
  kalkulator: 'Calculators & scores',
}

interface Butir {
  jenis: JenisHasil
  judul: string
  ringkas: string
  ke: string
  cari: string
}

let indeks: Butir[] | null = null
let sedangMembangun: Promise<Butir[]> | null = null

/** Kata kunci yang menandai sebuah halaman sebagai kalkulator/skor. */
const PENANDA_HITUNG = /skor|score|kalkulator|calculator|kriteria|rule|index|indeks|gradient|clearance|osmolality|calcium/i

// Rute yang mengandung kata "skor" tetapi BUKAN kalkulator klinis. Tanpa
// daftar ini, "Skor Olahraga" — papan hasil pertandingan — digolongkan ke
// "Kalkulator & skor" dan tenggelam di antara empat puluhan skor klinis, jadi
// orang yang mencarinya menyimpulkan halaman itu tidak ada.
const BUKAN_HITUNG = new Set(['/sports-scores'])

/**
 * Kata lain untuk sebuah halaman.
 *
 * Nama halaman ditulis dalam satu bahasa, sedangkan yang diketik orang bisa
 * bahasa yang lain atau nama bendanya langsung: "score", "bola", "liga",
 * "champions". Padanan ini ikut ke dalam kolom pencarian tetapi tidak
 * ditampilkan, sehingga judulnya tetap satu bahasa.
 */
const PADANAN: Record<string, string> = {
  '/sports-scores': 'score sports bola sepak bola basket liga klasemen pertandingan jadwal klub tim favorit ufc mma nba liga champions',
  '/nutrition': 'nutrition makan kalori gizi kkal makro protein karbohidrat lemak',
  '/latihan': 'workout exercise olahraga lari sesi kardio',
  '/latihan-beban': 'gym angkat beban strength lifting repetisi set',
  '/pola-tidur': 'sleep tidur jam tidur begadang',
  '/tubuh': 'body composition komposisi tubuh berat badan imt bmi lemak otot',
  '/cari': 'search pencarian temukan',
  '/med-study': 'belajar study penyakit skdi materi',
  '/osce-ukmppd': 'osce ukmppd ujian stasiun tryout',
  '/clinical-calculators': 'kalkulator klinis calculator rumus skor',
}

async function bangun(): Promise<Butir[]> {
  const [fitur, penjelasan, penyakit, obat, osce] = await Promise.all([
    import('./homeWidgets'),
    import('./penjelasanFitur'),
    import('./skdiDiseaseNotes'),
    import('./skdiTherapyReference'),
    import('./osceUkmppdRiwayat'),
  ])
  const { KALKULATOR_KLINIS } = await import('./daftarKalkulatorKlinis')

  const out: Butir[] = []

  // 1. Fitur — dari katalog widget (lengkap dengan ringkasannya).
  for (const w of fitur.WIDGETS) {
    const rute = w.ke.split('?')[0]
    const hitung = !BUKAN_HITUNG.has(rute) && PENANDA_HITUNG.test(`${w.label} ${w.ke}`)
    out.push({
      jenis: hitung ? 'kalkulator' : 'fitur',
      judul: w.label,
      ringkas: w.ringkas,
      ke: w.ke,
      cari: `${w.label} ${w.ringkas} ${w.kategori} ${PADANAN[rute] ?? ''}`.toLowerCase(),
    })
  }

  // 2. Halaman yang punya penjelasan tetapi tidak ada di katalog widget.
  const sudah = new Set(out.map((o) => o.ke.split('?')[0]))
  for (const [rute, teks] of Object.entries(penjelasan.PENJELASAN_FITUR)) {
    if (sudah.has(rute)) continue
    const nama = rute.replace(/^\//, '').replace(/-/g, ' ')
    out.push({
      jenis: !BUKAN_HITUNG.has(rute) && PENANDA_HITUNG.test(rute) ? 'kalkulator' : 'fitur',
      judul: nama.charAt(0).toUpperCase() + nama.slice(1),
      ringkas: teks,
      ke: rute,
      cari: `${nama} ${teks} ${PADANAN[rute] ?? ''}`.toLowerCase(),
    })
  }

  // 3. Penyakit SKDI.
  for (const nama of Object.keys(penyakit.SKDI_DISEASE_NOTES)) {
    out.push({
      jenis: 'penyakit',
      judul: nama,
      ringkas: 'Full station notes: history, examination, diagnosis, management',
      ke: `/med-study?bagian=diseases&q=${encodeURIComponent(nama)}`,
      cari: nama.toLowerCase(),
    })
  }

  // 4. Obat & tatalaksana. Satu baris per diagnosis+kelas, karena itulah
  //    satuan yang dicari orang: "apa obatnya, berapa dosisnya".
  for (const e of obat.SKDI_ENTRIES) {
    out.push({
      jenis: 'obat',
      judul: e.classification ? `${e.diagnosis} — ${e.classification}` : e.diagnosis,
      ringkas: e.therapy,
      ke: `/med-study?bagian=therapy&q=${encodeURIComponent(e.diagnosis)}`,
      cari: `${e.diagnosis} ${e.classification ?? ''} ${e.therapy} ${e.system}`.toLowerCase(),
    })
  }

  // 4b. Kalkulator DI DALAM halaman Kalkulator Klinis. Keempat puluh tiga
  //     kalkulator itu bukan rute tersendiri, sehingga tanpa daftar ini
  //     mengetik "apgar" atau "curb" tidak menemukan apa pun — padahal
  //     kalkulatornya ada.
  for (const nama of KALKULATOR_KLINIS) {
    out.push({
      jenis: 'kalkulator',
      judul: nama,
      ringkas: 'Found on the Clinical Calculators page',
      ke: `/clinical-calculators?q=${encodeURIComponent(nama)}`,
      cari: nama.toLowerCase(),
    })
  }

  // 5. Stasiun OSCE — digabung per kasus, bukan per periode, supaya satu kasus
  //    tidak memenuhi seluruh halaman hasil dengan puluhan baris yang sama.
  const perKasus = new Map<string, { sistem: string; n: number }>()
  for (const s of osce.RIWAYAT_OSCE) {
    const k = s.kasus.trim()
    const a = perKasus.get(k)
    if (a) a.n += 1
    else perKasus.set(k, { sistem: s.sistem, n: 1 })
  }
  for (const [kasus, d] of perKasus) {
    out.push({
      jenis: 'stasiun',
      judul: kasus,
      ringkas: `${d.sistem} · muncul ${d.n}×`,
      ke: `/osce-ukmppd?q=${encodeURIComponent(kasus)}`,
      cari: `${kasus} ${d.sistem}`.toLowerCase(),
    })
  }

  return out
}

export async function siapkanIndeks(): Promise<number> {
  if (indeks) return indeks.length
  if (!sedangMembangun) sedangMembangun = bangun()
  indeks = await sedangMembangun
  return indeks.length
}

export function cari(kata: string, batas = 40): Hasil[] {
  const q = kata.toLowerCase().trim()
  if (!indeks || q.length < 2) return []

  const hasil: Hasil[] = []
  for (const b of indeks) {
    const judul = b.judul.toLowerCase()
    let skor = 0
    if (judul === q) skor = 100
    else if (judul.startsWith(q)) skor = 80
    else if (judul.includes(q)) skor = 60
    else if (b.cari.includes(q)) skor = 30
    if (!skor) continue
    // Judul yang lebih pendek didahulukan pada skor yang sama: "Asma" sebelum
    // "Asma eksaserbasi akut derajat sedang".
    hasil.push({ jenis: b.jenis, judul: b.judul, ringkas: b.ringkas, ke: b.ke, skor: skor - Math.min(20, b.judul.length / 5) })
  }
  return hasil.sort((a, b) => b.skor - a.skor).slice(0, batas)
}

export function jumlahTerindeks(): number {
  return indeks?.length ?? 0
}
