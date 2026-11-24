import assert from 'node:assert/strict'
import { evaluateClinicalToClaimShield } from '../../src/domains/clinical-operations/engine/clinicalToClaimShieldEngine.ts'

// 1. NURSE role strictly strips clinical_coding and bpjs_confirmation_draft
{
  const nurseRes = evaluateClinicalToClaimShield({
    execution_mode: 'REALTIME_SHIELD',
    user_role: 'NURSE',
    care_setting: 'ICU_NICU_PICU_HCU',
    raw_clinical_input: 'Pasien gagal napas dengan ventilator mekanik hari ke-2, sudah tidak nyeri.',
    ventilator_hours: 48,
    bpjs_pending_query: 'Mohon konfirmasi bukti ventilator 96.71',
  })
  assert.equal(nurseRes.clinical_coding, undefined, 'NURSE must never receive ICD-10/INA-CBG coding block')
  assert.equal(nurseRes.bpjs_confirmation_draft, undefined, 'NURSE must never receive BPJS confirmation draft')
  assert.ok(nurseRes.pending_prevention_shield.missing_evidence_artifacts.some((m) => m.category === 'INFORMED_CONSENT'))
  assert.ok(nurseRes.pending_prevention_shield.missing_evidence_artifacts.some((m) => m.category === 'VENTILATOR_CARDEX'))
  assert.ok(nurseRes.meta.negations_and_resolved_conditions.some((n) => n.includes('nyeri')))
}

// 2. Group J Ventilator 96.72 (>=96h) + forensic cited BPJS defense when all docs attached
{
  const casemixRes = evaluateClinicalToClaimShield({
    execution_mode: 'BPJS_CONFIRMATION_COPILOT',
    user_role: 'CASEMIX_CODER',
    care_setting: 'ICU_NICU_PICU_HCU',
    raw_clinical_input: 'Gagal napas akut dengan ventilasi mekanik invasif 110 jam di ICU.',
    ventilator_hours: 110,
    supporting_documents: {
      lab_results: [{ name: 'AGD', value: 'PaO2 54 mmHg, pH 7.28', dateIso: '2026-11-20' }],
      radiology_expertise: [{ name: 'Foto Toraks AP', finding: 'Infiltrat bilateral, ETT posisi baik', dateIso: '2026-11-20' }],
      clinical_forms_and_logs: [
        { name: 'Informed Consent Intubasi', detail: 'Ditandatangani keluarga', dateIso: '2026-11-20' },
        { name: 'Ventilator Cardex ICU', detail: 'Mulai 20/11 08:00 - 24/11 22:00 (110 jam)', dateIso: '2026-11-24' },
        { name: 'Evaluasi Harian Ventilator', detail: 'Indikasi klinis gagal napas akut tercatat harian', dateIso: '2026-11-22' },
      ],
    },
    bpjs_pending_query: 'Konfirmasi kelayakan kode 96.72 dan bukti gagal napas J96.0',
  })
  assert.equal(casemixRes.clinical_coding?.principal_diagnosis.icd10, 'J96.0')
  assert.equal(casemixRes.clinical_coding?.procedures_icd9cm[0]?.icd9cm, '96.72')
  assert.equal(casemixRes.pending_prevention_shield.missing_evidence_artifacts.length, 0)
  assert.equal(casemixRes.bpjs_confirmation_draft?.recommended_action, 'DEFEND_WITH_EVIDENCE')
  assert.ok(casemixRes.bpjs_confirmation_draft?.forensic_cited_response.includes('AGD'))
  assert.ok(casemixRes.bpjs_confirmation_draft?.forensic_cited_response.includes('Ventilator Cardex ICU'))
}

// 3. KLL Accident Payer Routing + <30-day RITL Readmission Overlap + Zero-Keyword Inference
{
  const docRes = evaluateClinicalToClaimShield({
    execution_mode: 'UPSTREAM_ENCOUNTER',
    user_role: 'DOCTOR',
    care_setting: 'IGD',
    encounter_date_iso: '2026-11-24T08:00:00Z',
    raw_clinical_input: 'Pasien trauma lutut akibat kecelakaan lalu lintas (KLL), keluhan (-) sesak.',
    longitudinal_history: {
      prior_visits_and_sep: [{ sepNo: 'SEP-9901', visitDateIso: '2026-11-05T00:00:00Z', dischargeDateIso: '2026-11-10T00:00:00Z', careType: 'RITL', primaryIcd10: 'I10' }],
    },
  })
  assert.equal(docRes.meta.payer_routing_alert, 'KLL')
  assert.equal(docRes.meta.inferred_visit_type, 'POST_INPATIENT_FOLLOW_UP')
  assert.equal(docRes.pending_prevention_shield.readmission_or_sep_overlap.is_flagged, true)
  assert.ok(docRes.pending_prevention_shield.readmission_or_sep_overlap.detail.includes('SEP-9901'))
}

console.log('clinical-to-claim-shield: role-stripping, Group J 6-artifact 96.71/96.72, KLL routing, readmission SEP overlap & forensic BPJS copilot PASS')
