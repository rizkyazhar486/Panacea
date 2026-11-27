import { BatasKlaimKesehatan } from '../../../components/BatasKlaimKesehatan'
import { XRayBody } from './XRayBody'
import { scrollToSection } from './LandingHeader'

// One message, one visual, one action. The visual is the body itself (real renders, see XRayBody); no illustrated
// organs and no example numbers, because a public page must not show telemetry nobody measured.

export function HeroSection({ onMasuk }: { onMasuk: () => void }) {
  return (
    <section className="dark relative overflow-hidden bg-[#05070b] px-4 pb-12 pt-10 text-white sm:px-8 lg:pb-20 lg:pt-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_40%,rgba(34,211,238,.10),transparent_70%),radial-gradient(40%_40%_at_20%_80%,rgba(16,185,129,.08),transparent_70%)]" />
      <div className="relative mx-auto grid grid-cols-1 max-w-6xl items-center gap-8 lg:grid-cols-2 lg:gap-12">
        {/* data-pmd-unclamped: the app-wide visual-first runtime clamps headings to one line inside <main>; the hero copy is
            already short and must read in full. */}
        <div data-pmd-unclamped="true" className="text-center lg:text-left">
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-cyan-300/90">Panaceamed</p>
          <h1 className="mt-3 text-[40px] font-bold leading-[1.05] tracking-[-0.02em] text-white sm:text-[56px]" style={{ fontFamily: 'var(--font-judul)' }}>
            Satu tubuh.
            <br />
            <span className="text-slate-400">Semua data kesehatan Anda.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-[16px] leading-relaxed text-slate-300 lg:mx-0">
            Lihat tubuh Anda dalam 3D, hubungkan data harian dan rekam medis, lalu pahami artinya dalam hitungan detik.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <button
              type="button"
              onClick={onMasuk}
              className="min-h-12 rounded-full bg-white px-7 text-[15px] font-bold text-[#05070b] shadow-[0_8px_30px_rgba(255,255,255,.12)] transition hover:bg-cyan-50 active:scale-[.98]"
            >
              Mulai gratis
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('pintu')}
              // Radius/border/background stay inline on purpose: the app-wide light-theme control skin repaints any button
              // whose class names a rounded/bg-/border utility solid white, which erases a ghost button on this dark hero.
              style={{ borderRadius: 9999, border: '1px solid rgba(255,255,255,.18)', background: 'transparent' }}
              className="min-h-12 px-6 text-[15px] font-semibold text-slate-200 transition hover:text-white"
            >
              Lihat cara kerjanya
            </button>
          </div>
          <BatasKlaimKesehatan permukaan="care.landing" className="mt-6 inline-block text-[12px] text-slate-400" />
        </div>
        <XRayBody />
      </div>
    </section>
  )
}
