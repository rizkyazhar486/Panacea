import type { AtlasSystemId } from './atlasKernel'
import type {
  BodyMaturationBlocker,
  BodyMaturationReport,
  BodyMaturationStageId,
} from './bodyMaturationGate'

export type BodyEngineeringWorkKind =
  | 'blocker-remediation'
  | 'independent-authoring'
  | 'promotion'

export interface BodyEngineeringWorkRequest {
  kind: BodyEngineeringWorkKind
  systems?: readonly AtlasSystemId[]
  targetStage?: BodyMaturationStageId
}

export interface BodyEngineeringWorkDecision {
  allowed: boolean
  blockedSystems: readonly AtlasSystemId[]
  scopeBlockedSystems: readonly AtlasSystemId[]
  reasons: readonly string[]
}

function blockerSystem(blocker: BodyMaturationBlocker): AtlasSystemId | null {
  const nodeId = blocker.nodeId ?? ''
  if (!nodeId.startsWith('system:')) return null
  return nodeId.slice('system:'.length) as AtlasSystemId
}

function blockedSystems(report: BodyMaturationReport): AtlasSystemId[] {
  const stage = report.stages.find((candidate) => candidate.id === 'system')
  if (!stage) return []
  return [...new Set(stage.blockers.map(blockerSystem).filter((value): value is AtlasSystemId => Boolean(value)))]
    .sort()
}

function promotionPathComplete(
  report: BodyMaturationReport,
  targetStage: BodyMaturationStageId,
): boolean {
  const targetIndex = report.stages.findIndex((stage) => stage.id === targetStage)
  if (targetIndex < 0) return false
  return report.stages
    .slice(0, targetIndex + 1)
    .every((stage) => stage.status === 'complete')
}

/**
 * Engineering-continuity policy for whole-body maturation.
 *
 * Maturation/publication truth stays fail-closed, but unrelated coding is not
 * frozen by a blocker in another system. Repair work is always authorable
 * because preventing blocker-remediation would make the gate self-deadlocking.
 *
 * This policy never promotes geometry, provenance, academic review, or
 * publication state. It only answers whether engineering work may proceed.
 */
export function evaluateBodyEngineeringWork(
  report: BodyMaturationReport,
  request: BodyEngineeringWorkRequest,
): BodyEngineeringWorkDecision {
  const allBlockedSystems = blockedSystems(report)
  const requestedSystems = [...new Set(request.systems ?? [])]
  const blockedSet = new Set(allBlockedSystems)
  const scopeBlockedSystems = requestedSystems.filter((system) => blockedSet.has(system)).sort()
  const reasons: string[] = []

  if (request.kind === 'blocker-remediation') {
    return {
      allowed: true,
      blockedSystems: allBlockedSystems,
      scopeBlockedSystems,
      reasons: [],
    }
  }

  if (request.kind === 'independent-authoring') {
    if (scopeBlockedSystems.length) {
      reasons.push(
        `Independent authoring overlaps blocked system(s): ${scopeBlockedSystems.join(', ')}. Use blocker-remediation work or move to a non-dependent system.`,
      )
    }
    return {
      allowed: reasons.length === 0,
      blockedSystems: allBlockedSystems,
      scopeBlockedSystems,
      reasons,
    }
  }

  const targetStage = request.targetStage
  if (!targetStage) {
    reasons.push('Promotion work requires an explicit targetStage.')
  } else if (!promotionPathComplete(report, targetStage)) {
    reasons.push(
      `Promotion to ${targetStage} remains fail-closed until every upstream maturation stage on that path is complete.`,
    )
  }

  if (scopeBlockedSystems.length) {
    reasons.push(
      `Promotion scope includes blocked system(s): ${scopeBlockedSystems.join(', ')}.`,
    )
  }

  return {
    allowed: reasons.length === 0,
    blockedSystems: allBlockedSystems,
    scopeBlockedSystems,
    reasons,
  }
}

export const BODY_ENGINEERING_CONTINUITY_FORMULA =
  'EngineeringWorkAllowed = BlockerRemediation OR (IndependentAuthoring AND NoBlockedSystemOverlap) OR (Promotion AND CompleteUpstreamPath AND NoBlockedSystemOverlap)' as const
