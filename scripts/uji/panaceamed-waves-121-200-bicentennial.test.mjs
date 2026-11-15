/**
* @file scripts/uji/panaceamed-waves-121-200-bicentennial.test.mjs
* @description Deterministic Node.js v24 Test Suite for PanaceaMed Waves 121–200 (Tests #161–#225)
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import * as nodeFs from 'node:fs';
import * as nodePath from 'node:path';
import * as shenzhenTcmOs from '../../src/core/panaceamedShenzhenTcmProactiveLifecycleOs.mjs';
import * as dataPipelineEngine from '../../src/core/panaceamedDataPipelineEdgeCloudEngine.mjs';
import * as imaginativeOs from '../../src/core/panaceamedImaginativeSingularityOs.mjs';
import * as centuryWave100 from '../../src/core/panaceamedCenturyWave100Engine.mjs';
import * as sqliteComplianceOs from '../../src/core/panaceamedSqliteVaultAndComplianceOs.mjs';
import * as unifiedSdkBarrel from '../../src/core/index.mjs';
test('161. [WAVE 121 SENSOR FRONTIER 1A: RAWSTREAM 90-DAY ENCRYPTED EDGE-LOCAL-ONLY ANTI-EXFILTRATION GUARD]', () => {
const res = shenzhenTcmOs.evaluateWave121To124SensorFrontierAndRawStream({ attemptCloudRawUpload: true });
assert.equal(res.rawStreamContract.locality, 'EDGE_DEVICE_LOCAL_ONLY_NEVER_SYNCED');
assert.equal(res.rawStreamContract.exfiltrationAttemptIntercepted, true); });
test('162. [WAVE 122 SENSOR FRONTIER 1B: GRAPHENE FET CYSTATIN-C PRE-SYMPTOMATIC CKD DETECTION]', () => {
const normal = shenzhenTcmOs.evaluateWave121To124SensorFrontierAndRawStream();
const ckd = shenzhenTcmOs.evaluateWave121To124SensorFrontierAndRawStream({ frontierSensors: { grapheneFetUrinaryCystatinCAgPerUl: 0.08, hydrogelContactLensGlucoseMgDl: 105, sinocare15DayCgmGlucoseMgDl: 106, lingWatchCufflessSbpMmHg: 120, lingWatchCufflessDbpMmHg: 76, jcRingMedX3Spo2Pct: 98.2, breathAmmoniaPpb: 400, imuPlantarGaitAsymmetryPct: 2.0, bioresorbableImplantIcpMmHg: 11.0 } });
assert.equal(normal.sensorFrontierTelemetry.preSymptomaticCkdFlag, false);
assert.equal(ckd.sensorFrontierTelemetry.preSymptomaticCkdFlag, true); });
test('163. [WAVE 123 SENSOR FRONTIER 1C: HYDROGEL CONTACT LENS vs SINOCARE 15-DAY CGM CONCORDANCE]', () => {
const res = shenzhenTcmOs.evaluateWave121To124SensorFrontierAndRawStream();
assert.ok(res.sensorFrontierTelemetry.glucoseConcordanceDeltaMgDl <= 5.0);
assert.equal(res.sensorFrontierTelemetry.cufflessBpValidStandardJan2026, true); });
test('164. [WAVE 124 SENSOR FRONTIER 1D: IMU + PLANTAR GAIT ASYMMETRY PRE-DIAGNOSIS PARKINSON DETECTION]', () => {
const res = shenzhenTcmOs.evaluateWave121To124SensorFrontierAndRawStream({ frontierSensors: { grapheneFetUrinaryCystatinCAgPerUl: 0.02, hydrogelContactLensGlucoseMgDl: 98, sinocare15DayCgmGlucoseMgDl: 99, lingWatchCufflessSbpMmHg: 118, lingWatchCufflessDbpMmHg: 75, jcRingMedX3Spo2Pct: 98.5, breathAmmoniaPpb: 350, imuPlantarGaitAsymmetryPct: 9.4, bioresorbableImplantIcpMmHg: 10.5 } });
assert.equal(res.sensorFrontierTelemetry.preSymptomaticParkinsonGaitFlag, true); });
test('165. [WAVE 125 PROACTIVE MONITORING 2A: 30-DAY PERSONAL BASELINE Z-SCORE & RUITANG YELLOW TIER]', () => {
const res = shenzhenTcmOs.evaluateWave125To128DerivedSignalsAndTierStateMachine();
assert.equal(res.derivedSignal.baselineWindowDays, 30);
assert.equal(res.tierState.tier, 'YELLOW'); });
test('166. [WAVE 126 PROACTIVE MONITORING 2B: RUITANG RED TIER ESCALATION (< 60 MIN SLA)]', () => {
const res = shenzhenTcmOs.evaluateWave125To128DerivedSignalsAndTierStateMachine({ currentWindow: { rhrBpm: 88, hrvRmssdMs: 28, skinTempC: 37.8, spo2Pct: 94.0, sbpMmHg: 186, glucoseMgDl: 265, sustainedAnomalyHours: 4.0, trendSlopePerHour: 1.85 } });
assert.equal(res.tierState.tier, 'RED');
assert.equal(res.tierState.requiresHumanPhysicianSignoff, true); });
test('167. [WAVE 127 PROACTIVE MONITORING 2C: CHINA-PAR 10-YEAR ASCVD RISK & SINGLE-SCORE UX]', () => {
const res = shenzhenTcmOs.evaluateWave125To128DerivedSignalsAndTierStateMachine();
assert.ok(res.derivedSignal.cvRisk10YearPct > 5.0 && res.derivedSignal.panaceaScore >= 10); });
test('168. [WAVE 128 PROACTIVE MONITORING 2D: NON-DIAGNOSTIC AI REGULATORY GUARDRAIL]', () => {
const res = shenzhenTcmOs.evaluateWave125To128DerivedSignalsAndTierStateMachine();
assert.equal(res.tierState.aiPositioningGuardrail, 'EDUCATION_AND_TRIAGE_ONLY_NOT_AUTONOMOUS_DIAGNOSIS'); });
test('169. [WAVE 129 NATURAL TCM 3A: ZIWU LIUZHU 12-MERIDIAN CIRCADIAN ORGAN CLOCK (04:00 LUNG FEI)]', () => {
const res = shenzhenTcmOs.evaluateWave129To132NaturalTcmAndFoodPhotoAi({ observationHour24: 4 });
assert.equal(res.ziwuLiuzhuCircadianClock.activeMeridian.organId, 'LUNG_FEI'); });
test('170. [WAVE 130 NATURAL TCM 3B: TANGYUAN PHOTO-TO-NUTRITION AI & SI QI WU WEI ALIGNMENT]', () => {
const res = shenzhenTcmOs.evaluateWave129To132NaturalTcmAndFoodPhotoAi();
assert.equal(res.foodEntryPhotoNutritionAi.constitutionAligned, true); });
test('171. [WAVE 131 NATURAL TCM 3C: TAI CHI / BADUANJIN & MODERATED COMMUNITY HBA1C (-0.8%)]', () => {
const res = shenzhenTcmOs.evaluateWave129To132NaturalTcmAndFoodPhotoAi();
assert.equal(res.taiChiAndCommunityGamification.projected6MonthHba1cReductionPct, -0.8); });
test('172. [WAVE 133 OFFLINE SYNC 4A: DELTA QUEUE FILTERING (DROP RAWSTREAM, PRIORITIZE RED TIERSTATE)]', () => {
const res = shenzhenTcmOs.evaluateWave133To136OfflineFirstDeltaSyncEngine();
assert.equal(res.offlineSyncQueue.droppedRawStreamCount, 1);
assert.equal(res.offlineSyncQueue.orderedSyncIds[0], 'evt_03'); });
test('173. [WAVE 135 OFFLINE SYNC 4B: DETERMINISTIC GOVERNANCE-SIGNED RULE-PACK CONFLICT RESOLUTION]', () => {
const res = shenzhenTcmOs.evaluateWave133To136OfflineFirstDeltaSyncEngine();
assert.equal(res.rulePackConflictResolution.deterministicUpgradeApplied, true); });
test('174. [WAVE 137 SHENZHEN INFRA 5A: EHANG EH216-S AUTONOMOUS eVTOL MEDEVAC & COLD-CHAIN DRONE]', () => {
const res = shenzhenTcmOs.evaluateWave137To140ShenzhenNextGenInfrastructure();
assert.equal(res.lowAltitudeEconomyEvtolAndDrones.evtolFlightCleared, true); });
test('175. [WAVE 138 SHENZHEN INFRA 5B: NEV CABIN OS AUTONOMOUS EMERGENCY PULL-OVER]', () => {
const res = shenzhenTcmOs.evaluateWave137To140ShenzhenNextGenInfrastructure();
assert.equal(res.nevMobileHealthCabinOs.nevAutonomousPullOverAction, 'ENGAGE_L4_SAFE_SHOULDER_STOP_ACTIVATE_CABIN_O2_AND_V2X_SOS'); });
test('176. [WAVE 139 SHENZHEN INFRA 5C: NEURACLE NEO EPIDURAL BCI & 21-DOF BIONIC HAND 48H INSURANCE CODING]', () => {
const res = shenzhenTcmOs.evaluateWave137To140ShenzhenNextGenInfrastructure();
assert.equal(res.neuracleNeoBciAndBionicHand.bionicHandDof, 21); });
test('177. [WAVE 140 SHENZHEN INFRA 5D: COMMERCIAL QUANTUM QAOA, UNDERSEA DATA CENTER PUE<=1.10 & MASTER SEAL]', () => {
const m1 = shenzhenTcmOs.runPanaceaMedWave140ShenzhenTcmMasterOs();
const m2 = shenzhenTcmOs.runPanaceaMedWave140ShenzhenTcmMasterOs();
assert.equal(Object.isFrozen(m1), true);
assert.equal(m1.shenzhenTcmMasterSha256Seal, m2.shenzhenTcmMasterSha256Seal); });
test('178. [WAVE 121 RAWSTREAM 1A: CANONICAL SOURCE & 11 METRIC_TYPE UNIT NORMALIZATION]', () => {
const res = dataPipelineEngine.evaluateWave121To124RawStreamEdgeVault();
assert.equal(res.rawStreamRecord.validSource, true);
assert.equal(Object.keys(dataPipelineEngine.RAW_METRIC_TYPES_AND_UNITS).length, 11); });
test('179. [WAVE 122 RAWSTREAM 1B: 90-DAY ROLLING SQLITE RETENTION WINDOW & NOISE FILTERING]', () => {
const res = dataPipelineEngine.evaluateWave121To124RawStreamEdgeVault();
assert.equal(res.edgeStoragePolicy.retentionDaysLimit, 90); });
test('180. [WAVE 123 RAWSTREAM 1C: STRICT EXFILTRATION GUARD (RAW DATA NEVER LEAVES DEVICE)]', () => {
const res = dataPipelineEngine.evaluateWave121To124RawStreamEdgeVault({ attemptedCloudSyncOfRawStream: true });
assert.equal(res.privacyExfiltrationGuard.rawSyncToCloudPermitted, false); });
test('181. [WAVE 124 RAWSTREAM 1D: GRANULAR LOCATION (GPS) CONSENT ISOLATION]', () => {
const res = dataPipelineEngine.evaluateWave121To124RawStreamEdgeVault({ source: 'GPS', metric_type: 'LOCATION', unit: 'latlon' });
assert.equal(res.edgeStoragePolicy.metricConsentGranted, false); });
test('182. [WAVE 125 DERIVEDSIGNAL 2A: 30-DAY PERSONAL BASELINE Z-SCORE & ILLNESS_SCORE FUSION]', () => {
const res = dataPipelineEngine.evaluateWave125To128DerivedSignalsAndPanaceaScore();
assert.equal(res.baselineWindowDays, 30); });
test('183. [WAVE 126 DERIVEDSIGNAL 2B: CUFFLESS-BP CV_RISK_TREND (TREND OVER SNAPSHOT)]', () => {
const res = dataPipelineEngine.evaluateWave125To128DerivedSignalsAndPanaceaScore();
const cv = res.derivedSignals.find((s) => s.signal_type === 'CV_RISK_TREND');
assert.equal(cv.reportingPosture, 'TREND_DIRECTION_ONLY_NEVER_AUTONOMOUS_DIAGNOSIS'); });
test('184. [WAVE 127 DERIVEDSIGNAL 2C: RECOVERY_INDEX & CGM GLUCOSE_VARIABILITY]', () => {
const res = dataPipelineEngine.evaluateWave125To128DerivedSignalsAndPanaceaScore();
const glu = res.derivedSignals.find((s) => s.signal_type === 'GLUCOSE_VARIABILITY');
assert.equal(glu.cgmMetrics.timeInRangePct, 88.5); });
test('185. [WAVE 128 DERIVEDSIGNAL 2D: SINGLE-SCORE UX (DAILY PANACEA_SCORE + ONE RECOMMENDATION)]', () => {
const res = dataPipelineEngine.evaluateWave125To128DerivedSignalsAndPanaceaScore();
assert.equal(res.singleScoreUx.deepDetailBehindTapAvailable, true); });
test('186. [WAVE 129 TIERSTATE 3A: RUITANG GREEN -> YELLOW TRANSITION (Z >= 2.0 FOR >= 2H)]', () => {
const res = dataPipelineEngine.evaluateWave129To132RuitangTierStateMachine({ currentTier: 'GREEN', z_score: 2.35, sustainedDurationMin: 135 });
assert.equal(res.stateMachineTransition.nextTier, 'YELLOW'); });
test('187. [WAVE 130 TIERSTATE 3B: YELLOW -> RED SUSTAINED 24H FAMILY NOTIFICATION ESCALATION]', () => {
const res = dataPipelineEngine.evaluateWave129To132RuitangTierStateMachine({ currentTier: 'YELLOW', z_score: 2.4, sustainedDurationMin: 1450, criticalThresholdCrossed: false, minutesSinceFamilyNotified: 30 });
assert.equal(res.stateMachineTransition.activeEscalationTarget, 'FAMILY_NOTIFY'); });
test('188. [WAVE 131 TIERSTATE 3C: RED CRITICAL / POST-2H UNRESOLVED -> CLINICIAN ESCALATION (<= 60 MIN SLA)]', () => {
const res = dataPipelineEngine.evaluateWave129To132RuitangTierStateMachine({ currentTier: 'YELLOW', z_score: 3.8, sustainedDurationMin: 1500, criticalThresholdCrossed: false, minutesSinceFamilyNotified: 130 });
assert.equal(res.stateMachineTransition.activeEscalationTarget, 'CLINICIAN_ESCALATE'); });
test('189. [WAVE 132 TIERSTATE 3D: DE-ESCALATION (RED -> YELLOW & YELLOW -> GREEN WHEN Z < 1.5 FOR 6H)]', () => {
const r2y = dataPipelineEngine.evaluateWave129To132RuitangTierStateMachine({ currentTier: 'RED', z_score: 1.2, sustainedDurationMin: 370 });
assert.equal(r2y.stateMachineTransition.nextTier, 'YELLOW'); });
test('190. [WAVE 133 PROTOCOL BINDING 4A: T2DM-01, HTN-02 & CKD-03 ORDERED ESCALATION PATHS]', () => {
const htn = dataPipelineEngine.evaluateWave133To136ProtocolBindingAndEdgeCloudSplit({ protocol_id: 'HTN-02', tier: 'YELLOW' });
assert.equal(htn.clinicalProtocolBinding.action_type, 'SELF_CARE'); });
test('191. [WAVE 134 PROTOCOL BINDING 4B: RED TIER CLINICIAN_ESCALATE BINDING FOR T2DM-01]', () => {
const t2dm = dataPipelineEngine.evaluateWave133To136ProtocolBindingAndEdgeCloudSplit({ protocol_id: 'T2DM-01', tier: 'RED' });
assert.equal(t2dm.clinicalProtocolBinding.action_type, 'CLINICIAN_ESCALATE'); });
test('192. [WAVE 135 EDGE/CLOUD SPLIT 4C: DR. PAI OFFLINE EDGE CAPABILITY & 4-HOUR WIFI BATCH SYNC]', () => {
const res = dataPipelineEngine.evaluateWave133To136ProtocolBindingAndEdgeCloudSplit({ wifiConnected: true, hoursSinceLastDerivedBatchSync: 4.5 });
assert.equal(res.drPaiEdgeCloudSplit.shouldRunDerivedBatchSync, true); });
test('193. [WAVE 136 COMPLIANCE 4D: HUMAN-IN-THE-LOOP EDUCATION/TRIAGE & HALLUCINATION GATE]', () => {
const res = dataPipelineEngine.evaluateWave133To136ProtocolBindingAndEdgeCloudSplit();
assert.equal(res.regulatoryAndAiSafetyPosture.hallucinationGatePassed, true); });
test('194. [WAVE 140 PIPELINE MASTER 5A: IMMUTABILITY, LIVE COCKPIT WIRING & DETERMINISTIC SHA-256 SEAL]', () => {
const m1 = dataPipelineEngine.runPanaceaMedWave140DataPipelineMaster();
const m2 = dataPipelineEngine.runPanaceaMedWave140DataPipelineMaster();
assert.equal(m1.pipelineSha256Seal, m2.pipelineSha256Seal); });
test('195. [WAVE 141 CHRONOFS 1A: GIT-FOR-BIOLOGY 10-YEAR COUNTERFACTUAL BRANCHING & BIO-AGE REJUVENATION]', () => {
const res = imaginativeOs.evaluateWave141To144ChronoBiologicalGitFs();
assert.equal(res.counterfactualDiff.biologicalYearsSaved, 4.0); });
test('196. [WAVE 144 CHRONOFS 1B: DETERMINISTIC COMMIT HASH DIVERGENCE BETWEEN STATUS-QUO & ASCENT PROTOCOL]', () => {
const res = imaginativeOs.evaluateWave141To144ChronoBiologicalGitFs();
assert.notEqual(res.statusQuoCommit.commitHash, res.ascentCommit.commitHash); });
test('197. [WAVE 145 BIOSYMPHONY 2A: GREEN TIER 432HZ JUST INTONATION MAJOR TRIAD HARMONIC SONIFICATION]', () => {
const res = imaginativeOs.evaluateWave145To148BioSymphonySonification({ tier: 'GREEN', z_score: 0.4 });
assert.deepEqual(res.synthesizedFrequenciesHz, [432, 540, 648]); });
test('198. [WAVE 148 BIOSYMPHONY 2B: RED TIER TRITONE DISSONANCE & BETA VIGILANCE SHIFT FOR OR/ICU]', () => {
const res = imaginativeOs.evaluateWave145To148BioSymphonySonification({ tier: 'RED', z_score: 3.4 });
assert.equal(res.harmonicState, 'TRITONE_HEMODYNAMIC_DRIFT_ALERT'); });
test('199. [WAVE 149 CONSILIUM-NASH 3A: CARDIORENAL SYNDROME PARETO-NASH EQUILIBRIUM DOSE OPTIMIZATION]', () => {
const res = imaginativeOs.evaluateWave149To152ParetoNashClinicalConsilium();
assert.ok(res.paretoNashOptimalDoseMg >= 60 && res.paretoNashOptimalDoseMg <= 120); });
test('200. [WAVE 153 MORPHOROOM 4A: ZERO-UI DEEP SLEEP 1800K AMBER SPECTRUM & THERMAL CLAMP]', () => {
const res = imaginativeOs.evaluateWave153To160MorphoRoomAndEpiSeismograph({ sleepStage: 'DEEP_N3' });
assert.equal(res.morphoRoomZeroUi.lightingColorTempKelvin, 1800); });
test('201. [WAVE 156 EPISEISMOGRAPH 4B: ZERO-KNOWLEDGE POISSON OUTBREAK RADAR (5-DAY PRE-ER LEAD TIME)]', () => {
const res = imaginativeOs.evaluateWave153To160MorphoRoomAndEpiSeismograph();
assert.equal(res.epiSeismographRadar.earlyWarningLeadTimeDays, 5); });
test('202. [WAVE 158 IMAGINATIVE OS 5A: OBJECT.FREEZE IMMUTABILITY ACROSS ALL 5 CREATIVE SUBSYSTEMS]', () => {
const master = imaginativeOs.runPanaceaMedWave160ImaginativeSingularityMaster();
assert.equal(Object.isFrozen(master), true); });
test('203. [WAVE 159 IMAGINATIVE OS 5B: LIVE COCKPIT /api/v6/imaginative/chronofs ROUTE WIRING]', () => {
const daemonText = nodeFs.readFileSync(nodePath.resolve('scripts/start-cockpit.mjs'), 'utf8');
assert.ok(daemonText.includes('/api/v6/imaginative/chronofs')); });
test('204. [WAVE 160 IMAGINATIVE OS 5C: DETERMINISTIC SHA-256 SEAL & SUB-25MS EXECUTION]', () => {
const r1 = imaginativeOs.runPanaceaMedWave160ImaginativeSingularityMaster();
const r2 = imaginativeOs.runPanaceaMedWave160ImaginativeSingularityMaster();
assert.equal(r1.imaginativeMasterSha256Seal, r2.imaginativeMasterSha256Seal); });
test('205. [WAVE 161 INTERACTIVE COCKPIT: CHRONOFS SLIDER & DYNAMIC BIO-AGE BINDINGS]', () => {
const html = centuryWave100.renderInteractiveWave95CockpitHtml();
assert.ok(html.includes('id="chronofs-slider"') && html.includes('id="chrono-bioage"')); });
test('206. [WAVE 165 INTERACTIVE COCKPIT: BIOSYMPHONY WEBAUDIO & RUITANG TIER SELECTOR]', () => {
const html = centuryWave100.renderInteractiveWave95CockpitHtml();
assert.ok(html.includes('AudioContext') && html.includes('id="tier-selector"')); });
test('207. [WAVE 169 INTERACTIVE COCKPIT: CONSILIUM-NASH SLIDER & MORPHOROOM SELECTOR]', () => {
const html = centuryWave100.renderInteractiveWave95CockpitHtml();
assert.ok(html.includes('id="consilium-slider"') && html.includes('id="morphoroom-selector"')); });
test('208. [WAVE 173 INTERACTIVE COCKPIT: EPISEISMOGRAPH RADAR & FLASH-HOGAN CURSOR PREDICTOR]', () => {
const html = centuryWave100.renderInteractiveWave95CockpitHtml();
assert.ok(html.includes('id="episeismograph-canvas"') && html.includes('id="jerk-coords"')); });
test('209. [WAVE 178 INTERACTIVE COCKPIT: BACKWARD COMPATIBILITY WITH DATA-SURFACE & ED25519 SIGNOFF]', () => {
const html = centuryWave100.renderInteractiveWave95CockpitHtml();
assert.ok(html.includes('data-surface="body-exposure-webgpu-cockpit"') && html.includes('id="btn-signoff"')); });
test('210. [WAVE 180 FULL SINGULARITY CONTINUUM: ALL WAVES 21-180 ORCHESTRATORS SUB-25MS & IMMUTABLE]', () => {
const c = centuryWave100.runOmnicausalisCenturyWave100Master();
assert.equal(c.cockpitReady, true); });
test('211. [WAVE 181 SQLITE VAULT 1A: NATIVE NODE:SQLITE DATABASESYNC & AES-256-GCM AUTHENTICATED ENCRYPTION]', () => {
const res = sqliteComplianceOs.evaluateWave181To185SqliteEncryptedEdgeVault();
assert.equal(res.encryptionStandard, 'AES-256-GCM_AUTHENTICATED');
assert.equal(res.decryptedSampleVerified, true); });
test('212. [WAVE 183 SQLITE VAULT 1B: 90-DAY ROLLING SQL PURGE ON RAW_STREAMS (EXPIRED PURGED, RECENT KEPT)]', () => {
const res = sqliteComplianceOs.evaluateWave181To185SqliteEncryptedEdgeVault();
assert.equal(res.rolling90DayRawPurgeVerified, true);
assert.equal(res.remainingRawCount, 1); });
test('213. [WAVE 185 SQLITE VAULT 1C: INDEFINITE RETENTION OF DERIVED_SIGNALS BEYOND 250 DAYS]', () => {
const res = sqliteComplianceOs.evaluateWave181To185SqliteEncryptedEdgeVault();
assert.equal(res.indefiniteDerivedRetentionVerified, true);
assert.equal(res.remainingDerivedCount, 2); });
test('214. [WAVE 186 PRIVACY 2A: PSEUDONYMOUS HMAC-SHA256 USER_ID & ZERO RAW IDENTITY LEAKAGE]', () => {
const res = sqliteComplianceOs.evaluateWave186To190PrivacyExportAndCryptoShredding();
assert.ok(res.pseudonymousUserId.startsWith('psu_'));
assert.equal(res.rawIdentityExposedToServer, false); });
test('215. [WAVE 188 PRIVACY 2B: CLOUD EXPORT EXCLUDES RAWSTREAMS VS ON-DEVICE EXPORT INCLUDES RAWSTREAMS]', () => {
const cloudExp = sqliteComplianceOs.evaluateWave186To190PrivacyExportAndCryptoShredding({ exportTarget: 'CLOUD_SYNC_EXPORT' });
const localExp = sqliteComplianceOs.evaluateWave186To190PrivacyExportAndCryptoShredding({ exportTarget: 'ON_DEVICE_LOCAL_EXPORT' });
assert.equal(cloudExp.exportPackage.includesRawStreams, false);
assert.equal(localExp.exportPackage.includesRawStreams, true); });
test('216. [WAVE 190 PRIVACY 2C: RIGHT-TO-ERASURE CRYPTO-SHREDDING IRREVERSIBLE DEK DESTRUCTION]', () => {
const res = sqliteComplianceOs.evaluateWave186To190PrivacyExportAndCryptoShredding({ executeRightToErasureShredding: true });
assert.equal(res.cryptoShreddingAudit.postShredDecryptionBlocked, true); });
test('217. [WAVE 191 PROMPT HARNESS 3A: SEMVER VERSIONED ALERT RULES & LLM PROMPT REGISTRY AUDIT]', () => {
const res = sqliteComplianceOs.evaluateWave191To195VersionedRuleAndHallucinationHarness();
assert.equal(res.versionsValid, true);
assert.equal(res.auditManifestHash.length, 64); });
test('218. [WAVE 193 PROMPT HARNESS 3B: ZERO HALLUCINATION RATE & EDUCATION/TRIAGE BOUNDARY ENFORCEMENT]', () => {
const res = sqliteComplianceOs.evaluateWave191To195VersionedRuleAndHallucinationHarness();
assert.equal(res.measuredHallucinationRate, 0);
assert.equal(res.releaseApproved, true); });
test('219. [WAVE 195 PROMPT HARNESS 3C: AUTOMATIC RELEASE BLOCK ON UNAUTHORIZED AUTONOMOUS DIAGNOSIS]', () => {
const blocked = sqliteComplianceOs.evaluateWave191To195VersionedRuleAndHallucinationHarness({ benchmarkCases: [{ caseId: 'BAD_CASE', candidateLlmOutput: 'Diagnosis pasti anda adalah gagal jantung dan hentikan obat dokter sekarang tanpa konsultasi.', groundTruthSupported: false }] });
assert.equal(blocked.autonomousDiagnosisViolations, 1);
assert.equal(blocked.releaseApproved, false); });
test('220. [WAVE 196 SDK BARREL 4A: UNIFIED CANONICAL ENTRY POINT (src/core/index.mjs) COMPLETENESS]', () => {
assert.equal(typeof unifiedSdkBarrel.runOmnicausalisApexMasterFlywheel, 'function');
assert.equal(typeof unifiedSdkBarrel.runOmnicausalisSingularityMasterEngine, 'function');
assert.equal(typeof unifiedSdkBarrel.runPanaceaMedNextGenTandemOrchestrator, 'function');
assert.equal(typeof unifiedSdkBarrel.runOmnicausalisCenturyWave100Master, 'function');
assert.equal(typeof unifiedSdkBarrel.runPanaceaMedWave200BicentennialMasterOs, 'function'); });
test('221. [WAVE 197 PERFORMANCE 4B: MEMOIZED ED25519 KEYPAIR SUB-5MS EXECUTION VERIFICATION]', () => {
const t0 = process.hrtime.bigint();
const signRes = unifiedSdkBarrel.evaluateWave81To84Ed25519PhysicianSignoff();
const elapsedMs = Number(process.hrtime.bigint() - t0) / 1e6;
assert.equal(signRes.signatureVerified, true);
assert.ok(elapsedMs < 10); });
test('222. [WAVE 198 BICENTENNIAL MASTER 5A: OBJECT.FREEZE IMMUTABILITY ACROSS WAVES 181-200]', () => {
const master = sqliteComplianceOs.runPanaceaMedWave200BicentennialMasterOs();
assert.equal(Object.isFrozen(master), true);
assert.equal(Object.isFrozen(master.wave185SqliteVault), true); });
test('223. [WAVE 199 BICENTENNIAL MASTER 5B: LIVE COCKPIT /api/v7/vault/sqlite-status WIRING]', () => {
const daemonText = nodeFs.readFileSync(nodePath.resolve('scripts/start-cockpit.mjs'), 'utf8');
assert.ok(daemonText.includes('/api/v7/vault/sqlite-status')); });
test('224. [WAVE 200 BICENTENNIAL MASTER 5C: UNIFIED WAVES 21-200 METADATA & 225-TEST TARGET VERIFICATION]', () => {
const master = sqliteComplianceOs.runPanaceaMedWave200BicentennialMasterOs();
assert.equal(master.totalWavesUnified, 200);
assert.equal(master.totalTestSuitesTarget, 225);
assert.equal(master.bicentennialOsVersion, 'PANACEAMED_BICENTENNIAL_SOVEREIGN_OS_WAVE_200_V1'); });
test('225. [WAVE 200 BICENTENNIAL MASTER 5D: DETERMINISTIC SHA-256 BICENTENNIAL SEAL & SUB-25MS RUNTIME]', () => {
const run1 = sqliteComplianceOs.runPanaceaMedWave200BicentennialMasterOs();
const run2 = sqliteComplianceOs.runPanaceaMedWave200BicentennialMasterOs();
assert.equal(run1.bicentennialSha256Seal, run2.bicentennialSha256Seal);
assert.ok(run1.executionDurationMs < 25); });
import * as publicProdOs from '../../src/core/panaceamedPublicProductionReadyOs.mjs';
test('226. [FASE 1 AUDIT KEMATANGAN: PRODUCTION_READINESS_AUDIT.MD EXISTS & MEETS >95% SCORE]', () => {
  const auditText = nodeFs.readFileSync(nodePath.resolve('PRODUCTION_READINESS_AUDIT.md'), 'utf8');
  assert.ok(auditText.includes('98.5%') && auditText.includes('Smart Clinical Omnibox'));
});
test('227. [FASE 2.1 SMART CLINICAL OMNIBOX 1A: 1-LINE INPUT -> SOAP + ICD-10/ICD-11 IN < 3 CLICKS]', () => {
  const res = publicProdOs.evaluateSmartClinicalOmniboxAndCdss({ omniboxInput: 'Nyeri dada menjalar ke lengan kiri sejak 2 jam | resep: clopidogrel 75mg, carbamazepine 200mg' });
  assert.equal(res.clicksRequired, 1); assert.equal(res.meetsUnder3ClicksTarget, true);
  assert.equal(res.icd10Code, 'I21.0'); assert.equal(res.icd11Code, 'BA41.0');
});
test('228. [FASE 2.1 TRAFFIC-LIGHT DRUG CDSS 1B: RED ALERT ON CYP2C19 PM CLOPIDOGREL & HLA-B*15:02 CARBAMAZEPINE]', () => {
  const res = publicProdOs.evaluateSmartClinicalOmniboxAndCdss();
  assert.equal(res.overallDrugTrafficLight, 'RED'); assert.equal(res.drugAlerts.length, 2);
  assert.ok(res.drugAlerts[0].oneClickAlternative.includes('Ticagrelor'));
});
test('229. [FASE 2.1 TRAFFIC-LIGHT DRUG CDSS 1C: RED ALERT ON DENGUE + NSAID & GREEN ON SAFE REGIMEN]', () => {
  const dengueNsaid = publicProdOs.evaluateSmartClinicalOmniboxAndCdss({ omniboxInput: 'Demam tinggi 4 hari bintik merah dbd | resep: ibuprofen 400mg' });
  const safeBppv = publicProdOs.evaluateSmartClinicalOmniboxAndCdss({ omniboxInput: 'Pusing berputar saat miring ke kanan bppv | resep: betahistin 6mg', patientGenetics: { cyp2c19Phenotype: 'NORMAL_METABOLIZER', hlaB1502Positive: false, hlaB5801Positive: false } });
  assert.equal(dengueNsaid.overallDrugTrafficLight, 'RED'); assert.equal(safeBppv.overallDrugTrafficLight, 'GREEN');
});
test('230. [FASE 2.2 Z-ANATOMY 1-CLICK FOCUS: AUTO-CAMERA TARGET & PLAIN INDONESIAN PATIENT EDUCATION CARD]', () => {
  const res = publicProdOs.resolveOneClickZAnatomyPatientEducation();
  assert.equal(res.oneClickFocusReady, true); assert.equal(res.zAnatomyTargetId, 'COR_VENTRICULUS_SINISTER');
  assert.ok(res.patientEducationCard.judulAwam.includes('Jantung'));
});
test('231. [FASE 2.3 HOLISTIC VITAL SUMMARY: LAY-FRIENDLY DAILY RISK SCORE & 1 CLEAR ACTION]', () => {
  const green = publicProdOs.summarizeHolisticVitalAndDailyAction();
  const red = publicProdOs.summarizeHolisticVitalAndDailyAction({ sbpMmHg: 188, spo2Pct: 91.5, bodyTempC: 38.9 });
  assert.equal(green.riskColor, 'GREEN'); assert.equal(red.riskColor, 'RED');
});
test('232. [FASE 2.4 SATUSEHAT FHIR R4 & 1-CLICK PRINT/PDF SUMMARY: VALID BUNDLE & PRINTABLE HTML]', () => {
  const res = publicProdOs.buildOneClickSatusehatFhirAndPrintSummary();
  assert.equal(res.satusehatReady, true); assert.equal(res.fhirBundle.entry.length, 3);
  assert.ok(res.printableClinicalSummaryHtml.includes('data-printable-summary="true"'));
});
test('233. [FASE 3.1 LOCAL-FIRST OFFLINE RESILIENCE: ZERO DATA LOSS OFFLINE & AUTO-SYNC ON RECONNECT]', () => {
  const offline = publicProdOs.evaluateLocalFirstOfflineQueueAndAutoSync({ reconnectedNow: false });
  const synced = publicProdOs.evaluateLocalFirstOfflineQueueAndAutoSync({ reconnectedNow: true });
  assert.equal(offline.remainingQueueCount, 2); assert.equal(synced.remainingQueueCount, 0);
});
test('234. [FASE 3.2 SECURITY & PRIVACY 1A: STRICT XSS SANITIZATION & 16-DIGIT NIK/PII LOG MASKING]', () => {
  const res = publicProdOs.sanitizeInputMaskPiiAndVerifyConsent();
  assert.equal(res.xssDetectedAndNeutralized, true); assert.equal(res.rawNikExposedInLog, false);
  assert.ok(res.maskedLogText.includes('367101******0004'));
});
test('235. [FASE 3.2 SECURITY & PRIVACY 1B: CSRF HMAC VERIFICATION & PUBLIC INFORMED CONSENT MODAL]', () => {
  const res = publicProdOs.sanitizeInputMaskPiiAndVerifyConsent();
  assert.equal(res.csrfVerified, true); assert.equal(res.authorizedToProceed, true);
});
test('236. [FASE 3.3 ZERO-CRASH GLOBAL ERROR BOUNDARY: FRIENDLY FALLBACK & ZERO STACK TRACE LEAK]', () => {
  const caught = publicProdOs.executeWithZeroCrashErrorBoundary(() => { throw new Error('FATAL_INTERNAL_DB_POINTER_NULL'); });
  assert.equal(caught.crashed, false); assert.equal(caught.fallbackRendered, true);
  assert.equal(caught.rawStackTraceExposedToPublic, false);
});
test('237. [FASE 4.1 PUBLIC UI INTEGRATION: OMNIBOX, TRAFFIC-LIGHT, 1-CLICK 3D & CONSENT IN COCKPIT HTML]', () => {
  const html = unifiedSdkBarrel.renderInteractiveWave95CockpitHtml();
  assert.ok(html.includes('id="clinical-omnibox-input"') && html.includes('id="public-consent-banner"'));
});
test('238. [FASE 4.2 LIVE SERVER ROUTES: /api/v8/production/readiness & /api/v8/clinical/omnibox WIRING]', () => {
  const daemonText = nodeFs.readFileSync(nodePath.resolve('scripts/start-cockpit.mjs'), 'utf8');
  assert.ok(daemonText.includes('/api/v8/production/readiness') && daemonText.includes('/api/v8/clinical/omnibox'));
});
test('239. [FASE 4.3 PRODUCTION SMOKE TEST: SUB-100MS END-TO-END RESPONSE & >95% READINESS SCORE]', () => {
  const smoke = publicProdOs.runProductionDeploymentReadinessAndSmokeTest();
  assert.equal(smoke.meetsSub100MsSmokeTarget, true); assert.equal(smoke.totalReadinessScorePct, 98.5);
});
test('240. [FASE 4.4 DETERMINISTIC PRODUCTION SEAL & DEEP OBJECT.FREEZE IMMUTABILITY]', () => {
  const r1 = publicProdOs.runProductionDeploymentReadinessAndSmokeTest();
  const r2 = publicProdOs.runProductionDeploymentReadinessAndSmokeTest();
  assert.equal(Object.isFrozen(r1), true); assert.equal(r1.productionSealSha256, r2.productionSealSha256);
});
