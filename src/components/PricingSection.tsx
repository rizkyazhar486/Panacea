import { useRef, useState, type ReactNode } from 'react'
import { Reveal } from './Reveal'
import { MANUAL_BANK } from '../lib/payment'

// Dark "Services & Prices" bento-grid section — a professional, scroll-
// reactive pricing page baked directly into the Landing page's long-scroll
// format (rather than a separate route, since the whole marketing site is
// one continuous scroll and unauthenticated visitors never leave it).
// Interactivity: cards tilt toward the pointer (subtle 3D perspective) and
// fade/rise into place via the existing scroll-reveal system.
//
// Tier pricing is benchmarked against direct competitors: Halodoc/Alodokter
// charge ~Rp25.000-51.000 per single consult session (promo-driven), while
// international longevity memberships (Superpower $199/yr, Function Health
// $365/yr, Fountain Life from $595/yr) bundle diagnostics/coaching into one
// flat annual fee rather than selling features à la carte. Plus/Pro below
// mirror that bundled-value model instead of pricing each tool separately.

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
      className={`group relative flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_25px_60px_-15px_rgba(0,191,99,0.35)] ${className}`}
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

function Check({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm text-white/75">
      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-400/20 text-[10px] text-emerald-300">✓</span>
      {children}
    </li>
  )
}

type Tier = {
  name: string
  tagline: string
  price: string
  note?: string
  features: ReactNode[]
  highlight?: boolean
}

const TIERS: Tier[] = [
  {
    name: 'Gratis',
    tagline: 'Untuk semua orang, selamanya',
    price: 'Rp0',
    features: [
      <>AI Chatbot — anamnesis &amp; edukasi kesehatan</>,
      <>Community, GPS Faskes &amp; SOS darurat</>,
      <>Kalkulator Klinis — gratis untuk 50 pendaftar pertama</>,
    ],
  },
  {
    name: 'Plus',
    tagline: 'Nilai longevity personal, bertenaga AI',
    price: 'Rp49.000',
    note: '/bulan',
    highlight: true,
    features: [
      <>Semua di paket Gratis</>,
      <>Kalkulator Longevity AI — pola makan, olahraga, tidur &amp; berjemur</>,
      <>2× Konsultasi AI Mendalam per bulan (senilai Rp98.000)</>,
      <>Akses penuh Kalkulator Klinis (di luar kuota gratis)</>,
    ],
  },
  {
    name: 'Pro',
    tagline: 'Untuk kondisi kronis & pemantauan berkelanjutan',
    price: 'Rp199.000',
    note: '/bulan',
    features: [
      <>Semua di paket Plus</>,
      <>Pemantauan Kronis — tren biomarker &amp; rekomendasi berkelanjutan</>,
      <>Konsultasi AI Mendalam tanpa batas</>,
      <>Dukungan prioritas</>,
    ],
  },
]

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
            Tiga paket sederhana — pilih sesuai kebutuhan, naik atau turun kapan saja.
          </p>
        </Reveal>

        {promo && promo.slotsLeft > 0 && (
          <Reveal delay={60}>
            <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-center text-sm font-semibold text-emerald-200">
              🎉 Diskon {promo.discountPct}% SEMUA paket untuk {promo.slotsLeft} pendaftar berikutnya — early-bird terbatas.
            </div>
          </Reveal>
        )}

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {TIERS.map((t, i) => (
            <Reveal key={t.name} delay={40 + i * 50}>
              <TiltCard className={t.highlight ? 'ring-1 ring-emerald-400/30' : ''}>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                  {t.highlight && <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-emerald-300">Paling populer</span>}
                  {t.name}
                </div>
                <h3 className="mt-1 text-xl font-extrabold text-white">{t.tagline}</h3>
                <div className="mt-3">
                  <span className="text-3xl font-black text-white">{t.price}</span>
                  {t.note && <span className="ml-1 text-sm text-white/40">{t.note}</span>}
                </div>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {t.features.map((f, fi) => <Check key={fi}>{f}</Check>)}
                </ul>
                <button
                  onClick={onMasuk}
                  className={`mt-6 w-full rounded-full py-3 text-sm font-bold transition ${
                    t.highlight ? 'bg-emerald-400 text-brand-dark hover:brightness-105' : 'bg-white/10 text-white hover:bg-white/15'
                  }`}
                >
                  {t.name === 'Gratis' ? 'Mulai Gratis' : `Pilih ${t.name}`}
                </button>
              </TiltCard>
            </Reveal>
          ))}
        </div>

        <Reveal delay={60}>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <TiltCard>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-emerald-300">Baru</span> Kalkulator Klinis — akses sekali bayar
              </div>
              <p className="mt-2 text-sm text-white/60">
                34 skor &amp; alat bantu keputusan klinis standar internasional (APGAR, GCS, CURB-65, NIHSS, Parkland, Blood Gas, dan lainnya) — untuk yang tidak ingin berlangganan bulanan.
              </p>
              <div className="mt-4">
                <PriceLine label="Bayar dari saldo PanaceaToken" price="500 PNC" />
                <PriceLine label="Setara transfer bank" price="Rp500.000" note="sekali bayar, seumur akun" />
              </div>
            </TiltCard>
            <TiltCard>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Kronis — opsi seumur akun</div>
              <p className="mt-2 text-sm text-white/60">
                Untuk pasien yang ingin melunasi sekali dibanding berlangganan Pro bertahun-tahun.
              </p>
              <div className="mt-4">
                <PriceLine label="Pemantauan Kronis Lifetime" price="Rp19.900.000" note="sekali bayar" />
                <PriceLine label="1 PanaceaToken (PNC)" price="Rp1.000" note="top-up fleksibel" />
              </div>
            </TiltCard>
          </div>
        </Reveal>

        <Reveal delay={70}>
          <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-white/15 bg-white/[0.06] px-6 py-4 text-center backdrop-blur-sm">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">Cara Pembayaran</div>
            <p className="mt-1.5 text-sm text-white/70">
              Semua pembayaran via <b className="text-white">transfer bank</b> ke rekening resmi:
            </p>
            <div className="mt-2 text-base font-black text-white">{MANUAL_BANK.bank} · {MANUAL_BANK.number}</div>
            <div className="text-xs text-white/60">a.n. {MANUAL_BANK.holder}</div>
            <p className="mt-1.5 text-[11px] text-white/45">Unggah bukti transfer di aplikasi — saldo diverifikasi &amp; ditambahkan oleh tim kami.</p>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <p className="mx-auto mt-6 max-w-2xl text-center text-[11px] leading-relaxed text-white/40">
            AI-EMR + CDSS bersertifikat untuk klinisi/institusi: hubungi kami untuk harga langganan.
            Pusat Materi Kedokteran: harga ditentukan penulis, royalti otomatis untuk kontributor.
            Semua harga dalam Rupiah, sudah termasuk PPN yang berlaku.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
