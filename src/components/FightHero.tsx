import type { ReactNode } from 'react'
import { WarriorMark } from './WarriorMark'
import { MetalMotto } from './MetalMotto'
import '../styles/metal.css'

// Panggung pembuka bersama untuk FitnessHub/Workout/Athlete — satu sumber
// cahaya, siluet prajurit, dan satu kalimat pendek yang menyala di tengah
// gema barisnya sendiri. Dipakai berulang supaya ketiga halaman terasa satu
// dunia, bukan tiga eksperimen berbeda.
export function FightHero({
  tag,
  title,
  motto,
  right,
}: {
  tag: string
  title: string
  motto: string
  right?: ReactNode
}) {
  return (
    <div className="metal-spotlight rounded-2xl p-5">
      <WarriorMark className="pointer-events-none absolute -right-2 bottom-0 h-full w-auto text-white/[0.05]" />
      <div className="relative flex items-start justify-between gap-3">
        <span className="metal-tag metal-gold">{tag}</span>
        {right}
      </div>
      <h2 className="relative mt-3 text-2xl font-black uppercase tracking-tight metal-emboss">{title}</h2>
      <div className="relative mt-4">
        <MetalMotto text={motto} />
      </div>
    </div>
  )
}
