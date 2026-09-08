import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('./jalankan.mjs', import.meta.url), 'utf8')

assert.match(source, /spawnSync\(process\.execPath/)
assert.match(source, /--experimental-transform-types/)
assert.doesNotMatch(source, /spawnSync\(['"]npx['"]/)
assert.doesNotMatch(source, /\[['"]tsx['"]/)
assert.doesNotMatch(source, /npm\s+(?:install|exec)|npx\s+/)

console.log('Deterministic test runner executes repository tests with the pinned Node runtime and no runtime package download.')
