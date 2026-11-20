// Visual-first 11-system whole-body interactive simulator: organ vector logos,
// 11-axis polar radar chart, live SVG phase/waveform oscilloscope, and circular
// radial gauges. All reference prose sits inside a compact ⓘ disclosure.

import { useEffect, useMemo, useState } from 'react'
import { AstralChartMatrix } from '../../../components/ui/AstralChartMatrix'
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
import { TONE, TOUCH, subtleButton } from './atlas-stage/stageTokens'
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

const BAND_SCORE: Record<PhysiologyStateBand, number> = {
  homeostatic: 0.92,
  compensating: 0.64,
  strained: 0.36,
}

const DIR_GLYPH = { up: '↑', down: '↓', steady: '—' } as const

function OrganLogo({ id, color }: { id: BodySystemId; color: string }) {
  const common = { fill: 'none', stroke: color, strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (id) {
    case 'cardiovascular':
      return <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path {...common} d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /><path {...common} d="M8 12h2l1.5-3 2 6 1.5-3h2" /></svg>
    case 'nervous':
      return <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path {...common} d="M9 6a3 3 0 0 0-3 3v1a2.5 2.5 0 0 0 0 5v1a3 3 0 0 0 6 0V6a3 3 0 0 0-3 0Z" /><path {...common} d="M15 6a3 3 0 0 1 3 3v1a2.5 2.5 0 0 1 0 5v1a3 3 0 0 1-6 0" /></svg>
    case 'respiratory':
      return <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path {...common} d="M12 4v8M12 10l-4 3v5a2 2 0 0 1-4 0v-4c0-3 3-6 6-6M12 10l4 3v5a2 2 0 0 0 4 0v-4c0-3-3-6-6-6" /></svg>
    case 'digestive':
      return <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path {...common} d="M10 4v4c0 2 5 2 5 6a5 5 0 0 1-10 0c0-2 2-4 5-4" /></svg>
    case 'urinary':
      return <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path {...common} d="M9 5c-3.5 0-5 3.5-4 7s3 6 5.5 5c1.5-.6 1.5-2.5.5-4.5s-1-4.5.5-5.5C12.5 6 11 5 9 5Z" /><path {...common} d="M15 5c3.5 0 5 3.5 4 7s-3 6-5.5 5" /></svg>
    case 'endocrine':
      return <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle {...common} cx="12" cy="12" r="3.5" /><path {...common} d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.2 2.2M16.2 16.2l2.2 2.2" /></svg>
    case 'reproductive':
      return <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path {...common} d="M7 4c4 4 6 12 10 16M17 4C13 8 11 16 7 20M8 8h8M8 16h8" /></svg>
    case 'lymphatic-immune':
      return <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path {...common} d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" /><path {...common} d="M12 8v8M8 12h8" /></svg>
    case 'musculoskeletal':
      return <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path {...common} d="M6 15c2-5 5-7 12-7-1 5-4 8-9 9l-3-2Z" /><circle {...common} cx="6" cy="16" r="2" /></svg>
    case 'sensory-ent':
      return <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path {...common} d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z" /><circle {...common} cx="12" cy="12" r="2.8" /></svg>
    case 'integumentary-surface':
      return <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path {...common} d="M3 8c3-2 6 2 9 0s6 2 9 0M3 13c3-2 6 2 9 0s6 2 9 0M3 18c3-2 6 2 9 0s6 2 9 0" /></svg>
  }
}

function RadialGaugeTile({
  label,
  value,
  unit,
  color,
  ratio,
}: {
  label: string
  value: number
  unit: string
  color: string
  ratio: number
}) {
  const r = 18
  const circ = 2 * Math.PI * r
  const dash = Math.max(0.08, Math.min(1, ratio)) * circ
  return (
    <div style={{ padding: '8px 10px', borderRadius: 14, border: `1px solid ${TONE.line}`, background: TONE.raised, display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg viewBox="0 0 44 44" width="42" height="42" aria-hidden="true" style={{ flex: 'none' }}>
        <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(148,197,255,0.14)" strokeWidth="4" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${dash.toFixed(1)} ${circ.toFixed(1)}`}
          transform="rotate(-90 22 22)"
        />
      </svg>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 900, color, lineHeight: 1.1 }}>
          {value} <span style={{ fontSize: 10.5, fontWeight: 700, color: TONE.dim }}>{unit}</span>
        </div>
        <div style={{ marginTop: 2, fontSize: 11, fontWeight: 700, color: TONE.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
      </div>
    </div>
  )
}

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

  const allEvaluations = useMemo(() => {
    if (activePreset !== 'custom') return evaluateAll11Systems(activePreset)
    return WHOLE_BODY_11_SPECS.flatMap((s) => {
      const r = evaluateWholeBodySystem(s.systemId, paramsBySystem[s.systemId], 'Custom')
      return r.ok ? [r] : []
    })
  }, [activePreset, paramsBySystem])

  const allStatus = useMemo(
    () => new Map(allEvaluations.map((r) => [r.systemId, r.overallBand] as const)),
    [allEvaluations],
  )

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

  // 11-Axis Whole-Body Radar polygon [viewBox 0 0 180 180]
  const radar = useMemo(() => {
    const cx = 90
    const cy = 90
    const maxR = 64
    const n = WHOLE_BODY_11_SPECS.length
    const nodes = WHOLE_BODY_11_SPECS.map((item, idx) => {
      const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / n
      const band = allStatus.get(item.systemId) ?? 'homeostatic'
      const score = BAND_SCORE[band]
      return {
        id: item.systemId,
        short: item.shortLabel,
        accent: item.accent,
        band,
        ax: cx + maxR * Math.cos(angle),
        ay: cy + maxR * Math.sin(angle),
        lx: cx + (maxR + 17) * Math.cos(angle),
        ly: cy + (maxR + 17) * Math.sin(angle),
        px: cx + maxR * score * Math.cos(angle),
        py: cy + maxR * score * Math.sin(angle),
      }
    })
    const polygon = nodes.map((pt) => `${pt.px.toFixed(1)},${pt.py.toFixed(1)}`).join(' ')
    return { cx, cy, maxR, nodes, polygon }
  }, [allStatus])

  // SVG plot projection [0..340 x 0..176]
  const plot = useMemo(() => {
    if (!sim.ok) return null
    const [x0, x1] = sim.xDomain
    const [y0, y1] = sim.yDomain
    const sx = (x: number) => 36 + ((x - x0) / Math.max(1e-6, x1 - x0)) * 290
    const sy = (y: number) => 150 - ((y - y0) / Math.max(1e-6, y1 - y0)) * 130
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
        gap: 10,
        padding: 12,
        borderRadius: 18,
        border: `1px solid ${TONE.lineStrong}`,
        background: 'linear-gradient(180deg, #070d18, #04070e)',
        color: TONE.text,
      }}
    >
      {/* Compact Visual Bar: Organ Logo + Short Title + Simulated Badge */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <OrganLogo id={spec.systemId} color={spec.accent} />
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: TONE.text }}>{spec.label}</h4>
        </div>
        <span style={{ padding: '3px 9px', borderRadius: 999, border: `1px solid ${TONE.sim}`, color: TONE.sim, fontSize: 10.5, fontWeight: 800 }}>
          truthClass: simulated
        </span>
      </header>

      {/* 11-System Organ Logo Dock */}
      <div role="group" aria-label="Select body system simulation" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(74px, 1fr))', gap: 6 }}>
        {WHOLE_BODY_11_SPECS.map((item) => {
          const selected = item.systemId === spec.systemId
          const band = allStatus.get(item.systemId) ?? 'homeostatic'
          return (
            <button
              key={item.systemId}
              type="button"
              aria-pressed={selected}
              aria-label={item.label}
              data-whole-body-system={item.systemId}
              onClick={() => pickSystem(item.systemId)}
              className="as-focus as-hover as-fade"
              style={{
                minHeight: TOUCH,
                padding: '6px 4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                borderRadius: 12,
                border: `1px solid ${selected ? item.accent : TONE.line}`,
                background: selected ? 'rgba(92, 214, 255, 0.16)' : TONE.raised,
                color: TONE.text,
                fontSize: 10.5,
                fontWeight: 800,
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <OrganLogo id={item.systemId} color={selected ? item.accent : '#a9b9cf'} />
              <span style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.shortLabel}</span>
              <span aria-hidden="true" style={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: 999, background: BAND_COLOR[band] }} />
            </button>
          )
        })}
      </div>

      {/* 6 One-Tap Physiological State Presets */}
      <div role="group" aria-label="Whole-body physiological stress presets" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
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
                padding: '0 8px',
                borderColor: pressed ? TONE.live : TONE.line,
                background: pressed ? TONE.active : TONE.raised,
                color: pressed ? TONE.onActive : TONE.text,
                fontSize: 11.5,
                fontWeight: 800,
              }}
            >
              {preset.short}
            </button>
          )
        })}
      </div>

      {/* Dual Visual Canvas: 11-Axis Whole-Body Radar + Live Organ Oscilloscope */}
      {sim.ok && plot && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8 }}>
          {/* Chart 1: 11-System Whole-Body Polar Radar */}
          <div style={{ borderRadius: 14, border: `1px solid ${TONE.line}`, background: '#03060c', padding: 8, display: 'grid', placeItems: 'center' }}>
            <svg
              viewBox="0 0 180 180"
              role="img"
              aria-label="Whole-body 11-system homeostasis radar chart"
              style={{ width: '100%', maxWidth: 190, height: 'auto', display: 'block' }}
            >
              {[22, 43, 64].map((r) => (
                <circle key={r} cx={radar.cx} cy={radar.cy} r={r} fill="none" stroke="rgba(148,197,255,0.14)" strokeWidth="0.8" />
              ))}
              {radar.nodes.map((n) => (
                <line key={n.id} x1={radar.cx} y1={radar.cy} x2={n.ax} y2={n.ay} stroke="rgba(148,197,255,0.16)" strokeWidth="0.7" />
              ))}
              <polygon points={radar.polygon} fill="rgba(92, 214, 255, 0.2)" stroke="#5cd6ff" strokeWidth="1.8" />
              {radar.nodes.map((n) => (
                <g key={n.id}>
                  <circle
                    cx={n.px}
                    cy={n.py}
                    r={n.id === spec.systemId ? 4.2 : 2.8}
                    fill={BAND_COLOR[n.band]}
                    stroke="#03060c"
                    strokeWidth="1"
                  />
                  <text x={n.lx} y={n.ly + 3} textAnchor="middle" fill={n.id === spec.systemId ? '#fde68a' : '#a9b9cf'} fontSize="7.5" fontWeight="800">
                    {n.short}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Chart 2: Live Organ Phase-Loop / Oscilloscope */}
          <div style={{ borderRadius: 14, border: `1px solid ${TONE.line}`, background: '#03060c', padding: 8 }}>
            <svg
              viewBox="0 0 340 176"
              role="img"
              aria-label={plot.ariaLabel}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            >
              {[20, 52, 84, 116, 150].map((y) => (
                <line key={y} x1="36" y1={y} x2="326" y2={y} stroke="rgba(148,197,255,0.12)" strokeWidth="0.8" />
              ))}
              {[36, 108, 181, 253, 326].map((x) => (
                <line key={x} x1={x} y1="20" x2={x} y2="150" stroke="rgba(148,197,255,0.12)" strokeWidth="0.8" />
              ))}
              <line x1="36" y1="150" x2="326" y2="150" stroke="rgba(148,197,255,0.45)" strokeWidth="1" />
              <line x1="36" y1="20" x2="36" y2="150" stroke="rgba(148,197,255,0.45)" strokeWidth="1" />
              {plot.paths.map((p) => (
                <path key={p.id} d={p.d} fill={p.d.endsWith('Z') ? 'rgba(92,214,255,0.1)' : 'none'} stroke={p.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              ))}
              <line x1={plot.op.x} y1="20" x2={plot.op.x} y2="150" stroke="rgba(253,230,138,0.45)" strokeDasharray="3 3" strokeWidth="1" />
              <circle cx={plot.op.x} cy={plot.op.y} r="5.2" fill="#fde68a" stroke="#03060c" strokeWidth="1.5" />
              <text x="181" y="168" textAnchor="middle" fill="#a9b9cf" fontSize="9.5" fontWeight="700">{sim.xAxisLabel}</text>
              <text x="11" y="85" textAnchor="middle" fill="#a9b9cf" fontSize="9.5" fontWeight="700" transform="rotate(-90 11 85)">{sim.yAxisLabel}</text>
            </svg>
          </div>
        </div>
      )}

      {/* Radial Ring Gauge Readouts */}
      {sim.ok && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
          {sim.metrics.map((m, idx) => (
            <RadialGaugeTile
              key={m.id}
              label={m.label}
              value={m.value}
              unit={m.unit}
              color={BAND_COLOR[m.band]}
              ratio={m.band === 'homeostatic' ? 0.82 - idx * 0.06 : m.band === 'compensating' ? 0.58 : 0.34}
            />
          ))}
        </div>
      )}

      {/* Tactile Parameter Sliders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
        {spec.params.map((p) => {
          const val = currentInputs[p.key] ?? p.defaultValue
          const inputId = `wb-sim-${spec.systemId}-${p.key}`
          return (
            <div key={p.key} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <label htmlFor={inputId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 800, color: TONE.text }}>
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

      {/* Visual Cross-System Coupling Chips (icon + arrow + short system name only) */}
      {sim.ok && sim.couplings.length > 0 && (
        <div role="group" aria-label="Cross-system coupling jumps" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {sim.couplings.map((c) => (
            <button
              key={c.targetSystemId}
              type="button"
              onClick={() => pickSystem(c.targetSystemId)}
              aria-label={`${c.targetLabel}: ${c.mechanism}`}
              className="as-focus as-hover as-fade"
              style={{
                minHeight: TOUCH,
                padding: '0 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 999,
                border: `1px solid ${TONE.line}`,
                background: TONE.raised,
                color: TONE.text,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              <OrganLogo id={c.targetSystemId} color={c.direction === 'up' ? TONE.sim : c.direction === 'down' ? TONE.gate : TONE.liveText} />
              <span style={{ color: c.direction === 'up' ? TONE.sim : c.direction === 'down' ? TONE.gate : TONE.liveText }}>
                {DIR_GLYPH[c.direction]} {c.targetLabel}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 12-Chart Dynamic Astral Telemetry & Anatomical Body Hotspot Studio */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
          <button
            type="button"
            onClick={() => setShowChartMatrix((v) => !v)}
            aria-expanded={showChartMatrix}
            aria-label="Toggle 12-chart telemetry studio"
            style={{ ...subtleButton(showChartMatrix), minHeight: TOUCH }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 19h16 M7 16v-5 M12 16V8 M17 16V5" />
            </svg>
            <span>12-Chart Studio</span>
          </button>
        </div>
        {showChartMatrix && <AstralChartMatrix />}
      </div>

      {/* Compact ⓘ Disclosure hides all text formulas, citations, and vertical-gap prose */}
      {sim.ok && (
        <details style={{ borderRadius: 12, border: `1px dashed ${TONE.line}`, background: 'rgba(2, 6, 12, 0.7)' }}>
          <summary className="as-focus" style={{ minHeight: TOUCH, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: 11.5, fontWeight: 800, color: TONE.ref }}>
            <span>ⓘ {sim.equationName} · PubMed {sim.pmid}</span>
            <span style={{ color: TONE.dim, fontSize: 10.5 }}>clinicallyReviewed: false</span>
          </summary>
          <div style={{ padding: '0 12px 10px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5, color: TONE.dim }}>
            <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{sim.equationFormula}</div>
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
