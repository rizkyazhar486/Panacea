import assert from 'node:assert/strict'
import { susunTabUtama } from '../../src/lib/tabPriority.ts'

const tabs = [
  'pelatih', 'organizer', 'asupan-pelatih', 'progres', 'gps', 'athlete-science',
  'analisis', 'fisiologi', 'endurance', 'sesi', 'rencana', 'lab', 'sains',
].map((id) => ({ id }))

const flow = ['pelatih', 'progres', 'fisiologi', 'rencana', 'lab'] as const

assert.deepEqual(
  susunTabUtama(tabs, 'pelatih', flow).map((x) => x.id),
  [...flow],
  'Training harus membuka lima langkah utama dalam urutan keputusan yang diminta',
)

assert.deepEqual(
  susunTabUtama(tabs, 'gps', flow).map((x) => x.id),
  [...flow, 'gps'],
  'deep-link sekunder tetap terlihat tanpa mengganti lima langkah utama',
)

assert.deepEqual(
  susunTabUtama(tabs.slice(0, 5), 'pelatih', undefined).map((x) => x.id),
  tabs.slice(0, 5).map((x) => x.id),
  'halaman kecil tanpa konfigurasi mempertahankan seluruh tab',
)

console.log('3 lulus, 0 gagal')
