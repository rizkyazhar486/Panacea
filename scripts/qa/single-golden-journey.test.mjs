import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeGoldenJourney, advanceEncounterStage } from '../../src/domains/clinical-operations/journey/singleGoldenJourneyOrchestrator.ts';

const pId = 'PAT-SYNTH-001';
const encId = 'ENC-2026-001';
const docId = 'DOC-DR-ARIEF';

test('1. Authoritative happy-path journey with real lab and cryptographic signature', () => {
  let state = initializeGoldenJourney(pId, encId, 'Severe Fatigue', docId);
  assert.equal(state.currentStage, 'arrival');

  state = advanceEncounterStage(state, 'visit_os_active', docId, pId, encId, undefined, undefined, [{ id: 'task-history', status: 'completed' }], 1);
  assert.equal(state.currentStage, 'visit_os_active');

  state = advanceEncounterStage(state, 'lab_ordered', docId, pId, encId, undefined, undefined, undefined, 2);
  assert.equal(state.currentStage, 'lab_ordered');

  const validLab = {
    resultId: 'LAB-RES-999',
    orderId: 'LAB-ORD-888',
    patientId: pId,
    encounterId: encId,
    units: 'g/dL',
    value: 12.5,
    isReviewedByClinician: true,
    sourceProvenance: 'SILOAM-LIS-ADAPTER-v2'
  };
  state = advanceEncounterStage(state, 'lab_reconciled', docId, pId, encId, undefined, [validLab], undefined, 3);
  assert.equal(state.currentStage, 'lab_reconciled');
  assert.equal(state.labResults.length, 1);

  const validSig = {
    signerId: docId,
    signerRole: 'Attending Physician',
    timestamp: new Date().toISOString(),
    provenanceHash: 'sha256-auth-provenance-sig-xyz',
    isCryptographicallyVerified: true
  };
  state = advanceEncounterStage(state, 'signed_plan', docId, pId, encId, validSig, undefined, undefined, 4);
  assert.equal(state.currentStage, 'signed_plan');
  assert.equal(state.signatureRecord?.isCryptographicallyVerified, true);

  state = advanceEncounterStage(state, 'patient_explained', docId, pId, encId, undefined, undefined, undefined, 5);
  assert.equal(state.currentStage, 'patient_explained');

  state = advanceEncounterStage(state, 'follow_up_closed', docId, pId, encId, undefined, undefined, undefined, 6);
  assert.equal(state.currentStage, 'follow_up_closed');
});

test('2. Adversarial control: reject forged or unverified cryptographic signature', () => {
  let state = initializeGoldenJourney(pId, encId, 'Severe Fatigue', docId);
  state = advanceEncounterStage(state, 'visit_os_active', docId, pId, encId, undefined, undefined, [{ id: 'task-history', status: 'completed' }], 1);
  state = advanceEncounterStage(state, 'lab_ordered', docId, pId, encId, undefined, undefined, undefined, 2);
  const validLab = {
    resultId: 'LAB-RES-999', orderId: 'LAB-ORD-888', patientId: pId, encounterId: encId,
    units: 'g/dL', value: 12.5, isReviewedByClinician: true, sourceProvenance: 'LIS'
  };
  state = advanceEncounterStage(state, 'lab_reconciled', docId, pId, encId, undefined, [validLab], undefined, 3);

  const forgedSig = {
    signerId: docId,
    signerRole: 'Attending Physician',
    timestamp: new Date().toISOString(),
    provenanceHash: '',
    isCryptographicallyVerified: false
  };

  assert.throws(() => {
    advanceEncounterStage(state, 'signed_plan', docId, pId, encId, forgedSig, undefined, undefined, 4);
  }, /Valid cryptographic signature verification/);
});

test('3. Adversarial control: reject unreviewed or source-missing laboratory results', () => {
  let state = initializeGoldenJourney(pId, encId, 'Severe Fatigue', docId);
  state = advanceEncounterStage(state, 'visit_os_active', docId, pId, encId, undefined, undefined, [{ id: 'task-history', status: 'completed' }], 1);
  state = advanceEncounterStage(state, 'lab_ordered', docId, pId, encId, undefined, undefined, undefined, 2);

  const unreviewedLab = {
    resultId: 'LAB-RES-999', orderId: 'LAB-ORD-888', patientId: pId, encounterId: encId,
    units: 'g/dL', value: 12.5, isReviewedByClinician: false, sourceProvenance: 'LIS'
  };

  assert.throws(() => {
    advanceEncounterStage(state, 'lab_reconciled', docId, pId, encId, undefined, [unreviewedLab], undefined, 3);
  }, /Laboratory Safety Block/);
});

test('4. Adversarial control: reject stale version / atomic concurrency conflict', () => {
  const state = initializeGoldenJourney(pId, encId, 'Severe Fatigue', docId);
  assert.throws(() => {
    advanceEncounterStage(state, 'visit_os_active', docId, pId, encId, undefined, undefined, undefined, 999);
  }, /Stale encounter version detected/);
});

test('5. Adversarial control: reject cross-patient laboratory result injection', () => {
  let state = initializeGoldenJourney(pId, encId, 'Severe Fatigue', docId);
  state = advanceEncounterStage(state, 'visit_os_active', docId, pId, encId, undefined, undefined, [{ id: 'task-history', status: 'completed' }], 1);
  state = advanceEncounterStage(state, 'lab_ordered', docId, pId, encId, undefined, undefined, undefined, 2);

  const maliciousLab = {
    resultId: 'LAB-RES-BAD', orderId: 'LAB-ORD-888', patientId: 'PAT-SOMEONE-ELSE', encounterId: encId,
    units: 'g/dL', value: 12.5, isReviewedByClinician: true, sourceProvenance: 'LIS'
  };

  assert.throws(() => {
    advanceEncounterStage(state, 'lab_reconciled', docId, pId, encId, undefined, [maliciousLab], undefined, 3);
  }, /Lab result patient or encounter ID mismatch/);
});
