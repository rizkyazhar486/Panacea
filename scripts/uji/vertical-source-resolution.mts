import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { CARDIOVASCULAR_VERTICAL_GRAPH } from '../../src/lib/biology/cardiovascularVerticalLineage.ts'
import { ORGAN_SYSTEMS } from '../../src/lib/anatomyHierarchy.ts'
import type { VerticalBiologicalGraph } from '../../src/lib/biology/verticalBiologyGraph.ts'

// Setiap sourceId pada graf vertikal harus RESOLVE: sitasi PMID hanya boleh yang sudah tercatat
// terverifikasi, ID gen harus tercatat (status "pending" diakui apa adanya), dan rujukan `repo:`
// harus menunjuk entri nyata. Tanpa ini sebuah rujukan karangan terlihat sama seperti yang asli.

const table = JSON.parse(readFileSync('data/verified-citations/vertical-graphs.json', 'utf8')) as {
  pmid: Record<string, { doi: string; title: string; verification: string; verifiedVia: string; verifiedOn: string }>
  ncbiGene: Record<string, { symbol: string; verification: string; note: string }>
}

function registryIds(dir = 'data/source-registry'): Set<string> {
  const ids = new Set<string>()
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name.endsWith('.json')) {
        try { const id = JSON.parse(readFileSync(p, 'utf8'))?.id; if (typeof id === 'string') ids.add(id) } catch { /* bukan entri registri */ }
      }
    }
  }
  if (existsSync(dir)) walk(dir)
  return ids
}

const hierarchyKeys = new Set(ORGAN_SYSTEMS.map((e) => e.key))
const registry = registryIds()

export interface Resolution { ok: boolean; reason?: string; pending?: boolean }

export function resolveSourceId(sourceId: string): Resolution {
  let m = /^PMID:(\d+)$/.exec(sourceId)
  if (m) {
    const entry = table.pmid[m[1]]
    if (!entry) return { ok: false, reason: `PMID ${m[1]} is not in the verified citation table` }
    if (entry.verification !== 'verified') return { ok: false, reason: `PMID ${m[1]} is listed but not verified` }
    if (!entry.verifiedVia.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(entry.verifiedOn) || !entry.doi.trim() || !entry.title.trim()) return { ok: false, reason: `PMID ${m[1]} lacks verification details` }
    return { ok: true }
  }
  m = /^NCBI-GENE:(\d+)$/.exec(sourceId)
  if (m) {
    const entry = table.ncbiGene[m[1]]
    if (!entry) return { ok: false, reason: `NCBI-GENE ${m[1]} is not in the citation table` }
    return { ok: true, pending: entry.verification !== 'verified' }
  }
  m = /^repo:anatomyHierarchy:(.+)$/.exec(sourceId)
  if (m) return hierarchyKeys.has(m[1]) ? { ok: true } : { ok: false, reason: `anatomyHierarchy has no key ${m[1]}` }
  m = /^repo:source-registry:(.+)$/.exec(sourceId)
  if (m) return registry.has(m[1]) ? { ok: true } : { ok: false, reason: `data/source-registry has no entry with id ${m[1]}` }
  return { ok: false, reason: `unrecognised sourceId scheme: ${sourceId}` }
}

export function sourceIdsOf(graph: VerticalBiologicalGraph): string[] {
  const ids = new Set<string>()
  for (const node of graph.nodes) {
    for (const e of node.evidence) ids.add(e.sourceId)
    if (node.representation) ids.add(node.representation.sourceId)
  }
  return [...ids].sort()
}

// ── Positif: semua sumber graf kardiovaskular resolve ────────────────
const ids = sourceIdsOf(CARDIOVASCULAR_VERTICAL_GRAPH)
assert.ok(ids.length >= 7, 'the cardiovascular graph must cite sources')
const failures = ids.map((id) => [id, resolveSourceId(id)] as const).filter(([, r]) => !r.ok)
assert.deepEqual(failures.map(([id, r]) => `${id}: ${r.reason}`), [], 'every cardiovascular sourceId must resolve')
const pending = ids.filter((id) => resolveSourceId(id).pending)
assert.deepEqual(pending, ['NCBI-GENE:6262', 'NCBI-GENE:7134'], 'unverified gene ids are acknowledged as pending, never silently trusted')

// ── Tabel sitasi: tidak ada entri terverifikasi tanpa jejak verifikasi ──────
for (const [pmid, e] of Object.entries(table.pmid)) {
  assert.match(pmid, /^\d+$/, `PMID key ${pmid} must be numeric`)
  assert.equal(e.verification, 'verified', `PMID ${pmid} in the table must be verified`)
  assert.ok(e.verifiedVia.length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(e.verifiedOn) && e.doi.length > 0 && e.title.length > 0, `PMID ${pmid} needs doi, title, verifiedVia and a verification date`)
}

for (const [gene, e] of Object.entries(table.ncbiGene)) {
  const trace = e as unknown as { verifiedVia?: string; verifiedOn?: string }
  if (e.verification === 'verified') {
    assert.ok(Boolean(trace.verifiedVia?.trim()) && /^\d{4}-\d{2}-\d{2}$/.test(trace.verifiedOn ?? ''), `NCBI-GENE ${gene} marked verified must carry verifiedVia and verifiedOn`)
  } else {
    assert.equal(e.verification, 'pending', `NCBI-GENE ${gene} must be verified or explicitly pending`)
    assert.ok(e.note.trim().length > 20, `NCBI-GENE ${gene} pending entries must explain why`)
  }
}

// ── Negatif berpasangan: hanya satu kondisi yang berbeda ─────────────────────
assert.equal(resolveSourceId('PMID:28956314').ok, true, 'a verified PMID resolves')
assert.equal(resolveSourceId('PMID:28956315').ok, false, 'a PMID off by one is not in the table (fabricated-looking id is rejected)')
assert.match(resolveSourceId('PMID:99999999').reason!, /not in the verified citation table/, 'an unknown PMID gives a named reason')
assert.equal(resolveSourceId('PMID:abc').ok, false, 'a malformed PMID is rejected')
assert.equal(resolveSourceId('NCBI-GENE:6262').ok, true, 'a tabled gene id resolves')
assert.equal(resolveSourceId('NCBI-GENE:1').ok, false, 'an untabled gene id is rejected')
assert.equal(resolveSourceId('repo:anatomyHierarchy:cardiovascular').ok, true, 'an existing hierarchy key resolves')
assert.equal(resolveSourceId('repo:anatomyHierarchy:no-such-system').ok, false, 'a missing hierarchy key is rejected')
assert.equal(resolveSourceId('repo:source-registry:z_anatomy').ok, true, 'an existing registry id resolves')
assert.equal(resolveSourceId('repo:anatomy-source-registry:heart').ok, false, 'the previous dangling reference form no longer resolves and is rejected')
assert.equal(resolveSourceId('').ok, false, 'an empty sourceId is rejected')
assert.equal(resolveSourceId('doi:10.1/x').ok, false, 'an unknown scheme is rejected rather than trusted')

console.log(`vertical sources resolve: ${ids.length} ids (${ids.length - pending.length} verified/resolved, ${pending.length} pending gene ids) and 12 rejection rules ok`)
