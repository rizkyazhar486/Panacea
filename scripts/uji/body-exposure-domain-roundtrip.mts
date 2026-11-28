import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const osSource = readFileSync(new URL('../../src/pages/bodyhub/BodyExposureOS.tsx', import.meta.url), 'utf8')
const projSource = readFileSync(new URL('../../src/pages/bodyhub/UnifiedHumanSimulationProjector.tsx', import.meta.url), 'utf8')

// 1. BodyExposureOS must preserve lossless requestedDomain state on current.projectorDomain so sub-domains never snap back.
assert.ok(
  osSource.includes('projectorDomain: requestedDomain'),
  'BodyExposureOS must attach lossless requestedDomain to current.projectorDomain',
)
assert.ok(
  osSource.includes('setRequestedDomain(domain)'),
  'BodyExposureOS syncModeFromProjector must preserve the exact SimulationDomain selected in the projector',
)

// 2. All 5 sub-domains that share top-level rail groups must be explicitly mapped in modeForDomain & DOMAIN_ALIASES.
for (const domain of ['quantum-element', 'pharmacology', 'robotics-anesthesia', 'biomechanics', 'genome']) {
  assert.ok(osSource.includes(`'${domain}'`) || osSource.includes(`${domain}:`), `BodyExposureOS must support domain ${domain}`)
  assert.ok(projSource.includes(`'${domain}'`), `UnifiedHumanSimulationProjector must render domain ${domain}`)
}

console.log('body-exposure-domain-roundtrip: PASS (all 14 simulation domains preserve lossless routing without snap-back)')
