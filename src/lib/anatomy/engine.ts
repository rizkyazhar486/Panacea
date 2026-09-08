import { BODY_PROJECTION_TARGETS, type BodyProjectionTarget } from '../bodyProjectionContract'
import { WHOLE_BODY_ASSET_MANIFEST, buildAtlasLoadPlan, validateAssetManifest } from './assets'
import { resolveProjectionTargetToAtlas } from './bodyProjectionBridge'
import { WHOLE_BODY_CORE_STRUCTURES } from './catalog'
import { CARDIOVASCULAR_DEEP_RELATIONS, CARDIOVASCULAR_DEEP_STRUCTURES } from './cardiovascularAtlas'
import { CIRCULATION_TOPOLOGY_RELATIONS } from './circulationTopology'
import { AnatomyGraph } from './graph'
import { equationsForStructure, traceMultiscalePath, validateMultiscaleAtlas } from './multiscale'
import { RESPIRATORY_RELATIONS, RESPIRATORY_STRUCTURES } from './respiratoryAtlas'
import { AnatomyResolver } from './resolver'
import { buildMeasuredAtlasLoadPlan, compileAtlasSources } from './sourceCompiler'
import type { AnatomyAssetRecord, AnatomyRelation, AnatomyResolveContext, AnatomyStructure, AtlasLoadContext, AtlasValidationIssue, AtlasValidationReport } from './types'

export const WHOLE_BODY_STRUCTURES: readonly AnatomyStructure[] = [
  ...WHOLE_BODY_CORE_STRUCTURES,
  ...RESPIRATORY_STRUCTURES,
  ...CARDIOVASCULAR_DEEP_STRUCTURES,
]

export const WHOLE_BODY_RELATIONS: readonly AnatomyRelation[] = [
  ...RESPIRATORY_RELATIONS,
  ...CARDIOVASCULAR_DEEP_RELATIONS,
  ...CIRCULATION_TOPOLOGY_RELATIONS,
]

export class WholeBodyAtlasEngine {
  readonly structures: readonly AnatomyStructure[]
  readonly assets: readonly AnatomyAssetRecord[]
  readonly graph: AnatomyGraph
  readonly resolver: AnatomyResolver

  constructor(
    structures: readonly AnatomyStructure[] = WHOLE_BODY_STRUCTURES,
    relations: readonly AnatomyRelation[] = WHOLE_BODY_RELATIONS,
    assets: readonly AnatomyAssetRecord[] = WHOLE_BODY_ASSET_MANIFEST,
  ) {
    this.structures = structures
    this.assets = assets
    this.graph = new AnatomyGraph(structures, relations)
    this.resolver = new AnatomyResolver(structures)
  }

  get(id: string) { return this.graph.get(id) }
  resolve(query: string, context: AnatomyResolveContext = {}) { return this.resolver.resolve(query, context) }
  resolveMany(queries: readonly string[], context: AnatomyResolveContext = {}) { return this.resolver.resolveMany(queries, context) }
  ancestors(id: string) { return this.graph.ancestors(id) }
  descendants(id: string) { return this.graph.descendants(id) }
  neighbors(id: string, types?: Parameters<AnatomyGraph['neighbors']>[1]) { return this.graph.neighbors(id, types) }
  tracePath(fromId: string, toId: string, options?: Parameters<AnatomyGraph['tracePath']>[2]) { return this.graph.tracePath(fromId, toId, options) }
  buildLoadPlan(context: AtlasLoadContext) { return buildAtlasLoadPlan(this.assets, context) }

  /**
   * Compile semantic structures and logical asset groups against the exact
   * named nodes indexed from the shipped GLB bundles. The result is suitable
   * for QA, performance planning, and renderer scheduling; it is not a medical
   * probability or patient-specific localization surface.
   */
  compileSources() {
    return compileAtlasSources(this.structures, this.assets)
  }

  sourceCoverageFor(structureId: string) {
    return this.compileSources().structures.find((entry) => entry.structure.id === structureId) ?? null
  }

  /**
   * Variant of the logical load planner that substitutes measured/indexed
   * triangle cost when source geometry can be resolved. Clinical focus only
   * changes graphics priority and never anatomy identity.
   */
  buildMeasuredLoadPlan(context: AtlasLoadContext) {
    return buildMeasuredAtlasLoadPlan(this.compileSources(), context)
  }

  traceScale(fromId: string, toId: string) {
    return traceMultiscalePath(fromId, toId)
  }

  physiologyFor(structureId: string) {
    return equationsForStructure(structureId)
  }

  validateMultiscale() {
    return validateMultiscaleAtlas(this.structures)
  }

  assetsFor(structureIds: readonly string[]) {
    const requested = new Set(structureIds)
    return this.assets.filter((record) => record.structureIds.some((id) => requested.has(id)))
  }

  resolveProjectionTarget(target: BodyProjectionTarget) {
    return resolveProjectionTargetToAtlas(target, this.resolver)
  }

  resolveProjectionTargetById(targetId: string) {
    const target = BODY_PROJECTION_TARGETS.find((candidate) => candidate.id === targetId)
    return target ? this.resolveProjectionTarget(target) : null
  }

  validate(): AtlasValidationReport {
    const issues: AtlasValidationIssue[] = [
      ...this.graph.validate().issues,
      ...validateAssetManifest(this.assets).issues,
      ...this.validateMultiscale().map((issue) => ({
        code: `multiscale-${issue.code}`,
        message: issue.message,
        structureId: issue.nodeId,
      })),
    ]
    const structureIds = new Set(this.structures.map((structure) => structure.id))
    for (const asset of this.assets) {
      for (const structureId of asset.structureIds) {
        if (!structureIds.has(structureId)) issues.push({ code: 'asset-missing-structure', message: `Asset ${asset.id} references missing structure ${structureId}.`, assetId: asset.id, structureId })
      }
    }
    return { valid: issues.length === 0, issues }
  }
}

export const wholeBodyAtlasEngine = new WholeBodyAtlasEngine()
