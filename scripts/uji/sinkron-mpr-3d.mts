import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { kursorKeKotak } from '../../src/lib/sinkronMpr3d.ts'
import { bacaDicom, urutkanSeri } from '../../src/lib/dicom.ts'
import { buatVolumeMpr } from '../../src/lib/dicomMpr.ts'
import { irisanFantom } from './fantomDicom.ts'

const dim = { kolom: 64, baris: 32, kedalaman: 10 }
// Kursor → kotak → indeks tekstur yang disampel shader (floor((p+0.5)*n)) harus voksel yang sama.
for (const k of [{ x: 0, y: 0, z: 0 }, { x: 63, y: 31, z: 9 }, { x: 17, y: 5, z: 4 }]) {
  const p = kursorKeKotak(k, dim)
  assert.deepEqual([Math.floor((p[0] + 0.5) * 64), Math.floor((p[1] + 0.5) * 32), Math.floor((p[2] + 0.5) * 10)], [k.x, k.y, k.z], `kursor ${JSON.stringify(k)} jatuh di voksel lain di 3D`)
  assert.ok(p.every((v) => v > -0.5 && v < 0.5))
}
assert.deepEqual(kursorKeKotak({ x: 999, y: -5, z: 3 }, dim).map((v) => +v.toFixed(4)), kursorKeKotak({ x: 63, y: 0, z: 3 }, dim).map((v) => +v.toFixed(4)), 'kursor di luar volume tidak dijepit')

// Fantom: kursor di tengah silinder tulang → nilai voksel yang sama = 900 HU.
const c = Array.from({ length: 48 }, (_, z) => { const h = bacaDicom(irisanFantom(z)); assert.ok(h.ok); return h.data })
const v = buatVolumeMpr(urutkanSeri(c.map((x) => ({ citra: x }))).map((x) => x.citra)); assert.ok(v.ok)
const k = { x: 32, y: 32, z: 24 }, p = kursorKeKotak(k, v.volume)
const [ix, iy, iz] = [Math.floor((p[0] + 0.5) * v.volume.kolom), Math.floor((p[1] + 0.5) * v.volume.baris), Math.floor((p[2] + 0.5) * v.volume.kedalaman)]
assert.equal(v.volume.irisan[iz].nilai[iy * v.volume.kolom + ix], 900, 'penanda 3D tidak berada di voksel tulang yang dipilih di MPR')

const shader = readFileSync('src/components/VolumeDicom3D.tsx', 'utf8')
assert.match(shader, /if \(uPenandaAktif == 1\) \{[\s\S]{0,260}color = vec4\(0\.25, 0\.9, 1\.0, 1\.0\); return; \}/, 'penanda kursor tidak digambar di 3D')
assert.match(shader, /\(m\.uniforms\.uPenanda\.value as THREE\.Vector3\)\.set\(penanda\[0\], penanda\[1\], penanda\[2\]\)\n  \}, \[/, 'penanda 3D tidak diperbarui saat kursor MPR berpindah')
const ui = readFileSync('src/pages/bodyhub/VolumeDicomBagian.tsx', 'utf8')
assert.match(ui, /penanda=\{kursorKeKotak\(kursor, keadaan\.volume\)\}/, '3D tidak mengikuti kursor MPR')
assert.equal((ui.match(/<PlaneViewer /g) ?? []).length, 3, 'bukan tiga bidang MPR')
assert.equal((ui.match(/onPick=\{\([a-z], [a-z]\) => setKursor\(/g) ?? []).length, 3, 'bidang tidak berbagi satu kursor')
// Satu implementasi penampil MPR untuk /radiology dan Imaging.
const rad = readFileSync('src/pages/Radiology.tsx', 'utf8')
assert.match(rad, /import \{ PlaneViewer \} from '\.\.\/components\/PlaneViewerMpr'/)
assert.doesNotMatch(rad, /function PlaneViewer\(/, 'penampil MPR terduplikasi di Radiology')
console.log('sinkron-mpr-3d: kursor MPR = voksel yang sama di 3D (tulang 900 HU), 3 bidang berbagi satu kursor, satu penampil MPR')
