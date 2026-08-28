import { useState } from 'react'
import {
  JENIS,
  baca,
  mulai,
  mulaiLagi,
  berhenti,
  selisihHari,
  terpanjang,
} from '../lib/hitungHari'

// ─────────────────────────────────────────────────────────────────────────────
// Ubin penghitung hari.
//
// ANGKANYA BESAR DAN SENDIRIAN, karena itulah satu-satunya yang dicari orang
// saat membukanya. Di bawahnya rekor pribadi dan berapa kali sudah dicoba —
// keduanya menempatkan hari ini di dalam riwayat, bukan menggantung sendiri.
//
// "MULAI LAGI" TIDAK MEMBUANG APA-APA. Rentang yang sudah dijalani pindah ke
// riwayat dan tetap dihitung sebagai rekor. Tidak ada peringatan, tidak ada
// warna merah, dan tidak ada kalimat yang menghakimi — rasa malu adalah mesin
// yang paling sering menghentikan orang mencoba lagi.
//
// Tombolnya juga DUA LANGKAH, dengan alasan yang sama seperti penghapusan
// catatan makanan: hitungan yang hilang karena ibu jari menyenggol layar sama
// merugikannya dengan hitungan yang tidak bisa diubah.
// ─────────────────────────────────────────────────────────────────────────────

export function UbinHitungHari() {
  const [simpanan, setSimpanan] = useState(baca)
  const [pilihJenis, setPilihJenis] = useState(false)
  const [konfirmasi, setKonfirmasi] = useState<string | null>(null)
  const [bukaCatatan, setBukaCatatan] = useState<string | null>(null)

  const aktif = JENIS.filter((j) => simpanan[j.id])

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">Days since</h2>
        <button
          onClick={() => setPilihJenis((v) => !v)}
          className="t-kecil flex min-h-[40px] items-center font-bold text-brand"
        >
          {pilihJenis ? 'Done' : 'Add →'}
        </button>
      </div>

      <div className="kaca rounded-3xl p-3">
        {pilihJenis && (
          <div className="mb-3 space-y-1">
            {JENIS.map((j) => {
              const ada = Boolean(simpanan[j.id])
              return (
                <button
                  key={j.id}
                  onClick={() => setSimpanan(ada ? berhenti(j.id) : mulai(j.id))}
                  className={`flex min-h-[44px] w-full items-center gap-2 rounded-xl px-3 text-left ${
                    ada ? 'bg-brand/15' : 'bg-neutral-100 dark:bg-white/10'
                  }`}
                >
                  <span aria-hidden>{j.emoji}</span>
                  <span className="t-kecil min-w-0 flex-1 font-bold text-ink dark:text-white">{j.label}</span>
                  <span className="t-mikro font-black text-brand">{ada ? 'Tracking' : 'Track'}</span>
                </button>
              )
            })}
          </div>
        )}

        {aktif.length === 0 && !pilihJenis && (
          <p className="t-kecil leading-snug text-neutral-500">
            Nothing being counted yet. Tap <b>Add</b> to start one. It stays on this device — it is never sent
            anywhere and never appears in any summary.
          </p>
        )}

        <div className="space-y-3">
          {aktif.map((j) => {
            const h = simpanan[j.id]
            const hari = selisihHari(h.mulai)
            const rekor = terpanjang(h)
            const percobaan = h.riwayat.length + 1
            return (
              <div key={j.id} className="rounded-2xl bg-white/60 p-3 dark:bg-white/5">
                <div className="flex items-baseline gap-2">
                  <span aria-hidden className="text-[15px]">{j.emoji}</span>
                  <span className="t-kecil min-w-0 flex-1 truncate font-bold text-neutral-500">{j.label}</span>
                </div>

                <div className="mt-1 flex items-end gap-3">
                  <div>
                    <span className="block text-[38px] font-black leading-none tabular-nums text-ink dark:text-white">
                      {hari}
                    </span>
                    <span className="t-mikro font-bold uppercase tracking-wide text-neutral-400">
                      {hari === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                  <div className="mb-1 flex-1 text-right">
                    <div className="t-mikro font-bold text-neutral-400">
                      Longest <b className="tabular-nums text-ink dark:text-white">{rekor}</b>
                    </div>
                    <div className="t-mikro font-bold text-neutral-400">
                      Attempt <b className="tabular-nums text-ink dark:text-white">{percobaan}</b>
                    </div>
                  </div>
                </div>

                {konfirmasi === j.id ? (
                  <div className="mt-2 flex gap-1">
                    <button
                      onClick={() => {
                        setSimpanan(mulaiLagi(j.id))
                        setKonfirmasi(null)
                      }}
                      className="t-mikro min-h-[40px] flex-1 rounded-lg bg-brand font-bold text-white"
                    >
                      Yes, start again from today
                    </button>
                    <button
                      onClick={() => setKonfirmasi(null)}
                      className="t-mikro min-h-[40px] rounded-lg bg-neutral-200 px-3 font-bold text-neutral-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setKonfirmasi(j.id)}
                    className="t-mikro mt-2 min-h-[40px] w-full rounded-lg bg-neutral-100 font-bold text-neutral-600 dark:bg-white/10 dark:text-neutral-300"
                  >
                    Start again from today
                  </button>
                )}

                {h.riwayat.length > 0 && (
                  <p className="t-mikro mt-1.5 leading-snug text-neutral-400">
                    Previous runs: {h.riwayat.slice(0, 6).map((r) => r.hari).join(', ')}
                    {h.riwayat.length > 6 ? '…' : ''} days. Starting again does not erase them.
                  </p>
                )}

                <button
                  onClick={() => setBukaCatatan(bukaCatatan === j.id ? null : j.id)}
                  aria-expanded={bukaCatatan === j.id}
                  className="t-mikro mt-1.5 min-h-[36px] font-bold text-brand"
                >
                  {bukaCatatan === j.id ? 'Hide what is actually known ▲' : 'What is actually known ▼'}
                </button>
                {bukaCatatan === j.id && (
                  <p className="t-mikro mt-1 leading-[1.6] text-neutral-600 dark:text-neutral-300">{j.catatan}</p>
                )}
              </div>
            )
          })}
        </div>

        {aktif.length > 0 && (
          <p className="t-mikro mt-3 leading-snug text-neutral-400">
            No badges, no levels, and no warning when a run ends. A number you are made to chase is a number you will
            end up lying to.
          </p>
        )}
      </div>
    </section>
  )
}

export default UbinHitungHari
