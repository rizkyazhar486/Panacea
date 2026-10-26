export type FederationEvidence = 'identity' | 'association' | 'causal-hypothesis' | 'experimental-structure' | 'predicted-structure'

export interface SourceNativeId {
  sourceId: string
  nativeId: string
  version?: string | null
  retrievedAt?: string | null
}

export interface FederatedScientificEntity {
  federationId: string
  domain: string
  label: string
  sourceIds: SourceNativeId[]
  aliases: string[]
  evidence: FederationEvidence[]
  contradictions: string[]
}

// Identity normalization must be injective (modulo trim/case): a lossy slug
// silently collapses distinct scientific names (e.g. α-synuclein vs β-synuclein)
// into one federation key. Percent-encoding preserves every code point and
// neutralizes delimiter injection, while leaving plain ASCII ids unchanged.
// Unpaired surrogates are malformed input and are replaced with U+FFFD so
// encoding never throws.
const identityComponent = (value: string): string => encodeURIComponent(
  value.trim().toLowerCase()
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '\uFFFD'),
)

export function buildFederationId(domain: string, label: string, ids: SourceNativeId[]): string {
  const anchored = ids.filter((id) => typeof id.sourceId === 'string' && typeof id.nativeId === 'string' && id.sourceId.trim() && id.nativeId.trim())
    .map((id) => `${identityComponent(id.sourceId)}:${id.nativeId.trim()}`)
    // 'label' is the reserved fallback-namespace marker: an anchor whose source
    // is literally named 'label' would forge a fallback-looking key, so it is
    // refused as an anchor and the entity falls back to label-derived identity.
    .filter((candidate) => !candidate.startsWith('label:'))
    .sort()[0]
  return anchored ? `${identityComponent(domain)}:${anchored}` : `${identityComponent(domain)}:label:${identityComponent(label)}`
}

export function mergeFederatedScientificEntities(input: FederatedScientificEntity[]): FederatedScientificEntity[] {
  const merged = new Map<string, FederatedScientificEntity>()
  for (const item of input) {
    // A blank or non-string supplied id is not an identity: derive one instead
    // of letting whitespace become a shared Map key that merges distinct entities.
    const suppliedId = typeof item.federationId === 'string' ? item.federationId.trim() : ''
    const key = suppliedId || buildFederationId(item.domain, item.label, item.sourceIds)
    const previous = merged.get(key)
    if (!previous) {
      merged.set(key, { ...item, federationId: key, sourceIds: [...item.sourceIds], aliases: [...new Set(item.aliases)], evidence: [...new Set(item.evidence)], contradictions: [...new Set(item.contradictions)] })
      continue
    }
    if (previous.domain !== item.domain) {
      previous.contradictions = [...new Set([...previous.contradictions, `domain-conflict:${previous.domain}:${item.domain}`])]
      continue
    }
    const ids = new Map(previous.sourceIds.map((id) => [`${id.sourceId}|${id.nativeId}|${id.version ?? ''}`, id]))
    for (const id of item.sourceIds) ids.set(`${id.sourceId}|${id.nativeId}|${id.version ?? ''}`, id)
    previous.sourceIds = [...ids.values()]
    previous.aliases = [...new Set([...previous.aliases, ...item.aliases])]
    previous.evidence = [...new Set([...previous.evidence, ...item.evidence])]
    previous.contradictions = [...new Set([...previous.contradictions, ...item.contradictions])]
  }
  return [...merged.values()]
}

export function structureEvidenceLabel(entity: FederatedScientificEntity): 'experimental' | 'predicted' | 'mixed' | 'none' {
  const experimental = entity.evidence.includes('experimental-structure')
  const predicted = entity.evidence.includes('predicted-structure')
  if (experimental && predicted) return 'mixed'
  if (experimental) return 'experimental'
  if (predicted) return 'predicted'
  return 'none'
}

export function mayInferCausationFromAssociation(): false {
  return false
}

export const SCIENTIFIC_FEDERATION_BOUNDARY = 'Cross-source normalization preserves source-native identifiers, version context and contradictions. Association is not causation and a candidate mechanism is not clinical efficacy.'
