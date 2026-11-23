import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
const router = source('src/main.tsx')
const careEpisode = source('src/pages/clinical/CareEpisode.tsx')
const visitEntry = source('src/pages/VisitOS.tsx')

function hasCanonicalReturnRoute(routes) {
  return /<Route\s+path="\/visit"\s+element=\{<Navigate\s+to="\/visit-os"\s+replace\s*\/>\}\s*\/>/.test(routes)
    && /<Route\s+path="\/visit-os"\s+element=\{<VisitOS\s*\/>\}\s*\/>/.test(routes)
}

test('Care Episode return links resolve to the canonical VisitOS, not a missing route', () => {
  assert.ok((careEpisode.match(/\bto="\/visit"/g) ?? []).length >= 2,
    'Both missing-record and active-journey return links still target the legacy /visit route')
  assert.ok(hasCanonicalReturnRoute(router), 'legacy /visit must redirect to mounted /visit-os')
  assert.match(router, /<Route\s+path="\/poli"\s+element=\{<VisitOS\s*\/>\}\s*\/>/,
    'existing clinic alias must be preserved')
})

test('the redirect shares the canonical patient store and does not duplicate VisitOS', () => {
  assert.match(router, /<StoreProvider\b/, 'shared patient store must remain above routes')
  assert.match(visitEntry, /from ['"]\.\/clinical\/VisitOS['"]/, 'canonical VisitOS re-export must remain')
  assert.equal((router.match(/<Route\s+path="\/visit"/g) ?? []).length, 1,
    'only one /visit compatibility alias is allowed')
})

test('negative control: removed or misdirected alias is detected', () => {
  assert.equal(hasCanonicalReturnRoute(router.replace('to="/visit-os" replace', 'to="/emr" replace')), false)
  assert.equal(hasCanonicalReturnRoute(router.replace('<Route path="/visit" element={<Navigate to="/visit-os" replace />} />', '')), false)
})
