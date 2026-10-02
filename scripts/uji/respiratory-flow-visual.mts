import assert from 'node:assert/strict'
import { respiratoryFlowVisualState } from '../../src/lib/respiratoryFlowVisual.ts'

const inspire = respiratoryFlowVisualState(1.25, 'inspiration', 0.2)
assert.equal(inspire.direction, 1)
assert.ok(inspire.progress >= 0 && inspire.progress < 1)
assert.ok(inspire.particleOpacity > 0.5)

const expire = respiratoryFlowVisualState(1.25, 'expiration', 0.2)
assert.equal(expire.direction, -1)
assert.ok(expire.progress >= 0 && expire.progress <= 1)
assert.ok(Math.abs((inspire.progress + expire.progress) - 1) < 1e-9)

const exchange = respiratoryFlowVisualState(1.25, 'exchange', 0.2)
assert.equal(exchange.direction, 0)
assert.ok(exchange.particleOpacity < 0.2)
assert.ok(exchange.lungEmphasis >= 0.18 && exchange.lungEmphasis <= 0.5)

const wrapped = respiratoryFlowVisualState(1001.25, 'inspiration', 0.2)
assert.ok(wrapped.progress >= 0 && wrapped.progress < 1)

const fallback = respiratoryFlowVisualState(Number.NaN, 'inspiration', Number.NaN)
assert.equal(fallback.progress, 0)
assert.equal(fallback.direction, 1)

console.log('✓ respiratory flow visual state stays bounded and phase-directional')
