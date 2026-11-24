import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FEATURE_GLYPH_SVG_PATHS, type FeatureGlyphId } from '../../lib/navigation/featureMap'
import { useVitals } from '../../lib/useVitals'
import { coupleEnvironmentToPhysiology } from '../../domains/body-exposure/engine/environmentPhysiologyCoupler'

export type AstralChartId =
  | 'all'
  | 'donut'
  | 'gauge'
  | 'waterfall'
  | 'comparison'
  | 'vein'
  | 'heatmap'
  | 'stacked'
  | 'bubble'
  | 'area'
  | 'radar'
  | 'diverging'

type OrganHotspot = {
  id: string
  label: string
  metric: string
  unit: string
  pct: number
  cx: number
  cy: number
  color: string
  to: string
  glyph: FeatureGlyphId
  wave: readonly number[]
}

const ORGAN_HOTSPOTS: readonly OrganHotspot[] = [
  { id: 'brain', label: 'Brain', metric: '95', unit: '%', pct: 95, cx: 50, cy: 14, color: '#a78bfa', to: '/mind-toolkit', glyph: 'brain', wave: [62, 78, 71, 89, 84, 95, 91, 95] },
  { id: 'heart', label: 'Heart', metric: '93', unit: 'bpm', pct: 93, cx: 53, cy: 34, color: '#fb7185', to: '/electrophysiology', glyph: 'heart', wave: [45, 92, 28, 96, 52, 88, 34, 93] },
  { id: 'lungs', label: 'Lungs', metric: '75', unit: '%', pct: 75, cx: 43, cy: 33, color: '#38bdf8', to: '/breathwork', glyph: 'lungs', wave: [50, 68, 82, 74, 58, 79, 86, 75] },
  { id: 'liver', label: 'Liver', metric: '93', unit: '%', pct: 93, cx: 44, cy: 45, color: '#34d399', to: '/fasting', glyph: 'flame', wave: [70, 75, 81, 86, 84, 90, 92, 93] },
  { id: 'kidney', label: 'Renal', metric: '91', unit: '%', pct: 91, cx: 55, cy: 48, color: '#22d3ee', to: '/hydration', glyph: 'bolt', wave: [66, 74, 79, 85, 88, 84, 90, 91] },
  { id: 'pelvis', label: 'Muscle', metric: '95', unit: '%', pct: 95, cx: 50, cy: 61, color: '#fbbf24', to: '/workout', glyph: 'layers', wave: [60, 72, 84, 79, 91, 88, 94, 95] },
]

const BRIDGE_LINKS: ReadonlyArray<{ to: string; label: string; color: string; glyph: FeatureGlyphId }> = [
  { to: '/fitness-hub', label: 'Your Body', color: '#34d399', glyph: 'flame' },
  { to: '/clinical-hub', label: 'Clinical', color: '#fb7185', glyph: 'shield' },
  { to: '/?t=for-you', label: 'For You', color: '#f472b6', glyph: 'users' },
  { to: '/body-exposure', label: 'Open 3D', color: '#22d3ee', glyph: 'layers' },
  { to: '/body-explorer', label: '3D Anatomy', color: '#fbbf24', glyph: 'compass' },
]

const CHART_TABS: ReadonlyArray<{ id: AstralChartId; label: string }> = [
  { id: 'all', label: 'All 11' },
  { id: 'donut', label: 'Donut' },
  { id: 'gauge', label: 'Gauge' },
  { id: 'waterfall', label: 'Waterfall' },
  { id: 'comparison', label: 'Compare' },
  { id: 'vein', label: 'Vein' },
  { id: 'heatmap', label: 'Heatmap' },
  { id: 'stacked', label: 'Stacked' },
  { id: 'bubble', label: 'Bubble' },
  { id: 'area', label: 'Area' },
  { id: 'radar', label: 'Radar' },
  { id: 'diverging', label: 'Diverging' },
]

function Glyph({ id, size = 15 }: { id: FeatureGlyphId; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={FEATURE_GLYPH_SVG_PATHS[id]} />
    </svg>
  )
}

export function AstralChartMatrix() {
  const vitals = useVitals()
  const [selectedOrganId, setSelectedOrganId] = useState<string>('heart')
  const [chartFilter, setChartFilter] = useState<AstralChartId>('all')
  const [gainPct, setGainPct] = useState<number>(100)
  const [bleStatus, setBleStatus] = useState<string>('BLE')
  const [showEnvPanel, setShowEnvPanel] = useState<boolean>(false)
  const [showInfo, setShowInfo] = useState<boolean>(false)
  const [envTempC, setEnvTempC] = useState<number>(30)
  const [envRhPct, setEnvRhPct] = useState<number>(65)
  const [envPm25, setEnvPm25] = useState<number>(22)
  const [envAltM, setEnvAltM] = useState<number>(150)

  const hasObservedVitals = Boolean(
    vitals.heartRate || vitals.restingHr || vitals.spo2Pct || vitals.systolic || vitals.hrvMs || vitals.sleepH,
  )
  const liveHr = typeof vitals.heartRate === 'number' && vitals.heartRate > 25 ? Math.round(vitals.heartRate) : (typeof vitals.restingHr === 'number' && vitals.restingHr > 25 ? Math.round(vitals.restingHr) : 72)
  const liveSpo2 = typeof vitals.spo2Pct === 'number' && vitals.spo2Pct > 50 ? Math.round(vitals.spo2Pct) : 98
  const liveResp = typeof vitals.respRate === 'number' && vitals.respRate > 4 ? Math.round(vitals.respRate) : 15
  const liveSbp = typeof vitals.systolic === 'number' && vitals.systolic > 60 ? Math.round(vitals.systolic) : 118
  const liveDbp = typeof vitals.diastolic === 'number' && vitals.diastolic > 30 ? Math.round(vitals.diastolic) : 76
  const liveHrv = typeof vitals.hrvMs === 'number' && vitals.hrvMs > 5 ? Math.round(vitals.hrvMs) : 64
  const liveRecovery = typeof vitals.recoveryPct === 'number' ? Math.round(vitals.recoveryPct) : 88
  const provenanceLabel = hasObservedVitals && gainPct === 100
    ? `OBSERVED · ${typeof vitals.source === 'string' && vitals.source ? vitals.source : 'Wearable'}`
    : 'SIMULATION MODEL'

  const envReport = useMemo(
    () =>
      coupleEnvironmentToPhysiology({
        ambientTempC: envTempC,
        relativeHumidityPct: envRhPct,
        pm25UgM3: envPm25,
        uvIndex: envTempC >= 32 ? 9 : 5,
        altitudeM: envAltM,
        restingHrBpm: liveHr,
      }),
    [envTempC, envRhPct, envPm25, envAltM, liveHr],
  )

  const handleQuickBle = async () => {
    setBleStatus('Pairing…')
    try {
      const mod = await import('../../domains/devices')
      await mod.triggerQuickWearableConnect((st) => {
        if (st.status === 'connected') setBleStatus(st.bpm ? `BLE ${st.bpm}` : 'BLE ON')
        else if (st.status === 'unavailable') setBleStatus('BLE N/A')
        else if (st.status === 'cancelled') setBleStatus('BLE')
        else setBleStatus(st.status === 'connecting' ? 'Scanning…' : 'BLE Retry')
      })
    } catch {
      setBleStatus('BLE N/A')
    }
  }

  const liveHotspots: readonly OrganHotspot[] = useMemo(() => {
    const cardioScore = Math.max(40, Math.min(99, Math.round(100 - Math.abs(liveHr - 64) * 0.45)))
    const pulmoScore = Math.max(40, Math.min(99, Math.round(liveSpo2 * (1 - Math.max(0, envPm25 - 25) / 600))))
    const brainScore = Math.max(45, Math.min(99, Math.round(Math.min(99, 55 + liveHrv * 0.55))))
    return ORGAN_HOTSPOTS.map((o) => {
      if (o.id === 'heart') return { ...o, metric: String(liveHr), pct: cardioScore }
      if (o.id === 'lungs') return { ...o, metric: String(liveSpo2), pct: pulmoScore }
      if (o.id === 'brain') return { ...o, metric: String(brainScore), pct: brainScore }
      if (o.id === 'pelvis') return { ...o, metric: String(liveRecovery), pct: liveRecovery }
      return o
    })
  }, [liveHr, liveSpo2, liveHrv, liveRecovery, envPm25])

  const activeOrgan = liveHotspots.find((o) => o.id === selectedOrganId) ?? liveHotspots[1]
  const scale = gainPct / 100
  const clamp = (v: number, lo = 8, hi = 99) => Math.max(lo, Math.min(hi, Math.round(v * scale)))
  const show = (id: AstralChartId) => chartFilter === 'all' || chartFilter === id

  const radarAxes = [68, 86, 74, 92, 79, 88, 83, 91].map((v) => clamp(v))
  const radarPoly = radarAxes
    .map((v, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / radarAxes.length
      const r = 10 + (v / 100) * 34
      return `${(55 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`
    })
    .join(' ')
  const basePoly = radarAxes
    .map((_, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / radarAxes.length
      return `${(55 + 28 * Math.cos(a)).toFixed(1)},${(50 + 28 * Math.sin(a)).toFixed(1)}`
    })
    .join(' ')

  return (
    <section
      className="dark rounded-3xl border border-cyan-400/25 bg-[#040914] p-3 text-slate-100 shadow-2xl"
      data-astral-chart-matrix
      aria-label="Astral 12-chart visual telemetry studio"
    >
      {/* 1-Tap BodyExposure Workflow Bridge (Your Body | Clinical | For You | Open 3D | 3D Anatomy) */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-1.5 border-b border-cyan-400/15 pb-2.5">
        <div className="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="BodyExposure workflow bridge">
          {BRIDGE_LINKS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-2xl border px-3 text-[11px] font-black transition hover:-translate-y-0.5"
              style={{
                borderColor: `${item.color}55`,
                background: `radial-gradient(circle at 20% 20%, ${item.color}28, rgba(5,12,24,0.92))`,
                color: '#f8feff',
              }}
            >
              <span style={{ color: item.color }}><Glyph id={item.glyph} size={15} /></span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Dynamic Live Gain Scrub Slider */}
        <label className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-cyan-400/25 bg-slate-950/90 px-3 text-[11px] font-extrabold text-cyan-200">
          <Glyph id="bolt" size={14} />
          <input
            type="range"
            min={65}
            max={135}
            value={gainPct}
            onChange={(e) => setGainPct(Number(e.target.value))}
            aria-label="Dynamic chart intensity"
            className="w-20 accent-cyan-400"
          />
          <span className="font-mono text-[10px] text-amber-200">{gainPct}%</span>
        </label>
      </div>

      {/* Universal Device Ingestion Strip + Provenance + Environment/ECMO Observatory Toggle */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-1.5 rounded-2xl border border-white/10 bg-slate-950/80 px-2.5 py-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            data-astral-provenance
            className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-black ${
              hasObservedVitals && gainPct === 100
                ? 'border-emerald-400/45 bg-emerald-500/15 text-emerald-200'
                : 'border-amber-400/45 bg-amber-500/15 text-amber-200'
            }`}
          >
            {provenanceLabel}
          </span>
          <button
            type="button"
            onClick={handleQuickBle}
            className="min-h-[34px] rounded-xl border border-cyan-400/35 bg-cyan-500/15 px-2.5 font-mono text-[10px] font-black text-cyan-100 hover:bg-cyan-500/25"
          >
            ᛒ {bleStatus}
          </button>
          <Link to="/device-sync" className="inline-flex min-h-[34px] items-center rounded-xl border border-white/15 bg-white/5 px-2.5 font-mono text-[10px] font-bold text-slate-200 hover:border-cyan-400/40">
            Wi-Fi · Watch
          </Link>
          <Link to="/scan-lab" className="inline-flex min-h-[34px] items-center rounded-xl border border-white/15 bg-white/5 px-2.5 font-mono text-[10px] font-bold text-slate-200 hover:border-cyan-400/40">
            Scan Lab
          </Link>
          <Link to="/health-data" className="inline-flex min-h-[34px] items-center rounded-xl border border-white/15 bg-white/5 px-2.5 font-mono text-[10px] font-bold text-slate-200 hover:border-cyan-400/40">
            All Data ↗
          </Link>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowEnvPanel((v) => !v)}
            aria-expanded={showEnvPanel}
            data-env-ecmo-toggle
            className="min-h-[34px] rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-2.5 font-mono text-[10px] font-black text-emerald-100 hover:bg-emerald-500/25"
          >
            Env × ECMO · {envReport.compositeEnvironmentalLoadPct}%
          </button>
          <button
            type="button"
            onClick={() => setShowInfo((v) => !v)}
            aria-label="Analyzer epistemic disclosure"
            className="grid h-[34px] w-[34px] place-items-center rounded-full border border-white/15 bg-white/5 font-mono text-[11px] font-black text-slate-200"
          >
            i
          </button>
        </div>
      </div>

      {showInfo && (
        <div className="mb-2.5 rounded-2xl border border-cyan-400/20 bg-slate-950/95 px-3 py-2 text-[11px] text-slate-300">
          <strong className="text-cyan-200">Epistemic Boundary:</strong> Observed device telemetry stays tagged <code>OBSERVED</code>; moving the Gain slider or Environment × VV-ECMO sliders enters deterministic <code>MECHANISTIC_EDUCATIONAL_SIMULATION</code> (non-diagnostic; not clinical titration).
        </div>
      )}

      {showEnvPanel && (
        <div data-env-ecmo-observatory className="mb-3 rounded-2xl border border-emerald-400/25 bg-[#05101d] p-2.5">
          <div className="mb-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            <label className="flex flex-col gap-0.5 rounded-xl border border-white/10 bg-slate-950/80 px-2 py-1.5 font-mono text-[10px] text-amber-200">
              <span>Temp {envTempC}°C</span>
              <input type="range" min={5} max={45} value={envTempC} onChange={(e) => setEnvTempC(Number(e.target.value))} className="accent-amber-400" />
            </label>
            <label className="flex flex-col gap-0.5 rounded-xl border border-white/10 bg-slate-950/80 px-2 py-1.5 font-mono text-[10px] text-cyan-200">
              <span>RH {envRhPct}%</span>
              <input type="range" min={15} max={98} value={envRhPct} onChange={(e) => setEnvRhPct(Number(e.target.value))} className="accent-cyan-400" />
            </label>
            <label className="flex flex-col gap-0.5 rounded-xl border border-white/10 bg-slate-950/80 px-2 py-1.5 font-mono text-[10px] text-rose-200">
              <span>PM2.5 {envPm25}</span>
              <input type="range" min={2} max={250} value={envPm25} onChange={(e) => setEnvPm25(Number(e.target.value))} className="accent-rose-400" />
            </label>
            <label className="flex flex-col gap-0.5 rounded-xl border border-white/10 bg-slate-950/80 px-2 py-1.5 font-mono text-[10px] text-violet-200">
              <span>Alt {envAltM}m</span>
              <input type="range" min={0} max={5000} step={100} value={envAltM} onChange={(e) => setEnvAltM(Number(e.target.value))} className="accent-violet-400" />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6 font-mono text-[10px]">
            <div className="rounded-xl border border-white/10 bg-slate-900/90 px-2 py-1.5">
              <div className="text-slate-400">Pb / PAO2</div>
              <div className="font-black text-cyan-200">{envReport.atmosphere.barometricMmHg}/{envReport.atmosphere.pao2AlveolarMmHg}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/90 px-2 py-1.5">
              <div className="text-slate-400">DO2</div>
              <div className="font-black text-emerald-200">{envReport.atmosphere.do2MlMin} mL/m</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/90 px-2 py-1.5">
              <div className="text-slate-400">Wet-Bulb</div>
              <div className="font-black text-amber-200">{envReport.thermoregulation.wetBulbTempC}°C</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/90 px-2 py-1.5">
              <div className="text-slate-400">Sweat / H2O</div>
              <div className="font-black text-sky-200">{envReport.thermoregulation.sweatRateLPerHr} L/h</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/90 px-2 py-1.5">
              <div className="text-slate-400">US-AQI</div>
              <div className="font-black text-rose-200">{envReport.airway.estimatedUsAqi} · {envReport.airway.airQualityTier.slice(0, 6)}</div>
            </div>
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-950/50 px-2 py-1.5">
              <div className="text-emerald-300">VV-ECMO</div>
              <div className="font-black text-white">{envReport.ecmoBridge.sao2Pct}% · pH {envReport.ecmoBridge.ph}</div>
            </div>
          </div>
        </div>
      )}

      {/* Anatomical Body Analysis Hotspot Stage + 4 Live Waveforms + Organ Table (Screenshots 9 & 10) */}
      <div className="mb-3 grid grid-cols-1 gap-2.5 lg:grid-cols-12">
        {/* Interactive Anatomical Body Hotspot SVG */}
        <div className="relative flex flex-col items-center justify-between rounded-2xl border border-cyan-400/20 bg-gradient-to-b from-[#071326] to-[#030710] p-2.5 lg:col-span-5">
          <svg viewBox="0 0 100 92" className="h-48 w-full max-w-[210px]" role="img" aria-label="Interactive body hotspot map">
            <defs>
              <radialGradient id="pmd-astral-aura" cx="50%" cy="42%" r="50%">
                <stop offset="0%" stopColor={activeOrgan.color} stopOpacity="0.32" />
                <stop offset="100%" stopColor="#030710" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="45" r="40" fill="url(#pmd-astral-aura)" />
            {/* Grid lines */}
            <path d="M12 22h76 M12 42h76 M12 62h76 M12 82h76 M30 6v80 M50 6v80 M70 6v80" stroke="rgba(103,232,249,0.09)" strokeWidth="0.4" />
            {/* Anatomical Human Silhouette + Muscle/Vascular Lines */}
            <path
              d="M50 7 C54 7 56 10 56 14 C56 18 53 20 53 22 L63 25 C67 27 69 32 71 44 L73 56 C73 58 70 59 69 57 L65 36 L60 36 L61 54 L63 82 C63 85 59 86 58 83 L52 58 L48 58 L42 83 C41 86 37 85 37 82 L39 54 L40 36 L35 36 L31 57 C30 59 27 58 27 56 L29 44 C31 32 33 27 37 25 L47 22 C47 20 44 18 44 14 C44 10 46 7 50 7 Z"
              fill="rgba(34, 211, 238, 0.14)"
              stroke="#67e8f9"
              strokeWidth="0.9"
            />
            <path d="M50 14 V56 M44 33 Q50 38 56 33 M43 45 Q50 49 57 45" fill="none" stroke="rgba(251,113,133,0.45)" strokeWidth="0.7" />
            {liveHotspots.map((org) => {
              const sel = org.id === activeOrgan.id
              return (
                <g
                  key={org.id}
                  onClick={() => setSelectedOrganId(org.id)}
                  style={{ cursor: 'pointer' }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${org.label} ${ clamp(org.pct) }${org.unit}`}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedOrganId(org.id) }}
                >
                  {sel && <circle cx={org.cx} cy={org.cy} r="6.2" fill="none" stroke={org.color} strokeWidth="0.9" strokeDasharray="1.5 1.5" />}
                  <circle cx={org.cx} cy={org.cy} r={sel ? 3.4 : 2.4} fill={org.color} stroke="#fff" strokeWidth="0.7" />
                </g>
              )
            })}
          </svg>

          {/* Floating Active Organ Waveform Callout + 1-Tap Launch */}
          <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/15 bg-slate-950/90 px-2.5 py-1.5">
            <div className="flex items-center gap-1.5">
              <span style={{ color: activeOrgan.color }}><Glyph id={activeOrgan.glyph} size={16} /></span>
              <strong className="text-xs font-black text-white">{activeOrgan.label}</strong>
              <span className="font-mono text-xs font-black" style={{ color: activeOrgan.color }}>
                {clamp(Number(activeOrgan.metric))}{activeOrgan.unit}
              </span>
            </div>
            <svg viewBox="0 0 64 20" width="60" height="18" aria-hidden="true">
              <polyline
                points={activeOrgan.wave.map((v, i) => `${i * 8.5},${18 - Math.round((clamp(v) / 100) * 15)}`).join(' ')}
                fill="none"
                stroke={activeOrgan.color}
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            <Link
              to={activeOrgan.to}
              className="inline-flex min-h-[36px] items-center rounded-lg border border-cyan-300/40 bg-cyan-400/15 px-2.5 text-[10px] font-black text-cyan-100"
            >
              ↗
            </Link>
          </div>
        </div>

        {/* Right Column: 4 Live Mini Waveform strips + Compact Organ Vitality Table */}
        <div className="flex flex-col justify-between gap-2 lg:col-span-7">
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {[
              { k: 'ECG', v: `${Math.round(liveHr * scale)} bpm`, c: '#34d399', d: 'M2 12h8l2-5 3 10 3-13 3 11 2-3h12' },
              { k: 'Resp', v: `${Math.max(8, Math.round(liveResp * scale))}/m`, c: '#fbbf24', d: 'M2 13 Q9 4 16 13 T30 13 T42 13' },
              { k: 'SpO2', v: `${Math.min(100, Math.max(70, Math.round(liveSpo2 * (0.94 + 0.06 * scale))))}%`, c: '#38bdf8', d: 'M2 14 C10 4, 18 4, 24 14 C30 18, 36 6, 42 12' },
              { k: 'IBP', v: `${Math.round(liveSbp * scale)}/${Math.round(liveDbp * scale)}`, c: '#fb7185', d: 'M2 14 L8 5 L13 15 L18 11 L26 14 L32 5 L38 15' },
            ].map((w) => (
              <div key={w.k} className="rounded-xl border border-white/10 bg-slate-900/90 p-2">
                <div className="flex items-center justify-between text-[10px] font-black">
                  <span className="text-slate-400">{w.k}</span>
                  <span className="font-mono" style={{ color: w.c }}>{w.v}</span>
                </div>
                <svg viewBox="0 0 44 18" className="mt-1 h-5 w-full" aria-hidden="true">
                  <path d={w.d} fill="none" stroke={w.c} strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
            ))}
          </div>

          {/* Compact Visual Organ Vitality Table (Screenshot 9 Archealth Table) */}
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3" role="table" aria-label="Organ vitality table">
            {liveHotspots.map((org) => {
              const sel = org.id === activeOrgan.id
              const val = clamp(org.pct)
              return (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => setSelectedOrganId(org.id)}
                  aria-pressed={sel}
                  className="flex min-h-[44px] items-center justify-between rounded-xl border px-2.5 py-1.5 text-left transition"
                  style={{
                    borderColor: sel ? org.color : 'rgba(255,255,255,0.1)',
                    background: sel ? `${org.color}1f` : 'rgba(15,23,42,0.85)',
                  }}
                >
                  <span className="flex items-center gap-1.5">
                    <span style={{ color: org.color }}><Glyph id={org.glyph} size={14} /></span>
                    <span className="text-[11px] font-extrabold text-white">{org.label}</span>
                  </span>
                  <span className="font-mono text-[11px] font-black" style={{ color: org.color }}>{val}%</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Chart Family Selector Ribbon */}
      <div className="mb-2.5 flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar" role="tablist" aria-label="Chart types">
        {CHART_TABS.map((t) => {
          const active = chartFilter === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setChartFilter(t.id)}
              className="min-h-[44px] shrink-0 rounded-xl border px-2.5 text-[10px] font-black uppercase tracking-wider transition"
              style={{
                borderColor: active ? '#fde68a' : 'rgba(103,232,249,0.2)',
                background: active ? 'rgba(253,230,138,0.16)' : 'rgba(7,15,28,0.9)',
                color: active ? '#fef3c7' : '#a5f3fc',
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* 11-Chart Dynamic Visual Grid (Donut, Gauge, Waterfall, Comparison, Vein, Heatmap, Stacked, Bubble, Area, Radar, Diverging) */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {/* 1. DONUT CHART */}
        {show('donut') && (
          <Link to="/macro-lab" className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#081120] p-2.5 hover:border-cyan-300/60" data-chart-type="donut">
            <div className="flex items-center justify-between text-[10px] font-black text-cyan-300">
              <span>DONUT</span>
              <span className="font-mono">{clamp(92)}%</span>
            </div>
            <svg viewBox="0 0 100 64" className="my-1 h-16 w-full" aria-hidden="true">
              <circle cx="34" cy="32" r="22" fill="none" stroke="#1e293b" strokeWidth="7" />
              <circle cx="34" cy="32" r="22" fill="none" stroke="#22d3ee" strokeWidth="7" strokeDasharray="52 138" transform="rotate(-90 34 32)" />
              <circle cx="34" cy="32" r="22" fill="none" stroke="#a78bfa" strokeWidth="7" strokeDasharray="40 138" strokeDashoffset="-54" transform="rotate(-90 34 32)" />
              <circle cx="34" cy="32" r="22" fill="none" stroke="#34d399" strokeWidth="7" strokeDasharray="34 138" strokeDashoffset="-96" transform="rotate(-90 34 32)" />
              <text x="34" y="35" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="900" fontFamily="monospace">{clamp(92)}</text>
              <circle cx="68" cy="20" r="3" fill="#22d3ee" /><text x="74" y="23" fill="#cbd5e1" fontSize="7.5" fontWeight="700">ATP</text>
              <circle cx="68" cy="32" r="3" fill="#a78bfa" /><text x="74" y="35" fill="#cbd5e1" fontSize="7.5" fontWeight="700">REM</text>
              <circle cx="68" cy="44" r="3" fill="#34d399" /><text x="74" y="47" fill="#cbd5e1" fontSize="7.5" fontWeight="700">VO2</text>
            </svg>
          </Link>
        )}

        {/* 2. GAUGE CHART (Glowing Aura Speed/Power Dial — Screenshots 2 & 5) */}
        {show('gauge') && (
          <Link to="/readiness" className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#081120] p-2.5 hover:border-amber-300/60" data-chart-type="gauge">
            <div className="flex items-center justify-between text-[10px] font-black text-amber-300">
              <span>GAUGE</span>
              <span className="font-mono">{clamp(88, 40, 150)}</span>
            </div>
            <svg viewBox="0 0 100 64" className="my-1 h-16 w-full" aria-hidden="true">
              <defs>
                <radialGradient id="pmd-gauge-halo" cx="50%" cy="62%" r="48%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.45" />
                  <stop offset="55%" stopColor="#38bdf8" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#081120" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="50" cy="40" r="32" fill="url(#pmd-gauge-halo)" />
              <path d="M 20 48 A 30 30 0 1 1 80 48" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="5.5" strokeLinecap="round" strokeDasharray="2 3" />
              <path d="M 20 48 A 30 30 0 1 1 80 48" fill="none" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${Math.round((clamp(88) / 100) * 94)} 120`} />
              <circle cx="50" cy="42" r="14" fill="#040914" stroke="rgba(253,230,138,0.4)" strokeWidth="1" />
              <text x="50" y="45" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="900" fontFamily="monospace">{clamp(88, 40, 150)}</text>
            </svg>
          </Link>
        )}

        {/* 3. WATERFALL CHART */}
        {show('waterfall') && (
          <Link to="/longevity" className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#081120] p-2.5 hover:border-emerald-300/60" data-chart-type="waterfall">
            <div className="flex items-center justify-between text-[10px] font-black text-emerald-300">
              <span>WATERFALL</span>
              <span className="font-mono">+{clamp(26, 5, 45)}</span>
            </div>
            <svg viewBox="0 0 100 64" className="my-1 h-16 w-full" aria-hidden="true">
              <line x1="6" y1="54" x2="94" y2="54" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
              <rect x="10" y="30" width="12" height="24" rx="2" fill="#38bdf8" />
              <rect x="27" y="20" width="12" height="10" rx="2" fill="#34d399" />
              <rect x="44" y="12" width="12" height="8" rx="2" fill="#34d399" />
              <rect x="61" y="12" width="12" height="9" rx="2" fill="#fb7185" />
              <rect x="78" y="10" width="12" height="44" rx="2" fill="#fde68a" />
              <path d="M22 30h5 M39 20h5 M56 12h5 M73 21h5" stroke="rgba(255,255,255,0.35)" strokeWidth="0.7" strokeDasharray="1.5 1.5" />
            </svg>
          </Link>
        )}

        {/* 4. COMPARISON CHART (Screenshot 4 Dual Step Comparison 82 bpm vs 96 bpm) */}
        {show('comparison') && (
          <Link to="/analisis-pro" className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#081120] p-2.5 hover:border-fuchsia-300/60" data-chart-type="comparison">
            <div className="flex items-center justify-between text-[10px] font-black text-fuchsia-300">
              <span>COMPARE</span>
              <span className="font-mono">{clamp(82)} vs {clamp(96)}</span>
            </div>
            <svg viewBox="0 0 100 64" className="my-1 h-16 w-full" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <g key={i}>
                  <rect x={6 + i * 15} y={14 + (i % 3) * 6} width="12" height="6" rx="1.5" fill="#e879f9" />
                  <rect x={6 + i * 15} y={36 + ((i + 1) % 3) * 6} width="12" height="6" rx="1.5" fill="#38bdf8" />
                </g>
              ))}
              <line x1="4" y1="32" x2="96" y2="32" stroke="rgba(255,255,255,0.14)" strokeWidth="0.7" />
            </svg>
          </Link>
        )}

        {/* 5. VEIN CHART (Intertwined Vascular/Neural Ribbons — Screenshot 10) */}
        {show('vein') && (
          <Link to="/organ-vitality" className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#081120] p-2.5 hover:border-rose-300/60" data-chart-type="vein">
            <div className="flex items-center justify-between text-[10px] font-black text-rose-300">
              <span>VEIN FLOW</span>
              <span className="font-mono">{clamp(89)}%</span>
            </div>
            <svg viewBox="0 0 100 64" className="my-1 h-16 w-full" aria-hidden="true">
              <path d="M 2 44 C 24 8, 44 56, 68 18 C 80 4, 90 36, 98 22" fill="none" stroke="#fb7185" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M 2 24 C 24 54, 46 12, 68 44 C 82 56, 90 16, 98 36" fill="none" stroke="#22d3ee" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />
              <path d="M 2 34 C 26 24, 48 38, 70 28 C 84 20, 92 44, 98 28" fill="none" stroke="#a78bfa" strokeWidth="1.6" strokeDasharray="3 2" />
            </svg>
          </Link>
        )}

        {/* 6. HEATMAP CHART (Glowing Dot-Matrix Grid — Screenshot 3) */}
        {show('heatmap') && (
          <Link to="/data-lab-advanced" className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#081120] p-2.5 hover:border-violet-300/60" data-chart-type="heatmap">
            <div className="flex items-center justify-between text-[10px] font-black text-violet-300">
              <span>HEATMAP</span>
              <span className="font-mono">{clamp(154, 80, 220)}</span>
            </div>
            <svg viewBox="0 0 100 64" className="my-1 h-16 w-full" aria-hidden="true">
              {Array.from({ length: 5 }, (_, r) =>
                Array.from({ length: 10 }, (_, c) => {
                  const active = (r * 3 + c * 2) % 7 < Math.round((gainPct / 135) * 6)
                  const colors = ['#6366f1', '#ec4899', '#22d3ee', '#34d399']
                  const fill = active ? colors[(r + c) % colors.length] : 'rgba(255,255,255,0.1)'
                  return <rect key={`${r}-${c}`} x={6 + c * 9} y={8 + r * 10} width="6.2" height="6.2" rx="1.6" fill={fill} />
                }),
              )}
            </svg>
          </Link>
        )}

        {/* 7. STACKED COLUMN CHART (Spectrum Equalizer + Barcode — Screenshots 3 & 4) */}
        {show('stacked') && (
          <Link to="/pola-tidur" className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#081120] p-2.5 hover:border-cyan-300/60" data-chart-type="stacked">
            <div className="flex items-center justify-between text-[10px] font-black text-cyan-300">
              <span>STACKED</span>
              <span className="font-mono">7.8h</span>
            </div>
            <svg viewBox="0 0 100 64" className="my-1 h-16 w-full" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                const x = 6 + i * 11.5
                return (
                  <g key={i}>
                    <rect x={x} y="38" width="7.5" height="16" rx="2" fill="#38bdf8" />
                    <rect x={x} y="24" width="7.5" height="12" rx="2" fill="#a78bfa" />
                    <rect x={x} y={10 + (i % 3) * 3} width="7.5" height={12 - (i % 3) * 3} rx="2" fill="#34d399" />
                  </g>
                )
              })}
            </svg>
          </Link>
        )}

        {/* 8. BUBBLE CHART (Glowing Orbital Spheres — Screenshot 4) */}
        {show('bubble') && (
          <Link to="/bio-simulators" className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#081120] p-2.5 hover:border-amber-300/60" data-chart-type="bubble">
            <div className="flex items-center justify-between text-[10px] font-black text-amber-200">
              <span>BUBBLE</span>
              <span className="font-mono">{clamp(128, 70, 180)}</span>
            </div>
            <svg viewBox="0 0 100 64" className="my-1 h-16 w-full" aria-hidden="true">
              <circle cx="14" cy="36" r="7" fill="#fb923c" opacity="0.45" />
              <circle cx="30" cy="34" r="10" fill="#fbbf24" opacity="0.68" />
              <circle cx="50" cy="32" r="18" fill="rgba(253,224,71,0.22)" stroke="#fde68a" strokeWidth="1" />
              <circle cx="50" cy="32" r="13" fill="#fbbf24" />
              <circle cx="70" cy="34" r="10" fill="#38bdf8" opacity="0.72" />
              <circle cx="86" cy="36" r="7" fill="#a78bfa" opacity="0.5" />
              <text x="50" y="35" textAnchor="middle" fill="#040914" fontSize="9.5" fontWeight="900" fontFamily="monospace">{clamp(128, 70, 180)}</text>
            </svg>
          </Link>
        )}

        {/* 9. AREA CHART (Dual Glowing Spline Area + White Beacon Dot — Screenshot 12) */}
        {show('area') && (
          <Link to="/recovery" className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#081120] p-2.5 hover:border-sky-300/60" data-chart-type="area">
            <div className="flex items-center justify-between text-[10px] font-black text-sky-300">
              <span>AREA</span>
              <span className="font-mono">{clamp(76)}%</span>
            </div>
            <svg viewBox="0 0 100 64" className="my-1 h-16 w-full" aria-hidden="true">
              <polygon points="4,56 4,38 24,26 46,34 66,14 84,24 96,18 96,56" fill="rgba(56,189,248,0.25)" />
              <polyline points="4,38 24,26 46,34 66,14 84,24 96,18" fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" />
              <polyline points="4,46 24,38 46,42 66,28 84,34 96,26" fill="none" stroke="#f472b6" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
              <circle cx="66" cy="14" r="3.4" fill="#fff" stroke="#38bdf8" strokeWidth="1.5" />
            </svg>
          </Link>
        )}

        {/* 10. RADAR CHART (Multi-Polygon 8-Axis Spider Radar — Screenshot 3) */}
        {show('radar') && (
          <Link to="/body-exposure" className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#081120] p-2.5 hover:border-emerald-300/60" data-chart-type="radar">
            <div className="flex items-center justify-between text-[10px] font-black text-emerald-300">
              <span>RADAR 360°</span>
              <span className="font-mono">8-AXIS</span>
            </div>
            <svg viewBox="0 0 110 100" className="my-1 h-16 w-full" aria-hidden="true">
              <circle cx="55" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
              <circle cx="55" cy="50" r="24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.7" strokeDasharray="2 2" />
              <polygon points={basePoly} fill="none" stroke="rgba(148,163,184,0.4)" strokeWidth="1" />
              <polygon points={radarPoly} fill="rgba(52,211,153,0.26)" stroke="#34d399" strokeWidth="1.8" />
            </svg>
          </Link>
        )}

        {/* 11. DIVERGING CHART (Bidirectional Center-Zero Homeostasis Bars) */}
        {show('diverging') && (
          <Link to="/biological-age" className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#081120] p-2.5 hover:border-cyan-300/60" data-chart-type="diverging">
            <div className="flex items-center justify-between text-[10px] font-black text-cyan-200">
              <span>DIVERGING</span>
              <span className="font-mono">Δ -4.2y</span>
            </div>
            <svg viewBox="0 0 100 64" className="my-1 h-16 w-full" aria-hidden="true">
              <line x1="50" y1="6" x2="50" y2="58" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
              {[
                { y: 10, w: 28, dir: 1, c: '#34d399' },
                { y: 20, w: 18, dir: -1, c: '#fb7185' },
                { y: 30, w: 34, dir: 1, c: '#22d3ee' },
                { y: 40, w: 14, dir: -1, c: '#fbbf24' },
                { y: 50, w: 24, dir: 1, c: '#a78bfa' },
              ].map((b, i) => (
                <rect
                  key={i}
                  x={b.dir > 0 ? 50 : 50 - b.w}
                  y={b.y}
                  width={b.w}
                  height="6"
                  rx="2"
                  fill={b.c}
                />
              ))}
            </svg>
          </Link>
        )}

        {/* 12. 1-TAP BODY 3D & SIMULATOR LAUNCH TILE (Screenshot 12 & 13 Pedestal Body Card) */}
        <Link to="/body-exposure" className="group flex flex-col justify-between rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/15 to-violet-500/15 p-2.5 hover:border-amber-300">
          <div className="flex items-center justify-between text-[10px] font-black text-amber-200">
            <span>3D BODY LAB</span>
            <span>↗</span>
          </div>
          <svg viewBox="0 0 100 64" className="my-1 h-16 w-full" aria-hidden="true">
            <ellipse cx="50" cy="55" rx="24" ry="5" fill="rgba(34,211,238,0.22)" stroke="#22d3ee" strokeWidth="1" />
            <circle cx="50" cy="14" r="5" fill="#67e8f9" />
            <path d="M42 22h16l3 15h-5l-2 16h-8l-2-16h-5z" fill="rgba(103,232,249,0.45)" stroke="#67e8f9" strokeWidth="1.2" />
          </svg>
        </Link>
      </div>
    </section>
  )
}

export default AstralChartMatrix
