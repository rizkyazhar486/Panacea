// @panacea-claim-boundary: educational-simulation-only
import {
  TWENTY_FIVE_COUPLED_PHYSIOLOGICAL_SCENARIOS,
  computeCompletePhysiologicalMathematicsSuite,
  type CoupledPhysiologicalScenarioId,
} from '../../domains/body-exposure/engine/physiology/multiscaleCoupledOrganPhysiologyAndMathSolverEngine.ts'
import {
  computeAlveolarGasAndAaGradient,
  computeHemodynamics,
  computeHillOccupancy,
} from '../../domains/body-exposure/omnicausalis-multiscale-bridge.ts'
import { deriveAcidBaseCoupling } from '../../lib/physiology/acidBaseCoupling.ts'
import { deriveBaroreflexDirection } from '../../lib/physiology/baroreflexCoupling.ts'
import { DEFAULT_OXYGEN_CONTENT_CONVENTION, oxygenContentMlDl } from '../../lib/physiology/oxygenContentConventions.ts'
import { deriveMeanArterialPressure } from '../../lib/physiology/pressureFlowCoupling.ts'
import { MESH_TO_ONTOLOGY_MAP } from './anatomyOntologyRegistry.ts'
import {
  DEMOGRAPHIC_COHORTS,
  synthesizeAnthropometryManifold,
  type AnthropometryManifold,
  type DemographicCohortId,
} from './demographicManifold.ts'
import {
  computeReceptorOccupancy,
  simulateFirstOrderPharmacokinetics,
  type CausalRelationType,
} from './multiscaleRealityGraph.ts'

export type MultiorganScenarioCategory =
  | 'normal'
  | 'cardiopulmonary'
  | 'critical_care'
  | 'metabolic_renal'
  | 'sports_environmental'

export interface MultiorganScenarioSpec {
  readonly id: CoupledPhysiologicalScenarioId
  readonly label: string
  readonly category: MultiorganScenarioCategory
  readonly primaryMeshId: string
  readonly shortSummary: string
  readonly edvFactor: number
  readonly inotropyFactor: number
  readonly svrFactor: number
  readonly hrOffset: number
  readonly ventilationFactor: number
  readonly vqMismatchMmHg: number
  readonly metabolicAcidLoadMmolL: number
  readonly metabolicDemandFactor: number
  readonly coreTempC: number
  readonly insulinActivityFactor: number
  readonly potassiumOffsetMmolL: number
  readonly renalVascularResistanceFactor: number
}

export interface MultiorganInterventionsInput {
  readonly fluidBolusMl?: number
  readonly vasopressorGain?: number
  readonly fiO2Fraction?: number
  readonly inotropyGain?: number
}

export interface MultiorganSimulationInput {
  readonly scenarioId: CoupledPhysiologicalScenarioId
  readonly cohortId?: DemographicCohortId
  readonly gestationalWeek?: number
  readonly interventions?: MultiorganInterventionsInput
}

export interface MultiorganTimepoint {
  readonly minute: number
  readonly hrBpm: number
  readonly edvMl: number
  readonly esvMl: number
  readonly svMl: number
  readonly efPct: number
  readonly coLMin: number
  readonly cvpMmHg: number
  readonly svrDynSecCm5: number
  readonly mapMmHg: number
  readonly minuteVentilationLMin: number
  readonly alveolarPO2MmHg: number
  readonly paO2MmHg: number
  readonly paCO2MmHg: number
  readonly aaGradientMmHg: number
  readonly p50MmHg: number
  readonly spo2Pct: number
  readonly renalBloodFlowMlMin: number
  readonly gfrMlMin: number
  readonly raasActivation0to1: number
  readonly urineOutputMlHr: number
  readonly potassiumMmolL: number
  readonly nernstPotassiumMv: number
  readonly hco3MmolL: number
  readonly arterialPh: number
  readonly lactateMmolL: number
  readonly glucoseMgDl: number
  readonly do2MlMin: number
  readonly vo2MlMin: number
  readonly o2ExtractionRatio: number
  readonly baroreceptorDrive0to1: number
  readonly sympatheticTone0to1: number
  readonly vagalTone0to1: number
}

export interface EtCausalisEdge {
  readonly edgeId: string
  readonly fromMeshId: string
  readonly toMeshId: string
  readonly fromLabel: string
  readonly toLabel: string
  readonly relationKind: 'causal' | 'mechanistic' | 'physiological' | 'pharmacological'
  readonly canonicalRelation: CausalRelationType
  readonly feedbackPolarity: 'negative_compensatory' | 'positive_maladaptive' | 'direct_feedforward'
  readonly direction: 'increase' | 'decrease' | 'stable'
  readonly magnitudePct: number
  readonly timeDelayMin: number
  readonly mechanism: string
  readonly evidenceCitation: string
  readonly uncertainty0to1: number
}

export interface MultiorganSimulationResult {
  readonly scenario: MultiorganScenarioSpec
  readonly cohort: AnthropometryManifold
  readonly timeline: readonly MultiorganTimepoint[]
  readonly baselineEnd: MultiorganTimepoint
  readonly finalState: MultiorganTimepoint
  readonly causalEdges: readonly EtCausalisEdge[]
  readonly truthClass: 'SIMULATED_EDUCATIONAL'
  readonly clinicallyReviewed: false
  readonly assumptions: readonly string[]
  readonly limitations: readonly string[]
  readonly disclaimer: string
}

export interface EducationalPkPdResult {
  readonly plasmaConcentrationMgL: number
  readonly halfLifeHours: number
  readonly receptorOccupancyPct: number
  readonly truthClass: 'SIMULATED_EDUCATIONAL'
  readonly clinicallyReviewed: false
}

const TIME_POINTS_MIN = [0, 5, 15, 30, 60, 90, 120] as const

const SCENARIO_SEEDS: readonly MultiorganScenarioSpec[] = [
  {
    id: '1_RESTING_HOMEOSTASIS', label: 'Resting Homeostasis', category: 'normal', primaryMeshId: 'Left ventricle',
    shortSummary: 'Steady-state basal equilibrium across cardiac, respiratory, renal, and acid-base compartments.',
    edvFactor: 1.0, inotropyFactor: 1.0, svrFactor: 1.0, hrOffset: 0, ventilationFactor: 1.0, vqMismatchMmHg: 6,
    metabolicAcidLoadMmolL: 0, metabolicDemandFactor: 1.0, coreTempC: 37.0, insulinActivityFactor: 1.0, potassiumOffsetMmolL: 0, renalVascularResistanceFactor: 1.0,
  },
  {
    id: '2_AEROBIC_EXERCISE', label: 'Aerobic Exercise (Moderate-Vigorous)', category: 'sports_environmental', primaryMeshId: 'Rectus abdominis muscle.l',
    shortSummary: 'Increased venous return, sympathetic chronotropy/inotropy, hyperpnea matching CO2, and high VO2.',
    edvFactor: 1.15, inotropyFactor: 1.38, svrFactor: 0.62, hrOffset: 68, ventilationFactor: 2.8, vqMismatchMmHg: 8,
    metabolicAcidLoadMmolL: 1.4, metabolicDemandFactor: 3.1, coreTempC: 37.9, insulinActivityFactor: 1.25, potassiumOffsetMmolL: 0.35, renalVascularResistanceFactor: 1.35,
  },
  {
    id: '3_POST_EXERCISE_RECOVERY', label: 'Post-Exercise EPOC Recovery', category: 'sports_environmental', primaryMeshId: 'Vagus nerve (X).l',
    shortSummary: 'Vagal reactivation clearing lactate debt while cutaneous vasodilation restores thermal balance.',
    edvFactor: 1.02, inotropyFactor: 1.1, svrFactor: 0.86, hrOffset: 16, ventilationFactor: 1.3, vqMismatchMmHg: 7,
    metabolicAcidLoadMmolL: 0.6, metabolicDemandFactor: 1.28, coreTempC: 37.4, insulinActivityFactor: 1.15, potassiumOffsetMmolL: 0.1, renalVascularResistanceFactor: 1.08,
  },
  {
    id: '4_ISOTONIC_DEHYDRATION', label: 'Isotonic Volume Depletion', category: 'metabolic_renal', primaryMeshId: 'Kidney.l',
    shortSummary: 'Preload reduction triggering baroreflex tachycardia and antidiuretic/RAAS sodium retention.',
    edvFactor: 0.80, inotropyFactor: 1.04, svrFactor: 1.20, hrOffset: 16, ventilationFactor: 1.05, vqMismatchMmHg: 7,
    metabolicAcidLoadMmolL: 0.4, metabolicDemandFactor: 1.02, coreTempC: 37.1, insulinActivityFactor: 0.95, potassiumOffsetMmolL: 0.15, renalVascularResistanceFactor: 1.28,
  },
  {
    id: '5_CRYSTALLOID_VOLUME_EXPANSION', label: 'Crystalloid Preload Expansion', category: 'critical_care', primaryMeshId: 'Ascending aorta',
    shortSummary: 'Frank-Starling stroke volume recruitment with diluted hematocrit and reduced RAAS tone.',
    edvFactor: 1.18, inotropyFactor: 1.02, svrFactor: 0.90, hrOffset: -4, ventilationFactor: 1.0, vqMismatchMmHg: 7,
    metabolicAcidLoadMmolL: 0.2, metabolicDemandFactor: 1.0, coreTempC: 36.9, insulinActivityFactor: 1.0, potassiumOffsetMmolL: -0.1, renalVascularResistanceFactor: 0.88,
  },
  {
    id: '6_ACUTE_HEMORRHAGE_CLASS_II', label: 'Acute Hemorrhage (Class II)', category: 'critical_care', primaryMeshId: 'Ascending aorta',
    shortSummary: 'Venous return loss falling below Starling reserve, driving strong sympathetic & RAAS compensation.',
    edvFactor: 0.54, inotropyFactor: 1.0, svrFactor: 1.15, hrOffset: 22, ventilationFactor: 1.12, vqMismatchMmHg: 11,
    metabolicAcidLoadMmolL: 2.0, metabolicDemandFactor: 1.08, coreTempC: 36.6, insulinActivityFactor: 0.82, potassiumOffsetMmolL: 0.25, renalVascularResistanceFactor: 1.65,
  },
  {
    id: '7_ALVEOLAR_HYPOXEMIA', label: 'Alveolar Hypoxemia / V/Q Shunt', category: 'cardiopulmonary', primaryMeshId: 'Inferior lobe of left lung',
    shortSummary: 'Widened A-a oxygen gradient depressing arterial PO2 and driving hypoxic sympathetic drive.',
    edvFactor: 0.98, inotropyFactor: 1.06, svrFactor: 1.08, hrOffset: 18, ventilationFactor: 1.48, vqMismatchMmHg: 52,
    metabolicAcidLoadMmolL: 1.1, metabolicDemandFactor: 1.06, coreTempC: 37.0, insulinActivityFactor: 0.96, potassiumOffsetMmolL: 0.1, renalVascularResistanceFactor: 1.15,
  },
  {
    id: '8_ACUTE_HYPERCAPNIA', label: 'Acute Hypoventilation / Hypercapnia', category: 'cardiopulmonary', primaryMeshId: 'Trachea',
    shortSummary: 'Depressed alveolar ventilation elevates PaCO2 and shifts arterial pH toward acute respiratory acidemia.',
    edvFactor: 1.04, inotropyFactor: 0.96, svrFactor: 0.88, hrOffset: 12, ventilationFactor: 0.56, vqMismatchMmHg: 18,
    metabolicAcidLoadMmolL: 0, metabolicDemandFactor: 1.0, coreTempC: 37.0, insulinActivityFactor: 0.95, potassiumOffsetMmolL: 0.3, renalVascularResistanceFactor: 1.18,
  },
  {
    id: '9_BRONCHOSPASM_AIRWAY_OBSTRUCTION', label: 'Acute Bronchospasm / High Airway Resistance', category: 'cardiopulmonary', primaryMeshId: 'Trachea',
    shortSummary: 'Airflow limitation & V/Q heterogeneity increase work of breathing and lower effective alveolar ventilation.',
    edvFactor: 0.95, inotropyFactor: 1.08, svrFactor: 1.10, hrOffset: 24, ventilationFactor: 0.72, vqMismatchMmHg: 34,
    metabolicAcidLoadMmolL: 0.8, metabolicDemandFactor: 1.25, coreTempC: 37.1, insulinActivityFactor: 0.92, potassiumOffsetMmolL: 0.1, renalVascularResistanceFactor: 1.12,
  },
  {
    id: '10_SYSTOLIC_HEART_FAILURE_HFrEF', label: 'Systolic Heart Failure (HFrEF Cardiorenal)', category: 'cardiopulmonary', primaryMeshId: 'Left ventricle',
    shortSummary: 'Depressed myocardial inotropy lowers EF & CO, reducing renal perfusion and activating maladaptive RAAS.',
    edvFactor: 1.38, inotropyFactor: 0.40, svrFactor: 1.34, hrOffset: 14, ventilationFactor: 1.22, vqMismatchMmHg: 24,
    metabolicAcidLoadMmolL: 1.5, metabolicDemandFactor: 1.06, coreTempC: 36.8, insulinActivityFactor: 0.9, potassiumOffsetMmolL: 0.3, renalVascularResistanceFactor: 1.75,
  },
  {
    id: '11_SYSTEMIC_HYPERTENSION_AFTERLOAD', label: 'Systemic Hypertension (High Afterload)', category: 'cardiopulmonary', primaryMeshId: 'Ascending aorta',
    shortSummary: 'Elevated arteriolar SVR forces higher ventricular wall stress with chronic baroreflex adaptation.',
    edvFactor: 1.02, inotropyFactor: 1.05, svrFactor: 1.62, hrOffset: -4, ventilationFactor: 1.0, vqMismatchMmHg: 8,
    metabolicAcidLoadMmolL: 0, metabolicDemandFactor: 1.05, coreTempC: 37.0, insulinActivityFactor: 0.95, potassiumOffsetMmolL: 0, renalVascularResistanceFactor: 1.30,
  },
  {
    id: '12_PYROGENIC_FEVER', label: 'Pyrogenic Fever (Hypermetabolic 39.4 C)', category: 'critical_care', primaryMeshId: 'Adenohypophysis',
    shortSummary: 'Hypothalamic set-point rise accelerates VO2, heart rate, and minute ventilation with mild vasodilation.',
    edvFactor: 1.0, inotropyFactor: 1.16, svrFactor: 0.78, hrOffset: 30, ventilationFactor: 1.35, vqMismatchMmHg: 10,
    metabolicAcidLoadMmolL: 0.4, metabolicDemandFactor: 1.36, coreTempC: 39.4, insulinActivityFactor: 0.88, potassiumOffsetMmolL: 0.1, renalVascularResistanceFactor: 1.05,
  },
  {
    id: '13_SEPSIS_VASODILATION', label: 'Septic Distributive Vasodilation', category: 'critical_care', primaryMeshId: 'Liver',
    shortSummary: 'Endothelial NO-mediated SVR collapse causes distributive hypotension, lactic acidosis, and oliguria.',
    edvFactor: 0.88, inotropyFactor: 0.90, svrFactor: 0.46, hrOffset: 34, ventilationFactor: 1.24, vqMismatchMmHg: 28,
    metabolicAcidLoadMmolL: 3.4, metabolicDemandFactor: 1.38, coreTempC: 39.1, insulinActivityFactor: 0.70, potassiumOffsetMmolL: 0.45, renalVascularResistanceFactor: 1.55,
  },
  {
    id: '14_PRERENAL_OLIGURIA', label: 'Prerenal Hypoperfusion & Oliguria', category: 'metabolic_renal', primaryMeshId: 'Kidney.r',
    shortSummary: 'Effective circulating volume contraction below renal autoregulation lowers GFR & urine output.',
    edvFactor: 0.76, inotropyFactor: 1.0, svrFactor: 1.24, hrOffset: 14, ventilationFactor: 1.05, vqMismatchMmHg: 8,
    metabolicAcidLoadMmolL: 1.6, metabolicDemandFactor: 0.98, coreTempC: 36.9, insulinActivityFactor: 0.95, potassiumOffsetMmolL: 0.65, renalVascularResistanceFactor: 1.95,
  },
  {
    id: '15_POSTPRANDIAL_HYPERGLYCEMIA', label: 'Postprandial Glycemic Load', category: 'metabolic_renal', primaryMeshId: 'Pancreas',
    shortSummary: 'Enteral glucose excursion triggers pancreatic insulin surge and modest splanchnic hyperemia.',
    edvFactor: 1.04, inotropyFactor: 1.04, svrFactor: 0.90, hrOffset: 6, ventilationFactor: 1.04, vqMismatchMmHg: 6,
    metabolicAcidLoadMmolL: 0.1, metabolicDemandFactor: 1.08, coreTempC: 37.1, insulinActivityFactor: 0.55, potassiumOffsetMmolL: -0.2, renalVascularResistanceFactor: 0.96,
  },
  {
    id: '16_INSULIN_INDUCED_HYPOGLYCEMIA', label: 'Adrenergic Hypoglycemia (< 55 mg/dL)', category: 'metabolic_renal', primaryMeshId: 'Suprarenal gland.l',
    shortSummary: 'Counter-regulatory epinephrine surge drives tremor, diaphoresis, tachycardia, and hypokalemic shift.',
    edvFactor: 1.0, inotropyFactor: 1.24, svrFactor: 0.92, hrOffset: 28, ventilationFactor: 1.18, vqMismatchMmHg: 7,
    metabolicAcidLoadMmolL: 0.2, metabolicDemandFactor: 1.12, coreTempC: 36.7, insulinActivityFactor: 2.30, potassiumOffsetMmolL: -0.65, renalVascularResistanceFactor: 1.05,
  },
  {
    id: '17_HIGH_ANION_GAP_METABOLIC_ACIDOSIS', label: 'High Anion-Gap Metabolic Acidosis', category: 'metabolic_renal', primaryMeshId: 'Kidney.l',
    shortSummary: 'Organic acid accumulation depletes HCO3-, inducing deep compensatory hyperpnea & rightward Bohr shift.',
    edvFactor: 0.90, inotropyFactor: 0.90, svrFactor: 0.95, hrOffset: 20, ventilationFactor: 1.38, vqMismatchMmHg: 10,
    metabolicAcidLoadMmolL: 9.2, metabolicDemandFactor: 1.10, coreTempC: 37.0, insulinActivityFactor: 0.65, potassiumOffsetMmolL: 0.85, renalVascularResistanceFactor: 1.40,
  },
  {
    id: '18_ACUTE_RESPIRATORY_ACIDOSIS', label: 'Acute Respiratory Acidosis', category: 'cardiopulmonary', primaryMeshId: 'Inferior lobe of right lung',
    shortSummary: 'Uncompensated CO2 retention depresses arterial pH prior to delayed multi-day renal HCO3- retention.',
    edvFactor: 1.03, inotropyFactor: 0.95, svrFactor: 0.86, hrOffset: 10, ventilationFactor: 0.50, vqMismatchMmHg: 22,
    metabolicAcidLoadMmolL: -0.5, metabolicDemandFactor: 0.98, coreTempC: 37.0, insulinActivityFactor: 0.96, potassiumOffsetMmolL: 0.35, renalVascularResistanceFactor: 1.14,
  },
  {
    id: '19_HYPERVENTILATION_RESPIRATORY_ALKALOSIS', label: 'Hyperventilation Respiratory Alkalosis', category: 'cardiopulmonary', primaryMeshId: 'Diaphragm',
    shortSummary: 'Excess CO2 washout raises arterial pH > 7.45, left-shifts Hb ODC, and induces cerebral/coronary tone shifts.',
    edvFactor: 0.96, inotropyFactor: 1.04, svrFactor: 1.08, hrOffset: 14, ventilationFactor: 1.88, vqMismatchMmHg: 5,
    metabolicAcidLoadMmolL: 0.2, metabolicDemandFactor: 1.05, coreTempC: 37.0, insulinActivityFactor: 1.0, potassiumOffsetMmolL: -0.35, renalVascularResistanceFactor: 1.05,
  },
  {
    id: '20_VOMITING_METABOLIC_ALKALOSIS', label: 'Gastric Loss Metabolic Alkalosis', category: 'metabolic_renal', primaryMeshId: 'Stomach',
    shortSummary: 'HCl loss elevates serum HCO3- and arterial pH, hypoventilation partially compensates alongside hypokalemia.',
    edvFactor: 0.88, inotropyFactor: 1.0, svrFactor: 1.10, hrOffset: 10, ventilationFactor: 0.82, vqMismatchMmHg: 7,
    metabolicAcidLoadMmolL: -6.5, metabolicDemandFactor: 0.96, coreTempC: 37.0, insulinActivityFactor: 1.0, potassiumOffsetMmolL: -0.80, renalVascularResistanceFactor: 1.15,
  },
  {
    id: '21_ENVIRONMENTAL_HEAT_STRESS', label: 'Environmental Heat Stress (40 C)', category: 'sports_environmental', primaryMeshId: 'Umbilical region.l',
    shortSummary: 'Cutaneous shunting reduces SVR & central preload while tachycardia & sweat loss strain renal flow.',
    edvFactor: 0.82, inotropyFactor: 1.15, svrFactor: 0.68, hrOffset: 32, ventilationFactor: 1.24, vqMismatchMmHg: 8,
    metabolicAcidLoadMmolL: 0.5, metabolicDemandFactor: 1.22, coreTempC: 38.8, insulinActivityFactor: 1.0, potassiumOffsetMmolL: -0.15, renalVascularResistanceFactor: 1.38,
  },
  {
    id: '22_COLD_THERMOGENESIS', label: 'Cold Peripheral Vasoconstriction', category: 'sports_environmental', primaryMeshId: 'Zygomatic region.l',
    shortSummary: 'Alpha-adrenergic skin vasoconstriction raises central preload and SVR while shivering doubles VO2.',
    edvFactor: 1.10, inotropyFactor: 1.08, svrFactor: 1.42, hrOffset: 8, ventilationFactor: 1.28, vqMismatchMmHg: 7,
    metabolicAcidLoadMmolL: 0.4, metabolicDemandFactor: 1.55, coreTempC: 35.6, insulinActivityFactor: 1.05, potassiumOffsetMmolL: 0.05, renalVascularResistanceFactor: 0.92,
  },
  {
    id: '23_SLOW_WAVE_SLEEP_PARASYMPATHETIC', label: 'Slow-Wave Sleep Parasympathetic', category: 'normal', primaryMeshId: 'Vagus nerve (X).l',
    shortSummary: 'Vagal dominance reduces HR, SVR, MAP, and metabolic demand while maximizing nocturnal recovery.',
    edvFactor: 1.04, inotropyFactor: 0.90, svrFactor: 0.86, hrOffset: -16, ventilationFactor: 0.88, vqMismatchMmHg: 6,
    metabolicAcidLoadMmolL: -0.1, metabolicDemandFactor: 0.78, coreTempC: 36.4, insulinActivityFactor: 1.05, potassiumOffsetMmolL: -0.05, renalVascularResistanceFactor: 0.94,
  },
  {
    id: '24_SYMPATHOADRENAL_STRESS_FIGHT_FLIGHT', label: 'Acute Sympathoadrenal Surge', category: 'normal', primaryMeshId: 'Suprarenal gland.l',
    shortSummary: 'Combined alpha/beta catecholamine surge raises chronotropy, inotropy, glucose, and vascular tone.',
    edvFactor: 0.94, inotropyFactor: 1.34, svrFactor: 1.28, hrOffset: 42, ventilationFactor: 1.52, vqMismatchMmHg: 9,
    metabolicAcidLoadMmolL: 0.9, metabolicDemandFactor: 1.40, coreTempC: 37.3, insulinActivityFactor: 0.74, potassiumOffsetMmolL: -0.25, renalVascularResistanceFactor: 1.32,
  },
  {
    id: '25_CHRONIC_ENDURANCE_ADAPTATION', label: 'Endurance Athlete Vagal Remodeling', category: 'sports_environmental', primaryMeshId: 'Left ventricle',
    shortSummary: 'Eccentric LV remodeling enlarges EDV & stroke volume with resting bradycardia and low resting extraction.',
    edvFactor: 1.28, inotropyFactor: 1.12, svrFactor: 0.88, hrOffset: -22, ventilationFactor: 1.02, vqMismatchMmHg: 5,
    metabolicAcidLoadMmolL: 0, metabolicDemandFactor: 1.0, coreTempC: 36.9, insulinActivityFactor: 1.22, potassiumOffsetMmolL: 0, renalVascularResistanceFactor: 0.95,
  },
]

const SPEC_MAP = new Map<CoupledPhysiologicalScenarioId, MultiorganScenarioSpec>(
  SCENARIO_SEEDS.map((s) => [s.id, Object.freeze(s)]),
)

export const MULTIORGAN_SCENARIO_SPECS: readonly MultiorganScenarioSpec[] = Object.freeze(
  TWENTY_FIVE_COUPLED_PHYSIOLOGICAL_SCENARIOS.map((id) => {
    const found = SPEC_MAP.get(id)
    if (!found) throw new Error(`Missing multiorgan scenario spec for ${id}`)
    return found
  }),
)

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const r1 = (v: number) => Math.round(v * 10) / 10
const r2 = (v: number) => Math.round(v * 100) / 100
const r3 = (v: number) => Math.round(v * 1000) / 1000

function buildManifoldForCohort(cohortId: DemographicCohortId, gestationalWeek?: number): AnthropometryManifold {
  const spec = DEMOGRAPHIC_COHORTS[cohortId] ?? DEMOGRAPHIC_COHORTS.YAD_M
  let ageYears = 28
  if (cohortId.startsWith('NEO_')) ageYears = 0.03
  else if (cohortId.startsWith('INF_')) ageYears = 0.5
  else if (cohortId.startsWith('TOD_')) ageYears = 2.5
  else if (cohortId.startsWith('CHD_')) ageYears = 8
  else if (cohortId.startsWith('ADO_')) ageYears = 15
  else if (cohortId.startsWith('MAD_')) ageYears = 52
  else if (cohortId.startsWith('GER_')) ageYears = 74
  else if (cohortId.startsWith('LON_')) ageYears = 90
  else if (cohortId === 'MAT_PREG' || cohortId === 'MAT_POST') ageYears = 29

  const heightCm = ageYears < 0.1 ? 50 : ageYears < 1 ? 66 : ageYears < 4 ? 90 : ageYears < 12 ? 128 : spec.biologicalSex === 'male' ? 172 : 161
  const weightKg = ageYears < 0.1 ? 3.4 : ageYears < 1 ? 7.5 : ageYears < 4 ? 13 : ageYears < 12 ? 27 : spec.biologicalSex === 'male' ? 70 : 58

  return synthesizeAnthropometryManifold({
    ageYears,
    biologicalSex: spec.biologicalSex,
    heightCm,
    weightKg,
    gestationalWeek: cohortId === 'MAT_PREG' ? clamp(Math.round(gestationalWeek ?? 28), 1, 42) : undefined,
    postpartumWeek: cohortId === 'MAT_POST' ? 4 : undefined,
    preterm: cohortId === 'NEO_PRE_M' || cohortId === 'NEO_PRE_F',
  })
}

function cohortBaseline(manifold: AnthropometryManifold) {
  const wRatio = manifold.weightKg / 70
  const baseHr =
    manifold.chronologicalAgeYears < 0.1 ? 132
      : manifold.chronologicalAgeYears < 1 ? 120
        : manifold.chronologicalAgeYears < 4 ? 105
          : manifold.chronologicalAgeYears < 12 ? 88
            : manifold.chronologicalAgeYears < 18 ? 78
              : 70

  const pregCoGain = manifold.obstetricHemodynamics ? 1 + manifold.obstetricHemodynamics.cardiacOutputGainPct / 100 : 1
  const pregSvrFactor = manifold.obstetricHemodynamics ? 0.84 : 1
  const pregVentGain = manifold.obstetricHemodynamics ? 1.25 : 1
  const senescenceSvrFactor = 1 + manifold.senescenceVector.arterialCalcificationIndex * 0.28
  const senescenceGfrFactor = 1 - manifold.senescenceVector.frailtyIndex * 0.22

  const edvScale = clamp(Math.pow(wRatio, 0.92) * (manifold.obstetricHemodynamics ? 1.18 : 1), 0.08, 1.5)
  return {
    hrBpm: baseHr + (manifold.obstetricHemodynamics ? 10 : 0),
    edvMl: 120 * edvScale,
    esvMl: 50 * edvScale,
    svrDynSecCm5: 1280 * senescenceSvrFactor * pregSvrFactor / Math.max(0.25, Math.pow(wRatio, 0.72)),
    minuteVentilationLMin: 6.0 * Math.pow(wRatio, 0.75) * pregVentGain,
    hbGDl: manifold.chronologicalAgeYears < 0.1 ? 16.5 : manifold.obstetricHemodynamics ? 11.4 : manifold.biologicalSex === 'male' ? 14.8 : 13.4,
    gfrBaselineMlMin: 112 * Math.pow(wRatio, 0.75) * senescenceGfrFactor * (manifold.obstetricHemodynamics ? 1.35 : 1),
    rbfBaselineMlMin: 1080 * Math.pow(wRatio, 0.75) * senescenceGfrFactor,
    vo2BaselineMlMin: 250 * Math.pow(wRatio, 0.75) * pregCoGain,
    pregCoGain,
  }
}

function stepClosedLoopState(
  spec: MultiorganScenarioSpec,
  base: ReturnType<typeof cohortBaseline>,
  interventions: Required<MultiorganInterventionsInput>,
): MultiorganTimepoint[] {
  const points: MultiorganTimepoint[] = []
  let raasTone = 0.22
  let retainedFluidMl = interventions.fluidBolusMl * 0.35
  let baroSympCarry = 0
  const baseRestingCo = (base.hrBpm * (base.edvMl - base.esvMl)) / 1000

  for (let idx = 0; idx < TIME_POINTS_MIN.length; idx += 1) {
    const minute = TIME_POINTS_MIN[idx]
    const timeRamp = minute === 0 ? 0.35 : clamp(0.45 + (minute / 120) * 0.55, 0.35, 1)

    const bolusPreloadMl = interventions.fluidBolusMl * (minute <= 30 ? 0.45 : 0.30) * (1 / 1000) * 26
    const edvMl = clamp(
      base.edvMl * spec.edvFactor + bolusPreloadMl + retainedFluidMl * 0.012 + (idx === 0 ? 0 : raasTone * 4),
      10,
      260,
    )
    const effectiveInotropy = clamp(spec.inotropyFactor + interventions.inotropyGain * 0.45 + baroSympCarry * 0.08, 0.2, 2.2)
    const targetSvFraction = clamp(0.583 * effectiveInotropy, 0.18, 0.82)
    const esvMl = clamp(edvMl * (1 - targetSvFraction), 3, edvMl * 0.86)

    const hrBpm = clamp(base.hrBpm + spec.hrOffset * timeRamp + baroSympCarry * 14 - interventions.inotropyGain * 3, 34, 210)
    const vasopressorFactor = 1 + interventions.vasopressorGain * 0.65
    const svrDynSecCm5 = clamp(
      base.svrDynSecCm5 * spec.svrFactor * vasopressorFactor * (1 + raasTone * 0.16 + baroSympCarry * 0.10),
      350,
      4800,
    )
    const cvpMmHg = clamp(4 + (interventions.fluidBolusMl / 2000) * 4 + (spec.edvFactor - 1) * 5, 1, 22)

    const rawHemo = computeHemodynamics(hrBpm, edvMl, esvMl, 120, 80, cvpMmHg)
    const mapMmHg = clamp(deriveMeanArterialPressure(rawHemo.cardiacOutputLMin, svrDynSecCm5, cvpMmHg), 32, 200)

    const mapErrorRatio = mapMmHg >= 78 && mapMmHg <= 95 ? 0 : clamp((84 - mapMmHg) / 36, -1, 1)
    const baroDirection = deriveBaroreflexDirection(mapMmHg < 84 ? 'pressure-fall' : 'pressure-rise')
    const baroreceptorDrive0to1 = clamp(0.5 - mapErrorRatio * 0.4, 0, 1)
    const sympatheticTone0to1 = clamp(
      0.32 + (baroDirection.sympatheticDirection === 'increase' ? Math.max(0, mapErrorRatio) * 0.55 : mapErrorRatio * 0.2) + Math.max(0, spec.hrOffset) / 140,
      0.05,
      0.98,
    )
    const vagalTone0to1 = clamp(1 - sympatheticTone0to1 * 0.82, 0.05, 0.95)
    baroSympCarry = clamp(sympatheticTone0to1 - 0.32, -0.15, 0.5)

    const effectiveRbfFactor = mapMmHg >= 65 && mapMmHg <= 150
      ? 1.0 - (spec.renalVascularResistanceFactor - 1) * 0.38
      : mapMmHg < 65
        ? clamp(Math.pow(mapMmHg / 65, 1.55), 0.18, 1) / Math.max(0.7, spec.renalVascularResistanceFactor * 0.75)
        : 1.05
    const renalBloodFlowMlMin = clamp(base.rbfBaselineMlMin * effectiveRbfFactor * (rawHemo.cardiacOutputLMin / 4.9) ** 0.45, 80, 1800)
    const gfrMlMin = clamp(base.gfrBaselineMlMin * (renalBloodFlowMlMin / base.rbfBaselineMlMin) * (mapMmHg < 65 ? 0.82 : 1), 8, 175)

    const targetRaas = clamp(0.2 + clamp((base.rbfBaselineMlMin - renalBloodFlowMlMin) / base.rbfBaselineMlMin, 0, 1) * 0.78, 0.08, 0.98)
    raasTone = raasTone + (targetRaas - raasTone) * (idx === 0 ? 0.3 : 0.55)
    const urineOutputMlHr = clamp(65 * (gfrMlMin / base.gfrBaselineMlMin) * (1 - raasTone * 0.35) + (interventions.fluidBolusMl / 500) * 12, 4, 240)
    if (minute > 0) retainedFluidMl = clamp(retainedFluidMl + (raasTone - 0.22) * 180, 0, 1500)

    const hypoperfusionLactate = Math.max(0, (baseRestingCo * 0.78 - rawHemo.cardiacOutputLMin) * 1.1)
    const mitochondrialLactate = Math.max(0, spec.metabolicAcidLoadMmolL * 0.55 * timeRamp)
    const lactateMmolL = clamp(0.9 + hypoperfusionLactate + mitochondrialLactate, 0.5, 16)
    const hco3MmolL = clamp(24.0 - spec.metabolicAcidLoadMmolL * timeRamp - (lactateMmolL - 0.9) * 0.28, 6, 40)

    const minuteVentilationLMin = clamp(base.minuteVentilationLMin * spec.ventilationFactor * (1 + Math.max(0, 22 - hco3MmolL) * 0.015), 2.2, 48)
    const rawPaCO2 = 40 * (base.minuteVentilationLMin / minuteVentilationLMin)
    const wintersFloor = spec.metabolicAcidLoadMmolL >= 2.0 ? Math.max(18, 1.5 * hco3MmolL + 8) : 16
    const paCO2MmHg = clamp(Math.max(rawPaCO2, wintersFloor), 16, 85)

    const acidBase = deriveAcidBaseCoupling({
      bicarbonateMmolL: hco3MmolL,
      bicarbonateSource: 'arterial-blood-gas-bicarbonate',
      arterialPaco2MmHg: paCO2MmHg,
    })
    const arterialPh = clamp(acidBase.pH, 6.85, 7.72)

    const gasApprox = computeAlveolarGasAndAaGradient({
      fiO2Fraction: clamp(interventions.fiO2Fraction, 0.21, 1.0),
      paCO2MmHg,
      measuredPaO2MmHg: 95,
    })
    const alveolarPO2MmHg = gasApprox.value.alveolarPO2MmHg
    const paO2MmHg = clamp(alveolarPO2MmHg - spec.vqMismatchMmHg, 28, 620)
    const gasExact = computeAlveolarGasAndAaGradient({
      fiO2Fraction: clamp(interventions.fiO2Fraction, 0.21, 1.0),
      paCO2MmHg,
      measuredPaO2MmHg: paO2MmHg,
    })

    const p50MmHg = r2(26.8 * Math.pow(10, 0.48 * (7.4 - arterialPh)) * (1 + (spec.coreTempC - 37.0) * 0.02))
    const spo2Frac = clamp(computeHillOccupancy(paO2MmHg, p50MmHg, 2.7), 0.35, 1.0)
    const spo2Pct = r1(spo2Frac * 100)

    const caO2MlDl = oxygenContentMlDl(
      DEFAULT_OXYGEN_CONTENT_CONVENTION,
      { value: base.hbGDl, unit: 'g/dL' },
      spo2Frac,
      paO2MmHg,
    )
    const do2MlMin = clamp(caO2MlDl * rawHemo.cardiacOutputLMin * 10, 120, 2600)
    const vo2MlMin = clamp(base.vo2BaselineMlMin * spec.metabolicDemandFactor, 90, 1800)
    const o2ExtractionRatio = clamp(vo2MlMin / Math.max(120, do2MlMin), 0.1, 0.85)

    const potassiumMmolL = clamp(
      4.1 + spec.potassiumOffsetMmolL * timeRamp + Math.max(0, 7.35 - arterialPh) * 3.0 + (gfrMlMin < 35 ? 0.55 : 0),
      2.3,
      7.8,
    )
    const math = computeCompletePhysiologicalMathematicsSuite({
      extracellularPotassiumMmolL: potassiumMmolL,
      intracellularPotassiumMmolL: 145,
      arterialBicarbonateMmolL: hco3MmolL,
      arterialPaco2MmHg: paCO2MmHg,
      substrateConcentrationUmolL: 50,
      vmaxUmolMin: 120,
      kmUmolL: 25,
      drugDoseMg: 100,
      volumeOfDistributionL: 40,
      clearanceLPerHour: 6,
      elapsedHours: minute / 60,
      predictedProbabilities: [0.2],
      observedOutcomes0or1: [0],
    })

    const glucoseMgDl = clamp(96 + (spec.id === '15_POSTPRANDIAL_HYPERGLYCEMIA' ? 62 : 0) - (spec.insulinActivityFactor - 1) * 38, 42, 340)

    points.push(Object.freeze({
      minute,
      hrBpm: r1(hrBpm),
      edvMl: r1(edvMl),
      esvMl: r1(esvMl),
      svMl: r1(rawHemo.strokeVolumeMl),
      efPct: r1(rawHemo.ejectionFractionPercent),
      coLMin: r2(rawHemo.cardiacOutputLMin),
      cvpMmHg: r1(cvpMmHg),
      svrDynSecCm5: Math.round(svrDynSecCm5),
      mapMmHg: r1(mapMmHg),
      minuteVentilationLMin: r2(minuteVentilationLMin),
      alveolarPO2MmHg: r1(alveolarPO2MmHg),
      paO2MmHg: r1(paO2MmHg),
      paCO2MmHg: r1(paCO2MmHg),
      aaGradientMmHg: r1(gasExact.value.alveolarArterialGradientMmHg),
      p50MmHg,
      spo2Pct,
      renalBloodFlowMlMin: Math.round(renalBloodFlowMlMin),
      gfrMlMin: r1(gfrMlMin),
      raasActivation0to1: r2(raasTone),
      urineOutputMlHr: Math.round(urineOutputMlHr),
      potassiumMmolL: r2(potassiumMmolL),
      nernstPotassiumMv: math.nernstPotentialPotassiumMv,
      hco3MmolL: r1(hco3MmolL),
      arterialPh: r3(arterialPh),
      lactateMmolL: r2(lactateMmolL),
      glucoseMgDl: Math.round(glucoseMgDl),
      do2MlMin: Math.round(do2MlMin),
      vo2MlMin: Math.round(vo2MlMin),
      o2ExtractionRatio: r3(o2ExtractionRatio),
      baroreceptorDrive0to1: r2(baroreceptorDrive0to1),
      sympatheticTone0to1: r2(sympatheticTone0to1),
      vagalTone0to1: r2(vagalTone0to1),
    }))
  }
  return points
}

function edgeDirection(deltaPct: number): 'increase' | 'decrease' | 'stable' {
  if (Math.abs(deltaPct) < 2) return 'stable'
  return deltaPct > 0 ? 'increase' : 'decrease'
}

function buildCausalEdges(restingRef: MultiorganTimepoint, finalState: MultiorganTimepoint): readonly EtCausalisEdge[] {
  const pct = (now: number, base: number) => Math.round(((now - base) / Math.max(0.001, Math.abs(base))) * 1000) / 10
  const labelOf = (meshId: string) => MESH_TO_ONTOLOGY_MAP.get(meshId)?.englishLabel ?? meshId

  const coPct = pct(finalState.coLMin, restingRef.coLMin)
  const rbfPct = pct(finalState.renalBloodFlowMlMin, restingRef.renalBloodFlowMlMin)
  const svrPct = pct(finalState.svrDynSecCm5, restingRef.svrDynSecCm5)
  const mapPct = pct(finalState.mapMmHg, restingRef.mapMmHg)
  const sympPct = pct(finalState.sympatheticTone0to1, restingRef.sympatheticTone0to1)
  const lactPct = pct(finalState.lactateMmolL, restingRef.lactateMmolL)
  const phShift = Math.abs(pct(finalState.arterialPh, restingRef.arterialPh))
  const spo2Delta = pct(finalState.spo2Pct, restingRef.spo2Pct)

  const candidates: readonly EtCausalisEdge[] = [
    {
      edgeId: 'EC-CO-TO-RENAL',
      fromMeshId: 'Left ventricle',
      toMeshId: 'Kidney.l',
      fromLabel: labelOf('Left ventricle'),
      toLabel: labelOf('Kidney.l'),
      relationKind: 'causal',
      canonicalRelation: 'CAUSES',
      feedbackPolarity: finalState.coLMin < restingRef.coLMin ? 'positive_maladaptive' : 'direct_feedforward',
      direction: edgeDirection(rbfPct),
      magnitudePct: Math.abs(rbfPct),
      timeDelayMin: 5,
      mechanism: `Cardiac output (${coPct >= 0 ? '+' : ''}${coPct}%) drives renal blood flow (${rbfPct >= 0 ? '+' : ''}${rbfPct}%) across glomerular autoregulation.`,
      evidenceCitation: 'NCBI Bookshelf NBK470455 / Guyton-Starling Cardiorenal Coupling',
      uncertainty0to1: 0.08,
    },
    {
      edgeId: 'EC-RENAL-RAAS-TO-AORTA',
      fromMeshId: 'Kidney.l',
      toMeshId: 'Ascending aorta',
      fromLabel: labelOf('Kidney.l'),
      toLabel: labelOf('Ascending aorta'),
      relationKind: 'mechanistic',
      canonicalRelation: 'COMPENSATES_FOR',
      feedbackPolarity: 'negative_compensatory',
      direction: edgeDirection(svrPct),
      magnitudePct: Math.abs(svrPct),
      timeDelayMin: 30,
      mechanism: `Juxtaglomerular RAAS tone (${Math.round(finalState.raasActivation0to1 * 100)}%) modulates arteriolar SVR (${svrPct >= 0 ? '+' : ''}${svrPct}%) & MAP (${mapPct >= 0 ? '+' : ''}${mapPct}%).`,
      evidenceCitation: 'Boron & Boulpaep Renal-Angiotensin Axis',
      uncertainty0to1: 0.11,
    },
    {
      edgeId: 'EC-AORTA-TO-VAGUS',
      fromMeshId: 'Ascending aorta',
      toMeshId: 'Vagus nerve (X).l',
      fromLabel: labelOf('Ascending aorta'),
      toLabel: labelOf('Vagus nerve (X).l'),
      relationKind: 'physiological',
      canonicalRelation: 'REGULATES',
      feedbackPolarity: 'negative_compensatory',
      direction: edgeDirection(sympPct),
      magnitudePct: Math.abs(sympPct),
      timeDelayMin: 1,
      mechanism: `Aortic/carotid baroreceptors reciprocally shift vagal vs sympathetic outflow (${sympPct >= 0 ? '+' : ''}${sympPct}%).`,
      evidenceCitation: 'NCBI Bookshelf NBK538172 / Arterial Baroreflex',
      uncertainty0to1: 0.06,
    },
    {
      edgeId: 'EC-VAGUS-TO-LV',
      fromMeshId: 'Vagus nerve (X).l',
      toMeshId: 'Left ventricle',
      fromLabel: labelOf('Vagus nerve (X).l'),
      toLabel: labelOf('Left ventricle'),
      relationKind: 'physiological',
      canonicalRelation: 'REGULATES',
      feedbackPolarity: 'negative_compensatory',
      direction: edgeDirection(coPct),
      magnitudePct: Math.abs(coPct),
      timeDelayMin: 2,
      mechanism: `Autonomic efferents adjust SA chronotropy (${finalState.hrBpm} bpm) & ventricular contractility (EF ${finalState.efPct}%).`,
      evidenceCitation: 'NCBI Bookshelf NBK538172',
      uncertainty0to1: 0.07,
    },
    {
      edgeId: 'EC-LUNG-PH-TO-LV',
      fromMeshId: 'Inferior lobe of left lung',
      toMeshId: 'Left ventricle',
      fromLabel: labelOf('Inferior lobe of left lung'),
      toLabel: labelOf('Left ventricle'),
      relationKind: 'mechanistic',
      canonicalRelation: finalState.spo2Pct < 92 ? 'EXACERBATES' : 'TRANSPORTS_TO',
      feedbackPolarity: finalState.spo2Pct < 92 ? 'positive_maladaptive' : 'direct_feedforward',
      direction: edgeDirection(spo2Delta),
      magnitudePct: Math.max(Math.abs(spo2Delta), phShift),
      timeDelayMin: 5,
      mechanism: `Alveolar gas exchange (SpO2 ${finalState.spo2Pct}%, PaCO2 ${finalState.paCO2MmHg} mmHg) and pH ${finalState.arterialPh} shift Hb P50 (${finalState.p50MmHg} mmHg) & DO2 (${finalState.do2MlMin} mL/min).`,
      evidenceCitation: 'Basnet A, Rout P · Calculating FICK Cardiac Output (NBK606091); Castro D, Zubair M · Arterial Blood Gas Analysis (NBK536919)',
      uncertainty0to1: 0.09,
    },
    {
      edgeId: 'EC-DO2-TO-LIVER',
      fromMeshId: 'Ascending aorta',
      toMeshId: 'Liver',
      fromLabel: labelOf('Ascending aorta'),
      toLabel: labelOf('Liver'),
      relationKind: 'causal',
      canonicalRelation: finalState.lactateMmolL > 2.0 ? 'EARLY_WARNING_FOR' : 'REGULATES',
      feedbackPolarity: finalState.lactateMmolL > 2.0 ? 'positive_maladaptive' : 'direct_feedforward',
      direction: edgeDirection(lactPct),
      magnitudePct: Math.abs(lactPct),
      timeDelayMin: 15,
      mechanism: `Systemic DO2/VO2 extraction (${(finalState.o2ExtractionRatio * 100).toFixed(1)}%) regulates Cori-cycle lactate (${finalState.lactateMmolL} mmol/L).`,
      evidenceCitation: 'Surviving Sepsis Campaign / Fick Oxygen Extraction',
      uncertainty0to1: 0.14,
    },
  ]

  return Object.freeze(candidates.map((c) => Object.freeze(c)))
}

export function simulateMultiorganCausalTrajectory(input: MultiorganSimulationInput): MultiorganSimulationResult {
  const scenario = SPEC_MAP.get(input.scenarioId)
  if (!scenario) throw new Error(`Unsupported multiorgan scenarioId: ${String(input.scenarioId)}`)

  const cohortId: DemographicCohortId = input.cohortId && input.cohortId in DEMOGRAPHIC_COHORTS ? input.cohortId : 'YAD_M'
  const manifold = buildManifoldForCohort(cohortId, input.gestationalWeek)
  const base = cohortBaseline(manifold)

  const iv: Required<MultiorganInterventionsInput> = {
    fluidBolusMl: clamp(input.interventions?.fluidBolusMl ?? 0, 0, 2000),
    vasopressorGain: clamp(input.interventions?.vasopressorGain ?? 0, 0, 1.5),
    fiO2Fraction: clamp(input.interventions?.fiO2Fraction ?? 0.21, 0.21, 1.0),
    inotropyGain: clamp(input.interventions?.inotropyGain ?? 0, 0, 1.0),
  }

  const zeroIv: Required<MultiorganInterventionsInput> = { fluidBolusMl: 0, vasopressorGain: 0, fiO2Fraction: 0.21, inotropyGain: 0 }
  const restingTimeline = stepClosedLoopState(SPEC_MAP.get('1_RESTING_HOMEOSTASIS')!, base, zeroIv)
  const timeline = stepClosedLoopState(scenario, base, iv)
  const baselineEnd = restingTimeline[restingTimeline.length - 1]
  const finalState = timeline[timeline.length - 1]

  return Object.freeze({
    scenario,
    cohort: manifold,
    timeline: Object.freeze(timeline),
    baselineEnd,
    finalState,
    causalEdges: buildCausalEdges(baselineEnd, finalState),
    truthClass: 'SIMULATED_EDUCATIONAL' as const,
    clinicallyReviewed: false as const,
    assumptions: Object.freeze([
      'Reduced-order 7-step closed-loop multiorgan coupling (0-120 min) seeded from demographic anthropometry.',
      'Reuses Guyton-Starling hemodynamics, alveolar gas + Bohr-shifted Hill ODC, Fick O2 extraction, and Henderson-Hasselbalch acid-base balance.',
      'Interventions act identically at t = 0..120 min without patient-specific PK/PD titration.',
    ]),
    limitations: Object.freeze([
      'Educational lumped-parameter model; does not model individual coronary stenosis, valve gradients, or mechanical ventilation waveforms.',
      'Never overwrites recorded canonical patient observations or clinical review status.',
    ]),
    disclaimer: 'Educational/research coupled-physiology simulation only (clinically_reviewed = false). Do not use for patient diagnosis or acute resuscitation dosing.',
  })
}

export function evaluateEducationalPkPdSnapshot(params: {
  readonly doseMg: number
  readonly volumeOfDistributionL: number
  readonly clearanceLPerHour: number
  readonly elapsedHours: number
  readonly kdMgL: number
  readonly hillN?: number
}): EducationalPkPdResult {
  const dose = Math.max(0.1, params.doseMg)
  const vd = Math.max(1, params.volumeOfDistributionL)
  const clearance = Math.max(0.1, params.clearanceLPerHour)
  const elapsed = Math.max(0, params.elapsedHours)
  const ke = Math.max(0.01, clearance) / vd

  const step = elapsed >= 0.25 && elapsed <= 12 ? elapsed : Math.min(12, Math.max(0.25, elapsed))
  const pk = simulateFirstOrderPharmacokinetics({
    doseMg: dose,
    volumeDistributionL: vd,
    bioavailabilityF: 1,
    eliminationRateKPerHr: ke,
    durationHr: Math.max(elapsed, 0.25),
    stepHr: step,
  })
  const exactStep = elapsed === 0 ? pk.initialConcentrationMgL : pk.curve.find((pt) => Math.abs(pt.hour - elapsed) < 0.01)?.concentrationMgL
  const conc = r3(exactStep ?? pk.initialConcentrationMgL * Math.exp(-ke * elapsed))
  const occ = computeReceptorOccupancy({
    ligandNm: Math.max(1e-6, conc),
    kdNm: Math.max(1e-4, params.kdMgL),
    hillCoeff: clamp(params.hillN ?? 1, 0.5, 4),
  })
  return Object.freeze({
    plasmaConcentrationMgL: conc,
    halfLifeHours: r2(pk.halfLifeHr),
    receptorOccupancyPct: r1(occ.occupancyPct),
    truthClass: 'SIMULATED_EDUCATIONAL' as const,
    clinicallyReviewed: false as const,
  })
}
