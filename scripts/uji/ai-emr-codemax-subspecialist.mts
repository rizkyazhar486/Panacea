import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  CODEMAX_NON_SUBSTITUTION_DISCLAIMER,
  analyzeIcdToInaCbg,
  analyzeSoapToIcd,
  evaluateBpjsPendingRisk,
  recordCodemaxDecision,
} from '../../src/domains/clinical-operations/engine/codemaxVerifierSdk.ts'
import {
  DEFAULT_SUBSPECIALIST_SYSTEM_PROMPT_V1,
  QUICK_CONSULT_TEMPLATES,
  SYNTHETIC_QUICK_CONSULT_EXAMPLES,
  calculateAdultAnthropometry,
  calculateFluidAndInfusion,
  calculatePediatricLmsZScore,
  formatQuickConsultOutput,
  generateSubspecialistClinicalDraft,
} from '../../src/domains/clinical-operations/engine/subspecialistClinicalDocEngine.ts'

// 1. Anthropometry & adult-vs-pediatric gating + zero-coercion
const missingAnthro = calculateAdultAnthropometry('', 170, 35)
assert.equal(missingAnthro.status, 'missing_input')
assert.equal(missingAnthro.bmiKgM2, null, 'Empty weight must never coerce to 0 BMI')

const invalidAnthro = calculateAdultAnthropometry(-5, 170, 35)
assert.equal(invalidAnthro.status, 'invalid_input')

const adultAnthro = calculateAdultAnthropometry(65, 170, 42)
assert.equal(adultAnthro.status, 'ok')
assert.equal(adultAnthro.bmiKgM2, 22.49)
assert.equal(adultAnthro.bsaMostellerM2, 1.75)
assert.equal(adultAnthro.pediatricIndices.status, 'N/A_ADULT')
assert.match(adultAnthro.pediatricIndices.bbPerU, /N\/A/i)
assert.match(adultAnthro.pediatricIndices.tbPerU, /N\/A/i)
assert.match(adultAnthro.pediatricIndices.bbPerTb, /N\/A/i)

const adultZ = calculatePediatricLmsZScore(65, 0.1, 60, 0.12, 42)
assert.equal(adultZ.status, 'N/A_ADULT')
assert.equal(adultZ.zScore, null)

const childZ = calculatePediatricLmsZScore(18, 0.2, 20, 0.1, 6)
assert.equal(childZ.status, 'ok')
assert.ok(typeof childZ.zScore === 'number' && childZ.zScore < 0)

// 2. Fluid balance, urine output & infusion rate
const fluid = calculateFluidAndInfusion({ intakeMl: 1800, outputMl: 600, weightKg: 65, durationHours: 24, targetVolumeMl: 1500, dropFactor: 20 })
assert.equal(fluid.status, 'ok')
assert.equal(fluid.fluidBalanceMl, 1200)
assert.equal(fluid.urineOutputMlKgH, 0.38)
assert.ok(fluid.urineWarning && /oliguria/i.test(fluid.urineWarning))
assert.equal(fluid.infusionRateMlPerH, 62.5)
assert.equal(fluid.dropsPerMin, 21)

// 3. De-identified synthetic §20 regression case (adult ENT/ophthalmology mass)
assert.ok(DEFAULT_SUBSPECIALIST_SYSTEM_PROMPT_V1.promptText.includes('Dipikirkan'))
const synEntCase = generateSubspecialistClinicalDraft({
  patientCode: 'SYN-ENT-OPH-01',
  ageYears: 42,
  sex: 'Laki-laki',
  weightKg: 65,
  heightCm: 170,
  chiefComplaint: 'Penonjolan bola mata progresif dan sumbatan hidung kronik',
  rps: 'Keluhan memberat sejak beberapa bulan terakhir dengan nyeri periokular dan penurunan visus ipsilateral.',
  vitals: { td: '120/80', hrBpm: 140, rr: 20, tempC: 36.8, spo2Pct: 98 },
  documentedExamFindings: 'Mata: proptosis unilateral, gerak bola mata terbatas. Hidung: massa kavum nasi ipsilateral.',
  imagingSummary: 'MRI kepala-orbita menunjukkan massa nasofaring ekstensi orbita & intrakranial',
  labResults: [
    { name: 'SGOT', value: '67 U/L', abnormal: true },
    { name: 'SGPT', value: '74 U/L', abnormal: true },
  ],
  ekgPerformed: false,
  histopathologyConfirmed: false,
  administeredTherapies: ['Analgetik sesuai instruksi DPJP'],
  plannedProcedure: 'Rencana eviserasi & biopsi',
})
assert.equal(synEntCase.clinically_reviewed, false)
assert.equal(synEntCase.anthropometry.bmiKgM2, 22.49)
assert.equal(synEntCase.anthropometry.pediatricIndices.status, 'N/A_ADULT')
assert.ok(synEntCase.clinicalAlerts.some((a) => /140x\/menit/i.test(a) && /EKG/i.test(a)))
assert.ok(synEntCase.clinicalAlerts.some((a) => /SGOT 67/i.test(a) && /SGPT 74/i.test(a)))
assert.ok(synEntCase.clinicalAlerts.some((a) => /histopatologi\/PA belum tersedia/i.test(a)))
assert.ok(synEntCase.missingItemsMarkedBelumDikaji.includes('RPD'))
assert.ok(synEntCase.missingItemsMarkedBelumDikaji.includes('Alergi'))
assert.ok(synEntCase.pengkajianMasalah.startsWith('Dipikirkan '))
assert.match(synEntCase.sectionsText, /EKG belum dilakukan \/ belum terdokumentasi/)
assert.match(synEntCase.sectionsText, /belum dikaji/)

// Verify ZERO leakage of disallowed raw prompt identifiers inside src/ and scripts/uji/
function walkText(dir: string): string[] {
  const out: string[] = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) out.push(...walkText(p))
    else if (/\.(ts|tsx|mts)$/.test(e.name) && !p.endsWith('ai-emr-codemax-subspecialist.mts')) out.push(p)
  }
  return out
}
const phiTerm = ['Tuan', 'HBS'].join(' ')
for (const file of [...walkText('src'), ...walkText('scripts/uji')]) {
  const content = readFileSync(file, 'utf8')
  assert.ok(!content.includes(phiTerm), `De-identification violation detected in ${file}`)
}

// 4. Quick Consult Auto-Formatter
assert.equal(QUICK_CONSULT_TEMPLATES.length, 8)
const synIpd = SYNTHETIC_QUICK_CONSULT_EXAMPLES[0].data
const waOut = formatQuickConsultOutput(synIpd, 'whatsapp_draft', { redactDirectIdentifiers: true })
assert.equal(waOut.draftOnly, true)
assert.equal(waOut.clinically_reviewed, false)
assert.equal(waOut.autoSent, false)
assert.match(waOut.text, /\[Pasien Teranonimisasi\]/)
const fhirOut = formatQuickConsultOutput(synIpd, 'fhir_composition_json')
assert.equal(JSON.parse(fhirOut.text).resourceType, 'Composition')

// 5. Codemax Verifier SDK
const nurseSoap = analyzeSoapToIcd({ soapNote: 'Gagal napas akut ventilasi 108 jam', careSetting: 'ICU_NICU_PICU_HCU', role: 'NURSE' })
assert.equal(nurseSoap.roleOmittedCoding, true)
assert.equal(nurseSoap.candidates.length, 0)

const entSoap = analyzeSoapToIcd({
  soapNote: 'Suspek massa nasofaring dengan perluasan orbita rencana eviserasi, nadi 140x/m takikardi, SGOT 67, SGPT 74.',
  careSetting: 'RAWAT_INAP',
  role: 'DOCTOR',
  ekgRecorded: false,
  histopathologyConfirmed: false,
  labs: [{ name: 'SGOT/SGPT', value: '67/74 U/L', abnormal: true }],
})
assert.equal(entSoap.clinically_reviewed, false)
assert.equal(entSoap.billing_approved, false)
assert.equal(entSoap.disclaimer, CODEMAX_NON_SUBSTITUTION_DISCLAIMER)
assert.equal(entSoap.candidates[0]?.code, 'D48.9', 'Unconfirmed histopathology must not lock malignant primary C-code')
assert.equal(entSoap.candidates[0]?.evidenceStatus, 'unconfirmed_awaiting_histopath')

const inaRes = analyzeIcdToInaCbg({
  primaryIcd10: entSoap.candidates[0].code,
  secondaryIcd10: ['R00.0', 'R74.0'],
  careSetting: 'RAWAT_INAP',
  soapNote: 'Takikardi nadi 140 massa orbita nasofaring',
  ekgRecorded: false,
  histopathologyConfirmed: false,
})
assert.equal(inaRes.recommendedInaCbgs[0].tariffSortApplied, false)
assert.ok(inaRes.recommendedClaimDocuments.some((d) => d.status === 'missing'))
assert.ok(inaRes.recommendedDiagnosticOrders.some((o) => o.modality === 'EKG'))
assert.ok(inaRes.recommendedDiagnosticOrders.some((o) => o.modality === 'PATHOLOGY'))

const riskEmpty = evaluateBpjsPendingRisk({ soapToIcd: entSoap, inaCbg: inaRes, confirmationDraftText: '', documentedRitlIndication: false })
assert.equal(riskEmpty.confirmationQuality, 'Kosong')
assert.equal(riskEmpty.riskLevel, 'HIGH')
assert.ok(riskEmpty.flaggedCategories.some((c) => c.category === 'bukti_pelayanan_kurang'))
assert.ok(riskEmpty.flaggedCategories.some((c) => c.category === 'indikasi_ritl_tidak_tepat'))

const riskDetailed = evaluateBpjsPendingRisk({
  soapToIcd: entSoap,
  inaCbg: inaRes,
  confirmationDraftText: 'Pada tgl kontrol klinis hasil Lab SGOT 67 SGPT 74, MRI orbita terlampir, rencana EKG 12-lead & PA biopsi untuk konfirmasi definitif.',
})
assert.equal(riskDetailed.confirmationQuality, 'Terperinci dengan Bukti Spesifik')

assert.throws(() => recordCodemaxDecision([], { atIso: '2026-11-24T00:00:00Z', actorName: 'dr. R', actorRole: 'DOCTOR', targetCode: 'D48.9', decision: 'reject' }))
const logAfterAccept = recordCodemaxDecision([], { atIso: '2026-11-24T00:00:00Z', actorName: 'dr. R', actorRole: 'DOCTOR', targetCode: 'D48.9', decision: 'accept' })
assert.equal(logAfterAccept.length, 1)
assert.equal(logAfterAccept[0].clinically_reviewed, false)
assert.equal(logAfterAccept[0].billing_approved, false)

console.log('ai-emr-codemax-subspecialist: all deterministic assertions PASSED.')
