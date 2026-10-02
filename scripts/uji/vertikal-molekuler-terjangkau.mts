import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  PULMONARY_SFTPC_MOLECULAR_VERTICAL, PULMONARY_SFTPC_WITHHELD_GAPS,
  validatePulmonarySftpcVertical,
} from '../../src/lib/bodyPulmonaryMolecularVertical.ts'

// Rel skala multiskala dan vertikal molekuler paru sudah lengkap di
// repositori ini sejak lama -- dan TIDAK ADA satu berkas pun yang
// mengimpornya, jadi tidak ada pengguna yang bisa membukanya. Berkas ini
// menjaga jalan masuknya tetap ada, dan menjaga kejujuran yang mudah hilang
// begitu sesuatu dipasang ke antarmuka.

const panel = readFileSync('src/pages/bodyhub/VertikalMolekulerPanel.tsx', 'utf8')
const explorer = readFileSync('src/pages/BodyExplorer.tsx', 'utf8')
const kelompok = readFileSync('src/lib/bodyExplorerTabGroups.ts', 'utf8')

// ── 1. Benar-benar bisa dibuka ──────────────────────────────────────────────
assert.match(explorer, /import\('\.\/bodyhub\/VertikalMolekulerPanel'\)/, 'Body Explorer does not load the panel')
assert.match(explorer, /\{ key: 'vertikal-molekuler', label: 'Tissue → gene' \}/, 'no tab a user can select')
assert.match(explorer, /panelTab === 'vertikal-molekuler'/, 'the tab renders nothing')
assert.match(kelompok, /'vertikal-molekuler':/, 'unclassified tab drifts to the trailing group')

// ── 2. Rel skalanya yang dipakai, bukan salinan baru ────────────────────────
assert.match(panel, /MultiscaleScaleRail/, 'the panel must mount the existing rail')
assert.match(panel, /PULMONARY_SFTPC_MOLECULAR_VERTICAL/, 'the panel must use the source-backed bridge')

// ── 3. Skala yang DITAHAN harus terlihat beserta alasannya ─────────────────
//
// Rel itu menampilkan skala tanpa simpul sebagai tombol mati. Tombol mati
// tanpa keterangan terbaca sebagai "belum dikerjakan", padahal organelle dan
// molecule dikosongkan karena keputusan sumber yang tercatat. Menampilkannya
// sebagai kekosongan diam-diam akan mengubah penolakan yang jujur menjadi
// kesan pekerjaan yang belum selesai.
assert.ok(PULMONARY_SFTPC_WITHHELD_GAPS.length >= 2, 'the withheld list must not silently empty out')
assert.match(panel, /PULMONARY_SFTPC_WITHHELD_GAPS/, 'the withheld scales must be rendered')
assert.match(panel, /gap\.reason/, 'each withheld scale must carry its recorded reason on screen')
for (const gap of PULMONARY_SFTPC_WITHHELD_GAPS) {
  assert.ok(gap.reason.length > 40, `${gap.scale}: a withheld scale needs a real reason, not a label`)
}

// ── 4. Status telaah tidak boleh disembunyikan ─────────────────────────────
const periksa = validatePulmonarySftpcVertical()
assert.equal(periksa.valid, true, 'the shipped bridge must be internally consistent')
assert.match(panel, /publicationReady/, 'the page must state whether this is publication-ready')
assert.match(panel, /qualified academic review is still outstanding/,
  'review-pending state must be said in words, not implied')

// ── 5. Batas biomedis ──────────────────────────────────────────────────────
assert.match(panel, /not a\s*\n?\s*localisation of a molecule inside rendered gross anatomy/,
  'the cross-scale boundary must stay visible')
assert.match(panel, /not a patient-specific finding|any person's lungs/,
  'the patient boundary must stay visible')
for (const klaim of [/\bdiagnos(is|e)\b(?![^.]*not)/i]) {
  assert.doesNotMatch(panel.replace(/Nothing[\s\S]*$/, ''), klaim, 'no diagnostic claim before the boundary note')
}

// ── 6. Simpulnya memang menjangkau lintas skala ────────────────────────────
const skala = new Set(PULMONARY_SFTPC_MOLECULAR_VERTICAL.nodes.map((n) => n.scale))
for (const wajib of ['tissue', 'cell', 'protein', 'pathway', 'gene']) {
  assert.ok(skala.has(wajib as never), `the vertical must actually reach ${wajib}`)
}

console.log(
  `Multiscale vertical: reachable from Body Explorer, ${skala.size} scales bound, ` +
  `${PULMONARY_SFTPC_WITHHELD_GAPS.length} scales withheld with recorded reasons on screen, review state stated.`,
)
