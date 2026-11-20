// Interactive 11-system whole-body mechanistic simulator & live SVG oscilloscope
// for Body Exposure Stage 2 (Living Physiology). Loaded lazily so it adds zero
// render-blocking CSS or main-bundle weight. Inline TONE tokens keep >= 7:1 dark
// contrast in both themes and >= 44px touch targets on 390x844 mobile.

import { useEffect, useMemo, useState } from 'react'
import type { BodySystemId } from '../data/bodySystems'
import {
  WHOLE_BODY_11_SPECS,
  WHOLE_BODY_PRESETS,
  defaultParamsForSystem,
  evaluateAll11Systems,
  evaluateWholeBodySystem,
  type PhysiologyStateBand,
  type WholeBodyPresetId,
} from '../engine/whole-body-sim/wholeBody11SystemEngine'
import { TONE, TOUCH, eyebrow, subtleButton } from './atlas-stage/stageTokens'
import { sliderValueText } from './deck-kit/deckA11y'

export interface WholeBody11SystemLabProps {
  initialSystem?: BodySystemId | null
  onSelectSystem?: (id: BodySystemId) => void
}

const BAND_COLOR: Record<PhysiologyStateBand, string> = {
  homeostatic: TONE.liveText,
  compensating: TONE.sim,
  strained: TONE.gate,
}

const DIR_GLYPH = { up: '↑', down: '↓', steady: '—' } as const

export function WholeBody11SystemLab({ initialSystem = null, onSelectSystem }: WholeBody11SystemLabProps) {
  const [activeSystem, setActiveSystem] = useState<BodySystemId>(initialSystem ?? 'cardiovascular')
  const [activePreset, setActivePreset] = useState<WholeBodyPresetId | 'custom'>('rest')
  const [paramsBySystem, setParamsBySystem] = useState<Record<BodySystemId, Record<string, number>>>(() =>
    Object.fromEntries(WHOLE_BODY_11_SPECS.map((s) => [s.systemId, defaultParamsForSystem(s.systemId)])) as Record<
      BodySystemId,
      Record<string, number>
    >,
  )

  useEffect(() => {
    if (initialSystem) setActiveSystem(initialSystem)
  }, [initialSystem])

  const spec = useMemo(
    () => WHOLE_BODY_11_SPECS.find((s) => s.systemId === activeSystem) ?? WHOLE_BODY_11_SPECS[0],
    [activeSystem],
  )

  const currentInputs = paramsBySystem[spec.systemId]
  const sim = useMemo(() => {
    const presetLabel = activePreset === 'custom'
      ? 'Custom'
      : WHOLE_BODY_PRESETS.find((p) => p.id === activePreset)?.label ?? 'Rest Baseline'
    return evaluateWholeBodySystem(spec.systemId, currentInputs, presetLabel)
  }, [spec.systemId, currentInputs, activePreset])

  const allStatus = useMemo(() => {
    if (activePreset !== 'custom') {
      return new Map(evaluateAll11Systems(activePreset).map((r) => [r.systemId, r.overallBand] as const))
    }
    return new Map(
      WHOLE_BODY_11_SPECS.map((s) => {
        const r = evaluateWholeBodySystem(s.systemId, paramsBySystem[s.systemId], 'Custom')
        return [s.systemId, r.ok ? r.overallBand : 'homeostatic'] as const
      }),
    )
  }, [activePreset, paramsBySystem])

  const applyPreset = (id: WholeBodyPresetId) => {
    const preset = WHOLE_BODY_PRESETS.find((p) => p.id === id)
    if (!preset) return
    setActivePreset(id)
    setParamsBySystem(
      Object.fromEntries(
        WHOLE_BODY_11_SPECS.map((s) => [s.systemId, { ...preset.params[s.systemId] }]),
      ) as Record<BodySystemId, Record<string, number>>,
    )
  }

  const updateParam = (key: string, value: number) => {
    setActivePreset('custom')
    setParamsBySystem((prev) => ({
      ...prev,
      [spec.systemId]: { ...prev[spec.systemId], [key]: value },
    }))
  }

  const pickSystem = (id: BodySystemId) => {
    setActiveSystem(id)
    onSelectSystem?.(id)
  }

  // SVG plot projection [0..340 x 0..176]
  const plot = useMemo(() => {
    if (!sim.ok) return null
    const [x0, x1] = sim.xDomain
    const [y0, y1] = sim.yDomain
    const sx = (x: number) => 38 + ((x - x0) / Math.max(1e-6, x1 - x0)) * 288
    const sy = (y: number) => 148 - ((y - y0) / Math.max(1e-6, y1 - y0)) * 128
    const paths = sim.series.map((s) => ({
      id: s.id,
      label: s.label,
      color: s.color,
      d: s.points
        .map((pt, idx) => `${idx === 0 ? 'M' : 'L'}${sx(pt.x).toFixed(1)} ${sy(pt.y).toFixed(1)}`)
        .join(' ') + (s.closed ? ' Z' : ''),
    }))
    const op = { x: sx(sim.operatingPoint.x), y: sy(sim.operatingPoint.y) }
    const summaryText = sim.metrics.map((m) => `${m.label} ${m.value} ${m.unit}`).join(', ')
    return { paths, op, ariaLabel: `${sim.label} ${sim.equationName}: ${summaryText}` }
  }, [sim])

  return (
    <article
      data-testid="whole-body-11-system-lab"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: 14,
        borderRadius: 18,
        border: `1px solid ${TONE.lineStrong}`,
        background: 'linear-gradient(180deg, #070d18, #04070e)',
        color: TONE.text,
      }}
    >
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ ...eyebrow, color: TONE.ref }}>Whole-Body 11-System Simulation Lab</div>
          <h4 style={{ margin: '3px 0 0', fontSize: 17, fontWeight: 800, color: TONE.text }}>{spec.label} · {spec.simLabel}</h4>
        </div>
        <span style={{ padding: '4px 10px', borderRadius: 999, border: `1px solid ${TONE.sim}`, color: TONE.sim, fontSize: 11, fontWeight: 800 }}>
          truthClass: simulated
        </span>
      </header>

      {/* 11-System Tactical Selector Matrix */}
      <div role="group" aria-label="Select body system simulation" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))', gap: 6 }}>
        {WHOLE_BODY_11_SPECS.map((item) => {
          const selected = item.systemId === spec.systemId
          const band = allStatus.get(item.systemId) ?? 'homeostatic'
          return (
            <button
              key={item.systemId}
              type="button"
              aria-pressed={selected}
              data-whole-body-system={item.systemId}
              onClick={() => pickSystem(item.systemId)}
              className="as-focus as-hover as-fade"
              style={{
                minHeight: TOUCH,
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 6,
                borderRadius: 12,
                border: `1px solid ${selected ? item.accent : TONE.line}`,
                background: selected ? 'rgba(92, 214, 255, 0.16)' : TONE.raised,
                color: TONE.text,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.shortLabel}</span>
              <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 999, flex: 'none', background: BAND_COLOR[band] }} />
            </button>
          )
        })}
      </div>

      {/* 6 Whole-Body Stress Presets */}
      <div role="group" aria-label="Whole-body physiological stress presets" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {WHOLE_BODY_PRESETS.map((preset) => {
          const pressed = activePreset === preset.id
          return (
            <button
              key={preset.id}
              type="button"
              aria-pressed={pressed}
              data-whole-body-preset={preset.id}
              onClick={() => applyPreset(preset.id)}
              className="as-focus as-hover as-fade"
              style={{
                ...subtleButton,
                minHeight: TOUCH,
                padding: '0 12px',
                borderColor: pressed ? TONE.live : TONE.line,
                background: pressed ? TONE.active : TONE.raised,
                color: pressed ? TONE.onActive : TONE.text,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {preset.short}
            </button>
          )
        })}
      </div>

      {/* Live Neon SVG Oscilloscope / Phase Loop */}
      {sim.ok && plot && (
        <div style={{ borderRadius: 14, border: `1px solid ${TONE.line}`, background: '#03060c', padding: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: spec.accent }}>{sim.equationName}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: BAND_COLOR[sim.overallBand], textTransform: 'uppercase' }}>{sim.overallBand}</span>
          </div>
          <svg
            viewBox="0 0 340 176"
            role="img"
            aria-label={plot.ariaLabel}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          >
            {[20, 52, 84, 116, 148].map((y) => (
              <line key={y} x1="38" y1={y} x2="326" y2={y} stroke="rgba(148,197,255,0.12)" strokeWidth="0.8" />
            ))}
            {[38, 110, 182, 254, 326].map((x) => (
              <line key={x} x1={x} y1="20" x2={x} y2="148" stroke="rgba(148,197,255,0.12)" strokeWidth="0.8" />
            ))}
            <line x1="38" y1="148" x2="326" y2="148" stroke="rgba(148,197,255,0.45)" strokeWidth="1" />
            <line x1="38" y1="20" x2="38" y2="148" stroke="rgba(148,197,255,0.45)" strokeWidth="1" />
            {plot.paths.map((p) => (
              <path key={p.id} d={p.d} fill="none" stroke={p.color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            ))}
            <line x1={plot.op.x} y1="20" x2={plot.op.x} y2="148" stroke="rgba(253,230,138,0.45)" strokeDasharray="3 3" strokeWidth="1" />
            <circle cx={plot.op.x} cy={plot.op.y} r="5" fill="#fde68a" stroke="#03060c" strokeWidth="1.5" />
            <text x="182" y="168" textAnchor="middle" fill="#a9b9cf" fontSize="10" fontWeight="700">{sim.xAxisLabel}</text>
            <text x="12" y="86" textAnchor="middle" fill="#a9b9cf" fontSize="10" fontWeight="700" transform="rotate(-90 12 86)">{sim.yAxisLabel}</text>
          </svg>
          <div style={{ marginTop: 6, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 11.5, color: TONE.dim, overflowWrap: 'anywhere' }}>
            {sim.equationFormula}
          </div>
        </div>
      )}

      {/* HUD KPI Readouts */}
      {sim.ok && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
          {sim.metrics.map((m) => (
            <div key={m.id} style={{ padding: '9px 10px', borderRadius: 12, border: `1px solid ${TONE.line}`, background: TONE.raised }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: TONE.dim }}>{m.label}</div>
              <div style={{ marginTop: 2, fontSize: 17, fontWeight: 900, color: BAND_COLOR[m.band] }}>
                {m.value} <span style={{ fontSize: 11, fontWeight: 700, color: TONE.dim }}>{m.unit}</span>
              </div>
              <div style={{ marginTop: 2, fontSize: 10.5, color: TONE.faint }}>Ref: {m.refRange}</div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Mechanistic Parameter Sliders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        {spec.params.map((p) => {
          const val = currentInputs[p.key] ?? p.defaultValue
          const inputId = `wb-sim-${spec.systemId}-${p.key}`
          return (
            <div key={p.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label htmlFor={inputId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: TONE.text }}>
                <span>{p.label}</span>
                <span style={{ color: spec.accent }}>{val} {p.unit}</span>
              </label>
              <input
                id={inputId}
                type="range"
                min={p.min}
                max={p.max}
                step={p.step}
                value={val}
                aria-label={p.label}
                aria-valuetext={sliderValueText(val, p.unit)}
                onChange={(e) => updateParam(p.key, Number(e.target.value))}
                style={{ width: '100%', minHeight: TOUCH, accentColor: spec.accent, cursor: 'pointer' }}
              />
            </div>
          )
        })}
      </div>

      {/* Cross-System Coupling Propagation */}
      {sim.ok && sim.couplings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ ...eyebrow, color: TONE.ref }}>Cross-System Coupling Propagation</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {sim.couplings.map((c) => (
              <button
                key={c.targetSystemId}
                type="button"
                onClick={() => pickSystem(c.targetSystemId)}
                className="as-focus as-hover as-fade"
                style={{
                  minHeight: TOUCH,
                  padding: '6px 10px',
                  borderRadius: 12,
                  border: `1px solid ${TONE.line}`,
                  background: TONE.raised,
                  color: TONE.text,
                  fontSize: 12,
                  fontWeight: 700,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <span style={{ color: c.direction === 'up' ? TONE.sim : c.direction === 'down' ? TONE.gate : TONE.liveText, fontWeight: 900 }}>
                  {DIR_GLYPH[c.direction]} {c.targetLabel}
                </span>
                <span style={{ display: 'block', fontSize: 11, color: TONE.dim }}>{c.mechanism}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Provenance & Vertical Gap Disclosure */}
      {sim.ok && (
        <details style={{ borderRadius: 12, border: `1px dashed ${TONE.line}`, background: 'rgba(2, 6, 12, 0.7)' }}>
          <summary className="as-focus" style={{ minHeight: TOUCH, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: TONE.ref }}>
            <span>Provenance &amp; vertical gaps · PubMed {sim.pmid}</span>
            <span style={{ color: TONE.dim, fontSize: 11 }}>clinicallyReviewed: false</span>
          </summary>
          <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: TONE.dim }}>
            <div>
              <a href={sim.citationUrl} target="_blank" rel="noopener noreferrer" style={{ color: TONE.ref, fontWeight: 800 }}>
                PubMed {sim.pmid}
              </a>
              <span> — {sim.citationNote}</span>
            </div>
            <div style={{ color: TONE.faint }}>{sim.verticalGapNote}</div>
          </div>
        </details>
      )}
    </article>
  )
}

export default WholeBody11SystemLab
