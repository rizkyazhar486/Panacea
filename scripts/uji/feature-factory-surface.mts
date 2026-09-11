import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

type Domain = { id: string }
type Surface = { domainId: string; route: string; surface: 'dedicated' | 'shared' | 'redirect'; label: string; note?: string }
type ProgressItem = { status?: string; commit?: string; paths?: string[]; note?: string; academicReview?: unknown }

const domainsDoc = JSON.parse(readFileSync('data/feature-factory/domains.json', 'utf8')) as { domains: Domain[] }
const surfacesDoc = JSON.parse(readFileSync('data/feature-factory/surfaces.json', 'utf8')) as { surfaces: Surface[] }
const progressDoc = JSON.parse(readFileSync('data/feature-factory/progress.json', 'utf8')) as { items: Record<string, ProgressItem> }
const routerSource = readFileSync('src/main.tsx', 'utf8')

const canonical = (route: string) => route.split(/[?#]/, 1)[0] || '/'
const routerPaths = new Set([...routerSource.matchAll(/<Route\s+[^>]*\bpath\s*=\s*["']([^"']+)["']/g)].map((match) => canonical(match[1])))

const domainIds = domainsDoc.domains.map((domain) => domain.id)
assert.equal(domainIds.length, 20, 'Feature Factory domain count changed; update the surface contract intentionally')
assert.equal(new Set(domainIds).size, domainIds.length, 'Feature Factory domain ids must be unique')

const surfaceDomainIds = surfacesDoc.surfaces.map((surface) => surface.domainId)
assert.equal(new Set(surfaceDomainIds).size, surfaceDomainIds.length, 'Each Feature Factory domain may have only one canonical entry surface')
assert.deepEqual([...surfaceDomainIds].sort(), [...domainIds].sort(), 'Every Feature Factory domain must map to a canonical product surface')

for (const surface of surfacesDoc.surfaces) {
  assert.ok(surface.route.startsWith('/'), `${surface.domainId} surface must be an internal route`)
  assert.ok(surface.label.trim().length > 0, `${surface.domainId} surface needs a user-facing label`)
  assert.ok(routerPaths.has(canonical(surface.route)), `${surface.domainId} surface ${surface.route} does not resolve through src/main.tsx`)
  if (surface.surface === 'shared') {
    assert.ok(surface.label.includes('·') || surface.note, `${surface.domainId} shared surface must explain its subexperience rather than masquerading as a dedicated page`)
  }
}

const domainsByLongestPrefix = [...domainIds].sort((a, b) => b.length - a.length)
function domainForCandidate(candidateId: string): string | null {
  return domainsByLongestPrefix.find((domainId) => candidateId.startsWith(`ff-${domainId}-`)) ?? null
}

const doneItems = Object.entries(progressDoc.items).filter(([, item]) => item.status === 'done')
assert.ok(doneItems.length > 0, 'Feature Factory ledger should contain at least one completed candidate')
for (const [candidateId, item] of doneItems) {
  const domainId = domainForCandidate(candidateId)
  assert.ok(domainId, `Done candidate ${candidateId} cannot be associated with a declared Feature Factory domain`)
  const surface = surfacesDoc.surfaces.find((entry) => entry.domainId === domainId)
  assert.ok(surface, `Done candidate ${candidateId} has no user-facing domain surface`)
  assert.ok(routerPaths.has(canonical(surface.route)), `Done candidate ${candidateId} points to an unreachable domain surface`)
  assert.ok(item.commit?.trim(), `Done candidate ${candidateId} must preserve commit provenance`)
  assert.ok(Array.isArray(item.paths) && item.paths.length > 0, `Done candidate ${candidateId} must record affected paths`)
  assert.ok(item.note?.trim(), `Done candidate ${candidateId} must explain what became usable`)
  assert.ok(item.academicReview, `Done candidate ${candidateId} must record academic-review/source status, including not-applicable where no medical claim was added`)
}

console.log(`✓ Feature Factory surfaces: ${domainsDoc.domains.length}/20 domains routed; ${doneItems.length} done candidates carry a reachable product entry surface and provenance metadata`)
