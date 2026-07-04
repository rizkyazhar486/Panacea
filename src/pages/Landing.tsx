import { useState, useEffect } from 'react'
import { api, backendEnabled, type Health } from '../lib/api'
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
import { MedicalNews } from '../components/MedicalNews'

const FEATURES = [
  { icon: IconUsers, title: 'Dashboard Hidup Sehat', text: 'Jejaring sosial gaya Strava/TikTok: bagikan aktivitas, kebiasaan sehat & artikel longevity. Foto, video singkat, profil, bookmark.' },
  { icon: IconHeart, title: 'Kalkulator Longevity AI', text: 'Isi pola makan, olahraga, hidrasi, tidur & berjemur — AI menghitung nilai longevity Anda (langganan 30 hari).' },
  { icon: IconChat, title: 'AI Chatbot → AI-EMR', text: 'AI mewawancara pasien (SOCRATES); hasilnya mengalir otomatis ke Subjective/Objective di AI-EMR yang hanya diakses dokter.' },
  { icon: IconStethoscope, title: 'Konsultasi, Apotek & Faskes', text: 'Konsultasi via AI (Rp49.000) → rujukan dokter spesialis; apotek + tebus resep; faskes terdekat via GPS untuk darurat.' },
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
  'Kalkulator Longevity bertenaga AI (langganan 30 hari, Rp299.000/bulan).',
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

// ── Sejarah longevity, anti-aging, wellness & sistem kesehatan ──────────────
const HISTORY_ERAS: { era: string; when: string; emoji: string; title: string; body: string }[] = [
  { era: 'Mesir Kuno', when: '≈3000–300 SM', emoji: '𓂀', title: 'Firaun & Papirus Kedokteran',
    body: 'Papirus Edwin Smith & Ebers mencatat resep, bedah, dan higiene. Firaun memburu keabadian lewat mumifikasi; imhotep dihormati sebagai tabib. Kosmetik & minyak (moringa, madu) jadi anti-aging pertama.' },
  { era: 'Zaman Para Nabi', when: '≈2000 SM–632 M', emoji: '☾', title: 'Tradisi Kenabian & Higiene',
    body: 'Ajaran kenabian menekankan wudu/kebersihan, puasa berkala, madu & habbatussauda, makan secukupnya ("sepertiga makanan, sepertiga minum, sepertiga napas"). Prinsip pencegahan & moderasi ini sejalan dengan sains longevity modern.' },
  { era: 'Yunani–Romawi', when: '≈500 SM–500 M', emoji: '🏛️', title: 'Hippokrates & Galen',
    body: 'Hippokrates: "biarkan makanan jadi obatmu" & Sumpah Hippokrates (etika medis). Galen sistematisasi fisiologi. Romawi membangun aqueduct, pemandian, & sanitasi publik — sistem kesehatan masyarakat pertama.' },
  { era: 'Dinasti Tiongkok', when: '≈200 SM–1912 M', emoji: '🐉', title: 'Qi, Herbal & Elixir Panjang Umur',
    body: 'Huangdi Neijing meletakkan dasar TCM. Kaisar mencari "elixir keabadian" (ironisnya sebagian mengandung merkuri). Qigong, akupunktur, ginseng, & keseimbangan yin-yang: pendekatan holistik healthspan.' },
  { era: 'Kekaisaran Mongol', when: '≈1206–1368 M', emoji: '🏹', title: 'Kedokteran Lintas Budaya',
    body: 'Pax Mongolica menghubungkan tabib Persia, Tiongkok, & Arab di Jalur Sutra — pertukaran ilmu bedah, farmasi, & karantina. Rumah sakit keliling & standar kebugaran prajurit jadi bentuk awal "performance medicine".' },
  { era: 'Keemasan Islam', when: '≈800–1300 M', emoji: '⚕️', title: 'Ibnu Sina & Rumah Sakit (Bimaristan)',
    body: 'Al-Qanun (Canon of Medicine) Ibnu Sina jadi rujukan dunia 600 tahun. Al-Razi memelopori catatan klinis. Bimaristan: rumah sakit dengan rekam medis, apotek, & spesialisasi — cikal bakal sistem layanan kesehatan modern.' },
]
const HISTORY_MODERN: { decade: string; title: string; body: string }[] = [
  { decade: '1900–1950', title: 'Antibiotik & Vaksin', body: 'Penisilin (Fleming, 1928), vaksinasi massal, & sanitasi melipatgandakan harapan hidup. Fokus: penyakit menular.' },
  { decade: '1960–1980', title: 'Rekam Medis & Kedokteran Bukti', body: 'Rekam medis elektronik pertama (Problem-Oriented Medical Record). Randomized trial jadi standar emas. Awal gerontologi.' },
  { decade: '1990–2000', title: 'Genom & Telomer', body: 'Human Genome Project. Penemuan telomerase (anti-aging molekuler). Internet mulai mengubah akses informasi kesehatan.' },
  { decade: '2000–2010', title: 'EHR & Standar Interoperabilitas', body: 'Adopsi Electronic Health Records meluas. HL7 v2/v3 & lahirnya FHIR (2011) — standar tukar data kesehatan antar-sistem yang kini jadi tulang punggung digital health.' },
  { decade: '2010–2020', title: 'Wearable & Longevity Science', body: 'Apple Watch, WHOOP, CGM. Riset senolytics, NAD+, rapamycin, puasa. Longevity naik dari pinggiran ke sains arus utama (Sinclair, Attia).' },
  { decade: '2020–kini', title: 'AI dalam Kedokteran + FHIR', body: 'AI untuk diagnosis, anamnesis, & interpretasi citra; LLM medis. FHIR menyatukan data agar AI & pasien berbicara satu bahasa. Panaceamed.id lahir di sini: AI + verifikasi dokter + longevity terukur.' },
]
const STEM_CELLS: { type: string; emoji: string; short: string; body: string; use: string }[] = [
  { type: 'Somatic (Dewasa)', emoji: '🩹', short: 'Multipoten',
    body: 'Sel punca yang sudah ada di tubuh dewasa — sumsum tulang, lemak, darah tali pusat. Bersifat multipoten (terbatas jadi beberapa jenis sel dari jaringannya). Paling aman & sudah rutin dipakai klinis (mis. transplantasi sumsum tulang untuk leukemia).',
    use: 'Terapi sel darah, ortopedi, penyembuhan luka' },
  { type: 'Embryonic (Embrionik)', emoji: '🌱', short: 'Pluripoten',
    body: 'Berasal dari blastosis embrio dini; bersifat pluripoten — bisa menjadi HAMPIR semua jenis sel tubuh. Sangat kuat untuk riset & regenerasi, namun menimbulkan pertimbangan etika & risiko penolakan imun/tumor.',
    use: 'Riset perkembangan, model penyakit, regenerasi organ' },
  { type: 'iPSC (Induced Pluripotent)', emoji: '🔄', short: 'Pluripoten (rekayasa)',
    body: 'Sel dewasa (mis. kulit/darah) "diprogram ulang" kembali ke keadaan pluripoten (Yamanaka, Nobel 2012). Menggabungkan kekuatan embrionik TANPA masalah etika embrio, dan bisa cocok-personal (dari sel pasien sendiri → minim penolakan).',
    use: 'Pengobatan personal, uji obat, riset anti-aging & reprogramming' },
]
const ROBOTICS: { type: string; emoji: string; short: string; body: string; use: string }[] = [
  { type: 'Bedah Robotik', emoji: '🤖', short: 'Presisi mikro',
    body: 'Sistem seperti da Vinci (sejak ~2000) memungkinkan dokter mengoperasi lewat sayatan sangat kecil dengan lengan robot berpresisi, tremor-filter, & penglihatan 3D. Hasilnya: luka lebih kecil, nyeri berkurang, & pemulihan lebih cepat.',
    use: 'Urologi, ginekologi, bedah jantung & digestif' },
  { type: 'Prostetik & Eksoskeleton', emoji: '🦾', short: 'Bionik',
    body: 'Tangan/kaki bionik yang dikendalikan sinyal saraf/otot (myoelectric), serta eksoskeleton robotik yang membantu pasien stroke/cedera tulang belakang berjalan kembali — mengembalikan mobilitas & kemandirian.',
    use: 'Rehabilitasi, amputasi, cedera saraf tulang belakang' },
  { type: 'Nanorobot & Mikrorobot', emoji: '🧫', short: 'Skala sel',
    body: 'Robot berukuran mikro/nano (masih tahap riset & uji awal) dirancang mengantar obat langsung ke sel target — mis. tumor — atau membersihkan pembuluh, meminimalkan efek samping ke jaringan sehat. Perbatasan pengobatan presisi.',
    use: 'Pengantaran obat bertarget, diagnostik intra-tubuh' },
  { type: 'Robot Rehabilitasi & Perawatan', emoji: '💗', short: 'Pendamping',
    body: 'Robot terapi gerak berulang untuk pemulihan pasca-stroke, robot pendamping lansia (memantau jatuh, mengingatkan obat), & telepresence untuk kunjungan dokter jarak jauh — memperluas akses perawatan.',
    use: 'Fisioterapi, perawatan lansia, telemedicine' },
]

export function Landing({ onMasuk }: { onMasuk: () => void }) {
  const [theme, setTheme] = useState<Theme>(getTheme)
  const [promo, setPromo] = useState<Health['promo'] | null>(null)
  useEffect(() => {
    if (backendEnabled) api.health().then((h) => setPromo(h.promo ?? null)).catch(() => {})
  }, [])
  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      {/* Promo early-bird — 75% untuk pendaftar pertama */}
      {promo && promo.slotsLeft > 0 && (
        <button onClick={onMasuk} className="block w-full bg-gradient-to-r from-[#0b7a4b] to-[#00BF63] px-4 py-2.5 text-center text-sm font-bold text-white hover:brightness-110">
          🎉 Diskon {promo.discountPct}% SEMUA layanan untuk {promo.limit} pendaftar pertama — sisa {promo.slotsLeft} slot! Daftar sekarang →
        </button>
      )}
      {/* Glass header */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-black/5 bg-white/70 px-4 py-3 backdrop-blur-xl sm:px-8">
        <div className="min-w-0 shrink"><Wordmark size={32} /></div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setTheme(toggleTheme())}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-black/5 text-neutral-600 transition hover:text-brand-dark"
            title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
            aria-label={theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
          >
            {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
          </button>
          <button
            onClick={onMasuk}
            className="min-h-[44px] whitespace-nowrap rounded-full bg-gradient-to-b from-[#00BF63] to-[#0b7a4b] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:brightness-105 active:scale-95 sm:px-6 sm:text-base"
          >
            Masuk<span className="hidden sm:inline"> / Daftar</span>
          </button>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-8 sm:py-28">
        {/* Cinematic brand film (Higgsfield) behind the hero, softened by a
            white gradient so the original template text stays readable. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <video
            src="https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_023227_88b54135-7489-48de-9476-ca0657fc0d29.mp4"
            autoPlay muted loop playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="hero-video-scrim absolute inset-0" />
          <InteractiveAura />
          <div className="orb absolute -left-20 top-10 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
          <div className="orb absolute right-0 top-40 h-80 w-80 rounded-full bg-emerald-400/15 blur-3xl" style={{ animationDelay: '-6s' }} />
        </div>

        <div className="relative mx-auto max-w-5xl text-center">
          <Reveal>
            <div className="liquid-glass mx-auto inline-flex items-center gap-2 rounded-full px-4 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600">Longevity Medical-AI · Siap Pakai</span>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              AI-Klinik Praktis untuk
              <br />
              <span className="font-serif-display bg-gradient-to-r from-[#0b7a4b] to-[#00BF63] bg-clip-text italic text-transparent">
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
              {/* Nested 'button-in-button' CTA with magnetic icon physics */}
              <button
                onClick={onMasuk}
                className="group relative flex items-center gap-3 overflow-hidden rounded-full bg-gradient-to-b from-[#00BF63] to-[#0b7a4b] py-2 pl-7 pr-2 font-bold text-white shadow-[0_10px_30px_-8px_rgba(0,191,99,0.5)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <span className="relative z-10 text-base">Daftar Gratis Sekarang</span>
                <span className="relative z-10 grid h-9 w-9 place-items-center rounded-full bg-white/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:scale-105">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
              <a
                href="#about"
                className="flex items-center rounded-full border border-black/10 bg-white/60 px-8 py-3.5 font-bold text-brand-dark shadow-sm backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-white"
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
                  className="liquid-glass rounded-2xl p-4"
                >
                  <div className="bg-gradient-to-r from-brand to-brand-dark bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">
                    {s.node}
                  </div>
                  <div className="mt-1 text-[11px] font-semibold leading-tight text-neutral-500">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
          <p className="mt-5 text-xs text-neutral-500">AI mendukung, bukan menggantikan, klinisi berlisensi.</p>

          {/* Trust & Authority strip — the #1 pattern for health products */}
          <Reveal delay={360}>
            <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3">
              {[
                { icon: IconStethoscope, label: 'Diverifikasi dokter berlisensi' },
                { icon: IconShield, label: 'Kepatuhan UU PDP' },
                { icon: IconCheck, label: 'Standar data FHIR' },
                { icon: IconHeart, label: 'Longevity terukur' },
              ].map((t) => (
                <span key={t.label} className="flex items-center gap-2 text-[13px] font-semibold text-neutral-600">
                  <t.icon size={16} className="text-brand-dark" /> {t.label}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

           {/* Marquee strip */}
      <style>{`#panacea-track{animation:panaceaGo 45s linear infinite!important}@keyframes panaceaGo{from{transform:translateX(0)}to{transform:translateX(-33.333%)}}`}</style>
      <div className="relative overflow-hidden border-y border-black/5 bg-white/40 py-5 backdrop-blur">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white/80 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white/80 to-transparent" />
        <div id="panacea-track" className="flex w-max" onMouseEnter={e=>e.currentTarget.style.animationPlayState='paused'} onMouseLeave={e=>e.currentTarget.style.animationPlayState='running'}>
          {[0,1,2].map(g=>(
            <div key={g} className="flex shrink-0 gap-10 pr-10" aria-hidden={g!==0}>
              {MARQUEE.map((m,i)=>(
                <span key={i} className="flex shrink-0 items-center gap-2 text-sm font-bold text-neutral-500">
                  <m.icon size={18} className="text-brand-dark" /> {m.label}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURED BRAND FILM ──────────────────────────────── */}
      <section className="px-6 py-16 sm:px-10">
        <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-2">
          {/* Self-hosted Remotion logo animation (code-based, free) */}
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] shadow-2xl shadow-brand/20">
              <video src={`${import.meta.env.BASE_URL}media/brand-intro.mp4`} autoPlay muted loop playsInline className="aspect-video w-full bg-[#06120c] object-cover" />
            </div>
          </Reveal>
          {/* Cinematic nature film */}
          <Reveal delay={80}>
            <div className="relative overflow-hidden rounded-[2rem] shadow-2xl shadow-brand/20">
              <video
                src="https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_023227_88b54135-7489-48de-9476-ca0657fc0d29.mp4"
                autoPlay muted loop playsInline
                className="aspect-video w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <h2 className="text-xl font-extrabold sm:text-2xl">
                  Alam. Manusia. <span className="font-serif-display italic text-emerald-300">Kebugaran.</span>
                </h2>
                <p className="mt-1 max-w-xl text-[13px] text-white/80">Memperpanjang healthspan lewat sains — menambah hidup pada usia Anda.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── ABOUT / FEATURES ─────────────────────────────────── */}
      <section id="about" className="mx-auto max-w-5xl px-6 py-20 sm:px-10">
        <Reveal className="text-center">
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-dark">Tentang Kami</span>
          <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">Apa itu <span className="font-serif-display italic text-brand-dark">Panaceamed.id</span>?</h2>
          <p className="mx-auto mt-3 max-w-3xl text-neutral-600">
            Platform <b>AI-EMR</b> sekaligus <b>pusat pengetahuan kedokteran</b>. AI melakukan anamnesis &
            analisis penunjang via chatbot, lalu mengalir ke rekam medis yang <b>diverifikasi dan ditandatangani
            dokter manusia</b>. Visi kami: <b>AI-Klinik Praktis untuk masa depan kesehatan Anda.</b>
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 90}>
              <div role="button" tabIndex={0} onClick={onMasuk} onKeyDown={(e) => e.key === 'Enter' && onMasuk()}
                className="liquid-glass group relative h-full cursor-pointer overflow-hidden rounded-2xl p-6 transition duration-300 hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-[0_18px_40px_rgba(0,191,99,0.16)]">
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
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">Satu platform, <span className="font-serif-display italic text-brand-dark">banyak peran</span></h2>
            <p className="mx-auto mt-3 max-w-2xl text-neutral-600">
              Langganan (individu & rumah sakit) + ekonomi token: pembeli deposit <b>PanaceaToken</b>,
              penulis menerima royalti, semua materi diverifikasi spesialis & AI.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ROLES.map(([t, d], i) => (
              <Reveal key={t} delay={(i % 3) * 90}>
                <div className="liquid-glass flex h-full items-start gap-3 rounded-2xl p-5 transition hover:-translate-y-1 hover:shadow-md">
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
          <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">Pembaruan <span className="font-serif-display italic text-brand-dark">Terbaru</span></h2>
        </Reveal>
        <ul className="mt-8 space-y-3">
          {WHATS_NEW.map((w, i) => (
            <Reveal key={w} as="li" delay={i * 70}>
              <div className="liquid-glass flex items-start gap-3 rounded-2xl p-4 transition hover:translate-x-1 hover:border-brand/30">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-white"><IconCheck size={16} /></span>
                <span className="text-sm text-neutral-700">{w}</span>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* ── BERITA & INOVASI KEDOKTERAN (editorial, rotating) ─────── */}
      <MedicalNews />

      {/* ── SEJARAH LONGEVITY & SISTEM KESEHATAN ──────────────────── */}
      <section className="relative overflow-hidden px-6 py-20 sm:px-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="orb absolute left-1/4 top-10 h-72 w-72 rounded-full bg-brand/10 blur-3xl" />
          <div className="orb absolute bottom-10 right-1/4 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" style={{ animationDelay: '-8s' }} />
        </div>
        <div className="relative mx-auto max-w-4xl">
          <Reveal className="text-center">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-dark">Warisan Ribuan Tahun</span>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">Sejarah <span className="font-serif-display italic text-brand-dark">Longevity</span> &amp; Kesehatan</h2>
            <p className="mx-auto mt-3 max-w-2xl text-neutral-600">
              Dari firaun, para nabi, Yunani-Romawi, dinasti Tiongkok, hingga kekaisaran Mongol —
              pencarian hidup panjang &amp; sehat setua peradaban. Panaceamed.id meneruskannya dengan sains &amp; AI.
            </p>
          </Reveal>

          {/* Self-hosted Remotion animated timeline (code-based, free) */}
          <Reveal delay={80}>
            <div className="mt-8 overflow-hidden rounded-[2rem] shadow-2xl shadow-brand/20">
              <video src={`${import.meta.env.BASE_URL}media/history.mp4`} autoPlay muted loop playsInline className="aspect-video w-full bg-[#06120c] object-cover" />
            </div>
          </Reveal>

          {/* Ancient eras timeline */}
          <div className="mt-10 space-y-4">
            {HISTORY_ERAS.map((e, i) => (
              <Reveal key={e.era} delay={(i % 3) * 80}>
                <div className="liquid-glass flex gap-4 rounded-2xl p-5">
                  <div className="flex shrink-0 flex-col items-center">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-2xl">{e.emoji}</span>
                    {i < HISTORY_ERAS.length - 1 && <span className="mt-2 w-px flex-1 bg-brand/20" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h3 className="text-base font-extrabold text-ink">{e.title}</h3>
                      <span className="text-[11px] font-bold text-brand-dark">{e.era}</span>
                      <span className="text-[10px] text-neutral-400">· {e.when}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-600">{e.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Modern per-decade */}
          <Reveal className="mt-12 text-center">
            <h3 className="text-2xl font-extrabold">Era Modern — <span className="font-serif-display italic text-brand-dark">Per Dekade</span></h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-neutral-500">Dari antibiotik & rekam medis, ke wearable, standar data FHIR, dan AI dalam kedokteran.</p>
          </Reveal>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HISTORY_MODERN.map((m, i) => (
              <Reveal key={m.decade} delay={(i % 3) * 80}>
                <div className="liquid-glass h-full rounded-2xl p-5">
                  <div className="text-xs font-black text-brand-dark">{m.decade}</div>
                  <div className="mt-1 font-bold text-ink">{m.title}</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">{m.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* FHIR explainer */}
          <Reveal delay={80}>
            <div className="mt-8 rounded-2xl border border-brand/20 bg-brand-50 p-6">
              <div className="text-xs font-bold uppercase tracking-wide text-brand-dark">Apa itu FHIR?</div>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-700">
                <b>FHIR</b> (Fast Healthcare Interoperability Resources) adalah standar global agar data kesehatan —
                rekam medis, lab, obat, tanda vital — bisa dibaca antar rumah sakit, aplikasi, &amp; AI dalam satu "bahasa".
                Inilah fondasi yang membuat AI-EMR &amp; longevity terukur di Panaceamed.id bisa aman, portabel, &amp; kolaboratif.
              </p>
            </div>
          </Reveal>

          {/* Stem cells — the frontier of regenerative longevity */}
          <Reveal className="mt-12 text-center">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-dark">Perbatasan Regeneratif</span>
            <h3 className="mt-3 text-2xl font-extrabold">Sel Punca (<span className="font-serif-display italic text-brand-dark">Stem Cell</span>)</h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-neutral-500">
              Harapan besar anti-aging: mengganti sel rusak &amp; meremajakan jaringan. Tiga jenis utama, dari yang paling mapan hingga paling mutakhir.
            </p>
          </Reveal>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {STEM_CELLS.map((s, i) => (
              <Reveal key={s.type} delay={(i % 3) * 80}>
                <div className="liquid-glass flex h-full flex-col rounded-2xl p-5">
                  <div className="flex items-center gap-2">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-xl">{s.emoji}</span>
                    <div>
                      <div className="font-extrabold text-ink">{s.type}</div>
                      <div className="text-[10px] font-bold uppercase tracking-wide text-brand-dark">{s.short}</div>
                    </div>
                  </div>
                  <p className="mt-2 flex-1 text-[13px] leading-relaxed text-neutral-600">{s.body}</p>
                  <div className="mt-2 rounded-lg bg-neutral-50 px-3 py-1.5 text-[11px] text-neutral-500"><b className="text-neutral-600">Aplikasi:</b> {s.use}</div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={80}>
            <p className="mx-auto mt-4 max-w-2xl text-center text-[11px] leading-relaxed text-neutral-400">
              Potensi vs kematangan: <b>potensi</b> tertinggi pada embrionik &amp; iPSC (pluripoten), <b>kematangan klinis</b> tertinggi pada somatik.
              Riset reprogramming parsial (faktor Yamanaka) kini mengeksplorasi <i>membalik jam biologis sel</i> — perbatasan sains longevity.
              <br /><span className="opacity-70">Bersifat edukatif; terapi sel punca harus di fasilitas berlisensi &amp; sesuai regulasi.</span>
            </p>
          </Reveal>

          {/* Robotics in medicine */}
          <Reveal className="mt-12 text-center">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-dark">Presisi Mesin</span>
            <h3 className="mt-3 text-2xl font-extrabold">Robotika dalam <span className="font-serif-display italic text-brand-dark">Kedokteran</span></h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-neutral-500">
              Dari lengan bedah berpresisi hingga nanorobot di aliran darah — mesin memperluas tangan &amp; jangkauan dokter, membuat perawatan lebih aman, minim-invasif, &amp; terjangkau.
            </p>
          </Reveal>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {ROBOTICS.map((r, i) => (
              <Reveal key={r.type} delay={(i % 2) * 80}>
                <div className="liquid-glass flex h-full flex-col rounded-2xl p-5">
                  <div className="flex items-center gap-2">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-xl">{r.emoji}</span>
                    <div>
                      <div className="font-extrabold text-ink">{r.type}</div>
                      <div className="text-[10px] font-bold uppercase tracking-wide text-brand-dark">{r.short}</div>
                    </div>
                  </div>
                  <p className="mt-2 flex-1 text-[13px] leading-relaxed text-neutral-600">{r.body}</p>
                  <div className="mt-2 rounded-lg bg-neutral-50 px-3 py-1.5 text-[11px] text-neutral-500"><b className="text-neutral-600">Aplikasi:</b> {r.use}</div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={80}>
            <p className="mx-auto mt-4 max-w-2xl text-center text-[11px] leading-relaxed text-neutral-400">
              Robotika berpadu dengan <b>AI</b> (navigasi bedah, analisis citra real-time) &amp; <b>FHIR</b> (data terhubung) —
              perpaduan yang menjadi arah Panaceamed.id: teknologi memperkuat, bukan menggantikan, klinisi.
              <br /><span className="opacity-70">Sebagian teknologi (nanorobot) masih tahap riset/uji klinis.</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── ABOUT US & KONTAK ─────────────────────────────────────── */}
      <section className="px-6 py-12 sm:px-10">
        <Reveal>
          <div className="mx-auto grid max-w-5xl gap-6 rounded-[2rem] border border-black/5 bg-white p-8 shadow-sm lg:grid-cols-3">
            <div>
              <h2 className="text-2xl font-extrabold">Tentang Kami</h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                Panaceamed.id adalah super-app kesehatan & longevity Indonesia: AI melakukan anamnesis & edukasi,
                dokter berlisensi memverifikasi. Misi kami menjadikan akses kesehatan berkualitas, pemantauan
                penyakit kronis, dan ilmu longevity terdepan terjangkau untuk semua — didukung kecerdasan buatan
                yang bertanggung jawab dan kepatuhan UU PDP.
              </p>
            </div>
            <div className="rounded-2xl bg-brand-50 p-5">
              <h3 className="font-bold">Hubungi Kami</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li><span className="text-neutral-400">Email:</span> <a href="mailto:index.meds@gmail.com" className="font-semibold text-brand-dark hover:underline">index.meds@gmail.com</a></li>
                <li><span className="text-neutral-400">Instagram:</span> <a href="https://instagram.com/Panaceamed.id" target="_blank" rel="noreferrer" className="font-semibold text-brand-dark hover:underline">@Panaceamed.id</a></li>
                <li><span className="text-neutral-400">TikTok:</span> <a href="https://tiktok.com/@Panaceamed.id" target="_blank" rel="noreferrer" className="font-semibold text-brand-dark hover:underline">@Panaceamed.id</a></li>
              </ul>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-5">
              <h3 className="font-bold">Kontak Pendiri</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li><span className="text-neutral-400">Nama:</span> <b>Rizky Muhammad Azrissal</b></li>
                <li><span className="text-neutral-400">Email:</span> <a href="mailto:Rizkyazhar486@gmail.com" className="font-semibold text-brand-dark hover:underline">Rizkyazhar486@gmail.com</a></li>
                <li><span className="text-neutral-400">Telepon:</span> <a href="tel:+6282261143040" className="font-semibold text-brand-dark hover:underline">0822-6114-3040</a></li>
                <li><span className="text-neutral-400">Instagram:</span> <a href="https://instagram.com/Rizkyazr4" target="_blank" rel="noreferrer" className="font-semibold text-brand-dark hover:underline">@Rizkyazr4</a></li>
              </ul>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="px-6 pb-24 sm:px-10">
        <Reveal>
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#00BF63] to-[#0b7a4b] px-8 py-16 text-center shadow-2xl shadow-brand/30">
            <div className="orb pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/15 blur-3xl" />
            <div className="orb pointer-events-none absolute -bottom-10 -right-10 h-56 w-56 rounded-full bg-emerald-900/30 blur-3xl" style={{ animationDelay: '-8s' }} />
            <div className="relative">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Mulai perjalanan <span className="font-serif-display italic">healthspan</span> Anda</h2>
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
