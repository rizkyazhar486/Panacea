import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createPanaceaToolRegistry } from '../src/mcp/registry.js'

const interoperability = readFileSync(new URL('../src/mcp/interoperability.ts', import.meta.url), 'utf8')
const terminology = readFileSync(new URL('../src/mcp/terminology.ts', import.meta.url), 'utf8')
const tools = readFileSync(new URL('../src/mcp/tools.ts', import.meta.url), 'utf8')
const combined = [interoperability, terminology, tools].join('\n')

assert.doesNotMatch(combined, /\bsubmitEmr\s*\(/, 'Phase B must not call submitEmr')
assert.doesNotMatch(combined, /\bpostResource\s*\(/, 'Phase B must not call postResource')
assert.doesNotMatch(combined, /from\s+['"][^'"]*store(?:\.js)?['"]/, 'Phase B must not import the patient datastore')
assert.doesNotMatch(combined, /from\s+['"][^'"]*payments(?:\.js)?['"]/, 'Phase B must not import payment mutation paths')

const names = new Set([
  'panacea_fhir_capabilities',
  'panacea_fhir_build_observation_bundle_preview',
  'panacea_fhir_inspect_resource',
  'panacea_fhir_satusehat_preview',
  'panacea_hl7v2_parse_preview',
  'panacea_hl7v2_to_fhir_preview',
  'panacea_terminology_search',
  'panacea_terminology_resolve',
  'panacea_terminology_crosswalk_preview',
])
const phaseB = createPanaceaToolRegistry().filter((tool) => names.has(tool.name))
assert.equal(phaseB.length, names.size, 'Phase B registry surface is incomplete')
for (const tool of phaseB) {
  assert.equal(tool.sideEffect, 'none', `${tool.name} must remain side-effect free`)
  assert.ok(tool.transports.includes('http'), `${tool.name} must declare its remote preview/reference policy explicitly`)
}
assert.ok(terminology.includes('snomedCt') && terminology.includes('supported: false'), 'SNOMED unsupported boundary disappeared')
assert.ok(terminology.includes('No explicit verified relationship') || terminology.includes('No explicit verified relationship'.replace('No ', 'no ')), 'Crosswalk fail-closed boundary disappeared')

console.log('MCP Phase B safety boundary: ok')
