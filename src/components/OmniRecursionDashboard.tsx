import React, { useState } from 'react'
import { evaluateOmniRecursion } from '../domains/argon/panaceaRecursionEngine'

export function OmniRecursionDashboard() {
  const [depth, setDepth] = useState(2048)
  const [constant, setConstant] = useState(88.8)

  const output = evaluateOmniRecursion({
    recursionDepth: depth,
    parallelTimelineSync: true,
    biometricHarmonicConstant: constant
  })

  return (
    <div className="mt-12 rounded-[6.5rem] border-4 border-cyan-300 bg-gradient-to-br from-slate-950 via-cyan-950/70 to-slate-900 p-8 md:p-28 font-mono text-slate-100 shadow-[0_0_350px_rgba(6,182,212,0.9)] backdrop-blur-3xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyan-400/60 pb-8 gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[1.2em] text-cyan-200">PanaceaMed & Argon — Directive 018 Omni-Recursion Core</span>
          <h2 className="text-4xl md:text-9xl font-black tracking-tighter text-white mt-1">Omni-Recursion Nexus</h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="rounded-full border-2 border-cyan-300 bg-cyan-950 px-8 py-3 text-sm font-black text-cyan-100 shadow-2xl">
            Efficiency Score: {output.recursiveEfficiencyScore}
          </span>
          <span className="rounded-full bg-cyan-300 text-slate-950 px-8 py-3 text-xs font-black tracking-widest border border-white animate-pulse">
            {output.recursionTierStatus}
          </span>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-3xl border border-cyan-400/50 bg-slate-900/90 p-8 space-y-4 shadow-2xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Recursion Depth ({depth} Iterations)</h3>
          <input 
            type="range" min="128" max="8192" step="64" value={depth} 
            onChange={(e) => setDepth(parseInt(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-3 bg-slate-950 rounded-lg"
          />
          <p className="text-[11px] text-slate-400">Kedalaman pelipatan rekursi paralel lintas dimensi.</p>
        </div>

        <div className="rounded-3xl border border-cyan-400/50 bg-slate-900/90 p-8 space-y-4 shadow-2xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Biometric Harmonic Constant ({constant} Hz)</h3>
          <input 
            type="range" min="10.0" max="200.0" step="0.5" value={constant} 
            onChange={(e) => setConstant(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-3 bg-slate-950 rounded-lg"
          />
          <p className="text-[11px] text-slate-400">Konstanta resonansi harmonik seluler multiversal.</p>
        </div>
      </div>

      <div className="mt-12 rounded-3xl border-2 border-cyan-300 bg-cyan-950/80 p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div>
          <span className="text-xs font-black text-cyan-200 uppercase tracking-widest">Dekrit Rekursi Semesta</span>
          <p className="text-2xl md:text-4xl font-black text-white mt-2 leading-tight">{output.omniVerdict}</p>
        </div>
        <div className="rounded-2xl border-2 border-cyan-200 bg-slate-950 px-10 py-6 text-right">
          <span className="text-[10px] uppercase tracking-widest text-cyan-400 block font-black">Ultimate Architecture</span>
          <span className="text-xs font-extrabold text-cyan-200">Zaha Hadid, Olson Kundig & Omni-Recursion Core</span>
        </div>
      </div>
    </div>
  )
}
export default OmniRecursionDashboard;
