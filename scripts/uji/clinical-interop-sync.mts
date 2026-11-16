import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildClinicalFhirBundle,
  generateSoapSbarSummary,
} from '../../src/domains/clinical-operations/model/clinicalInterop.ts'

// 1. Fail closed when no vitals or STR are present: zero fabricated STR/risk/observations
{
  const bundle = buildClinicalFhirBundle({
    vitals: {},
    patient: null,
    account: null,
  })
  assert.equal(bundle.resourceType, 'Bundle')
  assert.equal(bundle.type, 'collection')
  // Only Patient entry when vitals are unrecorded (no Observation or empty Provenance)
  assert.equal(bundle.entry.filter((e) => e.resource.resourceType === 'Observation').length, 0, 'Empty vitals must not emit Observation entries')
  assert.equal(bundle.entry.length, 1, 'Only Patient entry expected when unrecorded')

  const emptySummary = generateSoapSbarSummary({
    vitals: {},
    patient: null,
    account: null,
  })
  assert.ok(emptySummary.soapText.includes('clinically_reviewed=false'))
  assert.ok(emptySummary.soapText.includes('Belum terverifikasi STR'), 'Must not claim verified STR when missing')
  assert.ok(emptySummary.soapText.includes('Belum dinilai / perlu evaluasi DPJP'), 'Must not claim low risk without evaluation')
  assert.ok(emptySummary.sbarText.includes('HR Belum diukur'))
}

// 2. Real recorded vitals & patient context export valid LOINC Observations & real SOAP/SBAR
{
  const bundle = buildClinicalFhirBundle({
    vitals: {
      restingHr: 64,
      spo2Pct: 98,
      systolic: 118,
      diastolic: 76,
      weightKg: 60,
      heightCm: 165,
      bodyTempC: 36.6,
      hrvMs: 52,
      sleepH: 7.4,
      measuredAt: '2026-11-16T05:30:00.000Z',
    },
    patient: {
      id: 'p1',
      name: 'Pasien Uji',
      mrn: 'MRN-2026-001',
      sex: 'P',
      dob: '1994-05-10',
      allergies: ['Penicillin'],
      chronicConditions: ['Asthma'],
    },
    account: {
      id: 'acc-doc-1',
      email: 'dokter@panaceamed.id',
      name: 'dr. Uji',
      role: 'dokter',
      loggedAt: '2026-11-16T05:00:00.000Z',
      str: '31.1.1.100.1.26.000111',
      strStatus: 'verified',
    },
  })
  const raw = JSON.stringify(bundle)
  assert.ok(bundle.entry.length >= 10, 'Bundle must include Patient, Observations, and Provenance')
  assert.ok(raw.includes('8867-4') || raw.includes('59408-5'), 'LOINC vital codes must be present')
  assert.ok(raw.includes('"gender":"female"'))

  const summary = generateSoapSbarSummary({
    vitals: { restingHr: 64, spo2Pct: 98, systolic: 118, diastolic: 76, weightKg: 60, heightCm: 165 },
    patient: {
      id: 'p1',
      name: 'Pasien Uji',
      mrn: 'MRN-2026-001',
      sex: 'P',
      allergies: ['Penicillin'],
      chronicConditions: ['Asthma'],
      riskFlags: ['penicillin-allergy'],
    },
    emrCount: 1,
  })
  assert.ok(summary.soapText.includes('64 bpm'))
  assert.ok(summary.soapText.includes('118/76 mmHg'))
  assert.ok(summary.soapText.includes('BMI 22.0 kg/m2'))
  assert.ok(summary.soapText.includes('Penicillin'))
}

// 3. Cross-route live sync listeners wired cleanly across ClinicalHub, ForYou, and UnifiedBodyWorkspace
{
  for (const path of [
    'src/pages/clinical/ClinicalHub.tsx',
    'src/pages/social/ForYouHub.tsx',
    'src/components/foryou/ForYouDailyStack.tsx',
    'src/pages/UnifiedBodyWorkspace.tsx',
  ]) {
    const src = readFileSync(path, 'utf8')
    assert.ok(src.includes('panacea:health-updated'), `${path} must listen for panacea:health-updated`)
    assert.ok(src.includes('panacea:body-character-updated'), `${path} must listen for panacea:body-character-updated`)
  }
}

console.log('clinical-interop-sync: 3/3 FHIR R4, SOAP/SBAR, and live cross-route sync contracts PASS.')
