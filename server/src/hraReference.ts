// HuBMAP Human Reference Atlas (HRA) semantic reference-organ adapter.
//
// This module intentionally normalizes reference-organ identity/provenance only.
// It does not download or expose HRA meshes, does not create patient-specific
// anatomy, and does not turn HRA reference data into a clinical conclusion.

export const HRA_REFERENCE_ORGANS_URL =
  'https://apps.humanatlas.io/hra-api/v1/reference-organs'

const TIMEOUT_MS = 8000
const MAX_REFERENCE_ORGANS = 256
const MAX_ANNOTATIONS = 64
const MAX_TEXT_LENGTH = 512

type FetchLike = typeof fetch

export interface HraReferenceOrgan {
  id: string
  entityId: string | null
  label: string | null
  annotations: string[]
  representationOf: string | null
  referenceOrgan: string | null
  sex: 'Male' | 'Female' | null
  side: 'Left' | 'Right' | null
  source: 'hubmap-hra'
  sourceUrl: typeof HRA_REFERENCE_ORGANS_URL
}

type JsonRecord = Record<string, unknown>

function asRecord(value: unknown): JsonRecord | null {
  return value != null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : null
}

function boundedString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (!normalized) return null
  return normalized.slice(0, MAX_TEXT_LENGTH)
}

function normalizeAnnotations(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  const seen = new Set<string>()
  const annotations: string[] = []
  for (const raw of value) {
    const annotation = boundedString(raw)
    if (!annotation || seen.has(annotation)) continue
    seen.add(annotation)
    annotations.push(annotation)
    if (annotations.length >= MAX_ANNOTATIONS) break
  }
  return annotations
}

function normalizeSex(value: unknown): HraReferenceOrgan['sex'] {
  return value === 'Male' || value === 'Female' ? value : null
}

function normalizeSide(value: unknown): HraReferenceOrgan['side'] {
  return value === 'Left' || value === 'Right' ? value : null
}

function normalizeReferenceOrgan(value: unknown): HraReferenceOrgan | null {
  const row = asRecord(value)
  if (!row) return null

  // HRA's public API models reference organs as SpatialEntity records. Ignore
  // other record types instead of guessing how to coerce them.
  if (row['@type'] !== 'SpatialEntity') return null

  const id = boundedString(row['@id'])
  if (!id) return null

  return {
    id,
    entityId: boundedString(row.entityId),
    label: boundedString(row.label),
    annotations: normalizeAnnotations(row.ccf_annotations),
    representationOf: boundedString(row.representation_of),
    referenceOrgan: boundedString(row.reference_organ),
    sex: normalizeSex(row.sex),
    side: normalizeSide(row.side),
    source: 'hubmap-hra',
    sourceUrl: HRA_REFERENCE_ORGANS_URL,
  }
}

export async function fetchHraReferenceOrgans(
  fetchImpl: FetchLike = fetch,
): Promise<HraReferenceOrgan[]> {
  const response = await fetchImpl(HRA_REFERENCE_ORGANS_URL, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`hra_reference_organs_${response.status}`)
  }

  const payload = (await response.json()) as unknown
  if (!Array.isArray(payload)) {
    throw new Error('hra_reference_organs_invalid_payload')
  }

  const normalized: HraReferenceOrgan[] = []
  const seen = new Set<string>()
  for (const raw of payload) {
    const organ = normalizeReferenceOrgan(raw)
    if (!organ || seen.has(organ.id)) continue
    seen.add(organ.id)
    normalized.push(organ)
    if (normalized.length >= MAX_REFERENCE_ORGANS) break
  }

  return normalized
}
