import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NIFTI1 } from 'nifti-reader-js'
import { parseVariants, parseCells, parseStatistics, parseVolume, importDataset, MAX_ROWS } from '../../src/biomedical/imports'
import { benjaminiHochberg, researchReport, runEngine } from '../../src/biomedical/engine'
import { demoDatasets, DEMO_VCF, DEMO_STATS, demoCells } from '../../src/biomedical/demo'

test('VCF preserves coordinates, multiple alleles, missing quality and reference provenance', () => {
  const parsed = parseVariants(DEMO_VCF)
  assert.equal(parsed.reference, 'SYNTHETIC-NOT-A-HUMAN-ASSEMBLY')
  assert.equal(parsed.variants?.[0].position, 100)
  assert.deepEqual(parsed.variants?.[4].alternate, ['C', 'G'])
  assert.equal(parsed.variants?.[3].quality, null)
  assert.equal(parsed.variants?.[3].filter, 'Not evaluated')
})
test('VCF rejects missing headers, malformed positions, alleles and duplicate records', () => {
  for (const value of [DEMO_VCF.replace('##fileformat=VCFv4.2\n', ''), DEMO_VCF.replace('\t100\t', '\t100abc\t'), DEMO_VCF.replace('\t100\t', '\t0\t'), DEMO_VCF.replace('\tG\t60\t', '\tinvalid\t60\t'), DEMO_VCF + DEMO_VCF.split('\n')[4] + '\n']) assert.throws(() => parseVariants(value))
})
test('VCF rejects prototype metadata and extra columns', () => {
  assert.throws(() => parseVariants(DEMO_VCF.replace('ID=GENE', 'ID=__proto__')))
  assert.throws(() => parseVariants(DEMO_VCF.replace('GENE=KRAS', 'constructor=KRAS')))
  assert.throws(() => parseVariants(DEMO_VCF.replace('GENE=KRAS', 'GENE=KRAS\textra')))
})
test('CSV cells preserve zero expression, group and coordinates', () => {
  const cells = parseCells('cell_id,gene,expression,x,y,z,group\nc1,KRAS,0,1,2,3,A\n')
  assert.equal(cells[0].expression, 0)
  assert.deepEqual(cells[0].position, [1, 2, 3])
  assert.equal(parseCells(demoCells()).length, 720)
})
test('CSV refuses negative expression, missing coordinates, mismatched cells and duplicate pairs', () => {
  const header = 'cell_id,gene,expression,x,y,z,group\n'
  for (const row of ['c1,KRAS,-1,1,2,3,A', 'c1,KRAS,1,,2,3,A', 'c1,KRAS,1,1,2,3,A\nc1,KRAS,2,1,2,3,A', 'c1,KRAS,1,1,2,3,A\nc1,BRAF,2,9,2,3,A']) assert.throws(() => parseCells(header + row))
})
test('CSV parser handles quoted groups and rejects inconsistent columns', () => {
  assert.equal(parseCells('cell_id,gene,expression,x,y,z,group\nc1,KRAS,1,1,2,3,"Group A, subset"')[0].group, 'Group A, subset')
  assert.throws(() => parseCells('cell_id,gene,expression,x,y,z,group\nc1,KRAS,1,1,2,3,A,extra'))
})
test('CSV rejects duplicate hypothesis genes and invalid p-values', () => {
  for (const rows of ['KRAS,1.1,2', 'KRAS,NaN,2', 'KRAS,,2', 'KRAS,0.1,2\nKRAS,0.2,3']) assert.throws(() => parseStatistics('gene,p_value,log2fc\n' + rows))
})
test('BH matches a known family and preserves original order', () => {
  assert.deepEqual(benjaminiHochberg([0.01, 0.04, 0.03, 0.002]), [0.02, 0.04, 0.04, 0.008])
  assert.deepEqual(benjaminiHochberg([0, 0, 1]), [0, 0, 1])
  assert.deepEqual(benjaminiHochberg([]), [])
  assert.throws(() => benjaminiHochberg([NaN]))
})
test('empty inputs never produce findings or a diagnosis', () => {
  const result = runEngine([], { minimumQuality: 20, alpha: 0.05 })
  assert.equal(result.counts.discoveries, 0)
  assert.equal(result.stages[0].status, 'waiting')
  assert.equal(result.status, 'research-only')
})
test('synthetic pipeline is deterministic except caller-provided timestamp', async () => {
  const data = await demoDatasets()
  const result = runEngine(data, { minimumQuality: 20, alpha: 0.05 }, '2026-09-06T00:00:00Z')
  assert.deepEqual(result, runEngine(data, { minimumQuality: 20, alpha: 0.05 }, result.generatedAt))
  assert.equal(result.counts.variants, 5)
  assert.equal(result.counts.passVariants, 3)
  assert.equal(result.counts.unscoredVariants, 1)
  assert.equal(result.counts.cells, 180)
  assert.equal(result.counts.discoveries, 2)
  assert(result.warnings.some(s => s.includes('Synthetic')))
  assert(result.warnings.some(s => s.includes('identity')))
})
test('report omits source filenames and raw records', async () => {
  const data = await demoDatasets()
  data[0].source.name = 'PRIVATE-PATIENT-NAME.vcf'
  const result = researchReport(runEngine(data, { minimumQuality: 20, alpha: 0.05 }), 'Study A')
  const serialized = JSON.stringify(result)
  assert(!serialized.includes('PRIVATE-PATIENT-NAME'))
  assert(!serialized.includes('demo-179'))
  assert.equal(result.sources[0].sha256.length, 64)
  assert(result.intendedUse.includes('Not a diagnosis'))
})
test('fingerprints identify file bytes, not filenames', async () => {
  const encoded = new TextEncoder().encode(DEMO_STATS).buffer as ArrayBuffer
  const a = await importDataset('one.csv', 'statistics', encoded)
  const b = await importDataset('two.csv', 'statistics', encoded)
  assert.equal(a.source.sha256, b.source.sha256)
})
test('record caps reject oversized studies', () => {
  const line = 'c1,KRAS,1,0,0,0,A\n'
  assert.throws(() => parseCells('cell_id,gene,expression,x,y,z,group\n' + line.repeat(MAX_ROWS + 1)))
})

function niftiFixture() {
  const header = new NIFTI1()
  header.littleEndian = true; header.dims = [3, 2, 2, 2, 1, 1, 1, 1]
  header.datatypeCode = 4; header.numBitsPerVoxel = 16; header.vox_offset = 352
  header.scl_slope = 2; header.scl_inter = -10; header.xyzt_units = 2
  header.pixDims = [1, 1, 1, 1, 1, 1, 1, 1]; header.sform_code = 1
  header.affine = [[2, 0, 0, 10], [0, 3, 0, 20], [0, 0, 4, 30], [0, 0, 0, 1]]
  header.magic = 'n+1'
  const bytes = new Uint8Array(368)
  bytes.set(new Uint8Array(header.toArrayBuffer()))
  const view = new DataView(bytes.buffer)
  for (let i = 0; i < 8; i++) view.setInt16(352 + i * 2, i, true)
  return bytes.buffer
}
test('NIfTI respects scalar scaling, dimensions, affine and units', () => {
  const v = parseVolume(niftiFixture())
  assert.deepEqual(v.dimensions, [2, 2, 2])
  assert.deepEqual(v.range, [-10, 4])
  assert.deepEqual(v.affine[0], [2, 0, 0, 10])
  assert.equal(v.units, 'mm')
})
test('NIfTI rejects truncated and non-scalar data', () => {
  assert.throws(() => parseVolume(niftiFixture().slice(0, 360)))
  const buffer = niftiFixture(); new DataView(buffer).setInt16(70, 128, true)
  assert.throws(() => parseVolume(buffer))
})
test('NIfTI rejects 4D volumes and invalid dimensions', () => {
  const buffer = niftiFixture(); new DataView(buffer).setInt16(40, 4, true)
  assert.throws(() => parseVolume(buffer))
  new DataView(buffer).setInt16(40, 3, true); new DataView(buffer).setInt16(42, 0, true)
  assert.throws(() => parseVolume(buffer))
})
test('NIfTI rejects undefined or singular spatial transforms', () => {
  const buffer = niftiFixture()
  new DataView(buffer).setInt16(254, 0, true)
  assert.throws(() => parseVolume(buffer), /defined spatial transform/)
  new DataView(buffer).setInt16(254, 1, true)
  new DataView(buffer).setFloat32(280, 0, true)
  assert.throws(() => parseVolume(buffer), /singular/)
})
