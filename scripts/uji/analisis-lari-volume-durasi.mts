// C2: durasi mingguan yang asal-usulnya tidak diketahui bukan 0 menit.
import assert from 'node:assert/strict'
const { volumeMingguan } = await import('../../src/lib/analisisLari.ts')
const now = Date.parse('2026-10-16T12:00:00Z')
const run = (id: string, hari: number, extra: Record<string, unknown> = {}) => {
  const mulai = new Date(now - hari * 864e5).toISOString()
  return { id, nama: 'Run', mulai, selesai: new Date(Date.parse(mulai) + 1800e3).toISOString(), durasi: 1800, durationSource: 'source_field', jarakKm: 5, hr: [], pemulihan: [], ...extra } as any
}
const v = volumeMingguan([run('a', 1), run('b', 2, { durasi: 0, durationSource: 'unknown' }), run('c', 10)], 8, now)!
assert.equal(v.minggu[7].menit, null, 'minggu dengan durasi tak diketahui = null, bukan 30 menit palsu')
assert.equal(v.minggu[7].km, 10)
assert.equal(v.minggu[6].menit, 30, 'minggu dengan durasi diketahui dihitung')
assert.equal(v.minggu[0].menit, 0, 'minggu tanpa sesi tetap 0 sungguhan')
console.log('analisis-lari-volume-durasi: ok')
