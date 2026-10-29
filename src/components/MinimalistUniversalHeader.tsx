import React from 'react'

export interface MinimalistHeaderProps {
  title: string;
  category: string;
  onInfoToggle?: () => void;
}

export function MinimalistUniversalHeader({ title, category }: MinimalistHeaderProps) {
  return (
    <header className="mb-8 flex items-center justify-between border-b border-white/10 pb-6">
      <div>
        <span className="text-xs font-semibold tracking-widest uppercase text-cyan-400">{category}</span>
        <h1 className="mt-1 text-3xl font-light tracking-tight text-white">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-cyan-500/30 bg-cyan-950/30 px-3 py-1 text-xs text-cyan-300 backdrop-blur-md">
          Minimalist Easy Mode
        </span>
      </div>
    </header>
  )
}
