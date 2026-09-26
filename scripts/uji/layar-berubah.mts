// Label 3D: setState hanya bila posisi/nilai berubah melewati toleransi.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { layarBerubah } from '../../src/lib/layarBerubah.ts'
const a = { x: { x: 10, y: 20, depan: true } }
assert.equal(layarBerubah(null, a), true)
assert.equal(layarBerubah(a, { x: { x: 10.3, y: 19.8, depan: true } }), false, 'geseran sub-piksel tidak memicu render')
assert.equal(layarBerubah(a, { x: { x: 11, y: 20, depan: true } }), true, 'geseran > toleransi memicu render')
assert.equal(layarBerubah(a, { x: { x: 10, y: 20, depan: false } }), true, 'perubahan boolean memicu render')
assert.equal(layarBerubah(a, { ...a, z: { x: 1, y: 1, depan: true } }), true, 'titik baru memicu render')
assert.equal(layarBerubah({ p: { x: 1, y: 1, v: 0.2 } }, { p: { x: 1, y: 1, v: 0.9 } }), true, 'nilai aktivasi berubah memicu render')
for (const f of ['src/components/OrganModel3D.tsx', 'src/components/Pathway3D.tsx']) {
  const s = readFileSync(f, 'utf8')
  assert.match(s, /if \(layarBerubah\(layarTerakhir, next\)\)/, `${f}: setLayar harus dijaga`)
  assert.doesNotMatch(s, /^\s*setLayar\(next\)\s*$/m, `${f}: setLayar tanpa penjaga di loop frame`)
}
console.log('layar-berubah: lulus')
