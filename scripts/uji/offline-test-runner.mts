import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const runner = await readFile(new URL('./jalankan.mjs', import.meta.url), 'utf8')
const pkg = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'))

assert.match(runner, /spawnSync\(process\.execPath/)
assert.match(runner, /--import=tsx/)
assert.doesNotMatch(runner, /--experimental-transform-types/)
assert.doesNotMatch(runner, /spawnSync\(['"]npx['"]/)
assert.doesNotMatch(runner, /npm\s+(?:install|exec)|npx\s+/)
assert.equal(pkg.devDependencies?.tsx, '4.23.13')

console.log('Deterministic test runner uses the pinned local tsx resolver installed by npm ci, with no runtime package download.')
