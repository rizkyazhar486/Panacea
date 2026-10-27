import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeGoldenJourney, advanceEncounterStage } from '../../src/domains/clinical-operations/journey/singleGoldenJourneyOrchestrator.ts';

const pId = 'PAT-SYNTH-001';
const encId = 'ENC-2026-001';
const docId = 'DOC-DR-ARIEF';

test('1. Successful full happy-path journey', () => {
  let state = initializeGoldenJourney(pId, encId, 'Severe Fatigue', docId);
  assert.equal(state.currentStage, 'arrival');

  state = advanceEncounterStage(state, 'visit_os_active', docId, pId, encId);
  assert.equal(state.currentStage, 'visit_os_active');

  state = advanceEncounterStage(state, 'lab_ordered', docId, pId, encId);
  assert.equal(state.currentStage, 'lab_ordered');

  state = advanceEncounterStage(state, 'lab_reconciled', docId, pId, encId, undefined, [
    { id: 'obs-1', isResolved: true },
    { id: 'obs-2', isResolved: true }
  ]);
  assert.equal(state.currentStage, 'lab_reconciled');
  assert.equal(state.labResultsReconciled, true);

  const validSig = {
    signerId: docId,
    signerRole: 'Attending Physician',
    timestamp: new Date().toISOString(),
    provenanceHash: 'sha256-verified-hash-xyz',
    isVerified: true
  };
  state = advanceEncounterStage(state, 'signed_plan', docId, pId, encId, validSig);
  assert.equal(state.currentStage, 'signed_plan');
  assert.equal(state.signatureRecord?.isVerified, true);

  state = advanceEncounterStage(state, 'patient_explained', docId, pId, encId);
  assert.equal(state.currentStage, 'patient_explained');

  state = advanceEncounterStage(state, 'follow_up_closed', docId, pId, encId, undefined, [
    { id: 'obs-3', isResolved: true }
  ]);
  assert.equal(state.currentStage, 'follow_up_closed');
});

test('2. Negative control: reject direct transition from arrival to closed', () => {
  const state = initializeGoldenJourney(pId, encId, 'Severe Fatigue', docId);
  assert.throws(() => {
    advanceEncounterStage(state, 'follow_up_closed', docId, pId, encId);
  }, /Invalid transition/);
});

test('3. Negative control: reject closure when mandatory obligations are unresolved', () => {
  let state = initializeGoldenJourney(pId, encId, 'Severe Fatigue', docId);
  state = advanceEncounterStage(state, 'visit_os_active', docId, pId, encId);
  state = advanceEncounterStage(state, 'lab_ordered', docId, pId, encId);
  state = advanceEncounterStage(state, 'lab_reconciled', docId, pId, encId);

  const validSig = {
    signerId: docId,
    signerRole: 'Attending Physician',
    timestamp: new Date().toISOString(),
    provenanceHash: 'hash-abc',
    isVerified: true
  };
  state = advanceEncounterStage(state, 'signed_plan', docId, pId, encId, validSig);
  state = advanceEncounterStage(state, 'patient_explained', docId, pId, encId);

  // obligations obs-3 still unresolved
  assert.throws(() => {
    advanceEncounterStage(state, 'follow_up_closed', docId, pId, encId);
  }, /Unresolved mandatory obligations/);
});

test('4. Negative control: reject unverified signature for signed_plan', () => {
  let state = initializeGoldenJourney(pId, encId, 'Severe Fatigue', docId);
  state = advanceEncounterStage(state, 'visit_os_active', docId, pId, encId);
  state = advanceEncounterStage(state, 'lab_ordered', docId, pId, encId);
  state = advanceEncounterStage(state, 'lab_reconciled', docId, pId, encId);

  const invalidSig = {
    signerId: docId,
    signerRole: 'Attending Physician',
    timestamp: new Date().toISOString(),
    provenanceHash: '',
    isVerified: false
  };

  assert.throws(() => {
    advanceEncounterStage(state, 'signed_plan', docId, pId, encId, invalidSig);
  }, /Valid verified clinician signature/);
});

test('5. Negative control: reject wrong patient ID / identity mismatch', () => {
  const state = initializeGoldenJourney(pId, encId, 'Severe Fatigue', docId);
  assert.throws(() => {
    advanceEncounterStage(state, 'visit_os_active', docId, 'WRONG-PATIENT', encId);
  }, /Patient or Encounter identity mismatch/);
});

test('6. Negative control: reject stale version / concurrency conflict', () => {
  const state = initializeGoldenJourney(pId, encId, 'Severe Fatigue', docId);
  assert.throws(() => {
    advanceEncounterStage(state, 'visit_os_active', docId, pId, encId, undefined, undefined, 999);
  }, /Stale encounter version detected/);
});
