import React, { useState } from 'react'
import { evaluateDailyHealth } from '../../domains/clinical/model/dailyPreventiveEngine'

export function DailyPreventiveView() {
  const [systolic, setSystolic] = useState(120)
  const [diastolic, setDiastolic] = useState(80)
  const [sleep, setSleep] = useState(7)
  const [steps, setSteps] = useState(8000)

  const result = evaluateDailyHealth({
    userId: 'USER-LIVE-01',
    timestamp: Date.now(),
    restingHeartRate: 70,
    systolicBP: systolic,
    diastolicBP: diastolic,
    sleepDurationHours: sleep,
    dailyStepCount: steps,
    subjectiveFatigueScore: 2
  })

  return (
    <div className="mt-8 rounded-[2.5rem] border border-cyan-500/30 bg-slate-950/90 p-8 font-mono text-slate-100 shadow-2xl backdrop-blur-3xl">
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-400">Daily Health Shield</span>
          <h2 className="text-2xl font-black tracking-tight text-white">Preventive Clinical Guidance</h2>
        </div>
        <span className={`rounded-full px-4 py-1 text-xs font-bold ${result.riskLevel === 'OPTIMAL' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
          {result.riskLevel}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
          <span className="text-xs text-slate-400">Target Hidrasi Harian</span>
          <div className="mt-2 text-3xl font-black text-cyan-400">{result.hydrationTargetMl} mL</div>
          <p className="mt-1 text-[11px] text-slate-500">Dihitung dari aktivitas langkah kaki harian.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
          <span className="text-xs text-slate-400">Prioritas Pemulihan Tidur</span>
          <div className="mt-2 text-3xl font-black text-cyan-400">{result.recoveryPriority}</div>
          <p className="mt-1 text-[11px] text-slate-500">Berdasarkan durasi istirahat malam.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
          <span className="text-xs text-slate-400">Referensi Bukti Klinis</span>
          <div className="mt-2 text-xs font-semibold text-slate-300">{result.provenanceReferences[0]}</div>
          <p className="mt-1 text-[11px] text-slate-500">Standar pedoman kesehatan resmi.</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300 mb-2">Rekomendasi Tindakan Nyata</h3>
        <ul className="space-y-2 text-xs text-slate-300">
          {result.actionableAdvice.map((advice, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">▶</span> {advice}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
export default DailyPreventiveView;
