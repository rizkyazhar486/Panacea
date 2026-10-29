import React from 'react'
import { MinimalistUniversalHeader } from '../../components/MinimalistUniversalHeader'
import { MinimalistContentCard } from '../../components/MinimalistContentCard'

export function UniformMinimalistPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <MinimalistUniversalHeader 
          category="PanaceaMed Omega Unified" 
          title="Pusat Pemahaman Tubuh Manusia" 
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MinimalistContentCard
            subtitle="Sistem Kardiovaskular"
            singleWordTitle="Jantung"
            symbol="🫀"
            detailedParagraph="Jantung adalah otot hebat di dada yang tidak pernah berhenti memompa darah bersih ke seluruh tubuh agar kita tetap bertenaga dan hidup sehat."
          />
          <MinimalistContentCard
            subtitle="Sistem Respirasi"
            singleWordTitle="Napas"
            symbol="🫁"
            detailedParagraph="Paru-paru mengambil udara segar saat kita menarik napas dan mengeluarkan sisa udara saat kita mengembuskan napas dengan tenang."
          />
          <MinimalistContentCard
            subtitle="Sistem Saraf & Otak"
            singleWordTitle="Pikir"
            symbol="🧠"
            detailedParagraph="Otak adalah pusat kendali tubuh yang membantu kita berpikir, merasakann kebahagiaan, belajar hal baru, dan menggerakkan tubuh."
          />
          <MinimalistContentCard
            subtitle="Sistem Energi Seluler"
            singleWordTitle="Energi"
            symbol="⚡"
            detailedParagraph="Mitochondria di dalam sel memproses makanan dan oksigen menjadi tenaga murni yang membuat sel-sel tubuh tetap kuat dan terlindungi."
          />
        </div>
      </div>
    </div>
  )
}
export default UniformMinimalistPage;
