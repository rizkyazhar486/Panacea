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

export interface Sumber {
  id: string
  nama: string
  /** Siapa yang menerbitkan teksnya, agar pembaca bisa memeriksa sendiri. */
  penerbit: string
  situs: string
  /** Pangkalan API. Diambil peramban pengguna, bukan server aplikasi ini. */
  basis: string
  catatan: string
}

/**
 * Sumber teks. Semuanya penyedia yang teksnya dirujuk luas dan bisa diperiksa.
 *
 * Untuk Al-Qur'an dipakai teks yang berasal dari proyek Tanzil, yang menelusuri
 * rujukannya ke mushaf terverifikasi. Itu disebut di layar, bukan disembunyikan.
 */
export const SUMBER: Record<Tradisi, Sumber> = {
  quran: {
    id: 'alquran-cloud',
    nama: 'Al-Qur’an',
    penerbit: 'AlQuran Cloud API — teks Utsmani dari proyek Tanzil',
    situs: 'https://alquran.cloud',
    basis: 'https://api.alquran.cloud/v1',
    catatan: 'Teks Arab, terjemahan, dan tafsir diambil langsung dari penyedia. Aplikasi ini tidak menulis ulang satu huruf pun.',
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

/** Daftar 114 surah. */
export async function daftarSurah(): Promise<Surah[]> {
  type Mentah = { number: number; englishName: string; name: string
    englishNameTranslation: string; numberOfAyahs: number; revelationType: string }
  const d = await ambil<Mentah[]>(`${SUMBER.quran.basis}/surah`, 'surah-list')
  return d.map((s) => ({
    nomor: s.number, nama: s.englishName, namaArab: s.name,
    arti: s.englishNameTranslation, jumlahAyat: s.numberOfAyahs, tempat: s.revelationType,
  }))
}

/**
 * Satu surah lengkap: Arab, terjemahan, dan tafsir bila diminta.
 *
 * Tiga permintaan digabung sekaligus karena membaca satu surah tanpa
 * terjemahannya bukan membaca, dan menunggu dua kali muat membuat orang
 * menutup halaman.
 */
export async function bacaSurah(
  nomor: number,
  terjemahan = 'en.sahih',
  tafsirId?: string,
): Promise<{ surah: Surah; ayat: Ayat[] }> {
  type A = { number: number; numberInSurah: number; text: string }
  type S = { number: number; englishName: string; name: string
    englishNameTranslation: string; numberOfAyahs: number; revelationType: string; ayahs: A[] }

  const [arab, terj, taf] = await Promise.all([
    ambil<S>(`${SUMBER.quran.basis}/surah/${nomor}/quran-uthmani`, `s-${nomor}-ar`),
    ambil<S>(`${SUMBER.quran.basis}/surah/${nomor}/${terjemahan}`, `s-${nomor}-${terjemahan}`),
    tafsirId
      ? ambil<S>(`${SUMBER.quran.basis}/surah/${nomor}/${tafsirId}`, `s-${nomor}-${tafsirId}`).catch(() => null)
      : Promise.resolve(null),
  ])

  const surah: Surah = {
    nomor: arab.number, nama: arab.englishName, namaArab: arab.name,
    arti: arab.englishNameTranslation, jumlahAyat: arab.numberOfAyahs, tempat: arab.revelationType,
  }
  const ayat: Ayat[] = arab.ayahs.map((a, i) => ({
    nomor: a.numberInSurah,
    arab: a.text,
    terjemahan: terj.ayahs[i]?.text ?? '',
    tafsir: taf?.ayahs[i]?.text
      ? { teks: taf.ayahs[i].text, oleh: TAFSIR.find((t) => t.id === tafsirId)?.nama ?? tafsirId! }
      : undefined,
  }))
  return { surah, ayat }
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
