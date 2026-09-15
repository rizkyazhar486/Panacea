import type { BodySystemId } from './bodySystemSourceWave'
import type { BodyPathophysiologyScenarioId } from './bodyPathophysiologyNetwork'
import type { WholeBodySystemId } from './wholeBodyPhysiologyOS'

export type DrugMechanismId =
  | 'atorvastatin'
  | 'sacubitril-valsartan'
  | 'alteplase'
  | 'apixaban'

export type DrugMechanismStepKind = 'molecular-target' | 'pathway' | 'physiologic-effect' | 'disease-context'

export interface DrugMechanismStep {
  id: string
  kind: DrugMechanismStepKind
  label: string
  detail: string
}

export interface DrugLabelSource {
  source: 'DailyMed'
  setId: string
  labelName: string
  labeler: string
  version: number
  effectiveDate: string
  sectionCode: '43679-0'
  sectionTitle: '12.1 Mechanism of Action'
  url: string
}

export interface BodyDrugMechanismModel {
  id: DrugMechanismId
  genericName: string
  representativeBrand: string
  drugClass: string
  targetSummary: string
  linkedScenarioIds: readonly BodyPathophysiologyScenarioId[]
  atlasSystemIds: readonly BodySystemId[]
  physiologySystemIds: readonly WholeBodySystemId[]
  mechanism: readonly DrugMechanismStep[]
  pathwayNotation: string
  educationalNote: string
  labelSource: DrugLabelSource
}

export const BODY_DRUG_MECHANISM_NETWORK: readonly BodyDrugMechanismModel[] = [
  {
    id: 'atorvastatin',
    genericName: 'Atorvastatin',
    representativeBrand: 'Lipitor',
    drugClass: 'HMG-CoA reductase inhibitor (statin)',
    targetSummary: 'Competitive inhibition of HMG-CoA reductase in hepatic cholesterol synthesis.',
    linkedScenarioIds: ['atherosclerosis'],
    atlasSystemIds: ['cardiovascular', 'digestive'],
    physiologySystemIds: ['hepatic-metabolic', 'cardiovascular'],
    mechanism: [
      {
        id: 'hmgcoa-target',
        kind: 'molecular-target',
        label: 'HMG-CoA reductase inhibition',
        detail: 'Atorvastatin selectively and competitively inhibits the rate-limiting HMG-CoA reductase step that generates mevalonate in the sterol-synthesis pathway.',
      },
      {
        id: 'hepatic-synthesis',
        kind: 'pathway',
        label: 'Hepatic cholesterol synthesis decreases',
        detail: 'Reduced mevalonate-pathway flux lowers hepatic cholesterol synthesis and changes hepatic cholesterol handling.',
      },
      {
        id: 'ldl-receptor',
        kind: 'physiologic-effect',
        label: 'Hepatic LDL-receptor activity increases',
        detail: 'The official label describes increased hepatic cell-surface LDL receptors, enhancing LDL uptake and catabolism and reducing LDL particle production.',
      },
      {
        id: 'atherosclerosis-context',
        kind: 'disease-context',
        label: 'Lipid-pathway context for atherosclerosis',
        detail: 'Panacea links this mechanism to the atherosclerosis teaching cascade only as mechanistic context; it does not infer plaque burden, event risk, indication, or treatment choice.',
      },
    ],
    pathwayNotation: 'HMG-CoA reductase ↓ → mevalonate/cholesterol synthesis ↓ → hepatic LDL receptors ↑ → circulating LDL handling changes',
    educationalNote: 'Mechanism visualization only. No dose, LDL target, treatment indication, comparative effectiveness, contraindication screening, or patient-specific recommendation is generated.',
    labelSource: {
      source: 'DailyMed',
      setId: 'a60cc18b-0631-4cf0-b021-9f52224ece65',
      labelName: 'LIPITOR (atorvastatin calcium) tablet, film coated',
      labeler: 'Viatris Specialty LLC',
      version: 8,
      effectiveDate: '2024-04-15',
      sectionCode: '43679-0',
      sectionTitle: '12.1 Mechanism of Action',
      url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=a60cc18b-0631-4cf0-b021-9f52224ece65',
    },
  },
  {
    id: 'sacubitril-valsartan',
    genericName: 'Sacubitril / valsartan',
    representativeBrand: 'Entresto',
    drugClass: 'Angiotensin receptor–neprilysin inhibitor (ARNI)',
    targetSummary: 'Neprilysin inhibition via LBQ657 plus angiotensin II AT1-receptor blockade via valsartan.',
    linkedScenarioIds: ['heart-failure'],
    atlasSystemIds: ['cardiovascular', 'urinary', 'endocrine'],
    physiologySystemIds: ['cardiovascular', 'renal', 'endocrine'],
    mechanism: [
      {
        id: 'neprilysin-target',
        kind: 'molecular-target',
        label: 'Neprilysin inhibition',
        detail: 'Sacubitril is converted to LBQ657, which inhibits neprilysin and thereby increases levels of peptides normally degraded by neprilysin, including natriuretic peptides.',
      },
      {
        id: 'at1-target',
        kind: 'molecular-target',
        label: 'AT1-receptor blockade',
        detail: 'Valsartan selectively blocks angiotensin II type-1 receptors and inhibits angiotensin II-dependent aldosterone release.',
      },
      {
        id: 'counter-regulatory-balance',
        kind: 'physiologic-effect',
        label: 'Counter-regulatory peptide signaling rises while angiotensin-II signaling falls',
        detail: 'The combined mechanism links natriuretic-peptide preservation with simultaneous suppression of AT1-mediated cardiovascular and renal signaling.',
      },
      {
        id: 'hf-context',
        kind: 'disease-context',
        label: 'Neurohormonal context for heart failure',
        detail: 'Panacea positions this mechanism beside the heart-failure neurohormonal compensation cascade without calculating blood pressure, renal response, potassium, congestion, or prescribing suitability.',
      },
    ],
    pathwayNotation: 'NEP inhibition → natriuretic peptides ↑  +  AT1 blockade → angiotensin-II/aldosterone signaling ↓',
    educationalNote: 'Mechanism visualization only. It does not decide candidacy, substitution for ACEi/ARB therapy, washout, dose, blood-pressure management, renal monitoring, potassium management, pregnancy safety, or any treatment plan.',
    labelSource: {
      source: 'DailyMed',
      setId: '000dc81d-ab91-450c-8eae-8eb74e72296f',
      labelName: 'ENTRESTO (sacubitril and valsartan)',
      labeler: 'Novartis Pharmaceuticals Corporation',
      version: 25,
      effectiveDate: '2026-07-06',
      sectionCode: '43679-0',
      sectionTitle: '12.1 Mechanism of Action',
      url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=000dc81d-ab91-450c-8eae-8eb74e72296f',
    },
  },
  {
    id: 'alteplase',
    genericName: 'Alteplase',
    representativeBrand: 'Activase',
    drugClass: 'Fibrinolytic serine protease',
    targetSummary: 'Fibrin-enhanced conversion of plasminogen to plasmin within thrombus.',
    linkedScenarioIds: ['ischemic-stroke', 'venous-thromboembolism'],
    atlasSystemIds: ['cardiovascular', 'nervous', 'respiratory'],
    physiologySystemIds: ['cardiovascular', 'nervous', 'respiratory'],
    mechanism: [
      {
        id: 'fibrin-binding',
        kind: 'molecular-target',
        label: 'Fibrin-associated thrombus targeting context',
        detail: 'At pharmacologic concentration, alteplase binds fibrin within thrombus and acts as a serine protease in a fibrin-enhanced reaction.',
      },
      {
        id: 'plasminogen-plasmin',
        kind: 'pathway',
        label: 'Plasminogen → plasmin',
        detail: 'Alteplase converts entrapped plasminogen to plasmin, initiating local fibrinolysis; the label notes limited plasminogen conversion in the absence of fibrin.',
      },
      {
        id: 'fibrinolysis',
        kind: 'physiologic-effect',
        label: 'Local fibrinolysis increases',
        detail: 'Plasmin generation promotes fibrin breakdown within thrombus, connecting the molecular action to thrombus dissolution biology.',
      },
      {
        id: 'ischemic-thrombotic-context',
        kind: 'disease-context',
        label: 'Thrombotic occlusion context',
        detail: 'Panacea links the mechanism to thrombotic ischemic-stroke and pulmonary-embolism teaching cascades only; it never determines eligibility, time window, imaging suitability, bleeding risk, or administration.',
      },
    ],
    pathwayNotation: 'fibrin-associated alteplase → plasminogen → plasmin → fibrin breakdown',
    educationalNote: 'Mechanism visualization only. It deliberately omits dose, time-window logic, contraindication screening, imaging eligibility, bleeding-risk decisions, and emergency treatment recommendations.',
    labelSource: {
      source: 'DailyMed',
      setId: 'c669f77c-fa48-478b-a14b-80b20a0139c2',
      labelName: 'ACTIVASE (alteplase) kit',
      labeler: 'Genentech, Inc.',
      version: 15,
      effectiveDate: '2026-01-20',
      sectionCode: '43679-0',
      sectionTitle: '12.1 Mechanism of Action',
      url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=c669f77c-fa48-478b-a14b-80b20a0139c2',
    },
  },
  {
    id: 'apixaban',
    genericName: 'Apixaban',
    representativeBrand: 'Eliquis',
    drugClass: 'Direct factor Xa inhibitor',
    targetSummary: 'Selective inhibition of free and clot-bound factor Xa and prothrombinase activity.',
    linkedScenarioIds: ['venous-thromboembolism'],
    atlasSystemIds: ['cardiovascular'],
    physiologySystemIds: ['cardiovascular'],
    mechanism: [
      {
        id: 'fxa-target',
        kind: 'molecular-target',
        label: 'Factor Xa inhibition',
        detail: 'Apixaban selectively inhibits factor Xa without requiring antithrombin III and inhibits both free and clot-bound factor Xa as well as prothrombinase activity.',
      },
      {
        id: 'thrombin-generation',
        kind: 'pathway',
        label: 'Thrombin generation decreases',
        detail: 'By inhibiting factor Xa, apixaban decreases thrombin generation within the coagulation cascade.',
      },
      {
        id: 'thrombus-development',
        kind: 'physiologic-effect',
        label: 'Thrombus development is suppressed',
        detail: 'Reduced thrombin generation decreases thrombus development; platelet aggregation is affected indirectly through reduced thrombin rather than direct platelet inhibition.',
      },
      {
        id: 'vte-context',
        kind: 'disease-context',
        label: 'Coagulation context for VTE',
        detail: 'Panacea links this mechanism to the VTE teaching cascade without computing recurrence risk, bleeding risk, renal/hepatic suitability, interactions, interruption strategy, or anticoagulant dosing.',
      },
    ],
    pathwayNotation: 'factor Xa ↓ → thrombin generation ↓ → fibrin/thrombus propagation pressure ↓',
    educationalNote: 'Mechanism visualization only. It is not an anticoagulation decision aid and does not provide dose, duration, interruption, reversal, interaction, renal/hepatic, pregnancy, or bleeding-risk guidance.',
    labelSource: {
      source: 'DailyMed',
      setId: 'e9481622-7cc6-418a-acb6-c5450daae9b0',
      labelName: 'ELIQUIS (apixaban)',
      labeler: 'E.R. Squibb & Sons, L.L.C.',
      version: 30,
      effectiveDate: '2025-04-17',
      sectionCode: '43679-0',
      sectionTitle: '12.1 Mechanism of Action',
      url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=e9481622-7cc6-418a-acb6-c5450daae9b0',
    },
  },
] as const

export const BODY_DRUG_MECHANISM_BOUNDARY =
  'Educational pharmacology-mechanism map only. It explains label-sourced targets and pathway directionality; it does not recommend a drug, dose, duration, timing, route, combination, monitoring plan, contraindication decision, emergency treatment, or patient-specific therapy.'

export function getBodyDrugMechanism(id: DrugMechanismId): BodyDrugMechanismModel {
  const model = BODY_DRUG_MECHANISM_NETWORK.find((item) => item.id === id)
  if (!model) throw new Error(`Unknown body drug mechanism: ${id}`)
  return model
}

export function listBodyDrugMechanismsForScenario(scenarioId: BodyPathophysiologyScenarioId): readonly BodyDrugMechanismModel[] {
  return BODY_DRUG_MECHANISM_NETWORK.filter((item) => item.linkedScenarioIds.includes(scenarioId))
}

export function listBodyDrugMechanismsForAtlasSystem(systemId: BodySystemId): readonly BodyDrugMechanismModel[] {
  return BODY_DRUG_MECHANISM_NETWORK.filter((item) => item.atlasSystemIds.includes(systemId))
}
