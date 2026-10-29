import React, { useState } from 'react'
import { computeEnterpriseValuation } from '../domains/economy/panaceaValuationKernel'

export function ValuationDashboard() {
  const [clinics, setClinics] = useState(15000)
  const [hospitals, setHospitals] = useState(1200)
  const [apiCalls, setApiCalls] = useState(5000000)

  const report = computeEnterpriseValuation({
    activeClinics: clinics,
    enterpriseHospitals: hospitals,
    subscriptionARPU: 15000,
    aiApiCallVolume: apiCalls
  })

  const formattedValuation = (report.estimatedValuationUSD / 1_000_000_000).toFixed(2);
  const formattedRevenue = (report.revenueRunRateUSD / 1_000_000).toFixed(1);

  return (
    <div className="mt-12 rounded-[3.5rem] border border-cyan-400 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-8 md:p-14 font-mono text-slate-100 shadow-[0_0_120px_rgba(6,182,212,0.3)] backdrop-blur-3xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyan-500/30 pb-6 gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-300">PanaceaMed Enterprise Economics & Valuation</span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mt-1">Multi-Trillion Dollar Economic Engine</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-cyan-400 bg-cyan-950 px-5 py-2 text-xs font-bold text-cyan-200">
            Valuation: ${formattedValuation}B+
          </span>
          <span className="rounded-full bg-cyan-400 text-slate-950 px-5 py-2 text-xs font-black tracking-wider border border-white">
            {report.marketPenetrationTier}
          </span>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Active Clinics ({clinics})</h3>
          <input 
            type="range" min="1000" max="100000" step="500" value={clinics} 
            onChange={(e) => setClinics(parseInt(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">Klinik rawat jalan mandiri terdaftar.</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Enterprise Hospitals ({hospitals})</h3>
          <input 
            type="range" min="100" max="10000" step="50" value={hospitals} 
            onChange={(e) => setHospitals(parseInt(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">Rumah sakit besar dengan integrasi Hospital OS penuh.</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Daily AI API Calls ({apiCalls / 1000000}M)</h3>
          <input 
            type="range" min="500000" max="50000000" step="500000" value={apiCalls} 
            onChange={(e) => setApiCalls(parseInt(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">Volume kueri keputusan klinis AI harian.</p>
        </div>
      </div>

      <div className="mt-10 rounded-3xl border border-cyan-400 bg-cyan-950/40 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">Proyeksi Pendapatan Tahunan (ARR)</span>
          <p className="text-3xl font-black text-white mt-1">${formattedRevenue} Juta USD / Tahun</p>
          <p className="text-xs text-cyan-200 mt-2">Strategi Pertumbuhan: {report.strategicGrowthVector}</p>
        </div>
        <div className="rounded-2xl border border-cyan-300 bg-slate-950 px-6 py-4 text-right">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 block">Economic Standing</span>
          <span className="text-xs font-bold text-cyan-300">World-Class 10/10 Enterprise Ready</span>
        </div>
      </div>
    </div>
  )
}
export default ValuationDashboard;
