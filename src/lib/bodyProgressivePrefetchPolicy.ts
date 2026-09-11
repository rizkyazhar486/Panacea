export type BodyPrefetchIntent = 'required-now' | 'likely-next' | 'idle-opportunistic';

export type BodyNetworkClass = 'offline' | 'save-data' | 'constrained' | 'normal';
export type BodyMemoryClass = 'low' | 'standard' | 'high';

export interface BodyAssetCandidate {
  assetId: string;
  estimatedTransferMb: number;
  intent: BodyPrefetchIntent;
  selected: boolean;
  adjacentToSelection: boolean;
  alreadyResident: boolean;
}

export interface BodyPrefetchContext {
  network: BodyNetworkClass;
  memory: BodyMemoryClass;
  viewportWidth: number;
  maxConcurrentOverride?: number;
}

export interface BodyPrefetchPlan {
  loadNow: string[];
  prefetchNext: string[];
  deferred: string[];
  maxConcurrent: number;
  transferBudgetMb: number;
  reason: string;
}

const finiteNonNegative = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, value) : Number.POSITIVE_INFINITY;

const candidateScore = (candidate: BodyAssetCandidate): number => {
  if (candidate.selected || candidate.intent === 'required-now') return 1000;
  if (candidate.adjacentToSelection && candidate.intent === 'likely-next') return 300;
  if (candidate.intent === 'likely-next') return 200;
  if (candidate.adjacentToSelection) return 100;
  return 10;
};

function defaultsFor(context: BodyPrefetchContext): {
  maxConcurrent: number;
  transferBudgetMb: number;
  allowSpeculativePrefetch: boolean;
  reason: string;
} {
  if (context.network === 'offline') {
    return {
      maxConcurrent: 0,
      transferBudgetMb: 0,
      allowSpeculativePrefetch: false,
      reason: 'offline',
    };
  }

  const mobile = context.viewportWidth > 0 && context.viewportWidth <= 480;
  if (context.network === 'save-data') {
    return {
      maxConcurrent: 1,
      transferBudgetMb: 0,
      allowSpeculativePrefetch: false,
      reason: 'save-data',
    };
  }

  if (context.memory === 'low' || context.network === 'constrained') {
    return {
      maxConcurrent: 1,
      transferBudgetMb: mobile ? 2 : 4,
      allowSpeculativePrefetch: false,
      reason: context.memory === 'low' ? 'low-memory' : 'constrained-network',
    };
  }

  if (mobile) {
    return {
      maxConcurrent: 2,
      transferBudgetMb: context.memory === 'high' ? 8 : 5,
      allowSpeculativePrefetch: true,
      reason: 'mobile-bounded',
    };
  }

  return {
    maxConcurrent: context.memory === 'high' ? 4 : 3,
    transferBudgetMb: context.memory === 'high' ? 24 : 12,
    allowSpeculativePrefetch: true,
    reason: 'desktop-bounded',
  };
}

/**
 * An override may reduce concurrency for callers, but may never raise the
 * environment-derived safety ceiling. Invalid overrides fail closed to zero.
 */
const resolveMaxConcurrent = (override: number | undefined, safetyCeiling: number): number => {
  if (override === undefined) return safetyCeiling;
  if (!Number.isFinite(override)) return 0;
  const requested = Math.max(0, Math.min(6, Math.floor(override)));
  return Math.min(requested, safetyCeiling);
};

/**
 * Deterministic planner only. It returns IDs; callers own loading, cancellation,
 * retries and cache policy. The planner never starts polling or network work.
 */
export function planBodyProgressivePrefetch(
  candidates: readonly BodyAssetCandidate[],
  context: BodyPrefetchContext,
): BodyPrefetchPlan {
  const defaults = defaultsFor(context);
  const maxConcurrent = resolveMaxConcurrent(context.maxConcurrentOverride, defaults.maxConcurrent);

  const pending = candidates
    .filter((candidate) => !candidate.alreadyResident)
    .map((candidate) => ({
      ...candidate,
      estimatedTransferMb: finiteNonNegative(candidate.estimatedTransferMb),
    }))
    .sort((a, b) =>
      candidateScore(b) - candidateScore(a) ||
      a.estimatedTransferMb - b.estimatedTransferMb ||
      a.assetId.localeCompare(b.assetId));

  const required = pending.filter((candidate) =>
    Number.isFinite(candidate.estimatedTransferMb) &&
    (candidate.selected || candidate.intent === 'required-now'));
  const loadNow = required.slice(0, maxConcurrent).map((candidate) => candidate.assetId);
  const requiredOverflow = new Set(required.slice(maxConcurrent).map((candidate) => candidate.assetId));

  if (!defaults.allowSpeculativePrefetch || maxConcurrent === 0) {
    return {
      loadNow,
      prefetchNext: [],
      deferred: pending
        .filter((candidate) => !loadNow.includes(candidate.assetId))
        .map((candidate) => candidate.assetId),
      maxConcurrent,
      transferBudgetMb: defaults.transferBudgetMb,
      reason: defaults.reason,
    };
  }

  const speculative = pending.filter((candidate) =>
    !loadNow.includes(candidate.assetId) &&
    !requiredOverflow.has(candidate.assetId) &&
    candidate.intent !== 'required-now');

  const prefetchNext: string[] = [];
  let transferUsed = 0;
  const speculativeSlots = Math.max(0, maxConcurrent - loadNow.length);

  for (const candidate of speculative) {
    if (prefetchNext.length >= speculativeSlots) break;
    if (!Number.isFinite(candidate.estimatedTransferMb)) continue;
    if (transferUsed + candidate.estimatedTransferMb > defaults.transferBudgetMb) continue;
    prefetchNext.push(candidate.assetId);
    transferUsed += candidate.estimatedTransferMb;
  }

  const chosen = new Set([...loadNow, ...prefetchNext]);
  return {
    loadNow,
    prefetchNext,
    deferred: pending.filter((candidate) => !chosen.has(candidate.assetId)).map((candidate) => candidate.assetId),
    maxConcurrent,
    transferBudgetMb: defaults.transferBudgetMb,
    reason: defaults.reason,
  };
}
