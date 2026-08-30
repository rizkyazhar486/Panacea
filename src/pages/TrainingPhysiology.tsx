import { useEffect, useMemo, useState } from 'react'
import { Prosa } from '../components/Prosa'
import { hariIni } from '../lib/tanggal'
import { Link } from 'react-router-dom'
import { Card, SectionTitle } from '../components/ui'
import { IconHeart, IconActivity, IconTimer, IconRun } from '../components/icons'
import { getWorkouts } from '../lib/workoutStore'
import { getDemo } from '../lib/profile'
import { useVitals } from '../lib/useVitals'
import { api, backendEnabled, type SleepNight } from '../lib/api'
import {
  hitungSesi, ringkasBeban, statusLatihan, trainingEffect, waktuPemulihan,
  perkiraanLTHR, kondisiPerforma, kesiapan, saranSesiHarian, skorKetahanan,
  UNAVAILABLE, type Sesi,
} from '../lib/trainingPhysiology'

// ─────────────────────────────────────────────────────────────────────────────
// Training Physiology — padanan kelompok metrik Garmin, dari data Apple Health.
//
// Urutan halaman disengaja: kesiapan hari ini di atas (satu-satunya yang
// menuntut keputusan sekarang), lalu beban dan status, lalu ambang dan
// ketahanan yang berubah lambat, dan terakhir daftar terbuka tentang apa yang
// TIDAK bisa dihitung beserta alasannya.
// ─────────────────────────────────────────────────────────────────────────────

export function TrainingPhysiology() {
  const vitals = useVitals()
  const demo = useMemo(() => getDemo(), [])
  const [nights, setNights] = useState<SleepNight[]>([])
  const [riwayat, setHistory] = useState<{ date: string; hrvMs?: number; restingHr?: number }[]>([])

  useEffect(() => {
    if (!backendEnabled) return
    api.sleepSeries().then(setNights).catch(() => {})
    api.getHealthProfile()
      .then((r) => {
        const h = (r as { history?: { date: string; hrvMs?: number; restingHr?: number }[] })?.history
        if (Array.isArray(h)) setHistory(h)
      })
      .catch(() => {})
  }, [])

  const workouts = useMemo(() => getWorkouts(), [vitals])

  const ctx = useMemo(() => {
    const teramati = workouts.reduce((a, w) => Math.max(a, w.maxHr ?? 0), 0)
    const usia = demo.age || 30
    // Denyut tertinggi yang pernah tercatat ATAU rumus, mana yang lebih besar.
    // Memakai yang teramati saja menggeser seluruh zona ke atas bagi orang yang
    // memang belum pernah benar-benar maksimal.
    return {
      hrMax: Math.max(teramati, demo.sex === 'F' ? 226 - usia : 220 - usia),
      hrRest: vitals.restingHr || 60,
      sex: demo.sex,
      beratKg: demo.weightKg,
      vo2max: vitals.vo2max,
    }
  }, [workouts, demo, vitals])

  const sesi = useMemo<Sesi[]>(() => workouts.map((w) => ({
    id: w.id, nama: w.nama, mulai: w.mulai, durasiDetik: w.durasi,
    jarakKm: w.jarakKm, avgHr: w.avgHr, maxHr: w.maxHr, hr: w.hr,
  })), [workouts])

  const calc = useMemo(() => hitungSesi(sesi, ctx), [sesi, ctx])
  const beban = useMemo(() => ringkasBeban(calc), [calc])

  const malamTerakhir = useMemo(
    () => [...nights].sort((a, b) => b.date.localeCompare(a.date))[0],
    [nights],
  )
  /**
   * Baseline harus datang dari RIWAYAT, bukan dari nilai hari ini.
   * Membandingkan sebuah angka dengan dirinya sendiri selalu menghasilkan
   * "normal" dan membuat faktornya tampak dinilai padahal tidak — lebih buruk
   * daripada tidak menampilkannya sama sekali. Bila riwayatnya belum cukup,
   * faktor itu memang dihilangkan.
   */
  const baseline = useMemo(() => {
    const ambil = (k: 'hrvMs' | 'restingHr') => {
      const tglHariIni = hariIni()
      const v = riwayat
        .filter((r) => r.date !== tglHariIni)
        .slice(-28)
        .map((r) => r[k])
        .filter((x): x is number => typeof x === 'number' && x > 0)
      if (v.length < 5) return undefined
      // Median: satu malam buruk tidak menggeser pembandingnya.
      return [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)]
    }
    return { hrv: ambil('hrvMs'), resting: ambil('restingHr') }
  }, [riwayat])

  const terbaru = calc[0] ?? null
  const pemulihan = useMemo(
    () => waktuPemulihan(terbaru, beban.kronis, {
      tidurJam: malamTerakhir?.totalH, hrvMs: vitals.hrvMs, hrvBaseline: baseline.hrv, acwr: beban.acwr,
    }),
    [terbaru, beban, malamTerakhir, vitals, baseline],
  )
  const sisaJam = pemulihan ? Math.max(0, (Date.parse(pemulihan.selesaiPada) - Date.now()) / 3600_000) : 0

  const siap = useMemo(() => kesiapan({
    tidurJam: malamTerakhir?.totalH,
    tidurDeepJam: malamTerakhir?.deepH,
    hrvMs: vitals.hrvMs,
    hrvBaseline: baseline.hrv,
    restingHr: vitals.restingHr,
    restingBaseline: baseline.resting,
    pemulihanSisaJam: sisaJam,
    acwr: beban.acwrDapatDipercaya ? beban.acwr : null,
  }), [malamTerakhir, vitals, baseline, sisaJam, beban])

  const status = useMemo(() => statusLatihan(beban, null), [beban])
  const lthr = useMemo(() => perkiraanLTHR(calc, ctx.hrMax), [calc, ctx])
  const performa = useMemo(() => kondisiPerforma(calc), [calc])
  const ketahanan = useMemo(() => skorKetahanan(calc), [calc])
  const saran = useMemo(() => saranSesiHarian(siap, beban, sisaJam), [siap, beban, sisaJam])
  const teTerbaru = useMemo(() => (terbaru ? trainingEffect(terbaru, beban.kronis) : null), [terbaru, beban])

  if (!workouts.length) {
    return (
      <div className="space-y-4">
        <SectionTitle icon={<IconActivity />} title="Training Physiology" subtitle="Load, status, recovery and readiness" />
        <Card>
          <Prosa kelas="text-sm text-neutral-600 leading-relaxed">No training sessions stored yet. Everything on this page is computed from the heart-rate trace of each session, so there is nothing to show until sessions arrive.</Prosa>
          <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
            Turn on <strong className="text-ink">Include Workouts</strong> in Health Auto Export, then
            sync. The instructions are in{' '}
            <Link to="/health-data/tutorial" className="font-semibold text-ink underline">the sync guide</Link>.
          </p>
        </Card>

        {/* Justru orang yang belum punya data inilah yang paling perlu tahu
            bahwa banyak alat lain sudah tersedia tanpa menunggu sinkronisasi. */}
        <KartuBelumDariJam />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <SectionTitle
        icon={<IconActivity />}
        title="Training Physiology"
        subtitle={`${calc.length} sessions · HRmax used ${ctx.hrMax} bpm · resting ${ctx.hrRest} bpm`}
      />

      {/* Kesiapan — satu-satunya yang menuntut keputusan hari ini */}
      <Card>
        <SectionTitle icon={<IconHeart />} title="Readiness today" />
        <div className="mt-2 flex items-center gap-4">
          <div className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full"
            style={{ background: `conic-gradient(${siap.warna} ${siap.skor * 3.6}deg, rgba(255,255,255,0.08) 0deg)` }}>
            <div className="grid h-16 w-16 place-items-center rounded-full bg-slate-900">
              <span className="text-xl font-bold tabular-nums" style={{ color: siap.warna }}>{siap.skor}</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-semibold" style={{ color: siap.warna }}>{siap.label}</div>
            <p className="mt-1 text-sm leading-relaxed text-neutral-500">{siap.saran}</p>
          </div>
        </div>

        {siap.faktor.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {siap.faktor.map((f) => (
              <div key={f.nama} className="flex items-center gap-2 text-xs">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${f.arah === 'baik' ? 'bg-emerald-400' : f.arah === 'kurang' ? 'bg-rose-400' : 'bg-slate-500'}`} />
                <span className="min-w-0 flex-1 truncate text-neutral-600">{f.nama}</span>
                <span className="text-slate-500">{f.nilai}</span>
                <span className={`w-8 text-right tabular-nums ${f.arah === 'kurang' ? 'text-rose-300' : 'text-emerald-300'}`}>{f.bobot}</span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
          Rinciannya ditampilkan dengan sengaja: satu angka tanpa alasannya tidak bisa ditindaklanjuti.
          {(baseline.hrv == null || baseline.resting == null) && (
            <> Variabilitas denyut dan denyut istirahat baru ikut dinilai setelah ada sekitar lima hari
            riwayat — sebelum itu tidak ada pembanding, dan membandingkan angka dengan dirinya sendiri
            hanya akan menghasilkan penilaian palsu.</>
          )}
        </p>
      </Card>

      {/* Saran sesi */}
      <Card>
        <SectionTitle icon={<IconRun />} title="Suggested session today" />
        <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div className="text-sm font-semibold text-ink">{saran.judul}</div>
          <p className="mt-1 text-sm text-neutral-600 leading-relaxed">{saran.rincian}</p>
          <p className="mt-2 text-sm text-neutral-500 leading-relaxed"><span className="text-slate-500">Why: </span>{saran.alasan}</p>
        </div>
      </Card>

      {/* Pemulihan */}
      {pemulihan && (
        <Card>
          <SectionTitle icon={<IconTimer />} title="Recovery time" />
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm text-neutral-500">Remaining until ready for a hard session</span>
            <span className={`text-2xl font-semibold tabular-nums ${sisaJam > 12 ? 'text-amber-300' : 'text-emerald-300'}`}>
              {sisaJam < 1 ? 'siap' : `${Math.round(sisaJam)} jam`}
            </span>
          </div>
          <div className="mt-2 space-y-1">
            {pemulihan.dasar.map((d, i) => (
              <div key={i} className="flex gap-2 text-xs text-neutral-500"><span className="text-slate-600">·</span><span>{d}</span></div>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            This is <b>not an instruction to stop moving</b>. Walking and easy sessions are still fine and
            actually speed recovery — what this refers to is readiness for hard work.
          </p>
        </Card>
      )}

      {/* Status & beban */}
      <Card>
        <SectionTitle icon={<IconActivity />} title="Training status" />
        <div className="mt-2 rounded-lg border p-3" style={{ borderColor: `${status.warna}44`, background: `${status.warna}12` }}>
          <div className="text-base font-semibold" style={{ color: status.warna }}>{status.label}</div>
          <p className="mt-1 text-sm leading-relaxed text-neutral-600">{status.penjelasan}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-emerald-200/80">{status.saran}</p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Acute load (7d)" value={beban.akut.toFixed(0)} sub="per hari" />
          <Stat label="Chronic load (28d)" value={beban.kronis.toFixed(0)} sub="per hari" />
          <Stat label="7:28 ratio" value={beban.acwr != null ? beban.acwr.toFixed(2) : '—'} sub={beban.acwrDapatDipercaya ? 'target 0.8–1.3' : 'not yet meaningful'} />
          <Stat label="Active days" value={`${beban.hariAktif7}/7`} />
        </div>

        {beban.pctAerobikRendah != null && (
          <div className="mt-4">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Intensity distribution over 28 days</div>
            <div className="mt-1.5 flex h-3 overflow-hidden rounded-full bg-white/5">
              <div style={{ width: `${beban.pctAerobikRendah}%`, background: '#34d399' }} />
              <div style={{ width: `${beban.pctAerobikTinggi}%`, background: '#fbbf24' }} />
              <div style={{ width: `${beban.pctAnaerobik}%`, background: '#f87171' }} />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
              <span className="text-emerald-300">Mudah (Z1-2) {beban.pctAerobikRendah}%</span>
              <span className="text-amber-300">Aerobik tinggi (Z3-4) {beban.pctAerobikTinggi}%</span>
              <span className="text-rose-300">Anaerobik (Z5) {beban.pctAnaerobik}%</span>
            </div>
            {beban.pctAerobikRendah < 60 && (
              <p className="mt-2 text-sm leading-relaxed text-amber-100/90">
                Sasaran yang lazim dipakai adalah sekitar 80% waktu pada zona mudah. Punya Anda {beban.pctAerobikRendah}%.
                Ini pola yang terasa produktif namun paling sering membuat kemajuan mandek — terlalu berat untuk
                pemulihan, terlalu ringan untuk memicu adaptasi kecepatan.
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Training effect sesi terakhir */}
      {teTerbaru && terbaru && (
        <Card>
          <SectionTitle icon={<IconRun />} title="Training effect — last session"
            subtitle={new Date(terbaru.mulai).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <TeBar label="Aerobic" value={teTerbaru.aerobik} teks={teTerbaru.labelAerobik} warna="#34d399" />
            <TeBar label="Anaerobic" value={teTerbaru.anaerobik} teks={teTerbaru.labelAnaerobik} warna="#f87171" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Stat label="Session load" value={terbaru.trimp.toFixed(0)} sub="TRIMP" />
            <Stat label="Duration" value={`${Math.round(terbaru.durasiDetik / 60)}`} sub="minutes" />
            <Stat label="Average" value={terbaru.avgHr ? `${terbaru.avgHr}` : '—'} sub="bpm" />
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            Scale 0–5: 0 none · 1 minor · 2 maintaining · 3 improving · 4 highly improving · 5 overreaching.
            Judged <b>relative to your own fitness</b> — the same session is hard for a beginner and easy for
            a trained runner, so a fixed threshold would mislead.
          </p>
        </Card>
      )}

      {/* Ambang & performa */}
      <Card>
        <SectionTitle icon={<IconHeart />} title="Threshold & performance condition" />
        <div className="mt-2 space-y-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-ink">Lactate threshold heart rate (LTHR)</span>
              <span className="text-lg font-semibold tabular-nums text-ink">
                {lthr.lthr != null ? `${lthr.lthr} bpm` : '—'}
                {lthr.pctHrMax != null && <span className="ml-1 text-xs text-slate-500">{lthr.pctHrMax}% HRmax</span>}
              </span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-neutral-500">{lthr.metode}</p>
            <Prosa kelas="mt-1.5 text-sm leading-relaxed text-neutral-500">Above this threshold, fatigue accumulates far faster and performance falls away quickly. This is the line separating &quot;hard but controlled&quot; from &quot;not sustainable&quot;.</Prosa>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-ink">Performance condition</span>
              <span className={`text-lg font-semibold tabular-nums ${
                performa.nilai == null ? 'text-slate-500' : performa.nilai > 0 ? 'text-emerald-300' : performa.nilai < 0 ? 'text-amber-300' : 'text-ink'}`}>
                {performa.nilai == null ? '—' : performa.nilai > 0 ? `+${performa.nilai}` : performa.nilai}
              </span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-neutral-500">{performa.arti}</p>
            {performa.ef != null && performa.efBaseline != null && (
              <p className="mt-1.5 text-[11px] text-slate-500">
                Efisiensi sesi terakhir {performa.ef} meter per menit per denyut, dibanding kebiasaan {performa.efBaseline}.
                Efisiensi berubah lebih dahulu daripada VO2max, sehingga ia tanda kebugaran yang paling awal terlihat.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-ink">Endurance score</span>
              <span className="text-lg font-semibold tabular-nums text-ink">
                {ketahanan.skor ?? '—'}{ketahanan.skor != null && <span className="ml-1 text-xs text-slate-500">{ketahanan.label}</span>}
              </span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-neutral-500">{ketahanan.penjelasan}</p>
          </div>
        </div>
      </Card>

      {/* Dasar perhitungan */}
      <Card>
        <SectionTitle icon={<IconActivity />} title="What these numbers are built on" />
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Garmin derives load from <b>EPOC</b> estimated through Firstbeat's proprietary model, using
          second-by-second heart rate along with beat-to-beat variability. An Apple Watch does not expose data
          at that resolution, so this page <b>does not claim to compute EPOC</b>.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          What is used instead is <b>TRIMP (Banister)</b> — a heart-rate-based load measure long used in both
          the field and the literature, with exponential weighting so that a minute at high intensity counts far
          more heavily than a minute of easy work. The numbers are <b>not comparable with Garmin's</b>; what
          matters is the trend within your own data.
        </p>
        <Prosa kelas="mt-2 text-sm leading-relaxed text-neutral-500">The 7:28-day load ratio is widely used, but the evidence that it predicts injury is still contested. It is used here as a marker of change, not as a prediction.</Prosa>
      </Card>

      <KartuBelumDariJam />

    </div>
  )
}

/**
 * Daftar hal yang tidak datang dari jam tangan, beserta tautan ke tempat hal
 * itu SUDAH dibuat. Dipakai pada dua keadaan — halaman terisi maupun kosong —
 * karena pengguna yang belum punya data justru paling perlu tahu bahwa banyak
 * alat lain tidak menunggu sinkronisasi apa pun.
 */
function KartuBelumDariJam() {
  const [buka, setBuka] = useState(false)
  const tersedia = UNAVAILABLE.filter((u) => u.adaDi).length

  /*
   * DILIPAT, BUKAN DIPENDEKKAN.
   *
   * Sebelas baris ini masing-masing memuat dua paragraf, dan bersama-sama
   * menempati sekitar 3.000 px — pada tab yang BELUM PUNYA DATA, hampir
   * seluruh halaman berisi keterangan tentang apa yang TIDAK dapat dihitung.
   * Terukur di 390x844: tab fisiologi setinggi 3.599 px dengan hanya dua judul
   * di dalamnya. Akibatnya orang yang baru membuka tab ini bertemu daftar
   * batasan lebih dahulu daripada fiturnya sendiri, dan kesan pertamanya
   * adalah aplikasi yang menjelaskan ketidakmampuannya panjang lebar.
   *
   * Tidak satu kata pun dihapus — kejujuran daftar ini justru yang membuatnya
   * berharga, dan memendekkannya berarti menyembunyikan batasan. Yang berubah
   * hanya: ringkasannya terlihat lebih dahulu, isinya dibuka bila diminta.
   * Jumlah yang SUDAH ADA alatnya disebut di muka, sebab itulah bagian yang
   * berguna; daftar yang tampak seperti sebelas kekurangan sebenarnya memuat
   * sebelas alat yang menunggu dipakai.
   */
  return (
    <Card>
      <SectionTitle icon={<IconTimer />} title="What does not come from the watch"
        subtitle="That does not mean it is missing — each one stands as its own tool" />
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">
        {UNAVAILABLE.length} things <strong className="text-ink">cannot be computed from an Apple Watch export</strong> —
        which is not the same as being impossible. <strong className="text-ink">{tersedia} of them already exist</strong> as
        their own tool, each with its own input.
      </p>
      <button
        onClick={() => setBuka((v) => !v)}
        aria-expanded={buka}
        className="mt-2 flex min-h-[40px] items-center gap-1.5 text-sm font-bold text-brand"
      >
        {buka ? 'Hide the list' : `Show all ${UNAVAILABLE.length} and where each lives`}
        <span aria-hidden>{buka ? '▲' : '▼'}</span>
      </button>
      {buka && (
        <div className="mt-3 space-y-2">
          {UNAVAILABLE.map((u) => (
            <div key={u.fitur} className={`rounded-lg border p-3 ${u.adaDi ? 'border-emerald-500/25 bg-emerald-500/[0.05]' : 'border-white/10 bg-white/[0.02]'}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-ink">{u.fitur}</span>
                {u.adaDi
                  ? <Link to={u.adaDi} className="shrink-0 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">Available →</Link>
                  : <span className="shrink-0 rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-500">Not built yet</span>}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-neutral-500">{u.kenapa}</p>
              <p className="mt-1 text-[11px] text-slate-500"><span className="text-slate-600">Needs: </span>{u.syarat}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function TeBar({ label, value, teks, warna }: { label: string; value: number; teks: string; warna: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</span>
        <span className="text-lg font-semibold tabular-nums" style={{ color: warna }}>{value.toFixed(1)}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full" style={{ width: `${(value / 5) * 100}%`, background: warna }} />
      </div>
      <div className="mt-1 text-[11px] text-neutral-500">{teks}</div>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-center">
      <div className="text-base font-semibold tabular-nums text-ink">{value}</div>
      <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</div>
      {sub && <div className="text-[10px] text-slate-500">{sub}</div>}
    </div>
  )
}

export default TrainingPhysiology
