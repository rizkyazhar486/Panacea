// One control and one number for the whole-body simulation on the atlas stage: pick a state, see the body light up,
// read the cardiac output. Everything shown is computed by lib/bodySim; nothing here is a measurement of the viewer.

import type { BodyMotionResult } from '../../engine/body-motion/bodyMotion.ts'
import { MOTION_SCENARIOS } from '../../engine/body-motion/bodyMotion.ts'
import { TONE, TOUCH, glass } from './stageTokens'

export interface SimulationDialProps {
  scenario: string
  onScenario: (key: string) => void
  running: boolean
  /** The viewer paused the light itself because this device could not keep up. */
  stalled?: boolean
  onToggle: () => void
  result: BodyMotionResult
  compact: boolean
  /** The lit organs (heart, lungs, kidneys, great vessels) are not on the stage at the current depth. */
  insideHidden: boolean
  onSeeInside: () => void
}

const fixed = (v: number, digits: number) => v.toFixed(digits)

export function SimulationDial({ scenario, onScenario, running, stalled = false, onToggle, result, compact, insideHidden, onSeeInside }: SimulationDialProps) {
  return (
    <div
      role="group"
      aria-label="Whole-body simulation"
      data-sim-dial={result.ok ? result.scenarioKey : 'unavailable'}
      style={{ ...glass, borderRadius: 14, padding: compact ? '6px 8px' : '10px 12px', display: 'flex', alignItems: 'center', gap: compact ? 8 : 12, flexWrap: 'wrap', maxWidth: '100%' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: TONE.sim }}>Simulated</span>
        <select
          aria-label="Simulation scenario"
          value={scenario}
          onChange={(e) => onScenario(e.target.value)}
          style={{ minHeight: TOUCH, maxWidth: compact ? 150 : 200, background: TONE.panelSolid, color: TONE.text, border: `1px solid ${TONE.lineStrong}`, borderRadius: 10, padding: '0 8px', fontSize: 13, fontWeight: 700 }}
        >
          {MOTION_SCENARIOS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      {result.ok ? (
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }} data-sim-readout>
          <span style={{ fontVariantNumeric: 'tabular-nums', color: TONE.text, fontWeight: 800, fontSize: compact ? 20 : 30, lineHeight: 1 }}>
            {fixed(result.readout.cardiacOutputLMin, 1)}
            <span style={{ fontSize: compact ? 11 : 13, fontWeight: 700, color: TONE.dim }}> L/min</span>
          </span>
          <span style={{ fontSize: 11, color: TONE.dim }}>Cardiac output</span>
          <details open={!compact} key={compact ? 'compact' : 'wide'}>
            <summary style={{ minHeight: TOUCH, alignContent: 'center', cursor: 'pointer', fontSize: 12, color: TONE.dim }}>System outputs</summary>
            <dl style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '4px 10px', margin: 0, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
              <dt>Arterial pressure (mean)</dt><dd style={{ margin: 0 }}>{fixed(result.readout.mapMmHg, 0)} mmHg</dd>
              <dt>Arterial O₂ saturation</dt><dd style={{ margin: 0 }}>{fixed(result.readout.sao2Pct, 0)}%</dd>
              <dt>Urine output</dt><dd style={{ margin: 0 }}>{fixed(result.readout.urineMlPerHour, 0)} mL/h</dd>
            </dl>
          </details>
        </div>
      ) : (
        <span role="status" style={{ fontSize: 12, color: TONE.gate }}>Simulation unavailable for this state.</span>
      )}

      {stalled && !running && result.ok && (
        <span role="status" data-sim-stalled style={{ fontSize: 11, color: TONE.dim, maxWidth: compact ? 140 : 180 }}>Paused to keep this device responsive.</span>
      )}

      {insideHidden && result.ok && (
        <button
          type="button"
          onClick={onSeeInside}
          data-sim-see-inside
          style={{ minHeight: TOUCH, borderRadius: 12, border: `1px solid ${TONE.sim}`, background: 'transparent', color: TONE.sim, fontSize: 12, fontWeight: 800, padding: '0 10px', cursor: 'pointer' }}
        >
          See it inside
        </button>
      )}

      <button
        type="button"
        onClick={onToggle}
        aria-pressed={running}
        aria-label={running ? 'Pause simulation' : 'Play simulation'}
        disabled={!result.ok}
        style={{ minWidth: TOUCH, minHeight: TOUCH, borderRadius: 12, border: `1px solid ${TONE.lineStrong}`, background: running ? TONE.active : TONE.panelSolid, color: TONE.text, fontSize: 14, fontWeight: 800, cursor: result.ok ? 'pointer' : 'not-allowed', opacity: result.ok ? 1 : 0.5 }}
      >
        <span aria-hidden>{running ? '❚❚' : '▶'}</span>
      </button>
    </div>
  )
}
