import { Reveal } from '../../../components/Reveal'
import {
  IconChat,
  IconHeart,
  IconStethoscope,
  IconHospital,
  IconPill,
  IconStore,
  IconArticle,
  IconUsers,
  IconActivity,
  IconComment,
  IconBookmark,
  IconShield,
  IconCheck,
} from '../../../components/icons'

interface FeaturesSectionProps {
  onMasuk: () => void
}

export function FeaturesSection({ onMasuk }: FeaturesSectionProps) {
  return (
    <>
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
    </>
  )
}
