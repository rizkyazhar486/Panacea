import { useMemo, useState } from 'react'
import {
  ATOMIC_CHALLENGES,
  ATOMIC_SIMULATION_DISCLOSURE,
  SCALE_ORDER,
  type AtomicScale,
} from '../../lib/atomicSystemsEngineering'

const SCALE_LABEL: Record<AtomicScale, string> = {
  organism: 'Organism', organ: 'Organ', tissue: 'Tissue', cell: 'Cell', organelle: 'Organelle', molecular: 'Molecular', atomic: 'Atomic',
}

export function AtomicSystemsLab() {
  const [scale, setScale] = useState<AtomicScale>('atomic')
  const [selected, setSelected] = useState('de-novo-protein')
  const [targeting, setTargeting] = useState(60)
  const [selectivity, setSelectivity] = useState(60)
  const [delivery, setDelivery] = useState(40)
  const [validation, setValidation] = useState(20)

  const visible = useMemo(() => {
    const i = SCALE_ORDER.indexOf(scale)
    return ATOMIC_CHALLENGES.filter((c) => SCALE_ORDER.indexOf(c.scale) >= Math.max(0, i - 1))
  }, [scale])
  const challenge = ATOMIC_CHALLENGES.find((c) => c.id === selected) ?? visible[0] ?? ATOMIC_CHALLENGES[0]
  const readiness = Math.round((targeting + selectivity + delivery + validation) / 4)
  const gate = targeting >= 85 && selectivity >= 95 && delivery >= 80 && validation >= 90

  return (
    <section className="space-y-3" aria-label="Atomic systems engineering research sandbox">
      <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-brand">Body Exposure · Atomic Systems</div>
            <h2 className="text-lg font-black text-ink dark:text-white">Unsolved-problem visualisation sandbox</h2>
          </div>
          <div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-black text-amber-700 dark:text-amber-300">NOT CLINICAL</div>
        </div>
        <p className="mt-2 text-[11px] leading-snug text-neutral-500">{ATOMIC_SIMULATION_DISCLOSURE}</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {SCALE_ORDER.map((s) => (
          <button key={s} type="button" onClick={() => setScale(s)} aria-pressed={scale === s}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold ${scale === s ? 'bg-brand text-white' : 'border border-white/10 text-neutral-500'}`}>
            {SCALE_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,.85fr)]">
        <div className="relative min-h-[320px] overflow-hidden rounded-2xl border border-white/10 bg-black p-4">
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(0,191,99,.35) 0 2px, transparent 3px), radial-gradient(circle at 70% 60%, rgba(255,255,255,.25) 0 1px, transparent 2px)', backgroundSize: '42px 42px, 28px 28px' }} />
          <div className="relative flex h-full min-h-[288px] flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Conceptual scale navigator</div>
              <div className="mt-2 text-3xl font-black text-white">{SCALE_LABEL[scale]}</div>
              <div className="mt-1 max-w-xl text-xs leading-relaxed text-neutral-400">Zooming to “atomic” changes the reasoning layer and evidence requirements. It does not claim Angstrom-resolved experimental coordinates unless a verified structure dataset is loaded.</div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[['Target', targeting], ['Select', selectivity], ['Deliver', delivery], ['Validate', validation]].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl border border-white/10 bg-white/5 p-2 text-center">
                  <div className="text-lg font-black text-white">{value}%</div><div className="text-[9px] uppercase text-neutral-500">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {visible.map((c) => (
            <button key={c.id} type="button" onClick={() => setSelected(c.id)}
              className={`w-full rounded-xl border p-3 text-left ${challenge.id === c.id ? 'border-brand/50 bg-brand/5' : 'border-white/10 bg-white/[0.02]'}`}>
              <div className="flex items-center justify-between gap-2"><span className="text-xs font-black text-ink dark:text-white">{c.title}</span><span className="text-[9px] font-bold uppercase text-neutral-500">{c.evidence}</span></div>
              <div className="mt-1 text-[10px] text-neutral-500">{SCALE_LABEL[c.scale]} · {c.solved ? 'solved' : 'open problem'}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 p-3">
        <div className="text-sm font-black text-ink dark:text-white">{challenge.title}</div>
        <p className="mt-1 text-[12px] leading-snug text-neutral-500">{challenge.problem}</p>
        <p className="mt-2 text-[11px] leading-snug text-neutral-500"><b>Mechanistic model:</b> {challenge.mechanism}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl bg-neutral-100/60 p-2.5 dark:bg-white/5"><div className="text-[10px] font-black uppercase text-neutral-500">Candidate interventions</div><div className="mt-1 text-[11px] text-neutral-500">{challenge.interventions.join(' · ')}</div></div>
          <div className="rounded-xl bg-neutral-100/60 p-2.5 dark:bg-white/5"><div className="text-[10px] font-black uppercase text-neutral-500">Unsolved bottlenecks</div><div className="mt-1 text-[11px] text-neutral-500">{challenge.bottlenecks.join(' · ')}</div></div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 p-3">
        <div className="flex items-baseline justify-between"><div className="text-sm font-black text-ink dark:text-white">Translation gate simulator</div><div className="text-xl font-black text-brand">{readiness}%</div></div>
        <p className="mt-1 text-[10px] text-neutral-500">Sensitivity analysis only; sliders are not biological measurements or predictions.</p>
        <div className="mt-3 space-y-2">
          <Slider label="Target specificity" value={targeting} set={setTargeting} />
          <Slider label="Molecular selectivity" value={selectivity} set={setSelectivity} />
          <Slider label="In-vivo delivery" value={delivery} set={setDelivery} />
          <Slider label="Independent validation" value={validation} set={setValidation} />
        </div>
        <div className={`mt-3 rounded-xl px-3 py-2 text-[11px] font-bold ${gate ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'}`}>
          {gate ? 'Concept passes this educational gate — experimental validation is still required.' : 'BLOCKED — at least one safety/translation constraint remains below the sandbox threshold.'}
        </div>
      </div>
    </section>
  )
}

function Slider({ label, value, set }: { label: string; value: number; set: (v: number) => void }) {
  return <label className="grid grid-cols-[120px_1fr_38px] items-center gap-2 text-[11px] text-neutral-500"><span>{label}</span><input type="range" min={0} max={100} value={value} onChange={(e) => set(Number(e.target.value))} className="w-full accent-brand" /><span className="text-right font-bold tabular-nums">{value}</span></label>
}
