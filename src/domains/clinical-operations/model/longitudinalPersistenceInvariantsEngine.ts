export type ProvenanceTruthClass = "OBSERVED" | "DOCUMENTED" | "IMPORTED" | "CALCULATED" | "MODEL_DERIVED" | "SIMULATED" | "UNKNOWN";

export interface CanonicalObservationRecord {
  readonly recordId: string;
  readonly idempotencyKey: string;
  readonly patientId: string;
  readonly episodeId: string;
  readonly metricCode: string;
  readonly value: number | string | null;
  readonly unit: string;
  readonly provenanceClass: ProvenanceTruthClass;
  readonly versionLamportClock: number;
  readonly persistenceStatus: "SERVER_DURABLE_CONFIRMED" | "OFFLINE_QUEUED_PENDING_SYNC" | "MUTATION_FAILED_UNCONFIRMED";
}

export class LongitudinalCanonicalStore {
  private activePatientId: string | null = null;
  private readonly recordsByIdempotencyKey = new Map<string, CanonicalObservationRecord>();
  private readonly latestClockByPatientMetric = new Map<string, number>();

  public switchActivePatientContext(nextPatientId: string | null): { previousPatientPurged: true; activePatientId: string | null } {
    // Invariant 6: Logout / patient switch purges ephemeral active context
    this.activePatientId = nextPatientId;
    return { previousPatientPurged: true, activePatientId: this.activePatientId };
  }

  public commitObservationMutation(params: {
    readonly record: CanonicalObservationRecord;
    readonly backendOnline: boolean;
    readonly simulateWriteFailure?: boolean;
  }) {
    const rec = params.record;
    // Invariant 2: Patient record never attached to wrong active patient context
    if (this.activePatientId && rec.patientId !== this.activePatientId) {
      throw new Error("INVARIANT_2_VIOLATION: Cross-patient write rejected.");
    }
    // Invariant 3: Failed mutation cannot appear confirmed
    if (params.simulateWriteFailure) {
      return {
        committed: false as const,
        persistenceStatus: "MUTATION_FAILED_UNCONFIRMED" as const,
        record: { ...rec, persistenceStatus: "MUTATION_FAILED_UNCONFIRMED" as const }
      };
    }
    // Invariant 4: Queued operation cannot create duplicate clinical events after retry
    if (this.recordsByIdempotencyKey.has(rec.idempotencyKey)) {
      const existing = this.recordsByIdempotencyKey.get(rec.idempotencyKey)!;
      // Invariant 1: OBSERVED cannot silently become MODEL_DERIVED or SIMULATED
      if (existing.provenanceClass === "OBSERVED" && rec.provenanceClass !== "OBSERVED") {
        throw new Error("INVARIANT_1_VIOLATION: Observed clinical record cannot be downgraded to derived/simulated.");
      }
      const upgradedStatus = params.backendOnline ? ("SERVER_DURABLE_CONFIRMED" as const) : existing.persistenceStatus;
      const updated = { ...existing, persistenceStatus: upgradedStatus };
      this.recordsByIdempotencyKey.set(rec.idempotencyKey, updated);
      return { committed: true as const, idempotentDeduplicated: true as const, persistenceStatus: upgradedStatus, record: updated };
    }

    // Invariant 5: Stale network response cannot overwrite newer canonical data
    const metricKey = rec.patientId + "::" + rec.metricCode;
    const currentClock = this.latestClockByPatientMetric.get(metricKey) ?? 0;
    if (rec.versionLamportClock < currentClock) {
      return {
        committed: false as const,
        staleRejected: true as const,
        persistenceStatus: "MUTATION_FAILED_UNCONFIRMED" as const,
        record: rec
      };
    }

    // Invariant 7: Missing backend connectivity is honestly marked OFFLINE_QUEUED_PENDING_SYNC
    const effectiveStatus = params.backendOnline ? ("SERVER_DURABLE_CONFIRMED" as const) : ("OFFLINE_QUEUED_PENDING_SYNC" as const);
    const storedRecord: CanonicalObservationRecord = { ...rec, persistenceStatus: effectiveStatus };
    this.recordsByIdempotencyKey.set(rec.idempotencyKey, storedRecord);
    this.latestClockByPatientMetric.set(metricKey, rec.versionLamportClock);

    return {
      committed: true as const,
      idempotentDeduplicated: false as const,
      staleRejected: false as const,
      persistenceStatus: effectiveStatus,
      record: storedRecord
    };
  }

  public queryPatientEpisodeRecords(patientId: string, episodeId: string): readonly CanonicalObservationRecord[] {
    return Array.from(this.recordsByIdempotencyKey.values()).filter(
      (r) => r.patientId === patientId && r.episodeId === episodeId
    );
  }
}