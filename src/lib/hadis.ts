// ─────────────────────────────────────────────────────────────────────────────
// Hadis — dan kenapa ia sebelumnya sengaja TIDAK dipasang.
//
// Pemasangan hadis pernah ditolak di sini, dan alasannya bukan teknis. Nilai
// sebuah hadis bergantung pada DERAJATNYA — sahih, hasan, atau daif — dan
// derajat itu ditetapkan lewat penelaahan sanad oleh ahli hadis. Menampilkan
// teks hadis tanpa derajatnya berarti menaruh riwayat lemah dan riwayat sahih
// dalam bentuk yang persis sama di layar, dan pembaca tidak punya cara
// membedakannya. Sebuah aplikasi yang mengedarkan riwayat lemah seolah setara
// dengan yang sahih sedang menyebarkan sesuatu yang tidak layak ia sebarkan.
//
// Masalahnya nyata: penyedia gratis yang ada memuat TEKS hadis, tetapi tidak
// memuat penilaian derajat per hadis yang bisa ditelusuri.
//
// YANG DIKERJAKAN SEKARANG, dan kenapa ia bisa dipertanggungjawabkan.
//
// Ada satu kelompok kitab yang persoalan derajatnya selesai di tingkat KITAB,
// bukan per hadis: Sahih al-Bukhari dan Sahih Muslim. Keduanya disusun dengan
// syarat penerimaan yang ditetapkan penyusunnya sendiri, dan keseluruhan isinya
// diterima sebagai sahih oleh kesepakatan luas ulama Sunni selama berabad-abad.
// Untuk dua kitab itu, menampilkan teks tanpa label derajat per hadis TIDAK
// menyesatkan, karena derajatnya melekat pada kitabnya.
//
// Maka:
//
//   1. Sahih al-Bukhari dan Sahih Muslim ditampilkan sebagai bacaan utama,
//      dengan keterangan kenapa keduanya berdiri sendiri.
//   2. Kitab Sunan yang empat DITANDAI BERBEDA dan diberi peringatan yang
//      tidak bisa dilewati: isinya bercampur derajat, penyedia ini tidak
//      membawa penilaiannya, jadi satu hadis dari sana TIDAK BOLEH dijadikan
//      dasar amalan sebelum derajatnya diperiksa pada rujukan yang menyebutkan
//      penilaian ahli.
//   3. Aplikasi ini TIDAK PERNAH menilai derajat sendiri, tidak pernah menebak,
//      dan tidak pernah menuliskan teks hadis dari ingatan. Aturan yang sama
//      dengan yang berlaku pada Al-Qur'an di lib/kitab.ts.
//
// Menyembunyikan seluruh hadis juga bukan sikap yang jujur — ia menghilangkan
// bagian besar dari apa yang dicari pengguna. Yang jujur adalah menampilkan
// yang memang bisa dipertanggungjawabkan, dan menyatakan dengan terang batas
// dari yang lain.
// ─────────────────────────────────────────────────────────────────────────────

/** Bagaimana derajat riwayat sebuah kitab dapat dipertanggungjawabkan. */
export type Derajat =
  /** Seluruh isinya diterima sahih pada tingkat kitab. */
  | 'sahih-kitab'
  /** Isinya bercampur derajat, dan penyedia ini tidak membawa penilaiannya. */
  | 'campuran-tanpa-penilaian'

export interface Kitab {
  id: string
  nama: string
  penyusun: string
  /** Edisi Inggris pada penyedia. */
  edisiInggris: string
  /** Edisi Arab pada penyedia. */
  edisiArab: string
  derajat: Derajat
  tentang: string
}

/**
 * Penyedia teks hadis.
 *
 * Gratis dan tanpa kunci API, disajikan lewat CDN sebagai berkas JSON statis
 * dari kumpulan terjemahan hadis yang sudah diterbitkan. Ia membawa TEKS, dan
 * itu saja — inilah yang membuat pembagian kitab di atas menjadi keharusan,
 * bukan kehati-hatian berlebihan.
 */
export const PENYEDIA_HADIS = {
  nama: 'hadith-api (fawazahmed0)',
  situs: 'https://github.com/fawazahmed0/hadith-api',
  basis: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1',
  catatan:
    'Free, no API key, served as static JSON from a CDN. It carries the text of published collections and their translations — it does not carry per-hadith gradings, which is why the collections below are separated the way they are.',
  /** Ke mana pembaca yang serius memeriksa derajat sebuah riwayat. */
  periksaDerajat: { nama: 'sunnah.com', situs: 'https://sunnah.com' },
}

export const KITAB: Kitab[] = [
  {
    id: 'bukhari',
    nama: 'Sahih al-Bukhari',
    penyusun: 'Muhammad ibn Isma‘il al-Bukhari (d. 256 AH / 870 CE)',
    edisiInggris: 'eng-bukhari',
    edisiArab: 'ara-bukhari',
    derajat: 'sahih-kitab',
    tentang:
      'Compiled over sixteen years against acceptance criteria the compiler set out and applied himself. Sunni scholarship has treated the collection as authentic as a whole for over a thousand years.',
  },
  {
    id: 'muslim',
    nama: 'Sahih Muslim',
    penyusun: 'Muslim ibn al-Hajjaj (d. 261 AH / 875 CE)',
    edisiInggris: 'eng-muslim',
    edisiArab: 'ara-muslim',
    derajat: 'sahih-kitab',
    tentang:
      'The second collection accepted as authentic in full. Arranged by topic more strictly than al-Bukhari, and often narrates a report through several chains together.',
  },
  {
    id: 'abudawud',
    nama: 'Sunan Abu Dawud',
    penyusun: 'Abu Dawud al-Sijistani (d. 275 AH / 889 CE)',
    edisiInggris: 'eng-abudawud',
    edisiArab: 'ara-abudawud',
    derajat: 'campuran-tanpa-penilaian',
    tentang: 'Focused on reports bearing on law. Contains authentic, good and weak reports together.',
  },
  {
    id: 'tirmidhi',
    nama: 'Jami‘ at-Tirmidhi',
    penyusun: 'Abu ‘Isa al-Tirmidhi (d. 279 AH / 892 CE)',
    edisiInggris: 'eng-tirmidhi',
    edisiArab: 'ara-tirmidhi',
    derajat: 'campuran-tanpa-penilaian',
    tentang: 'The compiler commented on the standing of many reports himself, but those remarks are not carried by this provider.',
  },
  {
    id: 'nasai',
    nama: 'Sunan an-Nasa’i',
    penyusun: 'Ahmad al-Nasa’i (d. 303 AH / 915 CE)',
    edisiInggris: 'eng-nasai',
    edisiArab: 'ara-nasai',
    derajat: 'campuran-tanpa-penilaian',
    tentang: 'Regarded as the most rigorous of the four Sunan, but still mixed in grade.',
  },
  {
    id: 'ibnmajah',
    nama: 'Sunan Ibn Majah',
    penyusun: 'Ibn Majah al-Qazwini (d. 273 AH / 887 CE)',
    edisiInggris: 'eng-ibnmajah',
    edisiArab: 'ara-ibnmajah',
    derajat: 'campuran-tanpa-penilaian',
    tentang: 'The last of the six books. Holds a higher proportion of weak reports than the others.',
  },
]

export interface Hadis {
  nomor: number
  teks: string
  arab?: string
  /** Nama bab, bila penyedia membawanya. */
  bab?: string
}

export interface HalamanHadis {
  kitab: Kitab
  /** Nomor awal dan akhir yang benar-benar diterima. */
  dari: number
  sampai: number
  hadis: Hadis[]
  /** Jumlah seluruh hadis dalam kitab menurut penyedia. */
  total: number
  /** Bagian yang diminta tetapi gagal, mis. teks Arabnya. */
  gagalSebagian: string[]
}

// Ditulis sebagai escape, BUKAN sebagai huruf apa adanya. Rentang aksara yang
// diketik langsung ke dalam kode mudah rusak saat berkasnya disalin, disunting,
// atau diproses ulang — dan bila rentangnya rusak, pemeriksaannya berhenti
// mencocokkan apa pun tanpa satu pun galat. Uji pertama berkas ini menemukan
// persis itu: seluruh pemeriksaan aksara Arab lulus karena ia tidak pernah
// mencocokkan apa-apa.
const RUSAK = /\uFFFD/
const ARAB = /[\u0600-\u06FF\u0750-\u077F]/

export interface HasilPeriksa { utuh: boolean; alasan?: string }

/**
 * Pemeriksaan keutuhan, sejenis dengan yang berlaku pada Al-Qur'an.
 *
 * Yang diperiksa hanya hal yang bisa dihitung, bukan isinya — menilai isi
 * riwayat adalah pekerjaan ahli hadis, bukan pekerjaan program ini.
 */
export function periksaHadis(h: Hadis[], diminta: number[]): HasilPeriksa {
  if (!h.length) {
    return { utuh: false, alasan: 'The provider returned no hadith for this range, so nothing is shown.' }
  }
  for (const x of h) {
    if (!x.teks || x.teks.trim().length < 3) {
      return { utuh: false, alasan: `Hadith ${x.nomor} arrived without text, so nothing is shown.` }
    }
    if (RUSAK.test(x.teks) || (x.arab && RUSAK.test(x.arab))) {
      return { utuh: false, alasan: `Hadith ${x.nomor} contains replacement characters, which means the encoding was corrupted in transit. Nothing is shown.` }
    }
    if (/<\/?(html|body|script)\b/i.test(x.teks)) {
      return { utuh: false, alasan: 'The provider returned a web page rather than text. Nothing is shown.' }
    }
    if (x.arab && !ARAB.test(x.arab)) {
      return { utuh: false, alasan: `The Arabic for hadith ${x.nomor} did not arrive in Arabic script, so nothing is shown.` }
    }
  }
  // Nomor yang datang harus nomor yang diminta. Tanpa ini, satu pergeseran
  // penomoran di sisi penyedia membuat setiap hadis tampil di bawah nomor
  // milik hadis lain — dan mengutip riwayat dengan nomor yang salah adalah
  // kesalahan yang akan ikut tersalin ke mana pun kutipan itu dibawa.
  const ada = new Set(h.map((x) => x.nomor))
  const meleset = diminta.filter((n) => !ada.has(n))
  if (meleset.length === diminta.length) {
    return { utuh: false, alasan: 'None of the hadith numbers returned match the ones requested, so the numbering cannot be trusted. Nothing is shown.' }
  }
  return { utuh: true }
}

// Cache tujuh hari, dengan aturan yang sama seperti kitab suci: apa pun hanya
// disimpan SESUDAH lolos periksa. Menyimpan lebih dulu berarti satu jawaban
// rusak menetap sepekan dan memuat ulang halaman tidak menolong.
const KUNCI_CACHE = 'pmd-hadis-v1'
const UMUR_CACHE = 7 * 86400_000

interface Cache { [k: string]: { pada: number; data: unknown } }

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
    const batas = Date.now() - UMUR_CACHE
    for (const [nama, isi] of Object.entries(c)) if (!isi || isi.pada < batas) delete c[nama]
    c[k] = { pada: Date.now(), data }
    try {
      localStorage.setItem(KUNCI_CACHE, JSON.stringify(c))
    } catch {
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
  } catch { /* tidak perlu */ }
}

interface Diambil<T> { data: T; kunci: string; dariCache: boolean }

async function ambil<T>(url: string, kunci: string): Promise<Diambil<T>> {
  const tersimpan = bacaCache<T>(kunci)
  if (tersimpan) return { data: tersimpan, kunci, dariCache: true }
  const r = await fetch(url)
  if (!r.ok) throw new Error(`gagal_memuat_${r.status}`)
  return { data: (await r.json()) as T, kunci, dariCache: false }
}

/** Bentuk jawaban penyedia, dibaca di satu tempat saja. */
interface JawabanHadis {
  hadiths?: { hadithnumber?: number | string; text?: string; reference?: unknown }[]
  metadata?: { name?: string; sections?: Record<string, string>; last_hadithnumber?: number | string }
}

function bacaJawaban(j: unknown): { hadis: Hadis[]; total: number } {
  const d = (j ?? {}) as JawabanHadis
  const list = Array.isArray(d.hadiths) ? d.hadiths : []
  return {
    hadis: list
      .map((x) => ({ nomor: Number(x?.hadithnumber), teks: String(x?.text ?? '').trim() }))
      .filter((x) => Number.isFinite(x.nomor)),
    total: Number(d.metadata?.last_hadithnumber ?? 0) || list.length,
  }
}

/** Satu bagian (section) sebuah kitab, beserta teks Arabnya bila tersedia. */
export async function bacaBagian(kitabId: string, bagian: number): Promise<HalamanHadis> {
  const k = KITAB.find((x) => x.id === kitabId)
  if (!k) throw new Error('Unknown collection.')
  const gagalSebagian: string[] = []

  const alamat = (ed: string) => `${PENYEDIA_HADIS.basis}/editions/${ed}/sections/${bagian}.json`

  const ing = await ambil<unknown>(alamat(k.edisiInggris), `${k.edisiInggris}-s${bagian}`)
  // Teks Arab bersifat tambahan: kegagalannya tidak boleh membatalkan bacaan,
  // tetapi ia juga tidak boleh hilang diam-diam.
  const ara = await ambil<unknown>(alamat(k.edisiArab), `${k.edisiArab}-s${bagian}`).catch(() => null)
  if (!ara) gagalSebagian.push('Arabic text')

  const I = bacaJawaban(ing.data)
  const A = ara ? bacaJawaban(ara.data) : null

  // Dipasangkan menurut NOMOR HADIS, tidak pernah menurut urutan larik —
  // alasannya sama persis dengan pemasangan terjemahan Al-Qur'an: pergeseran
  // satu langkah menaruh teks Arab sebuah riwayat di bawah terjemahan riwayat
  // yang lain, dan hasilnya terlihat sempurna.
  const arabPerNomor = A ? new Map(A.hadis.map((x) => [x.nomor, x.teks])) : null
  const hadis: Hadis[] = I.hadis.map((x) => ({
    nomor: x.nomor,
    teks: x.teks,
    arab: arabPerNomor?.get(x.nomor),
  }))

  const c = periksaHadis(hadis, I.hadis.map((x) => x.nomor))
  if (!c.utuh) { hapusCache(ing.kunci, ...(ara ? [ara.kunci] : [])); throw new Error(c.alasan) }

  if (!ing.dariCache) tulisCache(ing.kunci, ing.data)
  if (ara && !ara.dariCache) tulisCache(ara.kunci, ara.data)

  return {
    kitab: k,
    dari: hadis[0]?.nomor ?? 0,
    sampai: hadis[hadis.length - 1]?.nomor ?? 0,
    hadis,
    total: I.total,
    gagalSebagian,
  }
}

/** Daftar bagian sebuah kitab, untuk menu. */
export async function daftarBagian(kitabId: string): Promise<{ nomor: number; nama: string }[]> {
  const k = KITAB.find((x) => x.id === kitabId)
  if (!k) throw new Error('Unknown collection.')
  const j = await ambil<unknown>(
    `${PENYEDIA_HADIS.basis}/editions/${k.edisiInggris}.json`,
    `${k.edisiInggris}-meta`,
  )
  const d = (j.data ?? {}) as JawabanHadis
  const sec = d.metadata?.sections ?? {}
  const out = Object.entries(sec)
    .map(([n, nama]) => ({ nomor: Number(n), nama: String(nama ?? '').trim() }))
    .filter((x) => Number.isFinite(x.nomor) && x.nomor > 0 && x.nama)
  if (!out.length) {
    hapusCache(j.kunci)
    throw new Error('The provider returned no chapter list for this collection, so nothing is shown.')
  }
  if (!j.dariCache) tulisCache(j.kunci, j.data)
  return out.sort((a, b) => a.nomor - b.nomor)
}

/** Peringatan yang WAJIB tampil untuk kitab bercampur derajat. */
export const PERINGATAN_DERAJAT =
  'This collection contains reports of differing grades — authentic, good and weak — and this provider does not carry the scholarly grading for each one. Read it as study, and check the grading of any individual report with a qualified source before you act on it or pass it on.'

export const CATATAN_SAHIH =
  'Every report in this collection is accepted as authentic at the level of the collection itself, by criteria its compiler set out and by long scholarly consensus. That is why no per-report grading is shown here — and why nothing else on this page is presented the same way.'
