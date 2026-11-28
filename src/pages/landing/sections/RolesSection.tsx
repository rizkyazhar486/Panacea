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
        className="relative overflow-hidden border-y border-neutral-200/80 bg-[#F8FAF9] px-6 py-20 text-neutral-950 transition-colors dark:border-white/10 dark:bg-[#060A09] dark:text-neutral-50 sm:px-10"
      >
        <div className="relative mx-auto max-w-5xl">
          <Reveal className="text-center">
            <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-700/20 bg-emerald-700/10 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-500/15 dark:text-emerald-300">
              <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-400">02</span>
              <span className="h-2 w-px bg-emerald-500/40" />
              <span>Profil Pengguna &amp; Tata Kelola</span>
            </div>
            <div>
              <span className="rounded-full border border-emerald-700/20 bg-white px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800 dark:border-white/10 dark:bg-[#111815] dark:text-emerald-300">
                Pengalaman Pengguna &amp; Peran
              </span>
            </div>
            <h2 className="mt-3 text-3xl font-extrabold text-neutral-950 dark:text-white sm:text-4xl">
              Satu Platform, <span className="font-serif-display italic text-emerald-700 dark:text-emerald-400">Berbagai Peran Klinis</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-neutral-600 dark:text-neutral-300">
              Pengalaman antarmuka terpersonalisasi untuk pasien dan dokter, disokong oleh ekosistem kontributor terpercaya dan <b>PanaceaToken</b>.
            </p>

            {/* Segmented Persona Tabs */}
            <div className="mx-auto mt-8 inline-flex flex-wrap justify-center gap-1 rounded-full border border-neutral-200 bg-white p-1.5 shadow-sm dark:border-white/10 dark:bg-[#111815]">
              <button
                type="button"
                data-pmd-native="true"
                onClick={() => setRoleTab('patients')}
                className={`min-h-[40px] rounded-full px-5 py-2 text-xs font-bold transition-all sm:text-sm ${
                  roleTab === 'patients'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-neutral-700 hover:text-emerald-700 dark:text-neutral-300 dark:hover:text-emerald-300'
                }`}
              >
                Untuk Pasien &amp; Keluarga
              </button>
              <button
                type="button"
                data-pmd-native="true"
                onClick={() => setRoleTab('doctors')}
                className={`min-h-[40px] rounded-full px-5 py-2 text-xs font-bold transition-all sm:text-sm ${
                  roleTab === 'doctors'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-neutral-700 hover:text-emerald-700 dark:text-neutral-300 dark:hover:text-emerald-300'
                }`}
              >
                Untuk Dokter &amp; Faskes
              </button>
              <button
                type="button"
                data-pmd-native="true"
                onClick={() => setRoleTab('ecosystem')}
                className={`min-h-[40px] rounded-full px-5 py-2 text-xs font-bold transition-all sm:text-sm ${
                  roleTab === 'ecosystem'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-neutral-700 hover:text-emerald-700 dark:text-neutral-300 dark:hover:text-emerald-300'
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
                <div className="group flex h-full flex-col justify-between rounded-3xl border border-neutral-200/80 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-700/40 hover:shadow-xl dark:border-white/10 dark:bg-[#111815]">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-inner dark:bg-emerald-950/60 dark:text-emerald-300">
                        <r.icon size={22} />
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                        {r.badge}
                      </span>
                    </div>

                    <h3 className="mt-4 text-xl font-extrabold text-neutral-950 dark:text-white">{r.title}</h3>
                    <div className="mt-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
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

                  <div className="mt-6 flex items-center justify-between border-t border-black/5 pt-4 text-[11px] font-semibold text-neutral-500 dark:border-white/10 dark:text-neutral-400">
                    <span>FHIR &amp; Panacea Engine</span>
                    <button
                      type="button"
                      data-pmd-native="true"
                      onClick={onMasuk}
                      className="min-h-[36px] rounded-full bg-neutral-100 px-3.5 py-1 text-xs font-bold text-neutral-900 transition hover:bg-emerald-700 hover:text-white dark:bg-neutral-800 dark:text-neutral-100"
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
