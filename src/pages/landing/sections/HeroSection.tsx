import { Reveal } from '../../../components/Reveal'
import { InteractiveAura } from '../../../components/InteractiveAura'
import { BatasKlaimKesehatan } from '../../../components/BatasKlaimKesehatan'
import {
  IconShield,
  IconCheck,
  IconStethoscope,
  IconChat,
  IconHeart,
} from '../../../components/icons'
import { IconArrowRight } from '../landingSvgs'
import { STATS } from '../landingData'

interface HeroSectionProps {
  onMasuk: () => void
}

export function HeroSection({ onMasuk }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-8 sm:py-20 lg:py-24">
      {/* Cinematic brand film (Higgsfield) behind the hero */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <video
          src="https://d8j0ntlcm91z4.cloudfront.net/user_3FaS56ACS5VALa5WTIecT6KKkQf/hf_20260702_023227_88b54135-7489-48de-9476-ca0657fc0d29.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="hero-video-scrim absolute inset-0" />
        <InteractiveAura />
        <div className="orb absolute -left-20 top-10 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
        <div
          className="orb absolute right-0 top-40 h-80 w-80 rounded-full bg-emerald-400/15 blur-3xl"
          style={{ animationDelay: '-6s' }}
        />
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
              <BatasKlaimKesehatan
                permukaan="care.landing"
                className="mt-3.5 max-w-xl text-[12px] leading-snug text-neutral-500"
              />
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
                    <IconArrowRight size={15} />
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
  )
}
