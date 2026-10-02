import { lazy, Suspense, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const CardioAtlas3D = lazy(() => import('../../components/CardioAtlas3D'))
const CardiacCycle3D = lazy(() => import('../../components/CardiacCycle3D'))

type CardiacView = 'anatomy' | 'cycle' | 'electrical'

const VIEW_META: Record<CardiacView, { label: string; eyebrow: string; description: string }> = {
  anatomy: {
    label: 'Anatomy',
    eyebrow: 'Source-backed cardiovascular atlas',
    description: 'Inspect the heart, valves and connected vessels in the same cardiovascular source geometry used elsewhere in Body Exposure.',
  },
  cycle: {
    label: 'Cardiac cycle',
    eyebrow: 'Structure + flow + phase',
    description: 'Watch filling and ejection against an adjustable teaching heart rate while preserving the source geometry.',
  },
  electrical: {
    label: 'Electrical',
    eyebrow: 'Conduction + ECG context',
    description: 'Relate the conduction sequence to a synchronized synthetic ECG teaching strip, then open the full electrophysiology simulator.',
  },
}

const CONDUCTION = [
  ['SA node', 'Atrial activation'],
  ['AV node', 'Physiologic delay'],
  ['His bundle', 'Ventricular entry'],
  ['Bundle branches', 'Septal conduction'],
  ['Purkinje network', 'Ventricular activation'],
] as const

function ecgPath(hr: number) {
  const beats = Math.max(2, Math.min(5, Math.round(hr / 28)))
  const width = 720
  const baseline = 74
  const beatW = width / beats
  const points: Array<[number, number]> = [[0, baseline]]

  for (let i = 0; i < beats; i++) {
    const x = i * beatW
    points.push(
      [x + beatW * 0.08, baseline],
      [x + beatW * 0.14, baseline - 8],
      [x + beatW * 0.20, baseline],
      [x + beatW * 0.36, baseline],
      [x + beatW * 0.40, baseline + 8],
      [x + beatW * 0.43, baseline - 52],
      [x + beatW * 0.47, baseline + 22],
      [x + beatW * 0.52, baseline],
      [x + beatW * 0.68, baseline],
      [x + beatW * 0.78, baseline - 16],
      [x + beatW * 0.90, baseline],
      [x + beatW, baseline],
    )
  }

  return points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
}

function Loader({ label }: { label: string }) {
  return <div className="grid min-h-[360px] place-items-center text-[10px] font-bold text-white/35">Loading {label}…</div>
}

export default function CardiacInteractiveSurface() {
  const [view, setView] = useState<CardiacView>('cycle')
  const [hr, setHr] = useState(72)
  const meta = VIEW_META[view]
  const period = 60 / hr
  const ecg = useMemo(() => ecgPath(hr), [hr])

  return (
    <section
      data-cardiac-interactive-surface="v1"
      className="dark overflow-hidden rounded-[28px] border border-white/[.09] bg-[#03070b] text-white"
      aria-labelledby="cardiac-interactive-title"
    >
      <header className="border-b border-white/[.08] px-3 py-3 sm:px-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="text-[9px] font-black uppercase tracking-[.20em] text-rose-200/65">Body Exposure · interactive heart</div>
            <h4 id="cardiac-interactive-title" className="mt-1 text-base font-black tracking-[-.02em] sm:text-lg">
              Anatomy, function and rhythm in one cardiac surface
            </h4>
            <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-white/40">
              One heart model, multiple projections. No disconnected demo pages.
            </p>
          </div>

          <div className="flex min-w-0 gap-1.5 overflow-x-auto" role="tablist" aria-label="Interactive cardiac views">
            {(Object.keys(VIEW_META) as CardiacView[]).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={view === key}
                onClick={() => setView(key)}
                className={`min-h-10 shrink-0 rounded-full border px-3 text-[9px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/55 ${
                  view === key
                    ? 'border-rose-200/35 bg-rose-200/[.12] text-white'
                    : 'border-white/[.07] text-white/45 hover:bg-white/[.04] hover:text-white/80'
                }`}
              >
                {VIEW_META[key].label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_250px]">
        <div className="relative min-w-0 border-b border-white/[.08] xl:border-b-0 xl:border-r">
          <div className="absolute left-3 top-3 z-[2] rounded-2xl border border-white/[.08] bg-black/55 px-3 py-2 backdrop-blur-xl">
            <div className="text-[8px] font-black uppercase tracking-[.14em] text-white/30">{meta.eyebrow}</div>
            <div className="mt-1 max-w-[260px] text-[9px] leading-relaxed text-white/55">{meta.description}</div>
          </div>

          <div className="min-h-[420px] p-2 pt-[92px] sm:p-3 sm:pt-[88px]">
            <Suspense fallback={<Loader label="cardiac render" />}>
              {view === 'anatomy' ? (
                <CardioAtlas3D hr={hr} />
              ) : (
                <CardiacCycle3D hr={hr} tinggi={400} />
              )}
            </Suspense>
          </div>

          <div className="border-t border-white/[.07] bg-black/25 p-3">
            <div className="flex items-center justify-between gap-3 text-[8px]">
              <span className="font-black uppercase tracking-[.14em] text-white/30">Synthetic ECG teaching strip</span>
              <span className="font-mono text-rose-100/70">{hr} bpm · T = {period.toFixed(2)} s</span>
            </div>
            <svg viewBox="0 0 720 120" role="img" aria-label={`Synthetic ECG teaching strip at ${hr} beats per minute`} className="mt-2 h-24 w-full overflow-visible rounded-xl border border-white/[.06] bg-black/45">
              {Array.from({ length: 12 }).map((_, index) => (
                <line key={`v-${index}`} x1={index * 60} y1="0" x2={index * 60} y2="120" stroke="rgba(255,255,255,.035)" />
              ))}
              {Array.from({ length: 5 }).map((_, index) => (
                <line key={`h-${index}`} x1="0" y1={index * 30} x2="720" y2={index * 30} stroke="rgba(255,255,255,.035)" />
              ))}
              <path d={ecg} fill="none" stroke="rgba(251,113,133,.95)" strokeWidth="2.25" vectorEffect="non-scaling-stroke" />
            </svg>
            <p className="mt-1.5 text-[8px] leading-relaxed text-white/28">
              ECG trace is a schematic teaching signal synchronized to the selected rate; it is not generated from patient electrodes and is not diagnostic.
            </p>
          </div>
        </div>

        <aside className="space-y-3 p-3 sm:p-4">
          <div>
            <label htmlFor="cardiac-surface-hr" className="text-[8px] font-black uppercase tracking-[.14em] text-white/30">Teaching heart rate</label>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-black tracking-[-.04em] text-white">{hr}</span>
              <span className="text-[9px] font-bold text-white/35">beats/min</span>
            </div>
            <input
              id="cardiac-surface-hr"
              type="range"
              min="40"
              max="160"
              step="1"
              value={hr}
              onChange={(event) => setHr(Number(event.target.value))}
              className="mt-2 w-full accent-rose-300"
            />
            <div className="mt-1 flex justify-between text-[7px] text-white/25"><span>40</span><span>160</span></div>
          </div>

          {view === 'electrical' && (
            <div className="rounded-2xl border border-amber-300/12 bg-amber-300/[.035] p-3">
              <div className="text-[8px] font-black uppercase tracking-[.14em] text-amber-100/55">Conduction sequence</div>
              <ol className="mt-2 space-y-2">
                {CONDUCTION.map(([name, role], index) => (
                  <li key={name} className="flex gap-2">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-amber-200/15 bg-amber-200/[.05] text-[7px] font-black text-amber-100/65">{index + 1}</span>
                    <div>
                      <div className="text-[9px] font-black text-white/70">{name}</div>
                      <div className="text-[8px] text-white/30">{role}</div>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-2 text-[7px] leading-relaxed text-amber-50/35">Sequence is schematic; the dedicated electrophysiology lab contains the tissue-level simulation.</p>
            </div>
          )}

          <div className="rounded-2xl border border-white/[.07] bg-white/[.02] p-3">
            <div className="text-[8px] font-black uppercase tracking-[.14em] text-white/30">Same heart, deeper model</div>
            <p className="mt-1.5 text-[9px] leading-relaxed text-white/40">
              Continue from visual cardiac behavior into re-entry, conduction velocity, refractory period, pseudo-ECG, drug effects and ablation topology.
            </p>
            <Link
              to="/electrophysiology"
              className="mt-3 inline-flex min-h-9 items-center rounded-full border border-cyan-300/18 bg-cyan-300/[.055] px-3 text-[8px] font-black text-cyan-100/70 transition hover:bg-cyan-300/[.1]"
            >
              Open electrophysiology lab
            </Link>
          </div>

          <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/[.025] p-3 text-[8px] leading-relaxed text-cyan-50/45">
            Formula: cycle period T = 60 / HR. Existing hemodynamics below retains CO = HR × SV, SV = EDV − ESV and pressure–volume teaching relationships with its evidence ledger.
          </div>
        </aside>
      </div>
    </section>
  )
}
