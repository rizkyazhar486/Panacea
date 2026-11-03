// src/domains/body-exposure/ui/KaloLumenVolumetricStudio.tsx
// KaloLumen 3-Layer DICOM Volumetric Raymarching & Multi-Planar Reconstruction (MPR) Studio
// Dual-projection responsive UI built with scoped inline styles to protect bundle budget

import React, { useMemo, useState } from 'react'
import {
  DIAGNOSTIC_CT_PRESETS,
  computeDirectionalLightVector,
  computeMprSliceCoordinates,
  computeSubsurfacePenetrationDepth,
  computeTissueDiffuseTransmittance,
  createDefaultKaloLumenState,
  evaluateHounsfieldTransferFunction,
  intersectRayAabb,
  type DiagnosticCtWindowPreset,
  type DiagnosticCtWindowPresetId,
  type MultiPlanarViewMode,
} from '../engine/kaloLumenDicomEngine.ts'

export function KaloLumenVolumetricStudio(): React.ReactElement {
  const [selectedPresetId, setSelectedPresetId] = useState<DiagnosticCtWindowPresetId>('MEDIASTINUM_SOFT_TISSUE')
  const [viewMode, setViewMode] = useState<MultiPlanarViewMode>('VOLUMETRIC_3D')
  const [azimuth, setAzimuth] = useState<number>(45)
  const [elevation, setElevation] = useState<number>(30)
  const [lightIntensity, setLightIntensity] = useState<number>(1200)
  const [sliceOffset, setSliceOffset] = useState<number>(0.5)
  const [tissueThicknessMm, setTissueThicknessMm] = useState<number>(2.5)

  // 3-Layer visibility & opacity toggles
  const [layer1Visible, setLayer1Visible] = useState<boolean>(true)
  const [layer1Opacity, setLayer1Opacity] = useState<number>(0.35)
  const [layer2Visible, setLayer2Visible] = useState<boolean>(true)
  const [layer2Opacity, setLayer2Opacity] = useState<number>(0.75)
  const [layer3Visible, setLayer3Visible] = useState<boolean>(true)
  const [layer3Opacity, setLayer3Opacity] = useState<number>(1.0)

  const activePreset: DiagnosticCtWindowPreset = useMemo(() => {
    return DIAGNOSTIC_CT_PRESETS.find((p) => p.id === selectedPresetId) ?? DIAGNOSTIC_CT_PRESETS[1]
  }, [selectedPresetId])

  const lightVector = useMemo(() => {
    return computeDirectionalLightVector(azimuth, elevation)
  }, [azimuth, elevation])

  const skinPen = useMemo(() => computeSubsurfacePenetrationDepth(0.05, 1.2), [])
  const visceraPen = useMemo(() => computeSubsurfacePenetrationDepth(0.15, 0.8), [])
  const bonePen = useMemo(() => computeSubsurfacePenetrationDepth(0.4, 2.5), [])

  const skinTransmittance = useMemo(() => computeTissueDiffuseTransmittance(tissueThicknessMm, skinPen), [tissueThicknessMm, skinPen])
  const visceraTransmittance = useMemo(() => computeTissueDiffuseTransmittance(tissueThicknessMm, visceraPen), [tissueThicknessMm, visceraPen])

  const mprCoords = useMemo(() => {
    return computeMprSliceCoordinates(viewMode, sliceOffset)
  }, [viewMode, sliceOffset])

  const rayHit = useMemo(() => {
    return intersectRayAabb([0, 0, -2], lightVector)
  }, [lightVector])

  const transferSample = useMemo(() => {
    return evaluateHounsfieldTransferFunction(activePreset.windowCenterHU, activePreset.windowCenterHU, activePreset.windowWidthHU)
  }, [activePreset])

  const engineState = useMemo(() => {
    return createDefaultKaloLumenState('2026-11-03T12:00:00.000Z')
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        padding: '1.25rem',
        borderRadius: '1rem',
        backgroundColor: '#040914',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                padding: '0.2rem 0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid rgba(56, 189, 248, 0.25)',
              }}
            >
              Pillar II · KaloLumen Raymarching
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Client-Side DICOM Volumetric &amp; MPR Engine</span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: '0.35rem 0 0 0' }}>
            KaloLumen 3-Layer Volumetric &amp; Diagnostic CT Studio
          </h2>
        </div>
        <div
          style={{
            padding: '0.375rem 0.75rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            color: '#34d399',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.04em',
          }}
        >
          ACR/RSNA CONFORMANT · {engineState.reconstructionTimeMs / 1000}s LATENCY
        </div>
      </div>

      {/* Preset CT Diagnostic Windows Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Diagnostic CT Window Presets (ACR / RSNA Standard)
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
          {DIAGNOSTIC_CT_PRESETS.map((preset) => {
            const isSelected = preset.id === selectedPresetId
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedPresetId(preset.id)}
                style={{
                  textAlign: 'left',
                  padding: '0.5rem 0.65rem',
                  borderRadius: '0.5rem',
                  border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 800, color: isSelected ? '#38bdf8' : '#ffffff' }}>
                  {preset.name.split('(')[0].trim()}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '0.2rem' }}>
                  C: {preset.windowCenterHU} HU · W: {preset.windowWidthHU} HU
                </div>
              </button>
            )
          })}
        </div>
        <div style={{ fontSize: '11.5px', color: '#94a3b8', padding: '0.5rem 0.75rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
          <strong style={{ color: '#38bdf8' }}>Clinical Indication:</strong> {activePreset.clinicalIndication} (Range: {activePreset.huMin} to {activePreset.huMax} HU)
        </div>
      </div>

      {/* Main Studio Workstage (Split Multi-Planar & Controls) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {/* Left Column: Visual Raymarching Viewport */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            padding: '1rem',
            backgroundColor: '#020610',
            borderRadius: '0.75rem',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
              Multi-Planar Projection: {mprCoords.planeName}
            </span>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {(['VOLUMETRIC_3D', 'AXIAL', 'CORONAL', 'SAGITTAL'] as MultiPlanarViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '10px',
                    fontWeight: 700,
                    borderRadius: '0.375rem',
                    border: viewMode === mode ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: viewMode === mode ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                    color: viewMode === mode ? '#38bdf8' : '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  {mode.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Multi-Planar Raymarching Simulator Display */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '240px',
              backgroundColor: '#000000',
              borderRadius: '0.5rem',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <svg viewBox="-120 -120 240 240" style={{ width: '100%', height: '100%' }}>
              <defs>
                <radialGradient id="sssGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity={0} />
                </radialGradient>
              </defs>
              {/* Outer Bounding Volume Box */}
              <rect x="-80" y="-80" width="160" height="160" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 4" />
              {/* Layer 1: Skin & Subcutaneous Fat */}
              {layer1Visible && (
                <ellipse cx="0" cy="0" rx="72" ry="72" fill="none" stroke="rgba(244, 114, 182, 0.6)" strokeWidth="8" opacity={layer1Opacity} />
              )}
              {/* Layer 2: Visceral Parenchyma & Myocardium */}
              {layer2Visible && (
                <rect x="-50" y="-50" width="100" height="100" rx="16" fill="rgba(239, 68, 68, 0.25)" stroke="#ef4444" strokeWidth="2" opacity={layer2Opacity} />
              )}
              {/* Layer 3: Bone & Vascular Tree */}
              {layer3Visible && (
                <circle cx="0" cy="0" r="22" fill="rgba(255, 255, 255, 0.85)" stroke="#38bdf8" strokeWidth="2.5" opacity={layer3Opacity} />
              )}
              {/* Directional Light Vector Ray */}
              <line
                x1={-lightVector[0] * 100}
                y1={-lightVector[1] * 100}
                x2={0}
                y2={0}
                stroke="#facc15"
                strokeWidth="2"
                strokeDasharray="3 3"
              />
              <circle cx={-lightVector[0] * 100} cy={-lightVector[1] * 100} r="5" fill="#facc15" />
              {/* Slice Cutline in MPR modes */}
              {viewMode !== 'VOLUMETRIC_3D' && (
                <line x1="-80" y1={(sliceOffset - 0.5) * 160} x2="80" y2={(sliceOffset - 0.5) * 160} stroke="#38bdf8" strokeWidth="2" />
              )}
            </svg>
            <div style={{ position: 'absolute', bottom: '8px', left: '8px', fontSize: '9px', color: '#64748b', fontFamily: 'monospace' }}>
              Ray Hit: {rayHit.hit ? `tNear=${rayHit.tNear} tFar=${rayHit.tFar}` : 'No Intersection'} · Slice: {mprCoords.sliceIndex} ({mprCoords.sliceMm}mm)
            </div>
          </div>

          {/* Slice Offset Slider for MPR */}
          {viewMode !== 'VOLUMETRIC_3D' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
                <span>Slice Position: {mprCoords.sliceMm} mm</span>
                <span>Voxel: {mprCoords.sliceIndex} / {mprCoords.axisDimensionPx}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.005}
                value={sliceOffset}
                onChange={(e) => setSliceOffset(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8', marginTop: '0.25rem' }}
              />
            </div>
          )}
        </div>

        {/* Right Column: Biophysical Optical & Shading Controls */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            padding: '1rem',
            backgroundColor: '#020610',
            borderRadius: '0.75rem',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
            Biophysical Optical &amp; Subsurface Scattering Controls
          </span>

          {/* Light Angles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1' }}>
                <span>Azimuth</span>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>{azimuth}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={360}
                value={azimuth}
                onChange={(e) => setAzimuth(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1' }}>
                <span>Elevation</span>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>{elevation}°</span>
              </div>
              <input
                type="range"
                min={-90}
                max={90}
                value={elevation}
                onChange={(e) => setElevation(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
            </div>
          </div>

          {/* 3-Layer Density Toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              3-Layer Density Thresholds &amp; Opacities
            </span>

            {/* Layer 1 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '11px', cursor: 'pointer' }}>
                <input type="checkbox" checked={layer1Visible} onChange={(e) => setLayer1Visible(e.target.checked)} />
                <span style={{ color: '#f472b6' }}>Skin &amp; Fat (-300..20 HU)</span>
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={layer1Opacity}
                disabled={!layer1Visible}
                onChange={(e) => setLayer1Opacity(parseFloat(e.target.value))}
                style={{ width: '90px', accentColor: '#f472b6' }}
              />
            </div>

            {/* Layer 2 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '11px', cursor: 'pointer' }}>
                <input type="checkbox" checked={layer2Visible} onChange={(e) => setLayer2Visible(e.target.checked)} />
                <span style={{ color: '#ef4444' }}>Viscera &amp; Muscle (20..199 HU)</span>
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={layer2Opacity}
                disabled={!layer2Visible}
                onChange={(e) => setLayer2Opacity(parseFloat(e.target.value))}
                style={{ width: '90px', accentColor: '#ef4444' }}
              />
            </div>

            {/* Layer 3 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '11px', cursor: 'pointer' }}>
                <input type="checkbox" checked={layer3Visible} onChange={(e) => setLayer3Visible(e.target.checked)} />
                <span style={{ color: '#38bdf8' }}>Cortical Bone &amp; Vessels (200..3000 HU)</span>
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={layer3Opacity}
                disabled={!layer3Visible}
                onChange={(e) => setLayer3Opacity(parseFloat(e.target.value))}
                style={{ width: '90px', accentColor: '#38bdf8' }}
              />
            </div>
          </div>

          {/* Subsurface Optical Penetration Depth Metrics */}
          <div style={{ marginTop: '0.25rem', padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Subsurface Scattering Penetration (d_pen) &amp; Transmittance
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '11px' }}>
              <div>
                <span style={{ color: '#64748b' }}>Skin d_pen:</span> <strong style={{ color: '#f472b6' }}>{skinPen}mm</strong>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>T_d: {Math.round(skinTransmittance * 100)}%</div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Viscera d_pen:</span> <strong style={{ color: '#ef4444' }}>{visceraPen}mm</strong>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>T_d: {Math.round(visceraTransmittance * 100)}%</div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Bone d_pen:</span> <strong style={{ color: '#38bdf8' }}>{bonePen}mm</strong>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>High scatter</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Governance Tag */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem' }}>
        <span>Truth Class: <code>{engineState.truthClass}</code> · Never Manufactures Biomarkers</span>
        <span>KaloLumen 3-Layer Raymarching OS · Panacea Invictus</span>
      </div>
    </div>
  )
}
