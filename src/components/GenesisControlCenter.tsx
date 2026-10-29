import React, { useState } from 'react'
import { synthesizeNewDNACode } from '../domains/argon/panaceaGenesisEngine'

export function GenesisControlCenter() {
  const [mutation, setMutation] = useState(0.42)
  const [seed, setSeed] = useState(2026)

  const organism = synthesizeNewDNACode(seed, mutation)

  return (
    <div className="mt-12 rounded-[3rem] border border-cyan-500/50 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/70 p-8 md:p-12 font-mono text-slate-100 shadow-[0_0_90px_rgba(6,182,212,0.2)] backdrop-blur-3xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyan-500/20 pb-6 gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.4em] text-cyan-400">Panacea Omega Genesis & Argon Synthetic Engine</span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mt-1">Transcendental DNA Recombination</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-cyan-500/40 bg-cyan-950/60 px-5 py-2 text-xs font-bold text-cyan-300">
            Index: {organism.transcendenceIndex}%
          </span>
          <span className="rounded-full bg-cyan-500/20 px-5 py-2 text-xs font-bold text-cyan-300 border border-cyan-500/40">
            {organism.cytopathicEffect}
          </span>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300">Kinetic Mutation & Seed Control</h3>
          
          <div>
            <label className="text-xs text-slate-400 block mb-2">Mutation Vector Intensity ({mutation})</label>
            <input 
              type="range" 
              min="0.1" 
              max="2.0" 
              step="0.01" 
              value={mutation} 
              onChange={(e) => setMutation(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-2">Genomic Seed Matrix ({seed})</label>
            <button 
              onClick={() => setSeed(Math.floor(Math.random() * 9000) + 1000)}
              className="w-full rounded-2xl border border-cyan-500/30 bg-cyan-950/40 py-3 text-xs font-bold text-cyan-300 transition-all hover:bg-cyan-400 hover:text-slate-950"
            >
              Generate New Synthetic Strain Code
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-cyan-500/30 bg-slate-950/80 p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300 mb-4">Synthetic Genome Matrix ({organism.strainCode})</h3>
          <div className="grid grid-cols-4 gap-2">
            {organism.syntheticGenome.map((pair) => (
              <div key={pair.position} className="rounded-xl border border-white/10 bg-slate-900 p-3 text-center">
                <span className="text-[10px] text-slate-500 block">#{pair.position}</span>
                <span className="text-base font-black text-cyan-400">{pair.nucleotideA}-{pair.nucleotideB}</span>
                <span className="text-[9px] text-slate-400 block mt-1">{pair.bondStrength} eV</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-cyan-500/30 bg-cyan-950/20 p-6 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">Replication Velocity</span>
          <p className="text-lg font-black text-white mt-1">{organism.replicationRate} generations / hour</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase tracking-widest text-slate-400">Architectural Status</span>
          <p className="text-xs font-bold text-cyan-400 mt-1">Zaha Hadid & Olson Kundig Biospatial Integration</p>
        </div>
      </div>
    </div>
  )
}
export default GenesisControlCenter;
