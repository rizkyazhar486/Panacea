import React, { useState } from 'react'
import { computeArgonNeuralSync } from '../domains/argon/argonNeuralCore'

export function ArgonNeuralWidget() {
  const [flux, setFlux] = useState(0.88)
  const [entropy, setEntropy] = useState(0.15)
  const [resonance, setResonance] = useState(1.2)

  const report = computeArgonNeuralSync({
    nodeId: 'ARGON-NODE-01',
    timestamp: Date.now(),
    perfusionFlux: flux,
    cellularEntropy: entropy,
    autonomicResonance: resonance,
    kineticLoad: 45.0
  })

  return (
    <div className="mt-10 rounded-[2.5rem] border border-cyan-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/50 p-8 font-mono text-slate-100 shadow-[0_0_60px_rgba(6,182,212,0.15)] backdrop-blur-3xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyan-500/20 pb-6 gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-400">Argon Hyper-Neural Core & Zaha Hadid Fluid Engine</span>
          <h2 className="text-3xl font-black tracking-tight text-white mt-1">Real-Time Biospatial Intelligence</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-cyan-500/40 bg-cyan-950/60 px-4 py-1.5 text-xs font-bold text-cyan-300">
            Score: {report.confidenceScore}%
          </span>
          <span className={`rounded-full px-4 py-1.5 text-xs font-bold ${report.status === 'STABLE_HARMONY' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'}`}>
            {report.status}
          </span>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <label className="text-xs text-slate-400 block mb-2">Perfusion Flux ({flux})</label>
          <input 
            type="range" 
            min="0.1" 
            max="1.0" 
            step="0.01" 
            value={flux} 
            onChange={(e) => setFlux(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <label className="text-xs text-slate-400 block mb-2">Cellular Entropy ({entropy})</label>
          <input 
            type="range" 
            min="0.0" 
            max="0.9" 
            step="0.01" 
            value={entropy} 
            onChange={(e) => setEntropy(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <label className="text-xs text-slate-400 block mb-2">Autonomic Resonance ({resonance} Hz)</label>
          <input 
            type="range" 
            min="0.2" 
            max="2.5" 
            step="0.1" 
            value={resonance} 
            onChange={(e) => setResonance(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-2">Argon Clinical Recommendation</h3>
        <p className="text-sm font-light text-slate-200 leading-relaxed">{report.recommendedAction}</p>
        <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-400 border-t border-cyan-500/20 pt-3">
          <span>Architecture: {report.architecturalStyle}</span>
          <span>Panaceamed.id Production Core</span>
        </div>
      </div>
    </div>
  )
}
export default ArgonNeuralWidget;
