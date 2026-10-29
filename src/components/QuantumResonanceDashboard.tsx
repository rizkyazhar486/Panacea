import React, { useState } from 'react'
import { evaluateQuantumResonance } from '../domains/argon/panaceaQuantumResonanceEngine'

export function QuantumResonanceDashboard() {
  const [schumann, setSchumann] = useState(7.83)
  const [flux, setFlux] = useState(1250)
  const [methylation, setMethylation] = useState(25)

  const output = evaluateQuantumResonance({
    schumannHz: schumann,
    biophotonFluxIntensity: flux,
    epigeneticMethylationIndex: methylation,
    quantumCoherenceState: 'COHERENT_HARMONY'
  })

  return (
    <div className="mt-12 rounded-[3.5rem] border border-cyan-500/60 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/80 p-8 md:p-14 font-mono text-slate-100 shadow-[0_0_120px_rgba(6,182,212,0.25)] backdrop-blur-3xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyan-500/20 pb-6 gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.4em] text-cyan-400">PanaceaMed & Argon — Directive 012 Quantum Core</span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mt-1">Quantum Epigenetic Resonance</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-cyan-500/40 bg-cyan-950/70 px-5 py-2 text-xs font-bold text-cyan-300">
            Harmonic Score: {output.cellularHarmonicScore}%
          </span>
          <span className="rounded-full bg-cyan-500/20 px-5 py-2 text-xs font-bold text-cyan-300 border border-cyan-500/40">
            {output.epigeneticShieldStatus}
          </span>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Schumann Frequency ({schumann} Hz)</h3>
          <input 
            type="range" min="4.0" max="14.0" step="0.05" value={schumann} 
            onChange={(e) => setSchumann(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">Resonansi elektromagnetik alami bumi (Baseline: 7.83 Hz).</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Biophoton Flux ({flux})</h3>
          <input 
            type="range" min="500" max="3000" step="50" value={flux} 
            onChange={(e) => setFlux(parseInt(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">Emisi foton ultra-lemah dari metabolisme seluler.</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Epigenetic Methylation ({methylation}%)</h3>
          <input 
            type="range" min="5" max="80" step="1" value={methylation} 
            onChange={(e) => setMethylation(parseInt(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">Indeks penanda penuaan dan bungkus kromatin DNA.</p>
        </div>
      </div>

      <div className="mt-10 rounded-3xl border border-cyan-500/40 bg-cyan-950/30 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">Rekomendasi Pergeseran Kuantum</span>
          <p className="text-xl font-black text-white mt-1">{output.recommendedQuantumShift}</p>
        </div>
        <div className="rounded-2xl border border-cyan-500/30 bg-slate-950/80 px-6 py-4 text-right">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 block">Architectural Standard</span>
          <span className="text-xs font-bold text-cyan-300">Zaha Hadid Parametric & Biophysics Core</span>
        </div>
      </div>
    </div>
  )
}
export default QuantumResonanceDashboard;
