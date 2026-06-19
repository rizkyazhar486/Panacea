import { Wordmark } from '../components/Logo'
import {
  IconChat,
  IconStore,
  IconShield,
  IconHeart,
  IconStethoscope,
  IconSparkle,
  IconUsers,
  IconCheck,
} from '../components/icons'

const FEATURES = [
  { icon: IconUsers, title: 'Dashboard Hidup Sehat', text: 'Jejaring sosial gaya Strava/TikTok: bagikan aktivitas, kebiasaan sehat & artikel longevity. Foto, video singkat, profil, bookmark.' },
  { icon: IconHeart, title: 'Kalkulator Longevity AI', text: 'Isi pola makan, olahraga, hidrasi, tidur & berjemur — AI menghitung nilai longevity Anda (langganan 30 hari).' },
  { icon: IconChat, title: 'AI Chatbot → AI-EMR', text: 'AI mewawancara pasien (SOCRATES); hasilnya mengalir otomatis ke Subjective/Objective di AI-EMR yang hanya diakses dokter.' },
  { icon: IconStethoscope, title: 'Konsultasi, Apotek & Faskes', text: 'Konsultasi via AI (Rp13.000) → rujukan dokter spesialis; apotek + tebus resep; faskes terdekat via GPS untuk darurat.' },
  { icon: IconStore, title: 'Marketplace Materi & Artikel', text: 'Jual–beli catatan/jurnal/artikel kedokteran dengan PanaceaToken; harga ditentukan penulis; PDF ber-watermark ID pembeli.' },
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
  'Marketplace materi/artikel — harga ditentukan penulis, PDF ber-watermark ID pembeli.',
]

export function Landing({ onMasuk }: { onMasuk: () => void }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Top bar — logo kiri atas */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-black/5 bg-white/90 px-5 py-3 backdrop-blur sm:px-8">
        <Wordmark size={36} />
        <button
          onClick={onMasuk}
          className="rounded-full bg-gradient-to-b from-[#00BF63] to-[#0b7a4b] px-6 py-2 text-sm font-bold text-white shadow-sm transition hover:brightness-105 active:scale-95"
        >
          Masuk
        </button>
      </header>

      {/* Hero — light bento */}
      <section className="px-4 py-10 sm:px-8 sm:py-16">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-black/5 bg-gradient-to-br from-brand-50 via-white to-[#e1eae3] px-6 py-16 text-center shadow-[0_8px_30px_rgba(12,20,16,0.06)] sm:px-10 sm:py-20">
          {/* grid texture */}
          <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(0,109,54,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,109,54,0.04)_1px,transparent_1px)] [background-size:40px_40px]" />
          <div className="relative">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-1.5 backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand" />
              <span className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Longevity Medical-AI · Siap Pakai</span>
            </div>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-[56px] sm:leading-[60px]">
              AI-Klinik Praktis untuk<br />
              <span className="bg-gradient-to-r from-brand to-brand-dark bg-clip-text text-transparent">Akses Kesehatan</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-neutral-600 sm:text-lg">
              AI melakukan anamnesis & edukasi; dokter memverifikasi. Memperpanjang <b>healthspan</b> — bukan
              sekadar usia — lewat penalaran klinis presisi, pencegahan dini, dan optimasi gaya hidup.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button onClick={onMasuk} className="rounded-full bg-gradient-to-b from-[#00BF63] to-[#0b7a4b] px-8 py-3.5 font-bold text-white shadow-md transition hover:brightness-105 active:scale-[0.98]">
                Mulai Sekarang
              </button>
              <a href="#about" className="rounded-full bg-brand-50 px-8 py-3.5 font-bold text-brand-dark transition hover:bg-brand-100">
                Pelajari Lebih Lanjut
              </a>
            </div>
            <p className="mt-4 text-xs text-neutral-400">⚕️ AI mendukung, bukan menggantikan, klinisi berlisensi.</p>
          </div>
        </div>
      </section>

      {/* About Us */}
      <section id="about" className="mx-auto max-w-5xl px-6 py-16 sm:px-10">
        <div className="text-center">
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-dark">Tentang Kami</span>
          <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">Apa itu Panaceamed.id?</h2>
          <p className="mx-auto mt-3 max-w-3xl text-neutral-600">
            Panaceamed.id adalah platform <b>AI-EMR</b> sekaligus <b>marketplace pengetahuan kedokteran</b>.
            Kecerdasan buatan melakukan anamnesis & analisis penunjang melalui chatbot, lalu hasilnya
            mengalir ke rekam medis yang <b>diverifikasi dan ditandatangani dokter manusia</b>. Identitas
            pasien terintegrasi kontinu — selalu menyertakan tanda vital & penunjang sebagai dukungan
            <b> longevity</b>. Visi kami: <b>AI-Klinik Praktis untuk Akses Kesehatan — untuk masa depan kesehatan Anda.</b>
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`group rounded-2xl border border-black/5 bg-white p-5 shadow-[0_4px_12px_rgba(12,20,16,0.05)] transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-md ${
                i === 0 ? 'sm:col-span-2 lg:col-span-2' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-dark">
                  <f.icon size={22} />
                </span>
                <span className="grid h-8 w-8 place-items-center rounded-full border border-black/10 text-sm font-bold text-neutral-400 transition group-hover:bg-brand group-hover:text-white">
                  →
                </span>
              </div>
              <h3 className="mt-4 font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-neutral-500">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Business model */}
      <section className="bg-neutral-50 px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-dark">Model Bisnis</span>
            <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">Satu platform, banyak peran</h2>
            <p className="mx-auto mt-3 max-w-2xl text-neutral-600">
              Langganan (individu & rumah sakit) + ekonomi token: pembeli deposit <b>PanaceaToken</b>,
              penulis menerima royalti, semua materi diverifikasi spesialis & AI.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ROLES.map(([t, d]) => (
              <div key={t} className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/5">
                <IconUsers size={20} className="mt-0.5 shrink-0 text-brand" />
                <div>
                  <h3 className="font-bold">{t}</h3>
                  <p className="text-sm text-neutral-500">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's New */}
      <section className="mx-auto max-w-3xl px-6 py-16 sm:px-10">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent">
            <IconSparkle size={13} /> What's New
          </span>
          <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">Pembaruan Terbaru</h2>
        </div>
        <ul className="mt-6 space-y-3">
          {WHATS_NEW.map((w) => (
            <li key={w} className="flex items-start gap-3 rounded-xl border border-neutral-100 p-3">
              <IconCheck size={18} className="mt-0.5 shrink-0 text-brand" />
              <span className="text-sm text-neutral-700">{w}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8 text-center">
          <button onClick={onMasuk} className="rounded-full bg-gradient-to-b from-[#00BF63] to-[#0b7a4b] px-8 py-3.5 font-bold text-white shadow-md transition hover:brightness-105 active:scale-[0.98]">
            Masuk & Coba Sekarang
          </button>
        </div>
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
