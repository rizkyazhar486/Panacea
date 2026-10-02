import assert from 'node:assert/strict'
import {
  arahBidangDicom,
  arahPasienDominan,
  formatPasanganArah,
  pasanganArahPasien,
} from '../../src/lib/dicomPatientOrientation'

assert.equal(arahPasienDominan([1, 0, 0]), 'L')
assert.equal(arahPasienDominan([-1, 0, 0]), 'R')
assert.equal(arahPasienDominan([0, 1, 0]), 'P')
assert.equal(arahPasienDominan([0, -1, 0]), 'A')
assert.equal(arahPasienDominan([0, 0, 1]), 'S')
assert.equal(arahPasienDominan([0, 0, -1]), 'I')
assert.equal(arahPasienDominan([0, 0, 0]), undefined)

assert.deepEqual(pasanganArahPasien([1, 0, 0]), { negative: 'R', positive: 'L' })
assert.equal(formatPasanganArah({ negative: 'R', positive: 'L' }), 'R → L')

const axial = arahBidangDicom([1, 0, 0, 0, 1, 0])
assert.ok(axial)
assert.deepEqual(axial.source.horizontal, { negative: 'R', positive: 'L' })
assert.deepEqual(axial.source.vertical, { negative: 'A', positive: 'P' })
assert.deepEqual(axial.crossRow.vertical, { negative: 'I', positive: 'S' })
assert.deepEqual(axial.crossColumn.horizontal, { negative: 'A', positive: 'P' })
assert.deepEqual(axial.normal, [0, 0, 1])

const sagittal = arahBidangDicom([0, 1, 0, 0, 0, 1])
assert.ok(sagittal)
assert.deepEqual(sagittal.source.horizontal, { negative: 'A', positive: 'P' })
assert.deepEqual(sagittal.source.vertical, { negative: 'I', positive: 'S' })
assert.deepEqual(sagittal.normal, [1, 0, 0])

assert.equal(
  arahBidangDicom([1, 0, 0, 0.5, 0.5, 0]),
  undefined,
  'strongly non-orthogonal orientation metadata must fail closed',
)

assert.equal(arahBidangDicom(undefined), undefined)

console.log('dicom-patient-orientation: valid patient directions label safely; malformed metadata fails closed')
