import type { BodySystemId } from './bodySystemSourceWave'
import type { BodyPathophysiologyScenarioId } from './bodyPathophysiologyNetwork'
import type { WholeBodySystemId } from './wholeBodyPhysiologyOS'

export type PharmacologyMechanismId =
  | 'statin-hmgcr'
  | 'aspirin-cox1'
  | 'ace-inhibition'
  | 'beta1-blockade'
  | 'sglt2-inhibition'
  | 'factor-xa-inhibition'
  | 'pcsk9-inhibition'

export type PharmacologyMechanismLayer = 'target' | 'molecular' | 'cellular' | 'organ' | 'systems'

export interface PharmacologyEvidenceRef {
  pmid: string
  title: string
  year: number
  url: string
  role: string
}

export interface PharmacologyMechanismStep {
  id: string
  layer: PharmacologyMechanismLayer
  label: string
  mechanism: string
}

export interface PharmacologyTeachingEquation {
  expression: string
  label: string
  note: string
}

export interface BodyPharmacologyMechanism {
  id: PharmacologyMechanismId
  classLabel: string
  representativeExamples: readonly string[]
  targetLabel: string
  summary: string
  atlasSystemIds: readonly BodySystemId[]
  physiologySystemIds: readonly WholeBodySystemId[]
  linkedScenarioIds: readonly BodyPathophysiologyScenarioId[]
  mechanismChain: readonly PharmacologyMechanismStep[]
  equations: readonly PharmacologyTeachingEquation[]
  evidence: readonly PharmacologyEvidenceRef[]
  boundary: string
}

const EDUCATIONAL_BOUNDARY =
  'Mechanism education only. This class-level map does not choose a medicine, dose a medicine, determine eligibility, predict benefit or harm, model an individual patient, or replace prescribing information and clinical judgment.'

export const BODY_PHARMACOLOGY_MECHANISM_NETWORK: readonly BodyPharmacologyMechanism[] = [
  {
    id: 'statin-hmgcr',
    classLabel: 'HMG-CoA reductase inhibition',
    representativeExamples: ['atorvastatin', 'rosuvastatin', 'simvastatin'],
    targetLabel: 'HMG-CoA reductase (HMGCR)',
    summary:
      'Follow the canonical lipid-lowering mechanism from inhibition of hepatic cholesterol synthesis through compensatory LDL-receptor upregulation and increased clearance of circulating LDL particles.',
    atlasSystemIds: ['cardiovascular', 'digestive'],
    physiologySystemIds: ['cardiovascular', 'hepatic-metabolic'],
    linkedScenarioIds: ['atherosclerosis', 'ischemic-stroke'],
    mechanismChain: [
      {
        id: 'hmgcr-binding',
        layer: 'target',
        label: 'HMGCR inhibition',
        mechanism: 'Statins inhibit HMG-CoA reductase, the rate-limiting enzyme of the mevalonate/cholesterol biosynthetic pathway in hepatocytes.',
      },
      {
        id: 'hepatic-cholesterol-synthesis',
        layer: 'molecular',
        label: 'Reduced hepatic cholesterol synthesis',
        mechanism: 'Lower intracellular cholesterol availability activates compensatory cholesterol-homeostasis programs rather than directly removing plaque from an artery.',
      },
      {
        id: 'ldlr-expression',
        layer: 'cellular',
        label: 'LDL-receptor expression increases',
        mechanism: 'Hepatocytes increase LDL-receptor activity, expanding receptor-mediated uptake of apoB-containing LDL particles from the circulation.',
      },
      {
        id: 'ldl-clearance',
        layer: 'organ',
        label: 'Hepatic LDL clearance increases',
        mechanism: 'The liver clears more circulating LDL through LDL-receptor-mediated endocytosis, shifting the circulating lipoprotein environment over time.',
      },
      {
        id: 'atherogenic-burden-context',
        layer: 'systems',
        label: 'Atherogenic lipoprotein exposure is modified',
        mechanism: 'The systems-level connection is reduced exposure to LDL-containing particles; this atlas deliberately does not calculate plaque regression or event probability for an individual.',
      },
    ],
    equations: [
      {
        expression: 'LDL uptake ∝ functional LDLR activity × available LDL particles',
        label: 'Conceptual hepatic-clearance relationship',
        note: 'Directional teaching relationship only; it is not a patient LDL-response equation and contains no validated dosing coefficient.',
      },
    ],
    evidence: [
      {
        pmid: '24657242',
        title: 'The pharmacology of statins.',
        year: 2014,
        url: 'https://pubmed.ncbi.nlm.nih.gov/24657242/',
        role: 'Review anchor for HMG-CoA reductase inhibition, cholesterol synthesis, LDL-receptor biology, pharmacology and class-level mechanistic context.',
      },
      {
        pmid: '19299327',
        title: 'The LDL receptor.',
        year: 2009,
        url: 'https://pubmed.ncbi.nlm.nih.gov/19299327/',
        role: 'Foundational review anchor for LDL-receptor feedback regulation and the receptor-mediated mechanism through which statins lower circulating LDL.',
      },
    ],
    boundary: EDUCATIONAL_BOUNDARY,
  },
  {
    id: 'aspirin-cox1',
    classLabel: 'Platelet COX-1 inhibition',
    representativeExamples: ['aspirin'],
    targetLabel: 'Platelet cyclooxygenase-1 (COX-1)',
    summary:
      'Trace the antiplatelet mechanism from irreversible platelet COX-1 acetylation to reduced thromboxane A2 synthesis and reduced thromboxane-dependent platelet activation signaling.',
    atlasSystemIds: ['cardiovascular', 'lymphatic-immune'],
    physiologySystemIds: ['cardiovascular', 'immune-lymphatic'],
    linkedScenarioIds: ['atherosclerosis', 'ischemic-stroke'],
    mechanismChain: [
      {
        id: 'cox1-acetylation',
        layer: 'target',
        label: 'Irreversible platelet COX-1 acetylation',
        mechanism: 'Aspirin acetylates platelet COX-1, suppressing the cyclooxygenase activity required for platelet thromboxane synthesis.',
      },
      {
        id: 'txa2-synthesis',
        layer: 'molecular',
        label: 'Thromboxane A2 synthesis decreases',
        mechanism: 'Reduced COX-1 activity decreases generation of thromboxane A2, a potent autocrine/paracrine platelet-activation and vasoconstrictor signal.',
      },
      {
        id: 'platelet-signaling',
        layer: 'cellular',
        label: 'TXA2-dependent platelet amplification decreases',
        mechanism: 'Platelet recruitment and activation retain multiple pathways, but the thromboxane-dependent amplification loop is selectively weakened by COX-1 inhibition.',
      },
      {
        id: 'primary-hemostasis-context',
        layer: 'organ',
        label: 'Primary-hemostasis behavior changes',
        mechanism: 'At sites of vascular injury, platelet plug formation is influenced by many receptors and mediators; this map isolates only the aspirin-sensitive thromboxane branch.',
      },
      {
        id: 'atherothrombosis-context',
        layer: 'systems',
        label: 'Atherothrombotic propagation context is modified',
        mechanism: 'The mechanism intersects atherothrombosis and ischemic vascular disease, but the atlas does not infer whether aspirin is indicated, contraindicated, sufficient or beneficial for a specific person.',
      },
    ],
    equations: [
      {
        expression: 'platelet activation = TXA₂ pathway + ADP pathway + thrombin pathway + other inputs',
        label: 'Parallel-pathway teaching model',
        note: 'Conceptual teaching decomposition only; it is not a quantitative platelet-function model or a patient treatment rule.',
      },
    ],
    evidence: [
      {
        pmid: '18581076',
        title: 'Aspirin "resistance".',
        year: 2008,
        url: 'https://pubmed.ncbi.nlm.nih.gov/18581076/',
        role: 'Review anchor for platelet COX-1 inhibition, suppression of thromboxane A2 formation and the limitation of treating laboratory response as a simple clinical outcome surrogate.',
      },
      {
        pmid: '19069170',
        title: '[Aspirin resistance].',
        year: 2008,
        url: 'https://pubmed.ncbi.nlm.nih.gov/19069170/',
        role: 'Mechanistic review anchor describing permanent COX-1 inactivation and downstream reduction of platelet thromboxane A2 biosynthesis.',
      },
    ],
    boundary: EDUCATIONAL_BOUNDARY,
  },
  {
    id: 'ace-inhibition',
    classLabel: 'ACE inhibition',
    representativeExamples: ['enalapril', 'lisinopril', 'ramipril'],
    targetLabel: 'Angiotensin-converting enzyme (ACE)',
    summary:
      'Map the neurohormonal mechanism from ACE inhibition to reduced angiotensin-II generation, lower aldosterone drive and altered vascular/volume-loading signals within the heart-kidney-endocrine network.',
    atlasSystemIds: ['cardiovascular', 'urinary', 'endocrine'],
    physiologySystemIds: ['cardiovascular', 'renal', 'endocrine'],
    linkedScenarioIds: ['heart-failure'],
    mechanismChain: [
      {
        id: 'ace-target',
        layer: 'target',
        label: 'ACE activity is inhibited',
        mechanism: 'ACE inhibition reduces conversion of angiotensin I to angiotensin II and also alters degradation of vasoactive peptides such as bradykinin.',
      },
      {
        id: 'angiotensin-ii',
        layer: 'molecular',
        label: 'Angiotensin-II signaling drive decreases',
        mechanism: 'Reduced angiotensin-II generation weakens a major RAAS signal linked to vasoconstriction, aldosterone stimulation and maladaptive neurohormonal activation.',
      },
      {
        id: 'aldosterone',
        layer: 'cellular',
        label: 'Aldosterone drive is reduced',
        mechanism: 'Lower RAAS signaling can reduce aldosterone-mediated sodium-retaining drive, linking endocrine signaling to renal sodium-water handling.',
      },
      {
        id: 'vascular-volume-load',
        layer: 'organ',
        label: 'Vascular resistance and volume-loading signals shift',
        mechanism: 'The organ-level consequence is a coupled change in vascular tone and renal volume regulation rather than a single isolated cardiac effect.',
      },
      {
        id: 'hf-neurohormonal-loop',
        layer: 'systems',
        label: 'Heart-failure neurohormonal loop is interrupted',
        mechanism: 'The mechanism intersects the compensatory RAAS loop represented in the heart-failure pathophysiology network; no individual blood-pressure, kidney-function or outcome response is predicted.',
      },
    ],
    equations: [
      {
        expression: 'MAP ≈ CO × SVR',
        label: 'Systems pressure-flow teaching relationship',
        note: 'Teaching approximation only; ACE inhibition affects multiple coupled variables and this expression is not a patient blood-pressure prediction.',
      },
    ],
    evidence: [
      {
        pmid: '37895150',
        title: 'Neurohumoral Activation in Heart Failure.',
        year: 2023,
        url: 'https://pubmed.ncbi.nlm.nih.gov/37895150/',
        role: 'Review anchor for RAAS and sympathetic activation in heart failure and the mechanistic role of neurohumoral antagonism including ACE inhibition.',
      },
      {
        pmid: '28460827',
        title: 'Heart failure.',
        year: 2017,
        url: 'https://pubmed.ncbi.nlm.nih.gov/28460827/',
        role: 'Broad heart-failure review anchor placing ACE inhibition within the established neurohormonal treatment framework without converting the atlas into prescribing guidance.',
      },
    ],
    boundary: EDUCATIONAL_BOUNDARY,
  },
  {
    id: 'beta1-blockade',
    classLabel: 'β-adrenergic blockade',
    representativeExamples: ['bisoprolol', 'metoprolol', 'carvedilol'],
    targetLabel: 'β-adrenergic receptors (β1-dominant cardiac/renal context)',
    summary:
      'Trace how β-adrenergic antagonism modifies sympathetic signaling across myocardium and renin release, connecting autonomic physiology to the maladaptive neurohormonal loop of chronic heart failure.',
    atlasSystemIds: ['cardiovascular', 'nervous', 'urinary'],
    physiologySystemIds: ['cardiovascular', 'nervous', 'renal'],
    linkedScenarioIds: ['heart-failure'],
    mechanismChain: [
      {
        id: 'beta-receptor-antagonism',
        layer: 'target',
        label: 'β-adrenergic receptor signaling is antagonized',
        mechanism: 'β-blockers oppose catecholamine signaling at β-adrenergic receptors, with class members differing in receptor selectivity and additional pharmacologic properties.',
      },
      {
        id: 'camp-signaling',
        layer: 'molecular',
        label: 'Adrenergic cAMP signaling is reduced',
        mechanism: 'Reduced receptor stimulation lowers downstream adrenergic signaling that ordinarily increases chronotropy, inotropy and renin release under sympathetic drive.',
      },
      {
        id: 'cardiomyocyte-demand',
        layer: 'cellular',
        label: 'Cardiomyocyte adrenergic drive is reduced',
        mechanism: 'The myocardial cellular environment experiences less persistent catecholamine stimulation, altering rate, contractile signaling and arrhythmogenic stress pathways.',
      },
      {
        id: 'heart-kidney-axis',
        layer: 'organ',
        label: 'Heart-rate and renin-axis signals shift',
        mechanism: 'Cardiac and juxtaglomerular β-adrenergic effects connect autonomic tone to both pump behavior and RAAS activation across the heart-kidney axis.',
      },
      {
        id: 'hf-sympathetic-loop',
        layer: 'systems',
        label: 'Chronic sympathetic compensation is modulated',
        mechanism: 'This mechanism intersects the sympathetic compensation loop in heart failure; the atlas does not simulate titration, acute decompensation, contraindications or individual hemodynamic tolerance.',
      },
    ],
    equations: [
      {
        expression: 'CO = HR × SV',
        label: 'Cardiac-output identity',
        note: 'Teaching identity only; β-blocker effects cannot be inferred from heart rate alone and no patient cardiac-output value is calculated.',
      },
    ],
    evidence: [
      {
        pmid: '11468019',
        title: 'Beta-blocker treatment in heart failure.',
        year: 2001,
        url: 'https://pubmed.ncbi.nlm.nih.gov/11468019/',
        role: 'Review and trial-synthesis anchor for beta-blockade in heart failure, neurohormonal framing, ventricular function and class-level clinical context.',
      },
      {
        pmid: '37895150',
        title: 'Neurohumoral Activation in Heart Failure.',
        year: 2023,
        url: 'https://pubmed.ncbi.nlm.nih.gov/37895150/',
        role: 'Contemporary mechanistic review anchor for sympathetic activation and neurohumoral antagonism within the heart-failure systems network.',
      },
    ],
    boundary: EDUCATIONAL_BOUNDARY,
  },
  {
    id: 'sglt2-inhibition',
    classLabel: 'SGLT2 inhibition',
    representativeExamples: ['empagliflozin', 'dapagliflozin', 'canagliflozin'],
    targetLabel: 'Sodium-glucose cotransporter 2 (SGLT2)',
    summary:
      'Follow the proximal-tubule mechanism from reduced sodium-glucose reabsorption into glycosuria/natriuresis and downstream cardiorenal systems effects, while keeping proposed extra-renal mechanisms explicitly separate from established target biology.',
    atlasSystemIds: ['urinary', 'endocrine', 'cardiovascular'],
    physiologySystemIds: ['renal', 'endocrine', 'cardiovascular', 'hepatic-metabolic'],
    linkedScenarioIds: ['heart-failure'],
    mechanismChain: [
      {
        id: 'sglt2-target',
        layer: 'target',
        label: 'Proximal-tubule SGLT2 is inhibited',
        mechanism: 'SGLT2 inhibition reduces coupled reabsorption of filtered glucose and sodium in the proximal nephron, its canonical pharmacologic target site.',
      },
      {
        id: 'luminal-glucose-sodium',
        layer: 'molecular',
        label: 'More glucose and sodium remain in tubular fluid',
        mechanism: 'Reduced transporter flux shifts luminal substrate and sodium handling, producing glycosuria and a natriuretic/osmotic-diuretic component.',
      },
      {
        id: 'tubuloglomerular-context',
        layer: 'cellular',
        label: 'Tubuloglomerular-feedback context changes',
        mechanism: 'Altered sodium delivery toward the macula densa can modify intrarenal feedback signals; the magnitude and clinical consequence cannot be inferred from this schematic.',
      },
      {
        id: 'renal-volume-metabolic',
        layer: 'organ',
        label: 'Renal volume and metabolic handling shift',
        mechanism: 'Kidney-mediated sodium, water and glucose handling changes create cardiorenal and metabolic effects that extend beyond a glucose-only mental model.',
      },
      {
        id: 'cardiorenal-network',
        layer: 'systems',
        label: 'Cardiorenal loading environment is modified',
        mechanism: 'The systems-level map links renal transport to cardiac loading and metabolism; proposed mechanisms beyond the canonical renal target are presented as an evolving multi-mechanism field, not settled causal coefficients.',
      },
    ],
    equations: [
      {
        expression: 'filtered load ≈ GFR × plasma concentration',
        label: 'Renal filtered-load teaching relationship',
        note: 'Conceptual renal-physiology relationship only; it is not used to estimate glycosuria, natriuresis, dosing, GFR or treatment response in a patient.',
      },
    ],
    evidence: [
      {
        pmid: '32000955',
        title: 'Mechanisms of Cardiorenal Effects of Sodium-Glucose Cotransporter 2 Inhibitors: JACC State-of-the-Art Review.',
        year: 2020,
        url: 'https://pubmed.ncbi.nlm.nih.gov/32000955/',
        role: 'State-of-the-art review anchor for SGLT2 target biology and the broader cardiorenal, metabolic, hemodynamic and remodeling mechanism hypotheses.',
      },
      {
        pmid: '36607775',
        title: 'Mechanisms of SGLT2 Inhibitors in Heart Failure and Their Clinical Value.',
        year: 2023,
        url: 'https://pubmed.ncbi.nlm.nih.gov/36607775/',
        role: 'Review anchor for proposed heart-failure mechanisms including volume regulation, remodeling, ion handling and energy metabolism, treated here as systems-level context.',
      },
    ],
    boundary: EDUCATIONAL_BOUNDARY,
  },
  {
    id: 'factor-xa-inhibition',
    classLabel: 'Direct factor Xa inhibition',
    representativeExamples: ['apixaban', 'rivaroxaban', 'edoxaban'],
    targetLabel: 'Activated coagulation factor X (factor Xa)',
    summary:
      'Trace anticoagulant mechanism from factor Xa inhibition through reduced prothrombinase activity, reduced thrombin generation and reduced fibrin formation within the coagulation branch of thrombus propagation.',
    atlasSystemIds: ['cardiovascular', 'lymphatic-immune'],
    physiologySystemIds: ['cardiovascular', 'immune-lymphatic'],
    linkedScenarioIds: ['venous-thromboembolism'],
    mechanismChain: [
      {
        id: 'fxa-binding',
        layer: 'target',
        label: 'Factor Xa is inhibited',
        mechanism: 'Direct factor Xa inhibitors bind and inhibit activated factor X, a central catalytic component upstream of thrombin generation in the common coagulation pathway.',
      },
      {
        id: 'prothrombinase',
        layer: 'molecular',
        label: 'Prothrombinase activity is reduced',
        mechanism: 'Inhibiting Xa reduces conversion of prothrombin toward thrombin within the prothrombinase complex and decreases amplification of coagulation signaling.',
      },
      {
        id: 'thrombin-generation',
        layer: 'cellular',
        label: 'Thrombin generation decreases',
        mechanism: 'Lower thrombin generation reduces fibrin formation and thrombin-dependent amplification, while platelet and vascular components of hemostasis remain separate interacting systems.',
      },
      {
        id: 'fibrin-propagation',
        layer: 'organ',
        label: 'Fibrin-rich thrombus propagation is constrained',
        mechanism: 'At the vascular-organ level, reduced coagulation amplification changes the capacity for fibrin-rich thrombus growth without mechanically dissolving an existing clot in this model.',
      },
      {
        id: 'vte-context',
        layer: 'systems',
        label: 'VTE coagulation branch is modified',
        mechanism: 'The mechanism intersects the venous-thromboembolism cascade, but this atlas does not choose an anticoagulant, determine duration, estimate bleeding risk or model treatment eligibility.',
      },
    ],
    equations: [
      {
        expression: 'prothrombin →(Xa/Va complex)→ thrombin → fibrin formation',
        label: 'Simplified common-pathway relationship',
        note: 'Conceptual coagulation-pathway teaching relationship only; it is not a quantitative coagulation assay, dose model or patient bleeding/thrombosis prediction.',
      },
    ],
    evidence: [
      {
        pmid: '22250655',
        title: 'Apixaban: a new player in the anticoagulant class.',
        year: 2012,
        url: 'https://pubmed.ncbi.nlm.nih.gov/22250655/',
        role: 'Review anchor for direct factor Xa inhibition, target selectivity and factor-Xa-centered anticoagulant pharmacology using apixaban as a representative molecule.',
      },
      {
        pmid: '38846994',
        title: 'Epidemiology, Etiology, and Pathophysiology of Pulmonary Embolism.',
        year: 2024,
        url: 'https://pubmed.ncbi.nlm.nih.gov/38846994/',
        role: 'Pathophysiology anchor linking coagulation and venous thrombosis to pulmonary embolic disease without turning the mechanism layer into treatment advice.',
      },
    ],
    boundary: EDUCATIONAL_BOUNDARY,
  },
  {
    id: 'pcsk9-inhibition',
    classLabel: 'PCSK9 pathway inhibition',
    representativeExamples: ['evolocumab', 'alirocumab', 'inclisiran'],
    targetLabel: 'PCSK9 pathway / LDL-receptor degradation control',
    summary:
      'Expose a second lipid-lowering route that acts through preservation of hepatic LDL receptors, making the shared LDLR endpoint visible while keeping the molecular target distinct from statin HMGCR inhibition.',
    atlasSystemIds: ['cardiovascular', 'digestive'],
    physiologySystemIds: ['cardiovascular', 'hepatic-metabolic'],
    linkedScenarioIds: ['atherosclerosis', 'ischemic-stroke'],
    mechanismChain: [
      {
        id: 'pcsk9-pathway',
        layer: 'target',
        label: 'PCSK9 pathway is inhibited',
        mechanism: 'PCSK9-targeting strategies reduce the pathway that promotes hepatic LDL-receptor degradation; individual agents achieve this through different molecular modalities.',
      },
      {
        id: 'ldlr-degradation',
        layer: 'molecular',
        label: 'LDL-receptor degradation decreases',
        mechanism: 'Reduced PCSK9 pathway activity allows more LDL receptors to avoid lysosomal degradation and remain available for recycling or expression at the hepatocyte surface.',
      },
      {
        id: 'ldlr-availability',
        layer: 'cellular',
        label: 'Functional hepatocyte LDLR availability increases',
        mechanism: 'More functional LDL receptors increase the cellular capacity for receptor-mediated uptake of circulating LDL particles.',
      },
      {
        id: 'hepatic-clearance',
        layer: 'organ',
        label: 'Hepatic LDL clearance increases',
        mechanism: 'The liver clears more circulating LDL particles through the preserved LDL-receptor pool, converging on an endpoint shared with but mechanistically distinct from statin therapy.',
      },
      {
        id: 'atherogenic-context',
        layer: 'systems',
        label: 'Atherogenic lipoprotein exposure is modified',
        mechanism: 'The atlas connects LDL-receptor preservation to atherosclerotic disease biology but does not infer target LDL levels, medication selection or individual vascular-event risk.',
      },
    ],
    equations: [
      {
        expression: 'LDLR availability ≈ receptor synthesis + recycling − degradation',
        label: 'Conceptual receptor-pool balance',
        note: 'Teaching mass-balance analogy only; it is not a validated patient LDL-receptor or LDL-C response model.',
      },
    ],
    evidence: [
      {
        pmid: '40911366',
        title: 'The evolving landscape of targets for lipid lowering: from molecular mechanisms to translational implications.',
        year: 2025,
        url: 'https://pubmed.ncbi.nlm.nih.gov/40911366/',
        role: 'Recent review anchor for PCSK9 inhibition, prevention of LDL-receptor degradation and comparison with other molecular lipid-lowering targets.',
      },
      {
        pmid: '19299327',
        title: 'The LDL receptor.',
        year: 2009,
        url: 'https://pubmed.ncbi.nlm.nih.gov/19299327/',
        role: 'Foundational LDL-receptor biology anchor for receptor-mediated endocytosis, receptor recycling and feedback control shared across lipid-lowering mechanism maps.',
      },
    ],
    boundary: EDUCATIONAL_BOUNDARY,
  },
] as const

export const BODY_PHARMACOLOGY_NETWORK_BOUNDARY =
  'Educational pharmacology-mechanism network only. It explains class-level target-to-system relationships and literature provenance; it does not prescribe, dose, select treatment, determine contraindications, calculate interactions, estimate patient-specific benefit or harm, or replace official prescribing information and clinical judgment.'

export const PHARMACOLOGY_TEACHING_EQUATIONS: readonly PharmacologyTeachingEquation[] = [
  {
    expression: 'fractional occupancy ≈ C / (C + Kd)',
    label: 'Simplified receptor-occupancy relationship',
    note: 'Conceptual teaching equation for reversible one-site binding at equilibrium; it is not a dosing calculator and many drugs in this atlas do not follow this simplified model directly.',
  },
  {
    expression: 'E / Emax ≈ C / (EC50 + C)',
    label: 'Simplified Emax relationship',
    note: 'Conceptual concentration-effect relationship only; no patient concentration, EC50, Emax, exposure-response or dose recommendation is generated.',
  },
] as const

export function getBodyPharmacologyMechanism(id: PharmacologyMechanismId): BodyPharmacologyMechanism {
  const mechanism = BODY_PHARMACOLOGY_MECHANISM_NETWORK.find((item) => item.id === id)
  if (!mechanism) throw new Error(`Unknown pharmacology mechanism: ${id}`)
  return mechanism
}

export function listBodyPharmacologyForAtlasSystem(systemId: BodySystemId): readonly BodyPharmacologyMechanism[] {
  return BODY_PHARMACOLOGY_MECHANISM_NETWORK.filter((item) => item.atlasSystemIds.includes(systemId))
}

export function listBodyPharmacologyForScenario(scenarioId: BodyPathophysiologyScenarioId): readonly BodyPharmacologyMechanism[] {
  return BODY_PHARMACOLOGY_MECHANISM_NETWORK.filter((item) => item.linkedScenarioIds.includes(scenarioId))
}
