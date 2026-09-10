import assert from 'node:assert/strict'
import type { Citra } from '../../src/lib/dicom'
import { kelompokkanDicomUntukTampilan } from '../../src/lib/dicomSeries'

function citra(index: number, description: string, overrides: Partial<Citra> = {}): Citra {
  return {
    baris: 2,
    kolom: 2,
    bingkai: 1,
    modalitas: 'MR',
    nilai: new Float32Array([index, index + 1, index + 2, index + 3]),
    minimum: index,
    maksimum: index + 3,
    terbalik: false,
    jarakPiksel: [1, 1],
    tebalIrisMm: 3,
    nomorIris: index + 1,
    posisiZ: index * 3,
    deskripsiSeri: description,
    ...overrides,
  }
}

const input = [
  { nama: 'pd-3.dcm', citra: citra(2, 'Axial PD FS') },
  { nama: 't1-1.dcm', citra: citra(0, 'Sagittal T1') },
  { nama: 'pd-1.dcm', citra: citra(0, 'Axial PD FS') },
  { nama: 'pd-2.dcm', citra: citra(1, 'Axial PD FS') },
  { nama: 't1-2.dcm', citra: citra(1, 'Sagittal T1') },
  { nama: 't1-3.dcm', citra: citra(2, 'Sagittal T1') },
]

const groups = kelompokkanDicomUntukTampilan(input)
assert.equal(groups.length, 2, 'obviously different MRI descriptions should not be mixed')

const pd = groups.find((group) => group.label === 'Axial PD FS')
assert.ok(pd)
assert.equal(pd.slices.length, 3)
assert.deepEqual(pd.slices.map((item) => item.citra.posisiZ), [0, 3, 6])
assert.equal(pd.linkedPlanesAvailable, true)

const t1 = groups.find((group) => group.label === 'Sagittal T1')
assert.ok(t1)
assert.equal(t1.slices.length, 3)
assert.equal(t1.linkedPlanesAvailable, true)

const matrixMismatch = kelompokkanDicomUntukTampilan([
  { nama: 'a.dcm', citra: citra(0, 'Axial PD FS') },
  { nama: 'b.dcm', citra: citra(1, 'Axial PD FS', { baris: 4 }) },
])
assert.equal(matrixMismatch.length, 2, 'different matrices must be separated before reconstruction')

const modalityMismatch = kelompokkanDicomUntukTampilan([
  { nama: 'mr.dcm', citra: citra(0, 'Localizer') },
  { nama: 'ct.dcm', citra: citra(1, 'Localizer', { modalitas: 'CT' }) },
])
assert.equal(modalityMismatch.length, 2, 'different modalities must never share a display group')

console.log('dicom-series: obvious acquisitions stay separated and each group is independently validated')
