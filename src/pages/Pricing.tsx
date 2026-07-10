import { useNavigate } from 'react-router-dom'
import { Card, SectionTitle, Badge, Button } from '../components/ui'
import { IconWallet, IconStethoscope, IconHeart } from '../components/icons'
import { MANUAL_BANK } from '../lib/payment'

// In-app pricing page (mirrors the public landing page's "Layanan & Harga"
// section, but for already-logged-in users browsing under Layanan). Each
// tier links to the concrete feature that actually carries its price today
// — there's no separate "subscribe to Plus/Pro" billing flow yet, so this
// routes people to Nutrition (Longevity sub), Billing (chronic sub), and
// Clinical Calculators (its own paywall) rather than promising a purchase
// button this page can't fulfill.
type Tier = {
  name: string
  tagline: string
  price: string
  note?: string
  features: string[]
  cta: string
  to: string
  highlight?: boolean
}

const TIERS: Tier[] = [
  {
    name: 'Gratis',
    tagline: 'Untuk semua orang, selamanya',
    price: 'Rp0',
    features: [
      'AI Chatbot — anamnesis & edukasi kesehatan',
      'Community, GPS Faskes & SOS darurat',
      'Kalkulator Klinis — gratis untuk 50 pendaftar pertama',
    ],
    cta: 'Mulai di Beranda',
    to: '/',
  },
  {
    name: 'Plus',
    tagline: 'Nilai longevity personal, bertenaga AI',
    price: 'Rp49.000',
    note: '/bulan',
    highlight: true,
    features: [
      'Semua di paket Gratis',
      'Kalkulator Longevity AI — pola makan, olahraga, tidur & berjemur',
      '2× Konsultasi AI Mendalam per bulan (senilai Rp98.000)',
      'Akses penuh Kalkulator Klinis (di luar kuota gratis)',
    ],
    cta: 'Langganan di Nutrisi',
    to: '/nutrition',
  },
  {
    name: 'Pro',
    tagline: 'Untuk kondisi kronis & pemantauan berkelanjutan',
    price: 'Rp199.000',
    note: '/bulan',
    features: [
      'Semua di paket Plus',
      'Pemantauan Kronis — tren biomarker & rekomendasi berkelanjutan',
      'Konsultasi AI Mendalam tanpa batas',
      'Dukungan prioritas',
    ],
    cta: 'Langganan di Billing',
    to: '/billing',
  },
]

export function Pricing() {
  const navigate = useNavigate()
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <SectionTitle icon={<IconWallet size={20} />} title="Layanan & Harga" subtitle="Tiga paket sederhana — pilih sesuai kebutuhan, naik atau turun kapan saja" />

      <div className="grid gap-4">
        {TIERS.map((t) => (
          <Card key={t.name} className={t.highlight ? '!border-brand ring-1 ring-brand/30' : ''}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-ink">{t.name}</h3>
                  {t.highlight && <Badge tone="brand">Paling populer</Badge>}
                </div>
                <p className="mt-0.5 text-sm text-neutral-500">{t.tagline}</p>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xl font-black text-ink">{t.price}</div>
                {t.note && <div className="text-[11px] text-neutral-400">{t.note}</div>}
              </div>
            </div>
            <ul className="mt-3 space-y-1.5">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13px] text-neutral-600">
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-brand-50 text-[10px] text-brand-dark">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Button className="mt-4 w-full" variant={t.highlight ? 'primary' : 'outline'} onClick={() => navigate(t.to)}>
              {t.cta}
            </Button>
          </Card>
        ))}
      </div>

      <Card className="!border-brand/20">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-brand-dark">
          <IconStethoscope size={14} /> Kalkulator Klinis — akses sekali bayar
        </div>
        <p className="mt-2 text-sm text-neutral-600">
          34 skor & alat bantu keputusan klinis standar internasional — untuk yang tidak ingin berlangganan bulanan.
        </p>
        <div className="mt-3 flex items-center justify-between border-b border-neutral-100 py-2 text-sm">
          <span className="text-neutral-500">Bayar dari saldo PanaceaToken</span>
          <span className="font-extrabold text-brand-dark">500 PNC</span>
        </div>
        <div className="flex items-center justify-between py-2 text-sm">
          <span className="text-neutral-500">Setara transfer bank</span>
          <span className="font-extrabold text-brand-dark">Rp500.000</span>
        </div>
        <Button className="mt-3 w-full" variant="outline" onClick={() => navigate('/clinical-calculators')}>Buka Kalkulator Klinis</Button>
      </Card>

      <Card className="!border-neutral-100">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
          <IconHeart size={14} /> Kronis — opsi seumur akun
        </div>
        <div className="mt-3 flex items-center justify-between py-2 text-sm">
          <span className="text-neutral-500">Pemantauan Kronis Lifetime</span>
          <span className="font-extrabold text-ink">Rp19.900.000</span>
        </div>
        <div className="flex items-center justify-between border-t border-neutral-100 py-2 text-sm">
          <span className="text-neutral-500">1 PanaceaToken (PNC)</span>
          <span className="font-extrabold text-ink">Rp1.000</span>
        </div>
      </Card>

      <Card className="!border-brand/20 bg-brand-50/50">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-brand-dark">
          <IconWallet size={14} /> Cara Pembayaran
        </div>
        <p className="mt-2 text-sm text-neutral-600">
          Semua pembayaran melalui <b>transfer bank</b> ke rekening resmi Panaceamed.id:
        </p>
        <div className="mt-3 rounded-xl bg-white p-4">
          <div className="text-sm font-black text-ink">{MANUAL_BANK.bank}</div>
          <div className="mt-0.5 text-lg font-black tracking-wide text-brand-dark">{MANUAL_BANK.number}</div>
          <div className="text-xs text-neutral-500">a.n. {MANUAL_BANK.holder}</div>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
          Setelah transfer, unggah bukti di halaman Billing — saldo PNC ditambahkan setelah bukti diverifikasi (1 PNC = Rp1.000).
        </p>
        <Button className="mt-3 w-full" variant="outline" onClick={() => navigate('/billing')}>Isi Saldo di Billing</Button>
      </Card>

      <p className="text-center text-[11px] leading-relaxed text-neutral-400">
        AI-EMR + CDSS bersertifikat untuk klinisi/institusi: hubungi kami untuk harga langganan.
        Pusat Materi Kedokteran: harga ditentukan penulis, royalti otomatis untuk kontributor.
      </p>
    </div>
  )
}

export default Pricing
