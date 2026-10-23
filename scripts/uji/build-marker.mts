// E7: hasil build menyebut commit sumbernya (atau null), tidak pernah karangan.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const { commitDariEnv, buildMarker } = await import('../../scripts/vite/buildMarker.mjs')
const sha = 'a'.repeat(39) + 'B'
assert.equal(commitDariEnv({ VERCEL_GIT_COMMIT_SHA: sha }), 'a'.repeat(39) + 'b')
assert.equal(commitDariEnv({ GITHUB_SHA: ` ${'1'.repeat(40)} ` }), '1'.repeat(40))
assert.equal(commitDariEnv({ VERCEL_GIT_COMMIT_SHA: 'abc', GITHUB_SHA: '2'.repeat(40) }), '2'.repeat(40), 'nilai tidak valid dilewati')
for (const bad of [{}, { GITHUB_SHA: 'main' }, { GITHUB_SHA: '' }, { GITHUB_SHA: 'g'.repeat(40) }, { GITHUB_SHA: '1'.repeat(41) }, { GITHUB_SHA: 123 }])
  assert.equal(commitDariEnv(bad as any), null, `tidak valid: ${JSON.stringify(bad)}`)
const out: any[] = []
buildMarker({ GITHUB_SHA: '3'.repeat(40) }).generateBundle.call({ emitFile: (f: any) => out.push(f) })
assert.equal(out.length, 1); assert.equal(out[0].fileName, 'build.json'); assert.deepEqual(JSON.parse(out[0].source), { commit: '3'.repeat(40) })
const cfg = readFileSync('vite.config.ts', 'utf8')
assert.match(cfg, /plugins: \[react\(\), tailwindcss\(\), buildMarker\(\)\]/, 'plugin terpasang di vite.config')
console.log('build-marker: ok')
