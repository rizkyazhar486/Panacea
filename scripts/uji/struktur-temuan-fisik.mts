// Temuan fisik -> struktur rujukan 3D: setiap nama HARUS ada di GLB sumber yang disebut.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getEffectiveAnatomySourceNodeSnapshot } from '../../src/lib/anatomySourceNodeRegistry.ts'
import { STRUKTUR_TEMUAN, strukturUntukTemuan } from '../../src/lib/strukturTemuanFisik.ts'
import { resolveBodySystemSourceWave } from '../../src/lib/bodySystemSourceWave.ts'
const snap = getEffectiveAnatomySourceNodeSnapshot()
for (const [k, s] of Object.entries(STRUKTUR_TEMUAN)) {
  const ada = snap.some((b) => b.file === s.file && b.names.includes(s.name))
  assert.ok(ada, `struktur untuk "${k}" (${s.name} di ${s.file}) tidak ada di geometri sumber — nama dikarang`)
}
// Lebih ketat: nama harus termasuk mesh yang BENAR-BENAR diproyeksikan sistem tujuannya,
// jika tidak kamera tidak punya apa pun untuk dibingkai ('not-rendered').
const gelombang = resolveBodySystemSourceWave()
for (const [k, s] of Object.entries(STRUKTUR_TEMUAN)) {
  const sistem = gelombang.find((x) => x.id === s.systemId)
  const diproyeksikan = sistem?.targets.some((t) => t.file === s.file && t.names.includes(s.name))
  assert.ok(diproyeksikan, `struktur untuk "${k}" (${s.name}) tidak diproyeksikan sistem ${s.systemId} — fokus kamera akan gagal`)
}
const jantung = gelombang.find((x) => x.id === 'cardiovascular')!.targets.find((t) => t.id === 'heart')!
assert.ok(['Left ventricle', 'Right ventricle', 'Left atrium', 'Right atrium'].every((n) => jantung.names.includes(n)), 'target "Heart" tidak memuat ruang jantung (hanya arteri koroner)')
assert.equal(strukturUntukTemuan('kulit'), null, 'kulit dipetakan tanpa node sumber yang tepat')
assert.equal(strukturUntukTemuan('tidak-ada'), null)
const proj = readFileSync('src/pages/bodyhub/UnifiedHumanSimulationProjector.tsx', 'utf8')
const iReset = proj.indexOf('setSelectedStructureName(null)\n  }, [selectedSystemId])'), iMinta = proj.indexOf('if (requestedStructure?.name) setSelectedStructureName(requestedStructure.name)')
assert.ok(iReset > 0 && iMinta > iReset, 'fokus dari temuan dijalankan sebelum reset sistem (fokus hilang)')
const ov = readFileSync('src/components/BodyExposurePatientOverlay.tsx', 'utf8')
assert.match(ov, /reference region examined — not the lesion location/, 'batas "bukan lokasi lesi" tidak ditampilkan')
assert.match(ov, /no exact 3D structure/, 'temuan tanpa struktur tidak gagal tertutup secara terlihat')
// Body Exposure adalah satu-satunya kanvas 3D; ia HARUS membedakan tanda terverifikasi
// klinisi dari heuristik teks bebas yang sama seperti BodyDiagram (2D) sudah lakukan,
// bukan hanya warna status yang identik untuk keduanya.
assert.match(ov, /LABEL_ASAL_TEMUAN/, 'overlay Body Exposure tidak mengimpor label asal temuan')
assert.match(ov, /data-asal-temuan=\{m\.origin/, 'asal temuan tidak diteruskan ke DOM overlay Body Exposure')
assert.match(ov, /unverified heuristic/, 'temuan dari heuristik teks tidak dibedakan secara terlihat dari tanda terverifikasi klinisi di kanvas 3D')
assert.match(readFileSync('src/pages/BodyExposureOS.tsx', 'utf8'), /requestedStructure=\{strukturDiminta\}/, 'Body Exposure tidak meneruskan fokus ke kanvas')
console.log(`struktur-temuan-fisik: ${Object.keys(STRUKTUR_TEMUAN).length} kunci terikat ke node sumber nyata; kulit gagal tertutup; batas bukan-lokasi-lesi tampil`)
