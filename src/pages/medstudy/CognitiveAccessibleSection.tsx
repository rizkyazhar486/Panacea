import React from 'react'
import { AccessibleCognitiveCard } from '../../components/AccessibleCognitiveCard'

export function CognitiveAccessibleSection() {
  return (
    <div className="mt-6 space-y-4 rounded-3xl border border-cyan-500/30 bg-cyan-950/10 p-6 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div>
          <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-300">Inclusive Accessibility Mode</span>
        </div>
        <span className="text-xs text-slate-400">Easy Read & Cognitive Support</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AccessibleCognitiveCard
          category="Kardiovaskular"
          singleWordTitle="Jantung"
          iconSymbol="🫀"
          summaryText="Jantung adalah organ otot yang memompa darah ke seluruh tubuh untuk membawa oksigen dan makanan agar tubuh tetap kuat dan hidup."
        />
        <AccessibleCognitiveCard
          category="Respirasi"
          singleWordTitle="Napas"
          iconSymbol="🫁"
          summaryText="Paru-paru memasukkan udara bersih (oksigen) saat kita menarik napas dan membuang udara kotor saat kita mengembuskan napas."
        />
      </div>
    </div>
  )
}
