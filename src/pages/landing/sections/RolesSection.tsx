import { useState } from 'react'
import { Reveal } from '../../../components/Reveal'
import { ROLES } from '../landingData'

interface RolesSectionProps {
  onMasuk: () => void
}

export function RolesSection({ onMasuk }: RolesSectionProps) {
  const [roleTab, setRoleTab] = useState<'patients' | 'doctors' | 'ecosystem'>('patients')

  return (
    <>
      {/* ── CHAPTER 02 / USER PERSONAS & GOVERNANCE ─────────────── */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />
      <section
        id="roles"
        className="relative overflow-hidden bg-gradient-to-b from-[#f4f8f5] via-[#edf5f0] to-[#f4f8f5] px-6 py-24 border-y border-emerald-500/15 dark:border-white/5 dark:from-[#030d07] dark:via-[#06150d] dark:to-[#030d07] sm:px-10"
      >
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
    </>
  )
}
