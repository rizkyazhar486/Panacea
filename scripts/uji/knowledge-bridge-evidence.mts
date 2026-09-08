import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const memory = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem(key: string) { return memory.get(key) ?? null },
    setItem(key: string, value: string) { memory.set(key, String(value)) },
    removeItem(key: string) { memory.delete(key) },
    clear() { memory.clear() },
  },
})

const {
  addBridgeEvidence,
  clearBridgeEvidence,
  loadBridgeEvidence,
  removeBridgeEvidence,
} = await import('../../src/lib/knowledgeBridgeHandoff.ts')

type Evidence = Parameters<typeof addBridgeEvidence>[0]
const makeEvidence = (index: number, overrides: Partial<Evidence> = {}): Evidence => ({
  key: `paper-${index}`,
  kind: 'literature',
  id: `PMID:${1000 + index}`,
  title: `Evidence paper ${index}`,
  source: index % 2 === 0 ? 'PubMed' : 'Europe PMC',
  url: `https://example.test/paper/${index}`,
  year: String(2020 + (index % 6)),
  query: 'hypertension',
  ...overrides,
})

memory.clear()
for (let index = 1; index <= 10; index += 1) addBridgeEvidence(makeEvidence(index))
const bounded = loadBridgeEvidence()
assert.equal(bounded.length, 8, 'evidence handoff must remain bounded to eight source pointers')
assert.equal(bounded[0].key, 'paper-10', 'most recently selected source should be first')
assert.equal(bounded[bounded.length - 1]?.key, 'paper-3', 'oldest entries beyond the bounded shelf must be discarded')

const replaced = addBridgeEvidence(makeEvidence(6, { title: 'Updated paper 6', source: 'PubMed revised' }))
assert.equal(replaced.length, 8, 'replacing an existing key must not grow the shelf')
assert.equal(replaced.filter((item) => item.key === 'paper-6').length, 1, 'source keys must remain unique')
assert.equal(replaced[0].title, 'Updated paper 6', 'a re-selected source should replace the stale pointer')

memory.set('pmd_knowledge_bridge_evidence_v1', JSON.stringify([
  makeEvidence(20),
  { ...makeEvidence(21), url: 'javascript:alert(1)' },
  { ...makeEvidence(22), kind: 'diagnosis' },
  { ...makeEvidence(23), title: '' },
  { ...makeEvidence(24), query: '   ' },
]))
const sanitized = loadBridgeEvidence()
assert.deepEqual(sanitized.map((item) => item.key), ['paper-20'], 'invalid persisted pointers must fail closed instead of reaching the UI')

memory.clear()
addBridgeEvidence(makeEvidence(30))
addBridgeEvidence(makeEvidence(31))
assert.equal(removeBridgeEvidence('paper-30').some((item) => item.key === 'paper-30'), false)
assert.deepEqual(clearBridgeEvidence(), [])
assert.deepEqual(loadBridgeEvidence(), [])

const workbench = await readFile(new URL('../../src/components/KnowledgeBridgeWorkbench.tsx', import.meta.url), 'utf8')
assert.match(workbench, /Open the original source before treating a claim as verified\./)
assert.match(workbench, /item\.source/)
assert.match(workbench, /item\.year/)
assert.match(workbench, /item\.id/)
assert.match(workbench, /item\.query/)
assert.match(workbench, /href=\{item\.url\}/)
assert.match(workbench, /target="_blank"/)
assert.match(workbench, /rel="noreferrer"/)

console.log('Knowledge Bridge evidence shelf keeps source pointers bounded, sanitized, deduplicated, provenance-visible, and explicitly distinct from verification.')