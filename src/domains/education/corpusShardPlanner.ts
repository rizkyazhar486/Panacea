/**
 * Pure deterministic Corpus Shard Planner for SKDI & OSCE clinical references.
 * Resolves a disease/station key -> exact small JSON shard URL (<50 kB) without
 * importing multi-megabyte bundles.
 *
 * Domain Purity Invariant: zero DOM, fetch, storage, clock, or RNG calls.
 */

export interface CorpusShardMeta {
  readonly file: string
  readonly bytes: number
  readonly gzipBytes: number
  readonly sha256: string
  readonly count: number
}

export interface CorpusShardManifest {
  readonly version: string
  readonly kind: 'skdi' | 'osce'
  readonly totalKeys: number
  readonly shardCount: number
  readonly maxShardGzipBytes: number
  readonly aliases?: Readonly<Record<string, string>>
  readonly keyToShard: Readonly<Record<string, string>>
  readonly shards: Readonly<Record<string, CorpusShardMeta>>
}

export interface CorpusShardLookupPlan {
  readonly found: boolean
  readonly canonicalKey: string
  readonly aliasedFrom: string | null
  readonly shardId: string | null
  readonly shardUrl: string | null
  readonly expectedSha256: string | null
}

function normalizeBasePrefix(basePrefix: string): string {
  const clean = basePrefix.replace(/\/+$/, '')
  return clean ? `${clean}/` : './'
}

export function resolveCorpusShardRequest(
  kind: 'skdi' | 'osce',
  queryKey: string,
  manifest: CorpusShardManifest | null | undefined,
  basePrefix = './data/corpora',
): CorpusShardLookupPlan {
  const key = typeof queryKey === 'string' ? queryKey.trim() : ''
  if (!key || !manifest || typeof manifest !== 'object' || !manifest.keyToShard) {
    return {
      found: false,
      canonicalKey: key,
      aliasedFrom: null,
      shardId: null,
      shardUrl: null,
      expectedSha256: null,
    }
  }

  let shardId = manifest.keyToShard[key] ?? null
  let canonicalKey = key
  let aliasedFrom: string | null = null

  if (!shardId && manifest.aliases && manifest.aliases[key]) {
    const target = manifest.aliases[key]
    if (manifest.keyToShard[target]) {
      canonicalKey = target
      aliasedFrom = key
      shardId = manifest.keyToShard[target]
    }
  }

  if (!shardId) {
    return {
      found: false,
      canonicalKey,
      aliasedFrom,
      shardId: null,
      shardUrl: null,
      expectedSha256: null,
    }
  }

  const meta = manifest.shards?.[shardId]
  const prefix = normalizeBasePrefix(basePrefix)
  return {
    found: true,
    canonicalKey,
    aliasedFrom,
    shardId,
    shardUrl: `${prefix}${kind}/${meta?.file || `${shardId}.json`}`,
    expectedSha256: meta?.sha256 ?? null,
  }
}
