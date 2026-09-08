import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const runner = await readFile(new URL('./jalankan.mjs', import.meta.url), 'utf8')
const resolver = await readFile(new URL('./typescript-resolver.mjs', import.meta.url), 'utf8')
const pkg = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'))

assert.match(runner, /spawnSync\(process\.execPath/)
assert.match(runner, /--experimental-transform-types/)
assert.match(runner, /typescript-resolver\.mjs/)
assert.doesNotMatch(runner, /spawnSync\(['"]npx['"]/)
assert.doesNotMatch(runner, /--import=tsx/)
assert.doesNotMatch(runner, /npm\s+(?:install|exec)|npx\s+/)
assert.equal(pkg.devDependencies?.tsx, undefined)

assert.match(resolver, /registerHooks/)
assert.match(resolver, /ERR_MODULE_NOT_FOUND/)
assert.match(resolver, /specifier\.startsWith\('\.\/'\)/)
assert.match(resolver, /specifier\.startsWith\('\.\.\/'\)/)
assert.match(resolver, /MAX_FALLBACKS = 12/)
assert.match(resolver, /isInsideRepo/)
assert.doesNotMatch(resolver, /https?:\/\//)

console.log('Deterministic test runner uses Node 24 plus a bounded repo-local resolver, with no runtime package download.')
