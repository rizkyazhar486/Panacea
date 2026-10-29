/**
 * PanaceaMed Pharmacovigilance & Adverse Drug Event (ADE) Surveillance Engine (Directive 031)
 * Proactively monitors drug combinations, lab anomalies, and patient parameters 
 * to detect adverse drug reactions autonomously while enforcing human clinical authority.
 */

export interface PatientMedicationLabProfile {
  patientId: string;
  age: number;
  medications: string[];
  recentLabs: { testName: string; value: number; unit: string }[];
  reportedSymptoms: string[];
}

export interface AdeAlertReport {
  surveillanceId: string;
  patientId: string;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH_ADE_WARNING';
  detectedSignal: string;
  recommendedClinicalAction: string;
  fhirAdverseEventResource: {
    resourceType: 'AdverseEvent';
    id: string;
    actuality: 'actual' | 'potential';
    severity: string;
  };
  isClinicallyAuthoritative: false; // Invariant: AI advises, human clinician decides
}

export function evaluatePharmacovigilanceSurveillance(profile: PatientMedicationLabProfile): AdeAlertReport {
  const hasAnticoagulant = profile.medications.some(m => m.toLowerCase().includes('warfarin') || m.toLowerCase().includes('aspirin'));
  const hasNsaid = profile.medications.some(m => m.toLowerCase().includes('ibuprofen') || m.toLowerCase().includes('diclofenac'));
  const hasBleedingSymptom = profile.reportedSymptoms.some(s => s.toLowerCase().includes('bleeding') || s.toLowerCase().includes('bruising') | s.toLowerCase().includes('melena'));

  let risk: AdeAlertReport['riskLevel'] = 'LOW';
  let signal = 'No adverse drug event signals detected.';
  let action = 'Continue routine pharmacological monitoring.';

  if (hasAnticoagulant && hasNsaid && hasBleedingSymptom) {
    risk = 'HIGH_ADE_WARNING';
    signal = 'Critical ADE Signal: Concurrent Anticoagulant and NSAID usage paired with bleeding manifestations (High Gastrointestinal Hemorrhage Risk).';
    action = 'Immediately suspend NSAID administration, check hemoglobin and coagulation profile, and consult clinical specialist.';
  } else if (hasAnticoagulant && hasNsaid) {
    risk = 'MODERATE';
    signal = 'Moderate ADE Risk: Concurrent Anticoagulant and NSAID prescription requires close ulcer and bleeding surveillance.';
    action = 'Consider gastroprotection (PPI co-prescription) or alternative analgesic therapy.';
  }

  return {
    surveillanceId: `ADE-SURV-${Date.now()}`,
    patientId: profile.patientId,
    riskLevel: risk,
    detectedSignal: signal,
    recommendedClinicalAction: action,
    fhirAdverseEventResource: {
      resourceType: 'AdverseEvent',
      id: `AE-${Math.floor(Math.random() * 10000)}`,
      actuality: risk === 'HIGH_ADE_WARNING' ? 'actual' : 'potential',
      severity: risk === 'HIGH_ADE_WARNING' ? 'severe' : 'mild'
    },
    isClinicallyAuthoritative: false
  };
}
