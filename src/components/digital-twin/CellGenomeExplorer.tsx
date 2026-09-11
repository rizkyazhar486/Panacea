import { useMemo, useState } from 'react'

type MicroStage = 'cell' | 'nucleus' | 'chromatin' | 'dna' | 'sequencing'

type StageMeta = {
  key: MicroStage
  label: string
  scale: string
  detail: string
}

const STAGES: StageMeta[] = [
  { key: 'cell', label: 'Cell', scale: '~10–30 µm', detail: 'Plasma membrane, cytoplasm, nucleus and major organelles.' },
  { key: 'nucleus', label: 'Nucleus', scale: '~5–10 µm', detail: 'Double nuclear envelope, pores, nucleolus and chromatin territories.' },
  { key: 'chromatin', label: 'Chromatin', scale: '10–30 nm', detail: 'DNA packaged around histones into nucleosomes and higher-order chromatin.' },
  { key: 'dna', label: 'DNA', scale: '~2 nm', detail: 'Antiparallel double helix with paired nucleobases and sugar-phosphate backbones.' },
  { key: 'sequencing', label: 'Sequencing', scale: 'base-level', detail: 'Synthetic reads, depth and variant evidence separated from biological anatomy.' },
]

const SYNTHETIC_REFERENCE = 'ACGTTGCAAGCTGATCGTACCGATGCTAGCTAGGCTAATCGGATCGA'
const SYNTHETIC_ALT = 'ACGTTGCAAGCTGATCGTACCGATGTTAGCTAGGCTAATCGGATCGA'

function stageIndex(stage: MicroStage) {
  return STAGES.findIndex((item) => item.key === stage)
}

function CellView({ onZoom }: { onZoom: () => void }) {
  const mitochondria = [
    { x: 195, y: 170, r: -18 },
    { x: 555, y: 170, r: 22 },
    { x: 185, y: 390, r: 18 },
    { x: 565, y: 400, r: -20 },
  ]

  return (
    <svg viewBox="0 0 760 560" className="h-full min-h-[430px] w-full" role="img" aria-label="Scientific cell schematic with nucleus and organelles">
      <defs>
        <radialGradient id="cellCytoplasm" cx="42%" cy="38%" r="68%">
          <stop offset="0%" stopColor="#153447" />
          <stop offset="58%" stopColor="#0c2535" />
          <stop offset="100%" stopColor="#07131d" />
        </radialGradient>
        <radialGradient id="cellNucleus" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#554775" />
          <stop offset="62%" stopColor="#302b50" />
          <stop offset="100%" stopColor="#17182c" />
        </radialGradient>
        <filter id="cellShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#000" floodOpacity="0.55" />
        </filter>
      </defs>

      <ellipse cx="380" cy="285" rx="292" ry="225" fill="url(#cellCytoplasm)" stroke="#5ed6e6" strokeOpacity="0.56" strokeWidth="5" filter="url(#cellShadow)" />
      <ellipse cx="380" cy="285" rx="280" ry="213" fill="none" stroke="#d7fbff" strokeOpacity="0.14" strokeWidth="2" />

      <g opacity="0.34" fill="#77d5d8">
        {Array.from({ length: 50 }, (_, index) => {
          const angle = (index / 50) * Math.PI * 2
          const radius = 150 + (index % 7) * 16
          return <circle key={index} cx={380 + Math.cos(angle) * radius} cy={285 + Math.sin(angle) * radius * 0.72} r={(index % 3) + 1.1} />
        })}
      </g>

      <g fill="none" stroke="#64d8c6" strokeOpacity="0.32" strokeWidth="5" strokeLinecap="round">
        <path d="M255 205 C300 182 306 224 350 205 C390 187 415 205 447 188" />
        <path d="M248 230 C292 212 321 249 360 225 C399 201 436 228 478 213" />
        <path d="M266 255 C307 244 329 271 372 250 C407 232 446 256 490 239" />
      </g>
      <g fill="#6ce1d0" opacity="0.5">
        {[278, 318, 354, 397, 438, 467].map((x, i) => <circle key={x} cx={x} cy={205 + (i % 2) * 36} r="4" />)}
      </g>

      <g fill="none" stroke="#e6b86f" strokeOpacity="0.55" strokeWidth="8" strokeLinecap="round">
        <path d="M440 346 C482 330 512 333 544 351" />
        <path d="M438 361 C479 347 514 350 550 368" />
        <path d="M443 377 C484 365 516 369 545 385" />
        <path d="M451 393 C486 382 512 386 534 398" />
      </g>

      {mitochondria.map((item, index) => (
        <g key={index} transform={`translate(${item.x} ${item.y}) rotate(${item.r})`}>
          <ellipse rx="58" ry="28" fill="#592c32" stroke="#ff9b83" strokeOpacity="0.72" strokeWidth="3" />
          <path d="M-42 -4 C-25 -22 -10 20 7 -8 C22 -28 34 15 44 -7" fill="none" stroke="#ffb39f" strokeOpacity="0.72" strokeWidth="3" />
          <path d="M-40 9 C-25 -8 -8 25 8 4 C23 -15 34 19 43 5" fill="none" stroke="#ffb39f" strokeOpacity="0.48" strokeWidth="2" />
        </g>
      ))}

      <g onClick={onZoom} className="cursor-zoom-in" role="button" aria-label="Zoom into nucleus">
        <ellipse cx="372" cy="292" rx="132" ry="116" fill="url(#cellNucleus)" stroke="#c8b8ff" strokeOpacity="0.7" strokeWidth="5" />
        <ellipse cx="372" cy="292" rx="121" ry="105" fill="none" stroke="#eee8ff" strokeOpacity="0.23" strokeWidth="2" />
        <g fill="none" stroke="#d8cdfd" strokeOpacity="0.28" strokeWidth="3">
          <path d="M292 272 C328 231 354 288 389 244 C419 207 448 258 453 293" />
          <path d="M294 320 C323 277 352 335 383 292 C415 251 438 322 448 339" />
          <path d="M321 350 C349 322 381 358 405 327" />
        </g>
        <ellipse cx="396" cy="296" rx="34" ry="30" fill="#ae7fc1" fillOpacity="0.66" stroke="#f0c8ff" strokeOpacity="0.48" />
        {Array.from({ length: 18 }, (_, index) => {
          const angle = (index / 18) * Math.PI * 2
          return <circle key={index} cx={372 + Math.cos(angle) * 127} cy={292 + Math.sin(angle) * 111} r="3" fill="#cff9ff" fillOpacity="0.72" />
        })}
      </g>

      <g fontFamily="ui-sans-serif, system-ui" fontSize="15" fontWeight="700">
        <text x="362" y="149" fill="#e7e0ff">Nucleus</text>
        <text x="93" y="88" fill="#93e8ef">Plasma membrane</text>
        <line x1="206" y1="94" x2="153" y2="137" stroke="#93e8ef" strokeOpacity="0.55" />
        <text x="548" y="113" fill="#ffb39f">Mitochondrion</text>
        <line x1="567" y1="122" x2="553" y2="148" stroke="#ffb39f" strokeOpacity="0.55" />
        <text x="525" y="458" fill="#e6c07a">Golgi</text>
        <text x="144" y="478" fill="#79ddcf">Rough ER</text>
      </g>
      <text x="372" y="425" textAnchor="middle" fill="#d7ccff" fontSize="13" fontWeight="800">Tap nucleus to zoom</text>
    </svg>
  )
}

function NucleusView({ onZoom }: { onZoom: () => void }) {
  return (
    <svg viewBox="0 0 760 560" className="h-full min-h-[430px] w-full" role="img" aria-label="Nucleus with chromatin territories and nuclear pores">
      <defs>
        <radialGradient id="nucleusBg" cx="45%" cy="38%" r="66%">
          <stop offset="0%" stopColor="#52476f" />
          <stop offset="58%" stopColor="#2a2d4d" />
          <stop offset="100%" stopColor="#101422" />
        </radialGradient>
      </defs>
      <ellipse cx="380" cy="280" rx="258" ry="218" fill="url(#nucleusBg)" stroke="#c9b8ff" strokeOpacity="0.75" strokeWidth="6" />
      <ellipse cx="380" cy="280" rx="246" ry="206" fill="none" stroke="#f2efff" strokeOpacity="0.25" strokeWidth="2" />
      {Array.from({ length: 28 }, (_, index) => {
        const angle = (index / 28) * Math.PI * 2
        return <g key={index} transform={`translate(${380 + Math.cos(angle) * 252} ${280 + Math.sin(angle) * 212}) rotate(${(angle * 180) / Math.PI})`}><circle r="6" fill="#99eef3" fillOpacity="0.7" /><circle r="2.2" fill="#061019" /></g>
      })}
      <g fill="none" strokeLinecap="round">
        <path d="M210 238 C264 145 335 237 382 174 C430 112 501 188 536 250" stroke="#b4a5ef" strokeOpacity="0.65" strokeWidth="9" />
        <path d="M196 306 C251 229 298 341 359 272 C420 203 469 339 544 288" stroke="#86d7e6" strokeOpacity="0.52" strokeWidth="8" />
        <path d="M236 365 C283 316 331 401 382 343 C426 292 469 381 518 341" stroke="#e89ec9" strokeOpacity="0.46" strokeWidth="7" />
        <path d="M257 202 C300 176 335 204 363 183" stroke="#e7ddff" strokeOpacity="0.23" strokeWidth="3" />
        <path d="M401 392 C430 350 467 398 493 364" stroke="#e7ddff" strokeOpacity="0.2" strokeWidth="3" />
      </g>
      <g onClick={onZoom} className="cursor-zoom-in" role="button" aria-label="Zoom into chromatin">
        <rect x="296" y="212" width="170" height="92" rx="22" fill="#d9ccff" fillOpacity="0.08" stroke="#e3d8ff" strokeOpacity="0.65" strokeDasharray="8 6" />
        <text x="381" y="247" textAnchor="middle" fill="#f0eaff" fontSize="15" fontWeight="800">Chromatin territory</text>
        <text x="381" y="270" textAnchor="middle" fill="#c9bff0" fontSize="12">tap to resolve nucleosomes</text>
      </g>
      <ellipse cx="406" cy="326" rx="50" ry="43" fill="#ad78a9" fillOpacity="0.65" stroke="#f3bfe7" strokeOpacity="0.5" strokeWidth="3" />
      <text x="406" y="331" textAnchor="middle" fill="#ffeafb" fontSize="13" fontWeight="800">Nucleolus</text>
      <text x="165" y="82" fill="#c9f7fa" fontSize="13" fontWeight="800">Nuclear pore complex</text>
      <line x1="269" y1="88" x2="230" y2="124" stroke="#c9f7fa" strokeOpacity="0.5" />
    </svg>
  )
}

function ChromatinView({ onZoom }: { onZoom: () => void }) {
  const nucleosomes = Array.from({ length: 12 }, (_, i) => ({ x: 112 + i * 49, y: 285 + Math.sin(i * 0.88) * 70 }))
  return (
    <svg viewBox="0 0 760 560" className="h-full min-h-[430px] w-full" role="img" aria-label="Chromatin fiber with nucleosomes">
      <defs>
        <linearGradient id="chromatinFiber" x1="0" x2="1">
          <stop offset="0%" stopColor="#8de4ec" /><stop offset="52%" stopColor="#c9b8ff" /><stop offset="100%" stopColor="#f2a8ce" />
        </linearGradient>
      </defs>
      <path d={nucleosomes.map((n, i) => `${i === 0 ? 'M' : 'L'} ${n.x} ${n.y}`).join(' ')} fill="none" stroke="url(#chromatinFiber)" strokeWidth="4" strokeOpacity="0.75" />
      {nucleosomes.map((n, index) => (
        <g key={index} transform={`translate(${n.x} ${n.y})`}>
          <circle r="27" fill="#33294d" stroke="#c7b6ff" strokeWidth="3" />
          <circle r="17" fill="none" stroke="#f5d4e8" strokeOpacity="0.58" strokeWidth="5" strokeDasharray="29 13" />
          <circle r="5" fill="#f7eafa" fillOpacity="0.76" />
        </g>
      ))}
      <g onClick={onZoom} className="cursor-zoom-in" role="button" aria-label="Zoom into DNA double helix">
        <rect x="244" y="400" width="272" height="82" rx="22" fill="#6ee7ef" fillOpacity="0.08" stroke="#8ce8ef" strokeOpacity="0.55" />
        <text x="380" y="433" textAnchor="middle" fill="#d8fbff" fontSize="15" fontWeight="800">DNA wrapped ~1.7 turns around histone core</text>
        <text x="380" y="456" textAnchor="middle" fill="#9ecad2" fontSize="12">tap to resolve the double helix</text>
      </g>
      <text x="380" y="87" textAnchor="middle" fill="#f3efff" fontSize="26" fontWeight="900">Chromatin packaging</text>
      <text x="380" y="116" textAnchor="middle" fill="#9daab8" fontSize="13">DNA → nucleosome → chromatin fiber</text>
      <text x="106" y="207" fill="#d7c9ff" fontSize="12" fontWeight="800">histone octamer</text>
      <line x1="165" y1="213" x2="188" y2="244" stroke="#d7c9ff" strokeOpacity="0.5" />
      <text x="537" y="235" fill="#a6edf3" fontSize="12" fontWeight="800">linker DNA</text>
      <line x1="551" y1="242" x2="536" y2="277" stroke="#a6edf3" strokeOpacity="0.5" />
    </svg>
  )
}

function DNAView({ onZoom }: { onZoom: () => void }) {
  const pairs = Array.from({ length: 18 }, (_, i) => {
    const y = 84 + i * 23
    const phase = i * 0.72
    return { y, x1: 285 + Math.sin(phase) * 72, x2: 475 - Math.sin(phase) * 72, base: i % 4 }
  })
  const bases = [['A', 'T'], ['G', 'C'], ['T', 'A'], ['C', 'G']]

  return (
    <svg viewBox="0 0 760 560" className="h-full min-h-[430px] w-full" role="img" aria-label="DNA double helix with base pairing">
      <path d="M285 72 C420 122 420 172 285 222 C150 272 150 322 285 372 C420 422 420 472 285 515" fill="none" stroke="#72dce8" strokeWidth="10" strokeLinecap="round" />
      <path d="M475 72 C340 122 340 172 475 222 C610 272 610 322 475 372 C340 422 340 472 475 515" fill="none" stroke="#c4a9ff" strokeWidth="10" strokeLinecap="round" />
      {pairs.map((pair, index) => (
        <g key={index} opacity={0.45 + (index % 3) * 0.17}>
          <line x1={pair.x1} y1={pair.y} x2={pair.x2} y2={pair.y} stroke={index % 2 ? '#f2a9cc' : '#f5d079'} strokeWidth="4" />
          <circle cx={pair.x1} cy={pair.y} r="8" fill="#07131d" stroke="#d5fbff" strokeOpacity="0.8" />
          <circle cx={pair.x2} cy={pair.y} r="8" fill="#07131d" stroke="#eee7ff" strokeOpacity="0.8" />
          {index % 4 === 1 && <><text x={(pair.x1 + pair.x2) / 2 - 18} y={pair.y - 8} fill="#f7dc8d" fontSize="10" fontWeight="800">{bases[pair.base][0]}</text><text x={(pair.x1 + pair.x2) / 2 + 10} y={pair.y - 8} fill="#f6b9d6" fontSize="10" fontWeight="800">{bases[pair.base][1]}</text></>}
        </g>
      ))}
      <text x="380" y="43" textAnchor="middle" fill="#f4f7fb" fontSize="25" fontWeight="900">DNA double helix</text>
      <text x="103" y="155" fill="#8ce8ef" fontSize="12" fontWeight="800">5′ sugar-phosphate backbone</text>
      <text x="502" y="155" fill="#cbb8ff" fontSize="12" fontWeight="800">3′ antiparallel strand</text>
      <g onClick={onZoom} className="cursor-zoom-in" role="button" aria-label="Open sequencing evidence">
        <rect x="523" y="434" width="190" height="74" rx="20" fill="#6ee7b7" fillOpacity="0.12" stroke="#6ee7b7" strokeOpacity="0.6" />
        <text x="618" y="463" textAnchor="middle" fill="#b9f8d8" fontSize="13" fontWeight="900">Resolve base evidence</text>
        <text x="618" y="486" textAnchor="middle" fill="#83bca0" fontSize="11">open sequencing track →</text>
      </g>
    </svg>
  )
}

function SequencingView() {
  const reads = useMemo(() => [
    { start: 0, sequence: 'ACGTTGCAAGCTGATCGTACCGATGCTA', alt: false },
    { start: 7, sequence: 'AAGCTGATCGTACCGATGCTAGCTAGGC', alt: false },
    { start: 14, sequence: 'TCGTACCGATGTTAGCTAGGCTAATCGG', alt: true },
    { start: 22, sequence: 'ATGCTAGCTAGGCTAATCGGATCGA', alt: false },
    { start: 12, sequence: 'ATCGTACCGATGTTAGCTAGGCTAAT', alt: true },
  ], [])
  const variantColumn = 25
  const referenceBase = SYNTHETIC_REFERENCE[variantColumn]
  const alternateBase = SYNTHETIC_ALT[variantColumn]
  const altReads = reads.filter((read) => read.alt).length
  const vaf = altReads / reads.length

  return (
    <div className="w-full max-w-5xl px-2 py-4 md:px-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_250px]">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/25 p-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div><div className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">Synthetic sequencing evidence</div><div className="mt-1 text-sm font-black text-white">Reference + aligned reads</div></div>
            <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2 py-1 text-[9px] font-black uppercase text-amber-200">demo only</span>
          </div>
          <div className="mt-5 overflow-x-auto pb-2 font-mono text-[11px] leading-6">
            <div className="min-w-[690px]">
              <div className="grid grid-cols-[70px_1fr] gap-2"><span className="text-white/35">REF</span><span className="tracking-[0.28em] text-white/85">{SYNTHETIC_REFERENCE}</span></div>
              <div className="grid grid-cols-[70px_1fr] gap-2"><span className="text-white/35">ALT</span><span className="tracking-[0.28em] text-amber-200">{SYNTHETIC_ALT}</span></div>
              <div className="my-2 h-px bg-white/10" />
              {reads.map((read, index) => (
                <div key={`${read.start}-${index}`} className="grid grid-cols-[70px_1fr] gap-2">
                  <span className="text-white/30">read {index + 1}</span>
                  <span style={{ paddingLeft: `${read.start * 7.1}px` }} className={read.alt ? 'text-amber-200' : 'text-cyan-100/75'}>{read.sequence}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-3 text-[10px] leading-relaxed text-white/55">The apparent base change is deliberately synthetic. A production patient layer must preserve specimen ID, reference build, aligner/caller version, depth, quality filters and source VCF/BAM/CRAM provenance.</div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
            <div className="text-[10px] font-black uppercase tracking-wide text-amber-200">Synthetic variant</div>
            <div className="mt-2 font-mono text-xl font-black text-white">{referenceBase || 'C'} → {alternateBase || 'T'}</div>
            <div className="mt-2 text-[11px] text-white/60">Demo locus · no clinical interpretation</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div className="text-[10px] font-black uppercase tracking-wide text-white/45">Read evidence</div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-center">
              <div><div className="text-xl font-black">{reads.length}</div><div className="text-[9px] text-white/40">displayed reads</div></div>
              <div><div className="text-xl font-black text-amber-200">{Math.round(vaf * 100)}%</div><div className="text-[9px] text-white/40">demo VAF</div></div>
            </div>
          </div>
          <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/5 p-4 text-[10px] leading-relaxed text-cyan-50/70">
            <strong className="text-cyan-100">Coverage:</strong> C = (N × L) / G<br />
            <strong className="text-cyan-100">VAF:</strong> alternate reads / total reads
          </div>
        </div>
      </div>
    </div>
  )
}

export function CellGenomeExplorer({ initialStage = 'cell' }: { initialStage?: MicroStage }) {
  const [stage, setStage] = useState<MicroStage>(initialStage)
  const activeIndex = stageIndex(stage)
  const active = STAGES[activeIndex]

  function zoomNext() {
    const next = STAGES[Math.min(activeIndex + 1, STAGES.length - 1)]
    setStage(next.key)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#050b13] text-white">
      <div className="border-b border-white/10 bg-white/[0.025] p-3 md:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Cell → genome explorer</div>
            <div className="mt-1 text-sm font-black">{active.label} <span className="font-medium text-white/40">· {active.scale}</span></div>
            <p className="mt-1 max-w-2xl text-[10px] leading-relaxed text-white/50">{active.detail}</p>
          </div>
          <div className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-wide text-sky-200">educational anatomy</div>
        </div>
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {STAGES.map((item, index) => (
            <button key={item.key} type="button" onClick={() => setStage(item.key)} className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-black transition ${stage === item.key ? 'border-cyan-300/60 bg-cyan-300/15 text-cyan-100' : index < activeIndex ? 'border-emerald-300/20 bg-emerald-300/5 text-emerald-200/75' : 'border-white/10 bg-white/[0.025] text-white/45 hover:text-white/75'}`}>
              {index + 1}. {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex min-h-[520px] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_40%,rgba(29,78,96,.22),transparent_55%)]">
        <div className="pointer-events-none absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,.14) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative z-10 w-full">
          {stage === 'cell' ? <CellView onZoom={zoomNext} /> : stage === 'nucleus' ? <NucleusView onZoom={zoomNext} /> : stage === 'chromatin' ? <ChromatinView onZoom={zoomNext} /> : stage === 'dna' ? <DNAView onZoom={zoomNext} /> : <SequencingView />}
        </div>
      </div>

      <div className="grid gap-2 border-t border-white/10 bg-black/20 p-3 text-[9px] leading-relaxed text-white/45 md:grid-cols-3">
        <div><strong className="text-sky-200">Biological structure</strong><br />Cell, nucleus, chromatin and DNA are reference educational representations.</div>
        <div><strong className="text-amber-200">Sequencing evidence</strong><br />Read alignment and variant calls are a separate evidence layer; shown here only with synthetic data.</div>
        <div><strong className="text-emerald-200">Clinical inference</strong><br />No diagnosis or therapy is inferred from this visualization without validated patient data and a versioned clinical model.</div>
      </div>
    </div>
  )
}
