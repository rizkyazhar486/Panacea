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
  /** Bentuk jawaban berbeda antarpenyedia, jadi tiap penyedia membaca sendiri. */
  bacaDaftar: (j: unknown) => Surah[]
  bacaSurah: (j: unknown) => { surah: Surah; ayat: { nomor: number; teks: string }[] }
  /** Syarat pemakaian yang wajib dipatuhi, mis. keharusan mencantumkan sumber. */
  syarat: string
}

export const SUMBER: Record<Tradisi, Sumber> = {
  quran: {
    id: 'alquran-cloud',
    nama: 'Al-Qur’an',
    penerbit: 'AlQuran Cloud API — teks Utsmani dari proyek Tanzil',
    situs: 'https://alquran.cloud',
    basis: 'https://api.alquran.cloud/v1',
    catatan: 'Teks Arab, terjemahan, dan tafsir diambil langsung dari penyedia. Aplikasi ini tidak menulis ulang satu huruf pun.',
    provenansi: {
      acuan: 'Mushaf Madinah, riwayat Hafs dari ‘Ashim — cetakan Mujamma‘ al-Malik Fahd (King Fahd Glorious Qur’an Printing Complex).',
      rantai: 'Penyedia menyajikan teks Utsmani yang berasal dari proyek Tanzil, yang teksnya disusun dan diperiksa terhadap mushaf cetakan Mujamma‘ al-Malik Fahd. Aplikasi ini tidak menambah lapisan penyuntingan apa pun di atasnya.',
      caraPeriksa: 'Buka mushaf cetak di tangan Anda pada surah dan ayat yang sama, lalu bandingkan huruf per huruf. Bila ada satu perbedaan saja, hentikan pemakaian dan laporkan — jangan diperbaiki sendiri di aplikasi.',
    },
  },
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
  veda: {
    id: 'ringkas-veda', nama: 'Weda & Upanishad', penerbit: '—', situs: '', basis: '',
    catatan: 'Hanya pengantar ringkas. Teks lengkapnya tidak dimuat karena belum ada sumber yang bisa kami rujuk dengan yakin.',
  },
  buddhist: {
    id: 'ringkas-buddha', nama: 'Kanon Pali', penerbit: '—', situs: '', basis: '',
    catatan: 'Hanya pengantar ringkas, dengan rujukan ke sumber utama untuk pembacaan lanjutan.',
  },
  confucian: {
    id: 'ringkas-konghucu', nama: 'Kitab Konfusius', penerbit: '—', situs: '', basis: '',
    catatan: 'Hanya pengantar ringkas, dengan rujukan ke sumber utama untuk pembacaan lanjutan.',
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
  /** Tafsir bila diminta; selalu bersama nama penyusunnya. */
  tafsir?: { teks: string; oleh: string }
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
    c[k] = { pada: Date.now(), data }
    localStorage.setItem(KUNCI_CACHE, JSON.stringify(c))
  } catch { /* kuota penuh — pembacaan daring tetap jalan */ }
}

async function ambil<T>(url: string, kunci: string): Promise<T> {
  const tersimpan = bacaCache<T>(kunci)
  if (tersimpan) return tersimpan
  const r = await fetch(url)
  if (!r.ok) throw new Error(`gagal_memuat_${r.status}`)
  const j = (await r.json()) as { data?: T }
  const d = (j.data ?? j) as T
  tulisCache(kunci, d)
  return d
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
    edisiTafsir: { 'ar.muyassar': 'ar.muyassar', 'ar.jalalayn': 'ar.jalalayn' },
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
    const out = p.bacaDaftar(j)
    const c = periksaDaftarSurah(out)
    if (!c.utuh) throw new Error(c.alasan)
    return out
  })
}

/**
 * Satu surah lengkap: Arab, terjemahan, dan tafsir bila diminta.
 *
 * Ketiganya diminta sekaligus karena membaca satu surah tanpa terjemahannya
 * bukan membaca, dan menunggu dua kali muat membuat orang menutup halaman.
 */
export async function bacaSurah(
  nomor: number,
  terjemahan = 'en.sahih',
  tafsirId?: string,
): Promise<{ surah: Surah; ayat: Ayat[] }> {
  return lewatPenyedia(async (p) => {
    const url = (ed: string) => `${p.basis}${p.jalurSurah.replace('{n}', String(nomor)).replace('{ed}', ed)}`
    const edTerj = p.edisiTerjemahan[terjemahan] ?? terjemahan
    const edTaf = tafsirId ? p.edisiTafsir[tafsirId] : undefined

    const [arab, terj, taf] = await Promise.all([
      ambil<unknown>(url(p.edisiArab), `${p.id}-s${nomor}-ar`),
      ambil<unknown>(url(edTerj), `${p.id}-s${nomor}-${edTerj}`),
      edTaf ? ambil<unknown>(url(edTaf), `${p.id}-s${nomor}-${edTaf}`).catch(() => null) : Promise.resolve(null),
    ])

    const A = p.bacaSurah(arab)
    const T = p.bacaSurah(terj)
    const F = taf ? p.bacaSurah(taf) : null

    const ayat: Ayat[] = A.ayat.map((x, i) => ({
      nomor: x.nomor,
      arab: x.teks,
      terjemahan: T.ayat[i]?.teks ?? '',
      tafsir: F?.ayat[i]?.teks
        ? { teks: F.ayat[i].teks, oleh: TAFSIR.find((t) => t.id === tafsirId)?.nama ?? String(tafsirId) }
        : undefined,
    }))

    const c = periksaSurah(A.surah, ayat)
    if (!c.utuh) throw new Error(c.alasan)
    return { surah: A.surah, ayat }
  })
}

/** Tafsir yang tersedia, selalu ditampilkan bersama nama penyusunnya. */
export const TAFSIR = [
  { id: 'ar.muyassar', nama: 'Tafsir Al-Muyassar', bahasa: 'Arab' },
  { id: 'ar.jalalayn', nama: 'Tafsir Al-Jalalayn', bahasa: 'Arab' },
]

export const TERJEMAHAN = [
  { id: 'en.sahih', nama: 'Saheeh International', bahasa: 'Inggris' },
  { id: 'id.indonesian', nama: 'Kemenag RI', bahasa: 'Indonesia' },
  { id: 'en.pickthall', nama: 'Pickthall', bahasa: 'Inggris' },
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
