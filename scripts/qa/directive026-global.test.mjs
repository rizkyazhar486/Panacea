import assert from 'node:assert/strict'
import test from 'node:test'
import { queryGlobalRegistry } from '../../src/domains/global-registry/globalTechRegistry.ts'
import { executeGlobalOcrPipeline } from '../../src/domains/ai-gateway/globalAiGateway.ts'

test('Global Registry: Successfully queries technologies across multiple countries', () => {
  const chinaTechs = queryGlobalRegistry('China');
  assert.ok(chinaTechs.length > 0);
  assert.equal(chinaTechs[0].technologyName, 'PaddleOCR-VL');

  const swissTechs = queryGlobalRegistry('Switzerland');
  assert.equal(swissTechs.length, 1);
  assert.equal(swissTechs[0].country, 'Switzerland');
  console.log('✅ Global Technology Intelligence Registry verified.');
});

test('Global AI Gateway Positive Control: OCR pipeline extracts structured lab data with provenance and untrusted draft flag', () => {
  const result = executeGlobalOcrPipeline({
    documentId: 'DOC-GLOBAL-001',
    rawText: 'Hemoglobin: 14.2 g/dL, Leukocytes: 7800 /uL',
    pageNumber: 1,
    sourceUri: 's3://panacea-indo-vault/lab-001.pdf',
    patientPiiPresent: false
  }, 'PaddleOCR-VL');

  assert.equal(result.securityCheckPassed, true);
  assert.equal(result.isUntrustedDraft, true);
  assert.equal(result.requiresUserConfirmation, true);
  assert.equal(result.extractedFields.length, 2);
  assert.equal(result.extractedFields[0].parameterName, 'Hemoglobin');
  assert.ok(result.cer < 0.05);
  assert.ok(result.wer < 0.05);
  console.log('✅ Global AI Gateway Positive Control Passed:', result);
});

test('Global AI Gateway Negative Control: UU PDP Privacy Filter blocks payload containing unapproved PII', () => {
  const result = executeGlobalOcrPipeline({
    documentId: 'DOC-GLOBAL-002',
    rawText: 'Pasien: Ny. Siti, NIK: 327301...',
    pageNumber: 1,
    sourceUri: 's3://panacea-indo-vault/lab-002.pdf',
    patientPiiPresent: true
  }, 'PaddleOCR-VL');

  assert.equal(result.securityCheckPassed, false);
  assert.match(result.rejectionReason, /UU_PDP_VIOLATION/);
  assert.equal(result.extractedFields.length, 0);
  console.log('✅ Global AI Gateway Negative Control (UU PDP Privacy Gate) Passed.');
});
