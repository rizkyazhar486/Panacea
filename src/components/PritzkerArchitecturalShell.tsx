import React, { useState } from 'react'
import { pritzkerZahaTheme } from '../styles/pritzkerZahaTheme'

export interface ArchitecturalShellProps {
  title: string;
  subtitle: string;
  symbol: string;
  architecturalInsight: string;
}

export function PritzkerArchitecturalShell({ title, subtitle, symbol, architecturalInsight }: ArchitecturalShellProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className={`group relative overflow-hidden ${pritzkerZahaTheme.geometry.borderRadius} ${pritzkerZahaTheme.geometry.fluidCard} p-6 md:p-8 transition-all duration-500 hover:border-cyan-400/60`}>
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl transition-all duration-700 group-hover:bg-cyan-400/20"></div>

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-transparent text-3xl text-cyan-300 shadow-inner transition-transform duration-500 group-hover:scale-110">
            {symbol}
          </div>
          <div>
            <span className={pritzkerZahaTheme.typography.scale.caption}>{subtitle}</span>
            <h2 className={`${pritzkerZahaTheme.typography.scale.heading} text-white mt-1`}>{title}</h2>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          aria-label="Toggle architectural disclosure"
          className={`flex h-12 w-12 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-950/50 text-cyan-300 font-bold text-lg ${pritzkerZahaTheme.geometry.kineticButton}`}
        >
          i
        </button>
      </div>

      {expanded && (
        <div className={`relative z-10 mt-6 border-t border-cyan-500/20 pt-5 ${pritzkerZahaTheme.typography.scale.body} text-slate-300 animate-fadeIn`}>
          <p>{architecturalInsight}</p>
          <div className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-widest text-cyan-400/70">
            <span>Zaha Hadid & Shanshui Parametric Standard</span>
            <span>•</span>
            <span>Pritzker Architecture Provenance</span>
          </div>
        </div>
      )}
    </article>
  )
}
