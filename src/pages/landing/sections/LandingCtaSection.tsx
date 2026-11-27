import { Reveal } from '../../../components/Reveal'
import { IconCheck } from '../../../components/icons'
import { IconArrowRight } from '../landingSvgs'

interface LandingCtaSectionProps {
  onMasuk: () => void
}

export function LandingCtaSection({ onMasuk }: LandingCtaSectionProps) {
  return (
    <section className="px-6 pb-20 sm:px-10">
      <Reveal>
        <div className="dark relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#00BF63] via-[#0b7a4b] to-[#043d24] px-8 py-16 text-center shadow-2xl shadow-brand/30">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/25" />
          <div className="relative">
            <h2 className="text-3xl font-extrabold text-white sm:text-5xl tracking-tight">
              Mulai Perjalanan <span className="font-serif-display italic drop-shadow-md" style={{ color: '#fef08a' }}>Kesehatan &amp; Usia Produktif</span> Anda
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-emerald-100 sm:text-base leading-relaxed">
              Mulai gratis — jelajahi anamnesis terstruktur berbasis AI dengan verifikasi dan pengawasan dokter berizin.
            </p>
            <button
              type="button"
              onClick={onMasuk}
              className="cta-banner-btn group mt-8 inline-flex items-center gap-3 rounded-full py-3.5 pl-8 pr-3 font-extrabold shadow-2xl transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]"
              style={{
                backgroundColor: '#ffffff',
                backgroundImage: 'none',
                color: '#052e16',
                boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.8)',
              }}
            >
              <span className="text-base font-black tracking-tight" style={{ color: '#052e16' }}>
                Mulai Gratis Sekarang
              </span>
              <span
                className="cta-arrow-circle grid h-9 w-9 place-items-center rounded-full text-white transition-transform duration-300 group-hover:translate-x-1"
                style={{ backgroundColor: '#059669', color: '#ffffff' }}
              >
                <IconArrowRight size={16} stroke="#ffffff" />
              </span>
            </button>

            {/* Trust & compliance reassurance */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-emerald-100">
              <span className="flex items-center gap-1.5">
                <IconCheck size={14} className="text-emerald-300" /> Akses Evaluasi Mandiri Tanpa Biaya
              </span>
              <span className="flex items-center gap-1.5">
                <IconCheck size={14} className="text-emerald-300" /> Kepatuhan UU PDP No. 27/2022
              </span>
              <span className="flex items-center gap-1.5">
                <IconCheck size={14} className="text-emerald-300" /> Standar HL7® FHIR Kemenkes
              </span>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
