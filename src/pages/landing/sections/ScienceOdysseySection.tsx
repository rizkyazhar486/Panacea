import { useState, useEffect, useRef } from 'react'
import { Prosa } from '../../../components/Prosa'
import { Reveal } from '../../../components/Reveal'
import { HISTORY_POSTER, renderEraGlyph } from '../landingSvgs'
import {
  HISTORY_ERAS,
  HISTORY_MODERN,
  STEM_CELLS,
  ROBOTICS,
} from '../landingData'

/**
 * Video yang hanya berputar SAAT TERLIHAT.
 * Menghindari beban unduhan bersamaan dan layar hitam pada perangkat seluler.
 */
export function VideoSaatTerlihat({ src, judul }: { src: string; judul: string }) {
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

export function ScienceOdysseySection() {
  const [scienceTab, setScienceTab] = useState<'eras' | 'modern' | 'stem' | 'robotics' | 'all'>('eras')
  const [activeEra, setActiveEra] = useState(0)

  return (
    <>
      {/* ── CHAPTER 04 / THE LONGEVITY & SCIENCE ODYSSEY ─────────── */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />
      <section
        id="science"
        className="relative overflow-hidden bg-gradient-to-b from-[#f8faf9] via-[#edf5f0]/60 to-[#f8faf9] px-6 py-24 border-y border-emerald-500/15 dark:border-white/5 dark:from-[#030d07] dark:via-[#06150d] dark:to-[#030d07] sm:px-10"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="orb absolute left-1/4 top-10 h-72 w-72 rounded-full bg-brand/10 blur-3xl" />
          <div
            className="orb absolute bottom-10 right-1/4 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl"
            style={{ animationDelay: '-8s' }}
          />
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
                  autoPlay
                  muted
                  loop
                  playsInline
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
                      <span
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl ${
                          activeEra === i
                            ? 'bg-emerald-500 text-white'
                            : 'bg-brand-50 text-brand-dark dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
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
                          {HISTORY_ERAS[activeEra].era} ·{' '}
                          <span className="text-neutral-500 font-medium">{HISTORY_ERAS[activeEra].when}</span>
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
                <h3 className="text-2xl font-extrabold text-ink">
                  Era Modern — <span className="font-serif-display italic text-brand-dark dark:text-emerald-400">Dekade demi Dekade</span>
                </h3>
                <p className="mx-auto mt-2 max-w-2xl text-sm text-neutral-600 dark:text-neutral-300">
                  Dari penemuan antibiotik &amp; rekam medis, sensor tubuh pintar, standar data FHIR, hingga kecerdasan artifisial.
                </p>
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
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark dark:text-emerald-300">
                    Apa itu Standar FHIR?
                  </div>
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
                <h3 className="mt-3 text-2xl font-extrabold text-ink">
                  Sains Sel Punca (<span className="font-serif-display italic text-brand-dark dark:text-emerald-400">Stem Cells</span>)
                </h3>
                <Prosa kelas="mx-auto mt-2 max-w-2xl text-sm text-neutral-600 dark:text-neutral-300">
                  Potensi terbesar sains anti-penuaan: regenerasi sel yang rusak dan peremajaan jaringan tubuh. Tiga kategori utama dari yang paling matang secara klinis hingga riset terdepan.
                </Prosa>
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
                            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-dark dark:text-emerald-400">
                              {s.short}
                            </div>
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
                <h3 className="mt-3 text-2xl font-extrabold text-ink">
                  Robotik dalam <span className="font-serif-display italic text-brand-dark dark:text-emerald-400">Dunia Medis</span>
                </h3>
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
                            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-dark dark:text-emerald-400">
                              {r.short}
                            </div>
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
    </>
  )
}
