/**
 * @file body-exposure-holistic-clarity.test.mjs
 * @description Verification for Body Exposure holistic clarity, resource transparency, and cross-module discovery.
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

test('Holistic Clarity: Fetal Parcel Inspector features breadcrumbs, provenance badges & test invariants', () => {
  const filePath = path.join(process.cwd(), 'src', 'pages', 'bodyhub', 'FetalParcelInspector.tsx')
  assert.ok(fs.existsSync(filePath), 'FetalParcelInspector.tsx must exist')
  const content = fs.readFileSync(filePath, 'utf8')

  // Breadcrumbs
  assert.ok(content.includes('to="/body-exposure"'), 'Must link to Whole-Body Atlas Home')
  assert.ok(content.includes('to="/body-exposure/canonical"'), 'Must link to Adult Canonical Atlas')

  // Provenance & Scientific Truth Badges
  assert.ok(content.includes('21–38 WEEKS GA POPULATION AVERAGE'), 'Must display gestational age range')
  assert.ok(content.includes('KCL T2-WEIGHTED MRI (3D NUMERIC VOXELS)'), 'Must identify KCL MRI source')
  assert.ok(content.includes('TRUTH CLASS: ATLAS_REFERENCE_LABEL'), 'Must display ATLAS_REFERENCE_LABEL truth class')
  assert.ok(content.includes('CLINICAL REVIEW PENDING'), 'Must display clinical review pending boundary')

  // Invariants required by Playwright test qa/fetal-rejected-geometry.mjs
  assert.ok(content.includes('const controls = new OrbitControls(camera, renderer.domElement)'), 'Must retain camera controls signature')
  assert.ok(content.includes('const scene = new THREE.Scene()'), 'Must retain scene initialization signature')
  assert.ok(content.includes('Focus selected region'), 'Must retain focus region button')
  assert.ok(content.includes('className="fpi-canvas"'), 'Must retain fpi-canvas class')
  assert.ok(content.includes('className="fpi-controls"'), 'Must retain fpi-controls class')
})

test('Holistic Clarity: Volumetric Studio clearly presents diagnostic MPR and HU windows', () => {
  const filePath = path.join(process.cwd(), 'src', 'domains', 'body-exposure', 'ui', 'KaloLumenVolumetricStudio.tsx')
  assert.ok(fs.existsSync(filePath), 'KaloLumenVolumetricStudio.tsx must exist')
  const content = fs.readFileSync(filePath, 'utf8')

  // Clear Title & Explanations
  assert.ok(content.includes('Diagnostic Imaging · 3D MPR Studio'), 'Must display Diagnostic Imaging 3D MPR badge')
  assert.ok(content.includes('Diagnostic Imaging &amp; Volumetric CT/MRI MPR Studio'), 'Must display unambiguous title')
  assert.ok(content.includes('Hounsfield Unit (HU) attenuation'), 'Must describe Hounsfield Unit attenuation')
  assert.ok(content.includes('DiagnosticImagingVolumetricStudio'), 'Must export DiagnosticImagingVolumetricStudio alias')

  // Domain public API export
  const indexPath = path.join(process.cwd(), 'src', 'domains', 'body-exposure', 'index.ts')
  const indexContent = fs.readFileSync(indexPath, 'utf8')
  assert.ok(indexContent.includes('DiagnosticImagingVolumetricStudio'), 'Must export DiagnosticImagingVolumetricStudio in index.ts')
})

test('Holistic Clarity: Atlas Home WideStage exposes quick-links to canonical atlas, fetal dataset & radiology MPR', () => {
  const filePath = path.join(process.cwd(), 'src', 'domains', 'body-exposure', 'ui', 'atlas-stage', 'StageFrame.tsx')
  assert.ok(fs.existsSync(filePath), 'StageFrame.tsx must exist')
  const content = fs.readFileSync(filePath, 'utf8')

  assert.ok(content.includes('to="/body-exposure/canonical"'), 'WideStage must link to canonical 3D')
  assert.ok(content.includes('to="/body-exposure/fetal-dataset"'), 'WideStage must link to fetal dataset')
  assert.ok(content.includes('to="/radiology"'), 'WideStage must link to radiology MPR')
})

test('Holistic Clarity: Radiology workspace links to Atlas Home and Body Explorer without broken hash links', () => {
  const filePath = path.join(process.cwd(), 'src', 'pages', 'bodyhub', 'Radiology.tsx')
  assert.ok(fs.existsSync(filePath), 'Radiology.tsx must exist')
  const content = fs.readFileSync(filePath, 'utf8')

  assert.ok(!content.includes('href="#/body-explorer"'), 'Obsolete hash link to body explorer must be removed')
  assert.ok(content.includes('to="/body-exposure"'), 'Radiology must link to /body-exposure')
  assert.ok(content.includes('to="/body-explorer"'), 'Radiology must link to /body-explorer')
})

test('Holistic Clarity: Atomic Systems sandbox includes navigation back to Whole-Body Atlas', () => {
  const filePath = path.join(process.cwd(), 'src', 'pages', 'bodyhub', 'AtomicSystemsLab.tsx')
  assert.ok(fs.existsSync(filePath), 'AtomicSystemsLab.tsx must exist')
  const content = fs.readFileSync(filePath, 'utf8')

  assert.ok(content.includes('to="/body-exposure"'), 'Atomic Systems must link to /body-exposure')
})
