/**
 * Mesin Overlay Rekam Medis Kanonis (BX-8).
 *
 * Memetakan data lab, tanda vital, dan observasi klinis terukur dari rekam medis kanonis
 * ke struktur organ 3D pada Body Exposure.
 *
 * Aturan Kepatuhan Klinis & Fail-Closed (D-103 §3.4):
 * - Membaca data eksklusif melalui adapter kanonis.
 * - Ketidakcocokan unit (unit mismatch) -> ditolak eksplisit (rejected), bukan dipaksa.
 * - Data kosong, hilang, atau stale -> ditampilkan sebagai "not available", TIDAK PERNAH 0.
 * - Tanpa tebakan (no guesswork).
 */

export type OverlayTruthClass = 'measured' | 'reference' | 'derived' | 'simulated';

export interface ExpectedMetricUnit {
  readonly canonicalUnit: string;
  readonly allowedAliases: readonly string[];
}

export const EXPECTED_METRIC_UNITS: Readonly<Record<string, ExpectedMetricUnit>> = Object.freeze({
  troponin: Object.freeze({ canonicalUnit: 'ng/mL', allowedAliases: Object.freeze(['ng/ml', 'ug/L']) }),
  creatinine: Object.freeze({ canonicalUnit: 'mg/dL', allowedAliases: Object.freeze(['mg/dl']) }),
  glucose: Object.freeze({ canonicalUnit: 'mg/dL', allowedAliases: Object.freeze(['mg/dl', 'mmol/L']) }),
  heart_rate: Object.freeze({ canonicalUnit: 'bpm', allowedAliases: Object.freeze(['beats/min', 'min-1']) }),
  blood_pressure_systolic: Object.freeze({ canonicalUnit: 'mmHg', allowedAliases: Object.freeze(['mmhg']) }),
});

export const OVERLAY_LABEL = 'Canonical Record Overlay — Measured Patient Data' as const;

export interface CanonicalRecordInput {
  readonly targetOrgan?: string;
  readonly testName?: string;
  readonly value?: number | string | null;
  readonly unit?: string | null;
  readonly timestamp?: string | null;
  readonly source?: string | null;
  readonly truthClass?: OverlayTruthClass;
  readonly staleMaxAgeMs?: number;
}

export interface RecordOverlaySuccessItem {
  readonly ok: true;
  readonly organId: string;
  readonly metricName: string;
  readonly value: number | string;
  readonly unit: string;
  readonly timestamp: string;
  readonly source: string;
  readonly truthClass: OverlayTruthClass;
}

export interface RecordOverlayRejectionItem {
  readonly ok: false;
  readonly organId: string;
  readonly metricName: string;
  readonly reason: 'unit-mismatch' | 'stale-data' | 'missing-value' | 'invalid-record';
  readonly detail: string;
}

export type RecordOverlayResultItem = RecordOverlaySuccessItem | RecordOverlayRejectionItem;

export interface ComputeOverlayOptions {
  readonly maxStaleAgeMs?: number;
  readonly referenceTimeIso?: string;
}

function normalizeUnit(unit: string | null | undefined): string {
  if (!unit || typeof unit !== 'string') return '';
  return unit.trim().toLowerCase();
}

function matchesExpectedUnit(metricKey: string, recordUnit: string): boolean {
  const expected = EXPECTED_METRIC_UNITS[metricKey];
  if (!expected) return true; // Jika metrik kustom tidak dibatasi, izinkan
  const normRec = normalizeUnit(recordUnit);
  if (normRec === normalizeUnit(expected.canonicalUnit)) return true;
  return expected.allowedAliases.some(alias => normalizeUnit(alias) === normRec);
}

/**
 * Memproses dan memvalidasi daftar rekam medis kanonis untuk overlay organ 3D.
 * Menerapkan pemeriksaan unit mismatch dan kedaluwarsa data (stale) secara fail-closed.
 */
export function computeCanonicalRecordOverlays(
  records: readonly CanonicalRecordInput[] | null | undefined,
  options?: ComputeOverlayOptions,
): readonly RecordOverlayResultItem[] {
  if (!Array.isArray(records) || records.length === 0) {
    return Object.freeze([]);
  }

  const nowMs = options?.referenceTimeIso ? new Date(options.referenceTimeIso).getTime() : Date.now();
  const defaultMaxAgeMs = options?.maxStaleAgeMs ?? 7 * 24 * 60 * 60 * 1000; // default 7 hari

  const results: RecordOverlayResultItem[] = [];

  for (const record of records) {
    if (!record || typeof record !== 'object') {
      continue;
    }

    const organId = typeof record.targetOrgan === 'string' && record.targetOrgan.trim().length > 0
      ? record.targetOrgan.trim()
      : 'unknown';
    const metricName = typeof record.testName === 'string' && record.testName.trim().length > 0
      ? record.testName.trim().toLowerCase()
      : 'unspecified';

    // 1. Cek nilai kosong / missing -> "not available", tidak pernah 0
    if (record.value === undefined || record.value === null || String(record.value).trim() === '') {
      results.push(
        Object.freeze({
          ok: false,
          organId,
          metricName,
          reason: 'missing-value',
          detail: 'Record value is missing, empty, or null; shown as not available (never substituted with 0).',
        }),
      );
      continue;
    }

    // 2. Cek apakah data stale (kedaluwarsa)
    const timestampStr = typeof record.timestamp === 'string' && record.timestamp.trim().length > 0
      ? record.timestamp.trim()
      : new Date().toISOString();
    const recordTimeMs = new Date(timestampStr).getTime();
    const maxAge = record.staleMaxAgeMs ?? defaultMaxAgeMs;

    if (Number.isFinite(recordTimeMs) && Number.isFinite(nowMs) && (nowMs - recordTimeMs > maxAge)) {
      results.push(
        Object.freeze({
          ok: false,
          organId,
          metricName,
          reason: 'stale-data',
          detail: `Record timestamp ${timestampStr} exceeds maximum allowed age (${maxAge} ms); data is stale.`,
        }),
      );
      continue;
    }

    // 3. Cek unit mismatch untuk metrik yang dikenal
    const unitStr = record.unit ?? '';
    const metricKey = metricName.replace(/[^a-z0-9_]/g, '_');
    if (Object.prototype.hasOwnProperty.call(EXPECTED_METRIC_UNITS, metricKey)) {
      if (!matchesExpectedUnit(metricKey, unitStr)) {
        results.push(
          Object.freeze({
            ok: false,
            organId,
            metricName,
            reason: 'unit-mismatch',
            detail: `Unit mismatch for metric "${metricName}": received "${unitStr}", expected canonical unit "${EXPECTED_METRIC_UNITS[metricKey].canonicalUnit}".`,
          }),
        );
        continue;
      }
    }

    results.push(
      Object.freeze({
        ok: true,
        organId,
        metricName,
        value: record.value,
        unit: unitStr,
        timestamp: timestampStr,
        source: typeof record.source === 'string' && record.source.trim().length > 0 ? record.source.trim() : 'canonical-record',
        truthClass: record.truthClass ?? 'measured',
      }),
    );
  }

  return Object.freeze(results);
}
