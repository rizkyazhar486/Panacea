// ─────────────────────────────────────────────────────────────────────────────
// Kitab suci — pengambilan teks, bukan penulisan teks.
//
// SATU ATURAN YANG TIDAK BOLEH DILANGGAR: teks kitab suci TIDAK PERNAH ditulis
// dari ingatan model, tidak sebagian, tidak satu ayat pun. Ia selalu diambil
// dari sumber yang bisa disebut namanya dan diperiksa orang lain.
//
// Alasannya bukan kehati-hatian teknis biasa. Al-Qur'an memiliki teks yang
// terjaga hurufnya, dan satu huruf yang salah bukan "bug kecil" — ia mushaf
// yang rusak di tangan orang yang memakainya untuk beribadah. Model bahasa
// menghasilkan teks yang tampak meyakinkan justru ketika ia paling keliru, dan
// tidak ada cara bagi pembaca untuk membedakannya. Maka satu-satunya sikap yang
// jujur adalah: kita mengambil, kita menyebut sumbernya, dan kita tidak
// mengarang.
//
// Hal yang sama berlaku untuk Alkitab, Taurat, dan seluruh kitab lain di sini.
//
// TENTANG TAFSIR. Aplikasi ini tidak menulis tafsirnya sendiri. Tafsir adalah
// disiplin dengan aturannya — asbabun nuzul, sanad, ilmu bahasa, ijma ulama —
// dan sebuah aplikasi kebugaran tidak berwenang di sana. Yang ditampilkan
// adalah tafsir yang sudah mapan beserta nama penyusunnya, sehingga pembaca
// tahu ia sedang membaca siapa.
//
// TENTANG "TAFSIR ILMIAH". Sengaja TIDAK dibuat. Gagasan mencocokkan ayat
// dengan temuan sains modern (i'jaz 'ilmi) ditolak banyak ulama maupun
// ilmuwan, karena ia menundukkan makna wahyu pada sains yang berubah setiap
// dekade — ayat yang hari ini "terbukti" bisa memalukan besok. Yang disediakan
// sebagai gantinya adalah pertanyaan renungan yang tidak mengklaim kewenangan
// keagamaan apa pun.
// ─────────────────────────────────────────────────────────────────────────────

export type Tradisi = 'quran' | 'bible' | 'tanakh' | 'veda' | 'buddhist' | 'confucian'

/**
 * Rantai asal teks — dari mana penyedia mendapatkannya, dan bagaimana pembaca
 * bisa memeriksanya sendiri.
 *
 * Ditulis terpisah dari alamat API karena inilah yang sebenarnya menentukan
 * boleh-tidaknya sebuah sumber dipakai. Sebuah API yang cepat dan gratis tetapi
 * tidak bisa menyebutkan asal teksnya tidak layak dipakai untuk kitab suci.
 */
export interface Provenansi {
  /** Rujukan cetak yang menjadi acuan, bila ada. */
  acuan: string
  /** Bagaimana penyedia memperoleh dan memverifikasi teksnya. */
  rantai: string
  /** Cara pembaca membuktikan sendiri bahwa teks di layar benar. */
  caraPeriksa: string
}

export interface Sumber {
  id: string
  nama: string
  /** Siapa yang menerbitkan teksnya, agar pembaca bisa memeriksa sendiri. */
  penerbit: string
  situs: string
  /** Pangkalan API. Diambil peramban pengguna, bukan server aplikasi ini. */
  basis: string
  catatan: string
  provenansi?: Provenansi
}

/**
 * Penyedia Al-Qur'an, semuanya gratis dan tanpa kunci API, diurutkan menurut
 * seberapa kuat rantai asalnya bisa ditelusuri.
 *
 * BERGANDA, DAN ITU SENGAJA. Bergantung pada satu layanan gratis berarti
 * menaruh kepercayaan pengguna pada sesuatu yang bisa mati, berubah, atau
 * dibeli orang lain tanpa memberi tahu siapa pun. Bila yang pertama tidak
 * menjawab atau jawabannya tidak lolos periksa keutuhan, yang berikutnya
 * dicoba — dan penyedia yang benar-benar melayani teksnya SELALU disebutkan
 * di layar, sehingga pembaca tidak pernah tidak tahu ia sedang membaca dari
 * mana.
 *
 * Satu penyedia yang gagal periksa TIDAK ditambal dengan potongan dari
 * penyedia lain. Satu bacaan datang utuh dari satu sumber, atau tidak sama
 * sekali — mencampur teks dari dua sumber adalah cara paling halus untuk
 * merusak mushaf tanpa disadari siapa pun.
 */
export interface PenyediaQuran extends Sumber {
  /** Alamat daftar surah. */
  jalurDaftar: string
  /** Alamat satu surah; {n} diganti nomor surah, {ed} diganti edisi. */
  jalurSurah: string
  /** Nama edisi teks Arab pada penyedia ini. */
  edisiArab: string
  /** Pemetaan id terjemahan kami ke id penyedia. */
  edisiTerjemahan: Record<string, string>
  edisiTafsir: Record<string, string>
  /** Edisi alih aksara Latin, bila penyedia menyediakannya. */
  edisiLatin?: string
  /** Pemetaan id qari kami ke id edisi audio penyedia. */
  edisiQari: Record<string, string>
  /** Bentuk jawaban berbeda antarpenyedia, jadi tiap penyedia membaca sendiri. */
  bacaDaftar: (j: unknown) => Surah[]
  bacaSurah: (j: unknown) => { surah: Surah; ayat: { nomor: number; teks: string }[] }
  /** Baca alamat rekaman per ayat dari jawaban edisi audio. */
  bacaAudio?: (j: unknown) => { nomor: number; audio: string }[]
  /** Syarat pemakaian yang wajib dipatuhi, mis. keharusan mencantumkan sumber. */
  syarat: string
}

/**
 * Sumber untuk kitab yang dilayani SATU penyedia tetap.
 *
 * AL-QUR'AN SENGAJA TIDAK ADA DI SINI. Ia dilayani rantai penyedia (lihat
 * PENYEDIA di bawah), dan yang benar-benar menjawab bisa berbeda dari yang
 * pertama dalam daftar. Menyimpan keterangan sumbernya di dua tempat berarti
 * suatu hari layar akan menyebut penyedia A sementara teksnya datang dari
 * penyedia B — salah atribusi pada teks kitab suci, dan tidak ada yang akan
 * menyadarinya karena keduanya sama-sama terlihat masuk akal. Karena itu
 * keterangan sumber Al-Qur'an hanya hidup di satu tempat: pada penyedia yang
 * benar-benar melayaninya, dibaca lewat penyediaSekarang().
 *
 * Weda, kanon Pali, dan kitab Konfusius juga tidak ada di sini karena teksnya
 * memang tidak dimuat — yang ada hanya pengantar, lihat PENGANTAR.
 */
export const SUMBER: Record<'bible' | 'tanakh', Sumber> = {
  bible: {
    id: 'bible-api',
    nama: 'Alkitab (Perjanjian Lama & Baru)',
    penerbit: 'bible-api.com',
    situs: 'https://bible-api.com',
    basis: 'https://bible-api.com',
    catatan: 'Terjemahan yang dipakai disebut pada tiap kutipan, karena terjemahan berbeda dapat berbeda makna.',
  },
  tanakh: {
    id: 'sefaria',
    nama: 'Taurat / Tanakh',
    penerbit: 'Sefaria',
    situs: 'https://www.sefaria.org',
    basis: 'https://www.sefaria.org/api',
    catatan: 'Teks Ibrani beserta terjemahannya, dari perpustakaan digital Sefaria.',
  },
}

export interface Surah {
  nomor: number
  nama: string
  namaArab: string
  arti: string
  jumlahAyat: number
  tempat: string
}

export interface Ayat {
  nomor: number
  arab: string
  terjemahan: string
  /**
   * Alih aksara Latin — CARA MEMBACA, bukan makna dan bukan pengganti teks.
   *
   * Ditampilkan karena sebagian besar pengguna aplikasi ini tidak membaca
   * aksara Arab, dan tanpa alih aksara mereka hanya bisa MELIHAT ayat, tidak
   * bisa melafalkannya. Ia diambil dari penyedia seperti semua teks lain di
   * sini; tidak satu huruf pun disusun oleh aplikasi ini.
   *
   * Ia sengaja ditampilkan di bawah teks Arab dan dengan gaya yang jelas
   * berbeda, supaya tidak pernah tertukar dengan ayatnya sendiri.
   */
  latin?: string
  /** Alamat rekaman bacaan ayat ini, bila edisi qari diminta. */
  audio?: string
  /** Tafsir bila diminta; selalu bersama nama penyusunnya. */
  tafsir?: { teks: string; oleh: string; bahasa: string }
}

// ── Pemeriksaan keutuhan ─────────────────────────────────────────────────────
//
// Sumber yang sah pun bisa sampai dalam keadaan rusak: permintaan terpotong,
// proksi yang menyisipkan halaman galat, pengodean huruf yang salah. Karena
// aplikasi ini tidak boleh menampilkan teks yang meragukan, teks yang datang
// DIPERIKSA lebih dulu, dan bila gagal ia TIDAK DITAMPILKAN sama sekali.
//
// Yang diperiksa sengaja hanya hal yang disepakati universal dan bisa dihitung,
// bukan isi teksnya — kami tidak berwenang menilai isi:
//
//   * Jumlah surah harus 114.
//   * Jumlah ayat yang diterima harus sama dengan jumlah yang dinyatakan
//     penyedia sendiri untuk surah itu. Ini menangkap pemotongan.
//   * Jumlah seluruh ayat harus 6236 (hitungan riwayat Hafs).
//   * Setiap ayat harus berisi huruf Arab, tanpa aksara Latin dan tanpa tanda
//     pengganti U+FFFD yang menandakan pengodean rusak.
//
// Pemeriksaan ini tidak membuktikan teksnya benar — hanya mushaf cetak yang
// bisa. Ia membuktikan teksnya sampai utuh.

/** Jumlah ayat seluruh Al-Qur'an menurut hitungan riwayat Hafs. */
export const TOTAL_AYAT_HAFS = 6236
export const TOTAL_SURAH = 114

const ARAB = /[\u0600-\u06FF\u0750-\u077F]/
const LATIN = /[A-Za-z]/
const RUSAK = /\uFFFD/

export interface HasilPeriksa { utuh: boolean; alasan?: string }

export function periksaDaftarSurah(s: Surah[]): HasilPeriksa {
  if (s.length !== TOTAL_SURAH) {
    return { utuh: false, alasan: `Expected ${TOTAL_SURAH} surahs, received ${s.length}. The response is incomplete, so nothing is shown.` }
  }
  const total = s.reduce((a, x) => a + x.jumlahAyat, 0)
  if (total !== TOTAL_AYAT_HAFS) {
    return { utuh: false, alasan: `Ayah counts total ${total}, not the expected ${TOTAL_AYAT_HAFS} of the Hafs reading. The source does not match what it should, so nothing is shown.` }
  }
  return { utuh: true }
}

export function periksaSurah(surah: Surah, ayat: Ayat[]): HasilPeriksa {
  if (ayat.length !== surah.jumlahAyat) {
    return { utuh: false, alasan: `This surah should have ${surah.jumlahAyat} ayat but ${ayat.length} arrived. The response was truncated, so nothing is shown.` }
  }
  for (const a of ayat) {
    if (!a.arab || !ARAB.test(a.arab)) {
      return { utuh: false, alasan: `Ayah ${a.nomor} contains no Arabic script. The text did not arrive intact, so nothing is shown.` }
    }
    if (RUSAK.test(a.arab)) {
      return { utuh: false, alasan: `Ayah ${a.nomor} contains replacement characters, which means the encoding was corrupted in transit. Nothing is shown.` }
    }
    if (LATIN.test(a.arab)) {
      return { utuh: false, alasan: `Ayah ${a.nomor} contains Latin letters, which should never appear in the Arabic text. Nothing is shown.` }
    }
  }
  return { utuh: true }
}

/**
 * Periksa bahwa tiap ayat memperoleh terjemahannya sendiri.
 *
 * Pemeriksaan ini terpisah dari periksaSurah karena yang dijaga berbeda
 * jenisnya. periksaSurah menjaga TEKSNYA sampai utuh; ini menjaga MAKNANYA
 * tidak tertukar. Teks Arab yang sempurna dengan terjemahan yang bergeser satu
 * ayat adalah kerusakan yang lebih halus dan lebih berbahaya daripada halaman
 * yang gagal dimuat — yang gagal dimuat terlihat gagal.
 *
 * `jumlahDiterima` adalah banyaknya ayat yang dikirim edisi terjemahan. Ia
 * diperiksa terhadap jumlah resmi surah, sehingga terjemahan yang justru
 * KELEBIHAN ayat pun tertangkap, bukan hanya yang kekurangan.
 */
export function periksaTerjemahan(surah: Surah, ayat: Ayat[], jumlahDiterima: number): HasilPeriksa {
  if (jumlahDiterima !== surah.jumlahAyat) {
    return { utuh: false, alasan: `The translation returned ${jumlahDiterima} verses for a surah of ${surah.jumlahAyat}. Pairing them could attach the wrong meaning to a verse, so nothing is shown.` }
  }
  for (const a of ayat) {
    if (!a.terjemahan || !a.terjemahan.trim()) {
      return { utuh: false, alasan: `Ayah ${a.nomor} arrived without its translation, which means the verses did not line up. Nothing is shown rather than risk pairing a verse with someone else's meaning.` }
    }
  }
  return { utuh: true }
}

const KUNCI_CACHE = 'pmd-kitab-v1'

interface Cache { [k: string]: { pada: number; data: unknown } }

// Cache tujuh hari. Teksnya tidak berubah, jadi ini murni soal tidak membebani
// penyedia gratis yang sedang kita numpangi — dan agar bisa dibaca luring.
const UMUR_CACHE = 7 * 86400_000

function bacaCache<T>(k: string): T | null {
  try {
    const c = JSON.parse(localStorage.getItem(KUNCI_CACHE) || '{}') as Cache
    const x = c[k]
    if (!x || Date.now() - x.pada > UMUR_CACHE) return null
    return x.data as T
  } catch { return null }
}

function tulisCache(k: string, data: unknown): void {
  try {
    const c = JSON.parse(localStorage.getItem(KUNCI_CACHE) || '{}') as Cache
    // Yang sudah lewat umur dibuang di sini. Tanpa ini isinya hanya bertambah:
    // teks Arab seluruh Al-Qur'an ditambah tiap terjemahan yang pernah dibuka
    // sanggup menghabiskan kuota localStorage, dan setiap penulisan berikutnya
    // harus mengurai lalu merangkai ulang seluruh gumpalan itu.
    const batas = Date.now() - UMUR_CACHE
    for (const [nama, isi] of Object.entries(c)) if (!isi || isi.pada < batas) delete c[nama]
    c[k] = { pada: Date.now(), data }
    try {
      localStorage.setItem(KUNCI_CACHE, JSON.stringify(c))
    } catch {
      // Kuota penuh. Buang separuh yang paling lama tidak dipakai dan coba
      // sekali lagi, supaya surah yang baru dibaca tetap bisa dibaca luring
      // alih-alih cache berhenti bekerja diam-diam sejak entri pertama penuh.
      const urut = Object.entries(c).sort((a, b) => a[1].pada - b[1].pada)
      for (const [nama] of urut.slice(0, Math.ceil(urut.length / 2))) delete c[nama]
      c[k] = { pada: Date.now(), data }
      localStorage.setItem(KUNCI_CACHE, JSON.stringify(c))
    }
  } catch { /* tetap penuh — pembacaan daring tidak terganggu */ }
}

function hapusCache(...kunci: string[]): void {
  try {
    const c = JSON.parse(localStorage.getItem(KUNCI_CACHE) || '{}') as Cache
    for (const k of kunci) delete c[k]
    localStorage.setItem(KUNCI_CACHE, JSON.stringify(c))
  } catch { /* tidak ada yang bisa dilakukan, dan tidak perlu */ }
}

interface Diambil<T> { data: T; kunci: string; dariCache: boolean }

/**
 * Ambil satu alamat. TIDAK MENYIMPAN KE CACHE — itu urusan pemanggil, dan
 * hanya setelah pemeriksaan keutuhan lolos.
 *
 * Urutan ini pernah terbalik, dan akibatnya adalah cacat yang paling buruk
 * bentuknya: jawaban yang terpotong disimpan lebih dulu, baru kemudian gagal
 * diperiksa. Cache berumur tujuh hari, jadi memuat ulang halaman tidak
 * menolong — surah itu rusak selama sepekan penuh dan tidak ada cara bagi
 * pembaca untuk memulihkannya. Satu gangguan jaringan sesaat berubah menjadi
 * kerusakan yang menetap.
 *
 * Isi jawaban TIDAK dibuka bungkusnya di sini. Dulu ada tebakan `j.data ?? j`
 * yang berlaku untuk semua penyedia sekaligus; itu kebetulan cocok untuk satu
 * penyedia dan diam-diam salah untuk penyedia lain yang punya kolom bernama
 * "data" dengan arti berbeda. Tiap pembaca membuka bungkusnya sendiri.
 */
async function ambil<T>(url: string, kunci: string): Promise<Diambil<T>> {
  const tersimpan = bacaCache<T>(kunci)
  if (tersimpan) return { data: tersimpan, kunci, dariCache: true }
  const r = await fetch(url)
  if (!r.ok) throw new Error(`gagal_memuat_${r.status}`)
  return { data: (await r.json()) as T, kunci, dariCache: false }
}

/** Simpan yang baru diambil, setelah keutuhannya terbukti. */
function simpanLolos(...bagian: (Diambil<unknown> | null)[]): void {
  for (const b of bagian) if (b && !b.dariCache) tulisCache(b.kunci, b.data)
}

/**
 * Buang yang gagal periksa, termasuk yang datangnya dari cache.
 *
 * Bagian terakhir itu yang penting: cache yang sudah terlanjur berisi jawaban
 * rusak — ditulis versi lama aplikasi, atau rusak saat disimpan — akan gagal
 * periksa berulang kali tanpa pernah sembuh. Membuangnya membuat percobaan
 * berikutnya benar-benar mengambil ulang dari penyedia.
 */
function buangYangGagal(...bagian: (Diambil<unknown> | null)[]): void {
  hapusCache(...bagian.filter((b): b is Diambil<unknown> => !!b).map((b) => b.kunci))
}

/**
 * Penyedia gratis tanpa kunci API. Urutannya bukan selera: yang paling atas
 * adalah yang rantai asalnya paling jelas dan paling sering dirujuk.
 */
export const PENYEDIA: PenyediaQuran[] = [
  {
    id: 'alquran-cloud',
    nama: 'AlQuran Cloud',
    penerbit: 'AlQuran Cloud — teks Utsmani dari proyek Tanzil',
    situs: 'https://alquran.cloud',
    basis: 'https://api.alquran.cloud/v1',
    catatan: 'Gratis, tanpa kunci API.',
    syarat: 'Sumber wajib dicantumkan, dan teks tidak boleh diubah. Aplikasi ini mematuhi keduanya: nama penyedia tampil di layar dan tidak satu huruf pun disunting.',
    provenansi: {
      acuan: 'Mushaf Madinah, riwayat Hafs dari ‘Ashim — cetakan Mujamma‘ al-Malik Fahd.',
      rantai: 'Teks Utsmani berasal dari proyek Tanzil, yang menyusun dan memeriksa teksnya terhadap mushaf cetakan Mujamma‘ al-Malik Fahd.',
      caraPeriksa: 'Bandingkan huruf per huruf dengan mushaf cetak di tangan Anda. Bila ada satu perbedaan, hentikan pemakaian dan laporkan — jangan disunting sendiri di aplikasi.',
    },
    jalurDaftar: '/surah',
    jalurSurah: '/surah/{n}/{ed}',
    edisiArab: 'quran-uthmani',
    edisiTerjemahan: { 'en.sahih': 'en.sahih', 'id.indonesian': 'id.indonesian', 'en.pickthall': 'en.pickthall' },
    edisiTafsir: {
      'en.maududi': 'en.maududi', 'en.jalalayn': 'en.jalalayn',
      'ar.muyassar': 'ar.muyassar', 'ar.jalalayn': 'ar.jalalayn',
    },
    edisiLatin: 'en.transliteration',
    edisiQari: { alafasy: 'ar.alafasy', husary: 'ar.husary', minshawi: 'ar.minshawimujawwad' },
    bacaDaftar: (j) => {
      const d = (j as { data?: unknown[] }).data ?? j
      return (d as Record<string, never>[]).map((x) => ({
        nomor: Number(x['number']), nama: String(x['englishName']), namaArab: String(x['name']),
        arti: String(x['englishNameTranslation']), jumlahAyat: Number(x['numberOfAyahs']),
        tempat: String(x['revelationType']),
      }))
    },
    bacaSurah: (j) => {
      const d = ((j as { data?: unknown }).data ?? j) as Record<string, never>
      const a = (d['ayahs'] ?? []) as Record<string, never>[]
      return {
        surah: {
          nomor: Number(d['number']), nama: String(d['englishName']), namaArab: String(d['name']),
          arti: String(d['englishNameTranslation']), jumlahAyat: Number(d['numberOfAyahs']),
          tempat: String(d['revelationType']),
        },
        ayat: a.map((x) => ({ nomor: Number(x['numberInSurah']), teks: String(x['text']) })),
      }
    },
    // Edisi audio memakai bentuk jawaban yang SAMA PERSIS dengan edisi teks,
    // hanya dengan satu field tambahan berisi alamat berkas suara. Karena
    // itulah audio ditambahkan lewat jalur ini dan bukan lewat API baru:
    // bentuk jawabannya sudah terbukti oleh uji yang ada, jadi yang bertambah
    // hanyalah nama edisinya.
    bacaAudio: (j) => {
      const d = ((j as { data?: unknown }).data ?? j) as Record<string, never>
      const a = (d['ayahs'] ?? []) as Record<string, never>[]
      return a
        .map((x) => ({ nomor: Number(x['numberInSurah']), audio: String(x['audio'] ?? '') }))
        .filter((x) => Number.isFinite(x.nomor) && /^https?:\/\//.test(x.audio))
    },
  },
  // ── CADANGAN BELUM DIPASANG, DAN ITU DISENGAJA ────────────────────────────
  //
  // Rantai cadangan di bawah sudah siap dan diuji, tetapi hanya ada SATU
  // penyedia terdaftar. Alasannya: bentuk jawaban penyedia kedua tidak dapat
  // diperiksa dari lingkungan pengembangan ini karena jaringannya tertutup,
  // dan menulis pembaca jawaban berdasar tebakan berarti mengirim kode yang
  // akan selalu gagal diam-diam — atau lebih buruk, kadang berhasil dengan
  // pemetaan ayat yang meleset.
  //
  // Menambah penyedia kedua menuntut tiga hal, dan ketiganya harus dikerjakan
  // dengan API yang benar-benar hidup:
  //
  //   1. Ambil satu surah sungguhan, catat bentuk jawabannya, lalu tulis
  //      bacaDaftar dan bacaSurah dari bentuk itu — bukan dari dokumentasi.
  //   2. Bandingkan ayat pertama dan terakhir beberapa surah dengan penyedia
  //      utama. Bila berbeda satu huruf saja, jangan dipasang.
  //   3. Isi provenansi dengan jujur. Bila rantai asalnya tidak dapat
  //      ditelusuri sampai mushaf cetak, katakan begitu — jangan dikarang.
  //
  // Sampai itu dikerjakan, satu penyedia lebih baik daripada dua yang salah
  // satunya tidak dipahami.
]

/** Penyedia yang benar-benar melayani bacaan terakhir, untuk ditampilkan. */
let penyediaTerpakai: PenyediaQuran = PENYEDIA[0]
export function penyediaSekarang(): PenyediaQuran { return penyediaTerpakai }

/**
 * Coba tiap penyedia berurutan sampai ada yang menjawab DAN lolos periksa.
 *
 * Penyedia yang jawabannya tidak lolos diperlakukan sama dengan penyedia yang
 * mati — ia dilewati. Teks yang meragukan tidak lebih baik daripada tidak ada
 * teks; ia lebih buruk, karena tampak sah.
 */
async function lewatPenyedia<T>(
  kerja: (p: PenyediaQuran) => Promise<T>,
): Promise<T> {
  let galatTerakhir: Error | null = null
  for (const p of PENYEDIA) {
    if (!p.jalurDaftar) continue
    try {
      const hasil = await kerja(p)
      penyediaTerpakai = p
      return hasil
    } catch (e) {
      galatTerakhir = e as Error
    }
  }
  throw galatTerakhir ?? new Error('gagal_memuat_0')
}

/** Daftar 114 surah. */
export async function daftarSurah(): Promise<Surah[]> {
  return lewatPenyedia(async (p) => {
    const j = await ambil<unknown>(`${p.basis}${p.jalurDaftar}`, `${p.id}-surah-list`)
    const out = p.bacaDaftar(j.data)
    const c = periksaDaftarSurah(out)
    if (!c.utuh) { buangYangGagal(j); throw new Error(c.alasan) }
    simpanLolos(j)
    return out
  })
}

/**
 * Satu surah lengkap: Arab, terjemahan, dan tafsir bila diminta.
 *
 * Ketiganya diminta sekaligus karena membaca satu surah tanpa terjemahannya
 * bukan membaca, dan menunggu dua kali muat membuat orang menutup halaman.
 */
export interface PilihanBaca {
  terjemahan?: string
  tafsirId?: string
  /** Tampilkan alih aksara Latin. */
  latin?: boolean
  /** Id qari; kosong berarti tanpa audio. */
  qari?: string
}

/**
 * Hasil pembacaan, beserta APA YANG DIMINTA TETAPI TIDAK DATANG.
 *
 * Bagian kedua itu penting. Tafsir, alih aksara, dan audio semuanya bersifat
 * tambahan, jadi kegagalannya tidak boleh membatalkan seluruh bacaan — tetapi
 * ia juga TIDAK BOLEH DIAM. Sebelumnya tafsir yang gagal diambil hanya hilang
 * dari layar, sehingga pengguna yang menyalakannya melihat halaman yang sama
 * persis seperti saat ia mematikannya, tanpa satu pun petunjuk bahwa ada yang
 * salah. Yang gagal disebutkan namanya di layar.
 */
export interface HasilBaca {
  surah: Surah
  ayat: Ayat[]
  /** Nama bagian tambahan yang diminta tetapi gagal diambil. */
  gagalSebagian: string[]
}

export async function bacaSurah(
  nomor: number,
  terjemahan = 'en.sahih',
  tafsirId?: string,
  pilihan: PilihanBaca = {},
): Promise<HasilBaca> {
  return lewatPenyedia(async (p) => {
    const url = (ed: string) => `${p.basis}${p.jalurSurah.replace('{n}', String(nomor)).replace('{ed}', ed)}`
    const edTerj = p.edisiTerjemahan[terjemahan] ?? terjemahan
    // PETA EDISI ADALAH TERJEMAHAN NAMA, BUKAN DAFTAR-PUTIH.
    //
    // Sebelumnya baris ini berhenti pada peta: id tafsir yang tidak tercantum
    // menghasilkan undefined, sehingga tafsirnya TIDAK DIAMBIL SAMA SEKALI dan
    // layarnya tampak seperti tafsir yang tidak tersedia. Itu memutus seluruh
    // gunanya menanyakan daftar tafsir kepada penyedia saat berjalan — id yang
    // baru saja disebut penyedianya sendiri justru ditolak di sini.
    //
    // Barisnya kini jatuh ke id apa adanya, persis seperti yang sudah
    // dilakukan edisi terjemahan tepat di atasnya.
    const edTaf = tafsirId ? p.edisiTafsir[tafsirId] ?? tafsirId : undefined
    const edLatin = pilihan.latin ? p.edisiLatin : undefined
    const edQari = pilihan.qari ? p.edisiQari[pilihan.qari] : undefined
    const gagalSebagian: string[] = []

    const [arab, terj, taf, lat, aud] = await Promise.all([
      ambil<unknown>(url(p.edisiArab), `${p.id}-s${nomor}-ar`),
      ambil<unknown>(url(edTerj), `${p.id}-s${nomor}-${edTerj}`),
      edTaf ? ambil<unknown>(url(edTaf), `${p.id}-s${nomor}-${edTaf}`).catch(() => null) : Promise.resolve(null),
      edLatin ? ambil<unknown>(url(edLatin), `${p.id}-s${nomor}-${edLatin}`).catch(() => null) : Promise.resolve(null),
      edQari ? ambil<unknown>(url(edQari), `${p.id}-s${nomor}-${edQari}`).catch(() => null) : Promise.resolve(null),
    ])

    if (edTaf && !taf) gagalSebagian.push(`commentary (${NAMA_TAFSIR(tafsirId)})`)
    if (edLatin && !lat) gagalSebagian.push('transliteration')
    if (edQari && !aud) gagalSebagian.push(`recitation (${NAMA_QARI(pilihan.qari)})`)

    const A = p.bacaSurah(arab.data)
    const T = p.bacaSurah(terj.data)
    const F = taf ? p.bacaSurah(taf.data) : null
    const L = lat ? p.bacaSurah(lat.data) : null
    const U = aud ? p.bacaAudio?.(aud.data) ?? null : null

    // DIPASANGKAN MENURUT NOMOR AYAT, BUKAN MENURUT URUTAN DALAM LARIK.
    //
    // Ini bukan kerapian; ini soal makna. Bila edisi terjemahan mengirim satu
    // ayat lebih sedikit — entah karena penomoran basmalah yang berbeda, entah
    // karena jawaban terpotong — pemasangan menurut urutan menggeser SELURUH
    // terjemahan sesudahnya satu langkah. Setiap ayat lalu tampil dengan
    // terjemahan ayat lain, rapi dan meyakinkan, dan pemeriksaan keutuhan tidak
    // menangkapnya karena teks Arabnya sendiri utuh. Pembaca yang tidak
    // menguasai bahasa Arab tidak punya cara apa pun untuk mengetahuinya.
    const terjPerNomor = new Map(T.ayat.map((x) => [x.nomor, x.teks]))
    const tafPerNomor = F ? new Map(F.ayat.map((x) => [x.nomor, x.teks])) : null
    const latPerNomor = L ? new Map(L.ayat.map((x) => [x.nomor, x.teks])) : null
    const audPerNomor = U ? new Map(U.map((x) => [x.nomor, x.audio])) : null

    // Alih aksara yang jumlah ayatnya tidak cocok DIBUANG SELURUHNYA, bukan
    // dipasang sebagian. Cara membaca yang meleset satu ayat menuntun orang
    // melafalkan ayat yang salah sambil mengira ia sedang membaca ayat di
    // depan matanya — dan justru pembaca yang paling membutuhkan alih aksara
    // adalah yang paling tidak mungkin menyadarinya.
    const latinSah = !latPerNomor || A.ayat.every((x) => latPerNomor.has(x.nomor))
    if (latPerNomor && !latinSah) gagalSebagian.push('transliteration (verses did not line up)')

    const tafsirInfo = TAFSIR.find((t) => t.id === tafsirId)
    const ayat: Ayat[] = A.ayat.map((x) => ({
      nomor: x.nomor,
      arab: x.teks,
      terjemahan: terjPerNomor.get(x.nomor) ?? '',
      latin: latinSah ? latPerNomor?.get(x.nomor) : undefined,
      audio: audPerNomor?.get(x.nomor) || undefined,
      tafsir: tafPerNomor?.get(x.nomor)
        ? {
            teks: tafPerNomor.get(x.nomor) as string,
            oleh: tafsirInfo?.nama ?? String(tafsirId),
            bahasa: tafsirInfo?.bahasa ?? 'Unknown',
          }
        : undefined,
    }))

    const c = periksaSurah(A.surah, ayat)
    if (!c.utuh) { buangYangGagal(arab, terj, taf, lat, aud); throw new Error(c.alasan) }
    const t = periksaTerjemahan(A.surah, ayat, T.ayat.length)
    if (!t.utuh) { buangYangGagal(arab, terj, taf, lat, aud); throw new Error(t.alasan) }
    simpanLolos(arab, terj, taf, lat, aud)
    return { surah: A.surah, ayat, gagalSebagian }
  })
}

/** Nama tafsir untuk pesan galat; id mentah tidak berarti apa pun bagi pembaca. */
function NAMA_TAFSIR(id?: string): string {
  return TAFSIR.find((t) => t.id === id)?.nama ?? String(id)
}
function NAMA_QARI(id?: string): string {
  return QARI.find((q) => q.id === id)?.nama ?? String(id)
}

/**
 * Tafsir yang tersedia, selalu ditampilkan bersama nama penyusun DAN bahasanya.
 *
 * Bahasa disebut karena ia menentukan apakah tafsirnya bisa dipakai sama
 * sekali. Sebelumnya hanya dua tafsir berbahasa Arab yang tersedia, sehingga
 * seorang pengguna yang tidak membaca bahasa Arab menyalakan "commentary",
 * memperoleh satu blok teks yang tidak dapat ia baca, dan tidak memperoleh
 * apa pun dari fitur yang seluruh tujuannya adalah memahami.
 *
 * KENAPA TAFSIR PENTING DI APLIKASI KESEHATAN. Membaca ayat tanpa memahaminya
 * memberi ketenangan sesaat; memahaminya memberi sesuatu yang bisa dipakai
 * saat keadaan sulit. Itulah alasan tafsir ada di sini — bukan sebagai hiasan
 * keagamaan, melainkan karena makna yang dipahami adalah yang benar-benar
 * menopang seseorang.
 *
 * Dan justru karena itu ia harus datang dari ULAMA, bukan dari aplikasi ini.
 * Menyusun sendiri "makna" sebuah ayat untuk tujuan menenangkan pembaca adalah
 * cara paling halus untuk membelokkan wahyu menjadi motivasi — dan itu tidak
 * dilakukan di sini, tidak satu kalimat pun.
 */
export const TAFSIR = [
  { id: 'en.maududi', nama: 'Tafhim al-Qur’an — Abul A‘la Maududi', bahasa: 'English',
    tentang: 'A complete modern commentary, widely read and translated. Explains the context of each passage before its meaning.' },
  { id: 'en.jalalayn', nama: 'Tafsir al-Jalalayn (English)', bahasa: 'English',
    tentang: 'The classical concise commentary of al-Mahalli and al-Suyuti, in English translation. Short, close to the wording.' },
  { id: 'ar.muyassar', nama: 'Tafsir Al-Muyassar', bahasa: 'Arabic',
    tentang: 'Prepared by the King Fahd Complex. Plain modern Arabic, deliberately simple.' },
  { id: 'ar.jalalayn', nama: 'Tafsir Al-Jalalayn', bahasa: 'Arabic',
    tentang: 'The classical text in its original Arabic.' },
]

// ─────────────────────────────────────────────────────────────────────────────
// TAFSIR YANG BENAR-BENAR TERSEDIA, DITANYAKAN KEPADA PENYEDIANYA.
//
// Daftar TAFSIR di bawah ditulis tangan, dan itu menimbulkan satu masalah yang
// nyata: ia hanya memuat apa yang KEBETULAN diketahui saat berkas ini ditulis.
// Pengguna yang membaca terjemahan Kemenag lalu menyalakan tafsir memperoleh
// tafsir berbahasa Inggris atau Arab, dan menyimpulkan tafsir Indonesia tidak
// ada — padahal yang tidak ada hanyalah barisnya di berkas ini.
//
// Menambah id edisi berdasarkan TEBAKAN bukan jalan keluarnya: id yang keliru
// gagal diam-diam, atau lebih buruk, berhasil dengan isi yang bukan tafsir yang
// dikira pembacanya. Maka daftarnya DITANYAKAN kepada penyedia saat berjalan.
// Apa pun yang kembali nyata menurut definisi, sebab penyedianya sendiri yang
// menyebutkannya.
//
// Yang ditulis tangan tetap dipertahankan sebagai CADANGAN untuk keadaan tanpa
// jaringan, dan sebagai sumber keterangan "tentang" tiap tafsir yang memang
// tidak disediakan API.
// ─────────────────────────────────────────────────────────────────────────────

export interface TafsirTersedia {
  id: string
  nama: string
  bahasa: string
  /** true bila datang dari penyedia, false bila dari daftar cadangan. */
  dariPenyedia: boolean
  tentang?: string
}

const NAMA_BAHASA: Record<string, string> = {
  id: 'Indonesian', en: 'English', ar: 'Arabic', ur: 'Urdu', bn: 'Bengali',
  tr: 'Turkish', fr: 'French', ru: 'Russian', fa: 'Persian',
}

/**
 * Tafsir yang ditawarkan penyedia, disaring menurut bahasa bila diminta.
 *
 * Kegagalan TIDAK dilempar: yang memanggil memperoleh daftar cadangan, dan
 * layar tetap dapat menawarkan sesuatu. Yang tidak boleh terjadi adalah layar
 * kosong karena satu permintaan jaringan gagal.
 */
export async function daftarTafsir(bahasa?: string): Promise<TafsirTersedia[]> {
  const p = PENYEDIA[0]
  const cadangan = TAFSIR
    .filter((t) => !bahasa || t.bahasa.toLowerCase().startsWith(NAMA_BAHASA[bahasa]?.toLowerCase() ?? bahasa))
    .map((t) => ({ id: t.id, nama: t.nama, bahasa: t.bahasa, dariPenyedia: false, tentang: t.tentang }))

  try {
    const url = `${p.basis}/edition?format=text&type=tafsir${bahasa ? `&language=${encodeURIComponent(bahasa)}` : ''}`
    const j = await ambil<unknown>(url, `edisi-tafsir-${bahasa ?? 'semua'}`)
    const baris = ((j.data as { data?: unknown }).data ?? []) as Record<string, unknown>[]
    const hasil: TafsirTersedia[] = []
    for (const b of baris) {
      const id = String(b['identifier'] ?? '')
      const nama = String(b['englishName'] ?? b['name'] ?? id)
      const kode = String(b['language'] ?? '')
      if (!id || !nama) continue
      const tulis = TAFSIR.find((t) => t.id === id)
      hasil.push({
        id,
        nama: tulis?.nama ?? nama,
        bahasa: tulis?.bahasa ?? NAMA_BAHASA[kode] ?? (kode || 'Unknown'),
        dariPenyedia: true,
        tentang: tulis?.tentang,
      })
    }
    if (hasil.length) {
      simpanLolos(j)
      return hasil
    }
    return cadangan
  } catch {
    return cadangan
  }
}

/**
 * Satu tafsir yang paling cocok untuk bahasa yang diminta, bila ada.
 *
 * Dipakai layar yang perlu memilih SENDIRI tanpa bertanya — misalnya ubin ayat
 * harian, yang tidak punya tempat untuk sebuah pemilih.
 */
export async function tafsirUntukBahasa(bahasa: string): Promise<TafsirTersedia | null> {
  const l = await daftarTafsir(bahasa)
  return l.find((t) => t.dariPenyedia) ?? l[0] ?? null
}

export const TERJEMAHAN = [
  { id: 'en.sahih', nama: 'Saheeh International', bahasa: 'English' },
  { id: 'id.indonesian', nama: 'Kemenag RI', bahasa: 'Indonesian' },
  { id: 'en.pickthall', nama: 'Pickthall', bahasa: 'English' },
]

/**
 * Qari yang tersedia.
 *
 * MENDENGARKAN BUKAN TAMBAHAN KECIL. Al-Qur'an diturunkan sebagai bacaan yang
 * dilisankan, dan bagi pengguna yang belum membaca aksara Arab, rekaman adalah
 * satu-satunya jalan mendengar ayat sebagaimana ia dibunyikan. Berpasangan
 * dengan alih aksara, keduanya menjadi cara belajar melafalkan: dengar, lalu
 * ikuti.
 *
 * Rekamannya tidak disimpan aplikasi ini. Alamatnya datang dari penyedia yang
 * sama dengan teksnya dan diputar langsung oleh peramban.
 */
export const QARI = [
  { id: 'alafasy', nama: 'Mishary Rashid Alafasy', catatan: 'Clear and measured; the most widely used recording.' },
  { id: 'husary', nama: 'Mahmoud Khalil Al-Husary', catatan: 'Slow and deliberate — the usual choice for learning pronunciation.' },
  { id: 'minshawi', nama: 'Mohamed Siddiq El-Minshawi', catatan: 'Mujawwad style, slower and more melodic.' },
]

/**
 * Pertanyaan renungan.
 *
 * Ini BUKAN tafsir dan tidak mengklaim kewenangan keagamaan apa pun. Ia
 * pertanyaan terbuka yang mengembalikan penafsiran kepada pembaca dan gurunya
 * — bentuk paling jujur yang bisa diberikan perangkat lunak pada wilayah ini.
 */
export const RENUNGAN: string[] = [
  'What is being asked of the reader here, in plain terms?',
  'Where in this week did you meet this — and what did you do?',
  'What would change tomorrow if you took this seriously?',
  'Who does this passage ask you to be more careful with?',
  'What does this ask you to give up, not just to add?',
]

export function renunganUntuk(surah: number, ayat: number): string {
  // Tetap sama untuk ayat yang sama, supaya seseorang bisa kembali ke
  // pertanyaan yang kemarin ia pikirkan, bukan pertanyaan acak baru.
  return RENUNGAN[(surah * 31 + ayat) % RENUNGAN.length]
}

// ─────────────────────────────────────────────────────────────────────────────
// Kitab lain — aturan yang sama, tanpa pengecualian.
//
// Alkitab dan Tanakh diambil dari penyedia yang disebut namanya, diperiksa
// keutuhannya, dan tidak pernah ditulis dari ingatan. Yang berbeda hanya
// pemeriksaannya: Al-Qur'an punya jumlah surah dan ayat yang disepakati
// universal, sedangkan jumlah kitab Alkitab BERBEDA antar-kanon — Protestan,
// Katolik, dan Ortodoks tidak sama. Maka memaksakan satu angka justru akan
// menolak kanon yang sah.
//
// Karena itu pemeriksaannya di sini bersifat struktural, bukan jumlah:
// jawaban harus berisi teks, teksnya harus beraksara yang benar, dan tidak
// boleh mengandung penanda kerusakan. Perbedaan kanon disebut di layar
// sebagai perbedaan, bukan disembunyikan dengan memilih satu diam-diam.
// ─────────────────────────────────────────────────────────────────────────────

export interface Bacaan {
  rujukan: string
  teks: string
  /** Terjemahan atau edisi yang dipakai — wajib, karena maknanya bisa berbeda. */
  edisi: string
}

const IBRANI = /[֐-׿]/

/**
 * Periksa satu bacaan non-Arab.
 *
 * `aksara` menentukan huruf apa yang harus ada. Untuk teks terjemahan Latin
 * pemeriksaannya hanya "ada isinya dan tidak rusak", karena memaksakan pola
 * huruf pada bahasa terjemahan akan salah menolak.
 */
export function periksaBacaan(b: Bacaan, aksara?: 'ibrani'): HasilPeriksa {
  if (!b.teks || b.teks.trim().length < 2) {
    return { utuh: false, alasan: 'The passage came back empty, so nothing is shown.' }
  }
  if (RUSAK.test(b.teks)) {
    return { utuh: false, alasan: 'The passage contains replacement characters, which means the encoding was corrupted in transit. Nothing is shown.' }
  }
  if (/<\/?(html|body|script)\b/i.test(b.teks)) {
    return { utuh: false, alasan: 'The provider returned a web page rather than text. Nothing is shown.' }
  }
  if (aksara === 'ibrani' && !IBRANI.test(b.teks)) {
    return { utuh: false, alasan: 'The Hebrew text did not arrive in Hebrew script, so nothing is shown.' }
  }
  return { utuh: true }
}

/** Alkitab — satu petikan. Terjemahannya selalu ikut dilaporkan. */
export async function bacaAlkitab(rujukan: string, terjemahan = 'web'): Promise<Bacaan> {
  const url = `${SUMBER.bible.basis}/${encodeURIComponent(rujukan)}?translation=${encodeURIComponent(terjemahan)}`
  const j = await ambil<Record<string, unknown>>(url, `bible-${rujukan}-${terjemahan}`)
  const d = j.data
  const b: Bacaan = {
    rujukan: String(d['reference'] ?? rujukan),
    teks: String(d['text'] ?? '').trim(),
    edisi: String(d['translation_name'] ?? terjemahan),
  }
  const c = periksaBacaan(b)
  if (!c.utuh) { buangYangGagal(j); throw new Error(c.alasan) }
  simpanLolos(j)
  return b
}

/** Tanakh / Taurat — teks Ibrani beserta terjemahannya. */
export async function bacaTanakh(rujukan: string): Promise<{ ibrani: Bacaan; terjemahan: Bacaan }> {
  const url = `${SUMBER.tanakh.basis}/texts/${encodeURIComponent(rujukan)}?context=0`
  const j = await ambil<Record<string, unknown>>(url, `tanakh-${rujukan}`)
  const d = j.data
  const gabung = (v: unknown): string =>
    Array.isArray(v) ? v.map(gabung).join(' ') : String(v ?? '').replace(/<[^>]+>/g, '').trim()

  const ibrani: Bacaan = { rujukan, teks: gabung(d['he']), edisi: String(d['heVersionTitle'] ?? 'Hebrew') }
  const terjemahan: Bacaan = { rujukan, teks: gabung(d['text']), edisi: String(d['versionTitle'] ?? 'English') }

  const a = periksaBacaan(ibrani, 'ibrani')
  if (!a.utuh) { buangYangGagal(j); throw new Error(a.alasan) }
  const b = periksaBacaan(terjemahan)
  if (!b.utuh) { buangYangGagal(j); throw new Error(b.alasan) }
  simpanLolos(j)
  return { ibrani, terjemahan }
}

/**
 * Pembacaan tradisi lain — kanon Pali dan kitab Konfusius.
 *
 * Bentuk jawaban kedua penyedia BERBEDA satu sama lain dan berbeda pula dari
 * penyedia Al-Qur'an, jadi masing-masing dibaca oleh fungsinya sendiri. Tidak
 * ada tebakan bersama yang berlaku untuk semua — tebakan semacam itu sudah
 * pernah dibuang dari berkas ini sekali.
 *
 * Keduanya melewati periksaBacaan yang sama dengan Alkitab dan Tanakh, jadi
 * jawaban kosong, jawaban rusak, dan halaman web yang menyamar sebagai teks
 * sama-sama ditolak alih-alih ditampilkan.
 */
export async function bacaTradisi(tradisi: Tradisi, rujukan: string): Promise<Bacaan[]> {
  const png = PENGANTAR.find((x) => x.tradisi === tradisi)
  if (!png?.baca) throw new Error('No reader is configured for this tradition.')
  const b = png.baca

  if (tradisi === 'buddhist') {
    const j = await ambil<Record<string, unknown>>(
      `${b.basis}/suttas/${encodeURIComponent(rujukan)}`, `sc-${rujukan}`)
    const d = j.data
    const akar = (d['root_text'] ?? {}) as Record<string, unknown>
    const terj = (d['translation'] ?? {}) as Record<string, unknown>
    const rapikan = (v: unknown): string => {
      if (v && typeof v === 'object') return Object.values(v as Record<string, unknown>).map(rapikan).join(' ')
      return String(v ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    }
    const keluar: Bacaan[] = []
    const tPali = rapikan(akar['text'] ?? akar)
    const tIng = rapikan(terj['text'] ?? terj)
    if (tPali) keluar.push({ rujukan, teks: tPali, edisi: String(akar['lang'] ?? 'Pali') })
    if (tIng) keluar.push({ rujukan, teks: tIng, edisi: String(terj['author'] ?? terj['lang'] ?? 'English translation') })
    for (const x of keluar) {
      const c = periksaBacaan(x)
      if (!c.utuh) { buangYangGagal(j); throw new Error(c.alasan) }
    }
    if (!keluar.length) {
      buangYangGagal(j)
      throw new Error(`${b.penyedia} returned nothing for "${rujukan}". Check the reference — nothing is shown rather than a guess.`)
    }
    simpanLolos(j)
    return keluar
  }

  // Chinese Text Project: { fulltext: [ "…", "…" ] }
  const j = await ambil<Record<string, unknown>>(
    `${b.basis}/gettext?urn=ctp:${encodeURIComponent(rujukan)}`, `ctext-${rujukan}`)
  const d = j.data
  const baris = Array.isArray(d['fulltext']) ? (d['fulltext'] as unknown[]) : []
  const teks = baris.map((x) => String(x ?? '').replace(/<[^>]+>/g, ' ').trim()).filter(Boolean).join('\n')
  const bacaan: Bacaan = { rujukan, teks, edisi: String(d['title'] ?? b.penyedia) }
  const c = periksaBacaan(bacaan)
  if (!c.utuh) { buangYangGagal(j); throw new Error(c.alasan) }
  simpanLolos(j)
  return [bacaan]
}

/**
 * Pengantar ringkas untuk tradisi yang teksnya TIDAK dimuat.
 *
 * Ditulis sebagai keterangan, bukan kutipan. Tidak ada satu pun petikan kitab
 * di sini — menyebutkan sebuah kitab itu keterangan, mengutip isinya dari
 * ingatan adalah hal yang sudah dilarang di kepala berkas ini, dan larangan
 * itu tidak berhenti hanya karena tradisinya berbeda.
 */
export interface Pengantar {
  tradisi: Tradisi
  nama: string
  ikon: string
  ringkas: string
  susunan: string[]
  /** Ke mana pembaca yang serius harus pergi. */
  sumberUtama: { nama: string; situs: string }[]
  /**
   * Pembacaan langsung, bila ada penyedia yang bisa disebut namanya.
   *
   * Tidak semua tradisi punya. Weda TIDAK punya, dan itu dinyatakan apa adanya
   * di layar alih-alih ditambal dengan sumber yang tidak jelas asalnya —
   * "tidak ada sumber yang bisa kami pertanggungjawabkan" adalah jawaban yang
   * sah, dan jauh lebih baik daripada teks yang tidak diketahui dari mana.
   */
  baca?: {
    penyedia: string
    situs: string
    basis: string
    /** Contoh rujukan yang bisa langsung dicoba pengguna. */
    contoh: { label: string; rujukan: string }[]
    petunjuk: string
  }
}

export const PENGANTAR: Pengantar[] = [
  {
    tradisi: 'veda', nama: 'Vedas & Upanishads', ikon: '🕉️',
    ringkas: 'The oldest layer of Hindu scripture, transmitted orally for centuries before being written. The Upanishads sit at the end of that corpus and turn from ritual toward questions of self and reality.',
    susunan: ['Four Vedas: Rig, Yajur, Sama, Atharva', 'Each with Samhita, Brahmana, Aranyaka, and Upanishad layers', 'Principal Upanishads number around a dozen by most reckonings'],
    sumberUtama: [
      { nama: 'GRETIL — Göttingen Register of Electronic Texts in Indian Languages', situs: 'http://gretil.sub.uni-goettingen.de' },
      { nama: 'Sacred-texts archive', situs: 'https://sacred-texts.com/hin' },
    ],
    // Sengaja TANPA pembacaan langsung. Arsip yang ada memang bagus untuk
    // dibaca manusia, tetapi tidak satu pun menyediakan antarmuka yang bisa
    // kami panggil sambil tetap menyebutkan edisi dan penyuntingnya per
    // petikan. Menampilkan teks Weda tanpa bisa menyebut edisinya sama saja
    // dengan menampilkan teks yang tidak diketahui asalnya, dan itu dilarang
    // di kepala berkas ini.
  },
  {
    tradisi: 'buddhist', nama: 'Pali Canon (Tipiṭaka)', ikon: '☸️',
    ringkas: 'The earliest complete Buddhist canon, preserved in Pali. Its name means "three baskets" — monastic rule, discourses, and systematic analysis.',
    susunan: ['Vinaya Piṭaka — monastic discipline', 'Sutta Piṭaka — discourses', 'Abhidhamma Piṭaka — systematic analysis'],
    sumberUtama: [
      { nama: 'SuttaCentral — original texts with translations', situs: 'https://suttacentral.net' },
      { nama: 'Access to Insight', situs: 'https://accesstoinsight.org' },
    ],
    baca: {
      penyedia: 'SuttaCentral',
      situs: 'https://suttacentral.net',
      basis: 'https://suttacentral.net/api',
      contoh: [
        { label: 'Dhammapada 1', rujukan: 'dhp1-20' },
        { label: 'The first discourse (SN 56.11)', rujukan: 'sn56.11' },
        { label: 'Mindfulness of breathing (MN 118)', rujukan: 'mn118' },
        { label: 'Loving-kindness (Snp 1.8)', rujukan: 'snp1.8' },
      ],
      petunjuk: 'Enter a SuttaCentral reference such as "mn118" or "sn56.11". The identifiers follow the standard citation system for the Pali Canon.',
    },
  },
  {
    tradisi: 'confucian', nama: 'Confucian classics', ikon: '📜',
    ringkas: 'A body of texts on conduct, governance, and self-cultivation. Read as ethical and social philosophy more often than as revelation, which is itself a difference worth noticing.',
    susunan: ['Four Books: Analects, Mencius, Great Learning, Doctrine of the Mean', 'Five Classics, including the Book of Changes and Book of Odes'],
    sumberUtama: [
      { nama: 'Chinese Text Project — original texts with translations', situs: 'https://ctext.org' },
    ],
    baca: {
      penyedia: 'Chinese Text Project (ctext.org)',
      situs: 'https://ctext.org',
      basis: 'https://api.ctext.org',
      contoh: [
        { label: 'Analects — Book 1', rujukan: 'analects/xue-er' },
        { label: 'Analects — Book 2', rujukan: 'analects/wei-zheng' },
        { label: 'Great Learning', rujukan: 'liji/da-xue' },
        { label: 'Doctrine of the Mean', rujukan: 'liji/zhong-yong' },
      ],
      petunjuk: 'Enter a Chinese Text Project reference such as "analects/xue-er". The original Chinese is shown; English is included where the project carries a parallel translation.',
    },
  },
]
