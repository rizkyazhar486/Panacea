// src/domains/quantum-biology/ui/SubcellularMitochondrialAutophagyConsole.tsx
// Subcellular Energetics, Chemiosmotic Coupling & Autophagic Flux Interactive Console
// Dual-projection responsive UI built with scoped inline styles to protect bundle budget

import React, { useMemo, useState } from 'react'
import {
  evaluateSubcellularMitochondrialDynamics,
} from '../engine/subcellularMitochondrialDynamicsEngine.ts'
import type {
  SubcellularMitochondrialInput,
  SubcellularViabilityStatus,
} from '../model/subcellularMitochondrialTypes.ts'

interface ScenarioPreset {
  id: string
  name: string
  subtitle: string
  description: string
  values: Omit<SubcellularMitochondrialInput, 'evaluationIsoTimestamp'>
}

const PRESET_SCENARIOS: readonly ScenarioPreset[] = [
  {
    id: 'homeostasis',
    name: 'Resting Homeostasis',
    subtitle: 'Polarized & Coupled',
    description: 'Basal state in euglycemic rested tissue. High ATP/ADP ratio, low ROS, balanced baseline autophagy.',
    values: {
      membranePotentialDeltaPsiMv: -160,
      nadhToNadRatio: 0.15,
      succinateConcentrationMm: 0.5,
      uncouplingProteinActivityFraction: 0.05,
      atpConcentrationMm: 4.8,
      adpConcentrationMm: 1.0,
      ampConcentrationMm: 0.08,
      aminoAcidAvailabilityScore: 0.75,
      lysosomalAcidityPh: 4.8,
      hypoxiaFractionFiO2: 0.21,
    },
  },
  {
    id: 'fasting',
    name: 'Intermittent Fasting',
    subtitle: 'AMPK & Autophagy Peak',
    description: 'Elevated AMP/ATP activates AMPK Thr172, potently repressing mTORC1 and maximizing LC3-II autophagic clearance.',
    values: {
      membranePotentialDeltaPsiMv: -155,
      nadhToNadRatio: 0.12,
      succinateConcentrationMm: 0.4,
      uncouplingProteinActivityFraction: 0.08,
      atpConcentrationMm: 3.2,
      adpConcentrationMm: 1.6,
      ampConcentrationMm: 0.35,
      aminoAcidAvailabilityScore: 0.25,
      lysosomalAcidityPh: 4.7,
      hypoxiaFractionFiO2: 0.21,
    },
  },
  {
    id: 'thermogenesis',
    name: 'Cold & UCP Thermogenesis',
    subtitle: 'Proton Leak Dissipation',
    description: 'UCP1/3 activation uncouples the proton gradient, dissipating PMF as heat and dampening destructive ROS formation.',
    values: {
      membranePotentialDeltaPsiMv: -140,
      nadhToNadRatio: 0.22,
      succinateConcentrationMm: 0.8,
      uncouplingProteinActivityFraction: 0.65,
      atpConcentrationMm: 4.0,
      adpConcentrationMm: 1.2,
      ampConcentrationMm: 0.15,
      aminoAcidAvailabilityScore: 0.60,
      lysosomalAcidityPh: 4.8,
      hypoxiaFractionFiO2: 0.21,
    },
  },
  {
    id: 'sepsis_hypoxia',
    name: 'Sepsis Cytopathic Hypoxia',
    subtitle: 'Depolarization & ROS Storm',
    description: 'Complex I/IV inhibition with profound membrane depolarization, electron stall, severe oxidative stress, and lysosomal failure.',
    values: {
      membranePotentialDeltaPsiMv: -78,
      nadhToNadRatio: 0.85,
      succinateConcentrationMm: 0.2,
      uncouplingProteinActivityFraction: 0.02,
      atpConcentrationMm: 1.2,
      adpConcentrationMm: 2.2,
      ampConcentrationMm: 0.70,
      aminoAcidAvailabilityScore: 0.30,
      lysosomalAcidityPh: 6.2,
      hypoxiaFractionFiO2: 0.07,
    },
  },
  {
    id: 'metformin_modulation',
    name: 'Metformin ETC Modulation',
    subtitle: 'Mild Complex I Shift',
    description: 'Mild reversible Complex I inhibition lowers ATP synthesis slightly, elevating AMP/ATP to trigger metabolic rejuvenation.',
    values: {
      membranePotentialDeltaPsiMv: -150,
      nadhToNadRatio: 0.35,
      succinateConcentrationMm: 0.6,
      uncouplingProteinActivityFraction: 0.10,
      atpConcentrationMm: 3.8,
      adpConcentrationMm: 1.4,
      ampConcentrationMm: 0.22,
      aminoAcidAvailabilityScore: 0.50,
      lysosomalAcidityPh: 4.8,
      hypoxiaFractionFiO2: 0.21,
    },
  },
]

export function SubcellularMitochondrialAutophagyConsole(): React.ReactElement {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('homeostasis')
  const [deltaPsi, setDeltaPsi] = useState<number>(-160)
  const [nadhNad, setNadhNad] = useState<number>(0.15)
  const [ucpFraction, setUcpFraction] = useState<number>(0.05)
  const [aminoAcids, setAminoAcids] = useState<number>(0.75)
  const [lysoPh, setLysoPh] = useState<number>(4.8)
  const [fio2, setFio2] = useState<number>(0.21)
  const [ampLevel, setAmpLevel] = useState<number>(0.08)
  const [atpLevel, setAtpLevel] = useState<number>(4.8)

  const handleSelectPreset = (preset: ScenarioPreset) => {
    setSelectedPresetId(preset.id)
    setDeltaPsi(preset.values.membranePotentialDeltaPsiMv)
    setNadhNad(preset.values.nadhToNadRatio)
    setUcpFraction(preset.values.uncouplingProteinActivityFraction ?? 0.05)
    setAminoAcids(preset.values.aminoAcidAvailabilityScore ?? 0.75)
    setLysoPh(preset.values.lysosomalAcidityPh ?? 4.8)
    setFio2(preset.values.hypoxiaFractionFiO2 ?? 0.21)
    setAmpLevel(preset.values.ampConcentrationMm ?? 0.08)
    setAtpLevel(preset.values.atpConcentrationMm ?? 4.8)
  }

  const evaluation = useMemo(() => {
    const input: SubcellularMitochondrialInput = {
      membranePotentialDeltaPsiMv: deltaPsi,
      nadhToNadRatio: nadhNad,
      succinateConcentrationMm: 0.5,
      uncouplingProteinActivityFraction: ucpFraction,
      atpConcentrationMm: atpLevel,
      adpConcentrationMm: 1.0,
      ampConcentrationMm: ampLevel,
      aminoAcidAvailabilityScore: aminoAcids,
      lysosomalAcidityPh: lysoPh,
      hypoxiaFractionFiO2: fio2,
      evaluationIsoTimestamp: '2026-11-03T12:00:00.000Z',
    }
    return evaluateSubcellularMitochondrialDynamics(input)
  }, [deltaPsi, nadhNad, ucpFraction, atpLevel, ampLevel, aminoAcids, lysoPh, fio2])

  const getViabilityBadgeStyle = (status: SubcellularViabilityStatus) => {
    switch (status) {
      case 'HEALTHY_COUPLED_HOMEOSTASIS':
        return { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#34d399', label: 'HEALTHY COUPLED HOMEOSTASIS' }
      case 'FASTING_AUTOPHAGIC_PROTECTION':
        return { bg: 'rgba(56, 189, 248, 0.15)', border: '#38bdf8', text: '#7dd3fc', label: 'FASTING AUTOPHAGIC CLEARANCE' }
      case 'THERMOGENIC_UNCOUPLED':
        return { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#fbbf24', label: 'THERMOGENIC UNCOUPLED' }
      case 'CYTOPATHIC_SEPSIS_FAILURE':
        return { bg: 'rgba(239, 68, 68, 0.2)', border: '#ef4444', text: '#fca5a5', label: 'CYTOPATHIC SEPSIS FAILURE' }
      case 'CYTOTOXIC_AUTOPHAGIC_ARREST':
        return { bg: 'rgba(225, 29, 72, 0.2)', border: '#e11d48', text: '#fda4af', label: 'CYTOTOXIC AUTOPHAGIC ARREST' }
    }
  }

  const badge = getViabilityBadgeStyle(evaluation.viabilityStatus)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        padding: '1.25rem',
        borderRadius: '1rem',
        backgroundColor: '#050b14',
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
              Pillar I · Subcellular Dynamics
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Mitchell PMF &amp; AMPK/mTORC1 Switch</span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: '0.35rem 0 0 0' }}>
            Mitochondrial Bioenergetics &amp; Autophagic Flux Simulator
          </h2>
        </div>
        <div
          style={{
            padding: '0.375rem 0.75rem',
            borderRadius: '9999px',
            backgroundColor: badge.bg,
            border: `1px solid ${badge.border}`,
            color: badge.text,
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.04em',
          }}
        >
          {badge.label}
        </div>
      </div>

      {/* Preset Scenario Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Physiological &amp; Pathological Scenarios
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
          {PRESET_SCENARIOS.map((preset) => {
            const isSelected = preset.id === selectedPresetId
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                style={{
                  textAlign: 'left',
                  padding: '0.625rem 0.75rem',
                  borderRadius: '0.625rem',
                  border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? '#38bdf8' : '#ffffff' }}>
                  {preset.name}
                </div>
                <div style={{ fontSize: '10px', color: isSelected ? '#bae6fd' : '#94a3b8', marginTop: '0.15rem' }}>
                  {preset.subtitle}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Interactive Controls & Gauges Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {/* Sliders Panel */}
        <div
          style={{
            padding: '1rem',
            borderRadius: '0.75rem',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
            Biophysical Parameters
          </span>

          {/* Delta-Psi-m */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: '#cbd5e1' }}>Membrane Potential (ΔΨm)</span>
              <span style={{ fontWeight: 800, color: '#38bdf8' }}>{deltaPsi} mV</span>
            </div>
            <input
              type="range"
              min={-200}
              max={-60}
              value={deltaPsi}
              onChange={(e) => setDeltaPsi(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#38bdf8', marginTop: '0.25rem' }}
            />
          </div>

          {/* NADH / NAD+ */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: '#cbd5e1' }}>Substrate NADH / NAD⁺</span>
              <span style={{ fontWeight: 800, color: '#a78bfa' }}>{nadhNad.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.05}
              max={1.5}
              step={0.05}
              value={nadhNad}
              onChange={(e) => setNadhNad(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#a78bfa', marginTop: '0.25rem' }}
            />
          </div>

          {/* UCP Uncoupling */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: '#cbd5e1' }}>UCP Proton Uncoupling</span>
              <span style={{ fontWeight: 800, color: '#f59e0b' }}>{Math.round(ucpFraction * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.0}
              max={1.0}
              step={0.05}
              value={ucpFraction}
              onChange={(e) => setUcpFraction(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#f59e0b', marginTop: '0.25rem' }}
            />
          </div>

          {/* Lysosomal pH */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: '#cbd5e1' }}>Lysosomal Acidity (pH)</span>
              <span style={{ fontWeight: 800, color: lysoPh > 5.2 ? '#f87171' : '#34d399' }}>{lysoPh.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={4.0}
              max={6.8}
              step={0.1}
              value={lysoPh}
              onChange={(e) => setLysoPh(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#34d399', marginTop: '0.25rem' }}
            />
          </div>

          {/* Oxygen FiO2 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: '#cbd5e1' }}>Oxygen Availability (FiO₂)</span>
              <span style={{ fontWeight: 800, color: '#60a5fa' }}>{Math.round(fio2 * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.05}
              max={0.21}
              step={0.01}
              value={fio2}
              onChange={(e) => setFio2(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#60a5fa', marginTop: '0.25rem' }}
            />
          </div>

          {/* AMP / ATP Energy Stress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: '#cbd5e1' }}>AMP Concentration</span>
              <span style={{ fontWeight: 800, color: '#f43f5e' }}>{ampLevel.toFixed(2)} mM</span>
            </div>
            <input
              type="range"
              min={0.02}
              max={0.80}
              step={0.02}
              value={ampLevel}
              onChange={(e) => setAmpLevel(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#f43f5e', marginTop: '0.25rem' }}
            />
          </div>
        </div>

        {/* Live Metrics Output Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.625rem' }}>
          {/* PMF */}
          <div style={{ padding: '0.75rem', borderRadius: '0.625rem', backgroundColor: '#09111e', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Proton Motive Force (Δp)</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38bdf8' }}>
              {evaluation.bioenergetics.protonMotiveForce_pmf_mV} <span style={{ fontSize: '11px' }}>mV</span>
            </span>
            <span style={{ fontSize: '9px', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>
              ΔpH = {evaluation.bioenergetics.deltaPh}
            </span>
          </div>

          {/* ATP Synthesis */}
          <div style={{ padding: '0.75rem', borderRadius: '0.625rem', backgroundColor: '#09111e', border: '1px solid rgba(52, 211, 153, 0.25)' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>ATP Synthesis Rate</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34d399' }}>
              {evaluation.bioenergetics.atpSynthesisFlux_nmol_mg_min}
            </span>
            <span style={{ fontSize: '9px', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>
              nmol/(mg·min)
            </span>
          </div>

          {/* Superoxide ROS */}
          <div
            style={{
              padding: '0.75rem',
              borderRadius: '0.625rem',
              backgroundColor: '#09111e',
              border: evaluation.rosDynamics.oxidativeStressWarning
                ? '1px solid rgba(239, 68, 68, 0.5)'
                : '1px solid rgba(245, 158, 11, 0.25)',
            }}
          >
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Superoxide (ROS)</span>
            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: 900,
                color: evaluation.rosDynamics.oxidativeStressWarning ? '#ef4444' : '#fbbf24',
              }}
            >
              {evaluation.rosDynamics.superoxideGenerationRate_pmol_min}
            </span>
            <span style={{ fontSize: '9px', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>
              pmol/min (Stress: {Math.round(evaluation.rosDynamics.netOxidativeStressIndex * 100)}%)
            </span>
          </div>

          {/* AMPK Activation */}
          <div style={{ padding: '0.75rem', borderRadius: '0.625rem', backgroundColor: '#09111e', border: '1px solid rgba(167, 139, 250, 0.25)' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>AMPK Thr172 (Sensor)</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#a78bfa' }}>
              {Math.round(evaluation.metabolicRheostat.ampkAlphaThr172Phosphorylation * 100)}%
            </span>
            <span style={{ fontSize: '9px', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>
              AEC: {evaluation.metabolicRheostat.atkinsonEnergyCharge.toFixed(2)}
            </span>
          </div>

          {/* mTORC1 Activity */}
          <div style={{ padding: '0.75rem', borderRadius: '0.625rem', backgroundColor: '#09111e', border: '1px solid rgba(244, 63, 94, 0.25)' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>mTORC1 Ser2448</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f43f5e' }}>
              {Math.round(evaluation.metabolicRheostat.mtorc1Ser2448Activity * 100)}%
            </span>
            <span style={{ fontSize: '9px', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>
              {evaluation.metabolicRheostat.metabolicOrientation.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Autophagic Clearance */}
          <div style={{ padding: '0.75rem', borderRadius: '0.625rem', backgroundColor: '#09111e', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>LC3-II Clearance</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38bdf8' }}>
              {evaluation.autophagicFlux.autophagosomeClearanceRate_pct_hr}%
            </span>
            <span style={{ fontSize: '9px', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>
              per hour ({evaluation.autophagicFlux.lysosomalFusionStatus.replace(/_/g, ' ')})
            </span>
          </div>
        </div>
      </div>

      {/* Electron Transport Chain & Complex Flux Breakdown */}
      <div
        style={{
          padding: '0.875rem',
          borderRadius: '0.75rem',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase' }}>
            Respiratory Chain Complex Fluxes (Complex I–V)
          </span>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
            H⁺ Pumping Rate: <b>{evaluation.etcFlux.totalProtonPumpingRate_H_per_sec} H⁺/s</b>
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem' }}>
          {[
            { label: 'CI (NADH-Q)', val: evaluation.etcFlux.complexIActivityRate, color: '#38bdf8' },
            { label: 'CII (Succinate)', val: evaluation.etcFlux.complexIIActivityRate, color: '#a78bfa' },
            { label: 'CIII (Q-Cycle)', val: evaluation.etcFlux.complexIIIActivityRate, color: '#f59e0b' },
            { label: 'CIV (Cyto-c Ox)', val: evaluation.etcFlux.complexIVActivityRate, color: '#ec4899' },
            { label: 'CV (ATP Synth)', val: evaluation.etcFlux.complexVAtpSynthaseRate, color: '#34d399' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: '0.5rem',
                borderRadius: '0.5rem',
                backgroundColor: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.06)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>{item.label}</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: item.color, marginTop: '0.15rem' }}>
                {Math.round(item.val * 100)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Narrative & Audit Footer */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '11px',
          color: '#cbd5e1',
        }}
      >
        <div style={{ lineHeight: '1.4' }}>
          <b>Mechanistic Summary:</b> {evaluation.summaryNarrative}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
            paddingTop: '0.375rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '10px',
            color: '#64748b',
          }}
        >
          <span>
            Truth Class: <b style={{ color: '#94a3b8' }}>{evaluation.truthClass}</b> · <i>No Biomarkers Manufactured</i>
          </span>
          <span>
            Audit SHA-256: <code style={{ color: '#38bdf8' }}>{evaluation.cryptographicSha256Digest.slice(0, 16)}…</code>
          </span>
        </div>
      </div>
    </div>
  )
}
