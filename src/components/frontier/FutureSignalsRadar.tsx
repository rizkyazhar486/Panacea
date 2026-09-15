import { useMemo, useState } from 'react'

type SignalStatus = 'deployed' | 'active-rd' | 'experimental' | 'speculative' | 'research-preview'
type SignalHorizon = 'Now–3y' | '3–10y' | '10y+'
type SignalDomain = 'Medical AI' | 'Biotechnology' | 'Sensing' | 'Climate' | 'Mobility' | 'Energy' | 'Bioacoustics'

type FutureSignal = {
  id: string
  title: string
  kicker: string
  domain: SignalDomain
  horizon: SignalHorizon
  status: SignalStatus
  evidence: number
  maturity: number
  healthRelevance: number
  summary: string
  panaceaLens: string
  realityCheck: string
  sourceLabel: string
  sourceUrl: string
  visual: 'ai' | 'battery' | 'whale' | 'dust' | 'ocean' | 'mammoth' | 'train' | 'tissue' | 'earth'
}

const STATUS_LABEL: Record<SignalStatus, string> = {
  deployed: 'Early deployment',
  'active-rd': 'Active R&D',
  experimental: 'Experimental',
  speculative: 'Speculative',
  'research-preview': 'Research preview',
}

const SIGNALS: FutureSignal[] = [
  {
    id: 'medical-ai',
    title: 'Frontier medical AI is becoming a research instrument',
    kicker: 'OPEN-EVIDENCE SIGNAL',
    domain: 'Medical AI',
    horizon: 'Now–3y',
    status: 'research-preview',
    evidence: 92,
    maturity: 72,
    healthRelevance: 100,
    summary: 'OpenEvidence reports that Darwin, its research-preview medical model, reached 100% on MedQA and led its reported MedXpertQA, HealthBench Professional and NOHARM evaluations.',
    panaceaLens: 'Build Panacea around benchmark suites, prospective validation, calibration, provenance and clinician-review gates — not around a single model leaderboard.',
    realityCheck: 'A benchmark score is not bedside accuracy, prospective clinical utility, safety, calibration or regulatory clearance. Treat these numbers as company-reported research results.',
    sourceLabel: 'OpenEvidence model-family announcement · Sep 2026',
    sourceUrl: 'https://www.businesswire.com/news/home/20260903878517/en/',
    visual: 'ai',
  },
  {
    id: 'diamond-battery',
    title: 'Ultra-long-life diamond batteries',
    kicker: 'ENERGY · IMPLANTS',
    domain: 'Energy',
    horizon: '3–10y',
    status: 'experimental',
    evidence: 86,
    maturity: 45,
    healthRelevance: 74,
    summary: 'Carbon-14 diamond batteries can generate very low continuous power from radioactive decay and are being explored for devices that are difficult to recharge or replace.',
    panaceaLens: 'Track this for implanted sensors, pacemakers, remote monitoring nodes and extreme-environment medical devices where longevity matters more than high power.',
    realityCheck: 'This is a micropower technology. “A phone battery that lasts 100 years” overstates what present diamond-battery prototypes can deliver.',
    sourceLabel: 'University of Bristol + UKAEA · carbon-14 diamond battery',
    sourceUrl: 'https://www.bristol.ac.uk/cabot/news/2024/diamond-battery.html',
    visual: 'battery',
  },
  {
    id: 'whale-language',
    title: 'AI-assisted interspecies communication',
    kicker: 'BIOACOUSTICS · LANGUAGE',
    domain: 'Bioacoustics',
    horizon: '3–10y',
    status: 'active-rd',
    evidence: 91,
    maturity: 51,
    healthRelevance: 52,
    summary: 'Project CETI combines machine learning, robotics, acoustic recording and behavioral context to identify structure in sperm-whale communication and work toward scientific interpretation.',
    panaceaLens: 'The transferable idea is multimodal sequence decoding: align sound, movement, physiology and context before asking an AI system to infer meaning.',
    realityCheck: 'Researchers are working toward decoding communication; reliable free-form two-way “conversation with whales” has not been demonstrated.',
    sourceLabel: 'Project CETI · research programme',
    sourceUrl: 'https://www.projectceti.org/research/index',
    visual: 'whale',
  },
  {
    id: 'smart-dust',
    title: 'Ambient micro-sensor networks — “smart dust”',
    kicker: 'SENSING · PRIVACY',
    domain: 'Sensing',
    horizon: '3–10y',
    status: 'experimental',
    evidence: 78,
    maturity: 48,
    healthRelevance: 72,
    summary: 'Millimeter-scale sensing and communication platforms have been an active MEMS research direction for decades, with modern descendants spanning distributed environmental and industrial sensing.',
    panaceaLens: 'Potential health uses include passive environmental exposure sensing, hospital logistics and unobtrusive monitoring — only with explicit consent, minimization and secure local processing.',
    realityCheck: '“Privacy will die” is a social prediction, not a technical result. Dense sensing increases surveillance risk, which makes governance and privacy engineering part of the core architecture.',
    sourceLabel: 'UC Berkeley Smart Dust research',
    sourceUrl: 'https://www2-bsac.eecs.berkeley.edu/~pister/SmartDust/',
    visual: 'dust',
  },
  {
    id: 'floating-cities',
    title: 'Climate-resilient floating communities',
    kicker: 'CLIMATE · HABITAT',
    domain: 'Climate',
    horizon: '10y+',
    status: 'experimental',
    evidence: 74,
    maturity: 36,
    healthRelevance: 58,
    summary: 'UN-Habitat and OCEANIX have developed a prototype vision for modular floating communities as one possible response to land scarcity and climate-related coastal risk.',
    panaceaLens: 'Model what a self-reliant health stack would need offshore: telemedicine, emergency evacuation, water safety, infectious-disease surveillance and resilient supply chains.',
    realityCheck: 'A prototype concept is not evidence that humanity will broadly move into autonomous ocean cities.',
    sourceLabel: 'UN-Habitat · OCEANIX Busan prototype',
    sourceUrl: 'https://unhabitat.org/news/27-apr-2022/un-habitat-and-partners-unveil-oceanix-busan-the-worlds-first-prototype-floating',
    visual: 'ocean',
  },
  {
    id: 'de-extinction',
    title: 'De-extinction as a genomics stress test',
    kicker: 'GENOMICS · REPRODUCTION',
    domain: 'Biotechnology',
    horizon: '3–10y',
    status: 'active-rd',
    evidence: 76,
    maturity: 39,
    healthRelevance: 69,
    summary: 'Colossal Biosciences is pursuing mammoth-like de-extinction using gene editing, stem-cell and reproductive technologies, with a company target of 2028 for first calves.',
    panaceaLens: 'The clinically relevant spillovers are gene editing, comparative genomics, reproductive biotechnology, cryobiology and conservation medicine — not “resurrecting” an exact ancient animal.',
    realityCheck: 'The 2028 date is a company target, not a guaranteed biological milestone; resulting animals would be engineered proxies, not literally recovered extinct individuals.',
    sourceLabel: 'Colossal Biosciences · mammoth programme',
    sourceUrl: 'https://colossal.com/inside-colossal-biosciences-dallas-hq-the-science-behind-the-woolly-mammoth-revival/',
    visual: 'mammoth',
  },
  {
    id: 'vacuum-transport',
    title: 'Low-vacuum ultra-high-speed ground transport',
    kicker: 'MOBILITY · LOGISTICS',
    domain: 'Mobility',
    horizon: '10y+',
    status: 'experimental',
    evidence: 68,
    maturity: 32,
    healthRelevance: 47,
    summary: 'Hyperloop-style systems remain an engineering and test-track field rather than a mature transport network, with active work on low-vacuum tubes, maglev subsystems and capsule prototypes.',
    panaceaLens: 'The medical opportunity is logistics: faster movement of organs, blood products, critical supplies and specialist teams if infrastructure ever reaches operational reliability.',
    realityCheck: 'Claims that vacuum trains will replace aircraft or routinely exceed 1,000 km/h are scenarios, not current demonstrated service performance.',
    sourceLabel: 'Hyperworks Global Observatory · 2026 project tracker',
    sourceUrl: 'https://hyper.works/en/observatory',
    visual: 'train',
  },
  {
    id: 'cultivated-cells',
    title: 'Cultivated animal cells are already entering food regulation',
    kicker: 'CELL CULTURE · BIOFACTURING',
    domain: 'Biotechnology',
    horizon: 'Now–3y',
    status: 'deployed',
    evidence: 96,
    maturity: 66,
    healthRelevance: 81,
    summary: 'FDA now maintains an inventory of completed consultations for foods made with cultured animal cells, while USDA-FSIS has inspection responsibilities for cell-cultured meat and poultry products.',
    panaceaLens: 'Translate the same manufacturing logic toward tissue engineering, quality-by-design, contamination monitoring, scaffold biology and regenerative-medicine workflows.',
    realityCheck: 'Cultivated meat is real, but scale, economics, texture, regulation and consumer adoption remain active constraints; it is not yet a universal replacement for conventional meat.',
    sourceLabel: 'FDA cultured-animal-cell food inventory · updated 2026',
    sourceUrl: 'https://www.hfpappexternal.fda.gov/scripts/fdcc/index.cfm?set=AnimalCellCultureFoods',
    visual: 'tissue',
  },
  {
    id: 'earth-digital-twin',
    title: 'Earth-scale digital twins are moving from concept to infrastructure',
    kicker: 'DIGITAL TWIN · PLANETARY HEALTH',
    domain: 'Climate',
    horizon: 'Now–3y',
    status: 'deployed',
    evidence: 98,
    maturity: 73,
    healthRelevance: 83,
    summary: 'The European Commission’s Destination Earth programme operates digital twins for extreme events and climate adaptation and targets a progressively more comprehensive Earth-system twin by 2030.',
    panaceaLens: 'Fuse climate, air quality, heat, disaster and population signals with health-system capacity to model surge risk and preventive interventions at city-to-region scale.',
    realityCheck: 'A digital twin is a model constrained by observations, not a perfect copy of reality. Forecast uncertainty and model limits must remain visible.',
    sourceLabel: 'European Commission · Destination Earth',
    sourceUrl: 'https://digital-strategy.ec.europa.eu/en/policies/destination-earth',
    visual: 'earth',
  },
]

const DOMAINS: Array<'All' | SignalDomain> = ['All', 'Medical AI', 'Biotechnology', 'Sensing', 'Climate', 'Mobility', 'Energy', 'Bioacoustics']

const statusTone = (status: SignalStatus) => {
  if (status === 'deployed') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
  if (status === 'research-preview') return 'border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200'
  if (status === 'active-rd') return 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200'
  if (status === 'experimental') return 'border-amber-400/30 bg-amber-400/10 text-amber-200'
  return 'border-white/15 bg-white/5 text-neutral-300'
}

export function innovationSignalScore(signal: Pick<FutureSignal, 'evidence' | 'maturity' | 'healthRelevance'>) {
  return Math.round(0.45 * signal.evidence + 0.3 * signal.maturity + 0.25 * signal.healthRelevance)
}

function MiniMeter({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2 text-[9px] font-bold uppercase tracking-[.12em] text-white/45">
        <span>{label}</span><span>{value}</span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function SignalGlyph({ kind }: { kind: FutureSignal['visual'] }) {
  const common = 'fill-none stroke-current'
  if (kind === 'earth') return (
    <svg viewBox="0 0 220 140" aria-hidden="true" className="h-full w-full text-cyan-200/85">
      <circle cx="112" cy="70" r="43" className={common} strokeWidth="2" />
      <ellipse cx="112" cy="70" rx="43" ry="17" className={common} strokeWidth="1.2" opacity=".55" />
      <ellipse cx="112" cy="70" rx="18" ry="43" className={common} strokeWidth="1.2" opacity=".55" />
      <path d="M71 66c17-8 20-25 36-22 11 2 12 12 24 14 9 1 19-5 24 4-12 9-10 16-21 22-8 5-13 19-27 15-10-3-11-16-21-18-9-2-11-8-15-15Z" fill="currentColor" opacity=".13" />
      <path d="M43 103c48 24 98 23 142-3M39 46c45-22 102-24 150 2" className={common} opacity=".18" />
    </svg>
  )
  if (kind === 'whale') return (
    <svg viewBox="0 0 220 140" aria-hidden="true" className="h-full w-full text-cyan-100/85">
      <path d="M37 80c18-29 51-37 92-30 23 4 35 18 40 30 8 0 16-6 25-17-1 20-8 31-24 33-11 23-42 31-79 21-23-6-43-18-54-37Z" fill="currentColor" opacity=".16" />
      <path d="M37 80c18-29 51-37 92-30 23 4 35 18 40 30 8 0 16-6 25-17-1 20-8 31-24 33-11 23-42 31-79 21-23-6-43-18-54-37Z" className={common} strokeWidth="2" />
      <path d="M82 105c-5 13-15 20-27 22M102 109c7 11 18 16 31 16M169 78c13-12 25-16 35-15" className={common} opacity=".6" />
      <circle cx="137" cy="67" r="2" fill="currentColor" />
    </svg>
  )
  if (kind === 'battery') return (
    <svg viewBox="0 0 220 140" aria-hidden="true" className="h-full w-full text-sky-100/90">
      <rect x="65" y="26" width="90" height="90" rx="24" className={common} strokeWidth="2" />
      <path d="M94 26v-9h32v9" className={common} strokeWidth="2" />
      <path d="M116 41 88 78h21l-7 29 31-42h-22l5-24Z" fill="currentColor" opacity=".22" />
      <path d="M116 41 88 78h21l-7 29 31-42h-22l5-24Z" className={common} strokeWidth="1.5" />
      <circle cx="110" cy="71" r="52" className={common} opacity=".12" />
    </svg>
  )
  if (kind === 'ai') return (
    <svg viewBox="0 0 220 140" aria-hidden="true" className="h-full w-full text-violet-100/90">
      <path d="M82 39c-14 4-21 16-19 29-11 9-9 28 5 34 5 12 20 17 31 10 7 9 23 8 29-3 14 4 27-8 25-22 10-10 5-27-9-31-1-14-16-24-29-18-9-8-24-7-33 1Z" className={common} strokeWidth="2" />
      <path d="M91 55h38M80 71h61M84 88h50M100 43v68M121 41v72" className={common} opacity=".35" />
      {[['91','55'],['129','55'],['80','71'],['141','71'],['84','88'],['134','88'],['100','43'],['100','111'],['121','41'],['121','113']].map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" fill="currentColor" />)}
    </svg>
  )
  if (kind === 'dust') return (
    <svg viewBox="0 0 220 140" aria-hidden="true" className="h-full w-full text-cyan-100/85">
      {Array.from({ length: 34 }, (_, i) => {
        const x = 22 + ((i * 47) % 178)
        const y = 18 + ((i * 29) % 104)
        const r = 1 + (i % 3)
        return <circle key={i} cx={x} cy={y} r={r} fill="currentColor" opacity={0.22 + (i % 5) * 0.12} />
      })}
      <path d="M43 92c20-35 42-52 67-52 27 0 46 19 67 55M54 102c17-24 35-37 56-37 22 0 39 13 56 38" className={common} opacity=".34" />
    </svg>
  )
  if (kind === 'ocean') return (
    <svg viewBox="0 0 220 140" aria-hidden="true" className="h-full w-full text-cyan-100/85">
      <path d="M15 105c26-12 43 11 67 0 24-11 42 9 64 0 22-9 36 3 59-3" className={common} strokeWidth="2" />
      <path d="M54 89h112L145 45H76L54 89Z" fill="currentColor" opacity=".12" />
      <path d="M54 89h112L145 45H76L54 89Z" className={common} strokeWidth="1.6" />
      <path d="M84 77V55h19v22m12 0V38h20v39m9 0V59h13v18" className={common} />
      <path d="M62 93c12 8 83 10 99 0" className={common} opacity=".35" />
    </svg>
  )
  if (kind === 'mammoth') return (
    <svg viewBox="0 0 220 140" aria-hidden="true" className="h-full w-full text-amber-100/85">
      <path d="M67 104V69c0-24 20-41 48-41 29 0 48 17 48 44v32h-18V74c0 22-11 35-29 35-13 0-25-7-32-19v14H67Z" fill="currentColor" opacity=".12" />
      <path d="M67 104V69c0-24 20-41 48-41 29 0 48 17 48 44v32m-96 0h17V90c7 12 19 19 32 19 18 0 29-13 29-35v30" className={common} strokeWidth="2" />
      <path d="M148 61c17 7 25 22 23 43-1 13 5 19 15 19M145 78c-12 8-17 22-10 34 6 10 18 12 28 4" className={common} />
      <circle cx="137" cy="55" r="2.5" fill="currentColor" />
      <path d="M72 41 58 29m23 6-7-17m21 13 1-18m14 17 8-17m6 22 15-16" className={common} opacity=".35" />
    </svg>
  )
  if (kind === 'train') return (
    <svg viewBox="0 0 220 140" aria-hidden="true" className="h-full w-full text-sky-100/90">
      <path d="M33 89c18-34 49-50 95-50 33 0 54 13 64 38-15 21-39 30-74 30H46c-9 0-14-7-13-18Z" fill="currentColor" opacity=".12" />
      <path d="M33 89c18-34 49-50 95-50 33 0 54 13 64 38-15 21-39 30-74 30H46c-9 0-14-7-13-18Z" className={common} strokeWidth="2" />
      <path d="M74 60h75c14 0 24 5 31 15H60c4-6 9-11 14-15Z" fill="currentColor" opacity=".2" />
      <path d="M22 115h181M17 123h191" className={common} opacity=".25" />
    </svg>
  )
  return (
    <svg viewBox="0 0 220 140" aria-hidden="true" className="h-full w-full text-rose-100/85">
      <path d="M44 90c0-32 25-54 66-54s66 22 66 54c0 13-9 22-24 22H68c-15 0-24-9-24-22Z" fill="currentColor" opacity=".11" />
      {Array.from({ length: 8 }, (_, row) => Array.from({ length: 12 }, (_, col) => (
        <circle key={`${row}-${col}`} cx={56 + col * 10} cy={53 + row * 7} r="2.6" fill="currentColor" opacity={0.18 + ((row + col) % 4) * 0.12} />
      )))}
      <path d="M39 105h142M54 117h112" className={common} opacity=".22" />
    </svg>
  )
}

function BenchmarkStrip() {
  const metrics = [
    ['MedQA', '100.0%'],
    ['MedXpertQA', '72.8%'],
    ['HealthBench Pro', '82.7%'],
    ['NOHARM', '87.2%'],
  ]
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {metrics.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-white/10 bg-white/[.045] p-3">
          <div className="text-lg font-black tracking-tight text-white">{value}</div>
          <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[.12em] text-white/45">{label}</div>
        </div>
      ))}
    </div>
  )
}

export function FutureSignalsRadar() {
  const [domain, setDomain] = useState<(typeof DOMAINS)[number]>('All')
  const [selectedId, setSelectedId] = useState(SIGNALS[0].id)

  const visible = useMemo(
    () => SIGNALS.filter((signal) => domain === 'All' || signal.domain === domain).sort((a, b) => innovationSignalScore(b) - innovationSignalScore(a)),
    [domain],
  )
  const selected = SIGNALS.find((signal) => signal.id === selectedId) ?? visible[0] ?? SIGNALS[0]

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#05070b] text-white shadow-2xl shadow-black/25" aria-labelledby="future-signals-title">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-90" style={{ background: 'radial-gradient(circle at 12% 8%, rgba(34,211,238,.16), transparent 28%), radial-gradient(circle at 78% 14%, rgba(168,85,247,.14), transparent 26%), radial-gradient(circle at 72% 78%, rgba(236,72,153,.09), transparent 24%)' }} />
      <div className="relative space-y-5 p-4 sm:p-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <div className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-300">Panacea Innovation Intelligence · Future Signals</div>
            <h2 id="future-signals-title" className="mt-2 text-2xl font-black tracking-[-.035em] sm:text-3xl">Turn viral future claims into evidence-ranked innovation.</h2>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-white/58 sm:text-sm">
              The visual language is intentionally cinematic; the claims are not. Every signal is separated into evidence, maturity, health relevance and a reality check so Panacea can explore ambitious futures without presenting speculation as fact.
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[.07] px-3 py-2 text-[10px] font-bold leading-relaxed text-cyan-100/80">
            Scenario ≠ prediction<br />Benchmark ≠ clinical validation
          </div>
        </header>

        <div className="rounded-[26px] border border-violet-300/15 bg-gradient-to-br from-violet-500/[.13] via-white/[.025] to-cyan-400/[.08] p-4 sm:p-5">
          <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.2em] text-violet-200">Featured frontier · Medical AI</div>
              <h3 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">Darwin benchmark signal, interpreted for product strategy</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/60">
                OpenEvidence reports a perfect MedQA result for Darwin and stronger scores on harder medical benchmarks. Panacea should treat this as evidence that domain-specialized medical AI is accelerating — while keeping deployment gated by prospective evidence, calibration and clinician oversight.
              </p>
              <div className="mt-4"><BenchmarkStrip /></div>
              <div className="mt-3 text-[10px] leading-relaxed text-white/40">Company-reported research-preview benchmark snapshot, September 2026. These percentages are not bedside diagnostic-accuracy claims.</div>
            </div>
            <div className="relative min-h-52 overflow-hidden rounded-3xl border border-white/10 bg-black/30">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,.24),transparent_55%)]" />
              <div className="absolute inset-0"><SignalGlyph kind="ai" /></div>
              <div className="absolute inset-x-4 bottom-4 grid grid-cols-3 gap-2">
                <MiniMeter label="Evidence" value={92} />
                <MiniMeter label="Maturity" value={72} />
                <MiniMeter label="Health" value={100} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1" aria-label="Filter innovation signals by domain">
          {DOMAINS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setDomain(item)
                const first = SIGNALS.filter((signal) => item === 'All' || signal.domain === item).sort((a, b) => innovationSignalScore(b) - innovationSignalScore(a))[0]
                if (first) setSelectedId(first.id)
              }}
              aria-pressed={domain === item}
              className={`min-h-10 shrink-0 rounded-xl px-3 text-[11px] font-black transition ${domain === item ? 'bg-white text-black' : 'border border-white/10 bg-white/[.035] text-white/55 hover:bg-white/[.07] hover:text-white'}`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((signal) => {
            const score = innovationSignalScore(signal)
            const active = selected.id === signal.id
            return (
              <button
                key={signal.id}
                type="button"
                onClick={() => setSelectedId(signal.id)}
                className={`group overflow-hidden rounded-[24px] border text-left transition ${active ? 'border-cyan-300/45 bg-white/[.075] shadow-lg shadow-cyan-950/20' : 'border-white/10 bg-white/[.03] hover:border-white/20 hover:bg-white/[.055]'}`}
              >
                <div className="relative h-36 overflow-hidden bg-gradient-to-br from-slate-950 via-[#0a1220] to-[#101126]">
                  <div className="absolute inset-0 opacity-80"><SignalGlyph kind={signal.visual} /></div>
                  <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[9px] font-black tracking-[.12em] text-white/70 backdrop-blur">{signal.kicker}</div>
                  <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur">{score}/100</div>
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-full border px-2 py-1 text-[9px] font-black ${statusTone(signal.status)}`}>{STATUS_LABEL[signal.status]}</span>
                    <span className="rounded-full border border-white/10 bg-white/[.035] px-2 py-1 text-[9px] font-bold text-white/45">{signal.horizon}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black leading-snug text-white">{signal.title}</h3>
                    <p className="mt-1.5 line-clamp-3 text-[11px] leading-relaxed text-white/48">{signal.summary}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <MiniMeter label="E" value={signal.evidence} />
                    <MiniMeter label="M" value={signal.maturity} />
                    <MiniMeter label="H" value={signal.healthRelevance} />
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="grid gap-4 rounded-[26px] border border-white/10 bg-white/[.035] p-4 lg:grid-cols-[1.05fr_.95fr] sm:p-5">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-300">Selected signal · {selected.domain}</div>
            <h3 className="mt-1.5 text-xl font-black tracking-tight">{selected.title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-white/58">{selected.summary}</p>
            <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.055] p-3">
              <div className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-200">Panacea translation lens</div>
              <p className="mt-1 text-[11px] leading-relaxed text-cyan-50/75">{selected.panaceaLens}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[.055] p-3">
              <div className="text-[9px] font-black uppercase tracking-[.16em] text-amber-200">Reality check</div>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-50/75">{selected.realityCheck}</p>
            </div>
            <a href={selected.sourceUrl} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.035] px-3 text-[11px] font-bold text-white/65 transition hover:bg-white/[.07] hover:text-white">
              <span>{selected.sourceLabel}</span><span aria-hidden="true">↗</span>
            </a>
            <div className="rounded-2xl border border-white/10 p-3 text-[10px] leading-relaxed text-white/42">
              <strong className="text-white/70">Panacea Innovation Signal score</strong><br />
              S = 0.45E + 0.30M + 0.25H, where E = evidence strength, M = maturity and H = health relevance. This is a transparent product-prioritization heuristic, not a scientific or clinical equation.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FutureSignalsRadar
