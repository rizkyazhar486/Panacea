import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  assertFeatureFactory,
  calculatePriority,
  generateFeatureCandidates,
} from '../lib/feature-factory.mjs'

const factory = await generateFeatureCandidates()

const [domainConfig, surfaceConfig, routerSource] = await Promise.all([
  readFile(new URL('../../data/feature-factory/domains.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../../data/feature-factory/surfaces.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../../src/main.tsx', import.meta.url), 'utf8'),
])

const routerPaths = new Set(
  [...routerSource.matchAll(/\bpath=["']([^"']+)["']/g)].map((match) => match[1]),
)

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

test('feature factory generates exactly the declared 1000 candidates', () => {
  assert.equal(factory.target, 1000)
  assert.equal(factory.candidates.length, factory.target)
  assert.equal(new Set(factory.candidates.map((candidate) => candidate.id)).size, factory.target)
})

test('every generated source reference resolves through the source registry', () => {
  for (const candidate of factory.candidates) {
    assert.ok(candidate.sourceIds.length > 0, `${candidate.id} must declare source candidates`)
    for (const sourceId of candidate.sourceIds) {
      assert.ok(factory.sourceRegistry.has(sourceId), `${candidate.id} references missing ${sourceId}`)
    }
  }
})

test('source registry resolves stable filename keys without replacing canonical provenance ids', () => {
  const healthkitAlias = factory.sourceRegistry.get('healthkit')
  const healthkitCanonical = factory.sourceRegistry.get('apple_healthkit')

  assert.ok(healthkitAlias, 'healthkit filename alias must resolve')
  assert.ok(healthkitCanonical, 'apple_healthkit canonical id must resolve')
  assert.equal(healthkitAlias, healthkitCanonical)
  assert.equal(healthkitAlias.id, 'apple_healthkit')
  assert.equal(healthkitAlias.registryKey, 'healthkit')
  assert.equal(healthkitAlias.registryPath, 'data/source-registry/wearable/healthkit.json')
})

test('every feature-factory domain has exactly one declared reachable surface', () => {
  assert.equal(domainConfig.version, surfaceConfig.version)
  assert.ok(Array.isArray(domainConfig.domains) && domainConfig.domains.length > 0)
  assert.ok(Array.isArray(surfaceConfig.surfaces) && surfaceConfig.surfaces.length > 0)

  const domainIds = domainConfig.domains.map((domain) => domain.id)
  const surfaceDomainIds = surfaceConfig.surfaces.map((surface) => surface.domainId)

  assert.equal(new Set(domainIds).size, domainIds.length, 'feature-factory domain ids must be unique')
  assert.equal(new Set(surfaceDomainIds).size, surfaceDomainIds.length, 'each domain must declare exactly one canonical surface')
  assert.deepEqual([...surfaceDomainIds].sort(), [...domainIds].sort(), 'surfaces must cover every declared domain exactly once')

  for (const surface of surfaceConfig.surfaces) {
    assert.ok(['dedicated', 'shared', 'redirect'].includes(surface.surface), `${surface.domainId}: unknown surface type`)
    assert.ok(typeof surface.label === 'string' && surface.label.trim().length > 0, `${surface.domainId}: surface label is required`)
    assert.ok(typeof surface.route === 'string' && surface.route.startsWith('/'), `${surface.domainId}: route must be app-relative`)
    assert.equal(surface.route.includes('#'), false, `${surface.domainId}: route must not embed a hash fragment`)

    const url = new URL(surface.route, 'https://panacea.local')
    const pathname = url.pathname
    assert.ok(routerPaths.has(pathname), `${surface.domainId}: declared surface ${surface.route} has no matching router path ${pathname}`)

    if (surface.surface === 'redirect') {
      const routePattern = new RegExp(`<Route\\s+[^>]*path=["']${escapeRegExp(pathname)}["'][^>]*element=\\{<Navigate\\b`)
      assert.match(routerSource, routePattern, `${surface.domainId}: redirect surface ${pathname} must remain an explicit Navigate route`)
    }
  }
})

test('high-risk and clinical candidates can never auto-promote', () => {
  for (const candidate of factory.candidates) {
    if (candidate.risk === 'high' || candidate.risk === 'clinical') {
      assert.equal(candidate.autoEligible, false, candidate.id)
      assert.ok(candidate.blockers.length > 0, `${candidate.id} must explain its gate`)
    }
  }
})

test('heavy performance candidates are gated from automatic promotion', () => {
  for (const candidate of factory.candidates.filter((item) => item.metrics.performance >= 5)) {
    assert.equal(candidate.autoEligible, false, candidate.id)
    assert.ok(candidate.blockers.includes('heavy-asset-performance-review'), candidate.id)
  }
})

test('factory-level semantic validator reports no errors', () => {
  assert.deepEqual(assertFeatureFactory(factory), [])
})

test('priority formula is bounded and rewards benefit while penalizing cost/risk', () => {
  const safe = calculatePriority({
    impact: 5,
    reach: 5,
    complexity: 1,
    performance: 1,
    risk: 'low',
    sourceReadiness: 1,
  })
  const expensiveClinical = calculatePriority({
    impact: 5,
    reach: 5,
    complexity: 5,
    performance: 5,
    risk: 'clinical',
    sourceReadiness: 1,
  })
  assert.ok(safe >= 0 && safe <= 100)
  assert.ok(expensiveClinical >= 0 && expensiveClinical <= 100)
  assert.ok(safe > expensiveClinical)
})
