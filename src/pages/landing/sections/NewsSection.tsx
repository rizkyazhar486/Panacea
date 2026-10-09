import { Reveal } from '../../../components/Reveal'
import { IconSparkle, IconCheck } from '../../../components/icons'
import { MedicalNews } from '../../../components/MedicalNews'
import { WHATS_NEW } from '../landingData'

export function NewsSection() {
  return (
    <>
      {/* ── CHAPTER 04 / INTELIJEN & WAWASAN TERKINI ─────────────── */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f8faf9] via-white to-[#f4f7f5] px-6 py-20 dark:border-white/5 dark:from-[#030d07] dark:via-[#05140b] dark:to-[#030d07] sm:px-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="orb absolute left-1/4 top-10 h-72 w-72 rounded-full bg-emerald-100/40 blur-3xl dark:bg-emerald-950/20" />
          <div
            className="orb absolute bottom-10 right-1/4 h-72 w-72 rounded-full bg-brand-50/50 blur-3xl dark:bg-brand-950/15"
            style={{ animationDelay: '-6s' }}
          />
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
    </>
  )
}
