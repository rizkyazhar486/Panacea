import React, { useState } from 'react'

export interface AccessibleCardProps {
  singleWordTitle: string; // Satu kata utama yang mewakili (e.g. "Jantung", "Napas", "Sehat")
  iconSymbol: string;     // Representasi visual/ikon
  summaryText: string;    // Penjelasan ringkas yang tersembunyi di balik tombol (i)
  category: string;
}

export function AccessibleCognitiveCard({ singleWordTitle, iconSymbol, summaryText, category }: AccessibleCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5 text-white shadow-lg transition-all hover:border-cyan-400">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-2xl">
            {iconSymbol}
          </span>
          <div>
            <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">{category}</span>
            <h3 className="text-2xl font-black tracking-tight">{singleWordTitle}</h3>
          </div>
        </div>
        
        {/* Tombol Logo (i) dengan ukuran sentuh besar dan ramah motorik */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Informasi selengkapnya"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-cyan-300 font-bold text-lg transition hover:bg-cyan-500 hover:text-slate-950 hover:scale-105 active:scale-95"
        >
          i
        </button>
      </div>

      {/* Paragraf / Penjelasan yang disembunyikan di balik logo (i) */}
      {isOpen && (
        <div className="mt-4 rounded-xl bg-slate-950/70 p-4 border border-cyan-500/20 text-slate-200 text-sm leading-relaxed animate-fadeIn">
          <p>{summaryText}</p>
        </div>
      )}
    </div>
  )
}
