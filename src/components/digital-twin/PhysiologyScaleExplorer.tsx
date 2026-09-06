import { useMemo, useState } from 'react'
import { physiologySnapshot, type PhysiologyInputs } from '../../lib/microphysiology'

export type PhysiologyScale = 'tissue' | 'cell' | 'gene'

type Props = {
  initialScale?: PhysiologyScale
}

const SCALE_META: Record<PhysiologyScale, { label: string; scale: string; detail: string }> = {
  tissue: {
    label: 'Tissue gas exchange',
    scale: 'alveolus ↔ capillary',
    detail: 'Barrier layers, red-cell transit, oxygen loading and carbon-dioxide elimination are shown as directional transport—not as whole-organ pulsing.',
  },
  cell: {
    label: 'Cellular physiology',
    scale: 'membrane ↔ mitochondrion',
    detail: 'Ion gradients, Na⁺/K⁺-ATPase, mitochondrial proton motive force and ATP synthesis are separated into physiologic processes.',
  },
  gene: {
    label: 'DNA → RNA → protein',
    scale: 'gene expression',
    detail: 'Chromatin access, transcription, RNA processing and translation are visualized as an educational molecular process with source provenance kept separate.',
  },
}

const DEFAULT_INPUTS: PhysiologyInputs = {
  hb: 15,
  saO2: 98,
  paO2: 95,
  svO2: 75,
  pvO2: 40,
  cardiacOutput: 5,
  potassiumOutside: 4,
  potassiumInside: 140,
  temperatureC: 37,
  bicarbonate: 24,
  paCO2: 40,
}

function FlowDot({ x, fromY, toY, color, motion }: { x: number; fromY: number; toY: number; color: string; motion: boolean }) {
  return (
    <circle cx={x} cy={fromY} r="5" fill={color} opacity="0.92">
      {motion && <animate attributeName="cy" values={`${fromY};${toY};${toY}`} dur="2.4s" repeatCount="indefinite" />}
    </circle>
  )
}

function TissueVisual({ motion }: { motion: boolean }) {
  return (
    <svg viewBox="0 0 760 460" role="img" aria-label="Alveolar-capillary gas exchange cross-section" className="h-full w-full">
      <defs>
        <linearGradient id="air" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#183143" />
          <stop offset="1" stopColor="#0b1c29" />
        </linearGradient>
        <linearGradient id="blood" x1="0" x2="1">
          <stop offset="0" stopColor="#3c1720" />
          <stop offset="1" stopColor="#5a2027" />
        </linearGradient>
        <marker id="arrow-o2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#62d9ff" /></marker>
        <marker id="arrow-co2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#f3c270" /></marker>
      </defs>

      <rect x="28" y="28" width="704" height="170" rx="70" fill="url(#air)" stroke="#6ed3f0" strokeOpacity="0.25" />
      <text x="54" y="62" fill="#d7f7ff" fontSize="18" fontWeight="800">Alveolar airspace</text>
      <text x="54" y="86" fill="#8bb7c5" fontSize="12">O₂-rich inspired gas · CO₂ exits toward ventilation</text>

      <path d="M48 203 C150 181 262 192 370 200 C495 210 595 188 714 204" fill="none" stroke="#87c7c0" strokeWidth="8" />
      <path d="M48 218 C150 198 262 209 370 217 C495 227 595 205 714 220" fill="none" stroke="#a8bdaf" strokeWidth="5" />
      <path d="M48 230 C150 213 262 224 370 232 C495 242 595 220 714 235" fill="none" stroke="#5d8393" strokeWidth="7" />
      <text x="55" y="258" fill="#c7d7d9" fontSize="12">Type I pneumocyte → basement-membrane/interstitial layer → capillary endothelium</text>

      <rect x="28" y="272" width="704" height="150" rx="58" fill="url(#blood)" stroke="#e47272" strokeOpacity="0.26" />
      <text x="54" y="310" fill="#ffd9d9" fontSize="18" fontWeight="800">Pulmonary capillary</text>
      <text x="54" y="333" fill="#c9989d" fontSize="12">RBC transit · hemoglobin binding · dissolved gas fraction</text>

      {[150, 280, 420, 560, 665].map((x, index) => (
        <g key={x} transform={`translate(${x} ${365 + (index % 2) * 5}) rotate(${index % 2 ? -10 : 8})`}>
          <ellipse rx="43" ry="18" fill="#b63f45" stroke="#f38d8f" strokeOpacity="0.45" />
          <ellipse rx="18" ry="7" fill="#74292e" opacity="0.75" />
        </g>
      ))}

      <path d="M322 132 L322 326" stroke="#62d9ff" strokeWidth="3" strokeDasharray="7 9" markerEnd="url(#arrow-o2)" />
      <path d="M438 330 L438 132" stroke="#f3c270" strokeWidth="3" strokeDasharray="7 9" markerEnd="url(#arrow-co2)" />
      <text x="290" y="125" fill="#62d9ff" fontSize="15" fontWeight="800">O₂</text>
      <text x="450" y="126" fill="#f3c270" fontSize="15" fontWeight="800">CO₂</text>
      <FlowDot x={322} fromY={145} toY={318} color="#62d9ff" motion={motion} />
      <FlowDot x={438} fromY={318} toY={145} color="#f3c270" motion={motion} />
    </svg>
  )
}

function CellVisual({ motion }: { motion: boolean }) {
  return (
    <svg viewBox="0 0 760 460" role="img" aria-label="Cell membrane and mitochondrial physiology" className="h-full w-full">
      <defs>
        <linearGradient id="cytosol" x1="0" x2="1"><stop offset="0" stopColor="#111d29" /><stop offset="1" stopColor="#151824" /></linearGradient>
        <linearGradient id="mito" x1="0" x2="1"><stop offset="0" stopColor="#71352e" /><stop offset="1" stopColor="#a35b41" /></linearGradient>
        <marker id="arrow-ion" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="#8ad8ff" /></marker>
      </defs>
      <rect x="25" y="25" width="710" height="410" rx="34" fill="url(#cytosol)" stroke="#ffffff" strokeOpacity="0.08" />
      <text x="48" y="58" fill="#e8f5ff" fontSize="17" fontWeight="800">Excitable-cell membrane + mitochondrial energy coupling</text>

      <rect x="65" y="92" width="630" height="12" rx="6" fill="#5c8291" opacity="0.75" />
      <rect x="65" y="116" width="630" height="12" rx="6" fill="#5c8291" opacity="0.75" />
      <text x="68" y="82" fill="#9dbfca" fontSize="11">Extracellular</text>
      <text x="68" y="150" fill="#9dbfca" fontSize="11">Cytosol</text>

      <g transform="translate(180 83)">
        <rect x="0" y="0" width="58" height="58" rx="16" fill="#244f64" stroke="#78d9ff" strokeOpacity="0.55" />
        <text x="29" y="25" textAnchor="middle" fill="#d9f5ff" fontSize="9" fontWeight="800">K⁺</text>
        <text x="29" y="38" textAnchor="middle" fill="#9acfe0" fontSize="8">channel</text>
      </g>
      <g transform="translate(320 79)">
        <rect x="0" y="0" width="82" height="66" rx="20" fill="#423a69" stroke="#c3a9ff" strokeOpacity="0.58" />
        <text x="41" y="25" textAnchor="middle" fill="#f0e8ff" fontSize="9" fontWeight="800">Na⁺/K⁺</text>
        <text x="41" y="38" textAnchor="middle" fill="#c7b8ee" fontSize="8">ATPase</text>
        <text x="41" y="53" textAnchor="middle" fill="#f3cf79" fontSize="8">1 ATP</text>
      </g>
      <path d="M340 66 C330 43 300 43 285 62" fill="none" stroke="#74d7ff" strokeWidth="2" markerEnd="url(#arrow-ion)" />
      <path d="M385 158 C410 181 444 170 453 145" fill="none" stroke="#b58cff" strokeWidth="2" markerEnd="url(#arrow-ion)" />
      <text x="263" y="49" fill="#74d7ff" fontSize="10" fontWeight="800">3 Na⁺ out</text>
      <text x="416" y="183" fill="#c5a8ff" fontSize="10" fontWeight="800">2 K⁺ in</text>

      <g transform="translate(418 230)">
        <ellipse cx="115" cy="76" rx="125" ry="66" fill="url(#mito)" stroke="#f1a47e" strokeOpacity="0.46" />
        <path d="M18 80 C45 34 70 118 96 69 C121 21 145 123 172 69 C195 27 220 112 245 62" fill="none" stroke="#ffc194" strokeWidth="8" strokeLinecap="round" opacity="0.78" />
        <text x="115" y="18" textAnchor="middle" fill="#ffd7c6" fontSize="13" fontWeight="800">Mitochondrion</text>
        <text x="115" y="145" textAnchor="middle" fill="#d7a895" fontSize="10">ETC → H⁺ gradient → ATP synthase</text>
        {[45, 75, 105, 135, 165, 195].map((x, index) => (
          <circle key={x} cx={x} cy="55" r="4" fill="#f7d36f">
            {motion && <animate attributeName="cy" values="42;83;42" dur={`${2 + index * 0.15}s`} repeatCount="indefinite" />}
          </circle>
        ))}
      </g>

      <g transform="translate(86 225)">
        <rect x="0" y="0" width="240" height="145" rx="24" fill="#0b2028" stroke="#66cdd5" strokeOpacity="0.25" />
        <text x="18" y="28" fill="#baf7f7" fontSize="12" fontWeight="800">Membrane potential</text>
        <text x="18" y="50" fill="#7fa6ad" fontSize="10">Concentration gradient + selective permeability</text>
        <line x1="25" x2="215" y1="95" y2="95" stroke="#5b7d82" strokeWidth="2" />
        <path d="M28 95 C50 95 62 93 80 92 C96 89 102 52 119 54 C137 56 139 121 157 121 C178 121 184 96 214 95" fill="none" stroke="#75ddff" strokeWidth="3" />
        <text x="18" y="130" fill="#85c6d4" fontSize="9">Representative action-potential shape; not a measured ECG or intracellular trace.</text>
      </g>
    </svg>
  )
}

function GeneVisual({ motion }: { motion: boolean }) {
  const pairs = [
    ['A', 'T'], ['G', 'C'], ['C', 'G'], ['T', 'A'], ['A', 'T'], ['C', 'G'], ['G', 'C'], ['A', 'T'],
    ['T', 'A'], ['G', 'C'], ['C', 'G'], ['A', 'T'], ['G', 'C'], ['T', 'A'], ['A', 'T'], ['C', 'G'],
  ]
  return (
    <svg viewBox="0 0 760 460" role="img" aria-label="DNA transcription and translation physiology" className="h-full w-full">
      <defs>
        <marker id="arrow-gene" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#9bd7ff" /></marker>
      </defs>
      <rect x="25" y="25" width="710" height="410" rx="34" fill="#07101a" stroke="#ffffff" strokeOpacity="0.08" />
      <text x="48" y="58" fill="#edf7ff" fontSize="17" fontWeight="800">Regulated gene expression</text>
      <text x="48" y="80" fill="#8298aa" fontSize="11">DNA accessibility → transcription → RNA processing → translation → protein</text>

      <g transform="translate(70 115)">
        <path d="M0 20 C45 -12 90 52 135 20 C180 -12 225 52 270 20 C315 -12 360 52 405 20" fill="none" stroke="#7f9cff" strokeWidth="5" />
        <path d="M0 72 C45 104 90 40 135 72 C180 104 225 40 270 72 C315 104 360 40 405 72" fill="none" stroke="#c093e9" strokeWidth="5" />
        {pairs.map(([a, b], index) => {
          const x = 15 + index * 24
          const y1 = 23 + Math.sin(index * 0.9) * 18
          const y2 = 69 - Math.sin(index * 0.9) * 18
          return <g key={`${a}${b}${index}`}><line x1={x} x2={x} y1={y1} y2={y2} stroke="#9bc4cf" strokeOpacity="0.6" /><text x={x - 8} y={(y1 + y2) / 2 + 4} fill="#d9eaf0" fontSize="7">{a}{b}</text></g>
        })}
        <rect x="72" y="-16" width="68" height="112" rx="16" fill="#5a8758" opacity="0.18" stroke="#86d77d" strokeOpacity="0.7" />
        <text x="106" y="-24" textAnchor="middle" fill="#9bea92" fontSize="9" fontWeight="800">promoter</text>
        <ellipse cx="175" cy="45" rx="40" ry="27" fill="#31576c" stroke="#7fd9ff" strokeOpacity="0.65">
          {motion && <animate attributeName="cx" values="150;350;150" dur="7s" repeatCount="indefinite" />}
        </ellipse>
        <text x="175" y="49" textAnchor="middle" fill="#ddf6ff" fontSize="9" fontWeight="800">RNA Pol II</text>
      </g>

      <path d="M500 160 C560 160 582 188 610 213" fill="none" stroke="#9bd7ff" strokeWidth="2.5" markerEnd="url(#arrow-gene)" />
      <text x="514" y="145" fill="#a8c9db" fontSize="9">transcription</text>

      <g transform="translate(430 218)">
        <path d="M0 0 C34 24 64 -24 96 0 C128 24 158 -24 192 0" fill="none" stroke="#74d9bd" strokeWidth="4" />
        <text x="96" y="31" textAnchor="middle" fill="#9ce9d5" fontSize="10" fontWeight="800">pre-mRNA → spliced mRNA</text>
      </g>

      <path d="M525 275 L525 318" fill="none" stroke="#9bd7ff" strokeWidth="2.5" markerEnd="url(#arrow-gene)" />
      <g transform="translate(415 328)">
        <ellipse cx="110" cy="34" rx="72" ry="31" fill="#704f76" stroke="#d2a4dc" strokeOpacity="0.62" />
        <path d="M0 34 L215 34" stroke="#7de0bf" strokeWidth="4" />
        <text x="110" y="38" textAnchor="middle" fill="#f3ddf5" fontSize="10" fontWeight="800">ribosome</text>
        {[235, 254, 273, 292, 311].map((x, index) => (
          <circle key={x} cx={x} cy={34 + Math.sin(index) * 12} r="9" fill="#e7b76f" stroke="#ffe4ad" strokeOpacity="0.45" />
        ))}
        <text x="275" y="72" textAnchor="middle" fill="#e8c98c" fontSize="10">nascent protein</text>
      </g>

      <g transform="translate(60 290)">
        <rect width="292" height="116" rx="20" fill="#11182a" stroke="#9f8ce3" strokeOpacity="0.24" />
        <text x="18" y="27" fill="#d9d2ff" fontSize="11" fontWeight="800">What is source-backed?</text>
        <text x="18" y="49" fill="#8c94ad" fontSize="9">Reference gene coordinates, transcript IDs, variants and expression</text>
        <text x="18" y="65" fill="#8c94ad" fontSize="9">must come from Ensembl/HPA or an explicitly loaded patient file.</text>
        <text x="18" y="88" fill="#f0c785" fontSize="9" fontWeight="800">No patient sequence loaded → no patient variant claims.</text>
      </g>
    </svg>
  )
}

function NumberField({
  label,
  value,
  unit,
  onChange,
  step = 1,
}: {
  label: string
  value: number
  unit: string
  onChange: (value: number) => void
  step?: number
}) {
  return (
    <label className="rounded-xl border border-white/8 bg-white/[.025] p-2.5">
      <span className="block text-[8px] font-black uppercase tracking-[.12em] text-white/35">{label}</span>
      <span className="mt-1 flex items-center gap-2">
        <input
          aria-label={label}
          type="number"
          inputMode="decimal"
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="min-w-0 flex-1 bg-transparent text-sm font-black text-white outline-none"
        />
        <span className="text-[8px] font-bold text-white/30">{unit}</span>
      </span>
    </label>
  )
}

export function PhysiologyScaleExplorer({ initialScale = 'tissue' }: Props) {
  const [scale, setScale] = useState<PhysiologyScale>(initialScale)
  const [inputs, setInputs] = useState<PhysiologyInputs>(DEFAULT_INPUTS)
  const [motion, setMotion] = useState(() => typeof window === 'undefined' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const result = useMemo(() => physiologySnapshot(inputs), [inputs])
  const meta = SCALE_META[scale]

  function setInput<K extends keyof PhysiologyInputs>(key: K, value: number) {
    setInputs((previous) => ({ ...previous, [key]: Number.isFinite(value) ? value : 0 }))
  }

  return (
    <section className="overflow-hidden rounded-[30px] border border-cyan-300/15 bg-[#02060b] text-white shadow-[0_28px_90px_rgba(0,0,0,.30)]">
      <header className="border-b border-white/8 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <div className="text-[9px] font-black uppercase tracking-[.2em] text-cyan-300">Reference physiology · tissue → cell → DNA</div>
            <h3 className="mt-2 text-xl font-black tracking-[-.035em] sm:text-3xl">Physiology across biological scales</h3>
            <p className="mt-2 max-w-3xl text-[10px] leading-relaxed text-white/48 sm:text-[11px]">Mechanisms are animated as directional transport and molecular processes. Geometry is an educational medical model, not patient microscopy, histology, sequencing or a diagnostic measurement.</p>
          </div>
          <button type="button" onClick={() => setMotion((value) => !value)} className="rounded-full border border-white/10 bg-white/[.035] px-3 py-2 text-[9px] font-black text-white/60 hover:border-white/20">
            {motion ? 'Pause physiology motion' : 'Resume physiology motion'}
          </button>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {(Object.keys(SCALE_META) as PhysiologyScale[]).map((item) => (
            <button key={item} type="button" onClick={() => setScale(item)} className={`shrink-0 rounded-full border px-3.5 py-2 text-[9px] font-black transition ${scale === item ? 'border-cyan-300 bg-cyan-300 text-[#041016]' : 'border-white/10 bg-white/[.035] text-white/50 hover:border-white/20'}`}>
              {SCALE_META[item].label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_370px]">
        <div className="min-w-0 border-b border-white/8 p-3 sm:p-4 xl:border-b-0 xl:border-r">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[8px] font-black uppercase tracking-[.14em] text-white/30">{meta.scale}</div>
              <div className="mt-1 text-sm font-black text-white/86">{meta.label}</div>
            </div>
            <span className="rounded-full border border-amber-200/15 bg-amber-200/[.05] px-2.5 py-1.5 text-[8px] font-black text-amber-100">REFERENCE MODEL · NOT PATIENT-DERIVED</span>
          </div>
          <div className="h-[430px] overflow-hidden rounded-[24px] border border-white/8 bg-[#040a10]">
            {scale === 'tissue' ? <TissueVisual motion={motion} /> : scale === 'cell' ? <CellVisual motion={motion} /> : <GeneVisual motion={motion} />}
          </div>
          <p className="mt-3 text-[9px] leading-relaxed text-white/34">{meta.detail}</p>
        </div>

        <aside className="space-y-4 p-4 sm:p-5">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-300">Live reference calculations</div>
            <p className="mt-1 text-[9px] leading-relaxed text-white/35">Editable reference inputs let the physiology layer respond numerically without pretending the values came from a patient.</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Hb" value={inputs.hb} unit="g/dL" step={0.1} onChange={(v) => setInput('hb', v)} />
            <NumberField label="SaO₂" value={inputs.saO2} unit="%" step={1} onChange={(v) => setInput('saO2', v)} />
            <NumberField label="PaO₂" value={inputs.paO2} unit="mmHg" step={1} onChange={(v) => setInput('paO2', v)} />
            <NumberField label="SvO₂" value={inputs.svO2} unit="%" step={1} onChange={(v) => setInput('svO2', v)} />
            <NumberField label="Cardiac output" value={inputs.cardiacOutput} unit="L/min" step={0.1} onChange={(v) => setInput('cardiacOutput', v)} />
            <NumberField label="PvO₂" value={inputs.pvO2} unit="mmHg" step={1} onChange={(v) => setInput('pvO2', v)} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-cyan-300/10 bg-cyan-300/[.035] p-3"><div className="text-[8px] font-black uppercase text-cyan-200/55">CaO₂</div><div className="mt-1 text-lg font-black">{result.caO2.toFixed(1)} <span className="text-[8px] text-white/35">mL/dL</span></div></div>
            <div className="rounded-xl border border-cyan-300/10 bg-cyan-300/[.035] p-3"><div className="text-[8px] font-black uppercase text-cyan-200/55">CvO₂</div><div className="mt-1 text-lg font-black">{result.cvO2.toFixed(1)} <span className="text-[8px] text-white/35">mL/dL</span></div></div>
            <div className="rounded-xl border border-emerald-300/10 bg-emerald-300/[.035] p-3"><div className="text-[8px] font-black uppercase text-emerald-200/55">Fick VO₂</div><div className="mt-1 text-lg font-black">{result.vo2.toFixed(0)} <span className="text-[8px] text-white/35">mL/min</span></div></div>
            <div className="rounded-xl border border-violet-300/10 bg-violet-300/[.035] p-3"><div className="text-[8px] font-black uppercase text-violet-200/55">O₂ extraction</div><div className="mt-1 text-lg font-black">{result.extraction.toFixed(1)} <span className="text-[8px] text-white/35">mL/dL</span></div></div>
          </div>

          <details className="rounded-2xl border border-white/8 bg-white/[.025] p-3" open={scale === 'cell'}>
            <summary className="cursor-pointer list-none text-[9px] font-black uppercase tracking-[.13em] text-white/65">Cellular electrochemistry</summary>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <NumberField label="K⁺ outside" value={inputs.potassiumOutside} unit="mmol/L" step={0.1} onChange={(v) => setInput('potassiumOutside', v)} />
              <NumberField label="K⁺ inside" value={inputs.potassiumInside} unit="mmol/L" step={1} onChange={(v) => setInput('potassiumInside', v)} />
            </div>
            <div className="mt-2 rounded-xl border border-violet-300/10 bg-violet-300/[.035] p-3 text-sm font-black">E<sub>K</sub> ≈ {result.kNernst.toFixed(1)} mV</div>
          </details>

          <details className="rounded-2xl border border-white/8 bg-white/[.025] p-3">
            <summary className="cursor-pointer list-none text-[9px] font-black uppercase tracking-[.13em] text-white/65">Acid-base reference</summary>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <NumberField label="HCO₃⁻" value={inputs.bicarbonate} unit="mmol/L" step={0.1} onChange={(v) => setInput('bicarbonate', v)} />
              <NumberField label="PaCO₂" value={inputs.paCO2} unit="mmHg" step={0.1} onChange={(v) => setInput('paCO2', v)} />
            </div>
            <div className="mt-2 rounded-xl border border-amber-300/10 bg-amber-300/[.035] p-3 text-sm font-black">pH ≈ {result.pH.toFixed(2)}</div>
          </details>

          <div className="space-y-2 rounded-2xl border border-white/8 bg-black/20 p-3 text-[9px] leading-relaxed text-white/45">
            <div><span className="font-black text-white/70">O₂ content:</span> C<sub>O₂</sub> = 1.34 × Hb × S<sub>O₂</sub> + 0.003 × P<sub>O₂</sub></div>
            <div><span className="font-black text-white/70">Fick:</span> V̇O₂ = Q × (CaO₂ − CvO₂)</div>
            <div><span className="font-black text-white/70">Diffusion:</span> V̇gas ∝ (A/T) × D × ΔP</div>
            <div><span className="font-black text-white/70">Nernst:</span> E = (RT/zF) ln([ion]out/[ion]in)</div>
            <div><span className="font-black text-white/70">Henderson–Hasselbalch:</span> pH = 6.1 + log₁₀(HCO₃⁻/(0.03 × PaCO₂))</div>
          </div>

          <div className="rounded-2xl border border-emerald-300/12 bg-emerald-300/[.035] p-3 text-[9px] leading-relaxed text-white/42">
            <div className="font-black uppercase tracking-[.13em] text-emerald-200">Scientific basis</div>
            <p className="mt-2">Guyton & Hall; Boron & Boulpaep; West's Respiratory Physiology; Alberts, Molecular Biology of the Cell. Formula outputs are reference calculations, not diagnostic interpretation.</p>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default PhysiologyScaleExplorer
