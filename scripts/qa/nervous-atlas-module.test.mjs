import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = async (p) => JSON.parse(await readFile(new URL(`../../${p}`, import.meta.url), 'utf8'))
const BODY = 'ATLAS.NERVOUS.MNI152'
const SYSTEMS = ['cardiovascular', 'fascia', 'nervous', 'peripheral', 'spinal', 'territories', 'tracts']
const structures = (await read('bodyexposure/manifest/structures.json')).structures.filter((s) => s.panacea_body_id === BODY)

test('modul_atlas_memuat_556_struktur_dengan_id_unik_dan_kelas_kebenaran_template', () => {
  assert.equal(structures.length, 556)
  assert.equal(new Set(structures.map((s) => s.panacea_structure_id)).size, 556)
  for (const s of structures) {
    assert.ok(s.panacea_structure_id.startsWith(`${BODY}.`), s.panacea_structure_id)
    assert.equal(s.panacea_accuracy_status, 'atlas_template', s.panacea_structure_id)
    assert.ok(SYSTEMS.includes(s.panacea_system), `${s.panacea_structure_id}: ${s.panacea_system}`)
  }
})

test('lapisan_gabungan_tetap_cc_by_sa_dan_sumber_asli_ikut', () => {
  for (const s of structures) {
    assert.match(s.panacea_license, /combined atlas layer CC BY-SA 4\.0$/, s.panacea_structure_id)
    assert.match(s.panacea_source, /Clinical Neuroanatomy Atlas v1\.0\.3/, s.panacea_structure_id)
  }
  const sources = new Set(structures.map((s) => s.panacea_source.split(' (')[0]))
  assert.ok(sources.has('zanatomy') && sources.has('cerebra') && sources.has('massp'))
})

test('sumber_tanpa_lisensi_tertulis_tidak_dipublikasikan', async () => {
  // negatif: label aseg FreeSurfer pada template MNI (30 mesh) dan selubung otak buram dikecualikan
  assert.equal(structures.some((s) => /^mni_aseg\b/.test(s.panacea_source)), false)
  assert.equal(structures.some((s) => /envelope/i.test(s.panacea_source_raw_name)), false)
  const rep = await read('bodyexposure/qa_reports/nervous_mni_build.json')
  assert.deepEqual(rep.summary.excluded, { mni_aseg: 30, envelope: 1 })
  assert.deepEqual(rep.summary.missing_files, [])
  assert.equal(rep.summary.structures, 556)
})

test('lateralitas_dan_sumbu_dilaporkan_dan_dekat_garis_tengah_dibatasi', async () => {
  const rep = await read('bodyexposure/qa_reports/nervous_mni_build.json')
  for (const n of rep.summary.laterality_near_midline) assert.ok(Math.abs(n.x_m) <= 0.03, `${n.id}: ${n.x_m}`)
  const sides = structures.filter((s) => s.panacea_laterality === 'left' || s.panacea_laterality === 'right')
  assert.ok(sides.length > 400)
  for (const s of sides) assert.match(s.panacea_structure_id, /\.(L|R)$/, s.panacea_structure_id)
})

test('entri_matriks_menyatakan_template_bukan_tubuh_dan_belum_ditinjau', async () => {
  const m = await read('public/bodyexposure/body_matrix.json')
  const e = m.bodies.find((b) => b.body_id === BODY)
  assert.equal(e.status, 'atlas_template'); assert.equal(e.structures, 556)
  assert.deepEqual(Object.keys(e.systems).sort(), SYSTEMS)
  assert.match(e.variants[0].individual, /not an individual and not a body/)
  assert.match(e.variants[0].individual, /Not clinically reviewed/)
  assert.match(e.source, /CC BY-SA 4\.0/)
  assert.equal(m.light_lod.atlas_nervous_mni152, 'LOD4')
  for (const sys of SYSTEMS) assert.ok(m.files.includes(`atlas_nervous_mni152.${sys}`), sys)
})

test('muatan_awal_modul_atlas_dalam_anggaran_dan_registri_meninjau_metode_other', async () => {
  const wb = await read('bodyexposure/qa_reports/web_budget.json')
  const row = wb.bodies.find((b) => b.body === 'atlas_nervous_mni152')
  assert.ok(row.initial_tris > 0 && row.initial_tris <= wb.budget, `${row.initial_tris} > ${wb.budget}`)
  assert.equal(wb.ok, true)
  const rev = await read('public/bodyexposure/atlas_nervous_mni152.review.json')
  assert.equal(rev.rows.length, 556)
  assert.ok(rev.rows.every((r) => r[5] === 'other'))
})
