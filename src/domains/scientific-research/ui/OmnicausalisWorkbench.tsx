import { useEffect, useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CASCADE_GRAPH, SCIENTIFIC_SOURCES, validateScientificGraph } from '../model/scientificGraph'
import { CASCADE_ASSUMPTIONS, firstCrossing, runCascade, type CascadeParameters, type CascadeRun } from '../model/ischemiaCascade'

const button = 'min-h-11 rounded-xl border border-white/20 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:opacity-50'
const panel = 'min-w-0 rounded-2xl border border-white/15 bg-white/[.025] p-4 sm:p-5'
const positions = [[90, 65], [270, 65], [450, 65], [630, 65], [630, 215], [450, 215], [270, 215], [90, 215]]
const fields = ['reserve', 'stress', 'response'] as const
const colors = { reserve: '#67e8f9', stress: '#c4b5fd', response: '#6ee7b7' }
const initialParameters: CascadeParameters = { delivery: 0.2, responseGain: 0.4, reperfusion: true }
const graphErrors = validateScientificGraph(CASCADE_GRAPH)

function ComparisonChart({ run, baseline, cursor }: { run: CascadeRun; baseline: CascadeRun; cursor: number }) {
  const x = (t: number) => 32 + t / 24 * 304
  const y = (v: number) => 192 - v * 160
  const path = (field: typeof fields[number], points = run.points) => points.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(2)},${y(p[field]).toFixed(2)}`).join(' ')
  const band = [...run.sensitivity.map(p => `${x(p.t)},${y(p.high)}`), ...[...run.sensitivity].reverse().map(p => `${x(p.t)},${y(p.low)}`)].join(' ')
  return <svg viewBox="0 0 360 224" className="w-full" role="img" aria-label="Baseline and selected toy indices over model time; green shading is an imposed sensitivity range, not a confidence interval">
    {[0, 0.5, 1].map(v => <g key={v}><line x1="32" x2="336" y1={y(v)} y2={y(v)} stroke="#334155" /><text x="2" y={y(v) + 5} fill="#cbd5e1" fontSize="16">{v}</text></g>)}
    {[0, 4, 12, 24].map(t => <g key={t}><line x1={x(t)} x2={x(t)} y1="28" y2="192" stroke="#334155" strokeDasharray="4 5" /><text x={x(t)} y="216" textAnchor="middle" fill="#cbd5e1" fontSize="16">{t}</text></g>)}
    <polygon points={band} fill={colors.response} opacity="0.16" />
    {fields.map(field => <g key={field}><path d={path(field, baseline.points)} fill="none" stroke={colors[field]} strokeWidth="2" strokeDasharray="5 5" opacity="0.65" /><path d={path(field)} fill="none" stroke={colors[field]} strokeWidth="2.5" /></g>)}
    <line x1={x(run.points[cursor].t)} x2={x(run.points[cursor].t)} y1="25" y2="195" stroke="#f8fafc" strokeWidth="1.5" />
  </svg>
}

export default function OmnicausalisWorkbench() {
  const marker = useId().replace(/:/g, '')
  const [delivery, setDelivery] = useState('0.20')
  const [gain, setGain] = useState('0.40')
  const [reperfusion, setReperfusion] = useState(true)
  const [run, setRun] = useState(() => runCascade(initialParameters))
  const baseline = useMemo(() => runCascade({ ...initialParameters, delivery: 1 }), [])
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState('succinate-redox')
  const [query, setQuery] = useState('')
  const [zoom, setZoom] = useState(1)
  const [cursor, setCursor] = useState(run.points.length - 1)
  const [playing, setPlaying] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const edge = CASCADE_GRAPH.edges.find(e => e.id === selected) ?? CASCADE_GRAPH.edges[0]
  const selectedIds = new Set([edge.source, edge.target])
  const visibleNodes = CASCADE_GRAPH.nodes.filter(n => `${n.label} ${n.spatialScale}`.toLowerCase().includes(query.toLowerCase().trim()))
  const point = run.points[cursor]
  const crossing = firstCrossing(run.points, 'stress', 0.5)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => { setReducedMotion(media.matches); if (media.matches) setPlaying(false) }
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    if (!playing || reducedMotion) return
    const interval = window.setInterval(() => setCursor(previous => {
      if (previous >= run.points.length - 1) { setPlaying(false); return previous }
      return previous + 1
    }), 90)
    return () => window.clearInterval(interval)
  }, [playing, reducedMotion, run])

  const chooseNode = (id: string) => {
    const next = CASCADE_GRAPH.edges.find(e => e.source === id) ?? CASCADE_GRAPH.edges.find(e => e.target === id)
    if (next) setSelected(next.id)
  }
  const execute = () => {
    setPlaying(false)
    if (!delivery.trim() || !gain.trim()) { setError('Enter both parameters. Missing is not zero.'); return }
    try {
      const result = runCascade({ delivery: Number(delivery), responseGain: Number(gain), reperfusion })
      setRun(result); setCursor(result.points.length - 1); setDirty(false); setError('')
    } catch { setError('Parameters must be finite numbers between 0 and 1. The previous run is unchanged.') }
  }
  if (graphErrors.length) return <p role="alert">Research graph unavailable: invalid provenance contract.</p>

  return <main aria-labelledby="omnicausalis-title" className="mx-auto max-w-7xl space-y-5 rounded-3xl bg-slate-950 p-4 text-slate-100 sm:p-6" data-testid="omnicausalis">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-200">Explore · Scientific research</p>
        <h1 id="omnicausalis-title" className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">Panacea Omnicausalis</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">Inspect an ischemia/reperfusion mechanism map, then compare an explicitly illustrative dynamical model. Sources explain mechanisms; they do not validate the toy equations.</p>
      </div>
      <Link className={button} to="/frontier-health">Return to Discovery</Link>
    </header>
    <p className="rounded-xl border border-amber-300/40 bg-amber-300/5 p-3 text-sm leading-relaxed text-amber-100">Research demonstration · Not clinically reviewed. No patient data, diagnosis, treatment recommendation or clinical record writeback.</p>

    <section className={panel} aria-labelledby="network-title">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="network-title" className="text-lg font-bold">1. Follow the mechanism</h2><p className="mt-1 text-sm text-slate-300">Select a structure or relationship to inspect its conditions and evidence.</p></div>
        <label className="text-sm">Graph zoom <input aria-label="Graph zoom" type="range" min="1" max="1.8" step="0.1" value={zoom} onChange={e => setZoom(Number(e.target.value))} className="ml-2 min-h-11 align-middle accent-cyan-300" /></label>
      </div>
      <div className="mt-4 hidden overflow-hidden rounded-xl bg-slate-900/60 sm:block">
        <svg viewBox="0 0 720 280" className="w-full" role="img" aria-label="Reference mechanism network from perfusion to clinical mapping; dashed final links are unknown">
          <defs><marker id={marker} markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#94a3b8" /></marker></defs>
          <g transform={`translate(360 140) scale(${zoom}) translate(-360 -140)`}>
            {CASCADE_GRAPH.edges.map(e => {
              const from = positions[CASCADE_GRAPH.nodes.findIndex(n => n.id === e.source)]
              const to = positions[CASCADE_GRAPH.nodes.findIndex(n => n.id === e.target)]
              const vertical = from[0] === to[0]
              const sign = to[0] > from[0] ? 1 : -1
              return <line key={e.id} x1={from[0] + (vertical ? 0 : 43 * sign)} y1={from[1] + (vertical ? 36 : 0)} x2={to[0] - (vertical ? 0 : 47 * sign)} y2={to[1] - (vertical ? 40 : 0)} stroke={selected === e.id ? '#67e8f9' : '#64748b'} strokeWidth={selected === e.id ? 3 : 2} strokeDasharray={e.direction === 'unresolved' ? '5 5' : undefined} markerEnd={e.direction === 'unresolved' ? undefined : `url(#${marker})`} />
            })}
            {CASCADE_GRAPH.nodes.map((n, i) => <g key={n.id} transform={`translate(${positions[i][0]} ${positions[i][1]})`} onClick={() => chooseNode(n.id)} style={{ cursor: 'pointer' }}>
              <circle r="37" fill={selectedIds.has(n.id) ? '#164e63' : '#0f172a'} stroke={n.evidenceStatus === 'UNKNOWN' ? '#fcd34d' : selectedIds.has(n.id) ? '#67e8f9' : '#64748b'} strokeWidth="2" />
              <text textAnchor="middle" y="5" fill="#f1f5f9" fontSize="13">{i + 1}</text><text textAnchor="middle" y="59" fill="#cbd5e1" fontSize="12">{n.spatialScale}</text>
            </g>)}
          </g>
        </svg>
      </div>
      <label className="mt-3 block text-sm">Find a component <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. redox, organ, cellular" className="mt-1 block min-h-11 w-full rounded-xl border border-white/25 bg-slate-900 px-3 text-slate-100 placeholder:text-slate-400" /></label>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-label="Network components">{visibleNodes.map(n => <button key={n.id} type="button" onClick={() => chooseNode(n.id)} className={`${button} text-left ${selectedIds.has(n.id) ? 'border-cyan-300 bg-cyan-300/10' : ''}`}><span className="text-cyan-200">{CASCADE_GRAPH.nodes.indexOf(n) + 1}.</span> {n.label}<span className="mt-1 block text-xs font-normal text-slate-300">{n.spatialScale} · {n.evidenceStatus}</span></button>)}</div>
      {!visibleNodes.length && <p role="status" className="mt-3 text-sm text-amber-100">UNKNOWN — no curated relationship found. Semantic similarity is not causal evidence.</p>}
      <label className="mt-4 block text-sm">Inspect relationship <select value={selected} onChange={e => setSelected(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-white/25 bg-slate-900 px-2 text-sm">{CASCADE_GRAPH.edges.map(e => <option key={e.id} value={e.id}>{CASCADE_GRAPH.nodes.find(n => n.id === e.source)?.label} → {CASCADE_GRAPH.nodes.find(n => n.id === e.target)?.label}</option>)}</select></label>
    </section>

    <section className={panel} aria-labelledby="evidence-title" data-testid="evidence-inspector">
      <div className="flex flex-wrap justify-between gap-2"><h2 id="evidence-title" className="text-lg font-bold">2. Why this relationship?</h2><span className="text-sm text-cyan-200">{edge.relationshipType === 'unknown' ? 'UNKNOWN · translation gap' : 'Experimental mechanism · preclinical'}</span></div>
      <p className="mt-3 text-sm leading-relaxed">{edge.mechanism}</p>
      <dl className="mt-3 space-y-2 text-sm leading-relaxed"><div><dt className="font-semibold text-slate-100">Conditions</dt><dd className="text-slate-300">{edge.conditions}</dd></div><div><dt className="font-semibold text-amber-100">Does not imply</dt><dd className="text-slate-300">{edge.doesNotImply}</dd></div></dl>
      <p className="mt-3 text-xs text-slate-300">Direction: {edge.direction} · Effect: {edge.effectSign} · Confidence: not quantified · Delay: not calibrated</p>
      {edge.evidenceReferences.length ? <ul className="mt-3 space-y-3">{edge.evidenceReferences.map(id => {
        const source = SCIENTIFIC_SOURCES.find(s => s.id === id)!
        return <li key={id} className="rounded-xl bg-slate-900 p-3 text-sm"><a className="font-semibold text-cyan-200 underline underline-offset-4" href={`https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`} target="_blank" rel="noreferrer">{source.authors} ({source.year}) — {source.title}</a><p className="mt-2 text-slate-300">{source.context}</p><a className="mt-1 inline-flex min-h-11 items-center break-all text-xs text-cyan-200 underline" href={`https://doi.org/${source.doi}`} target="_blank" rel="noreferrer">DOI: {source.doi}</a></li>
      })}</ul> : <p className="mt-3 text-sm text-amber-100">No validated source mapping is connected for this link.</p>}
      <details className="mt-4 text-sm"><summary className="min-h-11 cursor-pointer py-3 font-semibold">Node provenance and vertical gaps</summary><div className="space-y-3">{CASCADE_GRAPH.nodes.filter(n => selectedIds.has(n.id)).map(n => <div key={n.id}><h3 className="font-semibold">{n.label}</h3><p className="mt-1 text-slate-300">{n.uncertainty}</p><p className="mt-1 text-xs text-slate-300">Ontology ID: unassigned · Unit: unavailable · Version: {n.sourceVersion}</p></div>)}<p className="text-amber-100">VERTICAL GAP — NOT YET MODELED: quantitative tissue coupling, RNA/chromatin/DNA mechanisms, patient observation mapping and quantum chemistry. No fabricated geometry or measurements fill these gaps.</p></div></details>
    </section>

    <section className={panel} aria-labelledby="simulation-title">
      <h2 id="simulation-title" className="text-lg font-bold">3. What if? Compare toy dynamics</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">Three dimensionless indices demonstrate coupled dynamics, recovery and threshold inspection. They are not ATP, ROS, inflammation measurements or organ function. Reperfusion ROS bursts and the source mechanisms above are not quantitatively simulated.</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="min-w-0 space-y-4">
          <label className="block text-sm">Toy delivery parameter (0–1)<input value={delivery} onChange={e => { setDelivery(e.target.value); setDirty(true) }} type="number" min="0" max="1" step="0.05" className="mt-1 block min-h-11 w-full rounded-xl border border-white/25 bg-slate-900 px-3" /></label>
          <label className="block text-sm">Toy response gain (0–1)<input value={gain} onChange={e => { setGain(e.target.value); setDirty(true) }} type="number" min="0" max="1" step="0.05" className="mt-1 block min-h-11 w-full rounded-xl border border-white/25 bg-slate-900 px-3" /></label>
          <label className="block text-sm">Disturbance protocol<select value={reperfusion ? 'restored' : 'ongoing'} onChange={e => { setReperfusion(e.target.value === 'restored'); setDirty(true) }} className="mt-1 min-h-11 w-full rounded-xl border border-white/25 bg-slate-900 px-2"><option value="restored">Delivery reduced at 4, restored at 12</option><option value="ongoing">Delivery reduced at 4, not restored</option></select></label>
          <button type="button" onClick={execute} className={`${button} w-full border-cyan-200 bg-cyan-300 text-slate-950 hover:bg-cyan-200`}>Run comparison</button>
          {dirty && <p role="status" className="text-sm text-amber-100">Inputs changed. Display still shows the previous run until Run comparison.</p>}
          {error && <p role="alert" className="text-sm text-amber-100">{error}</p>}
          <p className="text-xs leading-relaxed text-slate-300">Current run: delivery {run.parameters.delivery}, gain {run.parameters.responseGain}, {run.parameters.reperfusion ? 'restoration at 12' : 'no restoration'}. Baseline: delivery 1, gain {initialParameters.responseGain}. Deterministic RK4, step 0.1 model-time.</p>
        </div>
        <div className="min-w-0"><ComparisonChart run={run} baseline={baseline} cursor={cursor} /><div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs">{fields.map(field => <span key={field} style={{ color: colors[field] }}>{field} index</span>)}<span className="text-slate-300">Dashed = baseline · Solid = selected</span></div>
          <p className="mt-3 text-xs leading-relaxed text-slate-300">Horizontal axis: model time, not seconds. Green range: gain ±20% imposed sensitivity, bounded to [0,1], not a confidence interval. This range omits structural uncertainty and is not observed biological variability.</p>
          <div className="mt-3 flex items-center gap-3"><button className={button} type="button" disabled={reducedMotion} onClick={() => { if (cursor === run.points.length - 1) setCursor(0); setPlaying(v => !v) }}>{playing ? 'Pause replay' : 'Play replay'}</button><label className="min-w-0 flex-1 text-xs">Inspect model time<input type="range" min="0" max={run.points.length - 1} value={cursor} onChange={e => { setPlaying(false); setCursor(Number(e.target.value)) }} className="mt-1 block min-h-11 w-full accent-cyan-300" /></label></div>
          {reducedMotion && <p className="mt-1 text-xs text-slate-300">Reduced motion: use the time slider for manual inspection.</p>}
          <output className="mt-3 block text-sm" data-testid="simulation-output">Model time {point.t.toFixed(1)} · Reserve {point.reserve.toFixed(3)} · Stress {point.stress.toFixed(3)} · Response {point.response.toFixed(3)}</output>
          <p className="mt-2 text-xs text-slate-300">Synthetic stress threshold 0.5: {crossing === null ? 'not crossed' : `first crossing at model time ${crossing.toFixed(2)}`}. Not a clinical event probability or timing estimate.</p>
        </div>
      </div>
      <details className="mt-4 text-sm"><summary className="min-h-11 cursor-pointer py-3 font-semibold">Equations, assumptions and reproducible data</summary>
        <div className="space-y-3 text-slate-300"><p>Let E, S, R denote toy reserve, stress and response. u is the imposed delivery parameter; g is response gain. Initial state: E=1, S=0, R=0. All rates are illustrative design choices, in 1/model-time.</p>
          <pre className="overflow-x-auto rounded-xl bg-slate-900 p-3 text-xs">{'dE/dt = 0.35*u*(1-E) - 0.20*(1-u)*E\ndS/dt = 0.30*(1-E)*(1-S) - 0.20*u*S\ndR/dt = g*S*(1-R) - 0.15*R'}</pre>
          <p>{CASCADE_ASSUMPTIONS.parameterSource} Protective compensation, tissue heterogeneity and reperfusion redox kinetics are absent. Calibration, clinical validation and treatment inference are unavailable. A separate seeded diagonal Euler–Maruyama solver has numerical tests; no biological noise law is supplied to this demo.</p>
          <a className={`${button} inline-flex items-center`} href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({ ...run, assumptions: CASCADE_ASSUMPTIONS, evidenceRole: 'Mechanism references only; not parameter calibration' }, null, 2))}`} download="omnicausalis-illustrative-run.json">Download reproducible run</a>
          <table className="w-full text-left text-xs"><caption className="py-3 text-left">Selected run snapshots · toy indices only</caption><thead><tr><th scope="col">Time</th><th scope="col">Reserve</th><th scope="col">Stress</th><th scope="col">Response</th></tr></thead><tbody>{run.points.filter((_p, i) => i % 40 === 0).map(p => <tr key={p.t}><th scope="row" className="py-2">{p.t.toFixed(1)}</th>{fields.map(f => <td key={f}>{p[f].toFixed(3)}</td>)}</tr>)}</tbody></table>
        </div></details>
    </section>
    <footer className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300"><p>Sources: bibliographic links only; no external dataset, quantum computation or patient telemetry connected.</p><Link className={button} to="/body-explorer">Open Body Exposure</Link></footer>
  </main>
}
