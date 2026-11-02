// SYNTHETIC teaching case (no real patient). Clinical framing follows the cited guideline at a principle level only; findings are invented for teaching.
import type { ClinicalCase } from '../engine/caseMachine.ts'

export const HEART_FAILURE_CASE: ClinicalCase = {
  id: 'case:synthetic_exertional_dyspnoea', version: '1.0.0', synthetic: true,
  presentation: 'Synthetic patient, 62-year-old, three weeks of worsening breathlessness on exertion and needing extra pillows to sleep.',
  conceptIds: ['pcg:left_ventricle', 'pcg:excitation_contraction_coupling'], referenceIds: ['ref:esc-hf-2021', 'ref:openstax-ap2e'],
  history: [
    { id: 'h_orthopnoea', label: 'Breathlessness lying flat?', result: 'Yes — needs three pillows; wakes breathless at night.', key: true },
    { id: 'h_ankle', label: 'Ankle swelling?', result: 'Both ankles swell by evening.', key: true },
    { id: 'h_fever', label: 'Fever or productive cough?', result: 'No fever; dry cough at night only.', key: false },
    { id: 'h_chest_pain', label: 'Chest pain?', result: 'None at rest or on exertion.', key: false },
    { id: 'h_smoking', label: 'Smoking history?', result: 'Never smoked.', key: false },
  ],
  examination: [
    { id: 'e_jvp', label: 'Jugular venous pressure', result: 'Raised.', key: true },
    { id: 'e_chest', label: 'Chest auscultation', result: 'Fine crackles at both bases; no wheeze.', key: true },
    { id: 'e_heart', label: 'Heart sounds', result: 'Third heart sound present.', key: true },
    { id: 'e_oedema', label: 'Peripheral oedema', result: 'Pitting oedema to mid-shin.', key: false },
  ],
  candidates: [
    { id: 'd_hf', label: 'Heart failure' }, { id: 'd_copd', label: 'COPD exacerbation' }, { id: 'd_pneumonia', label: 'Pneumonia' }, { id: 'd_anaemia', label: 'Anaemia' },
  ],
  trueDiagnosisId: 'd_hf',
  investigations: [
    { id: 'i_ecg', label: '12-lead ECG', result: 'Sinus rhythm, rate 96; no acute ST-segment change (synthetic).', highValue: true },
    { id: 'i_natriuretic', label: 'Natriuretic peptide', result: 'Raised (synthetic value).', highValue: true },
    { id: 'i_echo', label: 'Echocardiogram', result: 'Dilated left ventricle with reduced systolic function (synthetic).', highValue: true },
    { id: 'i_cxr', label: 'Chest X-ray', result: 'Pulmonary venous congestion and small bilateral effusions (synthetic).', highValue: false },
    { id: 'i_spirometry', label: 'Spirometry', result: 'Not informative during acute breathlessness in this scenario.', highValue: false },
  ],
  management: [
    { id: 'm_clinician_plan', label: 'Clinician-led evaluation of cause and a guideline-based treatment plan', appropriate: true, rationale: 'Diagnosis and treatment decisions rest with the responsible clinician using current guidelines.' },
    { id: 'm_congestion', label: 'Address fluid congestion under clinician direction', appropriate: true, rationale: 'Congestion drives the symptoms in this scenario; therapy and monitoring are clinician-directed.' },
    { id: 'm_followup', label: 'Arrange monitoring and follow-up', appropriate: true, rationale: 'Chronic cardiac conditions need structured reassessment.' },
    { id: 'm_antibiotics_only', label: 'Antibiotics alone', appropriate: false, rationale: 'No infectious features; this treats a diagnosis the findings do not support.' },
    { id: 'm_discharge', label: 'Reassure and discharge without follow-up', appropriate: false, rationale: 'Findings indicate significant pathology that needs evaluation.' },
  ],
  maxDifferential: 3,
}
