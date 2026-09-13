import { INDEKS_TUBUH, type StrukturTubuh } from '../bodyIndex.gen'
import { anatomySourceNameMatchesHint } from '../anatomySourceNodeRegistry'
import type { AtlasManifest, AtlasRegionId, AtlasSystemId } from './atlasKernel'

export type SourceAnatomyLayer = StrukturTubuh['l']
export type SourceLaterality = StrukturTubuh['s']
export type SourceDomainConfidence = 'direct-layer' | 'curated-lexical' | 'unclassified'

export interface SourceDomainCandidate {
  system?: AtlasSystemId
  confidence: SourceDomainConfidence
  rule?: string
}

export interface SourceTopologyLeaf {
  id: string
  sourceName: string
  baseName: string
  file: string
  layer: SourceAnatomyLayer
  sourceRegion: string
  atlasRegions: readonly AtlasRegionId[]
  laterality: SourceLaterality
  verticalPosition: number
  radialDistance: number
  triangles: number
  domain: SourceDomainCandidate
  /** Engineering source identity only; does not imply academic review. */
  sourceStatus: 'shipped-indexed-mesh'
}

export interface SourceTopologyBucket {
  id: string
  file: string
  layer: SourceAnatomyLayer
  sourceRegion: string
  verticalBand: number
  leafIds: readonly string[]
  triangleCount: number
  minY: number
  maxY: number
  maxRadialDistance: number
}

export interface SourceTopologyIndex {
  revision: string
  leaves: readonly SourceTopologyLeaf[]
  buckets: readonly SourceTopologyBucket[]
  byId: ReadonlyMap<string, SourceTopologyLeaf>
  bySourceName: ReadonlyMap<string, readonly SourceTopologyLeaf[]>
  byFile: ReadonlyMap<string, readonly SourceTopologyLeaf[]>
  totalTriangles: number
}

export interface AtlasSourceCoverageAudit {
  atlasNodeCount: number
  shippedAtlasNodeCount: number
  matchedShippedAtlasNodeIds: readonly string[]
  unmatchedShippedAtlasNodeIds: readonly string[]
  representedSourceLeafIds: readonly string[]
  unrepresentedSourceLeafIds: readonly string[]
  representedTriangles: number
  unrepresentedTriangles: number
  representationRatioByTriangles: number
}

const FILE_BY_LAYER: Record<SourceAnatomyLayer, string> = {
  surface: 'surface.glb',
  skeletal: 'skeletal.glb',
  muscular: 'muscular.glb',
  cardiovascular: 'cardiovascular.glb',
  nervous: 'nervous.glb',
  visceral: 'visceral.glb',
  lymphoid: 'lymphoid.glb',
}

const DIRECT_SYSTEM_BY_LAYER: Partial<Record<SourceAnatomyLayer, AtlasSystemId>> = {
  surface: 'surface',
  skeletal: 'skeletal',
  muscular: 'muscular',
  cardiovascular: 'cardiovascular',
  nervous: 'nervous',
  lymphoid: 'lymphatic',
}

const REGION_MAP: Readonly<Record<string, readonly AtlasRegionId[]>> = {
  kepala: ['head'],
  leher: ['neck'],
  toraks: ['thorax'],
  abdomen: ['abdomen'],
  pelvis: ['pelvis'],
  'bahu-lengan': ['upper-limb'],
  tangan: ['hand', 'upper-limb'],
  paha: ['lower-limb'],
  tungkai: ['lower-limb', 'foot'],
}

interface LexicalRule {
  system: AtlasSystemId
  rule: string
  patterns: readonly RegExp[]
}

/**
 * Conservative visceral-only classifier. It never changes the source name or
 * promotes content to academically reviewed. Unmatched structures deliberately
 * remain unclassified instead of being guessed into a system.
 */
const VISCERAL_RULES: readonly LexicalRule[] = [
  {
    system: 'respiratory',
    rule: 'respiratory-gross-structure',
    patterns: [
      /\btrachea\b/i, /\bbronch/i, /\blung\b/i, /\bpleur/i, /\blarynx\b/i,
      /\bpharynx\b/i, /\bnasal cavity\b/i, /\brespiratory bronchiole\b/i,
    ],
  },
  {
    system: 'urinary',
    rule: 'urinary-gross-structure',
    patterns: [
      /\bkidney\b/i, /\brenal pelvis\b/i, /\bureter\b/i, /\burinary bladder\b/i,
      /\burethra\b/i,
    ],
  },
  {
    system: 'reproductive',
    rule: 'reproductive-gross-structure',
    patterns: [
      /\bovary\b/i, /\bovarian\b/i, /\buterus\b/i, /\buterine\b/i, /\bvagina\b/i,
      /\btestis\b/i, /\btesticular\b/i, /\bepididym/i, /\bprostate\b/i,
      /\bseminal vesicle\b/i, /\bductus deferens\b/i, /\bvas deferens\b/i,
      /\bpenis\b/i, /\bclitoris\b/i,
    ],
  },
  {
    system: 'endocrine',
    rule: 'endocrine-gross-structure',
    patterns: [
      /\bpituitary\b/i, /\bthyroid gland\b/i, /\bparathyroid\b/i,
      /\badrenal gland\b/i, /\bsuprarenal gland\b/i, /\bpineal gland\b/i,
    ],
  },
  {
    system: 'digestive',
    rule: 'digestive-gross-structure',
    patterns: [
      /\besophagus\b/i, /\bstomach\b/i, /\bduodenum\b/i, /\bjejunum\b/i,
      /\bileum\b/i, /\bcecum\b/i, /\bcolon\b/i, /\brectum\b/i,
      /\bliver\b/i, /\bgallbladder\b/i, /\bbile duct\b/i, /\bpancrea/i,
      /\bparotid gland\b/i, /\bsubmandibular gland\b/i, /\bsublingual gland\b/i,
    ],
  },
  {
    system: 'sensory',
    rule: 'special-sensory-gross-structure',
    patterns: [
      /\beyeball\b/i, /\bcornea\b/i, /\blens\b/i, /\bretina\b/i,
      /\bcochlea\b/i, /\bvestibule of inner ear\b/i, /\bsemicircular duct\b/i,
    ],
  },
]

const normalize = (value: string) => value
  .normalize('NFKD')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()
  .replace(/\s+/g, ' ')

function fnv1a(value: string) {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}

function stableLeafId(structure: StrukturTubuh) {
  const identity = [structure.l, structure.w, structure.s, structure.n].join('|')
  return `mesh:${fnv1a(identity)}:${normalize(structure.b).slice(0, 48).replace(/ /g, '-') || 'unnamed'}`
}

export function classifySourceDomain(structure: StrukturTubuh): SourceDomainCandidate {
  const direct = DIRECT_SYSTEM_BY_LAYER[structure.l]
  if (direct) return { system: direct, confidence: 'direct-layer', rule: `source-layer:${structure.l}` }
  if (structure.l !== 'visceral') return { confidence: 'unclassified' }

  const value = `${structure.n} ${structure.b}`
  const matched = VISCERAL_RULES.filter((rule) => rule.patterns.some((pattern) => pattern.test(value)))
  // Ambiguous lexical classification is rejected rather than resolved by rule order.
  const systems = [...new Set(matched.map((rule) => rule.system))]
  if (systems.length !== 1) return { confidence: 'unclassified' }
  const rule = matched.find((candidate) => candidate.system === systems[0])!
  return { system: rule.system, confidence: 'curated-lexical', rule: rule.rule }
}

export function atlasRegionsForSourceRegion(sourceRegion: string): readonly AtlasRegionId[] {
  return REGION_MAP[sourceRegion] ?? []
}

function buildLeaves(): SourceTopologyLeaf[] {
  return INDEKS_TUBUH.map((structure) => ({
    id: stableLeafId(structure),
    sourceName: structure.n,
    baseName: structure.b,
    file: FILE_BY_LAYER[structure.l],
    layer: structure.l,
    sourceRegion: structure.w,
    atlasRegions: atlasRegionsForSourceRegion(structure.w),
    laterality: structure.s,
    verticalPosition: structure.y,
    radialDistance: structure.r,
    triangles: structure.t,
    domain: classifySourceDomain(structure),
    sourceStatus: 'shipped-indexed-mesh' as const,
  })).sort((a, b) => a.file.localeCompare(b.file) || a.sourceName.localeCompare(b.sourceName) || a.laterality.localeCompare(b.laterality))
}

function buildBuckets(leaves: readonly SourceTopologyLeaf[], bands = 12): SourceTopologyBucket[] {
  const safeBands = Math.max(1, Math.floor(bands))
  const grouped = new Map<string, SourceTopologyLeaf[]>()
  for (const leaf of leaves) {
    const band = Math.min(safeBands - 1, Math.max(0, Math.floor(leaf.verticalPosition * safeBands)))
    const key = `${leaf.file}|${leaf.sourceRegion}|${band}`
    const group = grouped.get(key) ?? []
    group.push(leaf)
    grouped.set(key, group)
  }

  return [...grouped.entries()].map(([key, group]) => {
    const [file, sourceRegion, bandText] = key.split('|')
    const verticalBand = Number(bandText)
    return {
      id: `bucket:${file}:${sourceRegion}:${verticalBand}`,
      file,
      layer: group[0]!.layer,
      sourceRegion,
      verticalBand,
      leafIds: group.map((leaf) => leaf.id).sort(),
      triangleCount: group.reduce((sum, leaf) => sum + leaf.triangles, 0),
      minY: Math.min(...group.map((leaf) => leaf.verticalPosition)),
      maxY: Math.max(...group.map((leaf) => leaf.verticalPosition)),
      maxRadialDistance: Math.max(...group.map((leaf) => leaf.radialDistance)),
    }
  }).sort((a, b) => a.file.localeCompare(b.file) || a.sourceRegion.localeCompare(b.sourceRegion) || a.verticalBand - b.verticalBand)
}

function frozenMultiMap<K, V>(pairs: readonly (readonly [K, V])[]) {
  const mutable = new Map<K, V[]>()
  for (const [key, value] of pairs) {
    const list = mutable.get(key) ?? []
    list.push(value)
    mutable.set(key, list)
  }
  return new Map([...mutable.entries()].map(([key, values]) => [key, values as readonly V[]]))
}

export function compileSourceTopology(): SourceTopologyIndex {
  const leaves = buildLeaves()
  const buckets = buildBuckets(leaves)
  return {
    revision: 'body-index-source-topology-2026-09-09-r1',
    leaves,
    buckets,
    byId: new Map(leaves.map((leaf) => [leaf.id, leaf])),
    bySourceName: frozenMultiMap(leaves.map((leaf) => [leaf.sourceName, leaf] as const)),
    byFile: frozenMultiMap(leaves.map((leaf) => [leaf.file, leaf] as const)),
    totalTriangles: leaves.reduce((sum, leaf) => sum + leaf.triangles, 0),
  }
}

export const SHIPPED_SOURCE_TOPOLOGY = compileSourceTopology()

export interface SourceTopologyQuery {
  text?: string
  files?: readonly string[]
  layers?: readonly SourceAnatomyLayer[]
  systems?: readonly AtlasSystemId[]
  atlasRegions?: readonly AtlasRegionId[]
  laterality?: readonly SourceLaterality[]
  maxResults?: number
}

export function querySourceTopology(
  index: SourceTopologyIndex,
  query: SourceTopologyQuery,
): SourceTopologyLeaf[] {
  const text = normalize(query.text ?? '')
  const tokens = text.split(' ').filter(Boolean)
  const rows = index.leaves.filter((leaf) => {
    if (query.files?.length && !query.files.includes(leaf.file)) return false
    if (query.layers?.length && !query.layers.includes(leaf.layer)) return false
    if (query.systems?.length && (!leaf.domain.system || !query.systems.includes(leaf.domain.system))) return false
    if (query.atlasRegions?.length && !leaf.atlasRegions.some((region) => query.atlasRegions!.includes(region))) return false
    if (query.laterality?.length && !query.laterality.includes(leaf.laterality)) return false
    if (!tokens.length) return true
    const haystack = normalize(`${leaf.sourceName} ${leaf.baseName}`)
    const haystackTokens = haystack.split(' ')
    return tokens.every((token) => haystackTokens.some((candidate) => candidate === token || (token.length >= 5 && candidate.startsWith(token))))
  })

  return rows
    .sort((a, b) => b.triangles - a.triangles || a.sourceName.localeCompare(b.sourceName))
    .slice(0, Math.max(1, query.maxResults ?? 100))
}

function atlasNodeMatchesLeaf(node: AtlasManifest['nodes'][number], leaf: SourceTopologyLeaf) {
  if (node.source.files?.length && !node.source.files.includes(leaf.file)) return false
  return node.source.nodeHints.some((hint) => anatomySourceNameMatchesHint(leaf.sourceName, hint))
}

/**
 * Compares curated atlas targets with every exact shipped mesh. This is an
 * engineering gap audit, not a claim that every mesh deserves a public label.
 */
export function auditAtlasSourceCoverage(
  manifest: AtlasManifest,
  index: SourceTopologyIndex = SHIPPED_SOURCE_TOPOLOGY,
): AtlasSourceCoverageAudit {
  const represented = new Set<string>()
  const matchedAtlasNodeIds: string[] = []
  const unmatchedAtlasNodeIds: string[] = []

  for (const node of manifest.nodes) {
    if (node.geometryStatus !== 'shipped' && node.geometryStatus !== 'partial') continue
    const matches = index.leaves.filter((leaf) => atlasNodeMatchesLeaf(node, leaf))
    if (matches.length) {
      matchedAtlasNodeIds.push(node.id)
      for (const leaf of matches) represented.add(leaf.id)
    } else if (node.geometryStatus === 'shipped') {
      unmatchedAtlasNodeIds.push(node.id)
    }
  }

  const representedTriangles = index.leaves
    .filter((leaf) => represented.has(leaf.id))
    .reduce((sum, leaf) => sum + leaf.triangles, 0)
  const unrepresentedTriangles = Math.max(0, index.totalTriangles - representedTriangles)

  return {
    atlasNodeCount: manifest.nodes.length,
    shippedAtlasNodeCount: manifest.nodes.filter((node) => node.geometryStatus === 'shipped').length,
    matchedShippedAtlasNodeIds: [...new Set(matchedAtlasNodeIds)].sort(),
    unmatchedShippedAtlasNodeIds: [...new Set(unmatchedAtlasNodeIds)].sort(),
    representedSourceLeafIds: [...represented].sort(),
    unrepresentedSourceLeafIds: index.leaves.filter((leaf) => !represented.has(leaf.id)).map((leaf) => leaf.id),
    representedTriangles,
    unrepresentedTriangles,
    representationRatioByTriangles: index.totalTriangles > 0 ? representedTriangles / index.totalTriangles : 0,
  }
}

export function validateSourceTopology(index: SourceTopologyIndex = SHIPPED_SOURCE_TOPOLOGY): string[] {
  const issues: string[] = []
  const ids = new Set<string>()
  for (const leaf of index.leaves) {
    if (ids.has(leaf.id)) issues.push(`Duplicate source topology id: ${leaf.id}`)
    ids.add(leaf.id)
    if (!leaf.sourceName.trim()) issues.push(`Blank source name: ${leaf.id}`)
    if (leaf.triangles < 0) issues.push(`Negative triangle count: ${leaf.id}`)
    if (!(leaf.verticalPosition >= 0 && leaf.verticalPosition <= 1)) issues.push(`Invalid normalized vertical position: ${leaf.id}`)
    if (leaf.radialDistance < 0) issues.push(`Invalid radial distance: ${leaf.id}`)
    if (!leaf.file.endsWith('.glb')) issues.push(`Invalid source bundle file: ${leaf.id}`)
  }
  for (const bucket of index.buckets) {
    if (!bucket.leafIds.length) issues.push(`Empty topology bucket: ${bucket.id}`)
    if (bucket.triangleCount < 0) issues.push(`Negative bucket triangle count: ${bucket.id}`)
    for (const leafId of bucket.leafIds) if (!index.byId.has(leafId)) issues.push(`Bucket references missing leaf: ${bucket.id} -> ${leafId}`)
  }
  return [...new Set(issues)]
}
