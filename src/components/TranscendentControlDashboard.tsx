import React, { useState } from 'react'
import { computeTranscendentSynthesis } from '../domains/argon/panaceaTranscendentEngine'

export function TranscendentControlDashboard() {
  const [rejuv, setRejuv] = useState(7)
  const [velocity, setVelocity] = useState(45)
  const [freq, setFreq] = useState(0.8)

  const output = computeTranscendentSynthesis({
    rejuvenationYears: rejuv,
    pathogenStrain: 'OMNI-HIBRIDA-2026',
    mutationVelocity: velocity,
    dreamStateFrequency: freq,
    harmonicSyncIndex: 88.5
  })

  return (
    <div className="mt-12 rounded-[3.5rem] border border-cyan-500/60 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/80 p-8 md:p-14 font-mono text-slate-100 shadow-[0_0_120px_rgba(6,182,212,0.25)] backdrop-blur-3xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyan-500/20 pb-6 gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.4em] text-cyan-400">PanaceaMed & Argon — Directive 011 Master Core</span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mt-1">Transcendent Bio-Synthetic Suite</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-cyan-500/40 bg-cyan-950/70 px-5 py-2 text-xs font-bold text-cyan-300">
            Coherence: {output.architecturalCoherence}%
          </span>
          <span className="rounded-full bg-cyan-500/20 px-5 py-2 text-xs font-bold text-cyan-300 border border-cyan-500/40">
            {output.senescenceStatus}
          </span>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">1. Chronos Reversal ({rejuv} Years)</h3>
          <input 
            type="range" min="1" max="20" step="1" value={rejuv} 
            onChange={(e) => setRejuv(parseInt(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">Pembalik jam biologis seluler berbasis faktor Yamanaka.</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">2. Pathogen Sandbox ({velocity}%)</h3>
          <input 
            type="range" min="10" max="100" step="1" value={velocity} 
            onChange={(e) => setVelocity(parseInt(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">Simulasi mutasi protein spike dan pertahanan imun 3D.</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">3. Neural Dream Sync ({freq} Hz)</h3>
          <input 
            type="range" min="0.1" max="2.0" step="0.1" value={freq} 
            onChange={(e) => setFreq(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">Sinkronisasi variabilitas ritme sirkadian dan Shanshui Zen.</p>
        </div>
      </div>

      <div className="mt-10 rounded-3xl border border-cyan-500/40 bg-cyan-950/30 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">Status Proteksi Global</span>
          <p className="text-xl font-black text-white mt-1">{output.pathogenThreatLevel}</p>
          <p className="text-xs text-cyan-400 mt-1">Umpan Balik: {output.neuralZenFeedback}</p>
        </div>
        <div className="rounded-2xl border border-cyan-500/30 bg-slate-950/80 px-6 py-4 text-right">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 block">Architectural Standard</span>
          <span className="text-xs font-bold text-cyan-300">Zaha Hadid Fluid & Olson Kundig Kinetic</span>
        </div>
      </div>
    </div>
  )
}
export default TranscendentControlDashboard;
