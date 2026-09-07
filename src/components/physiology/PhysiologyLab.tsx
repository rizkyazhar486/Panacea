import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pause, Play, RotateCcw, Search, ExternalLink } from 'lucide-react'
import { PHYSIOLOGY_TOPICS, cardiovascular, spirometry } from '../../lib/physiologyLab'
import { HraContextBridge } from '../digital-twin/HraContextBridge'
import { MechanismScene } from './MechanismScene'
import './physiology.css'

function NumberControl({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  return <label className="phys-number"><span>{label}</span><output>{value}</output><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} /></label>
}

function QuantitativeLab({ kind }: { kind: 'cardiac' | 'spirometry' }) {
  const [hr, setHr] = useState(70), [edv, setEdv] = useState(120), [esv, setEsv] = useState(50), [svr, setSvr] = useState(18), [cvp, setCvp] = useState(5), [ejection, setEjection] = useState(.3)
  const [fvc, setFvc] = useState(4), [tau, setTau] = useState(.6), [time, setTime] = useState(1)
  const cardiac = cardiovascular(hr, edv, esv, svr, cvp, ejection)
  const spiro = spirometry(fvc, tau, time)
  return <section className="phys-numbers">
    <h3>{kind === 'cardiac' ? 'Explore the relationships' : 'Synthetic volume-time trace'}</h3>
    <div className="phys-control-grid">{kind === 'cardiac' ? <>
      <NumberControl label="Heart rate (beats/min)" value={hr} min={30} max={180} onChange={setHr} />
      <NumberControl label="EDV (mL)" value={edv} min={60} max={200} onChange={value => { setEdv(value); setEsv(old => Math.min(old, value)) }} />
      <NumberControl label="ESV (mL)" value={esv} min={0} max={edv} onChange={setEsv} />
      <NumberControl label="SVR (mmHg·min/L)" value={svr} min={5} max={30} onChange={setSvr} />
      <NumberControl label="Right atrial pressure (mmHg)" value={cvp} min={0} max={20} onChange={setCvp} />
      <NumberControl label="Ejection duration (s)" value={ejection} min={.15} max={.4} step={.01} onChange={setEjection} />
    </> : <>
      <NumberControl label="Asymptotic FVC (L)" value={fvc} min={1} max={7} step={.1} onChange={setFvc} />
      <NumberControl label="Time constant (s)" value={tau} min={.3} max={3} step={.1} onChange={setTau} />
      <NumberControl label="Elapsed time (s)" value={time} min={0} max={6} step={.1} onChange={setTime} />
    </>}</div>
    <dl className="phys-results">{(kind === 'cardiac' ? [
      ['SV', `${cardiac.sv.toFixed(0)} mL`], ['CO', `${cardiac.co.toFixed(2)} L/min`], ['EF', `${cardiac.ef.toFixed(1)}%`], ['Mean pressure', `${cardiac.map.toFixed(1)} mmHg`], ['Mean ejection flow', `${cardiac.meanEjectionFlow.toFixed(0)} mL/s`],
    ] : [['Exhaled volume', `${spiro.volume.toFixed(2)} L`], ['Flow', `${spiro.flow.toFixed(2)} L/s`], ['FEV1', `${spiro.fev1.toFixed(2)} L`], ['FEV1/FVC', `${(spiro.fev1 / fvc * 100).toFixed(1)}%`]]).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    {kind === 'spirometry' && <div className="phys-trace" role="img" aria-label="Synthetic exhaled volume rises toward selected FVC over six seconds">{Array.from({ length: 61 }, (_, index) => <span key={index} title={`${(index / 10).toFixed(1)} s: ${spirometry(fvc, tau, index / 10).volume.toFixed(2)} L`} style={{ height: `${spirometry(fvc, tau, index / 10).volume / 7 * 100}%`, background: index / 10 <= time ? '#43b4a8' : '#627573' }} />)}</div>}
    <p className="phys-note">{kind === 'cardiac' ? 'SV = EDV − ESV; CO = HR × SV / 1000; EF = SV / EDV; mean pressure = CO × SVR + right atrial pressure. Mean ejection flow = SV / ejection duration, not EF. Inputs are independent teaching values; feedback, compliance and beat-to-beat dynamics are not solved.' : 'Time axis 0–6 s; vertical axis 0–7 L. V(t) = FVC × (1 − exp(−t/τ)); flow is its derivative. This synthetic curve omits the initial acceleration, effort variability and quality checks of a real maneuver.'}</p>
  </section>
}

export function PhysiologyLab() {
  const [params, setParams] = useSearchParams()
  const topic = PHYSIOLOGY_TOPICS.find(item => item.id === params.get('physiology')) ?? PHYSIOLOGY_TOPICS[0]
  const [query, setQuery] = useState(''), [group, setGroup] = useState('All systems')
  const [phase, setPhase] = useState(0), [playing, setPlaying] = useState(false), [speed, setSpeed] = useState(1), [answer, setAnswer] = useState(false), [sources, setSources] = useState(false)
  const labels = useMemo(() => topic.steps.map(step => step[0]), [topic])
  useEffect(() => { setPhase(0); setPlaying(false); setAnswer(false); setSources(false) }, [topic.id])
  useEffect(() => {
    if (!playing) return
    let frame = 0, last = performance.now()
    const tick = (now: number) => {
      const elapsed = Math.min(.1, (now - last) / 1000); last = now
      if (!document.hidden) setPhase(value => Math.min(topic.steps.length - 1, value + elapsed * speed / 2))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, speed, topic])
  useEffect(() => { if (phase >= topic.steps.length - 1) setPlaying(false) }, [phase, topic])
  const shown = PHYSIOLOGY_TOPICS.filter(item => (group === 'All systems' || item.group === group) && `${item.title} ${item.terms.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()))
  function choose(id: string) { const next = new URLSearchParams(params); next.set('physiology', id); setParams(next) }
  const index = Math.min(topic.steps.length - 1, Math.floor(phase))
  return <section className="phys-lab">
    <header className="phys-heading"><div><p className="phys-eyebrow">BODY EXPOSURE / PHYSIOLOGY</p><h2>How the body works</h2></div><span>{PHYSIOLOGY_TOPICS.length} mechanisms</span></header>
    <div className="phys-layout"><aside className="phys-library">
      <label className="phys-search"><Search size={16} /><input aria-label="Find a physiology topic" placeholder="Find a mechanism" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <select aria-label="Physiology system" value={group} onChange={event => setGroup(event.target.value)}>{['All systems', ...new Set(PHYSIOLOGY_TOPICS.map(item => item.group))].map(value => <option key={value}>{value}</option>)}</select>
      <nav aria-label="Physiology topics">{shown.map(item => <button key={item.id} aria-current={topic.id === item.id ? 'page' : undefined} onClick={() => choose(item.id)}>{item.title}</button>)}</nav>
      {!shown.length && <p>No matching mechanisms.</p>}
    </aside><div className="phys-main">
      <div className="phys-title"><div><p>{topic.group}</p><h3>{topic.title}</h3></div><a href={topic.source} target="_blank" rel="noreferrer" title="Open textbook reference"><ExternalLink size={18} /><span>Reference</span></a></div>
      <p className="phys-note">Schematic mechanism sequence, not anatomical geometry. Playback order is educational; timing and spacing are not biological measurements.</p>
      <MechanismScene labels={labels} phase={phase} onPick={value => { setPlaying(false); setPhase(value) }} />
      <div className="phys-playback">
        <button aria-label={playing ? 'Pause sequence' : 'Play sequence'} title={playing ? 'Pause sequence' : 'Play sequence'} onClick={() => { if (phase >= topic.steps.length - 1) setPhase(0); setPlaying(value => !value) }}>{playing ? <Pause size={18} /> : <Play size={18} />}</button>
        <button aria-label="Reset sequence" title="Reset sequence" onClick={() => { setPlaying(false); setPhase(0) }}><RotateCcw size={18} /></button>
        <input aria-label="Mechanism progress" type="range" min={0} max={topic.steps.length - 1} step={.01} value={phase} onChange={event => { setPlaying(false); setPhase(Number(event.target.value)) }} />
        <select aria-label="Playback speed" value={speed} onChange={event => setSpeed(Number(event.target.value))}><option value={.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option></select>
      </div>
      <ol className="phys-steps">{topic.steps.map(([title, detail], i) => <li key={title} data-active={i === index}><button aria-current={i === index ? 'step' : undefined} onClick={() => { setPlaying(false); setPhase(i) }}><span>{i + 1}</span><strong>{title}</strong></button><p>{detail}</p></li>)}</ol>
      {(topic.id === 'cardiac' || topic.id === 'spirometry') && <QuantitativeLab key={topic.id} kind={topic.id} />}
      <section className="phys-recall"><h4>Check your understanding</h4><p>{topic.question}</p><button aria-expanded={answer} onClick={() => setAnswer(value => !value)}>{answer ? 'Hide explanation' : 'Reveal explanation'}</button>{answer && <p role="status">{topic.answer}</p>}</section>
      <p className="phys-boundary">{topic.boundary}</p>
      <button className="phys-source-button" aria-expanded={sources} onClick={() => setSources(value => !value)}>{sources ? 'Close anatomy sources' : 'Look up related HRA anatomy'}</button>
      {sources && <HraContextBridge key={topic.id} terms={topic.terms} />}
    </div></div>
  </section>
}
