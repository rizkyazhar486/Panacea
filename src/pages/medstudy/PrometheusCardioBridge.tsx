import React from 'react'
import { Link } from 'react-router-dom'

export function PrometheusCardioBridge() {
  return (
    <div className="rounded-3xl border border-cyan-500/30 bg-cyan-950/20 p-6 text-slate-100 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div>
          <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-300">Project Prometheus · Vertical Slice</span>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight">Cardiovascular Ischemia: Coronary to Cellular Workbench</h2>
        </div>
        <span className="text-xs text-slate-400">Model Version: omnicausalis-illustrative-1</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-300">
        Explore acute coronary syndrome from epicardial coronary anatomy (Body Exposure) down to mitochondrial succinate metabolism and reperfusion redox cascades (Omnicausalis).
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link 
          to="/frontier-health?workspace=omnicausalis" 
          className="inline-flex min-h-11 items-center rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
        >
          Open Omnicausalis Simulation Workbench
        </Link>
        <Link 
          to="/body-explorer" 
          className="inline-flex min-h-11 items-center rounded-xl border border-white/25 px-4 py-2 text-sm font-bold text-slate-100 transition hover:bg-white/10"
        >
          Explore Coronary Anatomy in Body Exposure
        </Link>
      </div>
    </div>
  )
}
