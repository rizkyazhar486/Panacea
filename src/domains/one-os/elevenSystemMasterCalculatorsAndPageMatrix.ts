import { DEFAULT_OXYGEN_CONTENT_CONVENTION, oxygenContentMlDl } from "../../lib/physiology/oxygenContentConventions.ts";
import { COMPLETE_11_SYSTEM_CANONICAL_ASSET_REGISTRY, type CanonicalBodySystemId } from "../body-exposure/engine/singleProjectileUhdBodyExposureEngine.ts";
import { executeCrossOrganCoupledSimulation } from "../body-exposure/engine/crossOrganPhysiologicalCouplingEngine.ts";
import { simulateHepatobiliaryPancreaticPostprandialDynamics } from "../body-exposure/engine/hepatobiliaryPancreaticAndLaparoscopicEngine.ts";

export type PanaceaMasterPageId =
  | "PAGE_1_BODY_EXPOSURE_UHD"
  | "PAGE_2_YOUR_BODY_HEALTHSPAN"
  | "PAGE_3_CLINICAL_ONE_OS_ICU"
  | "PAGE_4_SURGICAL_SIMULATOR"
  | "PAGE_5_MEDSCIHUB_PROMETHEUS"
  | "PAGE_6_KALOLUMEN_DICOM_3DCG"
  | "PAGE_7_RECLUB_CLASSPASS_ARENA";

export interface SystemQuantitativeCalculation {
  readonly systemId: CanonicalBodySystemId;
  readonly displayName: string;
  readonly primaryFormula: string;
  readonly primaryMetricLabel: string;
  readonly primaryMetricValue: string;
  readonly secondaryMetricLabel: string;
  readonly secondaryMetricValue: string;
  readonly authoritativeSource: string;
  readonly outflowTargetPage: PanaceaMasterPageId;
}

export function computeAllElevenBodySystemCalculations(): readonly SystemQuantitativeCalculation[] {
  const coupled = executeCrossOrganCoupledSimulation({ scenarioId: "BASELINE_HOMEOSTASIS" });
  const hepato = simulateHepatobiliaryPancreaticPostprandialDynamics({
    fastingPlasmaGlucoseMgDl: 84,
    fastingInsulinUiuMl: 6.2,
    ingestedCarbohydrateGrams: 50,
    ingestedProteinGrams: 35,
    ingestedFatGrams: 18,
    minutesPostprandial: 45
  });

  // Endocrine HOMA-IR = (Glucose_mg/dL * Insulin_uIU/mL) / 405
  const homaIr = Number(((84 * 6.2) / 405).toFixed(2));
  // Hematological CaO2 = (alpha_Hb * Hb * SaO2) + (alpha_dissolved * PaO2)
  const hbGdl = 15.2;
  const saO2Frac = 0.98;
  const caO2MlDl = Number(oxygenContentMlDl(DEFAULT_OXYGEN_CONTENT_CONVENTION, hbGdl, saO2Frac, coupled.respiratoryAndAcidBase.arterialPo2MmHg).toFixed(2));
  // Lymphatic Systemic Immune-Inflammation Index (SII) = (Platelets * Neutrophils) / Lymphocytes
  const siiIndex = Math.round((250 * 3.8) / 2.2);
  // Reproductive Uteroplacental / Pelvic Arterial Resistance Index (RI) = (PSV - EDV) / PSV
  const dopplerRi = Number(((85 - 38) / 85).toFixed(2));

  return [
    {
      systemId: "MUSCULOSKELETAL_ARTICULAR",
      displayName: "Musculoskeletal / Articular",
      primaryFormula: "tau_joint = r x F_muscle ; ACWR = Load_7d / Load_28d",
      primaryMetricLabel: "Articular Bridges & MTP Windlass",
      primaryMetricValue: "36 Bridges · 91.4% Efficiency",
      secondaryMetricLabel: "Acute:Chronic Workload (ACWR)",
      secondaryMetricValue: "1.09x (Sweet Spot Safe)",
      authoritativeSource: "OpenSim Core / FreeMoCap / Z-Anatomy FMA:7161",
      outflowTargetPage: "PAGE_7_RECLUB_CLASSPASS_ARENA"
    },
    {
      systemId: "CARDIOVASCULAR_CIRCULATORY",
      displayName: "Cardiovascular / Circulatory",
      primaryFormula: "CO = HR * SV ; Q_graft = (pi * dP * r^4) / (8 * mu * L)",
      primaryMetricLabel: "Cardiac Output & MAP",
      primaryMetricValue: coupled.cardiovascular.cardiacOutputLMin + " L/min · " + coupled.cardiovascular.meanArterialPressureMmHg + " mmHg",
      secondaryMetricLabel: "Wiggers LV Phase & Pressure",
      secondaryMetricValue: coupled.cardiovascular.wiggersPhase + " (" + coupled.cardiovascular.lvPressureMmHg + " mmHg)",
      authoritativeSource: "Wiggers (1921) / AHA-17 / FMA:7088",
      outflowTargetPage: "PAGE_4_SURGICAL_SIMULATOR"
    },
    {
      systemId: "RESPIRATORY_PULMONARY",
      displayName: "Respiratory / Pulmonary",
      primaryFormula: "PAO2 = FiO2*(Patm - PH2O) - PaCO2/R ; V_dot_A = (VT - VD)*f",
      primaryMetricLabel: "Alveolar & Arterial PO2",
      primaryMetricValue: coupled.respiratoryAndAcidBase.alveolarPo2MmHg + " / " + coupled.respiratoryAndAcidBase.arterialPo2MmHg + " mmHg",
      secondaryMetricLabel: "Alveolar Ventilation & pH",
      secondaryMetricValue: coupled.respiratoryAndAcidBase.alveolarVentilationLMin + " L/min · pH " + coupled.respiratoryAndAcidBase.arterialPh,
      authoritativeSource: "West Respiratory Physiology / FMA:7158",
      outflowTargetPage: "PAGE_3_CLINICAL_ONE_OS_ICU"
    },
    {
      systemId: "NERVOUS_NEUROLOGICAL",
      displayName: "Nervous / Neurological",
      primaryFormula: "v_saltatory = 58.0 * myelinIntegrity ; Latency = L / v",
      primaryMetricLabel: "Saltatory Conduction Velocity",
      primaryMetricValue: coupled.neuroMuscularAndMicrovascular.saltatoryConductionVelocityMps + " m/s",
      secondaryMetricLabel: "1m Corticospinal Latency",
      secondaryMetricValue: coupled.neuroMuscularAndMicrovascular.oneMeterTractLatencyMs + " ms",
      authoritativeSource: "Hodgkin-Huxley / Waxman Myelin / FMA:7157",
      outflowTargetPage: "PAGE_5_MEDSCIHUB_PROMETHEUS"
    },
    {
      systemId: "RENAL_URINARY",
      displayName: "Renal / Urinary",
      primaryFormula: "GFR = Kf * [(P_GC - P_BS) - pi_GC] ; FE_Na = (U_Na*P_Cr)/(P_Na*U_Cr)",
      primaryMetricLabel: "Autoregulated GFR & NFP",
      primaryMetricValue: coupled.renalAndElectrolyte.estimatedGfrMlMin + " mL/min · NFP " + coupled.renalAndElectrolyte.netFiltrationPressureMmHg + " mmHg",
      secondaryMetricLabel: "Henle Countercurrent Osmolality",
      secondaryMetricValue: coupled.renalAndElectrolyte.finalUrineOsmolalityMosmKg + " mOsm/kg H2O",
      authoritativeSource: "Brenner & Rector / Starling / UBERON:0002113",
      outflowTargetPage: "PAGE_3_CLINICAL_ONE_OS_ICU"
    },
    {
      systemId: "GASTROINTESTINAL_HEPATOBILIARY",
      displayName: "Gastrointestinal / Hepatobiliary",
      primaryFormula: "Portal Insulin-Glucagon Kinetics & CCK Gallbladder Ejection",
      primaryMetricLabel: "Postprandial Glucose & Portal Insulin",
      primaryMetricValue: hepato.plasmaGlucoseMgDl + " mg/dL · " + hepato.portalVeinInsulinUiuMl + " uIU/mL",
      secondaryMetricLabel: "CCK Bile Ejection & Calot CVS",
      secondaryMetricValue: hepato.cholecystokininBileEjectionFractionPercent + "% EF · 3/3 Strasberg CVS",
      authoritativeSource: "Bergman Minimal Model / Strasberg CVS / FMA:7197",
      outflowTargetPage: "PAGE_4_SURGICAL_SIMULATOR"
    },
    {
      systemId: "ENDOCRINE_METABOLIC",
      displayName: "Endocrine / Metabolic",
      primaryFormula: "HOMA-IR = (Glucose * Insulin) / 405 ; AMPK/mTOR Flux",
      primaryMetricLabel: "Insulin Sensitivity (HOMA-IR)",
      primaryMetricValue: homaIr + " (Optimal Insulin Sensitive)",
      secondaryMetricLabel: "Circadian Cortisol-Melatonin Phase",
      secondaryMetricValue: "CAR +42% @ 06:30 · SCN Synchronized",
      authoritativeSource: "Matthews et al. (1985) / Reactome / FMA:9668",
      outflowTargetPage: "PAGE_2_YOUR_BODY_HEALTHSPAN"
    },
    {
      systemId: "LYMPHATIC_IMMUNE",
      displayName: "Lymphatic / Immune",
      primaryFormula: "SII = (P * N) / L ; J_lymph = Kf_lymph * (P_if - P_lymph)",
      primaryMetricLabel: "Systemic Immune-Inflammation (SII)",
      primaryMetricValue: siiIndex + " (Low Inflammatory Burden)",
      secondaryMetricLabel: "Thoracic Duct Lymphatic Return",
      secondaryMetricValue: "2.8 mL/min · 26 Nodal Chains Patent",
      authoritativeSource: "Cell Ontology CL:0000738 / FMA:74594",
      outflowTargetPage: "PAGE_3_CLINICAL_ONE_OS_ICU"
    },
    {
      systemId: "HEMATOLOGICAL_MARROW",
      displayName: "Hematological / Marrow",
      primaryFormula: "CaO2 = (alpha_Hb * Hb * SaO2) + (alpha_dissolved * PaO2)",
      primaryMetricLabel: "Arterial O2 Content (CaO2)",
      primaryMetricValue: caO2MlDl + " mL O2/dL (Hb " + hbGdl + " g/dL)",
      secondaryMetricLabel: "Krogh Microvascular Tissue PO2",
      secondaryMetricValue: coupled.neuroMuscularAndMicrovascular.tissuePo2MmHg + " mmHg (Normoxic)",
      authoritativeSource: "Krogh (1919) / ASH Hematology / FMA:9608",
      outflowTargetPage: "PAGE_1_BODY_EXPOSURE_UHD"
    },
    {
      systemId: "REPRODUCTIVE_OBSTETRIC",
      displayName: "Reproductive",
      primaryFormula: "RI_doppler = (PSV - EDV) / PSV ; HPG Pulsatile GnRH",
      primaryMetricLabel: "Pelvic / Uterine Arterial Doppler RI",
      primaryMetricValue: dopplerRi + " (Low-Resistance Perfusion)",
      secondaryMetricLabel: "Gonadal-Endocrine Axis Reserve",
      secondaryMetricValue: "Eugonadal Pulsatility Verified",
      authoritativeSource: "ISUOG Doppler Guidelines / FMA:7160",
      outflowTargetPage: "PAGE_5_MEDSCIHUB_PROMETHEUS"
    },
    {
      systemId: "INTEGUMENTARY_SENSORY_ENT",
      displayName: "Sensory / ENT & Integumentary",
      primaryFormula: "PTA_dB = (dB_500 + dB_1000 + dB_2000 + dB_4000)/4 ; LogMAR",
      primaryMetricLabel: "Cochlear PTA & Visual LogMAR",
      primaryMetricValue: "8.5 dB HL (Normal) · LogMAR 0.00 (20/20)",
      secondaryMetricLabel: "Dermal Barrier TEWL & Thermoregulation",
      secondaryMetricValue: "6.4 g/m2/h · 36.6 C Homeostasis",
      authoritativeSource: "AAO-HNS / ICO Visual Standards / FMA:72979",
      outflowTargetPage: "PAGE_5_MEDSCIHUB_PROMETHEUS"
    }
  ];
}

export interface MasterPageWorkflowContract {
  readonly pageId: PanaceaMasterPageId;
  readonly title: string;
  readonly subtitle: string;
  readonly inflowSources: readonly string[];
  readonly activeEnginesAndCalculations: readonly string[];
  readonly outflowDestinations: readonly string[];
  readonly authoritativeResources: readonly string[];
}

export const SEVEN_PAGE_MASTER_WORKFLOW_MATRIX: readonly MasterPageWorkflowContract[] = [
  {
    pageId: "PAGE_1_BODY_EXPOSURE_UHD",
    title: "Body Exposure ∞ — Single-Projectile UHD Computational Human",
    subtitle: "11 Canonical Systems · Grounded Subsurface Silhouette · 36 Articular Capsules · Zero Clipping",
    inflowSources: ["Z-Anatomy FMA/UBERON Registry", "Cross-Organ Physiological Coupling Engine", "Anti-Clipping Camera Frustum Solver"],
    activeEnginesAndCalculations: ["computeAntiClippingGroundedViewportGeometry()", "computeAllElevenBodySystemCalculations()", "executeCrossOrganCoupledSimulation()"],
    outflowDestinations: ["Stage 2 Organ Focus", "Page 4 Surgical Simulator", "Page 5 MedSciHub Case Mastery"],
    authoritativeResources: ["https://z-anatomy.com", "https://obofoundry.org/ontology/uberon.html", "https://www.rcsb.org"]
  },
  {
    pageId: "PAGE_2_YOUR_BODY_HEALTHSPAN",
    title: "Your Body — Longitudinal Healthspan Portfolio (PANACEA-LHID)",
    subtitle: "Athlytic/Whoop Recovery Rings · 5 Vitality Axes · PhenoAge Epigenetic Clock · GPS & Food Vision",
    inflowSources: ["UDT-OS Wearable Stream (HRV/SpO2/CGM)", "GPS Haversine Tracker", "AI Food Photo Macro Scanner"],
    activeEnginesAndCalculations: ["computeYourBodyHealthspanPortfolio()", "computePhenoAgeAndExposomeTrajectory()", "evaluateGpsWorkoutSession()"],
    outflowDestinations: ["Page 7 Reclub/ClassPass Smart Matchmaker", "Page 1 Body Exposure Organ Impact"],
    authoritativeResources: ["https://github.com/open-cgm/cgm-data-standards", "https://github.com/BioAge/PhenoAge-calculator", "https://open-meteo.com"]
  },
  {
    pageId: "PAGE_3_CLINICAL_ONE_OS_ICU",
    title: "Clinical One OS — Zero-Loss EMR, Sepsis 2026 & Pantheon ICU Consensus",
    subtitle: "11-Stage Idempotent Encounter · HMAC-SHA-256 DID · HL7 FHIR R4 Bundle · SSRF-Guarded DICOMweb",
    inflowSources: ["Pre-Visit Triage", "Bedside Vitals & Lactate", "Hospital PACS QIDO-RS/WADO-RS"],
    activeEnginesAndCalculations: ["executeOnePanaceaClinicalOsWorkflow()", "evaluateSepsis2026GuidelineCompliance()", "synthesizePantheonMultiSpecialtyConsensus()"],
    outflowDestinations: ["HL7 FHIR R4 Payer Claim", "Closed-Loop Specialist Referral", "Page 6 KaloLumen 3DCG"],
    authoritativeResources: ["https://hl7.org/fhir/R4/bundle.html", "https://www.survivingsepsis.org", "https://www.snomed.org"]
  },
  {
    pageId: "PAGE_4_SURGICAL_SIMULATOR",
    title: "Universal Surgical & Procedural Simulator (CABG & Laparoscopic CVS)",
    subtitle: "LIMA-to-LAD Poiseuille Bypass Flow · Phrenic Nerve Guard · Strasberg Critical View of Safety",
    inflowSources: ["Body Exposure FMA:3862 (LAD) & FMA:7197 (Biliary Tree)", "Wiggers Hemodynamic Monitor"],
    activeEnginesAndCalculations: ["evaluateCabgEducationalSurgicalSimulation()", "evaluateLaparoscopicCholecystectomyCriticalViewOfSafety()"],
    outflowDestinations: ["Page 5 Prometheus Procedural Assessment", "Saved Surgical Replay Vault"],
    authoritativeResources: ["https://github.com/opensim-org/opensim-core", "Strasberg CVS Guidelines", "Poiseuille Laminar Flow Model"]
  },
  {
    pageId: "PAGE_5_MEDSCIHUB_PROMETHEUS",
    title: "MedSciHub × Prometheus — 6-Depth Medical Education & OSCE Station Hub",
    subtitle: "Public to Professor Projections · FSRS Spaced Retrieval · 2PL-IRT Adaptive Psychometrics · SHA-256 SVG Media",
    inflowSources: ["EDU-1..EDU-6 Competency DAG", "Body Exposure Selected Structure", "ICD-11 & SNOMED-CT Syllabus"],
    activeEnginesAndCalculations: ["projectDiseaseConceptByDepthMode()", "executeAndPersistBodyExposurePrometheusJourney()", "scheduleFsrsRetrievalReview()"],
    outflowDestinations: ["Persistent Learner Mastery Vault", "Return to Body Exposure Exact Camera Coordinates"],
    authoritativeResources: ["https://reactome.org", "https://www.proteinatlas.org", "https://github.com/open-spaced-repetition"]
  },
  {
    pageId: "PAGE_6_KALOLUMEN_DICOM_3DCG",
    title: "KaloLumen <10s DICOM 3DCG & Quantum Protein/FastPLM Folding Lab",
    subtitle: "3-Layer Independent Cross-Section (Skin/Myocardium/Bone) · MedMLX · ESMFold2/BindCraft2",
    inflowSources: ["Local/DICOMweb CT/MRI Slices", "UniProt / RCSB PDB Sequences"],
    activeEnginesAndCalculations: ["reconstructPhotorealistic3DCGFromDicomFolder()", "predictStructureWithFastPlmAndWebGpu()", "designDeNovoBinderAndRunProteinFighter()"],
    outflowDestinations: ["Page 1 Body Exposure 3D Overlay", "Page 7 ProteinFighter Arena"],
    authoritativeResources: ["https://github.com/cornerstonejs/cornerstone3D", "https://github.com/facebookresearch/esm", "https://ohif.org"]
  },
  {
    pageId: "PAGE_7_RECLUB_CLASSPASS_ARENA",
    title: "Panacea Club & Studio Pass (Reclub × ClassPass × ACWR Biology)",
    subtitle: "The Forum Sports Hub Bintaro Football · Senopati Padel · Nordic Sauna/Cold Plunge · ACWR Injury Guard",
    inflowSources: ["Page 2 Recovery Readiness %", "Banister 7d:28d TRIMP ACWR", "FreeMoCap 3D Gait Symmetry"],
    activeEnginesAndCalculations: ["matchReclubAndClassPassSessionsToBiology()", "calculateSafeAcuteChronicWorkloadRatio()", "analyzeFootStrikeAndMtpArticulation()"],
    outflowDestinations: ["Instant Club Pass Booking", "Post-Session Strain & Net Calorie Rebalancing"],
    authoritativeResources: ["https://bjsm.bmj.com/content/50/5/273", "https://github.com/freemocap/freemocap"]
  }
];