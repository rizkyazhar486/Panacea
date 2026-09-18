import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PanaceaZoneNav } from '../components/PanaceaZoneNav'
import { SuperPageCapabilityRail } from '../components/SuperPageCapabilityRail'
import { BodyExposurePortal } from '../components/BodyExposurePortal'

export const GROUPS = [
  {
    name: 'Clinical',
    tools: [
      { to: '/fitness-hub?view=body-exposure', name: 'Body Explorer', kw: 'anatomy physiology imaging atlas body exposure' },
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

type Calculator = 'bmi' | 'map'

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section layout whileHover={{ y: -2 }} transition={{ duration: .18 }} className={`rounded-[24px] border border-white/[.08] bg-white/[.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.06)] backdrop-blur-xl ${className}`}>
      {children}
    </motion.section>
  )
}

function Open({ to }: { to: string }) {
  return <Link to={to} className="grid h-8 w-8 place-items-center rounded-full border border-white/[.08] bg-white/[.035] text-cyan-100/70 transition hover:border-cyan-200/30 hover:bg-cyan-200/[.08] hover:text-white" aria-label="Open">↗</Link>
}

export function ClinicalHub() {
  const [calculator, setCalculator] = useState<Calculator>('bmi')
  const [question, setQuestion] = useState('')
  const [lookup, setLookup] = useState('')
  const [weight, setWeight] = useState(70)
  const [height, setHeight] = useState(170)
  const [sbp, setSbp] = useState(120)
  const [dbp, setDbp] = useState(80)
  const [lab, setLab] = useState('')
  const [low, setLow] = useState('')
  const [high, setHigh] = useState('')

  const bmi = useMemo(() => height > 0 ? weight / ((height / 100) ** 2) : 0, [height, weight])
  const map = useMemo(() => (sbp + 2 * dbp) / 3, [sbp, dbp])
  const labState = useMemo(() => {
    const value = Number(lab)
    const min = Number(low)
    const max = Number(high)
    if (!lab || !low || !high || ![value, min, max].every(Number.isFinite)) return '—'
    if (value < min) return 'LOW'
    if (value > max) return 'HIGH'
    return 'IN RANGE'
  }, [high, lab, low])

  const handoffQuestion = () => {
    const draft = question.trim()
    if (draft) window.sessionStorage.setItem('pm_chat_draft', draft)
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5 pb-20">
      <PanaceaZoneNav />

      <main className="relative isolate overflow-hidden rounded-[32px] border border-white/[.08] bg-[#01040a]/95 p-4 text-white shadow-[0_30px_90px_rgba(0,0,0,.45)] sm:p-6">
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-cyan-400/[.08] blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-24 top-20 h-80 w-80 rounded-full bg-violet-500/[.09] blur-3xl" aria-hidden />

        <header className="relative mb-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="truncate text-[9px] font-black uppercase tracking-[.2em] text-cyan-100/45">Super page 02</div>
            <h1 className="truncate text-2xl font-black tracking-[-.04em] sm:text-3xl">Clinical</h1>
          </div>
          <span className="shrink-0 rounded-full border border-emerald-300/15 bg-emerald-300/[.06] px-3 py-1.5 text-[9px] font-black text-emerald-200/80">clinician-in-loop</span>
        </header>

        <div className="relative grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="min-w-0 sm:col-span-2 xl:col-span-2">
            <BodyExposurePortal context="clinical" />
          </div>

          <Card className="xl:col-span-2">
            <div className="flex items-center justify-between"><strong className="truncate text-sm">Ask + Record</strong><Open to="/chatbot" /></div>
            <label className="mt-4 flex min-h-[48px] items-center gap-2 rounded-[16px] border border-white/[.08] bg-black/25 px-3 focus-within:border-cyan-200/30">
              <span className="text-cyan-100/45" aria-hidden>✦</span>
              <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask Panacea…" className="min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none placeholder:text-white/25" />
            </label>
            <div className="mt-3 grid grid-cols-4 gap-2">
              <Link to="/chatbot" onClick={handoffQuestion} className="grid min-h-[42px] place-items-center rounded-[14px] bg-gradient-to-r from-cyan-200 to-violet-200 px-2 text-[9px] font-black text-black">Ask</Link>
              <Link to="/emr" className="grid min-h-[42px] place-items-center rounded-[14px] border border-white/[.08] px-2 text-[9px] font-black text-white/65">AI-EMR</Link>
              <Link to="/care-episode" className="grid min-h-[42px] place-items-center rounded-[14px] border border-white/[.08] px-2 text-[9px] font-black text-white/65">Care</Link>
              <Link to="/emergency" className="grid min-h-[42px] place-items-center rounded-[14px] border border-white/[.08] px-2 text-[9px] font-black text-white/65">Emergency</Link>
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
              {['Evidence', 'Guideline', 'Drug', 'Imaging'].map((item) => <span key={item} className="shrink-0 rounded-full border border-white/[.07] bg-white/[.025] px-3 py-1.5 text-[9px] font-black text-white/38">{item}</span>)}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between"><strong className="truncate text-sm">Calculator</strong><Open to="/clinical-calculators" /></div>
            <div className="mt-3 flex gap-2">
              {(['bmi', 'map'] as const).map((item) => <button key={item} type="button" onClick={() => setCalculator(item)} className={`rounded-full px-3 py-1.5 text-[9px] font-black uppercase ${calculator === item ? 'bg-white text-black' : 'border border-white/[.08] text-white/45'}`}>{item}</button>)}
            </div>
            {calculator === 'bmi' ? (
              <div className="mt-4 grid grid-cols-2 gap-2"><input type="number" value={weight} onChange={(event) => setWeight(Number(event.target.value))} aria-label="Weight kg" className="min-w-0 rounded-[13px] border border-white/[.07] bg-black/25 px-2 py-2 text-xs" /><input type="number" value={height} onChange={(event) => setHeight(Number(event.target.value))} aria-label="Height cm" className="min-w-0 rounded-[13px] border border-white/[.07] bg-black/25 px-2 py-2 text-xs" /></div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-2"><input type="number" value={sbp} onChange={(event) => setSbp(Number(event.target.value))} aria-label="Systolic pressure" className="min-w-0 rounded-[13px] border border-white/[.07] bg-black/25 px-2 py-2 text-xs" /><input type="number" value={dbp} onChange={(event) => setDbp(Number(event.target.value))} aria-label="Diastolic pressure" className="min-w-0 rounded-[13px] border border-white/[.07] bg-black/25 px-2 py-2 text-xs" /></div>
            )}
            <motion.div layout className="mt-4 truncate text-3xl font-black tabular-nums">{calculator === 'bmi' ? bmi.toFixed(1) : `${Math.round(map)} mmHg`}</motion.div>
          </Card>

          <Card>
            <div className="flex items-center justify-between"><strong className="truncate text-sm">Lab Range</strong><Open to="/data-lab" /></div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <input inputMode="decimal" value={lab} onChange={(event) => setLab(event.target.value)} placeholder="Value" className="min-w-0 rounded-[13px] border border-white/[.07] bg-black/25 px-2 py-2 text-xs" />
              <input inputMode="decimal" value={low} onChange={(event) => setLow(event.target.value)} placeholder="Low" className="min-w-0 rounded-[13px] border border-white/[.07] bg-black/25 px-2 py-2 text-xs" />
              <input inputMode="decimal" value={high} onChange={(event) => setHigh(event.target.value)} placeholder="High" className="min-w-0 rounded-[13px] border border-white/[.07] bg-black/25 px-2 py-2 text-xs" />
            </div>
            <AnimatePresence mode="wait"><motion.div key={labState} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="mt-5 truncate text-2xl font-black">{labState}</motion.div></AnimatePresence>
          </Card>

          <Card>
            <div className="flex items-center justify-between"><strong className="truncate text-sm">Genome + Drugs</strong><Open to="/genome-lab" /></div>
            <label className="mt-4 flex min-h-[44px] items-center rounded-[14px] border border-white/[.07] bg-black/25 px-3 focus-within:border-violet-200/30">
              <input value={lookup} onChange={(event) => setLookup(event.target.value)} placeholder="Gene / drug / disease…" className="min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none placeholder:text-white/25" />
            </label>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Link to="/genome-lab" className="grid min-h-[40px] place-items-center rounded-[13px] border border-white/[.07] text-[9px] font-black text-white/55">Genome</Link>
              <Link to="/rujukan?t=obat" className="grid min-h-[40px] place-items-center rounded-[13px] border border-white/[.07] text-[9px] font-black text-white/55">Drugs</Link>
              <Link to="/med-study" className="grid min-h-[40px] place-items-center rounded-[13px] border border-white/[.07] text-[9px] font-black text-white/55">Library</Link>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between"><strong className="truncate text-sm">Discovery</strong><Open to="/frontier-health" /></div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {['Discover', 'Invent', 'Validate'].map((item, index) => <Link key={item} to="/frontier-health" className="grid min-h-[70px] place-items-center rounded-[16px] border border-white/[.07] bg-[radial-gradient(circle_at_center,rgba(139,92,246,.12),transparent_65%)] text-center"><span className="text-xl text-violet-100/70">{index === 0 ? '✦' : index === 1 ? '◇' : '✓'}</span><span className="sr-only">{item}</span></Link>)}
            </div>
          </Card>
        </div>

        <div className="relative mt-5 truncate text-[9px] font-semibold text-white/28">BMI = kg ÷ m² · MAP ≈ (SBP + 2×DBP) ÷ 3 · reference-range comparison only</div>
      </main>

      <SuperPageCapabilityRail domain="clinical" initialLimit={28} />
    </div>
  )
}

export default ClinicalHub
