import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  KELOMPOK_TAB, URUTAN_KELOMPOK, KELOMPOK_LAIN, kelompokUntuk, kelompokTerpakai,
  urutkanMenurutKelompok,
} from '../../src/lib/bodyExplorerTabGroups.ts'
import { BODY_EXPOSURE_ACTIVITIES } from '../../src/lib/bodyExposureActivities.ts'

// Tidak ada tab yang boleh lenyap.
//
// Rancangan pertama MENYARING baris tab menurut kelompok terpilih, dan itu
// menciptakan cara baru untuk kehilangan permukaan yang sudah jadi: apa pun
// yang menuju sebuah tab tanpa tahu kelompoknya menemukan tombolnya tidak
// dirender. Gerbang body3d-mobile-smoke membuktikannya di CI -- kliknya pada
// "Whole-body precision" kehabisan waktu, karena tab itu berada di kelompok
// lain daripada yang sedang tampil.
//
// Jadi penyaringan dibuang. Kelompok kini hanya MENGGULIRKAN baris, dan
// berkas ini menjaga sifat yang membuat itu aman: pengurutan menurut kelompok
// tidak boleh menambah, menghilangkan, atau menggandakan satu tab pun.

const sumber = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const navigator = await readFile(new URL('../../src/components/BodyExposureActivityNavigator.tsx', import.meta.url), 'utf8')

/** Kunci tab dibaca dari PANEL_TABS, bukan didaftar ulang di sini. */
const blok = sumber.slice(sumber.indexOf('const PANEL_TABS'), sumber.indexOf('\n]', sumber.indexOf('const PANEL_TABS')))
const kunciTab = [...blok.matchAll(/key: '([^']+)'/g)].map((m) => m[1])
assert.ok(kunciTab.length > 20, `Hanya ${kunciTab.length} tab terbaca; pembacaannya mungkin rusak`)

// ── 1. Setiap tab mendarat di tepat satu kelompok yang ditampilkan ─────────
{
  const ditampilkan = new Set(kelompokTerpakai(kunciTab))
  for (const k of kunciTab) {
    const g = kelompokUntuk(k)
    assert.ok(URUTAN_KELOMPOK.includes(g), `Tab "${k}" berada di kelompok tak dikenal "${g}"`)
    assert.ok(ditampilkan.has(g), `Tab "${k}" ada di kelompok "${g}" yang tidak pernah ditampilkan`)
  }
}

// ── 2. Tab yang BELUM dipetakan tetap terjangkau ───────────────────────────
//
// Ini inti berkas ini. Tanpa cadangan, sebuah panel yang sudah selesai akan
// hilang dari antarmuka hanya karena satu baris peta terlupakan.
{
  assert.equal(kelompokUntuk('tab-yang-belum-pernah-ada'), KELOMPOK_LAIN)
  const dengan = kelompokTerpakai([...kunciTab, 'tab-yang-belum-pernah-ada'])
  assert.ok(dengan.includes(KELOMPOK_LAIN), 'Kelompok cadangan harus muncul begitu ada tab tak terpetakan')
}

// ── 3. Kelompok kosong tidak ditampilkan ───────────────────────────────────
//
// Sebuah keping kelompok yang membuka baris kosong terlihat seperti kerusakan.
{
  const terpakai = kelompokTerpakai(kunciTab)
  for (const g of terpakai) {
    assert.ok(kunciTab.some((k) => kelompokUntuk(k) === g), `Kelompok "${g}" ditampilkan tanpa satu pun tab`)
  }
  assert.ok(!kelompokTerpakai([]).length, 'Tanpa tab sama sekali tidak boleh ada kelompok')
}

// ── 3b. Mengurutkan menurut kelompok adalah PERMUTASI, bukan penyaringan ──
//
// Inilah pengganti langsung dari kegagalan di atas: apa pun yang terjadi pada
// peta kelompok, himpunan tab yang dirender harus identik dengan sebelumnya.
{
  const tab = kunciTab.map((key) => ({ key }))
  const urut = urutkanMenurutKelompok(tab, (t) => t.key)
  assert.equal(urut.length, tab.length, 'Mengurutkan tidak boleh mengubah jumlah tab')
  assert.deepEqual(
    [...urut.map((t) => t.key)].sort(),
    [...kunciTab].sort(),
    'Mengurutkan harus mempertahankan himpunan tab yang sama persis',
  )
  // Termasuk tab yang belum dipetakan: ia ikut terurut, bukan terjatuh.
  const denganAsing = urutkanMenurutKelompok([...tab, { key: 'tab-asing' }], (t) => t.key)
  assert.ok(denganAsing.some((t) => t.key === 'tab-asing'), 'Tab tak terpetakan harus tetap ikut terurut')
  assert.equal(denganAsing.length, tab.length + 1)
  // Tiap kelompok harus menjadi satu ketetanggaan bersambung, kalau tidak
  // "melompat ke kelompok" hanya mendaratkan satu tab dengan tetangga acak.
  const deret = denganAsing.map((t) => kelompokUntuk(t.key))
  const dilihat = new Set<string>()
  let sebelumnya = ''
  for (const g of deret) {
    if (g !== sebelumnya) {
      assert.ok(!dilihat.has(g), `Kelompok "${g}" terpecah menjadi dua blok terpisah`)
      dilihat.add(g)
      sebelumnya = g
    }
  }
}

// ── 3c. Registry aktivitas harus sama persis dengan panel yang nyata ─────────
//
// Arsitektur baru memakai progressive disclosure: semua tombol tidak lagi
// dirender sekaligus. Invariant yang penting bukan "semua terlihat bersamaan",
// melainkan tidak ada panel yang hilang dari registry pencarian/navigasi.
{
  const kunciAktivitas = BODY_EXPOSURE_ACTIVITIES.map((activity) => activity.key)
  assert.deepEqual(
    [...kunciAktivitas].sort(),
    [...kunciTab].sort(),
    'Registry aktivitas harus memuat tepat panel yang benar-benar ada, tanpa hilang atau yatim',
  )
  assert.match(
    sumber,
    /<BodyExposureActivityNavigator[\s\S]{0,240}activePanel=\{panelTab\}[\s\S]{0,240}onSelectPanel=/,
    'BodyExplorer harus memasang navigator aktivitas ke state panel yang sama',
  )
  assert.match(navigator, /All activities/, 'Semua aktivitas harus punya pintu progressive-disclosure yang jelas')
  assert.match(navigator, /value=\{query\}/, 'Drawer aktivitas harus menyediakan pencarian')
  assert.match(
    navigator,
    /BODY_EXPOSURE_ACTIVITIES\.filter/,
    'Pencarian/kelompok harus bekerja langsung dari registry kanonik, bukan daftar bayangan',
  )
  assert.match(navigator, /visible\.map/, 'Hasil registry yang terlihat harus benar-benar dirender sebagai kontrol')
}

// ── 3d. Nama aktivitas harus unik untuk pembaca layar dan browser QA ────────
{
  const label = BODY_EXPOSURE_ACTIVITIES.map((activity) => activity.label)
  assert.equal(new Set(label).size, label.length, 'Label aktivitas harus unik agar pemilihan menurut nama tidak ambigu')
  assert.match(navigator, /role="tablist"/, 'Kelompok aktivitas harus tetap punya semantik tablist')
  assert.match(navigator, /aria-selected=\{group === item\}/, 'Kelompok aktif harus diumumkan ke pembaca layar')
}

// ── 4. Peta memakai KUNCI, bukan label ─────────────────────────────────────
//
// Label adalah antarmuka dan diterjemahkan; kunci adalah data dan tidak.
// Memetakan lewat label akan putus pada bahasa kedua.
{
  const label = [...blok.matchAll(/label: '([^']+)'/g)].map((m) => m[1])
  for (const l of label) {
    assert.ok(!(l in KELOMPOK_TAB), `Peta kelompok memakai label "${l}" sebagai kunci; harus memakai key tab`)
  }
}

// ── 5. Peta tidak boleh menyebut tab yang sudah tidak ada ──────────────────
//
// Entri yatim tidak merusak apa pun, tetapi ia membuat peta ini perlahan
// berhenti menggambarkan antarmuka yang sebenarnya.
{
  const yatim = Object.keys(KELOMPOK_TAB).filter((k) => !kunciTab.includes(k))
  assert.deepEqual(yatim, [], `Peta kelompok menyebut tab yang tidak ada: ${yatim.join(', ')}`)
}

console.log(
  `Kelompok tab Body Exposure: ${kunciTab.length} tab dalam ${kelompokTerpakai(kunciTab).length} kelompok, ` +
  'semuanya tetap dirender (kelompok menggulirkan, tidak menyaring), pengurutan adalah permutasi ' +
  'yang menjaga tiap kelompok bersambung, dan petanya memakai kunci tab bukan label.',
)
