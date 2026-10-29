import React, { useState } from 'react'
import { evaluateSystemIntegrity } from '../domains/integrity/panaceaIntegrityKernel'

export function IntegrityAuditDashboard() {
  const [safety, setSafety] = useState(100)
  const [encryption, setEncryption] = useState(true)
  const [auditTrail, setAuditTrail] = useState(true)
  const [wcag, setWcag] = useState(true)

  const report = evaluateSystemIntegrity({
    clinicalSafetyCompliance: safety,
    dataEncryptionIntegrity: encryption,
    auditTrailImmutability: auditTrail,
    accessibilityWCAGCompliance: wcag
  })

  return (
    <div className="mt-12 rounded-[3.5rem] border border-cyan-400 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-8 md:p-14 font-mono text-slate-100 shadow-[0_0_130px_rgba(6,182,212,0.35)] backdrop-blur-3xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyan-500/30 pb-6 gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-300">PanaceaMed Governance & Integrity Suite</span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mt-1">Master Quality & Integrity Audit</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-cyan-400 bg-cyan-950 px-5 py-2 text-xs font-bold text-cyan-200">
            Quality Score: {report.overallQualityScore} / 10
          </span>
          <span className="rounded-full bg-cyan-400 text-slate-950 px-5 py-2 text-xs font-black tracking-wider border border-white animate-pulse">
            {report.certificationStatus}
          </span>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Clinical Safety Compliance ({safety}%)</h3>
          <input 
            type="range" min="80" max="100" step="1" value={safety} 
            onChange={(e) => setSafety(parseInt(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">Tingkat kepatuhan protokol keselamatan klinis berbasis bukti.</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Enterprise Security Controls</h3>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Enkripsi Data End-to-End</span>
            <button 
              onClick={() => setEncryption(!encryption)}
              className={`px-3 py-1 rounded-full font-bold ${encryption ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400' : 'bg-rose-500/20 text-rose-300 border border-rose-400'}`}
            >
              {encryption ? 'ACTIVE' : 'INACTIVE'}
            </button>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Immutabilitas Audit Trail</span>
            <button 
              onClick={() => setAuditTrail(!auditTrail)}
              className={`px-3 py-1 rounded-full font-bold ${auditTrail ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400' : 'bg-rose-500/20 text-rose-300 border border-rose-400'}`}
            >
              {auditTrail ? 'ACTIVE' : 'INACTIVE'}
            </button>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">Kepatuhan WCAG 2.2 AA (Accessibility)</span>
            <button 
              onClick={() => setWcag(!wcag)}
              className={`px-3 py-1 rounded-full font-bold ${wcag ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400' : 'bg-rose-500/20 text-rose-300 border border-rose-400'}`}
            >
              {wcag ? 'VERIFIED' : 'PENDING'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-3xl border border-cyan-400 bg-cyan-950/40 p-8 space-y-4">
        <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-widest">Manifesto Integritas Sistem PanaceaMed</h3>
        <ul className="space-y-2">
          {report.integrityManifesto.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-slate-200">
              <span className="text-cyan-400 font-bold">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="pt-4 border-t border-cyan-500/30 flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-400">
          <span>Standard: 10/10 World-Class Enterprise</span>
          <span>Panaceamed.id Core Governance</span>
        </div>
      </div>
    </div>
  )
}
export default IntegrityAuditDashboard;
