// Galat klien: disamarkan, didedup, dibatasi; endpoint pemilik saja yang melihat daftar.
import assert from 'node:assert/strict'
import { bersihkanGalatKlien, catatGalatKlien, ringkasanGalatKlien, daftarGalatKlien, aturUlangGalatKlien } from '../src/galatKlien.js'
aturUlangGalatKlien()
const g = bersihkanGalatKlien({ jenis: 'error', pesan: 'Cannot read x of budi@rs.id token eyJhbGciOiJIUzI1NiJ9abcdefghijklmnop pasien 1234567 https://x.id/a?b=1', berkas: 'https://app.id/assets/Body-abc.js?v=2', baris: 12, rute: '/emr/pasien/ABCDEFGHIJKLMNOPQRST?nik=3171', fitur: 'Genome', versi: '1.2.3<x>' })!
for (const bocor of ['budi@rs.id', 'eyJhbGci', '1234567', 'https://', 'ABCDEFGHIJKLMNOPQRST', 'nik', '3171', '<x>']) assert.ok(!JSON.stringify(g).includes(bocor), `bocor: ${bocor}`)
assert.equal(g.berkas, 'Body-abc.js'); assert.equal(g.rute, '/emr/pasien/:x')
assert.equal(bersihkanGalatKlien({ jenis: 'lain', pesan: 'x' }), null, 'jenis tak dikenal ditolak'); assert.equal(bersihkanGalatKlien('teks'), null)
const log: string[] = []
catatGalatKlien(g, (b) => log.push(b)); catatGalatKlien(g, (b) => log.push(b))
assert.equal(log.length, 1, 'galat identik dicatat sekali'); assert.deepEqual(ringkasanGalatKlien(), { total: 2, unik: 1 }); assert.equal(daftarGalatKlien()[0].jumlah, 2)
console.log('galatKlien: lulus')
