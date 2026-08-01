import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Card, SectionTitle } from '../components/ui'
import { IconActivity, IconMoon, IconHeart } from '../components/icons'
import { api, backendEnabled, type HrSample, type SleepNight } from '../lib/api'
import { getDemo } from '../lib/profile'
import { hrMaxFromAge } from '../lib/workoutImport'
import { hitungBodyBattery, hitungStres, saranBaterai, JEDA_MAKS_MS } from '../lib/bodyBattery'

// ─────────────────────────────────────────────────────────────────────────────
// Body Battery — cadangan energi 0–100 dan stres sepanjang hari.
//
// Ini fitur terakhir dari daftar Garmin yang belum dibangun. Sebelumnya tidak
// dibuat karena Garmin menghitungnya dari HRV berkesinambungan, dan Apple Watch
// tidak merekam HRV seperti itu. Yang berubah: mesin di sini memakai posisi
// denyut terhadap cadangan denyut, yang datanya memang ada, dan MENOLAK
// menjembatani celah yang lebih panjang dari 30 menit. Jadi bila jam tangan
// hanya mengirim sedikit titik, yang muncul adalah kurva pendek dan angka
// cakupan yang apa adanya — bukan garis mulus yang ditebak.
// ─────────────────────────────────────────────────────────────────────────────

const RENTANG = [
  { key: '24j', label: '24 jam', ms: 24 * 3600_000 },
  { key: '3h', label: '3 hari', ms: 3 * 24 * 3600_000 },
  { key: '7h', label: '7 hari', ms: 7 * 24 * 3600_000 },
] as const

function jam(t: number): string {
  return new Date(t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}
function tanggalJam(t: number): string {
  return new Date(t).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function BodyBattery() {
  const [samples, setSamples] = useState<HrSample[]>([])
  const [malam, setMalam] = useState<SleepNight[]>([])
  const [rentang, setRentang] = useState<(typeof RENTANG)[number]['key']>('24j')
  const [memuat, setMemuat] = useState(true)
  const [gagal, setGagal] = useState(false)

  const demo = useMemo(() => getDemo(), [])
  const ms = RENTANG.find((r) => r.key === rentang)!.ms

  const hrMaks = useMemo(() => {
    const teramati = samples.reduce((a, s) => Math.max(a, s.bpm), 0)
    return Math.max(teramati, hrMaxFromAge(demo.age || 30, demo.sex))
  }, [samples, demo])

  const load = useCallback(() => {
    setMemuat(true)
    Promise.all([api.hrSeries(Date.now() - ms), api.sleepSeries().catch(() => [])])
      .then(([hr, tidur]) => { setSamples(hr.samples); setMalam(tidur as SleepNight[]); setGagal(false) })
      .catch(() => setGagal(true))
      .finally(() => setMemuat(false))
  }, [ms])

  useEffect(() => {
    if (!backendEnabled) { setMemuat(false); return }
    load()
  }, [load])

  const hasil = useMemo(
    () => hitungBodyBattery(samples, malam, hrMaks, 70, demo.restingHr),
    [samples, malam, hrMaks, demo.restingHr],
  )
  const stres = useMemo(
    () => (hasil.cukupData ? hitungStres(samples, hasil.istirahat, hrMaks) : null),
    [samples, hasil, hrMaks],
  )
  const saran = saranBaterai(hasil.sekarang)

  if (!backendEnabled) {
    return (
      <div className="space-y-4">
        <SectionTitle icon={<IconActivity />} title="Body Battery" />
        <Card>
          <p className="text-sm leading-relaxed text-slate-300">
            Body Battery dihitung dari deret denyut yang dikumpulkan server lewat sinkronisasi
            otomatis, dan saat ini aplikasi berjalan tanpa server.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-24">
      <SectionTitle
        icon={<IconActivity />}
        title="Body Battery"
        subtitle="Cadangan energi 0–100, dihitung dari denyut jantung sepanjang hari"
      />

      <div className="flex gap-2">
        {RENTANG.map((r) => (
          <button
            key={r.key}
            onClick={() => setRentang(r.key)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              rentang === r.key ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500 dark:bg-white/5'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {memuat && <Card><p className="text-sm text-neutral-400">Memuat…</p></Card>}
      {gagal && <Card><p className="text-sm text-red-400">Gagal memuat data. Coba muat ulang halaman.</p></Card>}

      {!memuat && !gagal && !hasil.cukupData && (
        <Card>
          <p className="text-sm font-bold text-ink dark:text-white">Belum bisa dihitung</p>
          <p className="mt-1 text-sm leading-relaxed text-neutral-500">{hasil.alasan}</p>
          <p className="mt-3 text-sm leading-relaxed text-neutral-500">
            Body Battery butuh deret denyut, bukan sekadar ringkasan harian. Cara memperbanyaknya ada
            di <Link to="/log-detak-jantung" className="font-semibold underline">Log Detak Jantung</Link> —
            singkatnya, nyalakan <b>Include Workouts</b> dan matikan <b>Aggregate Data</b> di Health Auto Export.
          </p>
        </Card>
      )}

      {!memuat && !gagal && hasil.cukupData && (
        <>
          <Card>
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Sekarang</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-5xl font-black tabular-nums" style={{ color: saran.warna }}>{hasil.sekarang}</span>
                  <span className="text-lg font-bold text-neutral-400">/ 100</span>
                </div>
                <div className="mt-1 text-sm font-bold" style={{ color: saran.warna }}>{saran.judul}</div>
              </div>
              <div className="text-right text-xs text-neutral-400">
                <div>Tertinggi <b className="tabular-nums text-ink dark:text-white">{hasil.tertinggi}</b></div>
                <div>Terendah <b className="tabular-nums text-ink dark:text-white">{hasil.terendah}</b></div>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
              <div className="h-full rounded-full transition-all" style={{ width: `${hasil.sekarang}%`, background: saran.warna }} />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-neutral-500">{saran.isi}</p>
          </Card>

          <Card>
            <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Kurva energi</div>
            <div className="mt-3 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hasil.titik} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                  <defs>
                    <linearGradient id="bbFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="t" type="number" domain={['dataMin', 'dataMax']} scale="time"
                    tickFormatter={jam} tick={{ fontSize: 10, fill: '#9ca3af' }} minTickGap={40}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} width={40} />
                  <ReferenceLine y={25} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
                  <Tooltip
                    labelFormatter={(t) => tanggalJam(Number(t))}
                    formatter={(v, n, p) => {
                      const d = p.payload as { bpm: number; lajuPerJam: number; tidur: boolean }
                      return [`${v} — ${d.bpm} bpm${d.tidur ? ', tidur' : ''}${d.lajuPerJam ? `, ${d.lajuPerJam > 0 ? '+' : ''}${d.lajuPerJam}/jam` : ''}`, 'Baterai']
                    }}
                    contentStyle={{ fontSize: 12, borderRadius: 12 }}
                  />
                  <Area type="monotone" dataKey="nilai" stroke="#22c55e" strokeWidth={2} fill="url(#bbFill)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-neutral-400">
              Tertutup sampel <b className="tabular-nums">{hasil.jamTertutup} dari {hasil.jamTotal} jam</b>
              {' '}({Math.round(hasil.cakupan * 100)}%). Celah lebih dari {JEDA_MAKS_MS / 60_000} menit sengaja
              tidak dihitung, jadi bagian yang datar bisa berarti tidak ada data — bukan tidak ada perubahan.
            </p>
          </Card>

          {stres && (
            <Card>
              <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Stres sepanjang hari</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black tabular-nums" style={{ color: stres.warna }}>{stres.skor}</span>
                <span className="text-sm font-bold" style={{ color: stres.warna }}>{stres.label}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                <div className="h-full rounded-full" style={{ width: `${stres.skor}%`, background: stres.warna }} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-500">{stres.arti}</p>
              <p className="mt-2 text-[11px] leading-relaxed text-neutral-400">
                Sampel dari sesi latihan dikeluarkan dari hitungan ini. Denyut tinggi saat berolahraga
                bukan stres — bila ikut dihitung, hari dengan sesi terbaik justru akan terbaca paling buruk.
              </p>
            </Card>
          )}

          {hasil.peristiwa.length > 0 && (
            <Card>
              <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Yang paling memengaruhi</div>
              <div className="mt-3 space-y-2">
                {hasil.peristiwa.map((p, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-2 dark:bg-white/5">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-ink dark:text-white">{p.label}</div>
                      <div className="text-[12px] text-neutral-500">{jam(p.mulai)} – {jam(p.selesai)}</div>
                    </div>
                    <span className={`shrink-0 text-sm font-black tabular-nums ${p.jenis === 'isi' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {p.jenis === 'isi' ? '+' : '−'}{p.delta}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Dasar hitungan</div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-[11px] text-neutral-400">Denyut istirahat</div>
                <div className="font-black tabular-nums text-ink dark:text-white">{hasil.istirahat} bpm</div>
              </div>
              <div>
                <div className="text-[11px] text-neutral-400">Denyut maksimum</div>
                <div className="font-black tabular-nums text-ink dark:text-white">{hasil.hrMaks} bpm</div>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-neutral-500">
              Garmin menghitung Body Battery dari variabilitas denyut yang direkam terus-menerus.
              Apple Watch tidak merekamnya seperti itu, jadi halaman ini memakai posisi denyut terhadap
              cadangan denyut: mendekati istirahat mengisi, jauh di atasnya menguras, dan tidur mengisi
              paling cepat. Arahnya sama, tetapi angkanya tidak akan persis sama dengan Garmin.
            </p>
          </Card>

          {hasil.catatan.length > 0 && (
            <Card>
              <div className="text-xs font-black uppercase tracking-wide text-amber-500">Batas data</div>
              <ul className="mt-2 space-y-2">
                {hasil.catatan.map((c, i) => (
                  <li key={i} className="text-sm leading-relaxed text-neutral-500">• {c}</li>
                ))}
              </ul>
            </Card>
          )}

          <div className="flex gap-2">
            <Link to="/log-detak-jantung" className="flex-1 rounded-xl bg-neutral-100 px-3 py-2.5 text-center text-sm font-bold text-ink transition hover:bg-brand/10 dark:bg-white/5 dark:text-white">
              <IconHeart size={14} className="mr-1 inline" /> Log Detak Jantung
            </Link>
            <Link to="/pola-tidur" className="flex-1 rounded-xl bg-neutral-100 px-3 py-2.5 text-center text-sm font-bold text-ink transition hover:bg-brand/10 dark:bg-white/5 dark:text-white">
              <IconMoon size={14} className="mr-1 inline" /> Pola Tidur
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export default BodyBattery
