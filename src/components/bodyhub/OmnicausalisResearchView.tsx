import React, { useState } from 'react';
import { OMNICAUSAL_ENTITIES, OMNICAUSAL_EDGES } from '../../lib/omnicausalis/CausalGraphStore';
import { runTemporalSimulation } from '../../lib/omnicausalis/TemporalPhysiologyEngine';

interface OmnicausalisResearchViewProps {
  onBackToBodyExposure: () => void;
}

export function OmnicausalisResearchView({ onBackToBodyExposure }: OmnicausalisResearchViewProps) {
  const [oxygenInput, setOxygenInput] = useState<number>(40);
  const simulationTimeline = runTemporalSimulation(oxygenInput, 12);
  const currentStepState = simulationTimeline[simulationTimeline.length - 1];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans">
      <div className="flex justify-between items-center border-b border-white/10 pb-6 mb-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-cyan-400 font-bold bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-400/30">Omnicausalis ∞ Directive 002</span>
          <h1 className="text-2xl font-extrabold mt-2">Multiscale Ischemic Cascade Research Workspace</h1>
        </div>
        <button onClick={onBackToBodyExposure} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-bold transition">
          ← Return to Body Exposure
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 border border-white/10 p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-cyan-300 mb-4">Simulation Control</h2>
          <label className="block text-xs font-semibold uppercase text-white/70 mb-2">Oxygen Supply: {oxygenInput}%</label>
          <input type="range" min="10" max="100" value={oxygenInput} onChange={(e) => setOxygenInput(Number(e.target.value))} className="w-full accent-cyan-400" />
        </div>
        <div className="bg-slate-900/60 border border-white/10 p-6 rounded-2xl space-y-3">
          <h2 className="text-lg font-bold text-cyan-300">Current State Metrics</h2>
          <div className="flex justify-between text-xs font-mono"><span className="text-white/70">ATP Production:</span><span className="text-cyan-300 font-bold">{currentStepState.atpProductionRate}</span></div>
          <div className="flex justify-between text-xs font-mono"><span className="text-white/70">ROS Stress:</span><span className="text-amber-300 font-bold">{currentStepState.rosProductionRate}</span></div>
          <div className="flex justify-between text-xs font-mono"><span className="text-white/70">Cytokines:</span><span className="text-rose-300 font-bold">{currentStepState.inflammatoryCytokines}</span></div>
        </div>
      </div>
    </div>
  );
}
