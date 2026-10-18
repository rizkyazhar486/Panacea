import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { evaluate, scanRepo, BASELINE_PATH } from '../arch/ratchet.mjs'

const read = (p) => readFileSync(new URL('../../' + p, import.meta.url), 'utf8')

test('P0 regression: persistence snapshot belongs to nested pure state domain, not flat lib', () => {
  assert.equal(existsSync(new URL('../../src/lib/storePersistScope.ts', import.meta.url)), false)
  assert.equal(existsSync(new URL('../../src/lib/state/storePersistScope.ts', import.meta.url)), true)
  assert.match(read('src/lib/store.tsx'), /from '\.\/state\/storePersistScope'/)
  assert.match(read('scripts/uji/store-persist-scope.mts'), /src\/lib\/state\/storePersistScope\.ts/)
})

test('P0 regression: entrypoint injects document visibility, store never accesses DOM global', () => {
  const source = read('src/lib/store.tsx')
  assert.doesNotMatch(source, /\bdocument\.(?:visibilityState|addEventListener|removeEventListener)\b/)
  assert.match(source, /visibilityDocument\?\./)
  assert.match(read('src/main.tsx'), /<StoreProvider visibilityDocument=\{document\}>/)
})

test('P0 regression: no new architecture violations relative to immutable baseline', () => {
  const actual = evaluate(scanRepo(), JSON.parse(readFileSync(BASELINE_PATH, 'utf8')))
  assert.deepEqual(actual.baru, [], 'fix source and dependencies; never expand ratchet baseline')
})
