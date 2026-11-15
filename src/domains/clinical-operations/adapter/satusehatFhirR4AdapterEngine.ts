/**
 * @file satusehatFhirR4AdapterEngine.ts
 * @description Adaptor Interoperabilitas Standar Kemenkes RI SATUSEHAT (HL7 FHIR R4)
 * Mencakup Observation (Tanda Vital & Lab Kritis), Condition (ICD-10/SNOMED),
 * MedicationRequest (KFA + Validasi Farmakogenomik CPIC), dan Bundle Transaction.
 */

import {
  evaluatePharmacogenomicAndRenalMedicationSafety,
  type MedicationSafetyEvaluationInput
} from "../model/pharmacogenomicsAndDrugInteractionSafetyEngine.ts";

export interface InternalClinicalObservationInput {
  readonly encounterId: string;
  readonly patientNik: string;
  readonly practitionerNik: string;
  readonly observationTypeCode: "883-9" | "29463-7" | "8480-6" | "8462-4" | "8867-4" | "2823-3" | "2160-0";
  readonly observationTypeName: string;
  readonly numericValue: number;
  readonly unitOfMeasure: string;
  readonly effectiveDateTime: string;
  readonly interpretationFlag: "N" | "H" | "L" | "A" | "LL" | "HH";
}

export interface InternalClinicalConditionInput {
  readonly encounterId: string;
  readonly patientNik: string;
  readonly practitionerNik: string;
  readonly icd10Code: string;
  readonly icd10Display: string;
  readonly snomedCtCode?: string;
  readonly snomedCtDisplay?: string;
  readonly clinicalStatus: "active" | "remission" | "resolved";
  readonly recordedDate: string;
}

export interface InternalMedicationRequestInput {
  readonly encounterId: string;
  readonly patientNik: string;
  readonly practitionerNik: string;
  readonly kfaCode: string;
  readonly kfaDisplayName: string;
  readonly dosageInstructionText: string;
  readonly authoredOn: string;
  readonly cpicSafetyEvaluationInput: MedicationSafetyEvaluationInput;
}

export function mapObservationToSatuSehatFhirR4(input: InternalClinicalObservationInput) {
  if (input.numericValue < 0) {
    throw new RangeError("Nilai numerik observasi klinis tidak boleh bernilai negatif.");
  }

  const isCriticalPanic = input.interpretationFlag === "HH" || input.interpretationFlag === "LL";

  return {
    resourceType: "Observation" as const,
    status: "final" as const,
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: input.observationTypeCode === "2823-3" || input.observationTypeCode === "2160-0" ? "laboratory" : "vital-signs",
            display: input.observationTypeCode === "2823-3" || input.observationTypeCode === "2160-0" ? "Laboratory" : "Vital Signs"
          }
        ]
      }
    ],
    code: {
      coding: [
        {
          system: "http://loinc.org",
          code: input.observationTypeCode,
          display: input.observationTypeName
        }
      ]
    },
    subject: {
      reference: `Patient/${input.patientNik}`,
      identifier: {
        system: "https://fhir.kemkes.go.id/id/nik",
        value: input.patientNik
      }
    },
    encounter: {
      reference: `Encounter/${input.encounterId}`
    },
    performer: [
      {
        reference: `Practitioner/${input.practitionerNik}`
      }
    ],
    effectiveDateTime: input.effectiveDateTime,
    valueQuantity: {
      value: input.numericValue,
      unit: input.unitOfMeasure,
      system: "http://unitsofmeasure.org",
      code: input.unitOfMeasure
    },
    interpretation: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
            code: input.interpretationFlag,
            display: isCriticalPanic
              ? "Critical Panic Value"
              : input.interpretationFlag === "H"
              ? "High"
              : input.interpretationFlag === "L"
              ? "Low"
              : "Normal"
          }
        ]
      }
    ],
    criticalPanicEscalationRequired: isCriticalPanic
  };
}

export function mapConditionToSatuSehatFhirR4(input: InternalClinicalConditionInput) {
  const codings = [
    {
      system: "http://hl7.org/fhir/sid/icd-10",
      code: input.icd10Code,
      display: input.icd10Display
    }
  ];
  if (input.snomedCtCode && input.snomedCtDisplay) {
    codings.push({
      system: "http://snomed.info/sct",
      code: input.snomedCtCode,
      display: input.snomedCtDisplay
    });
  }

  return {
    resourceType: "Condition" as const,
    clinicalStatus: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
          code: input.clinicalStatus,
          display: input.clinicalStatus.toUpperCase()
        }
      ]
    },
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/condition-category",
            code: "encounter-diagnosis",
            display: "Encounter Diagnosis"
          }
        ]
      }
    ],
    code: {
      coding: codings
    },
    subject: {
      reference: `Patient/${input.patientNik}`
    },
    encounter: {
      reference: `Encounter/${input.encounterId}`
    },
    recordedDate: input.recordedDate
  };
}

export function mapMedicationRequestWithCpicGateToSatuSehatFhirR4(input: InternalMedicationRequestInput) {
  const safetyVerdict = evaluatePharmacogenomicAndRenalMedicationSafety(input.cpicSafetyEvaluationInput);

  // Jika ada kontraindikasi genetik CPIC (misal HLA-B*15:02 pada Carbamazepine), tahan resep (on-hold)
  const fhirStatus = safetyVerdict.safeToDispenseWithoutOverride ? ("active" as const) : ("on-hold" as const);

  return {
    resourceType: "MedicationRequest" as const,
    status: fhirStatus,
    intent: "order" as const,
    medicationCodeableConcept: {
      coding: [
        {
          system: "http://sys-ids.kemkes.go.id/kfa",
          code: input.kfaCode,
          display: input.kfaDisplayName
        }
      ]
    },
    subject: {
      reference: `Patient/${input.patientNik}`
    },
    encounter: {
      reference: `Encounter/${input.encounterId}`
    },
    authoredOn: input.authoredOn,
    requester: {
      reference: `Practitioner/${input.practitionerNik}`
    },
    dosageInstruction: [
      {
        text: input.dosageInstructionText,
        doseAndRate: [
          {
            doseQuantity: {
              value: safetyVerdict.recommendedAdjustedDailyDoseMg,
              unit: "mg",
              system: "http://unitsofmeasure.org",
              code: "mg"
            }
          }
        ]
      }
    ],
    cpicPharmacogenomicGovernance: {
      safeToDispenseWithoutOverride: safetyVerdict.safeToDispenseWithoutOverride,
      hardContraindicationAlerts: safetyVerdict.hardContraindicationAlerts,
      ddiWarnings: safetyVerdict.ddiWarnings,
      recommendedAdjustedDailyDoseMg: safetyVerdict.recommendedAdjustedDailyDoseMg
    }
  };
}

export function buildSatuSehatFhirR4StagingBundle(params: {
  readonly bundleId: string;
  readonly observation: InternalClinicalObservationInput;
  readonly condition: InternalClinicalConditionInput;
  readonly medicationRequest: InternalMedicationRequestInput;
}) {
  const obsResource = mapObservationToSatuSehatFhirR4(params.observation);
  const condResource = mapConditionToSatuSehatFhirR4(params.condition);
  const medResource = mapMedicationRequestWithCpicGateToSatuSehatFhirR4(params.medicationRequest);

  return {
    resourceType: "Bundle" as const,
    id: params.bundleId,
    type: "transaction" as const,
    entry: [
      {
        fullUrl: `urn:uuid:obs-${params.bundleId}`,
        resource: obsResource,
        request: { method: "POST" as const, url: "Observation" }
      },
      {
        fullUrl: `urn:uuid:cond-${params.bundleId}`,
        resource: condResource,
        request: { method: "POST" as const, url: "Condition" }
      },
      {
        fullUrl: `urn:uuid:med-${params.bundleId}`,
        resource: medResource,
        request: { method: "POST" as const, url: "MedicationRequest" }
      }
    ]
  };
}
