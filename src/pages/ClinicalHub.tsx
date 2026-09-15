import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PanaceaZoneNav } from '../components/PanaceaZoneNav'

export const GROUPS = [
  {
    name: 'Clinical',
    tools: [
      { to: '/body-explorer', name: 'Body Explorer', kw: 'body anatomy physiology imaging atlas' },
      { to: '/frontier-health', name: 'Discovery & Innovation', kw: 'discovery invention innovation research simulation' },
      { to: '/genome-lab', name: 'Genome Databank', kw: 'gene genome dna variant genetics' },
      { to: '/rujukan?t=obat', name: 'Drugs', kw: 'drug medication pharmacology interaction mechanism' },
      { to: '/med-study', name: 'Medical Library', kw: 'medical library evidence guideline journal' },
      { to: '/chatbot', name: 'Ask Health Question', kw: 'health question ai clinical assistant' },
      { to: '/clinical-calculators', name: 'Calculators & Lab', kw: 'calculator laboratory clinical score' },
      { to: '/learn', name: 'Learn & Look Up', kw: 'learn lookup study reference' },
    ],
  },
]

function Glass({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[26px] border border-white/[.09] bg-white/[.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_18px_50px_rgba(0,0,0,.24)] backdrop-blur-2xl ${className}`}>{children}</section>
}

export function ClinicalHub() {
  const [weight, setWeight] = useState(70)
  const [height, setHeight] = useState(170)
  const [sbp, setSbp] = useState(120)
  const [dbp, setDbp] = useState(80)
  const [calc, setCalc] = useState<'bmi' | 'map'>('bmi')
  const [lab, setLab] = useState('')
  const [low, setLow] = useState('')
  const [high, setHigh] = useState('')
  const [question, setQuestion] = useState('')
  const [gene, setGene] = useState('')
  const [drug, setDrug] = useState('')
  const [library, setLibrary] = useState('')
  const [layer, setLayer] = useState<'Anatomy' | 'Physiology' | 'Imaging'>('Anatomy')
  const [discovery, setDiscovery] = useState<'Discover' | 'Invent' | 'Validate'>('Discover')

  const bmi = useMemo(() => height > 0 ? weight / ((height / 100) ** 2) : 0, [height, weight])
  const map = useMemo(() => (sbp + 2 * dbp) / 3, [sbp, dbp])
  const labState = useMemo(() => {
    const v = Number(lab), lo = Number(low), hi = Number(high)
    if (!lab || !low || !high || !Number.isFinite(v + lo + hi)) return '—'
    return v < lo ? 'LOW' : v > hi ? 'HIGH' : 'IN RANGE'
  }, [lab, low, high])

  return (
    <div className="mx-auto w-full max-w-[1450px] space-y-4 pb-10">
      <PanaceaZoneNav />
      <main className="relative isolate overflow-hidden rounded-[30px] border border-white/10 bg-[#01040a]/95 p-3 text-white shadow-[0_28px_90px_rgba(0,0,0,.5)] sm:p-5">
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-28 top-28 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl" aria-hidden />

        <header className="relative mb-5 flex items-end justify-between gap-3 px-1">
          <div><div className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-200/75">Super page 02</div><h1 className="mt-1 text-2xl font-black tracking-[-.035em]">Clinical</h1></div>
          <div className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-[10px] font-black text-white/65">Clinical OS</div>
        </header>

        <div className="relative grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Glass>
            <div className="flex items-center justify-between"><b>Body Explorer</b><Link to="/body-explorer" className="text-cyan-200">↗</Link></div>
            <div className="mt-4 grid grid-cols-3 gap-2">{(['Anatomy', 'Physiology', 'Imaging'] as const).map((x) => <button key={x} type="button" onClick={() => setLayer(x)} className={`rounded-[14px] border px-2 py-3 text-[10px] font-black ${layer === x ? 'border-cyan-200/45 bg-cyan-200 text-black' : 'border-white/10 bg-black/20'}`}>{x}</button>)}</div>
            <div className="mt-4 flex h-24 items-center justify-center rounded-[18px] border border-white/[.07] bg-[radial-gradient(circle_at_center,rgba(34,211,238,.14),transparent_55%)] text-3xl">{layer === 'Anatomy' ? '◉' : layer === 'Physiology' ? '⌁' : '⌗'}</div>
          </Glass>

          <Glass>
            <div className="flex items-center justify-between"><b>Discovery</b><Link to="/frontier-health" className="text-cyan-200">↗</Link></div>
            <div className="mt-4 flex gap-2">{(['Discover', 'Invent', 'Validate'] as const).map((x) => <button key={x} type="button" onClick={() => setDiscovery(x)} className={`flex-1 rounded-full border px-2 py-2 text-[9px] font-black ${discovery === x ? 'border-violet-200/50 bg-violet-200 text-black' : 'border-white/10'}`}>{x}</button>)}</div>
            <div className="mt-6 text-center text-4xl font-black">{discovery === 'Discover' ? '✦' : discovery === 'Invent' ? '◇' : '✓'}</div>
            <div className="mt-3 text-center text-[10px] font-black uppercase tracking-[.14em] text-white/40">Discovery · invention · innovation</div>
          </Glass>

          <Glass>
            <div className="flex items-center justify-between"><b>Genome Databank</b><Link to="/genome-lab" className="text-cyan-200">↗</Link></div>
            <input value={gene} onChange={(e) => setGene(e.target.value)} placeholder="Gene / variant…" className="mt-4 w-full rounded-[16px] border border-white/10 bg-black/30 px-3 py-3 text-xs outline-none" />
            <div className="mt-5 flex items-end gap-1" aria-hidden>{[34, 65, 45, 82, 52, 73, 41, 91, 58, 77, 48, 69].map((h, i) => <i key={i} className="min-w-0 flex-1 rounded-full bg-gradient-to-t from-cyan-400 to-violet-400" style={{ height: `${h}px`, opacity: gene ? .85 : .3 }} />)}</div>
          </Glass>

          <Glass>
            <div className="flex items-center justify-between"><b>Drugs</b><Link to="/rujukan?t=obat" className="text-cyan-200">↗</Link></div>
            <input value={drug} onChange={(e) => setDrug(e.target.value)} placeholder="Drug / class…" className="mt-4 w-full rounded-[16px] border border-white/10 bg-black/30 px-3 py-3 text-xs outline-none" />
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[9px] font-black"><div className="rounded-[14px] border border-white/10 p-3">MOA</div><div className="rounded-[14px] border border-white/10 p-3">Dose</div><div className="rounded-[14px] border border-white/10 p-3">Safety</div></div>
          </Glass>

          <Glass>
            <div className="flex items-center justify-between"><b>Ask Health</b><Link to="/chatbot" className="text-cyan-200">↗</Link></div>
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} placeholder="Ask a health question…" className="mt-4 w-full resize-none rounded-[16px] border border-white/10 bg-black/30 p-3 text-xs outline-none" />
            <Link to="/chatbot" onClick={() => { if (typeof window !== 'undefined' && question.trim()) window.sessionStorage.setItem('pm_chat_draft', question.trim()) }} className="mt-3 inline-grid rounded-full bg-gradient-to-r from-cyan-200 to-violet-200 px-4 py-2 text-[10px] font-black text-black">Ask →</Link>
          </Glass>

          <Glass>
            <div className="flex items-center justify-between"><b>Calculators</b><Link to="/clinical-calculators" className="text-cyan-200">↗</Link></div>
            <div className="mt-3 flex gap-2"><button type="button" onClick={() => setCalc('bmi')} className={`rounded-full px-3 py-1.5 text-[9px] font-black ${calc === 'bmi' ? 'bg-white text-black' : 'border border-white/10'}`}>BMI</button><button type="button" onClick={() => setCalc('map')} className={`rounded-full px-3 py-1.5 text-[9px] font-black ${calc === 'map' ? 'bg-white text-black' : 'border border-white/10'}`}>MAP</button></div>
            {calc === 'bmi' ? <div className="mt-4 grid grid-cols-2 gap-2"><input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="min-w-0 rounded-[14px] border border-white/10 bg-black/30 px-3 py-2 text-xs" aria-label="Weight kg" /><input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="min-w-0 rounded-[14px] border border-white/10 bg-black/30 px-3 py-2 text-xs" aria-label="Height cm" /></div> : <div className="mt-4 grid grid-cols-2 gap-2"><input type="number" value={sbp} onChange={(e) => setSbp(Number(e.target.value))} className="min-w-0 rounded-[14px] border border-white/10 bg-black/30 px-3 py-2 text-xs" aria-label="Systolic pressure" /><input type="number" value={dbp} onChange={(e) => setDbp(Number(e.target.value))} className="min-w-0 rounded-[14px] border border-white/10 bg-black/30 px-3 py-2 text-xs" aria-label="Diastolic pressure" /></div>}
            <div className="mt-4 text-3xl font-black tabular-nums">{calc === 'bmi' ? bmi.toFixed(1) : `${Math.round(map)} mmHg`}</div>
          </Glass>

          <Glass>
            <div className="flex items-center justify-between"><b>Lab</b><Link to="/data-lab" className="text-cyan-200">↗</Link></div>
            <div className="mt-4 grid grid-cols-3 gap-2"><input inputMode="decimal" value={lab} onChange={(e) => setLab(e.target.value)} placeholder="Value" className="min-w-0 rounded-[14px] border border-white/10 bg-black/30 px-2 py-2 text-xs" /><input inputMode="decimal" value={low} onChange={(e) => setLow(e.target.value)} placeholder="Low" className="min-w-0 rounded-[14px] border border-white/10 bg-black/30 px-2 py-2 text-xs" /><input inputMode="decimal" value={high} onChange={(e) => setHigh(e.target.value)} placeholder="High" className="min-w-0 rounded-[14px] border border-white/10 bg-black/30 px-2 py-2 text-xs" /></div>
            <div className="mt-5 text-2xl font-black">{labState}</div>
            <div className="mt-2 text-[9px] font-bold text-white/35">Reference-range comparison only</div>
          </Glass>

          <Glass className="sm:col-span-2">
            <div className="flex items-center justify-between"><b>Medical Library + Learn</b><Link to="/learn" className="text-cyan-200">↗</Link></div>
            <input value={library} onChange={(e) => setLibrary(e.target.value)} placeholder="Look up disease, guideline, article…" className="mt-4 w-full rounded-[16px] border border-white/10 bg-black/30 px-3 py-3 text-xs outline-none" />
            <div className="mt-3 flex flex-wrap gap-2"><Link to="/med-study" className="rounded-full border border-white/10 px-3 py-2 text-[9px] font-black">Library</Link><Link to="/learn?t=cases" className="rounded-full border border-white/10 px-3 py-2 text-[9px] font-black">Cases</Link><Link to="/learn?t=radiology" className="rounded-full border border-white/10 px-3 py-2 text-[9px] font-black">Imaging</Link><Link to="/rujukan" className="rounded-full border border-white/10 px-3 py-2 text-[9px] font-black">Reference</Link></div>
          </Glass>
        </div>

        <div className="relative mt-5 px-1 text-[9px] font-semibold text-white/35">Formulas: BMI = weight(kg) ÷ height(m)²; MAP ≈ (SBP + 2×DBP) ÷ 3. Lab widget compares a value with the entered reference interval and does not interpret a diagnosis.</div>
      </main>
    </div>
  )
}

export default ClinicalHub
