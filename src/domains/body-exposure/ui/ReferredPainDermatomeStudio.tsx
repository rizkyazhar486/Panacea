// src/domains/body-exposure/ui/ReferredPainDermatomeStudio.tsx
// High-Definition Viscerosomatic Referred Pain & 3D Dermatome Projection Studio
// Models convergence-projection theory (Ruch TC, 1946) & central sensitization (Woolf CJ, 2011)
// Employs scoped inline styles to protect strict bundle budget: cssBlokirGzip <= 115200
// The two accent TEXT colours are theme-aware utility pairs that the stylesheet already ships (no new CSS):
// a single fixed colour cannot reach 4.5:1 on both a light page and the dark atlas stage, where this studio is also shown.

import React, { useMemo, useState } from 'react'
import {
  DERMATOME_CONVERGENCE_SOURCE,
  DERMATOME_SPATIAL_ANCHORS,
  REFERRED_PAIN_DISCLAIMER,
  VISCERAL_REFERRED_PAIN_TABLE,
  calculateCentralSensitizationNociceptiveDrive,
  type VisceralOrganKey,
} from '../engine/referredPainEngine.ts'
import { DECK_ACTIVE_FILL } from './deck-kit/deckA11y.ts'

const ORGAN_OPTIONS: readonly { key: VisceralOrganKey; label: string; badge: string }[] = [
  { key: 'heart-myocardium', label: 'Heart (Angina / Myocardium)', badge: 'T1–T5, C3–C5' },
  { key: 'gallbladder-biliary', label: 'Gallbladder (Boas Sign)', badge: 'T7–T9, C3–C5' },
  { key: 'appendix-visceral-early', label: 'Appendix (Early Visceral)', badge: 'T10' },
  { key: 'ureter-renal-pelvis', label: 'Kidney / Ureter (Renal Colic)', badge: 'T10–L1' },
  { key: 'pancreas-body', label: 'Pancreas (Mid-Thoracic Back)', badge: 'T6–T10' },
  { key: 'spleen-parenchyma', label: 'Spleen (Kehr Sign Left)', badge: 'C3–C5, T6–T8' },
  { key: 'stomach-gastric-wall', label: 'Stomach / Gastric Wall', badge: 'T5–T9' },
  { key: 'liver-glisson-capsule', label: 'Liver & Glisson Capsule', badge: 'C3–C5, T7–T9' },
  { key: 'urinary-bladder-wall', label: 'Urinary Bladder & Trigone', badge: 'T11–L2, S2–S4' },
  { key: 'adnexa-ovary', label: 'Ovary & Uterine Adnexa', badge: 'T10–T11' },
  { key: 'colon-distal-sigmoid', label: 'Distal Colon / Sigmoid', badge: 'L1–L2, S2–S4' },
]

export function ReferredPainDermatomeStudio(): React.ReactElement {
  const [selectedOrgan, setSelectedOrgan] = useState<VisceralOrganKey>('heart-myocardium')
  const [projectionView, setProjectionView] = useState<'anterior' | 'posterior'>('anterior')
  const [centralSensitizationCoeff, setCentralSensitizationCoeff] = useState<number>(0.35)
  const [baseNociceptiveStimulus, setBaseNociceptiveStimulus] = useState<number>(0.8)
  const [selectedSegmentDetail, setSelectedSegmentDetail] = useState<string | null>(null)

  const organRow = useMemo(() => {
    return VISCERAL_REFERRED_PAIN_TABLE[selectedOrgan]
  }, [selectedOrgan])

  // Construct active dermatomes input based on base stimulus for the organ's segments
  const activeDermatomes = useMemo(() => {
    const map: Record<string, number> = {}
    for (const seg of organRow.spinalSegments) {
      map[seg] = baseNociceptiveStimulus
    }
    return map
  }, [organRow, baseNociceptiveStimulus])

  // Evaluate central sensitization and convergence telemetry
  const telemetry = useMemo(() => {
    const res = calculateCentralSensitizationNociceptiveDrive({
      organ: selectedOrgan,
      activeDermatomes,
      centralSensitizationCoeff,
    })
    return res.ok !== false ? res : null
  }, [selectedOrgan, activeDermatomes, centralSensitizationCoeff])

  // Segments sorted into Cervical, Thoracic, Lumbar, Sacral
  const segmentGroups = useMemo(() => {
    const cervical: string[] = []
    const thoracic: string[] = []
    const lumbar: string[] = []
    const sacral: string[] = []

    for (const seg of Object.keys(DERMATOME_SPATIAL_ANCHORS)) {
      if (seg.startsWith('C')) cervical.push(seg)
      else if (seg.startsWith('T')) thoracic.push(seg)
      else if (seg.startsWith('L')) lumbar.push(seg)
      else if (seg.startsWith('S')) sacral.push(seg)
    }

    return { cervical, thoracic, lumbar, sacral }
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        padding: '16px',
        borderRadius: '16px',
        border: '1px solid rgba(148, 163, 184, 0.25)',
        backgroundColor: 'rgba(15, 23, 42, 0.03)',
      }}
      data-testid="referred-pain-dermatome-studio"
    >
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 900, color: 'inherit', letterSpacing: '0.01em' }}>
            Viscerosomatic Referred Pain & 3D Dermatome Projection
          </h4>
          <span
            className="text-emerald-800 dark:text-emerald-200"
            style={{
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '999px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Pillar III · Ruch-Woolf Synaptic Model
          </span>
        </div>
        <p style={{ margin: '4px 0 0 0', fontSize: '11px', lineHeight: 1.5, opacity: 0.75 }}>
          Mechanistic simulation of visceral afferent nociceptive convergence onto second-order spinothalamic neurons,
          including Woolf central sensitization plasticity (PMID: 20961685).
        </p>
      </div>

      {/* Safety & Truth Class Disclaimer */}
      <div
        className="text-amber-900 dark:text-amber-100"
        style={{
          padding: '8px 12px',
          borderRadius: '10px',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          fontSize: '11px',
          lineHeight: 1.45,
        }}
        role="note"
      >
        <strong>Safety & Provenance Disclaimer:</strong> {REFERRED_PAIN_DISCLAIMER}. Source: {DERMATOME_CONVERGENCE_SOURCE.citation}.
      </div>

      {/* Organ Selector Bar */}
      <div>
        <label
          htmlFor="organ-select-dropdown"
          style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '6px', opacity: 0.85 }}
        >
          Select Visceral Organ (12 Multi-System Targets):
        </label>
        <select
          id="organ-select-dropdown"
          value={selectedOrgan}
          onChange={(e) => setSelectedOrgan(e.target.value as VisceralOrganKey)}
          style={{
            width: '100%',
            minHeight: '38px',
            padding: '6px 10px',
            fontSize: '12px',
            borderRadius: '10px',
            border: '1px solid rgba(148, 163, 184, 0.35)',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            color: '#1e293b',
            cursor: 'pointer',
            fontWeight: 600,
          }}
          aria-label="Select visceral organ for referred pain convergence"
        >
          {ORGAN_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label} — [{opt.badge}]
            </option>
          ))}
        </select>
      </div>

      {/* Two-Column Responsive Layout: Visual Anatomical Projection & Controls */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '14px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Interactive 2D/3D Multi-Projection Anatomical Dermatome Map */}
        <div
          style={{
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: 'rgba(15, 23, 42, 0.04)',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Dermatome Cutaneous Map ({projectionView.toUpperCase()})
            </span>
            <div role="group" aria-label="Body side shown" style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                aria-pressed={projectionView === 'anterior'}
                onClick={() => setProjectionView('anterior')}
                style={{
                  minHeight: '28px',
                  padding: '2px 8px',
                  fontSize: '10px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: projectionView === 'anterior' ? DECK_ACTIVE_FILL : 'rgba(148, 163, 184, 0.3)',
                  backgroundColor: projectionView === 'anterior' ? DECK_ACTIVE_FILL : 'transparent',
                  color: projectionView === 'anterior' ? '#ffffff' : 'inherit',
                  cursor: 'pointer',
                }}
              >
                Anterior
              </button>
              <button
                type="button"
                aria-pressed={projectionView === 'posterior'}
                onClick={() => setProjectionView('posterior')}
                style={{
                  minHeight: '28px',
                  padding: '2px 8px',
                  fontSize: '10px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: projectionView === 'posterior' ? DECK_ACTIVE_FILL : 'rgba(148, 163, 184, 0.3)',
                  backgroundColor: projectionView === 'posterior' ? DECK_ACTIVE_FILL : 'transparent',
                  color: projectionView === 'posterior' ? '#ffffff' : 'inherit',
                  cursor: 'pointer',
                }}
              >
                Posterior
              </button>
            </div>
          </div>

          {/* SVG Multi-Projection Anatomical Silhouette with Dermatome Levels */}
          <svg
            role="img"
            aria-label="3D Dermatome and Viscerosomatic Projection Visualization"
            viewBox="0 0 300 400"
            style={{
              width: '100%',
              maxWidth: '280px',
              height: 'auto',
              borderRadius: '8px',
              background: 'linear-gradient(180deg, rgba(241, 245, 249, 0.6) 0%, rgba(226, 232, 240, 0.6) 100%)',
            }}
          >
            {/* Background Anatomical Human Silhouette */}
            <path
              d={
                projectionView === 'anterior'
                  ? 'M 150,25 C 138,25 130,35 130,50 C 130,62 138,72 143,76 C 128,82 108,92 90,118 C 76,138 60,185 54,230 C 51,248 64,254 70,242 C 78,212 90,175 98,158 L 98,245 C 98,258 120,265 142,268 L 132,370 C 130,385 146,388 148,370 L 150,270 L 152,370 C 154,388 170,385 168,370 L 158,268 C 180,265 202,258 202,245 L 202,158 C 210,175 222,212 230,242 C 236,254 249,248 246,230 C 240,185 224,138 210,118 C 192,92 172,82 157,76 C 162,72 170,62 170,50 C 170,35 162,25 150,25 Z'
                  : 'M 150,25 C 138,25 130,35 130,50 C 130,62 138,72 143,76 C 128,82 108,92 90,118 C 76,138 60,185 54,230 C 51,248 64,254 70,242 C 78,212 90,175 98,158 L 98,245 C 98,258 120,265 142,268 L 132,370 C 130,385 146,388 148,370 L 150,270 L 152,370 C 154,388 170,385 168,370 L 158,268 C 180,265 202,258 202,245 L 202,158 C 210,175 222,212 230,242 C 236,254 249,248 246,230 C 240,185 224,138 210,118 C 192,92 172,82 157,76 C 162,72 170,62 170,50 C 170,35 162,25 150,25 Z'
              }
              fill="rgba(203, 213, 225, 0.45)"
              stroke="rgba(100, 116, 139, 0.6)"
              strokeWidth="1.5"
            />

            {/* Dermatome Bands / Anchors */}
            {Object.entries(DERMATOME_SPATIAL_ANCHORS).map(([seg, anchor], idx) => {
              const isMatched = organRow.spinalSegments.includes(seg)
              const coords = projectionView === 'anterior' ? anchor.anteriorAnchor3D : anchor.posteriorAnchor3D
              // Map 3D coords [-0.3..0.3, -0.6..0.5] to SVG canvas [0..300, 0..400]
              const cx = 150 + coords[0] * 320
              // Invert Y coordinate since 3D Y is up and SVG Y is down
              const cy = 200 - coords[1] * 280
              const isSelected = selectedSegmentDetail === seg

              let fillColor = 'rgba(148, 163, 184, 0.4)'
              let strokeColor = 'rgba(100, 116, 139, 0.6)'
              let radius = 4

              if (isMatched) {
                // Glow with intensity based on sensitization
                const boost = telemetry?.dorsalHornAmplificationFactor ?? 1
                fillColor = boost > 1.2 ? 'rgba(239, 68, 68, 0.85)' : 'rgba(245, 158, 11, 0.85)'
                strokeColor = '#b91c1c'
                radius = isSelected ? 8 : 6
              } else if (isSelected) {
                fillColor = 'rgba(59, 130, 246, 0.85)'
                strokeColor = '#1d4ed8'
                radius = 7
              }

              return (
                <g
                  key={seg}
                  onClick={() => setSelectedSegmentDetail(seg)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isMatched ? 2 : 1}
                  />
                  {/* Subtle label for key landmarks */}
                  {(isMatched || isSelected || idx % 4 === 0) && (
                    <text
                      x={cx + (coords[0] >= 0 ? 8 : -8)}
                      y={cy + 3}
                      textAnchor={coords[0] >= 0 ? 'start' : 'end'}
                      fontSize="8.5"
                      fontWeight="bold"
                      fill={isMatched ? '#991b1b' : '#334155'}
                    >
                      {seg}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>

          {/* Selected Segment Inspector Popover */}
          <div style={{ width: '100%', fontSize: '10.5px', lineHeight: 1.4, textAlign: 'center', opacity: 0.85 }}>
            {selectedSegmentDetail && DERMATOME_SPATIAL_ANCHORS[selectedSegmentDetail] ? (
              <span>
                <strong>{selectedSegmentDetail} ({DERMATOME_SPATIAL_ANCHORS[selectedSegmentDetail].region}):</strong>{' '}
                {DERMATOME_SPATIAL_ANCHORS[selectedSegmentDetail].landmarkDescription}{' '}
                {organRow.spinalSegments.includes(selectedSegmentDetail) && (
                  <strong style={{ color: '#b91c1c' }}>· In active convergence zone!</strong>
                )}
              </span>
            ) : (
              <span>Click any anatomical node to inspect its dermatome landmark.</span>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Telemetry, Woolf Plasticity Sliders & Convergence Analysis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Organ Afferent Information */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              fontSize: '11px',
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '11.5px', marginBottom: '2px' }}>
              {organRow.organLabel}
            </div>
            <div style={{ color: '#64748b', fontSize: '10.5px' }}>
              <strong>FMA:</strong> {organRow.fmaId} · <strong>Spinal Root:</strong> {organRow.spinalSegments.join(', ')}
            </div>
            <div style={{ marginTop: '4px', fontSize: '10.5px' }}>
              <strong>Afferent Pathway:</strong> {organRow.afferentPathway}
            </div>
            <div style={{ marginTop: '4px', fontSize: '10.5px', color: '#0369a1' }}>
              <strong>Dominant Cutaneous Target:</strong> {telemetry?.dominantCutaneousZone ?? 'N/A'}
            </div>
          </div>

          {/* Woolf Central Sensitization Slider */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label
                htmlFor="sensitization-slider"
                style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}
              >
                Central Sensitization γ (Woolf 2011):
              </label>
              <span className="font-[var(--font-angka)]" style={{ fontSize: '11.5px', fontWeight: 800, color: '#0284c7' }}>
                {centralSensitizationCoeff.toFixed(2)}
              </span>
            </div>
            <input
              id="sensitization-slider"
              type="range"
              min="0.00"
              max="1.50"
              step="0.05"
              value={centralSensitizationCoeff}
              onChange={(e) => setCentralSensitizationCoeff(parseFloat(e.target.value))}
              aria-label="Central sensitization amplification coefficient"
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <div style={{ fontSize: '10px', color: '#64748b', lineHeight: 1.35 }}>
              Models synaptic long-term potentiation in dorsal horn wide dynamic range (WDR) neurons.
            </div>
          </div>

          {/* Primary Nociceptive Stimulus Slider */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label
                htmlFor="base-stimulus-slider"
                style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}
              >
                Visceral Nociceptive Input Intensity:
              </label>
              <span className="font-[var(--font-angka)]" style={{ fontSize: '11.5px', fontWeight: 800, color: '#e11d48' }}>
                {baseNociceptiveStimulus.toFixed(2)}
              </span>
            </div>
            <input
              id="base-stimulus-slider"
              type="range"
              min="0.10"
              max="1.00"
              step="0.05"
              value={baseNociceptiveStimulus}
              onChange={(e) => setBaseNociceptiveStimulus(parseFloat(e.target.value))}
              aria-label="Primary visceral nociceptive stimulus intensity"
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          {/* Telemetry Output Metrics Box */}
          {telemetry && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '10px',
                backgroundColor: 'rgba(240, 249, 255, 0.85)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
              }}
            >
              <div>
                <div style={{ fontSize: '10px', color: '#0369a1', fontWeight: 600 }}>Dorsal Horn Gain:</div>
                <div className="font-[var(--font-angka)]" style={{ fontSize: '14px', fontWeight: 900, color: '#0c4a6e' }}>
                  {telemetry.dorsalHornAmplificationFactor.toFixed(3)}×
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#0369a1', fontWeight: 600 }}>Jaccard Overlap:</div>
                <div className="font-[var(--font-angka)]" style={{ fontSize: '14px', fontWeight: 900, color: '#0c4a6e' }}>
                  {(telemetry.jaccardOverlap * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#0369a1', fontWeight: 600 }}>Baseline Drive:</div>
                <div className="font-[var(--font-angka)]" style={{ fontSize: '14px', fontWeight: 900, color: '#0c4a6e' }}>
                  {telemetry.totalNociceptiveDrive.toFixed(3)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#b91c1c', fontWeight: 700 }}>Sensitized Drive:</div>
                <div className="font-[var(--font-angka)]" style={{ fontSize: '14px', fontWeight: 900, color: '#b91c1c' }}>
                  {telemetry.sensitizedDrive.toFixed(3)}
                </div>
              </div>
            </div>
          )}

          {/* Primary Cutaneous Radiation Zones Badge List */}
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 700, marginBottom: '4px', opacity: 0.85 }}>
              Primary Cutaneous Referral Zones:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {organRow.primaryCutaneousZones.map((zone) => (
                <span
                  key={zone}
                  style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: '#1d4ed8',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    fontWeight: 600,
                  }}
                >
                  {zone}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default ReferredPainDermatomeStudio
