import { useState } from 'react'

type Source = 'chbmit' | 'openneuro'
const SOURCES = {
  chbmit: {
    name: 'CHB-MIT Scalp EEG',
    badge: 'PhysioNet · open access',
    description: 'Pediatric scalp EEG recordings from subjects with intractable seizures. The source uses the International 10–20 electrode system and 256 Hz sampling; seizure intervals are annotated in the dataset.',
    boundary: 'Dataset annotations are source labels, not a Panacea diagnosis, patient-specific prediction, or claim of seizure-detector accuracy.',
  },
  openneuro: {
    name: 'OpenNeuro EEG',
    badge: 'BIDS archive',
    description: 'OpenNeuro hosts public BIDS-compliant EEG datasets. A specific dataset and snapshot must be selected and verified before Panacea renders its signal as source data.',
    boundary: 'This entry point does not substitute a synthetic trace when a selected public dataset is unavailable or unverified.',
  },
} as const

const ELECTRODES = ['Fp1','Fp2','F7','F3','Fz','F4','F8','T7','C3','Cz','C4','T8','P7','P3','Pz','P4','P8','O1','O2']

export function BrainEegSourceGate() {
  const [source, setSource] = useState<Source>('chbmit')
  const [focus, setFocus] = useState('Cz')
  const selected = SOURCES[source]
  return (
    <section className="relative overflow-hidden rounded-[30px] border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-4 shadow-sm dark:border-emerald-300/15 dark:from-emerald-300/[.07] dark:via-[#07100d] dark:to-cyan-300/[.04] sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><div className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-700 dark:text-emerald-300">Brain · scalp · EEG</div><h3 className="mt-1 text-lg font-black text-neutral-950 dark:text-white">Source-first neuroelectric explorer</h3><p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-300">The scalp remains the spatial anchor while source context transforms around the selected electrode. No waveform is rendered until a real record is selected and decoded.</p></div><span className="rounded-full border border-emerald-200 bg-white/70 px-3 py-1.5 text-[8px] font-black text-emerald-800 backdrop-blur dark:border-emerald-300/20 dark:bg-white/[.04] dark:text-emerald-200">source gate · no fabricated EEG</span></div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[26px] border border-white/70 bg-white/65 p-4 shadow-[0_18px_60px_rgba(16,185,129,.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[.035]">
          <div className="mx-auto grid max-w-[420px] grid-cols-5 gap-2 rounded-[44%] border border-emerald-200/80 bg-gradient-to-b from-white to-emerald-50 p-7 dark:border-emerald-300/15 dark:from-white/[.06] dark:to-emerald-300/[.03]">{ELECTRODES.map((electrode) => <button key={electrode} onClick={() => setFocus(electrode)} className={`aspect-square rounded-full border text-[8px] font-black transition motion-reduce:transition-none ${focus === electrode ? 'scale-110 border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 motion-reduce:scale-100' : 'border-neutral-200 bg-white text-neutral-500 dark:border-white/10 dark:bg-white/[.04] dark:text-neutral-300'}`}>{electrode}</button>)}</div>
          <div className="mt-3 text-center"><div className="text-[9px] font-black text-emerald-700 dark:text-emerald-300">Focused electrode · {focus}</div><p className="mt-1 text-[8px] text-neutral-500">Topographic teaching anchor only. Electrode placement is schematic here and is not a digitized subject-specific head model.</p></div>
        </div>
        <div className="space-y-3"><div className="grid grid-cols-2 gap-2">{(Object.keys(SOURCES) as Source[]).map((key) => <button key={key} onClick={() => setSource(key)} className={`rounded-2xl border p-3 text-left transition motion-reduce:transition-none ${source === key ? 'border-emerald-400 bg-emerald-500 text-white' : 'border-neutral-200 bg-white/70 text-neutral-700 dark:border-white/10 dark:bg-white/[.035] dark:text-neutral-200'}`}><div className="text-[9px] font-black">{SOURCES[key].name}</div><div className={`mt-1 text-[8px] ${source === key ? 'text-emerald-50' : 'text-neutral-400'}`}>{SOURCES[key].badge}</div></button>)}</div><div className="rounded-2xl border border-neutral-200 bg-white/75 p-4 backdrop-blur dark:border-white/10 dark:bg-white/[.035]"><div className="text-[10px] font-black text-neutral-950 dark:text-white">{selected.name}</div><p className="mt-2 text-[9px] leading-relaxed text-neutral-600 dark:text-neutral-300">{selected.description}</p><div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[8px] leading-relaxed text-amber-900 dark:border-amber-300/15 dark:bg-amber-300/[.07] dark:text-amber-100">{selected.boundary}</div></div><div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/60 p-4 dark:border-emerald-300/20 dark:bg-emerald-300/[.04]"><div className="text-[9px] font-black text-emerald-800 dark:text-emerald-200">Next transformation</div><p className="mt-1 text-[8px] leading-relaxed text-neutral-500 dark:text-neutral-400">Verified record → channel montage → time window → source annotation overlay → scalp/brain context. Until those source bytes are reachable, this panel intentionally stops here rather than showing synthetic patient-like data.</p></div></div>
      </div>
    </section>
  )
}
export default BrainEegSourceGate
