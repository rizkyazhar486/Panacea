import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const FACTORY_ROOT = path.join(ROOT, 'data', 'feature-factory')
const SOURCE_ROOT = path.join(ROOT, 'data', 'source-registry')
const DOMAIN_PATH = path.join(FACTORY_ROOT, 'domains.json')
const CAPABILITY_PATH = path.join(FACTORY_ROOT, 'capabilities.json')
const PROGRESS_PATH = path.join(FACTORY_ROOT, 'progress.json')

const RISK_ORDER = Object.freeze({ low: 0, medium: 1, high: 2, clinical: 3 })
const STATUS_VALUES = new Set(['candidate', 'in_progress', 'done', 'blocked', 'skipped'])
const MODE_VALUES = new Set(['runtime', 'adapter', 'build-time'])

async function readJson(filePath) {
  const raw = await readFile(filePath, 'utf8')
  try {
    return JSON.parse(raw)
  } catch (error) {
    throw new Error(`${path.relative(ROOT, filePath)}: invalid JSON (${error.message})`)
  }
}

async function collectSourceFiles(directory) {
  const files = []
  const entries = await readdir(directory, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(fullPath)))
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.json') &&
      !entry.name.endsWith('.schema.json')
    ) {
      files.push(fullPath)
    }
  }
  return files
}

export async function loadSourceRegistry() {
  const map = new Map()
  const canonicalIds = new Set()

  for (const filePath of await collectSourceFiles(SOURCE_ROOT)) {
    const source = await readJson(filePath)
    if (!source?.id) continue
    if (canonicalIds.has(source.id)) {
      throw new Error(`Duplicate source id ${JSON.stringify(source.id)}`)
    }
    canonicalIds.add(source.id)

    const registryKey = path.basename(filePath, '.json')
    const enriched = {
      ...source,
      registryKey,
      registryPath: path.relative(ROOT, filePath).replaceAll(path.sep, '/'),
    }

    // Domain roadmaps use stable file keys (for example `healthkit`), while
    // Source Registry records keep authoritative canonical ids (for example
    // `apple_healthkit`). Resolve both without mutating the source records.
    for (const key of new Set([source.id, registryKey])) {
      const existing = map.get(key)
      if (existing && existing.id !== source.id) {
        throw new Error(`Source alias collision ${JSON.stringify(key)} between ${existing.id} and ${source.id}`)
      }
      map.set(key, enriched)
    }
  }
  return map
}

export async function loadFactoryConfig() {
  const [domainConfig, capabilityConfig] = await Promise.all([
    readJson(DOMAIN_PATH),
    readJson(CAPABILITY_PATH),
  ])
  return {
    target: domainConfig.generatedTarget,
    domains: domainConfig.domains,
    capabilities: capabilityConfig.capabilities,
  }
}

export async function loadProgress() {
  try {
    const value = await readJson(PROGRESS_PATH)
    return value
  } catch (error) {
    if (error?.code === 'ENOENT') return { version: 1, updatedAt: null, items: {} }
    throw error
  }
}

export function calculatePriority({ impact, reach, complexity, performance, risk, sourceReadiness }) {
  const benefit =
    0.55 * (impact / 5) +
    0.25 * (reach / 5) +
    0.20 * sourceReadiness

  const normalizedComplexity = Math.max(0, complexity - 1) / 4
  const normalizedPerformance = Math.max(0, performance - 1) / 4
  const riskPenalty = [0, 0.1, 0.3, 0.5][RISK_ORDER[risk] ?? 3]

  const denominator =
    1 +
    0.35 * normalizedComplexity +
    0.25 * normalizedPerformance +
    riskPenalty

  return Math.max(0, Math.min(100, Math.round((100 * benefit) / denominator)))
}

function isOperationalSource(source) {
  return source.adapter?.status === 'ACTIVE' || source.license?.status === 'VERIFIED'
}

function sourceReadinessScore(sourceEntries) {
  if (sourceEntries.length === 0) return 0
  return sourceEntries.filter(isOperationalSource).length / sourceEntries.length
}

function candidateBlockers(risk, performance, sourceEntries, missingSourceIds) {
  const blockers = []
  if (missingSourceIds.length > 0) {
    blockers.push(`missing-source:${missingSourceIds.join(',')}`)
  }
  const sourceReview = sourceEntries
    .filter((source) => !isOperationalSource(source))
    .map((source) => source.id)
  if (sourceReview.length > 0) blockers.push(`source-review:${sourceReview.join(',')}`)
  if (risk === 'high') blockers.push('manual-scientific-review')
  if (risk === 'clinical') blockers.push('manual-clinical-validation')
  if (performance >= 5) blockers.push('heavy-asset-performance-review')
  return blockers
}

function normalizeProgressEntry(entry) {
  if (!entry) return { status: 'candidate' }
  return {
    status: entry.status ?? 'candidate',
    commit: entry.commit ?? null,
    paths: Array.isArray(entry.paths) ? entry.paths : [],
    note: entry.note ?? '',
    updatedAt: entry.updatedAt ?? null,
  }
}

export async function generateFeatureCandidates() {
  const [{ target, domains, capabilities }, sourceRegistry, progress] = await Promise.all([
    loadFactoryConfig(),
    loadSourceRegistry(),
    loadProgress(),
  ])

  const candidates = []
  for (const domain of domains) {
    for (const capability of capabilities) {
      const sourceEntries = []
      const missingSourceIds = []
      for (const sourceId of domain.sources ?? []) {
        const source = sourceRegistry.get(sourceId)
        if (source) sourceEntries.push(source)
        else missingSourceIds.push(sourceId)
      }

      const operationalSources = sourceEntries.filter(isOperationalSource)
      const impact = Math.round((domain.impact + capability.impact) / 2)
      const reach = Math.round((domain.reach + capability.reach) / 2)
      const complexity = Math.round((domain.complexity + capability.complexity) / 2)
      const performance = Math.max(domain.performance, capability.performance)
      const sourceReadiness = sourceReadinessScore(sourceEntries)
      const blockers = candidateBlockers(domain.risk, performance, sourceEntries, missingSourceIds)
      const id = `ff-${domain.id}-${capability.id}`
      const progressEntry = normalizeProgressEntry(progress.items?.[id])

      candidates.push({
        id,
        title: `${domain.name} — ${capability.name}`,
        domain: domain.id,
        domainName: domain.name,
        group: domain.group,
        capability: capability.id,
        capabilityName: capability.name,
        intent: capability.intent,
        mode: capability.mode,
        risk: domain.risk,
        sourceIds: [...(domain.sources ?? [])],
        operationalSourceIds: operationalSources.map((source) => source.registryKey),
        sourceReadiness: Number(sourceReadiness.toFixed(3)),
        metrics: {
          impact,
          reach,
          complexity,
          performance,
          priority: calculatePriority({
            impact,
            reach,
            complexity,
            performance,
            risk: domain.risk,
            sourceReadiness,
          }),
        },
        blockers,
        autoEligible:
          RISK_ORDER[domain.risk] <= RISK_ORDER.medium &&
          missingSourceIds.length === 0 &&
          operationalSources.length > 0 &&
          performance < 5,
        status: progressEntry.status,
        implementation: {
          commit: progressEntry.commit,
          paths: progressEntry.paths,
          note: progressEntry.note,
          updatedAt: progressEntry.updatedAt,
        },
      })
    }
  }

  return { target, candidates, sourceRegistry, progress }
}

export function assertFeatureFactory({ target, candidates, sourceRegistry, progress }) {
  const errors = []
  if (!Number.isInteger(target) || target <= 0) errors.push('generatedTarget must be a positive integer')
  if (candidates.length !== target) {
    errors.push(`expected ${target} candidates, generated ${candidates.length}`)
  }

  const ids = new Set()
  for (const candidate of candidates) {
    if (ids.has(candidate.id)) errors.push(`duplicate candidate id: ${candidate.id}`)
    ids.add(candidate.id)

    if (!MODE_VALUES.has(candidate.mode)) errors.push(`${candidate.id}: invalid mode ${candidate.mode}`)
    if (!(candidate.risk in RISK_ORDER)) errors.push(`${candidate.id}: invalid risk ${candidate.risk}`)
    if (candidate.sourceIds.length === 0) errors.push(`${candidate.id}: no source candidates`)
    for (const sourceId of candidate.sourceIds) {
      if (!sourceRegistry.has(sourceId)) errors.push(`${candidate.id}: source not found ${sourceId}`)
    }
    if (!Number.isInteger(candidate.metrics.priority) || candidate.metrics.priority < 0 || candidate.metrics.priority > 100) {
      errors.push(`${candidate.id}: priority must be integer 0..100`)
    }
    if (candidate.metrics.performance < 1 || candidate.metrics.performance > 5) {
      errors.push(`${candidate.id}: performance cost must be 1..5`)
    }
    if ((candidate.risk === 'high' || candidate.risk === 'clinical') && candidate.autoEligible) {
      errors.push(`${candidate.id}: high/clinical risk cannot be autoEligible`)
    }
    if (candidate.autoEligible && candidate.operationalSourceIds.length === 0) {
      errors.push(`${candidate.id}: autoEligible candidate has no operational source`)
    }
  }

  for (const [id, entry] of Object.entries(progress.items ?? {})) {
    if (!ids.has(id)) errors.push(`progress references unknown candidate ${id}`)
    if (!STATUS_VALUES.has(entry.status)) errors.push(`${id}: invalid progress status ${entry.status}`)
  }

  return errors
}

export function rankCandidates(candidates) {
  return [...candidates].sort((a, b) =>
    b.metrics.priority - a.metrics.priority ||
    a.metrics.complexity - b.metrics.complexity ||
    a.id.localeCompare(b.id),
  )
}

export async function writeProgress(progress) {
  const stable = {
    version: 1,
    updatedAt: new Date().toISOString(),
    items: Object.fromEntries(
      Object.entries(progress.items ?? {}).sort(([a], [b]) => a.localeCompare(b)),
    ),
  }
  await writeFile(PROGRESS_PATH, `${JSON.stringify(stable, null, 2)}\n`, 'utf8')
  return stable
}

export const FEATURE_FACTORY_PATHS = Object.freeze({
  root: FACTORY_ROOT,
  progress: PROGRESS_PATH,
})
