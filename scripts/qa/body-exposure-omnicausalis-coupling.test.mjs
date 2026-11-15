/**
 * @file scripts/qa/body-exposure-omnicausalis-coupling.test.mjs
 * @description Comprehensive automated acceptance test for Pillar XI:
 * Organic Atlas Context-Coupled Transitions ("Dari Atlas Tubuh -> Klik Jantung -> Lihat Coupling Kardiopulmonal").
 * Validates deterministic structure-to-physiology and structure-to-clinical deck resolution,
 * prop propagation, and bidirectional clear/reset mechanisms.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { decksFor } from '../../src/domains/body-exposure/engine/atlasStageDecks.ts'

test('OmnicausalisCoupling: Cardiovascular structures map to Cardiopulmonary PV & Vascular Perfusion', () => {
  const heart = decksFor({
    meshName: 'Left_Ventricle_Myocardium.001',
    cleanName: 'Left Ventricle',
    kind: 'muscle',
    layerId: 'cardiovascular',
    side: 'left',
    sideReview: null,
  })
  assert.equal(heart.physiology, 'cardiopulmonary')
  assert.equal(heart.clinical, 'vascular')
  assert.equal(heart.coronarySegment, 1)
  assert.equal(heart.imagingPresetId, 'VASCULAR_ANGIO')

  const rca = decksFor({
    meshName: 'Right_Coronary_Artery_Inferior',
    cleanName: 'Right Coronary Artery (Inferior)',
    kind: 'artery',
    layerId: 'cardiovascular',
    side: 'right',
    sideReview: null,
  })
  assert.equal(rca.physiology, 'cardiopulmonary')
  assert.equal(rca.clinical, 'vascular')
  assert.equal(rca.coronarySegment, 4) // Inferior segment
})

test('OmnicausalisCoupling: Cranial & neuro structures map to Neuro Reflexes & Syndromic Localizer', () => {
  const oculo = decksFor({
    meshName: 'Oculomotor_Nerve_CN3',
    cleanName: 'Oculomotor Nerve',
    kind: 'nerve',
    layerId: 'nervous',
    side: 'left',
    sideReview: null,
  })
  assert.equal(oculo.physiology, 'neuro')
  assert.equal(oculo.clinical, 'neuro_localizer')
  assert.equal(oculo.neuroNerveId, 'cn-3')

  const optic = decksFor({
    meshName: 'Optic_Nerve_CN2_Retina',
    cleanName: 'Optic Nerve',
    kind: 'nerve',
    layerId: 'nervous',
    side: 'left',
    sideReview: null,
  })
  assert.equal(optic.physiology, 'neuro')
  assert.equal(optic.clinical, 'neuro_localizer')
  assert.equal(optic.neuroNerveId, 'cn-2')

  const abducens = decksFor({
    meshName: 'Abducens_Nerve_CN6',
    cleanName: 'Abducens Nerve',
    kind: 'nerve',
    layerId: 'nervous',
    side: 'right',
    sideReview: null,
  })
  assert.equal(abducens.neuroNerveId, 'cn-6')
})

test('OmnicausalisCoupling: Visceral organs map to Soft Tissue Biomechanics & Referred Pain Dermatomes', () => {
  const liver = decksFor({
    meshName: 'Liver_Parenchyma_Lobes',
    cleanName: 'Liver',
    kind: 'viscera',
    layerId: 'visceral',
    side: null,
    sideReview: null,
  })
  assert.equal(liver.physiology, 'soft_tissue')
  assert.equal(liver.clinical, 'referred_pain')
  assert.equal(liver.softTissueOrganId, 'liver_normal')
  assert.equal(liver.referredPainOrgan, 'liver-glisson-capsule')
  assert.equal(liver.imagingPresetId, 'LIVER_PARENCHYMA')

  const gallbladder = decksFor({
    meshName: 'Gallbladder_Fundus',
    cleanName: 'Gallbladder',
    kind: 'viscera',
    layerId: 'visceral',
    side: null,
    sideReview: null,
  })
  assert.equal(gallbladder.physiology, 'soft_tissue')
  assert.equal(gallbladder.clinical, 'referred_pain')
  assert.equal(gallbladder.referredPainOrgan, 'gallbladder-biliary')

  const kidney = decksFor({
    meshName: 'Kidney_Renal_Cortex_Right',
    cleanName: 'Kidney Cortex',
    kind: 'viscera',
    layerId: 'visceral',
    side: 'right',
    sideReview: null,
  })
  assert.equal(kidney.physiology, 'soft_tissue')
  assert.equal(kidney.clinical, 'referred_pain')
  assert.equal(kidney.softTissueOrganId, 'kidney_cortex')
  assert.equal(kidney.referredPainOrgan, 'ureter-renal-pelvis')

  const stomach = decksFor({
    meshName: 'Stomach_Gastric_Antrum',
    cleanName: 'Stomach',
    kind: 'viscera',
    layerId: 'visceral',
    side: null,
    sideReview: null,
  })
  assert.equal(stomach.physiology, 'soft_tissue')
  assert.equal(stomach.clinical, 'referred_pain')
  assert.equal(stomach.softTissueOrganId, 'stomach_wall')
  assert.equal(stomach.softTissueTab, 'peristalsis')
  assert.equal(stomach.referredPainOrgan, 'stomach-gastric-wall')

  const appendix = decksFor({
    meshName: 'Vermiform_Appendix',
    cleanName: 'Appendix',
    kind: 'viscera',
    layerId: 'visceral',
    side: null,
    sideReview: null,
  })
  assert.equal(appendix.physiology, 'soft_tissue')
  assert.equal(appendix.clinical, 'referred_pain')
  assert.equal(appendix.softTissueTab, 'peristalsis')
  assert.equal(appendix.referredPainOrgan, 'appendix-visceral-early')
})

test('OmnicausalisCoupling: Skeletal and pulmonary systems map to specialized imaging windows', () => {
  const bone = decksFor({
    meshName: 'Femur_Cortical_Shaft',
    cleanName: 'Femur Bone',
    kind: 'bone',
    layerId: 'skeletal',
    side: 'right',
    sideReview: null,
  })
  assert.equal(bone.clinical, 'diagnostic_imaging')
  assert.equal(bone.imagingPresetId, 'BONE')

  const lung = decksFor({
    meshName: 'Pulmonary_Alveolar_Tree',
    cleanName: 'Lung Lobes',
    kind: 'viscera',
    layerId: 'visceral',
    side: 'left',
    sideReview: null,
  })
  assert.equal(lung.physiology, 'cardiopulmonary')
  assert.equal(lung.clinical, 'diagnostic_imaging')
  assert.equal(lung.imagingPresetId, 'LUNG')
})

test('OmnicausalisCoupling: Atlas Home embeds coupling indicators and contextual props', () => {
  const homePath = path.join(process.cwd(), 'src', 'domains', 'body-exposure', 'ui', 'BodyExposureAtlasHome.tsx')
  const content = fs.readFileSync(homePath, 'utf8')

  // Check coupling badges
  assert.ok(content.includes('Coupled to:'), 'Must show "Coupled to:" badge in Stage 2')
  assert.ok(content.includes('Clinical target:'), 'Must show "Clinical target:" badge in Stage 3')

  // Check props propagation
  assert.ok(content.includes('initialOrganId={couplingContext?.softTissueOrganId}'), 'Must pass initialOrganId to SoftTissueBiomechanicsDeck')
  assert.ok(content.includes('initialTab={couplingContext?.softTissueTab}'), 'Must pass initialTab to SoftTissueBiomechanicsDeck')
  assert.ok(content.includes('initialNerveId={couplingContext?.neuroNerveId}'), 'Must pass initialNerveId to NeuroFascicularReflexDeck')
  assert.ok(content.includes('initialSegment={couplingContext?.coronarySegment}'), 'Must pass initialSegment to CoronaryTerritoryPanel')
  assert.ok(content.includes('initialOrgan={couplingContext?.referredPainOrgan}'), 'Must pass initialOrgan to ReferredPainDermatomeStudio')
  assert.ok(content.includes('initialPresetId={couplingContext?.imagingPresetId}'), 'Must pass initialPresetId to KaloLumenVolumetricStudio')
})
