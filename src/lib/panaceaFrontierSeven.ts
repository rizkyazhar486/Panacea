export type FrontierStatus = 'prototype-ready' | 'research-program' | 'requires-partners'

export type FrontierConcept = {
  id: string
  name: string
  shortName: string
  icon: string
  status: FrontierStatus
  mission: string
  humanProblem: string
  experience: string[]
  inputs: string[]
  outputs: string[]
  safetyBoundary: string
  routes: string[]
}

// These are Panacea experimental product concepts / first-of-kind ambitions.
// The array intentionally does not claim that no comparable idea exists anywhere in the world.
export const PANACEA_FRONTIER_SEVEN: FrontierConcept[] = [
  {
    id: 'human-continuum', name: 'Human Continuum Map', shortName: 'Continuum', icon: '∞', status: 'prototype-ready',
    mission: 'Show a human life as one navigable timeline from biology to behavior, relationships, work, care and meaning instead of seven disconnected apps.',
    humanProblem: 'Health records describe episodes; life happens continuously between them.',
    experience: ['Zoom from decade → year → week → care episode.', 'Overlay body capacity, habits, relationships, learning and life events without collapsing them into one fake score.', 'Let the person decide which layers belong together and which stay private.'],
    inputs: ['User-authored life events', 'Connected health trends when available', 'Care episodes', 'Goals and routines'],
    outputs: ['Narrative timeline', 'Cross-domain collisions', 'Questions worth reviewing'],
    safetyBoundary: 'No inferred diagnosis, emotional state or “life quality” score. Cross-domain patterns are prompts, not causal claims.', routes: ['/my-story', '/life-compass', '/tubuh'],
  },
  {
    id: 'physiology-decision-lens', name: 'Physiology-to-Decision Lens', shortName: 'Decision Lens', icon: '⇢', status: 'prototype-ready',
    mission: 'Trace one health question through whole body → organ → tissue → cell → molecule → observable signal → decision boundary.',
    humanProblem: 'People see a result or symptom but rarely see the mechanistic chain connecting it to a decision.',
    experience: ['Select a symptom, metric or disease concept.', 'Walk the causal chain and surface where uncertainty enters.', 'Open anatomy, evidence, lab and treatment tools at the exact stage where they become relevant.'],
    inputs: ['Educational physiology maps', 'Validated user measurements when connected', 'Current evidence sources'],
    outputs: ['Mechanism chain', 'Uncertainty nodes', 'Decision questions'],
    safetyBoundary: 'Educational unless validated patient data and a clinical workflow are explicitly connected. It must not autonomously diagnose or prescribe.', routes: ['/body-explorer', '/knowledge-bridge'],
  },
  {
    id: 'future-self-simulator', name: 'Future-Self Counterfactual Studio', shortName: 'Future Self', icon: '◌', status: 'research-program',
    mission: 'Let a person compare plausible futures under different routines while showing uncertainty instead of pretending to predict destiny.',
    humanProblem: 'Long-term choices feel abstract because consequences are delayed and uncertain.',
    experience: ['Change sleep opportunity, activity, smoking/alcohol exposure, learning time, social time or savings behavior.', 'Show direction-of-effect and confidence separately from magnitude.', 'Compare scenarios side-by-side and keep “unknown” visible.'],
    inputs: ['User-selected scenarios', 'Validated risk equations only where appropriate', 'Evidence confidence'],
    outputs: ['Scenario comparison', 'Uncertainty interval / evidence grade', 'Reversible next experiment'],
    safetyBoundary: 'Never present simulated futures as individual prognosis. Unsupported domains remain qualitative.', routes: ['/health-simulator', '/life-compass'],
  },
  {
    id: 'family-constellation', name: 'Family Health Constellation', shortName: 'Constellation', icon: '✦', status: 'prototype-ready',
    mission: 'Map the care network around a family: who depends on whom, who knows what, and where continuity fails during illness or crisis.',
    humanProblem: 'Families often discover missing medication lists, emergency contacts and caregiving responsibilities only during a crisis.',
    experience: ['Build roles without assigning medical judgments.', 'See emergency information, care tasks and backup people.', 'Create handoff cards for travel, hospitalization or elder care.'],
    inputs: ['Explicit family roles', 'Shared-by-consent information', 'Emergency and care plans'],
    outputs: ['Care graph', 'Responsibility gaps', 'Portable handoff summary'],
    safetyBoundary: 'Consent and minimum-necessary sharing are mandatory. No genetic or health inference about relatives from another person’s record.', routes: ['/family-health', '/emergency-card'],
  },
  {
    id: 'friction-radar', name: 'Human Friction Radar', shortName: 'Friction Radar', icon: '⌁', status: 'prototype-ready',
    mission: 'Treat time, money, transportation, knowledge, social support and work constraints as part of the care plan rather than footnotes.',
    humanProblem: 'A medically correct plan can fail because it ignores the life that must execute it.',
    experience: ['The person chooses which constraints are real.', 'Translate each constraint into practical alternatives: timing, cost, transport, reminders, home options or simpler plans.', 'Show which barrier is blocking the next useful action.'],
    inputs: ['User-declared constraints', 'Local service data when connected', 'Care plan requirements'],
    outputs: ['Barrier map', 'Low-friction alternatives', 'Questions for clinician/service team'],
    safetyBoundary: 'Do not infer poverty, social class or vulnerability. Sensitive constraints are user-declared and private by default.', routes: ['/marketplace', '/planning'],
  },
  {
    id: 'knowledge-care-compiler', name: 'Knowledge-to-Care Compiler', shortName: 'Care Compiler', icon: '⌘', status: 'prototype-ready',
    mission: 'Compile one evidence-backed concept into different usable forms: patient explanation, student mechanism map, clinician checklist and family handoff.',
    humanProblem: 'The same medical truth is often unusable because it is delivered at the wrong depth or in the wrong format.',
    experience: ['Start from a source-backed topic.', 'Select audience and decision.', 'Generate a structured explanation with provenance, uncertainty and teach-back prompts.'],
    inputs: ['Verified source snippets', 'Ontology terms', 'Audience and purpose'],
    outputs: ['Layered explanations', 'Teach-back checklist', 'Source trail'],
    safetyBoundary: 'Transformation must preserve source meaning and uncertainty. Generated text cannot silently upgrade evidence strength.', routes: ['/knowledge-bridge', '/med-study'],
  },
  {
    id: 'humanity-commons', name: 'Humanity Health Commons', shortName: 'Commons', icon: '◎', status: 'requires-partners',
    mission: 'Turn individual health software into voluntary civic health infrastructure: knowledge sharing, blood-donation readiness, caregiving, prevention and local mutual aid.',
    humanProblem: 'Health apps optimize individuals while many health outcomes depend on communities and shared capacity.',
    experience: ['Choose voluntary contributions: verified education, donation availability, community exercise, caregiving or emergency preparedness.', 'Match needs and capacity through trusted organizations.', 'Show impact as completed contributions, never a moral score.'],
    inputs: ['Explicit opt-in', 'Partner-verified opportunities', 'Location only when needed and consented'],
    outputs: ['Community opportunities', 'Verified contribution history', 'Local preparedness map'],
    safetyBoundary: 'No coercion, public health-status ranking or resale of sensitive data. Real deployment requires trusted institutional partners.', routes: ['/community', '/organ-donor-card'],
  },
]

export function frontierReadiness(status: FrontierStatus) {
  if (status === 'prototype-ready') return 70
  if (status === 'research-program') return 40
  return 25
}
