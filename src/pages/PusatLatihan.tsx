import { lazy, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { HalamanTab, type TabDef } from '../components/HalamanTab'
import { PanelAngka, NADA, type Angka } from '../components/PanelAngka'
import { KartuAngkaKlinis } from '../components/AngkaKlinis'
import { RaporRamalanKesegaran } from '../components/RaporRamalan'
import { auditKebugaran, auditKelelahan, auditKesegaran, bacaanJujur, type BahanAudit } from '../lib/auditKebugaran'
import { IconRun } from '../components/icons'
import { getWorkouts } from '../lib/workoutStore'
import { getVitals } from '../lib/healthVitals'
import { statusSingkat } from '../lib/pelatih'
import { upayaRelatif } from '../lib/analisisPro'
import { hrMaxFromAge } from '../lib/workoutImport'

// ─────────────────────────────────────────────────────────────────────────────
// Pusat Latihan — empat halaman yang selama ini terpisah, padahal semuanya
// menjawab pertanyaan yang sama: "latihan saya bagaimana".
//
//   Pelatih    — apa berikutnya, rangkuman sesi terakhir, riwayat, target, PR
//   Analisis   — kebugaran & kesegaran, upaya relatif, log, zona pace
//   Fisiologi  — beban, status, pemulihan, ambang, kesiapan
//   Endurance  — bahan bakar, keringat, FTP, panduan daya, aklimatisasi
//
// Isinya tidak ditulis ulang; tab memuat komponen halaman aslinya.
// ─────────────────────────────────────────────────────────────────────────────

const WorkoutHistory = lazy(() => import('./WorkoutHistory').then((m) => ({ default: m.WorkoutHistory })))
const AnalisisPro = lazy(() => import('./AnalisisPro').then((m) => ({ default: m.AnalisisPro })))
const TrainingPhysiology = lazy(() => import('./TrainingPhysiology').then((m) => ({ default: m.TrainingPhysiology })))
const EnduranceTools = lazy(() => import('./EnduranceTools').then((m) => ({ default: m.EnduranceTools })))

const TABS: TabDef[] = [
  { id: 'pelatih', label: 'Coach', emoji: '🏃', komponen: WorkoutHistory,
    ringkas: 'Next session, last session summary, history, targets, records' },
  { id: 'analisis', label: 'Analysis', emoji: '📈', komponen: AnalisisPro,
    ringkas: 'Fitness & freshness, relative effort, training log, pace zones' },
  { id: 'fisiologi', label: 'Physiology', emoji: '🫀', komponen: TrainingPhysiology,
    ringkas: 'Training load, status, recovery time, lactate threshold, readiness' },
  { id: 'endurance', label: 'Endurance', emoji: '⛽', komponen: EnduranceTools,
    ringkas: 'Fuelling, sweat rate, FTP, power guidance, acclimatisation' },
]

export function PusatLatihan() {
  /**
   * Angka latihan terkini, di atas seluruh tab.
   *
   * Halaman ini setinggi 6,3 layar telepon, dan yang paling sering dicari --
   * "boleh latihan keras hari ini atau tidak" -- terkubur di dalam tab
   * pertama. Ditaruh di atas supaya jawabannya terbaca sebelum menggulir.
   */
  const angka = useMemo<Angka[]>(() => {
    const w = getWorkouts()
    if (!w.length) return []
    const v = getVitals()
    const teramati = w.reduce((a, x) => Math.max(a, x.maxHr ?? 0), 0)
    const sex = (v.sex === 'F' ? 'F' : 'M') as 'M' | 'F'
    const k = {
      hrMax: Math.max(teramati, hrMaxFromAge(30, sex)),
      hrRest: typeof v.restingHr === 'number' && v.restingHr > 0 ? v.restingHr : 60,
      sex,
    }
    const st = statusSingkat(w, k)
    if (!st) return []
    const deret = Array.from({ length: 14 }, (_, i) => {
      const x = statusSingkat(w, k, Date.now() - (13 - i) * 86400_000)
      return x ? x.kesegaran : 0
    })
    return [
      { label: 'Fresh', nilai: String(Math.round(st.kesegaran)),
        nada: st.kesegaran >= -10 ? NADA.baik : NADA.perhatian, deret },
      { label: 'Fit', nilai: String(Math.round(st.kebugaran)), nada: NADA.biru },
      { label: 'Fatigue', nilai: String(Math.round(st.kelelahan)), nada: NADA.jantung },
      { label: 'Sessions', nilai: String(w.length), satuan: 'recorded', nada: NADA.netral },
    ]
  }, [])

  /**
   * Bahan untuk menjabarkan ketiga angka itu.
   *
   * Dihitung dari sumber yang SAMA PERSIS dengan angka ringkas di atas, bukan
   * dihitung ulang secara terpisah. Penjabaran yang berasal dari perhitungan
   * kedua pasti akan menyimpang dari angka yang dijabarkannya begitu salah satu
   * diubah, dan penjabaran yang tidak cocok dengan angkanya lebih buruk
   * daripada tidak ada penjabaran sama sekali.
   */
  const audit = useMemo(() => {
    const w = getWorkouts()
    if (!w.length) return null
    const v = getVitals()
    const teramati = w.reduce((a, x) => Math.max(a, x.maxHr ?? 0), 0)
    const sex = (v.sex === 'F' ? 'F' : 'M') as 'M' | 'F'
    const hrMax = Math.max(teramati, hrMaxFromAge(30, sex))
    const hrIstirahat = typeof v.restingHr === 'number' && v.restingHr > 0 ? v.restingHr : 60
    const st = statusSingkat(w, { hrMax, hrRest: hrIstirahat, sex })
    if (!st) return null

    const waktu = w.map((x) => Date.parse(x.mulai)).filter((t) => !Number.isNaN(t))
    const rentangHari = waktu.length
      ? Math.max(1, Math.round((Date.now() - Math.min(...waktu)) / 86400_000))
      : 0

    // Beban hari ini: jumlah TRIMP seluruh sesi yang mulai pada tanggal
    // kalender yang sama. Dihitung dengan fungsi yang SAMA dengan yang dipakai
    // model, bukan ditaksir ulang — penjabaran yang memakai perhitungan kedua
    // akan menyimpang dari angka yang dijabarkannya.
    const hariIni = new Date().toDateString()
    const upayaHariIni = w
      .filter((x) => new Date(Date.parse(x.mulai)).toDateString() === hariIni)
      .reduce((a, x) => a + upayaRelatif(x, { hrMax, hrRest: hrIstirahat, sex }).skor, 0)

    return {
      bahan: {
        kebugaran: st.kebugaran,
        kelelahan: st.kelelahan,
        kesegaran: st.kesegaran,
        jumlahSesi: w.length,
        rentangHari,
        hrMax,
        hrIstirahat,
        upayaHariIni,
      } satisfies BahanAudit,
      riwayat: w,
      k: { hrMax, hrRest: hrIstirahat, sex },
    }
  }, [])

  return (
    <HalamanTab
      judul="Training"
      subjudul="Coach, analysis, physiology and endurance on one page"
      ikon={<IconRun />}
      ringkasan={<PanelAngka angka={angka} />}
      tabs={TABS}
      kaki={
        <div className="space-y-3">
          {/* Penjabaran ketiga angka.
              Ada karena pertanyaan "angka ini dari mana" adalah pertanyaan yang
              sah, dan karena tidak menjawabnya membuat orang menyimpulkan
              tubuhnya bermasalah atas sesuatu yang sebenarnya sifat model. */}
          {audit && (
            <section className="space-y-3">
              <h2 className="text-[13px] font-black text-ink dark:text-white">
                Dari mana angka-angka ini
              </h2>
              {bacaanJujur(audit.bahan) && (
                <p className="rounded-2xl border-l-4 border-amber-400 bg-amber-50/70 p-3 text-[12px] leading-relaxed text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                  {bacaanJujur(audit.bahan)}
                </p>
              )}
              <KartuAngkaKlinis a={auditKesegaran(audit.bahan)} />
              <KartuAngkaKlinis a={auditKebugaran(audit.bahan)} />
              <KartuAngkaKlinis a={auditKelelahan(audit.bahan)} />
              <RaporRamalanKesegaran riwayat={audit.riwayat} k={audit.k} />
            </section>
          )}

          {/* Pintu ke alat-alat yang tidak muat dalam empat tab di atas. */}
          <Link to="/fitness-hub"
            className="flex h-11 items-center justify-center rounded-2xl border border-dashed border-white/15 text-[12px] font-bold text-neutral-500 transition hover:border-white/30 hover:text-ink">
            🔎 All other training tools
          </Link>
        </div>
      }
    />
  )
}

export default PusatLatihan
