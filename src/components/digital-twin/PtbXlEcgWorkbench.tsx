import { useMemo, useState } from 'react'

const LEADS = ['I','II','III','aVR','aVL','aVF','V1','V2','V3','V4','V5','V6'] as const

type Lead = typeof LEADS[number]

function teachingWave(t:number, lead:Lead) {
  const phase = (t % 1)
  const polarity = ['aVR','V1'].includes(lead) ? -1 : 1
  const g=(x:number,m:number,s:number)=>Math.exp(-((x-m)**2)/(2*s*s))
  return polarity*(0.12*g(phase,.18,.035)-0.16*g(phase,.38,.018)+1.0*g(phase,.40,.012)-0.28*g(phase,.43,.018)+0.3*g(phase,.68,.075))
}

function LeadStrip({lead}:{lead:Lead}) {
  const points = useMemo(()=>Array.from({length:520},(_,i)=>{const t=i/130; return `${i},${48-teachingWave(t,lead)*28}`}).join(' '),[lead])
  return <svg viewBox="0 0 520 96" className="h-20 w-full rounded-xl bg-[#071015]" role="img" aria-label={`${lead} educational ECG strip`}><path d="M0 48H520" stroke="#17333b"/><polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.7" className="text-cyan-300"/><text x="10" y="18" fill="#b8e9ec" fontSize="11" fontWeight="800">{lead}</text></svg>
}

export function PtbXlEcgWorkbench(){
 const [lead,setLead]=useState<Lead>('II')
 const [mode,setMode]=useState<'single'|'twelve'>('single')
 return <section className="space-y-3 rounded-[28px] border border-cyan-200 bg-white p-4 dark:border-cyan-300/15 dark:bg-[#080c10]">
  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-700 dark:text-cyan-300">Heart · ECG source workbench</div><h3 className="mt-1 text-lg font-black text-neutral-950 dark:text-white">PTB-XL-ready 12-lead exploration</h3><p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">The viewer is structured around PTB-XL's standard 12-lead ECG experience. Until a PTB-XL record is packaged and verified in this deployment, the waveform below is explicitly a synthetic teaching trace—not a PTB-XL patient record and not a classifier output.</p></div><div className="flex gap-1"><button onClick={()=>setMode('single')} className={`rounded-xl px-3 py-2 text-[9px] font-black ${mode==='single'?'bg-cyan-500 text-white':'bg-neutral-100 dark:bg-white/5 dark:text-neutral-300'}`}>Focus lead</button><button onClick={()=>setMode('twelve')} className={`rounded-xl px-3 py-2 text-[9px] font-black ${mode==='twelve'?'bg-cyan-500 text-white':'bg-neutral-100 dark:bg-white/5 dark:text-neutral-300'}`}>12 leads</button></div></div>
  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[9px] leading-relaxed text-amber-900 dark:border-amber-300/15 dark:bg-amber-300/[.06] dark:text-amber-100"><b>Source boundary:</b> PTB-XL is the required source target. No diagnosis, sensitivity/specificity, model accuracy, clinical validation or patient inference is claimed here. ECG-classification models must expose their exact weights, classes, evaluation and provenance before Panacea may label their output as model inference.</div>
  {mode==='single'?<><div className="flex flex-wrap gap-1">{LEADS.map(l=><button key={l} onClick={()=>setLead(l)} className={`rounded-lg border px-2.5 py-1.5 text-[9px] font-black ${lead===l?'border-cyan-500 bg-cyan-500 text-white':'border-neutral-200 text-neutral-500 dark:border-white/10 dark:text-neutral-300'}`}>{l}</button>)}</div><LeadStrip lead={lead}/></>:<div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{LEADS.map(l=><LeadStrip key={l} lead={l}/>)}</div>}
  <div className="grid gap-2 sm:grid-cols-3"><div className="rounded-xl border border-neutral-200 p-3 dark:border-white/10"><div className="text-[8px] font-black uppercase text-neutral-400">Electrical sequence</div><div className="mt-1 text-[10px] font-bold dark:text-white">SA node → atria → AV node → His–Purkinje → ventricles</div></div><div className="rounded-xl border border-neutral-200 p-3 dark:border-white/10"><div className="text-[8px] font-black uppercase text-neutral-400">Rate formula</div><div className="mt-1 text-[10px] font-bold dark:text-white">HR ≈ 60 / RR (seconds)</div></div><div className="rounded-xl border border-neutral-200 p-3 dark:border-white/10"><div className="text-[8px] font-black uppercase text-neutral-400">Next source step</div><div className="mt-1 text-[10px] font-bold dark:text-white">Verified PTB-XL record → synchronized leads → source labels</div></div></div>
 </section>
}
export default PtbXlEcgWorkbench
