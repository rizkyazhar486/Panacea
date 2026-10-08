import { useState, useEffect, useRef } from 'react'
import { Prosa } from '../../components/Prosa'
import { api, backendEnabled, type Health } from '../../lib/api'
import { Wordmark } from '../../components/Logo'
import { Reveal, CountUp } from '../../components/Reveal'
import { InteractiveAura } from '../../components/InteractiveAura'
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
  IconCpu,
  IconActivity,
  IconMicroscope,
  IconArticle,
  IconDna,
  IconMail,
  IconInstagram,
  IconTikTok,
  IconLinkedIn,
  IconBuilding,
  IconBookmark,
  IconComment,
  IconGlobe,
} from '../../components/icons'
import { getTheme, toggleTheme, type Theme } from '../../lib/theme'
import { MedicalNews } from '../../components/MedicalNews'
import { ScrollCinematic, ScrollCinematicStyles } from '../../components/ScrollCinematic'
import { PricingSection } from '../../components/PricingSection'
import { BatasKlaimKesehatan } from '../../components/BatasKlaimKesehatan'

const BRAND_POSTER = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1280' height='720' viewBox='0 0 1280 720'><defs><linearGradient id='bg' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23021a10'/><stop offset='50%' stop-color='%23063520'/><stop offset='100%' stop-color='%2301130a'/></linearGradient></defs><rect width='100%' height='100%' fill='url(%23bg)'/><circle cx='640' cy='360' r='140' fill='%2300BF63' opacity='0.18' filter='blur(50px)'/><text x='50%' y='48%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='32' font-weight='800' fill='%23ffffff' opacity='0.95'>PANACEAMED</text><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' font-weight='700' fill='%2334d399' letter-spacing='5'>AI-EMR &amp; LONGEVITY OS</text></svg>`

const HISTORY_POSTER = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1280' height='720' viewBox='0 0 1280 720'><defs><linearGradient id='hbg' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%230b1410'/><stop offset='50%' stop-color='%23132e22'/><stop offset='100%' stop-color='%2306150e'/></linearGradient></defs><rect width='100%' height='100%' fill='url(%23hbg)'/><circle cx='640' cy='360' r='140' fill='%2300BF63' opacity='0.15' filter='blur(50px)'/><text x='50%' y='48%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='30' font-weight='800' fill='%23ffffff' opacity='0.95'>A HISTORY OF LONGEVITY</text><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' font-weight='700' fill='%2334d399' letter-spacing='4'>FROM ANCIENT CIVILIZATIONS TO AI</text></svg>`

/**
 * Video yang hanya berputar SAAT TERLIHAT.
 * Menghindari beban unduhan bersamaan dan layar hitam pada perangkat seluler.
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
      poster={HISTORY_POSTER}
      aria-label={`Mood of the ${judul} era`}
      className="mt-3 aspect-video w-full rounded-xl bg-[#06120c] object-cover shadow-inner"
    />
  )
}

const FEATURES = [
  {
    icon: IconUsers,
    title: 'Healthy Living Dashboard',
    subtitle: 'Jejaring sosial gaya hidup sehat',
    text: 'Jejaring sosial gaya hidup sehat: bagikan rutinitas kebugaran, kebiasaan nutrisi, dan video edukasi kesehatan 30 detik bersama komunitas peduli healthspan.',
  },
  {
    icon: IconHeart,
    title: 'AI Longevity Calculator',
    subtitle: 'Estimasi longevity & usia biologis',
    text: 'Pantau kebiasaan nutrisi, aktivitas fisik, hidrasi, dan pola tidur harian. Angka longevity merupakan estimasi teknis gaya hidup, bukan diagnosis usia klinis.',
  },
  {
    icon: IconChat,
    title: 'AI Chatbot → AI-EMR',
    subtitle: 'Anamnesis terstruktur SOCRATES',
    text: 'AI memandu wawancara awal pasien (metode SOCRATES); hasil anamnesis mengalir otomatis ke kolom Subjektif/Objektif AI-EMR yang dapat ditinjau dan divalidasi langsung oleh dokter.',
  },
  {
    icon: IconStethoscope,
    title: 'Consultations, Pharmacy & Facilities',
    subtitle: 'Radar faskes & tebus resep digital',
    text: 'Telekonsultasi dokter spesialis mulai Rp49.000, tebus resep obat resmi diantar ke rumah, serta radar GPS instan pencari IGD rumah sakit terdekat saat darurat.',
  },
  {
    icon: IconStore,
    title: 'Medical Knowledge Hub',
    subtitle: 'Jurnal riset & royalti PanaceaToken',
    text: 'Akses ribuan modul klinis, catatan medis, dan jurnal riset terkurasi. Penulis terlindungi sistem watermark dokumen otomatis dengan royalti langsung berbasis PanaceaToken.',
  },
  {
    icon: IconShield,
    title: 'AI-EMR for clinicians',
    subtitle: 'Rekam medis SatuSehat / FHIR',
    text: 'Dirancang untuk praktisi medis berizin (STR) dan faskes. Dokter meninjau rekam medis secara berdaulat; deteksi interaksi obat merupakan evaluasi teknis, bukan sertifikasi keputusan klinis mandiri.',
  },
]

const ROLES = [
  // ── Untuk Pasien & Keluarga (3 Kartu Pilar) ──────────────────────
  {
    id: 'patient-core',
    category: 'patients' as const,
    title: 'Customer / Patient',
    tagline: 'Pintu Gerbang Kesehatan Personal',
    desc: 'Dasbor gaya hidup sehat, edukasi medis terpercaya, pelacak nutrisi & usia biologis, telekonsultasi, serta radar faskes darurat.',
    icon: IconHeart,
    badge: 'Akses Utama Pasien',
    points: [
      'Profil rekam medis terpadu untuk Anda dan seluruh anggota keluarga',
      'Manajemen riwayat penyakit, imunisasi, dan riwayat alergi aman',
      'Satu akun terintegrasi untuk seluruh ekosistem layanan Panacea',
    ],
  },
  {
    id: 'patient-longevity',
    category: 'patients' as const,
    title: 'AI Longevity & Gaya Hidup Sehat',
    tagline: 'Pemantauan Healthspan Longitudinal',
    desc: 'Pelacak biomarker harian: nutrisi seimbang, kualitas tidur, aktivitas fisik, hidrasi, dan estimasi usia biologis terukur.',
    icon: IconChartUp,
    badge: 'Pencegahan Preventif',
    points: [
      'Siklus evaluasi longevity 30 hari berbasis bukti sains mutakhir',
      'Rekomendasi nutrisi harian & pelacak paparan sinar matahari terarah',
      'Komunitas gaya hidup sehat untuk berbagi kebiasaan dan resep bernutrisi',
    ],
  },
  {
    id: 'patient-care',
    category: 'patients' as const,
    title: 'Telekonsultasi, Farmasi & Radar GPS',
    tagline: 'Respons Medis Cepat 24/7',
    desc: 'Anamnesis AI terstruktur SOCRATES sebelum temu spesialis, tebus resep digital, dan radar fasilitas darurat.',
    icon: IconHospital,
    badge: 'Akses Faskes & Darurat',
    points: [
      'Anamnesis mandiri hemat hingga 70% waktu administrasi di klinik',
      'Tebus resep obat resmi dikirim langsung dari apotek mitra terdekat',
      'Radar GPS instan pencari IGD rumah sakit & panggilan ambulans darurat',
    ],
  },

  // ── Untuk Dokter & Faskes (3 Kartu Pilar) ────────────────────────
  {
    id: 'doctor-core',
    category: 'doctors' as const,
    title: 'Doctor',
    tagline: 'Praktisi Medis Berizin (STR)',
    desc: 'Sistem rekam medis AI-EMR lengkap (SOAP), data klinis per pasien terpadu, perencanaan terapi, dan telekonsultasi.',
    icon: IconStethoscope,
    badge: 'Praktik Mandiri & Spesialis',
    points: [
      'Transkripsi anamnesis otomatis terstruktur ke Subjective SOAP',
      'Evaluasi diferensial komprehensif berbasis bukti medis mutakhir',
      'Kedaulatan verifikasi manusia (Human-in-the-loop Sovereign Control)',
    ],
  },
  {
    id: 'doctor-institution',
    category: 'doctors' as const,
    title: 'Klinik & Institusi Rumah Sakit',
    tagline: 'Integrasi Antrean & SatuSehat',
    desc: 'Tata kelola operasional terintegrasi: antrean rawat jalan, manajemen farmasi, dan sinkronisasi standar Kemenkes.',
    icon: IconHospital,
    badge: 'Kemitraan Faskes B2B',
    points: [
      'Jembatan interoperabilitas resmi Kemenkes SATUSEHAT (FHIR v4)',
      'Tata kelola katalog obat, resep elektronik, dan rekam medis terpadu',
      'Audit log kepatuhan data medis berstandar UU PDP No. 27/2022',
    ],
  },
  {
    id: 'doctor-cds',
    category: 'doctors' as const,
    title: 'Clinical Decision Support & Skoring',
    tagline: 'Pencegahan Insiden Medis',
    desc: 'Evaluasi keselamatan pasien real-time dengan 34 kalkulator skoring klinis internasional dan deteksi interaksi obat.',
    icon: IconCpu,
    badge: 'Evidence-Based Safety',
    points: [
      'Peringatan instan interaksi obat dan kontraindikasi alergi pasien',
      '34 skor internasional terstandar (APGAR, GCS, CURB-65, NIHSS, dll.)',
      'Ekspor resume medis terstandar untuk transfer rujukan faskes',
    ],
  },

  // ── Ekosistem & Verifikasi (3 Kartu Pilar) ───────────────────────
  {
    id: 'contributor-core',
    category: 'ecosystem' as const,
    title: 'Contributor',
    tagline: 'Penulis Medis & Peneliti',
    desc: 'Tulis, publikasikan, dan ajukan verifikasi pakar untuk modul dan materi riset medis berkeadilan.',
    icon: IconArticle,
    badge: 'Publikasi Berkeadilan',
    points: [
      'Terbitkan modul klinis, catatan ilmiah, dan panduan edukasi',
      'Watermark proteksi hak cipta dokumen otomatis untuk kontributor',
      'Royalti langsung mengalir setiap kali materi diakses atau dibeli',
    ],
  },
  {
    id: 'verifier-core',
    category: 'ecosystem' as const,
    title: 'Verifier',
    tagline: 'Dewan Penelaah Pakar',
    desc: 'Dokter spesialis menelaah keabsahan klinis materi melalui audit evidence-based medicine.',
    icon: IconShield,
    badge: 'Audit Keabsahan Ilmiah',
    points: [
      'Dokter spesialis menelaah keabsahan sitasi literatur medis',
      'Verifikasi terstruktur untuk cross-check literatur global terpercaya',
      'Stempel telaah resmi menjamin kepatuhan evidence-based medicine',
    ],
  },
  {
    id: 'token-core',
    category: 'ecosystem' as const,
    title: 'PanaceaToken',
    tagline: 'Ekonomi Token Berkeadilan',
    desc: 'Instrumen deposit dan utilitas royalti riset medis berkeadilan.',
    icon: IconStore,
    badge: 'Ekonomi Utilitas Medis',
    points: [
      'Nilai utilitas stabil: 1 PNC = Rp1.000 untuk transaksi materi riset',
      'Pembayaran royalti instan dan otomatis kepada kontributor terverifikasi',
      'Akses materi eksklusif dan jurnal medis terkurasi tanpa perantara',
    ],
  },
]

const WHATS_NEW = [
  'Dasbor sosial "Healthy Living Dashboard" — berbagi foto & video 30 detik, profil kesehatan, dan bookmark privat.',
  'Kalkulator usia biologis "AI Longevity Calculator" (akses 30 hari penuh, terjangkau Rp49.000/bulan).',
  'Farmasi digital dengan tebus & pindai resep dokter + Riwayat Transaksi terpadu.',
  'Radar faskes darurat via GPS (rumah sakit, klinik & apotek siaga 24 jam).',
  'Pusat Pengetahuan Medis "Medical Knowledge Hub" — temukan & bagikan modul, jurnal, dan catatan klinis dengan PanaceaToken.',
]

const STATS: { node: React.ReactNode; label: string }[] = [
  { node: <CountUp to={6} suffix=" Peran" />, label: 'Ekosistem Pengguna Terpadu' },
  { node: <CountUp to={100} suffix="%" />, label: 'Supervisi Klinisi (Human-in-the-Loop)' },
  { node: <CountUp to={30} suffix=" Hari" />, label: 'Siklus Evaluasi AI Longevity' },
  { node: <span>24/7</span>, label: 'Akses Siaga & Radar Darurat SOS' },
]

const MARQUEE = [
  { icon: IconHospital, label: 'Fasilitas Kesehatan Terdekat' },
  { icon: IconPill, label: 'Farmasi Digital' },
  { icon: IconStethoscope, label: 'Konsultasi Dokter' },
  { icon: IconHeart, label: 'AI Longevity Calculator' },
  { icon: IconStore, label: 'Pusat Pengetahuan Medis' },
  { icon: IconShield, label: 'AI-EMR for clinicians' },
  { icon: IconChartUp, label: 'Pemantauan Healthspan' },
]

function renderEraGlyph(era: string, fallback: string) {
  if (era === 'Zaman Para Nabi') {
    return (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="#fde68a"
        stroke="#fde68a"
        strokeWidth="0.5"
        className="text-amber-200 drop-shadow-[0_0_8px_rgba(253,230,138,0.85)]"
        aria-label="Bulan Sabit Emas Zaman Para Nabi"
      >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    )
  }
  if (era === 'Mesir Kuno') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-300">
        <path d="M12 2a4 4 0 0 0-4 4c0 3 4 7 4 7s4-4 4-7a4 4 0 0 0-4-4Z" />
        <path d="M5 12h14" />
        <path d="M12 12v10" />
      </svg>
    )
  }
  if (era === 'Yunani-Romawi') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-700 dark:text-emerald-300">
        <path d="M4 22h16" />
        <path d="M4 6h16" />
        <path d="M6 6v16" />
        <path d="M10 6v16" />
        <path d="M14 6v16" />
        <path d="M18 6v16" />
        <path d="M3 6 12 2l9 4" />
      </svg>
    )
  }
  if (era === 'Dinasti Tiongkok') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-700 dark:text-emerald-300">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    )
  }
  if (era === 'Kekaisaran Mongol') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-700 dark:text-amber-300">
        <circle cx="12" cy="12" r="10" />
        <path d="m4.93 4.93 4.24 4.24" />
        <path d="m14.83 9.17 4.24-4.24" />
        <path d="m14.83 14.83 4.24 4.24" />
        <path d="m9.17 14.83-4.24 4.24" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    )
  }
  if (era === 'Masa Keemasan Islam') {
    return <IconStethoscope size={20} className="text-emerald-600 dark:text-emerald-300" />
  }
  return <span className="text-lg font-serif">{fallback}</span>
}

// ── History of longevity, anti-aging, wellness & healthcare systems ──────────────
const HISTORY_ERAS: { era: string; when: string; emoji: string; title: string; body: string; video?: string }[] = [
  {
    era: 'Mesir Kuno',
    when: '≈3000–300 SM',
    emoji: '𓂀',
    title: 'Firaun & Papirus Medis',
    body: 'Papirus Edwin Smith dan Ebers mencatat resep obat, bedah, dan sanitasi. Firaun mendambakan hidup abadi lewat mumifikasi; Imhotep dihormati sebagai tabib utama. Minyak atsiri (kelor, madu) menjadi formula anti-penuaan paling awal dalam sejarah peradaban.',
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_091507_583431ed-8898-4dfa-b8f9-c5b0dbbe2f60.mp4',
  },
  {
    era: 'Zaman Para Nabi',
    when: '≈2000 SM–632 M',
    emoji: '☾',
    title: 'Tradisi Kenabian & Higienitas',
    body: 'Ajaran para nabi menekankan wudu dan kebersihan tubuh, puasa berkala, madu, habbatussauda, dan pola makan terukur ("sepertiga makanan, sepertiga minuman, sepertiga napas"). Prinsip pencegahan dan moderasi ini terbukti selaras dengan sains longevity modern.',
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_091443_997b4cca-33e8-4172-a8bf-196145536064.mp4',
  },
  {
    era: 'Yunani-Romawi',
    when: '≈500 SM–500 M',
    emoji: '🏛️',
    title: 'Hippocrates & Galen',
    body: 'Hippocrates mengajarkan "jadikan makananmu sebagai obat" dan meletakkan sumpah etika kedokteran (Hippocratic Oath). Galen menyusun fisiologi tubuh. Bangsa Romawi membangun akuaduk air bersih dan pemandian umum — fondasi awal sanitasi kesehatan publik.',
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_091602_57f19059-6460-40e3-a9eb-05fcdf9d0fee.mp4',
  },
  {
    era: 'Dinasti Tiongkok',
    when: '≈200 SM–1912 M',
    emoji: '🐉',
    title: 'Qi, Herbal & Eliksir Panjang Umur',
    body: 'Kitab Huangdi Neijing meletakkan dasar pengobatan tradisional Tiongkok (TCM). Qigong, akupunktur, ginseng, dan keseimbangan yin-yang membentuk pendekatan holistik untuk menjaga vitalitas dan keselarasan energi tubuh (healthspan).',
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_091631_5438f5ac-1e17-4937-b4a9-01346777ee0c.mp4',
  },
  {
    era: 'Kekaisaran Mongol',
    when: '≈1206–1368 M',
    emoji: '🏹',
    title: 'Pertukaran Kedokteran Antar-Bangsa',
    body: 'Pax Mongolica menghubungkan tabib Persia, Tiongkok, dan Arab di sepanjang Jalur Sutra — saling bertukar ilmu bedah, farmasi, dan karantina. Rumah sakit bergerak serta standar kebugaran prajurit menjadi bentuk awal "performance medicine".',
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_091728_c9ef0932-4b2b-46fc-ae0b-a33a276529ac.mp4',
  },
  {
    era: 'Masa Keemasan Islam',
    when: '≈800–1300 M',
    emoji: '⚕️',
    title: 'Ibnu Sina & Rumah Sakit Bimaristan',
    body: "Kitab Al-Qanun fi at-Tibb karya Ibnu Sina menjadi rujukan kedokteran dunia selama 600 tahun. Al-Razi memelopori pencatatan rekam medis klinis. Bimaristan — rumah sakit dengan resep, farmasi, dan bangsal spesialis — menjadi cikal bakal sistem rumah sakit modern.",
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_091759_7444344d-fd5c-47c7-a0a5-d551e686742f.mp4',
  },
]

const HISTORY_MODERN: { decade: string; title: string; body: string }[] = [
  { decade: '1900–1950', title: 'Antibiotik & Vaksinasi Massal', body: 'Penemuan penisilin oleh Alexander Fleming (1928), vaksinasi massal, dan sanitasi publik melipatgandakan angka harapan hidup global, membebaskan peradaban dari ancaman epidemi mematikan.' },
  { decade: '1960–1980', title: 'Rekam Medis & Evidence-Based Medicine', body: 'Lahirnya rekam medis elektronik pertama (Problem-Oriented Medical Record). Uji klinis acak (RCT) menjadi baku emas kebenaran ilmiah, bersamaan dengan lahirnya disiplin gerontologi.' },
  { decade: '1990–2000', title: 'Genomika & Biologi Telomer', body: 'Proyek Genom Manusia (Human Genome Project) berhasil memetakan DNA manusia. Penemuan telomerase membuka tabir penuaan seluler dan internet mulai mendemokratisasi akses literatur medis.' },
  { decade: '2000–2010', title: 'Standar Interoperabilitas Rekam Medis', body: 'Penerapan massal Electronic Health Records (EHR). Kelahiran standar HL7® FHIR (2011) yang kini menjadi protokol universal pertukaran data medis digital terenkripsi.' },
  { decade: '2010–2020', title: 'Sensor Tubuh & Riset Healthspan', body: 'Era smartwatch, biomarker sensor, dan CGM. Riset senolitik, NAD+, dan puasa intermiten membawa ilmu longevity dari laboratorium ke arus utama sains preventif.' },
  { decade: '2020–Kini', title: 'Integrasi AI Medis + SATUSEHAT FHIR', body: 'Kecerdasan artifisial membantu wawancara anamnesis dan analisis penunjang; FHIR menyatukan data pasien secara utuh. Panaceamed.id hadir: sinergi AI teruji, verifikasi dokter berizin, dan pemantauan longevity terukur.' },
]

const STEM_CELLS: { type: string; icon: typeof IconActivity; short: string; body: string; use: string }[] = [
  {
    type: 'Sel Punca Somatik (Dewasa)',
    icon: IconActivity,
    short: 'Multipoten',
    body: 'Ditemukan pada sumsum tulang, jaringan lemak, dan darah tali pusat. Bertaraf multipoten dan terbukti sangat aman digunakan secara rutin dalam praktik klinis (misal: transplantasi sumsum tulang).',
    use: 'Terapi darah, ortopedi, penyembuhan luka kronis',
  },
  {
    type: 'Sel Punca Embrionik',
    icon: IconMicroscope,
    short: 'Pluripoten',
    body: 'Berasal dari blastokista awal; mampu berdiferensiasi menjadi hampir seluruh jenis sel tubuh. Sangat bernilai untuk riset regenerasi organ, namun memiliki pertimbangan etika serta risiko penolakan imun.',
    use: 'Riset perkembangan, pemodelan penyakit, regenerasi organ',
  },
  {
    type: 'iPSC (Induced Pluripotent)',
    icon: IconDna,
    short: 'Pluripoten Rekayasa',
    body: 'Sel dewasa (kulit/darah) diprogram ulang kembali ke fase pluripotensi (Yamanaka, Peraih Nobel 2012). Menggabungkan keunggulan pluripotensi sel embrionik tanpa isu etika dan minim risiko penolakan imun.',
    use: 'Kedokteran presisi, uji efikasi obat, riset peremajaan seluler',
  },
]

const ROBOTICS: { type: string; icon: typeof IconCpu; short: string; body: string; use: string }[] = [
  {
    type: 'Bedah Robotik Presisi',
    icon: IconCpu,
    short: 'Mikro-presisi',
    body: 'Sistem seperti da Vinci memungkinkan dokter bedah mengoperasi organ melalui sayatan mikro dengan filtrasi tremor tangan dan visualisasi 3D definisi tinggi. Hasilnya: luka minimal, nyeri berkurang, dan masa pulih jauh lebih cepat.',
    use: 'Urologi, ginekologi, bedah jantung & pencernaan',
  },
  {
    type: 'Prostetik Bionik & Eksoskeleton',
    icon: IconActivity,
    short: 'Bionik Adaptif',
    body: 'Tangan dan kaki bionik yang dikendalikan oleh sinyal saraf motorik pasien, ditambah baju zirah robotik (exoskeleton) yang membantu pasien stroke dan cedera tulang belakang kembali berjalan secara mandiri.',
    use: 'Rehabilitasi medik, pemulihan stroke, cedera saraf',
  },
  {
    type: 'Nanorobotik & Skala Seluler',
    icon: IconMicroscope,
    short: 'Skala Seluler',
    body: 'Robot skala mikro/nano (dalam fase uji klinis) yang dirancang untuk mengantarkan molekul obat langsung ke sel target kanker tanpa merusak sel sehat di sekitarnya. Puncak kedokteran presisi masa depan.',
    use: 'Penghantaran obat tertarget, navigasi intravaskular',
  },
  {
    type: 'Robot Terapi & Pendamping Perawatan',
    icon: IconHeart,
    short: 'Pendamping Perawatan',
    body: 'Robot fisioterapi gerakan repetitif untuk pemulihan motorik pasca-stroke, robot pendamping lansia (pemantau jatuh & pengingat jadwal obat), serta stasiun telepresence dokter jarak jauh.',
    use: 'Fisioterapi, perawatan geriatri, telemedisin',
  },
]

export function Landing({ onMasuk }: { onMasuk: () => void }) {
  const [theme, setTheme] = useState<Theme>(getTheme)
  const [promo, setPromo] = useState<Health['promo'] | null>(null)
  const [roleTab, setRoleTab] = useState<'patients' | 'doctors' | 'ecosystem'>('patients')
  const [scienceTab, setScienceTab] = useState<'eras' | 'modern' | 'stem' | 'robotics' | 'all'>('eras')
  const [activeEra, setActiveEra] = useState(0)

  useEffect(() => {
    if (backendEnabled) api.health().then((h) => setPromo(h.promo ?? null)).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-white text-ink dark:bg-black dark:text-neutral-100">
      {/* ── [1] CLINICAL TRUST DOCK (KEPATUHAN MEDIS & PRIVASI DATA) ── */}
      <div className="dark relative z-40 w-full border-b border-emerald-500/20 bg-gradient-to-r from-[#02180e] via-[#043320] to-[#02180e] px-4 py-2 shadow-inner">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 text-center text-xs font-medium text-emerald-100 sm:gap-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/25 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest shadow-sm"
            style={{ color: '#6ee7b7' }}
          >
            <IconShield size={12} className="shrink-0" />
            Kepatuhan Medis
          </span>
          <span className="tracking-wide">
            Interoperabilitas <b>SATUSEHAT (HL7® FHIR)</b>
            <span className="mx-2 opacity-40">·</span>
            Perlindungan Data Medis <b>UU PDP No. 27/2022</b>
            <span className="mx-2 hidden opacity-40 sm:inline">·</span>
            <span className="hidden sm:inline">Verifikasi STR Klinisi Berizin</span>
          </span>
        </div>
      </div>

      {/* ── FLOATING GLASS NAVBAR ─────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-black/5 bg-white/85 px-4 py-3 backdrop-blur-2xl dark:border-white/10 dark:bg-black/85 sm:px-8">
        <div className="min-w-0 shrink">
          <Wordmark size={32} />
        </div>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-neutral-600 dark:text-neutral-300 lg:flex">
          <a href="#features" className="transition hover:text-brand-dark dark:hover:text-emerald-400">
            Kapabilitas Platform
          </a>
          <a href="#roles" className="transition hover:text-brand-dark dark:hover:text-emerald-400">
            Profil Pengguna
          </a>
          <a href="#pricing" className="transition hover:text-brand-dark dark:hover:text-emerald-400">
            Tarif &amp; Layanan
          </a>
          <a href="#science" className="transition hover:text-brand-dark dark:hover:text-emerald-400">
            Eksplorasi Sains
          </a>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setTheme(toggleTheme())}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-black/5 text-neutral-600 transition hover:bg-neutral-100 hover:text-brand-dark dark:border-white/10 dark:text-neutral-300 dark:hover:bg-neutral-800"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
          </button>
          <button
            onClick={onMasuk}
            className="min-h-[42px] whitespace-nowrap rounded-full bg-gradient-to-b from-[#00BF63] to-[#0b7a4b] px-5 py-2 text-sm font-extrabold text-white shadow-md shadow-brand/20 transition hover:brightness-105 active:scale-95 sm:px-6"
          >
            Masuk <span className="hidden sm:inline">/ Daftar Gratis</span>
          </button>
        </div>
      </header>

      {/* ── [2] HERO SPLIT: "THE AI CLINIC FOR LONGITUDINAL HEALTH" ── */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-8 sm:py-20 lg:py-24">
        {/* Cinematic brand film (Higgsfield) behind the hero */}
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

        <div className="relative mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            {/* Sisi Kiri (Value Proposition) */}
            <div className="text-center lg:col-span-6 lg:text-left">
              <Reveal>
                <div className="liquid-glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 shadow-sm">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-700 dark:text-neutral-200">
                    SISTEM DUKUNGAN KLINIS &amp; KESEHATAN PREVENTIF
                  </span>
                </div>
              </Reveal>

              <Reveal delay={80}>
                <h1 className="mt-5 text-4xl font-black leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl">
                  Platform AI-EMR &amp; Rekam Medis Modern untuk{' '}
                  <span className="font-serif-display bg-gradient-to-r from-[#0b7a4b] to-[#00BF63] bg-clip-text italic text-transparent">
                    Kesehatan &amp; Longevity Anda
                  </span>
                </h1>
                <BatasKlaimKesehatan permukaan="care.landing" className="mt-3.5 max-w-xl text-[12px] leading-snug text-neutral-500" />
              </Reveal>

              <Reveal delay={160}>
                <p className="mt-5 max-w-xl text-neutral-600 dark:text-neutral-300 sm:text-lg leading-relaxed">
                  AI menyusun anamnesis terstruktur awal; dokter berizin menelaah rekam medis. Tingkatkan rentang hidup sehat (<b>healthspan</b>) Anda melalui evaluasi klinis preventif, deteksi dini risiko, dan panduan gaya hidup berbasis bukti.
                </p>
              </Reveal>

              <Reveal delay={240}>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 lg:justify-start">
                  <button
                    onClick={onMasuk}
                    className="group relative flex items-center gap-3 overflow-hidden rounded-full bg-gradient-to-b from-[#00BF63] to-[#0b7a4b] py-3 pl-7 pr-3 font-extrabold text-white shadow-[0_10px_30px_-8px_rgba(0,191,99,0.5)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.98]"
                  >
                    <span className="relative z-10 text-sm sm:text-base">Mulai Konsultasi Gratis</span>
                    <span className="relative z-10 grid h-8 w-8 place-items-center rounded-full bg-white/20 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:scale-105">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                    </span>
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  </button>
                  <a
                    href="#roles"
                    className="flex items-center rounded-full border border-black/10 bg-white/70 px-6 py-3 font-bold text-neutral-700 shadow-sm backdrop-blur-md transition-all duration-500 hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-neutral-800/70 dark:text-neutral-200"
                  >
                    Solusi Dokter &amp; Faskes
                  </a>
                </div>
              </Reveal>

              {/* Micro Trust Badges */}
              <Reveal delay={280}>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-black/5 pt-5 dark:border-white/10 lg:justify-start">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                    <IconShield size={14} className="text-emerald-600 dark:text-emerald-400" />
                    34 Skoring Klinis Standar
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                    <IconCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                    Enkripsi Data Medis End-to-End
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                    <IconStethoscope size={14} className="text-emerald-600 dark:text-emerald-400" />
                    Interoperabilitas SatuSehat
                  </span>
                </div>
              </Reveal>
            </div>

            {/* Sisi Kanan (Interactive Live Card Showcase) */}
            <div className="lg:col-span-6">
              <Reveal delay={200}>
                <div className="relative mx-auto max-w-xl rounded-3xl border border-black/10 bg-white/80 p-5 shadow-2xl backdrop-blur-2xl dark:border-white/15 dark:bg-black/70 sm:p-6">
                  <div className="flex items-center justify-between gap-3 border-b border-black/5 pb-3.5 dark:border-white/10">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="whitespace-nowrap font-mono text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                        Clinical OS · Sesi Aktif
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className="whitespace-nowrap rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                        HL7® FHIR
                      </span>
                      <span className="whitespace-nowrap rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                        SOCRATES
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3.5">
                    {/* Stacked Card 1: AI Clinical Intake Parser */}
                    <div className="rounded-2xl border border-black/5 bg-white/90 p-4 shadow-sm dark:border-white/5 dark:bg-neutral-900/90">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2 text-xs font-bold text-neutral-700 dark:text-neutral-200">
                          <IconChat size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span className="whitespace-nowrap">AI Intake Parser (SOCRATES)</span>
                        </div>
                        <span className="shrink-0 whitespace-nowrap text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Perekaman Aktif</span>
                      </div>
                      <div className="mt-2.5 space-y-2 text-xs">
                        <div className="rounded-xl bg-neutral-100/80 p-2.5 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">Keluhan Pasien:</span>
                          <p className="mt-0.5 font-medium leading-relaxed">"Jantung berdebar dan sesak ringan pasca lari pagi 5km."</p>
                        </div>
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/70 p-2.5 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Terjemahan SOAP (Subjektif):</span>
                          <p className="mt-0.5 text-[11px] font-medium leading-relaxed">Onset akut, palpitasi teratur pasca-latihan, tanpa riwayat syncope sebelumnya.</p>
                        </div>
                      </div>
                    </div>

                    {/* Stacked Card 2: Longevity Biomarkers Dial */}
                    <div className="rounded-2xl border border-black/5 bg-white/90 p-4 shadow-sm dark:border-white/5 dark:bg-neutral-900/90">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2 text-xs font-bold text-neutral-700 dark:text-neutral-200">
                          <IconHeart size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span className="whitespace-nowrap">Biomarker &amp; Healthspan</span>
                        </div>
                        <span className="shrink-0 whitespace-nowrap rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Skor: 94/100
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Usia Kronologis</div>
                          <div className="text-2xl font-black text-ink">42 <span className="text-xs font-normal text-neutral-500">thn</span></div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Usia Biologis</div>
                          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">36.4 <span className="text-xs font-normal">thn</span></div>
                        </div>
                      </div>
                      <div className="mt-2.5">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-neutral-500">Keunggulan Healthspan</span>
                          <span className="text-emerald-600 dark:text-emerald-400">+5.6 thn</span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                          <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" />
                        </div>
                        <div className="mt-2 flex justify-between text-[10px] text-neutral-500">
                          <span>HRV: 68 ms</span>
                          <span>Tidur: 8.4 jam</span>
                          <span>Aktivitas: 8.200 langkah</span>
                        </div>
                      </div>
                    </div>

                    {/* Stacked Card 3: Persetujuan Dokter Berizin */}
                    <div className="rounded-2xl border border-black/5 bg-white/90 p-4 shadow-sm dark:border-white/5 dark:bg-neutral-900/90">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2 text-xs font-bold text-neutral-700 dark:text-neutral-200">
                          <IconStethoscope size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span className="whitespace-nowrap">Verifikasi Klinisi &amp; STR</span>
                        </div>
                        <span className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <IconCheck size={11} /> STR Valid
                        </span>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <div className="whitespace-nowrap font-bold text-neutral-800 dark:text-neutral-200">dr. Sp.PD (Spesialis Penyakit Dalam)</div>
                          <div className="whitespace-nowrap text-[11px] text-neutral-500">Rekam Medis EMR Ditandatangani &amp; Terarsip</div>
                        </div>
                        <div className="shrink-0 whitespace-nowrap rounded-lg border border-dashed border-emerald-500/40 bg-emerald-50/70 px-2.5 py-1 text-center text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                          Dokter Berdaulat
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>

          {/* Stat band — glassmorphism */}
          <Reveal delay={300}>
            <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
              {STATS.map((s, i) => (
                <div key={i} className="liquid-glass rounded-2xl p-4 text-center shadow-sm">
                  <div className="bg-gradient-to-r from-brand to-brand-dark bg-clip-text text-2xl font-black text-transparent sm:text-3xl">
                    {s.node}
                  </div>
                  <div className="mt-1 text-[11px] font-semibold leading-tight text-neutral-500">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
          <p className="mt-4 text-center text-xs text-neutral-500">AI mendukung proses evaluasi, namun tidak pernah menggantikan pertimbangan dokter berizin.</p>
        </div>
      </section>

      {/* ── SCROLL-CINEMATIC OVERTURE ─────────────────────────── */}
      <ScrollCinematicStyles />
      <ScrollCinematic />

      {/* Marquee strip */}
      <style>{`#panacea-track{animation:panaceaGo 45s linear infinite!important}@keyframes panaceaGo{from{transform:translateX(0)}to{transform:translateX(-33.333%)}}`}</style>
      <div className="relative overflow-hidden border-y border-black/5 bg-white/40 py-5 backdrop-blur dark:border-white/5 dark:bg-black/40">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white/80 to-transparent dark:from-black/80" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white/80 to-transparent dark:from-black/80" />
        <div id="panacea-track" className="flex w-max" onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = 'paused')} onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = 'running')}>
          {[0, 1, 2].map((g) => (
            <div key={g} className="flex shrink-0 gap-10 pr-10" aria-hidden={g !== 0}>
              {MARQUEE.map((m, i) => (
                <span key={i} className="flex shrink-0 items-center gap-2 text-sm font-bold text-neutral-500 dark:text-neutral-300">
                  <m.icon size={18} className="text-brand-dark dark:text-emerald-400" /> {m.label}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURED BRAND FILM (Black Video Glitch Safeguard) ──── */}
      <section className="px-6 py-16 sm:px-10">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
          {/* Brand Intro Film Card with fallback gradient and poster */}
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] border border-black/5 bg-gradient-to-br from-[#02180e] via-[#042817] to-[#02120b] shadow-2xl shadow-brand/20 dark:border-white/10">
              <video
                src={`${import.meta.env.BASE_URL}media/brand-intro.mp4`}
                autoPlay muted loop playsInline
                poster={BRAND_POSTER}
                className="aspect-video w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">Sekilas Platform</span>
                </div>
                <h3 className="mt-1 text-lg font-bold sm:text-xl">Panaceamed: AI-EMR &amp; Longevity OS</h3>
              </div>
            </div>
          </Reveal>
          {/* Higgsfield Nature Film */}
          <Reveal delay={80}>
            <div className="relative overflow-hidden rounded-[2rem] border border-black/5 bg-gradient-to-br from-[#02180e] via-[#042817] to-[#02120b] shadow-2xl shadow-brand/20 dark:border-white/10">
              <video
                src="https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_023227_88b54135-7489-48de-9476-ca0657fc0d29.mp4"
                autoPlay muted loop playsInline
                poster={BRAND_POSTER}
                className="aspect-video w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <h2 className="text-xl font-extrabold sm:text-2xl">
                  Alam. Kemanusiaan. <span className="font-serif-display italic text-emerald-300">Vitalitas.</span>
                </h2>
                <p className="mt-1 max-w-xl text-[13px] text-white/80">Memperpanjang healthspan berbasis sains — menambah kualitas hidup pada setiap tahun usia Anda.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CHAPTER 01 / KAPABILITAS PLATFORM ───────────────────── */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />
      <section id="features" className="mx-auto max-w-6xl px-6 py-24 sm:px-10">
        <div id="about" />
        <Reveal className="text-center">
          <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-black/5 bg-neutral-100/90 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 shadow-sm dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-300">
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">01</span>
            <span className="h-2 w-px bg-neutral-300 dark:bg-neutral-600" />
            <span>Kapabilitas Platform</span>
          </div>
          <div>
            <span className="rounded-full border border-brand/30 bg-brand-50 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark dark:bg-emerald-950/60 dark:text-emerald-300">
              Arsitektur Inti
            </span>
          </div>
          <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl text-ink">
            Apa itu <span className="font-serif-display italic text-brand-dark dark:text-emerald-400">Panaceamed.id</span>?
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-neutral-600 dark:text-neutral-300 sm:text-base leading-relaxed">
            Platform <b>AI-EMR</b> dan <b>pusat pengetahuan medis</b> terpadu. AI memfasilitasi wawancara awal &amp;
            analisis pendukung melalui chatbot, yang kemudian dialirkan ke rekam medis yang <b>ditelaah dan disahkan
            oleh dokter berizin</b>. Visi kami: <b>platform rekam medis terpadu untuk masa depan kesehatan Anda.</b>
          </p>
        </Reveal>

        {/* The Asymmetric Bento Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* KARTU BESAR (2 Kolom): AI Chatbot → AI-EMR */}
          <Reveal className="md:col-span-2 lg:col-span-2">
            <div
              role="button"
              tabIndex={0}
              onClick={onMasuk}
              onKeyDown={(e) => e.key === 'Enter' && onMasuk()}
              className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-brand/30 bg-gradient-to-br from-emerald-50/50 via-white to-white p-7 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand/10 dark:border-white/10 dark:from-emerald-950/20 dark:via-neutral-900 dark:to-neutral-900"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-dark shadow-inner dark:bg-emerald-950 dark:text-emerald-300">
                      <IconChat size={22} />
                    </span>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Mesin Anamnesis Awal</span>
                      <h3 className="text-xl font-extrabold text-ink sm:text-2xl">AI Chatbot → AI-EMR</h3>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    Metode SOCRATES
                  </span>
                </div>

                <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Anamnesis terstruktur <b>meringankan beban administrasi klinisi</b>. AI memandu wawancara pasien awal dengan protokol SOCRATES; hasil anamnesis terpetakan otomatis ke kolom Subjektif/Objektif AI-EMR untuk ditelaah dan divalidasi langsung oleh dokter berizin.
                </p>

                {/* Live Auto-Generate SOAP Preview */}
                <div className="mt-5 rounded-2xl border border-black/5 bg-white/90 p-4 shadow-sm dark:border-white/5 dark:bg-black/50">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                    Pratinjau Format SOAP Terstruktur:
                  </div>
                  <div className="mt-2.5 grid gap-2 sm:grid-cols-2 text-xs">
                    <div className="rounded-xl bg-neutral-100/70 p-2.5 dark:bg-neutral-800/70">
                      <b className="text-emerald-700 dark:text-emerald-400">[S] Subjektif:</b> Riwayat keluhan, timeline onset, &amp; faktor pencetus terpetakan otomatis.
                    </div>
                    <div className="rounded-xl bg-neutral-100/70 p-2.5 dark:bg-neutral-800/70">
                      <b className="text-blue-700 dark:text-blue-400">[O] Objektif:</b> Tanda vital terstandar &amp; integrasi data lab terverifikasi.
                    </div>
                    <div className="rounded-xl bg-neutral-100/70 p-2.5 dark:bg-neutral-800/70">
                      <b className="text-purple-700 dark:text-purple-400">[A] Asesmen:</b> Diagnosis banding evidens klinis dengan batasan klaim.
                    </div>
                    <div className="rounded-xl bg-neutral-100/70 p-2.5 dark:bg-neutral-800/70">
                      <b className="text-amber-700 dark:text-amber-400">[P] Plan:</b> Rencana terapi &amp; rekomendasi rujukan ditandatangani dokter berizin.
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-black/5 pt-4 dark:border-white/10">
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-dark dark:bg-emerald-950 dark:text-emerald-300">
                  ✓ Supervisi Penuh Dokter Berizin
                </span>
                <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                  Standar HL7® FHIR
                </span>
              </div>
            </div>
          </Reveal>

          {/* KARTU TINGGI (1 Kolom): AI Longevity Calculator */}
          <Reveal delay={90} className="md:col-span-1 lg:col-span-1 lg:row-span-2">
            <div
              role="button"
              tabIndex={0}
              onClick={onMasuk}
              onKeyDown={(e) => e.key === 'Enter' && onMasuk()}
              className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-black/5 bg-gradient-to-br from-white to-neutral-50 p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl dark:border-white/10 dark:from-neutral-900 dark:to-neutral-950"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-dark shadow-inner dark:bg-emerald-950 dark:text-emerald-300">
                    <IconHeart size={22} />
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Estimasi Usia Biologis
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-extrabold text-ink dark:text-white">AI Longevity Calculator</h3>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Pantau biomarker gaya hidup: nutrisi, hidrasi, kualitas tidur, dan aktivitas fisik harian. Dapatkan estimasi usia biologis terukur untuk menjaga vitalitas tubuh Anda secara optimal. (Catatan: estimasi teknis gaya hidup, bukan diagnosis klinis).
                </p>

                {/* Dial Gauge Preview */}
                <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-50/50 p-4 text-center dark:bg-emerald-950/30">
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                    Indikator Usia Biologis
                  </div>
                  <div className="mt-2 text-3xl font-black text-ink dark:text-white">
                    36.4 <span className="text-sm font-semibold text-emerald-600">thn</span>
                  </div>
                  <div className="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    +5.6 thn Keunggulan Healthspan
                  </div>

                  <div className="mt-4 space-y-2 text-left text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                        <span>Pola Nutrisi Seimbang</span>
                        <span className="font-bold text-emerald-600">88%</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-800">
                        <div className="h-full w-[88%] rounded-full bg-emerald-500" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                        <span>Aktivitas &amp; Langkah Kaki</span>
                        <span className="font-bold text-emerald-600">92%</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-800">
                        <div className="h-full w-[92%] rounded-full bg-emerald-500" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                        <span>Kualitas Tidur &amp; Pemulihan</span>
                        <span className="font-bold text-emerald-600">84%</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-800">
                        <div className="h-full w-[84%] rounded-full bg-emerald-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-black/5 pt-4 text-[11px] font-medium text-neutral-500 dark:border-white/10">
                Siklus evaluasi terarah 30 hari untuk optimalisasi kesehatan longitudinal.
              </div>
            </div>
          </Reveal>

          {/* KARTU KECIL: Radar Faskes & Resep GPS */}
          <Reveal delay={120}>
            <div
              role="button"
              tabIndex={0}
              onClick={onMasuk}
              onKeyDown={(e) => e.key === 'Enter' && onMasuk()}
              className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-black/5 bg-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl dark:border-white/10 dark:bg-neutral-900"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-dark shadow-inner dark:bg-emerald-950 dark:text-emerald-300">
                    <IconStethoscope size={22} />
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950 dark:text-red-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    Respons Cepat Medis
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-extrabold text-ink">Consultations, Pharmacy &amp; Facilities</h3>
                <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Telekonsultasi dokter spesialis mulai Rp49.000, tebus resep obat resmi diantar ke rumah, dan radar GPS instan pencari IGD rumah sakit terdekat saat darurat.
                </p>

                {/* Mini Radar Dot Animation */}
                <div className="mt-4 rounded-xl border border-black/5 bg-neutral-50 p-3 dark:border-white/5 dark:bg-neutral-800/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-neutral-700 dark:text-neutral-200">
                      <IconHospital size={14} className="text-emerald-600 dark:text-emerald-400" /> RS Darurat Terdekat
                    </span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">1.2 km</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-neutral-700 dark:text-neutral-200">
                      <IconPill size={14} className="text-emerald-600 dark:text-emerald-400" /> Apotek Mitra Panacea
                    </span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">400 m</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-black/5 pt-3 text-[11px] font-semibold text-neutral-500 dark:border-white/10">
                Panggilan cepat SOS &amp; tebus resep digital resmi
              </div>
            </div>
          </Reveal>

          {/* KARTU SEDANG: Knowledge Hub & Token Royalti */}
          <Reveal delay={150}>
            <div
              role="button"
              tabIndex={0}
              onClick={onMasuk}
              onKeyDown={(e) => e.key === 'Enter' && onMasuk()}
              className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-black/5 bg-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl dark:border-white/10 dark:bg-neutral-900"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-dark shadow-inner dark:bg-emerald-950 dark:text-emerald-300">
                    <IconStore size={22} />
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    PanaceaToken
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-extrabold text-ink">Medical Knowledge Hub</h3>
                <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Akses ribuan modul klinis, catatan medis, dan jurnal riset terkurasi. Penulis terlindungi sistem watermark dokumen otomatis dengan royalti langsung berbasis PanaceaToken.
                </p>

                {/* Preview dokumen ber-watermark */}
                <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-50/40 p-3 text-xs dark:bg-emerald-950/30">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200">
                    <IconArticle size={14} className="text-emerald-700 dark:text-emerald-400" /> Jurnal: Terapi Mitokondria &amp; Longevity
                  </div>
                  <div className="mt-0.5 text-[10px] text-emerald-700 dark:text-emerald-400">
                    Watermark Perlindungan Penulis · Royalti PNC Otomatis
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-black/5 pt-3 text-[11px] font-semibold text-neutral-500 dark:border-white/10">
                Ekonomi token transparan untuk dokter &amp; peneliti
              </div>
            </div>
          </Reveal>

          {/* KARTU SOSIAL: Healthy Living Dashboard */}
          <Reveal delay={180}>
            <div
              role="button"
              tabIndex={0}
              onClick={onMasuk}
              onKeyDown={(e) => e.key === 'Enter' && onMasuk()}
              className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-black/5 bg-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl dark:border-white/10 dark:bg-neutral-900"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-dark shadow-inner dark:bg-emerald-950 dark:text-emerald-300">
                    <IconUsers size={22} />
                  </span>
                  <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-bold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                    Komunitas &amp; Gaya Hidup
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-extrabold text-ink">Healthy Living Dashboard</h3>
                <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Jejaring sosial gaya hidup sehat interaktif: bagikan rutinitas kebugaran, kebiasaan nutrisi, dan video edukasi kesehatan 30 detik bersama komunitas peduli healthspan.
                </p>

                {/* Social Card Feed Snippet */}
                <div className="mt-4 rounded-xl border border-black/5 bg-neutral-50 p-2.5 dark:bg-neutral-800/60 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-neutral-800 dark:text-neutral-200">
                    <IconActivity size={14} className="text-emerald-600 dark:text-emerald-400" /> Lari Pagi 5.2 km · Zone 2 Cardio
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-[10px] text-neutral-500">
                    <span className="inline-flex items-center gap-1"><IconHeart size={12} className="text-rose-500" /> 142 Suka</span>
                    <span className="inline-flex items-center gap-1"><IconComment size={12} className="text-emerald-600 dark:text-emerald-400" /> 18 Komentar</span>
                    <span className="inline-flex items-center gap-1"><IconBookmark size={12} className="text-amber-500" /> 34 Disimpan</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-black/5 pt-3 text-[11px] font-semibold text-neutral-500 dark:border-white/10">
                Interaksi positif gaya hidup sehat &amp; kebiasaan produktif
              </div>
            </div>
          </Reveal>

          {/* KARTU TATA KELOLA MEDIS: AI-EMR for clinicians */}
          <Reveal delay={210} className="md:col-span-2 lg:col-span-2">
            <div
              role="button"
              tabIndex={0}
              onClick={onMasuk}
              onKeyDown={(e) => e.key === 'Enter' && onMasuk()}
              className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-black/5 bg-gradient-to-br from-white to-neutral-50 p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl dark:border-white/10 dark:from-neutral-900 dark:to-neutral-950"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-dark shadow-inner dark:bg-emerald-950 dark:text-emerald-300">
                      <IconShield size={22} />
                    </span>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Tata Kelola Klinis</span>
                      <h3 className="text-xl font-extrabold text-ink dark:text-white sm:text-2xl">AI-EMR for clinicians</h3>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Interoperabilitas SATUSEHAT
                  </span>
                </div>

                <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Dirancang untuk dokter berizin (STR) dan fasilitas kesehatan. Mengotomatisasi resume SOAP klinis, evaluasi interaksi obat teknis, dan sinkronisasi standar SATUSEHAT Kemenkes (HL7® FHIR) guna memangkas beban administrasi.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-black/5 bg-neutral-100/70 p-3 text-xs dark:bg-neutral-800/70">
                  <span className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
                    <IconCheck size={14} /> Jembatan SatuSehat FHIR Aktif
                  </span>
                  <span className="text-neutral-400">•</span>
                  <span className="text-neutral-700 dark:text-neutral-300">Peringatan Interaksi Obat Otomatis</span>
                  <span className="text-neutral-400">•</span>
                  <span className="text-neutral-700 dark:text-neutral-300">Tanda Tangan Digital Dokter Sah</span>
                </div>
              </div>

              <div className="mt-5 border-t border-black/5 pt-4 text-[11px] font-medium text-neutral-500 dark:border-white/10">
                Menjunjung kedaulatan klinisi penuh — AI sebagai alat bantu pembuat keputusan, bukan pengganti praktisi.
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CHAPTER 02 / USER PERSONAS & GOVERNANCE ─────────────── */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />
      <section id="roles" className="relative overflow-hidden bg-gradient-to-b from-[#f4f8f5] via-[#edf5f0] to-[#f4f8f5] px-6 py-24 border-y border-emerald-500/15 dark:border-white/5 dark:from-[#030d07] dark:via-[#06150d] dark:to-[#030d07] sm:px-10">
        <div className="orb pointer-events-none absolute right-10 top-10 h-60 w-60 rounded-full bg-brand/15 blur-3xl" />
        <div className="relative mx-auto max-w-5xl">
          <Reveal className="text-center">
            <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50/90 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-950/70 dark:text-emerald-300">
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">02</span>
              <span className="h-2 w-px bg-emerald-300 dark:bg-emerald-700" />
              <span>Profil Pengguna &amp; Tata Kelola</span>
            </div>
            <div>
              <span className="rounded-full border border-brand/20 bg-white/80 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark backdrop-blur dark:bg-neutral-800 dark:text-emerald-300">
                Pengalaman Pengguna &amp; Peran
              </span>
            </div>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl text-ink dark:text-white">
              Satu Platform, <span className="font-serif-display italic text-brand-dark dark:text-emerald-400">Berbagai Peran Klinis</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-neutral-600 dark:text-neutral-300">
              Pengalaman antarmuka terpersonalisasi untuk pasien dan dokter, disokong oleh ekosistem kontributor terpercaya dan <b>PanaceaToken</b>.
            </p>

            {/* Segmented Persona Tabs */}
            <div className="mx-auto mt-8 inline-flex rounded-full border border-black/10 bg-white/80 p-1.5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-neutral-800">
              <button
                onClick={() => setRoleTab('patients')}
                className={`rounded-full px-5 py-2 text-xs font-bold transition-all sm:text-sm ${
                  roleTab === 'patients'
                    ? 'bg-brand text-white shadow-md'
                    : 'text-neutral-600 hover:text-brand-dark dark:text-neutral-300'
                }`}
              >
                Untuk Pasien &amp; Keluarga
              </button>
              <button
                onClick={() => setRoleTab('doctors')}
                className={`rounded-full px-5 py-2 text-xs font-bold transition-all sm:text-sm ${
                  roleTab === 'doctors'
                    ? 'bg-brand text-white shadow-md'
                    : 'text-neutral-600 hover:text-brand-dark dark:text-neutral-300'
                }`}
              >
                Untuk Dokter &amp; Faskes
              </button>
              <button
                onClick={() => setRoleTab('ecosystem')}
                className={`rounded-full px-5 py-2 text-xs font-bold transition-all sm:text-sm ${
                  roleTab === 'ecosystem'
                    ? 'bg-brand text-white shadow-md'
                    : 'text-neutral-600 hover:text-brand-dark dark:text-neutral-300'
                }`}
              >
                Ekosistem &amp; Verifikasi
              </button>
            </div>
          </Reveal>

          {/* Interactive Role Display based on Tab — Always 3 balanced cards */}
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ROLES.filter((r) => r.category === roleTab).map((r, i) => (
              <Reveal key={r.title} delay={i * 90}>
                <div className="group flex h-full flex-col justify-between rounded-3xl border border-neutral-200/80 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand/50 hover:shadow-xl dark:border-white/10 dark:bg-neutral-900">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-dark shadow-inner dark:bg-emerald-950 dark:text-emerald-300">
                        <r.icon size={22} />
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {r.badge}
                      </span>
                    </div>

                    <h3 className="mt-4 text-xl font-extrabold text-ink">{r.title}</h3>
                    <div className="mt-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {r.tagline}
                    </div>

                    <p className="mt-2.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
                      {r.desc}
                    </p>

                    <ul className="mt-5 space-y-2.5 border-t border-black/5 pt-4 dark:border-white/10">
                      {r.points.map((pt, pi) => (
                        <li key={pi} className="flex items-start gap-2 text-xs text-neutral-700 dark:text-neutral-300">
                          <span className="mt-0.5 font-bold text-emerald-600 dark:text-emerald-400">✓</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-black/5 pt-4 text-[11px] font-semibold text-neutral-500 dark:border-white/10">
                    <span>FHIR &amp; Panacea Engine</span>
                    <button
                      onClick={onMasuk}
                      className="rounded-full bg-neutral-100 px-3.5 py-1 text-xs font-bold text-neutral-800 transition hover:bg-brand hover:text-white dark:bg-neutral-800 dark:text-neutral-200"
                    >
                      Coba Akses →
                    </button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CHAPTER 03 / TARIF & LAYANAN BERLANGGANAN ────────────── */}
      <PricingSection onMasuk={onMasuk} promo={promo} />

      {/* ── CHAPTER 04 / INTELIJEN & WAWASAN TERKINI ─────────────── */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f8faf9] via-white to-[#f4f7f5] px-6 py-20 dark:border-white/5 dark:from-[#030d07] dark:via-[#05140b] dark:to-[#030d07] sm:px-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="orb absolute left-1/4 top-10 h-72 w-72 rounded-full bg-emerald-100/40 blur-3xl dark:bg-emerald-950/20" />
          <div className="orb absolute bottom-10 right-1/4 h-72 w-72 rounded-full bg-brand-50/50 blur-3xl dark:bg-brand-950/15" style={{ animationDelay: '-6s' }} />
        </div>

        <div className="relative mx-auto max-w-4xl">
          <Reveal className="text-center">
            <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-50/90 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-800 shadow-sm dark:border-amber-500/30 dark:bg-amber-950/70 dark:text-amber-300">
              <span className="font-mono text-amber-600 dark:text-amber-400 font-extrabold">04</span>
              <span className="h-2 w-px bg-amber-300 dark:bg-amber-700" />
              <span>Intelijen &amp; Wawasan Terkini</span>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
                <IconSparkle size={13} /> Wawasan &amp; Pembaruan Sistem
              </span>
            </div>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl text-ink">
              Pembaruan Terkini di <span className="font-serif-display italic text-brand-dark dark:text-emerald-400">Panaceamed</span>
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-neutral-600 dark:text-neutral-300">
              Pembaruan sistem berkala, rilis kapabilitas klinis, dan integrasi modul medis terkini.
            </p>
          </Reveal>
          <ul className="mt-8 space-y-3">
            {WHATS_NEW.map((w, i) => (
              <Reveal key={w} as="li" delay={i * 70}>
                <div className="liquid-glass flex items-start gap-3.5 rounded-2xl p-4 transition hover:translate-x-1 hover:border-brand/30">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-white shadow-sm">
                    <IconCheck size={16} />
                  </span>
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{w}</span>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>

        {/* Medical News & Innovation rotating widget */}
        <MedicalNews />
      </section>

      {/* ── CHAPTER 04 / THE LONGEVITY & SCIENCE ODYSSEY ─────────── */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />
      <section id="science" className="relative overflow-hidden bg-gradient-to-b from-[#f8faf9] via-[#edf5f0]/60 to-[#f8faf9] px-6 py-24 border-y border-emerald-500/15 dark:border-white/5 dark:from-[#030d07] dark:via-[#06150d] dark:to-[#030d07] sm:px-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="orb absolute left-1/4 top-10 h-72 w-72 rounded-full bg-brand/10 blur-3xl" />
          <div className="orb absolute bottom-10 right-1/4 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" style={{ animationDelay: '-8s' }} />
        </div>
        <div className="relative mx-auto max-w-5xl">
          <Reveal className="text-center">
            <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50/90 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-950/70 dark:text-emerald-300">
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">05</span>
              <span className="h-2 w-px bg-emerald-300 dark:bg-emerald-700" />
              <span>Ekspedisi Sains &amp; Longevity</span>
            </div>
            <div>
              <span className="rounded-full border border-brand/20 bg-brand-50 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark dark:bg-emerald-950/60 dark:text-emerald-300">
                Warisan Ribuan Tahun Peradaban
              </span>
            </div>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl text-ink dark:text-white">
              Evolusi Sains Medis &amp; <span className="font-serif-display italic text-brand-dark dark:text-emerald-400">Eksplorasi Longevity</span>
            </h2>
            <Prosa kelas="mx-auto mt-3 max-w-2xl text-neutral-600 dark:text-neutral-300">
              Dari papirus era Firaun, tradisi kenabian, kedokteran Yunani-Romawi, hingga perintis sel punca dan presisi robotik — pencarian kesehatan optimal adalah warisan peradaban yang kini diakselerasi Panaceamed.id bersama AI.
            </Prosa>

            {/* Chapter Tabs Controller */}
            <div className="mx-auto mt-8 flex flex-wrap justify-center gap-2">
              {[
                { id: 'eras', label: 'Warisan Kedokteran (6 Era)' },
                { id: 'modern', label: 'Era Modern & FHIR' },
                { id: 'stem', label: 'Frontier Sel Punca' },
                { id: 'robotics', label: 'Presisi Robotik Medis' },
                { id: 'all', label: 'Semua Bab (Lengkap)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setScienceTab(tab.id as typeof scienceTab)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all shadow-sm ${
                    scienceTab === tab.id
                      ? 'bg-brand text-white shadow-brand/20'
                      : 'border border-black/5 bg-white/70 text-neutral-600 hover:bg-neutral-100 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </Reveal>

          {/* Self-hosted animated timeline video with safeguard poster */}
          {(scienceTab === 'eras' || scienceTab === 'all') && (
            <Reveal delay={80}>
              <div className="mt-8 overflow-hidden rounded-[2rem] border border-black/5 bg-gradient-to-br from-[#02180e] via-[#042817] to-[#02120b] shadow-2xl shadow-brand/20 dark:border-white/10">
                <video
                  src={`${import.meta.env.BASE_URL}media/history.mp4`}
                  autoPlay muted loop playsInline
                  poster={HISTORY_POSTER}
                  className="aspect-video w-full bg-[#06120c] object-cover"
                />
              </div>
            </Reveal>
          )}

          {/* Ancient eras — Interactive Split Stepper */}
          {(scienceTab === 'eras' || scienceTab === 'all') && (
            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
              {/* Left: Era Stepper Navigation (5 cols) */}
              <div className="space-y-2.5 lg:col-span-5">
                <div className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                  Pilih Era Sejarah (1–{HISTORY_ERAS.length})
                </div>
                {HISTORY_ERAS.map((e, i) => (
                  <button
                    key={e.era}
                    onClick={() => setActiveEra(i)}
                    className={`w-full flex items-center justify-between rounded-2xl p-4 text-left transition-all ${
                      activeEra === i
                        ? 'border-2 border-emerald-500 bg-white shadow-md shadow-emerald-500/10 dark:bg-neutral-900'
                        : 'border border-black/5 bg-white/70 hover:bg-white hover:border-emerald-300/60 dark:border-white/10 dark:bg-neutral-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl ${
                        activeEra === i ? 'bg-emerald-500 text-white' : 'bg-brand-50 text-brand-dark dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {renderEraGlyph(e.era, e.emoji)}
                      </span>
                      <div>
                        <div className="text-sm font-extrabold text-ink">{e.era}</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">{e.title}</div>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {e.when}
                    </span>
                  </button>
                ))}
              </div>

              {/* Right: Active Era Viewport Showcase (7 cols) */}
              <div className="lg:col-span-7">
                <div className="sticky top-24 rounded-3xl border border-black/5 bg-white p-6 shadow-xl shadow-black/5 dark:border-white/10 dark:bg-neutral-900">
                  <div className="flex items-center justify-between gap-3 border-b border-black/5 pb-4 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-2xl dark:bg-emerald-950">
                        {renderEraGlyph(HISTORY_ERAS[activeEra].era, HISTORY_ERAS[activeEra].emoji)}
                      </span>
                      <div>
                        <h3 className="text-base font-extrabold text-ink sm:text-lg">{HISTORY_ERAS[activeEra].title}</h3>
                        <div className="text-xs font-bold text-brand-dark dark:text-emerald-400">
                          {HISTORY_ERAS[activeEra].era} · <span className="text-neutral-500 font-medium">{HISTORY_ERAS[activeEra].when}</span>
                        </div>
                      </div>
                    </div>
                    <span className="rounded-full bg-neutral-100 px-3 py-1 font-mono text-xs font-black text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                      {activeEra + 1} / {HISTORY_ERAS.length}
                    </span>
                  </div>

                  <div className="mt-4">
                    {HISTORY_ERAS[activeEra].video && (
                      <VideoSaatTerlihat
                        key={HISTORY_ERAS[activeEra].video}
                        src={HISTORY_ERAS[activeEra].video}
                        judul={HISTORY_ERAS[activeEra].era}
                      />
                    )}
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                    {HISTORY_ERAS[activeEra].body}
                  </p>

                  {/* Stepper Navigation Buttons */}
                  <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-4 dark:border-white/10">
                    <button
                      onClick={() => setActiveEra((prev) => (prev > 0 ? prev - 1 : HISTORY_ERAS.length - 1))}
                      className="rounded-full border border-black/10 px-4 py-1.5 text-xs font-bold text-neutral-700 hover:bg-neutral-100 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      ← Era Sebelumnya
                    </button>
                    <button
                      onClick={() => setActiveEra((prev) => (prev < HISTORY_ERAS.length - 1 ? prev + 1 : 0))}
                      className="rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:brightness-110"
                    >
                      Era Berikutnya →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modern per-decade & FHIR Explainer */}
          {(scienceTab === 'modern' || scienceTab === 'all') && (
            <>
              <Reveal className="mt-14 text-center">
                <h3 className="text-2xl font-extrabold text-ink">Era Modern — <span className="font-serif-display italic text-brand-dark dark:text-emerald-400">Dekade demi Dekade</span></h3>
                <p className="mx-auto mt-2 max-w-2xl text-sm text-neutral-600 dark:text-neutral-300">Dari penemuan antibiotik &amp; rekam medis, sensor tubuh pintar, standar data FHIR, hingga kecerdasan artifisial.</p>
              </Reveal>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {HISTORY_MODERN.map((m, i) => (
                  <Reveal key={m.decade} delay={(i % 3) * 80}>
                    <div className="liquid-glass h-full rounded-2xl p-5 shadow-sm">
                      <div className="text-xs font-black text-brand-dark dark:text-emerald-400">{m.decade}</div>
                      <div className="mt-1 font-bold text-ink">{m.title}</div>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">{m.body}</p>
                    </div>
                  </Reveal>
                ))}
              </div>

              {/* FHIR explainer */}
              <Reveal delay={80}>
                <div className="mt-8 rounded-3xl border border-brand/30 bg-gradient-to-br from-brand-50 to-emerald-100/40 p-6 dark:from-emerald-950/40 dark:to-neutral-900 shadow-sm">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark dark:text-emerald-300">Apa itu Standar FHIR?</div>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
                    <b>FHIR</b> (Fast Healthcare Interoperability Resources) adalah standar internasional yang memungkinkan data kesehatan —
                    rekam medis, hasil lab, resep obat, tanda vital — dapat dibaca secara aman lintas rumah sakit, klinik, dan aplikasi AI dalam satu "bahasa terpadu".
                    Ini adalah fondasi yang memastikan rekam medis AI-EMR dan pemantauan longevity di Panaceamed.id aman, portabel, dan siap tersinkronisasi ke SATUSEHAT Kemenkes.
                  </p>
                </div>
              </Reveal>
            </>
          )}

          {/* Stem cells — the frontier of regenerative longevity */}
          {(scienceTab === 'stem' || scienceTab === 'all') && (
            <>
              <Reveal className="mt-14 text-center">
                <span className="rounded-full border border-brand/20 bg-brand-50 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark dark:bg-emerald-950/60 dark:text-emerald-300">
                  Frontier Kedokteran Regeneratif
                </span>
                <h3 className="mt-3 text-2xl font-extrabold text-ink">Sains Sel Punca (<span className="font-serif-display italic text-brand-dark dark:text-emerald-400">Stem Cells</span>)</h3>
                <p className="mx-auto mt-2 max-w-2xl text-sm text-neutral-600 dark:text-neutral-300">
                  Potensi terbesar sains anti-penuaan: regenerasi sel yang rusak dan peremajaan jaringan tubuh. Tiga kategori utama dari yang paling matang secara klinis hingga riset terdepan.
                </p>
              </Reveal>
              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {STEM_CELLS.map((s, i) => (
                  <Reveal key={s.type} delay={(i % 3) * 80}>
                    <div className="liquid-glass flex h-full flex-col justify-between rounded-2xl p-5 shadow-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-dark dark:bg-emerald-950 dark:text-emerald-300">
                            <s.icon size={20} />
                          </span>
                          <div>
                            <div className="font-extrabold text-ink">{s.type}</div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-dark dark:text-emerald-400">{s.short}</div>
                          </div>
                        </div>
                        <p className="mt-2.5 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">{s.body}</p>
                      </div>
                      <div className="mt-3 rounded-xl bg-neutral-100 px-3 py-1.5 text-[11px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                        <b className="text-neutral-800 dark:text-neutral-100">Penerapan:</b> {s.use}
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={80}>
                <p className="mx-auto mt-4 max-w-2xl text-center text-[11px] leading-relaxed text-neutral-500">
                  Potensi vs. kematangan klinis: <b>potensi</b> paling tinggi ada pada sel pluripoten (iPSC &amp; embrionik), sementara <b>kematangan klinis</b> saat ini paling tinggi pada sel somatik dewasa.
                  Riset reprogramming parsial (faktor Yamanaka) kini membuka jalan untuk membalikkan jam biologis seluler — batas terdepan ilmu longevity.
                  <br /><span className="opacity-70">Hanya untuk tujuan edukasi ilmiah; terapi sel punca wajib dilakukan di fasilitas kesehatan berizin resmi sesuai regulasi Kemenkes.</span>
                </p>
              </Reveal>
            </>
          )}

          {/* Robotics in medicine */}
          {(scienceTab === 'robotics' || scienceTab === 'all') && (
            <>
              <Reveal className="mt-14 text-center">
                <span className="rounded-full border border-brand/20 bg-brand-50 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark dark:bg-emerald-950/60 dark:text-emerald-300">
                  Presisi Robotik Medis
                </span>
                <h3 className="mt-3 text-2xl font-extrabold text-ink">Robotik dalam <span className="font-serif-display italic text-brand-dark dark:text-emerald-400">Dunia Medis</span></h3>
                <Prosa kelas="mx-auto mt-2 max-w-2xl text-sm text-neutral-600 dark:text-neutral-300">
                  Dari lengan bedah mikro hingga navigasi intravaskular — mesin memperluas kapabilitas dokter, menjadikan penanganan medis lebih presisi, minim sayatan, dan mempercepat pemulihan pasien.
                </Prosa>
              </Reveal>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {ROBOTICS.map((r, i) => (
                  <Reveal key={r.type} delay={(i % 2) * 80}>
                    <div className="liquid-glass flex h-full flex-col justify-between rounded-2xl p-5 shadow-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-dark dark:bg-emerald-950 dark:text-emerald-300">
                            <r.icon size={18} />
                          </span>
                          <div>
                            <div className="font-extrabold text-ink">{r.type}</div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-dark dark:text-emerald-400">{r.short}</div>
                          </div>
                        </div>
                        <p className="mt-2.5 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">{r.body}</p>
                      </div>
                      <div className="mt-3 rounded-xl bg-neutral-100 px-3 py-1.5 text-[11px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                        <b className="text-neutral-800 dark:text-neutral-100">Penerapan:</b> {r.use}
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={80}>
                <p className="mx-auto mt-4 max-w-2xl text-center text-[11px] leading-relaxed text-neutral-500">
                  Sinergi robotik bersama <b>AI</b> (navigasi operasi real-time) dan <b>FHIR</b> (data terintegrasi) —
                  mendefinisikan visi Panaceamed.id: teknologi yang memperkuat, bukan menggantikan, praktisi klinis berizin.
                  <br /><span className="opacity-70">Sebagian teknologi (nanorobotik) masih berada dalam fase riset dan uji klinis lanjutan.</span>
                </p>
              </Reveal>
            </>
          )}
        </div>
      </section>

      {/* ── INSTITUTIONAL GOVERNANCE & CORPORATE CONTACT ─────────── */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />
      <section id="about-us" className="border-t border-black/5 bg-[#fafcfb] px-6 py-20 dark:border-white/10 dark:bg-[#030d07] sm:px-10">
        <Reveal>
          <div className="mx-auto grid max-w-5xl gap-6 rounded-[2.5rem] border border-black/5 bg-gradient-to-br from-white via-neutral-50/50 to-white p-8 shadow-sm dark:border-white/10 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950 lg:grid-cols-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark dark:text-emerald-400">Tata Kelola Institusional</span>
              <h2 className="mt-1 text-2xl font-extrabold text-ink dark:text-white">Tentang Panaceamed</h2>
              <Prosa baris={8} kelas="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                Panaceamed.id adalah platform integrasi data klinis dan kesehatan preventif jangka panjang: sistem AI-EMR memfasilitasi anamnesis awal terstruktur, dokter berizin melakukan telaah rekam medis. Misi kami menghadirkan layanan kesehatan presisi, pemantauan penyakit kronis, dan sains longevity teruji yang dapat diakses secara merata — berlandaskan kepatuhan penuh terhadap UU Perlindungan Data Pribadi (UU PDP No. 27/2022).
              </Prosa>
              <div className="mt-5 flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Terdaftar &amp; Mematuhi Regulasi Faskes RI</span>
              </div>
            </div>
            <div className="rounded-3xl border border-brand/20 bg-brand-50/60 p-6 dark:bg-emerald-950/30">
              <h3 className="font-extrabold text-ink dark:text-white">Kontak Korporat &amp; Faskes</h3>
              <ul className="mt-4 space-y-3.5 text-sm">
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-emerald-600 dark:text-emerald-400">
                    <IconMail size={16} />
                  </span>
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500">Dukungan Pengguna</span>
                    <a href="mailto:support@panaceamed.id" className="font-bold text-brand-dark hover:underline dark:text-emerald-400">support@panaceamed.id</a>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-emerald-600 dark:text-emerald-400">
                    <IconHospital size={16} />
                  </span>
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500">Kemitraan Faskes</span>
                    <a href="mailto:partnership@panaceamed.id" className="font-bold text-brand-dark hover:underline dark:text-emerald-400">partnership@panaceamed.id</a>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-emerald-600 dark:text-emerald-400">
                    <IconBuilding size={16} />
                  </span>
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500">Badan Hukum &amp; Kantor</span>
                    <span className="font-semibold text-ink dark:text-neutral-200">PT Panacea Digital Nusantara</span>
                    <span className="block text-xs text-neutral-600 dark:text-neutral-400">SCBD, Jl. Jend. Sudirman, Jakarta Selatan</span>
                  </div>
                </li>
              </ul>
            </div>
            <div className="rounded-3xl border border-black/5 bg-neutral-50/80 p-6 dark:border-white/5 dark:bg-neutral-800/60">
              <h3 className="font-extrabold text-ink dark:text-white">Direksi Riset &amp; Kanal Resmi</h3>
              <ul className="mt-4 space-y-3.5 text-sm">
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-emerald-600 dark:text-emerald-400">
                    <IconStethoscope size={16} />
                  </span>
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500">Lead Research</span>
                    <b className="text-ink dark:text-white">Rizky Muhammad Azrissal</b>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-emerald-600 dark:text-emerald-400">
                    <IconGlobe size={16} />
                  </span>
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500">Kanal Media Sosial Resmi</span>
                    <div className="mt-2 space-y-2">
                      <a
                        href="https://instagram.com/Panaceamed.id"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-xs font-semibold text-neutral-700 hover:text-emerald-600 dark:text-neutral-300 dark:hover:text-emerald-400"
                      >
                        <IconInstagram size={14} className="text-emerald-600 dark:text-emerald-400" />
                        <span>Instagram: <span className="font-bold">@Panaceamed.id</span></span>
                      </a>
                      <a
                        href="https://tiktok.com/@Panaceamed.id"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-xs font-semibold text-neutral-700 hover:text-emerald-600 dark:text-neutral-300 dark:hover:text-emerald-400"
                      >
                        <IconTikTok size={14} className="text-emerald-600 dark:text-emerald-400" />
                        <span>TikTok: <span className="font-bold">@Panaceamed.id</span></span>
                      </a>
                      <a
                        href="https://linkedin.com/company/panaceamed"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-xs font-semibold text-neutral-700 hover:text-emerald-600 dark:text-neutral-300 dark:hover:text-emerald-400"
                      >
                        <IconLinkedIn size={14} className="text-emerald-600 dark:text-emerald-400" />
                        <span>LinkedIn: <span className="font-bold">PT Panacea Digital Nusantara</span></span>
                      </a>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FINAL CONVERSION CALL TO ACTION ──────────────────────── */}
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
                <span className="text-base font-black tracking-tight" style={{ color: '#052e16' }}>Mulai Gratis Sekarang</span>
                <span
                  className="cta-arrow-circle grid h-9 w-9 place-items-center rounded-full text-white transition-transform duration-300 group-hover:translate-x-1"
                  style={{ backgroundColor: '#059669', color: '#ffffff' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </span>
              </button>

              {/* Trust & compliance reassurance */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-emerald-100">
                <span className="flex items-center gap-1.5"><IconCheck size={14} className="text-emerald-300" /> Akses Evaluasi Mandiri Tanpa Biaya</span>
                <span className="flex items-center gap-1.5"><IconCheck size={14} className="text-emerald-300" /> Kepatuhan UU PDP No. 27/2022</span>
                <span className="flex items-center gap-1.5"><IconCheck size={14} className="text-emerald-300" /> Standar HL7® FHIR Kemenkes</span>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── ENTERPRISE INSTITUTIONAL FOOTER ───────────────────────── */}
      <footer className="border-t border-black/5 bg-neutral-50/80 px-6 py-14 dark:border-white/10 dark:bg-neutral-950 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-1">
              <Wordmark size={30} />
              <p className="mt-3 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                Panaceamed.id — AI-EMR &amp; Longevity OS Platform. Menghubungkan teknologi anamnesis presisi dengan pengawasan langsung dokter berizin.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Seluruh Sistem Beroperasi Normal</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink dark:text-neutral-200">Platform &amp; Solusi</h4>
              <ul className="mt-3 space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                <li><a href="#features" className="hover:text-brand-dark dark:hover:text-emerald-400">AI Intake (SOCRATES)</a></li>
                <li><a href="#features" className="hover:text-brand-dark dark:hover:text-emerald-400">AI Longevity Calculator</a></li>
                <li><a href="#features" className="hover:text-brand-dark dark:hover:text-emerald-400">AI-EMR for Clinicians</a></li>
                <li><a href="#pricing" className="hover:text-brand-dark dark:hover:text-emerald-400">34 Skoring Medis Standar</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink dark:text-neutral-200">Standar &amp; Keamanan</h4>
              <ul className="mt-3 space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                <li><span>Pertukaran Data HL7® FHIR</span></li>
                <li><span>Kepatuhan UU PDP No. 27/2022</span></li>
                <li><span>Interoperabilitas SATUSEHAT Kemenkes</span></li>
                <li><span>Ekonomi PanaceaToken</span></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink dark:text-neutral-200">Pemberitahuan Klinis &amp; Legal</h4>
              <p className="mt-3 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                Keluaran teknis (Technical output). Belum ditinjau klinisi atau divalidasi klinis kecuali telah disahkan oleh dokter berizin. AI mendukung, namun tidak pernah menggantikan dokter berizin.
              </p>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-black/5 pt-8 text-center text-xs text-neutral-500 dark:border-white/10 dark:text-neutral-400 sm:flex-row sm:text-left">
            <p>© {new Date().getFullYear()} PT Panacea Digital Nusantara. Hak cipta dilindungi undang-undang.</p>
            <p>Dibangun dengan presisi untuk masa depan kesehatan &amp; healthspan manusia.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
