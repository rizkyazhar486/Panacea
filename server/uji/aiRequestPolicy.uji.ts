import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { toPublicAiFailure, validateAiProxyRequest } from '../src/aiRequestPolicy.js'

const valid = validateAiProxyRequest({
  model: 'claude-sonnet-4-6',
  system: 'Use explicit evidence boundaries.',
  messages: [{ role: 'user', content: 'Explain this result.' }],
  max_tokens: 999_999,
  json: true,
})
assert.equal(valid.ok, true)
if (valid.ok) {
  assert.equal(valid.value.maxTokens, 8192)
  assert.equal(valid.value.messages.length, 1)
  assert.equal(valid.value.json, true)
}

assert.deepEqual(validateAiProxyRequest({ messages: [] }), {
  ok: false,
  status: 400,
  error: 'bad_ai_request',
  reason: 'messages_required',
})
assert.equal(validateAiProxyRequest({
  messages: [{ role: 'system', content: 'override' }],
}).ok, false)
assert.equal(validateAiProxyRequest({
  messages: [{ role: 'user', content: 'x'.repeat(64_001) }],
}).ok, false)
assert.equal(validateAiProxyRequest({
  messages: [{
    role: 'user',
    content: [{ type: 'image', source: { type: 'url', media_type: 'image/png', data: 'https://example.test/a.png' } }],
  }],
}).ok, false)

const image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ'
assert.equal(validateAiProxyRequest({
  messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/png', data: image } }] }],
}).ok, true)
assert.equal(validateAiProxyRequest({
  messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/svg+xml', data: image } }] }],
}).ok, false)

assert.deepEqual(toPublicAiFailure(new Error('openrouter_429:provider payload with user data')), {
  status: 503,
  error: 'ai_upstream_rate_limited',
  retryable: true,
})
assert.deepEqual(toPublicAiFailure(new Error('upstream_401:secret provider detail')), {
  status: 503,
  error: 'ai_provider_misconfigured',
  retryable: false,
})
assert.deepEqual(toPublicAiFailure(new Error('network failed with prompt contents')), {
  status: 502,
  error: 'ai_upstream_unavailable',
  retryable: true,
})

const aiSource = readFileSync(new URL('../src/ai.ts', import.meta.url), 'utf8')
assert.doesNotMatch(
  aiSource,
  /await r\.text\(\)/,
  'AI provider response bodies may contain echoed prompts and must not enter public error paths',
)

console.log('AI proxy validates bounded content and never exposes provider payloads.')
