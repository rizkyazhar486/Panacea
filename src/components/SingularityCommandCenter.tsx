import React, { useState } from 'react'
import { evaluatePlanetarySingularity } from '../domains/argon/panaceaSingularityEngine'

export function SingularityCommandCenter() {
  const [users, setUsers] = useState(14500)
  const [coherence, setCoherence] = useState(0.89)

  const output = evaluatePlanetarySingularity({
    activeGlobalUsers: users,
    planetaryCoherenceIndex: coherence,
    globalInflammationReductionRate: 34.5,
    singularityThresholdMet: true
  })

  return (
    <div className="mt-12 rounded-[4rem] border border-cyan-500/70 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/90 p-8 md:p-16 font-mono text-slate-100 shadow-[0_0_150px_rgba(6,182,212,0.3)] backdrop-blur-3xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyan-500/20 pb-6 gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.5em] text-cyan-400">PanaceaMed & Argon — Directive 013 Singularity Core</span>
          <h2 className="text-3xl md:text-6xl font-black tracking-tight text-white mt-1">Planetary Singularity Matrix</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-cyan-500/50 bg-cyan-950/80 px-6 py-2.5 text-xs font-bold text-cyan-300">
            Velocity: {output.civilizationalHealingVelocity}x
          </span>
          <span className="rounded-full bg-cyan-500/20 px-6 py-2.5 text-xs font-bold text-cyan-300 border border-cyan-500/50 animate-pulse">
            {output.nobelPrizeCandidateStatus}
          </span>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300">Global Active Nodes ({users} Users)</h3>
          <input 
            type="range" min="1000" max="100000" step="500" value={users} 
            onChange={(e) => setUsers(parseInt(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <p className="text-xs text-slate-400">Jumlah dokter, koas, dan pasien yang terhubung secara serentak ke jaringan PanaceaMed.</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300">Planetary Coherence Index ({coherence})</h3>
          <input 
            type="range" min="0.1" max="1.0" step="0.01" value={coherence} 
            onChange={(e) => setCoherence(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <p className="text-xs text-slate-400">Tingkat keselarasan biometrik dan kognitif seluruh node di seluruh dunia.</p>
        </div>
      </div>

      <div className="mt-12 rounded-3xl border border-cyan-500/50 bg-cyan-950/40 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">Guinness World Record Target</span>
          <p className="text-lg font-black text-white mt-1">{output.guinnessRecordCategory}</p>
          <p className="text-xs text-cyan-400 mt-2">Standar Arsitektur: {output.architecturalTranscendence}</p>
        </div>
        <div className="rounded-2xl border border-cyan-500/40 bg-slate-950/90 px-8 py-5 text-right">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 block">Status Ekosistem</span>
          <span className="text-sm font-bold text-cyan-300">FULLY DEPLOYED TO PANACEAMED.ID</span>
        </div>
      </div>
    </div>
  )
}
export default SingularityCommandCenter;
