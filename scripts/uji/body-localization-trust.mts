import assert from 'node:assert/strict';
import {
  evaluateBodyLocalizationTrust,
  type BodyLocalizationTrustRecord,
} from '../../src/lib/bodyLocalizationTrust.ts';
import type { BodyTargetTrustRecord } from '../../src/lib/bodyTargetTrust.ts';

const verifiedTarget: BodyTargetTrustRecord = {
  targetId: 'fixture:lung',
  geometryStatus: 'verified-source-geometry',
  evidenceStatus: 'verified',
  sourceIdentity: {
    sourceId: 'fixture-source',
    assetId: 'fixture-lung-asset',
    revision: 'fixture-revision',
    licenseId: 'fixture-license',
    attribution: 'fixture attribution',
    transformationHistoryId: 'fixture-transform-history',
  },
  academicReviewStatus: 'qualified-review-recorded',
  aiAssisted: true,
};

const sourceMapping = {
  mappingId: 'fixture-mapping',
  sourceId: 'fixture-literature-source',
  sourceVersion: 'fixture-version',
  sourceLocator: 'fixture://mapping',
  targetId: verifiedTarget.targetId,
  attribution: 'fixture mapping attribution',
};

const genericReference: BodyLocalizationTrustRecord = {
  localizationId: 'fixture:disease-reference',
  kind: 'disease-reference',
  origin: 'curated-reference-mapping',
  evidenceStatus: 'provenance-bearing',
  sourceMapping,
  measuredEvidence: null,
  targetTrust: verifiedTarget,
};

const genericDecision = evaluateBodyLocalizationTrust(genericReference);
assert.equal(genericDecision.genericReferenceLocalizationAllowed, true);
assert.equal(genericDecision.measuredPatientLocalizationAllowed, false);
assert.equal(genericDecision.verifiedAnatomyTargetAllowed, true);
assert.deepEqual(genericDecision.blockers, []);

const textInferred = evaluateBodyLocalizationTrust({
  ...genericReference,
  localizationId: 'fixture:text-inferred-lesion',
  kind: 'measured-patient-lesion',
  origin: 'text-inference',
});
assert.equal(textInferred.genericReferenceLocalizationAllowed, false);
assert.equal(textInferred.measuredPatientLocalizationAllowed, false);
assert.ok(textInferred.blockers.includes('localization-origin:text-inference-prohibited'));
assert.ok(textInferred.blockers.includes('patient-localization:measured-data-required'));

const measuredPatient = evaluateBodyLocalizationTrust({
  ...genericReference,
  localizationId: 'fixture:measured-lesion',
  kind: 'measured-patient-lesion',
  origin: 'measured-patient-data',
  measuredEvidence: {
    measurementId: 'fixture-study-series',
    modality: 'fixture-imaging-modality',
    acquiredAt: '2026-01-01T00:00:00Z',
    sourceId: 'fixture-imaging-source',
  },
});
assert.equal(measuredPatient.genericReferenceLocalizationAllowed, false);
assert.equal(measuredPatient.measuredPatientLocalizationAllowed, true);

const missingMapping = evaluateBodyLocalizationTrust({
  ...genericReference,
  localizationId: 'fixture:missing-provenance',
  sourceMapping: { ...sourceMapping, sourceVersion: '   ' },
});
assert.equal(missingMapping.genericReferenceLocalizationAllowed, false);
assert.ok(missingMapping.blockers.includes('localization-source-mapping:incomplete'));

const unverifiedEvidence = evaluateBodyLocalizationTrust({
  ...genericReference,
  localizationId: 'fixture:verification-required',
  evidenceStatus: 'verification-required',
});
assert.equal(unverifiedEvidence.genericReferenceLocalizationAllowed, false);
assert.ok(unverifiedEvidence.blockers.includes('localization-evidence:verification-required'));

const referenceOnlyTarget = evaluateBodyLocalizationTrust({
  ...genericReference,
  localizationId: 'fixture:reference-target',
  targetTrust: {
    ...verifiedTarget,
    geometryStatus: 'reference-only',
    evidenceStatus: 'reference-only',
    academicReviewStatus: 'pending',
  },
});
assert.equal(referenceOnlyTarget.genericReferenceLocalizationAllowed, true);
assert.equal(referenceOnlyTarget.verifiedAnatomyTargetAllowed, false);

const blockedTarget = evaluateBodyLocalizationTrust({
  ...genericReference,
  localizationId: 'fixture:blocked-target',
  targetTrust: {
    ...verifiedTarget,
    geometryStatus: 'blocked',
  },
});
assert.equal(blockedTarget.genericReferenceLocalizationAllowed, false);
assert.equal(blockedTarget.measuredPatientLocalizationAllowed, false);
assert.ok(blockedTarget.blockers.includes('target:reference-display-blocked'));

console.log('body-localization-trust: ok');
