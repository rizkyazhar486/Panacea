import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { buildCrosswalk, ONTOLOGY_ID } from '../../src/domains/body-exposure/engine/ontologyCrosswalk.ts'

const S = (id, raw, body = 'B') => ({ panacea_structure_id: id, panacea_body_id: body, panacea_source_raw_name: raw })
const R = (node_name, OntologyID, label = 'x') => ({ node_name, OntologyID, label })
const structures = [S('B.A.L', 'VH_F_a'), S('B.A.R', 'VH_F_b'), S('B.C', 'VH_F_c'), S('OTHER.A', 'VH_F_a', 'OTHER')]

test('memetakan_nama_sumber_persis_dan_hanya_pada_tubuh_yang_diminta', () => {
  const r = buildCrosswalk([R('VH_F_a', 'UBERON:0001', 'organ a'), R('VH_F_b', 'FMA:22')], structures, 'B')
  assert.deepEqual(r.map, { 'B.A.L': { id: 'UBERON:0001', label: 'organ a' }, 'B.A.R': { id: 'FMA:22', label: 'x' } } ) // dua nama berbeda; OTHER.A tidak ikut
  assert.equal(r.structures_total, 3)
})

test('struktur_tanpa_baris_tidak_diberi_id', () => {
  const r = buildCrosswalk([R('VH_F_a', 'UBERON:0001')], structures, 'B')
  assert.equal(r.map['B.C'], undefined)
  assert.equal(Object.keys(r.map).length, 1)
})

test('id_kosong_ditolak_dengan_alasan_dan_tidak_dipetakan', () => {
  const r = buildCrosswalk([R('VH_F_a', '')], structures, 'B')
  assert.deepEqual(r.rejected, [{ node_name: 'VH_F_a', reason: 'empty ontology id' }]); assert.deepEqual(r.map, {})
})

test('format_id_salah_ditolak', () => {
  for (const bad of ['UBERON:', 'uberon:1', 'GO:123', 'UBERON:12ab', 'FMA 22', 'UBERON:1234567890']) {
    const r = buildCrosswalk([R('VH_F_a', bad)], structures, 'B')
    assert.equal(r.rejected.length, 1, bad); assert.deepEqual(r.map, {}, bad)
  }
  for (const ok of ['UBERON:0013754', 'FMA:57991']) assert.match(ok, ONTOLOGY_ID)
})

test('nama_sama_dengan_id_berbeda_ditolak_keduanya_dan_id_sama_diterima', () => {
  const conflict = buildCrosswalk([R('VH_F_a', 'UBERON:1'), R('VH_F_a', 'UBERON:2')], structures, 'B')
  assert.deepEqual(conflict.map, {}); assert.equal(conflict.rejected[0].reason, 'two rows give the same name different ontology ids')
  const same = buildCrosswalk([R('VH_F_a', 'UBERON:1'), R('VH_F_a', 'UBERON:1')], structures, 'B')
  assert.equal(Object.keys(same.map).length, 1); assert.equal(same.rejected.length, 0)
})

test('baris_tanpa_struktur_dicatat_dan_nama_kosong_ditolak', () => {
  const r = buildCrosswalk([R('VH_F_group', 'UBERON:9'), R('', 'UBERON:1')], structures, 'B')
  assert.deepEqual(r.unmatched_rows, ['VH_F_group']); assert.equal(r.rejected[0].reason, 'empty node name'); assert.deepEqual(r.map, {})
})

test('berkas_terbit_konsisten_dengan_manifest', async () => {
  const pub = JSON.parse(await readFile(new URL('../../public/bodyexposure/ontology.adult_female.json', import.meta.url), 'utf8'))
  const man = JSON.parse(await readFile(new URL('../../bodyexposure/manifest/structures.json', import.meta.url), 'utf8')).structures
  const ids = new Map(man.filter((s) => s.panacea_body_id === pub.body_id).map((s) => [s.panacea_structure_id, s]))
  assert.equal(pub.structures_total, ids.size)
  assert.equal(pub.matched_structures, Object.keys(pub.map).length)
  assert.ok(pub.matched_structures > 600)
  assert.match(pub.csv.sha256, /^[0-9a-f]{64}$/)
  for (const [sid, e] of Object.entries(pub.map)) {
    assert.ok(ids.has(sid), `${sid} is not a structure of ${pub.body_id}`)
    assert.match(e.id, ONTOLOGY_ID, sid)
  }
  assert.equal(pub.rejected.some((x) => x.node_name === 'VH_F_vertebra'), true)  // baris tanpa ID di sumber ditolak, tidak dikarang
  assert.equal(Object.values(pub.map).some((e) => !e.id), false)
})
