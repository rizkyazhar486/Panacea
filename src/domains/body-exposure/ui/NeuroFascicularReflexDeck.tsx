/**
 * @file NeuroFascicularReflexDeck.tsx
 * @description Interactive 4D Cranial Nerve Reflex Arcs & Long Tract Deficit Localizer Deck (Pillar VII).
 * Pure inline styles to preserve zero Tailwind bundle overhead.
 */

import { useState, useMemo } from 'react'
import {
  CRANIAL_NERVES,
  BRAINSTEM_REFLEX_ARCS,
  NEURO_SYNDROMES,
  simulateReflexArc,
  evaluateNeurologicalSyndrome,
  type CranialNerveProfile,
} from '../engine/neuroFascicularTractographyEngine'
import { DECK_ACTIVE_FILL } from './deck-kit/deckA11y'
import { OculomotorLesionLab } from './OculomotorLesionLab'

export interface NeuroFascicularReflexDeckProps {
  readonly initialTab?: 'nerves' | 'reflexes' | 'syndromes'
}

export function NeuroFascicularReflexDeck({ initialTab = 'nerves' }: NeuroFascicularReflexDeckProps = {}) {
  const [activeTab, setActiveTab] = useState<'nerves' | 'reflexes' | 'syndromes'>(initialTab)
  const [selectedNerveId, setSelectedNerveId] = useState<string>('cn-3')
  const [selectedReflexId, setSelectedReflexId] = useState<string>('pupillary-light-reflex')
  const [stimulusSide, setStimulusSide] = useState<'left' | 'right'>('right')
  const [afferentIntact, setAfferentIntact] = useState<boolean>(true)
  const [centralIntact, setCentralIntact] = useState<boolean>(true)
  const [efferentIpsiIntact, setEfferentIpsiIntact] = useState<boolean>(true)
  const [efferentContraIntact, setEfferentContraIntact] = useState<boolean>(true)
  const [selectedSyndromeId, setSelectedSyndromeId] = useState<string>('wallenberg-syndrome')

  const activeNerve: CranialNerveProfile = useMemo(
    () => CRANIAL_NERVES.find((n) => n.id === selectedNerveId) ?? CRANIAL_NERVES[2],
    [selectedNerveId],
  )

  const reflexResult = useMemo(
    () =>
      simulateReflexArc(selectedReflexId, stimulusSide, {
        afferentIntact,
        centralIntact,
        efferentIpsilateralIntact: efferentIpsiIntact,
        efferentContralateralIntact: efferentContraIntact,
      }),
    [selectedReflexId, stimulusSide, afferentIntact, centralIntact, efferentIpsiIntact, efferentContraIntact],
  )

  const syndromeResult = useMemo(
    () => evaluateNeurologicalSyndrome(selectedSyndromeId),
    [selectedSyndromeId],
  )

  return (
    <div
      style={{
        borderRadius: '1.25rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'linear-gradient(135deg, rgba(8, 12, 20, 0.95), rgba(15, 23, 42, 0.92))',
        padding: '1.25rem',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        marginBottom: '1.5rem',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#38bdf8' }}>
              Pillar VII · Cranial Nerve & Tractography Engine
            </span>
            <span style={{ fontSize: '0.625rem', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 700 }}>
              Rule-of-4
            </span>
          </div>
          <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#ffffff' }}>
            Neuro-Fascicular Reflex Arcs & Deficit Localizer
          </h3>
        </div>

        {/* Tab Switcher */}
        <div role="group" aria-label="Neuro view" style={{ display: 'flex', flexWrap: 'wrap', maxWidth: '100%', gap: '0.35rem', background: 'rgba(0,0,0,0.3)', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
          {(['nerves', 'reflexes', 'syndromes'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              aria-pressed={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? DECK_ACTIVE_FILL : 'transparent',
                color: activeTab === tab ? '#ffffff' : '#94a3b8',
                border: 'none',
                padding: '0.35rem 0.75rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab === 'nerves' ? '12 Cranial Nerves' : tab === 'reflexes' ? 'Brainstem Reflex Loops' : 'Syndromic Localizer'}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: 12 CRANIAL NERVES CATALOG */}
      {activeTab === 'nerves' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {/* Left: Nerve Grid */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '0.5rem' }}>
              Select Cranial Nerve
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
              {CRANIAL_NERVES.map((n) => {
                const isSelected = n.id === selectedNerveId
                return (
                  <button
                    key={n.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedNerveId(n.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.5rem 0.25rem',
                      borderRadius: '0.5rem',
                      border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.06)',
                      background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.02)',
                      color: isSelected ? '#38bdf8' : '#e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: 900 }}>{n.roman}</span>
                    <span style={{ fontSize: '0.625rem', color: isSelected ? 'inherit' : '#94a3b8', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60px' }}>
                      {n.name.split(' ')[0]}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Brainstem level badge */}
            <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.75rem' }}>
              <div style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700 }}>Brainstem Level Anatomy</div>
              <div style={{ color: '#38bdf8', fontWeight: 800, marginTop: '0.15rem' }}>{activeNerve.brainstemLevel}</div>
              <div style={{ color: '#cbd5e1', fontSize: '0.7rem', marginTop: '0.2rem' }}>
                Exit: <b>{activeNerve.exitForamen}</b>
              </div>
            </div>
          </div>

          {/* Right: Detailed Dossier */}
          <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '0.75rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#38bdf8' }}>{activeNerve.roman} — {activeNerve.name}</span>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {activeNerve.functionalTypes.map((ft) => (
                  <span key={ft} style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem', borderRadius: '0.2rem', background: 'rgba(56, 189, 248, 0.2)', color: '#bae6fd', fontWeight: 800 }}>
                    {ft}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.6rem', fontSize: '0.75rem' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Nuclei of Origin</span>
                <span style={{ color: '#e2e8f0' }}>{activeNerve.originNuclei.join(', ')}</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Peripheral Innervation</span>
                <span style={{ color: '#e2e8f0' }}>{activeNerve.innervation}</span>
              </div>
              <div style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <span style={{ color: '#38bdf8', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, display: 'block' }}>Clinical Bedside Maneuver</span>
                <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{activeNerve.clinicalTest}</span>
              </div>
              {['cn-3', 'cn-4', 'cn-6'].includes(activeNerve.id) && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#a78bfa', marginBottom: '0.4rem', letterSpacing: '0.08em' }}>
                    Interactive 9-Cardinal Gaze Motility Simulator
                  </div>
                  <OculomotorLesionLab />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BRAINSTEM REFLEX LOOPS */}
      {activeTab === 'reflexes' && (
        <div>
          {/* Reflex Selector */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {BRAINSTEM_REFLEX_ARCS.map((r) => (
              <button
                key={r.id}
                type="button"
                aria-pressed={selectedReflexId === r.id}
                onClick={() => setSelectedReflexId(r.id)}
                style={{
                  background: selectedReflexId === r.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.03)',
                  border: selectedReflexId === r.id ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                  color: selectedReflexId === r.id ? '#38bdf8' : '#cbd5e1',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {r.name}
              </button>
            ))}
          </div>

          {/* Interactive Reflex Simulator Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '0.5rem' }}>
                Stimulus & Pathway Lesion Sandbox
              </div>
              <div role="group" aria-label="Stimulus side" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  aria-pressed={stimulusSide === 'right'}
                  onClick={() => setStimulusSide('right')}
                  style={{
                    flex: 1,
                    padding: '0.35rem',
                    borderRadius: '0.375rem',
                    border: stimulusSide === 'right' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                    background: stimulusSide === 'right' ? DECK_ACTIVE_FILL : 'transparent',
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Stimulus Right Side
                </button>
                <button
                  type="button"
                  aria-pressed={stimulusSide === 'left'}
                  onClick={() => setStimulusSide('left')}
                  style={{
                    flex: 1,
                    padding: '0.35rem',
                    borderRadius: '0.375rem',
                    border: stimulusSide === 'left' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                    background: stimulusSide === 'left' ? DECK_ACTIVE_FILL : 'transparent',
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Stimulus Left Side
                </button>
              </div>

              {/* Toggles for arc integrity */}
              <div style={{ display: 'grid', gap: '0.4rem', fontSize: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.5rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.02)' }}>
                  <span>Afferent Limb Intact ({BRAINSTEM_REFLEX_ARCS.find((r) => r.id === selectedReflexId)?.afferentCranialNerve})</span>
                  <input type="checkbox" checked={afferentIntact} onChange={(e) => setAfferentIntact(e.target.checked)} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.5rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.02)' }}>
                  <span>Central Interneurons Intact</span>
                  <input type="checkbox" checked={centralIntact} onChange={(e) => setCentralIntact(e.target.checked)} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.5rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.02)' }}>
                  <span>Ipsilateral Efferent Intact</span>
                  <input type="checkbox" checked={efferentIpsiIntact} onChange={(e) => setEfferentIpsiIntact(e.target.checked)} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.5rem', borderRadius: '0.375rem', background: 'rgba(255,255,255,0.02)' }}>
                  <span>Contralateral Efferent Intact</span>
                  <input type="checkbox" checked={efferentContraIntact} onChange={(e) => setEfferentContraIntact(e.target.checked)} />
                </label>
              </div>
            </div>

            {/* Results Output */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '0.5rem' }}>
                Reflex Arc Response
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ padding: '0.6rem', borderRadius: '0.5rem', background: reflexResult.directResponse === 'intact' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: reflexResult.directResponse === 'intact' ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.3)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, color: '#94a3b8' }}>Direct Response</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 900, color: reflexResult.directResponse === 'intact' ? '#4ade80' : '#f87171' }}>
                    {reflexResult.directResponse.toUpperCase()}
                  </div>
                </div>
                <div style={{ padding: '0.6rem', borderRadius: '0.5rem', background: reflexResult.consensualResponse === 'intact' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: reflexResult.consensualResponse === 'intact' ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.3)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, color: '#94a3b8' }}>Consensual Response</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 900, color: reflexResult.consensualResponse === 'intact' ? '#4ade80' : '#f87171' }}>
                    {reflexResult.consensualResponse.toUpperCase()}
                  </div>
                </div>
              </div>

              <div style={{ padding: '0.6rem', borderRadius: '0.5rem', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', fontSize: '0.75rem' }}>
                <span style={{ color: '#38bdf8', fontWeight: 800 }}>Clinical Diagnostic: </span>
                <span style={{ color: '#e2e8f0' }}>{reflexResult.diagnosticSummary}</span>
                <div style={{ marginTop: '0.4rem', color: '#94a3b8', fontSize: '0.65rem' }}>
                  Conduction latency: <b>~{reflexResult.latencyMs} ms</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SYNDROMIC LESION LOCALIZER */}
      {activeTab === 'syndromes' && (
        <div>
          {/* Syndrome Selector */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {NEURO_SYNDROMES.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={selectedSyndromeId === s.id}
                onClick={() => setSelectedSyndromeId(s.id)}
                style={{
                  background: selectedSyndromeId === s.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.03)',
                  border: selectedSyndromeId === s.id ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                  color: selectedSyndromeId === s.id ? '#38bdf8' : '#cbd5e1',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {s.name.split(' ')[0]} {s.name.split(' ')[1]}
              </button>
            ))}
          </div>

          {/* Dossier Card */}
          <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '0.75rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#38bdf8' }}>{syndromeResult.syndromeName}</span>
              <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 800 }}>
                Level: {syndromeResult.ruleOf4Level}
              </span>
            </div>

            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
              Vascular Territory: <b style={{ color: '#cbd5e1' }}>{syndromeResult.vascularTerritory}</b>
            </div>

            <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
              {/* Ipsilateral Findings */}
              <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f87171' }}>
                  Ipsilateral Cranial & Body Signs
                </span>
                <ul style={{ margin: '0.4rem 0 0 0', paddingLeft: '1.1rem', fontSize: '0.75rem', color: '#fecaca', display: 'grid', gap: '0.3rem' }}>
                  {syndromeResult.ipsilateralBodySigns.map((sign, idx) => (
                    <li key={idx}>{sign}</li>
                  ))}
                </ul>
              </div>

              {/* Contralateral Findings */}
              <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#38bdf8' }}>
                  Contralateral Body Deficits (Long Tracts)
                </span>
                <ul style={{ margin: '0.4rem 0 0 0', paddingLeft: '1.1rem', fontSize: '0.75rem', color: '#bae6fd', display: 'grid', gap: '0.3rem' }}>
                  {syndromeResult.contralateralBodySigns.map((sign, idx) => (
                    <li key={idx}>{sign}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fail-closed Boundary Notice */}
      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: '#64748b' }}>
        <span>Truth Class: <b>mechanistic_simulation_proxy</b> · Never manufactures biomarkers</span>
        <span>Anatomical Reference: Haines Neuroanatomy & Blumenfeld Clinical Neuroanatomy</span>
      </div>
    </div>
  )
}
