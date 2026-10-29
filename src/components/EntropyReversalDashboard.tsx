import React, { useState } from 'react'
import { evaluateOmniTemporalEntropy } from '../domains/argon/panaceaEntropyEngine'

export function EntropyReversalDashboard() {
  const [chronoAge, setChronoAge] = useState(42)
  const [entropy, setEntropy] = useState(38.5)
  const [tachyon, setTachyon] = useState(15.0)

  const output = evaluateOmniTemporalEntropy({
    chronologicalYears: chronoAge,
    biologicalEntropyLevel: entropy,
    quantumShieldActive: true,
    tachyonFluxDensity: tachyon
  })

  return (
    <div className="mt-12 rounded-[4rem] border border-cyan-500/80 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/95 p-8 md:p-16 font-mono text-slate-100 shadow-[0_0_160px_rgba(6,182,212,0.35)] backdrop-blur-3xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyan-500/20 pb-6 gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.5em] text-cyan-400">PanaceaMed & Argon — Directive 014 Omni-Temporal Core</span>
          <h2 className="text-3xl md:text-6xl font-black tracking-tight text-white mt-1">Omni-Temporal Entropy Reversal</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-cyan-500/50 bg-cyan-950/80 px-6 py-2.5 text-xs font-bold text-cyan-300">
            Efficiency: {output.entropyReversalEfficiency}%
          </span>
          <span className="rounded-full bg-cyan-500/20 px-6 py-2.5 text-xs font-bold text-cyan-300 border border-cyan-500/50">
            {output.multiversalShieldStatus}
          </span>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Chronological Age ({chronoAge} Yrs)</h3>
          <input 
            type="range" min="18" max="100" step="1" value={chronoAge} 
            onChange={(e) => setChronoAge(parseInt(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">Usia kalender fisik berdasarkan rotasi bumi.</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Biological Entropy ({entropy}%)</h3>
          <input 
            type="range" min="5.0" max="90.0" step="0.5" value={entropy} 
            onChange={(e) => setEntropy(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">Tingkat degradasi acak struktur molekul sel.</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Tachyon Flux Density ({tachyon})</h3>
          <input 
            type="range" min="1.0" max="30.0" step="0.5" value={tachyon} 
            onChange={(e) => setTachyon(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">Kerapatan fluks partikel sub-kuantum untuk pembalikan waktu sel.</p>
        </div>
      </div>

      <div className="mt-12 rounded-3xl border border-cyan-500/50 bg-cyan-950/40 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">Target Usia Biologis Terkalibrasi</span>
          <p className="text-3xl font-black text-white mt-1">{output.adjustedBiologicalAge} Tahun</p>
          <p className="text-xs text-cyan-400 mt-2">{output.transcendentVerdict}</p>
        </div>
        <div className="rounded-2xl border border-cyan-500/40 bg-slate-950/90 px-8 py-5 text-right">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 block">Architectural Standard</span>
          <span className="text-xs font-bold text-cyan-300">Zaha Hadid Parametric & Omni-Temporal Core</span>
        </div>
      </div>
    </div>
  )
}
export default EntropyReversalDashboard;
