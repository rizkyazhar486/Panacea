import React, { useState } from 'react'

export interface MinimalistCardProps {
  singleWordTitle: string; // Satu kata utama yang mewakili
  subtitle: string;
  symbol: string;
  detailedParagraph: string; // Penjelasan lengkap di balik logo (i)
}

export function MinimalistContentCard({ singleWordTitle, subtitle, symbol, detailedParagraph }: MinimalistCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="group relative rounded-3xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-xl transition-all duration-300 hover:border-cyan-500/40 hover:bg-slate-900/80">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-2xl border border-white/10 text-cyan-300 shadow-inner">
            {symbol}
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400">{subtitle}</span>
            <h3 className="text-2xl font-bold tracking-tight text-white">{singleWordTitle}</h3>
          </div>
        </div>

        {/* Tombol Logo (i) Minimalis & Ramah Motorik */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          aria-label="Informasi selengkapnya"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-cyan-300 font-semibold transition-all hover:bg-cyan-500 hover:text-slate-950 hover:scale-110 active:scale-95"
        >
          i
        </button>
      </div>

      {/* Paragraf Tersembunyi di balik logo (i) */}
      {showDetails && (
        <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-slate-950/80 p-5 text-slate-300 text-sm leading-relaxed animate-fadeIn">
          <p>{detailedParagraph}</p>
        </div>
      )}
    </div>
  )
}
