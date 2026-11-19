#!/usr/bin/env node
/**
 * Deterministically shards heavy clinical corpora (`skdiDiseaseNotes.ts` &
 * `osceStationNotes.ts`) into small (<50 kB) on-demand JSON shards under
 * `public/data/corpora/{skdi,osce}/` while keeping canonical TypeScript sources intact.
 *
 * Run:
 *   node --import=./scripts/uji/typescript-resolver.mjs scripts/medstudy/build-corpus-shards.mjs
 *   node --import=./scripts/uji/typescript-resolver.mjs scripts/medstudy/build-corpus-shards.mjs --check
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

import { SKDI_DISEASE_NOTES } from '../../src/lib/skdiDiseaseNotes.ts'
import { SKDI_DISEASE_NOTE_ALIASES } from '../../src/lib/skdiDiseaseNoteAliases.ts'
import { OSCE_STATION_NOTES } from '../../src/lib/osceStationNotes.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const OUT_ROOT = join(ROOT, 'public', 'data', 'corpora')
const MAX_RAW_SHARD_BYTES = 40_000
const CHECK_ONLY = process.argv.includes('--check')

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

function buildShardsForRecordMap(kind, entriesMap, aliases = undefined) {
  const keys = Object.keys(entriesMap).sort((a, b) => a.localeCompare(b, 'en'))
  const shards = {}
  const keyToShard = {}
  let currentEntries = {}
  let currentIndex = 0
  let currentEstimatedBytes = 2
  let maxRawBytes = 0
  let maxGzipBytes = 0

  const flushShard = () => {
    const count = Object.keys(currentEntries).length
    if (count === 0) return
    const shardId = `shard-${String(currentIndex).padStart(3, '0')}`
    const file = `${shardId}.json`
    const json = JSON.stringify(currentEntries)
    const rawBytes = Buffer.byteLength(json, 'utf8')
    const gzBytes = gzipSync(Buffer.from(json, 'utf8'), { level: 9 }).length
    maxRawBytes = Math.max(maxRawBytes, rawBytes)
    maxGzipBytes = Math.max(maxGzipBytes, gzBytes)
    shards[shardId] = {
      file,
      bytes: rawBytes,
      gzipBytes: gzBytes,
      sha256: sha256(json),
      count,
      payload: json,
    }
    for (const k of Object.keys(currentEntries)) {
      keyToShard[k] = shardId
    }
    currentIndex += 1
    currentEntries = {}
    currentEstimatedBytes = 2
  }

  for (const key of keys) {
    const serializedEntry = JSON.stringify({ [key]: entriesMap[key] })
    const entryDelta = Buffer.byteLength(serializedEntry, 'utf8') + 2
    if (Object.keys(currentEntries).length > 0 && currentEstimatedBytes + entryDelta > MAX_RAW_SHARD_BYTES) {
      flushShard()
    }
    currentEntries[key] = entriesMap[key]
    currentEstimatedBytes += entryDelta
  }
  flushShard()

  const shardMeta = Object.fromEntries(
    Object.entries(shards).map(([id, s]) => [id, { file: s.file, bytes: s.bytes, gzipBytes: s.gzipBytes, sha256: s.sha256, count: s.count }]),
  )

  const manifest = {
    version: '1.0.0',
    kind,
    totalKeys: keys.length,
    shardCount: Object.keys(shards).length,
    maxShardRawBytes: maxRawBytes,
    maxShardGzipBytes: maxGzipBytes,
    ...(aliases ? { aliases } : {}),
    keyToShard,
    shards: shardMeta,
  }

  return { manifest, manifestJson: JSON.stringify(manifest), shards }
}

const skdiBuilt = buildShardsForRecordMap('skdi', SKDI_DISEASE_NOTES, SKDI_DISEASE_NOTE_ALIASES)
const osceBuilt = buildShardsForRecordMap('osce', OSCE_STATION_NOTES)

function writeOrCheckCorpus(kind, built) {
  const dir = join(OUT_ROOT, kind)
  if (CHECK_ONLY) {
    const manifestPath = join(dir, 'manifest.json')
    if (!existsSync(manifestPath)) {
      throw new Error(`Missing manifest ${manifestPath}. Run build-corpus-shards.mjs to generate shards.`)
    }
    const existingManifest = readFileSync(manifestPath, 'utf8')
    if (existingManifest !== built.manifestJson) {
      throw new Error(`Stale corpus manifest at ${manifestPath}. Run build-corpus-shards.mjs to regenerate.`)
    }
    for (const [id, shard] of Object.entries(built.shards)) {
      const shardPath = join(dir, shard.file)
      if (!existsSync(shardPath)) {
        throw new Error(`Missing corpus shard ${kind}/${shard.file} for ${id}`)
      }
      const actual = readFileSync(shardPath, 'utf8')
      if (sha256(actual) !== shard.sha256) {
        throw new Error(`SHA-256 mismatch for corpus shard ${kind}/${shard.file}`)
      }
    }
    return
  }

  mkdirSync(dir, { recursive: true })
  for (const name of readdirSync(dir)) {
    if (name.endsWith('.json')) rmSync(join(dir, name))
  }
  for (const shard of Object.values(built.shards)) {
    writeFileSync(join(dir, shard.file), shard.payload, 'utf8')
  }
  writeFileSync(join(dir, 'manifest.json'), built.manifestJson, 'utf8')
}

writeOrCheckCorpus('skdi', skdiBuilt)
writeOrCheckCorpus('osce', osceBuilt)

console.log(
  JSON.stringify({
    mode: CHECK_ONLY ? 'check' : 'write',
    skdi: {
      totalKeys: skdiBuilt.manifest.totalKeys,
      shardCount: skdiBuilt.manifest.shardCount,
      maxShardRawBytes: skdiBuilt.manifest.maxShardRawBytes,
      maxShardGzipBytes: skdiBuilt.manifest.maxShardGzipBytes,
    },
    osce: {
      totalKeys: osceBuilt.manifest.totalKeys,
      shardCount: osceBuilt.manifest.shardCount,
      maxShardRawBytes: osceBuilt.manifest.maxShardRawBytes,
      maxShardGzipBytes: osceBuilt.manifest.maxShardGzipBytes,
    },
  }),
)
