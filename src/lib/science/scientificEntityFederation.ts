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

const tidy = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')

export function buildFederationId(domain: string, label: string, ids: SourceNativeId[]): string {
  const anchored = ids.filter((id) => id.sourceId.trim() && id.nativeId.trim())
    .map((id) => `${tidy(id.sourceId)}:${id.nativeId.trim()}`)
    .sort()[0]
  return anchored ? `${tidy(domain)}:${anchored}` : `${tidy(domain)}:label:${tidy(label)}`
}

export function mergeFederatedScientificEntities(input: FederatedScientificEntity[]): FederatedScientificEntity[] {
  const merged = new Map<string, FederatedScientificEntity>()
  for (const item of input) {
    const key = item.federationId || buildFederationId(item.domain, item.label, item.sourceIds)
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
