import { strict as assert } from 'node:assert';
import {
  buildFhirBundleForSepsisCare,
  buildDicomWebPacsStudyMetadata,
  generatePanaceaLhidEnvelope,
  coupleAcwrRecoveryToClassPass,
  sha256Hex,
  generateDeterministicUuid,
  validateDicomUid,
  validatePacsEndpointUrl,
  queryDicomWebStudy,
  MISSING_OBSERVATION,
  type DicomWebStudyQueryResult,
} from '../../src/domains/clinical-operations/index.ts';

console.log('[TEST] Starting Downstream Hilirisasi FHIR/PACS & ACWR Bridge Test Suite...');

// ── 0. Cryptographic SHA-256 Test Vectors (NIST FIPS 180-4 Reference) ────────
{
  // Vector 1: Empty string
  assert.equal(
    sha256Hex(''),
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'NIST vector 1 (empty string) must match exact SHA-256 digest',
  );

  // Vector 2: "abc"
  assert.equal(
    sha256Hex('abc'),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    'NIST vector 2 ("abc") must match exact SHA-256 digest',
  );

  // Vector 3: "The quick brown fox jumps over the lazy dog"
  assert.equal(
    sha256Hex('The quick brown fox jumps over the lazy dog'),
    'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592',
    'NIST vector 3 must match exact SHA-256 digest',
  );

  console.log('✓ Case 0: Isomorphic FIPS 180-4 SHA-256 verified against published NIST test vectors');
}

// ── 1. Deterministic RFC 4122 UUID Format ─────────────────────────────────────
{
  const uuid = generateDeterministicUuid('patient-123:obs:lactate');
  const rfc4122Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  assert.ok(rfc4122Regex.test(uuid), `Generated UUID ${uuid} must conform to RFC 4122`);

  // Same seed produces identical UUID (deterministic)
  assert.equal(uuid, generateDeterministicUuid('patient-123:obs:lactate'));
  console.log('✓ Case 1: RFC 4122 compliant deterministic UUIDs verified');
}

// ── 2. FHIR Bundle Generation for Sepsis Care (SSC 2021 & 2026 Guidelines) ───
{
  const bundle = buildFhirBundleForSepsisCare({
    patientId: 'PT-ICU-8821',
    lactateMmolL: 4.2,
    meanArterialPressureMmhg: 58,
    antibioticAdministered: true,
    fluidResuscitationOrdered: true,
    fluidResuscitationAdministered: false, // Ordered but NOT yet finished!
    truthClass: 'OBSERVED_CLINICAL',
    timestampIso: '2026-11-02T15:00:00.000Z',
  });

  assert.equal(bundle.resourceType, 'Bundle');
  assert.equal(bundle.type, 'collection');
  assert.equal(bundle.total, 4); // 2 Observations (Lactate, MAP) + 1 CarePlan + 1 Provenance

  // Verify all entry fullUrls use valid urn:uuid:
  const uuidPattern = /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  for (const entry of bundle.entry) {
    assert.ok(uuidPattern.test(entry.fullUrl), `fullUrl ${entry.fullUrl} must be a valid urn:uuid`);
    assert.equal(entry.resource.id, entry.fullUrl.replace('urn:uuid:', ''), 'resource.id must match UUID in fullUrl');
  }

  // Observation 1: Lactate (LOINC 600-7)
  const obsLactate = bundle.entry.find(
    (e) => e.resource.resourceType === 'Observation' && (e.resource as any).code.coding[0].code === '600-7',
  );
  assert.ok(obsLactate, 'Lactate Observation must be present');
  assert.equal((obsLactate.resource as any).valueQuantity.value, 4.2);
  assert.equal((obsLactate.resource as any).interpretation[0].coding[0].code, 'CH'); // Critically High (>= 4.0)

  // Observation 2: Mean Arterial Pressure (LOINC 8478-0)
  const obsMap = bundle.entry.find(
    (e) => e.resource.resourceType === 'Observation' && (e.resource as any).code.coding[0].code === '8478-0',
  );
  assert.ok(obsMap, 'MAP Observation must be present');
  assert.equal((obsMap.resource as any).valueQuantity.value, 58);
  assert.equal((obsMap.resource as any).interpretation[0].coding[0].code, 'L'); // Low (< 65)

  // CarePlan & Action Completion Semantics
  const plan = bundle.entry.find((e) => e.resource.resourceType === 'CarePlan');
  assert.ok(plan, 'Sepsis CarePlan must be present');
  assert.equal((plan.resource as any).status, 'active');
  assert.equal((plan.resource as any).intent, 'plan');

  // CRITICAL AUDIT CHECK: An intervention that was merely ordered must NOT be represented as completed
  assert.equal((plan.resource as any).activity[0].detail.status, 'completed'); // Antibiotic was administered -> completed
  assert.equal((plan.resource as any).activity[1].detail.status, 'in-progress'); // Fluid was ordered, but NOT administered -> in-progress

  // Provenance Resource
  const prov = bundle.entry.find((e) => e.resource.resourceType === 'Provenance');
  assert.ok(prov, 'FHIR Provenance resource must be present');
  assert.equal((prov.resource as any).activity.coding[0].code, 'CREATE');

  console.log('✓ Case 2: HL7 FHIR Sepsis Care Bundle with valid RFC 4122 urn:uuid, MAP observation, and completion semantics verified');
}

// ── 3. Educational Simulation Truth-Class Guard ──────────────────────────────
{
  // A simulated educational case must NEVER generate clinically authorized orders
  const simulatedBundle = buildFhirBundleForSepsisCare({
    patientId: 'SIM-STUDENT-CASE-01',
    lactateMmolL: 3.5,
    meanArterialPressureMmhg: 62,
    antibioticAdministered: false,
    fluidResuscitationOrdered: true,
    truthClass: 'SIMULATED_EDUCATIONAL',
  });

  const plan = simulatedBundle.entry.find((e) => e.resource.resourceType === 'CarePlan');
  assert.ok(plan);
  assert.equal((plan.resource as any).status, 'draft', 'Educational simulation CarePlan must remain draft');
  assert.equal((plan.resource as any).intent, 'proposal', 'Educational simulation CarePlan intent must be proposal, not order');
  assert.ok(
    (plan.resource as any).category[0].text.includes('SIMULATED EDUCATIONAL CASE - NOT AUTHORIZED CLINICAL ACTION'),
    'Educational disclaimer must be prominently attached',
  );

  console.log('✓ Case 3: Educational simulation truth-class demarcation strictly prevents clinical authorization');
}

// ── 4. Fail-Closed Zero-Fabrication (Missing observations are omitted) ────────
{
  const bundleMissing = buildFhirBundleForSepsisCare({
    patientId: 'PT-ED-1049',
    lactateMmolL: MISSING_OBSERVATION,
    meanArterialPressureMmhg: MISSING_OBSERVATION,
    antibioticAdministered: false,
    fluidResuscitationOrdered: false,
  });

  const obsList = bundleMissing.entry.filter((e) => e.resource.resourceType === 'Observation');
  assert.equal(obsList.length, 0, 'Missing lactate and MAP must produce zero fabricated observation resources');
  assert.equal(bundleMissing.total, 2); // CarePlan + Provenance
  console.log('✓ Case 4: Zero-fabrication law enforced on missing clinical observations in FHIR');
}

// ── 5. DICOM UID Validation (PS3.5 Compliance) ───────────────────────────────
{
  // 5a. Valid UIDs
  assert.equal(validateDicomUid('1.2.840.10008.5.1.4.1.1.2').valid, true);
  assert.equal(validateDicomUid('2.16.840.1.113669.632.20.1211.1000035777').valid, true);
  assert.equal(validateDicomUid('0.1.2.3.4.5').valid, true);

  // 5b. Invalid UIDs (negative cases)
  assert.equal(validateDicomUid('').valid, false); // Empty
  assert.equal(validateDicomUid('3.1.2.3').valid, false); // Root must start with 0, 1, or 2
  assert.equal(validateDicomUid('1.2.840.01').valid, false); // Leading zero in component "01"
  assert.equal(validateDicomUid('1.2.840..1').valid, false); // Consecutive dots
  assert.equal(validateDicomUid('1.2.840.abc.1').valid, false); // Non-numeric
  assert.equal(validateDicomUid('1.' + '1.'.repeat(35)).valid, false); // Exceeds 64 chars

  console.log('✓ Case 5: DICOM PS3.5 UID format validation (positive and negative cases) verified');
}

// ── 6. PACS Endpoint Security & SSRF Protection ──────────────────────────────
{
  // 6a. Valid HTTPS hospital endpoints
  const validEndpoint = validatePacsEndpointUrl('https://pacs.panaceamed.id/dicom-web');
  assert.equal(validEndpoint.valid, true);
  assert.equal(validEndpoint.cleanUrl, 'https://pacs.panaceamed.id/dicom-web');

  // 6b. Block insecure HTTP in production
  assert.equal(validatePacsEndpointUrl('http://pacs.panaceamed.id/dicom-web').valid, false);

  // 6c. SSRF Cloud Metadata Block
  assert.equal(validatePacsEndpointUrl('https://169.254.169.254/latest/meta-data').valid, false);
  assert.equal(validatePacsEndpointUrl('https://metadata.google.internal/computeMetadata/v1').valid, false);

  // 6d. Private intranet block without dev authorization
  assert.equal(validatePacsEndpointUrl('https://192.168.1.50/pacs').valid, false);
  assert.equal(validatePacsEndpointUrl('https://10.0.0.1/pacs').valid, false);

  // 6e. Permitted local development when explicitly authorized
  const devLocal = validatePacsEndpointUrl('http://localhost:8042/dicom-web', { allowLocalDevServer: true });
  assert.equal(devLocal.valid, true);

  console.log('✓ Case 6: PACS endpoint HTTPS enforcement and SSRF cloud metadata protection verified');
}

// ── 7. DICOMweb Query/Retrieval Client & Cross-Patient Boundary Check ─────────
{
  const mockStudyJson = [
    {
      '0020000D': { vr: 'UI', Value: ['1.2.840.113619.2.55.3.60468842'] },
      '00100020': { vr: 'LO', Value: ['PT-AUTHORIZED-01'] },
      '00080060': { vr: 'CS', Value: ['CT'] },
    },
  ];

  // 7a. Successful query for authorized patient
  const mockFetchSuccess: typeof fetch = async () =>
    new Response(JSON.stringify(mockStudyJson), { status: 200, headers: { 'Content-Type': 'application/json' } });

  const querySuccess = await queryDicomWebStudy({
    pacsBaseUrl: 'http://localhost:8042/dicom-web',
    studyInstanceUid: '1.2.840.113619.2.55.3.60468842',
    authenticatedPatientId: 'PT-AUTHORIZED-01',
    allowLocalDevServer: true,
    fetchFn: mockFetchSuccess,
  });
  assert.equal(querySuccess.status, 'SUCCESS');
  assert.equal(querySuccess.modality, 'CT');

  // 7b. Cross-patient boundary breach protection (study belongs to another patient!)
  const queryCrossPatientBreach = await queryDicomWebStudy({
    pacsBaseUrl: 'http://localhost:8042/dicom-web',
    studyInstanceUid: '1.2.840.113619.2.55.3.60468842',
    authenticatedPatientId: 'PT-DIFFERENT-UNAUTHORIZED-99', // Mismatch!
    allowLocalDevServer: true,
    fetchFn: mockFetchSuccess,
  });
  assert.equal(queryCrossPatientBreach.status, 'FORBIDDEN');
  assert.ok(queryCrossPatientBreach.error?.includes('Cross-patient boundary breach'));

  // 7c. PACS server offline / network failure handling
  const mockFetchOffline: typeof fetch = async () => {
    throw new Error('ECONNREFUSED 127.0.0.1:8042');
  };
  const queryOffline = await queryDicomWebStudy({
    pacsBaseUrl: 'http://localhost:8042/dicom-web',
    studyInstanceUid: '1.2.840.113619.2.55.3.60468842',
    authenticatedPatientId: 'PT-AUTHORIZED-01',
    allowLocalDevServer: true,
    fetchFn: mockFetchOffline,
  });
  assert.equal(queryOffline.status, 'UNAVAILABLE');
  assert.ok(queryOffline.error?.includes('ECONNREFUSED'));

  console.log('✓ Case 7: DICOMweb client verified with cross-patient isolation and fail-closed network handling');
}

// ── 8. Longitudinal Healthspan ID (PANACEA-LHID) Cryptographic Envelope ─────
{
  const envelope = generatePanaceaLhidEnvelope({
    patientId: 'USER-DR-RIZKY-01',
    ageYears: 32,
    biologicalAgeYears: 27,
    truthClass: 'DERIVED_PHYSIOLOGICAL',
    isClinicallyReviewed: true,
    metadata: { phenoAgeBiomarkersCount: 9 },
    timestampIso: '2026-11-02T15:00:00.000Z',
  });

  // Verify genuine 64-character SHA-256 digest
  assert.equal(envelope.cryptographicSha256.length, 64, 'cryptographicSha256 must be a full 64-character hex digest');
  assert.ok(/^[0-9a-f]{64}$/.test(envelope.cryptographicSha256), 'digest must be valid lowercase hexadecimal');

  // Verify Privacy Guarantee: Raw patient identifier USER-DR-RIZKY-01 is NOT leaked in the public LHID
  assert.equal(
    envelope.lhid.includes('USER-DR-RIZKY'),
    false,
    'Public LHID must never leak raw patient identifier strings',
  );
  assert.ok(envelope.lhid.startsWith('LHID-'));
  assert.ok(envelope.didUri.startsWith('did:panacea:lhid:'));
  assert.equal(envelope.truthClass, 'DERIVED_PHYSIOLOGICAL');
  assert.equal(envelope.isClinicallyReviewed, true);
  assert.equal(envelope.payload.biologicalAge, 27);

  console.log('✓ Case 8: PANACEA-LHID generated with genuine 64-character SHA-256 and zero patient ID leakage');
}

// ── 9. Gabbett BJSM 2016 ACWR & Autonomic Recovery Match with ClassPass Drop-ins
{
  // 9a. Acute Injury Danger Zone (ACWR = 1.62 > 1.50)
  const danger = coupleAcwrRecoveryToClassPass({
    acuteChronicWorkloadRatio: 1.62,
    autonomicRecoveryPercent: 78,
  });
  assert.equal(danger.riskZone, 'HIGH_INJURY_SPIKE');
  assert.equal(danger.maxRecommendedSessionIntensity, 'LOW_RECOVERY_ONLY');
  assert.ok(danger.recommendedClassPassDropins.some((d) => d.includes('Contrast Therapy')));
  assert.ok(danger.clinicalSafetyMessage.includes('ACWR 1.62 > 1.50'));

  // 9b. Optimal Performance Sweet Spot (ACWR = 1.12, Recovery = 85%)
  const optimal = coupleAcwrRecoveryToClassPass({
    acuteChronicWorkloadRatio: 1.12,
    autonomicRecoveryPercent: 85,
  });
  assert.equal(optimal.riskZone, 'OPTIMAL_SWEET_SPOT');
  assert.equal(optimal.maxRecommendedSessionIntensity, 'HIGH');
  assert.ok(optimal.recommendedClassPassDropins.some((d) => d.includes('Americano Padel Tournament')));

  // 9c. Blunted Autonomic Recovery (Recovery = 25% < 35%)
  const fatigued = coupleAcwrRecoveryToClassPass({
    acuteChronicWorkloadRatio: 1.05,
    autonomicRecoveryPercent: 25,
  });
  assert.equal(fatigued.riskZone, 'OVERTRAINING_FATIGUE');
  assert.equal(fatigued.maxRecommendedSessionIntensity, 'LOW_RECOVERY_ONLY');

  // 9d. Under-training zone (ACWR = 0.60 < 0.80)
  const undertrained = coupleAcwrRecoveryToClassPass({
    acuteChronicWorkloadRatio: 0.60,
    autonomicRecoveryPercent: 70,
  });
  assert.equal(undertrained.riskZone, 'UNDERTRAINING');
  assert.equal(undertrained.maxRecommendedSessionIntensity, 'MODERATE');
  assert.ok(undertrained.recommendedClassPassDropins.some((d) => d.includes('Aerobic Base Building')));

  console.log('✓ Case 9: Gabbett ACWR & autonomic recovery recommendation engine verified across all 4 zones');
}

console.log('ALL DOWNSTREAM HILIRISASI FHIR/PACS TESTS PASSED GREEN (10/10).');
