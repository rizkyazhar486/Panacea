import assert from 'node:assert/strict'
import { SENSORY_DOMAINS, canPublishSensoryClaim, sensoryClaimBoundary } from '../../src/lib/sensoryEvidenceContract.ts'

assert.deepEqual(SENSORY_DOMAINS, ['vision','hearing','vestibular','olfaction','gustation','somatosensation'])
assert.equal(canPublishSensoryClaim({ evidenceStatus:'unverified', humanReview:null }), false)
assert.equal(canPublishSensoryClaim({ evidenceStatus:'verified-source', humanReview:null }), false)
assert.equal(canPublishSensoryClaim({ evidenceStatus:'verified-source', humanReview:{ reviewer:'Qualified reviewer', reviewedAt:'2026-09-18', scope:'hearing physiology' } }), true)
assert.match(sensoryClaimBoundary, /educational/i)
assert.match(sensoryClaimBoundary, /patient-specific/i)
assert.match(sensoryClaimBoundary, /human review/i)
console.log('sensory evidence contract: fail-closed publication boundary locked')
