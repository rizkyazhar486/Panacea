import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconRun, IconActivity, IconHeart } from '../components/icons'
import { useVitals } from '../lib/useVitals'
import {
  buildGaitSections, highlights, coverage, fmtPaceSec, paceFromSpeed, DISCLAIMER,
  type Band, type Reading,
} from '../lib/gaitAnalysis'

// ─────────────────────────────────────────────────────────────────────────────
// Movement Analysis — kualitas berjalan, bentuk lari, pemulihan, dan paparan.
//
// Halaman ini tidak meminta data baru apa pun. Seluruh isinya berasal dari
// metrik yang SELAMA INI sudah ikut terkirim pada tiap sinkronisasi Apple
// Health namun tidak pernah dipetakan, sehingga tidak pernah tampil di layar.
// ─────────────────────────────────────────────────────────────────────────────

const BAND_STYLE: Record<Band, { chip: string; dot: string; label: string }> = {
  baik: { chip: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300', dot: 'bg-emerald-400', label: 'Baik' },
  sedang: { chip: 'bg-amber-500/10 border-amber-500/30 text-amber-300', dot: 'bg-amber-400', label: 'Sedang' },
  perhatian: { chip: 'bg-rose-500/10 border-rose-500/30 text-rose-300', dot: 'bg-rose-400', label: 'Perhatian' },
  takTersedia: { chip: 'bg-white/5 border-white/10 text-slate-500', dot: 'bg-slate-600', label: 'Belum ada data' },
}

export function GaitAnalysis() {
  const vitals = useVitals()
  const sections = useMemo(() => buildGaitSections(vitals), [vitals])
  const sorot = useMemo(() => highlights(sections), [sections])
  const cov = useMemo(() => coverage(sections), [sections])
  const pace = paceFromSpeed(vitals.runningSpeedKmh)

  return (
    <div className="space-y-4">
      <SectionTitle
        icon={<IconRun />}
        title="Movement Analysis"
        subtitle="Mutu langkah, bentuk lari, dan pemulihan — dari data jam tangan yang selama ini tidak terbaca"
      />

      <Card>
        <p className="text-sm text-neutral-600 leading-relaxed">
          Jumlah langkah hanya mengatakan <strong className="text-ink">seberapa banyak</strong> Anda bergerak.
          Angka di halaman ini mengatakan <strong className="text-ink">sebaik apa</strong> Anda bergerak — dan
          ketimpangan langkah maupun fase tumpuan yang memanjang sering menjadi petunjuk paling awal adanya
          kompensasi akibat nyeri, kelemahan sesisi, maupun postur yang sudah lama menyimpang.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge>{cov.terisi} dari {cov.total} metrik terisi</Badge>
          {vitals.source && <Badge>{vitals.source}</Badge>}
          {vitals.measuredAt && (
            <span className="text-xs text-slate-500">
              terakhir {new Date(vitals.measuredAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>
        {cov.terisi === 0 && (
          <p className="text-sm text-amber-200/90 mt-3 leading-relaxed">
            Belum ada data sama sekali. Unggah berkas ekspor Anda di{' '}
            <Link to="/health-data" className="font-semibold underline">Health Data</Link>{' '}
            — semua angka di bawah terisi dari berkas yang sama, tanpa perlu memasukkan apa pun secara manual.
          </p>
        )}
      </Card>

      {sorot.length > 0 && (
        <Card>
          <SectionTitle icon={<IconHeart />} title="Yang paling layak Anda perhatikan" subtitle="Diurutkan menurut seberapa jauh masing-masing keluar dari rentang rujukannya" />
          <div className="space-y-2 mt-2">
            {sorot.map((r) => (
              <div key={r.key} className="rounded-lg border border-rose-500/25 bg-rose-500/[0.07] p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold text-ink text-sm">{r.label}</span>
                  <span className="text-lg font-semibold text-rose-200 tabular-nums">{r.tampil}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{r.rujukan}</div>
                <p className="text-sm text-neutral-600 mt-1.5 leading-relaxed">{r.arti}</p>
                {r.langkah && (
                  <p className="text-sm text-emerald-200/90 mt-1.5 leading-relaxed">
                    <span className="text-emerald-500/80">Yang bisa dilakukan: </span>{r.langkah}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {pace != null && (
        <Card>
          <SectionTitle icon={<IconActivity />} title="Last run summary" />
          <div className="grid grid-cols-3 gap-2 mt-2">
            <Stat label="Pace" value={`${fmtPaceSec(pace)}/km`} />
            <Stat label="Kecepatan" value={`${(vitals.runningSpeedKmh ?? 0).toFixed(1)} km/j`} />
            <Stat label="VO₂max" value={vitals.vo2max ? String(vitals.vo2max) : '—'} />
          </div>
          <p className="text-sm text-neutral-500 mt-3 leading-relaxed">
            Dari sini, pace latihan untuk tiap jenis lari bisa dihitung di{' '}
            <Link to="/latihan-dasar" className="font-semibold text-ink underline">Foundation Training</Link>.
          </p>
        </Card>
      )}

      {sections.map((s) => (
        <Card key={s.key}>
          <SectionTitle title={`${s.ikon} ${s.judul}`} />
          <p className="text-sm text-neutral-500 mt-1 leading-relaxed">{s.pengantar}</p>
          <div className="space-y-2 mt-3">
            {s.readings.map((r) => <ReadingRow key={r.key} r={r} />)}
          </div>
        </Card>
      ))}

      <Card>
        <SectionTitle icon={<IconHeart />} title="Limits worth knowing" />
        <p className="text-sm text-neutral-500 mt-2 leading-relaxed">{DISCLAIMER}</p>
      </Card>
    </div>
  )
}

function ReadingRow({ r }: { r: Reading }) {
  const st = BAND_STYLE[r.band]
  return (
    <div className={`rounded-lg border p-3 ${r.band === 'takTersedia' ? 'border-white/10 bg-white/[0.02]' : 'border-white/10 bg-white/[0.03]'}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="flex items-center gap-2 min-w-0">
          <span className={`h-2 w-2 rounded-full shrink-0 ${st.dot}`} />
          <span className="font-semibold text-ink text-sm">{r.label}</span>
        </span>
        <span className="flex items-baseline gap-2">
          <span className="text-lg font-semibold text-ink tabular-nums">{r.tampil}</span>
          <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${st.chip}`}>{st.label}</span>
        </span>
      </div>
      <div className="text-xs text-slate-500 mt-0.5">{r.rujukan}</div>
      <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed">{r.arti}</p>
      {r.langkah && r.band !== 'baik' && r.band !== 'takTersedia' && (
        <p className="text-sm text-emerald-200/80 mt-1.5 leading-relaxed">
          <span className="text-emerald-500/80">Yang bisa dilakukan: </span>{r.langkah}
        </p>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-center">
      <div className="text-base font-semibold text-ink tabular-nums">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}

export default GaitAnalysis
