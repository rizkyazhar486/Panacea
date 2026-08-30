import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ambilUkur, catatUkur, umurUkur, ambilSkrining, tambahSkrining, tandaiSkrining, hapusSkrining, sisaHari,
} from '../lib/ukurBerkala'
import { ambilSesi, volumeMingguan, rekorPerGerakan } from '../lib/angkatBeban'
import { api, backendEnabled } from '../lib/api'
import type { MedReminder } from '../lib/types'

// ─────────────────────────────────────────────────────────────────────────────
// Empat widget: obat, latihan beban, pengukuran berkala, dan jadwal skrining.
//
// Keempatnya menyentuh hal yang mudah terlewat justru karena JARANG: dosis
// yang harus diminum tepat waktu, volume angkat beban yang hanya bermakna
// dibaca per pekan, kekuatan genggam yang diukur tiga bulan sekali, dan
// pemeriksaan yang jatuh temponya setahun lagi. Semua yang jarang menuntut
// pengingat; yang harian tidak.
// ─────────────────────────────────────────────────────────────────────────────

function Kepala({ judul, ke, kanan }: { judul: string; ke?: string; kanan?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">{judul}</h2>
      {kanan ?? (ke ? <Link to={ke} className="t-kecil flex min-h-[40px] items-center font-bold text-brand">Buka →</Link> : null)}
    </div>
  )
}

const KELAS_ISIAN =
  'min-w-0 flex-1 rounded-xl border border-neutral-200 bg-transparent px-2.5 py-2 text-[13px] text-ink outline-none placeholder:text-neutral-400 focus:border-brand dark:border-white/12 dark:text-white'

// ── Obat ───────────────────────────────────────────────────────────────────
export function UbinObatPengingat() {
  const [daftar, setDaftar] = useState<MedReminder[] | null>(null)

  useEffect(() => {
    if (!backendEnabled) return
    let hidup = true
    void api.listReminders()
      .then((r) => { if (hidup) setDaftar(r.filter((x) => x.active)) })
      .catch(() => { if (hidup) setDaftar([]) })
    return () => { hidup = false }
  }, [])

  // Tanpa server, pengingat obat tidak dapat berbunyi sama sekali — widgetnya
  // tidak digambar, bukan digambar dengan janji yang tidak dapat ditepati.
  if (!backendEnabled || !daftar || !daftar.length) return null

  const berikut = [...daftar].sort((a, b) => Date.parse(a.nextFireAt) - Date.parse(b.nextFireAt))[0]
  const jamLagi = (Date.parse(berikut.nextFireAt) - Date.now()) / 3_600_000

  return (
    <section>
      <Kepala judul="Obat" ke="/med-reminders" />
      <div className="kaca rounded-3xl p-3">
        <div className="flex items-baseline gap-1.5">
          <span className="t-sedang min-w-0 truncate font-black text-ink dark:text-white">{berikut.medName}</span>
          <span className="t-mikro shrink-0 text-neutral-400">{berikut.dose}</span>
          <span className="t-mikro ml-auto shrink-0 tabular-nums text-neutral-500">
            {Number.isFinite(jamLagi)
              ? jamLagi < 0 ? 'terlewat' : jamLagi < 1 ? `${Math.round(jamLagi * 60)} mnt lagi` : `${jamLagi.toFixed(1)} jam lagi`
              : berikut.timeOfDay}
          </span>
        </div>
        <div className="mt-2 flex flex-col gap-1">
          {daftar.slice(0, 4).map((r) => (
            <span key={r.id} className="flex items-baseline justify-between gap-2">
              <span className="t-kecil min-w-0 truncate text-neutral-600 dark:text-neutral-300">{r.medName}</span>
              <span className="t-mikro shrink-0 tabular-nums text-neutral-400">{r.timeOfDay}</span>
            </span>
          ))}
        </div>
        <p className="t-mikro mt-2 text-neutral-400">
          {daftar.length} pengingat aktif · dikirim server, sampai walau aplikasi ditutup
        </p>
      </div>
    </section>
  )
}

// ── Latihan beban ──────────────────────────────────────────────────────────
export function UbinBeban() {
  const { pekan, rekor, sesiPekan } = useMemo(() => {
    const semua = ambilSesi()
    const pekan = volumeMingguan(semua, 8)
    const batas = Date.now() - 7 * 864e5
    return {
      pekan,
      rekor: rekorPerGerakan(semua).slice(0, 3),
      sesiPekan: semua.filter((s) => Date.parse(s.tanggal) >= batas).length,
    }
  }, [])

  if (!pekan.some((p) => p.volume > 0)) return null
  const maks = Math.max(...pekan.map((p) => p.volume), 1)
  const kini = pekan[pekan.length - 1]?.volume ?? 0

  return (
    <section>
      <Kepala judul="Lifting volume" ke="/latihan-beban" />
      <div className="kaca rounded-3xl p-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[26px] font-black leading-none tabular-nums nyala text-ink dark:text-white">
            {(kini / 1000).toFixed(1)}
          </span>
          <span className="t-mikro font-bold text-neutral-400">tonnes this week</span>
          <span className="t-mikro ml-auto shrink-0 text-neutral-400">{sesiPekan} sessions</span>
        </div>
        {/* Volume = berat x ulangan x set, dijumlahkan. Ia BUKAN ukuran mutu
            latihan: menaikkan angka ini dengan menambah set ringan sangat
            mudah, dan itu tidak sama dengan menjadi lebih kuat. Karena itu
            rekor per gerakan ditampilkan berdampingan. */}
        <span className="mt-2 flex h-10 items-end gap-[3px]" aria-hidden>
          {pekan.map((p, i) => (
            <span key={i} className="flex-1 rounded-sm bg-brand" style={{ height: `${Math.max(4, (p.volume / maks) * 100)}%` }} />
          ))}
        </span>
        {rekor.length > 0 && (
          <div className="mt-2 flex flex-col gap-0.5">
            {rekor.map((r) => (
              <span key={r.gerakan} className="flex items-baseline justify-between gap-2">
                <span className="t-mikro min-w-0 truncate text-neutral-500">{r.gerakan}</span>
                <span className="t-mikro shrink-0 tabular-nums font-black text-ink dark:text-white">
                  {r.bebanTerberat} kg · 1RM ≈ {Math.round(r.terbaik1RM.kg)} kg
                </span>
              </span>
            ))}
          </div>
        )}
        <p className="t-mikro mt-2 leading-snug text-neutral-400">
          Volume delapan pekan (berat × ulangan × set). Naik-turunnya wajar; yang perlu diperhatikan penurunan panjang bersamaan dengan rekor yang ikut turun.
        </p>
      </div>
    </section>
  )
}

// ── Pengukuran berkala: genggam & keseimbangan ─────────────────────────────
export function UbinUkurBerkala() {
  const [versi, setVersi] = useState(0)
  const [nilai, setNilai] = useState('')
  const [jenis, setJenis] = useState<'genggam' | 'keseimbangan'>('genggam')
  const [detik, setDetik] = useState(0)
  const jam = useRef<number | null>(null)

  useEffect(() => {
    const on = () => setVersi((v) => v + 1)
    window.addEventListener('panacea:ukur', on)
    return () => window.removeEventListener('panacea:ukur', on)
  }, [])

  useEffect(() => () => { if (jam.current) window.clearInterval(jam.current) }, [])

  const genggam = useMemo(() => ambilUkur('genggam'), [versi])
  const seimbang = useMemo(() => ambilUkur('keseimbangan'), [versi])
  const deret = jenis === 'genggam' ? genggam : seimbang
  const umur = umurUkur(jenis)

  const mulaiHitung = () => {
    if (jam.current) { // berhenti dan catat
      window.clearInterval(jam.current)
      jam.current = null
      if (detik >= 1) catatUkur('keseimbangan', detik)
      setDetik(0)
      setVersi((v) => v + 1)
      return
    }
    setDetik(0)
    const mulai = Date.now()
    jam.current = window.setInterval(() => setDetik((Date.now() - mulai) / 1000), 100)
  }

  const simpan = () => {
    const n = Number(nilai.replace(',', '.'))
    if (!Number.isFinite(n) || n <= 0) return
    catatUkur(jenis, n)
    setNilai('')
    setVersi((v) => v + 1)
  }

  const akhir = deret[deret.length - 1]
  const maks = Math.max(...deret.map((d) => d.nilai), 1)

  return (
    <section>
      <Kepala judul="Periodic measures" ke="/tubuh" />
      <div className="kaca rounded-3xl p-3">
        <div className="flex gap-1.5">
          {(['genggam', 'keseimbangan'] as const).map((j) => (
            <button
              key={j}
              onClick={() => setJenis(j)}
              className={`t-mikro shrink-0 rounded-full px-3 py-1.5 font-black transition ${
                j === jenis ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500 dark:bg-white/8 dark:text-neutral-300'
              }`}
            >
              {j === 'genggam' ? 'Grip strength' : 'Single-leg stand'}
            </button>
          ))}
        </div>

        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-[26px] font-black leading-none tabular-nums nyala text-ink dark:text-white">
            {akhir ? akhir.nilai : '—'}
          </span>
          <span className="t-mikro font-bold text-neutral-400">{jenis === 'genggam' ? 'kg' : 'seconds'}</span>
          {umur != null && (
            <span className="t-mikro ml-auto shrink-0 text-neutral-400">
              {umur === 0 ? 'measured today' : `${umur} days ago`}
            </span>
          )}
        </div>

        {deret.length >= 3 && (
          <span className="mt-2 flex h-10 items-end gap-[3px]" aria-hidden>
            {deret.slice(-12).map((d) => (
              <span key={d.id} className="flex-1 rounded-sm bg-teal-400" style={{ height: `${Math.max(8, (d.nilai / maks) * 100)}%` }} />
            ))}
          </span>
        )}

        {jenis === 'keseimbangan' ? (
          <button
            onClick={mulaiHitung}
            className={`t-kecil mt-2 min-h-[44px] w-full rounded-2xl font-bold transition ${
              jam.current ? 'bg-rose-500 text-white' : 'bg-brand text-white'
            }`}
          >
            {jam.current ? `Stop · ${detik.toFixed(1)} s` : 'Start timing (eyes open, one leg)'}
          </button>
        ) : (
          <div className="mt-2 flex gap-1.5">
            <input
              inputMode="decimal"
              value={nilai}
              onChange={(e) => setNilai(e.target.value)}
              placeholder="Dynamometer result (kg)"
              aria-label="Grip strength in kg"
              className={KELAS_ISIAN}
            />
            <button onClick={simpan} className="t-kecil shrink-0 rounded-xl bg-brand px-3 font-bold text-white">Log</button>
          </div>
        )}

        <p className="t-mikro mt-2 leading-snug text-neutral-400">
          {jenis === 'genggam'
            ? 'Needs a hand dynamometer. What is measured is grip strength — a marker that repeatedly accompanies independence in later life in cohort studies, not a prediction about you.'
            : 'Stand on one leg, eyes open, near something to hold. Stop the moment the foot touches the floor. What is measured is how long you stood, not a prediction of fall risk.'}
        </p>
      </div>
    </section>
  )
}

// ── Jadwal skrining ────────────────────────────────────────────────────────
export function UbinSkrining() {
  const [versi, setVersi] = useState(0)
  const [buka, setBuka] = useState(false)
  const [nama, setNama] = useState('')
  const [bulan, setBulan] = useState('12')

  useEffect(() => {
    const on = () => setVersi((v) => v + 1)
    window.addEventListener('panacea:skrining', on)
    return () => window.removeEventListener('panacea:skrining', on)
  }, [])

  const daftar = useMemo(() => {
    return ambilSkrining()
      .map((s) => ({ s, sisa: sisaHari(s) }))
      .sort((a, b) => (a.sisa ?? -9999) - (b.sisa ?? -9999))
  }, [versi])

  return (
    <section>
      <Kepala
        judul="Screening & vaccines"
        kanan={
          <button onClick={() => setBuka((v) => !v)} className="t-kecil flex min-h-[40px] items-center font-bold text-brand">
            {buka ? 'Close' : '+ Add'}
          </button>
        }
      />
      <div className="kaca rounded-3xl p-3">
        {buka && (
          <div className="mb-2 flex gap-1.5 border-b border-neutral-100 pb-2 dark:border-white/10">
            <input
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="e.g. Cervical smear, HbA1c, dental"
              aria-label="Test name"
              className={KELAS_ISIAN}
            />
            <select
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
              aria-label="Interval in months"
              className="t-kecil shrink-0 rounded-xl border border-neutral-200 bg-transparent px-1.5 text-ink dark:border-white/12 dark:text-white"
            >
              {[3, 6, 12, 24, 36, 60].map((b) => <option key={b} value={b}>{b} mo</option>)}
            </select>
            <button
              onClick={() => { tambahSkrining(nama, Number(bulan)); setNama(''); setBuka(false); setVersi((v) => v + 1) }}
              className="t-kecil shrink-0 rounded-xl bg-brand px-3 font-bold text-white"
            >
              Save
            </button>
          </div>
        )}

        {!daftar.length ? (
          <p className="t-kecil text-neutral-500">
            Nothing yet. Add a test and the interval you agreed with your doctor — this app does not decide who needs which test.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {daftar.map(({ s, sisa }) => {
              const lewat = sisa != null && sisa < 0
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1">
                    <span className="t-kecil block truncate font-bold text-ink dark:text-white">{s.nama}</span>
                    <span className={`t-mikro block truncate ${lewat ? 'font-bold text-amber-600 dark:text-amber-400' : 'text-neutral-400'}`}>
                      {sisa == null
                        ? `Never marked · every ${s.bulan} mo`
                        : lewat
                          ? `${Math.abs(sisa)} days overdue · every ${s.bulan} mo`
                          : `${sisa} days to go · every ${s.bulan} mo`}
                    </span>
                  </span>
                  <button
                    onClick={() => { tandaiSkrining(s.id); setVersi((v) => v + 1) }}
                    className="t-mikro min-h-[40px] shrink-0 rounded-lg bg-neutral-100 px-2 font-black text-neutral-600 dark:bg-white/10 dark:text-neutral-200"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => { hapusSkrining(s.id); setVersi((v) => v + 1) }}
                    aria-label={`Hapus ${s.nama}`}
                    className="t-mikro shrink-0 px-1 font-black text-neutral-400"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
