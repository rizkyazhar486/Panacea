import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { selectCapability } from '../lib/capability-os.mjs'

const manifest = JSON.parse(await readFile(new URL('../../config/capability-os.json', import.meta.url), 'utf8'))
const scenarios = JSON.parse(await readFile(new URL('../../config/capability-os.scenarios.json', import.meta.url), 'utf8'))

for (const scenario of scenarios) {
  test(scenario.name, () => {
    if (scenario.expectedError) {
      assert.throws(
        () => selectCapability(manifest, scenario.request),
        new RegExp(scenario.expectedError, 'i'),
      )
      return
    }

    const result = selectCapability(manifest, scenario.request)
    assert.equal(result.capabilityId, scenario.request.capabilityId)
    assert.equal(result.executor, scenario.request.executor)
    assert.equal(result.provider, scenario.expected.provider)
    assert.equal(result.fallbackUsed, scenario.expected.fallbackUsed)
    if (Object.prototype.hasOwnProperty.call(scenario.expected, 'duplicateProviderAllowed')) {
      assert.equal(result.duplicateProviderAllowed, scenario.expected.duplicateProviderAllowed)
    }
  })
}

test('ordinary routing does not authorize duplicate providers implicitly', () => {
  const result = selectCapability(manifest, {
    capabilityId: 'research.web.firecrawl',
    executor: 'chatgpt',
    availableProviders: ['firecrawl', 'tavily-ai'],
    policyAllowed: true,
    authorizationAvailable: true,
  })
  assert.equal(result.provider, 'firecrawl')
  assert.equal(result.duplicateProviderAllowed, false)
})

test('unknown capability fails closed', () => {
  assert.throws(
    () => selectCapability(manifest, {
      capabilityId: 'does.not.exist',
      executor: 'chatgpt',
      availableProviders: ['anything'],
      policyAllowed: true,
      authorizationAvailable: true,
    }),
    /unknown capability/i,
  )
})
