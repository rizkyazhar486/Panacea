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
      <SectionTitle icon={<IconRun size={20} />} title="Latihan Beban" subtitle="Set, ulangan, beban — dan apa yang boleh disimpulkan darinya" />

      <Card className="!p-3">
        <h2 className="text-[13px] font-black text-ink dark:text-white">Catat sesi</h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="col-span-2">
            <span className="text-[11px] font-bold text-neutral-500">Gerakan</span>
            <input value={gerakan} onChange={(e) => setGerakan(e.target.value)} placeholder="Squat, bench press, deadlift…"
              className={inputClass} aria-label="Gerakan" />
          </label>
          <label className="col-span-2">
            <span className="text-[11px] font-bold text-neutral-500">Tanggal</span>
            <input type="date" value={tanggal} max={hariIni()} onChange={(e) => setTanggal(e.target.value)} className={inputClass} aria-label="Tanggal" />
          </label>
        </div>

        <div className="mt-2 space-y-1.5">
          {set.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-10 shrink-0 text-[11px] font-bold text-neutral-500">Set {i + 1}</span>
              <input type="number" min={0} inputMode="numeric" value={s.ulangan || ''} placeholder="ulangan"
                onChange={(e) => ubahSet(i, 'ulangan', Number(e.target.value) || 0)}
                className={inputClass} aria-label={`Ulangan set ${i + 1}`} />
              <input type="number" min={0} step="0.5" inputMode="decimal" value={s.kg || ''} placeholder="kg"
                onChange={(e) => ubahSet(i, 'kg', Number(e.target.value) || 0)}
                className={inputClass} aria-label={`Beban set ${i + 1} dalam kilogram`} />
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
                Perkiraan 1RM {ramal.kg.toFixed(1)} kg dari {ramal.dariKg} kg × {ramal.dariUlangan}
                {ramal.raguh && ' — di atas 10 ulangan, persamaannya melemah'}
              </span>
            )}
          </div>
        )}

        <button onClick={simpan} disabled={!gerakan.trim() || !volumeBaru}
          className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-brand text-[13px] font-black text-white disabled:opacity-40">
          Simpan sesi
        </button>
      </Card>

      {adaVolume && (
        <Card className="!p-3">
          <h2 className="text-[13px] font-black text-ink dark:text-white">Volume 8 minggu</h2>
          <div className="mt-2 flex h-24 items-end gap-1">
            {mingguan.map((m) => (
              <span key={m.mulai} className="flex flex-1 flex-col items-center gap-1">
                <span className="w-full rounded-t bg-brand/70" style={{ height: `${Math.max(2, (m.volume / maks) * 76)}px` }} />
                <span className="text-[9px] tabular-nums text-neutral-400">{m.volume ? Math.round(m.volume / 1000) + 'k' : '–'}</span>
              </span>
            ))}
          </div>
          <p className="mt-1 text-[11px] leading-snug text-neutral-500">
            Volume beban total per minggu, dalam ribuan kilogram. Ini penjumlahan set × ulangan × beban — bukan model,
            bukan skor.
          </p>
        </Card>
      )}

      {rekor.length > 0 && (
        <Card className="!p-3">
          <h2 className="text-[13px] font-black text-ink dark:text-white">Rekor per gerakan</h2>
          <div className="mt-2 divide-y divide-neutral-100 dark:divide-white/10">
            {rekor.map((r) => (
              <div key={r.gerakan} className="py-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 truncate text-[12.5px] font-bold text-ink dark:text-white">{r.gerakan}</span>
                  <span className="shrink-0 text-[11px] tabular-nums text-neutral-500">
                    terberat <b className="text-ink dark:text-white">{r.bebanTerberat} kg</b> · {r.sesi} sesi
                  </span>
                </div>
                <span className="text-[11px] text-neutral-500">
                  Perkiraan 1RM {r.terbaik1RM.kg.toFixed(1)} kg
                  <span className="opacity-75"> (dari {r.terbaik1RM.dariKg} kg × {r.terbaik1RM.dariUlangan})</span>
                  {r.terbaik1RM.raguh && <span className="text-amber-600"> · di atas 10 ulangan</span>}
                  {' · '}volume {Math.round(r.volumeTotal).toLocaleString('id-ID')} kg
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-snug text-neutral-500">
            Perkiraan 1RM memakai Epley (1985): 1RM = beban × (1 + ulangan/30). Persamaan ini dicocokkan pada ulangan
            rendah; di atas sepuluh ulangan sebaran antarorang melebar tajam dan angkanya menjadi tebakan — karena itu
            ditandai, bukan disembunyikan. <b>Jangan dipakai sebagai beban percobaan</b> tanpa penjaga.
          </p>
        </Card>
      )}

      {semua.length > 0 && (
        <Card className="!p-3">
          <h2 className="text-[13px] font-black text-ink dark:text-white">Sesi tersimpan</h2>
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
