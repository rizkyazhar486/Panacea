import assert from 'node:assert/strict'
import { bukaPerisai, pasangPerisai, terjemahkan } from '../src/translate'

const sumber = [
  'BP 150/95 mmHg, HbA1c 8.2%, metformin 500 mg 2x/hari selama 7 hari.',
  'ICD E11.9, ATC A10BA02, LOINC 4548-4, HP:0001945, RXCUI:6809.',
  'See https://example.test/plan and preserve arteria coronaria.',
  'Email patient@example.invalid, phone +1 555 010 0000, NIK TEST-0000-0000, MRN: TEST-778899.',
].join(' ')

const shield = pasangPerisai(sumber, ['metformin', 'arteria coronaria'])
assert.ok(shield.peta.size >= 14, 'Safety shield must extract clinical tokens and deterministic patient identifiers.')
for (const protectedValue of [
  '150/95 mmHg', '8.2%', '500 mg', '7 hari', 'E11.9', 'A10BA02', '4548-4',
  'HP:0001945', 'RXCUI:6809', 'https://example.test/plan', 'metformin', 'arteria coronaria',
  'patient@example.invalid', '+1 555 010 0000', 'NIK TEST-0000-0000', 'MRN: TEST-778899',
]) {
  assert.ok([...shield.peta.values()].includes(protectedValue), `Missing protected value: ${protectedValue}`)
  assert.ok(!shield.teks.includes(protectedValue), `Protected value leaked into model prompt: ${protectedValue}`)
}

const restored = bukaPerisai(shield.teks, shield.peta)
assert.deepEqual(restored.hilang, [])
assert.equal(restored.hasil, sumber, 'Shield round-trip must restore the source byte-for-byte.')

const labeledPhone = pasangPerisai('Phone: 555 010 1234; call after review.')
assert.ok([...labeledPhone.peta.values()].includes('Phone: 555 010 1234'))
assert.ok(!labeledPhone.teks.includes('555 010 1234'), 'Labeled local phone number must not reach the model.')

const patientId = pasangPerisai('Patient ID: TEST-12345 is scheduled tomorrow.')
assert.ok([...patientId.peta.values()].includes('Patient ID: TEST-12345'))
assert.ok(!patientId.teks.includes('TEST-12345'), 'Labeled patient identifier must not reach the model.')

const ordinaryNumber = pasangPerisai('There were 123 participants in the cohort.')
assert.equal(ordinaryNumber.peta.size, 0, 'Unlabeled ordinary numbers must not be mistaken for patient identifiers.')

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
    assert.ok(!prompt.includes('patient@example.invalid'), 'Raw email must not be exposed to the model.')
    assert.ok(!prompt.includes('TEST-0000-0000'), 'Raw labeled identifier must not be exposed to the model.')
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
assert.ok(translated.teks.includes('patient@example.invalid'))
assert.ok(translated.teks.includes('NIK TEST-0000-0000'))
assert.deepEqual(translated.catatan, ['deterministic-test'])
assert.ok(translated.dilindungi.includes('500 mg'))
assert.ok(translated.dilindungi.includes('patient@example.invalid'))

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

await assert.rejects(
  () => terjemahkan(
    async () => JSON.stringify({ translation: 'Identifier placeholder was removed.' }),
    'Email patient@example.invalid about the result.',
    'en',
    'id',
  ),
  /perisai_hilang:/,
  'Dropping a protected patient identifier must fail closed.',
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
