/**
 * PanaceaMed Invictus: Pritzker & Zaha Hadid Neo-Futuristic Design Tokens
 * Fluid geometry, parametric spatial flow, kinetic typography, and tactile minimalist aesthetics.
 */

export const pritzkerZahaTheme = {
  philosophy: 'Shanshui City Architecture meets Parametric Fluidity',
  typography: {
    fontFamily: 'Inter, SF Pro Display, JetBrains Mono, monospace',
    scale: {
      hero: 'text-5xl md:text-7xl font-black tracking-tighter leading-none',
      heading: 'text-2xl md:text-3xl font-extrabold tracking-tight',
      body: 'text-sm md:text-base font-light leading-relaxed',
      caption: 'text-[10px] uppercase tracking-[0.25em] font-bold text-cyan-400'
    }
  },
  geometry: {
    borderRadius: 'rounded-[2.5rem]',
    fluidCard: 'border border-cyan-500/30 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-cyan-950/40 backdrop-blur-3xl shadow-[0_0_50px_rgba(6,182,212,0.12)]',
    kineticButton: 'transition-all duration-300 hover:scale-105 active:scale-95 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]'
  },
  palette: {
    background: '#020617',
    surface: '#090d16',
    cyanGlow: '#06b6d4',
    matrixText: '#f8fafc',
    mutedText: '#94a3b8'
  }
};
