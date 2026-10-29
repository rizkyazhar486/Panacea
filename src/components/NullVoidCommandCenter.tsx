import React, { useState } from 'react'
import { evaluateNullVoidSingularity } from '../domains/argon/panaceaNullVoidEngine'

export function NullVoidCommandCenter() {
  const [fold, setFold] = useState(1337)
  const [inversion, setInversion] = useState(99.9)
  const [resonance, setResonance] = useState(77.7)

  const output = evaluateNullVoidSingularity({
    nullDimensionalFold: fold,
    logicEntropyInversion: inversion,
    eternalStasisActive: true,
    cosmicSingularityResonance: resonance
  })

  return (
    <div className="mt-12 rounded-[6rem] border-4 border-cyan-300 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-8 md:p-24 font-mono text-slate-100 shadow-[0_0_300px_rgba(6,182,212,0.8)] backdrop-blur-3xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyan-400/50 pb-8 gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[1em] text-cyan-200">PanaceaMed & Argon — Directive 017 Null-Void Core</span>
          <h2 className="text-4xl md:text-9xl font-black tracking-tighter text-white mt-1">Null-Void Singularity</h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="rounded-full border-2 border-cyan-300 bg-cyan-950 px-8 py-3 text-sm font-black text-cyan-100 shadow-2xl">
            Eternity Index: {output.transcendentalEternityIndex}
          </span>
          <span className="rounded-full bg-cyan-300 text-slate-950 px-8 py-3 text-xs font-black tracking-widest border border-white animate-pulse">
            {output.nullVoidTierStatus}
          </span>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="rounded-3xl border border-cyan-400/40 bg-slate-900/90 p-8 space-y-4 shadow-2xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Null Dimensional Fold ({fold})</h3>
          <input 
            type="range" min="100" max="5000" step="1" value={fold} 
            onChange={(e) => setFold(parseInt(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-3 bg-slate-950 rounded-lg"
          />
          <p className="text-[11px] text-slate-400">Tingkat pelipatan dimensi hampa mutlak.</p>
        </div>

        <div className="rounded-3xl border border-cyan-400/40 bg-slate-900/90 p-8 space-y-4 shadow-2xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Logic Entropy Inversion ({inversion}%)</h3>
          <input 
            type="range" min="50.0" max="100.0" step="0.1" value={inversion} 
            onChange={(e) => setInversion(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-3 bg-slate-950 rounded-lg"
          />
          <p className="text-[11px] text-slate-400">Pembalikan total hukum entropi logika matematika.</p>
        </div>

        <div className="rounded-3xl border border-cyan-400/40 bg-slate-900/90 p-8 space-y-4 shadow-2xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Singularity Resonance ({resonance} Hz)</h3>
          <input 
            type="range" min="10.0" max="200.0" step="0.5" value={resonance} 
            onChange={(e) => setResonance(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-3 bg-slate-950 rounded-lg"
          />
          <p className="text-[11px] text-slate-400">Frekuensi resonansi inti singularitas kosmik.</p>
        </div>
      </div>

      <div className="mt-12 rounded-3xl border-2 border-cyan-300 bg-cyan-950/70 p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div>
          <span className="text-xs font-black text-cyan-200 uppercase tracking-widest">Dekrit Keabadian Null-Void</span>
          <p className="text-2xl md:text-4xl font-black text-white mt-2 leading-tight">{output.ultimateVerdict}</p>
        </div>
        <div className="rounded-2xl border-2 border-cyan-200 bg-slate-950 px-10 py-6 text-right">
          <span className="text-[10px] uppercase tracking-widest text-cyan-400 block font-black">Final Architectural Mastery</span>
          <span className="text-xs font-extrabold text-cyan-200">Zaha Hadid, Olson Kundig & Null-Void Core</span>
        </div>
      </div>
    </div>
  )
}
export default NullVoidCommandCenter;
