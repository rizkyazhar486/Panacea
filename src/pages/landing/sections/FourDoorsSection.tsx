import type { ReactNode } from 'react'
import { Reveal } from '../../../components/Reveal'
import { IconHome, IconHeart, IconStethoscope, IconSparkle } from '../../../components/icons'

// The whole product is four doors onto the same person. One line each; the depth lives inside the app.

interface Pintu {
  nama: string
  ikon: ReactNode
  aksen: string
  isi: string
}

export const PINTU: readonly Pintu[] = [
  { nama: 'Home', ikon: <IconHome size={20} />, aksen: 'text-emerald-300', isi: 'Hari ini dalam satu layar: tidur, aktivitas, dan langkah berikutnya.' },
  { nama: 'Body', ikon: <IconHeart size={20} />, aksen: 'text-cyan-300', isi: 'Tubuh 3D Anda. Sentuh organ untuk melihat data dan simulasinya.' },
  { nama: 'Clinical', ikon: <IconStethoscope size={20} />, aksen: 'text-amber-200', isi: 'Rekam medis, kalkulator, dan ilmu klinis dalam satu ruang kerja.' },
  { nama: 'For You', ikon: <IconSparkle size={20} />, aksen: 'text-rose-200', isi: 'Wawasan singkat yang relevan, satu kartu dalam satu waktu.' },
]

export function FourDoorsSection() {
  return (
    <section id="pintu" className="dark scroll-mt-16 bg-[#05070b] px-4 pb-16 pt-4 text-white sm:px-8 lg:pb-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-[26px] font-bold tracking-[-0.01em] text-white sm:text-[32px]" style={{ fontFamily: 'var(--font-judul)' }}>
          Empat pintu, satu orang
        </h2>
        <ul data-pmd-unclamped="true" className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PINTU.map((p, i) => (
            <Reveal as="li" key={p.nama} delay={i * 80} className="rounded-2xl border border-white/[.08] bg-white/[.03] p-5">
              <div className={`flex items-center gap-2.5 ${p.aksen}`}>
                {p.ikon}
                <span className="text-[17px] font-bold text-white">{p.nama}</span>
              </div>
              <p className="mt-2.5 text-[14px] leading-relaxed text-slate-300">{p.isi}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
