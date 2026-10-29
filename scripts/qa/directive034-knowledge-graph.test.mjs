import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateSemanticConceptMapping } from '../../src/domains/knowledge-graph/biomedicalKnowledgeGraphEngine.ts'

test('Knowledge Graph Positive Control: Successfully normalizes SNOMED CT clinical concept', () => {
  const result = evaluateSemanticConceptMapping({
    sourceTerm: 'Essential Hypertension',
    codingSystem: 'SNOMED_CT',
    rawCode: '38341003'
  });

  assert.equal(result.isClinicallyAuthoritative, false);
  assert.equal(result.normalizationStatus, 'NORMALIZED_VERIFIED');
  assert.ok(result.associatedBiomarkers.length > 0);
  console.log('✅ Knowledge Graph Positive Control Passed:', result);
});

test('Knowledge Graph Negative Control: Flags unverified LOINC placeholder for manual semantic review', () => {
  const result = evaluateSemanticConceptMapping({
    sourceTerm: 'Experimental Assay',
    codingSystem: 'LOINC',
    rawCode: 'LP-TEST-999'
  });

  assert.equal(result.normalizationStatus, 'REQUIRES_SEMANTIC_REVIEW');
  assert.match(result.targetCanonicalUri, /loinc\/lp-test-999/);
  console.log('✅ Knowledge Graph Negative Control Passed:', result);
});
