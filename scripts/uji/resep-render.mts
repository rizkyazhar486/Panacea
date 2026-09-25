import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buatResep, bacaResep, cocokkanResep, sha256Hex, VERSI_RENDERER } from '../../src/lib/resepRender.ts'
import { lapisanAwalCt } from '../../src/lib/lapisanVolume.ts'
import { irisanFantom } from './fantomDicom.ts'

const berkas = Array.from({ length: 12 }, (_, z) => irisanFantom(z, { irisan: 12 }))
const sidik = await Promise.all(berkas.map(sha256Hex))
assert.equal(new Set(sidik).size, 12, 'sidik berkas berbeda bertabrakan')
const data = { jumlahBerkas: 12, sha256: sidik, seriesUid: '2.25.1', modalitas: 'CT', voxel: [64, 64, 12] as [number, number, number], fisikMm: [256, 256, 48] as [number, number, number] }
const param = { mode: 'lapisan' as const, ambangBawah: 100, ambangAtas: 900, kepekatan: 0.12, pajanan: 1, potong: [1, 0.5, 1] as [number, number, number], halus: 2, lapisan: lapisanAwalCt() }
const r = buatResep(data, param, new Date('2026-09-25T00:00:00Z'))

// Pulang-pergi lewat JSON mempertahankan setiap parameter.
const balik = bacaResep(JSON.parse(JSON.stringify(r)))
assert.deepEqual(balik.parameter, param, 'parameter berubah setelah disimpan/dimuat')
assert.equal(balik.renderer, VERSI_RENDERER)
assert.ok(!JSON.stringify(r).includes('PHANTOM') && !('piksel' in r), 'resep membawa isi/tag berkas, bukan hanya sidik')

// Urutan pemilihan berkas tidak berpengaruh; berkas lain/terubah terdeteksi.
assert.equal(cocokkanResep(balik, { sha256: [...sidik].reverse(), seriesUid: '2.25.1' }).status, 'identik', 'urutan pemilihan berkas mengubah kecocokan')
const ubah = new Uint8Array(berkas[3].slice(0)); ubah[ubah.length - 1] ^= 1
const sidikUbah = [...sidik]; sidikUbah[3] = await sha256Hex(ubah.buffer)
const beda = cocokkanResep(balik, { sha256: sidikUbah, seriesUid: '2.25.1' })
assert.equal(beda.status, 'data-berbeda', 'satu bit berubah dianggap reproduksi')
assert.equal(cocokkanResep(balik, { sha256: sidik.slice(1), seriesUid: '2.25.1' }).status, 'data-berbeda', 'berkas hilang dianggap reproduksi')
assert.equal(cocokkanResep({ ...balik, renderer: 'volume-layers-0' }, { sha256: sidik }).status, 'renderer-berbeda', 'renderer lain dianggap identik piksel')

// Resep rusak/berbahaya ditolak, tidak ditebak.
assert.throws(() => bacaResep({ ...r, format: 'x' }), /not a Panacea/)
assert.throws(() => bacaResep({ ...r, parameter: { ...r.parameter, mode: 'hack' } }), /mode/)
assert.throws(() => bacaResep({ ...r, parameter: { ...r.parameter, halus: 99 } }), /out-of-range/)
assert.throws(() => bacaResep({ ...r, data: { ...r.data, sha256: ['zz'] } }), /fingerprints/)

const ui = readFileSync('src/pages/bodyhub/VolumeDicomBagian.tsx', 'utf8')
assert.match(ui, /sidik\.push\(await sha256Hex\(buf\)\)/, 'panel tidak menyidik berkas yang dimuat')
assert.doesNotMatch(ui, /buatResep\([\s\S]{0,200}seriesUid/, 'panel menulis Series UID (dapat ditelusuri ke pasien) ke resep yang dibagikan')
assert.match(ui, /NOT a reproduction/, 'resep dengan data berbeda tidak diberi tahu sebagai bukan reproduksi')
console.log('resep-render: pulang-pergi utuh, urutan berkas netral, 1 bit/berkas hilang/renderer lain terdeteksi, resep rusak ditolak')
