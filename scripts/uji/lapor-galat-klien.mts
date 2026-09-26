// Pelapor galat klien: dedup, batas per sesi, tanpa query rute, tidak pernah melempar.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buatPelapor, MAKS_LAPORAN_PER_SESI } from '../../src/lib/laporGalatKlien.ts'
const kirim: unknown[] = []
const lapor = buatPelapor((l) => kirim.push(l), () => '/emr?pasien=123', '1.0')
assert.equal(lapor('error', new TypeError('x undefined'), 'https://a.id/assets/Foo-1.js?v=1', 10), true)
assert.equal(lapor('error', new TypeError('x undefined'), 'https://a.id/assets/Foo-1.js?v=1', 10), false, 'galat identik tidak dikirim ulang')
const l = kirim[0] as { rute: string; berkas: string; pesan: string }
assert.equal(l.rute, '/emr', 'query rute dibuang'); assert.equal(l.berkas, 'Foo-1.js'); assert.equal(l.pesan, 'TypeError: x undefined')
for (let i = 0; i < 20; i++) lapor('rejection', `galat ${i}`)
assert.equal(kirim.length, MAKS_LAPORAN_PER_SESI, 'dibatasi per sesi')
const rusak = buatPelapor(() => { throw new Error('jaringan') }, () => '/')
assert.doesNotThrow(() => rusak('error', 'y'), 'telemetri tidak boleh melempar')
assert.match(readFileSync('src/main.tsx', 'utf8'), /pasangPelaporGalat\(/); assert.match(readFileSync('src/components/FeatureErrorBoundary.tsx', 'utf8'), /laporGalat\('boundary'/)
console.log('lapor-galat-klien: lulus')
