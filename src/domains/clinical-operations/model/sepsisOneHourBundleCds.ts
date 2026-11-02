export type SepsisPatientPopulation = "ADULT_NON_PREGNANT" | "PEDIATRIC_EXCLUDED" | "NEONATAL_EXCLUDED";
export type SepsisLikelihoodTier = "DEFINITE_OR_PROBABLE" | "POSSIBLE_INFECTION_UNCERTAIN";

export interface SepsisClinicalAssessmentInput {
  readonly patientPopulation?: SepsisPatientPopulation;
  readonly sepsisLikelihood?: SepsisLikelihoodTier;
  readonly meanArterialPressureMmHg?: number | null;
  readonly mapMmHg?: number | null;
  readonly systolicBpMmHg?: number | null;
  readonly serumLactateMmolL?: number | null;
  readonly lactateMmolL?: number | null;
  readonly vasopressorRequiredForMap65?: boolean;
  readonly vasopressorNorepinephrineActive?: boolean;
  readonly hypoperfusionPresent?: boolean;
  readonly fluidOverloadContraindication?: {
    readonly decompensatedHeartFailure: boolean;
    readonly anuricEndStageRenalDisease: boolean;
    readonly pulmonaryEdemaPresent: boolean;
  };
  readonly bloodCulturesOrderedBeforeAntimicrobials?: boolean;
  readonly bloodCultureObtainedBeforeAntibiotics?: boolean;
  readonly empiricAntimicrobialsOrdered?: boolean;
  readonly broadSpectrumAntibioticsAdministered?: boolean;
  readonly crystalloidVolumeAdministeredMlPerKg?: number | null;
  readonly crystalloidBolusMlPerKg?: number | null;
  readonly clinicianAuthorizedOrder?: boolean;
}

export function evaluateSepsisOneHourBundle(input: SepsisClinicalAssessmentInput) {
  const pop: SepsisPatientPopulation = input.patientPopulation ?? "ADULT_NON_PREGNANT";
  const likelihood: SepsisLikelihoodTier = input.sepsisLikelihood ?? "DEFINITE_OR_PROBABLE";
  const rawLac = input.serumLactateMmolL !== undefined ? input.serumLactateMmolL : (input.lactateMmolL ?? null);
  const rawMap = input.meanArterialPressureMmHg !== undefined ? input.meanArterialPressureMmHg : (input.mapMmHg ?? null);
  const lac = rawLac !== null && Number.isFinite(rawLac) ? rawLac : null;
  const map = rawMap !== null && Number.isFinite(rawMap) ? rawMap : null;
  const vasoActive = Boolean(input.vasopressorRequiredForMap65 || input.vasopressorNorepinephrineActive);
  const culturesOk = Boolean(input.bloodCulturesOrderedBeforeAntimicrobials || input.bloodCultureObtainedBeforeAntibiotics);
  const abxOk = Boolean(input.empiricAntimicrobialsOrdered || input.broadSpectrumAntibioticsAdministered);
  const fluidMlKg = input.crystalloidVolumeAdministeredMlPerKg !== undefined ? input.crystalloidVolumeAdministeredMlPerKg : (input.crystalloidBolusMlPerKg ?? null);

  if (pop !== "ADULT_NON_PREGNANT") {
    return {
      eligibleForAdultSscProtocol: false,
      populationNotice: "Adult Surviving Sepsis Campaign (SSC) criteria do not automatically apply to pediatric or neonatal patients; use age-specific guidelines.",
      clinicalPhenotype: "UNDER_EVALUATION_NON_SHOCK" as const,
      antimicrobialTimingRecommendation: {
        targetWindowMinutes: 60 as const,
        recommendationStrength: "CONDITIONAL_RECOMMENDATION_LOW_QUALITY_NO_SHOCK" as const,
        clinicalRationale: "Requires pediatric/neonatal weight-based protocols."
      },
      lactateGuidance: {
        initialLactateMmolL: lac,
        elevatedAbove2MmolL: null,
        serialRemeasurementRecommended: false,
        interpretationNote: "Use age-appropriate pediatric perfusion and lactate thresholds."
      },
      fluidResuscitationGuidance: {
        indicatedFor30MlPerKg: false,
        contraindicationOrCautionFlagged: true,
        recommendedFluidType: "BALANCED_CRYSTALLOID_PREFERRED" as const,
        clinicalGuidanceText: "Adult 30 mL/kg rule excluded; use 10-20 mL/kg pediatric aliquots with frequent reassessment."
      },
      vasoactiveGuidance: { norepinephrineFirstLineIndicated: false, targetMapMmHg: 65 as const },
      governanceAndAuthorization: {
        decisionSupportOnly: true as const,
        interventionStatus: "CDS_PROPOSAL_REQUIRES_CLINICIAN_AUTH" as const,
        evidenceLimitationsNote: "Out-of-population safety guard active."
      },
      bundleComplete: false,
      lactateCompliant: false,
      truthClass: "DERIVED_CLINICAL" as const
    };
  }

  // Sepsis-3 Shock: vasopressor required for MAP >= 65 mmHg AND serum lactate > 2.0 mmol/L
  const isShock = Boolean((vasoActive || (map !== null && map < 65)) && (lac !== null && lac > 2.0));
  const phenotype = isShock ? ("SEPTIC_SHOCK" as const) : likelihood === "DEFINITE_OR_PROBABLE" ? ("SEPSIS_WITHOUT_SHOCK" as const) : ("UNDER_EVALUATION_NON_SHOCK" as const);
  // SSC Timing: <= 60 min for Septic Shock or Definite/Probable Sepsis; <= 180 min with rapid investigation for Possible Sepsis without Shock
  const targetWindowMinutes: 60 | 180 = (isShock || likelihood === "DEFINITE_OR_PROBABLE") ? 60 : 180;
  const c = input.fluidOverloadContraindication;
  const caution = Boolean(c && (c.decompensatedHeartFailure || c.anuricEndStageRenalDisease || c.pulmonaryEdemaPresent));
  const hypo = Boolean(input.hypoperfusionPresent || (lac !== null && lac >= 4.0) || isShock);
  const indicated30 = hypo && !caution;
  const bundleComplete = Boolean(culturesOk && abxOk && ((indicated30 && fluidMlKg !== null && fluidMlKg >= 30) || !indicated30) && ((map !== null && map >= 65) || vasoActive));

  return {
    eligibleForAdultSscProtocol: true,
    populationNotice: "Adult non-pregnant Surviving Sepsis Campaign (SSC) decision-support pathway.",
    clinicalPhenotype: phenotype,
    antimicrobialTimingRecommendation: {
      targetWindowMinutes,
      recommendationStrength: isShock ? ("STRONG_RECOMMENDATION_MODERATE_QUALITY_SHOCK" as const) : ("CONDITIONAL_RECOMMENDATION_LOW_QUALITY_NO_SHOCK" as const),
      clinicalRationale: targetWindowMinutes === 60
        ? "Administer empiric antimicrobials immediately, ideally within 1 hour of recognition for septic shock or high-likelihood sepsis."
        : "For possible sepsis without shock, conduct rapid assessment of infectious vs non-infectious etiologies and administer antimicrobials within 3 hours if concern for infection persists."
    },
    lactateGuidance: {
      initialLactateMmolL: lac,
      elevatedAbove2MmolL: lac !== null ? lac > 2.0 : null,
      serialRemeasurementRecommended: lac !== null && lac > 2.0,
      interpretationNote: lac === null
        ? "Serum lactate observation missing; obtain baseline lactate without fabricating a value."
        : "Interpret serum lactate alongside capillary refill, clinical perfusion, and hepatic clearance context."
    },
    fluidResuscitationGuidance: {
      indicatedFor30MlPerKg: indicated30,
      contraindicationOrCautionFlagged: caution,
      recommendedFluidType: "BALANCED_CRYSTALLOID_PREFERRED" as const,
      clinicalGuidanceText: caution
        ? "Caution: volume overload risk present (HFrEF/ESRD/pulmonary edema). Avoid automatic 30 mL/kg bolus; use 250-500 mL balanced crystalloid aliquots guided by dynamic fluid responsiveness."
        : indicated30
          ? "Suggest at least 30 mL/kg IV balanced crystalloid within the first 3 hours for sepsis-induced hypoperfusion or septic shock, guided by dynamic hemodynamic reassessment."
          : "No overt hypoperfusion or lactate >= 4.0 mmol/L; monitor hemodynamics without mandatory 30 mL/kg bolus."
    },
    vasoactiveGuidance: {
      norepinephrineFirstLineIndicated: isShock || (map !== null && map < 65),
      targetMapMmHg: 65 as const
    },
    governanceAndAuthorization: {
      decisionSupportOnly: true as const,
      interventionStatus: input.clinicianAuthorizedOrder ? ("CLINICIAN_AUTHORIZED_ORDER_ACTIVE" as const) : ("CDS_PROPOSAL_REQUIRES_CLINICIAN_AUTH" as const),
      evidenceLimitationsNote: "Decision support proposal only; never substitutes for independent clinician authorization."
    },
    bundleComplete,
    lactateCompliant: lac !== null,
    truthClass: "DERIVED_CLINICAL" as const
  };
}
