import { useRef, useState, type ReactNode } from 'react'
import { Reveal } from './Reveal'

// Dark "Services & Prices" bento-grid section — a professional, scroll-
// reactive pricing page baked directly into the Landing page's long-scroll
// format (rather than a separate route, since the whole marketing site is
// one continuous scroll and unauthenticated visitors never leave it).
// Interactivity: cards tilt toward the pointer (subtle 3D perspective) and
// fade/rise into place via the existing scroll-reveal system.

function TiltCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    setTilt({ rx: py * -6, ry: px * 8 })
  }
  function onLeave() {
    setTilt({ rx: 0, ry: 0 })
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`group relative rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_25px_60px_-15px_rgba(0,191,99,0.35)] ${className}`}
      style={{
        transform: `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transition: 'transform 300ms cubic-bezier(0.32,0.72,0,1)',
      }}
    >
      {children}
    </div>
  )
}

function PriceLine({ label, price, note }: { label: string; price: string; note?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/10 py-2.5 last:border-0">
      <span className="text-sm text-white/70">{label}</span>
      <span className="shrink-0 text-right">
        <span className="text-sm font-extrabold text-emerald-300">{price}</span>
        {note && <span className="ml-1 text-[10px] text-white/40">{note}</span>}
      </span>
    </div>
  )
}

export function PricingSection({ onMasuk, promo }: { onMasuk: () => void; promo?: { slotsLeft: number; discountPct: number } | null }) {
  return (
    <section id="pricing" className="relative overflow-hidden px-6 py-24 sm:px-10" style={{ background: 'linear-gradient(180deg, #052E1C 0%, #0B4A2E 45%, #052E1C 100%)' }}>
      <div className="pointer-events-none absolute inset-0">
        <div className="orb absolute left-1/4 top-10 h-72 w-72 rounded-full bg-brand/15 blur-3xl" />
        <div className="orb absolute bottom-10 right-1/4 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" style={{ animationDelay: '-8s' }} />
      </div>

      <div className="relative mx-auto max-w-5xl">
        <Reveal className="text-center">
          <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-300">Transparan & Adil</span>
          <h2 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl">
            <span className="inline-flex items-center gap-3">
              Layanan
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-base sm:h-10 sm:w-10 sm:text-lg">↓</span>
            </span>
            <br />
            <span className="font-serif-display italic text-emerald-300">&amp; Harga</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/60">
            Setiap layanan berdiri sendiri — bayar hanya untuk yang Anda pakai. Tidak ada biaya tersembunyi.
          </p>
        </Reveal>

        {promo && promo.slotsLeft > 0 && (
          <Reveal delay={60}>
            <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-center text-sm font-semibold text-emerald-200">
              🎉 Diskon {promo.discountPct}% SEMUA layanan untuk {promo.slotsLeft} pendaftar berikutnya — early-bird terbatas.
            </div>
          </Reveal>
        )}

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <Reveal delay={40}>
            <TiltCard>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Konsultasi &amp; AI Klinis</div>
              <h3 className="mt-1 text-xl font-extrabold text-white">Chatbot, Konsultasi &amp; AI-EMR</h3>
              <div className="mt-4">
                <PriceLine label="AI Chatbot — anamnesis &amp; edukasi kesehatan" price="Gratis" />
                <PriceLine label="Konsultasi AI Mendalam — laporan klinis terstruktur" price="Rp49.000" note="/sesi" />
                <PriceLine label="AI-EMR + CDSS bersertifikat (klinisi/institusi)" price="Langganan" note="hubungi kami" />
              </div>
            </TiltCard>
          </Reveal>

          <Reveal delay={90}>
            <TiltCard className="ring-1 ring-emerald-400/30">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                <span className="rounded-full bg-emerald-400/20 px-2 py-0.5">Baru</span> Kalkulator Klinis
              </div>
              <h3 className="mt-1 text-xl font-extrabold text-white">34 Skor &amp; Alat Bantu Keputusan Klinis</h3>
              <p className="mt-2 text-sm text-white/60">
                APGAR, GCS, CURB-65, NIHSS, Parkland, Blood Gas, dan lainnya — standar internasional, siap pakai.
              </p>
              <div className="mt-4">
                <PriceLine label="50 pendaftar akun Panaceamed.id pertama" price="Gratis" note="selamanya" />
                <PriceLine label="Setelah kuota — bayar dari saldo PanaceaToken" price="500 PNC" />
                <PriceLine label="Setelah kuota — QRIS / VA / Kartu" price="Rp500.000" note="sekali bayar" />
              </div>
            </TiltCard>
          </Reveal>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Reveal delay={40}>
            <TiltCard>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Longevity</div>
              <h3 className="mt-1 font-extrabold text-white">Kalkulator Longevity AI</h3>
              <p className="mt-2 text-xs text-white/50">Pola makan, olahraga, hidrasi, tidur &amp; berjemur → nilai longevity personal.</p>
              <div className="mt-4">
                <PriceLine label="Langganan aktif" price="Rp299.000" note="/30 hari" />
              </div>
            </TiltCard>
          </Reveal>

          <Reveal delay={90}>
            <TiltCard>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Kronis</div>
              <h3 className="mt-1 font-extrabold text-white">Pemantauan Kronis</h3>
              <p className="mt-2 text-xs text-white/50">Pelacakan tren biomarker &amp; rekomendasi berkelanjutan untuk kondisi kronis.</p>
              <div className="mt-4">
                <PriceLine label="Bulanan" price="Rp199.000" note="/bulan" />
                <PriceLine label="Lifetime" price="Rp19.900.000" note="sekali bayar" />
              </div>
            </TiltCard>
          </Reveal>

          <Reveal delay={140}>
            <TiltCard>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Ekonomi Token</div>
              <h3 className="mt-1 font-extrabold text-white">PanaceaToken (PNC)</h3>
              <p className="mt-2 text-xs text-white/50">Satu saldo untuk konsultasi, materi kedokteran, &amp; fitur premium di seluruh platform.</p>
              <div className="mt-4">
                <PriceLine label="1 PanaceaToken" price="Rp1.000" />
                <PriceLine label="Top-up" price="Fleksibel" note="QRIS/VA/Kartu" />
              </div>
            </TiltCard>
          </Reveal>
        </div>

        <Reveal delay={80}>
          <p className="mx-auto mt-6 max-w-2xl text-center text-[11px] leading-relaxed text-white/40">
            Pusat Materi Kedokteran: harga ditentukan penulis, royalti otomatis untuk kontributor.
            Semua harga dalam Rupiah, sudah termasuk PPN yang berlaku.
          </p>
        </Reveal>

        <Reveal delay={100} className="mt-10 text-center">
          <button
            onClick={onMasuk}
            className="group inline-flex items-center gap-3 rounded-full bg-white py-2 pl-8 pr-2 font-bold text-brand-dark shadow-[0_12px_30px_-8px_rgba(0,0,0,0.5)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <span>Mulai &amp; Pilih Layanan Anda</span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-white transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:scale-105">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </span>
          </button>
        </Reveal>
      </div>
    </section>
  )
}
