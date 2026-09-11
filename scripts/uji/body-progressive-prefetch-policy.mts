import assert from 'node:assert/strict';
import {
  planBodyProgressivePrefetch,
  type BodyAssetCandidate,
} from '../../src/lib/bodyProgressivePrefetchPolicy.ts';

const candidates: BodyAssetCandidate[] = [
  { assetId: 'visceral-selected', estimatedTransferMb: 3, intent: 'required-now', selected: true, adjacentToSelection: false, alreadyResident: false },
  { assetId: 'cardiovascular-adjacent', estimatedTransferMb: 2, intent: 'likely-next', selected: false, adjacentToSelection: true, alreadyResident: false },
  { assetId: 'skeletal-likely', estimatedTransferMb: 4, intent: 'likely-next', selected: false, adjacentToSelection: false, alreadyResident: false },
  { assetId: 'muscular-idle', estimatedTransferMb: 5, intent: 'idle-opportunistic', selected: false, adjacentToSelection: false, alreadyResident: false },
  { assetId: 'resident-surface', estimatedTransferMb: 6, intent: 'required-now', selected: false, adjacentToSelection: false, alreadyResident: true },
];

const mobile = planBodyProgressivePrefetch(candidates, { network: 'normal', memory: 'standard', viewportWidth: 390 });
assert.deepEqual(mobile.loadNow, ['visceral-selected']);
assert.deepEqual(mobile.prefetchNext, ['cardiovascular-adjacent']);
assert.ok(mobile.deferred.includes('skeletal-likely'));
assert.ok(!mobile.loadNow.includes('resident-surface'));
assert.equal(mobile.maxConcurrent, 2);
assert.equal(mobile.transferBudgetMb, 5);

const saveData = planBodyProgressivePrefetch(candidates, { network: 'save-data', memory: 'standard', viewportWidth: 390 });
assert.deepEqual(saveData.loadNow, ['visceral-selected']);
assert.deepEqual(saveData.prefetchNext, []);
assert.equal(saveData.maxConcurrent, 1);
assert.equal(saveData.transferBudgetMb, 0);
assert.equal(saveData.reason, 'save-data');

const offline = planBodyProgressivePrefetch(candidates, { network: 'offline', memory: 'low', viewportWidth: 390 });
assert.deepEqual(offline.loadNow, []);
assert.deepEqual(offline.prefetchNext, []);
assert.equal(offline.maxConcurrent, 0);
assert.equal(offline.reason, 'offline');

const lowMemory = planBodyProgressivePrefetch(candidates, { network: 'normal', memory: 'low', viewportWidth: 1024 });
assert.deepEqual(lowMemory.loadNow, ['visceral-selected']);
assert.deepEqual(lowMemory.prefetchNext, []);
assert.equal(lowMemory.maxConcurrent, 1);
assert.equal(lowMemory.reason, 'low-memory');

const constrained = planBodyProgressivePrefetch(candidates, { network: 'constrained', memory: 'high', viewportWidth: 1440 });
assert.deepEqual(constrained.loadNow, ['visceral-selected']);
assert.deepEqual(constrained.prefetchNext, []);
assert.equal(constrained.maxConcurrent, 1);
assert.equal(constrained.reason, 'constrained-network');

const deterministicA = planBodyProgressivePrefetch(candidates, { network: 'normal', memory: 'high', viewportWidth: 1440 });
const deterministicB = planBodyProgressivePrefetch([...candidates].reverse(), { network: 'normal', memory: 'high', viewportWidth: 1440 });
assert.deepEqual(deterministicA, deterministicB);
assert.ok(deterministicA.maxConcurrent <= 4);
assert.ok(deterministicA.transferBudgetMb <= 24);

const invalidTransfer = planBodyProgressivePrefetch([
  { assetId: 'required', estimatedTransferMb: 1, intent: 'required-now', selected: true, adjacentToSelection: false, alreadyResident: false },
  { assetId: 'unknown-size', estimatedTransferMb: Number.NaN, intent: 'likely-next', selected: false, adjacentToSelection: true, alreadyResident: false },
], { network: 'normal', memory: 'high', viewportWidth: 1440 });
assert.deepEqual(invalidTransfer.loadNow, ['required']);
assert.deepEqual(invalidTransfer.prefetchNext, []);
assert.ok(invalidTransfer.deferred.includes('unknown-size'));

const invalidRequiredTransfer = planBodyProgressivePrefetch([
  { assetId: 'unknown-required', estimatedTransferMb: Number.NaN, intent: 'required-now', selected: true, adjacentToSelection: false, alreadyResident: false },
  { assetId: 'known-next', estimatedTransferMb: 1, intent: 'likely-next', selected: false, adjacentToSelection: true, alreadyResident: false },
], { network: 'normal', memory: 'standard', viewportWidth: 390 });
assert.deepEqual(invalidRequiredTransfer.loadNow, []);
assert.deepEqual(invalidRequiredTransfer.prefetchNext, ['known-next']);
assert.ok(invalidRequiredTransfer.deferred.includes('unknown-required'));

for (const invalidOverride of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
  const invalidConcurrency = planBodyProgressivePrefetch(candidates, {
    network: 'normal',
    memory: 'high',
    viewportWidth: 1440,
    maxConcurrentOverride: invalidOverride,
  });
  assert.equal(invalidConcurrency.maxConcurrent, 0);
  assert.deepEqual(invalidConcurrency.loadNow, []);
  assert.deepEqual(invalidConcurrency.prefetchNext, []);
  assert.ok(invalidConcurrency.deferred.includes('visceral-selected'));
}

for (const safetyContext of [
  { network: 'offline' as const, memory: 'high' as const, viewportWidth: 1440, expectedMax: 0 },
  { network: 'save-data' as const, memory: 'high' as const, viewportWidth: 1440, expectedMax: 1 },
  { network: 'constrained' as const, memory: 'high' as const, viewportWidth: 1440, expectedMax: 1 },
  { network: 'normal' as const, memory: 'low' as const, viewportWidth: 1440, expectedMax: 1 },
  { network: 'normal' as const, memory: 'standard' as const, viewportWidth: 390, expectedMax: 2 },
]) {
  const raisedOverride = planBodyProgressivePrefetch(candidates, {
    network: safetyContext.network,
    memory: safetyContext.memory,
    viewportWidth: safetyContext.viewportWidth,
    maxConcurrentOverride: 6,
  });
  assert.equal(raisedOverride.maxConcurrent, safetyContext.expectedMax);
}

const offlineOverride = planBodyProgressivePrefetch(candidates, {
  network: 'offline',
  memory: 'high',
  viewportWidth: 1440,
  maxConcurrentOverride: 6,
});
assert.deepEqual(offlineOverride.loadNow, []);
assert.deepEqual(offlineOverride.prefetchNext, []);
assert.ok(offlineOverride.deferred.includes('visceral-selected'));

const reducedOverride = planBodyProgressivePrefetch(candidates, {
  network: 'normal',
  memory: 'high',
  viewportWidth: 1440,
  maxConcurrentOverride: 1,
});
assert.equal(reducedOverride.maxConcurrent, 1);
assert.deepEqual(reducedOverride.loadNow, ['visceral-selected']);
assert.deepEqual(reducedOverride.prefetchNext, []);

console.log('body-progressive-prefetch-policy: bounded deterministic loading policy verified');
