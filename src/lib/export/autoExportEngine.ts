/**
 * Pure deterministic Multi-Format Auto-Export & Idempotent SHA-256 Deduplication Engine.
 *
 * Purity Invariant (`arch-ratchet`):
 * - Zero DOM, storage, clock, RNG, or network calls.
 * - All timestamps (`exportedAtIso`, `isoDate`) must be injected by callers.
 * - Missing clinical/wearable numbers remain `null` or empty CSV cells — NEVER coerced to 0.
 */

export type AutoExportMode = 'off' | 'local' | 'neon' | 'both'
export type ExportFormat = 'json' | 'csv' | 'fhir' | 'neon'

export interface ExportVitalRow {
  readonly date: string
  readonly source: string
  readonly vo2max?: number | null
  readonly restingHrBpm?: number | null
  readonly hrvMs?: number | null
  readonly sleepHours?: number | null
  readonly steps?: number | null
  readonly spo2Pct?: number | null
  readonly weightKg?: number | null
  readonly bodyFatPct?: number | null
  readonly ahiEventsPerHour?: number | null
}

export interface CanonicalExportBundleInput {
  readonly exportedAtIso: string
  readonly owner: {
    readonly profileKey: string
    readonly fullName: string
    readonly username: string
    readonly mrn: string
  }
  readonly vitals: {
    readonly heightCm?: number | null
    readonly weightKg?: number | null
    readonly bodyFatPct?: number | null
    readonly restingHrBpm?: number | null
    readonly hrvMs?: number | null
    readonly vo2max?: number | null
    readonly sleepHours?: number | null
    readonly steps?: number | null
    readonly spo2Pct?: number | null
  }
  readonly longitudinalRows: readonly ExportVitalRow[]
  readonly conditions?: readonly string[]
  readonly digitalTwin?: Readonly<Record<string, unknown>> | null
  readonly cadCae?: Readonly<Record<string, unknown>> | null
  readonly skinScan?: Readonly<Record<string, unknown>> | null
  readonly brainAndOsa?: Readonly<Record<string, unknown>> | null
  readonly anova?: Readonly<Record<string, unknown>> | null
}

export interface ExportArtifact {
  readonly format: ExportFormat
  readonly filename: string
  readonly mimeType: string
  readonly content: string
  readonly sha256: string
  readonly byteLength: number
  readonly clinicallyReviewed: false
}

export interface NeonAutoSyncBatch {
  readonly id: string
  readonly sha256: string
  readonly recordedAtIso: string
  readonly tables: readonly ('panacea_sync_outbox' | 'panacea_wearable_telemetry')[]
  readonly events: readonly Readonly<Record<string, unknown>>[]
  readonly clinicallyReviewed: false
}

export interface AutoExportDecision {
  readonly shouldRunLocalDownload: boolean
  readonly shouldQueueNeonOutbox: boolean
  readonly skippedAsDuplicate: boolean
  readonly reason: string
}

// ── Pure RFC-compliant SHA-256 (zero WebCrypto/Node crypto dependency) ──
const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
])

function utf8Bytes(str: string): Uint8Array {
  const out: number[] = []
  for (let i = 0; i < str.length; i++) {
    let cp = str.charCodeAt(i)
    if (cp >= 0xd800 && cp <= 0xdbff && i + 1 < str.length) {
      const next = str.charCodeAt(++i)
      cp = 0x10000 + ((cp - 0xd800) << 10) + (next - 0xdc00)
    }
    if (cp < 0x80) {
      out.push(cp)
    } else if (cp < 0x800) {
      out.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f))
    } else if (cp < 0x10000) {
      out.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f))
    } else {
      out.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f),
      )
    }
  }
  return new Uint8Array(out)
}

const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n))

export function sha256Hex(text: string): string {
  const bytes = utf8Bytes(text)
  const bitLen = bytes.length * 8
  const paddedLen = Math.ceil((bytes.length + 9) / 64) * 64
  const buf = new Uint8Array(paddedLen)
  buf.set(bytes)
  buf[bytes.length] = 0x80
  const view = new DataView(buf.buffer)
  view.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false)
  view.setUint32(paddedLen - 4, bitLen >>> 0, false)

  let h0 = 0x6a09e667
  let h1 = 0xbb67ae85
  let h2 = 0x3c6ef372
  let h3 = 0xa54ff53a
  let h4 = 0x510e527f
  let h5 = 0x9b05688c
  let h6 = 0x1f83d9ab
  let h7 = 0x5be0cd19

  const w = new Uint32Array(64)
  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4, false)
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3)
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10)
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0
    }
    let a = h0
    let b = h1
    let c = h2
    let d = h3
    let e = h4
    let f = h5
    let g = h6
    let h = h7
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
      const ch = (e & f) ^ (~e & g)
      const temp1 = (h + S1 + ch + SHA256_K[i] + w[i]) >>> 0
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const temp2 = (S0 + maj) >>> 0
      h = g
      g = f
      f = e
      e = (d + temp1) >>> 0
      d = c
      c = b
      b = a
      a = (temp1 + temp2) >>> 0
    }
    h0 = (h0 + a) >>> 0
    h1 = (h1 + b) >>> 0
    h2 = (h2 + c) >>> 0
    h3 = (h3 + d) >>> 0
    h4 = (h4 + e) >>> 0
    h5 = (h5 + f) >>> 0
    h6 = (h6 + g) >>> 0
    h7 = (h7 + h) >>> 0
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((n) => (n >>> 0).toString(16).padStart(8, '0'))
    .join('')
}

export function sanitizeExportFilename(prefix: string, isoDateOrTimestamp: string, ext: string): string {
  const safePrefix = (prefix || 'panaceamed-export')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'panaceamed-export'
  const dateMatch = String(isoDateOrTimestamp || '').match(/\d{4}-\d{2}-\d{2}/)
  const safeDate = dateMatch ? dateMatch[0] : '1970-01-01'
  const safeExt = (ext || 'json').toLowerCase().replace(/[^a-z0-9]/g, '') || 'json'
  return `${safePrefix}-${safeDate}.${safeExt}`
}

function finiteOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  // Guard against spreadsheet formula injection and RFC-4180 special chars
  const guarded = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
  return /[",\n\r]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded
}

export function buildCanonicalJsonExport(input: CanonicalExportBundleInput): ExportArtifact {
  const payload = {
    schema: 'panaceamed.canonical-export.v2',
    exportedAt: input.exportedAtIso,
    clinicallyReviewed: false,
    owner: {
      profileKey: input.owner.profileKey,
      fullName: input.owner.fullName,
      username: input.owner.username,
      mrn: input.owner.mrn,
    },
    vitals: {
      heightCm: finiteOrNull(input.vitals.heightCm),
      weightKg: finiteOrNull(input.vitals.weightKg),
      bodyFatPct: finiteOrNull(input.vitals.bodyFatPct),
      restingHrBpm: finiteOrNull(input.vitals.restingHrBpm),
      hrvMs: finiteOrNull(input.vitals.hrvMs),
      vo2max: finiteOrNull(input.vitals.vo2max),
      sleepHours: finiteOrNull(input.vitals.sleepHours),
      steps: finiteOrNull(input.vitals.steps),
      spo2Pct: finiteOrNull(input.vitals.spo2Pct),
    },
    longitudinalRows: input.longitudinalRows,
    digitalTwin: input.digitalTwin ?? null,
    cadCae: input.cadCae ?? null,
    skinScan: input.skinScan ?? null,
    brainAndOsa: input.brainAndOsa ?? null,
    anova: input.anova ?? null,
    epistemicNotice: 'User-owned PanaceaMed OS snapshot. Model-derived fields are non-clinical technical outputs.',
  }
  const content = JSON.stringify(payload, null, 2)
  return {
    format: 'json',
    filename: sanitizeExportFilename('panaceamed-export', input.exportedAtIso, 'json'),
    mimeType: 'application/json;charset=utf-8',
    content,
    sha256: sha256Hex(content),
    byteLength: utf8Bytes(content).length,
    clinicallyReviewed: false,
  }
}

export function buildLongitudinalCsvExport(input: CanonicalExportBundleInput): ExportArtifact {
  const headers = [
    'date',
    'source',
    'vo2max_ml_kg_min',
    'resting_hr_bpm',
    'hrv_rmssd_ms',
    'sleep_hours',
    'steps',
    'spo2_pct',
    'weight_kg',
    'body_fat_pct',
    'osa_ahi_events_hr',
  ]
  const rows: readonly ExportVitalRow[] =
    input.longitudinalRows.length > 0
      ? input.longitudinalRows
      : [
          {
            date: input.exportedAtIso.slice(0, 10),
            source: 'PanaceaMed OS',
            vo2max: finiteOrNull(input.vitals.vo2max),
            restingHrBpm: finiteOrNull(input.vitals.restingHrBpm),
            hrvMs: finiteOrNull(input.vitals.hrvMs),
            sleepHours: finiteOrNull(input.vitals.sleepHours),
            steps: finiteOrNull(input.vitals.steps),
            spo2Pct: finiteOrNull(input.vitals.spo2Pct),
            weightKg: finiteOrNull(input.vitals.weightKg),
            bodyFatPct: finiteOrNull(input.vitals.bodyFatPct),
            ahiEventsPerHour: null,
          },
        ]

  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      [
        r.date,
        r.source,
        finiteOrNull(r.vo2max),
        finiteOrNull(r.restingHrBpm),
        finiteOrNull(r.hrvMs),
        finiteOrNull(r.sleepHours),
        finiteOrNull(r.steps),
        finiteOrNull(r.spo2Pct),
        finiteOrNull(r.weightKg),
        finiteOrNull(r.bodyFatPct),
        finiteOrNull(r.ahiEventsPerHour),
      ]
        .map(csvCell)
        .join(','),
    ),
  ]

  const content = lines.join('\n') + '\n'
  return {
    format: 'csv',
    filename: sanitizeExportFilename('panaceamed-export', input.exportedAtIso, 'csv'),
    mimeType: 'text/csv;charset=utf-8',
    content,
    sha256: sha256Hex(content),
    byteLength: utf8Bytes(content).length,
    clinicallyReviewed: false,
  }
}

export function buildFhirR4BundleExport(input: CanonicalExportBundleInput): ExportArtifact {
  const patientId = input.owner.mrn.replace(/[^a-zA-Z0-9-]/g, '') || 'PMD-000486'
  const entries: Array<Record<string, unknown>> = [
    {
      fullUrl: `urn:panaceamed:Patient/${patientId}`,
      resource: {
        resourceType: 'Patient',
        id: patientId,
        identifier: [{ system: 'https://panaceamed.id/mrn', value: input.owner.mrn }],
        name: [{ text: input.owner.fullName }],
      },
    },
  ]

  const obsSpecs: Array<{
    code: string
    display: string
    value: number | null
    unit: string
    ucum: string
    id: string
  }> = [
    { id: 'rhr', code: '8867-4', display: 'Heart rate', value: finiteOrNull(input.vitals.restingHrBpm), unit: 'beats/min', ucum: '/min' },
    { id: 'hrv', code: '80404-7', display: 'R-R interval.standard deviation (HRV)', value: finiteOrNull(input.vitals.hrvMs), unit: 'ms', ucum: 'ms' },
    { id: 'sleep', code: '93832-4', display: 'Sleep duration', value: finiteOrNull(input.vitals.sleepHours), unit: 'h', ucum: 'h' },
    { id: 'steps', code: '55423-8', display: 'Number of steps in 24 hour Measured', value: finiteOrNull(input.vitals.steps), unit: 'steps', ucum: '{steps}' },
    { id: 'spo2', code: '2708-6', display: 'Oxygen saturation in Arterial blood', value: finiteOrNull(input.vitals.spo2Pct), unit: '%', ucum: '%' },
    { id: 'weight', code: '29463-7', display: 'Body weight', value: finiteOrNull(input.vitals.weightKg), unit: 'kg', ucum: 'kg' },
    { id: 'height', code: '8302-2', display: 'Body height', value: finiteOrNull(input.vitals.heightCm), unit: 'cm', ucum: 'cm' },
  ]

  for (const spec of obsSpecs) {
    if (spec.value === null) continue
    entries.push({
      fullUrl: `urn:panaceamed:Observation/${patientId}-${spec.id}`,
      resource: {
        resourceType: 'Observation',
        id: `${patientId}-${spec.id}`,
        status: 'preliminary',
        code: {
          coding: [{ system: 'http://loinc.org', code: spec.code, display: spec.display }],
        },
        subject: { reference: `Patient/${patientId}` },
        effectiveDateTime: input.exportedAtIso,
        valueQuantity: {
          value: spec.value,
          unit: spec.unit,
          system: 'http://unitsofmeasure.org',
          code: spec.ucum,
        },
      },
    })
  }

  for (const [idx, cond] of (input.conditions ?? []).entries()) {
    const clean = cond.trim()
    if (!clean) continue
    entries.push({
      fullUrl: `urn:panaceamed:Condition/${patientId}-cond-${idx + 1}`,
      resource: {
        resourceType: 'Condition',
        id: `${patientId}-cond-${idx + 1}`,
        clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] },
        verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'unconfirmed' }] },
        code: { text: clean },
        subject: { reference: `Patient/${patientId}` },
      },
    })
  }

  const bundle = {
    resourceType: 'Bundle',
    type: 'collection',
    timestamp: input.exportedAtIso,
    meta: {
      tag: [{ system: 'https://panaceamed.id/governance', code: 'clinically-reviewed-false', display: 'Not clinician-reviewed' }],
    },
    entry: entries,
  }

  const content = JSON.stringify(bundle, null, 2)
  return {
    format: 'fhir',
    filename: sanitizeExportFilename('panaceamed-fhir-r4', input.exportedAtIso, 'json'),
    mimeType: 'application/fhir+json;charset=utf-8',
    content,
    sha256: sha256Hex(content),
    byteLength: utf8Bytes(content).length,
    clinicallyReviewed: false,
  }
}

export function buildNeonAutoSyncPayload(input: CanonicalExportBundleInput): NeonAutoSyncBatch {
  const jsonArtifact = buildCanonicalJsonExport(input)
  const shortHash = jsonArtifact.sha256.slice(0, 12).toUpperCase()

  return {
    id: `NEON-SYNC-${shortHash}`,
    sha256: jsonArtifact.sha256,
    recordedAtIso: input.exportedAtIso,
    tables: ['panacea_wearable_telemetry', 'panacea_sync_outbox'],
    clinicallyReviewed: false,
    events: [
      {
        id: `TEL-${shortHash}`,
        table: 'panacea_wearable_telemetry',
        operation: 'upsert',
        profileKey: input.owner.profileKey,
        recordedAtIso: input.exportedAtIso,
        sha256: jsonArtifact.sha256,
        clinicallyReviewed: false,
        payload: {
          profile_key: input.owner.profileKey,
          vitals: input.vitals,
          row_count: input.longitudinalRows.length,
          recorded_at: input.exportedAtIso,
        },
      },
      {
        id: `OUT-${shortHash}`,
        table: 'panacea_sync_outbox',
        operation: 'upsert',
        profileKey: input.owner.profileKey,
        recordedAtIso: input.exportedAtIso,
        sha256: jsonArtifact.sha256,
        clinicallyReviewed: false,
        payload: {
          profile_key: input.owner.profileKey,
          artifact_filename: jsonArtifact.filename,
          content_sha256: jsonArtifact.sha256,
          byte_length: jsonArtifact.byteLength,
          recorded_at: input.exportedAtIso,
        },
      },
    ],
  }
}

export function evaluateAutoExportDecision(params: {
  readonly mode: AutoExportMode
  readonly contentHash: string
  readonly lastExportedHash: string | null
  readonly hasUserGesture: boolean
}): AutoExportDecision {
  if (params.mode === 'off') {
    return {
      shouldRunLocalDownload: false,
      shouldQueueNeonOutbox: false,
      skippedAsDuplicate: false,
      reason: 'Auto-export is off.',
    }
  }
  if (params.lastExportedHash && params.lastExportedHash === params.contentHash) {
    return {
      shouldRunLocalDownload: false,
      shouldQueueNeonOutbox: false,
      skippedAsDuplicate: true,
      reason: 'Identical SHA-256 snapshot already exported; duplicate prevented.',
    }
  }

  const wantsLocal = params.mode === 'local' || params.mode === 'both'
  const wantsNeon = params.mode === 'neon' || params.mode === 'both'

  return {
    shouldRunLocalDownload: wantsLocal && params.hasUserGesture,
    shouldQueueNeonOutbox: wantsNeon,
    skippedAsDuplicate: false,
    reason:
      wantsLocal && !params.hasUserGesture
        ? 'Deferred local download until user gesture to prevent Safari/iOS popup blocking.'
        : 'Ready to execute auto-export.',
  }
}
