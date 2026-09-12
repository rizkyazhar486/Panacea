import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  KELOMPOK_TAB, URUTAN_KELOMPOK, KELOMPOK_LAIN, kelompokUntuk, kelompokTerpakai,
} from '../../src/lib/bodyExplorerTabGroups.ts'

// Tidak ada tab yang boleh lenyap.
//
// Tab Body Exposure kini disaring menurut kelompok, dan itu menciptakan cara
// baru untuk kehilangan sebuah fitur: tab yang ditambahkan tanpa entri di peta
// kelompok akan berhenti tampil. Tidak ada galat, tidak ada uji yang gagal --
// hanya sebuah panel selesai yang tidak bisa dijangkau siapa pun.
//
// Tab ditambahkan terus-menerus, kadang oleh beberapa agen sekaligus, jadi
// perilaku cadangan itu yang dijaga di sini, bukan kelengkapan petanya.

const sumber = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')

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
  `Kelompok tab Body Exposure: ${kunciTab.length} tab terbagi ke ${kelompokTerpakai(kunciTab).length} kelompok, ` +
  'tab yang belum dipetakan tetap terjangkau lewat kelompok cadangan, tidak ada kelompok kosong, ' +
  'dan petanya memakai kunci tab bukan label.',
)
