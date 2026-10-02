export type BaroreflexPerturbation = 'pressure-rise' | 'pressure-fall'

export interface BaroreflexResponse {
  perturbation: BaroreflexPerturbation
  sensorStretchDirection: 'increase' | 'decrease'
  afferentFiringDirection: 'increase' | 'decrease'
  sympatheticDirection: 'increase' | 'decrease'
  vagalDirection: 'increase' | 'decrease'
  heartRateDirection: 'increase' | 'decrease'
  contractilityDirection: 'increase' | 'decrease'
  arteriolarToneDirection: 'increase' | 'decrease'
  venousToneDirection: 'increase' | 'decrease'
  truthClass: 'generic-physiology'
}

export const BAROREFLEX_PATHWAY = [
  {
    id: 'carotid-sinus',
    anatomy: 'Carotid sinus',
    afferent: 'Glossopharyngeal nerve (CN IX) via carotid sinus nerve',
    centralTarget: 'Nucleus tractus solitarius (NTS)',
  },
  {
    id: 'aortic-arch',
    anatomy: 'Aortic arch baroreceptors',
    afferent: 'Vagus nerve (CN X)',
    centralTarget: 'Nucleus tractus solitarius (NTS)',
  },
] as const

export const BAROREFLEX_EVIDENCE = [
  {
    id: 'statpearls-baroreceptors',
    reference: 'NCBI Bookshelf NBK538172',
    role: 'Supports carotid-sinus and aortic-arch stretch sensing, CN IX/X afferents, NTS integration, and reciprocal autonomic responses to arterial-pressure perturbation.',
  },
  {
    id: 'pmid-24095187',
    reference: 'PMID 24095187',
    role: 'Review anchor for arterial baroreflex control of sympathetic and parasympathetic cardiovascular outflow.',
  },
] as const

export const BAROREFLEX_BOUNDARY =
  'Generic short-term arterial baroreflex topology and directionality only. This model does not estimate a patient blood pressure, heart rate, autonomic tone, baroreflex sensitivity, orthostatic tolerance, syncope risk, shock state, medication response, or diagnosis. Chronic pressure resetting, cardiopulmonary reflexes, chemoreflexes, vestibulosympathetic responses, endocrine/renal volume control, and disease-specific autonomic remodeling require separate models.'

export function deriveBaroreflexDirection(
  perturbation: BaroreflexPerturbation,
): BaroreflexResponse {
  if (perturbation === 'pressure-rise') {
    return {
      perturbation,
      sensorStretchDirection: 'increase',
      afferentFiringDirection: 'increase',
      sympatheticDirection: 'decrease',
      vagalDirection: 'increase',
      heartRateDirection: 'decrease',
      contractilityDirection: 'decrease',
      arteriolarToneDirection: 'decrease',
      venousToneDirection: 'decrease',
      truthClass: 'generic-physiology',
    }
  }
  if (perturbation === 'pressure-fall') {
    return {
      perturbation,
      sensorStretchDirection: 'decrease',
      afferentFiringDirection: 'decrease',
      sympatheticDirection: 'increase',
      vagalDirection: 'decrease',
      heartRateDirection: 'increase',
      contractilityDirection: 'increase',
      arteriolarToneDirection: 'increase',
      venousToneDirection: 'increase',
      truthClass: 'generic-physiology',
    }
  }
  throw new Error(`unsupported baroreflex perturbation: ${String(perturbation)}`)
}
