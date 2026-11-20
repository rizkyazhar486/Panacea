import React, { useState, useMemo } from 'react';
import {
  evaluateFasciaKineticChain,
  type FasciaKineticInput,
} from '../domains/body-exposure/fasciaKineticChainEngine';

const PRESET_COMPENSATED: FasciaKineticInput = {
  plantarArchActivation01: 0.2,
  rotationalThoracicMobility01: 0.25,
  palatalTonguePosture01: 0.2,
  facialMyofascialRelease01: 0.2,
};

const PRESET_ALIGNED: FasciaKineticInput = {
  plantarArchActivation01: 0.92,
  rotationalThoracicMobility01: 0.9,
  palatalTonguePosture01: 0.95,
  facialMyofascialRelease01: 0.88,
};

export const FasciaKineticTwinCard: React.FC = () => {
  const [input, setInput] = useState<FasciaKineticInput>(PRESET_ALIGNED);

  const baselineEval = useMemo(
    () => evaluateFasciaKineticChain(PRESET_COMPENSATED),
    [],
  );
  const currentEval = useMemo(
    () => evaluateFasciaKineticChain(input),
    [input],
  );

  const isAligned = currentEval.regime === 'aligned';

  return (
    <section
      aria-label="Myofascial Kinetic Chain Digital Twin"
      style={{
        background: 'rgba(12, 18, 16, 0.92)',
        border: '1px solid rgba(16, 185, 129, 0.24)',
        borderRadius: 20,
        padding: 20,
        color: '#ecfdf5',
        marginTop: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#34d399',
              fontWeight: 700,
            }}
          >
            DIGITAL TWIN · FEET-TO-FACE MYOFASCIAL CONTINUITY
          </div>
          <h3 style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700 }}>
            Superficial & Deep Front Line Kinetic Twin
          </h3>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setInput(PRESET_COMPENSATED)}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.16)',
              background: !isAligned ? '#ef4444' : 'rgba(255,255,255,0.06)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Before: Compensated (Out-Toeing / Forward Head)
          </button>
          <button
            type="button"
            onClick={() => setInput(PRESET_ALIGNED)}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: '1px solid rgba(16,185,129,0.4)',
              background: isAligned ? '#10b981' : 'rgba(255,255,255,0.06)',
              color: isAligned ? '#042f2e' : '#fff',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Now: Aligned Kinetic Chain
          </button>
        </div>
      </div>

      {/* Interactive Sliders */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          marginBottom: 16,
          padding: 12,
          borderRadius: 14,
          background: 'rgba(255,255,255,0.03)',
        }}
      >
        {[
          {
            key: 'plantarArchActivation01' as const,
            label: '1. Plantar Arch & Foot Tripod',
          },
          {
            key: 'palatalTonguePosture01' as const,
            label: '2. Palatal Tongue Posture (DFL)',
          },
          {
            key: 'facialMyofascialRelease01' as const,
            label: '3. Facial & Masseter Release',
          },
          {
            key: 'rotationalThoracicMobility01' as const,
            label: '4. Spiral Rotational Mobility',
          },
        ].map((ctrl) => (
          <label
            key={ctrl.key}
            style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}
          >
            <span style={{ color: '#a7f3d0', fontWeight: 600 }}>
              {ctrl.label}: {Math.round(input[ctrl.key] * 100)}%
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={input[ctrl.key]}
              onChange={(e) =>
                setInput((prev) => ({
                  ...prev,
                  [ctrl.key]: parseFloat(e.target.value),
                }))
              }
            />
          </label>
        ))}
      </div>

      {/* Now vs After Changes Counterfactual Table */}
      <div
        style={{
          overflowX: 'auto',
          marginBottom: 16,
          borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 13,
            textAlign: 'left',
          }}
        >
          <thead>
            <tr style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#6ee7b7' }}>
              <th style={{ padding: '10px 12px' }}>Biomechanical & Postural Marker</th>
              <th style={{ padding: '10px 12px' }}>Compensated Baseline</th>
              <th style={{ padding: '10px 12px' }}>Current Digital Twin</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <td style={{ padding: '8px 12px' }}>Plantar Arch & Foot Alignment</td>
              <td style={{ padding: '8px 12px', color: '#fca5a5' }}>
                {baselineEval.metrics.plantarArchStabilityPct}% (Out-toeing flare)
              </td>
              <td style={{ padding: '8px 12px', color: '#34d399', fontWeight: 700 }}>
                {currentEval.metrics.plantarArchStabilityPct}% (Active tripod recoil)
              </td>
            </tr>
            <tr style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <td style={{ padding: '8px 12px' }}>Sprint / Gait Elastic Recoil Transfer</td>
              <td style={{ padding: '8px 12px', color: '#fca5a5' }}>
                {baselineEval.metrics.gaitElasticRecoilEfficiencyPct}%
              </td>
              <td style={{ padding: '8px 12px', color: '#34d399', fontWeight: 700 }}>
                {currentEval.metrics.gaitElasticRecoilEfficiencyPct}%
              </td>
            </tr>
            <tr style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <td style={{ padding: '8px 12px' }}>Craniocervical Stacking Angle</td>
              <td style={{ padding: '8px 12px', color: '#fca5a5' }}>
                {baselineEval.metrics.craniocervicalAngleDeg}° (Forward head)
              </td>
              <td style={{ padding: '8px 12px', color: '#34d399', fontWeight: 700 }}>
                {currentEval.metrics.craniocervicalAngleDeg}° (Neutral axis)
              </td>
            </tr>
            <tr style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <td style={{ padding: '8px 12px' }}>Palatal Tongue Seal & Submental Tone</td>
              <td style={{ padding: '8px 12px', color: '#fca5a5' }}>
                {baselineEval.metrics.submentalSoftTissueLiftPct}%
              </td>
              <td style={{ padding: '8px 12px', color: '#34d399', fontWeight: 700 }}>
                {currentEval.metrics.submentalSoftTissueLiftPct}% (Suprahyoid lift)
              </td>
            </tr>
            <tr style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <td style={{ padding: '8px 12px' }}>Axial Shoulder–Pelvic Symmetry</td>
              <td style={{ padding: '8px 12px', color: '#fca5a5' }}>
                {baselineEval.metrics.axialShoulderPelvicSymmetryPct}%
              </td>
              <td style={{ padding: '8px 12px', color: '#34d399', fontWeight: 700 }}>
                {currentEval.metrics.axialShoulderPelvicSymmetryPct}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 7-Node Superficial Front Line */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#a7f3d0',
            marginBottom: 8,
          }}
        >
          7-Point Superficial Front Line Continuity (Head-to-Toe):
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: 8,
          }}
        >
          {currentEval.superficialFrontLine.map((node) => (
            <div
              key={node.id}
              style={{
                padding: 10,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 700, color: '#34d399' }}>
                #{node.rank} {node.anatomicalName}
              </div>
              <div style={{ color: '#d1fae5', marginTop: 4 }}>
                {isAligned ? node.alignedState : node.compensatedState}
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                Fascial Strain Load: {node.tensionLoadPct}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4-Step Actionable Protocol */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 10,
        }}
      >
        {currentEval.protocolSteps.map((step) => (
          <div
            key={step.id}
            style={{
              padding: 12,
              borderRadius: 12,
              background: 'rgba(16, 185, 129, 0.07)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              fontSize: 12,
            }}
          >
            <div style={{ fontWeight: 700, color: '#6ee7b7' }}>{step.title}</div>
            <div style={{ fontSize: 11, color: '#a7f3d0', marginTop: 2 }}>
              {step.targetStructure}
            </div>
            <div style={{ color: '#e5e7eb', marginTop: 6 }}>{step.mechanism}</div>
            <div
              style={{
                marginTop: 6,
                padding: '4px 8px',
                borderRadius: 6,
                background: 'rgba(0,0,0,0.35)',
                color: '#34d399',
                fontWeight: 600,
              }}
            >
              Drill: {step.dailyDrill}
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 12, marginBottom: 0 }}>
        {currentEval.epistemicNotice}
      </p>
    </section>
  );
};

export default FasciaKineticTwinCard;
