import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { parseFetalParcelDataset } from '../../src/domains/body-exposure/engine/fetalParcelInspection.ts'
import { parseFetalMriContext } from '../../src/domains/body-exposure/engine/fetalMriContext.ts'

const base = new URL('../../public/bodyexposure/dataset-inspection/fetal-parcels/', import.meta.url)
const segmentationBytes = await readFile(new URL('manifest.json', base))
const dataset = parseFetalParcelDataset(JSON.parse(segmentationBytes))
const mri = JSON.parse(await readFile(new URL('mri/manifest.json', base), 'utf8'))
const audit = JSON.parse(await readFile(new URL('../../bodyexposure/qa_reports/fetal_parcels_audit.json', import.meta.url), 'utf8'))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')

test('MRI images remain attached to the same pinned source mask and numeric dataset', () => {
  assert.equal(parseFetalMriContext(mri, dataset), mri)
  assert.equal(mri.segmentation_manifest_sha256, hash(segmentationBytes))
  assert.equal(mri.source_sha256.regions, audit.source_sha256['reo-fetal-t2w-body-atlas-mask-lungs_multi-10.nii.gz'])
  assert.deepEqual(mri.mask_affine_ras_mm, audit.affine_ras)
  mri.affine_ras_mm.forEach((row,i) => row.forEach((n,j) => assert.ok(Math.abs(n-audit.affine_ras[i][j]) <= 1e-6)))
  assert.deepEqual(mri.display_intensity_window, [29,4712])
  assert.equal(mri.regions.flatMap(r => r.images).length, 27)
  for (const row of mri.regions) {
    const ras = mri.affine_ras_mm.slice(0,3).map(a => a[3] + a.slice(0,3).reduce((sum,n,i) => sum+n*row.representative_voxel_ijk[i], 0))
    ras.forEach((n,i) => assert.ok(Math.abs(n-row.point_ras_mm[i]) < 1e-9))
  }
})

test('all 27 native-grid PNGs have their pinned bytes, dimensions and non-resampled RGB encoding', async () => {
  let total=0
  for (const im of mri.regions.flatMap(r => r.images)) {
    const bytes = await readFile(new URL(`mri/${im.asset}`, base))
    assert.equal(bytes.length, im.bytes)
    assert.equal(hash(bytes), im.sha256)
    assert.deepEqual([...bytes.subarray(0,8)], [137,80,78,71,13,10,26,10])
    assert.equal(bytes.subarray(12,16).toString(), 'IHDR')
    assert.equal(bytes.readUInt32BE(16), im.width)
    assert.equal(bytes.readUInt32BE(20), im.height)
    assert.equal(bytes[24], 8)
    assert.equal(bytes[25], 2)
    total += bytes.length
  }
  assert.ok(total < 400_000, `lazy-loadable 27-image payload: ${total} bytes`)
})

for (const [name, mutate] of [
  ['clinical promotion', d => { d.clinical_validation='reviewed' }],
  ['guessed anatomy', d => { d.anatomical_identity='named_lobes' }],
  ['changed MRI source', d => { d.source_sha256.t2='0'.repeat(64) }],
  ['mismatched voxel count', d => { d.regions[8].voxels++ }],
  ['unsafe image URL', d => { d.regions[0].images[0].asset='../other.png' }],
  ['duplicate source plane', d => { d.regions[0].images[1].axis=0 }],
  ['rescaled image', d => { d.regions[0].images[0].width++ }],
  ['reversed column orientation', d => { d.regions[0].images[0].pixel_grid.column_axis=2 }],
  ['out-of-crop point', d => { d.regions[0].representative_voxel_ijk[0]=0 }],
  ['invalid display window', d => { d.display_intensity_window=[99,1] }],
  ['unregistered mask', d => { d.mask_affine_ras_mm[0][3]+=0.1 }],
  ['incorrect world point', d => { d.regions[0].point_ras_mm[0]+=1 }],
]) test(`MRI context rejects ${name}`, () => {
  const bad=structuredClone(mri); mutate(bad)
  assert.throws(() => parseFetalMriContext(bad,dataset))
})
