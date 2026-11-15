import assert from "node:assert/strict";
import test from "node:test";
import * as omnicausalis from "../../src/domains/omnicausalis-index.ts";

test("P0.2 — Real NIST SHA-256 Reference Vector, Keyed HMAC-SHA-256, Fail-Closed Secret & Zero Prefix Leakage", () => {
  assert.equal(omnicausalis.computeRealSha256Hex("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  const secret = "PANACEA_HIGH_ENTROPY_TEST_KEY_2026_SECURE";
  const e1 = omnicausalis.generatePanaceaLhidEnvelope({ canonicalPatientId: "PATIENT-RAW-9988", hmacSecretKey: secret, clinicalPayload: { b: 2, a: 1 }, legacyV1EnvelopeIdToMigrate: "PANACEA-LHID-KELVIN-001" });
  const e2 = omnicausalis.generatePanaceaLhidEnvelope({ canonicalPatientId: "PATIENT-RAW-9988", hmacSecretKey: secret, clinicalPayload: { a: 1, b: 2 } });
  assert.equal(e1.payloadSha256Digest, e2.payloadSha256Digest);
  assert.equal(e1.payloadSha256Digest.length, 64);
  assert.equal(e1.publicLongitudinalId.includes("PATIENT"), false);
  assert.equal(e1.publicLongitudinalId.includes("9988"), false);
  assert.equal(e1.didRegistryClaimed, false);
  assert.equal(e1.migrationCompatibility.legacyV1FormatRecognized, true);
  assert.throws(() => omnicausalis.generatePanaceaLhidEnvelope({ canonicalPatientId: "PT-1", hmacSecretKey: "short", clinicalPayload: {} }), /FAIL_CLOSED_CRYPTO_ERROR/);
});

test("P0.3 & P0.4 — Valid HL7 FHIR R4 UUID URNs, Missing Observation Honesty & SSC Adult Sepsis CDS", () => {
  const secret = "PANACEA_HIGH_ENTROPY_TEST_KEY_2026_SECURE";
  const bundle = omnicausalis.buildFhirBundleForSepsisCare({
    canonicalPatientId: "PT-01",
    hmacSecretKey: secret,
    encounterId: "ENC-01",
    effectiveDateTimeIso: "2026-11-02T23:50:00.000Z",
    observedLactateMmolL: null,
    observedMapMmHg: 58,
    clinicianAuthorizedCarePlan: false
  });
  const urls = new Set();
  for (const item of bundle.entry) {
    assert.match(item.fullUrl, omnicausalis.UUID_URN_REGEX);
    assert.equal(urls.has(item.fullUrl), false);
    urls.add(item.fullUrl);
  }
  assert.equal(bundle.entry.length, 3);
  assert.equal(bundle.entry[2].resource.status, "draft");
  assert.equal(bundle.entry[2].resource.intent, "proposal");

  const possibleNoShock = omnicausalis.evaluateSepsisOneHourBundle({
    patientPopulation: "ADULT_NON_PREGNANT",
    sepsisLikelihood: "POSSIBLE_INFECTION_UNCERTAIN",
    meanArterialPressureMmHg: 78,
    serumLactateMmolL: 1.4,
    vasopressorRequiredForMap65: false,
    hypoperfusionPresent: false
  });
  assert.equal(possibleNoShock.antimicrobialTimingRecommendation.targetWindowMinutes, 180);
  assert.equal(possibleNoShock.fluidResuscitationGuidance.indicatedFor30MlPerKg, false);
});

test("P1.5, P1.6, P2 & P3 — Clinical One OS Idempotency, DICOMweb SSRF Guard, Honest ACWR, Wiggers/Krogh/Nephron & Journey", () => {
  const store = new omnicausalis.CanonicalLongitudinalClinicalStore();
  const secret = "PANACEA_HIGH_ENTROPY_TEST_KEY_2026_SECURE";
  const r1 = store.executeEncounterToLongitudinalHistory({ encounterId: "E1", canonicalPatientId: "P1", hmacSecretKey: secret, actorRole: "ATTENDING_PHYSICIAN", actorId: "D1", timestampIso: "2026-11-02T23:50:00.000Z", observedLactateMmolL: 2.6, observedMapMmHg: 60, authorizeCarePlanOrder: true });
  const r2 = store.executeEncounterToLongitudinalHistory({ encounterId: "E1", canonicalPatientId: "P1", hmacSecretKey: secret, actorRole: "ATTENDING_PHYSICIAN", actorId: "D1", timestampIso: "2026-11-02T23:50:00.000Z", observedLactateMmolL: 2.6, observedMapMmHg: 60, authorizeCarePlanOrder: true });
  assert.equal(r2.idempotentReplay, true);
  assert.equal(store.getLongitudinalHistory(r1.publicLongitudinalId).length, 1);

  assert.throws(() => omnicausalis.validateHttpsDicomwebEndpointNoSsrf("https://127.0.0.1/dicomweb"), /SSRF_SECURITY_VIOLATION/);
  assert.throws(() => omnicausalis.coupleAcwrRecoveryToClassPass({ acuteLoad7dTrimp: 300, chronicLoad28dTrimp: 0, wearableRecoveryPercent: 80 }), /INVALID_CHRONIC_DENOMINATOR/);
  const acwr = omnicausalis.coupleAcwrRecoveryToClassPass({ acuteLoad7dTrimp: 620, chronicLoad28dTrimp: 400, wearableRecoveryPercent: null });
  assert.equal(acwr.wearableRecoveryMeasurement, "MISSING_OBSERVATION");
  assert.equal(acwr.heuristicSessionGuidance.includes("contraindicated"), false);

  assert.ok(omnicausalis.computePoiseuilleLaminarFlowMlPerSec({ deltaPressureMmHg: 10, radiusCm: 0.2, lengthCm: 5 }) > 0);
  assert.equal(omnicausalis.computeSaltatoryConductionKinematics({ internodeDistanceMm: 1.5, conductionVelocityMetersPerSec: 60, elapsedTimeMs: 5 }).distanceTraveledMm, 300);
  const pIn = omnicausalis.computeKroghCylinderTissuePO2MmHg({ capillaryPO2MmHg: 95, capillaryRadiusUm: 3, tissueCylinderRadiusUm: 30, radialDistanceRUm: 5 });
  const pOut = omnicausalis.computeKroghCylinderTissuePO2MmHg({ capillaryPO2MmHg: 95, capillaryRadiusUm: 3, tissueCylinderRadiusUm: 30, radialDistanceRUm: 28 });
  assert.ok(pIn > pOut);
  assert.equal(omnicausalis.computeRenalNephronStarlingGfr({ glomerularCapillaryHydrostaticMmHg: 55, bowmanSpaceHydrostaticMmHg: 15, glomerularCapillaryOncoticMmHg: 30 }).gfrMlMin, 125);

  const j = omnicausalis.executeCompleteCardiovascularBodyExposurePrometheusJourney({ learnerId: "kelvin", cycleFraction0to1: 0.2, heartRateBpm: 72, edvMl: 120, esvMl: 50, sbpMmHg: 120, dbpMmHg: 80, assessmentGrade1to4: 4 });
  assert.equal(j.journeyStagesCompleted.length, 11);
  assert.equal(j.persistedLearningState.saved, true);
});
