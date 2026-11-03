import React, { useState, useId } from 'react';
import {
  ORGAN_BIOMECHANICS_CATALOG,
  OrganMechanicalId,
  evaluatePalpationIndentation,
  generateStressStrainCurve,
  calculateNeoHookeanStress,
  evaluateDiaphragmaticExcursion,
  RespirationMode,
  evaluatePeristalsis,
  GastrointestinalSegment,
  GI_PERISTALSIS_CATALOG,
  SOFT_TISSUE_BIOMECHANICS_DISCLAIMER,
} from '../engine/softTissueBiomechanicsEngine';

export interface SoftTissueBiomechanicsDeckProps {
  initialOrganId?: OrganMechanicalId;
  onOrganSelect?: (organId: OrganMechanicalId) => void;
}

type BiomechanicsDeckTab = 'palpation' | 'diaphragm_excursion' | 'peristalsis';

const colors = {
  bgCard: '#0f172a',
  bgHeader: '#1e293b',
  border: '#334155',
  textMain: '#f8fafc',
  textMuted: '#94a3b8',
  cyan: '#06b6d4',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  violet: '#8b5cf6',
};

const SliderControl: React.FC<{
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  color: string;
  onChange: (v: number) => void;
}> = ({ label, value, unit, min, max, step, color, onChange }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
      <span style={{ color: colors.textMuted }}>{label}:</span>
      <span style={{ color, fontWeight: 700, fontFamily: 'monospace' }}>{value.toFixed(1)} {unit}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      style={{ width: '100%', accentColor: color }}
    />
  </div>
);

export const SoftTissueBiomechanicsDeck: React.FC<SoftTissueBiomechanicsDeckProps> = ({
  initialOrganId = 'liver_normal',
  onOrganSelect,
}) => {
  const [activeTab, setActiveTab] = useState<BiomechanicsDeckTab>('palpation');
  const [selectedOrganId, setSelectedOrganId] = useState<OrganMechanicalId>(initialOrganId);
  const [indentationDepthMm, setIndentationDepthMm] = useState<number>(4.0);
  const [indentationVelocityMmS, setIndentationVelocityMmS] = useState<number>(10.0);
  const [toolTipRadiusMm, setToolTipRadiusMm] = useState<number>(2.5);
  const [respirationMode, setRespirationMode] = useState<RespirationMode>('tidal');
  const [respiratoryPhase, setRespiratoryPhase] = useState<number>(0.5);
  const [peepCmH2O, setPeepCmH2O] = useState<number>(8);
  const [selectedSegment, setSelectedSegment] = useState<GastrointestinalSegment>('gastric_antrum');
  const [simulationTimeSec, setSimulationTimeSec] = useState<number>(12.0);

  const clipId = useId();

  const handleOrganChange = (id: OrganMechanicalId) => {
    setSelectedOrganId(id);
    onOrganSelect?.(id);
  };

  const organProfile = ORGAN_BIOMECHANICS_CATALOG[selectedOrganId] || ORGAN_BIOMECHANICS_CATALOG.liver_normal;
  const palpationResult = evaluatePalpationIndentation({
    organId: selectedOrganId,
    indentationDepthMm,
    indentationVelocityMmS,
    toolTipRadiusMm,
  });

  const stressStrainCurve = generateStressStrainCurve(organProfile.shearModulusMuKPa, 0.40, 20);
  const currentStressPoint = calculateNeoHookeanStress(palpationResult.engineeringStrain, organProfile.shearModulusMuKPa);
  const diaphragmResult = evaluateDiaphragmaticExcursion({ mode: respirationMode, respiratoryPhase, peepCmH2O });
  const peristalsisResult = evaluatePeristalsis(selectedSegment, simulationTimeSec, 6.0, 20.0, 20);

  return (
    <div
      style={{
        backgroundColor: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '16px',
        color: colors.textMain,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxWidth: '100%',
        boxSizing: 'border-box',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>🔬</span>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: colors.cyan }}>
              4D Soft-Tissue Biomechanics & Viscoelastic Continuum
            </h3>
            <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(6, 182, 212, 0.15)', color: colors.cyan, padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(6, 182, 212, 0.3)', fontWeight: 600 }}>
              PILLAR VI
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginTop: '4px' }}>
            Non-linear Neo-Hookean continuum, diaphragmatic visceral displacement, and GI slow-wave pacing
          </div>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: colors.bgHeader, padding: '3px', borderRadius: '8px' }}>
          {(['palpation', 'diaphragm_excursion', 'peristalsis'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                backgroundColor: activeTab === tab ? colors.cyan : 'transparent',
                color: activeTab === tab ? '#0f172a' : colors.textMuted,
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {tab === 'palpation' ? '🩺 Palpation Contact' : tab === 'diaphragm_excursion' ? '🫁 4D Diaphragm Shift' : '🌊 GI Peristalsis'}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: Palpation Contact */}
      {activeTab === 'palpation' && (
        <div>
          {/* Organ Selector Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
            {Object.values(ORGAN_BIOMECHANICS_CATALOG).map((org) => {
              const sel = org.id === selectedOrganId;
              return (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => handleOrganChange(org.id)}
                  style={{
                    backgroundColor: sel ? 'rgba(6, 182, 212, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                    border: sel ? `1px solid ${colors.cyan}` : `1px solid ${colors.border}`,
                    color: sel ? colors.cyan : colors.textMuted,
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    fontWeight: sel ? 600 : 400,
                  }}
                >
                  {org.label} <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>({org.youngsModulusKPa} kPa)</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            {/* SVG Stress-Strain Curve */}
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', borderRadius: '8px', border: `1px solid ${colors.border}`, padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Neo-Hookean Stress-Strain</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: palpationResult.safetyStatus === 'safe' ? colors.emerald : palpationResult.safetyStatus === 'high_tension' ? colors.amber : colors.rose }}>
                  {palpationResult.safetyStatus === 'safe' ? '● SAFE' : palpationResult.safetyStatus === 'high_tension' ? '▲ HIGH TENSION' : '⚠ RUPTURE RISK'}
                </span>
              </div>
              <div style={{ width: '100%', height: '170px' }}>
                <svg viewBox="0 0 300 160" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  <defs>
                    <clipPath id={clipId}><rect x="35" y="10" width="250" height="130" /></clipPath>
                  </defs>
                  <line x1="35" y1="140" x2="290" y2="140" stroke="#475569" strokeWidth="1" />
                  <line x1="35" y1="10" x2="35" y2="140" stroke="#475569" strokeWidth="1" />
                  <text x="290" y="152" fill="#64748b" fontSize="8" textAnchor="end">Strain ε (%)</text>
                  <text x="30" y="15" fill="#64748b" fontSize="8" textAnchor="end">σ (kPa)</text>

                  {/* Yield Line */}
                  {(() => {
                    const maxY = Math.max(organProfile.capsularYieldStressKPa * 1.2, 25);
                    const y = 140 - (organProfile.capsularYieldStressKPa / maxY) * 130;
                    return (
                      <g>
                        <line x1="35" y1={y} x2="285" y2={y} stroke={colors.rose} strokeWidth="1" strokeDasharray="4 3" opacity="0.7" />
                        <text x="285" y={y - 3} fill={colors.rose} fontSize="7" textAnchor="end">Yield: {organProfile.capsularYieldStressKPa} kPa</text>
                      </g>
                    );
                  })()}

                  {/* Polyline */}
                  {(() => {
                    const maxY = Math.max(organProfile.capsularYieldStressKPa * 1.2, 25);
                    const pts = stressStrainCurve.map((pt) => `${(35 + (pt.engineeringStrain / 0.40) * 250).toFixed(1)},${(140 - (Math.min(pt.cauchyTrueStressKPa, maxY) / maxY) * 130).toFixed(1)}`).join(' ');
                    return <polyline fill="none" stroke={colors.cyan} strokeWidth="2" points={pts} clipPath={`url(#${clipId})`} />;
                  })()}

                  {/* Operating Point */}
                  {(() => {
                    const maxY = Math.max(organProfile.capsularYieldStressKPa * 1.2, 25);
                    const cx = 35 + (Math.min(0.40, palpationResult.engineeringStrain) / 0.40) * 250;
                    const cy = 140 - (Math.min(currentStressPoint.cauchyTrueStressKPa, maxY) / maxY) * 130;
                    const c = palpationResult.safetyStatus === 'safe' ? colors.cyan : palpationResult.safetyStatus === 'high_tension' ? colors.amber : colors.rose;
                    return (
                      <g>
                        <circle cx={cx} cy={cy} r="6" fill={c} opacity="0.3" />
                        <circle cx={cx} cy={cy} r="3.5" fill={c} />
                        <text x={Math.min(cx + 8, 250)} y={Math.max(cy - 6, 20)} fill={c} fontSize="8" fontWeight="bold">
                          {currentStressPoint.cauchyTrueStressKPa} kPa
                        </text>
                      </g>
                    );
                  })()}
                </svg>
              </div>
              <div style={{ fontSize: '0.65rem', color: colors.textMuted, textAlign: 'center', marginTop: '4px' }}>
                Fung continuum: μ = {organProfile.shearModulusMuKPa} kPa, ν = {organProfile.poissonRatio}
              </div>
            </div>

            {/* Controls & Telemetry */}
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', borderRadius: '8px', border: `1px solid ${colors.border}`, padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <SliderControl label="Indentation Depth (d)" value={indentationDepthMm} unit="mm" min={0} max={15} step={0.5} color={colors.cyan} onChange={setIndentationDepthMm} />
              <SliderControl label="Probe Velocity (v)" value={indentationVelocityMmS} unit="mm/s" min={0} max={40} step={2} color={colors.violet} onChange={setIndentationVelocityMmS} />
              <SliderControl label="Tool Tip Radius (R)" value={toolTipRadiusMm} unit="mm" min={1} max={5} step={0.5} color={colors.emerald} onChange={setToolTipRadiusMm} />

              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', borderRadius: '6px', padding: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', border: `1px solid ${colors.border}` }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: colors.textMuted }}>Contact Force:</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: colors.cyan, fontFamily: 'monospace' }}>{palpationResult.totalContactForceN} N</div>
                  <div style={{ fontSize: '0.6rem', color: colors.textMuted }}>El: {palpationResult.elasticContactForceN}N | Visc: {palpationResult.viscousDampingForceN}N</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: colors.textMuted }}>Safety Margin:</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: palpationResult.safetyMarginPct > 40 ? colors.emerald : palpationResult.safetyMarginPct > 15 ? colors.amber : colors.rose, fontFamily: 'monospace' }}>
                    {palpationResult.safetyMarginPct}%
                  </div>
                  <div style={{ fontSize: '0.6rem', color: colors.textMuted }}>Yield: {organProfile.capsularYieldStressKPa} kPa</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: colors.textMuted }}>Haptic Resistance:</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: colors.violet, fontFamily: 'monospace' }}>{palpationResult.hapticResistanceScore} / 100</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: colors.textMuted }}>Friability Index:</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: colors.amber, fontFamily: 'monospace' }}>{(organProfile.friabilityIndex * 100).toFixed(0)}%</div>
                </div>
              </div>

              <div style={{ fontSize: '0.65rem', color: colors.textMuted, backgroundColor: 'rgba(2, 6, 23, 0.4)', padding: '6px', borderRadius: '4px', borderLeft: `2px solid ${colors.cyan}` }}>
                <strong>Clinical Note:</strong> {organProfile.clinicalContext}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Diaphragmatic Shift */}
      {activeTab === 'diaphragm_excursion' && (
        <div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {(['tidal', 'deep_inspiration', 'mechanical_peep', 'apnea'] as RespirationMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setRespirationMode(mode)}
                style={{
                  backgroundColor: respirationMode === mode ? 'rgba(6, 182, 212, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                  border: respirationMode === mode ? `1px solid ${colors.cyan}` : `1px solid ${colors.border}`,
                  color: respirationMode === mode ? colors.cyan : colors.textMuted,
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: respirationMode === mode ? 600 : 400,
                  textTransform: 'capitalize',
                }}
              >
                {mode.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', borderRadius: '8px', border: `1px solid ${colors.border}`, padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600 }}>Diaphragmatic Excursion Contour</span>
                <span style={{ color: colors.cyan, fontWeight: 700, fontFamily: 'monospace' }}>Δz = -{diaphragmResult.instantaneousDiaphragmDescentMm} mm</span>
              </div>
              <div style={{ width: '100%', height: '170px' }}>
                <svg viewBox="0 0 300 160" style={{ width: '100%', height: '100%' }}>
                  <path d="M 50 20 C 50 120 70 150 150 150 C 230 150 250 120 250 20" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="3 3" />
                  {(() => {
                    const d = Math.min(60, (diaphragmResult.instantaneousDiaphragmDescentMm / 75) * 55);
                    const z = diaphragmResult.instantaneousDiaphragmDescentMm;
                    return (
                      <g>
                        <path d="M 60 70 Q 110 35 150 50 Q 190 35 240 70" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
                        <path d={`M 60 ${70 + d * 0.4} Q 110 ${35 + d} 150 ${50 + d * 0.7} Q 190 ${35 + d} 240 ${70 + d * 0.4}`} fill="none" stroke={colors.cyan} strokeWidth="2.5" />
                        <rect x="75" y={85 + 0.85 * z * 0.55} width="50" height="26" rx="5" fill="rgba(6, 182, 212, 0.25)" stroke={colors.cyan} />
                        <text x="100" y={101 + 0.85 * z * 0.55} fill={colors.cyan} fontSize="7" fontWeight="bold" textAnchor="middle">Liver</text>
                        <rect x="135" y={92 + 0.70 * z * 0.55} width="45" height="24" rx="5" fill="rgba(245, 158, 11, 0.25)" stroke={colors.amber} />
                        <text x="157" y={107 + 0.70 * z * 0.55} fill={colors.amber} fontSize="7" fontWeight="bold" textAnchor="middle">Stomach</text>
                        <rect x="188" y={90 + 0.80 * z * 0.55} width="35" height="22" rx="5" fill="rgba(244, 63, 94, 0.25)" stroke={colors.rose} />
                        <text x="205" y={104 + 0.80 * z * 0.55} fill={colors.rose} fontSize="7" fontWeight="bold" textAnchor="middle">Spleen</text>
                        <circle cx="85" cy={115 + 0.55 * z * 0.55} r="7" fill="rgba(139, 92, 246, 0.3)" stroke={colors.violet} />
                        <text x="85" y={118 + 0.55 * z * 0.55} fill={colors.violet} fontSize="6" textAnchor="middle">Kidney</text>
                      </g>
                    );
                  })()}
                </svg>
              </div>

              <div style={{ marginTop: '8px' }}>
                <SliderControl label="Cycle Phase (φ)" value={respiratoryPhase} unit="" min={0} max={1} step={0.05} color={colors.cyan} onChange={setRespiratoryPhase} />
                {respirationMode === 'mechanical_peep' && (
                  <div style={{ marginTop: '6px' }}>
                    <SliderControl label="PEEP Setting" value={peepCmH2O} unit="cmH2O" min={0} max={20} step={1} color={colors.amber} onChange={setPeepCmH2O} />
                  </div>
                )}
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', borderRadius: '8px', border: `1px solid ${colors.border}`, padding: '12px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px' }}>Visceral Organ 3D Displacement Table</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.border}`, color: colors.textMuted, textAlign: 'left' }}>
                      <th style={{ padding: '4px' }}>Organ</th>
                      <th style={{ padding: '4px' }}>Δz</th>
                      <th style={{ padding: '4px' }}>Δy</th>
                      <th style={{ padding: '4px' }}>Magnitude</th>
                      <th style={{ padding: '4px' }}>Pitch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diaphragmResult.organDisplacements.map((disp, i) => (
                      <tr key={disp.label} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.3)', backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(30, 41, 59, 0.25)' }}>
                        <td style={{ padding: '4px', fontWeight: 600 }}>{disp.label}</td>
                        <td style={{ padding: '4px', color: colors.cyan, fontFamily: 'monospace' }}>{disp.dzMm} mm</td>
                        <td style={{ padding: '4px', color: colors.amber, fontFamily: 'monospace' }}>+{disp.dyMm} mm</td>
                        <td style={{ padding: '4px', color: colors.emerald, fontFamily: 'monospace' }}>{disp.totalDisplacementMagnitudeMm} mm</td>
                        <td style={{ padding: '4px', color: colors.violet, fontFamily: 'monospace' }}>{disp.rotationDegrees}°</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: '0.65rem', color: colors.textMuted, lineHeight: '1.3', backgroundColor: 'rgba(2, 6, 23, 0.4)', padding: '6px', borderRadius: '4px', marginTop: '10px' }}>
                <strong>SBRT Gating:</strong> Hepatic/renal lesions shift 20–30 mm with breathing; 4D phase tracking prevents marginal miss in radiation delivery.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Peristalsis */}
      {activeTab === 'peristalsis' && (
        <div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {(Object.keys(GI_PERISTALSIS_CATALOG) as GastrointestinalSegment[]).map((segKey) => {
              const seg = GI_PERISTALSIS_CATALOG[segKey];
              const sel = segKey === selectedSegment;
              return (
                <button
                  key={segKey}
                  type="button"
                  onClick={() => setSelectedSegment(segKey)}
                  style={{
                    backgroundColor: sel ? 'rgba(6, 182, 212, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                    border: sel ? `1px solid ${colors.cyan}` : `1px solid ${colors.border}`,
                    color: sel ? colors.cyan : colors.textMuted,
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: sel ? 600 : 400,
                  }}
                >
                  {seg.label} <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>({seg.pacingFrequencyCpm} cpm)</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', borderRadius: '8px', border: `1px solid ${colors.border}`, padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600 }}>Traveling Wave Lumen Profile</span>
                <span style={{ color: colors.cyan, fontWeight: 700, fontFamily: 'monospace' }}>t = {simulationTimeSec.toFixed(1)}s</span>
              </div>
              <div style={{ width: '100%', height: '170px' }}>
                <svg viewBox="0 0 300 160" style={{ width: '100%', height: '100%' }}>
                  <line x1="30" y1="80" x2="280" y2="80" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
                  {(() => {
                    const rMax = peristalsisResult.segment.baselineLumenRadiusMm;
                    const u = peristalsisResult.wavePoints.map((pt) => `${(30 + (pt.positionAlongTractCm / 20.0) * 250).toFixed(1)},${(80 - (pt.instantaneousRadiusMm / rMax) * 45).toFixed(1)}`).join(' ');
                    const l = peristalsisResult.wavePoints.map((pt) => `${(30 + (pt.positionAlongTractCm / 20.0) * 250).toFixed(1)},${(80 + (pt.instantaneousRadiusMm / rMax) * 45).toFixed(1)}`).join(' ');
                    return (
                      <g>
                        <polyline fill="none" stroke={colors.cyan} strokeWidth="2.5" points={u} />
                        <polyline fill="none" stroke={colors.cyan} strokeWidth="2.5" points={l} />
                        <polygon fill="rgba(6, 182, 212, 0.15)" points={`${u} ${l.split(' ').reverse().join(' ')}`} />
                        <line x1="105" y1="20" x2="105" y2="140" stroke={colors.amber} strokeWidth="1" strokeDasharray="2 2" />
                        <circle cx="105" cy="80" r="3.5" fill={colors.amber} />
                        <text x="110" y="32" fill={colors.amber} fontSize="7" fontWeight="bold">Probe (6 cm): {peristalsisResult.currentLumenRadiusAtProbeMm} mm</text>
                      </g>
                    );
                  })()}
                </svg>
              </div>
              <div style={{ marginTop: '8px' }}>
                <SliderControl label="Wave Timeline" value={simulationTimeSec} unit="s" min={0} max={30} step={0.5} color={colors.cyan} onChange={setSimulationTimeSec} />
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', borderRadius: '8px', border: `1px solid ${colors.border}`, padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>Cajal (ICC) Electromechanical Telemetry</div>
              <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', borderRadius: '6px', padding: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', border: `1px solid ${colors.border}` }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: colors.textMuted }}>Frequency:</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: colors.cyan, fontFamily: 'monospace' }}>{peristalsisResult.segment.pacingFrequencyCpm} cpm</div>
                  <div style={{ fontSize: '0.6rem', color: colors.textMuted }}>({peristalsisResult.segment.frequencyHz} Hz)</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: colors.textMuted }}>Propagation:</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: colors.emerald, fontFamily: 'monospace' }}>{peristalsisResult.segment.waveVelocityCmPerSec} cm/s</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: colors.textMuted }}>Baseline Lumen:</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: colors.violet, fontFamily: 'monospace' }}>{peristalsisResult.segment.baselineLumenRadiusMm} mm</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: colors.textMuted }}>Intraluminal Peak:</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: colors.amber, fontFamily: 'monospace' }}>{peristalsisResult.segment.peakIntraluminalPressureMmHg} mmHg</div>
                </div>
              </div>

              <div style={{ fontSize: '0.65rem', color: colors.textMuted, backgroundColor: 'rgba(2, 6, 23, 0.4)', padding: '6px', borderRadius: '4px' }}>
                <strong>Pacemaker Site:</strong> {peristalsisResult.segment.interstitialCellsOfCajalSite}
              </div>
              <div style={{ fontSize: '0.65rem', color: colors.textMuted, backgroundColor: 'rgba(2, 6, 23, 0.4)', padding: '6px', borderRadius: '4px', borderLeft: `2px solid ${colors.cyan}`, marginTop: 'auto' }}>
                Gastroparesis impairs antral 3 cpm slow-wave generation; ileus inhibits MMC propagation.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Truth Class Footer */}
      <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '8px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '0.65rem', color: colors.textMuted }}>
        <div>
          <span>Truth Class: </span>
          <code style={{ color: colors.cyan, backgroundColor: 'rgba(6, 182, 212, 0.1)', padding: '1px 4px', borderRadius: '3px' }}>
            mechanistic_simulation_proxy
          </code>
          <span style={{ marginLeft: '8px' }}>• Clinically Reviewed: </span>
          <span style={{ color: colors.amber }}>false (Educational Simulation)</span>
        </div>
        <div style={{ fontStyle: 'italic', maxWidth: '380px', textAlign: 'right' }}>
          {SOFT_TISSUE_BIOMECHANICS_DISCLAIMER}
        </div>
      </div>
    </div>
  );
};
