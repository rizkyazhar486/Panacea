import React from 'react'
import { ParametricFluidCard } from '../../components/ParametricFluidCard'

export default function ParametricDashboard() {
  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 text-slate-100 font-mono">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex items-center justify-between border-b border-cyan-500/20 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">Neo-Futurism & Parametric Architecture</span>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-white">Panacea Omega Workspace</h1>
          </div>
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/30 px-4 py-2 text-xs text-cyan-300 backdrop-blur-md">
            Fluid Geometry Active
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ParametricFluidCard
            category="Cardiovascular Dynamics"
            title="Hemodynamics"
            symbol="🫀"
            deepInsight="Continuous Navier-Stokes fluid modeling integrated with myocardial ATP flux. Simulates microvascular perfusion thresholds under acute ischemic stress vectors."
          />
          <ParametricFluidCard
            category="Cellular Metabolism"
            title="Mitochondria"
            symbol="⚡"
            deepInsight="Non-equilibrium thermodynamic state equations mapping oxidative phosphorylation efficiency against cellular senescence boundaries."
          />
          <ParametricFluidCard
            category="Neural & Autonomic"
            title="Synapse"
            symbol="🧠"
            deepInsight="High-frequency autonomic balance tracking via heart rate variability matrices and neurovascular coupling distribution."
          />
          <ParametricFluidCard
            category="Civilizational Coherence"
            title="Nexus"
            symbol="🌐"
            deepInsight="Unified epistemic tensor field binding physical, chemical, biological, and physiological parameters into a single deterministic health operating system."
          />
        </div>
      </div>
    </div>
  )
}
