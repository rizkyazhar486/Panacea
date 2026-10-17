// D8: permintaan pernyataan untuk pemilik harus tetap jujur — fakta cocok dengan berkas nyata, tidak ada pernyataan yang diisi AI, dan sasarannya
// sama persis dengan celah di baseline. Bila aset berubah atau celah bertambah/berkurang, uji ini gagal sampai dokumen diperbarui.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, statSync } from 'node:fs'

const root = new URL('../../', import.meta.url)
const doc = readFileSync(new URL('docs/alpha/D8_OWNER_ATTESTATION_REQUESTS.md', root), 'utf8')
const baseline = JSON.parse(readFileSync(new URL('governance/PUBLIC_ASSET_PROVENANCE_BASELINE.json', root), 'utf8')) as Record<string, unknown>

const ASET = ['public/logo-mark.png', 'public/media/tutorial-video.mp4'] as const
for (const a of ASET) {
  const sha = createHash('sha256').update(readFileSync(new URL(a, root))).digest('hex')
  assert.ok(doc.includes(sha), `${a}: the SHA-256 in the request must match the file (${sha})`)
  const bytes = statSync(new URL(a, root)).size
  assert.ok(doc.includes(bytes.toLocaleString('id-ID')), `${a}: the byte size ${bytes.toLocaleString('id-ID')} must match the file`)
  assert.ok(doc.includes(`\`${a}\``), `${a} is named`)
}
// Sasaran permintaan = celah yang tercatat di baseline (tidak lebih, tidak kurang).
assert.deepEqual([...(baseline.tanpaJejak as string[])].sort(), [...ASET].sort(), 'the baseline gap list is exactly the two assets this request covers')

// AI tidak boleh mengisi pernyataan: nama, jabatan, tanggal, tanda tangan dan jawaban tetap garis kosong.
assert.equal((doc.match(/Nama: _{4,}/g) ?? []).length, 2, 'both attestations keep a blank name field')
assert.equal((doc.match(/Tanda tangan: _{4,}/g) ?? []).length, 2, 'both attestations keep a blank signature field')
assert.equal((doc.match(/Tanggal: _{4,}/g) ?? []).length, 2, 'both attestations keep a blank date field')
assert.ok(/Status: PERMINTAAN, bukan pernyataan\./.test(doc) && /AI \*\*tidak\*\* menyatakan kepemilikan/.test(doc), 'the request says it is not an attestation')
assert.ok(/D8 tetap \*\*REPORTED\*\*/.test(doc), 'D8 stays REPORTED')
assert.ok(!/karya asli (adalah|milik)/i.test(doc) && !/lisensi: (CC|MIT|Apache|proprietary)/i.test(doc), 'no authorship or license claim is made on the owner’s behalf')
// Fakta yang membuat keputusan produk perlu: tidak ada rujukan kode ke video, dan AI tidak menghapusnya.
assert.ok(doc.includes('tidak ada rujukan ke berkas ini') && doc.includes('AI tidak akan menghapus aset'), 'orphan finding and no-delete rule are stated')
console.log('d8-attestation-requests: facts match the files, the two requests match the baseline gaps, nothing is attested by AI')
