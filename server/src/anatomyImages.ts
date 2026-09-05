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
// Commons memenuhi keempat syaratnya sekaligus:
//   1. Tanpa API key.
//   2. Semua berkasnya domain publik atau CC — legal dipakai selama
//      atribusinya ditampilkan (karena itu license/artist ikut dikembalikan
//      di tiap hasil, bukan opsional).
//   3. Memuat set ilustrasi kedokteran bermutu (a.l. buku teks Anatomy &
//      Physiology CNX/OpenStax CC BY, koleksi Wellcome, foto patologi CDC PHIL).
//   4. Bisa dijangkau dari server ini, sementara hampir semua host gambar lain
//      diblokir oleh kebijakan jaringan.
//
// Tidak bisa diuji langsung dari sandbox tempat kode ini ditulis (jaringannya
// dibatasi), jadi parsingnya ditulis defensif: tiap field diperiksa dulu, dan
// hasil yang bentuknya tidak sesuai dibuang, bukan melempar galat.
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php'

// Wikimedia mewajibkan User-Agent yang bisa dihubungi di tiap permintaan
// otomatis; permintaan tanpa itu boleh saja ditolak oleh mereka.
const USER_AGENT = 'Panaceamed/1.0 (https://panaceamed.id; health education app)'

export interface AnatomyImage {
  title: string
  /** URL gambar ukuran tampil (bukan berkas asli yang bisa puluhan MB). */
  url: string
  /** Halaman deskripsi di Commons — tujuan tautan atribusi. */
  sourcePage: string
  /** Mis. "CC BY-SA 4.0", "Public domain". WAJIB ditampilkan. */
  license: string
  licenseUrl: string
  /** Pembuat karya. WAJIB ditampilkan untuk lisensi CC BY/BY-SA. */
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

const MIME_DITERIMA = new Set(['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'])

export async function searchAnatomyImages(query: string, limit = 8): Promise<AnatomyImage[]> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6', // hanya namespace File
    gsrlimit: String(Math.min(Math.max(limit, 1), 20)),
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|mime',
    iiurlwidth: '1024',
  })
  const res = await fetch(`${COMMONS_API}?${params.toString()}`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(9000),
  })
  if (!res.ok) throw new Error(`Commons search failed: ${res.status}`)
  const data = (await res.json()) as { query?: { pages?: CommonsPage[] } }
  const pages = Array.isArray(data.query?.pages) ? data.query!.pages! : []

  const out: AnatomyImage[] = []
  for (const page of pages) {
    const info = Array.isArray(page.imageinfo) ? page.imageinfo[0] : undefined
    if (!info) continue
    if (info.mime && !MIME_DITERIMA.has(info.mime)) continue
    const url = info.thumburl || info.url
    if (!url) continue
    const meta = info.extmetadata ?? {}
    const license = teksPolos(meta.LicenseShortName?.value ?? meta.License?.value ?? '')
    // Tanpa lisensi yang diketahui, berkasnya tidak ditampilkan sama sekali —
    // lebih baik hasilnya lebih sedikit daripada memakai gambar yang status
    // hak ciptanya tidak jelas.
    if (!license) continue
    out.push({
      title: teksPolos(page.title ?? '').replace(/^File:/, ''),
      url,
      sourcePage: info.descriptionurl ?? '',
      license,
      licenseUrl: teksPolos(meta.LicenseUrl?.value ?? ''),
      artist: teksPolos(meta.Artist?.value ?? '') || 'Unknown',
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
export async function anatomyImageLookup(structure: string): Promise<AnatomyImage[]> {
  return cariGabungan(structure, (q) => [`${q} anatomy diagram`, `${q} anatomy`])
}

/**
 * Gambar PATOLOGI untuk satu organ — kata kuncinya diarahkan ke penyakitnya
 * ("pathology", "histopathology"), bukan anatomi normalnya.
 */
export async function pathologyImageLookup(organ: string): Promise<AnatomyImage[]> {
  return cariGabungan(organ, (q) => [`${q} pathology`, `${q} histopathology`])
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
export async function histologyImageLookup(tissue: string): Promise<AnatomyImage[]> {
  return cariGabungan(tissue, (q) => [`${q} histology`, `${q} micrograph`, `${q} histology stain`])
}

/** Menjalankan beberapa varian kata kunci sekaligus lalu menggabung hasilnya
 *  tanpa duplikat — satu varian yang kosong tidak mengosongkan hasilnya. */
async function cariGabungan(term: string, varian: (q: string) => string[]): Promise<AnatomyImage[]> {
  const q = term.trim()
  if (!q) return []
  const hasil = await Promise.all(
    varian(q).map((v) => searchAnatomyImages(v, 6).catch(() => [] as AnatomyImage[])),
  )
  const gabung: AnatomyImage[] = []
  for (const daftar of hasil) {
    for (const img of daftar) {
      if (!gabung.some((x) => x.url === img.url)) gabung.push(img)
    }
  }
  return gabung.slice(0, 8)
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
export async function xrayImageLookup(structure: string): Promise<AnatomyImage[]> {
  return cariGabungan(structure, (q) => [`${q} radiograph`, `${q} x-ray`, `${q} plain film radiography`])
}

export async function ctImageLookup(structure: string): Promise<AnatomyImage[]> {
  return cariGabungan(structure, (q) => [`${q} CT scan`, `${q} computed tomography`, `${q} CT axial`])
}

export async function mriImageLookup(structure: string): Promise<AnatomyImage[]> {
  return cariGabungan(structure, (q) => [`${q} MRI`, `${q} magnetic resonance imaging`, `${q} MRI sagittal`])
}
