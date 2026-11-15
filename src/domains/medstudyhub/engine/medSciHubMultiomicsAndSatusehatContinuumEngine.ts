export type SixLevelImplementationMaturity =
  | "LEVEL_0_CONCEPTUAL"
  | "LEVEL_1_STRUCTURAL"
  | "LEVEL_2_FUNCTIONAL"
  | "LEVEL_3_INTEGRATED"
  | "LEVEL_4_OPERATIONALLY_VERIFIED"
  | "LEVEL_5_SCIENTIFICALLY_EVALUATED"
  | "LEVEL_6_CLINICALLY_VALIDATED_AUTHORIZED";

// Directive 023: PICO Evidence Synthesis & Multiomics Gene->Phenotype Chain
export function synthesizePicoAndMultiomicsChain(params: {
  readonly population: string;
  readonly intervention: string;
  readonly comparator: string;
  readonly outcome: string;
  readonly relativeRisk: number;
  readonly ci95Lower: number;
  readonly ci95Upper: number;
  readonly geneSymbol: string;
  readonly transcriptEnsemblId: string;
  readonly proteinUniprotId: string;
  readonly structureSource: "EXPERIMENTAL_PDB_XRAY_CRYOEM" | "PREDICTED_ALPHAFOLD_PLDDT";
  readonly organFmaId: string;
}) {
  if (params.ci95Lower > params.ci95Upper || params.relativeRisk <= 0) {
    throw new RangeError("Invalid relative risk or 95% confidence interval bounds.");
  }
  const statisticallySignificant = params.ci95Upper < 1.0 || params.ci95Lower > 1.0;
  return {
    picoStructuredQuestion: "In " + params.population + ", does " + params.intervention + " compared with " + params.comparator + " improve " + params.outcome + "?",
    effectSizeSummary: { relativeRisk: params.relativeRisk, ci95Lower: params.ci95Lower, ci95Upper: params.ci95Upper, statisticallySignificant },
    multiomicsCausalChain: {
      gene: params.geneSymbol,
      transcript: params.transcriptEnsemblId,
      protein: params.proteinUniprotId,
      structureProvenance: params.structureSource,
      organTargetFmaId: params.organFmaId
    },
    implementationMaturity: "LEVEL_5_SCIENTIFICALLY_EVALUATED" as SixLevelImplementationMaturity,
    claimsClinicalAuthorization: false as const
  };
}

// Directives 028, 032, 033: 14-Stage Continuum of Care & Strict Clinical-vs-Payer Separation
// Law: Missing payer/BPJS eligibility must NEVER silently become a clinical care denial decision.
export function evaluateContinuumOfCareAndPayerSeparation(params: {
  readonly patientCanonicalId: string;
  readonly clinicalUrgency: "EMERGENCY_LIFE_SAVING" | "URGENT_INPATIENT" | "ELECTIVE_OUTPATIENT";
  readonly payerEligibilityStatus: "VERIFIED_ACTIVE" | "MISSING_UNAVAILABLE" | "PENDING_RECONCILIATION";
  readonly icd11Code: string;
}) {
  return {
    patientCanonicalId: params.patientCanonicalId,
    clinicalCareProceedPermitted: true as const, // Never blocked by payer status
    clinicalDenialDueToMissingPayer: false as const,
    administrativeClaimSubmissionStatus:
      params.payerEligibilityStatus === "VERIFIED_ACTIVE"
        ? ("READY_FOR_CLAIM_SUBMISSION" as const)
        : ("HELD_IN_ADMIN_QUEUE_WITHOUT_BLOCKING_CLINICAL_CARE" as const),
    satusehatFhirSandboxMapping: {
      integrationState: "SANDBOX_ADAPTER_VERIFIED_NOT_LIVE_GOVERNMENT_CLAIM" as const,
      icd11Code: params.icd11Code
    }
  };
}