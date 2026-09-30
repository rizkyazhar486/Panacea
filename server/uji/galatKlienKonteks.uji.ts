import assert from 'node:assert/strict'
import { aturUlangGalatKlien, catatGalatKlien, daftarGalatKlien, ringkasanGalatKlien, type GalatKlien } from '../src/galatKlien.js'

aturUlangGalatKlien()

const dasar: GalatKlien = {
  jenis: 'error',
  pesan: 'TypeError: failed to render panel',
  berkas: 'Workspace.js',
  baris: 42,
  rute: '/clinical',
  fitur: 'Workspace',
  versi: '1.0.0',
}

const log: string[] = []
catatGalatKlien(dasar, (baris) => log.push(baris))
catatGalatKlien({ ...dasar, rute: '/body' }, (baris) => log.push(baris))

assert.equal(log.length, 2, 'route tersanitasi berbeda harus tetap menjadi insiden server yang unik')
assert.deepEqual(ringkasanGalatKlien(), { total: 2, unik: 2 })
assert.equal(daftarGalatKlien().length, 2)

console.log('galatKlienKonteks: lulus')
