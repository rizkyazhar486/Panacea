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
assert.equal(groups.length, 2, 'obviously different MRI descriptions should not be mixed when UID is unavailable')

const pd = groups.find((group) => group.label === 'Axial PD FS')
assert.ok(pd)
assert.equal(pd.identity, 'fallback-signature')
assert.equal(pd.slices.length, 3)
assert.deepEqual(pd.slices.map((item) => item.citra.posisiZ), [0, 3, 6])
assert.equal(pd.linkedPlanesAvailable, true)

const t1 = groups.find((group) => group.label === 'Sagittal T1')
assert.ok(t1)
assert.equal(t1.slices.length, 3)
assert.equal(t1.linkedPlanesAvailable, true)

const exactUid = kelompokkanDicomUntukTampilan([
  { nama: 'uid-a.dcm', citra: citra(0, 'Display label A', { studyInstanceUid: '1.2.10', seriesInstanceUid: '1.2.10.1' }) },
  { nama: 'uid-b.dcm', citra: citra(1, 'Display label B', { studyInstanceUid: '1.2.10', seriesInstanceUid: '1.2.10.1' }) },
  { nama: 'uid-c.dcm', citra: citra(2, 'Display label C', { studyInstanceUid: '1.2.10', seriesInstanceUid: '1.2.10.1' }) },
])
assert.equal(exactUid.length, 1, 'matching SeriesInstanceUID must outrank description wording')
assert.equal(exactUid[0].identity, 'dicom-series-uid')
assert.equal(exactUid[0].seriesInstanceUid, '1.2.10.1')
assert.equal(exactUid[0].studyInstanceUid, '1.2.10')
assert.equal(exactUid[0].linkedPlanesAvailable, true)

const differentUid = kelompokkanDicomUntukTampilan([
  { nama: 'uid-a.dcm', citra: citra(0, 'Same label', { studyInstanceUid: '1.2.10', seriesInstanceUid: '1.2.10.1' }) },
  { nama: 'uid-b.dcm', citra: citra(1, 'Same label', { studyInstanceUid: '1.2.10', seriesInstanceUid: '1.2.10.2' }) },
])
assert.equal(differentUid.length, 2, 'different SeriesInstanceUID values must remain separate even when descriptions match')

const sameSeriesDifferentStudy = kelompokkanDicomUntukTampilan([
  { nama: 'study-a.dcm', citra: citra(0, 'Same label', { studyInstanceUid: '1.2.20', seriesInstanceUid: '1.2.shared' }) },
  { nama: 'study-b.dcm', citra: citra(1, 'Same label', { studyInstanceUid: '1.2.21', seriesInstanceUid: '1.2.shared' }) },
])
assert.equal(sameSeriesDifferentStudy.length, 2, 'study boundary must remain explicit')

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

console.log('dicom-series: exact UID groups are preferred; fallback grouping stays conservative')
