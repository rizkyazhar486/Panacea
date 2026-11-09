/**
 * PanaceaMed Clinical Decision Support & FHIR Interoperability Engine (Directive 029)
 * Provides real-time clinical alerts, drug-drug interaction screening, 
 * and automated FHIR resource mapping for hospital workflows.
 */

export interface MedicationOrder {
  medicationCode: string;
  medicationName: string;
  dosage: string;
  route: string;
}

export interface PatientEncounterContext {
  patientId: string;
  age: number;
  activeConditions: string[];
  currentMedications: MedicationOrder[];
  recentLabResults: { testName: string; value: number; unit: string }[];
}

export interface CdsAlertResult {
  alertId: string;
  patientId: string;
  severity: 'INFO' | 'MODERATE' | 'CRITICAL_SAFETY_WARNING';
  recommendation: string;
  fhirResourceGenerated: {
    resourceType: 'DetectedIssue' | 'Flag';
    id: string;
    code: string;
    status: string;
  };
  isClinicallyAuthoritative: false; // Invariant: AI advises, clinician decides
}

export function evaluateClinicalDecisionSupport(context: PatientEncounterContext): CdsAlertResult[] {
  const alerts: CdsAlertResult[] = [];

  // Rule 1: Check for ACE Inhibitor + Potassium-sparing diuretic interaction (Hyperkalemia risk)
  const hasAceInhibitor = context.currentMedications.some(m => m.medicationName.toLowerCase().includes('lisinopril') || m.medicationName.toLowerCase().includes('captopril'));
  const hasSpironolactone = context.currentMedications.some(m => m.medicationName.toLowerCase().includes('spironolactone'));

  if (hasAceInhibitor && hasSpironolactone) {
    alerts.push({
      alertId: `CDS-ALERT-${Date.now()}-1`,
      patientId: context.patientId,
      severity: 'CRITICAL_SAFETY_WARNING',
      recommendation: 'Potential severe drug interaction: ACE Inhibitor combined with Potassium-sparing diuretic increases hyperkalemia risk. Monitor serum potassium immediately.',
      fhirResourceGenerated: {
        resourceType: 'DetectedIssue',
        id: `ISSUE-${Math.floor(Math.random() * 10000)}`,
        code: 'HYPERKALEMIA_RISK_INTERACTION',
        status: 'active'
      },
      isClinicallyAuthoritative: false
    });
  }

  // Rule 2: Renal function check for high-dose nephrotoxic monitoring
  const creatinine = context.recentLabResults.find(l => l.testName.toLowerCase().includes('creatinine'));
  if (creatinine && creatinine.value > 1.5) {
    alerts.push({
      alertId: `CDS-ALERT-${Date.now()}-2`,
      patientId: context.patientId,
      severity: 'MODERATE',
      recommendation: `Elevated serum creatinine detected (${creatinine.value} ${creatinine.unit}). Adjust nephrotoxic medication dosing accordingly.`,
      fhirResourceGenerated: {
        resourceType: 'Flag',
        id: `FLAG-${Math.floor(Math.random() * 10000)}`,
        code: 'RENAL_DOSING_ADJUSTMENT',
        status: 'active'
      },
      isClinicallyAuthoritative: false
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      alertId: `CDS-ALERT-${Date.now()}-0`,
      patientId: context.patientId,
      severity: 'INFO',
      recommendation: 'No critical drug-drug interactions or safety anomalies detected in current encounter.',
      fhirResourceGenerated: {
        resourceType: 'Flag',
        id: `FLAG-PASS-${Math.floor(Math.random() * 10000)}`,
        code: 'NO_ACTIVE_ISSUES',
        status: 'entered-in-error'
      },
      isClinicallyAuthoritative: false
    });
  }

  return alerts;
}
