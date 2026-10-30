import test from 'node:test'
import assert from 'node:assert/strict'
import { correlateImagingPlane } from '../../src/domains/body-exposure/engine/imagingPlaneEngine.ts'

const A = { name: 'A', min: [-1, -1, 0], max: [1, 1, 2] }
const B = { name: 'B', min: [-1, -1, 2], max: [1, 1, 4] }

test('axial plane at z=1 crosses only A', () => {
  const r = correlateImagingPlane('axial', 1, [A, B])
  assert.deepEqual(r.intersectedStructures, ['A']); assert.equal(r.truthClass, 'reference'); assert.match(r.label, /not patient imaging/)
})
test('boundary: z=2 touches both boxes (closed intervals); z just above/below the shared face selects one', () => {
  assert.deepEqual(correlateImagingPlane('axial', 2, [A, B]).intersectedStructures, ['A', 'B'])
  assert.deepEqual(correlateImagingPlane('axial', 2 + 1e-9, [A, B]).intersectedStructures, ['B'])
  assert.deepEqual(correlateImagingPlane('axial', 2 - 1e-9, [A, B]).intersectedStructures, ['A'])
})
test('sagittal and coronal use x and y', () => {
  const C = { name: 'C', min: [0.5, -3, 0], max: [2, -2, 1] }
  assert.deepEqual(correlateImagingPlane('sagittal', 1.5, [A, C]).intersectedStructures, ['C'])
  assert.deepEqual(correlateImagingPlane('coronal', -2.5, [A, C]).intersectedStructures, ['C'])
})
test('a plane crossing nothing makes no claim (empty list, ok)', () => {
  const r = correlateImagingPlane('axial', 99, [A, B]); assert.equal(r.ok, true); assert.deepEqual(r.intersectedStructures, [])
})
test('rejects NaN/Infinity coordinate, unknown plane and malformed or inverted boxes without a guessed answer', () => {
  assert.deepEqual(correlateImagingPlane('axial', NaN, [A]), { ok: false, reason: 'invalid_coordinate' })
  assert.deepEqual(correlateImagingPlane('axial', Infinity, [A]), { ok: false, reason: 'invalid_coordinate' })
  assert.deepEqual(correlateImagingPlane('oblique', 0, [A]), { ok: false, reason: 'invalid_plane' })
  assert.deepEqual(correlateImagingPlane('axial', 1, [{ name: 'X', min: [0, 0, 3], max: [1, 1, 1] }]), { ok: false, reason: 'invalid_structure' })
  assert.deepEqual(correlateImagingPlane('axial', 1, [{ name: '', min: [0, 0, 0], max: [1, 1, 1] }]), { ok: false, reason: 'invalid_structure' })
  assert.deepEqual(correlateImagingPlane('axial', 1, [{ name: 'Y', min: [0, 0, NaN], max: [1, 1, 1] }]), { ok: false, reason: 'invalid_structure' })
})
