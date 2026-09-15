import type { EvidenceTier } from './panaceaOperatingModel'

export type PrecisionCareGate = 'planning-eligible' | 'clinician-review-required' | 'research-only' | 'blocked'
export type PrecisionCareCategory = 'laboratory' | 'monitoring' | 'sleep' | 'imaging' | 'clinician' | 'follow-up'

export type PrecisionCareService = {
  id: string
  label: string
  category: PrecisionCareCategory
  purpose: string
  evidenceTier: EvidenceTier
  expectedInformation: number
  actionability: number
  dataGapFit: number
  costTransparency: number
  burden: number
  redundancy: number
  requiresClinician: boolean
  estimatedPriceIdr?: number
}

export type InformationValueInput = Pick<
  PrecisionCareService,
  'evidenceTier' | 'expectedInformation' | 'actionability' | 'dataGapFit' | 'costTransparency' | 'burden' | 'redundancy'
>

export const PRECISION_CARE_STAGES = [
  'Structured intake',
  'Health Graph gap review',
  'Evidence & information-value review',
  'Clinician decision gate',
  'Service scheduling / fulfillment',
  'Result ingestion',
  'Follow-up interpretation',
  'Outcome measurement',
] as const

export const PRECISION_CARE_DEMO_SERVICES: PrecisionCareService[] = [
  {
    id: 'longitudinal-lab-review',
    label: 'Longitudinal laboratory review bundle',
    category: 'laboratory',
    purpose: 'Consolidate existing and newly ordered laboratory data into one trend-aware review instead of selling isolated biomarkers.',
    evidenceTier: 'B',
    expectedInformation: 82,
    actionability: 78,
    dataGapFit: 76,
    costTransparency: 88,
    burden: 24,
    redundancy: 18,
    requiresClinician: true,
    estimatedPriceIdr: 950000,
  },
  {
    id: 'bp-verification',
    label: 'Home blood-pressure verification',
    category: 'monitoring',
    purpose: 'Use repeated measurements to reduce one-off noise before escalation or interpretation.',
    evidenceTier: 'A',
    expectedInformation: 76,
    actionability: 84,
    dataGapFit: 68,
    costTransparency: 94,
    burden: 16,
    redundancy: 14,
    requiresClinician: true,
    estimatedPriceIdr: 350000,
  },
  {
    id: 'sleep-pathway',
    label: 'Sleep assessment pathway',
    category: 'sleep',
    purpose: 'Route from symptoms and wearable context toward the least-burdensome evidence-supported next assessment.',
    evidenceTier: 'B',
    expectedInformation: 74,
    actionability: 70,
    dataGapFit: 72,
    costTransparency: 80,
    burden: 32,
    redundancy: 20,
    requiresClinician: true,
    estimatedPriceIdr: 1250000,
  },
  {
    id: 'targeted-imaging-review',
    label: 'Targeted imaging review',
    category: 'imaging',
    purpose: 'Keep imaging downstream of a defined clinical question instead of treating whole-body scanning as a default product.',
    evidenceTier: 'B',
    expectedInformation: 72,
    actionability: 68,
    dataGapFit: 62,
    costTransparency: 72,
    burden: 48,
    redundancy: 34,
    requiresClinician: true,
    estimatedPriceIdr: 3200000,
  },
  {
    id: 'clinician-interpretation',
    label: 'Clinician interpretation visit',
    category: 'clinician',
    purpose: 'Convert data into a documented decision with rationale, uncertainty and follow-up ownership.',
    evidenceTier: 'A',
    expectedInformation: 70,
    actionability: 92,
    dataGapFit: 82,
    costTransparency: 90,
    burden: 18,
    redundancy: 8,
    requiresClinician: true,
    estimatedPriceIdr: 900000,
  },
  {
    id: 'outcome-monitoring',
    label: 'Longitudinal outcome monitoring',
    category: 'follow-up',
    purpose: 'Measure whether a chosen care plan actually changed the target outcome and capture adverse events or non-response.',
    evidenceTier: 'A',
    expectedInformation: 88,
    actionability: 86,
    dataGapFit: 84,
    costTransparency: 92,
    burden: 20,
    redundancy: 10,
    requiresClinician: false,
    estimatedPriceIdr: 250000,
  },
]

const EVIDENCE_SCORE: Record<EvidenceTier, number> = { A: 100, B: 82, C: 58, D: 32, X: 0 }

function bounded(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

export function informationValue(input: InformationValueInput) {
  const evidence = EVIDENCE_SCORE[input.evidenceTier]
  const gross =
    0.30 * evidence +
    0.25 * bounded(input.expectedInformation) +
    0.20 * bounded(input.actionability) +
    0.15 * bounded(input.dataGapFit) +
    0.10 * bounded(input.costTransparency)
  const penalty = 0.15 * bounded(input.burden) + 0.10 * bounded(input.redundancy)
  return {
    gross: Math.round(gross * 10) / 10,
    penalty: Math.round(penalty * 10) / 10,
    net: Math.round(Math.max(0, Math.min(100, gross - penalty)) * 10) / 10,
  }
}

export function precisionCareGate(
  service: Pick<PrecisionCareService, 'evidenceTier' | 'requiresClinician'>,
  options: { patientSpecific?: boolean; clinicianReviewed?: boolean } = {},
): PrecisionCareGate {
  if (service.evidenceTier === 'X') return 'blocked'
  if (service.evidenceTier === 'D') return 'research-only'
  if (service.evidenceTier === 'C') return 'clinician-review-required'
  if ((service.requiresClinician || options.patientSpecific) && !options.clinicianReviewed) return 'clinician-review-required'
  return 'planning-eligible'
}

export function rankPrecisionCareServices(services: PrecisionCareService[] = PRECISION_CARE_DEMO_SERVICES) {
  return [...services]
    .map((service) => ({ service, value: informationValue(service) }))
    .sort((a, b) => b.value.net - a.value.net)
}

export function serviceEconomics(listPriceIdr: number, platformRate: number) {
  if (!Number.isFinite(listPriceIdr) || !Number.isFinite(platformRate) || listPriceIdr < 0 || platformRate < 0 || platformRate > 0.3) {
    return undefined
  }
  const platformGrossIdr = Math.round(listPriceIdr * platformRate)
  return {
    listPriceIdr: Math.round(listPriceIdr),
    platformGrossIdr,
    providerPayoutIdr: Math.round(listPriceIdr - platformGrossIdr),
  }
}
