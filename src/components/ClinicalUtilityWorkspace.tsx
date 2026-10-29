import React, { useState } from 'react'
import { evaluateClinicalUtility } from '../domains/clinical/clinicalUtilityKernel'

export function ClinicalUtilityWorkspace() {
  const [telomere, setTelomere] = useState(82)
  const [sensitivity, setSensitivity] = useState(90)
  const [hrv, setHrv] = useState(65)

  const guidance = evaluateClinicalUtility({
    patientId: 'PATIENT-OMNI-001',
    telomereHealthScore: telomere,
    antimicrobialSensitivityIndex: sensitivity,
    autonomicRecoveryHRV: hrv
  })

  return (
    <div className="mt-12 rounded-[3rem] border border-cyan-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/60 p-6 md:p-12 font-mono text-slate-100 shadow-[0_0_80px_rgba(6,182,212,0.15)] backdrop-blur-3xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyan-500/20 pb-6 gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400">PanaceaMed Clinical Operations — Applicative Suite</span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mt-1">Daily Clinical Decision Workspace</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-4 py-1.5 text-xs font-bold border ${guidance.riskTier === 'OPTIMAL' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'}`}>
            {guidance.riskTier}
          </span>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-3">
          <label className="text-xs text-slate-400 block">Telomere Health Score ({telomere}%)</label>
          <input 
            type="range" min="20" max="100" step="1" value={telomere} 
            onChange={(e) => setTelomere(parseInt(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-3">
          <label className="text-xs text-slate-400 block">Pathogen Sensitivity ({sensitivity}%)</label>
          <input 
            type="range" min="30" max="100" step="1" value={sensitivity} 
            onChange={(e) => setSensitivity(parseInt(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-3">
          <label className="text-xs text-slate-400 block">Autonomic HRV ({hrv} ms)</label>
          <input 
            type="range" min="20" max="150" step="1" value={hrv} 
            onChange={(e) => setHrv(parseInt(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Rekomendasi Tindakan Klinis Terstruktur</h3>
        <ul className="space-y-2">
          {guidance.actionableSteps.map((step, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-slate-200">
              <span className="text-cyan-400 font-bold">•</span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
        <div className="pt-4 border-t border-cyan-500/20 text-[10px] uppercase tracking-widest text-slate-400">
          Ref: {guidance.evidenceReference}
        </div>
      </div>
    </div>
  )
}
export default ClinicalUtilityWorkspace;
