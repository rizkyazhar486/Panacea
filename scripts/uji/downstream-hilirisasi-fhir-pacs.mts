import { strict as assert } from 'node:assert';
import {
  buildFhirBundleForSepsisCare,
  buildDicomWebPacsStudyMetadata,
  generatePanaceaLhidEnvelope,
  coupleAcwrRecoveryToClassPass,
  MISSING_OBSERVATION,
} from '../../src/domains/clinical-operations/index.ts';

console.log('[TEST] Starting Downstream Hilirisasi FHIR/PACS & ACWR Bridge Test Suite...');

// 1. FHIR Bundle Generation for Sepsis Care (Surviving Sepsis Campaign 2021)
{
  const bundle = buildFhirBundleForSepsisCare({
    patientId: 'PT-ICU-8821',
    lactateMmolL: 4.2,
    meanArterialPressureMmhg: 58,
    antibioticAdministered: true,
    fluidResuscitationOrdered: false,
    truthClass: 'OBSERVED_CLINICAL',
  });

  assert.equal(bundle.resourceType, 'Bundle');
  assert.equal(bundle.type, 'collection');
  assert.equal(bundle.total, 2); // 1 Observation + 1 CarePlan

  const obs = bundle.entry.find((e) => e.resource.resourceType === 'Observation');
  assert.ok(obs, 'Lactate Observation must be present');
  assert.equal((obs.resource as any).code.coding[0].code, '600-7');
  assert.equal((obs.resource as any).code.coding[0].system, 'http://loinc.org');
  assert.equal((obs.resource as any).valueQuantity.value, 4.2);
  assert.equal((obs.resource as any).interpretation[0].coding[0].code, 'CH'); // Critically High

  const plan = bundle.entry.find((e) => e.resource.resourceType === 'CarePlan');
  assert.ok(plan, 'Sepsis CarePlan must be present');
  assert.equal((plan.resource as any).status, 'active');
  assert.equal((plan.resource as any).category[0].coding[0].code, '91302008'); // SNOMED Sepsis
  assert.equal((plan.resource as any).activity[0].detail.status, 'completed'); // Antibiotics completed
  assert.equal((plan.resource as any).activity[1].detail.status, 'not-started'); // Fluids pending
  console.log('✓ Case 1: HL7 FHIR Sepsis Care Bundle generated with standard LOINC and SNOMED codes');
}

// 2. Fail-Closed Zero-Fabrication (Missing Lactate remains missing, not zero)
{
  const bundleMissing = buildFhirBundleForSepsisCare({
    patientId: 'PT-ED-1049',
    lactateMmolL: MISSING_OBSERVATION,
    antibioticAdministered: false,
    fluidResuscitationOrdered: true,
  });

  const obs = bundleMissing.entry.find((e) => e.resource.resourceType === 'Observation');
  assert.equal(obs, undefined, 'Missing lactate must never fabricate an observation of 0.0 mmol/L');
  assert.equal(bundleMissing.total, 1); // Only CarePlan
  console.log('✓ Case 2: Zero-fabrication law enforced on missing clinical observations in FHIR');
}

// 3. DICOMweb PACS Study Metadata Serialization (KaloLumen 3-Layer CT/MRI)
{
  const pacs = buildDicomWebPacsStudyMetadata({
    studyInstanceUid: '1.2.840.113619.2.55.3.60468842',
    seriesInstanceUid: '1.2.840.113619.2.55.3.60468842.1901',
    patientId: 'PATIENT-CARDIAC-CT-09',
    modality: 'CT',
    pacsBaseUrl: 'https://pacs.panaceamed.id/dicom-web/',
    truthClass: 'OBSERVED_CLINICAL',
  });

  assert.equal(pacs.sopClassUid, '1.2.840.10008.5.1.4.1.1.2'); // CT Image Storage
  assert.equal(pacs.modality, 'CT');
  assert.ok(pacs.wadoRsUrl.includes('/studies/1.2.840.113619.2.55.3.60468842/series/'));
  assert.ok(pacs.qidoRsUrl.includes('StudyInstanceUID=1.2.840.113619.2.55.3.60468842'));
  assert.deepEqual(pacs.hounsfieldLayers.myocardiumRange, [40, 180]);
  assert.deepEqual(pacs.hounsfieldLayers.boneRange, [300, 1500]);
  console.log('✓ Case 3: DICOMweb WADO-RS & QIDO-RS metadata and Hounsfield unit layering valid');
}

// 4. Longitudinal Healthspan ID (PANACEA-LHID) Cryptographic Envelope
{
  const envelope = generatePanaceaLhidEnvelope({
    patientId: 'USER-DR-RIZKY-01',
    ageYears: 32,
    biologicalAgeYears: 27,
    truthClass: 'DERIVED_PHYSIOLOGICAL',
    isClinicallyReviewed: true,
    metadata: { phenoAgeBiomarkersCount: 9 },
  });

  assert.ok(envelope.lhid.startsWith('LHID-USER-D-'));
  assert.ok(envelope.didUri.startsWith('did:panacea:lhid:'));
  assert.equal(envelope.truthClass, 'DERIVED_PHYSIOLOGICAL');
  assert.equal(envelope.isClinicallyReviewed, true);
  assert.equal(envelope.payload.biologicalAge, 27);
  console.log('✓ Case 4: PANACEA-LHID generated with immutable DID and cryptographic fingerprint');
}

// 5. Gabbett BJSM 2016 ACWR & Autonomic Recovery Match with ClassPass Drop-ins
{
  // 5a. Acute Injury Danger Zone (ACWR = 1.62 > 1.50)
  const danger = coupleAcwrRecoveryToClassPass({
    acuteChronicWorkloadRatio: 1.62,
    autonomicRecoveryPercent: 78,
  });
  assert.equal(danger.riskZone, 'HIGH_INJURY_SPIKE');
  assert.equal(danger.maxRecommendedSessionIntensity, 'LOW_RECOVERY_ONLY');
  assert.ok(danger.recommendedClassPassDropins.some((d) => d.includes('Contrast Therapy')));
  assert.ok(danger.clinicalSafetyMessage.includes('ACWR 1.62 > 1.50'));

  // 5b. Optimal Performance Sweet Spot (ACWR = 1.12, Recovery = 85%)
  const optimal = coupleAcwrRecoveryToClassPass({
    acuteChronicWorkloadRatio: 1.12,
    autonomicRecoveryPercent: 85,
  });
  assert.equal(optimal.riskZone, 'OPTIMAL_SWEET_SPOT');
  assert.equal(optimal.maxRecommendedSessionIntensity, 'HIGH');
  assert.ok(optimal.recommendedClassPassDropins.some((d) => d.includes('Americano Padel Tournament')));

  // 5c. Blunted Autonomic Recovery (Recovery = 25% < 35%)
  const fatigued = coupleAcwrRecoveryToClassPass({
    acuteChronicWorkloadRatio: 1.05,
    autonomicRecoveryPercent: 25,
  });
  assert.equal(fatigued.riskZone, 'OVERTRAINING_FATIGUE');
  assert.equal(fatigued.maxRecommendedSessionIntensity, 'LOW_RECOVERY_ONLY');

  // 5d. Under-training zone (ACWR = 0.60 < 0.80)
  const undertrained = coupleAcwrRecoveryToClassPass({
    acuteChronicWorkloadRatio: 0.60,
    autonomicRecoveryPercent: 70,
  });
  assert.equal(undertrained.riskZone, 'UNDERTRAINING');
  assert.equal(undertrained.maxRecommendedSessionIntensity, 'MODERATE');
  assert.ok(undertrained.recommendedClassPassDropins.some((d) => d.includes('Aerobic Base Building')));

  console.log('✓ Case 5: Gabbett ACWR & autonomic recovery recommendation engine verified across all 4 zones');
}

console.log('ALL DOWNSTREAM HILIRISASI FHIR/PACS TESTS PASSED GREEN (5/5).');
