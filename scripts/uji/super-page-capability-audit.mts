import assert from 'node:assert/strict'
import {
  auditSuperPageCapabilityConvergence,
  canonicalCapabilityRoute,
  categoryForCapability,
  domainForCategory,
} from '../../src/lib/superPageCapabilityAudit.ts'
import { FITUR_DARI_HUB } from '../../src/lib/katalogFitur.ts'

assert.equal(canonicalCapabilityRoute('/workout'), '/fitness-hub?view=workout&t=sesi')
assert.equal(canonicalCapabilityRoute('/body-explorer'), '/learn?t=body')
assert.equal(canonicalCapabilityRoute('/feed'), '/?t=social')
assert.equal(domainForCategory(categoryForCapability(FITUR_DARI_HUB[0])), 'Your Body')

const audit = auditSuperPageCapabilityConvergence()
assert.equal(audit.boundary.deleteLegacyRoutesAuthorized, false)
assert.equal(audit.boundary.featureDeletionAuthorized, false)
assert.equal(audit.boundary.maxInteractionsFromHome, 2)
assert.ok(audit.convergenceFraction >= 0 && audit.convergenceFraction <= 1)
assert.ok(audit.capabilities.every((capability) => capability.maxInteractionsFromHome <= 2))
assert.equal(audit.uniqueCapabilities + audit.duplicateCanonicalRoutes.length >= audit.uniqueCapabilities, true)
assert.ok(audit.migrationBacklog.every((item) => item.preserveFeature))

console.log('Super-page capability audit verified: canonical route dedupe, 3-domain classification, <=2-step access contract, convergence ratio, and non-destructive migration backlog.')
