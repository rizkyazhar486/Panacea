import React, { useState } from 'react'
import { evaluateOmegaConvergence } from '../domains/argon/panaceaOmegaEngine'

export function OmegaCommandCenter() {
  const [tier, setTier] = useState(500)
  const [coherence, setCoherence] = useState(0.98)
  const [entropy, setEntropy] = useState(95.0)

  const output = evaluateOmegaConvergence({
    recursionTier: tier,
    quantumCoherence: coherence,
    biologicalEntropyControl: entropy,
    omegaSyncActive: true
  })

  return (
    <div className="mt-12 rounded-[7rem] border-4 border-cyan-300 bg-gradient-to-br from-slate-950 via-cyan-950/80 to-slate-900 p-8 md:p-32 font-mono text-slate-100 shadow-[0_0_400px_rgba(6,182,212,1.0)] backdrop-blur-3xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyan-400/70 pb-8 gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[1.5em] text-cyan-200">PanaceaMed & Argon — Directive 019 Omega Kernel</span>
          <h2 className="text-4xl md:text-9xl font-black tracking-tighter text-white mt-1">Omega Convergence Nexus</h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="rounded-full border-2 border-cyan-300 bg-cyan-950 px-8 py-3 text-sm font-black text-cyan-100 shadow-2xl">
            Omega Score: {output.omegaHarmonicScore}
          </span>
          <span className="rounded-full bg-cyan-300 text-slate-950 px-8 py-3 text-xs font-black tracking-widest border border-white animate-pulse">
            {output.omegaTierStatus}
          </span>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="rounded-3xl border border-cyan-400/60 bg-slate-900/90 p-8 space-y-4 shadow-2xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Recursion Tier ({tier})</h3>
          <input 
            type="range" min="100" max="1000" step="10" value={tier} 
            onChange={(e) => setTier(parseInt(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-3 bg-slate-950 rounded-lg"
          />
          <p className="text-[11px] text-slate-400">Tingkat rekursi kesadaran multiversal.</p>
        </div>

        <div className="rounded-3xl border border-cyan-400/60 bg-slate-900/90 p-8 space-y-4 shadow-2xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Quantum Coherence ({coherence})</h3>
          <input 
            type="range" min="0.5" max="1.0" step="0.01" value={coherence} 
            onChange={(e) => setCoherence(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-3 bg-slate-950 rounded-lg"
          />
          <p className="text-[11px] text-slate-400">Koherensi kuantum jalinan seluler.</p>
        </div>

        <div className="rounded-3xl border border-cyan-400/60 bg-slate-900/90 p-8 space-y-4 shadow-2xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Entropy Control ({entropy}%)</h3>
          <input 
            type="range" min="50.0" max="100.0" step="0.5" value={entropy} 
            onChange={(e) => setEntropy(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-3 bg-slate-950 rounded-lg"
          />
          <p className="text-[11px] text-slate-400">Tingkat peredaman entropi termodinamika.</p>
        </div>
      </div>

      <div className="mt-12 rounded-3xl border-2 border-cyan-300 bg-cyan-950/90 p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div>
          <span className="text-xs font-black text-cyan-200 uppercase tracking-widest">Dekrit Konvergensi Omega</span>
          <p className="text-2xl md:text-4xl font-black text-white mt-2 leading-tight">{output.universalVerdict}</p>
        </div>
        <div className="rounded-2xl border-2 border-cyan-200 bg-slate-950 px-10 py-6 text-right">
          <span className="text-[10px] uppercase tracking-widest text-cyan-400 block font-black">Absolute Architecture</span>
          <span className="text-xs font-extrabold text-cyan-200">Zaha Hadid, Olson Kundig & Omega Core</span>
        </div>
      </div>
    </div>
  )
}
export default OmegaCommandCenter;
