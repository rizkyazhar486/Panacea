import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { cariTubuh, namaTampil, pasangan, skorTeks, INDEKS_TUBUH } from '../../src/lib/bodySearch.ts'

// ─────────────────────────────────────────────────────────────────────────────
// PENCARIAN YANG BERHASIL TETAPI LAYARNYA TIDAK BERUBAH.
//
// Struktur yang dicari orang hampir selalu berada di sistem yang sedang
// DIMATIKAN -- justru itu sebabnya ia dicari alih-alih diketuk. Sebuah kotak
// cari yang menyorot struktur tanpa menyalakan sistemnya akan berhasil
// menemukan dan gagal memperlihatkan, dan pemakainya menyimpulkan strukturnya
// tidak ada. Itu lebih buruk daripada hasil kosong.
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. Nama yang dicari harus ADA di geometrinya ──────────────────────────
// Indeksnya dibangkitkan dari berkas GLB; hasil yang tidak menuju ke mesh mana
// pun membuat orang mengira strukturnya gagal digambar.
const namaGeometri = new Set(INDEKS_TUBUH.map((s) => s.n))
for (const kueri of ['femur', 'tibia', 'aorta', 'heart', 'lung']) {
  const h = cariTubuh(kueri, {}, 5)
  assert.ok(h.length > 0, `"${kueri}" returns nothing; the index no longer covers ordinary anatomy`)
  for (const x of h) {
    assert.ok(namaGeometri.has(x.struktur.n), `"${kueri}" returned ${x.struktur.n}, which is not a name in the geometry`)
  }
}

// ── 2. Awal nama menang atas tengah nama ──────────────────────────────────
// Yang mengetik "tibia" mencari tulangnya, bukan "Anterior tibial artery".
{
  // Diuji pada ATURANNYA, bukan pada pemenangnya. Memeriksa hasil teratas saja
  // lolos ketika bobotnya dibalik tetapi kebetulan struktur yang sama masih
  // menang lewat jalur lain.
  // BUKAN 'Tibia': itu sama persis dengan kuerinya dan mengambil jalur
  // exact-match (1000), sehingga bobot startsWith yang ingin diuji tidak
  // pernah dijalankan. Nama di bawah berawalan kueri tanpa menyamainya.
  const awalNama = skorTeks('Tibial nerve', 'tibia')
  const awalKata = skorTeks('Anterior tibial artery', 'tibia')
  const diTengah = skorTeks('Posterior crural region containing tibia', 'tibia')
  assert.ok(awalNama > awalKata,
    `a name that STARTS with the query must outrank one that merely contains it as a word (${awalNama} vs ${awalKata})`)
  assert.ok(awalKata > diTengah,
    `a word-start match must outrank a mid-word match (${awalKata} vs ${diTengah})`)
  assert.equal(skorTeks('tibia', 'tibia'), 1000, 'an exact name match lost its top rank')
  assert.ok(skorTeks('tibia', 'tibia') > awalNama, 'an exact match must still outrank a mere prefix')
  const teratas = cariTubuh('tibia', {}, 1)[0]
  assert.ok(/^tibia/i.test(teratas.struktur.b), `"tibia" ranked ${teratas.struktur.b} first instead of the bone`)
}

// ── 3. Pasangan kiri/kanan disorot bersama ────────────────────────────────
// Menyorot satu sisi saja pada struktur berpasangan terbaca seperti temuan.
{
  const bersisi = INDEKS_TUBUH.find((s) => s.s === 'kiri' && INDEKS_TUBUH.some((x) => x.b === s.b && x.s === 'kanan'))!
  const p = pasangan(bersisi)
  assert.equal(p.length >= 2, true, `${bersisi.b} has a left and a right but only ${p.length} name(s) are highlighted`)
  const tengah = INDEKS_TUBUH.find((s) => s.s === 'tengah')!
  assert.deepEqual(pasangan(tengah), [tengah.n], 'an unpaired structure must not drag other names in with it')
}

// ── 4. Nama tampil membawa sisinya ────────────────────────────────────────
{
  const kiri = INDEKS_TUBUH.find((s) => s.s === 'kiri')!
  assert.ok(/\(left\)$/.test(namaTampil(kiri)), 'the side was dropped from the displayed name')
}

// ── 5. Kotaknya harus menyalakan sistem hasilnya ──────────────────────────
const komponen = readFileSync(new URL('../../src/components/CariStrukturCepat.tsx', import.meta.url), 'utf8')
assert.ok(/if \(!lapisanAktif\.has\(s\.l\)\) onNyalakanLapisan\(s\.l\)/.test(komponen),
  'selecting a result no longer switches its system on — the search would succeed while the screen stays unchanged')
assert.ok(/onSorot\(pasangan\(s\), namaTampil\(s\)\)/.test(komponen), 'the result no longer highlights both sides')
// Hasil di sistem yang mati harus DITANDAI, bukan disembunyikan.
assert.ok(/mati && ' · off'/.test(komponen), 'results in a hidden system are no longer marked as hidden')
// Dan tidak boleh menyarankan apa pun ketika tidak ada yang cocok.
assert.ok(/No structure with that name is in the geometry/.test(komponen),
  'the empty state no longer says the name is absent from the geometry')

// ── 6. Terpasang di atas modelnya, bukan di tab lain ──────────────────────
const halaman = readFileSync(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const sebelumModel = halaman.slice(0, halaman.indexOf('<Body3D'))
assert.ok(/<CariStrukturCepat/.test(sebelumModel),
  'the search box is no longer mounted above the 3D model; finding something again means leaving the picture')
assert.ok(/onNyalakanLapisan=\{\(kunci\) => setLayers/.test(halaman), 'the page no longer lets the search switch a system on')

console.log(`cari-struktur-cepat: ok (${INDEKS_TUBUH.length} indexed names)`)
