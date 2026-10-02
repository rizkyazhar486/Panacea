import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import type { BodySystemId } from '../../src/lib/bodySystemSourceWave.ts'
import { ownRequirementsForSystem, UNIVERSAL_ATLAS_REQUIREMENTS } from '../../src/lib/anatomy/universalAtlasStandard.ts'

// ─────────────────────────────────────────────────────────────────────────────
// TIGA SISTEM PUNYA DUA CATATAN, BUKAN SATU.
//
// `reproductive` terbagi laki-laki/perempuan, `sensory-ent` terbagi mata/
// telinga, `integumentary-surface` terbagi kulit/payudara. Mengambil "catatan
// milik sistem ini" dengan `.find()` berhenti pada yang PERTAMA ditemukan dan
// diam-diam membuang separuh daftar struktur yang sudah ditinjau — payudara
// hilang dari kulit, telinga hilang dari mata, reproduksi perempuan hilang
// dari reproduksi laki-laki. Bukan data yang hilang, hanya data yang berhenti
// sampai separuh jalan.
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. Ketiga sistem bercabang dua benar-benar mengembalikan KEDUANYA ───────
const bercabangDua: Record<string, string[]> = {
  reproductive: ['male-reproductive-complete', 'female-reproductive-complete'],
  'sensory-ent': ['ocular-complete', 'ear-complete'],
  'integumentary-surface': ['integument-complete', 'breast-complete'],
}
for (const [sistem, idSeharusnya] of Object.entries(bercabangDua)) {
  const hasil = ownRequirementsForSystem(sistem as BodySystemId)
  assert.equal(hasil.length, 2,
    `${sistem} owns two requirement records but ownRequirementsForSystem() returned ${hasil.length} — the second ` +
    'record silently disappeared, which is exactly what a .find() instead of .filter() would do here')
  assert.deepEqual(hasil.map((h) => h.id).sort(), idSeharusnya.sort(),
    `${sistem} returned the wrong pair of requirement records`)
}

// ── 2. Sistem bercabang SATU tetap mengembalikan satu, bukan nol atau semua ─
const cardio = ownRequirementsForSystem('cardiovascular')
assert.equal(cardio.length, 1, 'cardiovascular owns exactly one requirement record')
assert.equal(cardio[0]?.id, 'cardiovascular-complete')

// ── 3. cross-system TIDAK PERNAH ikut sebagai "milik" sistem manapun ────────
for (const sistem of ['cardiovascular', 'nervous', 'reproductive'] as const) {
  const hasil = ownRequirementsForSystem(sistem)
  assert.ok(hasil.every((h) => h.system === sistem),
    `${sistem}'s own requirements leaked a cross-system entry — those are shared chemistry/genomic targets, ` +
    'not structures this system owns')
}

// ── 4. Total struktur milik sistem bercabang dua dijumlahkan, tidak dipotong ─
const totalKulit = ownRequirementsForSystem('integumentary-surface')
  .flatMap((h) => h.examples).length
const seharusnya = UNIVERSAL_ATLAS_REQUIREMENTS
  .filter((h) => h.system === 'integumentary-surface')
  .flatMap((h) => h.examples).length
assert.equal(totalKulit, seharusnya, 'flattening the two integumentary records lost or duplicated example structures')
assert.ok(totalKulit > 14, 'integumentary-surface should combine both skin AND breast examples (over a dozen names)')

// ── 5. SemanticMicroscopeStage benar-benar menampilkan targetnya, bukan hanya mengimpornya ─
const microscope = readFileSync(new URL('../../src/pages/bodyhub/SemanticMicroscopeStage.tsx', import.meta.url), 'utf8')
assert.match(microscope, /ownRequirementsForSystem\(/, 'the microscope stage stopped reading named structures from the registry')
assert.match(microscope, /flatMap\(/, 'the microscope stage no longer combines multi-record systems — a single .find()-style read would silently drop half of three systems\' structures')
assert.match(microscope, /targets=\{namedTargets\}/, 'the tissue-scale source-gap boundary no longer names its target structures')
assert.match(microscope, /NamedTargets targets=\{namedTargets\}/, 'the cell/organelle scale panel no longer names its target structures')

console.log('target-anatomi-tersembunyi: ok (ketiga sistem bercabang dua tampil utuh, bukan separuh)')
