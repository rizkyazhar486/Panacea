import React, { useState } from 'react'
import { evaluateOmniscienceMatrix } from '../domains/argon/panaceaOmniscienceEngine'

export function OmniscienceCommandCenter() {
  const [realms, setRealms] = useState(42)
  const [entanglement, setEntanglement] = useState(0.99)
  const [dampening, setDampening] = useState(88.5)

  const output = evaluateOmniscienceMatrix({
    multiverseRealmsConnected: realms,
    quantumEntanglementCoherence: entanglement,
    cosmicEntropyDampening: dampening,
    omniPresentNeuralSync: true
  })

  return (
    <div className="mt-12 rounded-[4.5rem] border border-cyan-400 bg-gradient-to-br from-slate-950 via-cyan-950/40 to-slate-900 p-8 md:p-16 font-mono text-slate-100 shadow-[0_0_200px_rgba(6,182,212,0.45)] backdrop-blur-3xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyan-500/30 pb-6 gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.6em] text-cyan-300">PanaceaMed & Argon — Directive 015 Omni-Kernel</span>
          <h2 className="text-3xl md:text-7xl font-black tracking-tight text-white mt-1">Multiversal Omniscience Matrix</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-cyan-400 bg-cyan-950/90 px-6 py-2.5 text-xs font-bold text-cyan-200">
            Harmonic: {output.universalHealingHarmonic}
          </span>
          <span className="rounded-full bg-cyan-400 text-slate-950 px-6 py-2.5 text-xs font-black tracking-wider border border-cyan-300 animate-pulse">
            {output.multiversalTierStatus}
          </span>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Multiverse Realms ({realms})</h3>
          <input 
            type="range" min="1" max="100" step="1" value={realms} 
            onChange={(e) => setRealms(parseInt(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">Jumlah dimensi paralel yang terhubung secara kuantum.</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Quantum Entanglement ({entanglement})</h3>
          <input 
            type="range" min="0.5" max="1.0" step="0.01" value={entanglement} 
            onChange={(e) => setEntanglement(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">Tingkat koherensi jalinan partikel lintas realitas.</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Cosmic Entropy Dampening ({dampening}%)</h3>
          <input 
            type="range" min="10.0" max="100.0" step="0.5" value={dampening} 
            onChange={(e) => setDampening(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">Peredaman kekacauan termodinamika kosmik.</p>
        </div>
      </div>

      <div className="mt-12 rounded-3xl border border-cyan-400 bg-cyan-950/50 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">Putusan Mutlak Kosmik</span>
          <p className="text-2xl font-black text-white mt-1">{output.transcendentVerdict}</p>
        </div>
        <div className="rounded-2xl border border-cyan-300 bg-slate-950 px-8 py-5 text-right">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 block">Architectural Mastery</span>
          <span className="text-xs font-bold text-cyan-300">Zaha Hadid, Olson Kundig & Omni-Multiverse Core</span>
        </div>
      </div>
    </div>
  )
}
export default OmniscienceCommandCenter;
