import test from 'node:test'
import assert from 'node:assert/strict'
import { correlateImagingPlane } from '../../src/domains/body-exposure/engine/imagingPlaneEngine.ts'

test('BX-6 Golden Case: Axial plane with positive coordinate intersects cortex and ventricles', () => {
  const res = correlateImagingPlane('axial', 10)
  assert.equal(res.plane, 'axial')
  assert.ok(res.intersectedStructures.includes('Cortex'))
  assert.equal(res.truthClass, 'reference')
})

test('BX-6 Negative/Boundary Case: Sagittal plane returns midline reference structures', () => {
  const res = correlateImagingPlane('sagittal', 0)
  assert.equal(res.plane, 'sagittal')
  assert.ok(res.intersectedStructures.includes('Midline Structures'))
})
