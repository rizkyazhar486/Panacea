import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const lab = readFileSync(new URL('../../src/pages/bodyhub/BiomedicalEngineLab.tsx', import.meta.url), 'utf8')
const body = readFileSync(new URL('../../src/components/Body3D.tsx', import.meta.url), 'utf8')

// The imaging surface must stay reachable from the already-mounted Biomedical Engine.
assert.match(lab, /type View = 'engine' \| 'imaging'/)
assert.match(lab, /data-biomedical-imaging-lab="v1"/)
assert.match(lab, /<Body3D/)

// It must use the shipped source-backed Body3D stack rather than fabricated geometry.
for (const token of ['ANATOMY_LAYERS', 'CT_WINDOWS', 'slicePlane', 'slicePos', 'unfold', 'dissect']) {
  assert.ok(lab.includes(token), `imaging lab lost ${token}`)
}
for (const mode of ['anatomy', 'xray', 'ct', 'mriT1', 'mriT2']) {
  assert.ok(lab.includes(`'${mode}'`), `imaging lab lost ${mode} mode`)
}
for (const plane of ['axial', 'coronal', 'sagittal']) {
  assert.ok(lab.includes(`'${plane}'`), `imaging lab lost ${plane} section plane`)
}

// Physical-exam focus must bind exact shipped muscle-node identities, not a substitute shape.
for (const name of [
  'Supraspinatus muscle.l', 'Supraspinatus muscle.r',
  'Infraspinatus muscle.l', 'Infraspinatus muscle.r',
  'Teres minor muscle.l', 'Teres minor muscle.r',
]) assert.ok(lab.includes(name), `missing exact source-node exam target: ${name}`)

// Body3D itself is the source-backed implementation and must retain meshopt + source provenance handling.
assert.match(body, /MeshoptDecoder/)
assert.match(body, /public\/anatomy\/\*\.glb/)
assert.match(body, /Z-Anatomy/)
assert.match(body, /CC BY-SA 4\.0/)
assert.match(body, /restoreOriginalNames/)

// Fail closed: these capabilities require real measured volume data and may not be implied by a mesh atlas.
for (const phrase of [
  'NOT PATIENT DICOM',
  'Patient DICOM/NIfTI volume ingestion',
  'HU-threshold segmentation',
  'region growing',
  'STL export',
  'MPR/DRR from real voxels',
  'patient-specific measurements',
]) assert.ok(lab.includes(phrase), `missing imaging boundary: ${phrase}`)

assert.match(lab, /does not diagnose a tear/i)
assert.match(lab, /does not.*operative navigation/i)
assert.match(lab, /reference anatomy is a patient's anatomy/i)

console.log('biomedical-imaging-reference: source-backed 3D + section/exam surface remains fail-closed for patient imaging')
