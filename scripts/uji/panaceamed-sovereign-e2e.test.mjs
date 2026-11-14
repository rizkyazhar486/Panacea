import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeNormotensiveRadialPwvMs,
  NORMOTENSIVE_RADIAL_YOUNGS_MODULUS_KPA,
} from '../../src/core/panaceamedNextGenArgonCortex.mjs';
import {
  computeWelfordHrvMetrics,
  scheduleFsrsV4UkmpddReview,
} from '../../src/core/panaceamedNextGenHydrogenSpine.mjs';
import * as sovereignEngine from '../../src/core/panaceamedSovereignEndToEndEngine.mjs';

test('111. [WAVE 61 EPISTEMIC PILLAR 1A: CLAIM-GUARD ZERO-VIOLATION & TRUTH-CLASS ENFORCEMENT]', () => {
  const res = sovereignEngine.evaluateWave61To64EpistemicClaimGuard();
  assert.equal(res.truthClass, 'OBSERVED_CLINICAL');
  assert.equal(res.truthClassValid, true);
  assert.equal(res.claimGuardViolations, 0);
  assert.equal(res.requiresHumanPhysicianSignoff, true);
});

test('112. [WAVE 62 EPISTEMIC PILLAR 1B: CITATION-LEDGER SHA-256 PROVENANCE & GUIDELINE BINDING]', () => {
  const res = sovereignEngine.evaluateWave61To64EpistemicClaimGuard();
  assert.equal(res.citationLedgerViolations, 0);
  assert.equal(res.resolvedCitationCount, 4);
  assert.equal(res.ledgerSha256.length, 64);
});

test('113. [WAVE 65 COCKPIT PILLAR 2A: /body-exposure DATA-SURFACE & CLINICALLY-REVIEWED FALSE GUARD]', () => {
  const res = sovereignEngine.handleWave65To68SovereignCockpitGateway({ method: 'GET', path: '/body-exposure' });
  assert.equal(res.statusCode, 200);
  assert.ok(res.body.includes('data-surface="body-exposure-webgpu-cockpit"'));
  assert.ok(res.body.includes('data-clinically-reviewed="false"'));
});

test('114. [WAVE 66 COCKPIT PILLAR 2B: /api/v2/nextgen/telemetry OBSERVED_CLINICAL CONTRACT & 8.33MS BUDGET]', () => {
  const res = sovereignEngine.handleWave65To68SovereignCockpitGateway({ method: 'GET', path: '/api/v2/nextgen/telemetry' });
  const parsed = JSON.parse(res.body);
  assert.equal(res.statusCode, 200);
  assert.equal(parsed.truthClass, 'OBSERVED_CLINICAL');
  assert.equal(parsed.clinicallyReviewed, false);
  assert.equal(parsed.requiresHumanPhysicianSignoff, true);
  assert.equal(parsed.pipeline, 'lockfree-ekf-webgpu-crdt-v2x');
});

test('115. [WAVE 68 COCKPIT PILLAR 2C: /healthz 120 FPS FRAME BUDGET & 404 IMMUTABLE FALLBACK]', () => {
  const ok = sovereignEngine.handleWave65To68SovereignCockpitGateway({ method: 'GET', path: '/healthz' });
  const miss = sovereignEngine.handleWave65To68SovereignCockpitGateway({ method: 'GET', path: '/tidak-ada' });
  assert.equal(ok.statusCode, 200);
  assert.equal(JSON.parse(ok.body).frameBudgetMs, 8.33);
  assert.equal(miss.statusCode, 404);
});

test('116. [WAVE 71 NATIONAL JKN PILLAR 3A: INA-CBGs / IDRG SEVERITY LEVEL III GROUPING & ICD-10/ICD-9-CM AUDIT]', () => {
  const res = sovereignEngine.evaluateWave69To75JknAndInSilicoTwin();
  assert.equal(res.jknInaCbgGrouping.severityLevel, 'SEVERITY_III_MAJOR');
  assert.equal(res.jknInaCbgGrouping.inaCbgGroupCode, 'I-4-10-III');
  assert.equal(res.jknInaCbgGrouping.claimAuditReady, true);
});

test('117. [WAVE 74 DIGITAL TWIN PILLAR 3B: IN-SILICO N-OF-1 PBPK ANTIPLATELET EFFICACY & QTC SAFETY TRIAL]', () => {
  const res = sovereignEngine.evaluateWave69To75JknAndInSilicoTwin();
  assert.ok(res.inSilicoDigitalTwinTrial.predictedPlateletInhibitionPct >= 90);
  assert.ok(res.inSilicoDigitalTwinTrial.predictedPostDoseQtcMs < 450);
  assert.equal(res.inSilicoDigitalTwinTrial.inSilicoTrialVerdict, 'OPTIMAL_EFFICACY_AND_CARDIAC_SAFETY');
  assert.equal(res.inSilicoDigitalTwinTrial.truthClass, 'SIMULATED_HYPOTHESIS');
});

test('118. [WAVE 76 DIGITAL TWIN PILLAR 3C: CYP2C19 POOR METABOLIZER CLOPIDOGREL IN-SILICO FAILURE DETECTION]', () => {
  const res = sovereignEngine.evaluateWave69To75JknAndInSilicoTwin({
    candidateDrug: { name: 'clopidogrel', doseMg: 75, cyp2c19Dependent: true, qtcDeltaMs: 0 },
  });
  assert.equal(res.inSilicoDigitalTwinTrial.inSilicoTrialVerdict, 'SUBOPTIMAL_SWITCH_REQUIRED');
});

test('119. [WAVE 79 SOVEREIGN PILLAR 4A: OBJECT.FREEZE IMMUTABILITY & LINT:RATCHET CONTRACT INTEGRITY]', () => {
  const master = sovereignEngine.runPanaceaMedSovereignEndToEndOrchestrator();
  assert.equal(Object.isFrozen(master), true);
  assert.equal(Object.isFrozen(master.wave61Epistemic), true);
  assert.equal(Object.isFrozen(master.wave69JknTwin), true);
});

test('120. [WAVE 80 SOVEREIGN PILLAR 4B: END-TO-END WAVES 21-80 DETERMINISTIC SHA-256 SEAL & SUB-15MS RUNTIME]', () => {
  const run1 = sovereignEngine.runPanaceaMedSovereignEndToEndOrchestrator();
  const run2 = sovereignEngine.runPanaceaMedSovereignEndToEndOrchestrator();
  assert.equal(run1.masterSha256Seal.length, 64);
  assert.equal(run1.masterSha256Seal, run2.masterSha256Seal);
  assert.ok(run1.executionDurationMs < 25);
});

test('121. [LAYER 1 NORMOTENSIVE BASELINE: Calibrated E = 235 kPa yields PWV approx 6.19 m/s]', () => {
  assert.equal(NORMOTENSIVE_RADIAL_YOUNGS_MODULUS_KPA, 235);
  const pwv = computeNormotensiveRadialPwvMs(235);
  assert.equal(pwv, 6.19);
});

test('122. [LAYER 1 HRV WELFORD ONE-PASS: Deterministic SDNN & RMSSD computation]', () => {
  const hrv = computeWelfordHrvMetrics([800, 840, 790, 860, 810]);
  assert.equal(hrv.sampleCount, 5);
  assert.equal(hrv.meanRrMs, 820);
  assert.ok(hrv.sdnnMs > 25);
  assert.ok(hrv.rmssdMs > 40);
});

test('123. [LAYER 3 FSRS V4 UKMPPD: Spaced-repetition interval progression under Easy rating]', () => {
  const fsrs = scheduleFsrsV4UkmpddReview({ stabilityDays: 3.0, difficulty: 5.0 }, 4);
  assert.ok(fsrs.nextStabilityDays > 9.0);
  assert.equal(fsrs.retrievabilityTargetPct, 90);
});

test('124. [LAYER 3 THT-KL & OPHTHALMOLOGY & RHEUM: Air-Bone Gap, LogMAR & Anifrolumab 300mg IV q4w]', () => {
  const l3 = sovereignEngine.evaluateLayer3ThtOphthoStewardship({
    airConductionDb: 50,
    boneConductionDb: 15,
    snellenDenominator: 24,
    sledai2kScore: 10,
    ifnHigh: true,
  });
  assert.equal(l3.conductiveHearingLoss, true);
  assert.equal(l3.logMarAcuity, 0.6);
  assert.equal(l3.anifrolumabRegimen, 'ANIFROLUMAB_300MG_IV_Q4W_PLUS_STEROID_TAPER_ELIGIBLE');
});

test('125. [LAYER 5 Z-ANATOMY TA2/SNOMED-CT BVH: Raycast resolves arteria_radialis_cunkou metadata]', () => {
  const trav = sovereignEngine.traverseZAnatomyHierarchyBvh([0, 0, 0], [0, 0, 1]);
  assert.equal(trav.bvhHit.hit, true);
  assert.equal(trav.matchedStructure.ta2Code, 'A12.2.09.027');
  assert.equal(trav.matchedStructure.snomedCode, '45631007');
});

test('126. [LAYER 6 CLAIM-GUARD NEGATIVE CONTROL: Rejects autonomous prescription without physician signoff]', () => {
  const bad = sovereignEngine.evaluateWave61To64EpistemicClaimGuard({
    clinicalStatement: 'Guaranteed cure with autonomous prescription executed immediately.',
  });
  assert.equal(bad.claimGuardViolations, 1);
  assert.equal(bad.requiresHumanPhysicianSignoff, true);
});

test('127. [LAYER 6 CITATION-LEDGER BINDING: Resolves WHO-ICD11-TM1-SF50 and BUHLMANN-ZHL16C-1995]', () => {
  const res = sovereignEngine.evaluateWave61To64EpistemicClaimGuard({
    citationKeys: ['WHO-ICD11-TM1-SF50', 'BUHLMANN-ZHL16C-1995', 'Z-ANATOMY-TA2-SNOMED-2024'],
  });
  assert.equal(res.citationLedgerViolations, 0);
  assert.equal(res.resolvedCitationCount, 3);
});

test('128. [LAYER 4 INA-CBGs LEVEL I & II BOUNDARIES: Correctly stratifies uncomplicated vs single comorbidity]', () => {
  const lvl1 = sovereignEngine.evaluateWave69To75JknAndInSilicoTwin({
    secondaryComorbiditiesIcd10: [],
    patientEgfrMlMin: 92,
  });
  assert.equal(lvl1.jknInaCbgGrouping.inaCbgGroupCode, 'I-4-10-I');
  const lvl2 = sovereignEngine.evaluateWave69To75JknAndInSilicoTwin({
    secondaryComorbiditiesIcd10: ['I10'],
    patientEgfrMlMin: 75,
  });
  assert.equal(lvl2.jknInaCbgGrouping.inaCbgGroupCode, 'I-4-10-II');
});

test('129. [LAYER 6 EPISTEMIC SIGNATURE GATE: Clinically reviewed requires both flag and signature hash]', () => {
  const unverified = sovereignEngine.evaluateWave61To64EpistemicClaimGuard({
    clinicallyReviewed: true,
    physicianSignatureHash: null,
  });
  assert.equal(unverified.clinicallyReviewed, false);
  assert.equal(unverified.requiresHumanPhysicianSignoff, true);
});

test('130. [FULL SOVEREIGN CONTINUUM WAVES 21-80: Deep immutability & sub-10ms orchestrator execution]', () => {
  const res = sovereignEngine.runPanaceaMedSovereignEndToEndOrchestrator();
  assert.equal(res.clinicallyReviewed, false);
  assert.equal(res.requiresHumanPhysicianSignoff, true);
  assert.equal(res.zAnatomyBvh.matchedStructure.nodeId, 'arteria_radialis_cunkou');
  assert.ok(res.executionDurationMs < 10);
});
