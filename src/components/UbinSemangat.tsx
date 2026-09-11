import { useState } from 'react'
import { Link } from 'react-router-dom'
import { KESENANGAN, WARNA, tawaranHariIni, hariIniSelesai, tandai } from '../lib/semangat'
import { Cincin, Gelembung } from './Rupa'
import '../styles/home-dark-comfort-v34.css'

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

      <div className="kaca relative overflow-hidden rounded-3xl p-3">
        <Gelembung warna="bg-amber-300/30" kelas="-right-8 -top-10 h-28 w-28" />
        <Gelembung warna="bg-sky-300/25" kelas="-left-10 top-16 h-24 w-24" />

        <div className="relative flex items-center gap-3">
          <Cincin isi={jumlah / Math.max(1, tawaran.length)} ukuran={46} tebal={6}
            anak={<span aria-hidden className="text-[16px]">{jumlah === tawaran.length ? '✓' : '✨'}</span>} />
          <div className="min-w-0 flex-1">
            <p className="t-sedang font-black leading-snug text-ink dark:text-white">{jumlah} of {tawaran.length} optional prompts logged</p>
            <p className="t-mikro mt-0.5 leading-snug text-neutral-600 dark:text-neutral-300">Completion is not a health score. Use only what is useful today.</p>
          </div>
        </div>

        <div className="relative mt-2.5 space-y-2">
          {tawaran.map((k) => {
            const w = WARNA[k.warna]
            const sudah = selesai.includes(k.id)
            const terbuka = buka === k.id
            return (
              <div key={k.id} className={`rounded-2xl p-3 ${w.bg}`}>
                <div className="flex items-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelesai(tandai(k.id))}
                    aria-pressed={sudah}
                    aria-label={sudah ? `Undo ${k.judul}` : `Mark ${k.judul} done`}
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-[20px] ${sudah ? w.pekat : 'bg-white/75 dark:bg-white/15'}`}
                  >
                    {sudah ? '✓' : k.emoji}
                  </button>

                  <button type="button" onClick={() => setBuka(terbuka ? null : k.id)} aria-expanded={terbuka} className="min-w-0 flex-1 text-left">
                    <span className={`block text-[13.5px] font-black leading-tight ${w.teks} ${sudah ? 'line-through opacity-60' : ''}`}>{k.judul}</span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-ink/80 dark:text-neutral-100">{k.ajakan}</span>
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-black text-ink/75 dark:bg-white/10 dark:text-neutral-200">~{k.menit} min · context ▾</span>
                  </button>
                </div>

                {terbuka && (
                  <div className="mt-2 rounded-xl bg-white/70 p-2.5 dark:bg-black/20">
                    <p className="text-[11.5px] leading-relaxed text-ink dark:text-neutral-100">{k.kenapa}</p>
                    {k.ke && <Link to={k.ke} className="mt-1.5 inline-flex min-h-[36px] items-center text-[11.5px] font-bold text-brand-dark dark:text-brand">Open related tool →</Link>}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <p className="t-mikro relative mt-2.5 leading-snug text-neutral-600 dark:text-neutral-300">
          {KESENANGAN.length} prompts rotate by date. They are suggestions only and do not replace medical advice, treatment, or your own priorities.
        </p>
      </div>
    </section>
  )
}

export default UbinSemangat
