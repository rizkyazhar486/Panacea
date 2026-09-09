// Gambar anatomi & patologi NYATA (foto/ilustrasi medis), bukan gambar garis
// buatan sendiri dan bukan hasil pembangkit AI.
//
// KENAPA WIKIMEDIA COMMONS.
//
// Dua celah tersisa di model 3D yang sudah ada (lihat public/anatomy/CREDITS.txt):
// organ reproduksi wanita dan struktur mikroskopik kulit — keduanya memang
// TIDAK ADA di data Z-Anatomy/BodyParts3D. Yang juga belum ada: gambar
// patologi per organ. Ketiganya butuh sumber gambar nyata berlisensi bebas.
//
// Commons memenuhi kebutuhan discovery gambar medis tanpa API key dan setiap
// hasil punya halaman berkas tempat creator, sumber, serta lisensi spesifik
// berkas dicatat. Panacea TIDAK menganggap Commons memiliki satu blanket
// license: syarat atribusi/share-alike/public-domain dibaca per berkas dan
// sourcePage selalu dipertahankan agar pengguna bisa memverifikasinya.
//
// Parsing ditulis defensif: query dibatasi, URL media harus berasal dari host
// upload Wikimedia, halaman sumber harus Commons, dan hasil tanpa metadata
// lisensi dibuang daripada menebak status hak ciptanya.
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php'

// Wikimedia meminta User-Agent deskriptif dengan jalur kontak untuk request
// otomatis. Website Panacea menjadi contact point dari adapter server ini.
const USER_AGENT = 'Panaceamed/1.0 (https://panaceamed.id; health education app)'
const MAX_QUERY_LENGTH = 160

type FetchLike = typeof fetch

export interface AnatomyImage {
  title: string
  /** URL gambar ukuran tampil (bukan berkas asli yang bisa puluhan MB). */
  url: string
  /** Halaman deskripsi di Commons — tujuan tautan atribusi dan verifikasi. */
  sourcePage: string
  /** Mis. "CC BY-SA 4.0", "Public domain". WAJIB ditampilkan. */
  license: string
  licenseUrl: string
  /** Pembuat karya; bila metadata kosong, verifikasi di sourcePage. */
  artist: string
  description: string
}

interface CommonsPage {
  title?: string
  imageinfo?: Array<{
    url?: string
    thumburl?: string
    descriptionurl?: string
    mime?: string
    extmetadata?: Record<string, { value?: string }>
  }>
}

/** Membuang tag HTML — field Artist/ImageDescription dari Commons berisi HTML. */
function teksPolos(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Query pengguna diperlakukan sebagai istilah, bukan tempat menyisipkan
 * sintaks pencarian MediaWiki. Tanda yang paling mudah mengubah operator
 * pencarian dibuang dan panjangnya dibatasi sebelum request dibuat. */
function bersihkanPencarian(value: string): string {
  return value
    .replace(/[\u0000-\u001f\u007f<>\\":|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_QUERY_LENGTH)
}

function halamanBerkasCommons(title: string): string {
  const slug = title.trim().replace(/\s+/g, '_')
  return `https://commons.wikimedia.org/wiki/${encodeURIComponent(slug)}`
}

/** descriptionurl berasal dari upstream, tetapi tetap divalidasi agar field
 * provenance tidak pernah berubah menjadi tautan host arbitrer. */
function halamanSumberCommons(descriptionUrl: string | undefined, title: string): string {
  const raw = teksPolos(descriptionUrl ?? '')
  if (raw) {
    try {
      const url = new URL(raw)
      if (url.protocol === 'https:' && url.hostname === 'commons.wikimedia.org') return url.toString()
    } catch {
      // Gunakan canonical file page di bawah bila metadata URL rusak.
    }
  }
  return halamanBerkasCommons(title)
}

function tautanWeb(value: string | undefined): string {
  const raw = teksPolos(value ?? '')
  if (!raw) return ''
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : ''
  } catch {
    return ''
  }
}

function tautanGambarCommons(value: string | undefined): string {
  if (!value) return ''
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.hostname !== 'upload.wikimedia.org') return ''
    return url.toString()
  } catch {
    return ''
  }
}

const MIME_DITERIMA = new Set(['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'])

export async function searchAnatomyImages(
  query: string,
  limit = 8,
  fetchImpl: FetchLike = fetch,
): Promise<AnatomyImage[]> {
  const q = bersihkanPencarian(query)
  if (!q) return []

  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    generator: 'search',
    gsrsearch: q,
    gsrnamespace: '6', // hanya namespace File
    gsrlimit: String(Math.min(Math.max(limit, 1), 20)),
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|mime',
    iiurlwidth: '1024',
  })
  const res = await fetchImpl(`${COMMONS_API}?${params.toString()}`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(9000),
  })
  if (!res.ok) throw new Error(`Commons search failed: ${res.status}`)
  const data = (await res.json()) as { query?: { pages?: CommonsPage[] } }
  const pages = Array.isArray(data.query?.pages) ? data.query!.pages! : []

  const out: AnatomyImage[] = []
  for (const page of pages) {
    const pageTitle = teksPolos(page.title ?? '')
    if (!pageTitle) continue

    const info = Array.isArray(page.imageinfo) ? page.imageinfo[0] : undefined
    if (!info) continue
    if (info.mime && !MIME_DITERIMA.has(info.mime)) continue

    const url = tautanGambarCommons(info.thumburl) || tautanGambarCommons(info.url)
    if (!url) continue

    const meta = info.extmetadata ?? {}
    const license = teksPolos(meta.LicenseShortName?.value ?? meta.License?.value ?? '')
    // Tanpa lisensi yang diketahui, berkasnya tidak ditampilkan sama sekali —
    // lebih baik hasilnya lebih sedikit daripada memakai gambar yang status
    // hak ciptanya tidak jelas.
    if (!license) continue

    out.push({
      title: pageTitle.replace(/^File:/, ''),
      url,
      sourcePage: halamanSumberCommons(info.descriptionurl, pageTitle),
      license,
      licenseUrl: tautanWeb(meta.LicenseUrl?.value),
      artist: teksPolos(meta.Artist?.value ?? '') || 'Lihat halaman sumber',
      description: teksPolos(meta.ImageDescription?.value ?? '').slice(0, 300),
    })
  }
  return out
}

/**
 * Pencarian gambar untuk satu struktur anatomi. Kata kuncinya dipersempit ke
 * ranah kedokteran ("anatomy", "diagram") sebelum dikirim — pencarian telanjang
 * seperti "vagina" di Commons juga mengembalikan foto non-klinis, sedangkan
 * yang dibutuhkan halaman ini adalah gambar anatomi/ilustrasi medis.
 */
export async function anatomyImageLookup(
  structure: string,
  fetchImpl: FetchLike = fetch,
): Promise<AnatomyImage[]> {
  return cariGabungan(structure, (q) => [`${q} anatomy diagram`, `${q} anatomy`], sebut, fetchImpl)
}

/**
 * Gambar PATOLOGI untuk satu organ — kata kuncinya diarahkan ke penyakitnya
 * ("pathology", "histopathology"), bukan anatomi normalnya.
 */
export async function pathologyImageLookup(
  organ: string,
  fetchImpl: FetchLike = fetch,
): Promise<AnatomyImage[]> {
  return cariGabungan(
    organ,
    (q) => [`${q} histopathology`, `${q} pathology gross specimen`, `${q} pathology micrograph`],
    // Tanpa penyaring ini, "pathology" saja menarik foto gedung departemen
    // patologi, potret tokoh, dan diagram tak berkaitan — itu yang membuat
    // banyak gambar tampak salah. Judul berkasnya harus benar-benar
    // menyebut organnya DAN satu kata yang menandakan sediaan.
    (judul, q) => sebut(judul, q) && /histopath|patholog|carcinoma|tumou?r|lesion|specimen|biopsy|infarct|necros/i.test(judul),
    fetchImpl,
  )
}

/**
 * Gambar HISTOLOGI untuk satu jaringan — sediaan mikroskopik berpewarnaan.
 *
 * Ini yang menutup sisi "jaringan" dari materi anatomi: jaringan itu wujudnya
 * mikroskopik, jadi tidak ada bentuk 3D-nya yang masuk akal (tidak ada model
 * 3D "epitel skuamosa simpleks") — yang ada dan memang dipakai untuk belajar
 * adalah mikrograf sediaan berpewarnaan. Karena itu kata kuncinya diarahkan ke
 * "histology"/"micrograph"/"H&E stain", bukan ke diagram anatomi.
 */
export async function histologyImageLookup(
  tissue: string,
  fetchImpl: FetchLike = fetch,
): Promise<AnatomyImage[]> {
  return cariGabungan(
    tissue,
    (q) => [`${q} histology`, `${q} histology micrograph`, `${q} H&E stain`],
    (judul, q) => sebut(judul, q) && /histolog|micrograph|stain|H&E|section|slide|microscop/i.test(judul),
    fetchImpl,
  )
}

/**
 * Judul berkas benar-benar menyebut apa yang dicari.
 *
 * Pencarian teks penuh Commons mencocokkan deskripsi, kategori, dan nama
 * pengunggah — jadi mencari "thyroid histology" bisa mengembalikan berkas yang
 * hanya BERADA di kategori yang menyinggung tiroid. Memeriksa judulnya
 * menyaring itu, dan judul di Commons memang deskriptif.
 *
 * Kata terlalu pendek (<4 huruf, mis. "ear", "eye") dilewati: mencocokkan
 * substring sependek itu justru menerima "search", "year", "eyelet".
 */
function sebut(judul: string, q: string): boolean {
  const kata = q.toLowerCase().split(/\s+/).filter((w) => w.length >= 4)
  if (!kata.length) return true
  const j = judul.toLowerCase()
  return kata.some((w) => j.includes(w))
}

/** Menjalankan beberapa varian kata kunci sekaligus lalu menggabung hasilnya
 *  tanpa duplikat — satu varian yang kosong tidak mengosongkan hasilnya.
 *
 *  `saring` adalah boundary relevansi ilmiah. Jika upstream mengembalikan
 *  hasil tetapi tidak ada satu pun yang lolos filter, adapter harus fail-closed
 *  dan mengembalikan array kosong. Lebih baik UI menampilkan empty state yang
 *  jujur daripada gambar berlisensi baik tetapi secara medis tidak relevan. */
async function cariGabungan(
  term: string,
  varian: (q: string) => string[],
  saring?: (judul: string, q: string) => boolean,
  fetchImpl: FetchLike = fetch,
): Promise<AnatomyImage[]> {
  const q = bersihkanPencarian(term)
  if (!q) return []
  const hasil = await Promise.all(
    varian(q).map((v) => searchAnatomyImages(v, 8, fetchImpl).catch(() => [] as AnatomyImage[])),
  )
  const gabung: AnatomyImage[] = []
  for (const daftar of hasil) {
    for (const img of daftar) {
      if (!gabung.some((x) => x.url === img.url)) gabung.push(img)
    }
  }
  if (!saring) return gabung.slice(0, 8)
  const tersaring = gabung.filter((img) => saring(`${img.title} ${img.description}`, q))
  return tersaring.slice(0, 8)
}

/**
 * Gambar RADIOLOGI nyata untuk satu struktur — radiograf, potongan CT, dan
 * potongan MRI dari arsip bebas, bukan hasil render.
 *
 * Ini melengkapi mode radiologi pada model 3D. Model 3D-nya bisa DIWARNAI
 * menyerupai foto rontgen/CT/MRI, tapi itu tetap render dari data mesh —
 * bentuknya benar, sedangkan derajat keabuannya adalah pendekatan, bukan
 * ukuran atenuasi sungguhan. Citra di bawahnya harus benar-benar berasal dari
 * pesawat rontgen/CT/MRI supaya yang dipelajari orang adalah tampilan asli
 * modalitasnya, termasuk artefak dan deraunya.
 *
 * Kata kuncinya dipisah per modalitas (bukan satu "radiology") karena tampilan
 * ketiganya berbeda jauh — tulang paling jelas di rontgen/CT, jaringan lunak
 * dan saraf justru paling jelas di MRI — jadi tabnya pun dipisah di layar.
 */
export async function xrayImageLookup(
  structure: string,
  fetchImpl: FetchLike = fetch,
): Promise<AnatomyImage[]> {
  return cariGabungan(
    structure,
    (q) => [`${q} radiograph`, `${q} x-ray`, `${q} plain film radiography`],
    (judul, q) => sebut(judul, q) && /radiograph|x-?ray|röntgen|roentgen/i.test(judul),
    fetchImpl,
  )
}

export async function ctImageLookup(
  structure: string,
  fetchImpl: FetchLike = fetch,
): Promise<AnatomyImage[]> {
  return cariGabungan(
    structure,
    (q) => [`${q} CT scan`, `${q} computed tomography`, `${q} CT axial`],
    (judul, q) => sebut(judul, q) && /\bCT\b|computed tomograph|tomodensito/i.test(judul),
    fetchImpl,
  )
}

export async function mriImageLookup(
  structure: string,
  fetchImpl: FetchLike = fetch,
): Promise<AnatomyImage[]> {
  return cariGabungan(
    structure,
    (q) => [`${q} MRI`, `${q} magnetic resonance imaging`, `${q} MRI sagittal`],
    (judul, q) => sebut(judul, q) && /\bMRI\b|magnetic resonance/i.test(judul),
    fetchImpl,
  )
}

/**
 * Foto GERAKAN LATIHAN yang nyata — orang sungguhan, bukan gambar garis.
 *
 * Kartu latihan selama ini memakai siluet tongkat yang digambar sendiri di
 * PoseGerak.tsx. Itu memang aman dari hak cipta dan ringan, tapi ia tetap
 * gambar garis, dan bentuk tubuh nyata dalam sebuah gerakan justru yang perlu
 * dilihat: sudut siku, posisi tulang belikat, kedalaman pinggul.
 *
 * Commons memuat banyak foto dan animasi peragaan latihan berlisensi bebas.
 * Penyaringnya ketat: judulnya harus menyebut latihannya DAN satu kata yang
 * menandakan peragaan, supaya "row" tidak mengembalikan foto perahu dan
 * "press" tidak mengembalikan mesin cetak. Lisensi tetap dicek per berkas.
 */
export async function exerciseImageLookup(
  exercise: string,
  fetchImpl: FetchLike = fetch,
): Promise<AnatomyImage[]> {
  return cariGabungan(
    exercise,
    (q) => [`${q} exercise`, `${q} weight training`, `${q} fitness demonstration`],
    (judul, q) =>
      sebut(judul, q) &&
      /exercise|workout|training|fitness|gym|calisthenic|barbell|dumbbell|bodyweight|muscle/i.test(judul),
    fetchImpl,
  )
}
