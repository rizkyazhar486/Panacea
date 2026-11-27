/**
 * @file clinical-interop-export.mts
 * @description Unit & contract test verifying:
 *  1. HL7 FHIR R4 Bundle generation from clinical vitals & patient context.
 *  2. Bidirectional roundtrip: parseFhirBundle reads back what buildClinicalFhirBundle exports.
 *  3. SOAP / SBAR clinical summary formatting & clinical boundary enforcement.
 *  4. 4-Zone SuperPage Navigation (Your Body, Clinical, For You, Open 3D).
 *  5. Cloudflare Pages & GitHub Pages static routing artifacts (_redirects & 404.html).
 */

import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { buildClinicalFhirBundle, generateSoapSbarSummary } from '../../src/domains/clinical-operations/model/clinicalInterop.ts'
import { keJson } from '../../src/lib/fhir.ts'
import { parseFhirBundle } from '../../src/lib/healthImport.ts'
import type { Patient, Account } from '../../src/lib/types.ts'
import type { Vitals } from '../../src/lib/healthVitals.ts'

// 1. FHIR R4 Bundle Generation
const dummyPatient: Patient = {
  id: 'patient-test-001',
  name: 'Budi Santoso',
  sex: 'L',
  dob: '1985-05-20',
  mrn: 'MRN-12345',
  heightCm: 175,
  weightKg: 72,
  allergies: ['Penicillin'],
  chronicConditions: ['Hipertensi Tahap 1'],
  riskFlags: ['chronic'],
  avatarColor: '#00bf63',
}

const dummyAccount: Account = {
  id: 'acc-dokter-001',
  email: 'dokter@example.invalid',
  name: 'dr. Rizky Muhammad, Sp.PD',
  role: 'dokter',
  str: '31.1.1.100.1.23.999888',
}

const dummyVitals: Vitals = {
  weightKg: 72,
  heightCm: 175,
  systolic: 124,
  diastolic: 82,
  heartRate: 68,
  restingHr: 65,
  hrvMs: 48,
  spo2Pct: 98,
  respRate: 16,
  bodyTempC: 36.6,
  bmi: 23.5,
  steps: 8420,
}

const bundle = buildClinicalFhirBundle({
  vitals: dummyVitals,
  patient: dummyPatient,
  account: dummyAccount,
})

assert.equal(bundle.resourceType, 'Bundle', 'Must be a FHIR Bundle')
assert.equal(bundle.type, 'collection', 'Must be a collection bundle')
assert.ok(bundle.entry.length >= 8, 'Bundle must contain patient and multiple observations')

// Verify Patient resource
const patientEntry = bundle.entry.find((e) => e.resource.resourceType === 'Patient')
assert.ok(patientEntry, 'Bundle must contain a Patient entry')
assert.equal((patientEntry.resource as any).name?.[0]?.text, 'Budi Santoso')
assert.equal((patientEntry.resource as any).gender, 'male')

// 2. Bidirectional Roundtrip
const json = keJson(bundle)
const parsed = parseFhirBundle(json)
assert.equal(parsed.source, 'FHIR R4', 'Parsed source must be FHIR R4')
assert.equal(parsed.heartRate, 68, 'Heart rate must be preserved')
assert.equal(parsed.systolic, 124, 'Systolic BP must be preserved')
assert.equal(parsed.diastolic, 82, 'Diastolic BP must be preserved')
assert.equal(parsed.spo2Pct, 98, 'SpO2 must be preserved')
assert.equal(parsed.bodyTempC, 36.6, 'Body temp must be preserved')
assert.equal(parsed.steps, 8420, 'Steps must be preserved')
assert.equal(parsed.hrvMs, 48, 'HRV RMSSD must be preserved')

// 3. SOAP & SBAR Summary Formatting
const summary = generateSoapSbarSummary({
  patient: dummyPatient,
  vitals: dummyVitals,
  account: dummyAccount,
  primaryDiagnosis: 'Hipertensi Primer Terkontrol',
})

assert.ok(summary.soapText.includes('Budi Santoso'), 'SOAP must mention patient name')
assert.ok(summary.soapText.includes('MRN-12345'), 'SOAP must mention MRN')
assert.ok(summary.soapText.includes('dr. Rizky Muhammad, Sp.PD'), 'SOAP must mention doctor')
assert.ok(summary.soapText.includes('124/82 mmHg'), 'SOAP must mention BP')
assert.ok(summary.soapText.includes('Penicillin'), 'SOAP must mention allergies')
assert.ok(summary.soapText.includes('clinically_reviewed=false'), 'SOAP must enforce clinical review gate')

assert.ok(summary.sbarText.includes('[S] SITUATION'), 'SBAR must include Situation')
assert.ok(summary.sbarText.includes('[B] BACKGROUND'), 'SBAR must include Background')
assert.ok(summary.sbarText.includes('[A] ASSESSMENT'), 'SBAR must include Assessment')
assert.ok(summary.sbarText.includes('[R] RECOMMENDATION'), 'SBAR must include Recommendation')

// 4. PanaceaZoneNav 3-Zone Unification Verification (BODY = Your Body + Open 3D + BodyExposure)
const zoneNavSource = readFileSync('src/components/ui/PanaceaZoneNav.tsx', 'utf8')
assert.ok(zoneNavSource.includes("'BODY'"), 'ZoneNav must expose unified BODY zone')
assert.ok(zoneNavSource.includes("'Clinical'"), 'ZoneNav must have Clinical')
assert.ok(zoneNavSource.includes("'For You'"), 'ZoneNav must have For You')
assert.ok(zoneNavSource.includes('/body-exposure'), 'BODY zone must unify /body-exposure')

// 5. Cloudflare Pages & Static SPA Artifacts
assert.ok(existsSync('wrangler.toml'), 'wrangler.toml must exist for Cloudflare SPA asset routing')
const wranglerContent = readFileSync('wrangler.toml', 'utf8')
assert.ok(wranglerContent.includes('not_found_handling = "single-page-application"'), 'wrangler.toml must enable single-page-application not_found_handling')

assert.ok(existsSync('public/404.html'), 'public/404.html must exist for GitHub Pages SPA routing')
const notFoundContent = readFileSync('public/404.html', 'utf8')
assert.ok(notFoundContent.includes('/#/'), '404.html must redirect paths to HashRouter')

console.log('clinical-interop-export: 5/5 assertions PASS (FHIR bundle, roundtrip, SOAP/SBAR, ZoneNav, Cloudflare redirects).')
