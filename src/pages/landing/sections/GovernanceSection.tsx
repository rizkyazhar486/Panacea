import { Prosa } from '../../../components/Prosa'
import { Reveal } from '../../../components/Reveal'
import {
  IconMail,
  IconHospital,
  IconBuilding,
  IconStethoscope,
  IconGlobe,
  IconInstagram,
  IconTikTok,
  IconLinkedIn,
} from '../../../components/icons'

export function GovernanceSection() {
  return (
    <>
      {/* ── INSTITUTIONAL GOVERNANCE & CORPORATE CONTACT ─────────── */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />
      <section id="about-us" className="border-t border-black/5 bg-[#fafcfb] px-6 py-20 dark:border-white/10 dark:bg-[#030d07] sm:px-10">
        <Reveal>
          <div className="mx-auto grid max-w-5xl gap-6 rounded-[2.5rem] border border-black/5 bg-gradient-to-br from-white via-neutral-50/50 to-white p-8 shadow-sm dark:border-white/10 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950 lg:grid-cols-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark dark:text-emerald-400">
                Tata Kelola Institusional
              </span>
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
                    <a href="mailto:support@panaceamed.id" className="font-bold text-brand-dark hover:underline dark:text-emerald-400">
                      support@panaceamed.id
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-emerald-600 dark:text-emerald-400">
                    <IconHospital size={16} />
                  </span>
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500">Kemitraan Faskes</span>
                    <a href="mailto:partnership@panaceamed.id" className="font-bold text-brand-dark hover:underline dark:text-emerald-400">
                      partnership@panaceamed.id
                    </a>
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
    </>
  )
}
