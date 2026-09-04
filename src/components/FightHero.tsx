import type { ReactNode } from 'react'
import { MetalMotto } from './MetalMotto'
import '../styles/metal.css'

// Panggung pembuka bersama untuk FitnessHub/Workout/Athlete — satu sumber
// cahaya dan satu kalimat pendek yang menyala di tengah gema barisnya
// sendiri. Dipakai berulang supaya ketiga halaman terasa satu dunia, bukan
// tiga eksperimen berbeda.
//
// Dulu ada siluet "prajurit" hasil gambar garis tangan sendiri (WarriorMark)
// di sudut kanan — pengguna menyebutnya doodle dan memintanya dibuang. Sudah
// dibuang. Prop `image` di bawah adalah tempatnya nanti diisi foto/ilustrasi
// nyata (bukan gambar garis) kalau ada asetnya; sengaja opsional supaya kartu
// tetap rapi tanpa gambar sampai asetnya tersedia.
export function FightHero({
  tag,
  tagTone = 'gold',
  title,
  motto,
  subtitle,
  right,
  image,
}: {
  tag: string
  tagTone?: 'gold' | 'purple'
  title: string
  motto: string
  subtitle?: string
  right?: ReactNode
  /** URL foto/ilustrasi nyata untuk sudut kanan kartu — bukan gambar garis. */
  image?: string
}) {
  return (
    <div className="metal-spotlight rounded-2xl p-5">
      {image && (
        <img
          src={image}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-2 bottom-0 h-full w-auto object-cover object-top opacity-40"
          style={{ maskImage: 'linear-gradient(to left, black 30%, transparent 90%)', WebkitMaskImage: 'linear-gradient(to left, black 30%, transparent 90%)' }}
        />
      )}
      <div className="relative flex items-start justify-between gap-3">
        <span className={`metal-tag ${tagTone === 'purple' ? 'metal-purple' : 'metal-gold'}`}>{tag}</span>
        {right}
      </div>
      <h2 className="metal-display relative mt-3 text-2xl uppercase tracking-tight metal-emboss">{title}</h2>
      <div className="relative mt-4">
        <MetalMotto text={motto} />
      </div>
      {subtitle && <p className="relative mt-2 text-center text-[13px] font-semibold text-white/70">{subtitle}</p>}
    </div>
  )
}
