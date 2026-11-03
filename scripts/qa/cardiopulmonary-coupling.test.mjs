import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateCardiopulmonaryCoupling,
  CARDIOPULMONARY_SCENARIO_PRESETS,
  CARDIOPULMONARY_DISCLAIMER,
} from '../../src/domains/body-exposure/engine/cardiopulmonaryCouplingEngine.ts';

describe('Cardiopulmonary Coupling Engine (BX-Pillar-V)', () => {
  it('evaluates normative rest baseline correctly and satisfies physiological bounds', () => {
    const input = CARDIOPULMONARY_SCENARIO_PRESETS.normative_rest;
    const result = evaluateCardiopulmonaryCoupling(input, 'normative_rest');

    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.equal(result.truthClass, 'mechanistic_simulation_proxy');
    assert.equal(result.disclaimer, CARDIOPULMONARY_DISCLAIMER);
    assert.equal(result.scenario, 'normative_rest');

    // SV = 120 - 50 = 70 mL
    assert.equal(result.strokeVolumeMl, 70);
    // EF = 70 / 120 ~ 58.33%
    assert.ok(result.ejectionFractionPct > 55 && result.ejectionFractionPct < 62);
    // CO = 72 * 70 / 1000 = 5.04 L/min
    assert.equal(result.cardiacOutputLMin, 5.04);
    // Pes = 2.2 * (50 - 10) = 88 mmHg
    assert.equal(result.endSystolicPressureMmHg, 88);
    // Ea = 88 / 70 ~ 1.257 mmHg/mL
    assert.ok(result.arterialElastanceMmHgPerMl > 1.2 && result.arterialElastanceMmHgPerMl < 1.3);
    // VAC = Ea / Ees = 1.257 / 2.2 ~ 0.57 - near optimal
    assert.ok(result.vacRatio > 0.5 && result.vacRatio < 1.0);

    // Alveolar ventilation = 14 * (500 - 150) / 1000 = 4.9 L/min
    assert.equal(result.alveolarVentilationLMin, 4.9);
    // Global V/Q = 4.9 / 5.04 ~ 0.97 (healthy matched)
    assert.ok(result.vqRatio > 0.85 && result.vqRatio < 1.15);
    assert.equal(result.vqStatus, 'matched');

    // Oxygen delivery > 800 mL/min
    assert.ok(result.do2MlMin > 800 && result.do2MlMin < 1200);

    // PV loop coordinates has 6 discrete cycle vertices
    assert.equal(result.pvCoordinates.length, 6);
  });

  it('correctly models HFrEF systolic failure: depressed Ees, severe VAC uncoupling, and low EF', () => {
    const input = CARDIOPULMONARY_SCENARIO_PRESETS.hfref_systolic_failure;
    const result = evaluateCardiopulmonaryCoupling(input, 'hfref_systolic_failure');

    assert.equal(result.ok, true);
    if (!result.ok) return;

    // EF ~ 23.08%
    assert.ok(result.ejectionFractionPct < 35, 'EF must be severely depressed in HFrEF');
    // Ees is 0.85 mmHg/mL, Ea is high, VAC should exceed 1.2 (excess afterload uncoupled)
    assert.ok(result.vacRatio > 1.2, 'VAC must show severe afterload uncoupling in HFrEF');
    assert.equal(result.vacStatus, 'excess_afterload_uncoupled');
    // Elevated wall stress due to ventricular dilation and thinner wall
    assert.ok(result.peakWallStressKPa > 15, 'Peak wall stress elevated in dilated LV');
  });

  it('correctly models acute pulmonary embolism with high dead-space regime', () => {
    const input = CARDIOPULMONARY_SCENARIO_PRESETS.acute_pulmonary_embolism;
    const result = evaluateCardiopulmonaryCoupling(input, 'acute_pulmonary_embolism');

    assert.equal(result.ok, true);
    if (!result.ok) return;

    // Stroke volume is low due to RV failure and reduced LV preload
    assert.ok(result.strokeVolumeMl < 40);
    // High dead space regime because VD is elevated and cardiac output is low
    assert.equal(result.vqStatus, 'high_dead_space');
  });

  it('fails closed on invalid physical parameters', () => {
    // Ves >= Ved
    const invalidVes = evaluateCardiopulmonaryCoupling({
      ...CARDIOPULMONARY_SCENARIO_PRESETS.normative_rest,
      vesMl: 130,
      vedMl: 120,
    });
    assert.equal(invalidVes.ok, false);
    if (!invalidVes.ok) {
      assert.match(invalidVes.error, /End-systolic volume .* strictly lower/);
    }

    // Tidal volume <= Dead space
    const invalidVt = evaluateCardiopulmonaryCoupling({
      ...CARDIOPULMONARY_SCENARIO_PRESETS.normative_rest,
      tidalVolumeMl: 140,
      deadSpaceMl: 150,
    });
    assert.equal(invalidVt.ok, false);
    if (!invalidVt.ok) {
      assert.match(invalidVt.error, /Tidal volume .* must exceed anatomical dead space/);
    }

    // Negative / NaN inputs
    const invalidNegative = evaluateCardiopulmonaryCoupling({
      ...CARDIOPULMONARY_SCENARIO_PRESETS.normative_rest,
      eesMmHgPerMl: -1.5,
    });
    assert.equal(invalidNegative.ok, false);
  });
});
