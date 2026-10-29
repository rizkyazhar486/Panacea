import React, { useState } from 'react'
import { evaluateOmniGenesis } from '../domains/argon/panaceaOmniGenesisEngine'

export function OmniGenesisCommandCenter() {
  const [nexus, setNexus] = useState(777)
  const [vacuum, setVacuum] = useState(8850)
  const [sync, setSync] = useState(99.9)

  const output = evaluateOmniGenesis({
    dimensionalNexusTier: nexus,
    quantumVacuumEnergyDensity: vacuum,
    matterRecreationFlux: true,
    infiniteConsciousnessSync: sync
  })

  return (
    <div className="mt-12 rounded-[5rem] border-2 border-cyan-300 bg-gradient-to-br from-slate-950 via-cyan-950/60 to-slate-900 p-8 md:p-20 font-mono text-slate-100 shadow-[0_0_250px_rgba(6,182,212,0.6)] backdrop-blur-3xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyan-400/40 pb-8 gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.8em] text-cyan-200">PanaceaMed & Argon — Directive 016 Infinite Core</span>
          <h2 className="text-4xl md:text-8xl font-black tracking-tighter text-white mt-1">Omni-Genesis Singularity</h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="rounded-full border border-cyan-300 bg-cyan-950 px-8 py-3 text-sm font-bold text-cyan-100 shadow-lg">
            Manifestation Score: {output.realityManifestationScore}
          </span>
          <span className="rounded-full bg-cyan-300 text-slate-950 px-8 py-3 text-xs font-black tracking-widest border border-white animate-bounce">
            {output.omniGenesisTierStatus}
          </span>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="rounded-3xl border border-cyan-500/30 bg-slate-900/90 p-8 space-y-4 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Dimensional Nexus ({nexus})</h3>
          <input 
            type="range" min="100" max="1000" step="1" value={nexus} 
            onChange={(e) => setNexus(parseInt(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-950 rounded-lg"
          />
          <p className="text-[11px] text-slate-400">Tingkat koneksi antar-nexus dimensi penciptaan semesta.</p>
        </div>

        <div className="rounded-3xl border border-cyan-500/30 bg-slate-900/90 p-8 space-y-4 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Quantum Vacuum Density ({vacuum})</h3>
          <input 
            type="range" min="1000" max="20000" step="100" value={vacuum} 
            onChange={(e) => setVacuum(parseInt(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-950 rounded-lg"
          />
          <p className="text-[11px] text-slate-400">Energi fluktuasi hampa udara kuantum murni.</p>
        </div>

        <div className="rounded-3xl border border-cyan-500/30 bg-slate-900/90 p-8 space-y-4 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Consciousness Sync ({sync}%)</h3>
          <input 
            type="range" min="50.0" max="100.0" step="0.1" value={sync} 
            onChange={(e) => setSync(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-950 rounded-lg"
          />
          <p className="text-[11px] text-slate-400">Tingkat keselarasan kesadaran tak terbatas.</p>
        </div>
      </div>

      <div className="mt-12 rounded-3xl border border-cyan-300 bg-cyan-950/60 p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div>
          <span className="text-xs font-black text-cyan-200 uppercase tracking-widest">Dekrit Penciptaan Mutlak</span>
          <p className="text-2xl md:text-3xl font-black text-white mt-2 leading-tight">{output.transcendentVerdict}</p>
        </div>
        <div className="rounded-2xl border border-cyan-200 bg-slate-950 px-8 py-6 text-right">
          <span className="text-[10px] uppercase tracking-widest text-cyan-400 block font-bold">Architectural Singularity</span>
          <span className="text-xs font-extrabold text-cyan-200">Zaha Hadid & Infinite Multiverse Core</span>
        </div>
      </div>
    </div>
  )
}
export default OmniGenesisCommandCenter;
