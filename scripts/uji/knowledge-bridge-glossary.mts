import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../../src/lib/knowledgeBridgeMap.ts', import.meta.url), 'utf8')

assert.match(source, /export const BRIDGE_STAGE_GLOSSARY/)
for (const [key, definition] of [
  ['anatomy', 'body structures'],
  ['physiology', 'normal function'],
  ['pathology', 'disease mechanism'],
  ['signals', 'observable clues'],
  ['diagnostics', 'tests & interpretation'],
  ['management', 'care options'],
  ['evidence', 'source verification'],
]) {
  assert.match(source, new RegExp(`${key}: '${definition.replace('&', '\\&')}'`))
}
assert.match(source, /label: `\$\{label\} · \$\{BRIDGE_STAGE_GLOSSARY\[key\]\}`/)
assert.doesNotMatch(source, /fetch\(|axios|setInterval|setTimeout/)

console.log('Knowledge Bridge adds a bounded, static point-of-use glossary for all seven causal stages without network or polling work.')
