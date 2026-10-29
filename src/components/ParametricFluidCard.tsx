import React, { useState } from 'react'

export interface ParametricCardProps {
  title: string;
  category: string;
  symbol: string;
  deepInsight: string;
}

export function ParametricFluidCard({ title, category, symbol, deepInsight }: ParametricCardProps) {
  const [active, setActive] = useState(false);

  return (
    <div className="group relative overflow-hidden rounded-[2.5rem] border border-cyan-500/20 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-cyan-950/30 p-6 backdrop-blur-3xl transition-all duration-500 hover:border-cyan-400/60 hover:shadow-[0_0_50px_rgba(6,182,212,0.15)]">
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl transition-all duration-700 group-hover:bg-cyan-400/20"></div>

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-transparent text-2xl text-cyan-300 shadow-inner transition-transform duration-500 group-hover:scale-105">
            {symbol}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/80">{category}</span>
            <h3 className="text-2xl font-black tracking-tight text-white">{title}</h3>
          </div>
        </div>

        <button
          onClick={() => setActive(!active)}
          aria-label="Toggle parametric insight"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 font-bold transition-all duration-300 hover:bg-cyan-400 hover:text-slate-950 hover:scale-110 active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
        >
          i
        </button>
      </div>

      {active && (
        <div className="relative z-10 mt-5 border-t border-cyan-500/20 pt-4 text-xs font-light leading-relaxed text-slate-300 animate-fadeIn">
          <p>{deepInsight}</p>
        </div>
      )}
    </div>
  )
}
