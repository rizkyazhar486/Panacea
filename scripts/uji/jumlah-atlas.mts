import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// ─────────────────────────────────────────────────────────────────────────────
// ANGKA DI LAYAR HARUS SAMA DENGAN ISI BERKASNYA.
//
// "2.187 struktur" adalah klaim tentang geometri yang benar-benar ada. Sekali
// diketik tangan, ia benar pada hari itu saja: satu sistem diekspor ulang,
// beberapa mesh digabung, dan layarnya tetap memamerkan angka lama tanpa ada
// yang gagal. Gerbang ini membuka GLB-nya sendiri dan membandingkannya dengan
// manifes yang di-commit.
//
// Yang dibaca BUKAN hasil skrip pembuatnya, melainkan berkas GLB-nya — kalau
// keduanya memakai satu pembaca yang sama, kesalahan pembacanya akan lolos
// bersama-sama. Parser di bawah ditulis ulang di sini.
// ─────────────────────────────────────────────────────────────────────────────

const manifes = JSON.parse(readFileSync(new URL('../../src/data/jumlahAtlas.json', import.meta.url), 'utf8'))

/** Pembaca glTF biner mandiri: header, lalu bongkahan JSON pertama. */
function simpulMesh(path: URL): string[] {
  const b = readFileSync(path)
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength)
  assert.equal(dv.getUint32(0, true), 0x46546c67, `${path.pathname} is not a binary glTF`)
  let o = 12
  while (o < b.byteLength) {
    const panjang = dv.getUint32(o, true)
    const jenis = dv.getUint32(o + 4, true)
    if (jenis === 0x4e4f534a) {
      const json = JSON.parse(new TextDecoder().decode(b.subarray(o + 8, o + 8 + panjang)))
      return (json.nodes ?? [])
        .filter((n: { mesh?: number; name?: string }) => n.mesh !== undefined && typeof n.name === 'string' && n.name.length > 0)
        .map((n: { name: string }) => n.name)
    }
    o += 8 + panjang
  }
  throw new Error(`${path.pathname} has no JSON chunk`)
}

const BUKAN_ANATOMI = [/^HOW TO/i, /^Take a picture/i, /^Camera/i, /^Light/i, /^Empty/i]

// ── 1. Setiap sistem harus cocok, berkas demi berkas ──────────────────────
let jumlahUlang = 0
for (const [kunci, jumlahTercatat] of Object.entries(manifes.perSistem) as [string, number][]) {
  const nama = simpulMesh(new URL(`../../public/anatomy/${kunci}.glb`, import.meta.url))
  const anatomi = nama.filter((n) => !BUKAN_ANATOMI.some((p) => p.test(n)))
  assert.equal(anatomi.length, jumlahTercatat,
    `${kunci}.glb holds ${anatomi.length} named structures but the manifest claims ${jumlahTercatat}. ` +
    'Re-run scripts/bangun/jumlahAtlas.mjs rather than editing the number.')
  jumlahUlang += anatomi.length
}

// ── 2. Total bukan angka terpisah yang bisa menyimpang sendiri ────────────
assert.equal(manifes.total, jumlahUlang, 'the manifest total does not equal the sum of its own systems')

// ── 3. Simpul bantu Z-Anatomy tidak boleh terhitung sebagai anatomi ──────
// Berkas aslinya memuat papan petunjuk "HOW TO ...". Menghitungnya menambah
// satu bagian tubuh yang tidak ada pada SETIAP sistem.
const mentah = simpulMesh(new URL('../../public/anatomy/skeletal.glb', import.meta.url))
assert.ok(mentah.some((n) => /^HOW TO/i.test(n)),
  'the helper node vanished from skeletal.glb — re-read this gate, its premise has changed')
assert.equal(
  mentah.length - mentah.filter((n) => !BUKAN_ANATOMI.some((p) => p.test(n))).length, 1,
  'exactly one helper node is expected in skeletal.glb; the exclusion list no longer matches the file')

// ── 4. Layarnya harus memakai manifes, bukan angka yang diketik ──────────
const halaman = readFileSync(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
assert.ok(/import jumlahAtlas from '\.\.\/data\/jumlahAtlas\.json'/.test(halaman),
  'BodyExplorer no longer reads the generated manifest')
// Bukan "ungkapannya ada di suatu tempat": jumlah per sistem dipakai DUA kali
// di halaman ini — sekali untuk menjumlah yang terlihat, sekali di dalam chip.
// Memeriksa keberadaannya saja akan lolos ketika angka pada chip-nya dihapus.
const chip = halaman.match(/<Chip[\s\S]{0,900}?<\/Chip>/)?.[0] ?? ''
assert.ok(/jumlahAtlas\.perSistem\[l\.key\]/.test(chip),
  'the per-system count was removed from the chip itself, even though the page still totals them elsewhere')
// Angka pada pil disembunyikan dari pembaca layar (aria-hidden) karena ia
// bukan bagian dari nama tombol. Kalau begitu, angkanya WAJIB tetap sampai
// lewat aria-label — kalau tidak, pemakai pembaca layar kehilangan datanya.
if (/aria-hidden="true"/.test(chip)) {
  assert.ok(/ariaLabel=\{`\$\{l\.label\}, \$\{\(jumlahAtlas\.perSistem\[l\.key\] \?\? 0\)/.test(chip),
    'the chip hides its count from assistive tech without putting it back in the accessible name')
}
assert.ok(/jumlahAtlas\.total/.test(halaman), 'the total is no longer shown')
assert.ok(!/2,?187|2\.187/.test(halaman), 'a structure count was hard-coded into the page instead of read from the manifest')

// ── 5. Provenans ikut dibawa ──────────────────────────────────────────────
assert.ok(/Z-Anatomy/.test(manifes.sumber) && /BodyParts3D/.test(manifes.sumber),
  'the manifest no longer records where this geometry came from')
const kredit = readFileSync(new URL('../../public/anatomy/CREDITS.txt', import.meta.url), 'utf8')
assert.ok(/CC BY-SA/.test(kredit), 'the anatomy licence statement disappeared')

console.log(`jumlah-atlas: ok (${jumlahUlang} named structures across ${Object.keys(manifes.perSistem).length} systems)`)
