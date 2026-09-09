import assert from 'node:assert/strict'
import { INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT } from '../../src/lib/anatomySourceNodeRegistry.ts'
import {
  RESPIRATORY_SOURCE_LOOKUPS,
  assessRespiratorySourceCoverage,
  respiratoryMissingStructureIds,
} from '../../src/lib/anatomy/respiratoryAtlasGap.ts'
import { RESPIRATORY_ATLAS_STRUCTURES } from '../../src/lib/anatomy/respiratoryAtlasContract.ts'

const report = assessRespiratorySourceCoverage(INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT)

assert.equal(report.total, RESPIRATORY_ATLAS_STRUCTURES.length)
assert.equal(report.present + report.missing + report.referenceOnly, report.total)
assert.equal(new Set(RESPIRATORY_SOURCE_LOOKUPS.map((lookup) => lookup.structureId)).size, RESPIRATORY_SOURCE_LOOKUPS.length)

for (const entry of report.entries) {
  if (entry.coverage === 'source-node-present') {
    assert.ok(entry.exactSourceNames.length > 0, `${entry.structureId} cannot be present without exact source-node names.`)
    assert.ok(entry.matches.length > 0, `${entry.structureId} cannot be present without resolver evidence.`)
  }

  if (entry.coverage === 'source-node-missing') {
    assert.deepEqual(entry.exactSourceNames, [], `${entry.structureId} missing status must not retain fabricated source names.`)
    assert.match(entry.reason, /No matching source node|No reviewed source-node lookup/i)
  }

  if (entry.coverage === 'reference-only') {
    assert.deepEqual(entry.exactSourceNames, [])
    assert.equal(entry.expectedFile, null)
  }
}

const missing = respiratoryMissingStructureIds(report)
assert.deepEqual(missing, [...missing].sort((a, b) => {
  const ai = report.entries.findIndex((entry) => entry.structureId === a)
  const bi = report.entries.findIndex((entry) => entry.structureId === b)
  return ai - bi
}))

console.log(JSON.stringify({
  respiratoryAtlasSourceGap: {
    present: report.present,
    missing: report.missing,
    referenceOnly: report.referenceOnly,
    total: report.total,
    missingStructureIds: missing,
  },
}, null, 2))
