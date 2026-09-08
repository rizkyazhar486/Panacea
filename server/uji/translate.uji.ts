import assert from 'node:assert/strict'
import { bukaPerisai, pasangPerisai, terjemahkan } from '../src/translate'

const sumber = [
  'BP 150/95 mmHg, HbA1c 8.2%, metformin 500 mg 2x/hari selama 7 hari.',
  'ICD E11.9, ATC A10BA02, LOINC 4548-4, HP:0001945, RXCUI:6809.',
  'See https://example.test/plan and preserve arteria coronaria.',
].join(' ')

const shield = pasangPerisai(sumber, ['metformin', 'arteria coronaria'])
assert.ok(shield.peta.size >= 10, 'Safety shield must extract clinically meaningful immutable tokens.')
for (const protectedValue of ['150/95 mmHg', '8.2%', '500 mg', '7 hari', 'E11.9', 'A10BA02', '4548-4', 'HP:0001945', 'RXCUI:6809', 'https://example.test/plan', 'metformin', 'arteria coronaria']) {
  assert.ok([...shield.peta.values()].includes(protectedValue), `Missing protected value: ${protectedValue}`)
  assert.ok(!shield.teks.includes(protectedValue), `Protected value leaked into model prompt: ${protectedValue}`)
}

const restored = bukaPerisai(shield.teks, shield.peta)
assert.deepEqual(restored.hilang, [])
assert.equal(restored.hasil, sumber, 'Shield round-trip must restore the source byte-for-byte.')

const repeated = pasangPerisai('metformin then metformin', ['metformin'])
assert.equal(repeated.peta.size, 1, 'Repeated identical immutable terms should reuse one placeholder.')
assert.equal((repeated.teks.match(/⟦0⟧/g) ?? []).length, 2)

let calls = 0
const translated = await terjemahkan(
  async (system, prompt, maxTokens) => {
    calls += 1
    assert.match(system, /professional medical translator/i)
    assert.ok(prompt.includes('⟦0⟧'), 'Model prompt should contain shield placeholders.')
    assert.ok(!prompt.includes('500 mg'), 'Raw dose must not be exposed to the model.')
    assert.ok(maxTokens >= 512 && maxTokens <= 8000)
    return JSON.stringify({ translation: `Terjemahan: ${prompt}`, notes: ['deterministic-test'] })
  },
  sumber,
  'en',
  'id',
  'klinis',
  ['metformin', 'arteria coronaria'],
)
assert.equal(calls, 1)
assert.ok(translated.teks.includes('500 mg'))
assert.ok(translated.teks.includes('E11.9'))
assert.ok(translated.teks.includes('arteria coronaria'))
assert.deepEqual(translated.catatan, ['deterministic-test'])
assert.ok(translated.dilindungi.includes('500 mg'))

await assert.rejects(
  () => terjemahkan(
    async () => JSON.stringify({ translation: 'Model dropped every protected placeholder.' }),
    'Give metformin 500 mg for 7 days.',
    'en',
    'id',
    'klinis',
    ['metformin'],
  ),
  /perisai_hilang:/,
  'Missing protected placeholders must fail closed.',
)

const rawFallback = await terjemahkan(
  async (_system, prompt) => `Terjemahan mentah: ${prompt}`,
  'Dose 5 mg and code E11.9.',
  'en',
  'id',
)
assert.match(rawFallback.teks, /5 mg/)
assert.match(rawFallback.teks, /E11\.9/)

let sameLanguageCalled = false
const sameLanguage = await terjemahkan(
  async () => {
    sameLanguageCalled = true
    return 'should-not-run'
  },
  'Keep 10 mg unchanged.',
  'en',
  'en',
)
assert.equal(sameLanguageCalled, false, 'Same-language path must not call the model.')
assert.equal(sameLanguage.teks, 'Keep 10 mg unchanged.')

await assert.rejects(
  () => terjemahkan(async () => '{}', '   ', 'en', 'id'),
  /teks_kosong/,
)

console.log('Medical translation shield invariants verified.')
