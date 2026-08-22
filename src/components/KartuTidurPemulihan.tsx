import { useMemo } from 'react'
import { getVitals } from '../lib/healthVitals'
import { deretMetrik } from '../lib/riwayatVitals'

// ─────────────────────────────────────────────────────────────────────────────
// Tidur semalam beserta tahapannya.
//
// TAHAP TIDUR DARI JAM TANGAN ADALAH DUGAAN. Pembagian dalam-inti-REM pada
// perangkat konsumen diturunkan dari denyut, ragam denyut, dan gerakan —
// bukan dari gelombang otak. Terhadap polisomnografi, kesesuaian tahapnya
// sedang saja: kepekaan pada tidur biasanya tinggi, tetapi pembedaan
// dalam/REM jauh lebih lemah (de Zambotti dkk., 2019, Chest 156:1275-83).
//
// Karena itu yang disajikan tegas hanyalah LAMA TIDUR, dan tahapannya
// ditampilkan sebagai proporsi dengan keterangan bahwa ia dugaan. Tidak ada
// "skor tidur" gabungan di sini: menggabungkan lama, tahap, dan gangguan
// dengan bobot pilihan sendiri menghasilkan satu angka yang terlihat pasti
// justru pada bagian yang paling tidak pasti.
// ─────────────────────────────────────────────────────────────────────────────

const TAHAP = [
  { kunci: 'sleepDeepH', label: 'Dalam', warna: '#4f46e5' },
  { kunci: 'sleepRemH', label: 'REM', warna: '#a78bfa' },
  { kunci: 'sleepCoreH', label: 'Inti', warna: '#818cf8' },
  { kunci: 'sleepAwakeH', label: 'Terjaga', warna: '#cbd5e1' },
] as const

function num(x: unknown): number | null {
  return typeof x === 'number' && Number.isFinite(x) && x > 0 ? x : null
}

function jam(h: number): string {
  const j = Math.floor(h)
  const m = Math.round((h - j) * 60)
  return m ? `${j}j ${m}m` : `${j}j`
}

export function KartuTidurPemulihan() {
  const v = useMemo(() => getVitals(), [])
  const malam = useMemo(() => deretMetrik('sleepH').slice(-14).map((t) => t.nilai), [])

  const total = num(v.sleepH)
  const tahap = TAHAP.map((t) => ({ ...t, nilai: num(v[t.kunci]) })).filter((t) => t.nilai !== null) as
    { kunci: string; label: string; warna: string; nilai: number }[]
  const jumlahTahap = tahap.reduce((a, t) => a + t.nilai, 0)

  const hrv = num(v.hrvMs)
  const pulih = num(v.recoveryPct)
  const istirahat = num(v.restingHr)

  if (!total && !tahap.length && !malam.length) return null

  const rataMalam = malam.length ? malam.reduce((a, b) => a + b, 0) / malam.length : null
  const maks = malam.length ? Math.max(...malam) : 1

  return (
    <div className="kaca rounded-3xl p-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-[13px] font-black text-ink dark:text-white">Tidur &amp; pemulihan</h2>
        {rataMalam && <span className="text-[10px] text-neutral-500">rata {malam.length} malam {rataMalam.toFixed(1)} jam</span>}
      </div>

      {total && (
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] font-black leading-none tabular-nums text-ink dark:text-white">{total.toFixed(1)}</span>
          <span className="text-[11px] font-bold text-neutral-400">jam semalam</span>
        </div>
      )}

      {jumlahTahap > 0 && (
        <div className="mt-2">
          <div className="flex h-4 overflow-hidden rounded-full">
            {tahap.map((t) => (
              <span key={t.kunci} style={{ width: `${(t.nilai / jumlahTahap) * 100}%`, background: t.warna }} />
            ))}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
            {tahap.map((t) => (
              <span key={t.kunci} className="flex items-center gap-1 text-[10.5px] text-neutral-500">
                <span className="h-2 w-2 rounded-full" style={{ background: t.warna }} />
                {t.label} {jam(t.nilai)}
              </span>
            ))}
          </div>
          <p className="mt-1.5 text-[10.5px] leading-snug text-neutral-500">
            Tahapan ini <b>dugaan jam tangan</b> dari denyut dan gerak, bukan gelombang otak. Terhadap polisomnografi,
            pembedaan dalam/REM lemah (de Zambotti dkk., 2019, Chest 156:1275-83) — yang tegas hanyalah lama tidurnya.
          </p>
        </div>
      )}

      {malam.length >= 3 && (
        <div className="mt-3">
          <span className="text-[10px] font-black uppercase tracking-wide text-neutral-500">{malam.length} malam terakhir</span>
          <div className="mt-1 flex h-16 items-end gap-1">
            {malam.map((m, i) => (
              <span key={i} className="flex-1 rounded-t bg-indigo-400/70" style={{ height: `${Math.max(3, (m / maks) * 60)}px` }} />
            ))}
          </div>
        </div>
      )}

      {(hrv || pulih || istirahat) && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {hrv && (
            <span className="rounded-xl bg-black/[0.03] p-2 dark:bg-white/5">
              <span className="block text-[9.5px] font-bold uppercase tracking-wide text-neutral-500">HRV</span>
              <span className="block text-[16px] font-black tabular-nums text-ink dark:text-white">{Math.round(hrv)}<span className="text-[10px] font-bold text-neutral-400"> ms</span></span>
            </span>
          )}
          {istirahat && (
            <span className="rounded-xl bg-black/[0.03] p-2 dark:bg-white/5">
              <span className="block text-[9.5px] font-bold uppercase tracking-wide text-neutral-500">Denyut</span>
              <span className="block text-[16px] font-black tabular-nums text-ink dark:text-white">{Math.round(istirahat)}<span className="text-[10px] font-bold text-neutral-400"> bpm</span></span>
            </span>
          )}
          {pulih && (
            <span className="rounded-xl bg-black/[0.03] p-2 dark:bg-white/5">
              <span className="block text-[9.5px] font-bold uppercase tracking-wide text-neutral-500">Pemulihan</span>
              <span className="block text-[16px] font-black tabular-nums text-ink dark:text-white">{Math.round(pulih)}<span className="text-[10px] font-bold text-neutral-400"> %</span></span>
            </span>
          )}
        </div>
      )}

      <p className="mt-2 text-[10.5px] leading-snug text-neutral-500">
        Tidak ada skor tidur gabungan di sini. Menggabungkan lama, tahap, dan gangguan dengan bobot pilihan sendiri
        menghasilkan satu angka yang terlihat pasti justru pada bagian yang paling tidak pasti.
      </p>
    </div>
  )
}

export default KartuTidurPemulihan
