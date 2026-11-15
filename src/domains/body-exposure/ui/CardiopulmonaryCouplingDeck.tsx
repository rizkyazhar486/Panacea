import { useState, useMemo } from 'react';
import {
  evaluateCardiopulmonaryCoupling,
  CARDIOPULMONARY_SCENARIO_PRESETS,
  type CardiopulmonaryInput,
  type CardiopulmonaryScenario,
} from '../engine/cardiopulmonaryCouplingEngine';
import { sliderValueText } from './deck-kit/deckA11y';

const SCENARIOS: ReadonlyArray<{ id: CardiopulmonaryScenario; label: string; badge: string }> = [
  { id: 'normative_rest', label: 'Resting Baseline', badge: 'Normal' },
  { id: 'aerobic_exercise', label: 'Aerobic Exercise', badge: 'Sympathetic Surge' },
  { id: 'hfref_systolic_failure', label: 'HFrEF Failure', badge: 'Severe Uncoupling' },
  { id: 'acute_pulmonary_embolism', label: 'Pulmonary Embolism', badge: 'High Dead Space' },
  { id: 'copd_exacerbation', label: 'COPD Exacerbation', badge: 'Hypoxic HPV' },
];

export function CardiopulmonaryCouplingDeck() {
  const [selectedScenario, setSelectedScenario] = useState<CardiopulmonaryScenario>('normative_rest');
  const [customParams, setCustomParams] = useState<CardiopulmonaryInput>(CARDIOPULMONARY_SCENARIO_PRESETS.normative_rest);

  const handleScenarioChange = (scenario: CardiopulmonaryScenario) => {
    setSelectedScenario(scenario);
    setCustomParams(CARDIOPULMONARY_SCENARIO_PRESETS[scenario]);
  };

  const updateParam = <K extends keyof CardiopulmonaryInput>(key: K, value: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: value }));
  };

  const simulation = useMemo(() => {
    return evaluateCardiopulmonaryCoupling(customParams, selectedScenario);
  }, [customParams, selectedScenario]);

  // Compute SVG PV loop coordinates normalized to SVG viewBox [0 0 320 220]
  const svgData = useMemo(() => {
    if (!simulation.ok) return null;
    const maxV = 260;
    const maxP = 180;
    const toSvgX = (vol: number) => 35 + (vol / maxV) * 265;
    const toSvgY = (press: number) => 195 - (press / maxP) * 165;

    const coords = simulation.pvCoordinates.map((p) => ({
      ...p,
      x: toSvgX(p.volumeMl),
      y: toSvgY(p.pressureMmHg),
    }));

    const pathString = coords.reduce((acc, curr, idx) => {
      return `${acc} ${idx === 0 ? 'M' : 'L'} ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
    }, '') + ' Z';

    // ESPVR tangent line from V0 to Pes
    const v0 = customParams.v0Ml ?? 10;
    const xV0 = toSvgX(v0);
    const yV0 = toSvgY(0);
    const xPes = toSvgX(customParams.vesMl);
    const yPes = toSvgY(simulation.endSystolicPressureMmHg);

    // Ea arterial elastance line from (Ved, 0) to (Ves, Pes)
    const xVed = toSvgX(customParams.vedMl);
    const yZero = toSvgY(0);

    // The same numbers the gauges below show, so a screen reader hears what the loop depicts.
    const label = `Left ventricular pressure–volume loop: stroke volume ${simulation.strokeVolumeMl} mL, ejection fraction ${simulation.ejectionFractionPct}%, end-systolic pressure ${simulation.endSystolicPressureMmHg} mmHg`;

    return { coords, pathString, xV0, yV0, xPes, yPes, xVed, yZero, label };
  }, [simulation, customParams]);

  return (
    <article
      data-testid="cardiopulmonary-coupling-deck"
      style={{
        borderRadius: '16px',
        border: '1px solid #404040',
        backgroundColor: '#171717',
        padding: '16px',
        color: '#f5f5f5',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Header */}
      <header style={{ borderBottom: '1px solid #262626', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#67e8f9',
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                letterSpacing: '0.05em',
              }}
            >
              Mechanistic Engine
            </span>
            <span
              style={{
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#fcd34d',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
              }}
            >
              truthClass: mechanistic_simulation_proxy
            </span>
          </div>
          <span style={{ fontSize: '12px', color: '#a3a3a3' }}>Sunagawa 1983 · West 2016 · Guyton 14e</span>
        </div>
        <h3 style={{ marginTop: '8px', fontSize: '16px', fontWeight: 700, color: '#f5f5f5' }}>
          Cardiopulmonary Inotropic Coupling & PV-Loop Simulation Deck
        </h3>
        <p style={{ marginTop: '4px', fontSize: '12px', color: '#a3a3a3' }}>
          Interactive Suga-Sagawa ventricular elastance coupled with West lung zone ventilation-perfusion mechanics.
        </p>
      </header>

      {/* Scenario Presets */}
      <div style={{ marginTop: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#d4d4d4', marginBottom: '6px' }}>Clinical Scenarios</div>
        <div role="group" aria-label="Clinical scenarios" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {SCENARIOS.map((sc) => {
            const active = selectedScenario === sc.id;
            return (
              <button
                key={sc.id}
                type="button"
                aria-pressed={active}
                onClick={() => handleScenarioChange(sc.id)}
                style={{
                  borderRadius: '8px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  backgroundColor: active ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                  border: active ? '1px solid rgb(6, 182, 212)' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: active ? '#a5f3fc' : '#d4d4d4',
                }}
              >
                {sc.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Controls + SVG Visualizer */}
      <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        {/* Controls Column */}
        <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              borderRadius: '12px',
              padding: '12px',
              border: '1px solid #262626',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#e5e5e5',
                textTransform: 'uppercase',
                marginBottom: '8px',
                letterSpacing: '0.025em',
              }}
            >
              Cardiac Parameters (Suga-Sagawa)
            </div>

            {/* Ees Slider */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#d4d4d4' }}>
                <span>Inotropy Ees (Elastance)</span>
                <span style={{ fontFamily: 'monospace', color: '#67e8f9' }}>{customParams.eesMmHgPerMl} mmHg/mL</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="4.5"
                step="0.05"
                value={customParams.eesMmHgPerMl}
                aria-label="Inotropy Ees (Elastance)"
                aria-valuetext={sliderValueText(customParams.eesMmHgPerMl, 'mmHg/mL')}
                onChange={(e) => updateParam('eesMmHgPerMl', parseFloat(e.target.value))}
                style={{ width: '100%', marginTop: '4px', cursor: 'pointer', accentColor: '#22d3ee' }}
              />
            </div>

            {/* Ved Slider */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#d4d4d4' }}>
                <span>End-Diastolic Volume (Ved)</span>
                <span style={{ fontFamily: 'monospace', color: '#67e8f9' }}>{customParams.vedMl} mL</span>
              </div>
              <input
                type="range"
                min="80"
                max="240"
                step="5"
                value={customParams.vedMl}
                aria-label="End-Diastolic Volume (Ved)"
                aria-valuetext={sliderValueText(customParams.vedMl, 'mL')}
                onChange={(e) => {
                  const newVed = parseInt(e.target.value, 10);
                  if (newVed > customParams.vesMl) updateParam('vedMl', newVed);
                }}
                style={{ width: '100%', marginTop: '4px', cursor: 'pointer', accentColor: '#22d3ee' }}
              />
            </div>

            {/* Ves Slider */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#d4d4d4' }}>
                <span>End-Systolic Volume (Ves)</span>
                <span style={{ fontFamily: 'monospace', color: '#67e8f9' }}>{customParams.vesMl} mL</span>
              </div>
              <input
                type="range"
                min="30"
                max="180"
                step="5"
                value={customParams.vesMl}
                aria-label="End-Systolic Volume (Ves)"
                aria-valuetext={sliderValueText(customParams.vesMl, 'mL')}
                onChange={(e) => {
                  const newVes = parseInt(e.target.value, 10);
                  if (newVes < customParams.vedMl) updateParam('vesMl', newVes);
                }}
                style={{ width: '100%', marginTop: '4px', cursor: 'pointer', accentColor: '#22d3ee' }}
              />
            </div>

            {/* Heart Rate */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#d4d4d4' }}>
                <span>Heart Rate (HR)</span>
                <span style={{ fontFamily: 'monospace', color: '#67e8f9' }}>{customParams.hrBpm} bpm</span>
              </div>
              <input
                type="range"
                min="45"
                max="160"
                step="1"
                value={customParams.hrBpm}
                aria-label="Heart Rate (HR)"
                aria-valuetext={sliderValueText(customParams.hrBpm, 'bpm')}
                onChange={(e) => updateParam('hrBpm', parseInt(e.target.value, 10))}
                style={{ width: '100%', marginTop: '4px', cursor: 'pointer', accentColor: '#22d3ee' }}
              />
            </div>
          </div>

          {/* Pulmonary Controls */}
          <div
            style={{
              borderRadius: '12px',
              padding: '12px',
              border: '1px solid #262626',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#e5e5e5',
                textTransform: 'uppercase',
                marginBottom: '8px',
                letterSpacing: '0.025em',
              }}
            >
              Pulmonary Ventilation (West Zones)
            </div>

            {/* Respiratory Rate */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#d4d4d4' }}>
                <span>Respiratory Rate (RR)</span>
                <span style={{ fontFamily: 'monospace', color: '#5eead4' }}>{customParams.rrBpm} /min</span>
              </div>
              <input
                type="range"
                min="8"
                max="36"
                step="1"
                value={customParams.rrBpm}
                aria-label="Respiratory Rate (RR)"
                aria-valuetext={sliderValueText(customParams.rrBpm, 'breaths per minute')}
                onChange={(e) => updateParam('rrBpm', parseInt(e.target.value, 10))}
                style={{ width: '100%', marginTop: '4px', cursor: 'pointer', accentColor: '#2dd4bf' }}
              />
            </div>

            {/* Tidal Volume */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#d4d4d4' }}>
                <span>Tidal Volume (VT)</span>
                <span style={{ fontFamily: 'monospace', color: '#5eead4' }}>{customParams.tidalVolumeMl} mL</span>
              </div>
              <input
                type="range"
                min="300"
                max="1400"
                step="25"
                value={customParams.tidalVolumeMl}
                aria-label="Tidal Volume (VT)"
                aria-valuetext={sliderValueText(customParams.tidalVolumeMl, 'mL')}
                onChange={(e) => updateParam('tidalVolumeMl', parseInt(e.target.value, 10))}
                style={{ width: '100%', marginTop: '4px', cursor: 'pointer', accentColor: '#2dd4bf' }}
              />
            </div>
          </div>
        </div>

        {/* Visualizer & Outputs */}
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
          {/* PV Loop SVG */}
          <div
            style={{
              position: 'relative',
              borderRadius: '12px',
              border: '1px solid #262626',
              padding: '12px',
              backgroundColor: '#05070a',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#d4d4d4' }}>Left Ventricular PV Loop & Elastance</span>
              <span style={{ fontSize: '12px', color: '#a3a3a3', fontFamily: 'monospace' }}>P (mmHg) vs V (mL)</span>
            </div>

            {svgData ? (
              <svg viewBox="0 0 320 220" role="img" aria-label={svgData.label} style={{ width: '100%', height: '192px', userSelect: 'none' }}>
                {/* Grid Lines */}
                <line x1="35" y1="30" x2="35" y2="195" stroke="#374151" strokeWidth="1" />
                <line x1="35" y1="195" x2="300" y2="195" stroke="#374151" strokeWidth="1" />
                <line x1="35" y1="112" x2="300" y2="112" stroke="#1f2937" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="167" y1="30" x2="167" y2="195" stroke="#1f2937" strokeWidth="1" strokeDasharray="3 3" />

                {/* Axis Labels */}
                <text x="35" y="24" fill="#9ca3af" fontSize="9" textAnchor="middle">P (mmHg)</text>
                <text x="300" y="208" fill="#9ca3af" fontSize="9" textAnchor="end">V (mL)</text>

                {/* ESPVR dashed tangent line */}
                <line
                  x1={svgData.xV0}
                  y1={svgData.yV0}
                  x2={svgData.xPes}
                  y2={svgData.yPes}
                  stroke="#06b6d4"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />

                {/* Ea arterial elastance line */}
                <line
                  x1={svgData.xVed}
                  y1={svgData.yZero}
                  x2={svgData.xPes}
                  y2={svgData.yPes}
                  stroke="#a855f7"
                  strokeWidth="1.5"
                  strokeDasharray="3 2"
                />

                {/* PV Loop Area */}
                <path
                  d={svgData.pathString}
                  fill="rgba(6, 182, 212, 0.12)"
                  stroke="#22d3ee"
                  strokeWidth="2"
                />

                {/* Vertex Points */}
                {svgData.coords.map((pt) => (
                  <circle
                    key={pt.id}
                    cx={pt.x}
                    cy={pt.y}
                    r="3.5"
                    fill="#38bdf8"
                    stroke="#082f49"
                    strokeWidth="1"
                  />
                ))}

                {/* Legend in corner */}
                <g transform="translate(185, 38)">
                  <line x1="0" y1="0" x2="15" y2="0" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="4 2" />
                  <text x="18" y="3" fill="#67e8f9" fontSize="8">ESPVR (Ees)</text>
                  <line x1="0" y1="12" x2="15" y2="12" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="3 2" />
                  <text x="18" y="15" fill="#d8b4fe" fontSize="8">Arterial Ea</text>
                </g>
              </svg>
            ) : (
              <div style={{ height: '192px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#fb7185' }}>
                Invalid parameter bounds
              </div>
            )}
          </div>

          {/* Key Physiological Output Gauges */}
          {simulation.ok && (
            <div
              style={{
                display: 'grid',
                gap: '8px',
                gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
              }}
            >
              {/* Cardiac Output */}
              <div
                style={{
                  borderRadius: '8px',
                  padding: '8px',
                  border: '1px solid #262626',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                }}
              >
                <div style={{ fontSize: '12px', color: '#a3a3a3' }}>Cardiac Output</div>
                <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'monospace', color: '#67e8f9' }}>
                  {simulation.cardiacOutputLMin} <span style={{ fontSize: '12px', color: '#a3a3a3', fontWeight: 400 }}>L/min</span>
                </div>
                <div style={{ fontSize: '12px', color: '#a3a3a3', marginTop: '2px' }}>SV: {simulation.strokeVolumeMl} mL</div>
              </div>

              {/* Ejection Fraction */}
              <div
                style={{
                  borderRadius: '8px',
                  padding: '8px',
                  border: '1px solid #262626',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                }}
              >
                <div style={{ fontSize: '12px', color: '#a3a3a3' }}>Ejection Fraction</div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    color: simulation.ejectionFractionPct < 40 ? '#f87171' : '#4ade80',
                  }}
                >
                  {simulation.ejectionFractionPct}%
                </div>
                <div style={{ fontSize: '12px', color: '#a3a3a3', marginTop: '2px' }}>
                  {simulation.ejectionFractionPct < 40 ? 'Depressed' : 'Preserved'}
                </div>
              </div>

              {/* VAC Ratio */}
              <div
                style={{
                  borderRadius: '8px',
                  padding: '8px',
                  border: '1px solid #262626',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                }}
              >
                <div style={{ fontSize: '12px', color: '#a3a3a3' }}>V-A Coupling (Ea/Ees)</div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    color: simulation.vacStatus === 'optimal_efficiency' ? '#4ade80' : '#fbbf24',
                  }}
                >
                  {simulation.vacRatio}
                </div>
                <div style={{ fontSize: '12px', color: '#a3a3a3', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={simulation.vacStatus}>
                  {simulation.vacStatus === 'optimal_efficiency' ? 'Optimal (0.6-1.2)' : 'Uncoupled'}
                </div>
              </div>

              {/* V/Q Ratio */}
              <div
                style={{
                  borderRadius: '8px',
                  padding: '8px',
                  border: '1px solid #262626',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                }}
              >
                <div style={{ fontSize: '12px', color: '#a3a3a3' }}>Global VA/Q Ratio</div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    color: simulation.vqStatus === 'matched' ? '#4ade80' : '#f87171',
                  }}
                >
                  {simulation.vqRatio}
                </div>
                <div style={{ fontSize: '12px', color: '#a3a3a3', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={simulation.vqStatus}>
                  {simulation.vqStatus === 'matched' ? 'Matched' : simulation.vqStatus}
                </div>
              </div>
            </div>
          )}

          {/* Secondary Telemetry Row */}
          {simulation.ok && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                fontSize: '12px',
                borderTop: '1px solid #262626',
                paddingTop: '8px',
                color: '#d4d4d4',
              }}
            >
              <div>
                <span style={{ color: '#a3a3a3' }}>Laplace Peak Wall Stress:</span>{' '}
                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#f5f5f5' }}>{simulation.peakWallStressKPa} kPa</span>
              </div>
              <div>
                <span style={{ color: '#a3a3a3' }}>Stroke Work:</span>{' '}
                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#f5f5f5' }}>{simulation.strokeWorkGramMeters} g·m</span>
              </div>
              <div>
                <span style={{ color: '#a3a3a3' }}>O₂ Delivery (DO₂):</span>{' '}
                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#67e8f9' }}>{simulation.do2MlMin} mL/min</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
