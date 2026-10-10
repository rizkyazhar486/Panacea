import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { recordApproves } from '../../src/domains/body-exposure/engine/structureReview.ts'

const j = async (p) => JSON.parse(await readFile(new URL(`../../${p}`, import.meta.url), 'utf8'))
const ledger = await j('bodyexposure/manifest/clinical_reviews.json')
const auth = await j('bodyexposure/manifest/clinical_review_authorizations.json')
const structures = (await j('bodyexposure/manifest/structures.json')).structures
const pub = new URL('../../public/bodyexposure/', import.meta.url)
const registries = []
for (const f of (await readdir(pub)).filter((n) => n.endsWith('.review.json'))) registries.push(JSON.parse(await readFile(new URL(f, pub), 'utf8')))
const versionOf = new Map(registries.flatMap((r) => r.rows.map((x) => [x[0], x[6]])))
const NOW = new Date().toISOString()

test('buku_besar_dan_daftar_berwenang_berbentuk_benar', () => {
  assert.equal(ledger.schema, 1); assert.ok(Array.isArray(ledger.records))
  assert.equal(auth.schema, 1); assert.ok(Array.isArray(auth.authorized_reviewers))
  assert.ok(auth.authorized_reviewers.every((x) => typeof x === 'string' && x.trim() === x && x.length > 0))
  assert.equal(new Set(auth.authorized_reviewers).size, auth.authorized_reviewers.length)
})

test('setiap_catatan_confirmed_di_buku_besar_sah_untuk_versi_saat_ini', () => {
  // catatan lain (corrections_needed / cannot_assess) boleh ada, tetapi catatan "confirmed" yang tidak sah dilarang masuk buku besar
  for (const rec of ledger.records) {
    assert.ok(versionOf.has(rec.structure_id), `ledger names an unknown structure: ${rec.structure_id}`)
    if (rec.decision === 'confirmed') {
      const r = recordApproves(rec, { authorizedReviewers: auth.authorized_reviewers, currentAssetVersion: versionOf.get(rec.structure_id), nowIso: NOW })
      assert.equal(r.approved, true, `${rec.structure_id}: ${r.reason}`)
    }
  }
})

test('tidak_ada_struktur_bertanda_ditinjau_tanpa_catatan_sah', () => {
  const approved = new Set(ledger.records.filter((r) => recordApproves(r, { authorizedReviewers: auth.authorized_reviewers, currentAssetVersion: versionOf.get(r.structure_id) ?? '', nowIso: NOW }).approved).map((r) => r.structure_id))
  const claimed = structures.filter((s) => s.panacea_clinically_reviewed === true || s.panacea_review_status === 'reviewed' || s.panacea_review_status === 'clinically_reviewed')
  for (const s of claimed) assert.ok(approved.has(s.panacea_structure_id), `${s.panacea_structure_id} is marked reviewed without an approving ledger record`)
})

test('tanpa_peninjau_berwenang_tidak_ada_yang_ditinjau', () => {
  // kondisi saat ini; bila pemilik menambahkan peninjau, uji ini harus diubah bersama bukti kualifikasinya
  const rec = { schema: 1, decision: 'confirmed', reviewer_id: 'anyone', asset_version: 'v', method: 'other', checks: Object.fromEntries(['identity', 'laterality', 'position', 'completeness', 'scale', 'provenance', 'limitations'].map((k) => [k, true])), reviewed_at: '2020-01-01T00:00:00Z' }
  assert.equal(recordApproves(rec, { authorizedReviewers: auth.authorized_reviewers, currentAssetVersion: 'v', nowIso: NOW }).approved, auth.authorized_reviewers.includes('anyone'))
  if (auth.authorized_reviewers.length === 0) assert.equal(ledger.records.filter((r) => r.decision === 'confirmed').length, 0)
})

test('registri_sesuai_manifest_id_unik_dan_metode_dikenal', () => {
  const byBody = new Map()
  for (const s of structures) byBody.set(s.panacea_body_id, (byBody.get(s.panacea_body_id) ?? 0) + 1)
  assert.ok(registries.length >= 16)
  for (const r of registries) {
    assert.equal(new Set(r.rows.map((x) => x[0])).size, r.rows.length, `${r.tag}: duplicate structure id`)
    assert.equal(r.rows.length, byBody.get(r.body_id), `${r.tag}: registry rows differ from the manifest`)
    for (const x of r.rows) {
      assert.ok(['manual_segmentation', 'model_segmented', 'reference_stand_in', 'other'].includes(x[5]), `${x[0]}: method ${x[5]}`)
      assert.match(x[6], /^body_v\d+:\d+v\d+t$/); assert.ok(x[7] >= 0 && x[7] < r.sources.length)
    }
  }
})

test('mesin_tinjauan_memakai_metode_yang_benar_pada_tubuh_denver_ct', () => {
  const r = registries.find((x) => x.tag === 'vhf_denver_ct_adult_female')
  assert.equal(r.rows.filter((x) => x[5] === 'model_segmented').length, 56)
  assert.equal(r.rows.filter((x) => x[5] === 'manual_segmentation').length, 128)
  // radius, ulna dan tulang tangan dari ambang HU pada CT resolusi asli: bukan model, bukan manual, bukan pengganti → metode 'other'
  assert.deepEqual(r.rows.filter((x) => x[5] === 'other').map((x) => x[0].split('.').slice(-2).join('.')).sort(), ['HAND_BONES.L', 'HAND_BONES.R', 'RADIUS.L', 'RADIUS.R', 'ULNA.L', 'ULNA.R'])
})

test('halaman_dokter_terpasang_dan_tidak_menyetujui_sendiri', async () => {
  const page = await readFile(new URL('../../src/pages/DoctorBodyReview.tsx', import.meta.url), 'utf8')
  const main = await readFile(new URL('../../src/main.tsx', import.meta.url), 'utf8')
  const checklist = await readFile(new URL('../../src/pages/DoctorReviewChecklist.tsx', import.meta.url), 'utf8')
  assert.match(main, /path="\/doctor-review\/body"/); assert.match(main, /DoctorBodyReview/)
  assert.match(checklist, /to="\/doctor-review\/body"/)
  assert.match(page, /account\?\.role === 'dokter' \|\| Boolean\(account\?\.isOwner\)/)
  assert.doesNotMatch(page, /localStorage|sessionStorage/)           // catatan tidak disimpan diam-diam
  assert.doesNotMatch(page, /fetch\([^)]*method:\s*['"](POST|PUT|PATCH)/)  // halaman tidak menulis ke server
  assert.match(page, /changes nothing by itself/)
  assert.doesNotMatch(page, />\s*(Approve|Reject)\s*</i)
})
