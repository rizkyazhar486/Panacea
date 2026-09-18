export type PanaceaSurface =
  | 'your-body'
  | 'body-exposure'
  | 'clinical'
  | 'ai-emr'
  | 'for-you'

export type SurfaceInteractionMode =
  | 'semantic-zoom'
  | 'drill-down'
  | 'progressive-disclosure'

export interface SurfaceDepthStop {
  id: string
  label: string
  purpose: string
}

export interface SurfaceDepthContract {
  surface: PanaceaSurface
  mode: SurfaceInteractionMode
  stops: readonly SurfaceDepthStop[]
  mainSurfaceRule: string
  disclosureRule: string
}

/**
 * Shared product-level depth contract.
 *
 * Important: only Body Exposure uses camera/representation semantic zoom.
 * Clinical, AI-EMR, Your Body and For You use drill-down/progressive disclosure.
 * This prevents a visual zoom metaphor from being confused with clinical certainty,
 * physical magnification, or patient-specific biological resolution.
 */
export const SURFACE_DEPTH_CONTRACTS: Readonly<Record<PanaceaSurface, SurfaceDepthContract>> = {
  'body-exposure': {
    surface: 'body-exposure',
    mode: 'semantic-zoom',
    stops: [
      { id: 'whole-body', label: 'Whole body', purpose: 'Orient on the complete human body and major systems.' },
      { id: 'system', label: 'System', purpose: 'Isolate a validated organ system while preserving orientation.' },
      { id: 'organ', label: 'Organ', purpose: 'Inspect source-backed gross organ anatomy.' },
      { id: 'tissue', label: 'Tissue', purpose: 'Switch to source-backed microanatomy or histology representation.' },
      { id: 'cell', label: 'Cell', purpose: 'Show cell-type-appropriate reference biology when provenance exists.' },
      { id: 'organelle', label: 'Organelle', purpose: 'Inspect subcellular structures without claiming gross spatial continuity.' },
      { id: 'molecule', label: 'Molecule / pathway', purpose: 'Use verified molecular or pathway references.' },
      { id: 'genome', label: 'Genome / DNA', purpose: 'Use reference sequence, chromatin or genomic representations.' },
    ],
    mainSurfaceRule: 'Anatomy/data first; keep persistent explanatory copy to one concise sentence per visible item.',
    disclosureRule: 'Longer interpretation belongs in a contextual drawer, sheet or details view and must retain provenance.',
  },
  'your-body': {
    surface: 'your-body',
    mode: 'drill-down',
    stops: [
      { id: 'today', label: 'Today', purpose: 'Daily physiology and readiness overview.' },
      { id: 'domain', label: 'Domain', purpose: 'Training, recovery, sleep, nutrition, vitals or body composition.' },
      { id: 'metric', label: 'Metric', purpose: 'One measured or derived signal with trend and units.' },
      { id: 'session', label: 'Session', purpose: 'Workout, run, ride, swim, recovery or sleep episode.' },
      { id: 'sample', label: 'Sample', purpose: 'Time-series sample or event detail.' },
      { id: 'source', label: 'Source', purpose: 'Device/manual source, timestamp, confidence and provenance.' },
    ],
    mainSurfaceRule: 'WHOOP/Garmin-like health OS: charts, numbers, trends and body visualization dominate.',
    disclosureRule: 'Interpretation is hidden behind an Info/Interpret action and limited to one short paragraph.',
  },
  clinical: {
    surface: 'clinical',
    mode: 'drill-down',
    stops: [
      { id: 'overview', label: 'Overview', purpose: 'Present the clinical topic, problem or question.' },
      { id: 'condition', label: 'Condition', purpose: 'Disease definition, differential and phenotype.' },
      { id: 'mechanism', label: 'Mechanism', purpose: 'Anatomy, physiology and pathophysiology links.' },
      { id: 'assessment', label: 'Assessment', purpose: 'Look-and-learn, examination, labs, imaging, scores and calculators.' },
      { id: 'management', label: 'Management', purpose: 'Treatment pathways, drug dosing references and follow-up.' },
      { id: 'coding', label: 'Coding', purpose: 'ICD-11 and compatible coding context where source-backed.' },
      { id: 'evidence', label: 'Evidence', purpose: 'Guideline, source, publication status and uncertainty.' },
    ],
    mainSurfaceRule: 'Clinical workspace is visual/action-first; calculators, diagrams, tables and decision paths come before prose.',
    disclosureRule: 'Education and evidence explanation expand contextually; never hide safety-critical warnings.',
  },
  'ai-emr': {
    surface: 'ai-emr',
    mode: 'drill-down',
    stops: [
      { id: 'timeline', label: 'Timeline', purpose: 'Longitudinal patient history and major care events.' },
      { id: 'encounter', label: 'Encounter', purpose: 'Visit, episode or care interaction.' },
      { id: 'problem', label: 'Problem', purpose: 'Problem list, diagnosis and clinical context.' },
      { id: 'observation', label: 'Observation', purpose: 'Vitals, exam, symptom, lab and imaging observations.' },
      { id: 'resource', label: 'Resource', purpose: 'Structured EMR/FHIR-compatible resource detail.' },
      { id: 'provenance', label: 'Provenance', purpose: 'Author, source, timestamp, confidence, verification and audit trail.' },
    ],
    mainSurfaceRule: 'Timeline and structured clinical state first; avoid duplicating a text-heavy paper chart.',
    disclosureRule: 'Every AI-derived element must be inspectable down to source/provenance and remain clinician-verifiable.',
  },
  'for-you': {
    surface: 'for-you',
    mode: 'progressive-disclosure',
    stops: [
      { id: 'day', label: 'Day', purpose: 'A compact stack of meaningful daily widgets.' },
      { id: 'stack', label: 'Stack', purpose: 'Music, sports, faith, mental wellbeing, motivation, books, stories and life tools.' },
      { id: 'widget', label: 'Widget', purpose: 'One visual-first mini-app or live card.' },
      { id: 'detail', label: 'Detail', purpose: 'Optional short contextual explanation or controls.' },
      { id: 'source', label: 'Source', purpose: 'Connected provider, local state or explicit unavailable state.' },
    ],
    mainSurfaceRule: 'Fun and glanceable: use media, scores, charts, numbers and compact controls rather than paragraphs.',
    disclosureRule: 'One sentence on the scrolling surface; optional Info reveals one short paragraph.',
  },
}

export function getSurfaceDepthContract(surface: PanaceaSurface): SurfaceDepthContract {
  return SURFACE_DEPTH_CONTRACTS[surface]
}

export function getSurfaceDepthStop(surface: PanaceaSurface, stopId: string): SurfaceDepthStop | undefined {
  return SURFACE_DEPTH_CONTRACTS[surface].stops.find((stop) => stop.id === stopId)
}
