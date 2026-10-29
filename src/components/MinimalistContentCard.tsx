import React, { useState } from 'react'

export interface MinimalistCardProps {
  singleWordTitle: string;
  subtitle: string;
  symbol: string;
  detailedParagraph: string;
}

export function MinimalistContentCard({ singleWordTitle, subtitle, symbol, detailedParagraph }: MinimalistCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <article className="group relative rounded-2xl border border-cyan-500/25 bg-slate-950/90 p-5 font-mono text-slate-100 shadow-2xl backdrop-blur-2xl transition-all hover:border-cyan-400">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-950 border border-cyan-500/40 text-xl text-cyan-400">
            {symbol}
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-slate-500">{subtitle}</span>
            <h2 className="text-xl font-bold tracking-tight text-white">{singleWordTitle}</h2>
          </div>
        </div>

        {/* Minimalist Deterministic Toggle (i) */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          aria-label="Toggle details"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-950/50 text-cyan-400 text-sm font-bold transition hover:bg-cyan-400 hover:text-slate-950"
        >
          i
        </button>
      </div>

      {showDetails && (
        <div className="mt-4 border-t border-cyan-500/20 pt-3 text-xs leading-relaxed text-slate-300">
          <p>{detailedParagraph}</p>
        </div>
      )}
    </article>
  )
}
