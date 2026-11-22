import type { OrganTelemetryNode, RealityViewState } from '../../types/realityView.ts'

import type { CounterfactualResult } from './counterfactualSimulator.ts'

export interface QuietModeSummary {
  readonly headline: string
  readonly primaryAction: RealityViewState['quietModePrimaryAction']
  readonly escalated: boolean
}

function hasRecordedEvidence(node: OrganTelemetryNode): boolean {
  if (node.evidenceClass === 'simulated_projection') return false
  return node.provenance.some(source => source.verified)
}

function below(node: OrganTelemetryNode, threshold: number): boolean {
  const score = node.statusScore
  return score !== null && Number.isFinite(score) && score >= 0 && score < threshold
}

export function selectQuietModeSummary(state: RealityViewState, projection?: CounterfactualResult): QuietModeSummary {
  const recorded = Object.values(state.nodes).filter(hasRecordedEvidence)
  if (recorded.some(node => node.hardSafetyLock || below(node, 0.25))) {
    return {
      headline: 'A recorded finding needs urgent review.',
      primaryAction: { label: 'Contact a clinician', actionType: 'contact_clinician', urgent: true },
      escalated: true,
    }
  }
  if (projection?.patientId === state.patientId
    && projection.status === 'blocked'
    && projection.hardSafetyLock
    && Object.prototype.hasOwnProperty.call(state.nodes, projection.targetMeshId)) {
    return {
      headline: 'The planned medication change needs clinician review.',
      primaryAction: { label: 'Review medication alert', actionType: 'view_medication', urgent: true },
      escalated: true,
    }
  }
  if (recorded.some(node => below(node, 0.6))) {
    return {
      headline: 'A recorded reading needs a closer look.',
      primaryAction: { label: 'Check your readings', actionType: 'check_vitals', urgent: false },
      escalated: false,
    }
  }
  if (recorded.some(node => node.activeChevrons.some(chevron => chevron.direction === 'drifting'))) {
    return {
      headline: 'A projected change is worth reviewing.',
      primaryAction: { label: 'View readings', actionType: 'check_vitals', urgent: false },
      escalated: false,
    }
  }
  const observed = Object.values(state.nodes).filter(node => node.evidenceClass !== 'simulated_projection')
  const scoresAvailable = recorded.length > 0 && recorded.length === observed.length
    && recorded.every(({ statusScore }) => statusScore !== null && statusScore >= 0.6 && statusScore <= 1)
  return {
    headline: scoresAvailable ? 'Your reviewed readings look steady.' : 'More readings are needed for an overview.',
    primaryAction: { label: 'Daily check-in', actionType: 'daily_checkin', urgent: false },
    escalated: false,
  }
}
