import assert from 'node:assert/strict';
import {
  RESPIRATORY_EVIDENCE_REFERENCES,
  RESPIRATORY_ILLUSTRATIVE_INPUTS,
  RESPIRATORY_MODEL_BOUNDARY,
  RESPIRATORY_PHASES,
  calculateRespiratoryTeachingMetrics,
  normalizeRespiratoryTeachingInputs,
  respiratoryPhaseById,
} from '../../src/lib/respiratoryAtlas.ts';

const baseline = calculateRespiratoryTeachingMetrics(RESPIRATORY_ILLUSTRATIVE_INPUTS);
assert.equal(baseline.minuteVentilationLMin, 6);
assert.equal(baseline.alveolarVentilationLMin, 4.2);
assert.equal(baseline.deadSpaceVentilationLMin, 1.8);
assert.equal(baseline.alveolarFractionPct, 70);

const bounded = normalizeRespiratoryTeachingInputs({
  respiratoryRatePerMin: Number.POSITIVE_INFINITY,
  tidalVolumeMl: -20,
  deadSpaceMl: 9999,
});
assert.equal(bounded.respiratoryRatePerMin, 12);
assert.equal(bounded.tidalVolumeMl, 150);
assert.equal(bounded.deadSpaceMl, 150);

const zeroAlveolar = calculateRespiratoryTeachingMetrics({
  respiratoryRatePerMin: 40,
  tidalVolumeMl: 150,
  deadSpaceMl: 500,
});
assert.equal(zeroAlveolar.alveolarVentilationLMin, 0);
assert.equal(zeroAlveolar.alveolarFractionPct, 0);
assert.ok(zeroAlveolar.minuteVentilationLMin >= zeroAlveolar.deadSpaceVentilationLMin);

assert.equal(RESPIRATORY_PHASES.length, 4);
assert.deepEqual(
  RESPIRATORY_PHASES.map((phase) => phase.cyclePosition),
  [0, 0.25, 0.5, 0.75],
);
assert.equal(new Set(RESPIRATORY_PHASES.map((phase) => phase.id)).size, 4);
for (const phase of RESPIRATORY_PHASES) {
  assert.ok(phase.schematic.thoracicExpansionSignal >= 0 && phase.schematic.thoracicExpansionSignal <= 1);
  assert.ok(phase.schematic.diaphragmDescentSignal >= 0 && phase.schematic.diaphragmDescentSignal <= 1);
  assert.ok([-1, 0, 1].includes(phase.schematic.airflowDirection));
  assert.ok(phase.disclosure.length > 30);
}
assert.equal(respiratoryPhaseById('inspiration').schematic.airflowDirection, 1);
assert.equal(respiratoryPhaseById('passive-expiration').schematic.airflowDirection, -1);
assert.equal(respiratoryPhaseById('end-inspiration').schematic.airflowDirection, 0);

assert.ok(RESPIRATORY_EVIDENCE_REFERENCES.some((source) => source.id === 'pmid:25428856'));
assert.ok(RESPIRATORY_EVIDENCE_REFERENCES.some((source) => source.id === 'pmid:34289982'));
assert.match(RESPIRATORY_MODEL_BOUNDARY, /illustrative engineering values/i);
assert.match(RESPIRATORY_MODEL_BOUNDARY, /not normal ranges or patient measurements/i);
assert.match(RESPIRATORY_MODEL_BOUNDARY, /dimensionless/i);
assert.match(RESPIRATORY_MODEL_BOUNDARY, /pressure, compliance, resistance, force/i);
assert.match(RESPIRATORY_MODEL_BOUNDARY, /source anatomy must remain geometrically unchanged/i);

console.log('respiratory-atlas: deterministic teaching-model invariants verified');
