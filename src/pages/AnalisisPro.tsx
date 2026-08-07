import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useJam } from '../lib/useJam'
import { AreaChart, Area, Line, ComposedChart, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Card, SectionTitle } from '../components/ui'
import { IconChartUp, IconRun, IconTimer, IconActivity } from '../components/icons'
import { getWorkouts, mergeWorkouts } from '../lib/workoutStore'
import { parseWorkouts, hrMaxFromAge, fmtDurasi, fmtPace } from '../lib/workoutImport'
import { api, backendEnabled } from '../lib/api'
import { getDemo } from '../lib/profile'
import { useVitals } from '../lib/useVitals'
import {
  upayaRelatif, kebugaranKesegaran, bacaKesegaran, usahaTerbaik, logLatihan,
  kemajuanTarget, zonaPace, perkiraanPaceAmbang, hariRiwayatLatihan, lajuBeban, TIDAK_DIBANGUN,
  type Target, type JenisTarget, type PeriodeTarget,
} from '../lib/analisisPro'

// ─────────────────────────────────────────────────────────────────────────────
// Analisis Pro — satu halaman berisi padanan fitur analisis berbayar Strava,
// dihitung dari sesi latihan yang sudah masuk sendiri lewat sinkronisasi.
//
// Yang tidak bisa dihitung tidak dikarang. Daftar beserta alasannya ada di
// kartu paling bawah, dan alasannya spesifik — bukan "belum tersedia".
// ─────────────────────────────────────────────────────────────────────────────

const KUNCI_TARGET = 'pmd-target-latihan'

function muatTarget(): Target {
  try {
    const raw = localStorage.getItem(KUNCI_TARGET)
    if (raw) return JSON.parse(raw) as Target
  } catch { /* abaikan */ }
  return { jenis: 'jarak', periode: 'pekan', nilai: 20 }
}

export function AnalisisPro() {
  const vitals = useVitals()
  const demo = useMemo(() => getDemo(), [])
  const [tarikan, setTarikan] = useState(0)
  const [target, setTarget] = useState<Target>(muatTarget)
  const [satuanLog, setSatuanLog] = useState<'pekan' | 'bulan'>('pekan')

  const workouts = useMemo(() => getWorkouts(), [vitals, tarikan])

  useEffect(() => {
    if (!backendEnabled) return
    let hidup = true
    api.deviceWorkouts()
      .then((r) => {
        if (!hidup || !r.workouts.length) return
        if (mergeWorkouts(parseWorkouts(JSON.stringify({ data: { workouts: r.workouts } })))) {
          setTarikan((n) => n + 1)
        }
      })
      .catch(() => { /* offline: yang lokal tetap dipakai */ })
    return () => { hidup = false }
  }, [])

  useEffect(() => {
    try { localStorage.setItem(KUNCI_TARGET, JSON.stringify(target)) } catch { /* kuota */ }
  }, [target])

  const sekarang = useJam()

  const konteks = useMemo(() => {
    const teramati = workouts.reduce((a, w) => Math.max(a, w.maxHr ?? 0), 0)
    return {
      hrMax: Math.max(teramati, hrMaxFromAge(demo.age || 30, demo.sex)),
      hrRest: demo.restingHr && demo.restingHr > 0 ? demo.restingHr : 60,
      sex: demo.sex,
    }
  }, [workouts, demo])

  // `sekarang` ikut dependensi: kelelahan meluruh terhadap jam berjalan, bukan
  // terhadap tanggal sesi terakhir.
  const ff = useMemo(() => kebugaranKesegaran(workouts, konteks, 120, sekarang), [workouts, konteks, sekarang])
  const kini = ff.length ? ff[ff.length - 1] : null
  const umurRiwayat = useMemo(() => hariRiwayatLatihan(workouts, sekarang), [workouts, sekarang])
  const baca = kini ? bacaKesegaran(kini.kesegaran, umurRiwayat) : null
  // Dipasang berdampingan dengan kesegaran karena keduanya menjawab pertanyaan
  // berbeda, dan pada riwayat pendek hanya yang ini yang punya jawaban.
  const laju = useMemo(() => lajuBeban(workouts, konteks, sekarang), [workouts, konteks, sekarang])
  const pr = useMemo(() => usahaTerbaik(workouts), [workouts])
  const log = useMemo(() => logLatihan(workouts, konteks, satuanLog), [workouts, konteks, satuanLog])
  const kemajuan = useMemo(() => kemajuanTarget(workouts, target), [workouts, target])
  const ambang = useMemo(() => perkiraanPaceAmbang(workouts), [workouts])
  const zp = useMemo(() => (ambang ? zonaPace(workouts, ambang) : []), [workouts, ambang])
  const terbaru = useMemo(
    () => [...workouts].sort((a, b) => Date.parse(b.mulai) - Date.parse(a.mulai)).slice(0, 8),
    [workouts],
  )

  if (!workouts.length) {
    return (
      <div className="space-y-4 pb-24">
        <SectionTitle icon={<IconChartUp />} title="Analisis Pro" subtitle="Kebugaran, kesegaran, upaya relatif, rekor dan target" />
        <Card>
          <p className="text-sm leading-relaxed text-slate-300">
            Belum ada sesi latihan tersimpan, jadi belum ada yang bisa dianalisis. Semua angka di
            halaman ini dihitung dari sesi nyata — tidak ada contoh atau data bawaan.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Sesi masuk sendiri lewat sinkronisasi bila di Health Auto Export ada otomatisasi
            <strong className="text-slate-300"> Data Type: Workouts</strong> dengan
            <strong className="text-slate-300"> Date Range: Today</strong>. Periksa di{' '}
            <Link to="/health-data/tutorial" className="font-semibold text-white underline">Diagnosa sinkronisasi</Link>.
          </p>
        </Card>
        <KartuTidakDibangun />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-24">
      <SectionTitle icon={<IconChartUp />} title="Analisis Pro"
        subtitle={`${workouts.length} sesi · HRmax ${konteks.hrMax} · HRistirahat ${konteks.hrRest} bpm`} />

      {/* ── Kebugaran & Kesegaran ── */}
      {kini && baca && (
        <Card>
          <SectionTitle icon={<IconChartUp />} title="Kebugaran & Kesegaran"
            subtitle="Beban yang mengendap (42 hari) melawan kelelahan yang masih terasa (7 hari)" />
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Stat label="Kebugaran" value={String(Math.round(kini.kebugaran))} warna="#60a5fa" />
            <Stat label="Kelelahan" value={String(Math.round(kini.kelelahan))} warna="#f87171" />
            <Stat label="Kesegaran" value={String(Math.round(kini.kesegaran))} warna={baca.warna} />
          </div>
          <div className="mt-3 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={ff} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="fitFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="tanggal" tick={{ fontSize: 9, fill: '#9ca3af' }} minTickGap={44}
                  tickFormatter={(v) => new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} />
                <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} width={30} />
                <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10, background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0' }}
                  wrapperStyle={{ outline: 'none' }} isAnimationActive={false}
                  labelFormatter={(v) => new Date(v as string).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} />
                <Area type="monotone" dataKey="kebugaran" name="Kebugaran" stroke="#60a5fa" strokeWidth={2} fill="url(#fitFill)" dot={false} />
                <Line type="monotone" dataKey="kelelahan" name="Kelelahan" stroke="#f87171" strokeWidth={1.6} dot={false} />
                <Line type="monotone" dataKey="kesegaran" name="Kesegaran" stroke="#34d399" strokeWidth={1.6} strokeDasharray="4 3" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 rounded-xl p-3" style={{ background: `${baca.warna}1a` }}>
            <div className="text-sm font-bold" style={{ color: baca.warna }}>{baca.judul}</div>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-400">{baca.arti}</p>
          </div>

          {/* Laju penambahan beban — bisa dihitung sejak pekan kedua, jadi
              inilah yang menjaga orang selama kesegaran belum bisa dibaca. */}
          {laju && (
            <div className="mt-2 rounded-xl p-3" style={{ background: `${laju.warna}14`, border: `1px solid ${laju.warna}33` }}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-bold" style={{ color: laju.warna }}>{laju.judul}</span>
                {laju.rasio !== null && (
                  <span className="text-[11px] font-bold text-slate-400">
                    beban 7 hari {laju.akut} · kebiasaan {laju.kronis} · rasio {laju.rasio}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-400">{laju.arti}</p>
              {laju.kmPekanLalu > 0 && (
                <p className="mt-1 text-[11px] text-slate-500">
                  Jarak: {laju.kmPekanIni} km pekan ini, {laju.kmPekanLalu} km pekan lalu.
                </p>
              )}
              <p className="mt-1 text-[10px] leading-relaxed text-slate-600">
                Rambu 0,8–1,3 berasal dari penelitian pada atlet tim dan sejak itu banyak dikritik —
                ia menandai kecepatan penambahan, bukan meramalkan cedera.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* ── Target ── */}
      <Card>
        <SectionTitle icon={<IconTimer />} title="Target" subtitle="Tentukan sendiri, dihitung dari sesi yang benar-benar tercatat" />
        <div className="mt-3 flex flex-wrap gap-2">
          <Pilih value={target.jenis} onChange={(v) => setTarget({ ...target, jenis: v as JenisTarget })}
            opsi={[['jarak', 'Jarak'], ['waktu', 'Waktu'], ['sesi', 'Jumlah sesi']]} />
          <Pilih value={target.periode} onChange={(v) => setTarget({ ...target, periode: v as PeriodeTarget })}
            opsi={[['pekan', 'Per pekan'], ['bulan', 'Per bulan'], ['tahun', 'Per tahun']]} />
          <input type="number" min={1} value={target.nilai}
            onChange={(e) => setTarget({ ...target, nilai: Math.max(0, Number(e.target.value) || 0) })}
            className="w-24 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white" />
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-black text-white">
            {kemajuan.tercapai} <span className="text-sm font-bold text-slate-400">/ {kemajuan.sasaran} {kemajuan.satuan}</span>
          </span>
          <span className={`text-sm font-bold ${kemajuan.diJalur ? 'text-emerald-400' : 'text-amber-400'}`}>
            {kemajuan.pct}%
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full" style={{ width: `${kemajuan.pct}%`, background: kemajuan.diJalur ? '#22c55e' : '#f59e0b' }} />
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
          {kemajuan.pct >= 100
            ? 'Target periode ini sudah tercapai.'
            : `Sisa ${kemajuan.sisaHari} hari — perlu sekitar ${kemajuan.perluPerHari} ${kemajuan.satuan} per hari. ${kemajuan.diJalur ? 'Saat ini masih di jalur.' : 'Saat ini tertinggal dari laju yang dibutuhkan.'}`}
        </p>
      </Card>

      {/* ── Upaya relatif ── */}
      <Card>
        <SectionTitle icon={<IconActivity />} title="Upaya Relatif"
          subtitle="Seberapa berat tiap sesi, dari denyut — bukan dari durasi saja" />
        <div className="mt-3 space-y-1.5">
          {terbaru.map((w) => {
            const u = upayaRelatif(w, konteks)
            return (
              <div key={w.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-bold text-white">{w.nama}</div>
                  <div className="text-[10px] text-slate-500">
                    {new Date(w.mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    {' · '}{fmtDurasi(w.durasi)}{w.jarakKm ? ` · ${w.jarakKm} km` : ''}
                    {!u.dariDeret && ' · dari rata-rata'}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-lg font-black tabular-nums" style={{ color: u.warna }}>{u.skor}</div>
                  <div className="text-[10px]" style={{ color: u.warna }}>{u.label}</div>
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          Berbasis TRIMP Banister: satu menit berat membebani jauh lebih besar daripada satu menit
          ringan. Skalanya tidak akan sama persis dengan angka Strava — rumus mereka tidak
          diterbitkan — tetapi perbandingan antar sesi Anda sendiri tetap sahih.
        </p>
      </Card>

      {/* ── Usaha terbaik ── */}
      {pr.length > 0 && (
        <Card>
          <SectionTitle icon={<IconRun />} title="Usaha Terbaik" subtitle="Waktu tercepat per jarak" />
          <div className="mt-3 space-y-1.5">
            {pr.map((p) => (
              <div key={p.label} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2">
                <div>
                  <div className="text-[13px] font-bold text-white">{p.label}</div>
                  <div className="text-[10px] text-slate-500">
                    {new Date(p.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {p.diskalakan && ' · diskalakan dari jarak yang tidak persis'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[15px] font-black tabular-nums text-white">{fmtDurasi(p.detik)}</div>
                  <div className="text-[10px] text-slate-400">{fmtPace(p.paceSec)}/km</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Zona pace ── */}
      {zp.length > 0 && ambang && (
        <Card>
          <SectionTitle icon={<IconTimer />} title="Zona Pace"
            subtitle={`Dari pace ambang ${fmtPace(ambang)}/km, jadi zonanya ikut bergeser saat kebugaran berubah`} />
          <div className="mt-3 space-y-1.5">
            {zp.map((z) => (
              <div key={z.nama} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: z.warna }} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-white">{z.nama}</div>
                    <div className="text-[10px] text-slate-500">
                      {z.hinggaSec === Infinity ? `lebih lambat dari ${fmtPace(z.dariSec)}` : `${fmtPace(z.hinggaSec)} – ${fmtPace(z.dariSec)}`}/km
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right text-[12px] tabular-nums text-slate-300">
                  {z.sesi} sesi · {z.km} km
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Log latihan ── */}
      <Card>
        <div className="flex items-start justify-between gap-3">
          <SectionTitle icon={<IconChartUp />} title="Log Latihan" subtitle="Ringkasan per periode" />
          <div className="flex shrink-0 gap-1">
            {(['pekan', 'bulan'] as const).map((s) => (
              <button key={s} onClick={() => setSatuanLog(s)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${satuanLog === s ? 'bg-brand text-white' : 'bg-white/10 text-slate-400'}`}>
                {s === 'pekan' ? 'Pekan' : 'Bulan'}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-slate-500">
                <th className="pb-2 pr-3 font-bold">Periode</th>
                <th className="pb-2 pr-3 text-right font-bold">Sesi</th>
                <th className="pb-2 pr-3 text-right font-bold">Waktu</th>
                <th className="pb-2 pr-3 text-right font-bold">Jarak</th>
                <th className="pb-2 text-right font-bold">Upaya</th>
              </tr>
            </thead>
            <tbody>
              {log.slice(0, 12).map((b) => (
                <tr key={b.kunci} className="border-t border-white/5">
                  <td className="py-2 pr-3 font-semibold text-white">{b.label}</td>
                  <td className="py-2 pr-3 text-right tabular-nums text-slate-300">{b.sesi}</td>
                  <td className="py-2 pr-3 text-right tabular-nums text-slate-300">{b.menit} m</td>
                  <td className="py-2 pr-3 text-right tabular-nums text-slate-300">{b.km} km</td>
                  <td className="py-2 text-right tabular-nums text-slate-300">{b.upaya}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <KartuTidakDibangun />
    </div>
  )
}

function KartuTidakDibangun() {
  return (
    <Card>
      <SectionTitle icon={<IconActivity />} title="Yang tidak dibangun di sini"
        subtitle="Beserta alasannya — bukan sekadar 'belum tersedia'" />
      <div className="mt-3 space-y-2">
        {TIDAK_DIBANGUN.map((t) => (
          <div key={t.fitur} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="text-[13px] font-semibold text-slate-200">{t.fitur}</div>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-400">{t.kenapa}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

function Stat({ label, value, warna }: { label: string; value: string; warna: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-3 text-center">
      <div className="text-xl font-black tabular-nums" style={{ color: warna }}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  )
}

function Pilih({ value, onChange, opsi }: { value: string; onChange: (v: string) => void; opsi: [string, string][] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white">
      {opsi.map(([v, l]) => <option key={v} value={v} className="bg-slate-900">{l}</option>)}
    </select>
  )
}

export default AnalisisPro
