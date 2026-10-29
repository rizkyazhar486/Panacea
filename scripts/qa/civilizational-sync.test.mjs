import assert from 'node:assert/strict'
import test from 'node:test'
import { verifyCivilizationalNode, synthesizeGlobalHealthMetrics } from '../../src/domains/scientific-research/model/panaceaCivilizationalSync.ts'

test('Civilizational Sync Core successfully validates and synthesizes multi-domain knowledge nodes', () => {
  const sampleNodes = [
    {
      conceptId: 'PAR-QUANTUM-01',
      domain: 'PHYSICS' as const,
      epistemicProvenance: ['PMID:30129481', 'DOI:10.1038/s41587-021'],
      structuralIntegrityScore: 0.96
    },
    {
      conceptId: 'PAR-PHYSIO-02',
      domain: 'PHYSIOLOGY' as const,
      epistemicProvenance: ['PMID:28491022'],
      structuralIntegrityScore: 0.91
    }
  ]

  for (const node of sampleNodes) {
    assert.ok(verifyCivilizationalNode(node), `Node ${node.conceptId} must be valid`)
  }

  const metrics = synthesizeGlobalHealthMetrics(sampleNodes)
  assert.equal(metrics.totalSynthesizedConcepts, 2)
  assert.equal(metrics.systemStatus, 'SINGULARITY_STABLE')
  console.log('✅ Civilizational Synchronization Metrics Verified:', metrics)
})
