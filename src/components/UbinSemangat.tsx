import { useState } from 'react'
import { Link } from 'react-router-dom'
import { KESENANGAN, WARNA, tawaranHariIni, hariIniSelesai, tandai } from '../lib/semangat'

// ─────────────────────────────────────────────────────────────────────────────
// Ubin yang membuka beranda.
//
// Sebelumnya yang pertama terlihat di beranda adalah grafik denyut dan tekanan
// darah. Sekarang yang pertama terlihat adalah tiga hal kecil yang bisa
// dilakukan sekarang dan terasa enak. Alasannya panjang dan ditulis di kepala
// lib/semangat.ts; ringkasnya: aplikasi yang menyapa dengan angka penyakit
// membuat orang merasa seperti pasien, dan orang yang merasa seperti pasien
// menutup aplikasinya.
//
// WARNANYA BERBEDA-BEDA DENGAN SENGAJA. Beranda satu warna terbaca seperti
// borang. Tiap kartu membawa warnanya sendiri, dan warna itu melekat pada
// jenis kegiatannya sehingga lama-lama dikenali tanpa dibaca.
//
// TIDAK ADA YANG BISA GAGAL DI LAYAR INI. Tidak ada rangkaian yang putus,
// tidak ada target yang meleset, tidak ada warna merah. Yang belum dilakukan
// tampak persis seperti tawaran yang belum diambil — karena memang itu.
// ─────────────────────────────────────────────────────────────────────────────

function sapaan(jam: number): string {
  if (jam < 4) return 'Still up'
  if (jam < 11) return 'Good morning'
  if (jam < 15) return 'Good afternoon'
  if (jam < 19) return 'Good evening'
  return 'Winding down'
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
        <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">
          {sapaan(jam)}
        </h2>
        <Link to="/all-features" className="t-kecil flex min-h-[40px] items-center font-bold text-brand">
          More →
        </Link>
      </div>

      <div className="kaca rounded-3xl p-3">
        <p className="t-sedang font-black leading-snug text-ink dark:text-white">
          {jumlah === 0 && 'Three small things, if you feel like it.'}
          {jumlah === 1 && 'One done. That already counts.'}
          {jumlah === 2 && 'Two done. Nice day so far.'}
          {jumlah === 3 && 'All three. Go enjoy the rest of it.'}
        </p>

        <div className="mt-2.5 space-y-2">
          {tawaran.map((k) => {
            const w = WARNA[k.warna]
            const sudah = selesai.includes(k.id)
            const terbuka = buka === k.id
            return (
              <div key={k.id} className={`rounded-2xl p-3 transition ${w.bg}`}>
                <div className="flex items-start gap-2.5">
                  {/* Tombolnya besar dan bundar: yang paling sering ditekan di
                      layar ini, jadi ia yang paling mudah dikenai jempol. */}
                  <button
                    onClick={() => setSelesai(tandai(k.id))}
                    aria-pressed={sudah}
                    aria-label={sudah ? `Undo ${k.judul}` : `Mark ${k.judul} done`}
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-[20px] transition ${
                      sudah ? `${w.pekat} scale-105` : 'bg-white/70 dark:bg-white/15'
                    }`}
                  >
                    {sudah ? '✓' : k.emoji}
                  </button>

                  <button
                    onClick={() => setBuka(terbuka ? null : k.id)}
                    aria-expanded={terbuka}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className={`block text-[13.5px] font-black leading-tight ${w.teks} ${sudah ? 'line-through opacity-60' : ''}`}>
                      {k.judul}
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-ink/75 dark:text-neutral-200">
                      {k.ajakan}
                    </span>
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-black text-ink/70 dark:bg-white/10 dark:text-neutral-300">
                      {k.menit} min · why ▾
                    </span>
                  </button>
                </div>

                {terbuka && (
                  <div className="mt-2 rounded-xl bg-white/60 p-2.5 dark:bg-white/10">
                    <p className="text-[11.5px] leading-relaxed text-ink dark:text-neutral-200">{k.kenapa}</p>
                    {k.ke && (
                      <Link to={k.ke} className="mt-1.5 inline-flex min-h-[36px] items-center text-[11.5px] font-bold text-brand-dark dark:text-brand">
                        Open the full thing →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <p className="t-mikro mt-2.5 leading-snug text-neutral-500">
          Nothing here can be broken or lost. A day with none of these is still a fine day — these are offers, not
          tasks, and there are {KESENANGAN.length} of them that take turns.
        </p>
      </div>
    </section>
  )
}

export default UbinSemangat
