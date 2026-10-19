import { useState } from 'react'
import { Link } from 'react-router-dom'
import { KESENANGAN, WARNA, tawaranHariIni, hariIniSelesai, tandai } from '../../lib/semangat'
import { Cincin } from '../Rupa'
import '../../styles/home-dark-comfort-v34.css'

// Optional daily prompts at the start of Home. The art stays expressive, but
// the copy remains literal: completion is not a health score or a judgement.

function sapaan(jam: number): string {
  if (jam < 4) return 'Late night'
  if (jam < 11) return 'Good morning'
  if (jam < 15) return 'Good afternoon'
  if (jam < 19) return 'Good evening'
  return 'Evening'
}

export function UbinSemangat() {
  const [selesai, setSelesai] = useState<string[]>(hariIniSelesai)
  const [buka, setBuka] = useState<string | null>(null)
  const tawaran = tawaranHariIni()
  const jam = new Date().getHours()
  const jumlah = tawaran.filter((t) => selesai.includes(t.id)).length

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500 dark:text-neutral-300">{sapaan(jam)}</h2>
        <Link to="/all-features" className="t-kecil flex min-h-[40px] items-center font-bold text-brand">More →</Link>
      </div>

      <div className="rounded-3xl border border-black/5 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <Cincin isi={jumlah / Math.max(1, tawaran.length)} ukuran={44} tebal={5}
            anak={<span aria-hidden className="text-[15px]">{jumlah === tawaran.length ? '✓' : '✨'}</span>} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-800 dark:text-white">{jumlah} of {tawaran.length} optional prompts logged</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Completion is not a health score. Use only what is useful today.</p>
          </div>
        </div>

        <div className="mt-3.5 space-y-2">
          {tawaran.map((k) => {
            const w = WARNA[k.warna]
            const sudah = selesai.includes(k.id)
            const terbuka = buka === k.id
            return (
              <div
                key={k.id}
                className="rounded-2xl border border-black/5 bg-white p-3 shadow-2xs transition-all hover:border-black/10 dark:border-white/10 dark:bg-neutral-900/60 dark:hover:border-white/15"
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setSelesai(tandai(k.id))}
                    aria-pressed={sudah}
                    aria-label={sudah ? `Undo ${k.judul}` : `Mark ${k.judul} done`}
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[17px] transition-all ${
                      sudah
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'border border-black/5 bg-slate-50 hover:bg-slate-100 dark:border-white/10 dark:bg-white/10'
                    }`}
                  >
                    {sudah ? '✓' : k.emoji}
                  </button>

                  <button type="button" onClick={() => setBuka(terbuka ? null : k.id)} aria-expanded={terbuka} className="min-w-0 flex-1 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`block text-xs font-bold ${sudah ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>
                        {k.judul}
                      </span>
                      <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        ~{k.menit} min
                      </span>
                    </div>
                    <span className="mt-0.5 block text-xs leading-snug text-slate-500 dark:text-slate-400">{k.ajakan}</span>
                  </button>
                </div>

                {terbuka && (
                  <div className="mt-2.5 rounded-xl border border-black/5 bg-slate-50 p-2.5 dark:border-white/5 dark:bg-white/5">
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{k.kenapa}</p>
                    {k.ke && <Link to={k.ke} className="mt-2 inline-flex items-center text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-400">Open related tool →</Link>}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <p className="mt-3 text-[11px] leading-snug text-slate-400 dark:text-slate-500">
          {KESENANGAN.length} prompts rotate by date. They are suggestions only and do not replace medical advice, treatment, or your own priorities.
        </p>
      </div>
    </section>
  )
}

export default UbinSemangat
