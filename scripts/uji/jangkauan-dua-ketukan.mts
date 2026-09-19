import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// ─────────────────────────────────────────────────────────────────────────────
// SETIAP LAYAR HARUS TERJANGKAU DALAM DUA KETUKAN.
//
// Tombol cari ada di bilah perintah SETIAP halaman. Karena itu jalur universal
// menuju fitur apa pun selalu dua ketukan: ketuk cari, ketuk hasilnya. Tidak
// ada jalur lain yang berlaku dari mana saja — menu harian sengaja dipangkas,
// dan setiap hub hanya memuat cabangnya sendiri.
//
// Konsekuensinya keras: SEBUAH RUTE YANG TIDAK ADA DI KATALOG PENCARIAN TIDAK
// PUNYA JALUR DUA KETUKAN SAMA SEKALI. Ia hanya dapat dicapai dengan mengetik
// URL-nya — yang berarti, bagi pengguna, fitur itu tidak ada.
//
// Shell.tsx sudah menuliskan niat itu sejak awal:
//   "fitur yang tidak bisa dicari sama saja dengan fitur yang dihapus --
//    tanpa ada yang menyadari."
// Tidak ada satu pun yang menegakkannya, dan katalog pun hanyut: saat berkas
// uji ini ditulis, 28 dari 115 rute terpasang tidak ada di katalog mana pun.
// Berkas inilah penegaknya. Menambah <Route> tanpa menambah tujuannya ke
// katalog sekarang menggagalkan uji, bukan diam-diam mengubur fiturnya.
// ─────────────────────────────────────────────────────────────────────────────

const main = readFileSync(new URL('../../src/main.tsx', import.meta.url), 'utf8')
const shell = readFileSync(new URL('../../src/components/Shell.tsx', import.meta.url), 'utf8')
/* Tiga hub ini dimuat PencarianGlobal saat kotaknya dibuka, jadi isinya ikut
   masuk indeks. Membandingkan rute hanya dengan Shell akan melaporkan fitur
   yang sebenarnya sudah dapat dicari sebagai hilang. */
const hub = ['FitnessHub', 'WellnessHub', 'ClinicalHub']
  .map((nama) => readFileSync(new URL(`../../src/pages/${nama}.tsx`, import.meta.url), 'utf8'))
  .join('\n')

/** Rute yang benar-benar memasang sebuah layar. */
const terpasang: string[] = []
/** path -> tujuan, untuk <Route element={<Navigate to=... />}>. */
const pengalihan = new Map<string, string>()

for (const m of main.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<(\w+)/g)) {
  const [, path, komponen] = m
  if (komponen === 'Navigate') {
    const arah = main
      .slice(m.index ?? 0, (m.index ?? 0) + 220)
      .match(/<Navigate\s+to="([^"]+)"/)
    pengalihan.set(path, arah ? arah[1] : '')
    continue
  }
  if (path.includes(':') || path === '*') continue
  terpasang.push(path)
}

assert.ok(terpasang.length >= 100, `rute terpasang terbaca hanya ${terpasang.length} — pembacaan main.tsx rusak`)

/**
 * Indeks pencarian yang sebenarnya, persis seperti PencarianGlobal merakitnya:
 * `nav` + `KATALOG` dari Shell.tsx (lewat NAV_UNTUK_PENGATURAN), ditambah
 * GROUPS dari ketiga hub yang diimpor saat kotak pencarian dibuka.
 */
const katalog = new Set<string>()
for (const m of shell.matchAll(/\{\s*to:\s*'([^']+)'/g)) katalog.add(m[1].split(/[?#]/)[0])
const dariShell = katalog.size
for (const m of hub.matchAll(/\bto:\s*'([^']+)'/g)) katalog.add(m[1].split(/[?#]/)[0])

assert.ok(dariShell >= 60, `katalog Shell terbaca hanya ${dariShell} tujuan — pembacaan Shell.tsx rusak`)
assert.ok(
  katalog.size > dariShell,
  'katalog hub tidak terbaca sama sekali — uji ini akan melaporkan fitur yang sudah dapat dicari sebagai hilang',
)

/**
 * Pengecualian — masing-masing dengan alasan yang dapat diperiksa, bukan daftar
 * penampung. Sebuah rute hanya boleh ada di sini kalau ia memang BUKAN tujuan
 * yang dicari orang, bukan karena mengkataloginya merepotkan.
 */
const DIKECUALIKAN = new Map<string, string>([
  ['/social', 'alias lama untuk "/" — komponen yang sama persis (Home), jadi mengkatalogikannya akan menggandakan Home di hasil pencarian'],
  ['/search', 'halaman pencarian; digantikan kotak pencarian global yang justru jadi ketukan pertama jalur ini'],
  ['/cari', 'halaman pencarian isi; sama, sudah menyatu ke kotak pencarian global'],
  ['/jelajah', 'tempat mendaratnya hasil pencarian orang/tagar — dicapai DARI pencarian, bukan tujuan yang dicari'],
  ['/design-demo', 'rujukan desain untuk pengembang, bukan fitur produk'],
  ['/health-data/tutorial', 'anak dari /health-data yang sudah ada di katalog'],
])

for (const [path, alasan] of DIKECUALIKAN) {
  assert.ok(alasan.length > 30, `pengecualian ${path} tidak memberi alasan yang bisa diperiksa`)
  assert.ok(
    terpasang.includes(path) || pengalihan.has(path),
    `pengecualian ${path} tidak menunjuk rute mana pun — daftar ini ikut hanyut`,
  )
}

const tanpaJalur = terpasang
  .filter((p) => !katalog.has(p))
  .filter((p) => !DIKECUALIKAN.has(p))

assert.deepEqual(
  tanpaJalur,
  [],
  `rute berikut terpasang tetapi tidak ada di katalog pencarian, sehingga tidak punya jalur dua ketukan dan hanya dapat dicapai dengan mengetik URL:\n  ${tanpaJalur.join('\n  ')}`,
)

/** Pengalihan harus menunjuk ke rute yang benar-benar ada. */
for (const [dari, ke] of pengalihan) {
  const tujuan = ke.split(/[?#]/)[0]
  assert.ok(tujuan, `pengalihan dari ${dari} tidak terbaca tujuannya`)
  assert.ok(
    terpasang.includes(tujuan),
    `pengalihan ${dari} -> ${ke} menunjuk rute yang tidak terpasang`,
  )
}

/** Katalog tidak boleh menjanjikan tujuan yang sudah tidak terpasang. */
const katalogYatim = [...katalog].filter(
  (p) => p.startsWith('/') && !terpasang.includes(p) && !pengalihan.has(p),
)
assert.deepEqual(
  katalogYatim,
  [],
  `katalog menawarkan tujuan yang tidak punya rute — hasil pencarian akan berujung ke layar kosong:\n  ${katalogYatim.join('\n  ')}`,
)

console.log(
  `jangkauan-dua-ketukan: ${terpasang.length} rute terpasang, ${terpasang.length - DIKECUALIKAN.size} punya jalur dua ketukan lewat pencarian global, ${DIKECUALIKAN.size} dikecualikan dengan alasan`,
)
