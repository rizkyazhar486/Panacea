import React from 'react'
import { PritzkerArchitecturalShell } from '../../components/PritzkerArchitecturalShell'
import { pritzkerZahaTheme } from '../../styles/pritzkerZahaTheme'

export default function PritzkerMasterWorkspace() {
  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-16 text-slate-100 font-sans">
      <div className="mx-auto max-w-6xl space-y-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyan-500/20 pb-8 gap-6">
          <div>
            <span className={pritzkerZahaTheme.typography.scale.caption}>Pritzker Laureates & AD100 Architectural Integration</span>
            <h1 className={`${pritzkerZahaTheme.typography.scale.hero} text-white mt-2`}>PanaceaMed Invictus ∞</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-cyan-500/30 bg-cyan-950/40 px-5 py-2 text-xs font-semibold text-cyan-300 backdrop-blur-md">
              Fluid Geometry Active
            </span>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <PritzkerArchitecturalShell
            subtitle="Sir David Chipperfield & Tadao Ando Standard"
            title="Structural Serenity & Civic Restraint"
            symbol="🏛️"
            architecturalInsight="Embodying raw monolithic concrete minimalism and timeless civic permanence. Strips away extraneous digital noise to present high-signal medical truth with absolute spatial dignity."
          />
          <PritzkerArchitecturalShell
            subtitle="Zaha Hadid Architects Parametric Flow"
            title="Hyper-Organic Fluidity"
            symbol="🌊"
            architecturalInsight="Parametric spatial architecture replacing rigid boxes with continuous, curving surfaces. Facilitates cognitive ease and natural eye movement across complex clinical and physiological pathways."
          />
          <PritzkerArchitecturalShell
            subtitle="Foster + Partners & Shanshui City Philosophy"
            title="Eco-Biophilic Integration"
            symbol="🍃"
            architecturalInsight="Harmonizing advanced computational telemetry with natural human rhythms. Blends high-tech analytical precision with organic tactile comfort for daily preventive health."
          />
          <PritzkerArchitecturalShell
            subtitle="Olson Kundig Kinetic Mechanics"
            title="Tactile & Kinetic Engagement"
            symbol="⚙️"
            architecturalInsight="Integrating physical-digital tactility through responsive interactive modules, weighted feedback loops, and purposeful mechanical clarity in every user interaction."
          />
        </section>
      </div>
    </main>
  )
}
