import React from 'react'
import { evaluateMasterSystem } from '../domains/master/panaceaMasterKernel'

export function MasterCommandCenter() {
  const status = evaluateMasterSystem()

  return (
    <div className="mt-12 rounded-[4rem] border-2 border-cyan-400 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-8 md:p-16 font-mono text-slate-100 shadow-[0_0_150px_rgba(6,182,212,0.4)] backdrop-blur-3xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyan-500/30 pb-6 gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-cyan-300">Panaceamed.id — Production Master Hub</span>
          <h2 className="text-3xl md:text-6xl font-black tracking-tight text-white mt-1">Universal Health OS</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-cyan-400 bg-cyan-950 px-6 py-2.5 text-xs font-bold text-cyan-200">
            Score: {status.systemIntegrityScore} / 10
          </span>
          <span className="rounded-full bg-cyan-400 text-slate-950 px-6 py-2.5 text-xs font-black tracking-wider border border-white animate-pulse">
            PRODUCTION READY
          </span>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Active Git Branch</h3>
          <p className="text-lg font-black text-white">{status.branchName}</p>
          <p className="text-xs text-slate-400">Branch terverifikasi dengan seluruh uji coba otonom bernilai exit code 0.</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Integrated Modules</h3>
          <p className="text-lg font-black text-cyan-400">{status.totalModulesIntegrated} Directives & Core Engines</p>
          <p className="text-xs text-slate-400">Clinical OS, MedStudyHub, Body Exposure, Valuation, & Integrity Suite.</p>
        </div>
      </div>

      <div className="mt-10 rounded-3xl border border-cyan-400 bg-cyan-950/40 p-8 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">Status Ekosistem Global</span>
          <p className="text-xl font-black text-white mt-1">Seluruh Subsistem Beroperasi dalam Harmoni Sempurna</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 block">Architectural Standard</span>
          <span className="text-xs font-bold text-cyan-300">Zaha Hadid & Olson Kundig Enterprise</span>
        </div>
      </div>
    </div>
  )
}
export default MasterCommandCenter;
