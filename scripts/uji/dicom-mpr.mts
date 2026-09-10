import assert from 'node:assert/strict'
import type { Citra } from '../../src/lib/dicom'
import { ambilIrisanMpr, buatVolumeMpr, jendelakanMpr, labelBidangMpr } from '../../src/lib/dicomMpr'

function slice(index: number, overrides: Partial<Citra> = {}): Citra {
  return {
    baris: 2,
    kolom: 3,
    bingkai: 1,
    modalitas: 'MR',
    nilai: new Float32Array([
      index * 10 + 0,
      index * 10 + 1,
      index * 10 + 2,
      index * 10 + 3,
      index * 10 + 4,
      index * 10 + 5,
    ]),
    minimum: index * 10,
    maksimum: index * 10 + 5,
    terbalik: false,
    jarakPiksel: [2, 1],
    tebalIrisMm: 5,
    nomorIris: index + 1,
    posisiZ: index * 5,
    deskripsiSeri: 'Axial PD FS',
    ...overrides,
  }
}

const insufficient = buatVolumeMpr([slice(0), slice(1)])
assert.equal(insufficient.ok, false, 'fewer than three images must not become a 3-D stack')

const mixedModality = buatVolumeMpr([slice(0), slice(1, { modalitas: 'CT' }), slice(2)])
assert.equal(mixedModality.ok, false, 'mixed modalities must fail closed')

const mixedDescription = buatVolumeMpr([
  slice(0),
  slice(1, { deskripsiSeri: 'Sagittal T1' }),
  slice(2),
])
assert.equal(mixedDescription.ok, false, 'obvious mixed series without exact UID must fail closed')

const exactSeriesAllowsDescriptionVariation = buatVolumeMpr([
  slice(0, { seriesInstanceUid: '1.2.3', deskripsiSeri: 'Axial PD FS' }),
  slice(1, { seriesInstanceUid: '1.2.3', deskripsiSeri: 'AX PD FS' }),
  slice(2, { seriesInstanceUid: '1.2.3', deskripsiSeri: 'Axial PD FS' }),
])
assert.equal(exactSeriesAllowsDescriptionVariation.ok, true, 'exact SeriesInstanceUID should outrank display-description variation')

const mixedSeriesUid = buatVolumeMpr([
  slice(0, { seriesInstanceUid: '1.2.3' }),
  slice(1, { seriesInstanceUid: '1.2.4' }),
  slice(2, { seriesInstanceUid: '1.2.3' }),
])
assert.equal(mixedSeriesUid.ok, false, 'different SeriesInstanceUID values must never form one volume')

const partialSeriesUid = buatVolumeMpr([
  slice(0, { seriesInstanceUid: '1.2.3' }),
  slice(1),
  slice(2, { seriesInstanceUid: '1.2.3' }),
])
assert.equal(partialSeriesUid.ok, false, 'partial SeriesInstanceUID metadata must fail closed')

const mixedFrame = buatVolumeMpr([
  slice(0, { frameOfReferenceUid: '9.1' }),
  slice(1, { frameOfReferenceUid: '9.2' }),
  slice(2, { frameOfReferenceUid: '9.1' }),
])
assert.equal(mixedFrame.ok, false, 'different frames of reference must not be combined')

const partialPosition = buatVolumeMpr([slice(0), slice(1, { posisiZ: undefined }), slice(2)])
assert.equal(partialPosition.ok, false, 'partial spatial coordinates must not be guessed')

const irregular = buatVolumeMpr([slice(0), slice(1), slice(2, { posisiZ: 30 })])
assert.equal(irregular.ok, false, 'irregular spacing must not be stretched into a continuous stack')

const spacingMismatch = buatVolumeMpr([slice(0), slice(1, { jarakPiksel: [2, 1.5] }), slice(2)])
assert.equal(spacingMismatch.ok, false, 'material pixel-spacing changes must fail closed')

const axialOrientation: Citra['orientasiPasien'] = [1, 0, 0, 0, 1, 0]
const orientedResult = buatVolumeMpr([
  slice(0, { posisiPasien: [0, 0, 0], orientasiPasien: axialOrientation }),
  slice(1, { posisiPasien: [0, 0, 5], orientasiPasien: axialOrientation }),
  slice(2, { posisiPasien: [0, 0, 10], orientasiPasien: axialOrientation }),
])
assert.equal(orientedResult.ok, true, 'consistent patient position/orientation should define slice spacing')
if (orientedResult.ok) assert.equal(orientedResult.volume.jarakIrisMm, 5)

const changedOrientation = buatVolumeMpr([
  slice(0, { posisiPasien: [0, 0, 0], orientasiPasien: axialOrientation }),
  slice(1, { posisiPasien: [0, 0, 5], orientasiPasien: [0, 1, 0, 1, 0, 0] }),
  slice(2, { posisiPasien: [0, 0, 10], orientasiPasien: axialOrientation }),
])
assert.equal(changedOrientation.ok, false, 'orientation changes must not be flattened into a straight MPR')

const result = buatVolumeMpr([slice(0), slice(1), slice(2)])
assert.equal(result.ok, true, 'compatible series must create a local volume')
if (!result.ok) throw new Error(result.alasan)

assert.equal(result.volume.kedalaman, 3)
assert.equal(result.volume.baris, 2)
assert.equal(result.volume.kolom, 3)
assert.equal(result.volume.jarakIrisMm, 5)
assert.equal(result.volume.jarakBarisMm, 2)
assert.equal(result.volume.jarakKolomMm, 1)

const source = ambilIrisanMpr(result.volume, 'source', { x: 1, y: 1, z: 1 })
assert.deepEqual([...source.nilai], [10, 11, 12, 13, 14, 15])

const coronalLike = ambilIrisanMpr(result.volume, 'cross-row', { x: 1, y: 1, z: 1 })
assert.equal(coronalLike.baris, 3)
assert.equal(coronalLike.kolom, 3)
assert.deepEqual([...coronalLike.nilai], [3, 4, 5, 13, 14, 15, 23, 24, 25])

const sagittalLike = ambilIrisanMpr(result.volume, 'cross-column', { x: 2, y: 0, z: 1 })
assert.equal(sagittalLike.baris, 3)
assert.equal(sagittalLike.kolom, 2)
assert.deepEqual([...sagittalLike.nilai], [2, 5, 12, 15, 22, 25])

const windowed = jendelakanMpr(new Float32Array([-100, 0, 100]), 0, 200)
assert.equal(windowed[0], 0)
assert.ok(windowed[1] >= 127 && windowed[1] <= 129)
assert.equal(windowed[2], 255)

const inverted = jendelakanMpr(new Float32Array([-100, 100]), 0, 200, true)
assert.equal(inverted[0], 255)
assert.equal(inverted[1], 0)

assert.deepEqual(labelBidangMpr('Axial PD FS'), {
  source: 'Axial',
  'cross-row': 'Coronal-like',
  'cross-column': 'Sagittal-like',
})
assert.deepEqual(labelBidangMpr('anything', axialOrientation), {
  source: 'Axial',
  'cross-row': 'Coronal-like',
  'cross-column': 'Sagittal-like',
})
assert.deepEqual(labelBidangMpr('unknown localizer'), {
  source: 'Source plane',
  'cross-row': 'Orthogonal A',
  'cross-column': 'Orthogonal B',
})

console.log('dicom-mpr: compatible stacks reconstruct; identity/orientation/spacing conflicts fail closed')
