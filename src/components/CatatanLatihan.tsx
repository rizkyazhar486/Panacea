import { useEffect, useMemo, useState } from 'react'
import { kunciTanggal } from '../lib/ramalan'
import { getWorkouts } from '../lib/workoutStore'
import { catatLatihanTangan, sesiTangan } from '../lib/latihanManual'
import { TrainingAnalyticsPanel } from './TrainingAnalyticsPanel'

// ─────────────────────────────────────────────────────────────────────────────
// Catatan latihan dengan tangan — bentuknya sengaja SAMA dengan catatan harian.
//
// Dua borang yang menanyakan hal serupa dengan tata letak berbeda memaksa
// pemakainya belajar dua kali, dan yang kedua tidak pernah benar-benar
// dipelajari. Urutannya sama: pilihan tanggal di kanan judul, isian, satu
// bidang tersegmen, lalu satu tombol simpan selebar penuh.
//
// EMPAT PERTANYAAN, dan tidak lebih. Nama, lama, berat yang dirasakan, dan
// jarak bila ada. Kalori TIDAK ditanyakan maupun dihitung: ia menuntut berat
// badan dan nilai MET, sehingga hasilnya adalah taksiran di atas taksiran di
// atas lama yang dilaporkan sendiri — dan angka semacam itu tidak layak
// dipajang berdampingan dengan angka terukur.
// ─────────────────────────────────────────────────────────────────────────────

const BERAT = [
  { nilai: 2, label: 'Easy' },
  { nilai: 4, label: 'Moderate' },
  { nilai: 6, label: 'Hard' },
  { nilai: 8, label: 'Very hard' },
  { nilai: 10, label: 'All out' },
] as const

export function CatatanLatihan() {
  const [untukKemarin, setUntukKemarin] = useState(false)
  const [nama, setNama] = useState('')
  const [menit, setMenit] = useState('')
  const [rpe, setRpe] = useState<number | null>(null)
  const [jarak, setJarak] = useState('')
  const [pesan, setPesan] = useState('')
  const [versi, setVersi] = useState(0)

  useEffect(() => {
    const segarkan = () => setVersi((v) => v + 1)
    window.addEventListener('panacea:health-updated', segarkan)
    window.addEventListener('storage', segarkan)
    window.addEventListener('focus', segarkan)
    return () => {
      window.removeEventListener('panacea:health-updated', segarkan)
      window.removeEventListener('storage', segarkan)
      window.removeEventListener('focus', segarkan)
    }
  }, [])

  const tanggalAcuan = new Date()
  tanggalAcuan.setHours(12, 0, 0, 0)
  if (untukKemarin) tanggalAcuan.setDate(tanggalAcuan.getDate() - 1)
  const tanggal = kunciTanggal(tanggalAcuan)

  const ringkas = useMemo(() => {
    const w = getWorkouts()
    const detikPerTanggal = new Map<string, number>()
    const srpePerTanggal = new Map<string, number>()
    const sesiDenganRpePerTanggal = new Map<string, number>()
    const sesiBerdurasiPerTanggal = new Map<string, number>()
    for (const x of w) {
      const kunci = kunciTanggal(new Date(x.mulai))
      const aman = Number.isFinite(x.durasi) && x.durasi > 0 ? x.durasi : 0
      detikPerTanggal.set(kunci, (detikPerTanggal.get(kunci) ?? 0) + aman)

      if (aman > 0) {
        sesiBerdurasiPerTanggal.set(kunci, (sesiBerdurasiPerTanggal.get(kunci) ?? 0) + 1)
        const rpeAman = typeof x.rpe === 'number' && Number.isFinite(x.rpe) && x.rpe >= 1 && x.rpe <= 10 ? x.rpe : null
        if (rpeAman !== null) {
          srpePerTanggal.set(kunci, (srpePerTanggal.get(kunci) ?? 0) + (aman / 60) * rpeAman)
          sesiDenganRpePerTanggal.set(kunci, (sesiDenganRpePerTanggal.get(kunci) ?? 0) + 1)
        }
      }
    }

    const sesiTanggal = w
      .filter((x) => kunciTanggal(new Date(x.mulai)) === tanggal)
      .sort((a, b) => Date.parse(b.mulai) - Date.parse(a.mulai))
    const detikTanggal = detikPerTanggal.get(tanggal) ?? 0
    const terbaru = sesiTanggal[0] ?? null
    const hrValid = terbaru?.hr.filter((p) => Number.isFinite(p.bpm) && p.bpm > 0) ?? []
    const hrSpark = hrValid.length <= 24
      ? hrValid
      : Array.from({ length: 24 }, (_, i) => hrValid[Math.round((i * (hrValid.length - 1)) / 23)])
    const hrMinSpark = hrValid.length > 0 ? Math.min(...hrValid.map((p) => p.bpm)) : null
    const hrMaxSpark = hrValid.length > 0 ? Math.max(...hrValid.map((p) => p.bpm)) : null
    const terbaruRpe = terbaru && typeof terbaru.rpe === 'number' && Number.isFinite(terbaru.rpe) && terbaru.rpe >= 1 && terbaru.rpe <= 10
      ? terbaru.rpe
      : null
    const terbaruSrpe = terbaru && terbaruRpe !== null && Number.isFinite(terbaru.durasi) && terbaru.durasi > 0
      ? Math.round((terbaru.durasi / 60) * terbaruRpe)
      : null

    const recoveryValid = terbaru?.pemulihan
      .filter((p) => Number.isFinite(p.t) && p.t >= 0 && Number.isFinite(p.bpm) && p.bpm > 0)
      .sort((a, b) => a.t - b.t) ?? []
    const recoverySpark = recoveryValid.length <= 20
      ? recoveryValid
      : Array.from({ length: 20 }, (_, i) => recoveryValid[Math.round((i * (recoveryValid.length - 1)) / 19)])
    const recoveryMin = recoveryValid.length > 0 ? Math.min(...recoveryValid.map((p) => p.bpm)) : null
    const recoveryMax = recoveryValid.length > 0 ? Math.max(...recoveryValid.map((p) => p.bpm)) : null
    const recoveryNearMinute = recoveryValid.some((p) => p.t >= 45 && p.t <= 75)
    const recoveryHrr1 = recoveryNearMinute && terbaru && typeof terbaru.hrr1 === 'number' && Number.isFinite(terbaru.hrr1) && terbaru.hrr1 > 0
      ? Math.round(terbaru.hrr1)
      : null
    const recoverySpanSec = recoveryValid.length > 0 ? Math.max(0, Math.round(recoveryValid[recoveryValid.length - 1].t)) : null

    const paceSecAman = terbaru && typeof terbaru.paceSec === 'number' && Number.isFinite(terbaru.paceSec) && terbaru.paceSec > 0
      ? Math.round(terbaru.paceSec)
      : null
    const terbaruPace = paceSecAman !== null
      ? `${Math.floor(paceSecAman / 60)}:${String(paceSecAman % 60).padStart(2, '0')}`
      : null
    const terbaruSpeed = terbaru && typeof terbaru.kecepatanKmh === 'number' && Number.isFinite(terbaru.kecepatanKmh) && terbaru.kecepatanKmh > 0
      ? terbaru.kecepatanKmh
      : null
    const terbaruCadence = terbaru && typeof terbaru.kadens === 'number' && Number.isFinite(terbaru.kadens) && terbaru.kadens > 0
      ? Math.round(terbaru.kadens)
      : null
    const terbaruIndoor = terbaru && typeof terbaru.diDalamRuangan === 'boolean' ? terbaru.diDalamRuangan : null
    const punyaMovement = terbaruPace !== null || terbaruSpeed !== null || terbaruCadence !== null

    const riwayatMovement = w
      .filter((x) => {
        if (kunciTanggal(new Date(x.mulai)) > tanggal) return false
        return (
          (typeof x.paceSec === 'number' && Number.isFinite(x.paceSec) && x.paceSec > 0) ||
          (typeof x.kecepatanKmh === 'number' && Number.isFinite(x.kecepatanKmh) && x.kecepatanKmh > 0) ||
          (typeof x.kadens === 'number' && Number.isFinite(x.kadens) && x.kadens > 0)
        )
      })
      .sort((a, b) => Date.parse(b.mulai) - Date.parse(a.mulai))
      .slice(0, 5)
      .map((x) => {
        const paceDetik = typeof x.paceSec === 'number' && Number.isFinite(x.paceSec) && x.paceSec > 0 ? Math.round(x.paceSec) : null
        const pace = paceDetik !== null
          ? `${Math.floor(paceDetik / 60)}:${String(paceDetik % 60).padStart(2, '0')}`
          : null
        return {
          id: x.id,
          nama: typeof x.nama === 'string' && x.nama.trim() ? x.nama.trim() : 'Movement session',
          tanggal: new Date(x.mulai).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          menit: Number.isFinite(x.durasi) && x.durasi > 0 ? Math.round(x.durasi / 60) : null,
          jarakKm: typeof x.jarakKm === 'number' && Number.isFinite(x.jarakKm) && x.jarakKm > 0 ? x.jarakKm : null,
          pace,
          speed: typeof x.kecepatanKmh === 'number' && Number.isFinite(x.kecepatanKmh) && x.kecepatanKmh > 0 ? x.kecepatanKmh : null,
          cadence: typeof x.kadens === 'number' && Number.isFinite(x.kadens) && x.kadens > 0 ? Math.round(x.kadens) : null,
          avgHr: typeof x.avgHr === 'number' && Number.isFinite(x.avgHr) && x.avgHr > 0 ? Math.round(x.avgHr) : null,
        }
      })

    const namaAktivitas = (nilai: unknown) => typeof nilai === 'string' ? nilai.trim().replace(/\s+/g, ' ') : ''
    const movementBernama = w
      .filter((x) => {
        if (kunciTanggal(new Date(x.mulai)) > tanggal || !namaAktivitas(x.nama)) return false
        return (
          (typeof x.paceSec === 'number' && Number.isFinite(x.paceSec) && x.paceSec > 0) ||
          (typeof x.kecepatanKmh === 'number' && Number.isFinite(x.kecepatanKmh) && x.kecepatanKmh > 0) ||
          (typeof x.kadens === 'number' && Number.isFinite(x.kadens) && x.kadens > 0)
        )
      })
      .sort((a, b) => Date.parse(b.mulai) - Date.parse(a.mulai))
    const aktivitasAcuan = movementBernama[0] ?? null
    const kunciAktivitas = aktivitasAcuan ? namaAktivitas(aktivitasAcuan.nama).toLocaleLowerCase() : ''
    const labelBandingAktivitas = aktivitasAcuan ? namaAktivitas(aktivitasAcuan.nama) : ''
    const bandingAktivitas = kunciAktivitas
      ? movementBernama
          .filter((x) => namaAktivitas(x.nama).toLocaleLowerCase() === kunciAktivitas)
          .slice(0, 3)
          .map((x) => {
            const paceDetik = typeof x.paceSec === 'number' && Number.isFinite(x.paceSec) && x.paceSec > 0 ? Math.round(x.paceSec) : null
            return {
              id: x.id,
              tanggal: new Date(x.mulai).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              menit: Number.isFinite(x.durasi) && x.durasi > 0 ? Math.round(x.durasi / 60) : null,
              jarakKm: typeof x.jarakKm === 'number' && Number.isFinite(x.jarakKm) && x.jarakKm > 0 ? x.jarakKm : null,
              pace: paceDetik !== null ? `${Math.floor(paceDetik / 60)}:${String(paceDetik % 60).padStart(2, '0')}` : null,
              speed: typeof x.kecepatanKmh === 'number' && Number.isFinite(x.kecepatanKmh) && x.kecepatanKmh > 0 ? x.kecepatanKmh : null,
              cadence: typeof x.kadens === 'number' && Number.isFinite(x.kadens) && x.kadens > 0 ? Math.round(x.kadens) : null,
              avgHr: typeof x.avgHr === 'number' && Number.isFinite(x.avgHr) && x.avgHr > 0 ? Math.round(x.avgHr) : null,
              indoor: typeof x.diDalamRuangan === 'boolean' ? x.diDalamRuangan : null,
            }
          })
      : []

    const acuan = new Date(tanggalAcuan)

    const tren = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(acuan)
      d.setDate(acuan.getDate() - (6 - i))
      const kunci = kunciTanggal(d)
      return {
        kunci,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        menit: Math.round((detikPerTanggal.get(kunci) ?? 0) / 60),
      }
    })
    const maxMenit7 = Math.max(1, ...tren.map((x) => x.menit))

    const blok28 = Array.from({ length: 4 }, (_, i) => {
      const mulaiOffset = 27 - i * 7
      const akhirOffset = 21 - i * 7
      let detikBlok = 0
      let hariAktif = 0
      let srpeBlok = 0
      let sesiDenganRpe = 0
      let sesiBerdurasi = 0
      let awal = ''
      let akhir = ''

      for (let offset = mulaiOffset; offset >= akhirOffset; offset -= 1) {
        const d = new Date(acuan)
        d.setDate(acuan.getDate() - offset)
        const kunci = kunciTanggal(d)
        const detikHari = detikPerTanggal.get(kunci) ?? 0
        detikBlok += detikHari
        if (detikHari > 0) hariAktif += 1
        srpeBlok += srpePerTanggal.get(kunci) ?? 0
        sesiDenganRpe += sesiDenganRpePerTanggal.get(kunci) ?? 0
        sesiBerdurasi += sesiBerdurasiPerTanggal.get(kunci) ?? 0
        if (offset === mulaiOffset) awal = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        if (offset === akhirOffset) akhir = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }

      return {
        label: `${awal}–${akhir}`,
        menit: Math.round(detikBlok / 60),
        hariAktif,
        srpe: Math.round(srpeBlok),
        sesiDenganRpe,
        sesiBerdurasi,
      }
    })
    const maxMenit28 = Math.max(1, ...blok28.map((x) => x.menit))
    const maxSrpe28 = Math.max(1, ...blok28.map((x) => x.srpe))

    return {
      total: w.length,
      tangan: w.filter((x) => sesiTangan(x.id)).length,
      hari: sesiTanggal.length,
      menit: Math.round(detikTanggal / 60),
      terbaru,
      terbaruHr: hrSpark,
      hrMinSpark,
      hrMaxSpark,
      terbaruRpe,
      terbaruSrpe,
      recoveryHr: recoverySpark,
      recoveryMin,
      recoveryMax,
      recoveryHrr1,
      recoverySpanSec,
      terbaruPace,
      terbaruSpeed,
      terbaruCadence,
      terbaruIndoor,
      punyaMovement,
      riwayatMovement,
      labelBandingAktivitas,
      bandingAktivitas,
      tren,
      maxMenit7,
      hariAktif7: tren.filter((x) => x.menit > 0).length,
      blok28,
      maxMenit28,
      maxSrpe28,
      menit28: blok28.reduce((total, x) => total + x.menit, 0),
      hariAktif28: blok28.reduce((total, x) => total + x.hariAktif, 0),
      srpe28: blok28.reduce((total, x) => total + x.srpe, 0),
      sesiDenganRpe28: blok28.reduce((total, x) => total + x.sesiDenganRpe, 0),
      sesiBerdurasi28: blok28.reduce((total, x) => total + x.sesiBerdurasi, 0),
    }
    // versi ikut menjadi kebergantungan supaya daftarnya dibaca ulang setelah
    // satu sesi disimpan/import — tanpa itu ringkasannya tertinggal satu langkah.
  }, [versi, tanggal, untukKemarin])

  const bolehSimpan = menit.trim() !== '' && rpe !== null

  function simpan() {
    if (!bolehSimpan) return
    const hasil = catatLatihanTangan({
      nama,
      tanggal,
      menit: Number(menit.replace(',', '.')),
      rpe: rpe as number,
      jarakKm: jarak.trim() ? Number(jarak.replace(',', '.')) : undefined,
    })
    if (!hasil) { setPesan('Lama sesi belum masuk akal — isi dalam menit.'); return }
    setPesan(`Saved for ${tanggal}.`)
    setNama(''); setMenit(''); setRpe(null); setJarak('')
  }

  return (
    <section className="kaca rounded-3xl p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="t-sedang font-black text-ink dark:text-white">{untukKemarin ? "Yesterday's training" : "Today's training"}</h2>
        <button
          type="button"
          onClick={() => { setUntukKemarin((v) => !v); setPesan('') }}
          aria-pressed={untukKemarin}
          className={`t-mikro min-h-[40px] shrink-0 rounded-full px-3 font-bold transition ${
            untukKemarin ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'
          }`}
        >
          {untukKemarin ? 'for yesterday' : 'for yesterday?'}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2" aria-label={`Training logged for ${tanggal}`}>
        <div className="rounded-2xl bg-neutral-100/80 p-3 dark:bg-white/10">
          <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Sessions</div>
          <div className="mt-1 text-xl font-black tabular-nums text-ink dark:text-white">{ringkas.hari}</div>
        </div>
        <div className="rounded-2xl bg-neutral-100/80 p-3 dark:bg-white/10">
          <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Logged time</div>
          <div className="mt-1 text-xl font-black tabular-nums text-ink dark:text-white">{ringkas.menit}<span className="ml-1 text-xs font-bold text-neutral-500">min</span></div>
        </div>
      </div>

      <p className="t-kecil mt-2 leading-snug text-neutral-600 dark:text-neutral-300">
        {ringkas.hari === 0
          ? `No training logged ${untukKemarin ? 'yesterday' : 'today'} yet.`
          : `${ringkas.hari} session${ringkas.hari === 1 ? '' : 's'} logged ${untukKemarin ? 'yesterday' : 'today'} across ${ringkas.menit} minute${ringkas.menit === 1 ? '' : 's'}.`}
      </p>
      {ringkas.total > 0 && (
        <p className="t-mikro mt-1 text-neutral-500 dark:text-neutral-400">
          {ringkas.total} session${ringkas.total === 1 ? '' : 's'} saved overall{ringkas.tangan ? ` · ${ringkas.tangan} entered by hand` : ''}.
        </p>
      )}

      {ringkas.terbaru && (
        <div className="mt-3 rounded-2xl border border-neutral-100 p-3 dark:border-white/10" aria-label="Latest training session recorded and perceived signals">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Latest session signals</div>
              <div className="mt-1 truncate text-sm font-black text-ink dark:text-white">
                {typeof ringkas.terbaru.nama === 'string' && ringkas.terbaru.nama.trim() ? ringkas.terbaru.nama.trim() : 'Training session'}
              </div>
            </div>
            <div className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-black text-brand-dark">Recorded vs felt</div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-sky-50/70 p-3 dark:bg-sky-400/[0.05]">
              <div className="text-[10px] font-black uppercase tracking-wide text-sky-700 dark:text-sky-300">Recorded</div>
              <div className="mt-1 text-lg font-black tabular-nums text-ink dark:text-white">
                {Number.isFinite(ringkas.terbaru.durasi) && ringkas.terbaru.durasi > 0 ? `${Math.round(ringkas.terbaru.durasi / 60)} min` : '—'}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[9px] font-semibold text-neutral-500">
                {Number.isFinite(ringkas.terbaru.jarakKm) && (ringkas.terbaru.jarakKm ?? 0) > 0 && <span>{ringkas.terbaru.jarakKm?.toFixed(1)} km</span>}
                {Number.isFinite(ringkas.terbaru.avgHr) && (ringkas.terbaru.avgHr ?? 0) > 0 && <span>Avg {Math.round(ringkas.terbaru.avgHr ?? 0)} bpm</span>}
                {Number.isFinite(ringkas.terbaru.maxHr) && (ringkas.terbaru.maxHr ?? 0) > 0 && <span>Max {Math.round(ringkas.terbaru.maxHr ?? 0)} bpm</span>}
              </div>
              {ringkas.terbaruHr.length > 1 && ringkas.hrMinSpark !== null && ringkas.hrMaxSpark !== null ? (
                <div className="mt-3">
                  <div className="flex h-11 items-end gap-px overflow-hidden rounded-lg bg-white/70 px-1.5 pt-1 dark:bg-white/5" aria-label={`Heart rate series from ${Math.round(ringkas.hrMinSpark)} to ${Math.round(ringkas.hrMaxSpark)} beats per minute`}>
                    {ringkas.terbaruHr.map((p, i) => {
                      const rentang = Math.max(1, ringkas.hrMaxSpark! - ringkas.hrMinSpark!)
                      const tinggi = 20 + ((p.bpm - ringkas.hrMinSpark!) / rentang) * 80
                      return <div key={`${p.t}-${i}`} className="min-w-0 flex-1 rounded-t-sm bg-sky-500/75" style={{ height: `${tinggi}%` }} />
                    })}
                  </div>
                  <div className="mt-1 flex justify-between text-[8px] font-bold tabular-nums text-neutral-500">
                    <span>{Math.round(ringkas.hrMinSpark)} bpm</span>
                    <span>{Math.round(ringkas.hrMaxSpark)} bpm</span>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-[9px] leading-relaxed text-neutral-500">No HR time-series captured for this session.</p>
              )}
            </div>

            <div className="rounded-2xl bg-amber-50/70 p-3 dark:bg-amber-400/[0.05]">
              <div className="text-[10px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-300">Perceived</div>
              <div className="mt-1 text-lg font-black tabular-nums text-ink dark:text-white">
                {ringkas.terbaruRpe !== null ? `RPE ${ringkas.terbaruRpe}/10` : 'No RPE'}
              </div>
              <div className="mt-1 text-[9px] font-semibold text-neutral-500">
                {ringkas.terbaruSrpe !== null ? `${ringkas.terbaruSrpe} AU session-RPE load` : 'Perceived load unavailable'}
              </div>
              <div className="mt-3 flex h-11 items-end rounded-lg bg-white/70 p-1.5 dark:bg-white/5">
                <div
                  className="w-full rounded-md bg-amber-500/75"
                  style={{ height: ringkas.terbaruRpe !== null ? `${Math.max(10, ringkas.terbaruRpe * 10)}%` : '0%' }}
                  aria-label={ringkas.terbaruRpe !== null ? `Perceived exertion ${ringkas.terbaruRpe} out of 10` : 'No perceived exertion rating'}
                />
              </div>
              <p className="mt-2 text-[9px] leading-relaxed text-neutral-500">RPE is self-reported effort, not a physiological measurement.</p>
            </div>
          </div>

          {ringkas.recoveryHr.length > 1 && ringkas.recoveryMin !== null && ringkas.recoveryMax !== null && (
            <div className="mt-2 rounded-2xl bg-indigo-50/70 p-3 dark:bg-indigo-400/[0.05]" aria-label="Recorded post-exercise heart-rate recovery trace">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Post-exercise recovery</div>
                  <div className="mt-0.5 text-sm font-black text-ink dark:text-white">Recorded HR trace</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black tabular-nums text-indigo-700 dark:text-indigo-300">
                    {ringkas.recoveryHrr1 !== null ? `−${ringkas.recoveryHrr1}` : ringkas.recoverySpanSec !== null ? `${ringkas.recoverySpanSec}s` : '—'}
                    <span className="ml-1 text-xs text-neutral-500">{ringkas.recoveryHrr1 !== null ? 'bpm' : 'trace'}</span>
                  </div>
                  <div className="t-mikro text-neutral-500">{ringkas.recoveryHrr1 !== null ? '≈1-min drop' : 'recorded span'}</div>
                </div>
              </div>
              <div className="mt-3 flex h-14 items-end gap-px overflow-hidden rounded-lg bg-white/70 px-1.5 pt-1 dark:bg-white/5">
                {ringkas.recoveryHr.map((p, i) => {
                  const rentang = Math.max(1, ringkas.recoveryMax! - ringkas.recoveryMin!)
                  const tinggi = 20 + ((p.bpm - ringkas.recoveryMin!) / rentang) * 80
                  return <div key={`${p.t}-${i}`} className="min-w-0 flex-1 rounded-t-sm bg-indigo-500/75" style={{ height: `${tinggi}%` }} />
                })}
              </div>
              <div className="mt-1 flex justify-between text-[8px] font-bold tabular-nums text-neutral-500">
                <span>{Math.round(ringkas.recoveryHr[0].bpm)} bpm · +{Math.max(0, Math.round(ringkas.recoveryHr[0].t))}s</span>
                <span>{Math.round(ringkas.recoveryHr[ringkas.recoveryHr.length - 1].bpm)} bpm · +{Math.max(0, Math.round(ringkas.recoveryHr[ringkas.recoveryHr.length - 1].t))}s</span>
              </div>
              <p className="mt-2 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                This is the recorded post-exercise heart-rate trajectory. The ≈1-minute drop is shown only when a recovery sample exists around 45–75 seconds; posture and active vs passive cool-down can change the value, so no fitness or clinical grade is inferred here.
              </p>
            </div>
          )}

          {ringkas.punyaMovement && (
            <div className="mt-2 rounded-2xl bg-emerald-50/70 p-3 dark:bg-emerald-400/[0.05]" aria-label="Latest session movement metrics">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Movement</div>
                  <div className="mt-0.5 text-sm font-black text-ink dark:text-white">Pace · speed · cadence</div>
                </div>
                {ringkas.terbaruIndoor !== null && (
                  <div className="rounded-full bg-white/80 px-2.5 py-1 text-[9px] font-black text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
                    {ringkas.terbaruIndoor ? 'Indoor' : 'Outdoor'}
                  </div>
                )}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                <div className="rounded-xl bg-white/75 p-2.5 dark:bg-white/5">
                  <div className="text-[8px] font-black uppercase tracking-wide text-neutral-500">Pace</div>
                  <div className="mt-1 truncate text-sm font-black tabular-nums text-ink dark:text-white">
                    {ringkas.terbaruPace !== null ? ringkas.terbaruPace : '—'}
                  </div>
                  <div className="mt-0.5 text-[8px] font-semibold text-neutral-500">min/km</div>
                </div>
                <div className="rounded-xl bg-white/75 p-2.5 dark:bg-white/5">
                  <div className="text-[8px] font-black uppercase tracking-wide text-neutral-500">Speed</div>
                  <div className="mt-1 truncate text-sm font-black tabular-nums text-ink dark:text-white">
                    {ringkas.terbaruSpeed !== null ? ringkas.terbaruSpeed.toFixed(1) : '—'}
                  </div>
                  <div className="mt-0.5 text-[8px] font-semibold text-neutral-500">km/h</div>
                </div>
                <div className="rounded-xl bg-white/75 p-2.5 dark:bg-white/5">
                  <div className="text-[8px] font-black uppercase tracking-wide text-neutral-500">Cadence</div>
                  <div className="mt-1 truncate text-sm font-black tabular-nums text-ink dark:text-white">
                    {ringkas.terbaruCadence !== null ? ringkas.terbaruCadence : '—'}
                  </div>
                  <div className="mt-0.5 text-[8px] font-semibold text-neutral-500">steps/min</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1" aria-hidden="true">
                <div className="h-1.5 flex-1 rounded-full bg-emerald-200/90 dark:bg-emerald-300/20" />
                <div className="h-2.5 w-2.5 rounded-full border-2 border-emerald-500 bg-white dark:bg-neutral-900" />
                <div className="h-1.5 flex-1 rounded-full bg-emerald-400/80 dark:bg-emerald-300/35" />
              </div>
              <p className="mt-2 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                Values come from imported session fields. Pace and speed can represent the same underlying distance-time data, and the importer may derive them when direct speed is absent. Cadence is shown only when captured; no efficiency score or target range is inferred.
              </p>
            </div>
          )}

          <p className="mt-2 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            Recorded and perceived signals are shown side by side but are not merged into a readiness, recovery, or injury-risk score.
          </p>
        </div>
      )}

      {ringkas.riwayatMovement.length > 1 && (
        <div className="mt-3 rounded-2xl border border-emerald-100/80 p-3 dark:border-emerald-400/15" aria-label="Recent movement session history">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Recent movement sessions</div>
              <div className="mt-0.5 text-sm font-black text-ink dark:text-white">Recorded timeline</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-black tabular-nums text-emerald-700 dark:text-emerald-300">{ringkas.riwayatMovement.length}</div>
              <div className="t-mikro text-neutral-500">latest shown</div>
            </div>
          </div>

          <div className="mt-3 space-y-0">
            {ringkas.riwayatMovement.map((sesi, i) => (
              <div key={sesi.id} className="grid grid-cols-[16px_1fr] gap-2">
                <div className="flex flex-col items-center" aria-hidden="true">
                  <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-emerald-500 bg-white dark:bg-neutral-900" />
                  {i < ringkas.riwayatMovement.length - 1 && <div className="min-h-8 w-px flex-1 bg-emerald-200 dark:bg-emerald-300/20" />}
                </div>
                <div className={`${i < ringkas.riwayatMovement.length - 1 ? 'pb-3' : ''} min-w-0`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="truncate text-xs font-black text-ink dark:text-white">{sesi.nama}</div>
                    <div className="shrink-0 text-[9px] font-bold text-neutral-500">{sesi.tanggal}</div>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5 text-[9px] font-bold tabular-nums">
                    {sesi.menit !== null && <span className="rounded-full bg-neutral-100 px-2 py-1 text-neutral-600 dark:bg-white/10 dark:text-neutral-300">{sesi.menit} min</span>}
                    {sesi.jarakKm !== null && <span className="rounded-full bg-neutral-100 px-2 py-1 text-neutral-600 dark:bg-white/10 dark:text-neutral-300">{sesi.jarakKm.toFixed(1)} km</span>}
                    {sesi.pace !== null && <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">{sesi.pace}/km</span>}
                    {sesi.pace === null && sesi.speed !== null && <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">{sesi.speed.toFixed(1)} km/h</span>}
                    {sesi.cadence !== null && <span className="rounded-full bg-sky-50 px-2 py-1 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300">{sesi.cadence} spm</span>}
                    {sesi.avgHr !== null && <span className="rounded-full bg-rose-50 px-2 py-1 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">Avg {sesi.avgHr} bpm</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-2 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            Sessions are listed newest to oldest up to the selected date. Metrics stay session-specific: this timeline does not rank mixed activities or turn pace, cadence, heart rate, distance, and duration into a single performance score.
          </p>
        </div>
      )}

      {ringkas.bandingAktivitas.length > 1 && (
        <div className="mt-3 rounded-2xl border border-sky-100/80 p-3 dark:border-sky-400/15" aria-label={`Same activity comparison for ${ringkas.labelBandingAktivitas}`}>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Same activity</div>
              <div className="mt-0.5 truncate text-sm font-black text-ink dark:text-white">{ringkas.labelBandingAktivitas}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-black tabular-nums text-sky-700 dark:text-sky-300">{ringkas.bandingAktivitas.length}</div>
              <div className="t-mikro text-neutral-500">recent sessions</div>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {ringkas.bandingAktivitas.map((sesi) => (
              <div key={sesi.id} className="rounded-xl bg-neutral-50/80 p-2.5 dark:bg-white/[0.04]">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[10px] font-black text-ink dark:text-white">{sesi.tanggal}</div>
                  {sesi.indoor !== null && <div className="text-[8px] font-bold uppercase tracking-wide text-neutral-500">{sesi.indoor ? 'Indoor' : 'Outdoor'}</div>}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <div className="rounded-lg bg-white/90 p-2 dark:bg-white/5">
                    <div className="text-[8px] font-bold uppercase tracking-wide text-neutral-500">Pace / speed</div>
                    <div className="mt-0.5 text-xs font-black tabular-nums text-ink dark:text-white">
                      {sesi.pace !== null ? `${sesi.pace}/km` : sesi.speed !== null ? `${sesi.speed.toFixed(1)} km/h` : '—'}
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/90 p-2 dark:bg-white/5">
                    <div className="text-[8px] font-bold uppercase tracking-wide text-neutral-500">Cadence</div>
                    <div className="mt-0.5 text-xs font-black tabular-nums text-ink dark:text-white">{sesi.cadence !== null ? `${sesi.cadence} spm` : '—'}</div>
                  </div>
                  <div className="rounded-lg bg-white/90 p-2 dark:bg-white/5">
                    <div className="text-[8px] font-bold uppercase tracking-wide text-neutral-500">Avg HR</div>
                    <div className="mt-0.5 text-xs font-black tabular-nums text-ink dark:text-white">{sesi.avgHr !== null ? `${sesi.avgHr} bpm` : '—'}</div>
                  </div>
                  <div className="rounded-lg bg-white/90 p-2 dark:bg-white/5">
                    <div className="text-[8px] font-bold uppercase tracking-wide text-neutral-500">Session</div>
                    <div className="mt-0.5 text-xs font-black tabular-nums text-ink dark:text-white">{sesi.menit !== null ? `${sesi.menit} min` : '—'}</div>
                    {sesi.jarakKm !== null && <div className="mt-0.5 text-[8px] font-semibold tabular-nums text-neutral-500">{sesi.jarakKm.toFixed(1)} km</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-2 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            Only sessions with the same normalized activity name are grouped. Route, duration, environment, and session purpose can still differ, so values are shown without ranking or causal interpretation.
          </p>
        </div>
      )}

      <TrainingAnalyticsPanel untukKemarin={untukKemarin} versi={versi} />

      <div className="mt-3 rounded-2xl border border-neutral-100 p-3 dark:border-white/10" aria-label="Training minutes over the last 7 days">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Last 7 days</div>
            <div className="mt-0.5 text-sm font-black text-ink dark:text-white">Training minutes</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-black tabular-nums text-brand-dark">{ringkas.hariAktif7}<span className="text-xs text-neutral-500">/7</span></div>
            <div className="t-mikro text-neutral-500">active days</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {ringkas.tren.map((d) => (
            <div key={d.kunci} className="min-w-0 text-center" aria-label={`${d.kunci}: ${d.menit} training minutes`}>
              <div className="flex h-16 items-end overflow-hidden rounded-lg bg-neutral-100 dark:bg-white/5">
                <div
                  className="w-full rounded-t-lg bg-brand/80"
                  style={{ height: d.menit > 0 ? `${Math.max(4, (d.menit / ringkas.maxMenit7) * 100)}%` : '0%' }}
                />
              </div>
              <div className="mt-1 truncate text-[9px] font-bold text-neutral-500">{d.label}</div>
              <div className="text-[9px] font-black tabular-nums text-ink dark:text-white">{d.menit || '—'}</div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          Bar height is relative to your busiest logged day in this 7-day window. It shows recorded duration, not training quality or recovery.
        </p>
      </div>

      <div className="mt-3 rounded-2xl border border-neutral-100 p-3 dark:border-white/10" aria-label="Training duration across four consecutive 7-day blocks">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Last 28 days</div>
            <div className="mt-0.5 text-sm font-black text-ink dark:text-white">Duration rhythm</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-black tabular-nums text-brand-dark">{ringkas.menit28}<span className="ml-1 text-xs text-neutral-500">min</span></div>
            <div className="t-mikro text-neutral-500">{ringkas.hariAktif28} active days</div>
          </div>
        </div>
        <div className="mt-3 space-y-2.5">
          {ringkas.blok28.map((blok) => (
            <div key={blok.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-[10px]">
                <span className="font-bold text-neutral-500">{blok.label}</span>
                <span className="font-black tabular-nums text-ink dark:text-white">{blok.menit} min · {blok.hariAktif}/7 days</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/5">
                <div
                  className="h-full rounded-full bg-brand/80"
                  style={{ width: blok.menit > 0 ? `${Math.max(3, (blok.menit / ringkas.maxMenit28) * 100)}%` : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          Each row is one consecutive 7-day block, oldest to newest. Bar length compares recorded duration within this 28-day window; active days show frequency, not adherence quality.
        </p>
      </div>

      {ringkas.sesiDenganRpe28 > 0 && (
        <div className="mt-3 rounded-2xl border border-amber-200/70 bg-amber-50/40 p-3 dark:border-amber-400/15 dark:bg-amber-400/[0.03]" aria-label="Session RPE training load across four consecutive 7-day blocks">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="t-mikro font-bold uppercase tracking-wide text-neutral-500">Perceived load</div>
              <div className="mt-0.5 text-sm font-black text-ink dark:text-white">Session-RPE × duration</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-black tabular-nums text-amber-700 dark:text-amber-300">{ringkas.srpe28}<span className="ml-1 text-xs text-neutral-500">AU</span></div>
              <div className="t-mikro text-neutral-500">{ringkas.sesiDenganRpe28}/{ringkas.sesiBerdurasi28} rated sessions</div>
            </div>
          </div>
          <div className="mt-3 space-y-2.5">
            {ringkas.blok28.map((blok) => (
              <div key={blok.label} aria-label={`${blok.label}: ${blok.srpe} arbitrary units from ${blok.sesiDenganRpe} rated of ${blok.sesiBerdurasi} duration-valid sessions`}>
                <div className="mb-1 flex items-center justify-between gap-3 text-[10px]">
                  <span className="font-bold text-neutral-500">{blok.label}</span>
                  <span className="font-black tabular-nums text-ink dark:text-white">{blok.srpe} AU · {blok.sesiDenganRpe}/{blok.sesiBerdurasi} rated</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-amber-100/80 dark:bg-amber-200/10">
                  <div
                    className="h-full rounded-full bg-amber-500/80"
                    style={{ width: blok.srpe > 0 ? `${Math.max(3, (blok.srpe / ringkas.maxSrpe28) * 100)}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[9px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            sRPE load = session RPE (1–10) × duration in minutes; AU means arbitrary units. Sessions without a valid RPE are excluded, so compare blocks only when rating coverage is similar. This is perceived training load, not a recovery or injury-risk score.
          </p>
        </div>
      )}

      <div className="mt-3 space-y-3">
        <div>
          <label htmlFor="cl-nama" className="t-mikro mb-1 block font-bold uppercase tracking-wide text-neutral-500">
            What did you do
          </label>
          <input
            id="cl-nama"
            value={nama}
            onChange={(e) => { setNama(e.target.value.slice(0, 40)); setPesan('') }}
            placeholder="Run, football, weights…"
            className="t-sedang h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-fluid">
          <div>
            <label htmlFor="cl-menit" className="t-mikro mb-1 block font-bold uppercase tracking-wide text-neutral-500">
              Duration (minutes)
            </label>
            <input
              id="cl-menit"
              value={menit}
              onChange={(e) => { setMenit(e.target.value.replace(/[^\d]/g, '').slice(0, 4)); setPesan('') }}
              inputMode="numeric"
              placeholder="45"
              className="t-sedang h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 font-bold text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="cl-jarak" className="t-mikro mb-1 block font-bold uppercase tracking-wide text-neutral-500">
              Distance (km, optional)
            </label>
            <input
              id="cl-jarak"
              value={jarak}
              onChange={(e) => { setJarak(e.target.value.replace(/[^\d.,]/g, '').slice(0, 6)); setPesan('') }}
              inputMode="decimal"
              placeholder="5.2"
              className="t-sedang h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 font-bold text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
        </div>

        <div>
          <div className="t-mikro mb-1 font-bold uppercase tracking-wide text-neutral-500">How hard it felt</div>
          <div className="grid grid-cols-5 gap-0 rounded-xl bg-neutral-100 p-1 dark:bg-white/10">
            {BERAT.map((b) => (
              <button
                key={b.nilai}
                type="button"
                onClick={() => { setRpe(rpe === b.nilai ? null : b.nilai); setPesan('') }}
                aria-pressed={rpe === b.nilai}
                className={`t-kecil min-h-[40px] min-w-0 rounded-lg text-center font-bold transition ${
                  rpe === b.nilai ? 'bg-brand text-white' : 'text-neutral-600 dark:text-neutral-300'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={simpan}
          disabled={!bolehSimpan}
          className="t-sedang flex min-h-[44px] w-full items-center justify-center rounded-xl bg-brand font-black text-white transition disabled:opacity-40"
        >
          Save {untukKemarin ? "yesterday's" : "today's"} session
        </button>

        {pesan && <p className="t-kecil text-center text-brand-dark">{pesan}</p>}
      </div>
    </section>
  )
}

export default CatatanLatihan