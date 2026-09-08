import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../../src/lib/anatomyContextHandoff.ts', import.meta.url), 'utf8')

assert.match(source, /CURATED_HANDOFF_BY_STRUCTURE/)
assert.doesNotMatch(source, /REVIEWED_HANDOFF_BY_STRUCTURE/)
assert.match(source, /does NOT\s+mean qualified human academic review/i)
assert.match(source, /human-reviewed elsewhere when reviewer/i)
assert.match(source, /identity, credentials, date and scope/i)
assert.doesNotMatch(source, /Explicit reviewed cross-module mappings/i)

console.log('Anatomy context handoff review boundary verified: deterministic curated routing does not masquerade as qualified human review.')
