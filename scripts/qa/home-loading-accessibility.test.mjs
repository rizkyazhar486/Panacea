import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const home = readFileSync('src/pages/Beranda.tsx', 'utf8')
const match = home.match(/function HomeLoadingCard[\s\S]*?\n}\n\nfunction DeferredHomeBlock/)
assert.ok(match, 'HomeLoadingCard source block must exist')
const loadingCard = match[0]

assert.match(loadingCard, /role="status"/, 'Home loading card must expose status semantics')
assert.match(loadingCard, /aria-live="polite"/, 'Home loading card must announce deferred loading politely')
assert.match(loadingCard, /aria-busy="true"/, 'Home loading card must expose a busy state')
assert.match(loadingCard, /<span className="sr-only">Loading \{label\}<\/span>/, 'Home loading card must include readable assistive text')
assert.match(loadingCard, /<div aria-hidden="true">/, 'Decorative skeleton bars must stay out of the accessibility tree')
assert.doesNotMatch(loadingCard, /aria-label=\{`\$\{label\} loading`\}/, 'Legacy aria-label-only loading state must not return')

console.log('Home loading accessibility: deferred skeletons expose polite status text and hide decorative bars.')
