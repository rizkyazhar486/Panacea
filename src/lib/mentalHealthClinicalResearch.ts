export type MentalHealthResearchDomain = 'depression' | 'anxiety' | 'loneliness'

export type MentalHealthEvidenceClass =
  | 'established-clinical'
  | 'approved-context'
  | 'emerging-human'
  | 'mechanistic-hypothesis'
  | 'research-only'

export type MentalHealthMechanismLayer =
  | 'compound'
  | 'target'
  | 'synapse'
  | 'signaling'
  | 'network'
  | 'phenotype'

export interface MentalHealthResearchEvidence {
  readonly pmid: string
  readonly title: string
  readonly year: number
  readonly url: string
  readonly role: string
}

export interface MentalHealthMechanismStep {
  readonly id: string
  readonly layer: MentalHealthMechanismLayer
  readonly label: string
  readonly detail: string
}

export interface MentalHealthCompoundModel {
  readonly id: string
  readonly name: string
  readonly domains: readonly MentalHealthResearchDomain[]
  readonly evidenceClass: MentalHealthEvidenceClass
  readonly clinicalContext: string
  readonly targets: readonly string[]
  readonly mechanism: readonly MentalHealthMechanismStep[]
  readonly evidence: readonly MentalHealthResearchEvidence[]
  readonly guardrail: string
}

const RESEARCH_GUARDRAIL =
  'Research/education model only. It does not select a medicine, calculate a clinical dose, determine eligibility, predict an individual treatment response, or replace prescribing information and clinician judgment.'

export const MENTAL_HEALTH_COMPOUND_MODELS: readonly MentalHealthCompoundModel[] = [
  {
    id: 'dextromethorphan-bupropion',
    name: 'Dextromethorphan + bupropion',
    domains: ['depression'],
    evidenceClass: 'established-clinical',
    clinicalContext:
      'Approved antidepressant combination for major depressive disorder in adults; represented here to expose the PK/PD interaction rather than to recommend use.',
    targets: ['NMDA receptor modulation', 'sigma-1 receptor', 'NET/DAT context', 'CYP2D6 inhibition'],
    mechanism: [
      {
        id: 'dxb-compound',
        layer: 'compound',
        label: 'Combined pharmacology',
        detail:
          'Dextromethorphan contributes NMDA/sigma-1 pharmacology while bupropion contributes catecholaminergic activity and inhibits CYP2D6.',
      },
      {
        id: 'dxb-pk',
        layer: 'target',
        label: 'CYP2D6 interaction changes exposure',
        detail:
          'Bupropion inhibits CYP2D6, slowing dextromethorphan metabolism and changing systemic exposure relative to dextromethorphan alone.',
      },
      {
        id: 'dxb-glutamate',
        layer: 'synapse',
        label: 'Glutamatergic signaling context',
        detail:
          'NMDA-related pharmacology alters glutamatergic signaling; the model does not convert this into a patient-specific remission probability.',
      },
      {
        id: 'dxb-network',
        layer: 'network',
        label: 'Distributed antidepressant network response',
        detail:
          'Clinical effects emerge from distributed network adaptation rather than from a single neurotransmitter concentration.',
      },
    ],
    evidence: [
      {
        pmid: '38993656',
        title: 'The Black Book of Psychotropic Dosing and Monitoring.',
        year: 2024,
        url: 'https://pubmed.ncbi.nlm.nih.gov/38993656/',
        role: 'Review anchor for dextromethorphan-bupropion PK/PD interaction and contemporary antidepressant pharmacology.',
      },
    ],
    guardrail: RESEARCH_GUARDRAIL,
  },
  {
    id: 'esketamine',
    name: 'Esketamine',
    domains: ['depression'],
    evidenceClass: 'approved-context',
    clinicalContext:
      'Clinical treatment in defined depressive indications/settings; the research model emphasizes rapid glutamatergic mechanisms and unresolved response biomarkers.',
    targets: ['NMDA receptor', 'AMPA throughput context', 'BDNF/plasticity pathways', 'network connectivity'],
    mechanism: [
      {
        id: 'esk-nmda',
        layer: 'target',
        label: 'NMDA-receptor pharmacology',
        detail:
          'Esketamine changes glutamatergic signaling through NMDA-receptor pharmacology rather than acting as a conventional monoamine reuptake inhibitor.',
      },
      {
        id: 'esk-ampa',
        layer: 'synapse',
        label: 'AMPA-throughput/plasticity hypothesis',
        detail:
          'Rapid antidepressant models emphasize downstream AMPA throughput and plasticity-associated signaling; exact patient-level mediation remains incompletely resolved.',
      },
      {
        id: 'esk-biomarkers',
        layer: 'signaling',
        label: 'Biomarker research layer',
        detail:
          'Inflammatory, mitochondrial, proteomic and metabolomic correlates are under study and must remain hypotheses until prospectively validated.',
      },
      {
        id: 'esk-network',
        layer: 'network',
        label: 'Prefrontal-striatal-cingulate network context',
        detail:
          'Neuroimaging work implicates distributed cortical/subcortical networks; this is not a deterministic predictor of response.',
      },
    ],
    evidence: [
      {
        pmid: '38997425',
        title: 'Esketamine in depression: putative biomarkers from clinical research.',
        year: 2025,
        url: 'https://pubmed.ncbi.nlm.nih.gov/38997425/',
        role: 'Review anchor for putative biomarkers, neuroimaging and mechanistic personalization research.',
      },
    ],
    guardrail: RESEARCH_GUARDRAIL,
  },
  {
    id: 'zuranolone',
    name: 'Zuranolone',
    domains: ['depression'],
    evidenceClass: 'approved-context',
    clinicalContext:
      'Approved for postpartum depression in the United States. This model must not generalize that approval to ordinary major depressive disorder.',
    targets: ['synaptic GABA-A receptors', 'extrasynaptic GABA-A receptors', 'neurosteroid signaling'],
    mechanism: [
      {
        id: 'zur-neurosteroid',
        layer: 'compound',
        label: 'Neuroactive-steroid analogue',
        detail:
          'Zuranolone is an orally available neuroactive steroid related to allopregnanolone biology.',
      },
      {
        id: 'zur-gabaa',
        layer: 'target',
        label: 'GABA-A positive allosteric modulation',
        detail:
          'Positive allosteric modulation includes synaptic and extrasynaptic GABA-A receptor populations.',
      },
      {
        id: 'zur-inhibition',
        layer: 'network',
        label: 'Inhibitory-network modulation',
        detail:
          'Network effects reflect altered inhibitory tone; sedation and dizziness remain clinically relevant safety context.',
      },
    ],
    evidence: [
      {
        pmid: '38976049',
        title: 'Neurosteroids and translocator protein 18 kDa (TSPO) ligands as novel treatment options in depression.',
        year: 2025,
        url: 'https://pubmed.ncbi.nlm.nih.gov/38976049/',
        role: 'Review anchor for GABA-A neurosteroid pharmacology and the postpartum-depression regulatory boundary.',
      },
    ],
    guardrail:
      RESEARCH_GUARDRAIL +
      ' Regulatory scope is explicit: postpartum depression approval must not be presented as approval for general MDD.',
  },
  {
    id: 'buspirone',
    name: 'Buspirone',
    domains: ['anxiety'],
    evidenceClass: 'established-clinical',
    clinicalContext:
      'An established non-benzodiazepine anxiolytic used in generalized anxiety disorder; represented as a serotonergic mechanism, not as an instant-relief model.',
    targets: ['5-HT1A receptor', 'serotonergic network adaptation'],
    mechanism: [
      {
        id: 'bus-5ht1a',
        layer: 'target',
        label: '5-HT1A partial agonism',
        detail:
          'Buspirone acts prominently at 5-HT1A receptors rather than through benzodiazepine-site GABA-A receptor modulation.',
      },
      {
        id: 'bus-serotonin',
        layer: 'synapse',
        label: 'Serotonergic adaptation',
        detail:
          'Clinical anxiolysis develops over time and should not be simulated as an immediate sedative effect.',
      },
      {
        id: 'bus-network',
        layer: 'network',
        label: 'Anxiety-network modulation',
        detail:
          'The research graph connects serotonergic adaptation with anxiety circuitry without claiming deterministic symptom reduction.',
      },
    ],
    evidence: [
      {
        pmid: '16856115',
        title: 'Azapirones for generalized anxiety disorder.',
        year: 2006,
        url: 'https://pubmed.ncbi.nlm.nih.gov/16856115/',
        role: 'Systematic-review anchor for azapirones including buspirone in generalized anxiety disorder.',
      },
      {
        pmid: '2836252',
        title: 'Buspirone, a new approach to the treatment of anxiety.',
        year: 1988,
        url: 'https://pubmed.ncbi.nlm.nih.gov/2836252/',
        role: 'Mechanistic review anchor for 5-HT1A pharmacology.',
      },
    ],
    guardrail: RESEARCH_GUARDRAIL,
  },
  {
    id: 'oxytocin-loneliness-hypothesis',
    name: 'Oxytocin / social-salience research',
    domains: ['loneliness'],
    evidenceClass: 'research-only',
    clinicalContext:
      'There is no established medication that simply treats loneliness. Oxytocin is represented only as a mechanistic social-salience research hypothesis.',
    targets: ['oxytocin signaling', 'mesolimbic salience', 'social attention', 'rejection-vigilance context'],
    mechanism: [
      {
        id: 'oxy-signal',
        layer: 'target',
        label: 'Oxytocin signaling',
        detail:
          'Oxytocin may alter the salience of social information; it should not be modeled as a universal prosocial or anti-loneliness switch.',
      },
      {
        id: 'oxy-attention',
        layer: 'network',
        label: 'Attention-bias interaction',
        detail:
          'The same salience mechanism may support affiliation in some people while amplifying rejection vigilance in loneliness-vulnerable states.',
      },
      {
        id: 'oxy-behavior',
        layer: 'phenotype',
        label: 'Reconnection versus avoidance',
        detail:
          'Behavioral outcome depends on cognition, context and prior social learning; pharmacology alone does not resolve chronic loneliness.',
      },
    ],
    evidence: [
      {
        pmid: '41067329',
        title: 'The oxytocin-attention loop of loneliness.',
        year: 2025,
        url: 'https://pubmed.ncbi.nlm.nih.gov/41067329/',
        role: 'Theoretical bio-behavioral model for oxytocin, attention bias and chronic loneliness.',
      },
      {
        pmid: '41129341',
        title: 'Are loneliness interventions effective for reducing loneliness? A meta-analytic review of 280 studies.',
        year: 2026,
        url: 'https://pubmed.ncbi.nlm.nih.gov/41129341/',
        role: 'Clinical-context anchor showing that loneliness intervention evidence is primarily psychosocial/behavioral rather than a validated compound solution.',
      },
    ],
    guardrail:
      RESEARCH_GUARDRAIL +
      ' Do not present oxytocin as an approved or established treatment for loneliness.',
  },
]

export type MentalHealthDailyBehaviorId =
  | 'movement'
  | 'social-connection'
  | 'circadian-sleep'
  | 'nutrition'
  | 'hydration'
  | 'purpose-learning'
  | 'recovery'
  | 'compulsion-boundary'

export interface MentalHealthDailyBehavior {
  readonly id: MentalHealthDailyBehaviorId
  readonly label: string
  readonly intent: string
  readonly measurement: string
  readonly boundary: string
}

export const MENTAL_HEALTH_DAILY_BEHAVIORS: readonly MentalHealthDailyBehavior[] = [
  {
    id: 'movement',
    label: 'Movement / training',
    intent: 'Create a repeatable physical-activity exposure rather than a one-off motivation task.',
    measurement: 'Minutes, modality, intensity context, completion and next-day recovery.',
    boundary: 'Not a substitute for indicated psychiatric care and not a fixed exercise prescription.',
  },
  {
    id: 'social-connection',
    label: 'Meaningful social contact',
    intent: 'Track actual connection opportunities, not passive social-media exposure.',
    measurement: 'Count/duration of meaningful interactions plus subjective connection after the interaction.',
    boundary: 'The system must not infer relationship quality from message volume alone.',
  },
  {
    id: 'circadian-sleep',
    label: 'Circadian + sleep routine',
    intent: 'Track sleep opportunity, regularity and daylight timing as longitudinal context.',
    measurement: 'Sleep/wake timing, regularity, daylight exposure and validated wearable signals when available.',
    boundary: 'Wearable sleep stages remain estimates unless supported by validated measurement.',
  },
  {
    id: 'nutrition',
    label: 'Nutrition foundation',
    intent: 'Track repeatable whole-food, protein, fiber and meal-timing patterns rather than moral labels such as clean/dirty food.',
    measurement: 'Meal pattern, protein/fiber context, fruit/vegetable exposure and relevant metabolic data.',
    boundary: 'No psychiatric benefit should be attributed to a single food without evidence.',
  },
  {
    id: 'hydration',
    label: 'Hydration target',
    intent: 'Track hydration as an individualized routine; a 2 L goal may be user-chosen but must not be universalized.',
    measurement: 'Intake estimate plus activity, climate, body-size and fluid-loss context when available.',
    boundary: 'Do not prescribe a fixed fluid target for conditions requiring fluid restriction or special management.',
  },
  {
    id: 'purpose-learning',
    label: 'Purpose / reading / learning',
    intent: 'Create a daily mastery or meaning exposure such as reading, study or a purposeful task.',
    measurement: 'Minutes and completion, with optional reflection on perceived mastery/meaning.',
    boundary: 'Completion is a behavior signal, not a proxy diagnosis or mental-health score.',
  },
  {
    id: 'recovery',
    label: 'Recovery / low-arousal practice',
    intent: 'Track meditation, breathing, nature or other deliberate recovery behavior as repeated exposures.',
    measurement: 'Duration plus pre/post subjective state and available HR/HRV context.',
    boundary: 'Physiologic changes must not be overstated as proof of psychiatric efficacy.',
  },
  {
    id: 'compulsion-boundary',
    label: 'User-defined compulsion boundary',
    intent:
      'Allow a person to track pornography, masturbation, gambling, alcohol, scrolling or another behavior only when it is a chosen goal or associated with loss of control/impairment.',
    measurement: 'Urges, episodes, triggers, interference, chosen limits and longitudinal functional impact.',
    boundary:
      'Panacea must not encode masturbation abstinence as a universal antidepressant, anxiolytic, testosterone or longevity intervention.',
  },
]

export interface NormalizedExposureInput {
  halfLifeHours: number
  elapsedHours: number
}

export interface ReceptorOccupancyInput {
  ligandConcentration: number
  dissociationConstant: number
}

export interface NormalizedExposureResult {
  fractionRemaining: number
  formula: 'C(t)/C0 = 2^(-t/t1/2)'
}

export interface ReceptorOccupancyResult {
  occupancyFraction: number
  formula: 'theta = [L] / (Kd + [L])'
}

/**
 * Dimensionless teaching model only.
 *
 * C(t)/C0 = 2^(-t/t1/2)
 *
 * This does not infer a clinical half-life, active metabolite contribution,
 * absorption phase, nonlinear kinetics, brain exposure, or patient PK.
 */
export function simulateNormalizedExposure(
  input: NormalizedExposureInput,
): NormalizedExposureResult | null {
  if (
    !Number.isFinite(input.halfLifeHours) ||
    !Number.isFinite(input.elapsedHours) ||
    input.halfLifeHours <= 0 ||
    input.elapsedHours < 0
  ) {
    return null
  }

  return {
    fractionRemaining: 2 ** (-input.elapsedHours / input.halfLifeHours),
    formula: 'C(t)/C0 = 2^(-t/t1/2)',
  }
}

/**
 * Simple 1:1 equilibrium occupancy teaching model.
 *
 * theta = [L] / (Kd + [L])
 *
 * It must not be interpreted as in-vivo target engagement without a validated
 * free-site concentration, target-specific Kd and appropriate kinetic model.
 */
export function simulateReceptorOccupancy(
  input: ReceptorOccupancyInput,
): ReceptorOccupancyResult | null {
  if (
    !Number.isFinite(input.ligandConcentration) ||
    !Number.isFinite(input.dissociationConstant) ||
    input.ligandConcentration < 0 ||
    input.dissociationConstant <= 0
  ) {
    return null
  }

  return {
    occupancyFraction:
      input.ligandConcentration /
      (input.dissociationConstant + input.ligandConcentration),
    formula: 'theta = [L] / (Kd + [L])',
  }
}

export interface RoutineObservation {
  readonly date: string
  readonly completed: Partial<Record<MentalHealthDailyBehaviorId, boolean>>
}

export interface RoutineSummary {
  readonly observedDays: number
  readonly completedActions: number
  readonly observedActions: number
  readonly completionFraction: number | null
  readonly longestObservedStreakDays: number
  readonly interpretation: string
}

/**
 * Longitudinal behavior summary, deliberately not a mental-health score.
 *
 * adherence = completed observed actions / all observed actions
 *
 * Missing observations are excluded rather than assumed to be failures.
 */
export function summarizeMentalHealthRoutine(
  observations: readonly RoutineObservation[],
): RoutineSummary {
  const sorted = [...observations]
    .filter((item) => !Number.isNaN(Date.parse(item.date)))
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))

  let completedActions = 0
  let observedActions = 0
  let longestObservedStreakDays = 0
  let currentStreak = 0
  let previousDay: number | null = null

  for (const row of sorted) {
    for (const value of Object.values(row.completed)) {
      if (typeof value !== 'boolean') continue
      observedActions += 1
      if (value) completedActions += 1
    }

    const day = Math.floor(Date.parse(row.date) / 86_400_000)
    if (previousDay == null || day === previousDay + 1) currentStreak += 1
    else if (day !== previousDay) currentStreak = 1
    previousDay = day
    longestObservedStreakDays = Math.max(longestObservedStreakDays, currentStreak)
  }

  const completionFraction =
    observedActions > 0 ? completedActions / observedActions : null

  return {
    observedDays: sorted.length,
    completedActions,
    observedActions,
    completionFraction,
    longestObservedStreakDays,
    interpretation:
      'Behavior adherence is an exposure/history descriptor only. It does not diagnose depression, anxiety or loneliness and does not prove that a routine caused a symptom change.',
  }
}

export function compoundsForMentalHealthDomain(
  domain: MentalHealthResearchDomain,
): readonly MentalHealthCompoundModel[] {
  return MENTAL_HEALTH_COMPOUND_MODELS.filter((model) =>
    model.domains.includes(domain),
  )
}
