export type RecordOriginClass = "CLINICIAN_SIGNED" | "OBSERVED_CLINICAL" | "WEARABLE_STREAM" | "SIMULATED_EDUCATIONAL";

export interface VersionedHealthRecordReplica {
  readonly recordId: string;
  readonly lamportClock: number;
  readonly originClass: RecordOriginClass;
  readonly payloadSummary: string;
  readonly sha256Digest: string;
}

const ORIGIN_PRECEDENCE_RANK: Readonly<Record<RecordOriginClass, number>> = {
  CLINICIAN_SIGNED: 4,
  OBSERVED_CLINICAL: 3,
  WEARABLE_STREAM: 2,
  SIMULATED_EDUCATIONAL: 1
};

// Directive 049 Law: Simulated/inferred records must NEVER overwrite clinician-signed or observed clinical records
export function reconcileOfflineFirstRecordReplicas(
  localReplica: VersionedHealthRecordReplica,
  remoteReplica: VersionedHealthRecordReplica
) {
  if (localReplica.recordId !== remoteReplica.recordId) {
    throw new Error("Cannot reconcile replicas with different recordIds.");
  }
  const localRank = ORIGIN_PRECEDENCE_RANK[localReplica.originClass];
  const remoteRank = ORIGIN_PRECEDENCE_RANK[remoteReplica.originClass];

  let winner: VersionedHealthRecordReplica;
  let resolutionReason: string;

  if (localRank !== remoteRank) {
    winner = localRank > remoteRank ? localReplica : remoteReplica;
    resolutionReason = "PROVENANCE_PRECEDENCE_GUARD (" + winner.originClass + " outranks lower truth class)";
  } else {
    winner = localReplica.lamportClock >= remoteReplica.lamportClock ? localReplica : remoteReplica;
    resolutionReason = "LAMPORT_CLOCK_MONOTONIC_WINNER (clock=" + winner.lamportClock + ")";
  }

  return {
    recordId: winner.recordId,
    winningReplica: winner,
    nextLamportClock: Math.max(localReplica.lamportClock, remoteReplica.lamportClock) + 1,
    resolutionReason,
    simulatedOverwroteClinical: false as const
  };
}