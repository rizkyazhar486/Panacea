import { useMemo, useState } from 'react'
import { Card, SectionTitle, inputClass } from '../components/ui'
import { IconRun } from '../components/icons'
import {
  ambilSesi, simpanSesi, hapusSesi, volumeSesi, rekorPerGerakan, volumeMingguan, epley,
  type SesiAngkat, type SetAngkat,
} from '../lib/angkatBeban'

// ─────────────────────────────────────────────────────────────────────────────
// Latihan beban.
//
// ANGKA UTAMANYA VOLUME, BUKAN 1RM. Volume beban (set x ulangan x kg) adalah
// penjumlahan: ia benar apa adanya dan dapat diperiksa siapa pun. Perkiraan
// 1RM adalah persamaan yang dicocokkan pada ulangan rendah, dan menaruhnya
// sebagai angka terbesar di layar akan membuat tebakan tampak sebagai capaian.
//
// TIDAK ADA PROGRAM YANG DISARANKAN DI SINI. Menyusun program dari tiga sesi
// tercatat berarti mengarang; yang dapat dikatakan jujur hanyalah apa yang
// sudah dikerjakan dan bagaimana arahnya.
// ─────────────────────────────────────────────────────────────────────────────

function hariIni(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const KOSONG: SetAngkat[] = [{ ulangan: 0, kg: 0 }, { ulangan: 0, kg: 0 }, { ulangan: 0, kg: 0 }]

export function LatihanBeban() {
  const [semua, setSemua] = useState<SesiAngkat[]>(ambilSesi)
  const [gerakan, setGerakan] = useState('')
  const [tanggal, setTanggal] = useState(hariIni)
  const [set, setSet] = useState<SetAngkat[]>(KOSONG)

  const rekor = useMemo(() => rekorPerGerakan(semua), [semua])
  const mingguan = useMemo(() => volumeMingguan(semua), [semua])
  const maks = Math.max(...mingguan.map((m) => m.volume), 1)
  const adaVolume = mingguan.some((m) => m.volume > 0)

  const ubahSet = (i: number, medan: keyof SetAngkat, nilai: number) =>
    setSet((s) => s.map((x, j) => (j === i ? { ...x, [medan]: nilai } : x)))

  function simpan() {
    const isi = set.filter((s) => s.ulangan > 0 && s.kg > 0)
    if (!gerakan.trim() || !isi.length) return
    setSemua(simpanSesi({ id: `${Date.now()}`, tanggal, gerakan: gerakan.trim(), set: isi }))
    setGerakan('')
    setSet(KOSONG)
  }

  const pratinjau = set.filter((s) => s.ulangan > 0 && s.kg > 0)
  const volumeBaru = pratinjau.reduce((a, s) => a + s.ulangan * s.kg, 0)
  const terberat = pratinjau.reduce<SetAngkat | null>((a, s) => (!a || s.kg > a.kg ? s : a), null)
  const ramal = terberat ? epley(terberat.kg, terberat.ulangan) : null

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-fluid pb-24">
      <SectionTitle icon={<IconRun size={20} />} title="Strength Training Log" subtitle="Sets, reps, weight — and what can honestly be concluded from them" />

      <Card className="!p-3">
        <h2 className="text-[13px] font-black text-ink dark:text-white">Log a session</h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="col-span-2">
            <span className="text-[11px] font-bold text-neutral-500">Movement</span>
            <input value={gerakan} onChange={(e) => setGerakan(e.target.value)} placeholder="Squat, bench press, deadlift…"
              className={inputClass} aria-label="Movement" />
          </label>
          <label className="col-span-2">
            <span className="text-[11px] font-bold text-neutral-500">Date</span>
            <input type="date" value={tanggal} max={hariIni()} onChange={(e) => setTanggal(e.target.value)} className={inputClass} aria-label="Date" />
          </label>
        </div>

        <div className="mt-2 space-y-1.5">
          {set.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-10 shrink-0 text-[11px] font-bold text-neutral-500">Set {i + 1}</span>
              <input type="number" min={0} inputMode="numeric" value={s.ulangan || ''} placeholder="reps"
                onChange={(e) => ubahSet(i, 'ulangan', Number(e.target.value) || 0)}
                className={inputClass} aria-label={`Reps for set ${i + 1}`} />
              <input type="number" min={0} step="0.5" inputMode="decimal" value={s.kg || ''} placeholder="kg"
                onChange={(e) => ubahSet(i, 'kg', Number(e.target.value) || 0)}
                className={inputClass} aria-label={`Weight for set ${i + 1} in kilograms`} />
            </div>
          ))}
          <button onClick={() => setSet((s) => [...s, { ulangan: 0, kg: 0 }])}
            className="flex h-9 items-center text-[12px] font-bold text-brand">+ set</button>
        </div>

        {volumeBaru > 0 && (
          <div className="mt-2 rounded-xl bg-black/[0.03] p-2.5 dark:bg-white/5">
            <span className="text-[12px] font-bold text-ink dark:text-white">
              Volume {volumeBaru.toLocaleString('id-ID')} kg
            </span>
            {ramal && (
              <span className="block text-[11px] text-neutral-500">
                Estimated 1RM {ramal.kg.toFixed(1)} kg from {ramal.dariKg} kg × {ramal.dariUlangan}
                {ramal.raguh && ' — above 10 reps the equation weakens'}
              </span>
            )}
          </div>
        )}

        <button onClick={simpan} disabled={!gerakan.trim() || !volumeBaru}
          className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-brand text-[13px] font-black text-white disabled:opacity-40">
          Save session
        </button>
      </Card>

      {adaVolume && (
        <Card className="!p-3">
          <h2 className="text-[13px] font-black text-ink dark:text-white">8-week volume</h2>
          <div className="mt-2 flex h-24 items-end gap-1">
            {mingguan.map((m) => (
              <span key={m.mulai} className="flex flex-1 flex-col items-center gap-1">
                <span className="w-full rounded-t bg-brand/70" style={{ height: `${Math.max(2, (m.volume / maks) * 76)}px` }} />
                <span className="text-[9px] tabular-nums text-neutral-400">{m.volume ? Math.round(m.volume / 1000) + 'k' : '–'}</span>
              </span>
            ))}
          </div>
          <p className="mt-1 text-[11px] leading-snug text-neutral-500">
            Total load volume per week, in thousands of kilograms. This is the sum of sets × reps × weight — not a
            model, not a score.
          </p>
        </Card>
      )}

      {rekor.length > 0 && (
        <Card className="!p-3">
          <h2 className="text-[13px] font-black text-ink dark:text-white">Records per movement</h2>
          <div className="mt-2 divide-y divide-neutral-100 dark:divide-white/10">
            {rekor.map((r) => (
              <div key={r.gerakan} className="py-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 truncate text-[12.5px] font-bold text-ink dark:text-white">{r.gerakan}</span>
                  <span className="shrink-0 text-[11px] tabular-nums text-neutral-500">
                    heaviest <b className="text-ink dark:text-white">{r.bebanTerberat} kg</b> · {r.sesi} sessions
                  </span>
                </div>
                <span className="text-[11px] text-neutral-500">
                  Estimated 1RM {r.terbaik1RM.kg.toFixed(1)} kg
                  <span className="opacity-75"> (from {r.terbaik1RM.dariKg} kg × {r.terbaik1RM.dariUlangan})</span>
                  {r.terbaik1RM.raguh && <span className="text-amber-600"> · above 10 reps</span>}
                  {' · '}volume {Math.round(r.volumeTotal).toLocaleString('en-GB')} kg
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-snug text-neutral-500">
            The estimated 1RM uses Epley (1985): 1RM = weight × (1 + reps/30). This equation is fitted to low
            reps; above ten reps the spread between people widens sharply and the figure becomes a guess — which is
            why it is flagged, not hidden. <b>Do not use it as a weight to attempt</b> without a spotter.
          </p>
        </Card>
      )}

      {semua.length > 0 && (
        <Card className="!p-3">
          <h2 className="text-[13px] font-black text-ink dark:text-white">Saved sessions</h2>
          <div className="mt-2 divide-y divide-neutral-100 dark:divide-white/10">
            {semua.slice(0, 20).map((s) => (
              <div key={s.id} className="flex items-baseline justify-between gap-2 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-bold text-ink dark:text-white">{s.gerakan}</span>
                  <span className="block text-[11px] text-neutral-500">
                    {s.tanggal} · {s.set.map((x) => `${x.ulangan}×${x.kg}`).join(', ')} · {volumeSesi(s).toLocaleString('id-ID')} kg
                  </span>
                </span>
                <button onClick={() => setSemua(hapusSesi(s.id))}
                  className="flex h-9 shrink-0 items-center px-2 text-[11px] font-bold text-rose-500">Hapus</button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

export default LatihanBeban
