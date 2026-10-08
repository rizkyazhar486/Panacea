import React from 'react'
import { CountUp } from '../../components/Reveal'
import {
  IconUsers,
  IconHeart,
  IconChat,
  IconStethoscope,
  IconStore,
  IconShield,
  IconChartUp,
  IconHospital,
  IconPill,
  IconCpu,
  IconActivity,
  IconMicroscope,
  IconArticle,
  IconDna,
} from '../../components/icons'

export const FEATURES = [
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

export const ROLES = [
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

export const WHATS_NEW = [
  'Dasbor sosial "Healthy Living Dashboard" — berbagi foto & video 30 detik, profil kesehatan, dan bookmark privat.',
  'Kalkulator usia biologis "AI Longevity Calculator" (akses 30 hari penuh, terjangkau Rp49.000/bulan).',
  'Farmasi digital dengan tebus & pindai resep dokter + Riwayat Transaksi terpadu.',
  'Radar faskes darurat via GPS (rumah sakit, klinik & apotek siaga 24 jam).',
  'Pusat Pengetahuan Medis "Medical Knowledge Hub" — temukan & bagikan modul, jurnal, dan catatan klinis dengan PanaceaToken.',
]

export const STATS: { node: React.ReactNode; label: string }[] = [
  { node: <CountUp to={6} suffix=" Peran" />, label: 'Ekosistem Pengguna Terpadu' },
  { node: <CountUp to={100} suffix="%" />, label: 'Supervisi Klinisi (Human-in-the-Loop)' },
  { node: <CountUp to={30} suffix=" Hari" />, label: 'Siklus Evaluasi AI Longevity' },
  { node: <span>24/7</span>, label: 'Akses Siaga & Radar Darurat SOS' },
]

export const MARQUEE = [
  { icon: IconHospital, label: 'Fasilitas Kesehatan Terdekat' },
  { icon: IconPill, label: 'Farmasi Digital' },
  { icon: IconStethoscope, label: 'Konsultasi Dokter' },
  { icon: IconHeart, label: 'AI Longevity Calculator' },
  { icon: IconStore, label: 'Pusat Pengetahuan Medis' },
  { icon: IconShield, label: 'AI-EMR for clinicians' },
  { icon: IconChartUp, label: 'Pemantauan Healthspan' },
]

export const HISTORY_ERAS: { era: string; when: string; emoji: string; title: string; body: string; video?: string }[] = [
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
    body: 'Kitab Al-Qanun fi at-Tibb karya Ibnu Sina menjadi rujukan kedokteran dunia selama 600 tahun. Al-Razi memelopori pencatatan rekam medis klinis. Bimaristan — rumah sakit dengan resep, farmasi, dan bangsal spesialis — menjadi cikal bakal sistem rumah sakit modern.',
    video: 'https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260807_091759_7444344d-fd5c-47c7-a0a5-d551e686742f.mp4',
  },
]

export const HISTORY_MODERN: { decade: string; title: string; body: string }[] = [
  { decade: '1900–1950', title: 'Antibiotik & Vaksinasi Massal', body: 'Penemuan penisilin oleh Alexander Fleming (1928), vaksinasi massal, dan sanitasi publik melipatgandakan angka harapan hidup global, membebaskan peradaban dari ancaman epidemi mematikan.' },
  { decade: '1960–1980', title: 'Rekam Medis & Evidence-Based Medicine', body: 'Lahirnya rekam medis elektronik pertama (Problem-Oriented Medical Record). Uji klinis acak (RCT) menjadi baku emas kebenaran ilmiah, bersamaan dengan lahirnya disiplin gerontologi.' },
  { decade: '1990–2000', title: 'Genomika & Biologi Telomer', body: 'Proyek Genom Manusia (Human Genome Project) berhasil memetakan DNA manusia. Penemuan telomerase membuka tabir penuaan seluler dan internet mulai mendemokratisasi akses literatur medis.' },
  { decade: '2000–2010', title: 'Standar Interoperabilitas Rekam Medis', body: 'Penerapan massal Electronic Health Records (EHR). Kelahiran standar HL7® FHIR (2011) yang kini menjadi protokol universal pertukaran data medis digital terenkripsi.' },
  { decade: '2010–2020', title: 'Sensor Tubuh & Riset Healthspan', body: 'Era smartwatch, biomarker sensor, dan CGM. Riset senolitik, NAD+, dan puasa intermiten membawa ilmu longevity dari laboratorium ke arus utama sains preventif.' },
  { decade: '2020–Kini', title: 'Integrasi AI Medis + SATUSEHAT FHIR', body: 'Kecerdasan artifisial membantu wawancara anamnesis dan analisis penunjang; FHIR menyatukan data pasien secara utuh. Panaceamed.id hadir: sinergi AI teruji, verifikasi dokter berizin, dan pemantauan longevity terukur.' },
]

export const STEM_CELLS: { type: string; icon: typeof IconActivity; short: string; body: string; use: string }[] = [
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

export const ROBOTICS: { type: string; icon: typeof IconCpu; short: string; body: string; use: string }[] = [
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
