import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MEDICAL_DEVICE_INTEGRATION_CATALOG,
  MEDICAL_DEVICE_OS_POLICY,
  canClaimMedicalDeviceSupport,
  getMedicalDeviceIntegrationProfile,
  listMedicalDeviceProfilesForStandard,
} from '../../src/lib/medicalDeviceIntegrationCatalog.ts'

test('medical-device catalog has unique stable ids and non-empty integration contracts', () => {
  const ids = MEDICAL_DEVICE_INTEGRATION_CATALOG.map((entry) => entry.id)
  assert.equal(new Set(ids).size, ids.length)

  for (const entry of MEDICAL_DEVICE_INTEGRATION_CATALOG) {
    assert.ok(entry.label.trim())
    assert.ok(entry.examples.length > 0)
    assert.ok(entry.dataShapes.length > 0)
    assert.ok(entry.preferredStandards.length + entry.fallbackTransports.length > 0)
    assert.ok(entry.analyzers.length > 0)
  }
})

test('industry catalog is fail-closed: taxonomy does not imply vendor support', () => {
  for (const entry of MEDICAL_DEVICE_INTEGRATION_CATALOG) {
    assert.equal(entry.dataDirection, 'inbound-read-only')
    assert.equal(canClaimMedicalDeviceSupport(entry), false)
  }

  assert.equal(MEDICAL_DEVICE_OS_POLICY.directTherapyControlEnabled, false)
  assert.equal(MEDICAL_DEVICE_OS_POLICY.vendorSupportMustBeAdapterValidated, true)
})

test('cath-lab multimodality systems can be represented without vendor overclaiming', () => {
  const physiology = getMedicalDeviceIntegrationProfile('cath-lab-coronary-physiology')
  const intravascular = getMedicalDeviceIntegrationProfile('ivus-oct-intravascular-imaging')

  assert.ok(physiology)
  assert.ok(intravascular)
  assert.ok(physiology.analyzers.includes('coronary-physiology'))
  assert.ok(intravascular.dataShapes.includes('image'))
  assert.equal(canClaimMedicalDeviceSupport(physiology), false)
  assert.equal(canClaimMedicalDeviceSupport(intravascular), false)
})

test('DICOM, FHIR and IHE device standards map to multiple device families', () => {
  assert.ok(listMedicalDeviceProfilesForStandard('dicomweb').length >= 8)
  assert.ok(listMedicalDeviceProfilesForStandard('fhir-r4').length >= 15)
  assert.ok(listMedicalDeviceProfilesForStandard('ihe-dev-dec').length >= 5)
  assert.ok(listMedicalDeviceProfilesForStandard('ihe-dev-idco').some((entry) => entry.id === 'implantable-cardiac-device'))
  assert.ok(listMedicalDeviceProfilesForStandard('ihe-dev-ipec').some((entry) => entry.id === 'infusion-pump'))
})

test('high-risk therapy and surgical families remain read-only by default', () => {
  for (const id of ['infusion-pump', 'dialysis-crrt', 'ecmo-extracorporeal-support', 'surgical-navigation-robotics']) {
    const profile = getMedicalDeviceIntegrationProfile(id)
    assert.ok(profile)
    assert.equal(profile.dataDirection, 'inbound-read-only')
  }
})
