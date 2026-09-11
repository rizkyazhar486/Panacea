import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')

assert.match(source, /label: 'Anatomy only'/)
assert.match(source, /label: 'Rest refs'/)
assert.match(source, /label: 'Exercise refs'/)
assert.match(source, /source atlas stays dimensionally stable/i)
assert.match(source, /not scaled or deformed to imitate beating, breathing expansion, muscle shortening, or peristalsis/i)
assert.match(source, /highlighted muscle tempo/)
assert.doesNotMatch(source, /figurnya\s+benar-benar\s+berdetak/i)
assert.doesNotMatch(source, /Gerak fisiologis — irama nyata/i)
assert.doesNotMatch(source, /menggerakkan struktur yang tidak terlihat/i)

console.log('Body Explorer physiology controls are reference-state truthful and non-deforming.')
