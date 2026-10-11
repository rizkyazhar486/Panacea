import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { buildOpenCellIndex, parseOpenCellIndex, searchProteins, LOCALISATIONS } from '../../src/domains/body-exposure/engine/openCellIndex.ts'

const L = (gene, ensg, g3 = 'cytoplasmic', g2 = '', g1 = '') => ({ target_name: gene, ensg_id: ensg, annotations_grade_3: g3, annotations_grade_2: g2, annotations_grade_1: g1 })
const A = (ensg, over = {}) => ({ gene_name: 'X', ensg_id: ensg, uniprot_id: 'P1', protein_name: 'Name', hek_rna_tpm: '10', hek_protein_conc_nm: '5', hek_protein_copy_number: '1000', ...over })
const E1 = 'ENSG00000075624', E2 = 'ENSG00000184009', E3 = 'ENSG00000111111'

test('baris_valid_digabung_dengan_kelimpahan_dan_anotasi_dipecah_per_tingkat', () => {
  const r = buildOpenCellIndex([L('ACTB', E1, 'membrane;cytoskeleton', 'cytoplasmic', '')], [A(E1)])
  assert.equal(r.rejected.length, 0); assert.equal(r.proteins.length, 1)
  assert.deepEqual(r.proteins[0].grade3, ['membrane', 'cytoskeleton']); assert.deepEqual(r.proteins[0].grade2, ['cytoplasmic']); assert.deepEqual(r.proteins[0].grade1, [])
  assert.equal(r.proteins[0].proteinNm, 5); assert.equal(r.proteins[0].uniprot, 'P1')
})

test('protein_tanpa_baris_kelimpahan_tetap_ada_dengan_nilai_null_bukan_nol', () => {
  const r = buildOpenCellIndex([L('ACTB', E1)], [])
  assert.equal(r.withoutAbundance, 1); assert.equal(r.proteins[0].rnaTpm, null); assert.equal(r.proteins[0].proteinNm, null); assert.equal(r.proteins[0].copyNumber, null)
  const r2 = buildOpenCellIndex([L('ACTB', E1)], [A(E1, { hek_protein_conc_nm: '' })])
  assert.equal(r2.proteins[0].proteinNm, null); assert.equal(r2.proteins[0].rnaTpm, 10)
})

test('id_ensembl_salah_anotasi_asing_dan_angka_tidak_sah_ditolak_dengan_alasan', () => {
  for (const bad of ['ENSG123', 'ensg00000075624', '', 'ENSG000000756245']) { const r = buildOpenCellIndex([L('G', bad)], []); assert.equal(r.proteins.length, 0, bad); assert.match(r.rejected[0].reason, /Ensembl/) }
  const r = buildOpenCellIndex([L('G', E1, 'nucleus_party')], []); assert.match(r.rejected[0].reason, /vocabulary/); assert.equal(r.proteins.length, 0)
  for (const v of ['-1', 'NaN', 'abc', 'Infinity']) { const x = buildOpenCellIndex([L('G', E1)], [A(E1, { hek_rna_tpm: v })]); assert.match(x.rejected[0].reason, /non-negative/, v); assert.equal(x.proteins.length, 0) }
  assert.equal(buildOpenCellIndex([L('G', E1)], [A(E1, { hek_rna_tpm: '0' })]).proteins[0].rnaTpm, 0)   // batas: nol sah
  assert.equal(buildOpenCellIndex([L('', E1)], []).rejected[0].reason, 'empty gene name')
})

test('id_ganda_ditolak_dan_hasil_terurut_menurut_nama_gen', () => {
  const r = buildOpenCellIndex([L('ZZZ', E1), L('AAA', E2), L('AAA2', E1)], [])
  assert.deepEqual(r.proteins.map((p) => p.gene), ['AAA', 'ZZZ']); assert.deepEqual(r.rejected, [{ gene: 'AAA2', reason: 'duplicate Ensembl id' }])
})

test('pencarian_awalan_dulu_lalu_substring_uniprot_persis_dan_kueri_kosong_kosong', () => {
  const ps = buildOpenCellIndex([L('ACTB', E1), L('CACTA', E2), L('ZZZ', E3)], [A(E1, { protein_name: 'Actin' }), A(E2, { protein_name: 'Other' }), A(E3, { uniprot_id: 'Q9X', protein_name: 'Beta actin binder' })]).proteins
  assert.deepEqual(searchProteins(ps, 'act').map((p) => p.gene), ['ACTB', 'CACTA', 'ZZZ'])   // awalan, substring gen, lalu nama protein
  assert.deepEqual(searchProteins(ps, 'q9x').map((p) => p.gene), ['ZZZ'])
  assert.deepEqual(searchProteins(ps, ` ${E1.toLowerCase()} `).map((p) => p.gene), ['ACTB'])
  assert.deepEqual(searchProteins(ps, E1.slice(0, -1)), []) // Ensembl requires the exact stable identifier
  assert.deepEqual(searchProteins(ps, 'q9'), [])                                              // UniProt hanya cocok persis
  assert.deepEqual(searchProteins(ps, '   '), []); assert.deepEqual(searchProteins(ps, 'act', 0), []); assert.equal(searchProteins(ps, 'act', 1).length, 1)
})

test('indeks_terbit_valid_cc_by_sa_dan_ditolak_bila_lisensi_hilang_atau_data_rusak', async () => {
  const pub = JSON.parse(await readFile(new URL('../../public/bodyexposure/opencell_index.json', import.meta.url), 'utf8'))
  const ok = parseOpenCellIndex(pub); assert.equal(ok.ok, true, ok.error)
  assert.equal(pub.proteins.length, 1310); assert.deepEqual(pub.rejected, []); assert.match(pub.source_files.localisation.sha256, /^[0-9a-f]{64}$/)
  assert.match(pub.citation, /Cho NH/); assert.ok(searchProteins(pub.proteins, 'ACTB').some((p) => p.gene === 'ACTB'))
  const used = new Set(pub.proteins.flatMap((p) => [...p.grade3, ...p.grade2, ...p.grade1])); for (const u of used) assert.ok(LOCALISATIONS.includes(u), u)
  assert.equal(parseOpenCellIndex({ ...pub, licence: 'CC BY 4.0' }).ok, false)                  // tanpa share-alike ditolak
  assert.equal(parseOpenCellIndex({ ...pub, citation: ' ' }).ok, false)
  assert.equal(parseOpenCellIndex({ ...pub, proteins: [{ ...pub.proteins[0], ensg: 'bad' }] }).ok, false)
  assert.equal(parseOpenCellIndex({ ...pub, proteins: [{ ...pub.proteins[0], rnaTpm: -1 }] }).ok, false)
  assert.equal(parseOpenCellIndex({ ...pub, proteins: [pub.proteins[0], pub.proteins[0]] }).ok, false)
  assert.equal(parseOpenCellIndex(null).ok, false)
})


test('metadata_protein_rusak_ditolak_sebelum_pencarian_atau_render', async () => {
  const pub = JSON.parse(await readFile(new URL('../../public/bodyexposure/opencell_index.json', import.meta.url), 'utf8'))
  const protein = pub.proteins[0]
  for (const [field, value] of [
    ['name', { unexpected: 'object' }], ['name', 42], ['name', []], ['name', undefined],
    ['uniprot', {}], ['uniprot', 42], ['uniprot', []], ['uniprot', undefined],
    ['gene', '   '], ['ensg', { toString: () => protein.ensg }],
  ]) {
    const result = parseOpenCellIndex({ ...pub, proteins: [{ ...protein, [field]: value }] })
    assert.equal(result.ok, false, `malformed ${field} must fail at the data boundary`)
  }
  const valid = parseOpenCellIndex({ ...pub, proteins: [{ ...protein, name: null, uniprot: null }] })
  assert.equal(valid.ok, true, valid.error)
  assert.doesNotThrow(() => searchProteins(valid.index.proteins, 'unmatched'))
  assert.ok(searchProteins(pub.proteins, 'ACTB').some(p => p.gene === 'ACTB'))
})
