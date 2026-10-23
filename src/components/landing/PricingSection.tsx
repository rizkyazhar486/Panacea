import { useRef, useState, type ReactNode } from 'react'
import { Reveal } from '../Reveal'
import { MANUAL_BANK } from '../../lib/payment'
import { BatasKlaimKesehatan } from '../BatasKlaimKesehatan'

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
    setTilt({ rx: py * -5, ry: px * 7 })
  }
  function onLeave() {
    setTilt({ rx: 0, ry: 0 })
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`group relative flex h-full flex-col rounded-3xl p-7 transition-all duration-300 ${className}`}
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
    <div className="flex items-baseline justify-between gap-3 border-b border-neutral-100 py-2.5 last:border-0 dark:border-neutral-800">
      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{label}</span>
      <span className="shrink-0 text-right">
        <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">{price}</span>
        {note && <span className="ml-1 text-[10px] text-neutral-500 dark:text-neutral-400">{note}</span>}
      </span>
    </div>
  )
}

function Check({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-200">
      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-100 text-[10px] font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        ✓
      </span>
      <span>{children}</span>
    </li>
  )
}

type Tier = {
  name: string
  badge?: string
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
      <>Anamnesis AI &amp; edukasi kesehatan berbasis bukti</>,
      <>Komunitas Hidup Sehat, Radar Faskes GPS &amp; Darurat SOS</>,
      <>Akses Kalkulator Klinis standar (skoring awal)</>,
    ],
  },
  {
    name: 'Plus',
    badge: 'Paling Populer',
    tagline: 'Wawasan longevity personal bertenaga AI',
    price: 'Rp49.000',
    note: '/bulan',
    highlight: true,
    features: [
      <>Seluruh fitur pada paket Gratis</>,
      <>Kalkulator AI Longevity — estimasi nutrisi, aktivitas, tidur &amp; paparan sinar</>,
      <>2× Sesi Konsultasi AI Mendalam per bulan</>,
      <>Akses penuh 34 Skoring &amp; Kalkulator Klinis Terstandar</>,
    ],
  },
  {
    name: 'Profesional',
    tagline: 'Pemantauan komprehensif & kondisi kronis',
    price: 'Rp199.000',
    note: '/bulan',
    features: [
      <>Seluruh fitur pada paket Plus</>,
      <>Pemantauan Kronis — tren biomarker &amp; evaluasi berkala</>,
      <>Konsultasi AI mendalam tanpa batas frekuensi</>,
      <>Dukungan prioritas &amp; ringkasan terstruktur untuk dokter</>,
    ],
  },
]

export function PricingSection({ onMasuk, promo }: { onMasuk: () => void; promo?: { slotsLeft: number; discountPct: number } | null }) {
  return (
    <>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />
      <section
        id="pricing"
        className="relative overflow-hidden bg-gradient-to-b from-[#f8faf9] via-white to-[#f4f7f5] px-6 py-24 dark:border-white/5 dark:from-[#030d07] dark:via-[#05140b] dark:to-[#030d07] sm:px-10"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="orb absolute left-1/4 top-10 h-72 w-72 rounded-full bg-emerald-100/50 blur-3xl dark:bg-emerald-900/10" />
          <div className="orb absolute bottom-10 right-1/4 h-72 w-72 rounded-full bg-brand-50/60 blur-3xl dark:bg-brand-950/10" style={{ animationDelay: '-8s' }} />
        </div>

        <div className="relative mx-auto max-w-5xl">
          <Reveal className="text-center">
            <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50/90 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-950/70 dark:text-emerald-300">
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">03</span>
              <span className="h-2 w-px bg-emerald-300 dark:bg-emerald-700" />
              <span>Tarif &amp; Layanan Berlangganan</span>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-800 backdrop-blur-md dark:border-emerald-500/30 dark:bg-emerald-950/60 dark:text-emerald-300">
                Tarif Transparan &amp; Terjangkau
              </span>
            </div>
            <h2 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight text-neutral-900 dark:text-white sm:text-6xl">
              <span className="inline-flex items-center gap-3">
                Layanan
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-100 text-base text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 sm:h-10 sm:w-10 sm:text-lg">↓</span>
              </span>
              <br />
              <span className="font-serif-display italic text-brand-dark dark:text-emerald-400">&amp; Tarif Berlangganan</span>
            </h2>
          <div className="mx-auto mt-4 max-w-xl text-left">
            <BatasKlaimKesehatan
              permukaan="care.pricing"
              className="mt-0 text-[11px] leading-snug text-neutral-500 dark:text-neutral-400"
            />
          </div>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-300 sm:text-base">
            Tiga opsi paket terstruktur — pilih sesuai kebutuhan Anda, upgrade atau sesuaikan kapan saja tanpa komitmen tersembunyi.
          </p>
        </Reveal>

        {promo && promo.slotsLeft > 0 && (
          <Reveal delay={60}>
            <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-emerald-500/30 bg-emerald-50/90 px-5 py-3.5 text-center text-sm font-semibold text-emerald-900 shadow-sm backdrop-blur-md dark:border-emerald-500/30 dark:bg-emerald-950/70 dark:text-emerald-200">
              <span className="mr-2 inline-block rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white">Penawaran Terbatas</span>
              Potongan <b>{promo.discountPct}%</b> untuk SEMUA paket bagi <b>{promo.slotsLeft}</b> pendaftar pertama.
            </div>
          </Reveal>
        )}

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {TIERS.map((t, i) => (
            <Reveal key={t.name} delay={40 + i * 50}>
              <TiltCard
                className={
                  t.highlight
                    ? 'border-2 border-emerald-500 bg-gradient-to-b from-emerald-50/50 via-white to-white shadow-xl shadow-emerald-500/10 ring-4 ring-emerald-500/10 dark:from-emerald-950/30 dark:via-neutral-900 dark:to-neutral-900 dark:border-emerald-500'
                    : 'border border-neutral-200/80 bg-white shadow-sm hover:border-emerald-500/40 hover:shadow-xl dark:border-white/10 dark:bg-neutral-900'
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
                    {t.name}
                  </div>
                  {t.highlight && (
                    <span className="rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                      {t.badge ?? 'Paling Populer'}
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-xl font-extrabold text-neutral-900 dark:text-white">{t.tagline}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className={`text-4xl font-black ${t.highlight ? 'text-emerald-700 dark:text-emerald-400' : 'text-neutral-900 dark:text-white'}`}>
                    {t.price}
                  </span>
                  {t.note && <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">{t.note}</span>}
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {t.features.map((f, fi) => <Check key={fi}>{f}</Check>)}
                </ul>
                <button
                  onClick={onMasuk}
                  className={`mt-7 w-full rounded-full py-3.5 text-sm font-extrabold transition-all duration-300 shadow-md ${
                    t.highlight
                      ? 'bg-gradient-to-b from-[#00BF63] to-[#0b7a4b] text-white shadow-emerald-500/25 hover:brightness-105 active:scale-[0.98]'
                      : 'border border-neutral-300 bg-neutral-100 text-neutral-800 hover:bg-neutral-200 active:scale-[0.98] dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100'
                  }`}
                >
                  {t.name === 'Gratis' ? 'Mulai Gratis Sekarang' : `Pilih Paket ${t.name}`}
                </button>
              </TiltCard>
            </Reveal>
          ))}
        </div>

        <Reveal delay={60}>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <TiltCard className="border border-neutral-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-800 font-extrabold dark:bg-emerald-950 dark:text-emerald-300">Baru</span> Kalkulator Klinis — Akses Sekali Bayar
              </div>
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                34 skor klinis berstandar internasional &amp; alat bantu keputusan (APGAR, GCS, CURB-65, NIHSS, Parkland, Analisa Gas Darah, dll) — bagi pengguna yang memilih tanpa langganan bulanan.
              </p>
              <div className="mt-4 space-y-1">
                <PriceLine label="Bayar dengan saldo PanaceaToken" price="500 PNC" />
                <PriceLine label="Ekuivalen transfer bank" price="Rp500.000" note="sekali bayar, akses seumur hidup" />
              </div>
            </TiltCard>
            <TiltCard className="border border-neutral-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">Pemantauan Kronis — Opsi Akun Seumur Hidup</div>
              <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                Pilihan optimal bagi pasien dengan pemantauan jangka panjang yang menghendaki satu kali pembayaran tanpa renewal bulanan.
              </p>
              <div className="mt-4 space-y-1">
                <PriceLine label="Pemantauan Kronis Seumur Hidup" price="Rp19.900.000" note="sekali bayar" />
                <PriceLine label="1 PanaceaToken (PNC)" price="Rp1.000" note="isi ulang fleksibel" />
              </div>
            </TiltCard>
          </div>
        </Reveal>

        {/* Elevated Integrated Payment Gateway Deck */}
        <Reveal delay={70}>
          <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-3xl border border-neutral-200/80 bg-gradient-to-b from-white to-neutral-50/90 p-6 sm:p-8 text-center shadow-lg dark:border-white/10 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Gerbang Pembayaran Resmi Terintegrasi
              </span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">⚡ Transaksi terverifikasi otomatis dalam 10 detik</span>
            </div>

            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Mendukung Pembayaran Aman via Multi-Channel Resmi:
            </p>

            {/* Badges for: QRIS · BCA · Mandiri · BNI · GoPay · Kartu Kredit */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {['QRIS', 'BCA', 'Mandiri', 'BNI', 'GoPay', 'Kartu Kredit'].map((method) => (
                <span
                  key={method}
                  className="rounded-xl border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-extrabold text-neutral-800 shadow-sm transition hover:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                >
                  {method}
                </span>
              ))}
            </div>

            <div className="mt-6 inline-flex flex-col items-center rounded-2xl border border-emerald-500/20 bg-emerald-50/70 px-6 py-4 dark:border-emerald-500/30 dark:bg-emerald-950/40 sm:px-8">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Rekening Resmi Panaceamed Platform</div>
              <div className="mt-1 text-xl font-black tracking-wider text-emerald-800 dark:text-emerald-300 sm:text-2xl">
                {MANUAL_BANK.bank} · {MANUAL_BANK.number}
              </div>
              <div className="mt-1 text-xs text-neutral-700 dark:text-neutral-200">
                Atas Nama: <b className="text-neutral-900 dark:text-white">{MANUAL_BANK.holder}</b> <span className="text-neutral-500 dark:text-neutral-400">(PT Panacea Digital Nusantara)</span>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
              Setiap transaksi diproteksi enkripsi 256-bit SSL. Saldo PanaceaToken atau langganan aktif otomatis seketika setelah bukti transfer terunggah atau notifikasi QRIS terverifikasi.
            </p>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <p className="mx-auto mt-6 max-w-2xl text-center text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            AI-EMR dan dukungan keputusan klinis untuk dokter dan institusi berizin (STR/NPWP): hubungi tim kami untuk kemitraan institusi. Produk ini bukan verifikasi diagnosis final sepihak tanpa klinisi.
            Medical Materials Hub: harga ditentukan oleh penulis, royalti dibayarkan otomatis ke kontributor.
            Semua harga dalam mata uang Rupiah Indonesia (IDR), sudah termasuk PPN yang berlaku.
          </p>
        </Reveal>
        </div>
      </section>
    </>
  )
}
