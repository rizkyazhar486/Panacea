export type AtlasAssetFormat = 'glb' | 'gltf'
export type AtlasAssetCompression = 'draco' | 'meshopt' | 'ktx2'

export interface AtlasAssetBounds {
  min: readonly [number, number, number]
  max: readonly [number, number, number]
  source: 'artifact-verified' | 'runtime-measured'
}

export interface AtlasAssetProductionGate {
  provenanceComplete: boolean
  licenseCleared: boolean
  stableIdMapped: boolean
  artifactVerified: boolean
  performanceReviewed: boolean
  visualQaReviewed: boolean
}

export interface HighEndAtlasAssetDescriptor {
  assetId: string
  structureId: string
  sourceRegistryId: string
  sourceVersion: string
  artifactPath: string
  format: AtlasAssetFormat
  sha256: string
  bytes: number
  lodLevel: number
  compression: readonly AtlasAssetCompression[]
  bounds?: AtlasAssetBounds
  productionGate: AtlasAssetProductionGate
}

export interface AtlasAssetValidation {
  runtimeEligible: boolean
  reasons: readonly string[]
}

export interface AtlasAssetLoadContext {
  signal?: AbortSignal
  cacheKey: string
}

export type AtlasAssetLoader<T> = (descriptor: HighEndAtlasAssetDescriptor, context: AtlasAssetLoadContext) => Promise<T>

const SHA256_RE = /^[a-f0-9]{64}$/i

function allProductionGatesPass(gate: AtlasAssetProductionGate) {
  return gate.provenanceComplete
    && gate.licenseCleared
    && gate.stableIdMapped
    && gate.artifactVerified
    && gate.performanceReviewed
    && gate.visualQaReviewed
}

export function validateHighEndAtlasAsset(descriptor: HighEndAtlasAssetDescriptor): AtlasAssetValidation {
  const reasons: string[] = []
  if (!descriptor.assetId.trim()) reasons.push('Asset id is missing.')
  if (!descriptor.structureId.trim()) reasons.push('Canonical structure id is missing.')
  if (!descriptor.sourceRegistryId.trim()) reasons.push('Source registry identity is missing.')
  if (!descriptor.sourceVersion.trim()) reasons.push('Pinned source version is missing.')
  if (!descriptor.artifactPath.trim()) reasons.push('Artifact path is missing.')
  if (!SHA256_RE.test(descriptor.sha256)) reasons.push('Artifact SHA-256 must be a full 64-character digest.')
  if (!Number.isInteger(descriptor.bytes) || descriptor.bytes <= 0) reasons.push('Artifact byte size must be a positive integer.')
  if (!Number.isInteger(descriptor.lodLevel) || descriptor.lodLevel < 0) reasons.push('LOD level must be a non-negative integer.')
  if (new Set(descriptor.compression).size !== descriptor.compression.length) reasons.push('Compression declarations must be unique.')
  if (!allProductionGatesPass(descriptor.productionGate)) reasons.push('Production gate is incomplete; asset cannot enter the runtime cache.')

  if (descriptor.bounds) {
    for (let axis = 0; axis < 3; axis += 1) {
      const min = descriptor.bounds.min[axis]
      const max = descriptor.bounds.max[axis]
      if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) {
        reasons.push(`Invalid verified bounds on axis ${axis}.`)
      }
    }
  }

  return { runtimeEligible: reasons.length === 0, reasons: [...new Set(reasons)] }
}

/**
 * Immutable cache identity. A changed source version or SHA-256 is a different
 * object even if the human-facing asset id is unchanged. This avoids the common
 * 3D-cache failure where stale geometry survives an asset replacement.
 */
export function highEndAtlasAssetCacheKey(descriptor: HighEndAtlasAssetDescriptor) {
  return [
    descriptor.sourceRegistryId.trim(),
    descriptor.sourceVersion.trim(),
    descriptor.assetId.trim(),
    `lod${descriptor.lodLevel}`,
    descriptor.sha256.toLowerCase(),
  ].join('::')
}

/**
 * Provenance-aware request coordinator for GLTF/GLB loaders.
 *
 * - rejects assets that have not passed every production gate;
 * - de-duplicates concurrent requests for the same immutable artifact;
 * - maintains a bounded LRU cache without owning renderer-specific resources;
 * - exposes explicit eviction so the Three.js layer can dispose GPU resources.
 *
 * The actual loader is injected, keeping this core independent from a specific
 * Three.js GLTFLoader version and easy to deterministic-test without WebGL.
 */
export class HighEndAtlasAssetCoordinator<T> {
  private readonly cache = new Map<string, T>()
  private readonly inflight = new Map<string, Promise<T>>()

  constructor(private readonly maxEntries = 32) {
    if (!Number.isInteger(maxEntries) || maxEntries < 1) throw new Error('Atlas asset cache maxEntries must be a positive integer.')
  }

  get size() {
    return this.cache.size
  }

  has(descriptor: HighEndAtlasAssetDescriptor) {
    return this.cache.has(highEndAtlasAssetCacheKey(descriptor))
  }

  peek(descriptor: HighEndAtlasAssetDescriptor) {
    const key = highEndAtlasAssetCacheKey(descriptor)
    const value = this.cache.get(key)
    if (value !== undefined) {
      this.cache.delete(key)
      this.cache.set(key, value)
    }
    return value
  }

  async load(descriptor: HighEndAtlasAssetDescriptor, loader: AtlasAssetLoader<T>, signal?: AbortSignal) {
    const validation = validateHighEndAtlasAsset(descriptor)
    if (!validation.runtimeEligible) {
      throw new Error(`Atlas asset blocked: ${validation.reasons.join(' ')}`)
    }
    if (signal?.aborted) throw signal.reason ?? new Error('Atlas asset load aborted.')

    const key = highEndAtlasAssetCacheKey(descriptor)
    const cached = this.peek(descriptor)
    if (cached !== undefined) return cached

    const pending = this.inflight.get(key)
    if (pending) return pending

    const request = loader(descriptor, { signal, cacheKey: key })
      .then((value) => {
        if (signal?.aborted) throw signal.reason ?? new Error('Atlas asset load aborted.')
        this.cache.set(key, value)
        while (this.cache.size > this.maxEntries) {
          const oldest = this.cache.keys().next().value as string | undefined
          if (!oldest) break
          this.cache.delete(oldest)
        }
        return value
      })
      .finally(() => {
        this.inflight.delete(key)
      })

    this.inflight.set(key, request)
    return request
  }

  evict(descriptor: HighEndAtlasAssetDescriptor) {
    return this.cache.delete(highEndAtlasAssetCacheKey(descriptor))
  }

  clear() {
    this.cache.clear()
  }

  cachedKeys() {
    return [...this.cache.keys()]
  }
}
