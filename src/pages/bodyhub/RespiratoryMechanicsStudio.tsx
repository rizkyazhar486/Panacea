import { useMemo, useState } from 'react'

type Phase = 'inspiration' | 'expiration'
type Focus = 'airway' | 'alveoli' | 'pleura' | 'diaphragm'

const FOCUS: Record<Focus, { label: string; note: string }> = {
  airway: { label: 'Airway', note: 'Follow conducting airways from trachea toward progressively smaller bronchi. Airway calibre strongly influences resistance.' },
  alveoli: { label: 'Alveoli', note: 'Gas exchange occurs across the alveolar–capillary interface. This view is a schematic teaching model, not measured diffusion.' },
  pleura: { label: 'Pleura', note: 'Pleural pressure coupling helps transmit chest-wall and respiratory-muscle motion to the lung.' },
  diaphragm: { label: 'Diaphragm', note: 'Diaphragmatic contraction increases thoracic volume during quiet inspiration; relaxation contributes to passive expiration.' },
}

export default function RespiratoryMechanicsStudio() {
  const [phase, setPhase] = useState<Phase>('inspiration')
  const [focus, setFocus] = useState<Focus>('airway')
  const [radius, setRadius] = useState(1)
  const resistanceIndex = useMemo(() => 1 / Math.pow(radius, 4), [radius])
  const inspired = phase === 'inspiration'

  return (
    <section data-body-respiratory-mechanics="v1" className="rounded-2xl border border-emerald-400/20 bg-white/90 p-3 shadow-sm dark:bg-black/70 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-brand">Respiratory · airway · lung mechanics</div>
          <h4 className="mt-1 text-base font-black text-ink dark:text-white">Breathing mechanics studio</h4>
          <p className="mt-1 max-w-2xl text-[10px] leading-relaxed text-neutral-500">Interactive physiology teaching anchored to canonical respiratory structures. The motion and numbers below are schematic education, not patient spirometry, CT segmentation or a validated respiratory simulator.</p>
        </div>
        <div className="rounded-full border border-emerald-400/20 px-3 py-1 text-[9px] font-black text-brand">Educational model</div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.05fr_.95fr]">
        <div className="relative min-h-72 overflow-hidden rounded-2xl border border-emerald-400/20 bg-gradient-to-b from-emerald-50 via-white to-emerald-50/40 dark:from-emerald-950/30 dark:via-black dark:to-black" aria-label="Schematic breathing motion">
          <div className="absolute left-1/2 top-5 h-20 w-5 -translate-x-1/2 rounded-full border border-emerald-500/40 bg-emerald-400/10" />
          <div className="absolute left-1/2 top-20 h-8 w-24 -translate-x-1/2 border-x border-t border-emerald-500/40" />
          <button type="button" onClick={() => setFocus('alveoli')} aria-pressed={focus === 'alveoli'} className={`absolute left-[20%] top-24 h-32 w-[29%] rounded-[48%_44%_52%_46%] border transition-transform duration-500 motion-reduce:transition-none ${inspired ? 'scale-105' : 'scale-95'} ${focus === 'alveoli' ? 'border-brand bg-emerald-400/20' : 'border-emerald-400/30 bg-emerald-400/10'}`} aria-label="Focus left lung" />
          <button type="button" onClick={() => setFocus('alveoli')} aria-pressed={focus === 'alveoli'} className={`absolute right-[20%] top-24 h-32 w-[29%] rounded-[44%_48%_46%_52%] border transition-transform duration-500 motion-reduce:transition-none ${inspired ? 'scale-105' : 'scale-95'} ${focus === 'alveoli' ? 'border-brand bg-emerald-400/20' : 'border-emerald-400/30 bg-emerald-400/10'}`} aria-label="Focus right lung" />
          <button type="button" onClick={() => setFocus('diaphragm')} aria-pressed={focus === 'diaphragm'} className={`absolute bottom-8 left-[18%] h-12 w-[64%] rounded-[50%] border border-brand/40 bg-brand/10 transition-transform duration-500 motion-reduce:transition-none ${inspired ? 'translate-y-3 scale-y-75' : '-translate-y-1'}`} aria-label="Focus diaphragm" />
          <div className="absolute bottom-3 left-3 rounded-lg border border-emerald-400/20 bg-white/80 px-2 py-1 text-[9px] font-bold text-neutral-600 dark:bg-black/70 dark:text-neutral-300">{inspired ? 'Thoracic volume ↑ · diaphragm descends' : 'Elastic recoil · diaphragm relaxes'}</div>
        </div>

        <div className="space-y-3">
          <div role="group" aria-label="Breathing phase" className="grid grid-cols-2 gap-2">
            {(['inspiration', 'expiration'] as const).map((item) => <button key={item} type="button" aria-pressed={phase === item} onClick={() => setPhase(item)} className={`min-h-11 rounded-xl border px-3 text-xs font-black capitalize ${phase === item ? 'border-brand bg-brand text-white' : 'border-emerald-400/20 text-neutral-600 dark:text-neutral-200'}`}>{item}</button>)}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(FOCUS) as Focus[]).map((item) => <button key={item} type="button" aria-pressed={focus === item} onClick={() => setFocus(item)} className={`min-h-11 rounded-xl border px-2 text-[10px] font-black ${focus === item ? 'border-brand bg-emerald-400/10 text-brand' : 'border-emerald-400/20 text-neutral-500'}`}>{FOCUS[item].label}</button>)}
          </div>

          <article className="rounded-xl border border-emerald-400/20 p-3">
            <div className="text-[9px] font-black uppercase tracking-wide text-brand">{FOCUS[focus].label}</div>
            <p className="mt-1 text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300">{FOCUS[focus].note}</p>
          </article>

          <label className="block rounded-xl border border-emerald-400/20 p-3 text-[10px] font-bold text-neutral-600 dark:text-neutral-300">
            Relative airway radius · {radius.toFixed(2)}×
            <input className="mt-2 w-full accent-emerald-500" type="range" min="0.65" max="1.35" step="0.05" value={radius} onChange={(event) => setRadius(Number(event.target.value))} />
            <span className="mt-2 block text-[9px] font-normal text-neutral-500">Poiseuille teaching relationship: resistance ∝ 1/r⁴. Relative resistance index = {resistanceIndex.toFixed(2)}. This assumes idealized laminar flow and is not a patient airway calculation.</span>
          </label>
        </div>
      </div>

      <details className="mt-3 rounded-xl border border-emerald-400/20 p-3">
        <summary className="cursor-pointer text-[10px] font-black text-ink dark:text-white">Clinical learning boundary</summary>
        <p className="mt-2 text-[9px] leading-relaxed text-neutral-500">Use this studio to connect airway calibre, respiratory muscle motion, pleural coupling and alveolar gas-exchange concepts. Obstructive disease, restrictive disease, pneumothorax, ventilation/perfusion mismatch and respiratory pharmacology require their own sourced teaching layers. No diagnosis, patient-specific inference, treatment recommendation, measured pressure, measured flow or clinical-validation claim is made here.</p>
      </details>
    </section>
  )
}
