import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { FITUR_DARI_HUB } from '../../src/lib/katalogFitur.ts'
import { gabungKatalog, saringPeran, rutaKanonik } from '../../src/lib/katalogLengkap.ts'

// ─────────────────────────────────────────────────────────────────────────────
// APA YANG HILANG KALAU MENU SAMPING DIHAPUS?
//
// Aplikasi ini menyimpan tujuannya di dua daftar yang tumbuh terpisah:
// FITUR_DARI_HUB (kapabilitas produk) dan daftar `nav` di dalam Shell (menu
// samping, termasuk akun, langganan, admin, hukum). Indeks Beranda dahulu hanya
// membaca yang pertama, jadi 56 tujuan hanya hidup di menu samping — di
// antaranya Kartu Darurat, Pengaturan, Apotek, Pengingat Obat dan Rumah Sakit.
//
// Selama itu benar, "hapus menu samping supaya bersih" berarti membuang satu-
// satunya jalan menuju Kartu Darurat. Gerbang ini mengukur selisih itu supaya
// keputusannya diambil dari angka, bukan dari kesan.
//
// Diukur dengan aturan yang PERSIS sama dengan yang dipakai layar — sumber
// gabungan yang sama, penyaringan peran yang sama, tabel rute kanonik yang
// sama. Hitungan yang memakai aturannya sendiri tidak membuktikan apa pun
// tentang layar yang diklaimnya.
// ─────────────────────────────────────────────────────────────────────────────

const shell = readFileSync(new URL('../../src/components/Shell.tsx', import.meta.url), 'utf8')

const SEMUA_PERAN = ['pasien', 'dokter', 'kontributor', 'verifikator', 'admin', 'owner']

/**
 * Membaca daftar `nav` Shell apa adanya, termasuk peran tiap tujuan.
 *
 * Diurai PER OBJEK, bukan dengan satu pola besar yang menuntut `to`, `label`
 * dan `roles` berurutan. Versi pertama melakukan itu dan hanya menangkap 35
 * dari 79 tujuan, karena sebagian entri menyelipkan `end` atau `group` di
 * tengahnya — dan gerbang yang diam-diam hanya mengukur separuh daftar akan
 * melaporkan "semuanya terjangkau" sambil melewatkan justru yang tidak.
 */
function bacaDaftar(nama: 'nav' | 'KATALOG') {
  const pola = nama === 'nav'
    ? /const nav: Nav\[\] = \[([\s\S]*?)\n\]/
    : /const KATALOG: Nav\[\] = \[([\s\S]*?)\n\]/
  const blok = shell.match(pola)?.[1]
  assert.ok(blok, `the ${nama} list could not be read from Shell; this gate measures nothing without it`)
  return [...blok.matchAll(/\{[^{}]*\}/g)]
    .map((m) => m[0])
    .map((obj) => {
      const to = obj.match(/\bto:\s*'([^']+)'/)?.[1]
      const label = obj.match(/\blabel:\s*'((?:[^'\\]|\\.)*)'/)?.[1]
      const roles = obj.match(/\broles:\s*(ALL|\[[^\]]*\])/)?.[1]
      if (!to || !roles) return null
      return {
        to,
        label: label ?? to,
        group: 'Menu',
        roles: roles === 'ALL' ? SEMUA_PERAN : (JSON.parse(roles.replace(/'/g, '"')) as string[]),
      }
    })
    .filter((n): n is { to: string; label: string; group: string; roles: string[] } => n !== null)
}

// Shell memang menyimpan DUA daftar, dan pemisahan itu disengaja: `nav` adalah
// MENU HARIAN (tujuan yang dibuka berulang kali), `KATALOG` adalah INVENTARIS
// LENGKAP yang menyuplai pencarian dan layar Atur Fitur. NAV_UNTUK_PENGATURAN
// adalah gabungan keduanya, dan itulah yang kini dibaca Beranda.
//
// Keduanya diukur di sini. Mengukur `nav` saja akan melewatkan justru tujuan
// yang paling mudah terlupakan — yang tidak cukup sering dipakai untuk masuk
// menu harian, tetapi tetap harus dapat ditemukan.
const menuHarian = bacaDaftar('nav')
const katalogLengkapShell = bacaDaftar('KATALOG')
assert.ok(menuHarian.length >= 30,
  `only ${menuHarian.length} daily-menu destinations were parsed; the reader has drifted from Shell`)
assert.ok(katalogLengkapShell.length >= 60,
  `only ${katalogLengkapShell.length} catalogue destinations were parsed; the reader has drifted from Shell`)

const perTo = new Map<string, ReturnType<typeof bacaDaftar>[number]>()
for (const n of [...katalogLengkapShell, ...menuHarian]) perTo.set(n.to, n)
const nav = [...perTo.values()]

// Beranda sendiri dan halaman daftar-fitur bukan "fitur": keduanya adalah
// tempat daftarnya berada.
const BUKAN_FITUR = new Set(['/', '/semua-fitur'])

const laporan: string[] = []
for (const peran of SEMUA_PERAN) {
  const terlihatDiBeranda = new Set(
    saringPeran(gabungKatalog(FITUR_DARI_HUB, nav), peran)
      .filter((e) => !BUKAN_FITUR.has(e.to))
      .map((e) => rutaKanonik(e.to)),
  )

  const tujuanMenu = nav
    .filter((n) => !n.roles.length || n.roles.includes(peran))
    .filter((n) => !BUKAN_FITUR.has(n.to))

  const takTerjangkau = tujuanMenu
    .filter((n) => !terlihatDiBeranda.has(rutaKanonik(n.to)))
    .map((n) => n.to)

  assert.deepEqual(takTerjangkau, [],
    `for role "${peran}" these sidebar destinations cannot be reached from Home at all: ` +
    `${takTerjangkau.join(', ')}. Removing the sidebar would strand them, and some of them — the emergency ` +
    'card among others — are not things to strand.')

  laporan.push(`${peran} ${terlihatDiBeranda.size}`)
}

// Indeks Beranda harus benar-benar menarik dari KEDUA daftar. Tanpa ini,
// gerbang di atas tetap lulus sementara layarnya kembali hanya membaca hub.
const deck = readFileSync(new URL('../../src/components/HomeCommandDeck.tsx', import.meta.url), 'utf8')
assert.ok(/gabungKatalog\(FITUR_DARI_HUB, NAV_UNTUK_PENGATURAN\)/.test(deck),
  "Home's index stopped merging the sidebar destinations; the 56 menu-only routes fall out of Home again")
assert.ok(/saringPeran\(/.test(deck),
  'Home stopped filtering by role: admin and owner destinations would be listed to every patient')

// ── Tautan Beranda harus menuju rute yang benar-benar ada ────────────────
//
// Tabel rute kanonik memetakan rute lama ke tampilan di dalam super-page. Salah
// ketik di sana tidak menggagalkan apa pun: TypeScript hanya melihat string,
// tautannya tetap dirender, dan kerusakannya baru terlihat ketika seseorang
// menekannya dan mendarat di halaman kosong.
//
// Catatan jujur tentang batas gerbang ini: MENGHAPUS sebuah pemetaan tidak
// ditangkap di sini, dan memang tidak seharusnya — rute aslinya tetap punya
// halaman sendiri, jadi yang berubah hanyalah tujuan mana yang dibuka, bukan
// ada tidaknya tujuan itu. Yang dijaga adalah tujuan yang MENUNJUK KE
// KEKOSONGAN.
const main = readFileSync(new URL('../../src/main.tsx', import.meta.url), 'utf8')
const ruteTerdaftar = new Set(
  [...main.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]),
)
assert.ok(ruteTerdaftar.size > 100, `only ${ruteTerdaftar.size} routes were parsed from main.tsx`)

const RUTE_KANONIK_ENTRI = Object.entries(
  (await import('../../src/lib/katalogLengkap.ts')).RUTE_KANONIK,
)
for (const [dari, ke] of RUTE_KANONIK_ENTRI) {
  // Hanya bagian path yang dibandingkan: query string adalah keadaan di dalam
  // halaman, bukan rute tersendiri.
  const path = ke.split('?')[0]
  assert.ok(ruteTerdaftar.has(path) || path === '/',
    `the canonical route table sends "${dari}" to "${ke}", but "${path}" is not a route in main.tsx. ` +
    'Nothing fails when this is mistyped — the link renders, and the person who taps it lands on nothing.')
}

// Daftar peran KOSONG berarti terbuka untuk semua. Membacanya terbalik
// mengosongkan seluruh indeks Beranda, dan tidak ada tipe yang menangkapnya.
const terbuka = saringPeran([{ to: '/x', label: 'x', group: 'g', kw: '', apa: '', roles: [] }], 'pasien')
assert.equal(terbuka.length, 1,
  'an entry with no role restriction is being treated as forbidden to everyone; that empties the whole index')

console.log(`jangkauan-dari-beranda: ok (${nav.length} tujuan menu, semuanya terjangkau dari Beranda — ${laporan.join(', ')})`)
