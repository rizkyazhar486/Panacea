export interface MedicationSafetyEvaluationInput {
  readonly patientCanonicalId: string;
  readonly candidateDrugGeneric: "carbamazepine" | "clopidogrel" | "warfarin" | "gentamicin";
  readonly standardDailyDoseMg: number;
  readonly eGfrMlMin173m2: number;
  readonly childPughClass: "A" | "B" | "C";
  readonly pharmacogenomicMarkers: readonly ("HLA-B*15:02_POSITIVE" | "CYP2C19_POOR_METABOLIZER_2_2" | "VKORC1_SENSITIVE" | "NORMAL_WILDTYPE")[];
  readonly concomitantMedications: readonly string[];
  readonly documentedAllergies: readonly string[];
}

export function evaluatePharmacogenomicAndRenalMedicationSafety(input: MedicationSafetyEvaluationInput) {
  if (input.standardDailyDoseMg <= 0 || input.eGfrMlMin173m2 < 0) {
    throw new RangeError("standardDailyDoseMg must be positive and eGfrMlMin173m2 non-negative.");
  }
  const hardContraindicationAlerts: string[] = [];
  const ddiWarnings: string[] = [];

  // 1. Allergy check
  if (input.documentedAllergies.map((a) => a.toLowerCase()).includes(input.candidateDrugGeneric)) {
    hardContraindicationAlerts.push("DOCUMENTED_DRUG_ALLERGY_CONTRAINDICATION");
  }

  // 2. Indonesian & Southeast Asian CPIC Pharmacogenomic Safety Gates
  if (input.candidateDrugGeneric === "carbamazepine" && input.pharmacogenomicMarkers.includes("HLA-B*15:02_POSITIVE")) {
    hardContraindicationAlerts.push("CPIC_LEVEL_A_CONTRAINDICATION: HLA-B*15:02 positive carries high risk of Stevens-Johnson Syndrome / TEN with Carbamazepine.");
  }
  if (input.candidateDrugGeneric === "clopidogrel" && input.pharmacogenomicMarkers.includes("CYP2C19_POOR_METABOLIZER_2_2")) {
    hardContraindicationAlerts.push("CPIC_LEVEL_A_ALERT: CYP2C19 *2/*2 poor metabolizer cannot bioactivate Clopidogrel; consider Prasugrel or Ticagrelor.");
  }

  // 3. Cytochrome P450 Drug-Drug Interaction (DDI) Check
  const lowerConcomitant = input.concomitantMedications.map((m) => m.toLowerCase());
  if (input.candidateDrugGeneric === "clopidogrel" && lowerConcomitant.includes("omeprazole")) {
    ddiWarnings.push("CYP2C19_INHIBITION_DDI: Omeprazole inhibits CYP2C19 bioactivation of Clopidogrel; switch PPI to Pantoprazole.");
  }
  if (input.candidateDrugGeneric === "warfarin" && lowerConcomitant.includes("amiodarone")) {
    ddiWarnings.push("CYP2C9_INHIBITION_DDI: Amiodarone reduces Warfarin clearance; reduce Warfarin dose by 30-50% and monitor INR.");
  }

  // 4. Renal & Hepatic Dose Scaling
  let renalScalingFactor = 1.0;
  if (input.candidateDrugGeneric === "gentamicin") {
    renalScalingFactor = Math.min(1.0, Math.max(0.2, input.eGfrMlMin173m2 / 90));
  }
  const hepaticScalingFactor = input.childPughClass === "C" ? 0.5 : input.childPughClass === "B" ? 0.75 : 1.0;
  const recommendedAdjustedDailyDoseMg = Number((input.standardDailyDoseMg * renalScalingFactor * hepaticScalingFactor).toFixed(1));

  return {
    patientCanonicalId: input.patientCanonicalId,
    candidateDrugGeneric: input.candidateDrugGeneric,
    safeToDispenseWithoutOverride: hardContraindicationAlerts.length === 0,
    hardContraindicationAlerts,
    ddiWarnings,
    recommendedAdjustedDailyDoseMg,
    requiresAuthorizedClinicianSignature: true as const,
    truthClass: "DERIVED_CLINICAL" as const
  };
}
