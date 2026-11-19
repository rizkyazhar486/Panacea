import type { SkdiDiseaseNote } from '../../lib/skdiDiseaseNotes'
import type { OsceStationNote } from '../../lib/osceStationNotes'
import {
  resolveCorpusShardRequest,
  type CorpusShardManifest,
} from '../../domains/education/corpusShardPlanner'

export type ShardedDiseaseLookupResult =
  | { readonly kind: 'skdi'; readonly own: SkdiDiseaseNote }
  | { readonly kind: 'osce'; readonly sourceStation: string; readonly station: OsceStationNote }
  | null

const manifestCache: Partial<Record<'skdi' | 'osce', CorpusShardManifest>> = {}
const shardCache = new Map<string, Record<string, unknown>>()

async function fetchJsonCached<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function loadCorpusManifest(kind: 'skdi' | 'osce'): Promise<CorpusShardManifest | null> {
  if (manifestCache[kind]) return manifestCache[kind]!
  const manifest = await fetchJsonCached<CorpusShardManifest>(`./data/corpora/${kind}/manifest.json`)
  if (manifest && manifest.keyToShard) {
    manifestCache[kind] = manifest
    return manifest
  }
  return null
}

async function fetchShardPayload(url: string): Promise<Record<string, unknown> | null> {
  if (shardCache.has(url)) return shardCache.get(url)!
  const data = await fetchJsonCached<Record<string, unknown>>(url)
  if (data) {
    shardCache.set(url, data)
    return data
  }
  return null
}

export async function loadShardedDiseaseRecord(disease: string): Promise<ShardedDiseaseLookupResult> {
  const skdiManifest = await loadCorpusManifest('skdi')
  if (!skdiManifest) return null

  const skdiPlan = resolveCorpusShardRequest('skdi', disease, skdiManifest)
  if (skdiPlan.found && skdiPlan.shardUrl) {
    const shard = await fetchShardPayload(skdiPlan.shardUrl)
    const note = shard?.[skdiPlan.canonicalKey] as SkdiDiseaseNote | undefined
    if (note) return { kind: 'skdi', own: note }
  }

  const aliasTarget = skdiManifest.aliases?.[disease]
  if (aliasTarget) {
    const osceManifest = await loadCorpusManifest('osce')
    const oscePlan = resolveCorpusShardRequest('osce', aliasTarget, osceManifest)
    if (oscePlan.found && oscePlan.shardUrl) {
      const shard = await fetchShardPayload(oscePlan.shardUrl)
      const station = shard?.[oscePlan.canonicalKey] as OsceStationNote | undefined
      if (station) return { kind: 'osce', sourceStation: aliasTarget, station }
    }
  }

  return null
}
