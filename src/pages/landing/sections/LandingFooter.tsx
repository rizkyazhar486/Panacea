import { Link } from 'react-router-dom'
import { Wordmark } from '../../../components/Logo'

export function LandingFooter() {
  return (
    <footer className="border-t border-black/5 bg-white px-6 py-10 dark:border-white/10 dark:bg-[#05070b] sm:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <Wordmark size={28} />
          <p className="mt-3 text-[12px] leading-relaxed text-neutral-500 dark:text-slate-400">
            Keluaran AI bersifat draf dan tidak menggantikan dokter berizin. Keputusan klinis tetap di tangan klinisi.
          </p>
        </div>
        <nav aria-label="Tautan kaki" className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-semibold text-neutral-600 dark:text-slate-300">
          <Link to="/legal" className="inline-flex min-h-11 items-center hover:text-brand-dark dark:hover:text-emerald-300">Privasi &amp; ketentuan</Link>
          <a href="mailto:support@panaceamed.id" className="inline-flex min-h-11 items-center hover:text-brand-dark dark:hover:text-emerald-300">support@panaceamed.id</a>
        </nav>
      </div>
      <p className="mx-auto mt-8 max-w-6xl text-[12px] text-neutral-500 dark:text-slate-500">© {new Date().getFullYear()} PT Panacea Digital Nusantara</p>
    </footer>
  )
}
