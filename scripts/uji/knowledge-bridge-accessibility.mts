import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../../src/components/KnowledgeBridgeWorkbench.tsx', import.meta.url), 'utf8')

assert.match(source, /<section aria-labelledby="knowledge-bridge-title"/)
assert.match(source, /<h2 id="knowledge-bridge-title"/)
assert.match(source, /<label htmlFor="knowledge-bridge-search" className="sr-only">/)
assert.match(source, /<input id="knowledge-bridge-search"/)
assert.match(source, /role="radiogroup" aria-label="Explanation depth"/)
assert.match(source, /role="radio" aria-checked=\{depth === item\}/)
assert.match(source, /<nav aria-label="Curated medical topics"/)
assert.match(source, /aria-pressed=\{topic\.id === item\.id\}/)
assert.match(source, /role="status" aria-live="polite"/)
assert.match(source, /role="list" aria-label=\{`\$\{topic\.title\} causal stages`\}/)
assert.match(source, /<article role="listitem"/)
assert.match(source, /focus-visible:ring-2 focus-visible:ring-cyan-500/)

console.log('Knowledge Bridge exposes stable labels, selection state, live status, stage semantics, and keyboard focus visibility.')
