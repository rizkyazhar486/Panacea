export type BridgeEvidenceKind = 'literature' | 'ontology' | 'trial' | 'drug-label'

export interface BridgeEvidenceRef {
  key: string
  kind: BridgeEvidenceKind
  id: string
  title: string
  source: string
  url: string
  year?: string
  query?: string
}

const KEY = 'pmd_knowledge_bridge_evidence_v1'
const MAX_ITEMS = 8

function validKind(value: unknown): value is BridgeEvidenceKind {
  return value === 'literature' || value === 'ontology' || value === 'trial' || value === 'drug-label'
}

function validUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https?:\/\//i.test(value)
}

function isBridgeEvidenceRef(value: unknown): value is BridgeEvidenceRef {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.key === 'string' && item.key.length > 0 &&
    validKind(item.kind) &&
    typeof item.id === 'string' && item.id.length > 0 &&
    typeof item.title === 'string' && item.title.length > 0 &&
    typeof item.source === 'string' && item.source.length > 0 &&
    validUrl(item.url) &&
    (item.year === undefined || typeof item.year === 'string') &&
    (item.query === undefined || (typeof item.query === 'string' && item.query.trim().length > 0))
  )
}

export function loadBridgeEvidence(): BridgeEvidenceRef[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isBridgeEvidenceRef).slice(0, MAX_ITEMS)
  } catch {
    return []
  }
}

function persist(items: BridgeEvidenceRef[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX_ITEMS))) } catch { /* unavailable or quota full */ }
}

export function addBridgeEvidence(item: BridgeEvidenceRef): BridgeEvidenceRef[] {
  const current = loadBridgeEvidence()
  const next = [item, ...current.filter((entry) => entry.key !== item.key)].slice(0, MAX_ITEMS)
  persist(next)
  return next
}

export function removeBridgeEvidence(key: string): BridgeEvidenceRef[] {
  const next = loadBridgeEvidence().filter((entry) => entry.key !== key)
  persist(next)
  return next
}

export function clearBridgeEvidence(): BridgeEvidenceRef[] {
  persist([])
  return []
}
