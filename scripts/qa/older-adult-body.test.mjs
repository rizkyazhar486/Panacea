import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = async (p) => JSON.parse(await readFile(new URL(`../../${p}`, import.meta.url), 'utf8'))
const BODY = 'TSD_S0196.OLDER_ADULT.FEMALE'
const structures = (await read('bodyexposure/manifest/structures.json')).structures.filter((s) => s.panacea_body_id === BODY)
const build = await read('bodyexposure/qa_reports/tsd_s0196_build.json')
const mesh = await read('bodyexposure/qa_reports/tsd_s0196_mesh_provenance.json')

test('individu_lansia_111_struktur_kelas_expert_refined_dan_tidak_ditinjau', () => {
  assert.equal(structures.length, 111)
  assert.equal(new Set(structures.map((s) => s.panacea_structure_id)).size, 111)
  for (const s of structures) {
    assert.equal(s.panacea_accuracy_status, 'expert_refined_segmentation', s.panacea_structure_id)
    assert.equal(s.biological_sex_applicability, 'female', s.panacea_structure_id)
    assert.match(s.panacea_license, /CC BY 4\.0/); assert.match(s.panacea_source, /subject s0196/)
  }
})

test('kelas_kosong_dan_kelas_yang_tidak_boleh_diterbitkan_tidak_ada', () => {
  const raw = new Set(structures.map((s) => s.panacea_source_raw_name))
  for (const k of ['brain', 'vertebrae_C1', 'vertebrae_C2']) { assert.ok(!raw.has(k), `${k} is empty in this subject and must not exist`); assert.ok(build.summary.empty_classes.includes(k)) }
  for (const k of ['prostate', 'kidney_cyst_left', 'kidney_cyst_right']) { assert.ok(!raw.has(k), k); assert.ok(build.summary.not_published.includes(k)) }
  assert.equal(raw.size, 111)
})

test('struktur_terpotong_tepi_pindai_dicatat_dan_lateralitas_cocok_nama', () => {
  assert.equal(build.summary.cut_by_scan_border.length, 16)
  for (const k of build.summary.cut_by_scan_border) assert.ok(mesh.structures[k].touches_ct_border, k)
  assert.ok(mesh.structures.femur_left.touches_ct_border && mesh.structures.skull.touches_ct_border)   // paha dan tengkorak terpotong
  for (const s of structures) {
    if (s.panacea_laterality === 'left') assert.match(s.panacea_structure_id, /\.L$/, s.panacea_structure_id)
    if (s.panacea_laterality === 'right') assert.match(s.panacea_structure_id, /\.R$/, s.panacea_structure_id)
  }
})

test('entri_matriks_menyatakan_satu_individu_parsial_tanpa_tinggi_badan', async () => {
  const m = await read('public/bodyexposure/body_matrix.json')
  const e = m.bodies.find((b) => b.body_id === 'HUMAN.OLDER_ADULT')
  assert.equal(e.status, 'source_backed_partial'); assert.equal(e.variants.length, 1)
  const v = e.variants[0]
  assert.equal(v.body_id, BODY); assert.equal(v.stature_m, null)       // tubuh parsial: tidak ada tinggi badan
  assert.match(v.individual, /73 years/); assert.match(v.individual, /not an atlas and not a reference older adult/); assert.match(v.individual, /Not clinically reviewed/)
  assert.match(v.coverage, /partial body/)
  assert.equal(m.light_lod.tsd_s0196_older_adult_female, 'LOD4')
  assert.equal(m.bodies.find((b) => b.body_id === 'HUMAN.PREGNANT').variants.length, 0)   // kehamilan tetap kosong: tidak ada pengganti
})

test('muatan_awal_dalam_anggaran_dan_registri_metode_other', async () => {
  const wb = await read('bodyexposure/qa_reports/web_budget.json')
  const row = wb.bodies.find((b) => b.body === 'tsd_s0196_older_adult_female')
  assert.ok(row.initial_tris > 0 && row.initial_tris <= wb.budget)
  const rev = await read('public/bodyexposure/tsd_s0196_older_adult_female.review.json')
  assert.equal(rev.rows.length, 111); assert.ok(rev.rows.every((r) => r[5] === 'other'))
})
