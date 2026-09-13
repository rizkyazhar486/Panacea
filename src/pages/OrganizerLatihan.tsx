import { useMemo, useState } from 'react'
import { Card, SectionTitle } from '../components/ui'
import { IconActivity } from '../components/icons'
import { getWorkouts } from '../lib/workoutStore'
import { useVitals } from '../lib/useVitals'
import {
  susunPekan, periksaAturan, kadensLariPekanan, BATAS_ORGANIZER,
  type HariRencana, type JenisHari, type PilihanOrganizer,
} from '../lib/organizerLatihan'

// Organizer pekanan. Halaman Training hanya bisa bercerita tentang lari,
// padahal push/pull/kaki/perut dilakukan orang yang sama dan tidak punya
// tempat di kalender mana pun. Di sini keduanya berada di satu pekan.

const WARNA: Record<JenisHari, string> = {
  push: 'text-sky-600 dark:text-sky-300 border-sky-500/25 bg-sky-500/[.07]',
  pull: 'text-violet-600 dark:text-violet-300 border-violet-500/25 bg-violet-500/[.07]',
  kaki: 'text-amber-600 dark:text-amber-300 border-amber-500/25 bg-amber-500/[.07]',
  perut: 'text-rose-600 dark:text-rose-300 border-rose-500/25 bg-rose-500/[.07]',
  lari: 'text-emerald-600 dark:text-emerald-300 border-emerald-500/25 bg-emerald-500/[.07]',
  pemulihan: 'text-neutral-500 dark:text-neutral-400 border-neutral-400/20 bg-neutral-400/[.06]',
}

function KartuHari({ hari }: { hari: HariRencana }) {
  const [buka, setBuka] = useState(false)
  const kosong = hari.jenis === 'pemulihan'
  return (
    <div className={`rounded-2xl border p-3.5 ${WARNA[hari.jenis]}`}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[.14em] opacity-80">{hari.hari}</div>
          <div className="truncate text-[15px] font-black text-ink dark:text-white">{hari.judul}</div>
        </div>
        {!kosong && (
          <div className="shrink-0 text-right">
            <div className="text-sm font-black tabular-nums text-ink dark:text-white">≈{hari.menit}′</div>
            <div className="text-[10px] font-semibold opacity-70">estimated</div>
          </div>
        )}
      </div>

      {!kosong && (
        <>
          <button
            type="button"
            onClick={() => setBuka((v) => !v)}
            aria-expanded={buka}
            className="mt-2.5 flex min-h-11 w-full items-center justify-between rounded-xl border border-current/15 bg-white/55 px-3 text-left text-xs font-bold text-ink dark:bg-white/[.06] dark:text-white"
          >
            <span>{hari.gerakan.length} {hari.gerakan.length === 1 ? 'movement' : 'movements'}</span>
            <span aria-hidden className="text-[11px] opacity-70">{buka ? 'Hide' : 'Show'}</span>
          </button>
          {buka && (
            <ul className="mt-2 space-y-1.5">
              {hari.gerakan.map((g) => (
                <li key={g.nama} className="flex items-baseline justify-between gap-3 rounded-xl bg-white/55 px-3 py-2 dark:bg-white/[.055]">
                  <span className="min-w-0 text-xs font-semibold text-ink dark:text-neutral-100">{g.nama}</span>
                  <span className="shrink-0 text-[11px] font-black tabular-nums text-neutral-600 dark:text-neutral-300">
                    {g.set > 1 ? `${g.set} × ${g.ulangan}` : g.ulangan}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <p className="mt-2 text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-400">{hari.catatan}</p>
    </div>
  )
}

export function OrganizerLatihan() {
  const vitals = useVitals()
  const workouts = useMemo(() => getWorkouts(), [vitals])
  const tercatat = useMemo(() => kadensLariPekanan(workouts), [workouts])

  const [pilihan, setPilihan] = useState<PilihanOrganizer>(() => ({
    hariLatihan: 4,
    fokus: 'seimbang',
    sesiLari: 2,
  }))

  const pekan = useMemo(() => susunPekan(pilihan, tercatat), [pilihan, tercatat])
  const langgar = useMemo(() => periksaAturan(pekan), [pekan])
  const jumlah = useMemo(() => {
    const n = (j: JenisHari) => pekan.filter((h) => h.jenis === j).length
    return { kekuatan: n('push') + n('pull') + n('kaki') + n('perut'), lari: n('lari'), libur: n('pemulihan') }
  }, [pekan])

  return (
    <div className="space-y-4">
      <SectionTitle
        icon={<IconActivity />}
        title="Weekly organizer"
        subtitle="Push · pull · legs · abs, scheduled around the runs you already do"
      />

      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-black text-ink dark:text-white">Shape the week</h3>
          <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
            {jumlah.kekuatan} strength · {jumlah.lari} run · {jumlah.libur} off
          </span>
        </div>

        <label className="mt-4 block">
          <span className="flex items-baseline justify-between text-xs font-bold text-neutral-600 dark:text-neutral-300">
            Strength days <span className="tabular-nums">{pilihan.hariLatihan}</span>
          </span>
          <input
            type="range" min={BATAS_ORGANIZER.HARI_MIN} max={BATAS_ORGANIZER.HARI_MAKS} step={1}
            value={pilihan.hariLatihan}
            onChange={(e) => setPilihan((p) => ({ ...p, hariLatihan: Number(e.target.value) }))}
            className="mt-1.5 h-11 w-full accent-brand"
            aria-label="Strength days per week"
          />
        </label>

        <label className="mt-1 block">
          <span className="flex items-baseline justify-between text-xs font-bold text-neutral-600 dark:text-neutral-300">
            Runs kept <span className="tabular-nums">{pilihan.sesiLari}</span>
          </span>
          <input
            type="range" min={0} max={BATAS_ORGANIZER.LARI_MAKS} step={1}
            value={pilihan.sesiLari}
            onChange={(e) => setPilihan((p) => ({ ...p, sesiLari: Number(e.target.value) }))}
            className="mt-1.5 h-11 w-full accent-brand"
            aria-label="Runs kept per week"
          />
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          {(['seimbang', 'kekuatan', 'lari'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setPilihan((p) => ({ ...p, fokus: f }))}
              aria-pressed={pilihan.fokus === f}
              className={`min-h-11 rounded-full border px-4 text-xs font-black ${
                pilihan.fokus === f
                  ? 'border-brand bg-brand text-white'
                  : 'border-neutral-300/70 text-neutral-600 dark:border-white/15 dark:text-neutral-300'
              }`}
            >
              {f === 'seimbang' ? 'Balanced' : f === 'kekuatan' ? 'Strength lean' : 'Running lean'}
            </button>
          ))}
        </div>

        <p className="mt-3 text-[11.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          {tercatat === null
            ? 'No running sessions are stored yet, so the run count is the one you set here and nothing else.'
            : `Your stored sessions average ${tercatat} runs per week. That figure is read from what was recorded; every other number on this page is a template.`}
        </p>
      </Card>

      <Card>
        <h3 className="text-sm font-black text-ink dark:text-white">The week</h3>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {pekan.map((h) => <KartuHari key={h.indeks} hari={h} />)}
        </div>

        <div className="mt-4 rounded-2xl border border-neutral-200/70 bg-neutral-50/70 p-3.5 dark:border-white/10 dark:bg-white/[.03]">
          <div className="text-[10px] font-black uppercase tracking-[.14em] text-neutral-500 dark:text-neutral-400">
            Rules this layout keeps
          </div>
          <ul className="mt-1.5 space-y-1 text-[11.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            <li>· Leg day never lands the day before the harder run.</li>
            <li>· The same movement pattern is not trained on consecutive days.</li>
            <li>· At least one full rest day survives every setting.</li>
          </ul>
          <p className="mt-2 text-[11.5px] font-bold text-emerald-600 dark:text-emerald-300">
            {langgar.length === 0
              ? 'Checked against this week: no rule broken.'
              : `Checked against this week: ${langgar.join('; ')}`}
          </p>
        </div>

        <p className="mt-3 text-[11.5px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          This organizer is a set of written scheduling rules, not a trained model and not a
          personalised prescription. Sets and repetition ranges are ordinary strength-training
          ranges, the same for everyone who opens this page; no load in kilograms is suggested,
          because load cannot be inferred from heart-rate history. Session length is an estimate
          from sets and rest, not a target. Nothing here assesses readiness, recovery or injury
          risk, and nothing here is rehabilitation or medical advice — if something hurts, or you
          have a condition that affects exercise, that is a question for a clinician, not for a
          schedule.
        </p>
      </Card>
    </div>
  )
}

export default OrganizerLatihan
