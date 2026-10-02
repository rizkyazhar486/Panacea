import type { BodySystemId } from './bodySystemSourceWave'
import type { WholeBodySystemId } from './wholeBodyPhysiologyOS'

export type BodyPathophysiologyScenarioId =
  | 'atherosclerosis'
  | 'heart-failure'
  | 'ischemic-stroke'
  | 'venous-thromboembolism'

export type PathophysiologyStepKind = 'trigger' | 'injury' | 'compensation' | 'propagation' | 'consequence'

export interface PathophysiologyEvidenceRef {
  pmid: string
  title: string
  year: number
  url: string
  role: string
}

export interface PathophysiologyEquation {
  expression: string
  label: string
  note: string
}

export interface PathophysiologyStep {
  id: string
  kind: PathophysiologyStepKind
  label: string
  mechanism: string
  systemIds: readonly WholeBodySystemId[]
}

export interface BodyPathophysiologyScenario {
  id: BodyPathophysiologyScenarioId
  title: string
  shortLabel: string
  summary: string
  atlasSystemIds: readonly BodySystemId[]
  physiologySystemIds: readonly WholeBodySystemId[]
  cascade: readonly PathophysiologyStep[]
  equations: readonly PathophysiologyEquation[]
  evidence: readonly PathophysiologyEvidenceRef[]
}

export const BODY_PATHOPHYSIOLOGY_NETWORK: readonly BodyPathophysiologyScenario[] = [
  {
    id: 'atherosclerosis',
    title: 'Atherosclerosis → plaque vulnerability → atherothrombosis',
    shortLabel: 'Atherosclerosis',
    summary: 'Follow the arterial wall from endothelial dysfunction and inflammatory lipid accumulation through plaque vulnerability, disruption and thrombotic flow limitation.',
    atlasSystemIds: ['cardiovascular', 'lymphatic-immune'],
    physiologySystemIds: ['cardiovascular', 'immune-lymphatic', 'hepatic-metabolic'],
    cascade: [
      {
        id: 'endothelial-dysfunction',
        kind: 'trigger',
        label: 'Endothelial dysfunction / activation',
        mechanism: 'Loss of normal endothelial homeostasis promotes inflammatory signaling, leukocyte adhesion and a pro-thrombotic vascular surface.',
        systemIds: ['cardiovascular', 'immune-lymphatic'],
      },
      {
        id: 'lipid-inflammatory-recruitment',
        kind: 'injury',
        label: 'Lipid accumulation + immune-cell recruitment',
        mechanism: 'Lipid retention and inflammatory-cell trafficking reinforce chronic arterial-wall inflammation and plaque growth.',
        systemIds: ['cardiovascular', 'immune-lymphatic', 'hepatic-metabolic'],
      },
      {
        id: 'plaque-remodeling',
        kind: 'propagation',
        label: 'Plaque remodeling and vulnerability',
        mechanism: 'Necrotic lipid core, inflammatory activity and fibrous-cap integrity together influence plaque vulnerability more than lumen narrowing alone.',
        systemIds: ['cardiovascular', 'immune-lymphatic'],
      },
      {
        id: 'plaque-disruption',
        kind: 'injury',
        label: 'Plaque disruption / erosion',
        mechanism: 'Loss of surface integrity exposes thrombogenic material and shifts local hemostasis toward platelet activation and coagulation.',
        systemIds: ['cardiovascular', 'immune-lymphatic'],
      },
      {
        id: 'atherothrombosis',
        kind: 'consequence',
        label: 'Atherothrombosis → downstream ischemia',
        mechanism: 'Superimposed thrombus can abruptly reduce or obstruct arterial flow, producing tissue ischemia according to the affected vascular territory.',
        systemIds: ['cardiovascular'],
      },
    ],
    equations: [
      {
        expression: 'Q = ΔP / R',
        label: 'Simplified bulk-flow relationship',
        note: 'Teaching relationship only: vascular flow depends on pressure gradient and effective resistance. It does not quantify plaque severity, rupture risk or an individual patient’s perfusion.',
      },
    ],
    evidence: [
      {
        pmid: '36952068',
        title: 'Role of sirtuins in attenuating plaque vulnerability in atherosclerosis.',
        year: 2024,
        url: 'https://pubmed.ncbi.nlm.nih.gov/36952068/',
        role: 'Review anchor for plaque development, inflammation, vulnerability, rupture and downstream ischemic consequences.',
      },
      {
        pmid: '38220184',
        title: 'Cigarette Smoking and Atherosclerotic Cardiovascular Disease.',
        year: 2024,
        url: 'https://pubmed.ncbi.nlm.nih.gov/38220184/',
        role: 'Mechanistic review supporting endothelial dysfunction, vascular inflammation, platelet/coagulation activation and atherothrombosis.',
      },
    ],
  },
  {
    id: 'heart-failure',
    title: 'Heart failure → neurohormonal compensation → congestion/remodeling',
    shortLabel: 'Heart failure',
    summary: 'Trace how impaired pump function or abnormal loading can reduce effective forward flow, recruit compensatory neurohormonal systems, retain salt/water and progressively increase congestion and remodeling pressure.',
    atlasSystemIds: ['cardiovascular', 'urinary', 'endocrine', 'nervous', 'respiratory'],
    physiologySystemIds: ['cardiovascular', 'renal', 'endocrine', 'nervous', 'respiratory'],
    cascade: [
      {
        id: 'myocardial-insult-loading',
        kind: 'trigger',
        label: 'Myocardial injury or chronic abnormal loading',
        mechanism: 'Ischemic injury, pressure/volume loading and other myocardial insults can impair systolic or diastolic cardiac performance.',
        systemIds: ['cardiovascular'],
      },
      {
        id: 'reduced-effective-output',
        kind: 'injury',
        label: 'Reduced effective forward flow',
        mechanism: 'Pump dysfunction can reduce the ability to meet metabolic flow demand or accommodate venous return at normal filling pressures.',
        systemIds: ['cardiovascular'],
      },
      {
        id: 'neurohormonal-response',
        kind: 'compensation',
        label: 'Sympathetic + RAAS/endocrine compensation',
        mechanism: 'Neural and hormonal responses initially support pressure and perfusion but can also increase vasoconstriction, sodium-water retention and cardiac workload.',
        systemIds: ['nervous', 'endocrine', 'renal', 'cardiovascular'],
      },
      {
        id: 'volume-pressure-congestion',
        kind: 'propagation',
        label: 'Volume retention + elevated filling pressure',
        mechanism: 'Renal conservation and altered hemodynamics can increase venous and filling pressures, linking heart failure to pulmonary and systemic congestion.',
        systemIds: ['renal', 'cardiovascular', 'respiratory'],
      },
      {
        id: 'remodeling-loop',
        kind: 'consequence',
        label: 'Remodeling and maladaptive feedback',
        mechanism: 'Persistent loading and neurohormonal activation can reinforce ventricular remodeling and create a self-amplifying decline in pump efficiency.',
        systemIds: ['cardiovascular', 'endocrine', 'nervous'],
      },
    ],
    equations: [
      {
        expression: 'CO = HR × SV',
        label: 'Cardiac output identity',
        note: 'Teaching identity only. Heart-failure physiology cannot be inferred from heart rate and stroke volume alone and no patient values are calculated here.',
      },
      {
        expression: 'MAP ≈ CO × SVR',
        label: 'Simplified pressure-flow relationship',
        note: 'Teaching approximation showing why flow and systemic vascular resistance are coupled. It is not a bedside blood-pressure or treatment calculator.',
      },
    ],
    evidence: [
      {
        pmid: '22227365',
        title: 'The pathophysiology of heart failure.',
        year: 2012,
        url: 'https://pubmed.ncbi.nlm.nih.gov/22227365/',
        role: 'Review anchor for pump failure, venous congestion, Frank-Starling compensation, remodeling and neurohormonal activation.',
      },
      {
        pmid: '31209771',
        title: 'Pathogenesis and pathophysiology of heart failure with reduced ejection fraction: translation to human studies.',
        year: 2019,
        url: 'https://pubmed.ncbi.nlm.nih.gov/31209771/',
        role: 'Review anchor for reduced cardiac output, maladaptive neurohormonal activation and ventricular remodeling in HFrEF.',
      },
    ],
  },
  {
    id: 'ischemic-stroke',
    title: 'Ischemic stroke → energy failure → neurovascular injury cascade',
    shortLabel: 'Ischemic stroke',
    summary: 'Move from interrupted cerebral perfusion into ATP failure, excitotoxic/oxidative injury, neurovascular-unit dysfunction and delayed inflammatory injury across core and penumbral tissue.',
    atlasSystemIds: ['nervous', 'cardiovascular', 'lymphatic-immune'],
    physiologySystemIds: ['nervous', 'cardiovascular', 'immune-lymphatic'],
    cascade: [
      {
        id: 'cerebral-flow-interruption',
        kind: 'trigger',
        label: 'Focal cerebral blood-flow interruption',
        mechanism: 'Arterial occlusion or critical flow reduction deprives a vascular territory of oxygen and metabolic substrate.',
        systemIds: ['cardiovascular', 'nervous'],
      },
      {
        id: 'energy-failure',
        kind: 'injury',
        label: 'ATP failure + ionic disequilibrium',
        mechanism: 'Severe ischemia impairs energy-dependent membrane homeostasis, setting up depolarization and excitotoxic signaling.',
        systemIds: ['nervous'],
      },
      {
        id: 'excitotoxic-oxidative',
        kind: 'propagation',
        label: 'Excitotoxicity + calcium/oxidative stress',
        mechanism: 'Excitotoxic signaling, intracellular calcium overload and oxidative stress accelerate cellular injury in severely ischemic tissue.',
        systemIds: ['nervous'],
      },
      {
        id: 'neurovascular-inflammation',
        kind: 'propagation',
        label: 'Neurovascular-unit dysfunction + inflammation',
        mechanism: 'Blood-brain-barrier and inflammatory responses extend injury beyond neurons and contribute to delayed damage in vulnerable tissue.',
        systemIds: ['nervous', 'immune-lymphatic', 'cardiovascular'],
      },
      {
        id: 'core-penumbra-outcome',
        kind: 'consequence',
        label: 'Infarct core / threatened penumbra',
        mechanism: 'Tissue outcome depends on the severity and duration of perfusion failure and the evolution of secondary injury processes; this educational map does not estimate salvageability.',
        systemIds: ['nervous', 'cardiovascular'],
      },
    ],
    equations: [
      {
        expression: 'CPP ≈ MAP − ICP',
        label: 'Simplified cerebral perfusion-pressure relationship',
        note: 'Teaching approximation only. It does not estimate regional cerebral blood flow, infarct core, penumbra or treatment eligibility.',
      },
      {
        expression: 'O₂ delivery ∝ blood flow × arterial O₂ content',
        label: 'Conceptual oxygen-delivery relationship',
        note: 'Directional systems relationship only; no patient oxygen-delivery value is computed.',
      },
    ],
    evidence: [
      {
        pmid: '19579170',
        title: 'Injury and repair mechanisms in ischemic stroke: considerations for the development of novel neurotherapeutics.',
        year: 2009,
        url: 'https://pubmed.ncbi.nlm.nih.gov/19579170/',
        role: 'Review anchor for excitotoxicity, calcium overload, oxidative stress, neuroinflammation, penumbral injury and neurovascular-unit framing.',
      },
    ],
  },
  {
    id: 'venous-thromboembolism',
    title: 'Venous thrombosis → embolization → pulmonary vascular load',
    shortLabel: 'DVT / VTE / PE',
    summary: 'Connect venous stasis, endothelial activation/injury and hypercoagulability to deep-vein thrombus formation, embolization and acute pulmonary vascular/right-ventricular stress.',
    atlasSystemIds: ['cardiovascular', 'lymphatic-immune', 'respiratory'],
    physiologySystemIds: ['cardiovascular', 'immune-lymphatic', 'respiratory'],
    cascade: [
      {
        id: 'virchow-drivers',
        kind: 'trigger',
        label: 'Stasis + endothelial injury/activation + hypercoagulability',
        mechanism: 'The classic venous-thrombosis framework combines disturbed flow, procoagulant blood tendency and endothelial activation or injury, with inflammation interacting across these drivers.',
        systemIds: ['cardiovascular', 'immune-lymphatic'],
      },
      {
        id: 'venous-thrombus-initiation',
        kind: 'injury',
        label: 'Local venous thrombus initiation',
        mechanism: 'Activated endothelium, coagulation signaling and low-flow conditions can favor fibrin-rich thrombus formation in deep veins.',
        systemIds: ['cardiovascular', 'immune-lymphatic'],
      },
      {
        id: 'thrombus-propagation',
        kind: 'propagation',
        label: 'Thrombus propagation',
        mechanism: 'Ongoing coagulation and impaired venous flow can extend thrombus burden along the venous system.',
        systemIds: ['cardiovascular'],
      },
      {
        id: 'embolization',
        kind: 'propagation',
        label: 'Embolization to pulmonary circulation',
        mechanism: 'A detached thrombus can travel through the right heart and obstruct branches of the pulmonary arterial circulation.',
        systemIds: ['cardiovascular', 'respiratory'],
      },
      {
        id: 'pulmonary-rv-load',
        kind: 'consequence',
        label: 'Pulmonary vascular obstruction → RV load / hypoxemia',
        mechanism: 'Acute pulmonary arterial obstruction and vasoconstriction can increase right-ventricular afterload and disturb gas exchange.',
        systemIds: ['cardiovascular', 'respiratory'],
      },
    ],
    equations: [
      {
        expression: 'Virchow framework = stasis + endothelial injury/activation + hypercoagulability',
        label: 'Conceptual thrombosis framework',
        note: 'Teaching identity only. It is not a VTE probability score, diagnostic rule or anticoagulation decision tool.',
      },
    ],
    evidence: [
      {
        pmid: '38846994',
        title: 'Epidemiology, Etiology, and Pathophysiology of Pulmonary Embolism.',
        year: 2024,
        url: 'https://pubmed.ncbi.nlm.nih.gov/38846994/',
        role: 'Recent review anchor for stasis, hypercoagulability, endothelial injury, inflammation, embolic origin, hypoxemia and right-ventricular failure.',
      },
      {
        pmid: '15561697',
        title: 'Deep venous thrombosis.',
        year: 2004,
        url: 'https://pubmed.ncbi.nlm.nih.gov/15561697/',
        role: 'Mechanistic review anchor for venous-thrombus initiation, activated endothelium, inflammation and stasis-associated hypoxia.',
      },
    ],
  },
] as const

export const BODY_PATHOPHYSIOLOGY_BOUNDARY =
  'Educational pathophysiology network only. It visualizes literature-supported mechanistic relationships and simplified equations; it does not diagnose disease, estimate individual risk or severity, determine tissue viability, recommend treatment, or replace clinical assessment.'

export function getBodyPathophysiologyScenario(id: BodyPathophysiologyScenarioId): BodyPathophysiologyScenario {
  const scenario = BODY_PATHOPHYSIOLOGY_NETWORK.find((item) => item.id === id)
  if (!scenario) throw new Error(`Unknown body pathophysiology scenario: ${id}`)
  return scenario
}

export function listBodyPathophysiologyScenariosForAtlasSystem(systemId: BodySystemId): readonly BodyPathophysiologyScenario[] {
  return BODY_PATHOPHYSIOLOGY_NETWORK.filter((scenario) => scenario.atlasSystemIds.includes(systemId))
}
