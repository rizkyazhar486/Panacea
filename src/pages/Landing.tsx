import { useState } from 'react'
import { Wordmark } from '../components/Logo'
import { Reveal, CountUp } from '../components/Reveal'
import { InteractiveAura } from '../components/InteractiveAura'
import {
  IconChat,
  IconStore,
  IconShield,
  IconHeart,
  IconStethoscope,
  IconSparkle,
  IconUsers,
  IconCheck,
  IconSun,
  IconMoon,
  IconHospital,
  IconPill,
  IconChartUp,
} from '../components/icons'
import { getTheme, toggleTheme, type Theme } from '../lib/theme'

const FEATURES = [
  { icon: IconUsers, title: 'Dashboard Hidup Sehat', text: 'Jejaring sosial gaya Strava/TikTok: bagikan aktivitas, kebiasaan sehat & artikel longevity. Foto, video singkat, profil, bookmark.' },
  { icon: IconHeart, title: 'Kalkulator Longevity AI', text: 'Isi pola makan, olahraga, hidrasi, tidur & berjemur — AI menghitung nilai longevity Anda (langganan 30 hari).' },
  { icon: IconChat, title: 'AI Chatbot → AI-EMR', text: 'AI mewawancara pasien (SOCRATES); hasilnya mengalir otomatis ke Subjective/Objective di AI-EMR yang hanya diakses dokter.' },
  { icon: IconStethoscope, title: 'Konsultasi, Apotek & Faskes', text: 'Konsultasi via AI (Rp13.000) → rujukan dokter spesialis; apotek + tebus resep; faskes terdekat via GPS untuk darurat.' },
  { icon: IconStore, title: 'Pusat Materi Kedokteran', text: 'Temukan & bagikan catatan, jurnal, dan artikel kedokteran pilihan. Harga ditentukan penulis; PDF ber-watermark untuk keamanan kontributor.' },
  { icon: IconShield, title: 'AI-EMR Bersertifikat', text: 'Untuk klinisi & institusi bersertifikat (STR/NPWP). CDSS doctor-in-the-loop memblokir interaksi obat, alergi & kontraindikasi.' },
]

const ROLES = [
  ['Pelanggan / Pasien', 'Dashboard hidup sehat, edukasi penyakit, nutrisi & Longevity AI, konsultasi, apotek & faskes terdekat.'],
  ['Dokter', 'AI-EMR penuh (SOAP), data klinis per pasien, planning & konsultasi.'],
  ['Kontributor', 'Menulis, menjual & minta verifikasi materi kedokteran.'],
  ['Verifikator', 'Spesialis/Profesor + AI memverifikasi materi.'],
  ['Admin', 'Layanan, dukungan otomatis & kelola katalog apotek.'],
  ['Owner', 'Pindah mode akses & memantau keuntungan perusahaan.'],
]

const WHATS_NEW = [
  'Dashboard sosial "Panacea Hidup Sehat" — foto & video 30 detik, profil, repost, bookmark privat.',
  'Kalkulator Longevity bertenaga AI (langganan 30 hari, Rp125.000/bulan).',
  'Apotek dengan tebus/scan resep + Riwayat Transaksi terpadu (bisa disaring per jenis).',
  'Faskes terdekat via GPS (rumah sakit, klinik & apotek) untuk situasi darurat.',
  'Pusat Materi Kedokteran — temukan & bagikan catatan, jurnal, dan artikel pilihan dengan PanaceaToken.',
]

const STATS: { node: React.ReactNode; label: string }[] = [
  { node: <CountUp to={6} suffix=" Peran" />, label: 'Ekosistem pengguna terpadu' },
  { node: <CountUp to={100} suffix="%" />, label: 'Diverifikasi dokter (AI-in-the-loop)' },
  { node: <CountUp to={30} suffix=" Hari" />, label: 'Siklus Longevity AI' },
  { node: <span>24/7</span>, label: 'Akses & Darurat SOS' },
]

const MARQUEE = [
  { icon: IconHospital, label: 'Faskes Terdekat' },
  { icon: IconPill, label: 'Apotek Digital' },
  { icon: IconStethoscope, label: 'Konsultasi Dokter' },
  { icon: IconHeart, label: 'Longevity AI' },
  { icon: IconStore, label: 'Materi Kedokteran' },
  { icon: IconShield, label: 'AI-EMR Bersertifikat' },
  { icon: IconChartUp, label: 'Healthspan Tracking' },
]

export function Landing({ onMasuk }: { onMasuk: () => void }) {
  const [theme, setTheme] = useState<Theme>(getTheme)
  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      {/* Glass header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/5 bg-white/70 px-5 py-3 backdrop-blur-xl sm:px-8">
        <Wordmark size={36} />
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setTheme(toggleTheme())}
            className="grid h-10 w-10 place-items-center rounded-full border border-black/5 text-neutral-500 transition hover:text-brand-dark"
            title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
            aria-label="Ganti tema"
          >
            {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
          </button>
          <button
            onClick={onMasuk}
            className="rounded-full bg-gradient-to-b from-[#00BF63] to-[#0b7a4b] px-6 py-2 text-sm font-bold text-white shadow-sm transition hover:brightness-105 active:scale-95"
          >
            Masuk
          </button>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative px-4 py-12 sm:px-8 sm:py-20">
        {/* Animated atmosphere */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <InteractiveAura />
          <div className="orb absolute -left-20 top-10 h-72 w-72 rounded-full bg-brand/25 blur-3xl" />
          <div className="orb absolute right-0 top-40 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" style={{ animationDelay: '-6s' }} />
          <div className="orb absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-teal-300/20 blur-3xl" style={{ animationDelay: '-12s' }} />
          <div className="absolute inset-0 [background-image:linear-gradient(rgba(0,109,54,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(0,109,54,0.035)_1px,transparent_1px)] [background-size:44px_44px]" />
        </div>

        <div className="relative mx-auto max-w-5xl text-center">
          <Reveal>
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/60 px-4 py-1.5 shadow-sm backdrop-blur-md">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
              <span className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Longevity Medical-AI · Siap Pakai</span>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              AI-Klinik Praktis untuk
              <br />
              <span className="animate-gradient-text bg-gradient-to-r from-brand via-emerald-500 to-brand-dark bg-clip-text text-transparent">
                Akses Kesehatan Anda
              </span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-5 max-w-2xl text-neutral-600 sm:text-lg">
              AI melakukan anamnesis & edukasi; dokter memverifikasi. Memperpanjang <b>healthspan</b> — bukan
              sekadar usia — lewat penalaran klinis presisi, pencegahan dini, dan optimasi gaya hidup.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                onClick={onMasuk}
                className="group relative overflow-hidden rounded-full bg-gradient-to-b from-[#00BF63] to-[#0b7a4b] px-8 py-3.5 font-bold text-white shadow-lg shadow-brand/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand/30 active:scale-[0.98]"
              >
                <span className="relative z-10">Mulai Sekarang →</span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
              <a
                href="#about"
                className="rounded-full border border-black/10 bg-white/60 px-8 py-3.5 font-bold text-brand-dark shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white"
              >
                Pelajari Lebih Lanjut
              </a>
            </div>
          </Reveal>

          {/* Stat band — glassmorphism */}
          <Reveal delay={320}>
            <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
              {STATS.map((s, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/40 bg-white/60 p-4 shadow-[0_8px_30px_rgba(12,20,16,0.06)] backdrop-blur-xl"
                >
                  <div className="bg-gradient-to-r from-brand to-brand-dark bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">
                    {s.node}
                  </div>
                  <div className="mt-1 text-[11px] font-semibold leading-tight text-neutral-500">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
          <p className="mt-5 text-xs text-neutral-400">⚕️ AI mendukung, bukan menggantikan, klinisi berlisensi.</p>
        </div>
      </section>

      {/* Marquee strip */}
      <div className="marquee-pause relative overflow-hidden border-y border-black/5 bg-neutral-50/60 py-5 backdrop-blur">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent" />
        <div className="flex w-max animate-marquee gap-10 pr-10">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} className="flex shrink-0 items-center gap-2 text-sm font-bold text-neutral-400">
              <m.icon size={18} className="text-brand/70" /> {m.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── ABOUT / FEATURES ─────────────────────────────────── */}
      <section id="about" className="mx-auto max-w-5xl px-6 py-20 sm:px-10">
        <Reveal className="text-center">
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-dark">Tentang Kami</span>
          <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">Apa itu Panaceamed.id?</h2>
          <p className="mx-auto mt-3 max-w-3xl text-neutral-600">
            Platform <b>AI-EMR</b> sekaligus <b>pusat pengetahuan kedokteran</b>. AI melakukan anamnesis &
            analisis penunjang via chatbot, lalu mengalir ke rekam medis yang <b>diverifikasi dan ditandatangani
            dokter manusia</b>. Visi kami: <b>AI-Klinik Praktis untuk masa depan kesehatan Anda.</b>
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 90}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-white/50 bg-white/70 p-6 shadow-[0_8px_30px_rgba(12,20,16,0.05)] backdrop-blur-xl transition duration-300 hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-[0_18px_40px_rgba(0,191,99,0.16)]">
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand/10 blur-2xl transition group-hover:bg-brand/20" />
                <div className="relative flex items-start justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-dark shadow-inner">
                    <f.icon size={22} />
                  </span>
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-black/10 text-sm font-bold text-neutral-300 transition group-hover:border-brand group-hover:bg-brand group-hover:text-white">
                    →
                  </span>
                </div>
                <h3 className="relative mt-4 font-bold">{f.title}</h3>
                <p className="relative mt-1 text-sm text-neutral-500">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── ROLES ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-[#e1eae3] px-6 py-20 sm:px-10">
        <div className="orb pointer-events-none absolute right-10 top-10 h-60 w-60 rounded-full bg-brand/15 blur-3xl" />
        <div className="relative mx-auto max-w-5xl">
          <Reveal className="text-center">
            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-dark backdrop-blur">Model Bisnis</span>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">Satu platform, banyak peran</h2>
            <p className="mx-auto mt-3 max-w-2xl text-neutral-600">
              Langganan (individu & rumah sakit) + ekonomi token: pembeli deposit <b>PanaceaToken</b>,
              penulis menerima royalti, semua materi diverifikasi spesialis & AI.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ROLES.map(([t, d], i) => (
              <Reveal key={t} delay={(i % 3) * 90}>
                <div className="flex h-full items-start gap-3 rounded-2xl border border-white/50 bg-white/70 p-5 shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-md">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand"><IconUsers size={18} /></span>
                  <div>
                    <h3 className="font-bold">{t}</h3>
                    <p className="text-sm text-neutral-500">{d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT'S NEW ────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 py-20 sm:px-10">
        <Reveal className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent">
            <IconSparkle size={13} /> What's New
          </span>
          <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">Pembaruan Terbaru</h2>
        </Reveal>
        <ul className="mt-8 space-y-3">
          {WHATS_NEW.map((w, i) => (
            <Reveal key={w} as="li" delay={i * 70}>
              <div className="flex items-start gap-3 rounded-2xl border border-white/50 bg-white/70 p-4 shadow-sm backdrop-blur-xl transition hover:translate-x-1 hover:border-brand/30">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-white"><IconCheck size={16} /></span>
                <span className="text-sm text-neutral-700">{w}</span>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="px-6 pb-24 sm:px-10">
        <Reveal>
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#00BF63] to-[#0b7a4b] px-8 py-16 text-center shadow-2xl shadow-brand/30">
            <div className="orb pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/15 blur-3xl" />
            <div className="orb pointer-events-none absolute -bottom-10 -right-10 h-56 w-56 rounded-full bg-emerald-900/30 blur-3xl" style={{ animationDelay: '-8s' }} />
            <div className="relative">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Mulai perjalanan healthspan Anda</h2>
              <p className="mx-auto mt-3 max-w-xl text-white/85">
                Gratis untuk dicoba — pilih peran Anda dan rasakan AI co-physician yang diverifikasi dokter.
              </p>
              <button
                onClick={onMasuk}
                className="mt-7 rounded-full bg-white px-9 py-3.5 font-bold text-brand-dark shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]"
              >
                Masuk & Coba Sekarang
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 bg-white px-6 py-8 sm:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <Wordmark size={28} />
          <p className="text-xs text-neutral-400">
            © {new Date().getFullYear()} Panaceamed.id · Longevity Medical-AI · AI mendukung, bukan
            menggantikan, klinisi berlisensi.
          </p>
        </div>
      </footer>
    </div>
  )
}
