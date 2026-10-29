import assert from 'node:assert/strict'
import test from 'node:test'
import { processLabDocumentWithPaddleOcr } from '../../src/domains/ai-gateway/chinaFrontierGateway.ts'

test('Directive 026 Positive Control: Real PaddleOCR lab document import workflow succeeds with untrusted draft state', () => {
  const result = processLabDocumentWithPaddleOcr({
    documentId: 'DOC-LAB-992',
    rawText: 'Hemoglobin: 14.2 g/dL (13.0 - 17.0)',
    pageNumber: 1,
    sourceUri: 's3://panacea-lab-vault/doc-992.pdf',
    patientPiiPresent: false
  });

  assert.equal(result.securityCheckPassed, true);
  assert.equal(result.isUntrustedDraft, true);
  assert.equal(result.requiresUserConfirmation, true);
  assert.equal(result.extractedFields.length, 1);
  assert.equal(result.extractedFields[0].parameterName, 'Hemoglobin');
  assert.equal(result.provenance.pageNumber, 1);
  console.log('✅ Directive 026 Positive Control Passed:', result);
});

test('Directive 026 Negative Control: PII in OCR payload fails closed under UU PDP privacy guardrail', () => {
  const result = processLabDocumentWithPaddleOcr({
    documentId: 'DOC-LAB-993',
    rawText: 'Nama: Budi Santoso, NIK: 317405...',
    pageNumber: 1,
    sourceUri: 's3://panacea-lab-vault/doc-993.pdf',
    patientPiiPresent: true
  });

  assert.equal(result.securityCheckPassed, false);
  assert.match(result.rejectionReason, /UU_PDP_VIOLATION/);
  assert.equal(result.extractedFields.length, 0);
  console.log('✅ Directive 026 Negative Control Passed (Fail-closed verified):', result);
});
