import { Wordmark } from '../../../components/Logo'
import { Prosa } from '../../../components/Prosa'

export function LandingFooter() {
  return (
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
            <Prosa kelas="mt-3 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400" baris={4}>
              Keluaran teknis (Technical output). Belum ditinjau klinisi atau divalidasi klinis kecuali telah disahkan oleh dokter berizin. AI mendukung, namun tidak pernah menggantikan dokter berizin.
            </Prosa>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-black/5 pt-8 text-center text-xs text-neutral-500 dark:border-white/10 dark:text-neutral-400 sm:flex-row sm:text-left">
          <p>© {new Date().getFullYear()} PT Panacea Digital Nusantara. Hak cipta dilindungi undang-undang.</p>
          <p>Dibangun dengan presisi untuk masa depan kesehatan &amp; healthspan manusia.</p>
        </div>
      </div>
    </footer>
  )
}
