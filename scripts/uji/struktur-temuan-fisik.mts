// Temuan fisik -> struktur rujukan 3D: setiap nama HARUS ada di GLB sumber yang disebut.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getEffectiveAnatomySourceNodeSnapshot } from '../../src/lib/anatomySourceNodeRegistry.ts'
import { STRUKTUR_TEMUAN, strukturUntukTemuan } from '../../src/lib/strukturTemuanFisik.ts'
const snap = getEffectiveAnatomySourceNodeSnapshot()
for (const [k, s] of Object.entries(STRUKTUR_TEMUAN)) {
  const ada = snap.some((b) => b.file === s.file && b.names.includes(s.name))
  assert.ok(ada, `struktur untuk "${k}" (${s.name} di ${s.file}) tidak ada di geometri sumber — nama dikarang`)
}
assert.equal(strukturUntukTemuan('kulit'), null, 'kulit dipetakan tanpa node sumber yang tepat')
assert.equal(strukturUntukTemuan('tidak-ada'), null)
const proj = readFileSync('src/pages/bodyhub/UnifiedHumanSimulationProjector.tsx', 'utf8')
const iReset = proj.indexOf('setSelectedStructureName(null)\n  }, [selectedSystemId])'), iMinta = proj.indexOf('if (requestedStructure?.name) setSelectedStructureName(requestedStructure.name)')
assert.ok(iReset > 0 && iMinta > iReset, 'fokus dari temuan dijalankan sebelum reset sistem (fokus hilang)')
const ov = readFileSync('src/components/BodyExposurePatientOverlay.tsx', 'utf8')
assert.match(ov, /reference region examined — not the lesion location/, 'batas "bukan lokasi lesi" tidak ditampilkan')
assert.match(ov, /no exact 3D structure/, 'temuan tanpa struktur tidak gagal tertutup secara terlihat')
assert.match(readFileSync('src/pages/BodyExposureOS.tsx', 'utf8'), /requestedStructure=\{strukturDiminta\}/, 'Body Exposure tidak meneruskan fokus ke kanvas')
console.log(`struktur-temuan-fisik: ${Object.keys(STRUKTUR_TEMUAN).length} kunci terikat ke node sumber nyata; kulit gagal tertutup; batas bukan-lokasi-lesi tampil`)
