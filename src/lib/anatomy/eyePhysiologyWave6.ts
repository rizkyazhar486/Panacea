export type EyePhysiologyTrack = 'aqueous-flow' | 'accommodation' | 'pupillary-light-reflex'
export type EyePhysiologyRepresentation = 'educational-pathway-only'
export type EyePhysiologyReviewStatus = 'academic-review-pending'

export interface EyePhysiologyEvidence {
  source: 'NCBI Bookshelf' | 'PMC'
  locator: string
  retrievedOn: '2026-09-09'
  citation: string
}

export interface EyePhysiologyStep {
  id: string
  track: EyePhysiologyTrack
  order: number
  label: string
  anatomyAnchor: string
  state: string
  evidence: EyePhysiologyEvidence
  representation: EyePhysiologyRepresentation
  reviewStatus: EyePhysiologyReviewStatus
  patientSpecific: false
  quantitativeInferenceAllowed: false
  diagnosisOrTreatmentAllowed: false
}

const STEP = (
  id: string,
  track: EyePhysiologyTrack,
  order: number,
  label: string,
  anatomyAnchor: string,
  state: string,
  evidence: EyePhysiologyEvidence,
): EyePhysiologyStep => ({
  id,
  track,
  order,
  label,
  anatomyAnchor,
  state,
  evidence,
  representation: 'educational-pathway-only',
  reviewStatus: 'academic-review-pending',
  patientSpecific: false,
  quantitativeInferenceAllowed: false,
  diagnosisOrTreatmentAllowed: false,
})

const aqueousEvidence: EyePhysiologyEvidence = {
  source: 'NCBI Bookshelf',
  locator: 'NBK553209',
  retrievedOn: '2026-09-09',
  citation: 'StatPearls, Physiology, Aqueous Humor Circulation: posterior chamber to pupil to anterior chamber, then conventional outflow through trabecular meshwork, Schlemm canal, collector channels and episcleral venous system.',
}

const accommodationEvidence: EyePhysiologyEvidence = {
  source: 'NCBI Bookshelf',
  locator: 'NBK11079',
  retrievedOn: '2026-09-09',
  citation: 'Neuroscience, The Formation of Images on the Retina: ciliary muscle contraction reduces zonular tension for near focus; relaxation increases zonular tension and flattens the lens for distance vision.',
}

const pupilEvidence: EyePhysiologyEvidence = {
  source: 'PMC',
  locator: 'PMC4919817',
  retrievedOn: '2026-09-09',
  citation: 'Autonomic control of the eye: retinal light input reaches pretectal pathways, bilateral Edinger-Westphal output, CN III, ciliary ganglion and sphincter pupillae for direct and consensual constriction.',
}

/**
 * Eye Gold Standard physiology core.
 * These are ordered educational state transitions anchored to named anatomy.
 * They are not measured flow, pressure, refractive power, latency, disease state,
 * treatment logic, or patient-specific physiology.
 */
export const EYE_PHYSIOLOGY_WAVE6: readonly EyePhysiologyStep[] = [
  STEP('aqueous-production', 'aqueous-flow', 1, 'Aqueous humor production', 'ciliary-processes', 'production at ciliary processes / nonpigmented epithelium', aqueousEvidence),
  STEP('aqueous-posterior-chamber', 'aqueous-flow', 2, 'Posterior chamber transit', 'posterior-chamber', 'aqueous enters posterior chamber', aqueousEvidence),
  STEP('aqueous-pupil', 'aqueous-flow', 3, 'Pupillary transit', 'pupil', 'aqueous passes through pupil', aqueousEvidence),
  STEP('aqueous-anterior-chamber', 'aqueous-flow', 4, 'Anterior chamber transit', 'anterior-chamber', 'aqueous enters anterior chamber', aqueousEvidence),
  STEP('aqueous-trabecular', 'aqueous-flow', 5, 'Trabecular outflow', 'trabecular-meshwork', 'conventional outflow through trabecular meshwork', aqueousEvidence),
  STEP('aqueous-schlemm', 'aqueous-flow', 6, 'Schlemm canal transit', 'schlemm-canal', 'aqueous enters Schlemm canal', aqueousEvidence),
  STEP('aqueous-collector', 'aqueous-flow', 7, 'Collector channel transit', 'collector-channels', 'aqueous exits through collector channels', aqueousEvidence),
  STEP('aqueous-venous-endpoint', 'aqueous-flow', 8, 'Episcleral venous endpoint', 'aqueous-veins', 'aqueous reaches episcleral venous outflow', aqueousEvidence),

  STEP('distance-ciliary-relaxed', 'accommodation', 1, 'Distance: ciliary muscle relaxed', 'ciliary-muscle', 'ciliary muscle relatively relaxed', accommodationEvidence),
  STEP('distance-zonules-tense', 'accommodation', 2, 'Distance: zonular tension increased', 'zonules', 'zonular tension maintains flatter lens', accommodationEvidence),
  STEP('distance-lens-flatter', 'accommodation', 3, 'Distance: lens flatter', 'lens', 'lens curvature reduced for distance focus', accommodationEvidence),
  STEP('near-ciliary-contracts', 'accommodation', 4, 'Near: ciliary muscle contracts', 'ciliary-muscle', 'ciliary contraction reduces zonular tension', accommodationEvidence),
  STEP('near-zonules-relax', 'accommodation', 5, 'Near: zonular tension reduced', 'zonules', 'reduced zonular tension permits lens rounding', accommodationEvidence),
  STEP('near-lens-rounder', 'accommodation', 6, 'Near: lens rounder', 'lens', 'lens curvature increases for near focus', accommodationEvidence),

  STEP('plr-retina', 'pupillary-light-reflex', 1, 'Retinal light input', 'retina', 'retinal afferent signal begins reflex', pupilEvidence),
  STEP('plr-optic-nerve', 'pupillary-light-reflex', 2, 'Optic nerve afferent', 'optic-nerve', 'afferent signal travels through optic nerve pathway', pupilEvidence),
  STEP('plr-pretectal', 'pupillary-light-reflex', 3, 'Pretectal relay', 'pretectal-region', 'pretectal relay distributes bilateral parasympathetic drive', pupilEvidence),
  STEP('plr-ew', 'pupillary-light-reflex', 4, 'Edinger-Westphal output', 'edinger-westphal-nucleus', 'preganglionic parasympathetic output activated', pupilEvidence),
  STEP('plr-cn3', 'pupillary-light-reflex', 5, 'Oculomotor nerve efferent', 'oculomotor-nerve', 'preganglionic fibers travel with CN III', pupilEvidence),
  STEP('plr-ciliary-ganglion', 'pupillary-light-reflex', 6, 'Ciliary ganglion relay', 'ciliary-ganglion', 'parasympathetic synapse in ciliary ganglion', pupilEvidence),
  STEP('plr-sphincter', 'pupillary-light-reflex', 7, 'Sphincter pupillae constriction', 'iris-sphincter', 'sphincter pupillae contracts; direct and consensual responses are educational concepts', pupilEvidence),
] as const

export const EYE_PHYSIOLOGY_WAVE6_BOUNDARY =
  'Educational reference pathways only. Do not infer intraocular pressure, outflow facility, accommodation amplitude, pupil latency, lesion localization, diagnosis, treatment, or patient-specific physiology.'

const requiredTracks: readonly EyePhysiologyTrack[] = ['aqueous-flow', 'accommodation', 'pupillary-light-reflex']
const acceptedEvidence = /^(NBK\d+|PMC\d+)$/

export function validateEyePhysiologyWave6(records: readonly EyePhysiologyStep[] = EYE_PHYSIOLOGY_WAVE6): string[] {
  const errors: string[] = []
  const ids = new Set<string>()

  for (const item of records) {
    if (ids.has(item.id)) errors.push(`duplicate:${item.id}`)
    ids.add(item.id)
    if (!item.label.trim() || !item.anatomyAnchor.trim() || !item.state.trim()) errors.push(`identity:${item.id}`)
    if (!Number.isInteger(item.order) || item.order < 1) errors.push(`order:${item.id}`)
    if (!acceptedEvidence.test(item.evidence.locator) || !item.evidence.citation.trim()) errors.push(`evidence:${item.id}`)
    if (item.representation !== 'educational-pathway-only') errors.push(`representation:${item.id}`)
    if (item.reviewStatus !== 'academic-review-pending') errors.push(`review:${item.id}`)
    if (item.patientSpecific || item.quantitativeInferenceAllowed || item.diagnosisOrTreatmentAllowed) errors.push(`unsafe:${item.id}`)
  }

  for (const track of requiredTracks) {
    const steps = records.filter((item) => item.track === track).sort((a, b) => a.order - b.order)
    if (!steps.length) {
      errors.push(`missing-track:${track}`)
      continue
    }
    for (let index = 0; index < steps.length; index += 1) {
      if (steps[index]?.order !== index + 1) errors.push(`sequence:${track}:${steps[index]?.id}`)
    }
  }

  const aqueousAnchors = records.filter((item) => item.track === 'aqueous-flow').map((item) => item.anatomyAnchor)
  for (const anchor of ['ciliary-processes', 'posterior-chamber', 'pupil', 'anterior-chamber', 'trabecular-meshwork', 'schlemm-canal', 'collector-channels', 'aqueous-veins']) {
    if (!aqueousAnchors.includes(anchor)) errors.push(`aqueous-anchor:${anchor}`)
  }

  return errors
}
