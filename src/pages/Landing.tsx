import { useState, useEffect, useRef } from 'react'
import { Prosa } from '../components/Prosa'
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
import { ScrollCinematic, ScrollCinematicStyles } from '../components/ScrollCinematic'
import { PricingSection } from '../components/PricingSection'

/**
 * Video yang hanya berputar SAAT TERLIHAT.
 *
 * Enam kartu era masing-masing memuat satu video ber-autoplay. Sebelumnya
 * keenamnya mulai mengunduh dan berputar bersamaan begitu halaman dibuka —
 * pada paket data seluler itu puluhan megabita yang tidak diminta siapa pun,
 * dan pada telepon kelas menengah enam pemutar sekaligus membuat guliran
 * tersendat. preload="none" saja tidak menolong, sebab autoPlay membatalkannya.
 *
 * Yang di bawah memutar video hanya ketika kartunya benar-benar berada di
 * layar, dan menghentikannya begitu lewat. Perilaku ini juga yang membuat
 * tumpukan kartu terbaca: yang bergerak selalu era yang sedang dibaca.
 */
function VideoSaatTerlihat({ src, judul }: { src: string; judul: string }) {
  const acuan = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const el = acuan.current
    if (!el) return
    const pengamat = new IntersectionObserver(
      ([masuk]) => {
        if (masuk.isIntersecting) void el.play().catch(() => {})
        else el.pause()
      },
      { threshold: 0.35 },
    )
    pengamat.observe(el)
    return () => pengamat.disconnect()
  }, [])
  return (
    <video
      ref={acuan}
      src={src}
      muted
      loop
      playsInline
      preload="none"
      aria-label={`Suasana era ${judul}`}
      className="mt-3 aspect-video w-full rounded-xl bg-[#06120c] object-cover"
    />
  )
}

const FEATURES = [
  { icon: IconUsers, title: 'Dasbor Hidup Sehat', text: 'A Strava/TikTok-style social network: share activities, healthy habits & longevity articles. Photos, short videos, profiles, bookmarks.' },
  { icon: IconHeart, title: 'Kalkulator AI Umur Panjang', text: 'Log your diet, exercise, hydration, sleep & sun exposure — AI calculates your longevity score (30-day subscription).' },
  { icon: IconChat, title: 'AI Chatbot → AI-EMR', text: 'AI interviews the patient (SOCRATES method); results flow automatically into the Subjective/Objective fields of the AI-EMR, accessible only to doctors.' },
  { icon: IconStethoscope, title: 'Konsultasi, Apotek & Fasilitas', text: 'AI consultation (Rp49,000) → referral to specialist doctors; pharmacy with prescription fulfillment; nearest healthcare facilities via GPS for emergencies.' },
  { icon: IconStore, title: 'Pusat Pengetahuan Kedokteran', text: 'Temukan & bagikan catatan, jurnal, dan artikel kedokteran pilihan. Harga ditetapkan penulisnya; PDF bertanda air melindungi kontributor.' },
  { icon: IconShield, title: 'AI-EMR Bersertifikat', text: 'Untuk dokter dan institusi bersertifikat (STR/NPWP). CDSS dengan dokter dalam alurnya menandai interaksi obat, alergi & kontraindikasi.' },
]

const ROLES = [
  ['Pelanggan / Pasien', 'Dasbor hidup sehat, edukasi penyakit, gizi & AI Umur Panjang, konsultasi, apotek & fasilitas terdekat.'],
  ['Dokter', 'AI-EMR lengkap (SOAP), data klinis per pasien, perencanaan & konsultasi.'],
  ['Kontributor', 'Menulis, menjual, dan mengajukan pemeriksaan untuk materi kedokteran.'],
  ['Verifikator', 'Spesialis/guru besar bersama AI memeriksa materinya.'],
  ['Admin', 'Layanan, dukungan otomatis & pengelolaan katalog apotek.'],
  ['Pemilik', 'Mengalihkan mode akses & memantau keuntungan perusahaan.'],
]

const WHATS_NEW = [
  'Dasbor sosial "Panacea Healthy Living" — foto & video 30 detik, profil, kiriman ulang, penanda pribadi.',
  'Kalkulator Umur Panjang bertenaga AI (langganan 30 hari, Rp49.000/bulan).',
  'Apotek dengan penebusan/pemindaian resep + Riwayat Transaksi menyatu yang dapat disaring menurut jenisnya.',
  'Fasilitas kesehatan terdekat lewat GPS (rumah sakit, klinik & apotek) untuk keadaan darurat.',
  'Pusat Pengetahuan Kedokteran — temukan & bagikan catatan, jurnal, dan artikel pilihan dengan PanaceaToken.',
]

const STATS: { node: React.ReactNode; label: string }[] = [
  { node: <CountUp to={6} suffix=" Peran" />, label: 'Ekosistem pengguna yang menyatu' },
  { node: <CountUp to={100} suffix="%" />, label: 'Diperiksa dokter (AI dalam alurnya)' },
  { node: <CountUp to={30} suffix=" Hari" />, label: 'Daur AI Umur Panjang' },
  { node: <span>24/7</span>, label: 'Akses & SOS Darurat' },
]

const MARQUEE = [
  { icon: IconHospital, label: 'Fasilitas Terdekat' },
  { icon: IconPill, label: 'Apotek Digital' },
  { icon: IconStethoscope, label: 'Konsultasi Dokter' },
  { icon: IconHeart, label: 'AI Umur Panjang' },
  { icon: IconStore, label: 'Materi Kedokteran' },
  { icon: IconShield, label: 'AI-EMR Bersertifikat' },
  { icon: IconChartUp, label: 'Pemantauan Masa Sehat' },
]

// ── History of longevity, anti-aging, wellness & healthcare systems ──────────────
const HISTORY_ERAS: { era: string; when: string; emoji: string; title: string; body: string; video?: string }[] = [
  { era: 'Mesir Kuno', when: '≈3000–300 BCE', emoji: '𓂀', title: 'Para Firaun & Papirus Kedokteran',
    body: 'Papirus Edwin Smith dan Ebers mencatat resep, pembedahan, dan kebersihan. Para firaun mengejar hidup abadi lewat mumifikasi; Imhotep dihormati sebagai tabib. Kosmetik & minyak (kelor, madu) menjadi ramuan penunda penuaan yang paling awal.', video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_091507_583431ed-8898-4dfa-b8f9-c5b0dbbe2f60.mp4' },
  { era: 'Zaman Para Nabi', when: '≈2000 BCE–632 CE', emoji: '☾', title: 'Tuntunan Kenabian & Kebersihan',
    body: 'Tuntunan kenabian menekankan wudu dan kebersihan, puasa berkala, madu & habbatussauda, serta makan secukupnya ("sepertiga untuk makanan, sepertiga untuk minuman, sepertiga untuk napas"). Asas pencegahan dan tidak berlebihan itu sejalan dengan ilmu umur panjang masa kini.', video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_091443_997b4cca-33e8-4172-a8bf-196145536064.mp4' },
  { era: 'Yunani-Romawi', when: '≈500 BCE–500 CE', emoji: '🏛️', title: 'Hipokrates & Galen',
    body: 'Hipokrates: "jadikan makanan sebagai obatmu", dan Sumpah Hipokrates (etika kedokteran). Galen menyusun fisiologi secara sistematis. Bangsa Romawi membangun saluran air, pemandian umum, dan sanitasi kota — sistem kesehatan masyarakat yang pertama.', video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_091602_57f19059-6460-40e3-a9eb-05fcdf9d0fee.mp4' },
  { era: 'Dinasti-Dinasti Tiongkok', when: '≈200 BCE–1912 CE', emoji: '🐉', title: 'Qi, Ramuan & Eliksir Umur Panjang',
    body: 'Huangdi Neijing meletakkan dasar pengobatan tradisional Tiongkok. Para kaisar mencari "eliksir keabadian" — sebagiannya, ironisnya, mengandung raksa. Qigong, akupunktur, ginseng, dan keseimbangan yin-yang membentuk pendekatan menyeluruh terhadap masa sehat.', video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_091631_5438f5ac-1e17-4937-b4a9-01346777ee0c.mp4' },
  { era: 'Kekaisaran Mongol', when: '≈1206–1368 CE', emoji: '🏹', title: 'Kedokteran Lintas Budaya',
    body: 'Pax Mongolica mempertemukan tabib Persia, Tiongkok, dan Arab di sepanjang Jalur Sutra — bertukar pengetahuan bedah, obat-obatan, dan karantina. Rumah sakit berpindah dan standar kebugaran prajurit adalah bentuk awal "kedokteran penampilan".', video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_091728_c9ef0932-4b2b-46fc-ae0b-a33a276529ac.mp4' },
  { era: 'Zaman Keemasan Islam', when: '≈800–1300 CE', emoji: '⚕️', title: 'Ibnu Sina & Rumah Sakit (Bimaristan)',
    body: 'Al-Qanun fi al-Tibb karya Ibnu Sina menjadi rujukan dunia selama 600 tahun. Al-Razi merintis pencatatan klinis. Bimaristan — rumah sakit dengan rekam medis, apotek, dan pembagian keahlian — adalah cikal bakal sistem layanan kesehatan modern.',
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_091759_7444344d-fd5c-47c7-a0a5-d551e686742f.mp4' },
]
const HISTORY_MODERN: { decade: string; title: string; body: string }[] = [
  { decade: '1900–1950', title: 'Antibiotik & Vaksin', body: 'Penisilin (Fleming, 1928), vaksinasi massal, dan sanitasi melipatgandakan harapan hidup. Fokusnya: penyakit menular.' },
  { decade: '1960–1980', title: 'Rekam Medis & Kedokteran Berbasis Bukti', body: 'Rekam medis elektronik yang pertama (Problem-Oriented Medical Record). Uji acak terkendali menjadi baku emas. Lahirnya ilmu gerontologi.' },
  { decade: '1990–2000', title: 'Genomika & Telomer', body: 'Proyek Genom Manusia. Penemuan telomerase (penunda penuaan di tingkat molekul). Internet mulai mengubah cara orang memperoleh keterangan kesehatan.' },
  { decade: '2000–2010', title: 'Rekam Medis Elektronik & Standar Pertukaran Data', body: 'Rekam medis elektronik dipakai luas. HL7 v2/v3 dan lahirnya FHIR (2011) — standar pertukaran data yang kini menopang kesehatan digital.' },
  { decade: '2010–2020', title: 'Perangkat Pakai & Ilmu Umur Panjang', body: 'Apple Watch, WHOOP, sensor gula darah berkelanjutan. Penelitian senolitik, NAD+, rapamisin, dan puasa. Umur panjang bergeser dari pinggiran menjadi ilmu arus utama (Sinclair, Attia).' },
  { decade: '2020–present', title: 'AI dalam Kedokteran + FHIR', body: 'AI untuk diagnosis, wawancara pasien, dan pembacaan citra; model bahasa kedokteran. FHIR menyatukan data agar AI dan pasien berbicara dalam bahasa yang sama. Di sinilah Panaceamed.id lahir: AI + pemeriksaan dokter + umur panjang yang terukur.' },
]
const STEM_CELLS: { type: string; emoji: string; short: string; body: string; use: string }[] = [
  { type: 'Somatik (Dewasa)', emoji: '🩹', short: 'Multipoten',
    body: 'Sel punca yang memang sudah ada pada tubuh dewasa — sumsum tulang, lemak, darah tali pusat. Multipoten: hanya dapat menjadi beberapa jenis sel dari jaringan asalnya. Paling aman, dan sudah rutin dipakai secara klinis, misalnya cangkok sumsum tulang untuk leukemia.',
    use: 'Terapi sel darah, ortopedi, penyembuhan luka' },
  { type: 'Embrionik', emoji: '🌱', short: 'Pluripoten',
    body: 'Berasal dari blastokista embrio awal; pluripoten — dapat menjadi HAMPIR semua jenis sel tubuh. Sangat berdaya untuk penelitian & regenerasi, tetapi menimbulkan pertimbangan etika serta risiko penolakan imun dan tumor.',
    use: 'Penelitian perkembangan, pemodelan penyakit, regenerasi organ' },
  { type: 'iPSC (Pluripoten Terinduksi)', emoji: '🔄', short: 'Pluripoten (direkayasa)',
    body: "Adult cells (e.g. skin/blood) are \"reprogrammed\" back into a pluripotent state (Yamanaka, Nobel Prize 2012). Combines the power of embryonic cells WITHOUT the embryo ethics issue, and can be personalized (from the patient's own cells → minimal rejection).",
    use: 'Kedokteran yang dipersonalisasi, uji obat, penelitian penundaan penuaan & pemrograman ulang sel' },
]
const ROBOTICS: { type: string; emoji: string; short: string; body: string; use: string }[] = [
  { type: 'Bedah Robotik', emoji: '🤖', short: 'Ketelitian mikro',
    body: 'Sistem seperti da Vinci (sejak sekitar tahun 2000) memungkinkan dokter bedah bekerja lewat sayatan kecil dengan lengan robotik presisi, penyaring getaran tangan, dan penglihatan tiga dimensi. Hasilnya: luka lebih kecil, nyeri lebih ringan, dan pemulihan lebih cepat.',
    use: 'Urologi, ginekologi, bedah jantung & saluran cerna' },
  { type: 'Prostesis & Eksoskeleton', emoji: '🦾', short: 'Bionik',
    body: 'Tangan dan kaki bionik yang dikendalikan sinyal saraf/otot (mioelektrik), serta eksoskeleton robotik yang membantu penyandang stroke dan cedera tulang belakang berjalan kembali — memulihkan gerak dan kemandirian.',
    use: 'Rehabilitasi, amputasi, cedera saraf tulang belakang' },
  { type: 'Nanorobot & Mikrorobot', emoji: '🧫', short: 'Skala sel',
    body: 'Robot berskala mikro dan nano — masih pada tahap penelitian dan uji awal — dirancang mengantar obat langsung ke sel sasaran seperti tumor, atau membersihkan pembuluh darah, sehingga efek sampingnya pada jaringan sehat sekecil mungkin. Batas terdepan kedokteran presisi.',
    use: 'Pengantaran obat bersasaran, diagnostik di dalam tubuh' },
  { type: 'Robot Rehabilitasi & Perawatan', emoji: '💗', short: 'Pendamping',
    body: 'Robot terapi gerak berulang untuk pemulihan pascastroke, robot pendamping lansia yang memantau jatuh dan mengingatkan obat, serta telepresensi untuk kunjungan dokter jarak jauh — memperluas jangkauan layanan.',
    use: 'Fisioterapi, perawatan lansia, telemedisin' },
]

export function Landing({ onMasuk }: { onMasuk: () => void }) {
  const [theme, setTheme] = useState<Theme>(getTheme)
  const [promo, setPromo] = useState<Health['promo'] | null>(null)
  useEffect(() => {
    if (backendEnabled) api.health().then((h) => setPromo(h.promo ?? null)).catch(() => {})
  }, [])
  return (
    <div className="min-h-screen bg-white">
      {/* Early-bird promo — 75% off for the first registrants */}
      {promo && promo.slotsLeft > 0 && (
        <button onClick={onMasuk} className="block w-full bg-gradient-to-r from-[#0b7a4b] to-[#00BF63] px-4 py-2.5 text-center text-sm font-bold text-white hover:brightness-110">
          🎉 {promo.discountPct}% off ALL services for the first {promo.limit} sign-ups — only {promo.slotsLeft} spots left! Sign up now →
        </button>
      )}
      {/* Glass header */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-black/5 bg-white/70 px-4 py-3 backdrop-blur-xl sm:px-8">
        <div className="min-w-0 shrink"><Wordmark size={32} /></div>
        <a href="#pricing" className="hidden shrink-0 text-sm font-bold text-neutral-600 transition hover:text-brand-dark sm:inline">Harga</a>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setTheme(toggleTheme())}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-black/5 text-neutral-600 transition hover:text-brand-dark"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
          </button>
          <button
            onClick={onMasuk}
            className="min-h-[44px] whitespace-nowrap rounded-full bg-gradient-to-b from-[#00BF63] to-[#0b7a4b] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:brightness-105 active:scale-95 sm:px-6 sm:text-base"
          >
            Sign In<span className="hidden sm:inline"> / Sign Up</span>
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
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600">Medis-AI Umur Panjang · Siap Dipakai</span>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              The Practical AI Clinic for
              <br />
              <span className="font-serif-display bg-gradient-to-r from-[#0b7a4b] to-[#00BF63] bg-clip-text italic text-transparent">
                Akses Anda ke Layanan Kesehatan
              </span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-5 max-w-2xl text-neutral-600 sm:text-lg">
              AI handles the intake & education; doctors verify. We extend <b>masa sehat</b> — not just
              lifespan — through precise clinical reasoning, early prevention, and lifestyle optimization.
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
                Selengkapnya
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
          <p className="mt-5 text-xs text-neutral-500">AI membantu, dan tidak pernah menggantikan, dokter berizin.</p>

          {/* Trust & Authority strip — the #1 pattern for health products */}
          <Reveal delay={360}>
            <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3">
              {[
                { icon: IconStethoscope, label: 'Diperiksa dokter berizin' },
                { icon: IconShield, label: 'Patuh UU PDP' },
                { icon: IconCheck, label: 'FHIR data standard' },
                { icon: IconHeart, label: 'Umur panjang yang terukur' },
              ].map((t) => (
                <span key={t.label} className="flex items-center gap-2 text-[13px] font-semibold text-neutral-600">
                  <t.icon size={16} className="text-brand-dark" /> {t.label}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── SCROLL-CINEMATIC OVERTURE, SESUDAH HERO ─────────────
          Urutan ini DIBALIK, dan itu perbaikan yang paling menentukan pada
          halaman ini.

          Sebelumnya sinematik berdiri paling atas dan menempati jalur setinggi
          400vh — empat layar penuh. Akibatnya pengunjung baru mendarat di
          bidang hijau berisi satu judul melayang, tanpa satu pun kalimat yang
          menjelaskan ini aplikasi apa dan tanpa tombol selain "Sign In" di
          pojok. Seluruh isi yang meyakinkan — judul, kalimat penjelas, tombol
          daftar, angka, dan lencana kepercayaan — berada sekitar 3.400 px di
          bawahnya. Orang yang datang dari tautan lalu menggulir sekali dan
          masih melihat hijau kosong akan menutup halamannya, dan ia tidak
          keliru: tidak ada yang ditawarkan kepadanya di sana.

          Sinematiknya TIDAK DIHAPUS. Ia tetap utuh, hanya tidak lagi menjadi
          pintu tol: yang ingin melihatnya tinggal menggulir, yang datang untuk
          mendaftar sudah menemukan tombolnya di layar pertama. */}
      <ScrollCinematicStyles />
      <ScrollCinematic />

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
              <div className="absolute bottom-0 left-0 right-0 p-5 text-ink">
                <h2 className="text-xl font-extrabold sm:text-2xl">
                  Nature. Humanity. <span className="font-serif-display italic text-emerald-300">Vitalitas.</span>
                </h2>
                <p className="mt-1 max-w-xl text-[13px] text-ink/80">Memperpanjang masa sehat lewat ilmu pengetahuan — menambah kehidupan pada tahun-tahun Anda.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── ABOUT / FEATURES ─────────────────────────────────── */}
      <section id="about" className="mx-auto max-w-5xl px-6 py-20 sm:px-10">
        <Reveal className="text-center">
          <span className="rounded-full bg-brand-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-dark">Tentang Kami</span>
          <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">Apa itu <span className="font-serif-display italic text-brand-dark">Panaceamed.id</span>?</h2>
          <p className="mx-auto mt-3 max-w-3xl text-neutral-600">
            An <b>AI-EMR</b> platform and <b>pusat pengetahuan kedokteran</b> in one. AI conducts the patient intake &
            supporting analysis through a chatbot, which then flows into a medical record <b>verified and signed
            by a human doctor</b>. Our vision: <b>klinik AI yang praktis untuk masa depan layanan kesehatan Anda.</b>
          </p>
        </Reveal>

        {/* DEK YANG DAPAT DIGESER DI TELEPON, kisi di layar lebar.
            Keenam kartu ini masing-masing memuat satu paragraf penuh; ditumpuk
            menurun pada layar 390 px keenamnya menjadi kolom setinggi lebih
            dari empat layar, dan pembaca harus melewati seluruh isinya untuk
            sampai ke bagian berikutnya. Sebagai dek, keenamnya menempati satu
            layar dan yang tidak diminati cukup dilewati dengan satu geseran.

            Kartu berikutnya sengaja MENGINTIP di tepi kanan: dek yang kartunya
            pas selebar layar tidak memberi tanda apa pun bahwa masih ada yang
            lain di sebelahnya, dan yang tidak tampak tidak pernah digeser.

            INTIPAN SAJA TIDAK CUKUP DI SINI, dan itu baru ketahuan dari
            tangkapan layarnya. Kartunya berlatar kaca putih di atas bagian yang
            juga putih, sehingga tepi kartu kedua yang mengintip tidak
            menghasilkan garis yang terlihat — petunjuknya ada secara geometri
            tetapi tidak ada secara penglihatan. Karena itu jumlah sisanya
            ditulis sebagai kalimat, hanya pada layar sempit tempat deknya
            memang berlaku.

            Lebarnya 74vw, bukan cqw. Percobaan pertama memakai 78cqw dan
            hasilnya 300 px karena tidak ada leluhur ber-container-type di
            cabang ini sehingga cqw jatuh ke batas max-w — kartu kedua mulai di
            412 px, yakni di luar layar 390 px, dan intipan yang seluruh
            gunanya menandakan "masih ada lagi" tidak pernah terjadi. Terukur
            ulang: kartu kedua kini mulai sebelum tepi kanan. */}
        <div className="geser-aman mt-12 sm:!m-0 sm:grid sm:gap-5 sm:overflow-visible lg:grid-cols-3 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 90} className="w-[74vw] max-w-[300px] sm:w-auto sm:max-w-none">
              <div role="button" tabIndex={0} onClick={onMasuk} onKeyDown={(e) => e.key === 'Enter' && onMasuk()}
                className="liquid-glass group relative h-full cursor-pointer overflow-hidden rounded-2xl p-6 transition duration-300 hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-[0_18px_40px_rgba(0,191,99,0.16)]">
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand/10 blur-2xl transition group-hover:bg-brand/20" />
                <div className="relative flex items-start justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-dark shadow-inner">
                    <f.icon size={22} />
                  </span>
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-black/10 text-neutral-500 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:border-brand group-hover:bg-brand group-hover:text-white">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>
                  </span>
                </div>
                <h3 className="relative mt-4 font-bold text-ink">{f.title}</h3>
                <p className="relative mt-1 text-sm leading-relaxed text-neutral-600">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-3 text-center text-xs font-semibold text-neutral-500 sm:hidden">
          Geser untuk {FEATURES.length - 1} fitur lainnya →
        </p>
      </section>

      {/* ── ROLES ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-[#e1eae3] px-6 py-20 sm:px-10">
        <div className="orb pointer-events-none absolute right-10 top-10 h-60 w-60 rounded-full bg-brand/15 blur-3xl" />
        <div className="relative mx-auto max-w-5xl">
          <Reveal className="text-center">
            <span className="rounded-full bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-dark backdrop-blur">Model Bisnis</span>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">Satu wadah, <span className="font-serif-display italic text-brand-dark">banyak peran</span></h2>
            <p className="mx-auto mt-3 max-w-2xl text-neutral-600">
              Subscriptions (individuals & hospitals) plus a token economy: buyers deposit <b>PanaceaToken</b>,
              authors earn royalties, and all content is verified by specialists & AI.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ROLES.map(([t, d], i) => (
              <Reveal key={t} delay={(i % 3) * 90}>
                <div className="liquid-glass flex h-full items-start gap-3 rounded-2xl p-5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-[0_18px_40px_-12px_rgba(0,191,99,0.22)]">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-dark"><IconUsers size={18} /></span>
                  <div>
                    <h3 className="font-bold text-ink">{t}</h3>
                    <p className="mt-0.5 text-sm leading-relaxed text-neutral-600">{d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HARGA & LAYANAN (dark bento-grid pricing) ─────────────── */}
      <PricingSection onMasuk={onMasuk} promo={promo} />

      {/* ── WHAT'S NEW ────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 py-20 sm:px-10">
        <Reveal className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
            <IconSparkle size={13} /> Yang Baru
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

      {/* ── MEDICAL NEWS & INNOVATION (editorial, rotating) ─────── */}
      <MedicalNews />

      {/* ── LONGEVITY & HEALTHCARE HISTORY ──────────────────── */}
      {/* overflow-hidden DIPINDAH dari section ke pembungkus orb di dalamnya.
          Kartu era di bawah memakai position:sticky, dan sticky yang berada di
          dalam leluhur ber-overflow-hidden menempel pada kotak guliran leluhur
          itu, bukan pada layar — akibatnya ia tampak tidak menempel sama
          sekali. Orbnya tetap terkurung karena pembungkusnya sendiri yang kini
          memotong. */}
      <section className="relative px-6 py-20 sm:px-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="orb absolute left-1/4 top-10 h-72 w-72 rounded-full bg-brand/10 blur-3xl" />
          <div className="orb absolute bottom-10 right-1/4 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" style={{ animationDelay: '-8s' }} />
        </div>
        <div className="relative mx-auto max-w-4xl">
          <Reveal className="text-center">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-dark">Warisan Ribuan Tahun</span>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">Sejarah <span className="font-serif-display italic text-brand-dark">Umur Panjang</span> &amp; Health</h2>
            <Prosa kelas="mx-auto mt-3 max-w-2xl text-neutral-600">Dari para firaun, para nabi, dunia Yunani-Romawi, dan dinasti-dinasti Tiongkok, sampai kekaisaran Mongol — usaha mencari hidup yang panjang dan sehat setua peradaban itu sendiri. Panaceamed.id melanjutkannya dengan ilmu pengetahuan &amp; AI.</Prosa>
          </Reveal>

          {/* Self-hosted Remotion animated timeline (code-based, free) */}
          <Reveal delay={80}>
            <div className="mt-8 overflow-hidden rounded-[2rem] shadow-2xl shadow-brand/20">
              <video src={`${import.meta.env.BASE_URL}media/history.mp4`} autoPlay muted loop playsInline className="aspect-video w-full bg-[#06120c] object-cover" />
            </div>
          </Reveal>

          {/* Ancient eras — KARTU BERTUMPUK.
              Enam era, masing-masing satu paragraf penuh beserta satu video,
              berjajar menurun menjadi kolom yang sangat panjang; pembacanya
              melewati keenamnya sekaligus dan tidak satu pun sempat menjadi
              pusat perhatian. Bertumpuk, tiap kartu menempel di tempat yang
              sama sampai kartu berikutnya naik menutupinya — satu era menguasai
              layar pada satu waktu, dan urutan zamannya terasa sebagai gerakan
              maju, bukan sebagai daftar.

              Puncak menempelnya bertambah 12 px tiap kartu sehingga tepi kartu
              di bawahnya tetap mengintip; tanpa itu tumpukan terlihat seperti
              satu kartu yang isinya berganti-ganti sendiri. */}
          <ol className="mt-10 list-none">
            {HISTORY_ERAS.map((e, i) => (
              <li
                key={e.era}
                className="tumpuk-kartu"
                style={{ top: `calc(4.5rem + ${i * 12}px)`, zIndex: i + 1 }}
              >
                {/* TANPA liquid-glass, dan ini bukan pilihan selera. Kartu kaca yang
                      menempel di atas kartu kaca lain membuat tiga paragraf saling
                      menembus sekaligus — terlihat jelas pada tangkapan layar di
                      390 px: judul era Yunani-Romawi, Mesir, dan Cina bertumpuk pada
                      baris yang sama dan tidak satu pun terbaca. Menambahkan
                      bg-white/95 di sebelah liquid-glass tidak menolong karena kelas
                      itu memasang latarnya sendiri. Tumpukan menuntut latar pekat. */}
                <div className="mb-4 flex gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.35)] dark:border-white/10 dark:bg-neutral-900">
                  <div className="flex shrink-0 flex-col items-center">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-2xl">{e.emoji}</span>
                    <span className="mt-2 text-[10px] font-black tabular-nums text-neutral-400">{i + 1}/{HISTORY_ERAS.length}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h3 className="text-base font-extrabold text-ink">{e.title}</h3>
                      <span className="text-[11px] font-bold text-brand-dark">{e.era}</span>
                      <span className="text-[10px] text-neutral-500">· {e.when}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-600">{e.body}</p>
                    {e.video && <VideoSaatTerlihat src={e.video} judul={e.era} />}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {/* Modern per-decade */}
          <Reveal className="mt-12 text-center">
            <h3 className="text-2xl font-extrabold">Zaman Modern — <span className="font-serif-display italic text-brand-dark">Dasawarsa demi Dasawarsa</span></h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-neutral-600">From antibiotics & medical records, to wearables, the FHIR data standard, and AI in medicine.</p>
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
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-dark">Apa itu FHIR?</div>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-700">
                <b>FHIR</b> (Fast Healthcare Interoperability Resources) is the global standard that lets health data —
                medical records, labs, medications, vital signs — be read across hospitals, apps, &amp; AI in one shared "language".
                It's the foundation that makes AI-EMR &amp; measurable longevity at Panaceamed.id safe, portable, &amp; collaborative.
              </p>
            </div>
          </Reveal>

          {/* Stem cells — the frontier of regenerative longevity */}
          <Reveal className="mt-12 text-center">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-dark">Batas Terdepan Regenerasi</span>
            <h3 className="mt-3 text-2xl font-extrabold">Sel Punca (<span className="font-serif-display italic text-brand-dark">Stem Cell</span>)</h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-neutral-600">
              Anti-aging's biggest promise: replacing damaged cells &amp; rejuvenating tissue. Three main types, from the most established to the most cutting-edge.
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
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-dark">{s.short}</div>
                    </div>
                  </div>
                  <p className="mt-2 flex-1 text-[13px] leading-relaxed text-neutral-600">{s.body}</p>
                  <div className="mt-2 rounded-lg bg-neutral-50 px-3 py-1.5 text-[11px] text-neutral-500"><b className="text-neutral-600">Penerapan:</b> {s.use}</div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={80}>
            <p className="mx-auto mt-4 max-w-2xl text-center text-[11px] leading-relaxed text-neutral-500">
              Potential vs. clinical maturity: <b>potensinya</b> is highest for embryonic &amp; iPSC (pluripotent) cells, while <b>kematangan klinis</b> is highest for somatic cells.
              Partial reprogramming research (Yamanaka factors) is now exploring <i>memutar balik jam biologis sel</i> — the frontier of longevity science.
              <br /><span className="opacity-70">For educational purposes only; stem cell therapy must be performed at licensed facilities &amp; in accordance with regulations.</span>
            </p>
          </Reveal>

          {/* Robotics in medicine */}
          <Reveal className="mt-12 text-center">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-dark">Ketelitian Mesin</span>
            <h3 className="mt-3 text-2xl font-extrabold">Robotika dalam <span className="font-serif-display italic text-brand-dark">Kedokteran</span></h3>
            <Prosa kelas="mx-auto mt-2 max-w-2xl text-sm text-neutral-600">Dari lengan bedah presisi sampai nanorobot di dalam pembuluh darah — mesin memperluas jangkauan dokter, membuat perawatan lebih aman, tidak terlalu invasif, &amp; lebih terjangkau.</Prosa>
          </Reveal>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {ROBOTICS.map((r, i) => (
              <Reveal key={r.type} delay={(i % 2) * 80}>
                <div className="liquid-glass flex h-full flex-col rounded-2xl p-5">
                  <div className="flex items-center gap-2">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-xl">{r.emoji}</span>
                    <div>
                      <div className="font-extrabold text-ink">{r.type}</div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-dark">{r.short}</div>
                    </div>
                  </div>
                  <p className="mt-2 flex-1 text-[13px] leading-relaxed text-neutral-600">{r.body}</p>
                  <div className="mt-2 rounded-lg bg-neutral-50 px-3 py-1.5 text-[11px] text-neutral-500"><b className="text-neutral-600">Penerapan:</b> {r.use}</div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={80}>
            <p className="mx-auto mt-4 max-w-2xl text-center text-[11px] leading-relaxed text-neutral-500">
              Robotics combined with <b>AI</b> (surgical navigation, real-time image analysis) &amp; <b>FHIR</b> (connected data) —
              a pairing that defines Panaceamed.id's direction: technology that strengthens, rather than replaces, clinicians.
              <br /><span className="opacity-70">Sebagian teknologinya (nanorobot) masih pada tahap penelitian dan uji klinis.</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── ABOUT US & CONTACT ─────────────────────────────────────── */}
      <section className="px-6 py-12 sm:px-10">
        <Reveal>
          <div className="mx-auto grid max-w-5xl gap-6 rounded-[2rem] border border-black/5 bg-white p-8 shadow-sm lg:grid-cols-3">
            <div>
              <h2 className="text-2xl font-extrabold">Tentang Kami</h2>
              <Prosa kelas="mt-3 text-sm leading-relaxed text-neutral-600">Panaceamed.id adalah superapp kesehatan & umur panjang Indonesia: AI menangani penerimaan awal & edukasi, dokter berizin yang memeriksa ulang. Misi kami membuat akses layanan kesehatan bermutu, pemantauan penyakit menahun, dan ilmu umur panjang terkini terjangkau bagi semua orang — didukung kecerdasan buatan yang bertanggung jawab dan kepatuhan pada UU PDP.</Prosa>
            </div>
            <div className="rounded-2xl bg-brand-50 p-5">
              <h3 className="font-bold">Hubungi Kami</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li><span className="text-neutral-500">Surel:</span> <a href="mailto:index.meds@gmail.com" className="font-semibold text-brand-dark hover:underline">index.meds@gmail.com</a></li>
                <li><span className="text-neutral-500">Instagram:</span> <a href="https://instagram.com/Panaceamed.id" target="_blank" rel="noreferrer" className="font-semibold text-brand-dark hover:underline">@Panaceamed.id</a></li>
                <li><span className="text-neutral-500">TikTok:</span> <a href="https://tiktok.com/@Panaceamed.id" target="_blank" rel="noreferrer" className="font-semibold text-brand-dark hover:underline">@Panaceamed.id</a></li>
              </ul>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-5">
              <h3 className="font-bold">Kontak Pendiri</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li><span className="text-neutral-500">Nama:</span> <b>Rizky Muhammad Azrissal</b></li>
                <li><span className="text-neutral-500">Surel:</span> <a href="mailto:Rizkyazhar486@gmail.com" className="font-semibold text-brand-dark hover:underline">Rizkyazhar486@gmail.com</a></li>
                <li><span className="text-neutral-500">Telepon:</span> <a href="tel:+6282261143040" className="font-semibold text-brand-dark hover:underline">0822-6114-3040</a></li>
                <li><span className="text-neutral-500">Instagram:</span> <a href="https://instagram.com/Rizkyazr4" target="_blank" rel="noreferrer" className="font-semibold text-brand-dark hover:underline">@Rizkyazr4</a></li>
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
              <h2 className="text-3xl font-extrabold text-ink sm:text-4xl">Mulai <span className="font-serif-display italic">masa sehat</span> perjalanan Anda</h2>
              <p className="mx-auto mt-3 max-w-xl text-ink/85">
                Free to try — choose your role and experience an AI co-physician verified by doctors.
              </p>
              <button
                onClick={onMasuk}
                className="group mt-7 inline-flex items-center gap-3 rounded-full bg-white py-2 pl-8 pr-2 font-bold text-brand-dark shadow-[0_12px_30px_-8px_rgba(0,0,0,0.35)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <span>Masuk &amp; Coba Sekarang</span>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-white transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:scale-105">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </span>
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 bg-white px-6 py-8 sm:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <Wordmark size={28} />
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} Panaceamed.id · Longevity Medical-AI · AI supports, but never
            replaces, licensed clinicians.
          </p>
        </div>
      </footer>
    </div>
  )
}
