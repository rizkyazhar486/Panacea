import assert from 'node:assert/strict'
import { hitungSidikJari } from '../gen-bundle-digests.mjs'
import { SIDIK_JARI_BUNDEL } from '../../src/lib/anatomy/bundleDigests.gen.ts'
import { COMPLETE_WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/completeAtlas.ts'

// Provenans yang bisa diperiksa terhadap bit.
//
// Setiap simpul atlas membawa sourceId dan lisensi, dan itu pernyataan tentang
// ASAL. Tidak satu pun di antaranya menyebut berkas mana yang benar-benar
// dikirim, sehingga bundel bisa diganti atau dikonversi ulang dengan setelan
// berbeda tanpa satu pun pemeriksaan berubah -- dan klaim lisensinya tetap
// terbaca sama meyakinkannya.
//
// Uji ini menutup jarak itu: sidik jari dihitung ulang dari berkas yang ada di
// repositori dan dibandingkan dengan yang tercatat.

const sekarang = await hitungSidikJari()
const tercatat = new Map(SIDIK_JARI_BUNDEL.map((d) => [d.file, d]))

assert.ok(sekarang.length >= 7, `Hanya ${sekarang.length} bundel ditemukan; direktori mungkin salah.`)

for (const b of sekarang) {
  const rekam = tercatat.get(b.file)
  assert.ok(rekam,
    `Bundel ${b.file} dikirim tanpa sidik jari tercatat. Jalankan: node scripts/gen-bundle-digests.mjs --write`)
  assert.equal(b.sha256, rekam.sha256,
    `Isi ${b.file} berubah tetapi sidik jarinya tidak diperbarui.\n`
    + `  tercatat: ${rekam.sha256}\n  sekarang: ${b.sha256}\n`
    + '  Kalau perubahan ini disengaja, perbarui catatannya dan sebutkan alasannya di pesan commit.')
  assert.equal(b.bytes, rekam.bytes, `Ukuran ${b.file} berubah.`)
  // Jumlah simpul adalah petunjuk pertama tentang APA yang berubah: konversi
  // ulang yang menjatuhkan objek akan terlihat di sini sebelum ada organ yang
  // diam-diam berhenti tampil.
  assert.equal(b.nodes, rekam.nodes,
    `Jumlah simpul ${b.file} berubah dari ${rekam.nodes} menjadi ${b.nodes}. `
    + 'Petunjuk sumber mungkin tidak lagi menemukan geometrinya.')
}

for (const rekam of SIDIK_JARI_BUNDEL) {
  assert.ok(sekarang.some((b) => b.file === rekam.file),
    `Sidik jari tercatat untuk ${rekam.file}, tetapi berkasnya tidak ada lagi.`)
}

// Setiap bundel yang dirujuk atlas harus benar-benar punya sidik jari, supaya
// tidak ada geometri yang dipakai tanpa bisa dibuktikan asalnya.
{
  const dirujuk = new Set<string>()
  for (const n of COMPLETE_WHOLE_BODY_ATLAS.nodes) for (const f of n.source?.files ?? []) dirujuk.add(f)
  const tanpaSidikJari = [...dirujuk].filter((f) => !tercatat.has(f))
  assert.deepEqual(tanpaSidikJari, [],
    `Atlas merujuk bundel yang tidak punya sidik jari: ${tanpaSidikJari.join(', ')}`)
}

console.log(`Sidik jari bundel: ${sekarang.length} bundel cocok pada sha256, ukuran, dan jumlah simpul; setiap bundel yang dirujuk atlas terbukti asalnya.`)
