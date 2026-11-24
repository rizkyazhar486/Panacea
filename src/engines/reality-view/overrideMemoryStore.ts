export type AlertSeverity = 'lifestyle' | 'advisory' | 'clinical_red_flag'

export interface OverrideAuditEntry {
  readonly ruleKey: string
  readonly severity: AlertSeverity
  readonly hardSafetyLock: boolean
  readonly reason?: string
  readonly recordedAt: string
  /** Preference history is append-only for this store instance. */
  readonly mutable: false
}

export interface AlertSuppression {
  readonly suppressed: boolean
  readonly overrideCount: number
  readonly lockEnforced: boolean
}

export class OverrideMemoryStore {
  readonly #audit: OverrideAuditEntry[] = []

  recordOverride(ruleKey: string, severity: AlertSeverity, hardSafetyLock: boolean, reason?: string): void {
    if (!ruleKey.trim()) throw new TypeError('An alert rule key is required.')
    if (severity !== 'lifestyle' && severity !== 'advisory' && severity !== 'clinical_red_flag') {
      throw new TypeError('Invalid alert severity.')
    }
    if (typeof hardSafetyLock !== 'boolean') throw new TypeError('An explicit safety-lock flag is required.')
    this.#audit.push(Object.freeze({
      ruleKey, severity, hardSafetyLock, reason, recordedAt: new Date().toISOString(), mutable: false,
    }))
  }

  shouldSuppressAlert(ruleKey: string, hardSafetyLock: boolean): AlertSuppression {
    const entries = this.#audit.filter(entry => entry.ruleKey === ruleKey)
    const lockEnforced = hardSafetyLock || entries.some(entry =>
      entry.hardSafetyLock || entry.severity === 'clinical_red_flag')
    return { suppressed: !lockEnforced && entries.length >= 2, overrideCount: entries.length, lockEnforced }
  }

  toJSON(): { readonly audit: readonly OverrideAuditEntry[] } {
    return { audit: [...this.#audit] }
  }

  static fromJSON(snapshot: unknown): OverrideMemoryStore {
    if (
      typeof snapshot !== 'object' ||
      snapshot === null ||
      Array.isArray(snapshot) ||
      !Array.isArray((snapshot as { audit?: unknown }).audit)
    ) {
      throw new TypeError('Invalid OverrideMemoryStore snapshot.')
    }
    const store = new OverrideMemoryStore()
    for (const raw of (snapshot as { audit: unknown[] }).audit) {
      if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        throw new TypeError('Invalid OverrideAuditEntry in snapshot.')
      }
      const entry = raw as Record<string, unknown>
      if (
        typeof entry.ruleKey !== 'string' ||
        !entry.ruleKey.trim() ||
        (entry.severity !== 'lifestyle' && entry.severity !== 'advisory' && entry.severity !== 'clinical_red_flag') ||
        typeof entry.hardSafetyLock !== 'boolean' ||
        typeof entry.recordedAt !== 'string' ||
        !Number.isFinite(Date.parse(entry.recordedAt)) ||
        (entry.reason !== undefined && typeof entry.reason !== 'string')
      ) {
        throw new TypeError('Malformed OverrideAuditEntry fields in snapshot.')
      }
      store.#audit.push(
        Object.freeze({
          ruleKey: entry.ruleKey,
          severity: entry.severity,
          hardSafetyLock: entry.hardSafetyLock,
          ...(entry.reason !== undefined ? { reason: entry.reason } : {}),
          recordedAt: entry.recordedAt,
          mutable: false,
        }),
      )
    }
    return store
  }
}
