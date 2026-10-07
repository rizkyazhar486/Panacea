import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const systemPrompt = await readFile(new URL('../../src/lib/systemPrompt.ts', import.meta.url), 'utf8')
const ai = await readFile(new URL('../../src/lib/ai.ts', import.meta.url), 'utf8')
const chatbot = await readFile(new URL('../../src/pages/clinical/Chatbot.tsx', import.meta.url), 'utf8')
const emr = await readFile(new URL('../../src/pages/clinical/EMR.tsx', import.meta.url), 'utf8')
const serverAi = await readFile(new URL('../../server/src/ai.ts', import.meta.url), 'utf8')

test('clinical response contract forbids fabricated real-patient findings', () => {
  assert.match(systemPrompt, /CLINICAL \/ REAL PATIENT: NEVER fabricate/i)
  assert.match(systemPrompt, /not provided \/ not yet examined \/ requires confirmation/i)
  assert.match(systemPrompt, /AI SUGGESTION — NOT EXAMINED/i)
  assert.match(systemPrompt, /No laboratory\/ECG data provided — interpretation cannot be fabricated/i)
})

test('complete anamnesis and assessment contract reaches AI-EMR', () => {
  for (const field of [
    'riwayatKehamilan',
    'riwayatTumbuhKembang',
    'riwayatImunisasi',
    'riwayatNutrisi',
    'riwayatSosialEkonomi',
    'anthropometry',
    'labEkgInterpretation',
  ]) {
    assert.match(systemPrompt, new RegExp(`"${field}"`))
    assert.match(ai, new RegExp(`\\b${field}\\b`))
    assert.match(chatbot, new RegExp(`\\b${field}\\b`))
  }
  assert.match(systemPrompt, /Dipikirkan \.\.\./)
  assert.match(chatbot, /source: 'AI' as const/)
})

test('anthropometry is formula-bound and does not invent pediatric z-scores', () => {
  assert.match(systemPrompt, /BMI = weight\(kg\) \/ height\(m\)\^2/)
  assert.match(systemPrompt, /z = \(\(\(X\/M\)\^L\) - 1\) \/ \(L\*S\)/)
  assert.match(systemPrompt, /Do not guess percentile or z-score/i)
  assert.match(emr, /Anthropometry — Formula, Standard & Interpretation/)
})

test('clinical-photo vision separates visible facts from unseen examination', () => {
  assert.match(serverAi, /foto kulit\/luka\/mata/i)
  assert.match(serverAi, /Temuan Objektif yang Benar-Benar Terlihat/i)
  assert.match(serverAi, /Jangan mengarang palpasi/i)
  assert.match(chatbot, /Do not invent palpation findings/i)
})

test('detailed clinical output has adequate generation headroom', () => {
  assert.match(ai, /callClaude\(\s*settings,\s*msgs,\s*sysExtra,\s*'',\s*3600,/)
  assert.match(ai, /purpose: 'chatbot'/)
  assert.match(ai, /callClaude\(\s*settings,\s*msgs,\s*EMR_FRAMEWORK,\s*'',\s*4096,/)
  assert.match(ai, /purpose: 'ai-emr'/)
  assert.match(serverAi, /max_tokens: 2600/)
})


test('assistant chatbot output exposes fail-closed clinical maturity', () => {
  assert.match(chatbot, /clinicalClaimMaturity\(\)/)
  assert.match(chatbot, /data-clinical-claim-maturity=\{maturity\}/)
  assert.match(chatbot, /clinicalClaimLabel\(maturity\)/)
  assert.match(chatbot, /clinicalClaimDisclosure\(maturity\)/)
})
