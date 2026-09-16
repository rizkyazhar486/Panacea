import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FeatureBoulevard } from '../components/FeatureBoulevard'
import { PanaceaZoneNav } from '../components/PanaceaZoneNav'

export const GROUPS = [
  {
    name: 'Clinical',
    tools: [
      { to: '/body-explorer', name: 'Body Explorer', kw: 'anatomy physiology imaging atlas' },
      { to: '/frontier-health', name: 'Discovery & Innovation', kw: 'research discovery invention simulation' },
      { to: '/genome-lab', name: 'Genome Databank', kw: 'gene genome dna variant genetics' },
      { to: '/rujukan?t=obat', name: 'Drugs', kw: 'drug medication pharmacology mechanism safety' },
      { to: '/med-study', name: 'Medical Library', kw: 'library evidence guideline journal' },
      { to: '/chatbot', name: 'Ask Health', kw: 'health question ai clinical assistant' },
      { to: '/emr', name: 'AI-EMR', kw: 'medical record longitudinal care documentation' },
      { to: '/clinical-calculators', name: 'Calculators & Lab', kw: 'calculator laboratory clinical score' },
      { to: '/learn', name: 'Learn & Look Up', kw: 'learn lookup study reference' },
    ],
  },
]

type Layer = 'Anatomy' | 'Physiology' | 'Imaging'
type DiscoveryMode = 'Discover' | 'Invent' | 'Validate'
type Calculator = 'bmi' | 'map'

function Glass({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-[26px] border border-white/[.09] bg-white/[.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_18px_50px_rgba(0,0,0,.24)] backdrop-blur-2xl ${className}`}>{children}</section>
}

function Jump({ to }: { to: string }) {
  return <Link to={to} className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[.035] text-cyan-100 transition hover:border-cyan-200/30 hover:bg-cyan-200/[.08]" aria-label="Open full tool">↗</Link>
}

export function ClinicalHub() {
  const [layer, setLayer] = useState<Layer>('Anatomy')
  const [discovery, setDiscovery] = useState<DiscoveryMode>('Discover')
  const [gene, setGene] = useState('')
  const [drug, setDrug] = useState('')
  const [question, setQuestion] = useState('')
  const [library, setLibrary] = useState('')
  const [weight, setWeight] = useState(70)
  const [height, setHeight] = useState(170)
  const [sbp, setSbp] = useState(120)
  const [dbp, setDbp] = useState(80)
  const [calculator, setCalculator] = useState<Calculator>('bmi')
  const [lab, setLab] = useState('')
  const [low, setLow] = useState('')
  const [high, setHigh] = useState('')

  const bmi = useMemo(() => height > 0 ? weight / ((height / 100) ** 2) : 0, [height, weight])
  const map = useMemo(() => (sbp + 2 * dbp) / 3, [sbp, dbp])
  const labState = useMemo(() => {
    const value = Number(lab)
    const lo = Number(low)
    const hi = Number(high)
    if (!lab || !low || !high || ![value, lo, hi].every(Number.isFinite)) return '—'
    if (value < lo) return 'LOW'
    if (value > hi) return 'HIGH'
    return 'IN RANGE'
  }, [lab, low, high])

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-4 pb-12">
      <PanaceaZoneNav />

      <main className="relative isolate overflow-hidden rounded-[30px] border border-white/10 bg-[#01040a]/95 p-3 text-white shadow-[0_28px_90px_rgba(0,0,0,.5)] sm:p-5">
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-28 top-28 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl" aria-hidden />

        <header className="relative mb-5 flex items-end justify-between gap-3 px-1">
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-200/75">Super page 02</div>
            <h1 className="mt-1 truncate text-2xl font-black tracking-[-.035em] sm:text-3xl">Clinical</h1>
          </div>
          <div className="rounded-full border border-emerald-300/15 bg-emerald-300/[.07] px-3 py-1.5 text-[10px] font-black text-emerald-200">clinician-in-loop</div>
        </header>

        <div className="relative grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Glass>
            <div className="flex items-center justify-between"><b>Body Explorer</b><Jump to="/body-explorer" /></div>
            <div className="mt-4 grid grid-cols-3 gap-2">{(['Anatomy', 'Physiology', 'Imaging'] as const).map((item) => <button key={item} type="button" onClick={() => setLayer(item)} className={`min-h-[42px] rounded-[14px] border px-2 text-[9px] font-black transition ${layer === item ? 'border-cyan-200/45 bg-cyan-200 text-black' : 'border-white/10 bg-black/20 text-white/60'}`}>{item}</button>)}</div>
            <div className="mt-4 grid h-24 place-items-center rounded-[18px] border border-white/[.07] bg-[radial-gradient(circle_at_center,rgba(34,211,238,.14),transparent_58%)] text-4xl" aria-label={layer}>{layer === 'Anatomy' ? '◉' : layer === 'Physiology' ? '⌁' : '⌗'}</div>
          </Glass>

          <Glass>
            <div className="flex items-center justify-between"><b>Discovery</b><Jump to="/frontier-health" /></div>
            <div className="mt-4 flex gap-2">{(['Discover', 'Invent', 'Validate'] as const).map((item) => <button key={item} type="button" onClick={() => setDiscovery(item)} className={`min-h-[40px] flex-1 rounded-full border px-2 text-[9px] font-black transition ${discovery === item ? 'border-violet-200/50 bg-violet-200 text-black' : 'border-white/10 text-white/60'}`}>{item}</button>)}</div>
            <div className="mt-6 text-center text-4xl font-black" aria-label={discovery}>{discovery === 'Discover' ? '✦' : discovery === 'Invent' ? '◇' : '✓'}</div>
          </Glass>

          <Glass>
            <div className="flex items-center justify-between"><b>Genome</b><Jump to="/genome-lab" /></div>
            <input value={gene} onChange={(event) => setGene(event.target.value)} placeholder="Gene / variant…" className="mt-4 w-full rounded-[16px] border border-white/10 bg-black/30 px-3 py-3 text-xs outline-none focus:border-cyan-200/35" />
            <div className="mt-5 flex h-20 items-end gap-1" aria-hidden>{[34, 65, 45, 82, 52, 73, 41, 91, 58, 77, 48, 69].map((bar, index) => <i key={index} className="min-w-0 flex-1 rounded-full bg-gradient-to-t from-cyan-400 to-violet-400 transition" style={{ height: `${bar}%`, opacity: gene ? .85 : .25 }} />)}</div>
          </Glass>

          <Glass>
            <div className="flex items-center justify-between"><b>Drugs</b><Jump to="/rujukan?t=obat" /></div>
            <input value={drug} onChange={(event) => setDrug(event.target.value)} placeholder="Drug / class…" className="mt-4 w-full rounded-[16px] border border-white/10 bg-black/30 px-3 py-3 text-xs outline-none focus:border-cyan-200/35" />
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[9px] font-black text-white/65"><div className="rounded-[14px] border border-white/10 p-3">MOA</div><div className="rounded-[14px] border border-white/10 p-3">Dose</div><div className="rounded-[14px] border border-white/10 p-3">Safety</div></div>
          </Glass>

          <Glass>
            <div className="flex items-center justify-between"><b>Ask + Record</b><Jump to="/chatbot" /></div>
            <textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={3} placeholder="Ask Panacea…" className="mt-4 w-full resize-none rounded-[16px] border border-white/10 bg-black/30 p-3 text-xs outline-none focus:border-cyan-200/35" />
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/chatbot" onClick={() => { if (question.trim()) window.sessionStorage.setItem('pm_chat_draft', question.trim()) }} className="rounded-full bg-gradient-to-r from-cyan-200 to-violet-200 px-4 py-2 text-[10px] font-black text-black">Ask →</Link>
              <Link to="/emr" className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-black">AI-EMR</Link>
              <Link to="/care-episode" className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-black">Care</Link>
            </div>
          </Glass>

          <Glass>
            <div className="flex items-center justify-between"><b>Calculators</b><Jump to="/clinical-calculators" /></div>
            <div className="mt-3 flex gap-2"><button type="button" onClick={() => setCalculator('bmi')} className={`rounded-full px-3 py-1.5 text-[9px] font-black ${calculator === 'bmi' ? 'bg-white text-black' : 'border border-white/10'}`}>BMI</button><button type="button" onClick={() => setCalculator('map')} className={`rounded-full px-3 py-1.5 text-[9px] font-black ${calculator === 'map' ? 'bg-white text-black' : 'border border-white/10'}`}>MAP</button></div>
            {calculator === 'bmi' ? <div className="mt-4 grid grid-cols-2 gap-2"><input type="number" value={weight} onChange={(event) => setWeight(Number(event.target.value))} className="min-w-0 rounded-[14px] border border-white/10 bg-black/30 px-3 py-2 text-xs" aria-label="Weight kg" /><input type="number" value={height} onChange={(event) => setHeight(Number(event.target.value))} className="min-w-0 rounded-[14px] border border-white/10 bg-black/30 px-3 py-2 text-xs" aria-label="Height cm" /></div> : <div className="mt-4 grid grid-cols-2 gap-2"><input type="number" value={sbp} onChange={(event) => setSbp(Number(event.target.value))} className="min-w-0 rounded-[14px] border border-white/10 bg-black/30 px-3 py-2 text-xs" aria-label="Systolic pressure" /><input type="number" value={dbp} onChange={(event) => setDbp(Number(event.target.value))} className="min-w-0 rounded-[14px] border border-white/10 bg-black/30 px-3 py-2 text-xs" aria-label="Diastolic pressure" /></div>}
            <div className="mt-4 text-3xl font-black tabular-nums">{calculator === 'bmi' ? bmi.toFixed(1) : `${Math.round(map)} mmHg`}</div>
          </Glass>

          <Glass>
            <div className="flex items-center justify-between"><b>Lab Range</b><Jump to="/data-lab" /></div>
            <div className="mt-4 grid grid-cols-3 gap-2"><input inputMode="decimal" value={lab} onChange={(event) => setLab(event.target.value)} placeholder="Value" className="min-w-0 rounded-[14px] border border-white/10 bg-black/30 px-2 py-2 text-xs" /><input inputMode="decimal" value={low} onChange={(event) => setLow(event.target.value)} placeholder="Low" className="min-w-0 rounded-[14px] border border-white/10 bg-black/30 px-2 py-2 text-xs" /><input inputMode="decimal" value={high} onChange={(event) => setHigh(event.target.value)} placeholder="High" className="min-w-0 rounded-[14px] border border-white/10 bg-black/30 px-2 py-2 text-xs" /></div>
            <div className="mt-5 text-2xl font-black">{labState}</div>
            <div className="mt-2 truncate text-[9px] font-bold text-white/35">range comparison only</div>
          </Glass>

          <Glass className="sm:col-span-2">
            <div className="flex items-center justify-between"><b>Library + Learn</b><Jump to="/learn" /></div>
            <input value={library} onChange={(event) => setLibrary(event.target.value)} placeholder="Disease / guideline / article…" className="mt-4 w-full rounded-[16px] border border-white/10 bg-black/30 px-3 py-3 text-xs outline-none focus:border-cyan-200/35" />
            <div className="mt-3 flex flex-wrap gap-2"><Link to="/med-study" className="rounded-full border border-white/10 px-3 py-2 text-[9px] font-black">Library</Link><Link to="/learn?t=cases" className="rounded-full border border-white/10 px-3 py-2 text-[9px] font-black">Cases</Link><Link to="/radiology" className="rounded-full border border-white/10 px-3 py-2 text-[9px] font-black">Imaging</Link><Link to="/rujukan" className="rounded-full border border-white/10 px-3 py-2 text-[9px] font-black">Reference</Link></div>
          </Glass>
        </div>

        <div className="relative mt-5 truncate px-1 text-[9px] font-semibold text-white/35">BMI = kg ÷ m² · MAP ≈ (SBP + 2×DBP) ÷ 3 · decision support, not autonomous diagnosis</div>
      </main>

      <FeatureBoulevard zone="clinical" title="Clinical feature boulevard" />
    </div>
  )
}

export default ClinicalHub
